SRC_DIR   := sources
INC_DIR   := include
RES_DIR   := assets
OUT_DIR   := build

CORES      := genesis melonds mgba nestopia snes9x
CORES_DIR  := cores
CORE_FILES := $(CORES:%=$(CORES_DIR)/lib%.so)
BIN_FILES  := $(CORES:%=$(OUT_DIR)/%.js) $(OUT_DIR)/tools.js

SRC := \
	$(SRC_DIR)/main.c \
	$(SRC_DIR)/app.c \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/video.c \
	$(SRC_DIR)/audio.c \
	$(SRC_DIR)/input.c \
	$(SRC_DIR)/state.c \
	$(SRC_DIR)/image.c \
	$(SRC_DIR)/interop.c \
	$(SRC_DIR)/texture.c \
	$(SRC_DIR)/filesystem.c \
	$(SRC_DIR)/configuration.c

PORTS := \
	-sUSE_ZLIB \
	-sUSE_LIBPNG

OPTIONS := \
	-sMODULARIZE \
	-sEXPORT_ES6 \
	-sSINGLE_FILE \
	-sWASM_BIGINT \
	-sALLOW_MEMORY_GROWTH \
	-sLLD_REPORT_UNDEFINED

OPTIONS_GAME := $(OPTIONS) \
	-sASYNCIFY \
	-sINITIAL_MEMORY=32mb \
	-sMIN_WEBGL_VERSION=2 \
	-sEXPORTED_FUNCTIONS=_start_game,_get_settings \
	-sEXPORTED_RUNTIME_METHODS=ccall,UTF8ToString

OPTIONS_TOOLS := $(OPTIONS) \
	-sEXPORTED_RUNTIME_METHODS=UTF8ToString,IDBStore

CFLAGS  := -I$(SRC_DIR) -I$(INC_DIR) $(PORTS) -fPIC
LDFLAGS := $(PORTS) -Llibraries -lmatoya --no-entry --js-library res/library.js

ifeq ($(DEBUG), 1)
SRC     += $(SRC_DIR)/debug.c
CFLAGS  += -O0 -D DEBUG
LDFLAGS += -O0 -g -Wl,--error-limit=0
else
CFLAGS  += -O3
LDFLAGS += -O3
endif

OBJ := $(SRC:.c=.o)

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

.SECONDARY: $(OBJ)

all: clean prepare $(CORE_FILES)
	@echo Building objects...
	@$(MAKE) -s $(OBJ)
	@$(MAKE) -s $(BIN_FILES)

prepare:
	@mkdir -p $(OUT_DIR)
	@xxd -i $(RES_DIR)/menu/toggle_audio.png    >  $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/toggle_gamepad.png  >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/save_state.png      >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/restore_state.png   >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/fast_forward.png    >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/exit.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/a.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/b.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/x.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/y.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/l.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/r.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/up.png           >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/down.png         >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/left.png         >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/right.png        >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/gamepad/start_select.png >> $(INC_DIR)/res_inputs.h

$(CORES_DIR)/lib%.so:
	@$(MAKE) -C $(CORES_DIR) name=$*

$(OUT_DIR)/%.js:
	@echo Building $*.js...
	@$(CXX) -o $(OUT_DIR)/$*.js $(OBJ) -L$(CORES_DIR) -l$* $(LDFLAGS) $(OPTIONS_GAME) -sEXPORT_NAME=$* $(QUIET)

$(OUT_DIR)/tools.js:
	@echo Building tools.js...
	@$(CXX) -o $(OUT_DIR)/tools.js $(OBJ) $(LDFLAGS) $(OPTIONS_TOOLS) -sEXPORT_NAME=tools $(QUIET)

clean:
	@rm -rf $(OBJ) $(OUT_DIR)

clean-all: $(CORES:%=clean-core-%) clean

clean-core-%:
	@$(MAKE) -C $(CORES_DIR) name=$* clean

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^ $(QUIET)
