TARGET       := quicknes mgba snes9x genesis melonds
TARGET_LIB   := $(addprefix lib, $(addsuffix .a, $(TARGET)))
TARGET_CLEAN := $(TARGET_LIB:%=%-clean)

all: $(TARGET_LIB)

$(TARGET_LIB):
	make -f Makefile.$(@:lib%.a=%) PLATFORM=emscripten

clean: $(TARGET_CLEAN)

$(TARGET_CLEAN):
	make -f Makefile.$(@:lib%.a-clean=%) PLATFORM=emscripten clean
	$(RM) $(TARGET_LIB)
