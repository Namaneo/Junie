LIBRARIES := $(shell jq -r 'keys[]' cores.json)

DEFINES := -D__EMSCRIPTEN__
include ../GNUmakefile.common

BUILD_FLAGS := \
	-j 8 platform=emscripten HAVE_OPENGL=0 \
	CC="$(CC)" CXX="$(CXX)" AR="$(AR)" RANLIB="$(RANLIB)"

all: $(LIBRARIES:%=lib%.a)

clean: $(LIBRARIES:%=clean-%)

fetch-%:
	@target=`pwd`/lib$*.a && \
	name=`jq -r '."$*".repository // "$*"' cores.json` && \
	owner=`jq -r '."$*".owner // "libretro"' cores.json` && \
	branch=`jq -r '."$*".branch // "master"' cores.json` && \
	echo Fetching $$name... && \
	git -C $$name pull $(QUIET) || git clone -b $$branch --recurse https://github.com/$$owner/$$name.git $(QUIET)

lib%.a: fetch-%
	@target=`pwd`/lib$*.a && \
	name=`jq -r '."$*".repository // "$*"' cores.json` && \
	makedir=`jq -r '."$*".directory // ""' cores.json` && \
	makefile=`jq -r '."$*".makefile // "Makefile"' cores.json` && \
	echo Building lib$*.a... && \
	$(MAKE) -C $$name/$$makedir -f $$makefile TARGET=$$target $(BUILD_FLAGS) $(QUIET)

clean-%:
	@target=`pwd`/lib$*.a && \
	name=`jq -r '."$*".repository // "$*"' cores.json` && \
	makedir=`jq -r '."$*".directory // ""' cores.json` && \
	makefile=`jq -r '."$*".makefile // "Makefile"' cores.json` && \
	test ! -d $$name || \
	$(MAKE) -C $$name/$$makedir -f $$makefile clean TARGET=$$target $(BUILD_FLAGS) $(QUIET)

.PHONY: emsdk
