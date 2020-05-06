# Running Kumojs API server from Systemd
The accompanying unit file is for my system but hopefully it's a reasonable example for others to modify and use.

## Setup
```bash
sudo cp deployment/systemd/kumojs_api.service /etc/systemd/system/
sudo systemctl enable kumojs_api.service
sudo systemctl start kumojs_api.service
```

## View logs
```bash
journalctl -u kumojs_api
```
