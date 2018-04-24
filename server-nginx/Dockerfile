FROM nginx

ARG COPY_FILE

COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY ./config/nginx.prod.conf /etc/nginx/helpers/nginx.prod.conf
# COPY ./config/nginx.dev.conf /etc/nginx/nginx.dev.conf
COPY ./config/${COPY_FILE} /etc/nginx/${COPY_FILE}
COPY ./config/nginx.routes.conf /usr/src/app/server-nginx/config/nginx.routes.conf
# COPY ./config/ci.conf /etc/nginx/sites-available/ci.conf
# COPY ./config/ci.conf /etc/nginx/sites-enabled/ci.conf
COPY ./config/mime.types /etc/nginx/mime.types
# RUN sh -c "envsubst \"`env | awk -F = '{printf \" ENV\", ${COPY_FILE}}'" < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf