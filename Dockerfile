FROM ubuntu:latest

# Install Nginx
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        curl openssh-server sudo iputils-ping ca-certificates nginx && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Configure nginx
RUN echo 'server {\n\
    listen 80;\n\
    location / {\n\
        proxy_pass http://localhost:3005;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}' > /etc/nginx/sites-available/default

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 3005 80

RUN echo '#!/bin/bash\n\
echo " Starting nginx..."\n\
service nginx start\n\
cd /app\n\
su ubuntu -c "npm start"' > /startup.sh && \
    chmod +x /startup.sh

CMD ["/startup.sh"]
