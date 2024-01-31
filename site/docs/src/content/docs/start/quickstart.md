---
title: 'Quick Start'
description: 'Your first zero trust networking environment'
---

This guide will walk you through a basic Camblet scenario.
It will deploy Camblet into the kernel to assign strong identities to processes and transparently establish mTLS connections.
At first, simple python http server with cURL will be used for demostration later, to spice things up, all of this will happen inside a Kubernetes cluster.

## Prepare the environment

Currently, the supported operating systems are:

- Ubuntu/Debian (Kernel version 5.14 and up).
- CentOS/Fedora (Kernel version 5.14 and up).

In case you are using Mac a virtual machine is required.
If you are already on Linux, please proceed to the [Automatic Install](#automatic-install) section.
This guide utilizes [Lima](https://lima-vm.io). 

To install Lima, use the following command:
```sh
brew install lima
```

If you do not already have kubectl installed, you can install it with:
```sh
brew install kubernetes-cli
```

Now create a virtual machine:
```sh
limactl start --name=quickstart template://k3s
```

This will create a small k3s cluster. Please set up the kubeconfig for cluster access.
A similar message will be printed out at the end of the installation:
```sh
To run `kubectl` on the host (assumes kubectl is installed), run the following commands:
------
export KUBECONFIG="/Users/<username>/.lima/quickstart/copied-from-guest/kubeconfig.yaml"
kubectl ...
------
```

Check the status of the cluster:
```sh
kubectl get pods
```

You should see something like this:
```sh
No resources found in default namespace.
```

Now proceed with installing Camblet.
Since Camblet runs as a Linux kernel module, the following commands must be issued inside the created VM.
To access the machine, use:
```sh
limactl shell quickstart
```

## Automatic install

The simplest way to install Camblet is to run the following command in your terminal. 
This will set up the necessary repositories on your system and install all Camblet components.

**Note: This guide assumes you are using Ubuntu.

```sh
curl -L camblet.io/install.sh | bash
```

### Check if Camblet is installed

Check the status of the systemd service for the agent:

```sh
sudo systemctl status camblet.service
```

You should see something similar to this:

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

Congratulations! You now have a fully functional Camblet installed on your Ubuntu system.

Camblet consist of two building blocks:
- Kernel module: Handles transparent TLS and enforces policies.
- Agent: Issues certificates and collects metadata for processes.

- Simple [scenario](#create-a-sample-scenario)
- Kubernetes [scenario](#create-a-sample-kubernetes-scenario)

## Create a sample scenario

### Configure agent

The agent configuration resides in /etc/camblet/config.yaml. 
By default, it looks like this:

```sh
agent:
  trustDomain: acme.corp
  defaultCertTTL: 2h
  metadataCollectors:
    procfs:
      enabled: true
      extractEnvs: false
    linuxos:
      enabled: true
    sysfsdmi:
      enabled: true
    azure:
      enabled: false
    ec2:
      enabled: false
    gcp:
      enabled: false
    kubernetes:
      enabled: false
    docker:
      enabled: false
```

Let's take a closer look. In this file, the agent can be configured to use a trust domain of your choice, along with the certificate time-to-live (certTTL). 
Inside the metadataCollectors block, we can find various metadata sources. 
As you can see, by default, the procfs, linuxos, and sysfsdmi are enabled.
This means Camblet can utilize metadata from these sources to identify processes and enforce policies.
Let's inspect this metadata by augmenting the process ID of a web server, like Traefik.

```sh
camblet --config /etc/camblet/config.yaml agent augment $(pidof traefik)
linuxos:kernel:release:linux-5.15.0-91-generic
linuxos:kernel:version:#101-Ubuntu SMP Tue Nov 14 13:29:11 UTC 2023
linuxos:name:ubuntu
linuxos:version:Ubuntu 22.04.3 LTS
process:cmdline:traefik traefik --global.checknewversion --global.sendanonymoususage --entrypoints.metrics.address=:9100/tcp --entrypoints.traefik.address=:9000/tcp --entrypoints.web.address=:8000/tcp --entrypoints.websecure.address=:8443/tcp --api.dashboard=true --ping=true --metrics.prometheus=true --metrics.prometheus.entrypoint=metrics --providers.kubernetescrd --providers.kubernetesingress --providers.kubernetesingress.ingressendpoint.publishedservice=kube-system/traefik --entrypoints.websecure.http.tls=true
process:gid:65532
process:gid:additional:65532
process:gid:effective:65532
process:gid:real:65532
process:name:traefik
process:pid:2992
process:uid:65532
process:uid:effective:65532
process:uid:real:65532
sysfsdmi:bios:date:03/01/2023
sysfsdmi:bios:release:0.0
sysfsdmi:bios:vendor:EDK II
sysfsdmi:bios:version:edk2-stable202302-for-qemu
sysfsdmi:chassis:type:1
sysfsdmi:chassis:vendor:QEMU
sysfsdmi:chassis:version:virt-8.1
sysfsdmi:product:name:QEMU Virtual Machine
sysfsdmi:product:version:virt-8.1
```
The agent printed out all the metadata which are currently available.

### Install processes

In this scenario there will be a simple python http server which will work as an echo server.
On client side cURL will be used.
All commands must be run inside the virtual machine. To return to Lima:
```sh
limactl shell quickstart
```

Let's run python http server:
```sh
python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### Create policy for the server

We want to generate a policy for the python server that identifies the process using selectors. 
We can also set the type of the mTLS and some parameters for the certificate including TTL and workload ID.

The policy can be written by hand, but the Camblet CLI can do the hard work for you. We are going to use the CLI, but for that, we must determine the PID of the python server. To do that, use the following command:

```sh
ps aux | grep python3

```

You will see something similar:

```sh
root        1398  0.0  0.4  32940 17732 ?        Ss   04:43   0:00 /usr/bin/python3 /usr/bin/networkd-dispatcher --run-startup-triggers
root        1459  0.0  0.4 109928 20008 ?        Ssl  04:43   0:00 /usr/bin/python3 /usr/share/unattended-upgrades/unattended-upgrade-shutdown --wait-for-signal
bmolnar    51572  0.0  0.4  26756 16492 pts/0    S+   13:24   0:00 python3 -m http.server
bmolnar    51929  0.0  0.0   6416  1864 pts/1    S+   13:31   0:00 grep --color=auto python3
```

The one we are looking for is on line 3, running with the name "/server". 
We need the second column because that one is the PID. 
In this case, it is 51572. 
Next, run the Camblet CLI to generate a policy and save it into the default policy directory as python.yaml.

```sh
sudo camblet --config /etc/camblet/config.yaml agent generate-policy 51572 python3 | sudo tee /etc/camblet/policies/python.yaml
- certificate:
    ttl: 86400s
    workloadID: python3
  connection:
    mtls: STRICT
  selectors:
  - process:binary:path: /usr/bin/python3.10
    process:gid: "1000"
    process:name: python3
    process:uid: "501"
```

Camblet will use these selectors to identify the python server. The connection part configures the mTLS. Since it is strict, only clients with certificates can communicate with it. To verify that, let's try it with cURL.

### Try Camblet out

Try to connect to python server on localhost:8000:

```
curl localhost:8000
```

As we waited, we received the following:

```sh
curl localhost:8000
curl: (52) Empty reply from server
```

### Create policy for the client

To create a new policy for cURL to communicate with the server, we need the PID of cURL. Since cURL is not running continuously like the server, we have to use a "dummy" command to force it to run as long as we can gather the PID. To do that, we need two terminals. This must be done before cURL times out; otherwise, the PID changes.

Terminal 1:

```sh
curl 1.2.3.4
```

In the meantime, terminal 2:

```sh
ps aux | grep curl
bmolnar    52899  0.0  0.2  23184  8748 pts/1    S+   13:47   0:00 curl 1.2.3.4
bmolnar    52908  0.0  0.0   6416  1856 pts/2    S+   13:47   0:00 grep --color=auto curl
```

Like earlier, we need the data from the second column and look for "curl 1.2.3.4". In our case, the number we are looking for is 52899.
Let's generate configuration for cURL in terminal 2:

```sh
sudo camblet --config /etc/camblet/config.yaml agent generate-policy 52899 curl | sudo tee /etc/camblet/policies/curl-simple.yaml
- certificate:
    ttl: 86400s
    workloadID: curl
  connection:
    mtls: STRICT
  selectors:
  - process:binary:path: /usr/bin/curl
    process:gid: "1000"
    process:name: curl
    process:uid: "501"
```

Using this policy, cURL will require mTLS. Let's try to communicate with the python server once again.

### Try Camblet out

```sh
curl localhost:8000
curl: (52) Empty reply from server
```

It still doesn't work. One last piece of the puzzle is missing. In this early phase of the project, the Camblet driver, which handles the TLS behind the scenes, does not know that the python server we are trying to communicate with has strict mTLS settings. The Camblet driver cannot use mTLS communication for all outbound/egress connections because that would restrict the process to the internet. Using mTLS for every egress connection would mean that cURL cannot access GitHub either. Instead, we have something called a service discovery file. A sample looks like this:

```sh
# Sample Service discovery configuration file.
# See https://camblet.io/docs/concepts/service-registry-entry for more information.
- addresses:
  - address: localhost
    port: 8000
  labels:
    app:label: nginx
```

Let's ignore the labels part for now; it is meant for more advanced configuration. The addresses part tells Camblet which outgoing connections require mTLS. Let's create our own services.yaml where we place the python server's service IP and port number.

```sh
echo -e "- addresses:\n  - address: 127.0.0.1\n    port: 8000\n  labels:\n    app:label: python" | sudo tee /etc/camblet/services/local.yaml
```

With this in place, let's check if it fixed the error.

```sh
curl localhost:8000
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Directory listing for /</title>
</head>
<body>
<h1>Directory listing for /</h1>
<hr>
<ul>
<li><a href=".bash_history">.bash_history</a></li>
<li><a href=".bash_logout">.bash_logout</a></li>
<li><a href=".bashrc">.bashrc</a></li>
<li><a href=".cache/">.cache/</a></li>
<li><a href=".profile">.profile</a></li>
<li><a href=".ssh/">.ssh/</a></li>
<li><a href=".viminfo">.viminfo</a></li>
<li><a href=".zshrc">.zshrc</a></li>
</ul>
<hr>
</body>
</html>
```
It finally works.

## Create a sample Kubernetes scenario

### Configure agent to access K8s metadata

The agent configuration resides in /etc/camblet/config.yaml. 

Configure the agent to access Kubernetes metadata. 
This data comes from the kubelet, so the proper certificates and keys must be provided to the agent.
Copy the keys and certificates used by k3s to the Camblet directory:

```sh
sudo cp /var/lib/rancher/k3s/server/tls/client-admin.key /etc/camblet/kubelet-client.key
sudo cp /var/lib/rancher/k3s/server/tls/client-admin.crt /etc/camblet/kubelet-client.crt
sudo cp /var/lib/rancher/k3s/server/tls/server-ca.crt /etc/camblet/kubelet-ca.crt 
sudo chmod 644 /etc/camblet/kubelet-client.key
sudo chmod 644 /etc/camblet/kubelet-client.crt
sudo chmod 644 /etc/camblet/kubelet-ca.crt
```

Modify the configuration to enable Kubernetes.
The config should resemble the following:

```sh
agent:
  trustDomain: acme.corp
  defaultCertTTL: 2h
  metadataCollectors:
    procfs:
      enabled: true
      extractEnvs: false
    linuxos:
      enabled: true
    sysfsdmi:
      enabled: true
    azure:
      enabled: false
    ec2:
      enabled: false
    gcp:
      enabled: false
    kubernetes:
      enabled: true
      kubeletCA: /etc/camblet/kubelet-ca.crt
      credentials: /etc/camblet/kubelet-client.crt,/etc/camblet/kubelet-client.key
    docker:
      enabled: false
```

Restart the agent using the following command:

```sh
sudo systemctl restart camblet.service
```

Let's check the metadata collected by the agent:

```sh
camblet --config /etc/camblet/config.yaml agent augment $(pidof traefik)
k8s:annotation:kubernetes.io/config.seen:2024-01-26T14:56:05.047670838Z
k8s:annotation:kubernetes.io/config.source:api
k8s:annotation:prometheus.io/path:/metrics
k8s:annotation:prometheus.io/port:9100
k8s:annotation:prometheus.io/scrape:true
k8s:container:image:id:docker.io/rancher/mirrored-library-traefik@sha256:ca9c8fbe001070c546a75184e3fd7f08c3e47dfc1e89bff6fe2edd302accfaec
k8s:container:name:traefik
k8s:label:app.kubernetes.io/instance:traefik-kube-system
k8s:label:app.kubernetes.io/managed-by:Helm
k8s:label:app.kubernetes.io/name:traefik
k8s:label:helm.sh/chart:traefik-25.0.2_up25.0.0
k8s:label:pod-template-hash:f4564c4f4
k8s:node:name:lima-quickstart
k8s:pod:ephemeral-image:count:0
k8s:pod:image:count:1
k8s:pod:image:id:docker.io/rancher/mirrored-library-traefik@sha256:ca9c8fbe001070c546a75184e3fd7f08c3e47dfc1e89bff6fe2edd302accfaec
k8s:pod:image:name:rancher/mirrored-library-traefik:2.10.5
k8s:pod:init-image:count:0
k8s:pod:name:traefik-f4564c4f4-fqhqm
k8s:pod:namespace:kube-system
k8s:pod:owner:kind:replicaset
k8s:pod:owner:kind-with-version:apps/v1/replicaset
k8s:pod:serviceaccount:traefik
linuxos:kernel:release:linux-5.15.0-91-generic
linuxos:kernel:version:#101-Ubuntu SMP Tue Nov 14 13:29:11 UTC 2023
linuxos:name:ubuntu
linuxos:version:Ubuntu 22.04.3 LTS
process:cmdline:traefik traefik --global.checknewversion --global.sendanonymoususage --entrypoints.metrics.address=:9100/tcp --entrypoints.traefik.address=:9000/tcp --entrypoints.web.address=:8000/tcp --entrypoints.websecure.address=:8443/tcp --api.dashboard=true --ping=true --metrics.prometheus=true --metrics.prometheus.entrypoint=metrics --providers.kubernetescrd --providers.kubernetesingress --providers.kubernetesingress.ingressendpoint.publishedservice=kube-system/traefik --entrypoints.websecure.http.tls=true
process:gid:65532
process:gid:additional:65532
process:gid:effective:65532
process:gid:real:65532
process:name:traefik
process:pid:2992
process:uid:65532
process:uid:effective:65532
process:uid:real:65532
sysfsdmi:bios:date:03/01/2023
sysfsdmi:bios:release:0.0
sysfsdmi:bios:vendor:EDK II
sysfsdmi:bios:version:edk2-stable202302-for-qemu
sysfsdmi:chassis:type:1
sysfsdmi:chassis:vendor:QEMU
sysfsdmi:chassis:version:virt-8.1
sysfsdmi:product:name:QEMU Virtual Machine
sysfsdmi:product:version:virt-8.1
```

Now Kubernetes related labels can also be used to identify processes.


### Install sample Kubernetes processes

For this purpose, this guide will use a simple echo server running as a Kubernetes deployment and a simple client cURL which will run as a pod. These operations must be run on the host OS. To exit from Lima, simply type exit and hit enter.

First, install the echo server using kubectl:

```sh
kubectl create -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo
  labels:
    k8s-app: echo
spec:
  replicas: 1
  selector:
    matchLabels:
      k8s-app: echo
  template:
    metadata:
      labels:
        k8s-app: echo
    spec:
      terminationGracePeriodSeconds: 2
      containers:
      - name: echo-service
        image: ghcr.io/cisco-open/nasp-echo-server:main
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: 100m
            memory: 128Mi
          requests:
            cpu: 20m
            memory: 64Mi
---
apiVersion: v1
kind: Service
metadata:
  name: echo
  labels:
    k8s-app: echo
spec:
  ports:
  - name: http
    port: 80
    targetPort: 8080
  selector:
    k8s-app: echo
EOF

```

If successful, you should see something similar:

```sh
kubectl get pods
NAME                    READY   STATUS    RESTARTS   AGE
echo-54c896dd86-x9tdj   1/1     Running   0          20s
```

Let's create a simple Alpine pod which will host our cURL client:
```sh
kubectl create -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: alpine
spec:
  containers:
  - name: alpine
    image: alpine
    # Just spin & wait forever
    command: [ "/bin/sh", "-c", "--" ]
    args: [ "while true; do sleep 3000; done;" ]
EOF
```

If successful, you should see something similar:
```sh
kubectl get pods
NAME                    READY   STATUS    RESTARTS   AGE
echo-54c896dd86-x9tdj   1/1     Running   0          3m52s
alpine                  1/1     Running   0          36s
```

It is time to assign strong identities to processes and transparently establish mTLS connections.

### Create policy for the server

All commands must be run inside the virtual machine. To return to Lima:
```sh
limactl shell quickstart
```

We want to generate a policy for the echo server that identifies the process using selectors. 
We can also set the type of the mTLS and some parameters for the certificate including TTL and workload ID.

The policy can be written by hand, but the Camblet CLI can do the hard work for you. We are going to use the CLI, but for that, we must determine the PID of the echo server. To do that, use the following command:

```sh
ps aux | grep server
```

You will see something similar:

```sh
root        1462  4.4 11.6 5399200 466840 ?      Ssl  16:32   0:20 /usr/local/bin/k3s server
1000        3451  0.4  1.1 757792 47164 ?        Ssl  16:32   0:02 /metrics-server --cert-dir=/tmp --secure-port=10250 --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname --kubelet-use-node-status-port --metric-resolution=15s --tls-cipher-suites=TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
65532       3587  0.0  1.2 783100 51840 ?        Ssl  16:32   0:00 /server
bmolnar     4448  0.0  0.0   6416  1860 pts/0    S+   16:39   0:00 grep --color=auto server
```

The one we are looking for is on line 3, running with the name "/server". 
We need the second column because that one is the PID. 
In this case, it is 3587. 
Next, run the Camblet CLI to generate a policy and save it into the default policy directory as echo-server.yaml.

```sh
 sudo camblet --config /etc/camblet/config.yaml agent generate-policy 3587 server | sudo tee /etc/camblet/policies/echo-server.yaml
- certificate:
    ttl: 86400s
    workloadID: server
  connection:
    mtls: STRICT
  selectors:
  - k8s:container:name: echo-service
    k8s:pod:name: echo-54c896dd86-x9tdj
    k8s:pod:namespace: default
    k8s:pod:serviceaccount: default
    process:binary:path: /server
    process:gid: "65532"
    process:name: server
    process:uid: "65532"
```

Camblet will use these selectors to identify the echo server. As you can see, there are multiple Kubernetes-related entries present. It means that the same echo server running purely on the machine will be identified as a different process. The connection part configures the mTLS. Since it is strict, only clients with certificates can communicate with it. To verify that, let's try it with cURL from the Alpine container

### Try Camblet out

From your local machine (outside of the Lima VM), run the following commands:

```sh
kubectl exec -it alpine sh
```

Inside the Alpine container, first, we have to install cURL:

```sh
apk update
apk add curl
```

Next, we can try to connect to the echo server on echo:80:

```
curl echo:80
```

As we waited, we received the following:

```sh
/ # curl echo:80
curl: (56) Recv failure: Connection reset by peer
```

### Create policy for the client

To create a new policy for cURL to communicate with the server, we need the PID of cURL. Since cURL is not running continuously like the server, we have to use a "dummy" command to force it to run as long as we can gather the PID. To do that, we need two terminals: one running inside the Alpine container and another one running inside Lima. This must be done before cURL times out; otherwise, the PID changes.

Inside the container:

```sh
curl 1.2.3.4
```

In the meantime, in the Lima environment:

```sh
ps aux | grep curl
root       37848  0.0  0.1   9468  4508 pts/0    S+   09:22   0:00 curl 1.2.3.4
bmolnar    37879  0.0  0.0   6416  1860 pts/0    S+   09:22   0:00 grep --color=auto curl
```

Like earlier, we need the data from the second column and look for "curl 1.2.3.4". In our case, the number we are looking for is 37848.
Let's generate configuration for cURL:

```sh
sudo camblet --config /etc/camblet/config.yaml agent generate-policy 37848 curl | sudo tee /etc/camblet/policies/curl.yaml
- certificate:
    ttl: 86400s
    workloadID: curl
  connection:
    mtls: STRICT
  selectors:
  - k8s:container:name: alpine
    k8s:pod:name: alpine
    k8s:pod:namespace: default
    k8s:pod:serviceaccount: default
    process:binary:path: /usr/bin/curl
    process:gid: "0"
    process:name: curl
    process:uid: "0"
```

Using this policy, cURL running inside the Alpine container will require mTLS. Let's try to communicate with the echo server once again.

```sh
curl echo:80
curl: (56) Recv failure: Connection reset by peer
```

It still doesn't work. One last piece of the puzzle is missing. In this early phase of the project, the Camblet driver, which handles the TLS behind the scenes, does not know that the echo server we are trying to communicate with has strict mTLS settings. The Camblet driver cannot use mTLS communication for all outbound/egress connections because that would restrict the process to the internet. Using mTLS for every egress connection would mean that cURL cannot access GitHub either. Instead, we have something called a service discovery file. A sample looks like this:

```sh
# Sample Service discovery configuration file.
# See https://camblet.io/docs/concepts/service-registry-entry for more information.
- addresses:
  - address: localhost
    port: 8000
  labels:
    app:label: nginx
```

Let's ignore the labels part for now; it is meant for more advanced configuration. The addresses part tells Camblet which outgoing connections require mTLS. Let's create our own services.yaml where we place the echo server's service IP and port number. Get the IP and port of the service by running the following command on your local machine:

```sh
kubectl get services
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.43.0.1    <none>        443/TCP   2d19h
echo         ClusterIP   10.43.14.8   <none>        80/TCP    2d17h
```

The interesting part is the echo service cluster IP and the ports; these should be placed into a service discovery file.

```sh
echo -e "- addresses:\n  - address: 10.43.14.8\n    port: 80\n  labels:\n    app:label: echo-server" | sudo tee /etc/camblet/services/services.yaml
```

With this in place, let's check if it fixed the error. To do that, execute once again into the Alpine container using, then use cURL for connection.

```sh
kubectl exec -it alpine sh
curl echo:80
Hostname: echo-54c896dd86-x9tdj

Pod Information:
	-no pod information available-

Request Information:
	client_address=10.42.0.23:55956
	method=GET
	real path=/
	query=
	request_version=1.1
	request_scheme=http
	request_url=http://echo/

Request Headers:
	accept=*/*
	user-agent=curl/8.5.0

Request Body:
```

It finally works.