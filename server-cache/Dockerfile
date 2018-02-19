FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV CACHE_LOCATION=$APP_LOCATION/server-cache
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# Create a directory where our app will be placed
RUN mkdir -p $SERVER_LOCATION/
RUN mkdir -p $SERVER_LOCATION/node_modules/
RUN mkdir -p $SHARED_LOCATION/

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

RUN apk add --no-cache make gcc g++ python

# shared
WORKDIR $SHARED_LOCATION/
COPY /shared/package.json .
RUN npm i
COPY /shared .
RUN npm run build

# server
WORKDIR $CACHE_LOCATION/
COPY /server-cache/package.json .
COPY /server-cache .

# port
EXPOSE 3001