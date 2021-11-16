WASI_SDK := $(HOME)/wasi-sdk-12.0
CC       := $(WASI_SDK)/bin/clang   --sysroot=$(WASI_SDK)/share/wasi-sysroot
CXX      := $(WASI_SDK)/bin/clang++ --sysroot=$(WASI_SDK)/share/wasi-sysroot
AR       := $(WASI_SDK)/bin/ar

TARGET       := quicknes mgba snes9x genesis melonds
TARGET_LIB   := $(addprefix lib, $(addsuffix .a, $(TARGET)))
TARGET_CLEAN := $(TARGET_LIB:%=%-clean)

all: $(TARGET_LIB)

$(TARGET_LIB):
	make -f Makefile.$(@:lib%.a=%) PLATFORM=emscripten CC="$(CC)" CXX="$(CXX)" AR="$(AR)"

clean: $(TARGET_CLEAN)

$(TARGET_CLEAN):
	make -f Makefile.$(@:lib%.a-clean=%) PLATFORM=emscripten clean
	$(RM) $(TARGET_LIB)
