TARGET := junie

WASI_SDK := $(HOME)/wasi-sdk-12.0
CC 	     := $(WASI_SDK)/bin/clang   --sysroot=$(WASI_SDK)/share/wasi-sysroot
CXX	     := $(WASI_SDK)/bin/clang++ --sysroot=$(WASI_SDK)/share/wasi-sysroot
AR       := $(WASI_SDK)/bin/ar

SRC_DIR   := src
LIB_DIR   := lib
CORES_DIR := cores
INC_DIR   := include

TMP_DIR  := tmp
OUT_DIR  := bin
DIST_DIR := dist

SYSTEM_DIR := system
ASSETS_DIR := assets
GAMES_DIR  := games

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
	$(SRC_DIR)/configuration.c
OBJ := $(SRC:.c=.o)

CFLAGS  := \
	-I$(SRC_DIR) -I$(INC_DIR) -Wall -O3
LDFLAGS := \
	-L$(LIB_DIR) -L$(CORES_DIR) \
	-lretro -lmatoya -lz \
	-Wl,--allow-undefined -Wl,--export-table \
	-O3

MAKEFLAGS += --no-print-directory

CORES := quicknes mgba snes9x genesis melonds

all: clean $(TARGET)

$(TARGET): $(CORES)
	@cp index.html settings.json web/* $(OUT_DIR)
	@cp $(LIB_DIR)/matoya/src/unix/web/matoya.js $(OUT_DIR)

$(CORES): deps $(OBJ)
	$(CXX) $(LDFLAGS) -l$@ $(OBJ) -o $(OUT_DIR)/$@.wasm

deps:
	@make -C $(LIB_DIR)
	@make -C $(CORES_DIR)
	@mkdir -p $(OUT_DIR) $(INC_DIR)
	@cp $(LIB_DIR)/matoya/src/matoya.h $(INC_DIR)
	@cp $(LIB_DIR)/retro/include/libretro.h $(INC_DIR)

clean:
	rm -rf $(OBJ) $(INC_DIR) $(OUT_DIR) $(DIST_DIR)

clean-all: clean
	-@make -C lib   clean
	-@make -C cores clean
