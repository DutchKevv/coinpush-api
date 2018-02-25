FROM nginx

ARG COPY_FILE

COPY ${COPY_FILE} /etc/nginx/nginx.conf
COPY ./config/mime.types /etc/nginx/mime.types