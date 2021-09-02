WASI_SDK := $(HOME)/wasi-sdk-12.0
CC       := $(WASI_SDK)/bin/clang --sysroot=$(WASI_SDK)/share/wasi-sysroot
AR       := $(WASI_SDK)/bin/ar
RANLIB   := $(WASI_SDK)/bin/ranlib

TARGET       := retro matoya z
TARGET_LIBS  := $(TARGET:%=lib%.a)
TARGET_CLEAN := $(TARGET:%=%-clean)

all: $(TARGET_LIBS)

$(TARGET_LIBS):
	make -f Makefile.$(@:lib%.a=%) CC="$(CC)" CXX="$(CXX)" AR="$(AR)" RANLIB="$(RANLIB)"

clean: $(TARGET_CLEAN)

$(TARGET_CLEAN):
	make -f Makefile.$(@:%-clean=%) clean
	$(RM) $(TARGET_LIB)
