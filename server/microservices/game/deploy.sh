#!/usr/bin/env bash
docker build -t donloby/game .
docker push donloby/game:latest

ssh -i ~/.ssh/id_rsa ec2-user@api.raffisy.com 'bash -s' < update.sh

