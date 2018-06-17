FROM mhart/alpine-node:10.4.1

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-event
COPY /server-event/package.json /server-event/tsconfig.json ./
RUN npm i
COPY /server-event/src ./src