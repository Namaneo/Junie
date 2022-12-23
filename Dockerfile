# Build
FROM emscripten/emsdk AS build

WORKDIR /junie

RUN apt update
RUN apt install -y xxd bsdmainutils
RUN npm install -g yarn

ADD GNUmakefile .
ADD ./app ./app
ADD ./ui ./ui

ENV TERM=xterm
RUN emmake make

# Run
FROM alpine AS run

WORKDIR /junie

RUN apk --no-cache add python3

COPY --from=build /junie/ui/build .

CMD python3 -m http.server ${PORT:-8000}
