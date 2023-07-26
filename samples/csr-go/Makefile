go-csr:
	tinygo build -o csr-go.wasm \
	-target=wasm \
	-gc=leaking -panic=trap -scheduler=none \
	-opt=z main.go
