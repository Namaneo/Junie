TARGET := junie
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

CFLAGS := \
	-Wall -DJUNIE_BUILD="\"$(BUILD)"\" \
	-I$(SRC_DIR) -I$(DEPS_DIR) -I$(INC_DIR) -Ilib/retro/include
LDFLAGS := -L$(CORES_DIR) $(CORES:%=-l%) -L$(LIB_DIR) $(LIBS:%=-l%)
PREPARE := prepare

TARGET := $(TARGET).wasm
PREPARE += prepare-web
LDFLAGS += \
	-sERROR_ON_UNDEFINED_SYMBOLS=0 -sWARN_ON_UNDEFINED_SYMBOLS=0 \
	-sSTANDALONE_WASM -sINITIAL_MEMORY=250MB

ifeq ($(DEBUG), 1)
CFLAGS  += -O0 -D DEBUG
SRC     += $(SRC_DIR)/debug.c
LDFLAGS += -g -Wl,--wrap=malloc,--wrap=calloc,--wrap=realloc,--wrap=free
else
CFLAGS += -O3
endif

OBJ := $(SRC:.c=.o)

MAKEFLAGS += --no-print-directory

all: clean deps build

deps: $(LIB_FILES) $(CORE_FILES)

build: deps assets
	@echo Building $(TARGET)...
	@$(MAKE) $(OUT_DIR)/$(TARGET)

$(OUT_DIR)/$(TARGET): $(OBJ)
	@$(CXX) -o $(OUT_DIR)/$(TARGET) $(OBJ) $(LDFLAGS)

prepare:
	@mkdir -p $(INC_DIR) $(OUT_DIR)
	@cp $(LIB_DIR)/matoya/src/matoya.h $(INC_DIR)
	@cp $(LIB_DIR)/retro/include/libretro.h $(INC_DIR)

prepare-web:
	@(cd $(OUT_DIR) && if [ -e ../../games ]; then ln -s ../../games games; fi;)
	@cp -R $(WEB_DIR)/* $(OUT_DIR)
	@sed -i $(OUT_DIR)/index.html -e "s/const junie_build = '.*';/const junie_build = '$(BUILD)';/"
	@cp $(LIB_DIR)/matoya/src/unix/web/matoya.js $(OUT_DIR)/deps
	@echo // $(BUILD) >> $(OUT_DIR)/service-worker.js

assets: $(PREPARE)
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
	@$(MAKE) -C $(LIB_DIR) name=$*

$(CORES_DIR)/lib%.a:
	@$(MAKE) -C $(CORES_DIR) name=$*

clean:
	@rm -rf $(OBJ) $(INC_DIR) $(OUT_DIR) $(DIST_DIR)

clean-all: $(LIBS:%=clean-lib-%) $(CORES:%=clean-core-%) clean

clean-lib-%:
	@$(MAKE) -C $(LIB_DIR) name=$* clean

clean-core-%:
	@$(MAKE) -C $(CORES_DIR) name=$* clean

%.o: %.c
	@$(CC) -c $(CFLAGS) -o $@ $^
