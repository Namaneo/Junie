TARGET := lib$(name).a

BUILD_DIR   := $(TARGET:lib%.a=%)
BUILD_FLAGS := TARGET=../$(TARGET)

ifeq ($(name), genesis)
BUILD_FLAGS += -f Makefile.libretro LIBRETRO_COMM_DIR=../../lib/retro
endif

ifeq ($(name), snes9x)
BUILD_DIR   := $(TARGET:lib%.a=%)/libretro
BUILD_FLAGS := TARGET=../../$(TARGET)
endif

SYM_FILE := $(shell pwd)/symbols.txt
SYMBOLS  := $(shell cat symbols.txt | sed -e 's/\(.*\)/-D \1=$(name)_\1 /')

RANLIB ?= ranlib

BUILD_FLAGS += -j 8 platform=emscripten STATIC_LINKING=1 STATIC_LINKING_LINK=1
MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

ifeq ($(shell uname -s), Darwin)
SYMBOLS += -DHAVE_STRLCPY -DHAVE_XLOCALE
endif

all: $(TARGET)

$(TARGET):
	@echo Building $(TARGET)...
	@CFLAGS="$(SYMBOLS)" CXXFLAGS="$(SYMBOLS)" $(MAKE) -C $(BUILD_DIR) $(BUILD_FLAGS) $(QUIET)
	@$(RANLIB) $(TARGET)

clean:
	@$(MAKE) -C $(BUILD_DIR) $(BUILD_FLAGS) clean $(QUIET)
