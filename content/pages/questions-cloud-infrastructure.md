---
title: Cloud and Infrastructure Questions and Answers
seo_title: Cloud and Infrastructure Questions Answered | Stack Row
description: Straight answers to common cloud questions, from what cloud computing is to Kubernetes, serverless, storage, DevOps, observability and AWS versus Azure.
slug: /questions/cloud-infrastructure/
type: page
template: questions
icon: server
category: Cloud and Infrastructure
reviewed: 2026-10-31
author: Darlene Aberin
author_url: /about/darlene-aberin/
sections: cloud, box, database, chart-dots-3
complete: true
---

# Cloud and Infrastructure Questions and Answers

Cloud and infrastructure covers where software runs, how it scales, and what it costs to keep running. These are the questions people search for most, each answered in a few lines, with examples underneath.

## Cloud Computing

Start here if you're new to the cloud or need to explain it to someone else. These answers cover the basics, the main deployment types, and why cloud bills surprise people.

### What Is Cloud Computing?

Cloud computing means renting computing power, storage, and software over the internet instead of owning the hardware. You pay for what you use and can scale up in minutes. The provider runs the data centers. The U.S. National Institute of Standards and Technology (NIST) calls it on-demand access to shared resources.

NIST's [definition of cloud computing](https://csrc.nist.gov/pubs/sp/800/145/final) lists five traits a service needs to count as cloud. Here they are in plain terms.

- **On-demand self-service.** You start a server yourself, with no ticket to a vendor.
- **Broad network access.** You reach it over the internet from any device.
- **Resource pooling.** Many customers share the same physical hardware.
- **Rapid elasticity.** Capacity grows and shrinks to match demand.
- **Measured service.** Usage is metered, so you pay for what you consume.

### How Does Cloud Computing Work?

Cloud providers run huge data centers and slice the servers into virtual machines, containers, and storage. You ask for what you need through a web console or an API. Their software finds spare capacity and starts your resources. Then it bills you by the second, hour, or gigabyte.

[[flow: What happens when you launch a cloud server | You click Launch > The provider finds spare hardware > A virtual machine boots > You connect and deploy > The meter starts]]

### What Are Examples of Cloud Computing?

You probably use cloud computing every day without noticing. Gmail, Dropbox, Netflix, and Microsoft 365 all run on cloud infrastructure. Business examples include Amazon EC2 servers, Google Cloud Storage, Salesforce, and hosted databases like Amazon RDS.

Cloud services fall into three layers. The difference is how much the provider manages for you.

| Model | What you rent | You still manage | Example |
|---|---|---|---|
| IaaS | Virtual servers, storage, networks | Operating system, apps, data | Amazon EC2 |
| PaaS | A ready platform to run code | Your app and data | Google App Engine |
| SaaS | Finished software | Your users and data | Salesforce |

Stack Row's guide to [IaaS versus PaaS](/cloud-infrastructure/iaas-vs-paas/) goes further into how to pick between the first two.

### What Are Public, Private, and Hybrid Clouds?

A public cloud is shared infrastructure rented from providers like AWS, Microsoft Azure, or Google Cloud. A private cloud serves one organization only, on its own hardware or hosted for it. A hybrid cloud connects the two, so workloads can move between them.

Most companies end up mixing models. A bank might keep customer records in a [private cloud](/cloud-infrastructure/private-cloud/) for compliance. Its marketing site could still run on a public one.

### Why Do Businesses Use Cloud Computing?

Businesses use the cloud to avoid big upfront hardware costs and to scale quickly. A startup can launch on a few dollars of servers a month. A retailer can add capacity for Black Friday and drop it in January. It pays only for those weeks.

The usual reasons come down to a few practical wins:

- **No upfront hardware.** Costs move from capital spending to a monthly bill.
- **Speed.** New environments take minutes, not purchase orders.
- **Elastic capacity.** You handle traffic spikes without buying for the peak.
- **Managed services.** Backups, patching, and databases can be handed to the provider.

### What Is the Cloud Shared Responsibility Model?

The shared responsibility model splits security duties between you and the cloud provider. The provider secures the physical data centers, hardware, and core network. You secure what you put in the cloud: your data, user access, settings, and applications. A storage bucket left open to the public is a classic customer-side mistake.

