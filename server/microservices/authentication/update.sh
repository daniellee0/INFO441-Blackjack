#!/usr/bin/env bash
docker rmi -f donloby/authentication:latest

docker pull donloby/authentication:latest

docker rm -f authentication

docker run \
    -d \
    --network blackjack \
    --name authentication \
    -e ADDR=":8001" \
    donloby/authentication:latest
