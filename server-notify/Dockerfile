FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV NOTIFY_LOCATION=$APP_LOCATION/server-notify
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# Create a directory where our app will be placed
RUN mkdir -p $NOTIFY_LOCATION/
RUN mkdir -p $NOTIFY_LOCATION/node_modules/
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
WORKDIR $NOTIFY_LOCATION/
COPY /server-notify/package.json .
RUN npm i
COPY /server-notify .
RUN npm run build

# Serve the app
CMD ["npm", "start"]