FROM mhart/alpine-node:10.8.0

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# client
WORKDIR /usr/src/app/client
COPY /client/package.json /client/angular.json ./
RUN npm i --quiet --no-progress
COPY /client/src ./src