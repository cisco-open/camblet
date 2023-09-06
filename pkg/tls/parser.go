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
	"crypto"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"math/big"
	"net"
	"net/url"
	"os"
	"time"

	"emperror.dev/errors"
)

type SupportedPEMType string

const (
	CertificateRequestSupportedPEMType SupportedPEMType = "CERTIFICATE REQUEST"
	CertificateSupportedPEMType        SupportedPEMType = "CERTIFICATE"
	PublicKeySupportedPEMType          SupportedPEMType = "PUBLIC KEY"
	PrivateKeySupportedPEMType         SupportedPEMType = "PRIVATE KEY"
	ECPrivateKeySupportedPEMType       SupportedPEMType = "EC PRIVATE KEY"
)

type X509Certificate struct {
	*CertificateCommon `json:",inline"`
	IsCA               bool `json:"isCA,omitempty"`

	Certificate *x509.Certificate `json:"-"`
}

type X509CertificateRequest struct {
	*CertificateCommon `json:",inline"`

	CertificateRequest *x509.CertificateRequest `json:"-"`
}

type CertificateCommon struct {
	PublicKey *PublicKey `json:"publicKey,omitempty"`

	SerialNumber  string     `json:"serialNumber,omitempty"`
	NotBefore     *time.Time `json:"notBefore,omitempty"`
	NotAfter      *time.Time `json:"notAfter,omitempty"`
	NotBeforeUnix uint64     `json:"notBeforeUnix,omitempty"`
	NotAfterUnix  uint64     `json:"notAfterUnix,omitempty"`

	Subject string `json:"subject,omitempty"`
	Issuer  string `json:"issuer,omitempty"`

	DNSNames       []string `json:"dnsNames,omitempty"`
	EmailAddresses []string `json:"emailAddresses,omitempty"`
	IPAddresses    []string `json:"ipAddresses,omitempty"`
	URIs           []string `json:"urIs,omitempty"`

	Signature          []byte `json:"signature,omitempty"`
	SignatureAlgorithm string `json:"signatureAlgorithm,omitempty"`

	Raw        []byte `json:"raw,omitempty"`
	RawSubject []byte `json:"rawSubject,omitempty"`
	RawIssuer  []byte `json:"rawIssuer,omitempty"`
}

func (c *CertificateCommon) copyIPsAndURIs(ipAddresses []net.IP, uris []*url.URL) {
	if l := len(ipAddresses); l > 0 {
		c.IPAddresses = make([]string, l)
		for k, v := range ipAddresses {
			c.IPAddresses[k] = v.String()
		}
	}
	if l := len(uris); l > 0 {
		c.URIs = make([]string, l)
		for k, v := range uris {
			c.URIs[k] = v.String()
		}
	}
}

type PublicKey struct {
	Type    string `json:"type,omitempty"`
	BitSize int32  `json:"bitSize,omitempty"`

	RSA_N []byte `json:"RSA_N,omitempty"`
	RSA_E []byte `json:"RSA_E,omitempty"`

	Curve string `json:"curve,omitempty"`
	EC_Q  []byte `json:"EC_Q,omitempty"`

	Raw []byte `json:"raw,omitempty"`
	Key any    `json:"-"`
}

type PrivateKey struct {
	Type string `json:"type,omitempty"`
	Size int    `json:"size,omitempty"`

	RSA_P  []byte `json:"RSA_P,omitempty"`
	RSA_Q  []byte `json:"RSA_Q,omitempty"`
	RSA_DP []byte `json:"RSA_DP,omitempty"`
	RSA_DQ []byte `json:"RSA_DQ,omitempty"`
	RSA_IQ []byte `json:"RSA_IQ,omitempty"`

	Curve string `json:"curve,omitempty"`
	EC_D  []byte `json:"EC_D,omitempty"`

	PublicKey *PublicKey `json:"publicKey,omitempty"`

	Raw []byte `json:"raw,omitempty"`
	Key any    `json:"-"`
}

type ContainerType string

const (
	X509CertificateContainerType        ContainerType = "X509Certificate"
	X509CertificateRequestContainerType ContainerType = "X509CertificateRequest"
	PublicKeyContainerType              ContainerType = "PublicKey"
	PrivateKeyContainerType             ContainerType = "PrivateKey"
)

type Container struct {
	Type   ContainerType `json:"type,omitempty"`
	Object any           `json:"object,omitempty"`
}

func (c *Container) GetX509Certificate() *X509Certificate {
	if o, ok := c.Object.(*X509Certificate); ok {
		return o
	}

	return &X509Certificate{}
}

