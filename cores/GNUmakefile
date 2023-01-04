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

fetch-%.so:
	@target=`pwd`/$*.so && \
	name=`jq -r '."$*.so".name' cores.json` && \
	echo Fetching $$name... && \
	git -C $$name pull $(QUIET) || git clone https://github.com/libretro/$$name.git $(QUIET)

build-%.so: fetch-%.so
	@target=`pwd`/$*.so && \
	name=`jq -r '."$*.so".name' cores.json` && \
	makedir=`jq -r '."$*.so".directory // ""' cores.json` && \
	makefile=`jq -r '."$*.so".makefile' cores.json` && \
	echo Building $*.so... && \
	$(MAKE) -C $$name/$$makedir -f $$makefile TARGET=$$target $(BUILD_FLAGS) $(QUIET)

clean: $(LIBRARIES:%=clean-%)

clean-%.so:
	@target=`pwd`/$*.so && \
	name=`jq -r '."$*.so".name' cores.json` && \
	makedir=`jq -r '."$*.so".directory // ""' cores.json` && \
	makefile=`jq -r '."$*.so".makefile' cores.json` && \
	$(MAKE) -C $$name/$$makedir -f $$makefile clean TARGET=$$target $(BUILD_FLAGS) $(QUIET)
