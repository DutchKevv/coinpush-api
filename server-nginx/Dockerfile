FROM nginx

COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY ./config /usr/src/app/server-nginx/config/
# RUN sed 's/${ENV}/$NGINX_FILE/g' /etc/nginx/nginx.conf > /etc/nginx/nginx.conf
# RUN nginx -t
# RUN sh -c "envsubst \"`env | awk -F = '{printf \" ENV\", ${COPY_FILE}}'" < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf