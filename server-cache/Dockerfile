FROM mhart/alpine-node:8.9.4

WORKDIR /usr/src/app/shared/
COPY /shared .

# server
WORKDIR /usr/src/app/server-cache/
COPY /server-cache/package.json .
COPY /server-cache .