### STAGE 1: Build ###

# We label our stage as 'builder'
FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app/
ENV CLIENT_LOCATION=${APP_LOCATION}client
ENV SHARED_LOCATION=${APP_LOCATION}shared/

RUN apk update && \
    apk upgrade && \
    apk add git

RUN apk add imagemagick-dev

# Install Python.
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install --quiet node-gyp -g
#   npm install --quiet && \
#   apk del native-deps

# sharp image processing
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app/client
RUN mkdir -p /usr/src/app/shared

WORKDIR ${SHARED_LOCATION}
COPY /shared/package.json ./
RUN npm i
COPY /shared ./
RUN npm run build

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app/client
COPY /client/package.json $CLIENT_LOCATION/
RUN npm i
VOLUME $CLIENT_LOCATION/node_modules
# COPY /client .

# Expose the port the app runs in
EXPOSE 4200

# Serve the app
CMD npm start
