FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV COMMENT_LOCATION=$APP_LOCATION/server-comment
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# Create a directory where our app will be placed
RUN mkdir -p $COMMENT_LOCATION/
RUN mkdir -p $COMMENT_LOCATION/node_modules/
RUN mkdir -p $SHARED_LOCATION/

RUN apk add --no-cache make gcc g++ python

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

# shared
WORKDIR $SHARED_LOCATION/
COPY /shared/package.json .
RUN npm i
COPY /shared .
RUN npm run build

# server
WORKDIR $COMMENT_LOCATION/
COPY /server-comment/package.json .
COPY /server-comment .
RUN npm i
RUN npm run build

# port
EXPOSE 3009

# Serve the app
CMD npm i && npm start