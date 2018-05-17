FROM mhart/alpine-node:10.1.0

# RUN npm i -g --silent npm

# RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

# shared
WORKDIR /usr/src/app/shared
COPY /shared .

# client
WORKDIR /usr/src/app/client
COPY /client/package*.json /client/angular.json ./
RUN npm i --silent

COPY /client/src ./src
# RUN cd /usr/src/app/client/src && ls
