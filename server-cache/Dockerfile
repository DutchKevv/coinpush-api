FROM mhart/alpine-node:10.0.0

WORKDIR /usr/src/app/shared/
COPY /shared .

# server
WORKDIR /usr/src/app/server-cache/
COPY /server-cache/package.json .
COPY /server-cache .