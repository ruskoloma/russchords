#!/bin/bash

envsubst '${DOMAIN} ${PROXY_PASS_DOMAIN}' < /config/nginx/site-confs/default.template > /config/nginx/site-confs/default.conf

exec /init