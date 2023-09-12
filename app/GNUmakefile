OUT_DIR := build

EXPORTS := $(addprefix -Wl$(shell echo ,)--export=, $(shell cat `pwd`/exports.txt))

SRC_DIR  := sources
DEPS_DIR := ../deps
DEPS     := $(DEPS_DIR)/libz.a $(DEPS_DIR)/libretro.a

CORES_DIR := ../cores
CORES     := $(shell jq -r 'keys[]' $(CORES_DIR)/cores.json)

DEFINES := \
	-I$(DEPS_DIR)/libretro-common/include

LDFLAGS := \
	-lwasi-emulated-mman -fwasm-exceptions \
	-mexec-model=reactor -Wl,--no-entry \
	-Wl,--export=calloc,--export=free \
	-Wl,--initial-memory=$$((200 * 1024 * 1024)) \
	-Wl,--max-memory=$$((600 * 1024 * 1024)) \
	-Wl,--import-memory,--export-memory

OBJ := \
	$(SRC_DIR)/junie.o \
	$(SRC_DIR)/interop-web.o

include ../GNUmakefile.common

all: clean prepare
	@echo Building objects...
	@$(MAKE) -s $(OBJ)
	@$(MAKE) -s $(CORES:%=$(OUT_DIR)/%.wasm)

prepare:
	@mkdir -p $(OUT_DIR)

$(OUT_DIR)/%.wasm:
	@echo Building $*.wasm...
	@$(CXX) -o $(OUT_DIR)/$*.wasm $(OBJ) $(DEPS) $(CORES_DIR)/lib$*.a $(LDFLAGS) $(EXPORTS) $(QUIET)

clean:
	@rm -rf $(OBJ) $(OUT_DIR)

%.o: %.c
	@$(CC) -c -o $@ $^ $(QUIET)
