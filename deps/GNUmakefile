WASI_VERSION = 20.0

MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: wasi-sdk emsdk

wasi-sdk:
	@echo Fetching wasi-sdk...
	@wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/wasi-sdk-$(WASI_VERSION)-linux.tar.gz $(QUIET)
	@mkdir wasi-sdk && tar xvf wasi-sdk-$(WASI_VERSION)-linux.tar.gz -C wasi-sdk --strip-components 1 $(QUIET)
	@rm wasi-sdk-$(WASI_VERSION)-linux.tar.gz

emsdk:
	@echo Fetching emscripten...
	@git -C emsdk pull $(QUIET) || git clone --recurse https://github.com/emscripten-core/emsdk.git $(QUIET)
	@( cd emsdk && ./emsdk install latest $(QUIET) )
