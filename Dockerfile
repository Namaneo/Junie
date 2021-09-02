FROM debian AS build

WORKDIR /app

ENV HOME=/app
ENV TERM=vt100

RUN apt update
RUN apt install -y curl make clang wget git bsdmainutils

RUN wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/wasi-sdk-12.0-linux.tar.gz
RUN tar xvf wasi-sdk-12.0-linux.tar.gz

ADD ./ ./

RUN make

FROM alpine AS runtime

WORKDIR /app

RUN apk add nodejs npm

COPY --from=build /app/bin/    ./bin/
COPY --from=build /app/assets/ ./assets/

ADD package.json  ./
ADD server.js     ./

RUN npm install

ENTRYPOINT [ "node", "server.js" ]
