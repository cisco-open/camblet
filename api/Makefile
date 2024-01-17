include ../common.mk

BUF_VERSION = 1.28.1

generate-protobuf: download-buf ## generate protobuf
	./bin/buf mod update
	./bin/buf generate

download-buf:
	./scripts/install-buf.sh $(BUF_VERSION)
