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
FROM golang as api

WORKDIR /api

ADD ./api/ ./

RUN go build -o build/junie

# Build UI
FROM node:16 as ui

WORKDIR /ui

ADD ./ui/package.json ./
ADD ./ui/yarn.lock    ./

RUN yarn install

ADD ./ui/ ./

RUN yarn ionic build

# Run Junie
FROM debian AS junie

WORKDIR /junie

COPY --from=api /api/build/ ./
COPY --from=app /app/build/ ./app/
COPY --from=ui  /ui/build/  ./ui/

ADD ./assets/ ./assets/

ENTRYPOINT [ "./junie" ]
