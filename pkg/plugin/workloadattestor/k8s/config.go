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

package k8s

import (
	"crypto/tls"
	"crypto/x509"
	"os"
	"regexp"
	"strings"

	"emperror.dev/errors"

	nasptls "github.com/cisco-open/nasp/pkg/tls"
	"github.com/cisco-open/nasp/pkg/util"
)

type Config struct {
	KubeletHost             string `json:"kubeletHost,omitempty"`
	KubeletPort             int    `json:"kubeletPort,omitempty"`
	KubeletCA               string `json:"kubeletCA,omitempty"`
	SkipKubeletVerification *bool  `json:"skipKubeletVerification,omitempty"`
	Credentials             string `json:"credentials,omitempty"`
}

func (c Config) Validate() (Config, error) {
	if c.KubeletHost == "" {
		c.KubeletHost = "127.0.0.1"
	}
	if c.KubeletPort == 0 {
		c.KubeletPort = 10250
	}

	if c.SkipKubeletVerification == nil {
		c.SkipKubeletVerification = util.BoolPointer(false)
	}

	if _, err := c.GetCredentials(); err != nil {
		return c, err
	}

	if _, err := c.GetX509CertPool(); err != nil {
		return c, err
	}

	return c, nil
}

type CredentialType string

const (
	JWTCredentialType  CredentialType = "JWT"
	X509CredentialType CredentialType = "X509"
)

var jwtRegex = regexp.MustCompile(`^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)`)

type Credentials struct {
	CredentialType CredentialType

	// jwt
	Token string

	// x509
	Certificate tls.Certificate
	CertPEM     []byte
	KeyPEM      []byte
}

func (c Config) GetX509CertPool() (*x509.CertPool, error) {
	caPEM, err := c.getContent(c.KubeletCA)
	if err != nil {
		return nil, err
	}

	items, err := nasptls.ParsePEMs([]byte(caPEM))
	if err != nil {
		return nil, err
	}

	certPool := x509.NewCertPool()

	for _, item := range items {
		if item.Type == nasptls.X509CertificateContainerType {
			certPool.AddCert(item.GetX509Certificate().Certificate)
		}
	}

	return certPool, nil
}

func (c Config) getContent(raw string) (string, error) {
	if raw == "" {
		return "", nil
	}

	if !os.IsPathSeparator(raw[0]) {
		return raw, nil
	}

	paths := strings.Split(raw, ",")

	var contents []byte
	for _, path := range paths {
		c, err := os.ReadFile(strings.TrimSpace(path))
		if err != nil {
			return "", err
		}

		contents = append(contents, c...)
	}

	return strings.Trim(string(contents), "\n"), nil
}

func (c Config) GetCredentials() (cred Credentials, err error) {
	content, err := c.getContent(c.Credentials)
	if err != nil {
		return cred, err
	}

	if content == "" {
		return
	}

	if jwtRegex.MatchString(content) {
		cred.CredentialType = JWTCredentialType
		cred.Token = content

		return
	}

	items, err := nasptls.ParsePEMs([]byte(content))
	if err != nil {
		return cred, err
	}

	for _, item := range items {
		switch item.Type {
		case nasptls.PrivateKeyContainerType:
			if len(cred.KeyPEM) == 0 {
				cred.KeyPEM = item.GetPrivateKey().GetPEM()
			}
		case nasptls.X509CertificateContainerType:
			if len(cred.CertPEM) == 0 {
				cred.CertPEM = item.GetX509Certificate().GetPEM()
			}
		}
	}

	if len(cred.CertPEM) == 0 || len(cred.KeyPEM) == 0 {
		return
	}

	if cert, err := tls.X509KeyPair(cred.CertPEM, cred.KeyPEM); err != nil {
		return cred, errors.WrapIf(err, "could not build x509 cert")
	} else {
		cred.CredentialType = X509CredentialType
		cred.Certificate = cert
	}

	return
}
