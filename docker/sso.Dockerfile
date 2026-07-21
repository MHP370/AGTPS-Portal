FROM debian:bookworm-slim

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    apache2 libapache2-mod-auth-gssapi \
  && a2enmod auth_gssapi headers proxy proxy_http \
  && rm -rf /var/lib/apt/lists/*

COPY docker/sso/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/sso/entrypoint.sh /usr/local/bin/agtps-sso-entrypoint
RUN chmod 755 /usr/local/bin/agtps-sso-entrypoint

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/agtps-sso-entrypoint"]
