TARGET := lib$(name).a

# libmatoya.a
ifeq ($(name), matoya)

FLAGS := WASM=1 CC="$(CC)" AR="$(AR)"
BIN_PATH := matoya/bin/web/wasm32
MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: $(TARGET)

$(TARGET):
	@echo Building $(TARGET)...
	@$(MAKE) -C matoya $(FLAGS) $(QUIET)
	@cp $(BIN_PATH)/$(TARGET) .

clean:
	@$(MAKE) -C matoya $(FLAGS) clean $(QUIET)
	@rm -f libmatoya.a

endif

# libretro.a
ifeq ($(name), retro)

MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

SRC := \
	retro/compat/compat_strl.c \
	retro/compat/fopen_utf8.c \
	retro/compat/compat_posix_string.c \
	retro/compat/compat_strcasestr.c \
	retro/encodings/encoding_base64.c \
	retro/encodings/encoding_utf.c \
	retro/file/file_path.c \
	retro/formats/png/rpng.c \
	retro/streams/memory_stream.c \
	retro/streams/file_stream.c \
	retro/streams/file_stream_transforms.c \
	retro/streams/memory_stream.c \
	retro/streams/trans_stream.c \
	retro/streams/trans_stream_zlib.c \
	retro/string/stdstring.c \
	retro/vfs/vfs_implementation.c \
	retro/time/rtime.c
OBJ := $(SRC:.c=.o)

CFLAGS := \
	-Iretro/include -Izlib \
	-D_WASI_EMULATED_MMAN \
	-fPIC -DHAVE_ZLIB

all:
	@echo Building $(TARGET)...
	@$(MAKE) name=$(name) $(TARGET)

$(TARGET): $(OBJ)
	@$(AR) rcs $@ $(OBJ)

%.o: %.c
	@$(CC) -c -o $@ $(CFLAGS) $^

clean:
	@$(RM) $(OBJ) $(TARGET)

endif

# libz.a
ifeq ($(name), z)

MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: $(TARGET)

$(TARGET):
	@echo Building $(TARGET)...
	@cd zlib && ./configure $(QUIET)
	@cd zlib && CFLAGS="-fPIC" ./configure $(QUIET)
	@$(MAKE) -C zlib $(TARGET) CC="$(CC)" AR="$(AR)" RANLIB="$(RANLIB)" ARFLAGS="rcs" $(QUIET)
	@cp zlib/$(TARGET) .
	@$(MAKE) -f $(lastword $(MAKEFILE_LIST)) zclean

zclean:
	@$(MAKE) -C zlib distclean $(QUIET)
	@rm -f zlib/*.wasm

clean: zclean
	@rm -f $(TARGET)

endif