func (c *Container) GetX509CertificateRequest() *X509CertificateRequest {
	if o, ok := c.Object.(*X509CertificateRequest); ok {
		return o
	}

	return &X509CertificateRequest{}
}

func (c *Container) GetPublicKey() *PublicKey {
	if o, ok := c.Object.(*PublicKey); ok {
		return o
	}

	return &PublicKey{}
}

func (c *Container) GetPrivateKey() *PrivateKey {
	if o, ok := c.Object.(*PrivateKey); ok {
		return o
	}

	return &PrivateKey{}
}

func ParsePEMFromFile(pemFileName ...string) ([]*Container, error) {
	var content []byte

	for _, file := range pemFileName {
		fileContent, err := os.ReadFile(file)
		if err != nil {
			return nil, err
		}

		content = append(content, fileContent...)
	}

	return ParsePEMs(content)
}

func ParsePEMs(content []byte) ([]*Container, error) {
	containers := []*Container{}

	var block *pem.Block
	var rest []byte
	var multierr error
	for {
		block, rest = pem.Decode(content)
		if block == nil {
			break
		}

		content = rest

		container, err := ParsePEM(block)
		if err != nil {
			multierr = errors.Append(multierr, err)
			continue
		}

		containers = append(containers, container)

		if len(rest) == 0 {
			break
		}
	}

	return containers, multierr
}

func ParsePEM(block *pem.Block) (*Container, error) {
	switch SupportedPEMType(block.Type) {
	case CertificateRequestSupportedPEMType:
		obj, err := ParseX509CertificateRequestFromDER(block.Bytes)

		return &Container{
			Type:   X509CertificateRequestContainerType,
			Object: obj,
		}, err
	case CertificateSupportedPEMType:
		obj, err := ParseX509CertificateFromDER(block.Bytes)

		return &Container{
			Type:   X509CertificateContainerType,
			Object: obj,
		}, err
	case PublicKeySupportedPEMType:
		obj, err := ParseX509PublicKey(block.Bytes)

		return &Container{
			Type:   PublicKeyContainerType,
			Object: obj,
		}, err
	case PrivateKeySupportedPEMType, ECPrivateKeySupportedPEMType:
		obj, err := ParseX509PrivateKey(block.Bytes)

		return &Container{
			Type:   PrivateKeyContainerType,
			Object: obj,
		}, err
	default:
		return nil, errors.New("unsupported PEM type")
	}
}

func ParseX509CertificateFromDER(der []byte) (*X509Certificate, error) {
	x509cert, err := x509.ParseCertificate(der)
	if err != nil {
		return nil, err
	}

	return ConvertX509Certificate(x509cert)
}

func ConvertX509Certificate(x509cert *x509.Certificate) (*X509Certificate, error) {
	cert := &X509Certificate{
		Certificate: x509cert,
		IsCA:        x509cert.IsCA,
		CertificateCommon: &CertificateCommon{
			SerialNumber:  hex.EncodeToString(x509cert.SerialNumber.Bytes()),
			NotBefore:     &x509cert.NotBefore,
			NotAfter:      &x509cert.NotAfter,
			NotBeforeUnix: uint64(x509cert.NotBefore.Unix()),
			NotAfterUnix:  uint64(x509cert.NotAfter.Unix()),

			Subject: x509cert.Subject.String(),
			Issuer:  x509cert.Issuer.String(),

			DNSNames:       x509cert.DNSNames,
			EmailAddresses: x509cert.EmailAddresses,

			Signature:          x509cert.Signature,
			SignatureAlgorithm: x509cert.SignatureAlgorithm.String(),

			Raw:        x509cert.Raw,
			RawSubject: x509cert.RawSubject,
			RawIssuer:  x509cert.RawIssuer,
		},
	}

	cert.CertificateCommon.copyIPsAndURIs(x509cert.IPAddresses, x509cert.URIs)

	var err error
	cert.PublicKey, err = parseX509PublicKey(x509cert.PublicKey)
	if err != nil {
		return nil, err
	}
	cert.PublicKey.Raw = x509cert.RawSubjectPublicKeyInfo

	return cert, nil
}

func ParseX509CertificateRequestFromDER(der []byte) (*X509CertificateRequest, error) {
	x509req, err := x509.ParseCertificateRequest(der)
	if err != nil {
		return nil, err
	}

	return ConvertX509CertificateRequest(x509req)
}

