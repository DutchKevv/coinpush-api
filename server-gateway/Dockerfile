FROM mhart/alpine-node:8.11.1

# Install Python + sharp image processing
RUN apk add --no-cache make gcc g++ python
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app/shared/
COPY /shared .

WORKDIR /usr/src/app/server-gateway/
COPY /server-gateway .