include Makefile.common

TARGET := junie.wasm

SRC_DIR   := src
DEPS_DIR  := deps
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

SRC := main.c \
	$(SRC_DIR)/app.c \
	$(SRC_DIR)/vfs.c \
	$(SRC_DIR)/wasi.c \
	$(SRC_DIR)/core.c \
	$(SRC_DIR)/video.c \
	$(SRC_DIR)/audio.c \
	$(SRC_DIR)/input.c \
	$(SRC_DIR)/enums.c \
	$(SRC_DIR)/state.c \
	$(SRC_DIR)/texture.c \
	$(SRC_DIR)/interop.c \
	$(SRC_DIR)/toolbox.c \
	$(SRC_DIR)/settings.c \
	$(SRC_DIR)/filesystem.c \
	$(SRC_DIR)/configuration.c \
	$(DEPS_DIR)/miniz.c
OBJ := $(SRC:.c=.o)

CFLAGS  := \
	-Wall -O3 -DMINIZ_NO_STDIO \
	-I$(SRC_DIR) -I$(DEPS_DIR) -I$(INC_DIR)
LDFLAGS := \
	-L$(LIB_DIR) -L$(CORES_DIR) $(LIBS:%=-l%) $(CORES:%=-l%) \
	-Wl,--allow-undefined -Wl,--export-table -Wl,-error-limit=0

MAKEFLAGS += --no-print-directory

all: clean $(OUT_DIR)/$(TARGET)

$(OUT_DIR)/$(TARGET): assets $(LIB_FILES) $(CORE_FILES) $(OBJ)
	$(CXX) $(LDFLAGS) $(OBJ) -o $(OUT_DIR)/$(TARGET)

assets: 
	@mkdir -p $(OUT_DIR) 
	@cp index.html $(OUT_DIR)
	@cp $(LIB_DIR)/matoya/src/unix/web/matoya.js $(OUT_DIR)
	@mkdir -p $(INC_DIR)
	@cp $(LIB_DIR)/matoya/src/matoya.h $(INC_DIR)
	@cp $(LIB_DIR)/retro/include/libretro.h $(INC_DIR)
	@xxd -i $(RES_DIR)/menu.png > $(INC_DIR)/res_menu.h
	@xxd -i $(RES_DIR)/loading.png > $(INC_DIR)/res_loading.h
	@xxd -i $(RES_DIR)/controller_left.png > $(INC_DIR)/res_controller_left.h
	@xxd -i $(RES_DIR)/controller_right.png > $(INC_DIR)/res_controller_right.h

$(LIB_DIR)/lib%.a:
	@make -C $(LIB_DIR) -f Makefile.$*

$(CORES_DIR)/lib%.a:
	@make -C $(CORES_DIR) -f Makefile.$*

clean:
	rm -rf $(OBJ) $(INC_DIR) $(OUT_DIR) $(DIST_DIR)

clean-all: $(LIBS:%=clean-lib-%) $(CORES:%=clean-core-%) clean

clean-lib-%:
	@make -C $(LIB_DIR) -f Makefile.$* clean

clean-core-%:
	@make -C $(CORES_DIR) -f Makefile.$* clean