func ConvertX509CertificateRequest(x509req *x509.CertificateRequest) (*X509CertificateRequest, error) {
	req := &X509CertificateRequest{
		CertificateRequest: x509req,
		CertificateCommon: &CertificateCommon{
			Subject:        x509req.Subject.String(),
			DNSNames:       x509req.DNSNames,
			EmailAddresses: x509req.EmailAddresses,

			Signature:          x509req.Signature,
			SignatureAlgorithm: x509req.SignatureAlgorithm.String(),

			RawSubject: x509req.RawSubject,
			Raw:        x509req.Raw,
		},
	}

	req.CertificateCommon.copyIPsAndURIs(x509req.IPAddresses, x509req.URIs)

	var err error
	req.PublicKey, err = parseX509PublicKey(x509req.PublicKey)
	if err != nil {
		return nil, err
	}
	req.PublicKey.Raw = x509req.RawSubjectPublicKeyInfo

	return req, nil
}

func ParseX509PublicKey(der []byte) (*PublicKey, error) {
	x509key, err := parsePublicKey(der)
	if err != nil {
		return nil, err
	}

	pk, err := parseX509PublicKey(x509key)
	if err != nil {
		return nil, err
	}

	pk.Raw = der

	return pk, nil
}

func parseX509PublicKey(pk any) (*PublicKey, error) {
	switch key := pk.(type) {
	case *rsa.PublicKey:
		return convertRSAPublicKey(*key), nil

	case *ecdsa.PublicKey:
		return convertECDSPublicKey(*key), nil
	}

	return nil, errors.New("unsupported public key")
}

func parsePublicKey(der []byte) (crypto.PublicKey, error) {
	if key, err := x509.ParsePKCS1PublicKey(der); err == nil {
		return key, nil
	}

	if key, err := x509.ParsePKIXPublicKey(der); err == nil {
		return key, nil
	}

	return nil, errors.New("tls: failed to parse public key")
}

func convertRSAPublicKey(key rsa.PublicKey) *PublicKey {
	return &PublicKey{
		Type:    "RSA",
		BitSize: int32(key.Size() * 8),

		RSA_N: key.N.Bytes(),
		RSA_E: big.NewInt(0).SetInt64(int64(key.E)).Bytes(),

		Key: key,
	}
}

func convertECDSPublicKey(key ecdsa.PublicKey) *PublicKey {
	return &PublicKey{
		Type:    "ECDSA",
		BitSize: int32(key.Params().BitSize),

		Curve: key.Params().Name,
		EC_Q:  append([]byte{0x04}, append(key.X.Bytes(), key.Y.Bytes()...)...),

		Key: key,
	}
}

func ParseX509PrivateKey(der []byte) (*PrivateKey, error) {
	x509key, err := parsePrivateKey(der)
	if err != nil {
		return nil, err
	}

	pk, err := parseX509PrivateKey(x509key)
	if err != nil {
		return nil, err
	}

	return pk, nil
}

func parseX509PrivateKey(pk any) (*PrivateKey, error) {
	switch key := pk.(type) {
	case *rsa.PrivateKey:
		return convertRSAPrivateKey(*key), nil
	case *ecdsa.PrivateKey:
		return convertECDSPrivateKey(*key), nil
	}

	return nil, errors.New("unsupported private key")
}

func parsePrivateKey(der []byte) (crypto.PrivateKey, error) {
	if key, err := x509.ParsePKCS1PrivateKey(der); err == nil {
		return key, nil
	}

	if key, err := x509.ParsePKCS8PrivateKey(der); err == nil {
		switch key := key.(type) {
		case *rsa.PrivateKey, *ecdsa.PrivateKey, ed25519.PrivateKey:
			return key, nil
		default:
			return nil, errors.New("found unknown private key type in PKCS#8 wrapping")
		}
	}

	if key, err := x509.ParseECPrivateKey(der); err == nil {
		return key, nil
	}

	return nil, errors.New("unsupported private key")
}

func convertRSAPrivateKey(key rsa.PrivateKey) *PrivateKey {
	return &PrivateKey{
		Type:   "RSA",
		Size:   key.Size() * 8,
		RSA_P:  key.Primes[0].Bytes(),
		RSA_Q:  key.Primes[1].Bytes(),
		RSA_DP: key.Precomputed.Dp.Bytes(),
		RSA_DQ: key.Precomputed.Dq.Bytes(),
		RSA_IQ: key.Precomputed.Qinv.Bytes(),

		PublicKey: convertRSAPublicKey(key.PublicKey),

		Key: key,
	}
}

func convertECDSPrivateKey(key ecdsa.PrivateKey) *PrivateKey {
	return &PrivateKey{
		Type:  "ECDSA",
		Curve: key.Params().Name,
		EC_D:  key.D.Bytes(),

		PublicKey: convertECDSPublicKey(key.PublicKey),

		Key: key,
	}
}
