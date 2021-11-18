# Build emulator
FROM debian AS app

WORKDIR /app

ENV HOME=/app
ENV TERM=vt100

RUN apt update
RUN apt install -y curl make clang wget git bsdmainutils

RUN wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/wasi-sdk-12.0-linux.tar.gz
RUN tar xvf wasi-sdk-12.0-linux.tar.gz

ADD ./app/ ./

RUN make

# Build API
FROM mcr.microsoft.com/dotnet/sdk:5.0 as api

WORKDIR /app

ADD ./api/ ./

RUN dotnet publish -c Release -o publish

# Build UI
FROM node:16 as ui

WORKDIR /app

ADD ./ui/package.json ./
ADD ./ui/yarn.lock    ./

RUN yarn install

ADD ./ui/ ./

RUN yarn ionic build

# Run Junie
FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS runtime

WORKDIR /app

COPY --from=api /app/publish/ ./
COPY --from=app /app/bin/     ./app/
COPY --from=ui  /app/build/   ./ui/

ADD ./assets/ ./assets/

ENTRYPOINT [ "dotnet", "Junie.dll" ]
