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


## Kubernetes example

Since Camblet can be used for Kubernetes as well, you can use the following command to generate a service registry file for all services in the cluster:

```bash
kubectl get svc -A -o go-template='
{{- range $k, $svc := .items -}}
{{- range .spec.ports -}}
{{- if eq .protocol "TCP" -}}
- addresses:
  - address: {{ $svc.spec.clusterIP }}
    port: {{ .port }}
  labels:
    service:name: {{ $svc.metadata.name }}
    service:namespace: {{ $svc.metadata.namespace }}
    service:port:name {{ .name }}
    {{- range $k, $v := $svc.metadata.labels }}
    {{ $k }}: {{ $v }}
    {{- end }}
{{ end }}
{{- end -}}
{{- end -}}'
```

You can save the output to a file into the Camblet configuration directory and use it as a service registry. Of course, this is a static file, and you can use a dynamic service registry as well, such as Consul or etcd.
