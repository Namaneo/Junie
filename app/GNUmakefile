SRC_DIR := sources
RES_DIR := assets
OUT_DIR := build

CORES_DIR := ../cores
LIBRARIES := $(shell jq -r 'keys[]' $(CORES_DIR)/cores.json)
BINARIES  := $(LIBRARIES:%=$(OUT_DIR)/%.js) $(OUT_DIR)/tools.js

SRC := \
	$(SRC_DIR)/main.c \
	$(SRC_DIR)/app.c \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/video.c \
	$(SRC_DIR)/audio.c \
	$(SRC_DIR)/input.c \
	$(SRC_DIR)/state.c \
	$(SRC_DIR)/interop.c \
	$(SRC_DIR)/filesystem.c \
	$(SRC_DIR)/parson.c

OBJ := $(SRC:.c=.o)

PORTS := \
	-sUSE_ZLIB \
	-sUSE_SDL=2 \
	-sUSE_SDL_IMAGE=2 \
	-sSDL2_IMAGE_FORMATS=png

CFLAGS  := -I$(SRC_DIR) $(PORTS) -fPIC -Wno-switch

LDFLAGS := $(PORTS) \
	--no-entry \
	-sMODULARIZE \
	-sEXPORT_ES6 \
	-sSINGLE_FILE \
	-sWASM_BIGINT \
	-sALLOW_MEMORY_GROWTH \
	-sLLD_REPORT_UNDEFINED \

ifeq ($(DEBUG), 1)
CFLAGS  += -O0 -D DEBUG
LDFLAGS += -O0 -g -Wl,--error-limit=0
else
CFLAGS  += -O3
LDFLAGS += -O3
endif

LDFLAGS_GAME := $(LDFLAGS) \
	--embed-file $(RES_DIR) \
	-sASYNCIFY \
	-sINITIAL_MEMORY=32mb \
	-sEXPORTED_FUNCTIONS=_start_game,_get_settings \
	-sEXPORTED_RUNTIME_METHODS=ccall,UTF8ToString

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

$(OUT_DIR)/%.js:
	@echo Building $*.js...
	@$(CXX) -o $(OUT_DIR)/$*.js $(OBJ) -L$(CORES_DIR) -l$* $(LDFLAGS_GAME) -sEXPORT_NAME=$* $(QUIET)

$(OUT_DIR)/tools.js:
	@echo Building tools.js...
	@$(CXX) -o $(OUT_DIR)/tools.js $(OBJ) $(LDFLAGS_TOOLS) -sEXPORT_NAME=tools $(QUIET)

clean:
	@rm -rf $(OBJ) $(OUT_DIR)

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^ $(QUIET)
