FROM mhart/alpine-node:8.9.4

RUN npm config set registry http://registry.npmjs.org/ && \
    npm set progress=false && \
    npm config set depth 0 && \
    npm cache clean --force

# Create a directory where our app will be placed
# RUN mkdir -p $SERVER_LOCATION/
# RUN mkdir -p $SERVER_LOCATION/node_modules/
# RUN mkdir -p $SHARED_LOCATION/

# config
COPY /tradejs.config.js /tradejs.config.custom.js /usr/src/app/

# RUN apk add --no-cache make gcc g++ python

# # shared
# WORKDIR $SHARED_LOCATION/
# COPY /shared/package.json .
# RUN npm i
# COPY /shared .
# RUN npm run build

# server
WORKDIR /usr/src/app/server-cache/
COPY /server-cache/package.json .
COPY /server-cache .