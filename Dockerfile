# Build app
FROM emscripten/emsdk AS app

WORKDIR /junie

RUN apt update
RUN apt install -y xxd

ADD GNUmakefile .
ADD ./app ./app

RUN emmake make app

# Build UI
FROM node AS ui

WORKDIR /junie

RUN apt update
RUN apt install -y make

ADD GNUmakefile .
COPY --from=app /junie/app/build ./app/build
ADD ./ui ./ui

RUN make ui

# Run
FROM alpine AS junie

WORKDIR /junie

RUN apk --no-cache add python3

COPY --from=ui /junie/ui/build .

CMD python3 -m http.server ${PORT:-8000}
