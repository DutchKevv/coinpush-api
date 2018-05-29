FROM nginx

ARG RUNNING_ENV=aaaaaa

RUN mkdir -p /usr/src/app/static/clients/web

COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY ./config /usr/src/app/server-nginx/config/
COPY ./pages /usr/src/app/server-nginx/pages/

# replace nginx 'include' with proper name (dev / prod)
RUN sh -c "sed -i \"s/~~RUNNING_ENV_PLACEHOLDER~~/$RUNNING_ENV/g\" /etc/nginx/nginx.conf"
