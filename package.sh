#TODO multiple makefiles
#TODO docker execution

# Build emulator
( cd app && make )

# Build web server
( cd api && dotnet publish -c Release -o publish )

# Build web interface
( cd ui  && ionic build )

rm -rf bin
cp -R api/publish bin
cp -R app/bin     bin/app
cp -R ui/build    bin/ui
cp -R assets      bin/assets