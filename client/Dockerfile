FROM mhart/alpine-node:10.2.1

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

# shared
WORKDIR /usr/src/app/shared/modules/coinpush
COPY /shared/modules/coinpush .
RUN cd /usr/src/app/shared/modules/coinpush && npm i

# client
WORKDIR /usr/src/app/client
COPY /client/package*.json /client/angular.json ./
RUN npm i

COPY /client/src ./src

