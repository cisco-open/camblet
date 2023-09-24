default: generate

apiprotos := \
	agent/common/v1/common.proto \

bin_dir := bin
os=$(shell uname -s)
arch=$(shell uname -m)
protoc_version = 24.3

# Download protoc
base_protoc_url = https://github.com/protocolbuffers/protobuf/releases/download/v$(protoc_version)/protoc-$(protoc_version)
ifeq ($(os),Linux)
	ifeq ($(arch),aarch64)
	protoc_url=$(base_protoc_url)-linux-aarch_64.zip
	else
	protoc_url=$(base_protoc_url)-linux-x86_64.zip
	endif
else
	protoc_url=$(base_protoc_url)-osx-x86_64.zip
endif

protoc_dir = $(bin_dir)/protoc/$(protoc_version)
protoc_bin = $(protoc_dir)/bin/protoc

$(protoc_bin):
	@echo "Installing protoc $(protoc_url) $(protoc_version)..."
	@rm -rf $(dir $(protoc_dir))
	@mkdir -p $(protoc_dir)
	@curl -sSfL $(protoc_url) -o $(bin_dir)/tmp.zip; unzip -q -d $(protoc_dir) $(bin_dir)/tmp.zip; rm $(bin_dir)/tmp.zip

# Download build dependencies
.PHONY: download-deps
download-deps: $(protoc_bin)
	@./scripts/download-deps.sh

.PHONY: generate
generate: download-deps $(apiprotos:.proto=.pb.go) $(apiprotos:.proto=_grpc.pb.go)

.PHONY: tidy
tidy: ## Execute go mod tidy
	go mod tidy
	go mod download all

FORCE: ;

%_grpc.pb.go: %.proto FORCE
	@echo "compiling API $<..."
		@PATH="$(bin_dir):$(PATH)" \
		$(protoc_bin) \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		$(<:proto/%=%)

%.pb.go: %.proto FORCE
	@echo "compiling $<..."
		@PATH="$(bin_dir):$(PATH)" \
		$(protoc_bin) \
		--go_out=. --go_opt=paths=source_relative \
		$(<:proto/%=%)
