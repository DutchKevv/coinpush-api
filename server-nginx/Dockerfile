FROM nginx

ARG NGINX_FILE

COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY ./config/lets-encrypt.ci /etc/nginx/helpers/lets-encrypt.ci
COPY ./config/nginx.prod.conf /etc/nginx/helpers/nginx.prod.conf
COPY ./config/nginx.dev.conf /etc/nginx/helpers/nginx.dev.conf
# COPY ./config/${COPY_FILE} /etc/nginx/${COPY_FILE}
COPY ./config/nginx.routes.conf /usr/src/app/server-nginx/config/nginx.routes.conf
# COPY ./config/ci.conf /etc/nginx/sites-available/ci.conf
# COPY ./config/ci.conf /etc/nginx/sites-enabled/ci.conf
COPY ./config/mime.types /etc/nginx/mime.types
COPY ./ssl/get-cert.sh /get-cert.sh
# RUN sed 's/${ENV}/$NGINX_FILE/g' /etc/nginx/nginx.conf > /etc/nginx/nginx.conf
# RUN nginx -t
# RUN sh -c "envsubst \"`env | awk -F = '{printf \" ENV\", ${COPY_FILE}}'" < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf

# letsencrypt
RUN apt-get update
RUN apt-get -y install git
RUN rm -rf /usr/src/letsencrypt
RUN git clone https://github.com/letsencrypt/letsencrypt /usr/src/letsencrypt

# RUN apt-get update
# RUN apt-get -y install software-properties-common
# RUN add-apt-repository ppa:certbot/certbot
# RUN apt-get update
# RUN apt-get -y install python-certbot-nginx 