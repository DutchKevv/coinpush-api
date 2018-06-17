FROM mhart/alpine-node:10.4.1

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-notify
COPY /server-notify/package.json server-notify/tsconfig.json ./
RUN npm i
COPY /server-notify/src ./src