FROM mhart/alpine-node:10.4.1

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# client
WORKDIR /usr/src/app/client
COPY /client/*.json ./
RUN npm i
COPY /client/src ./src

