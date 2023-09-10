WASI_VERSION = 20.0

DEFINES := -I$(DEPS_DIR)/libretro-common/include
include ../GNUmakefile.common

all: wasi-sdk emsdk zlib libretro-common libz.a libretro.a

wasi-sdk:
	@echo Fetching wasi-sdk...
	@wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/wasi-sdk-$(WASI_VERSION)-linux.tar.gz $(QUIET)
	@mkdir wasi-sdk && tar xvf wasi-sdk-$(WASI_VERSION)-linux.tar.gz -C wasi-sdk --strip-components 1 $(QUIET)
	@rm wasi-sdk-$(WASI_VERSION)-linux.tar.gz

emsdk:
	@echo Fetching emscripten...
	@git -C emsdk pull $(QUIET) || git clone --recurse https://github.com/emscripten-core/emsdk.git $(QUIET)
	@cd emsdk && ./emsdk install latest $(QUIET) && ./emsdk activate latest $(QUIET)

libretro-common:
	@echo Fetching libretro-common...
	@git -C libretro-common pull $(QUIET) || git clone --recurse https://github.com/libretro/libretro-common.git $(QUIET)

zlib:
	@echo Fetching zlib...
	@git -C zlib pull $(QUIET) || git clone --recurse https://github.com/madler/zlib.git $(QUIET)

OBJ = \
	libretro-common/file/file_path.o \
	libretro-common/file/file_path_io.o \
	libretro-common/file/config_file.o \
	libretro-common/file/config_file_userdata.o \
	libretro-common/streams/file_stream.o \
	libretro-common/streams/file_stream_transforms.o \
	libretro-common/vfs/vfs_implementation.o \
	libretro-common/string/stdstring.o \
	libretro-common/lists/string_list.o \
	libretro-common/compat/compat_strl.o \
	libretro-common/rthreads/rthreads.o \
	libretro-common/features/features_cpu.o \
	libretro-common/audio/conversion/float_to_s16.o \
	libretro-common/audio/conversion/s16_to_float.o \
	libretro-common/audio/resampler/audio_resampler.o \
	libretro-common/audio/resampler/drivers/sinc_resampler.o

libz.a:
	@echo Building libz.a...
	@cd zlib && ./configure $(QUIET)
	@$(MAKE) -C zlib libz.a CC="$(CC)" AR="$(AR)" RANLIB="$(RANLIB)" $(QUIET)
	@cp zlib/libz.a .
	@$(MAKE) -C zlib distclean $(QUIET)

libretro.a:
	@echo Building libretro.a...
	@$(MAKE) $(OBJ) $(QUIET)
	@$(AR) rcs libretro.a $(OBJ)

clean:
	@rm -f $(OBJ) libretro.a libz.a

%.o: %.c
	@$(CC) -c -o $@ -Ilibretro-common/include $^ $(QUIET)
