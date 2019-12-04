docker rm -f gateway

docker pull donloby/blackjackgateway

# make sure TLSCERT and TLSKEY exports are set
export TLSCERT=/etc/letsencrypt/live/api.raffisy.com/fullchain.pem
export TLSKEY=/etc/letsencrypt/live/api.raffisy.com/privkey.pem

export REDISADDR="blackjackredis:6379"
export CHATADDR="http://chat:8000"
export GAMEADDR="http://game:8002"
export AUTHENTICATIONADDR="http://authentication:8001"
export DSN="root:password@tcp(blackjackmysql)/blackjackmysqldb"
export SESSIONKEY="sessionkey"
export RABBITADDR="rabbit:5672"
export RABBITQUEUENAME="queue"


docker network create blackjack

docker run -d \
--name gateway \
--network blackjack \
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
donloby/blackjackgateway

exit