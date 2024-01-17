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
	"os"
	"strconv"
	"strings"
	"time"

	"emperror.dev/errors"
	"github.com/dchest/validator"
	"github.com/spf13/cobra"
	"github.com/spiffe/go-spiffe/v2/spiffeid"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/structpb"
	"sigs.k8s.io/yaml"

	"github.com/cisco-open/nasp/api/v1/core"
	"github.com/cisco-open/nasp/internal/cli"
	"github.com/cisco-open/nasp/pkg/config/metadata/collectors"
	"github.com/cisco-open/nasp/pkg/tls"
	"github.com/gezacorp/metadatax"
)

var defaultLabels = []string{
	"process:uid",
	"process:gid",
	"process:binary:path",
	"process:name",
	"k8s:pod:name",
	"k8s:pod:namespace",
	"k8s:pod:serviceaccount",
	"k8s:container:name",
	"k8s:container:image",
	"docker:name",
	"docker:image:name",
}

type generatePolicyCommand struct {
	cli  cli.CLI
	opts *generatePolicyOptions
}

type generatePolicyOptions struct {
	labels           []string
	additionalLabels []string
	dnsNames         []string
	ttl              time.Duration
	allowedSPIFFEIDs []string
	disableMTLS      bool
}

func NewGeneratePolicyCommand(c cli.CLI) *cobra.Command {
	command := &generatePolicyCommand{
		cli:  c,
		opts: &generatePolicyOptions{},
	}

	cmd := &cobra.Command{
		Use:               "generate-policy <pid> <workload ID>",
		Aliases:           []string{"gp"},
		Short:             "Generate policy for a given process",
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		Args:              cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			for _, hostname := range command.opts.dnsNames {
				if !validator.IsValidDomain(hostname) {
					return errors.Errorf("invalid dns name: %s", hostname)
				}
			}

			for _, spiffeID := range command.opts.allowedSPIFFEIDs {
				if _, err := spiffeid.FromString(spiffeID); err != nil {
					return errors.WrapIf(err, "could not parse spiffe id")
				}
			}

			return command.run(cmd, args)
		},
	}

	cmd.Flags().StringSliceVar(&command.opts.labels, "label", defaultLabels, "Labels to use as selector")
	cmd.Flags().StringSliceVar(&command.opts.additionalLabels, "add-label", []string{}, "Additional labels to use as selector")
	cmd.Flags().StringSliceVar(&command.opts.dnsNames, "cert-dns-name", []string{}, "Set DNS name used within the issued X509 certificate")
	cmd.Flags().DurationVar(&command.opts.ttl, "cert-ttl", tls.DefaultLeafCerticiateTTL, "TTL of the issued X509 certificate")
	cmd.Flags().StringSliceVar(&command.opts.allowedSPIFFEIDs, "allowed-spiffe-id", []string{}, "Allowed SPIFFE ID")
	cmd.Flags().BoolVar(&command.opts.disableMTLS, "disable-mtls", false, "Disable mTLS")

	return cmd
}

func (c *generatePolicyCommand) run(cmd *cobra.Command, args []string) error {
	collector := collectors.GetMetadataCollector(c.cli.Configuration().Agent.MetadataCollectors, c.cli.Logger())

	pid, err := strconv.Atoi(args[0])
	if err != nil {
		return err
	}

	md, err := collector.GetMetadata(metadatax.ContextWithPID(cmd.Context(), int32(pid)))
	if err != nil {
		for _, e := range errors.GetErrors(err) {
			c.cli.Logger().V(1).Info("error during metadata collection", "error", e)
		}
	}

	policy := &core.Policy{
		Selectors: []*structpb.Struct{
			{
				Fields: make(map[string]*structpb.Value),
			},
		},
		Certificate: &core.Policy_Certificate{
			WorkloadID: args[1],
			DnsNames:   c.opts.dnsNames,
			Ttl:        durationpb.New(c.opts.ttl),
		},
		Connection: &core.Policy_Connection{
			Mtls:             core.Policy_Connection_STRICT,
			AllowedSPIFFEIDs: c.opts.allowedSPIFFEIDs,
		},
	}

	if c.opts.disableMTLS {
		policy.Connection.Mtls = core.Policy_Connection_DISABLE
	}

	for _, label := range md.GetLabelsSlice() {
		if !c.matchLabel(label.Name) {
			continue
		}

		policy.Selectors[0].Fields[label.Name] = structpb.NewStringValue(label.Value)
	}

	if len(policy.Selectors[0].Fields) == 0 {
		return errors.New("could not find selectors")
	}

	jsonBytes, err := protojson.Marshal(policy)
	if err != nil {
		return errors.WrapIf(err, "could not marshal json")
	}

	yamlBytes, err := yaml.JSONToYAML([]byte("[" + string(jsonBytes) + "]"))
	if err != nil {
		return errors.WrapIf(err, "could not marshal yaml")
	}

	os.Stdout.Write(yamlBytes)

	return err
}

func (c *generatePolicyCommand) matchLabel(label string) bool {
	for _, l := range append(c.opts.labels, c.opts.additionalLabels...) {
		if strings.HasSuffix(l, "*") && strings.HasPrefix(label, l[:len(l)-1]) {
			return true
		}
		if l == label {
			return true
		}
	}

	return false
}
