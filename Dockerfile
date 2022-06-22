# Build
FROM node AS build

WORKDIR /app

ENV HOME=/app
ENV TERM=vt100

RUN apt update
RUN apt install -y curl make clang wget git bsdmainutils xxd

RUN wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-16/wasi-sdk-16.0-linux.tar.gz
RUN tar xvf wasi-sdk-16.0-linux.tar.gz

ADD Makefile .
ADD ./ui ./ui
ADD ./app ./app

RUN make OUT_DIR=/build

# Run
FROM alpine AS junie

RUN apk --no-cache add python3

WORKDIR /junie

COPY --from=build /build .

CMD python3 -m http.server ${PORT:-8000}
