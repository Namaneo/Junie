TARGET  := junie

VERSION := 0.5.2
BUILD   := $(VERSION)-$(shell date +%s)

UI_DIR  := ui
APP_DIR := app
OUT_DIR := build

MAKEFLAGS += --no-print-directory

all: prepare
	@yarn --cwd $(UI_DIR) rollup -c --environment BUILD:production
	@$(MAKE) -C $(APP_DIR) BUILD=$(BUILD)

watch: prepare
	@bash -c "trap '$(MAKE) watch-end' EXIT; $(MAKE) watch-start;"

watch-start:
	@screen -S $(TARGET) -d -m python3 -m http.server -d $(APP_DIR)/build/ 8000
	@yarn --cwd $(UI_DIR) rollup -c --environment BUILD:development -w --watch.onEnd "$(MAKE) -C ../$(APP_DIR) DEBUG=1"

watch-end:
	@screen -S $(TARGET) -X quit

prepare: clean
	@mkdir $(OUT_DIR)
	@yarn --cwd $(UI_DIR) install

pack: all
	@( cd $(APP_DIR)/$(OUT_DIR) && zip -r ../../$(OUT_DIR)/$(TARGET)-$(VERSION).zip `ls -I games` )

clean:
	@rm -rf $(OUT_DIR) $(APP_DIR)/$(OUT_DIR) $(UI_DIR)/$(OUT_DIR)

clean-all: clean
	@$(MAKE) -C app clean-all
