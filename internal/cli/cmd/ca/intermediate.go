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

package ca

import (
	"crypto/x509/pkix"
	"fmt"
	"net/url"
	"time"

	"emperror.dev/errors"
	"github.com/spf13/cobra"

	"github.com/cisco-open/camblet/internal/cli"
	"github.com/cisco-open/camblet/pkg/tls"
)

type createIntermediateCACommand struct {
	cli  cli.CLI
	opts *createIntermediateCAOptions
}

type createIntermediateCAOptions struct {
	ttl       time.Duration
	keySize   uint16
	caPEMFile string
}

func NewCreateIntermediateCACommand(c cli.CLI) *cobra.Command {
	command := &createIntermediateCACommand{
		cli:  c,
		opts: &createIntermediateCAOptions{},
	}

	cmd := &cobra.Command{
		Use:               "create-intermediate <common name> <identifier>",
		Aliases:           []string{"cim"},
		Short:             "Generate intermediate CA certificate",
		SilenceErrors:     true,
		SilenceUsage:      true,
		DisableAutoGenTag: true,
		Args:              cobra.ExactArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			return command.run(cmd, args)
		},
	}

	cmd.Flags().DurationVar(&command.opts.ttl, "ttl", tls.DefaultCACertificateTTL, "TTL of the intermediate certificate")
	cmd.Flags().Uint16Var(&command.opts.keySize, "key-size", uint16(tls.DefaultCertificateKeySize), "Key size of the intermediate certificate")
	cmd.Flags().StringVar(&command.opts.caPEMFile, "ca-pem-file", "", "Path for CA PEM")

	return cmd
}

func (c *createIntermediateCACommand) run(cmd *cobra.Command, args []string) error {
	ca, err := tls.NewCertificateAuthority(
		tls.CertificateAuthorityWithPEMFile(c.opts.caPEMFile),
	)
	if err != nil {
		return errors.WrapIf(err, "could not instantiate certificate authority")
	}

	cert, pkey, chain, err := ca.CreateIntermediate(tls.CertificateOptions{
		Subject: pkix.Name{
			CommonName: args[0],
		},
		TTL:     c.opts.ttl,
		KeySize: int(c.opts.keySize),
		URIs: []*url.URL{
			{
				Scheme: "spiffe",
				Host:   c.cli.Configuration().Agent.TrustDomain,
				Path:   args[1],
			},
		},
	})
	if err != nil {
		return errors.WrapIf(err, "could not create intermediate CA certificate")
	}

	// dump generated cert and private key
	fmt.Printf("%s%s", cert.GetPEM(), pkey.GetPEM())

	// dump intermediate certs
	for _, cert := range chain {
		fmt.Printf("%s", cert.GetPEM())
	}

	// dump trust anchor
	fmt.Printf("%s", ca.GetTrustAnchor().GetPEM())

	return nil
}
