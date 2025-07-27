#!/bin/bash

envsubst < /config/nginx/site-confs/default.template > /config/nginx/site-confs/default.conf

exec /init