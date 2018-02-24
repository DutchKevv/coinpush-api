FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV COMMENT_LOCATION=$APP_LOCATION/server-comment
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

# server
WORKDIR $COMMENT_LOCATION/
COPY /server-comment/package.json .
COPY /server-comment .