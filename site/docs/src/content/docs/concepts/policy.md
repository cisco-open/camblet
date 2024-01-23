---
title: Policy
---

Policies serve the purpose of describing the parameters for individual workload identities. They offer a comprehensive approach by allowing the simultaneous specification of connection properties, SPIFFE ID, and policy enforcement settings.

```yaml
selectors:
- linux:uid: [501, 1001]
  linux:binary:name: curl
certificate:
  workloadID: curl
  dns:
  - example.camblet.io
  ttl: 8h
connection:
  mtls: STRICT
  passthrough: false
  allowedSPIFFEIDs:
  - spiffe://trust.domain/workload-id
egress:
- selectors:
  - label: traefik
  certificate:
    workloadID: specific-workload-id
```

## Policy

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `selectors` | []selector | Yes | Selectors comprise one or more sets of labels and their corresponding values. Their purpose is to precisely describe a specific workload. |
| `certificate` | [certificate](#certificate) | Yes | X509 certificate properties. |
| `policy` | [policy](#policy-fields) | No | Policy configuration. |
| `egress` | []policy | No | Egress comprises a set of policies that define the parameters for outgoing connections originating from a specific identity. |

### Certificate

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `workloadID` | string | Yes | The SPIFFE ID's Workload ID component. |
| `dns` | []string | No | Domain names to include in the issued X.509 certificate. |
| `ttl` | string | No | The Time-to-Live (TTL) specifies the duration for which the certificate remains valid. |

### Connection

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `mtls` | [mTLSMode](#mtlsmode) | No | Whether mutual TLS (mTLS) enforcement is applied (relevant exclusively to incoming connections). |
| `passthrough` | boolean | No | Determining whether to activate passthrough mode for the connection. If enabled, data passes through unchanged. |
| `allowedSPIFFEIDs` | []string | No | List of permitted SPIFFE IDs eligible for connection. If the list is empty, all connections are permitted. |

#### mTLSMode

| Name | Description |
| ---- | ----------- |
| STRICT | Connection requires client/peer certificates for authentication. |
| DISABLE | Connection does not use client/peer certificates. |
