FROM mhart/alpine-node:10.4.1

# Install Python + sharp image processing
RUN apk add --no-cache make gcc g++ python
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*

# config
COPY /_config /usr/src/app/_config

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-gateway
COPY /server-gateway/package.json server-gateway/tsconfig.json ./
RUN npm i
COPY /server-gateway/src ./src