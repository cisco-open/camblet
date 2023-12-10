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

package tls

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"math/big"
	"time"

	"emperror.dev/errors"
)

var (
	DefaultCACertificateTTL   = 3650 * 24 * time.Hour
	DefaultCertificateKeySize = 2048
	DefaultLeafCerticiateTTL  = 24 * time.Hour

	ErrMissingSigningCertificate = errors.Sentinel("signing certificate is not specfied")
	ErrMissingCAPrivateKey       = errors.Sentinel("missing CA private key")
	ErrMissingCACertificate      = errors.Sentinel("missing CA certificate")
)

type CertificateAuthority interface {
	SignCertificateRequest(req *x509.CertificateRequest, ttl time.Duration) (cert *X509Certificate, chain []*X509Certificate, err error)
	CreateIntermediate(opts CertificateOptions) (cert *X509Certificate, pkey *PrivateKey, chain []*X509Certificate, err error)
	GetTrustAnchor() (cert *X509Certificate)
}

type CertificateAuthorityOption func(*ca)

func CertificateAuthorityWithPEMFile(pemFile string) CertificateAuthorityOption {
	return func(ca *ca) {
		ca.pemFile = pemFile
	}
}

func CertificateAuthorityWithPEM(pem []byte) CertificateAuthorityOption {
	return func(ca *ca) {
		ca.pem = pem
	}
}

type ca struct {
	pem     []byte
	pemFile string

	privateKey   *PrivateKey
	certificate  *X509Certificate
	certificates []*X509Certificate
}

func NewCertificateAuthority(opts ...CertificateAuthorityOption) (CertificateAuthority, error) {
	ca := &ca{
		certificates: []*X509Certificate{},
	}

	for _, f := range opts {
		f(ca)
	}

	if ca.pem == nil && ca.pemFile == "" {
		return nil, errors.WithStack(ErrMissingSigningCertificate)
	}

	if err := ca.init(); err != nil {
		return nil, err
	}

	return ca, nil
}

func (c *ca) SignCertificateRequest(req *x509.CertificateRequest, ttl time.Duration) (*X509Certificate, []*X509Certificate, error) {
	serial, err := rand.Int(rand.Reader, (&big.Int{}).Exp(big.NewInt(2), big.NewInt(159), nil))
	if err != nil {
		return nil, nil, err
	}

	pkey := c.privateKey.Key.(rsa.PrivateKey)

	if ttl == 0 {
		ttl = DefaultLeafCerticiateTTL
	}

	certByte, err := x509.CreateCertificate(rand.Reader, &x509.Certificate{
		SerialNumber:    serial,
		Subject:         req.Subject,
		NotBefore:       time.Now(),
		NotAfter:        time.Now().Add(ttl),
		ExtKeyUsage:     []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:        x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		IsCA:            false,
		DNSNames:        req.DNSNames,
		IPAddresses:     req.IPAddresses,
		EmailAddresses:  req.EmailAddresses,
		URIs:            req.URIs,
		ExtraExtensions: req.ExtraExtensions,
	}, c.certificate.Certificate, req.PublicKey, &pkey)
	if err != nil {
		return nil, nil, err
	}

	cert, err := ParseX509CertificateFromDER(certByte)

	return cert, c.GetIntermediates(), err
}

func (c *ca) CreateIntermediate(opts CertificateOptions) (*X509Certificate, *PrivateKey, []*X509Certificate, error) {
	pkey := c.privateKey.Key.(rsa.PrivateKey)

	certificate, privatekey, err := CreateCACertificate(opts, c.certificate.Certificate, &pkey)

	return certificate, privatekey, c.GetIntermediates(), err
}

func (c *ca) GetIntermediates() []*X509Certificate {
	ims := []*X509Certificate{}

	for _, cert := range c.certificates {
		if cert.Type == IntermediateCAX509CertificateType {
			ims = append(ims, cert)
		}
	}

	return ims
}

func (c *ca) GetTrustAnchor() *X509Certificate {
	for _, cert := range c.certificates {
		if cert.Type == RootCAX509CertificateType {
			return cert
		}
	}

	return nil
}

func (c *ca) init() error {
	var containers []*Container
	var err error

	if c.pemFile != "" {
		containers, err = ParsePEMFromFile(c.pemFile)
	} else {
		containers, err = ParsePEMs(c.pem)
	}
	if err != nil {
		return errors.WrapIf(err, "could not start cert signer")
	}

	for _, v := range containers {
		switch v.Type {
		case PrivateKeyContainerType:
			if c.privateKey == nil {
				c.privateKey = v.GetPrivateKey()
			}
		case X509CertificateContainerType:
			c.certificates = append(c.certificates, v.GetX509Certificate())
		}
	}

	for _, cert := range c.certificates {
		if cert.Certificate.IsCA {
			c.certificate = cert
			break
		}
	}

	if c.privateKey == nil {
		return errors.WithStack(ErrMissingCAPrivateKey)
	}

	if c.certificate == nil {
		return errors.WithStack(ErrMissingCACertificate)
	}

	if _, err := tls.X509KeyPair(c.certificate.GetPEM(), c.privateKey.GetPEM()); err != nil {
		return errors.WrapIf(err, "invalid signing CA certificate")
	}

	ta := c.GetTrustAnchor()
	if ta == nil {
		return errors.Sentinel("missing trust anchor")
	}

	rootCertPool := x509.NewCertPool()
	rootCertPool.AddCert(ta.Certificate)

	intermediatesPool := x509.NewCertPool()
	for _, im := range c.GetIntermediates() {
		intermediatesPool.AddCert(im.Certificate)
	}

	if _, err := c.certificate.Certificate.Verify(x509.VerifyOptions{
		Roots:         rootCertPool,
		Intermediates: intermediatesPool,
	}); err != nil {
		return err
	}

	return nil
}
