TARGET := lib$(name).a

BUILD_DIR   := $(TARGET:lib%.a=%)
BUILD_FLAGS := TARGET=../$(TARGET)

ifeq ($(name), genesis)
BUILD_FLAGS += -f Makefile.libretro LIBRETRO_COMM_DIR=../../lib/retro
endif

RANLIB ?= ranlib

BUILD_FLAGS += -j 8 platform=emscripten STATIC_LINKING=1 STATIC_LINKING_LINK=1 fpic=-fPIC
MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: $(TARGET)

$(TARGET):
	@echo Building $(TARGET)...
	@$(MAKE) -C $(BUILD_DIR) $(BUILD_FLAGS) $(QUIET)
	@$(RANLIB) $(TARGET)

clean:
	@$(MAKE) -C $(BUILD_DIR) $(BUILD_FLAGS) clean $(QUIET)
