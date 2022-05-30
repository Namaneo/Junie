TARGET  := junie
VERSION := 0.5.0

UI_DIR  := ui
APP_DIR := app
OUT_DIR := build

all: clean
	@mkdir $(OUT_DIR)
	@( cd $(UI_DIR)  && yarn && yarn rollup -c --environment BUILD:production )
	@( cd $(APP_DIR) && make )

pack: all
	@( cd $(APP_DIR)/$(OUT_DIR) && zip -r ../../$(OUT_DIR)/$(TARGET)-$(VERSION).zip `ls -I games` )

clean:
	@rm -rf $(OUT_DIR) $(APP_DIR)/$(OUT_DIR) $(UI_DIR)/$(OUT_DIR)

clean-all: clean
	@make -C app clean-all
