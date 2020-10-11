#!/bin/bash

docker build -f Dockerfile.1 -t nicomt/test:test1 .
docker build -f Dockerfile.2 -t nicomt/test:test2 .
docker build -f Dockerfile.3 -t nicomt/test:test3 .

docker push nicomt/test:test1
docker push nicomt/test:test2
docker push nicomt/test:test3
