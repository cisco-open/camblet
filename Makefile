logs:
	sudo dmesg -T --follow

build-dns-hello-world-wasm:
	cd samples/hello-world-rust; make

build-dns-go-wasm:
	cd samples/dns-go; make

build-dns-rust-wasm:
	cd samples/dns-rust; make

build-opa-policy-wasm:
	cd samples/opa; make

build-ebpf-xdp-prog:
	cd samples/ebpf; make

load-hello-rust-wasm:
	sudo cli/cli load -file samples/hello-world-rust/target/wasm32-unknown-unknown/release/hello-world.wasm

load-dns-go-wasm:
	sudo cli/cli load -file samples/dns-go/dns-go.wasm

load-dns-rust-wasm:
	sudo cli/cli load -name dns -file samples/dns-rust/target/wasm32-unknown-unknown/release/dns-rust.wasm

load-opa-policy-wasm:
	sudo cli/cli load -name opa -file samples/opa/policy.wasm

load-ebpf-xdp-prog:
	cd samples/ebpf; make loadxdp

unload-ebpf-xdp-prog:
	cd samples/ebpf; make unloadxdp

build-cli:
	cd cli; go build
