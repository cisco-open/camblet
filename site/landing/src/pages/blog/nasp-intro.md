---
title: "Evolution of Zero Trust in workload communication with Nasp"
image: "/blog/nasp-intro/image.png"
author: "Janos Matyas"
tags: [nasp, zero-trust, security, networking, lateral-movement]
category: "Announcements"
publishDate: "2023-12-18 15:00"
layout: "@layouts/BlogLayout.astro"
---

## The Zero Trust paradigm

Zero Trust security, a term now prevalent among security-conscious organizations is often wrapped in the buzz of marketing hype. But beyond the hype what exactly is Zero Trust? Fundamentally, it's a paradigm shift in security, moving away from traditional 'trust but verify' models to a more robust 'never trust, always verify' stance. This strategy encompasses various methods, including Nasp's unique approach, all rooted in key benefits and shared objectives.
Let’s first delve into the advantages of a successful Zero Trust implementation.

- Enhanced Security Posture: Zero trust architectures are continuously authenticating and authorizing users, devices, and applications before granting access to resources.
- Reduced Attack Surface: Zero trust eliminates the traditional network perimeter, which is often a weak point that attackers exploit. By segmenting the network and enforcing granular access controls, zero trust reduces the attack surface, making it more difficult for attackers to gain access to critical systems and data.
- Enhanced Compliance: Zero trust networks can help organizations meet compliance requirements by providing auditable records of user access and activities. This can be particularly important for organizations in regulated industries, such as healthcare and finance.
- Reduced Costs: While implementing a zero trust network may require upfront strategy investment, it can lead to long-term cost savings by reducing the risk of data breaches and other security incidents.

## The Rationale behind Nasp

The shift to microservice architectures has brought new challenges in securing distributed applications. Traditional security models, like perimeter-based security, are often inadequate in the fast-paced and interconnected world of microservices. While Zero Trust is commonly associated with Zero Trust Network Access (ZTNA) — providing secure remote access to an organization's applications and data — its potential extends beyond just perimeter defense. In the realm of internal network security, particularly considering the rise in attacks involving lateral movements and insider threats, Zero Trust principles are becoming increasingly relevant.

Microsegmentation has emerged as a technique to apply Zero Trust in these contexts, aiming to bring access control directly to individual workloads. However, its effectiveness is sometimes limited, lacking in areas like network encryption and robust workload authentication.

The service mesh also emerged as a promising solution, offering automatic traffic encryption and policy enforcement along centralized traffic management and observability. However, they also have their drawbacks. The proxy-based architecture of service meshes can introduce unwanted complexity and resource demands, and their focus is often too narrow, mainly catering to Kubernetes environments.

This is where Nasp steps in, designed to overcome the limitations of both microsegmentation and service meshes. Unlike these solutions, Nasp operates without relying on proxies and still provides robust solutions for workload identity and encryption. Its compatibility extends beyond Kubernetes, covering bare metal, VMs, and containers, making it adaptable to a wide range of infrastructure setups. While Nasp incorporates some features common to service meshes, like mTLS, its approach and scope are distinctly different. Nasp functions at the host level, integrating directly with the operating system to enforce security policies efficiently, without adding layers of complexity.

### A short history

The team behind Nasp comes from a background of building and operating service mesh products. While we always appreciated the potential of service meshes, we envisioned a more optimal implementation, one not reliant on proxies. This led us to initially experiment with a library-based approach. The solution leveraged WebAssembly to overcome programming language barriers. However, this approach required application developers to integrate an additional library, which wasn't ideal.

Realizing this, we pivoted towards moving the entire logic to Kernel space. This shift coincided with a revelation: in our discussions, we found a common thread – most people sought a service mesh in Kubernetes primarily for mTLS, not for its broader capabilities. We decided against creating another service mesh, choosing instead to focus squarely on security, without conflating it with networking concepts. Our goal was clear: develop a tool dedicated to solving the zero trust issue between workloads.

