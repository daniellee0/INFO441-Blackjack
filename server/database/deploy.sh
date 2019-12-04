# Build script
./build.sh

# Push API docker container to docker hub
docker push donloby/blackjackmysql

# cat setpasswords.sh update.sh > scriptToSend.sh
# SSH into `api.uwinfotutor.me` and run update.sh
ssh ec2-user@api.raffisy.com 'bash -s' < update.sh
ssh ec2-user@api.raffisy.com 'bash -s' < deploy_rabbit.sh