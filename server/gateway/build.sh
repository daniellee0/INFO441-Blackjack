# build GO executable
GOOS=linux go build

# build DOCKER container
docker build -t donloby/blackjackgateway .

# delete GO executable
go clean

