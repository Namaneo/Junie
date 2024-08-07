TARGET  := junie
VERSION := 0.7.1-$(shell date +%s)

ifeq ($(DEBUG), 1)
BUILD := development
else
BUILD := production
endif

DEPS_DIR  := deps
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
ifeq ($(UI_ONLY), 1)
WATCH_CMD := $(MAKE) -C $(APP_DIR) DEBUG=$(DEBUG)
else
UI_FLAGS += --command "$(MAKE) -C ../$(APP_DIR) DEBUG=$(DEBUG)"
endif

.PHONY: deps cores app ui

# Build

all: clean prepare deps cores app ui

deps:
	@$(MAKE) -C $(DEPS_DIR)

cores:
	@$(MAKE) -C $(CORES_DIR)

app:
	@$(MAKE) -C $(APP_DIR) DEBUG=$(DEBUG)

ui:
	@echo Building application...
	@( cd ui && node esbuild.mjs $(UI_FLAGS) $(QUIET) )

# Watch

watch: clean prepare deps cores
	@$(WATCH_CMD)
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
	@$(MAKE) -C $(DEPS_DIR) clean
	@$(MAKE) -C $(CORES_DIR) clean
