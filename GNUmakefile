TARGET  := junie

VERSION := 0.5.2
BUILD   := $(VERSION)-$(shell date +%s)

UI_DIR  := ui
APP_DIR := app
OUT_DIR := build

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

.PHONY: ui app

# Common

all: prepare deps ui app

deps:
	@$(MAKE) -C $(APP_DIR) BUILD=$(BUILD) deps

ui:
	@echo Building index.html...
	@yarn --cwd $(UI_DIR) $(QUIET)
	@yarn --cwd $(UI_DIR) rollup -c --environment BUILD:production $(QUIET)

app:
	@$(MAKE) -C $(APP_DIR) BUILD=$(BUILD)

prepare: clean
	@yarn --cwd $(UI_DIR) install $(QUIET)

# Watch

watch: prepare
	@bash -c "trap '$(MAKE) watch-end' EXIT; $(MAKE) watch-start;"

watch-start:
	@screen -S $(TARGET) -d -m python3 -m http.server -d $(APP_DIR)/build/ 8000
	@yarn --cwd $(UI_DIR) rollup -c --environment BUILD:development -w --watch.onEnd "$(MAKE) -C ../$(APP_DIR) DEBUG=1"

watch-end:
	@screen -S $(TARGET) -X quit

# Pack

pack: all
	@echo Packing Junie $(BUILD)...
	@mkdir $(OUT_DIR)
	@( cd $(APP_DIR)/$(OUT_DIR) && zip -r ../../$(OUT_DIR)/$(TARGET)-$(VERSION).zip `ls -I games` $(QUIET) )

# Clean

clean:
	@rm -rf $(OUT_DIR) $(APP_DIR)/$(OUT_DIR) $(UI_DIR)/$(OUT_DIR)

clean-all: clean
	@$(MAKE) -C app clean-all
