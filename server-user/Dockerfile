FROM mhart/alpine-node:10.9.0

ARG env

# shared
COPY /shared/modules/coinpush /usr/src/app/shared/modules/coinpush

# server
WORKDIR /usr/src/app/server-user
COPY /server-user/package.json server-user/tsconfig.json ./
RUN npm i --quiet --no-progress
COPY /server-user/src ./src

# dist build
RUN if [ "$env" = "production" ] ; then npm run build && npm prune --production && rm -rf src; fi