TARGET  := junie
VERSION := 0.4.1

APP_OUT := app/build
API_OUT := api/build
UI_OUT  := ui/build

OUT := bin

all: $(APP_OUT) $(API_OUT) $(UI_OUT)

$(APP_OUT):
	( cd app && make )

$(API_OUT):
	( cd api && env GOOS=linux   GOARCH=amd64 go build -o build/linux/junie       )
	( cd api && env GOOS=darwin  GOARCH=amd64 go build -o build/macos/junie       )
	( cd api && env GOOS=windows GOARCH=amd64 go build -o build/windows/junie.exe )

$(UI_OUT):
	( cd ui && yarn && ionic build )

pack: all
	rm -rf $(OUT)
	mkdir $(OUT)
	cp -R $(APP_OUT) $(OUT)/app
	cp -R $(UI_OUT)  $(OUT)/ui
	cp -R assets     $(OUT)/assets
	( cd $(OUT) && zip -r $(TARGET)-linux-$(VERSION).zip   app ui assets )
	( cd $(OUT) && zip -r $(TARGET)-macos-$(VERSION).zip   app ui assets )
	( cd $(OUT) && zip -r $(TARGET)-windows-$(VERSION).zip app ui assets )
	zip -rjv $(OUT)/$(TARGET)-linux-$(VERSION).zip   $(API_OUT)/linux/junie
	zip -rjv $(OUT)/$(TARGET)-macos-$(VERSION).zip   $(API_OUT)/linux/junie
	zip -rjv $(OUT)/$(TARGET)-windows-$(VERSION).zip $(API_OUT)/windows/junie.exe

clean:
	rm -rf $(APP_OUT) $(API_OUT) $(UI_OUT)

clean-all: clean
	make -C app clean-all
