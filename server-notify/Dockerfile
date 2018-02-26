FROM mhart/alpine-node:8.9.4

ENV APP_LOCATION=/usr/src/app
ENV NOTIFY_LOCATION=$APP_LOCATION/server-notify

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

WORKDIR /usr/src/app/shared
COPY /shared .

# server
WORKDIR $NOTIFY_LOCATION/
COPY /server-notify/package.json .
COPY /server-notify .