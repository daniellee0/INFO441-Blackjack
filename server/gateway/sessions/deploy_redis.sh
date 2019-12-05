#!/usr/bin/env bash
# Run redis
docker run -d \
-p 6379:6379 \
--name blackjackredis \
--network blackjack \
redis

exit