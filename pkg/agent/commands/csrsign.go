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

package commands

import (
	"crypto/x509"
	"encoding/json"
	"time"

	"emperror.dev/errors"

	"github.com/cisco-open/nasp/pkg/agent/messenger"
	"github.com/cisco-open/nasp/pkg/tls"
)

type csrSignCommand struct {
	certSigner     X509CertificateRequestSigner
	defaultCertTTL time.Duration
}

type X509CertificateRequestSigner interface {
	SignCertificateRequest(req *x509.CertificateRequest, ttl time.Duration) (*tls.X509Certificate, []*tls.X509Certificate, error)
	GetTrustAnchor() *tls.X509Certificate
}

func CSRSign(certSigner X509CertificateRequestSigner, defaultCertTTL time.Duration) (CommandHandler, error) {
	return &csrSignCommand{
		certSigner:     certSigner,
		defaultCertTTL: defaultCertTTL,
	}, nil
}

func (c *csrSignCommand) HandleCommand(cmd messenger.Command) (string, error) {
	var data struct {
		CSR string `json:"csr"`
		TTL string `json:"ttl"`
	}

	if err := json.Unmarshal([]byte(cmd.Data), &data); err != nil {
		return "error", err
	}

	containers, err := tls.ParsePEMs([]byte(data.CSR))
	if err != nil {
		return "error", err
	}

	if len(containers) != 1 {
		return "error", errors.New("invalid csr")
	}

	ttl := c.defaultCertTTL
	if data.TTL != "" {
		if d, err := time.ParseDuration(data.TTL); err != nil {
			return "error", errors.WrapIf(err, "could not parse ttl value")
		} else {
			ttl = d
		}
	}

	certificate, chain, err := c.certSigner.SignCertificateRequest(containers[0].GetX509CertificateRequest().CertificateRequest, ttl)
	if err != nil {
		return "error", err
	}

	var response struct {
		Certificate  *tls.X509Certificate   `json:"certificate"`
		Chain        []*tls.X509Certificate `json:"chain"`
		TrustAnchors []*tls.X509Certificate `json:"trust_anchors"`
	}

	response.Certificate = certificate
	response.Chain = chain
	response.TrustAnchors = []*tls.X509Certificate{c.certSigner.GetTrustAnchor()}

	j, err := json.MarshalIndent(response, "", "  ")
	if err != nil {
		return "error", err
	}

	return string(j), nil
}
