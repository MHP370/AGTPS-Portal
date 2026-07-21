#!/bin/sh
set -eu

install -d -m 750 -o root -g www-data /var/lib/agtps
install -m 640 -o root -g www-data /run/agtps/portal.keytab /var/lib/agtps/portal.keytab

exec apachectl -D FOREGROUND
