FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV USER_LOCATION=$APP_LOCATION/server-user
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

# server
WORKDIR $USER_LOCATION/
COPY /server-user/package.json .
COPY /server-user .