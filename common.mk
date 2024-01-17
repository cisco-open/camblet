REPO_ROOT=$(shell git rev-parse --show-toplevel)

# Dependency versions
LICENSEI_VERSION = 0.9.0
GOLANGCI_VERSION = 1.54.2

.PHONY: list
list: ## List all make targets
	@${MAKE} -pRrn : -f $(MAKEFILE_LIST) 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | sort

.PHONY: help
.DEFAULT_GOAL := help
help:
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: fmt
fmt: ## Run go fmt against code
	go fmt ./...

.PHONY: vet
vet: ## Run go vet against code
	go vet ./...

.PHONY: tidy
tidy: ## Execute go mod tidy
	go mod tidy
	go mod download all

${REPO_ROOT}/bin/golangci-lint-${GOLANGCI_VERSION}:
	@mkdir -p ${REPO_ROOT}/bin
	@mkdir -p bin
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | bash -s v${GOLANGCI_VERSION}
	@mv bin/golangci-lint $@

${REPO_ROOT}/bin/golangci-lint: ${REPO_ROOT}/bin/golangci-lint-${GOLANGCI_VERSION}
	@ln -sf golangci-lint-${GOLANGCI_VERSION} ${REPO_ROOT}/bin/golangci-lint

.PHONY: lint
lint: ${REPO_ROOT}/bin/golangci-lint ## Run linter
# "unused" linter is a memory hog, but running it separately keeps it contained (probably because of caching)
	${REPO_ROOT}/bin/golangci-lint run --disable=unused -c ${REPO_ROOT}/.golangci.yml --timeout 2m
	${REPO_ROOT}/bin/golangci-lint run -c ${REPO_ROOT}/.golangci.yml --timeout 2m

.PHONY: lint-fix
lint-fix: ${REPO_ROOT}/bin/golangci-lint ## Run linter
	@${REPO_ROOT}/bin/golangci-lint run -c ${REPO_ROOT}/.golangci.yml --fix --timeout 2m

${REPO_ROOT}/bin/licensei: ${REPO_ROOT}/bin/licensei-${LICENSEI_VERSION}
	@ln -sf licensei-${LICENSEI_VERSION} ${REPO_ROOT}/bin/licensei

${REPO_ROOT}/bin/licensei-${LICENSEI_VERSION}:
	@mkdir -p ${REPO_ROOT}/bin
	@mkdir -p bin
	curl -sfL https://raw.githubusercontent.com/goph/licensei/master/install.sh | bash -s v${LICENSEI_VERSION}
	mv bin/licensei $@

.PHONY: license-check
license-check: ${REPO_ROOT}/bin/licensei ## Run license check
	${REPO_ROOT}/bin/licensei --config ${REPO_ROOT}/.licensei.toml check
	${REPO_ROOT}/bin/licensei --config ${REPO_ROOT}/.licensei.toml header

.PHONY: license-cache
license-cache: ${REPO_ROOT}/bin/licensei ## Generate license cache
	${REPO_ROOT}/bin/licensei --config ${REPO_ROOT}/.licensei.toml cache
