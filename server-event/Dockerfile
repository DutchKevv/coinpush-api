FROM mhart/alpine-node:11.9.0

ARG env

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-event
COPY /server-event/package.json /server-event/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY /server-event/src ./src

# dist build
RUN if [ "$env" = "production" ] ; then npm run build && rm -rf src; fi