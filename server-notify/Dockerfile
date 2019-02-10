FROM mhart/alpine-node:11.9.0

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-notify
COPY /server-notify/package.json server-notify/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY /server-notify/src ./src

# dist
# COPY /server-notify/dist ./dist