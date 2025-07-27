FROM linuxserver/swag:4.1.1

RUN apk add --no-cache gettext

COPY default.template /config/nginx/site-confs/default.template

COPY entrypoint.sh /custom/entrypoint.sh
RUN chmod +x /custom/entrypoint.sh

ENTRYPOINT ["/custom/entrypoint.sh"]