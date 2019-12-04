docker rm -f gateway

docker pull donloby/assignments-daniellee0

# make sure TLSCERT and TLSKEY exports are set
export TLSCERT=/etc/letsencrypt/live/api.oddgarden.xyz/fullchain.pem
export TLSKEY=/etc/letsencrypt/live/api.oddgarden.xyz/privkey.pem

export REDISADDR="inforedis:6379"
export MESSAGEADDR="http://messaging:8000"
export SUMMARYADDR="http://summary:8001"
export DSN="root:password@tcp(infomysql)/infomysqldb"
export SESSIONKEY="sessionkey"
export RABBITADDR="rabbit:5672"
export RABBITQUEUENAME="queue"


docker network create info441assignments

docker run -d \
--name gateway \
--network info441assignments \
-p 443:443 \
-v /etc/letsencrypt:/etc/letsencrypt:ro \
-e TLSCERT=$TLSCERT \
-e TLSKEY=$TLSKEY \
-e REDISADDR=$REDISADDR \
-e MESSAGESADDR=$MESSAGEADDR \
-e SUMMARYADDR=$SUMMARYADDR \
-e DSN=$DSN \
-e SESSIONKEY=$SESSIONKEY \
-e RABBITADDR=$RABBITADDR \
-e RABBITQUEUENAME=$RABBITQUEUENAME \
--restart unless-stopped \
donloby/assignments-daniellee0

exit