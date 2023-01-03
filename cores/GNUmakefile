LIBRARIES := $(shell jq -r 'keys[]' cores.json)

BUILD_FLAGS := \
	-j 8 \
	platform=emscripten \
	SHARED=-shared \
	STATIC_LINKING=0 \
	STATIC_LINKING_LINK=0 \
	fpic=-fPIC

MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: $(LIBRARIES:%=build-%)

build-%.so:
	@echo Building $*.so...
	@target=`pwd`/$*.so && \
	makedir=`jq -r '."$*.so".directory' cores.json` && \
	makefile=`jq -r '."$*.so".makefile' cores.json` && \
	$(MAKE) -C $$makedir -f $$makefile TARGET=$$target $(BUILD_FLAGS) $(QUIET)

clean: $(LIBRARIES:%=clean-%)

clean-%.so:
	@target=`pwd`/$*.so && \
	makedir=`jq -r '."$*.so".directory' cores.json` && \
	makefile=`jq -r '."$*.so".makefile' cores.json` && \
	$(MAKE) -C $$makedir -f $$makefile clean TARGET=$$target $(BUILD_FLAGS) $(QUIET)
