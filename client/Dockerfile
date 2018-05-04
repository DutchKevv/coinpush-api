FROM mhart/alpine-node:10.0.0

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

# shared
WORKDIR /usr/src/app/shared
COPY /shared .

# client
WORKDIR /usr/src/app/client
COPY /client/package*.json /client/angular.json ./
RUN npm i
# RUN npm i && mkdir /ng-app && cp -R ./node_modules ./ng-app
# WORKDIR /ng-app

COPY /client/src ./src
# COPY /client .
