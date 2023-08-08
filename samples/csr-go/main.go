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

package main

import (
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"encoding/pem"
	"unsafe"
)

//export _debug
func _debug(m string) int32

//export gen_csr
func gen_csr(privPtr *uint32, privLen int) uint32 {

	unsafePtr := unsafe.Pointer(privPtr)

	priv := *(*[]byte)(unsafe.Pointer(&struct {
		addr uintptr
		len  int
		cap  int
	}{uintptr(unsafePtr), privLen, privLen}))

	block, _ := pem.Decode(priv)

	rsaPriv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		_debug("failed to parse priv key" + err.Error())
	}

	var csrTemplate = x509.CertificateRequest{
		Subject:            pkix.Name{},
		SignatureAlgorithm: x509.SHA256WithRSA,
		ExtraExtensions: []pkix.Extension{
			{
				Id:       asn1.ObjectIdentifier{2, 5, 29, 19},
				Critical: true,
			},
		},
	}
	csrCertificate, err := x509.CreateCertificateRequest(rand.Reader, &csrTemplate, rsaPriv)
	if err != nil {
		_debug("failed to create certificate signing request" + err.Error())
	}
	csr := pem.EncodeToMemory(&pem.Block{
		Type: "CERTIFICATE REQUEST", Bytes: csrCertificate,
	})

	csrPtr := uint16(uintptr(unsafe.Pointer(&csr[0])))
	csrLen := uint16(len(csr))

	return (uint32(csrPtr) << uint32(16)) | uint32(csrLen)
}

func main() {}
