TARGET       := retro matoya z
TARGET_LIBS  := $(TARGET:%=lib%.a)
TARGET_CLEAN := $(TARGET:%=%-clean)

all: $(TARGET_LIBS)

$(TARGET_LIBS):
	make -f Makefile.$(@:lib%.a=%) -j 8

clean: $(TARGET_CLEAN)

$(TARGET_CLEAN):
	make -f Makefile.$(@:%-clean=%) clean
	$(RM) $(TARGET_LIB)
