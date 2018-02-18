FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV USER_LOCATION=$APP_LOCATION/server-user
ENV SHARED_LOCATION=$APP_LOCATION/shared

RUN npm config set registry http://registry.npmjs.org/

# Create a directory where our app will be placed
RUN mkdir -p $USER_LOCATION/
RUN mkdir -p $USER_LOCATION/node_modules/
RUN mkdir -p $SHARED_LOCATION/

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

# # required for BCrypt
# RUN apk --no-cache add --virtual native-deps \
#   g++ gcc libgcc libstdc++ linux-headers make python && \
#   npm install --quiet node-gyp -g

RUN apk add --no-cache make gcc g++ python

# shared
WORKDIR $SHARED_LOCATION/
COPY /shared/package.json .
RUN npm i
COPY /shared .
RUN npm run build

# server
WORKDIR $USER_LOCATION/
COPY /server-user/package.json .
COPY /server-user .
RUN npm i
RUN npm run build
# RUN apk del builds-deps

# port
EXPOSE 3008

# Serve the app
CMD npm i && npm start