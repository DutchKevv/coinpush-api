FROM mhart/alpine-node:10.0.0

# TODO - only needed if want to rebuild spritesheet
RUN apk update && apk add git

# image-magic
# RUN apk add --no-cache make gcc g++ python
# RUN apk update && \
#     apk upgrade && \
#     apk add git imagemagick-dev && \
#     apk add --update --repository http://dl-3.alpinelinux.org/alpine/edge/testing vips-tools vips-dev fftw-dev && \
#     rm -rf /var/cache/apk/*

# RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

# shared
# WORKDIR /usr/src/app/shared
# COPY /shared .

# client
WORKDIR /usr/src/app/client
COPY /client .
