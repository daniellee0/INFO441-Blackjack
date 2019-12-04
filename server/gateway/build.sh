# build GO executable
GOOS=linux go build

# build DOCKER container
docker build -t donloby/assignments-daniellee0 .

# delete GO executable
go clean

