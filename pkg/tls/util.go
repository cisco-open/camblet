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
	"crypto/x509"
	"crypto/x509/pkix"
	"math/big"
	"net"
	"net/url"
	"time"

	"emperror.dev/errors"
)

type CertificateOptions struct {
	Subject        pkix.Name
	TTL            time.Duration
	KeySize        int
	DNSNames       []string
	EmailAddresses []string
	IPAddresses    []net.IP
	URIs           []*url.URL
}

func CreateSelfSignedCACertificate(opts CertificateOptions) (*X509Certificate, *PrivateKey, error) {
	return CreateCACertificate(opts, nil, nil)
}

func CreateCACertificate(opts CertificateOptions, parent *x509.Certificate, priv any) (*X509Certificate, *PrivateKey, error) {
	serial, err := rand.Int(rand.Reader, (&big.Int{}).Exp(big.NewInt(2), big.NewInt(162), nil))
	if err != nil {
		return nil, nil, err
	}

	ca := &x509.Certificate{
		SerialNumber:          serial,
		Subject:               opts.Subject,
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(opts.TTL),
		IsCA:                  true,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
		DNSNames:              opts.DNSNames,
		EmailAddresses:        opts.EmailAddresses,
		IPAddresses:           opts.IPAddresses,
		URIs:                  opts.URIs,
	}

	caPrivKey, err := rsa.GenerateKey(rand.Reader, opts.KeySize)
	if err != nil {
		return nil, nil, errors.WrapIf(err, "could not generate RSA key for the CA")
	}

	if parent == nil {
		parent = ca
	}

	if priv == nil {
		priv = caPrivKey
	}

	caBytes, err := x509.CreateCertificate(rand.Reader, ca, parent, &caPrivKey.PublicKey, priv)
	if err != nil {
		return nil, nil, errors.WrapIf(err, "could not create CA certificate")
	}

	x509CAPrivKey, err := ParseX509PrivateKey(x509.MarshalPKCS1PrivateKey(caPrivKey))
	if err != nil {
		return nil, nil, err
	}

	certificate, err := ParseX509CertificateFromDER(caBytes)
	if err != nil {
		return nil, nil, errors.WrapIf(err, "could not parse CA certificate")
	}

	return certificate, x509CAPrivKey, nil
}
