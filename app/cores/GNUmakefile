TARGET := lib$(name).so

MAKEDIR  := $(name)
MAKEFILE := Makefile

ifeq ($(name), genesis)
MAKEFILE := Makefile.libretro
endif

ifeq ($(name), nestopia)
MAKEDIR := $(name)/libretro
endif

BUILD_FLAGS := \
	-j 8 \
	-C $(MAKEDIR) \
	-f $(MAKEFILE) \
	platform=emscripten \
	SHARED=-shared \
	TARGET=$(TARGET) \
	STATIC_LINKING=0 \
	STATIC_LINKING_LINK=0 \
	fpic=-fPIC

RANLIB ?= ranlib
MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: $(TARGET)

$(TARGET):
	@echo Building $(TARGET)...
	@$(MAKE) $(BUILD_FLAGS) $(QUIET)
	@cp `find $(name) -name $(TARGET)` $(TARGET)
	@rm `find $(name) -name $(TARGET)`
	@rm `find $(name) -name lib$(name).wasm`

clean:
	@$(MAKE) $(BUILD_FLAGS) clean $(QUIET)
	@rm -f $(TARGET)
