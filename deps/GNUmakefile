MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

emsdk:
	@echo Fetching emscripten...
	@git -C emsdk pull $(QUIET) || git clone --recurse https://github.com/emscripten-core/emsdk.git $(QUIET)
	@( cd emsdk && ./emsdk install latest $(QUIET) )
