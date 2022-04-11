SRC_DIR = src
INC_DIR = inc
LIB_DIR = lib

TARGET   = main.exe
DOCUMENT = $(INC_DIR)\document.h

LIB_MATOYA   = $(LIB_DIR)\matoya.lib
LIB_FREETYPE = $(LIB_DIR)\freetype.lib
LIB_RMLUI    = $(LIB_DIR)\rmlui.lib
LIB_RMLDEBUG = $(LIB_DIR)\rmldebug.lib

OBJ = \
	main.obj \
	$(SRC_DIR)\rml\rml.obj \
	$(SRC_DIR)\rml\event.obj \
	$(SRC_DIR)\rml\file.obj \
	$(SRC_DIR)\rml\render.obj \
	$(SRC_DIR)\rml\system.obj

CFLAGS   = -I$(INC_DIR) -I$(SRC_DIR) /MT /MP /O2 /Ob2 /nologo
CPPFLAGS = $(CFLAGS) -I$(LIB_DIR)\rmlui\Include /EHsc

LIBS = \
	$(LIB_MATOYA) \
	$(LIB_FREETYPE) \
	$(LIB_RMLUI) \
	$(LIB_RMLDEBUG)

SYS_LIBS = \
	shlwapi.lib \
	shell32.lib \
	user32.lib \
	userenv.lib \
	ws2_32.lib \
	imm32.lib \
	advapi32.lib \
	dxguid.lib \
	winmm.lib \
	gdi32.lib \
	bcrypt.lib \
	secur32.lib \
	crypt32.lib \
	opengl32.lib \
	xinput9_1_0.lib \
	windowscodecs.lib \
	d3d9.lib \
	d3d11.lib \
	hid.lib \
	ole32.lib \
	winhttp.lib

all:
	@nmake /nologo clean
	@nmake /nologo $(LIB_MATOYA)
	@nmake /nologo $(LIB_FREETYPE)
	@nmake /nologo $(LIB_RMLUI)
	@nmake /nologo $(DOCUMENT)
	@nmake /nologo $(TARGET)

$(LIB_MATOYA):
	@cd lib
	@nmake /nologo -f makefile.matoya

$(LIB_FREETYPE):
	@cd lib
	@nmake /nologo -f makefile.freetype

$(LIB_RMLUI):
	@cd lib
	@nmake /nologo -f makefile.rmlui

$(DOCUMENT):
	-@mkdir $(INC_DIR) 2> NUL
	@wsl xxd -i assets/document.rml  >  $(DOCUMENT).rml
	@wsl xxd -i assets/document.rcss >> $(DOCUMENT).rcss
	@wsl xxd -i assets/document.ttf  >> $(DOCUMENT).ttf
	@copy $(DOCUMENT).rml+$(DOCUMENT).rcss+$(DOCUMENT).ttf $(DOCUMENT)
	@del /F /Q $(DOCUMENT).rml $(DOCUMENT).rcss $(DOCUMENT).ttf
	@copy lib\matoya\src\matoya.h $(INC_DIR)

$(TARGET): $(OBJ)
	@link /nologo /out:$(TARGET) *.obj $(LIBS) $(SYS_LIBS)

clean:
	-@del /F /Q *.obj *.pdb *.ilk $(TARGET)
	-@rmdir /Q /S $(INC_DIR)

clean-all: clean
	@cd lib
	-@nmake /nologo -f makefile.matoya   clean
	-@nmake /nologo -f makefile.freetype clean
	-@nmake /nologo -f makefile.rmlui    clean
