FROM mhart/alpine-node:11.9.0

# config
COPY /_config /usr/src/app/_config

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-gateway
COPY /server-gateway/package.json server-gateway/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY /server-gateway/src ./src

# dist
# COPY /server-gateway/dist ./dist