TARGET  := junie
VERSION := 0.6.0-$(shell date +%s)

ifeq ($(DEBUG), 1)
BUILD := development
else
BUILD := production
endif

CORES_DIR := cores
APP_DIR   := app
UI_DIR    := ui
OUT_DIR   := build

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

UI_FLAGS := --version $(VERSION)
ifeq ($(DEBUG), 1)
UI_FLAGS += --debug
endif
ifneq ($(UI_ONLY), 1)
UI_FLAGS += --command "$(MAKE) -C ../$(APP_DIR) DEBUG=$(DEBUG)"
endif

.PHONY: cores app ui

# Build

all: clean prepare cores app ui

cores:
	@$(MAKE) -C $(CORES_DIR) DEBUG=$(DEBUG)

app:
	@$(MAKE) -C $(APP_DIR) DEBUG=$(DEBUG)

ui:
	@echo Building application...
	@( cd ui && node esbuild.mjs $(UI_FLAGS) $(QUIET) )

# Watch

watch: clean prepare cores
	@( cd ui && node esbuild.mjs --watch $(UI_FLAGS) )

# Common

prepare:
	@echo Fetching dependencies...
	@yarn --cwd $(UI_DIR) install $(QUIET)

# Pack

pack: all
	@echo Packing Junie $(VERSION)...
	@mkdir $(OUT_DIR)
	@( cd $(UI_DIR)/$(OUT_DIR) && zip -r ../../$(OUT_DIR)/$(TARGET)-$(VERSION).zip `ls -I games` $(QUIET) )

# Clean

clean:
	@$(MAKE) -C $(APP_DIR) clean
	@rm -rf $(OUT_DIR) $(APP_DIR)/$(OUT_DIR) $(UI_DIR)/$(OUT_DIR)

clean-all: clean
	@$(MAKE) -C $(CORES_DIR) clean
