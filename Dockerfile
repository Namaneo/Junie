# Build
FROM node AS build

WORKDIR /root

RUN wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/wasi-sdk-20.0-linux.tar.gz
RUN tar xvf wasi-sdk-20.0-linux.tar.gz

WORKDIR /junie

RUN apt update
RUN apt install -y jq

ADD GNUmakefile .
ADD GNUmakefile.common .

ADD ./ui/package.json ./ui/package.json
RUN make prepare

ADD ./cores ./cores
RUN make cores

ADD ./app ./app
RUN make app

ADD ./ui ./ui
RUN make ui

# Run
FROM node:alpine AS run

WORKDIR /junie

RUN npm install --global http-server

COPY --from=build /junie/ui/build .

CMD http-server . --port ${PORT:-8000} --cors -c-1
