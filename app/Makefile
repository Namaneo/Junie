TARGET := junie.wasm
BUILD  := development

SRC_DIR   := src
DEPS_DIR  := deps
LIB_DIR   := lib
CORES_DIR := cores
INC_DIR   := include
RES_DIR   := res
WEB_DIR   := web

OUT_DIR  := build
DIST_DIR := dist

LIBS  := matoya retro z
CORES := genesis melonds mgba quicknes snes9x

LIB_FILES  := $(LIBS:%=$(LIB_DIR)/lib%.a)
CORE_FILES := $(CORES:%=$(CORES_DIR)/lib%.a)

SRC := \
	$(SRC_DIR)/main.c \
	$(SRC_DIR)/app.c \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/video.c \
	$(SRC_DIR)/audio.c \
	$(SRC_DIR)/input.c \
	$(SRC_DIR)/enums.c \
	$(SRC_DIR)/state.c \
	$(SRC_DIR)/texture.c \
	$(SRC_DIR)/toolbox.c \
	$(SRC_DIR)/settings.c \
	$(SRC_DIR)/filesystem.c \
	$(SRC_DIR)/configuration.c

CFLAGS  := -Wall -I$(SRC_DIR) -I$(DEPS_DIR) -I$(INC_DIR) -Ilib/retro/include
LDFLAGS := \
	-L$(LIB_DIR) -L$(CORES_DIR) $(LIBS:%=-l%) $(CORES:%=-l%) \
	-fwasm-exceptions -sWASM -sINITIAL_MEMORY=1GB \
	-sERROR_ON_UNDEFINED_SYMBOLS=0 -sWARN_ON_UNDEFINED_SYMBOLS=0

ifeq ($(DEBUG), 1)
SRC     += $(SRC_DIR)/debug.c
CFLAGS  += -O0 -g -D DEBUG
LDFLAGS += \
	-Wl,--wrap=malloc,--wrap=calloc,--wrap=realloc,--wrap=free \
	-Wl,--wrap=MTY_Alloc,--wrap=MTY_Realloc,--wrap=MTY_Free
else
CFLAGS += -O3
endif

OBJ := $(SRC:.c=.o)

MAKEFLAGS += --no-print-directory

all: clean build

build: assets $(LIB_FILES) $(CORE_FILES)
	@echo Building $(TARGET)...
	@$(MAKE) $(OUT_DIR)/$(TARGET)

$(OUT_DIR)/$(TARGET): $(OBJ)
	@$(CXX) $(LDFLAGS) $(OBJ) -o $(OUT_DIR)/$(TARGET)

prepare:
	@mkdir -p $(OUT_DIR)
	@cp -R $(WEB_DIR)/* $(OUT_DIR)
	@sed -i $(OUT_DIR)/index.html -e "s/const junie_build = '.*';/const junie_build = '$(BUILD)';/"
	@cp $(LIB_DIR)/matoya/src/unix/web/matoya.js $(OUT_DIR)/deps
	@(cd $(OUT_DIR) && ln -s ../../demo/games games)
	@echo // $(BUILD) >> $(OUT_DIR)/service-worker.js
	@mkdir -p $(INC_DIR)
	@cp $(LIB_DIR)/matoya/src/matoya.h $(INC_DIR)
	@cp $(LIB_DIR)/retro/include/libretro.h $(INC_DIR)

assets: prepare
	@(cd ../ui/build && xxd -i index.html)     >  $(INC_DIR)/res_index.h
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
	@$(MAKE) -C $(LIB_DIR) -f Makefile.$*

$(CORES_DIR)/lib%.a:
	@$(MAKE) -C $(CORES_DIR) -f Makefile.$*

clean:
	@rm -rf $(OBJ) $(INC_DIR) $(OUT_DIR) $(DIST_DIR)

clean-all: $(LIBS:%=clean-lib-%) $(CORES:%=clean-core-%) clean

clean-lib-%:
	@$(MAKE) -C $(LIB_DIR) -f Makefile.$* clean

clean-core-%:
	@$(MAKE) -C $(CORES_DIR) -f Makefile.$* clean

%.o: %.c
	@$(CC) -c -o $@ $(CFLAGS) $^
