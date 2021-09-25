FROM caddy:2.4.3-alpine
COPY docker/Caddyfile /etc/caddy/Caddyfile
RUN rm -rf /usr/share/caddy
COPY dist /usr/share/caddy
