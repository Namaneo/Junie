LIBRARIES := $(shell jq -r 'keys[]' cores.json)

WASI_FLAGS = \
	-I$(shell pwd)/include -flto \
	-D'__EMSCRIPTEN__' -D'_WASI_EMULATED_MMAN' \
	-D'thread_local=' -D'SCHED_RR=0' \
	-D'sched_param={int sched_priority;}' \
	-D'pthread_attr_setschedparam(...)=1'
include ../GNUmakefile.common

BUILD_FLAGS := \
	-j 8 platform=emscripten \
	STATIC_LINKING=0 STATIC_LINKING_LINK=0 LINKOUT="rcs " LIBS= \
	CC="$(CC)" CXX="$(CXX)" LD="$(AR)" RANLIB="$(RANLIB)"

MAKEFLAGS += --no-print-directory
QUIET := > /dev/null 2>&1

all: $(LIBRARIES:%=build-%)

clean: $(LIBRARIES:%=clean-%)

fetch-%:
	@target=`pwd`/lib$*.a && \
	name=`jq -r '."$*".repository // "$*"' cores.json` && \
	owner=`jq -r '."$*".owner // "libretro"' cores.json` && \
	echo Fetching $$name... && \
	git -C $$name pull $(QUIET) || git clone https://github.com/$$owner/$$name.git $(QUIET)

build-%: fetch-%
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
