./build.sh

# Push API docker container to docker hub
docker push donloby/authentication

ssh -i ~/.ssh/id_rsa ec2-user@api.raffisy.xyz 'bash -s' < ./update.sh