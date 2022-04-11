SRC_DIR := src
INC_DIR := inc
BIN_DIR := bin

TARGET   := $(BIN_DIR)/main.wasm
DOCUMENT := $(INC_DIR)/document.h

LIB_MATOYA   := lib/libmatoya.a
LIB_FREETYPE := lib/libfreetype.a
LIB_RMLUI    := lib/librmlui.a

include GNUmakefile.common

OBJ = \
	main.o \
	$(SRC_DIR)/rml/rml.o \
	$(SRC_DIR)/rml/event.o \
	$(SRC_DIR)/rml/file.o \
	$(SRC_DIR)/rml/render.o \
	$(SRC_DIR)/rml/system.o

CFLAGS   := -I$(INC_DIR) -I$(SRC_DIR)
CXXFLAGS := $(CFLAGS) -I../RmlUi/Include -fno-rtti -fno-exceptions
LD_FLAGS := -O3 -Llib -lrmlui -lrmldebug -lmatoya -lfreetype \
			-lwasi-emulated-mman -Wl,--allow-undefined -Wl,--export-table

all:
	@$(MAKE) --no-print-directory -j 8 clean
	@$(MAKE) --no-print-directory -j 8 $(LIB_MATOYA)
	@$(MAKE) --no-print-directory -j 8 $(LIB_FREETYPE)
	@$(MAKE) --no-print-directory -j 8 $(LIB_RMLUI)
	@$(MAKE) --no-print-directory -j 8 $(DOCUMENT)
	@$(MAKE) --no-print-directory -j 8 $(TARGET)

$(LIB_MATOYA):
	@$(MAKE) --no-print-directory -C lib -f GNUmakefile.matoya

$(LIB_FREETYPE):
	@$(MAKE) --no-print-directory -C lib -f GNUmakefile.freetype

$(LIB_RMLUI):
	@$(MAKE) --no-print-directory -C lib -f GNUmakefile.rmlui

$(DOCUMENT):
	@mkdir -p $(INC_DIR)
	@xxd -i assets/document.rml  >  $(DOCUMENT)
	@xxd -i assets/document.rcss >> $(DOCUMENT)
	@xxd -i assets/document.ttf  >> $(DOCUMENT)
	@cp lib/matoya/src/matoya.h $(INC_DIR)

$(TARGET): $(OBJ)
	@mkdir -p $(BIN_DIR)
	@$(CXX) $(LD_FLAGS) -o $(TARGET) $(OBJ)
	@cp assets/index.html $(BIN_DIR)
	@cp assets/matoya.js  $(BIN_DIR)

clean:
	@rm -rf $(OBJ) $(INC_DIR) $(BIN_DIR)

clean-all: clean
	-@$(MAKE) --no-print-directory -C lib -f GNUmakefile.matoya   clean
	-@$(MAKE) --no-print-directory -C lib -f GNUmakefile.freetype clean
	-@$(MAKE) --no-print-directory -C lib -f GNUmakefile.rmlui    clean
