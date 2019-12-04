# Execute the build script
sh build.sh

# Execute the mysql build script
sh ../db/build.sh

# Execute the summary build script
# sh ../summary/build.sh

#Execute the messaging build script
# sh ../messaging/build.sh

# push the container image to Docker Hub
docker push donloby/assignments-daniellee0:latest

# Starts web server
# ssh ec2-user@ec2-34-228-125-151.compute-1.amazonaws.com 'docker rm -f gateway; \
# docker pull lmburu/assignments-daniellee0; \ 
# docker run -d --name gateway  -p 443:443 -v /etc/letsencrypt:/etc/letsencrypt:ro \
# -e ADDR=:443 -e TLSCERT=/etc/letsencrypt/live/api.oddgarden.xyz/fullchain.pem \
# -e TLSKEY=/etc/letsencrypt/live/api.oddgarden.xyz/privkey.pem lmburu/assignments-daniellee0'

ssh ec2-user@api.oddgarden.xyz 'bash -s' < update.sh

