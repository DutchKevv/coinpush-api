FROM mhart/alpine-node:10.2.1

# shared
WORKDIR /usr/src/app/shared/modules/coinpush
COPY /shared/modules/coinpush .
RUN npm i

# server
WORKDIR /usr/src/app/server-user
COPY /server-user/package*.json /server-user/tsconfig.json /server-user/index.ts ./
RUN npm i
COPY /server-user/src ./src