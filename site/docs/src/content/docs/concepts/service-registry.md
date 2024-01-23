---
title: Service registry
---

A service registry entry provides information about a particular service in the Camblet domain. Each entry includes all the available addresses where the service can be reached, along with at least one label that describes the service. These labels can be employed as selectors in the identity rules within the egress configuration.

```yaml
labels:
  app:label: traefik
  linux:uid: 500
  linux:binary:name: /usr/bin/traefik
addresses:
- address: localhost
  port: 8000
- address: localhost
  port: 8080
- address: 1.2.3.4
  port: 8000
```

## Entry

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `labels` | map[string]string | Yes | Labels that describes the service. |
| `addresses` | [][address](#address) | Yes | Addresses where the service can be reached. |

### Address

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `address` | string | Yes | IP address or hostname of the service. (Hostnames are resolved only once when the rule is loaded.)
| `port` | uint | Yes | Port of the service.|

