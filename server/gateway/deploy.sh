# Execute the build script
sh build.sh

# push the container image to Docker Hub
docker push donloby/gateway:latest

# Starts web server
ssh ec2-user@api.raffisy.com 'bash -s' < update.sh

