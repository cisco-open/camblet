---
draft: false
title: " Plugin-Based Extensibility in Kafka with WebAssembly"
snippet: "WebAssembly can enhance Apache Kafka’s capabilities without altering existing applications, offering a modular approach to cater to evolving business needs."
image: {
    src: "https://images.unsplash.com/photo-1626978022574-b7a8fbf95c8f?q=80&w=3040?q=80&w=3087?&fit=crop&w=430&h=240",
    alt: "data structures & algorithms"
}
publishDate: "2023-11-15 16:39"
category: "Extensibility"
author: "Balazs Berta, Sebastian Toader"
tags: [WASM, Kafka, Filters]
---

WebAssembly can enhance Apache Kafka’s capabilities without altering existing applications, offering a modular approach to cater to evolving business needs. From this blog, you’ll learn the possibilities of using Kafka with WebAssembly:

How Kafka messages are processed using a WebAssembly module – highlighting the steps of deserialization, applying business logic, and then serialization. 
The use of the proxy-wasm-go-sdk for developing Go-based WebAssembly modules. 
A Golang library dedicated to the serialization and deserialization of raw Kafka network messages. 
A PII filter example implementation to ensure data privacy within Kafka streams – and mainly as an example of a reference implementation for filters. 
A world of WebAssembly and Kafka 
At Cisco, we believe that WebAssembly and Apache Kafka together have incredible opportunities, although they aren’t exactly obvious at first thought. One of the most exciting aspects of using WebAssembly Kafka filters is their potential to address many operational challenges. In this blog post, we explore some of these and look at a concrete implementation of how these two technologies can complement each other.

First, let’s look at some of these ideas. 

### Configuration Validating/Mutating Filter 
Positioned on the Kafka API, a filter could validate incoming topic settings based on different rules to ensure that only compliant data is processed through the cluster. This concept is primarily based on Kubernetes validating/mutating webhooks. These could prevent false configurations from getting into the system before that configuration takes effect.

### One-Click Compliance Solution 
Consider the prospect of GDPR, CCPA, or HIPAA compliance. Today, these pose a significant challenge to tackle. A solution for this could be a filter to censor all sensitive data under these regulatory frameworks automatically. Of course, these compliances cover more than this, but the filter could simplify the often-complex task of data sensitivity.

### Audit Log Filter 
From an observability standpoint, this filter could generate detailed records on data handling—tracking data flow, origin, and content—thereby enhancing transparency and facilitating compliance checks. 

### Topology View 
The data from a telemetry-focused WebAssembly filter could be the base of a graph representing consumer-producer-broker interactions, providing an invaluable visual aid for understanding complex data flows.

### Usage-based Billing 
Today, usage-based billing is becoming more common as companies move to minimize operational costs to the last possible measurement. A billing telemetry filter could offer accurate billing, ensuring customers pay only for what they consume.

### Data Mutating Filter 
On the data transformation front, a special filter that interprets mutating rules could allow users to customize data modification according to specific requirements, offering unparalleled flexibility.

### Topic-level Quotas 
Topic-level quotas can be established to extend Kafka’s quota features, allowing for more granular control over resource usage. This prevents a single topic from over-consuming resources and allows for dynamic quota adjustments based on real-time conditions, optimizing resource usage and overall system performance.

As you can see, on the idea level, there are plenty of concepts to work from, but we needed a WebAssembly-compatible Kafka protocol parser to achieve these. So, we created one.

## Kafka protocol serialization/deserialization library 
At a high level, the processing of Kafka messages in a Proxy-Wasm WebAssembly module follows several steps.  

Initially, the module captures the raw Kafka network stream and proceeds to deserialize the data stream, converting it into a structured Kafka message using the Kafka protocol. 
The business logic within the WebAssembly module then processes the payload contained within the structured Kafka message.  
Once the modifications are made, the structured Kafka message is serialized again and forwarded to the Kafka broker. 
Consequently, the broker receives the modified raw data stream, which includes the alterations applied by the business logic to the original data stream. 
To develop our Proxy-Wasm WebAssembly module in Go, we used the proxy-wasm-go-sdk provided by Tetratelabs. This SDK simplifies the development process for Go-based WebAssembly modules. To ensure optimal size efficiency, we sought a dedicated Golang library that exclusively handles the serialization and deserialization of raw Kafka network messages. This library was purposefully designed to focus solely on this functionality without additional features. It is highly flexible and supports the TinyGo compiler and the WebAssembly System Interface (WASI) platform. By adopting this approach, we were able to maintain a small WebAssembly module size while keeping the focus on its primary purpose.

