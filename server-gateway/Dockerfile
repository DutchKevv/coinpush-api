FROM mhart/alpine-node:10.1.0

# Install Python + sharp image processing
RUN apk add --no-cache make gcc g++ python
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*

# shared
WORKDIR /usr/src/app/shared/modules/coinpush
COPY /shared/modules/coinpush .
RUN npm i

# server
WORKDIR /usr/src/app/server-gateway
COPY /server-gateway/package*.json /server-gateway/tsconfig.json /server-gateway/index.ts ./
RUN npm i
COPY /server-gateway/src ./src