FROM nginx

RUN mkdir -p /usr/src/letsencrypt

# Copy custom configuration file from the current directory
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY mime.types /etc/nginx/mime.types
COPY /etc/letsencrypt /usr/src/letsencrypt