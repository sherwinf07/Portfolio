FROM dhi.io/nginx:1

COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html styles.css cv.pdf /usr/share/nginx/html/
COPY images /usr/share/nginx/html/images
COPY fonts /usr/share/nginx/html/fonts

USER 65532:65532

EXPOSE 8080
