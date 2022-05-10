#!/bin/bash

set -e

heroku container:login
heroku container:push web -a junie
heroku container:release web -a junie
