TARGET := app/build api/build ui/build
OUTPUT := bin

all: $(TARGET)

pack: all
	rm -rf $(OUTPUT)
	cp -R api/build bin
	cp -R app/build bin/app
	cp -R ui/build  bin/ui
	cp -R assets    bin/assets

app/build:
	( cd app && make )

api/build:
	( cd api && env GOOS=linux   GOARCH=amd64 go build -o build/junie     )
	( cd api && env GOOS=windows GOARCH=amd64 go build -o build/junie.exe )
	( cd api && env GOOS=darwin  GOARCH=amd64 go build -o build/junie-osx )

ui/build:
	( cd ui && ionic build )

clean:
	rm -rf $(OUTPUT) $(TARGET)