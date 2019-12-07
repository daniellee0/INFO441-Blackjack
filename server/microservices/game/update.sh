#!/usr/bin/env bash
# Remove any instance of admin microservice
docker rm -f game

docker rmi -f donloby/game:latest

#Pull from DockerHub
docker pull donloby/game:latest

docker rm -f game


# Export environment variables
export ADDR=":8002"
export MYSQL_HOST="blackjackmysql"
export MYSQL_ROOT_PASSWORD="password" 
export MYSQL_USER="root"
export MYSQL_DATABASE="blackjackmysqldb"

# Run microservice
docker run -td \
    --name game \
    --network blackjack \
    -e ADDR=$ADDR \
    -e MYSQL_HOST=$MYSQL_HOST \
    -e MYSQL_USER=$MYSQL_USER \
    -e MYSQL_DATABASE=$MYSQL_DATABASE \
    -e MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD \
    -e RABBITADDR=rabbit:5672 \
    --restart unless-stopped \
    donloby/game:latest