# Build variables
PACKAGE = github.com/cisco-open/camblet
BINARY_NAME ?= camblet
BUILD_DIR ?= build
BUILD_PACKAGE = ${PACKAGE}/cmd/camblet
CONFIG_DIR ?= /etc/camblet
VERSION ?= $(shell (git symbolic-ref -q --short HEAD || git describe --tags --exact-match) | tr "/" "-")
COMMIT_HASH ?= $(shell git rev-parse --short HEAD 2>/dev/null)
BUILD_DATE ?= $(shell date +%FT%T%z)
LDFLAGS += -X main.version=${VERSION} -X main.commitHash=${COMMIT_HASH} -X main.buildDate=${BUILD_DATE} -X main.configDir=${CONFIG_DIR}

# Dependency versions
GOLANG_VERSION = 1.21

include common.mk

export CGO_ENABLED ?= 0
export GOOS = $(shell go env GOOS)
ifeq (${VERBOSE}, 1)
ifeq ($(filter -v,${GOARGS}),)
	GOARGS += -v
endif
endif

.PHONY: build
build: ## Build a binary
ifeq (${VERBOSE}, 1)
	go env
endif
ifneq (${IGNORE_GOLANG_VERSION_REQ}, 1)
	@printf "${GOLANG_VERSION}\n$$(go version | awk '{sub(/^go/, "", $$3);print $$3}')" | sort -t '.' -k 1,1 -k 2,2 -k 3,3 -g | head -1 | grep -q -E "^${GOLANG_VERSION}$$" || (printf "Required Go version is ${GOLANG_VERSION}\nInstalled: `go version`" && exit 1)
endif

	@$(eval GENERATED_BINARY_NAME = ${BINARY_NAME})
	@$(if $(strip ${BINARY_NAME_SUFFIX}),$(eval GENERATED_BINARY_NAME = ${BINARY_NAME}-$(subst $(eval) ,-,$(strip ${BINARY_NAME_SUFFIX}))),)
	go build ${GOARGS} -tags "${GOTAGS}" -ldflags "${LDFLAGS}" -o ${BUILD_DIR}/${GENERATED_BINARY_NAME} ${BUILD_PACKAGE}

.PHONY: goreleaser
goreleaser: ## Build packages with goreleaser
	goreleaser release --snapshot --clean

.PHONY: deb
deb: ## Build DEB the meta package
	equivs-build deploy/debian-control

.PHONY: rpm
rpm: ## Build RPM the meta package
	rpmbuild -ba --define '_rpmdir ./deploy/rpmbuild/' deploy/rpmbuild/SPECS/camblet.spec

.PHONY: _run
_run: ## Run the binary
	sudo build/camblet agent --policies-path /etc/camblet/policies/ --services-path /etc/camblet/services/

.PHONY: _sync-config
_sync-config: ## Sync the configuration files to /etc/camblet
	watch sudo rsync -av ./camblet.d/ /etc/camblet/ > /dev/null

.PHONY: run
run: ## Run the binary in live edit mode
	@$(MAKE) -j2 _run _sync-config
