#!/bin/bash

set -e

( cd .. && docker build -t junie . )

# heroku login
heroku container:login
heroku container:push web -a junie
heroku container:release web -a junie
