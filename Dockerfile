# Build UI
FROM node AS ui

WORKDIR /junie

RUN apt update
RUN apt install -y make

ADD Makefile .
ADD ./ui ./ui

RUN make ui

# Build app
FROM emscripten/emsdk AS app

WORKDIR /junie

RUN apt update
RUN apt install -y xxd

ADD Makefile .
COPY --from=ui /junie/ui/build ./ui/build
ADD ./app ./app

RUN emmake make app

# Run
FROM alpine AS junie

WORKDIR /junie

RUN apk --no-cache add python3

COPY --from=app /junie/app/build .

CMD python3 -m http.server ${PORT:-8000}
