FROM mhart/alpine-node:8.9.4

# config
COPY /tradejs.config.js /tradejs.config.custom.js /usr/src/app/

WORKDIR /usr/src/app/shared
COPY /shared .

WORKDIR /usr/src/app/server-event/
COPY /server-event/package.json .
COPY /server-event .