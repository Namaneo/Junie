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

UI_FLAGS := \
	--environment BUILD:$(BUILD) \
	--environment VERSION:$(VERSION)

.PHONY: cores app ui

# Build

all: clean prepare cores app ui

cores:
	@$(MAKE) -C $(CORES_DIR) DEBUG=$(DEBUG)

app:
	@$(MAKE) -C $(APP_DIR) DEBUG=$(DEBUG)

ui:
	@echo Building index.html...
	@yarn --cwd $(UI_DIR) rollup -c $(UI_FLAGS) $(QUIET)

# Watch

watch: clean prepare
	@bash -c "trap '$(MAKE) watch-end' EXIT; $(MAKE) watch-start;"

watch-start:
	@screen -S $(TARGET) -d -m python3 -m http.server -d $(UI_DIR)/build/ 8000
	@yarn --cwd $(UI_DIR) rollup -c $(UI_FLAGS) -w --watch.onStart "$(MAKE) -C ../$(APP_DIR) DEBUG=$(DEBUG)"

watch-end:
	@screen -S $(TARGET) -X quit

# Common

prepare:
	@echo Fetching dependencies...
	@yarn --cwd $(UI_DIR) install $(QUIET)

# Pack

pack: all
	@echo Packing Junie $(BUILD)...
	@mkdir $(OUT_DIR)
	@( cd $(UI_DIR)/$(OUT_DIR) && zip -r ../../$(OUT_DIR)/$(TARGET)-$(VERSION).zip `ls -I games` $(QUIET) )

# Clean

clean:
	@$(MAKE) -C $(APP_DIR) clean
	@rm -rf $(OUT_DIR) $(APP_DIR)/$(OUT_DIR) $(UI_DIR)/$(OUT_DIR)

clean-all: clean
	@$(MAKE) -C $(CORES_DIR) clean
