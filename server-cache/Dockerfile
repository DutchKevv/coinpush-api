FROM mhart/alpine-node:10.4.1

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-cache
COPY /server-cache/package.json /server-cache/tsconfig.json ./
RUN npm i
COPY /server-cache/src ./src