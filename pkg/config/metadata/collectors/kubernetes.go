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

package collectors

import (
	"os"
	"regexp"
	"strconv"
	"strings"

	"emperror.dev/errors"

	nasptls "github.com/cisco-open/nasp/pkg/tls"
	"github.com/cisco-open/nasp/pkg/util"
	"github.com/gezacorp/metadatax"
	"github.com/gezacorp/metadatax/collectors/kubernetes"
	"github.com/gezacorp/metadatax/collectors/kubernetes/kubelet"
)

const (
	defaultKubeletHost = "127.0.0.1"
	defaultKubeletPort = 10250

	metadataPrefix = "k8s"
)

type KubernetesCollectorConfig struct {
	BaseConfig `json:",inline" mapstructure:",squash"`

	KubeletHost             string `json:"kubeletHost,omitempty"`
	KubeletPort             int    `json:"kubeletPort,omitempty"`
	KubeletCA               string `json:"kubeletCA,omitempty"`
	SkipKubeletVerification *bool  `json:"skipKubeletVerification,omitempty"`
	Credentials             string `json:"credentials,omitempty"`
}

func (c *KubernetesCollectorConfig) Validate() error {
	if !c.IsEnabled() {
		return nil
	}

	if c.KubeletHost == "" {
		c.KubeletHost = defaultKubeletHost
	}
	if c.KubeletPort == 0 {
		c.KubeletPort = defaultKubeletPort
	}

	if c.SkipKubeletVerification == nil {
		c.SkipKubeletVerification = util.BoolPointer(false)
	}

	if _, err := c.GetCredentials(); err != nil {
		return err
	}

	return nil
}

func (c KubernetesCollectorConfig) Instantiate() (metadatax.Collector, error) {
	if !util.PointerToBool(c.Enabled) {
		return nil, errors.WithStack(DisabledCollectorError)
	}

	kubeletClientOpts := []kubelet.ClientOption{
		kubelet.WithAddress(c.KubeletHost + ":" + strconv.Itoa(c.KubeletPort)),
	}

	if util.PointerToBool(c.SkipKubeletVerification) {
		kubeletClientOpts = append(kubeletClientOpts, kubelet.WithSkipCertVerify())
	}

	if caPEM, err := c.getContent(c.KubeletCA); err != nil {
		return nil, err
	} else {
		kubeletClientOpts = append(kubeletClientOpts, kubelet.WithCAPEMs([]byte(caPEM)))
	}

	if creds, err := c.GetCredentials(); err != nil {
		return nil, err
	} else {
		switch creds.CredentialType {
		case X509CredentialType:
			kubeletClientOpts = append(kubeletClientOpts, kubelet.WithClientCertPEM(append(creds.CertPEM, creds.KeyPEM...)))
		case JWTCredentialType:
			kubeletClientOpts = append(kubeletClientOpts, kubelet.WithAccessToken(creds.Token))
		}
	}

	kubeletClient, err := kubelet.NewClient(kubeletClientOpts...)
	if err != nil {
		return nil, err
	}

	opts := []kubernetes.CollectorOption{
		kubernetes.WithKubeletClient(kubeletClient),
		kubernetes.CollectorWithMetadataContainerInitFunc(func() metadatax.MetadataContainer {
			return metadatax.New(
				metadatax.WithUniqueKeys(true),
				metadatax.WithPrefix(metadataPrefix),
			)
		}),
	}

	return kubernetes.New(opts...), nil
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
	CertPEM []byte
	KeyPEM  []byte
}

func (c KubernetesCollectorConfig) GetCredentials() (cred Credentials, err error) {
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

	cred.CredentialType = X509CredentialType

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

	return
}

func (c KubernetesCollectorConfig) getContent(raw string) (string, error) {
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
