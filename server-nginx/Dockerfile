FROM nginx

ARG COPY_FILE

COPY ${COPY_FILE} /etc/nginx/nginx.conf
COPY ./config/nginx.routes.conf /usr/src/app/server-nginx/config/nginx.routes.conf
COPY ./config/ci.conf /etc/nginx/sites-available/ci.conf
COPY ./config/ci.conf /etc/nginx/sites-enabled/ci.conf
COPY ./config/mime.types /etc/nginx/mime.types