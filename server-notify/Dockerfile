FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV NOTIFY_LOCATION=$APP_LOCATION/server-notify
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

# server
WORKDIR $NOTIFY_LOCATION/
COPY /server-notify/package.json .
COPY /server-notify .