The library’s source code is generated from the Kafka protocol descriptor, following a similar approach to upstream Kafka. The generated code considers several factors to ensure compatibility with TinyGo:

- It does not rely on reflection, as TinyGo has limited support for the reflect package and using reflection can negatively impact performance. 
- It minimizes the use of large packages like fmt to avoid unnecessary increases in binary size unless their usage is necessary. 
- It avoids the use of maps, as they may not provide optimal performance.  Refer to https://tinygo.org/docs/reference/lang-support/#maps for more details. 
- It frequently caches commonly allocated types such as byte slices. 
The Kafka protocol serialization/deserialization Go library can be found on our GitHub.  

Inner workings of a Proxy-Wasm plugin for Kafka 
The Proxy-Wasm plugins receive TCP streams as byte array chunks of varying sizes rather than as complete raw Kafka messages. This is because the hosts are unaware of the Kafka protocol and how the messages are formatted at the network level. Consequently, it is the responsibility of the plugin to slice and rearrange the received data bytes to enable proper deserialization according to the Kafka protocol.

To ensure that the host has enough buffered TCP stream data to perform the deserialization of a Kafka message, the plugin instructs the host to pause invoking the remaining plugins (filters) in the chain until a complete Kafka message is received. This is achieved by returning an ActionPause to the host in response to the OnDownstreamData or OnUpstreamData callbacks. 

![Alt text](https://techblog.cisco.com/wp-content/uploads/2023/09/kafka_proxy_wasm_plugin.svg)

Assembling chunks into a Kafka message for deserialization
Once the host has buffered sufficient data, the plugin retrieves the portion of the data corresponding to a complete raw Kafka message, which can then be deserialized per the Kafka protocol. If there is excess data buffered by the host that does not form a complete Kafka message, it belongs to the next raw message, which is considered incomplete. In such cases, the filter temporarily buffers the incomplete message until the next data chunk is received with the next upstream or downstream event. The incomplete message is then prepended to the subsequent chunk.

If the plugin modifies the deserialized message, it must serialize the modified message as a byte stream and replace the original raw message with it on the host. This can be accomplished by using the ReplaceDownstreamData or ReplaceUpstreamData host function calls. 

## PII filter  
Data privacy is an issue that organizations can’t afford to overlook, especially in the context of streaming data platforms like Kafka. Recognizing this challenge, we’ve developed a straightforward, prototype filter aimed at addressing this very concern.  

For those interested in exploring the implementation details, an example of such a filter can be found at kafka-message-pii-filter. 

The PII filter is Kafka distribution-agnostic and has been designed for easy deployment. With the aid of a distribution vehicle, you can easily place this filter in front of a Kafka broker. The filter is compatible with various distribution vehicles, including Envoy or our LIBNASP solution.

Although the filter is simple and not intended for production use, it serves as a valuable prototype that illustrates the concept. It acts as an additional layer of security by scrutinizing and cleansing incoming data streams for any PII that might have inadvertently slipped through. If developers have already implemented PII filtering at the production level, consider this broker-level filter as a final safety net, offering assurance that no sensitive data infiltrates the Kafka system. 

The architectural design behind this prototype does more than centralize the data-cleansing process; it also provides peace of mind. It sets the stage for a discussion about how Kafka can be configured to comply with stringent data privacy regulations, thus allowing developers to focus on feature development rather than getting entangled in compliance complexities.

Producer side:
```bash
$ root@kafka-client:/# kcat -b kafka-all-broker.kafka:29094 -t example-topic -P
AWS_SECRET_ACCESS_KEY=myawssecretkeyvalue 
My email is example@email.com
```

Consumer side:
```bash
$ root@kafka-client:/# kcat -b kafka-all-broker.kafka:29094 -t example-topic -C
AWS_SECRET_ACCESS_KEY=******************* 
My email is **
```

Takeaways 
While this post discusses how WebAssembly enables adding new capabilities to Kafka without requiring modifications to existing applications, it’s evident that by following the same approach outlined here, any network-based application can be easily extended with new features in a pluggable manner. As businesses evolve, the importance of such pluggable solutions that can be retrofitted to cater to dynamic requirements will only grow, laying the foundation for future-proofed digital infrastructures.

If you have any questions or comments about this topic, contact us on Slack.