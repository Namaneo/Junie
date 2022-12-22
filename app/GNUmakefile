SRC_DIR   := src
LIB_DIR   := lib
CORES_DIR := cores
INC_DIR   := include
RES_DIR   := res

OUT_DIR  := build
DIST_DIR := dist

LIBS  := matoya retro z
CORES := genesis melonds mgba quicknes snes9x

LIB_FILES  := $(LIBS:%=$(LIB_DIR)/lib%.a)
CORE_FILES := $(CORES:%=$(CORES_DIR)/lib%.a)
BIN_FILES  := $(CORES:%=$(OUT_DIR)/%.js) $(OUT_DIR)/tools.js

SRC := \
	$(SRC_DIR)/main.c \
	$(SRC_DIR)/app.c \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/video.c \
	$(SRC_DIR)/audio.c \
	$(SRC_DIR)/input.c \
	$(SRC_DIR)/tools.c \
	$(SRC_DIR)/enums.c \
	$(SRC_DIR)/state.c \
	$(SRC_DIR)/interop.c \
	$(SRC_DIR)/texture.c \
	$(SRC_DIR)/toolbox.c \
	$(SRC_DIR)/settings.c \
	$(SRC_DIR)/filesystem.c \
	$(SRC_DIR)/configuration.c

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
	-sEXPORTED_FUNCTIONS=_start_game,_get_settings,_MTY,_calloc,_free \
	-sEXPORTED_RUNTIME_METHODS=ccall,UTF8ToString

OPTIONS_TOOLS := $(OPTIONS) \
	-sEXPORTED_FUNCTIONS=_get_languages \
	-sEXPORTED_RUNTIME_METHODS=UTF8ToString,IDBStore

CFLAGS  := -I$(SRC_DIR) -I$(INC_DIR) -Ilib/retro/include -fPIC
LDFLAGS := -L$(LIB_DIR) $(LIBS:%=-l%) --no-entry --js-library res/library.js -Wno-limited-postlink-optimizations

ifeq ($(DEBUG), 1)
SRC     += $(SRC_DIR)/debug.c
CFLAGS  += -O0 -D DEBUG
LDFLAGS += -O0 -g -Wl,--error-limit=0
else
CFLAGS  += -O3
LDFLAGS += -O3
endif

OBJ := $(SRC:.c=.o)

MAKEFLAGS += --no-print-directory

.SECONDARY: $(OBJ)

all: clean prepare $(LIB_FILES) $(CORE_FILES)
	@echo Building objects...
	@$(MAKE) -s $(OBJ)
	@$(MAKE) -s $(BIN_FILES)

prepare:
	@mkdir -p $(INC_DIR) $(OUT_DIR)
	@cp $(LIB_DIR)/matoya/src/matoya.h $(INC_DIR)
	@cp $(LIB_DIR)/retro/include/libretro.h $(INC_DIR)
	@xxd -i $(RES_DIR)/menu/toggle_audio.png   >  $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/toggle_gamepad.png >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/save_state.png     >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/restore_state.png  >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/fast_forward.png   >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/menu/exit.png           >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/a.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/b.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/x.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/y.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/l.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/r.png            >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/up.png           >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/down.png         >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/left.png         >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/right.png        >> $(INC_DIR)/res_inputs.h
	@xxd -i $(RES_DIR)/joypad/start_select.png >> $(INC_DIR)/res_inputs.h

$(LIB_DIR)/lib%.a:
	@$(MAKE) -C $(LIB_DIR) name=$*

$(CORES_DIR)/lib%.a:
	@$(MAKE) -C $(CORES_DIR) name=$*

$(OUT_DIR)/%.js:
	@echo Building $*.js...
	$(CXX) -o $(OUT_DIR)/$*.js $(OBJ) -L$(CORES_DIR) -l$* $(LDFLAGS) $(OPTIONS_GAME) -sEXPORT_NAME=$*

$(OUT_DIR)/tools.js:
	@echo Building tools.js...
	$(CXX) -o $(OUT_DIR)/tools.js $(OBJ) $(LDFLAGS) $(OPTIONS_TOOLS) -sEXPORT_NAME=tools

clean:
	@rm -rf $(OBJ) $(INC_DIR) $(OUT_DIR) $(DIST_DIR)

clean-all: $(LIBS:%=clean-lib-%) $(CORES:%=clean-core-%) clean

clean-lib-%:
	@$(MAKE) -C $(LIB_DIR) name=$* clean

clean-core-%:
	@$(MAKE) -C $(CORES_DIR) name=$* clean

%.o: %.c
	$(CC) -c $(CFLAGS) -o $@ $^
