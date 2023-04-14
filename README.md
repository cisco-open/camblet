# wasm-kernel-module-cli

This repository contains a CLI and samples for [wasm-kernel-module](https://github.com/cisco-open/wasm-kernel-module), which is a kernel module that
runs and exposes a [Wasm](https://webassembly.org) runtime as a proof of concept for checking:
- Wasm is capable of running the kernel space
- running code in kernel space in allmost all languages compiled to Wasm
- expose Wasm functionality written in Wasm to eBPF securely

## Why doing this?

[eBPF](https://ebpf.io) is a fine piece of technology for doing low-level tracing, traffic shifting, authorization and other cool things in the kernel space, and a user space counterpart of an eBPF program helps it to manage more complex logic. Wasm is a fine piece of technology to write more [complex business logic](https://www.secondstate.io/articles/ebpf-and-webassembly-whose-vm-reigns-supreme/) (it is Turing-complete). This project aims to create such a setup, where one can support an eBPF program next from Kernel space, with user space level logic, written in Wasm, exposed as a normal Kernel function, instead of communicating through eBPF maps to user space.

## Which Wasm runtime?

The [wasm3](https://github.com/wasm3/wasm3) runtime got choosen since it is written in C and has minimal dependencies (except a C library) and this it is extremely portable. In kernel space there is no libc, but we maintain a fork of wasm3 which can run in kernel space as well (check the `thrid-party/wasm3/` submodule).

Current restrictions for kernel-space wasm3:
- no floating point support [can be soft-emulated if needed]
- no WASI support

## Development environment

Our primary development environment is [Lima](https://lima-vm.io) since it supports x86_64 and ARM as well. Follow the instructions for [wasm-kernel-module](https://github.com/cisco-open/wasm-kernel-module) for setting up the development environment.

## CLI

The Wasm kernel module comes with a user space [CLI](./cli/) written in Go. The kernel module exposes a character device: `/dev/wasm`, this can be used to interact with the module through the CLI. One usually runs this CLI on the Linux host itself.

### Build

```bash
lima make build-cli
```

## Examples

You can find a few sample applications compiled to Wasm and also EBPF code snippets which use them under the [samples](./samples) directory. All examples use the CLI underneath, inside the Make targets.

### Simple Hello World

Build and load the Hello World Wasm module to the runtime inside the kernel module:

```bash
make build-hello-world-rust-wasm
lima make load-hello-world-rust-wasm
```

Check the kernel logs for the `Hello` message:

```bash
lima make logs
```

```
[Thu Mar 23 12:59:49 2023] wasm: command load
[Thu Mar 23 12:59:49 2023] wasm: loading module: my-module
[Thu Mar 23 12:59:49 2023] wasm: calling module entrypoint: main
[Thu Mar 23 12:59:49 2023] Hello, world!
[Thu Mar 23 12:59:49 2023] wasm: vm for cpu = 0
[Thu Mar 23 12:59:49 2023] wasm:   module = my-module
[Thu Mar 23 12:59:49 2023] wasm:     global -> $global0
[Thu Mar 23 12:59:49 2023] wasm:     global -> __data_end
[Thu Mar 23 12:59:49 2023] wasm:     global -> __heap_base
[Thu Mar 23 12:59:49 2023] wasm:     import -> env._debug
[Thu Mar 23 12:59:49 2023] wasm:     function -> _debug(2) -> 1
[Thu Mar 23 12:59:49 2023] wasm:     function -> main(2) -> 1
[Thu Mar 23 12:59:49 2023] wasm: calling module entrypoint: main
[Thu Mar 23 12:59:49 2023] Hello, world!
```
