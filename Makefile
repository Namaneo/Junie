TARGET  := junie
VERSION := 0.3.0

APP_OUT := app/build
API_OUT := api/build
UI_OUT  := ui/build

OUT := bin

all: $(OUT)

$(OUT): $(APP_OUT) $(API_OUT) $(UI_OUT)

$(APP_OUT):
	( cd app && make )

$(API_OUT):
	( cd api && env GOOS=linux   GOARCH=amd64 go build -o build/junie     )
	( cd api && env GOOS=windows GOARCH=amd64 go build -o build/junie.exe )

$(UI_OUT):
	( cd ui && ionic build )

pack: all
	rm -rf $(TARGET)
	cp -R $(API_OUT) $(TARGET)
	cp -R $(APP_OUT) $(TARGET)/app
	cp -R $(UI_OUT)  $(TARGET)/ui
	cp -R assets     $(TARGET)/assets
	zip -r $(TARGET)/$(TARGET)-$(VERSION).zip $(TARGET)

clean:
	rm -rf $(OUT) $(APP_OUT) $(API_OUT) $(UI_OUT)

clean-all: clean
	make -C app clean-all
