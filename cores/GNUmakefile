LIBRARIES := $(shell jq -r 'keys[]' cores.json)

BUILD_FLAGS := \
	-j 8 \
	platform=emscripten \
	SHARED=-shared \
	HAVE_OPENGL=1 \
	STATIC_LINKING=0 \
	STATIC_LINKING_LINK=0 \
	fpic=-fPIC

MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: $(LIBRARIES:%=build-%)

fetch-%:
	@target=`pwd`/lib$*.so && \
	name=`jq -r '."$*".repository' cores.json` && \
	echo Fetching $$name... && \
	git -C $$name pull $(QUIET) || git clone https://github.com/libretro/$$name.git $(QUIET)

build-%: fetch-%
	@target=`pwd`/lib$*.so && \
	name=`jq -r '."$*".repository' cores.json` && \
	makedir=`jq -r '."$*".directory // ""' cores.json` && \
	makefile=`jq -r '."$*".makefile // "Makefile"' cores.json` && \
	echo Building lib$*.so... && \
	$(MAKE) -C $$name/$$makedir -f $$makefile TARGET=$$target $(BUILD_FLAGS) $(QUIET)

clean: $(LIBRARIES:%=clean-%)

clean-%:
	@target=`pwd`/lib$*.so && \
	name=`jq -r '."$*".repository' cores.json` && \
	makedir=`jq -r '."$*".directory // ""' cores.json` && \
	makefile=`jq -r '."$*".makefile // "Makefile"' cores.json` && \
	test ! -d $$name || \
	$(MAKE) -C $$name/$$makedir -f $$makefile clean TARGET=$$target $(BUILD_FLAGS) $(QUIET)
