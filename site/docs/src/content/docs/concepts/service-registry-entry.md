---
title: Service registry entry
---

A service registry entry provides information about a particular service in the Nasp domain. Each entry includes all the available addresses where the service can be reached, along with at least one label that describes the service. These labels can be employed as selectors in the identity rules within the egress configuration.

```yaml
labels:
  app:label: traefik
  linux:uid: 500
  linux:binary:name: /usr/bin/traefik
addresses:
- localhost:8000
- localhost:8080
- 1.2.3.4:8000
```

## Entry

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `labels` | map[string]string | Yes | Labels that describes the service. |
| `addresses` | []string | Yes | Addresses where the service can be reached, both `ip:port` and `hostname:port` are valid formats. Hostnames are resolved only once when the rule is loaded. |
