# Execute the build script
sh build.sh

docker push donloby/blackjackgateway:latest

# Starts web server
ssh ec2-user@raffisy.com 'bash -s' < update.sh

