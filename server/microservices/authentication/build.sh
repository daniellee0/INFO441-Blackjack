# build GO executable
GOOS=linux go build

# build DOCKER container
docker build -t donloby/authentication:latest .

# delete GO executable
go clean