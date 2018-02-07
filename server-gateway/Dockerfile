FROM mhart/alpine-node:8.9.4

ENV APP_LOCATION=/usr/src
ENV SERVER_LOCATION=$APP_LOCATION/server-gateway
ENV SHARED_LOCATION=$APP_LOCATION/shared

# Create a directory where our app will be placed
RUN mkdir -p $SERVER_LOCATION/
RUN mkdir -p $SHARED_LOCATION/

# config
COPY /tradejs.config.js /tradejs.config.custom.js $APP_LOCATION/

# shared
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

WORKDIR $SHARED_LOCATION/
COPY /shared/package.json ./
RUN npm i
COPY /shared ./
RUN npm run build

RUN ls

# server
WORKDIR $SERVER_LOCATION/
COPY /server-gateway/package.json ./
RUN npm i
COPY server-gateway .
# RUN npm start
RUN npm run build

RUN ls

# port
EXPOSE 3100

# Serve the app
# CMD ["npm", "start"]
CMD npm run prod