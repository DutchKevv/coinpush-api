FROM mhart/alpine-node:10.2.1

WORKDIR /usr/src/app/shared/
COPY /shared .

# shared
WORKDIR /usr/src/app/shared/modules/coinpush
COPY /shared/modules/coinpush .
RUN npm i

# server
WORKDIR /usr/src/app/server-cache
COPY /server-cache/package*.json /server-cache/tsconfig.json /server-cache/index.ts ./
RUN npm i
COPY /server-cache/src ./src