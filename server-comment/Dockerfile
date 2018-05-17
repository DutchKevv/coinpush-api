FROM mhart/alpine-node:10.1.0

RUN npm i -g npm

# shared
WORKDIR /usr/src/app/shared/modules/coinpush
COPY /shared/modules/coinpush .
RUN npm i

# server
WORKDIR /usr/src/app/server-comment
COPY /server-comment/package*.json /server-comment/tsconfig.json /server-comment/index.ts ./
RUN npm i
COPY /server-comment/src ./src