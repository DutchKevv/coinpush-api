FROM mhart/alpine-node:11.9.0

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-comment
COPY /server-comment/package.json /server-comment/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY /server-comment/src ./src