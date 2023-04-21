SRC_DIR := sources
OUT_DIR := build

include ../GNUmakefile.common

EXPORTS := $(addprefix -Wl$(shell echo ,)--export=, $(shell cat `pwd`/exports.txt))

CORES_DIR := ../cores
LIBRARIES := $(shell jq -r 'keys[]' $(CORES_DIR)/cores.json)
BINARIES  := $(LIBRARIES:%=$(OUT_DIR)/lib%.wasm)

SRC := \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/tools.c \
	$(SRC_DIR)/filesystem.c \
	$(SRC_DIR)/wasi.c

OBJ := $(SRC:.c=.o)

CFLAGS  := \
	-I$(SRC_DIR)

LDFLAGS := \
	-mexec-model=reactor -Wl,--no-entry \
	$(EXPORTS) -Wl,--export=calloc,--export=free \
	-Wl,--initial-memory=$$((450 * 1024 * 1024)) \
	-Wl,--import-memory,--export-memory

ifeq ($(DEBUG), 1)
CFLAGS  += -O0 -ferror-limit=0 -DDEBUG
LDFLAGS += -O0 -g -Wl,--error-limit=0
else
CFLAGS  += -O3 -flto
LDFLAGS += -O3 -flto
endif

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

.SECONDARY: $(OBJ)

all: clean prepare
	@echo Building objects...
	@$(MAKE) -s $(OBJ)
	@$(MAKE) -s $(BINARIES)

prepare:
	@mkdir -p $(OUT_DIR)

$(OUT_DIR)/lib%.wasm:
	@echo Building lib$*.wasm...
	@$(CXX) -o $(OUT_DIR)/lib$*.wasm $(OBJ) -L$(CORES_DIR) -l$* $(LDFLAGS) $(QUIET)

clean:
	@rm -rf $(OBJ) $(OUT_DIR)

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^ $(QUIET)
