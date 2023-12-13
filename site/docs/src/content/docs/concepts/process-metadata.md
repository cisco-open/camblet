---
title: Process metadata
---

Each process is allocated a unique process identifier (PID), commonly known as a process ID. When a process initiates a network connection, the kernel module requests the agent to perform process metadata collection. The agent collects as many metadata as possible about the process based on its ID and the environment in which the process is running. The collected metadata can be used in [policies](/docs/concepts/policy) as selectors.

## Supported metadata collectors <a link="collectors"></a>

### Proc FS

Proc FS collector gathers information from procfs. The proc filesystem (procfs) is a unique filesystem found in Unix-like operating systems. It organizes information about processes and other system details in a hierarchical, file-like structure.

#### Configuration

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| extractEnvs | boolean | No | Whether to expose env variables as metadata |

#### Possible metadata of Proc FS metadata collector

```yaml
process:binary:hash: sha256:896413e61ff95eea48aa5e5e845a54133a8087271a35d8581d5b1d030beb8f7b
process:binary:path: /usr/bin/slirp4netns
process:cmdline: slirp4netns --mtu 65520 -r 3 --disable-host-loopback --enable-sandbox --enable-seccomp 1774 tap0
process:env:PATH: /usr/bin:/sbin:/usr/sbin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin:/usr/sbin:/sbin
process:env:PWD: /home/zsltvrg.linux
process:env:SHELL: /bin/bash
process:env:SYSTEMD_EXEC_PID: 1756
process:env:_DOCKERD_ROOTLESS_CHILD: 1
process:gid: 1000
process:gid:additional: 999
process:gid:effective: 1000
process:gid:real: 1000
process:name: slirp4netns
process:pid: 1789
process:uid: 501
process:uid:effective: 501
process:uid:real: 501
```

### Kubernetes

Kubernetes collector gathers metadata from Kubelet which runs on the node besides the agent.

#### Configuration of Kubernetes metadata collector

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| kubeletHost | string | No | Host/IP address of the kubelet. |
| kubeletPort | integer | No | Port of the kubelet. |
| kubeletCA | string | No | Either the PEM content or a path to a file which contains the trust anchor for the kubelet certificate in PEM format. |
| skipKubeletVerification | boolean | No | If enabled the certificate validation of the connection to the kubelet is skipped. |
| credentials | string | No | Based on the kubelet configuration either a token, a cert/key content or a comma separated path(s) to cert/key in PEM format can be specified. |

#### Possible metadata of Kubernetes metadata collector

```yaml
kubernetes:annotation:kubernetes.io/config.seen: 2023-11-23T16:37:13.953323037Z
kubernetes:annotation:kubernetes.io/config.source: api
kubernetes:container:image:id: docker.io/ranchermirrored-metrics-server@sha256:c2dfd72bafd6406ed306d9fbd07f55c496b004293d13d3de88a4567eacc36558
kubernetes:container:name: metrics-server
kubernetes:label:k8s-app: metrics-server
kubernetes:label:pod-template-hash: 648b5df564
kubernetes:node:name: lima-k3s
kubernetes:pod:ephemeral-image:count: 0
kubernetes:pod:image:count: 1
kubernetes:pod:image:id: docker.io/ranchermirrored-metrics-server@sha256:c2dfd72bafd6406ed306d9fbd07f55c496b004293d13d3de88a4567eacc36558
kubernetes:pod:image:name: rancher/mirrored-metrics-server:v0.6.3
kubernetes:pod:init-image:count: 0
kubernetes:pod:name: metrics-server-648b5df564-drsb2
kubernetes:pod:namespace: kube-system
kubernetes:pod:owner:kind: replicaset
kubernetes:pod:owner:kind-with-version: apps/v1/replicaset
kubernetes:pod:serviceaccount: metrics-serve
```

### Docker

Docker collector gathers metadata from Docker Engine which runs on the node besides the agent.

#### Configuration of Docker metadata collector

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| socketPath | string | No | Path to the UNIX socket that Docker daemon is listening on. |

#### Possible metadata of Docker metadata collector

```yaml
docker:cmdline: /docker-entrypoint.sh nginx -g daemon off;
docker:env:NGINX_VERSION: 1.25.3
docker:env:NJS_VERSION: 0.8.2
docker:env:PATH: /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
docker:env:PKG_RELEASE: 1~bookworm
docker:id: 3ac7ed50c6087bb468fd70d37a6e3ee8d5b554bcbde20bd83f9a9dfa14f0431e
docker:image:hash: sha256:c20060033e06f882b0fbe2db7d974d72e0887a3be5e554efdb0dcf8d53512647
docker:image:name: nginx
docker:label:maintainer: NGINX Docker Maintainers <docker-maint@nginx.com>
docker:name: awesome_sinoussi
docker:network:hostname: 3ac7ed50c608
docker:network:mode: default
docker:port-binding: 8080/tcp
```

### Linux OS

Linux OS collector gathers information about the linux operating system the process is running on.

#### Possible metadata of Linux OS metadata collector

