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
	"encoding/json"

	"emperror.dev/errors"

	"github.com/cisco-open/nasp/pkg/agent/messenger"
	"github.com/cisco-open/nasp/pkg/tls"
)

type csrSignCommand struct {
	signerCA *tls.SignerCA
}

func CSRSign() (CommandHandler, error) {
	signerCA, err := tls.NewSignerCA("")
	if err != nil {
		return nil, err
	}

	return &csrSignCommand{
		signerCA: signerCA,
	}, nil
}

func (c *csrSignCommand) HandleCommand(cmd messenger.Command) (string, error) {
	var data struct {
		CSR string `json:"csr"`
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

	certificate, err := c.signerCA.SignCertificateRequest(containers[0].GetX509CertificateRequest().CertificateRequest)
	if err != nil {
		return "error", err
	}

	caCertificate := c.signerCA.GetCaCertificate()

	var response struct {
		Certificate  *tls.X509Certificate   `json:"certificate"`
		TrustAnchors []*tls.X509Certificate `json:"trust_anchors"`
	}

	response.Certificate = certificate
	response.TrustAnchors = append(response.TrustAnchors, caCertificate)

	j, err := json.Marshal(response)
	if err != nil {
		return "error", err
	}

	return string(j), nil
}
