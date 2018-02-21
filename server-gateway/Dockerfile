FROM mhart/alpine-node:8.9.4

RUN npm config set registry http://registry.npmjs.org/ && \
    npm set progress=false && \ 
    npm config set depth 0 && \
    npm cache clean --force

# config
COPY /tradejs.config.js /tradejs.config.custom.js /usr/src/app/

# Install Python + sharp image processing
RUN apk add --no-cache make gcc g++ python
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app/server-gateway/
COPY /server-gateway/package.json .
COPY /server-gateway .