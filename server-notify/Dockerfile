FROM mhart/alpine-node:10.4.1

# shared
WORKDIR /usr/src/app/shared/modules/coinpush
COPY /shared/modules/coinpush .
RUN npm i

# server
WORKDIR /usr/src/app/server-notify
COPY /server-notify/package*.json /server-notify/tsconfig.json /server-notify/index.ts ./
RUN npm i
COPY /server-notify/src ./src