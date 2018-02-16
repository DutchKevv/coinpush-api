### STAGE 1: Build ###

# We label our stage as 'builder'
FROM node:8-alpine

ENV APP_LOCATION=/usr/src/app
ENV CLIENT_LOCATION=$APP_LOCATION/client
ENV SHARED_LOCATION=$APP_LOCATION/shared

# Create a directory where our app will be placed
RUN mkdir -p $CLIENT_LOCATION
RUN mkdir -p $CLIENT_LOCATION/node_modules
RUN mkdir -p $CLIENT_LOCATION/dist
RUN mkdir -p $SHARED_LOCATION/shared

RUN apk update && \
    apk upgrade && \
    apk add git

RUN apk add imagemagick-dev

# Install Python.
RUN apk add --no-cache make gcc g++ python

# sharp image processing
RUN apk add --update \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    vips-tools vips-dev fftw-dev \
    && rm -rf /var/cache/apk/*

WORKDIR $SHARED_LOCATION/
COPY /shared/package.json .
RUN npm i
COPY /shared .
RUN npm run build

# Change directory so that our commands run inside this new directory
WORKDIR $CLIENT_LOCATION/
COPY /client/package.json .
RUN npm i
COPY /client .

# Expose the port the app runs in
EXPOSE 4200

# Serve the app
CMD npm start
