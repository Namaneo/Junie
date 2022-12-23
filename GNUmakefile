TARGET  := junie
VERSION := 0.6.0-$(shell date +%s)

ifeq ($(DEBUG), 1)
BUILD := development
else
BUILD := production
endif

UI_DIR  := ui
APP_DIR := app
OUT_DIR := build

QUIET := > /dev/null 2>&1
MAKEFLAGS += --no-print-directory

UI_FLAGS := \
	--environment BUILD:$(BUILD) \
	--environment VERSION:$(VERSION)

.PHONY: app ui

# Common

all: clean app ui

app:
	@$(MAKE) -C $(APP_DIR) DEBUG=$(DEBUG)

ui: prepare
	@echo Building index.html...
	@yarn --cwd $(UI_DIR) rollup -c $(UI_FLAGS) $(QUIET)

prepare:
	@yarn --cwd $(UI_DIR) install $(QUIET)

# Watch

watch: clean prepare
	@bash -c "trap '$(MAKE) watch-end' EXIT; $(MAKE) watch-start;"

watch-start:
	@screen -S $(TARGET) -d -m python3 -m http.server -d $(UI_DIR)/build/ 8000
	@yarn --cwd $(UI_DIR) rollup -c $(UI_FLAGS) -w --watch.onStart "$(MAKE) -C ../$(APP_DIR) DEBUG=$(DEBUG)"

watch-end:
	@screen -S $(TARGET) -X quit

# Pack

pack: all
	@echo Packing Junie $(BUILD)...
	@mkdir $(OUT_DIR)
	@( cd $(UI_DIR)/$(OUT_DIR) && zip -r ../../$(OUT_DIR)/$(TARGET)-$(VERSION).zip `ls -I games` $(QUIET) )

# Clean

clean:
	@rm -rf $(OUT_DIR) $(APP_DIR)/$(OUT_DIR) $(UI_DIR)/$(OUT_DIR)

clean-all: clean
	@$(MAKE) -C app clean-all
