#!/bin/bash

envsubst '${DOMAIN} ${API_PASS_HOST} ${JENKINS_PASS_HOST}' < /config/nginx/site-confs/default.template > /config/nginx/site-confs/default.conf

exec /init