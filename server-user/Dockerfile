FROM mhart/alpine-node:10.8.0

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-user
COPY /server-user/package.json server-user/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY /server-user/src ./src