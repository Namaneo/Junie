# Build
FROM emscripten/emsdk AS build

WORKDIR /junie

RUN apt update
RUN apt install -y jq
RUN npm install -g yarn

ADD GNUmakefile .

ADD ./ui/package.json ./ui/package.json
RUN emmake make prepare

ADD ./cores ./cores
RUN emmake make cores

ADD ./app ./app
RUN emmake make app

ADD ./ui ./ui
RUN emmake make ui

# Run
FROM node:alpine AS run

WORKDIR /junie

RUN npm install --global http-server

COPY --from=build /junie/ui/build .

CMD http-server . --port ${PORT:-8000} --cors -c-1
