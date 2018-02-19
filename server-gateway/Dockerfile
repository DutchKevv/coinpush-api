FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV SERVER_LOCATION=$APP_LOCATION/server-gateway
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/
RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

# Create a directory where our app will be placed
RUN mkdir -p $SERVER_LOCATION/
# RUN mkdir -p $SERVER_LOCATION/node_modules/
RUN mkdir -p $SHARED_LOCATION/

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

# port
EXPOSE 3100