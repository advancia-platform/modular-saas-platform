# Advancia Backend Deploy Templates

This folder contains optional templates and instructions to run the backend on a droplet using `systemd` and `nginx`.

Files

- `templates/advancia-backend.service.template` - systemd unit file template. Replace placeholders:
  - `{{USER}}` → user to run the service (e.g. `www-data`)
  - `{{WORKING_DIR}}` → absolute path to backend working directory (e.g. `/var/www/-modular-saas-platform/backend`)
  - `{{ENV_FILE}}` → optional path to an env file (e.g. `/var/www/-modular-saas-platform/backend/.env`)

- `templates/advancia-nginx.conf.template` - nginx site config template. Replace `{{SERVER_NAME}}` with your domain or droplet IP.

Quick usage

1. Copy the systemd template to `/etc/systemd/system/advancia-backend.service` and replace placeholders:

   sudo cp deploy/templates/advancia-backend.service.template /etc/systemd/system/advancia-backend.service

# Edit file and replace placeholders accordingly

2. Reload systemd and start the service:

   sudo systemctl daemon-reload
   sudo systemctl enable advancia-backend
   sudo systemctl start advancia-backend
   sudo journalctl -u advancia-backend -f

3. Copy nginx config into `/etc/nginx/sites-available/advancia` and enable it:

   sudo cp deploy/templates/advancia-nginx.conf.template /etc/nginx/sites-available/advancia

# Edit the file and set server_name

   sudo ln -s /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl restart nginx

4. If you have a domain, run certbot to enable HTTPS:

   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your.domain.example

Notes

- The deploy helper `scripts/deploy/droplet-deploy.sh` uses `pm2` by default. If you prefer systemd you can use these templates instead.
- Always make sure `.env` contains correct `DATABASE_URL`/`TEST_DATABASE_URL` before running migrations.

Provisioning & backups

- `scripts/deploy/provision.sh` — installs system packages (git, nginx, certbot, build-essential), enables `ufw` rules, and installs `nvm` + Node LTS for the deployment user. Run it as root: `sudo bash scripts/deploy/provision.sh`.

- The deploy script now backs up any existing systemd unit or nginx site before overwriting. Backups are created with a timestamp suffix in `/etc/systemd/system` and `/etc/nginx/sites-available`.
