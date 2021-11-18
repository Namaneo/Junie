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

RUN git init
RUN make

# Build API
FROM mcr.microsoft.com/dotnet/sdk:5.0 as api

WORKDIR /app

ADD ./api/ ./

RUN dotnet publish -c Release -o publish

# Build UI
FROM node as ui

WORKDIR /app

ADD ./ui/package.json ./

RUN yarn install

ADD ./ui/ ./

RUN yarn ionic build

# Run Junie
FROM alpine AS runtime

WORKDIR /app

COPY --from=api /app/publish/ ./
COPY --from=app /app/bin/     ./app/
COPY --from=ui  /app/build/   ./ui/

ADD ./assets/ ./assets/

ENTRYPOINT [ "Junie" ]