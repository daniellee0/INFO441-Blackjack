#!/usr/bin/env bash
docker build -t donloby/chat .
docker push donloby/chat:latest

ssh -i ~/.ssh/id_rsa ec2-user@api.raffisy.com 'bash -s' < update.sh

