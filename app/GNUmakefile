SRC_DIR := sources
OUT_DIR := build

CORES_DIR := ../cores
LIBRARIES := $(shell jq -r 'keys[]' $(CORES_DIR)/cores.json)
BINARIES  := $(LIBRARIES:%=$(OUT_DIR)/lib%.js)

SRC := \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/tools.c \
	$(SRC_DIR)/filesystem.c

OBJ := $(SRC:.c=.o)

CFLAGS  := \
	-I$(SRC_DIR) \
	-msimd128 -fPIC -Wno-switch

LDFLAGS := \
	--no-entry -fwasm-exceptions \
	-sMODULARIZE -sEXPORT_ES6 \
	-sTOTAL_MEMORY=600mb -sIMPORTED_MEMORY \
	-sEXPORTED_FUNCTIONS=@exports.json \
	-sEXPORTED_RUNTIME_METHODS=ccall,cwrap

ifeq ($(DEBUG), 1)
CFLAGS  += -O0 -ferror-limit=0 -D DEBUG
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

$(OUT_DIR)/lib%.js:
	@echo Building lib$*.js...
	@$(CXX) -o $(OUT_DIR)/lib$*.js $(OBJ) -L$(CORES_DIR) -l$* $(LDFLAGS) -sEXPORT_NAME=lib$* $(QUIET)

clean:
	@rm -rf $(OBJ) $(OUT_DIR)

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^ $(QUIET)