This new direction birthed the latest version of Nasp, which, while incorporating elements from its predecessors, stands as a fundamentally different tool. We retained WebAssembly components, allowing for the execution of OPA (Open Policy Agent) policies within the Linux kernel and enabling packet modification through Wasm filters. But make no mistake, Nasp is not a service mesh. It eschews dependencies like the Istio control plane and sidesteps concerns like traffic management. Instead, Nasp zeroes in on automating workload identities and secure communication, embedding these capabilities at the heart of the system – within the Linux kernel.

## Zero Trust the Nasp way

Having outlined the inception and rationale behind Nasp, let's now shift our focus to the high-level goals of Zero Trust within the framework of our project. It's crucial to synchronize these overarching objectives with our specific implementation. To effectively embody the foundational concepts introduced earlier, we've identified three key pillars as central to achieving zero trust workload security:

- Workload identity-based mTLS
- PKI and certificate management
- Policy-based access control

While this post offers a preliminary overview of these aspects, we intend to delve into the intricate details of our implementation in our documentation and upcoming blog posts. For now, let's briefly touch upon the fundamental ideas behind each pillar.

### Workload identity-based mTLS

Mutual Transport Layer Security (mTLS), an extension to the Transport Layer Security (TLS) protocol, plays a crucial role in enabling workloads to authenticate each other and secure their communications. While traditional TLS involves only the server presenting its certificate, mTLS takes it a step further: both the client and server must present their certificates. These are then verified through public-key cryptography. In the context of Nasp, workloads function similarly to clients and servers, and their certificates act as their 'identities.' Nasp, with assistance from a CA (Certificate Authority) signer (as detailed in the following section), automatically generates these certificates.

Nasp's handling of the entire mTLS protocol within the Linux Kernel brings several distinctive features to the forefront:

- Direct binding of identities to workload host processes, contrasting with the sidecar container approach (like Envoy in Istio).
- The confinement of certificates entirely within Kernel-space, thereby preventing the leakage of private keys into user space.

### PKI and certificate management

Implementing the mTLS protocol is just one facet of the challenge. Equally crucial is managing certificates effectively: obtaining them from a trusted certificate authority, distributing them across workloads, and handling their rotation and revocation. Nasp isn't primarily a certificate management system; however, it's designed for seamless integration with existing systems. This doesn't mean we lack ideas on how to do certificate management properly. Nasp is capable of generating short-lived private keys directly within the Linux Kernel, and it creates certificate signing requests that include industry-standard SPIFFE IDs. These requests are then sent to a certificate authority through a user space agent. This model ensures the private key never leaves the secure confines of the Kernel. As part of our roadmap, we're planning to demonstrate an example integration with Vault, showcasing this model, soon after our launch.

### Policy-based access control

While the first two pillars (PKI management and mTLS) are strongly connected, access control is slightly different. It dictates which entities are allowed to communicate and under what specific conditions. In most zero trust solutions, access control is often the primary focus, and is considered a well-addressed issue in traditional segmentation based implementations. However, these conventional methods typically depend on network-based concepts. This is akin to drawing progressively smaller circles around an object to determine the actions permissible for 'something within that circle'. In contrast, an identity-based approach zeroes in on that precise object, clearly defining the actions permissible for 'that specific object with a distinct identity'. This not only feels more intuitive but also enables the creation of more refined and secure policies, significantly reducing the risks of impersonation.

This post aims to offer a brief overview of the foundational ideas driving our project, without delving into intricate details. To discover more about Nasp, you can explore our [documentation](/docs), stay updated with this blog, or directly experience Nasp by giving it a [try](/docs/start/how-to-install). As a new open source project, Nasp thrives on community participation. Contributions, whether they're ideas, bug reports, code, or just a star on [Github](https://github.com/cisco-open/nasp) are highly valued and integral to its evolution.
