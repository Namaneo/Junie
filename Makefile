TARGET  := junie
VERSION := 0.5.0

UI_DIR  := ui
APP_DIR := app
OUT_DIR := build

all: prepare
	@yarn --cwd $(UI_DIR) rollup -c --environment BUILD:production
	@make -C $(APP_DIR)

watch: prepare
	@bash -c "trap '$(MAKE) watch-end' EXIT; $(MAKE) watch-start;"

watch-start:
	@screen -S $(TARGET) -d -m python3 -m http.server -d $(APP_DIR)/build/ 8000
	@yarn --cwd $(UI_DIR) rollup -c --environment BUILD:development -w --watch.onEnd "make -C ../$(APP_DIR)"

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
	@make -C app clean-all
