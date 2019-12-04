
#!/usr/bin/env bash
docker rmi -f donloby/blackjackclient:latest

docker pull donloby/blackjackclient:latest

docker rm -f blackjackclient

docker run
     -d \
     --name client \
     -p 80:80 \
     -p 443:443 \ 
     -v index.html:/usr/share/nginx/html:ro \
     -v /etc/letsencrypt:/etc/letsencrypt:ro \
    donloby/blackjackclient