# AGTPS Portal Docker Deployment

## First Setup

Copy the environment template and edit secrets:

```bash
cp docker/.env.example docker/.env
nano docker/.env
```

Start the stack:

```bash
docker compose --env-file docker/.env -f docker/compose.yaml up -d --build
```

Check logs:

```bash
docker compose --env-file docker/.env -f docker/compose.yaml logs -f
```

Run seed data after the first successful start:

```bash
docker compose --env-file docker/.env -f docker/compose.yaml exec api npm run seed
```

## Auto Start After Server Boot

Enable Docker on the Linux server:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

The compose services use `restart: unless-stopped`, so after the first
`docker compose up -d`, Docker will start them automatically after reboot.

If you want systemd to explicitly run the compose stack on every boot too:

```bash
sudo cp docker/agtps-portal.service.example /etc/systemd/system/agtps-portal.service
sudo nano /etc/systemd/system/agtps-portal.service
sudo systemctl daemon-reload
sudo systemctl enable agtps-portal
sudo systemctl start agtps-portal
```

Update `WorkingDirectory` in the service file to the real project path on the
server before enabling it.

## File Shares

Mount SMB shares on the Linux host, for example:

```bash
sudo mkdir -p /srv/agtps/file-shares/public
sudo mount -t cifs //SERVER/ShareName /srv/agtps/file-shares/public -o username=USER,domain=DOMAIN,vers=3.0
```

Then define this path in the portal admin:

```text
/mnt/file-shares/public
```

To make SMB mounts persistent, add them to `/etc/fstab` on the host.

## Backups

Backup files are stored in the Docker volume `portal-backups` and are not
served directly by nginx. Download must go through the authenticated API.

To inspect backup files on the host:

```bash
docker volume inspect agtps-portal_portal-backups
```

The API container includes `pg_dump` and `tar`, which are required for manual
database/files backups.

## Useful Commands

```bash
docker compose --env-file docker/.env -f docker/compose.yaml ps
docker compose --env-file docker/.env -f docker/compose.yaml restart
docker compose --env-file docker/.env -f docker/compose.yaml down
docker compose --env-file docker/.env -f docker/compose.yaml pull
docker compose --env-file docker/.env -f docker/compose.yaml up -d --build
```
