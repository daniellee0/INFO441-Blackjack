# Execute the build script
sh build.sh

docker push donloby/blackjackclient:latest

# Starts web server
ssh ec2-user@raffisy.com 'bash -s' < update.sh

