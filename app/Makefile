TARGET := junie

include Makefile.common

SRC_DIR   := src
LIB_DIR   := lib
CORES_DIR := cores
INC_DIR   := include

OUT_DIR  := build
DIST_DIR := dist

OBJ := main.o \
	$(SRC_DIR)/app.o \
	$(SRC_DIR)/vfs.o \
	$(SRC_DIR)/wasi.o \
	$(SRC_DIR)/core.o \
	$(SRC_DIR)/video.o \
	$(SRC_DIR)/audio.o \
	$(SRC_DIR)/input.o \
	$(SRC_DIR)/enums.o \
	$(SRC_DIR)/state.o \
	$(SRC_DIR)/texture.o \
	$(SRC_DIR)/interop.o \
	$(SRC_DIR)/toolbox.o \
	$(SRC_DIR)/settings.o \
	$(SRC_DIR)/filesystem.o \
	$(SRC_DIR)/configuration.o \
	$(SRC_DIR)/rml/rml.o \
	$(SRC_DIR)/rml/file.o \
	$(SRC_DIR)/rml/render.o \
	$(SRC_DIR)/rml/system.o

CFLAGS   := -Wall -O3 -I$(SRC_DIR) -I$(INC_DIR)
CXXFLAGS := $(CFLAGS) -I$(LIB_DIR)/rmlui/Include

LDFLAGS := \
	-L$(LIB_DIR) -L$(CORES_DIR) \
	-lretro -lmatoya -lfreetype -lrmlui -lrmldebug \
	-Wl,--allow-undefined -Wl,--export-table \
	-O3

MAKEFLAGS += --no-print-directory

CORES := quicknes mgba snes9x genesis melonds

all:
	@make -j 8 clean
	@make -j 8 deps
	@make -j 8 $(TARGET)

$(TARGET): $(CORES)
	@cp index.html web/* $(OUT_DIR)
	@cp $(LIB_DIR)/matoya/src/unix/web/matoya.js $(OUT_DIR)

$(CORES): $(OBJ)
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
