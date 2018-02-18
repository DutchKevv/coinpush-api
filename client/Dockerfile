FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV CLIENT_LOCATION=$APP_LOCATION/client
ENV SHARED_LOCATION=$APP_LOCATION/shared

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

RUN mkdir -p $CLIENT_LOCATION/node_modules
RUN mkdir -p $CLIENT_LOCATION/www

RUN apk update && \
    apk upgrade && \
    apk add git imagemagick-dev && \
    apk add --update --repository http://dl-3.alpinelinux.org/alpine/edge/testing vips-tools vips-dev fftw-dev && \
    rm -rf /var/cache/apk/*

RUN apk add --no-cache make gcc g++ python

WORKDIR $SHARED_LOCATION/
COPY /shared/package.json .
RUN npm i
COPY /shared .
RUN npm run build

# Change directory so that our commands run inside this new directory
WORKDIR $CLIENT_LOCATION/
COPY /client/package.json .
RUN npm i
COPY /client .
# RUN npm run build
# RUN if [ "x$NODE_ENV" = "x" ] ; then echo NODE_ENV not provided ; else npm run build ; fi

# CMD npm run build
CMD npm start