FROM mhart/alpine-node:10.2.1

# shared
WORKDIR /usr/src/app/shared/modules/coinpush
COPY /shared/modules/coinpush .
RUN npm i

# server
WORKDIR /usr/src/app/server-event
COPY /server-event/package*.json /server-event/tsconfig.json /server-event/index.ts ./
RUN npm i
COPY /server-event/src ./src