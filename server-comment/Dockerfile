FROM mhart/alpine-node:10.4.1

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-comment
COPY /server-comment/package.json /server-comment/tsconfig.json ./
RUN npm i
COPY /server-comment/src ./src