#!/usr/bin/env bash
# Set GOOS environment variable
export GOOS="linux"

go build 

# build DOCKER container
docker build -t donloby/gateway .

# delete GO executable
go clean

