---
title: Identity
---

The identity is a fundamental concept in Camblet and it utilizes [SPIFFE](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/#workload) to represent and communicate those. They are fundamental part of the Camblet [policy](../policy/) description format. It is a unique identifier for a workload, and it is used to establish trust between workloads. The identity is represented by a SPIFFE ID, which is a URI that uniquely identifies a workload. The SPIFFE ID is composed of a trust domain and a path. The trust domain is a unique identifier for a trust boundary, and the path is a unique identifier for a workload within the trust domain. These IDs travel through the system in SPIFFE Verifiable Identity Documents (SVIDs).

Camblet creates and uses identity documents in the [X.509-SVID format](https://github.com/spiffe/spiffe/blob/main/standards/X509-SVID.md).
