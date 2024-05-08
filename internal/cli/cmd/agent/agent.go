/*
 * The MIT License (MIT)
 * Copyright (c) 2023 Cisco and/or its affiliates. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package agent

import (
	"context"
	"crypto/x509/pkix"
	"encoding/json"
	"os"
	"path"

	"emperror.dev/errors"
	"github.com/bufbuild/protovalidate-go"
	"github.com/spf13/cobra"

	"github.com/cisco-open/camblet/api/v1/core"
	"github.com/cisco-open/camblet/internal/cli"
	"github.com/cisco-open/camblet/internal/policy"
	"github.com/cisco-open/camblet/internal/service"
	"github.com/cisco-open/camblet/pkg/agent/commands"
	"github.com/cisco-open/camblet/pkg/agent/messenger"
	"github.com/cisco-open/camblet/pkg/agent/server"
	"github.com/cisco-open/camblet/pkg/config"
	"github.com/cisco-open/camblet/pkg/config/metadata/collectors"
	"github.com/cisco-open/camblet/pkg/tls"
)

const (
	defaultRootCACommonName = "Camblet root CA"
)

type agentCommand struct {
	cli cli.CLI
}

func NewCommand(c cli.CLI) *cobra.Command {
	command := &agentCommand{
		cli: c,
	}

	cmd := &cobra.Command{
		Use:               "agent",
		Short:             "Camblet agent",
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		RunE: func(cmd *cobra.Command, params []string) error {
			return command.run(cmd)
		},
	}

	cmd.Flags().String("kernel-module-device", "/dev/camblet", "Device for the Camblet kernel module")
	cmd.Flags().StringSlice("policies-path", []string{c.BuildInfo().ConfigDir + "/policies"}, "Path to file or directory for policy definitions")
	cmd.Flags().StringSlice("services-path", []string{c.BuildInfo().ConfigDir + "/services"}, "Path to file or directory for service definitions")
	cmd.Flags().String("trust-domain", config.DefaultTrustDomain, "Trust domain")
	cmd.Flags().String("local-address", config.DefaultLocalAddress, "Local address for the gRPC api")
	cmd.Flags().Duration("default-cert-ttl", config.DefaultCertTTLDuration, "Default certificate TTL")
	cmd.Flags().String("ca-pem-path", c.BuildInfo().ConfigDir+"/ca.pem", "Path for CA pem")

	cli.BindCMDFlags(c.Viper(), cmd)

	cmd.AddCommand(NewAugmentCommand(c))
	cmd.AddCommand(NewGeneratePolicyCommand(c))
	cmd.AddCommand(NewTraceCommand(c))

	return cmd
}

func (c *agentCommand) runCommander(ctx context.Context) error {
	h, err := commands.NewHandler(c.cli.EventBus(), c.cli.Logger())
	if err != nil {
		return err
	}

	h.AddHandler("accept", commands.Accept())
	h.AddHandler("connect", commands.Connect())
	h.AddHandler("log", commands.Log(c.cli.EventBus(), c.cli.Logger()))

	caOpts := []tls.CertificateAuthorityOption{}
	caPEMPath, err := c.ensureCACertificate()
	if err != nil {
		return errors.WithStackIf(err)
	}

	caOpts = append(caOpts, tls.CertificateAuthorityWithPEMFile(caPEMPath))
	ca, err := tls.NewCertificateAuthority(caOpts...)
	if err != nil {
		return err
	}

	publicCAPemPath := path.Dir(caPEMPath) + "/public_ca.crt"

	if err := os.WriteFile(publicCAPemPath, ca.GetTrustAnchor().GetPEM(), 0644); err != nil {
		return errors.WrapIf(err, "could not write CA certificate to file")
	}

	csrSign, err := commands.CSRSign(ca, c.cli.Configuration().Agent.DefaultCertTTLDuration)
	if err != nil {
		return err
	}
	c.cli.Logger().Info("CA signer initialized", "caPEMPath", caPEMPath)

	h.AddHandler("csr_sign", csrSign)

	collector := collectors.GetMetadataCollector(c.cli.Configuration().Agent.MetadataCollectors, c.cli.Logger())
	h.AddHandler("augment", commands.Augment(ctx, collector, c.cli.Logger()))

	if err := h.Run(ctx); err != nil {
		return err
	}

	return nil
}

func (c *agentCommand) ensureCACertificate() (string, error) {
	path := c.cli.Configuration().Agent.CAPemPath

	if _, err := os.Stat(path); path != "" && err == nil {
		return path, nil
	}

	cert, pkey, err := tls.CreateSelfSignedCACertificate(tls.CertificateOptions{
		Subject: pkix.Name{
			CommonName: defaultRootCACommonName,
		},
	})
	if err != nil {
		return "", errors.WrapIf(err, "could not generate self signed root CA certificate")
	}

	if file, err := os.Create(path); err != nil {
		return "", errors.WrapIf(err, "could not write generated self signed root CA certificate")
	} else {
		defer file.Close()
		if _, err := file.Write(append(cert.GetPEM(), pkey.GetPEM()...)); err != nil {
			return "", errors.WrapIf(err, "could not write generated self signed root CA certificate")
		}
		c.cli.Logger().Info("self signed root CA certificate is created and saved", "path", path)
	}

	return path, nil
}

func (c *agentCommand) run(cmd *cobra.Command) error {
	logger := c.cli.Logger()
	eventBus := c.cli.EventBus()

	if err := c.runCommander(cmd.Context()); err != nil {
		return err
	}

	errChan := make(chan error)

	proto_validator, err := protovalidate.New()
	if err != nil {
		return err
	}

	// kernel config
	eventBus.Subscribe(messenger.MessengerStartedTopic, func(topic string, _ bool) {
		logger.Info("sending config to kernel")
		if cj, err := json.Marshal(config.KernelModuleConfig{TrustDomain: c.cli.Configuration().Agent.TrustDomain}); err != nil {
			c.cli.Logger().Error(err, "could not marshal module config")
		} else {
			eventBus.Publish(messenger.MessageOutgoingTopic, messenger.NewCommand(messenger.Command{
				Command: "load_config",
				Code:    cj,
			}))
		}
	})

	eventBus.Subscribe(messenger.TraceRequest, func(topic string, msg messenger.TraceRequestMessage) {
		if cj, err := json.Marshal(msg); err != nil {
			c.cli.Logger().Error(err, "could not marshal pid command")
		} else {
			eventBus.Publish(messenger.MessageOutgoingTopic, messenger.NewCommand(messenger.Command{
				Command: "manage_trace_requests",
				Data:    string(cj),
			}))
		}
	})

	// Static service definitions loader
	eventBus.Subscribe(messenger.MessengerStartedTopic, func(topic string, _ bool) {
		go func() {
			l := service.NewFileLoader(
				c.cli.Configuration().Agent.ServicesPath,
				service.FileLoadWithLogger(logger),
				service.FileLoaderWithProtoValidatorFunc(func(svc *core.Service) error {
					return proto_validator.Validate(svc)
				}),
			)
			if err := l.Run(cmd.Context(), func(entries service.Services) {
				logger.Info("services count", "count", len(entries))
				if j, err := json.MarshalIndent(entries, "", "  "); err != nil {
					c.cli.Logger().Error(err, "could not marshal module config")
				} else {
					eventBus.Publish(messenger.MessageOutgoingTopic, messenger.NewCommand(messenger.Command{
						Command: "load_sd_info",
						Code:    j,
					}))
				}
			}); err != nil {
				errChan <- err
			}
		}()
	})

	// Static policy definitions loader
	eventBus.Subscribe(messenger.MessengerStartedTopic, func(topic string, _ bool) {
		go func() {
			r := policy.NewFileLoader(
				c.cli.Configuration().Agent.PoliciesPath,
				logger,
				policy.FileLoaderWithTemplateFunc(policy.NewPolicyTemplater(policy.PolicyTemplateValues{
					TrustDomain: c.cli.Configuration().Agent.TrustDomain,
				}, c.cli.Logger()).Execute,
				),
				policy.FileLoaderWithProtoValidatorFunc(func(p *policy.RawPolicy) error {
					return proto_validator.Validate(p)
				}),
			)
			if err := r.Run(cmd.Context(), func(r policy.Policies) {
				logger.Info("policy count", "count", len(r))

				r.Organize()

				type Policies struct {
					Policies policy.Policies `json:"policies"`
				}

				y, _ := json.MarshalIndent(Policies{
					Policies: r,
				}, "", "  ")

				msg := messenger.NewCommand(messenger.Command{
					Command: "load_policies",
					Code:    y,
				})

				logger.Info("sending policies to kernel")
				eventBus.Publish(messenger.MessageOutgoingTopic, msg)
			}); err != nil {
				errChan <- err
			}
		}()
	})

	go func() {
		errChan <- messenger.New(eventBus, logger).Run(cmd.Context(), c.cli.Configuration().Agent.KernelModuleDevice)
	}()

	go func() {
		errChan <- server.New(c.cli.Configuration().Agent, c.cli.EventBus(), c.cli.Logger()).ListenAndServe(cmd.Context())
	}()

	select {
	case err := <-errChan:
		logger.Error(err, "agent stopped prematurely")
		return err
	case <-cmd.Context().Done():
		logger.Info("stopping agent")
		<-errChan
		logger.Info("agent have stopped")

		return nil
	}
}
