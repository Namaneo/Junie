TARGET := app/bin api/publish ui/build
OUTPUT := bin

all: $(TARGET)

pack: all
	rm -rf $(OUTPUT)
	cp -R api/publish bin
	cp -R app/bin     bin/app
	cp -R ui/build    bin/ui
	cp -R assets      bin/assets

app/bin:
	( cd app && make )

api/publish:
	( cd api && dotnet publish -c Release -r linux-x64 --self-contained -o publish )

ui/build:
	( cd ui && ionic build )

clean:
	rm -rf $(OUTPUT) $(TARGET)