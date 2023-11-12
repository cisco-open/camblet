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
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"time"

	"emperror.dev/errors"
)

const (
	defaultCertTTLDuration = time.Hour * 24
)

type SignerCA struct {
	PrivateKey  *PrivateKey
	Certificate *X509Certificate
}

func NewSignerCA(caPEMFileName string) (*SignerCA, error) {
	signer := &SignerCA{}

	var containers []*Container
	var err error

	if caPEMFileName == "" {
		if caCertPEM, createErr := signer.createCACertPEM(); createErr != nil {
			return nil, errors.WrapIf(err, "could not create self signed CA PEM")
		} else { //nolint:revive
			containers, err = ParsePEMs(caCertPEM)
		}
	} else {
		containers, err = ParsePEMFromFile(caPEMFileName)
	}
	if err != nil {
		return nil, err
	}

	if len(containers) != 2 {
		return nil, errors.New("invalid PEM content")
	}

	for _, v := range containers {
		switch v.Type {
		case PrivateKeyContainerType:
			signer.PrivateKey = v.GetPrivateKey()
		case X509CertificateContainerType:
			signer.Certificate = v.GetX509Certificate()
		}
	}

	if signer.PrivateKey == nil {
		return nil, errors.New("missing CA private key")
	}

	if signer.Certificate == nil {
		return nil, errors.New("missing CA certificate")
	}

	return signer, nil
}

func (s *SignerCA) createCACertPEM() (caPEM []byte, err error) {
	serial, err := rand.Int(rand.Reader, (&big.Int{}).Exp(big.NewInt(2), big.NewInt(159), nil))
	if err != nil {
		return nil, err
	}

	ca := &x509.Certificate{
		SerialNumber:          serial,
		Subject:               pkix.Name{},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(10, 0, 0),
		IsCA:                  true,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
	}

	caPrivKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, errors.WrapIf(err, "could not generate RSA key for the CA")
	}

	caPrivKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  string(RSAPrivateKeySupportedPEMType),
		Bytes: x509.MarshalPKCS1PrivateKey(caPrivKey),
	})

	caBytes, err := x509.CreateCertificate(rand.Reader, ca, ca, &caPrivKey.PublicKey, caPrivKey)
	if err != nil {
		return nil, errors.WrapIf(err, "could not create CA certificate")
	}

	caCertPEM := pem.EncodeToMemory(&pem.Block{
		Type:  string(CertificateSupportedPEMType),
		Bytes: caBytes,
	})

	return bytes.Join([][]byte{caCertPEM, caPrivKeyPEM}, nil), nil
}

func (s *SignerCA) GetCaCertificate() *X509Certificate {
	return s.Certificate
}

func (s *SignerCA) SignCertificateRequest(req *x509.CertificateRequest, ttl time.Duration) (*X509Certificate, error) {
	serial, err := rand.Int(rand.Reader, (&big.Int{}).Exp(big.NewInt(2), big.NewInt(159), nil))
	if err != nil {
		return nil, err
	}

	pkey := s.PrivateKey.Key.(rsa.PrivateKey)

	if ttl == 0 {
		ttl = defaultCertTTLDuration
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
	}, s.Certificate.Certificate, req.PublicKey, &pkey)
	if err != nil {
		return nil, err
	}

	return ParseX509CertificateFromDER(certByte)
}
