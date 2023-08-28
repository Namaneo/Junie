SRC_DIR := sources
OUT_DIR := build

include ../GNUmakefile.common

EXPORTS := $(addprefix -Wl$(shell echo ,)--export=, $(shell cat `pwd`/exports.txt))

DEPS_DIR := ../deps
DEPS     := $(DEPS_DIR)/libz.a $(DEPS_DIR)/libretro.a

CORES_DIR := ../cores
CORES     := $(shell jq -r 'keys[]' $(CORES_DIR)/cores.json)

CFLAGS := \
	-I$(SRC_DIR)

LDFLAGS := \
	-fwasm-exceptions \
	-mexec-model=reactor -Wl,--no-entry \
	$(EXPORTS) -Wl,--export=calloc,--export=free \
	-Wl,--initial-memory=$$((200 * 1024 * 1024)) \
	-Wl,--max-memory=$$((600 * 1024 * 1024)) \
	-Wl,--import-memory,--export-memory

ifeq ($(DEBUG), 1)
CFLAGS  += -O0 -ferror-limit=0 -DDEBUG
LDFLAGS += -O0 -g -Wl,--error-limit=0
else
CFLAGS  += -O3 -msimd128
LDFLAGS += -O3
endif

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

all: clean prepare
	@echo Building objects...
	@$(MAKE) -s $(SRC_DIR)/core.o
	@$(MAKE) -s $(CORES:%=$(OUT_DIR)/%.wasm)

prepare:
	@mkdir -p $(OUT_DIR)

$(OUT_DIR)/%.wasm:
	@echo Building $*.wasm...
	@$(CXX) -o $(OUT_DIR)/$*.wasm $(SRC_DIR)/core.o $(DEPS) $(CORES_DIR)/lib$*.a $(LDFLAGS) $(QUIET)

clean:
	@rm -rf $(SRC_DIR)/core.o $(OUT_DIR)

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^ $(QUIET)
