FROM mhart/alpine-node:8.9.4

ENV APP_LOCATION=/usr/src/app
ENV USER_LOCATION=$APP_LOCATION/server-user

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

WORKDIR /usr/src/app/shared
COPY /shared .

# server
WORKDIR $USER_LOCATION/
COPY /server-user/package.json .
COPY /server-user .