```yaml
linuxos:kernel:release: linux-6.2.0-36-generic
linuxos:kernel:version: "#37~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC Mon Oct  9 15:34:04 UTC 2"
linuxos:name: ubuntu
linuxos:version: Ubuntu 22.04.3 LTS
```

### Sys FS DMI

Sysfs DMI collector gathers DMI provided information from Sysfs special file system. Sysfs is a pseudo file system offered by the Linux kernel, designed to expose information regarding different kernel subsystems, hardware devices, and their corresponding device drivers. This information is made accessible to user space applications through virtual files, providing a structured interface to interact with and retrieve essential details about the system's configuration and components.

#### Possible metadata of Sys FS DMI metadata collector

```yaml
sysfsdmi:bios:date: 03/01/2023
sysfsdmi:bios:release: 0.0
sysfsdmi:bios:vendor: EDK II
sysfsdmi:bios:version: edk2-stable202302-for-qemu
sysfsdmi:chassis:asset-tag: chassisassettag
sysfsdmi:chassis:serial: chassisserial
sysfsdmi:chassis:type: 1
sysfsdmi:chassis:vendor: QEMU
sysfsdmi:chassis:version: pc-q35-8.1
sysfsdmi:product:name: Standard PC (Q35 + ICH9, 2009)
sysfsdmi:product:version: pc-q35-8.1
sysfsdmi:product:family: productfamily
sysfsdmi:product:serial: QEMU-0B58FE24533B92D6E93F6607F5E0BF3C
sysfsdmi:product:sku: QEMU-SKU-0B58FE24533B92D6E93F6607F5E0BF3C
```

### Azure

Azure collector gathers metadata from the Azure Instance Metadata Service which provides information about running virtual machine instances.

#### Possible metadata of Azure metadata collector

```yaml
azure:name: demo
azure:network:mac: 000D3A27CA60
azure:network:private-ipv4: 10.0.0.4
azure:network:public-ipv4: 51.0.0.1
azure:ostype: Linux
azure:placement:location: westeurope
azure:placement:zone: 1
azure:priority: Spot
azure:provider: Microsoft.Compute
azure:resourcegroup:name: base
azure:sku: 22_04-lts-gen2
azure:subscription:id: aef37fca-5441-4532-a1a9-726b55173ca0
azure:tag:department: accounting
azure:tag:region: emea
azure:vm:id: afe12e91-33d9-4b5b-b915-ac81fe117b12
azure:vm:offer: 0001-com-ubuntu-server-jammy
azure:vm:publisher: canonical
azure:vm:scaleset:name: default
azure:vm:size: Standard_B2ats_v2
azure:vm:version: 22.04.202311010
```

### EC2

EC2 collector gathers metadata from the EC2 Instance Metadata Service which provides information about running virtual machine instances.

#### Possible metadata of EC2 metadata collector

```yaml
ec2:ami:id: ami-06dd92ecc74fdfb36
ec2:instance:id: i-0214fc003bc83bcc1
ec2:instance:type: t2.medium
ec2:network:hostname: ip-172-31-19-35.eu-central-1.compute.internal
ec2:network:local-hostname: ip-172-31-19-35.eu-central-1.compute.internal
ec2:network:local-ipv4: 172.31.19.35
ec2:network:mac: 02:80:ac:db:6e:fd
ec2:network:public-hostname: ec2-18-197-158-100.eu-central-1.compute.amazonaws.com
ec2:network:public-ipv4: 18.197.158.100
ec2:placement:availability-zone: eu-central-1a
ec2:placement:availability-zone-id: euc1-az2
ec2:placement:region: eu-central-1
ec2:security-groups: launch-wizard-24
ec2:services:domain: amazonaws.com
ec2:services:partition: aws
```

### GCP

GCP collector gathers metadata from the GCP VM metadata which provides information about running virtual machine instances.

#### Possible metadata of GCP metadata collector

```yaml
gcp:attributes:mdkey: mdvalue
gcp:cpu-platform: AMD Rome
gcp:id: 5240495278393851000
gcp:image:name: debian-11-bullseye-v20231115
gcp:image:project: debian-cloud
gcp:machine:project: 758913618900
gcp:machine:type: e2-medium
gcp:name: instance-1
gcp:network:mac: 42:01:0a:a4:00:02
gcp:network:private-ipv4: 10.164.0.2
gcp:network:public-ipv4: 35.204.15.15
gcp:placement:project: 758913618900
gcp:placement:region: europe-west4
gcp:placement:zone: europe-west4-a
gcp:scheduling:automatic-restart: true
gcp:scheduling:onHostMaintenance: migrate
gcp:scheduling:preemptible: false
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:alias: default
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:email: 758913618900-compute@developer.gserviceaccount.com
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:scope: https://www.googleapis.com/auth/devstorage.read_only
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:scope: https://www.googleapis.com/auth/logging.write
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:scope: https://www.googleapis.com/auth/monitoring.write
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:scope: https://www.googleapis.com/auth/servicecontrol
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:scope: https://www.googleapis.com/auth/service.management.readonly
gcp:serviceaccount:758913618900-compute@developer.gserviceaccount.com:scope: https://www.googleapis.com/auth/trace.append
gcp:tag: tag-1
tcp:tag: tag-2
```
