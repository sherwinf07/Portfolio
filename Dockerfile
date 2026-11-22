FROM dhi.io/nginx:1-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY site/ /usr/share/nginx/html/

USER 65532:65532

EXPOSE 8080
