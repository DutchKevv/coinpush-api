FROM mhart/alpine-node:8.9.4

RUN npm config set registry http://registry.npmjs.org/ && \
    npm set progress=false && \
    npm config set depth 0 && \
    npm cache clean --force

# config
COPY /tradejs.config.js /tradejs.config.custom.js /usr/src/app/

WORKDIR /usr/src/app/server-event/
COPY /server-event/package.json .
COPY /server-event .