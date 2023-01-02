# Build
FROM emscripten/emsdk AS build

WORKDIR /junie

RUN apt update
RUN npm install -g yarn

ADD GNUmakefile .

ADD ./ui/package.json ./ui/package.json
RUN emmake make prepare

ADD ./cores ./cores
ADD ./app ./app
RUN emmake make app

ADD ./ui ./ui
RUN emmake make ui

# Run
FROM alpine AS run

WORKDIR /junie

RUN apk add python3

COPY --from=build /junie/ui/build .

CMD python3 -m http.server ${PORT:-8000}
