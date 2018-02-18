FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV EVENT_LOCATION=$APP_LOCATION/server-event
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# Create a directory where our app will be placed
RUN mkdir -p $EVENT_LOCATION/
RUN mkdir -p $EVENT_LOCATION/node_modules/
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
WORKDIR $EVENT_LOCATION/
COPY /server-event/package.json .
COPY /server-event .
RUN npm i
RUN npm run build

# port
EXPOSE 3011

# Serve the app
CMD npm i && npm start