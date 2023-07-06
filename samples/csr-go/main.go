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
	// key := []byte{45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 82, 83, 65, 32, 80, 82, 73, 86, 65, 84, 69, 32, 75, 69, 89, 45, 45, 45, 45, 45, 10, 77, 73, 73, 69, 112, 65, 73, 66, 65, 65, 75, 67, 65, 81, 69, 65, 53, 74, 65, 48, 107, 119, 105, 116, 117, 100, 69, 105, 70, 69, 113, 67, 50, 99, 53, 114, 48, 83, 114, 83, 86, 113, 115, 106, 106, 114, 114, 115, 97, 82, 73, 98, 111, 47, 97, 113, 107, 99, 70, 108, 73, 78, 113, 69, 10, 50, 104, 107, 56, 66, 50, 98, 74, 77, 78, 108, 113, 81, 89, 54, 70, 77, 43, 72, 65, 121, 99, 80, 80, 111, 105, 101, 74, 119, 108, 90, 100, 72, 65, 77, 68, 119, 108, 67, 101, 117, 98, 48, 66, 55, 69, 55, 104, 48, 108, 108, 71, 67, 81, 55, 52, 75, 43, 99, 104, 106, 113, 89, 120, 10, 65, 56, 84, 82, 48, 52, 80, 90, 87, 98, 51, 85, 51, 118, 56, 51, 78, 106, 54, 69, 73, 78, 72, 57, 113, 109, 114, 118, 43, 88, 71, 53, 43, 54, 53, 86, 113, 88, 107, 118, 81, 98, 79, 122, 99, 54, 101, 65, 89, 117, 43, 79, 112, 72, 67, 79, 51, 85, 49, 77, 83, 56, 70, 56, 10, 86, 119, 56, 106, 50, 70, 65, 76, 48, 51, 49, 51, 57, 79, 82, 78, 55, 75, 120, 76, 82, 49, 57, 98, 57, 108, 122, 108, 47, 99, 110, 55, 86, 51, 55, 115, 53, 51, 116, 111, 71, 78, 115, 76, 103, 113, 104, 97, 55, 118, 68, 103, 105, 55, 55, 108, 43, 110, 104, 78, 106, 85, 77, 97, 10, 109, 71, 83, 76, 75, 122, 98, 65, 52, 47, 88, 52, 97, 90, 72, 119, 80, 54, 112, 81, 101, 76, 83, 85, 49, 110, 76, 87, 43, 88, 112, 73, 76, 103, 75, 101, 105, 101, 78, 111, 120, 43, 115, 48, 77, 110, 107, 97, 55, 103, 76, 121, 68, 120, 67, 55, 89, 53, 87, 81, 68, 122, 78, 79, 10, 65, 114, 43, 55, 106, 107, 51, 89, 66, 66, 105, 108, 105, 102, 54, 51, 86, 108, 79, 108, 97, 121, 112, 106, 73, 73, 48, 52, 79, 67, 50, 77, 121, 97, 97, 119, 48, 119, 73, 68, 65, 81, 65, 66, 65, 111, 73, 66, 65, 72, 98, 71, 102, 90, 117, 47, 69, 100, 67, 84, 88, 110, 116, 101, 10, 56, 84, 114, 81, 113, 51, 84, 75, 74, 80, 53, 71, 57, 122, 90, 118, 54, 118, 84, 55, 74, 81, 81, 67, 53, 107, 98, 83, 85, 111, 82, 78, 75, 109, 98, 81, 89, 69, 75, 85, 90, 111, 56, 78, 72, 77, 117, 117, 106, 89, 103, 86, 108, 65, 77, 70, 122, 55, 117, 55, 103, 106, 112, 77, 10, 101, 82, 120, 97, 99, 76, 83, 108, 65, 113, 99, 82, 69, 112, 80, 68, 116, 108, 83, 67, 99, 103, 79, 53, 70, 76, 120, 122, 52, 120, 116, 110, 80, 43, 100, 117, 101, 51, 47, 73, 98, 56, 88, 85, 65, 88, 66, 85, 47, 108, 77, 104, 68, 55, 97, 105, 105, 89, 106, 114, 65, 52, 81, 69, 10, 86, 112, 114, 48, 48, 75, 48, 43, 80, 90, 71, 79, 71, 102, 53, 76, 71, 69, 118, 82, 111, 55, 88, 79, 106, 70, 57, 120, 108, 89, 67, 49, 118, 98, 70, 117, 72, 106, 104, 79, 50, 55, 68, 54, 70, 57, 65, 118, 118, 89, 111, 81, 56, 122, 74, 109, 83, 97, 51, 111, 118, 112, 67, 100, 10, 115, 97, 48, 118, 78, 122, 122, 104, 69, 77, 80, 109, 87, 111, 89, 114, 76, 79, 82, 109, 79, 114, 82, 83, 50, 47, 78, 72, 102, 120, 72, 73, 120, 76, 56, 88, 69, 68, 112, 78, 99, 98, 85, 84, 117, 66, 67, 65, 114, 50, 90, 115, 88, 55, 89, 74, 99, 105, 110, 67, 113, 98, 88, 54, 10, 66, 52, 106, 51, 54, 49, 79, 55, 73, 75, 106, 76, 85, 66, 50, 75, 107, 104, 88, 70, 120, 43, 101, 67, 66, 52, 74, 105, 66, 52, 117, 114, 111, 103, 108, 71, 115, 69, 81, 90, 56, 48, 88, 43, 70, 76, 71, 90, 47, 66, 89, 84, 47, 103, 110, 72, 43, 66, 57, 111, 71, 77, 75, 118, 10, 100, 67, 53, 99, 75, 119, 107, 67, 103, 89, 69, 65, 56, 111, 76, 104, 76, 82, 118, 65, 89, 53, 105, 52, 79, 71, 110, 108, 111, 83, 113, 115, 49, 116, 68, 101, 53, 104, 122, 67, 43, 82, 49, 119, 121, 57, 88, 80, 66, 49, 77, 102, 106, 48, 48, 85, 82, 67, 78, 122, 74, 82, 72, 47, 10, 112, 108, 78, 99, 49, 113, 105, 69, 57, 85, 84, 118, 49, 89, 121, 99, 122, 48, 47, 43, 114, 110, 99, 52, 71, 65, 122, 120, 101, 74, 54, 49, 113, 43, 56, 53, 74, 115, 51, 69, 114, 86, 85, 65, 115, 43, 121, 88, 79, 72, 79, 102, 76, 66, 73, 113, 74, 87, 110, 109, 100, 98, 50, 57, 10, 77, 106, 55, 70, 100, 70, 116, 86, 78, 104, 55, 89, 53, 119, 109, 72, 71, 82, 49, 90, 90, 98, 70, 102, 48, 57, 85, 99, 55, 111, 85, 86, 112, 108, 82, 107, 80, 53, 122, 114, 70, 107, 71, 47, 115, 119, 65, 111, 121, 72, 66, 105, 52, 110, 48, 67, 103, 89, 69, 65, 56, 85, 97, 52, 10, 104, 119, 114, 117, 84, 69, 76, 70, 112, 43, 81, 120, 112, 70, 49, 122, 112, 52, 105, 74, 98, 82, 118, 116, 83, 102, 107, 70, 47, 73, 116, 48, 114, 52, 119, 103, 102, 101, 114, 77, 53, 57, 121, 113, 121, 103, 65, 68, 114, 71, 106, 55, 85, 90, 51, 75, 69, 77, 90, 89, 82, 112, 57, 99, 10, 87, 79, 79, 111, 116, 116, 104, 47, 116, 85, 76, 106, 87, 48, 81, 43, 90, 107, 103, 112, 65, 47, 72, 43, 67, 114, 120, 67, 79, 75, 74, 66, 90, 77, 65, 119, 73, 112, 113, 115, 90, 105, 73, 83, 101, 108, 85, 78, 107, 119, 107, 82, 76, 75, 71, 81, 109, 50, 77, 114, 73, 76, 106, 98, 10, 97, 67, 108, 83, 51, 115, 120, 101, 88, 66, 109, 43, 52, 69, 43, 52, 87, 106, 76, 66, 109, 77, 48, 111, 81, 120, 68, 74, 116, 122, 77, 104, 106, 114, 65, 70, 99, 89, 56, 67, 103, 89, 65, 116, 99, 98, 115, 121, 107, 99, 87, 43, 112, 67, 113, 53, 88, 53, 98, 74, 87, 99, 55, 106, 10, 118, 109, 90, 87, 112, 115, 77, 101, 110, 90, 97, 54, 105, 56, 108, 115, 55, 80, 87, 52, 67, 57, 67, 108, 97, 67, 77, 50, 113, 105, 88, 72, 68, 69, 52, 85, 90, 54, 88, 113, 116, 69, 49, 104, 76, 105, 86, 103, 98, 47, 81, 103, 121, 51, 82, 50, 104, 85, 53, 109, 116, 81, 56, 69, 10, 78, 105, 76, 50, 107, 52, 54, 115, 107, 73, 89, 43, 77, 84, 75, 120, 81, 72, 70, 117, 100, 56, 84, 119, 70, 43, 85, 52, 52, 83, 74, 111, 72, 80, 48, 120, 98, 99, 65, 78, 69, 85, 68, 67, 73, 114, 88, 118, 84, 101, 71, 110, 118, 100, 74, 103, 82, 115, 112, 83, 74, 66, 120, 72, 10, 101, 47, 56, 66, 77, 75, 50, 90, 69, 82, 56, 85, 77, 119, 53, 120, 97, 83, 89, 79, 110, 81, 75, 66, 103, 81, 67, 115, 115, 49, 66, 86, 54, 83, 56, 86, 67, 120, 53, 114, 120, 70, 122, 56, 74, 54, 65, 110, 74, 81, 89, 112, 81, 84, 111, 105, 72, 115, 116, 52, 76, 50, 73, 65, 10, 88, 97, 55, 77, 77, 111, 115, 107, 48, 56, 67, 48, 65, 106, 113, 101, 54, 67, 52, 115, 66, 50, 79, 104, 105, 106, 101, 90, 112, 87, 118, 50, 102, 69, 53, 66, 81, 115, 112, 50, 116, 107, 65, 68, 68, 101, 65, 85, 87, 107, 90, 120, 101, 110, 43, 54, 115, 51, 73, 55, 69, 51, 106, 51, 10, 89, 116, 71, 82, 107, 50, 69, 102, 89, 102, 103, 84, 57, 70, 108, 90, 67, 55, 53, 116, 85, 101, 65, 117, 79, 86, 101, 102, 102, 110, 73, 101, 74, 113, 89, 89, 114, 47, 82, 67, 118, 72, 76, 121, 73, 70, 51, 50, 119, 105, 110, 115, 56, 55, 121, 68, 57, 76, 112, 79, 70, 90, 49, 74, 10, 103, 120, 107, 67, 90, 81, 75, 66, 103, 81, 67, 43, 86, 120, 67, 55, 66, 69, 68, 112, 110, 83, 119, 82, 89, 103, 117, 49, 86, 102, 73, 106, 48, 111, 85, 83, 66, 102, 116, 101, 76, 120, 83, 52, 106, 101, 111, 50, 103, 50, 83, 99, 86, 116, 110, 120, 119, 66, 55, 79, 88, 76, 103, 103, 10, 47, 73, 82, 52, 50, 83, 104, 43, 72, 77, 120, 114, 110, 117, 50, 43, 48, 108, 115, 122, 109, 73, 89, 66, 112, 48, 53, 117, 97, 110, 82, 79, 89, 118, 78, 56, 74, 71, 111, 84, 114, 106, 69, 55, 102, 57, 75, 114, 117, 66, 67, 117, 77, 73, 113, 100, 114, 51, 99, 83, 51, 87, 107, 101, 10, 55, 80, 68, 81, 71, 110, 65, 43, 120, 71, 71, 110, 97, 86, 81, 76, 76, 66, 90, 90, 83, 112, 119, 109, 71, 51, 66, 121, 83, 119, 111, 54, 105, 111, 53, 74, 70, 75, 56, 47, 114, 99, 71, 119, 49, 69, 87, 115, 82, 71, 119, 68, 84, 119, 61, 61, 10, 45, 45, 45, 45, 45, 69, 78, 68, 32, 82, 83, 65, 32, 80, 82, 73, 86, 65, 84, 69, 32, 75, 69, 89, 45, 45, 45, 45, 45, 10}

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
