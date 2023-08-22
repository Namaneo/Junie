SRC_DIR := sources
OUT_DIR := build

include ../GNUmakefile.common

EXPORTS := $(addprefix -Wl$(shell echo ,)--export=, $(shell cat `pwd`/exports.txt))

CORES_DIR := ../cores
LIBRARIES := $(shell jq -r 'keys[]' $(CORES_DIR)/cores.json)
BINARIES  := $(LIBRARIES:%=$(OUT_DIR)/lib%.wasm)

CFLAGS := \
	-I$(SRC_DIR)

LDFLAGS := \
	-lwasi-emulated-mman \
	-mexec-model=reactor -Wl,--no-entry \
	$(EXPORTS) -Wl,--export=calloc,--export=free \
	-Wl,--initial-memory=$$((200 * 1024 * 1024)) \
	-Wl,--max-memory=$$((600 * 1024 * 1024)) \
	-Wl,--import-memory,--export-memory

ifeq ($(DEBUG), 1)
CFLAGS  += -O0 -ferror-limit=0 -DDEBUG
LDFLAGS += -O0 -g -Wl,--error-limit=0
else
CFLAGS  += -O3 -flto -msimd128
LDFLAGS += -O3 -flto
endif

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

all: clean prepare
	@echo Building objects...
	@$(MAKE) -s $(SRC_DIR)/core.o
	@$(MAKE) -s $(BINARIES)

prepare:
	@mkdir -p $(OUT_DIR)

$(OUT_DIR)/lib%.wasm:
	@echo Building lib$*.wasm...
	@$(CXX) -o $(OUT_DIR)/lib$*.wasm $(SRC_DIR)/core.o -L$(CORES_DIR) -l$* $(LDFLAGS) $(QUIET)

clean:
	@rm -rf $(SRC_DIR)/core.o $(OUT_DIR)

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^ $(QUIET)
