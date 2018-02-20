FROM mhart/alpine-node:8.9.4

ENV APP_LOCATION=/usr/src/app \ 
    SERVER_LOCATION=/usr/src/app/server-gateway \
    SHARED_LOCATION=/usr/src/app/shared

RUN mkdir -p $SERVER_LOCATION/ &&  \
    mkdir -p $SHARED_LOCATION/ && \
    npm config set registry http://registry.npmjs.org/ && \
    npm set progress=false && \ 
    npm config set depth 0 && \
    npm cache clean --force

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

# Install Python + sharp image processing
RUN apk add --no-cache make gcc g++ python
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*

WORKDIR $SHARED_LOCATION/
COPY /shared/package.json .
RUN npm i --silent
COPY /shared .
RUN npm run build

# server
WORKDIR $SERVER_LOCATION/
COPY /server-gateway/package.json .
COPY /server-gateway .