The split shifts depending on the service model. [AWS](https://aws.amazon.com/compliance/shared-responsibility-model/) and [Microsoft](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility) both publish their versions of this chart.

[[layers: Who secures what in IaaS | You: Data, user access, and applications | You: Operating system and firewall settings | Provider: Virtualization and network | Provider: Physical servers and data centers]]

### How Are Cloud Costs Calculated?

Cloud costs are usage multiplied by a unit price. Compute is billed per second or hour. Storage is billed per gigabyte each month, and data transfer per gigabyte sent out. You get discounts for one- or three-year commitments, or for spare capacity the provider can reclaim.

Here's how the pieces add up for a small web app, using sample rates:

| Item | Usage | Sample rate | Monthly cost |
|---|---|---|---:|
| Server | 730 hours | $0.05 per hour | $36.50 |
| Storage | 100 GB | $0.02 per GB | $2.00 |
| Data sent to users | 200 GB | $0.09 per GB | $18.00 |
| Total | | | $56.50 |

Data transfer is about a third of that bill. The rates here are illustrations, so check your provider's current pricing.

### What Causes Unexpected Cloud Bills?

Surprise cloud bills usually come from forgotten resources, data leaving the cloud, and unchecked logging. A test server left on all month can cost more than the app it supports. So can a job that keeps copying data between regions.

These are the usual causes to check first:

1. Idle servers, disks, and snapshots from old projects.
2. Outbound data transfer, especially between regions or to the internet.
3. Logging and monitoring volume that grows with traffic.
4. Oversized instances picked "to be safe".
5. Managed services billed per request that suddenly get busy.

Setting a budget alert on day one catches most of these early. Observability tools are a common source too, as Stack Row's look at [Datadog observability costs](/cloud-infrastructure/datadog-observability-costs/) shows.

## Kubernetes and Containers

Containers package software so it runs the same everywhere. Kubernetes runs many containers across many machines. These answers explain both without assuming you've used either.

### What Is Kubernetes?

Kubernetes is open-source software that runs and manages containers across a group of machines. It decides where each container runs, restarts ones that crash, and adds copies when traffic grows. Google originally built it, and the Cloud Native Computing Foundation (CNCF) now maintains it.

The [Kubernetes documentation](https://kubernetes.io/docs/concepts/overview/) describes it as a portable platform for containerized workloads and services. In practice, you tell Kubernetes what you want, like three copies of an app. It keeps the cluster matching that request.

### Why Is Kubernetes Called K8s?

K8s is a shortcut for the word Kubernetes. The 8 stands for the eight letters between the K and the s. It's the same style of shortcut as i18n for internationalization. Kubernetes comes from the Greek word for helmsman or pilot. That's why the logo is a ship's wheel.

### Why Is Kubernetes Used?

Teams use Kubernetes to run many containerized apps reliably without managing each server by hand. It handles scaling, restarts, rolling updates, and load balancing automatically. It also runs the same way on AWS, Azure, Google Cloud, or your own hardware. That cuts your dependence on one provider.

The day-to-day benefits look like this:

- **Self-healing.** Crashed containers restart without anyone being paged.
- **Scaling.** Copies are added or removed as load changes.
- **Rolling updates.** New versions go out gradually and can roll back.
- **Portability.** The same setup files work across clouds.

### What Is a Software Container?

A software container is a small package holding an app and everything it needs to run. That means the code, libraries, and settings. Containers share the host's operating system kernel. So they start in seconds and use far less memory than a virtual machine.

Here's how containers compare with virtual machines:

| | Container | Virtual machine |
|---|---|---|
| Includes its own OS | No, shares the host kernel | Yes, a full guest OS |
| Typical size | Megabytes | Gigabytes |
| Start time | Seconds | Minutes |
| Isolation | Process level | Hardware level |

### What Is the Difference Between Kubernetes and Docker?

Docker builds and runs individual containers. Kubernetes runs and manages many containers across many machines. They work together. You package an app with Docker. Kubernetes then decides where it runs, how many copies exist, and what happens when one fails.

Think of Docker as the shipping container and Kubernetes as the port that schedules the ships. The [Docker overview](https://docs.docker.com/get-started/docker-overview/) explains the build side. For another container engine, see Stack Row's [Podman versus Docker](/developer-data/podman-vs-docker/) comparison.

### Why Is Kubernetes Difficult to Manage?

Kubernetes is hard because it has many moving parts and its own vocabulary. A working cluster needs networking, storage, security policies, upgrades, and monitoring set up correctly. Small mistakes, like missing resource limits, can take down other apps sharing the same machines.

Managed services run the control plane for you. Amazon EKS, Azure Kubernetes Service, and Google Kubernetes Engine all do this. That removes a big chunk of the work, but your app setup is still yours.

### When Does a Small Team Need Kubernetes?

Most small teams don't need Kubernetes yet. It pays off once you run many services, need automatic scaling, or deploy several times a day. One web app and a database usually run fine on a managed platform. A single virtual machine often works too.

As a rough guide:

- **Under five services:** a managed app platform or a few VMs is simpler.
- **Five to twenty services:** managed Kubernetes starts to make sense.
- **Twenty or more, or strict uptime targets:** Kubernetes earns its complexity.

### What Is Container Orchestration?

Container orchestration is the automated work of deploying, scaling, connecting, and healing containers across many machines. You don't start containers by hand. An orchestrator like Kubernetes reads your desired setup. It keeps the running system matching it, around the clock.

## Storage and Serverless

Storage and serverless are where many cloud costs hide. These answers explain the storage types, how serverless billing works, and how data transfer fees add up.

### What Is Cloud Storage?

Cloud storage keeps your files and data on a provider's servers, which you reach over the internet. You pay per gigabyte stored each month, plus fees to read or move data. Providers copy data across several devices or locations, so a single disk failure doesn't lose anything.

### How Does Cloud Storage Work?

When you upload a file, the provider stores copies on several disks. It also records where each piece lives. When you ask for the file, the system serves the nearest healthy copy. You pay for the space used and the data you move out.

[[flow: What happens when you upload a file | You upload a file > The provider stores several copies > An index records where they live > You request the file > The nearest copy is returned]]

### What Is Object Storage?

Object storage keeps data as whole objects in a flat pool called a bucket. Each object holds the file, its metadata, and a unique ID. It scales to billions of files cheaply, and you reach it over the web. Amazon S3, Azure Blob Storage, and Google Cloud Storage are the best-known examples.

It's the default home for backups, images, video, logs, and data lakes. It isn't built for data that changes constantly, like a running database.

### What Is the Difference Between Block and Object Storage?

Block storage acts like a hard drive attached to one server, with fast, small reads and writes. Object storage keeps whole files in a bucket you reach over the web. Block suits databases and operating systems. Object suits backups, media, and large archives that grow without limit.

| | Block storage | Object storage |
|---|---|---|
| Works like | A disk attached to a server | A web-accessible bucket |
| Best for | Databases, boot drives | Backups, media, logs |
| Edits | Changes small pieces fast | Replaces whole objects |
| Scale | Sized per volume | Effectively unlimited |
| Example | Amazon EBS | Amazon S3 |

For local and on-premises storage, Stack Row's [RAID calculator](/tools/raid-calculator/) shows how drive layouts trade capacity for protection.

### What Is Serverless Computing?

Serverless computing lets you run code without managing servers. You upload a function, and the provider runs it when something triggers it, like a web request. You're billed only for the time it runs. AWS Lambda, Azure Functions, and Google Cloud Functions are common examples.

### Does Serverless Mean There Are No Servers?

No. Serverless still runs on servers. The name means you don't see or manage them. The provider handles capacity, patching, and scaling, and starts your code only when it's needed. You trade control over the machine for simpler operations and per-use billing.

### When Is Serverless Cheaper Than a Virtual Machine?

Serverless is usually cheaper for spiky or low traffic, because you pay nothing while it's idle. A virtual machine usually wins for steady, high traffic. A busy server costs less per request than millions of billed function runs.

Here's a simple way to compare them.

1. Estimate monthly requests and the average run time of each one.
2. Multiply by your provider's per-request and per-second prices.
3. Compare that total with the monthly cost of a VM that could handle the peak.
4. Repeat at double and triple today's traffic, since the answer often flips.

### How Are Cloud Data Transfer Fees Calculated?

Data transfer fees are charged per gigabyte of data leaving a provider's network or region. Bringing data in is usually free. Sending it out to the internet, to another region, or sometimes between zones costs money. The rate per gigabyte often drops as monthly volume rises.

Transfer time is the other side of moving data. Stack Row's [download time calculator](/tools/download-time-calculator/) estimates how long a big migration or backup will take.

## DevOps and Observability

DevOps and observability are about shipping changes safely and knowing what your systems are doing. These answers cover the practices and the tools behind them.

### What Is DevOps?

DevOps is a way of working where developers and operations staff share ownership of software. Together they build it, release it, and keep it running. It relies on automation, small frequent releases, and fast feedback from production. The goal is to ship changes quickly without breaking things.

### Why Is DevOps Used?

Teams adopt DevOps to release faster with fewer failures. Automated tests and deployments replace slow manual handoffs. A fix can reach users in hours instead of weeks. Shared ownership also means the people who write code see how it behaves in production.

### What Is a CI/CD Pipeline?

A CI/CD pipeline is an automated path from a code change to a running release. Continuous integration (CI) builds and tests every change. Continuous delivery or deployment (CD) ships tested changes to staging or production. Often that takes one approval click, or none at all.

[[flow: A typical CI/CD pipeline | Developer pushes code > Automated build > Automated tests > Deploy to staging > Approval > Deploy to production]]

### What Is Observability?

Observability is how well you can understand what a system is doing from the data it produces. Good observability lets you answer new questions without shipping new code. For example, why is checkout slow in one region? It's built on three kinds of data: logs, metrics, and traces.

### How Is Observability Different From Monitoring?

Monitoring watches for problems you already know about, like CPU over 90%. Observability helps you investigate problems you didn't predict, by exploring detailed logs, metrics, and traces. Monitoring tells you something's wrong. Observability helps you figure out why.

### What Are Logs, Metrics, and Traces?

Logs, metrics, and traces are the three main types of observability data. Logs are timestamped records of events. Metrics are numbers measured over time, like requests per second. Traces follow one request as it moves through every service, showing where time was spent.

The [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/) defines each one. Here's how they compare.

| Signal | What it is | Answers questions like | Example |
|---|---|---|---|
| Logs | Event records with timestamps | What exactly happened? | "Payment failed: card declined" |
| Metrics | Numbers over time | How much, how often? | 1,200 requests per second |
| Traces | One request's path across services | Where did the time go? | 800 ms, 650 of it in the database |

### What Is Infrastructure as Code?

Infrastructure as code (IaC) means defining servers, networks, and databases in text files. Nobody clicks through a console. Tools like Terraform and AWS CloudFormation read those files and build the setup for you. The files live in version control, so changes are reviewed and repeatable.

The practical upside is simple. If someone deletes a test environment, you rebuild it from the same files in minutes.

### What Is the Difference Between AWS and Azure?

AWS and Microsoft Azure offer nearly the same core services under different names. AWS has the longest track record and the widest service catalog. Azure fits most naturally with Microsoft tools like Microsoft 365, Windows Server, and Entra ID. The better choice usually depends on your team's skills and existing software.

The service names map closely. That helps when you're comparing quotes.

| Need | AWS | Azure |
|---|---|---|
| Virtual servers | EC2 | Virtual Machines |
| Object storage | S3 | Blob Storage |
| Serverless functions | Lambda | Azure Functions |
| Managed Kubernetes | EKS | AKS |
| Identity | IAM | Microsoft Entra ID |

Stack Row's roundup of [cloud computing service providers](/cloud-infrastructure/cloud-computing-service-providers/) compares the major platforms in more depth.

## Sources

- [NIST SP 800-145: The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final)
- [Kubernetes documentation: overview](https://kubernetes.io/docs/concepts/overview/)
- [AWS shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [Microsoft: shared responsibility in the cloud](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility)
- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
- [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/)
