#!/usr/bin/env bash


docker rm -f blackjackredis


# Run redis
docker run -d \
-p 6379:6379 \
--name blackjackredis \
--network blackjack \
redis

exit