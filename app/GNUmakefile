SRC_DIR := sources
LIB_DIR := libraries
RES_DIR := assets
OUT_DIR := build

CORES_DIR := ../cores
LIBRARIES := $(shell jq -r 'keys[]' $(CORES_DIR)/cores.json)
BINARIES  := $(LIBRARIES:%=$(OUT_DIR)/lib%.js) $(OUT_DIR)/tools.js

SRC := \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/tools.c \
	$(SRC_DIR)/framerate.c \
	$(SRC_DIR)/filesystem.c \
	$(LIB_DIR)/parson.c

OBJ := $(SRC:.c=.o)

CFLAGS  := \
	-I$(SRC_DIR) -I$(LIB_DIR) \
	-msimd128 -fPIC -Wno-switch

LDFLAGS := \
	--no-entry -sENVIRONMENT=web \
	-sMODULARIZE -sEXPORT_ES6 \
	-sINVOKE_RUN=0 -sEXIT_RUNTIME

ifeq ($(DEBUG), 1)
CFLAGS  += -O0 -ferror-limit=0 -D DEBUG
LDFLAGS += -O0 -g -Wl,--error-limit=0
else
CFLAGS  += -O3
LDFLAGS += -O3
endif

LDFLAGS_GAME := $(LDFLAGS) \
	--embed-file $(RES_DIR) \
	-fwasm-exceptions -sMAIN_MODULE=2 \
	-sINITIAL_MEMORY=32mb -sALLOW_MEMORY_GROWTH \
	-sEXPORTED_FUNCTIONS=@exports.json \
	-sEXPORTED_RUNTIME_METHODS=ccall,cwrap,FS

LDFLAGS_TOOLS := $(LDFLAGS) \
	-sEXPORTED_RUNTIME_METHODS=IDBStore

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

.SECONDARY: $(OBJ)

all: clean prepare
	@echo Building objects...
	@$(MAKE) -s $(OBJ)
	@$(MAKE) -s $(BINARIES)

prepare:
	@mkdir -p $(OUT_DIR)

$(OUT_DIR)/lib%.js:
	@echo Building lib$*.js...
	@$(CXX) -o $(OUT_DIR)/lib$*.js $(OBJ) -L$(CORES_DIR) -l$* $(LDFLAGS_GAME) -sEXPORT_NAME=lib$* $(QUIET)

$(OUT_DIR)/tools.js:
	@echo Building tools.js...
	@$(CXX) -o $(OUT_DIR)/tools.js $(OBJ) $(LDFLAGS_TOOLS) -sEXPORT_NAME=tools $(QUIET)

clean:
	@rm -rf $(OBJ) $(OUT_DIR)

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^ $(QUIET)
