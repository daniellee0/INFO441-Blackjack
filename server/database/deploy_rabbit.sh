#!/usr/bin/env bash
# Docker run rabbit

docker rm -f rabbit


docker run -d \
-p 5672:5672 \
--name rabbit \
--network blackjack \
rabbitmq:3-management

