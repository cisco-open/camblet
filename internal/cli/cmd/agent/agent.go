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
	"encoding/json"

	"github.com/spf13/cobra"

	"github.com/cisco-open/nasp/internal/cli"
	"github.com/cisco-open/nasp/internal/cli/cmd/agent/augment"
	"github.com/cisco-open/nasp/pkg/agent/commands"
	"github.com/cisco-open/nasp/pkg/agent/messenger"
	"github.com/cisco-open/nasp/pkg/config"
	"github.com/cisco-open/nasp/pkg/config/metadata/collectors"
	"github.com/cisco-open/nasp/pkg/rules"
	"github.com/cisco-open/nasp/pkg/sd"
	"github.com/cisco-open/nasp/pkg/tls"
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
		Short:             "Nasp agent",
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		RunE: func(cmd *cobra.Command, params []string) error {
			return command.run(cmd)
		},
	}

	cmd.Flags().String("kernel-module-device", "/dev/nasp", "Device for the Nasp kernel module")
	cmd.Flags().StringSlice("rules-path", nil, "Rules path")
	cmd.Flags().StringSlice("sd-path", nil, "Service discovery definition path")
	cmd.Flags().String("trust-domain", config.DefaultTrustDomain, "Trust domain")
	cmd.Flags().Duration("default-cert-ttl", config.DefaultCertTTLDuration, "Default certificate TTL")
	cmd.Flags().String("ca-pem-path", "", "Path for CA pem")

	cli.BindCMDFlags(c.Viper(), cmd)

	cmd.AddCommand(augment.NewAugmentCommand(c))

	return cmd
}

func (c *agentCommand) runCommander(ctx context.Context) error {
	h, err := commands.NewHandler(c.cli.EventBus(), c.cli.Logger())
	if err != nil {
		return err
	}

	h.AddHandler("accept", commands.Accept())
	h.AddHandler("connect", commands.Connect())

	caSigner, err := tls.NewSignerCA(c.cli.Configuration().Agent.CAPemPath)
	if err != nil {
		return err
	}

	csrSign, err := commands.CSRSign(caSigner, c.cli.Configuration().Agent.DefaultCertTTLDuration)
	if err != nil {
		return err
	}
	h.AddHandler("csr_sign", csrSign)

	collector := collectors.GetMetadataCollector(c.cli.Configuration().Agent.MetadataCollectors, c.cli.Logger())
	h.AddHandler("attest", commands.Augment(ctx, collector, c.cli.Logger()))

	if err := h.Run(ctx); err != nil {
		return err
	}

	return nil
}

func (c *agentCommand) run(cmd *cobra.Command) error {
	logger := c.cli.Logger()
	eventBus := c.cli.EventBus()

	if err := c.runCommander(cmd.Context()); err != nil {
		return err
	}

	errChan := make(chan error)

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

	// service discovery loader
	eventBus.Subscribe(messenger.MessengerStartedTopic, func(topic string, _ bool) {
		go func() {
			l := sd.NewFilesLoader(c.cli.Viper().GetStringSlice("agent.sdPath"), logger)
			if err := l.Run(cmd.Context(), func(entries sd.Entries) {
				if j, err := json.Marshal(entries); err != nil {
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

	// rules loader
	eventBus.Subscribe(messenger.MessengerStartedTopic, func(topic string, _ bool) {
		go func() {
			r := rules.NewRuleFilesLoader(
				c.cli.Viper().GetStringSlice("agent.rulesPath"),
				logger,
				rules.RuleFilesLoaderWithTemplater(rules.NewRuleTemplater(rules.RuleTemplateValues{
					TrustDomain: c.cli.Configuration().Agent.TrustDomain,
				}, c.cli.Logger()).Execute,
				))
			if err := r.Run(cmd.Context(), func(r rules.Rules) {
				logger.Info("rule count", "count", len(r))

				if err := r.Organize(); err != nil {
					logger.Error(err, "problem with the rules")

					return
				}

				type Policies struct {
					Policies rules.Rules `json:"policies"`
				}

				y, _ := json.MarshalIndent(Policies{
					Policies: r,
				}, "", "  ")

				msg := messenger.NewCommand(messenger.Command{
					Command: "load_rules",
					Code:    y,
				})

				logger.Info("sending rules to kernel")
				eventBus.Publish(messenger.MessageOutgoingTopic, msg)
			}); err != nil {
				errChan <- err
			}
		}()
	})

	go func() {
		errChan <- messenger.New(eventBus, logger).Run(cmd.Context(), c.cli.Configuration().Agent.KernelModuleDevice)
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
