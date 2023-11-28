---
layout: home
title: cisco-open.github.io/nasp
---


### Add a Debian Repository

Download the public key and put it in
`/etc/apt/keyrings/nasp-public.gpg`. You can achieve this with:

```
wget -qO- {{ site.url }}/nasp-public.asc | sudo tee /etc/apt/keyrings/nasp-public.asc >/dev/null
```

Next, create the source in `/etc/apt/sources.list.d/`

```
echo "deb [arch=all signed-by=/etc/apt/keyrings/nasp-public.asc] {{ site.url }}/deb stable main" | sudo tee /etc/apt/sources.list.d/nasp-public.list >/dev/null
```

Then run `apt update && apt install -y` and the names of the packages you want to install.