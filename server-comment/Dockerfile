FROM mhart/alpine-node:8.9.4

# config
COPY /tradejs.config.js /tradejs.config.custom.js /usr/src/app/

WORKDIR /usr/src/app/shared
COPY /shared .

# server
WORKDIR /usr/src/app/server-comment
COPY /server-comment/package.json .
COPY /server-comment .