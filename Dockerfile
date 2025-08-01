FROM nginx:alpine

COPY CompFood/public /usr/share/nginx/html/

RUN echo '<html><body><h1>Server is healthy!</h1></body></html>' > /usr/share/nginx/html/health.html

RUN chmod -R 755 /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
