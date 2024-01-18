# Camblet

## Introduction

[Camblet](https://github.com/cisco-open/camblet) is a set of projects, which in tandem are capable of enhancing plain old TCP sockets in a frictionless way, so that application developers can focus on their business logic instead of dealing with the complexity of TLS, mTLS, and other security-related concerns. It is doing this seamlessly, no code changes or re-compilations or re-deployments are required. You only have to configure Camblet itself, and it will do the rest.

The features are the following:

- providing zero-trust identity for UNIX TCP sockets through mTLS
- access control, authorization and authentication (through [OPA](https://www.openpolicyagent.org))
- providing frictionless TLS termination for those TCP sockets
- supporting every Linux-based machine (bare-metal, vanilla VM, Kubernetes, etc... you name it)

This repository contains the source code of the `camblet` multi-purpose binary for controlling the [camblet-kernel-module](https://github.com/cisco-open/camblet-kernel-module), which is a kernel module that does the processing of the user traffic.

## Architecture

Camblet's architecture consists of currently 2 different components: the kernel module and the agent. This will change in the future, we plan to add a control plane, but the current architecture is the following:

![Camblet architecture](./docs/img/camblet-architecture.png)

## Components

The Camblet kernel module comes with a user space [CLI](./cli/) written in Go. The kernel module exposes a character device: `/dev/camblet`, which is opened by the agent, and the CLI talks with the agent. One usually runs this CLI on the Linux host itself.

### Agent (server)

The agent is the server side of the CLI. It is responsible for the following:

- communicates with the kernel module directly
- parses policy files and loads them to the kernel module
- signs CSR requests generated by the kernel module
- adds metadata from the host environment to enrich process data. (e.g. Kubernetes, AWS, etc...)

Usage:

```bash
sudo camblet agent --policies-path $(pwd)/camblet.d/policies --services-path $(pwd)/camblet.d/services
```

## Development

### Development environment

Our primary development environment is [Lima](https://lima-vm.io) since it supports x86_64 and ARM as well. Follow the instructions for [camblet-kernel-module](https://github.com/cisco-open/camblet-kernel-module#coding) for setting up the development environment.

### Build

The CLI is written in Go, so you need to have a Go development environment set up. The CLI is built with the help of [Makefile](./Makefile), so you need to have `make` installed as well.

```bash
GOOS=linux make build
```

### Run the agent on the Lima guest

```bash
sudo ./bin/camblet agent --policies-path $(pwd)/camblet.d/policies --services-path $(pwd)/camblet.d/services
```

## Community

Join our community on [Slack](https://join.slack.com/t/outshift/shared_invite/zt-26xfl4muq-zcDSfsA_7eOWlyhjvBGqVQ), and then
find us on the [Camblet](https://outshift.slack.com/channels/camblet) channel for more fun!
