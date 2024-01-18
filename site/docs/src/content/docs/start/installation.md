---
title: 'Installation'
description: 'How to install Camblet'
---

Currently the supported operating systems are:

- Ubuntu/Debian (Kernel version 5.14 and up).
- CentOS/Fedora (Kernel version 5.14 and up).

## Automatic install

The most simple way to install Camblet is to run the following command in your terminal.
This will setup the necessary repositories on your system and install the all Camblet components.

```sh
curl -L camblet.io/install.sh | DEBIAN_FRONTEND=noninteractive bash
```

### Check if Camblet is installed

Check the status of the systemd service of the agent:

```sh
sudo systemctl status camblet.service
```

You should see something like this:

```sh
● camblet.service - Camblet Agent Service
     Loaded: loaded (/etc/systemd/system/camblet.service; enabled; preset: enabled)
     Active: active (running) since Mon 2023-12-11 11:02:54 UTC; 2h 34min ago
   Main PID: 1158 (camblet)
      Tasks: 11 (limit: 4611)
     Memory: 28.3M
        CPU: 1.155s
     CGroup: /system.slice/camblet.service
             └─1158 /usr/bin/camblet agent --config /etc/camblet/config.yaml --rules-path /etc/camblet/rules/ --sd-path /etc/camblet/services/
```

To check the logs of the Camblet agent, run the following command:

```sh
sudo journalctl -u camblet.service
```

Check the status of the Camblet kernel-module:

```sh
modinfo camblet
```
```
filename:       /lib/modules/6.1.0-15-cloud-arm64/updates/dkms/camblet.ko
version:        0.3.0
description:    Camblet - Kernel Space Access Control for Zero Trust Networking
license:        Dual MIT/GPL
author:         Cisco Systems
srcversion:     B169E3295E8A8740274017F
depends:        bearssl,libcrc32c
name:           camblet
vermagic:       6.1.0-15-cloud-arm64 SMP mod_unload modversions aarch64
sig_id:         PKCS#7
signer:         DKMS module signing key
sig_key:        66:F2:5E:BF:BF:18:04:09:64:2D:DB:5D:E9:AA:DC:95:E5:2E:68:9B
sig_hashalgo:   sha256
signature:      59:6F:34:6D:4F:E0:9C:D6:FA:11:52:11:21:60:5E:A5:5D:40:80:A4:
                60:6B:D8:9C:0A:04:E6:56:07:75:97:E3:42:7E:15:A0:7C:F4:48:E8:
                0C:BB:03:24:A7:8E:05:5B:91:6F:C1:11:70:F8:E3:8C:60:C5:87:59:
                29:72:6B:89:E9:A3:2A:3B:DB:81:7C:D8:FE:BC:49:99:00:74:F7:23:
                16:F9:F3:AB:81:07:A5:E9:F1:57:69:5A:E1:64:4A:8F:2D:21:9D:02:
                D5:10:E6:F1:58:9C:18:72:3A:7D:EC:DB:5B:E4:CE:CE:8A:E9:42:43:
                8F:6D:22:57:75:17:DB:88:B4:5C:11:F4:88:56:87:1C:EC:50:D3:C8:
                5E:9E:27:B2:4F:93:26:14:F3:32:D0:13:B5:9E:6B:93:73:97:95:AC:
                0C:6F:63:98:D5:45:4B:D0:E1:8C:58:51:EA:C9:E6:ED:E2:E2:8B:55:
                25:0D:AF:0F:CE:82:9A:B4:0D:8C:FB:B0:53:4F:0A:5B:3C:DD:3B:63:
                F8:21:FE:CC:F0:4B:9D:53:FB:F5:9F:7F:F8:F1:19:AB:FC:9A:04:DC:
                09:37:BC:42:12:DC:51:39:8F:87:74:53:8D:23:09:62:02:31:5E:C8:
                86:AE:C0:2A:E9:0E:07:AB:8B:DE:C8:2C:32:66:F2:D7
parm:           ktls_available:Marks if kTLS is available on the system (bool)
```

## Manual install

If you want to install Camblet manually, you can follow the steps below:

### Debian/Ubuntu

Install the dependencies first:

```sh
sudo apt install -y wget gnupg linux-headers-$(uname -r) dkms
```

Import the Camblet repository key:

```sh
sudo wget -O- https://camblet.io/packages/camblet.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/camblet.gpg >/dev/null
```

Add the Camblet repository:

```sh
sudo sh -c "echo 'deb [signed-by=/etc/apt/trusted.gpg.d/camblet.gpg] https://camblet.io/packages/deb stable main' > /etc/apt/sources.list.d/camblet.list"

sudo apt update
```

Install the Camblet meta package (this will install the agent, kernel module and CLI):

```sh
sudo apt install camblet
```

### RedHat/CentOS/Fedora and derivatives

Install the dependencies first:

_Without `--enablerepo epel` on Amazon Linux._

```sh
sudo dnf install --enablerepo epel -y dkms
```

Import the Camblet repository key:

```sh
sudo rpm --import https://camblet.io/packages/camblet.asc
```

Add the Camblet repository:

```sh
sudo tee /etc/yum.repos.d/camblet.repo >/dev/null <<EOF
[camblet-repo]
name=Camblet Repository
baseurl=https://camblet.io/packages/rpm
enabled=1
gpgcheck=1
EOF

sudo dnf makecache
```

Install the Camblet meta package (this will install the agent, kernel module and CLI):

```sh
sudo dnf install camblet
```

### Load the kernel module and start the service

Load the Camblet kernel module:

```sh
sudo modprobe camblet
```

Start the Camblet agent service:

```sh
sudo systemctl start camblet.service
```

## Maintenance

### Upgrade Camblet

If you have already installed Camblet and want to upgrade to the latest version,
run the standard upgrade command of your package manager, for example on Debian/Ubuntu:

```sh
sudo apt update && sudo apt upgrade camblet
```

### Uninstall Camblet

To uninstall Camblet, run the following command:

```sh
sudo apt autoremove camblet
```