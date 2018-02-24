FROM mhart/alpine-node:8.9.4

RUN npm config set registry http://registry.npmjs.org/ && \
    npm set progress=false && \
    npm config set depth 0 && \
    npm cache clean --force

# config
COPY /tradejs.config.js /tradejs.config.custom.js /usr/src/app/

# server
WORKDIR /usr/src/app/server-cache/
COPY /server-cache/package.json .
COPY /server-cache .