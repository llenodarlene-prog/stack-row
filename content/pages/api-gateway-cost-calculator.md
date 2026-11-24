---
title: API Gateway Cost Calculator
seo_title: API Gateway Cost Calculator for AWS REST, HTTP and WebSocket APIs | Stack Row
description: Estimate Amazon API Gateway costs for REST, HTTP and WebSocket APIs, including request tiers, payload metering, cache and data transfer.
slug: /tools/api-gateway-cost-calculator/
type: page
template: calculator
icon: api
tool: api-gateway-cost
order: 29
category: Cloud and Infrastructure
card: Estimate a monthly Amazon API Gateway bill and compare REST with HTTP APIs.
reviewed: 2026-11-24
primary_keyword: api gateway cost calculator
complete: true
---

# API Gateway Cost Calculator

This API gateway cost calculator estimates a monthly Amazon API Gateway bill for REST, HTTP and WebSocket APIs. It applies AWS's tiered request prices, payload metering, cache hours and data transfer, then compares REST with HTTP pricing for the same traffic.

## How to Use the API Gateway Cost Calculator

Choose the API type, enter monthly requests or messages, and add data transfer out if you know it. REST APIs can add an optional cache. HTTP APIs ask for an average request size, because AWS meters them in 512 KB steps. WebSocket APIs ask for message size and connection minutes.

Load example fills in a REST API with five million calls a month and 14.3 GB of responses, which matches an example on the AWS pricing page.

## API Gateway Pricing Used

| Charge | Rate (US East, N. Virginia) |
|---|---|
| REST API calls | $3.50 per million for the first 333 million, $2.80 for the next 667 million, $2.38 for the next 19 billion, $1.51 above 20 billion |
| HTTP API calls | $1.00 per million for the first 300 million, $0.90 after |
| WebSocket messages | $1.00 per million for the first 1 billion, $0.80 after |
| WebSocket connection minutes | $0.25 per million |
| REST cache | $0.02 an hour for 0.5 GB up to $3.80 an hour for 237 GB |
| Data transfer out | $0.09 per GB (first 10 TB) |

Request, message, connection and cache rates come from the AWS Price List offer file for Amazon API Gateway, published November 23, 2026 and checked November 24, 2026. The data transfer rate follows the worked examples on the [Amazon API Gateway pricing page](https://aws.amazon.com/api-gateway/pricing/). Other regions charge different rates.

## Worked Example

A REST API receives 5 million calls a month and returns 3 KB per call. Request charges are 5 × $3.50 = $17.50. The responses add up to about 14.3 GB, which costs 14.3 × $0.09 = $1.29 in data transfer. The monthly total is about $18.79.

The same traffic on an HTTP API costs $5.00 in request charges, plus the same transfer. HTTP APIs lack some REST features, including caching, usage plans and request validation, so the cheaper option is not always the right one. The [AWS guide to choosing between REST and HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html) lists the differences.

## What Drives an API Gateway Bill

Request volume dominates most bills. Payload size matters for HTTP and WebSocket APIs: a 600 KB HTTP request is billed as two requests, and a 33 KB WebSocket message as two messages. A cache runs every hour it exists, so a 6.1 GB cache costs about $146 a month whether traffic is high or low.

Stack Row's guide to [API gateways](/developer-data/api-gateways/) compares managed gateways beyond AWS. Teams loading data between systems can also review the [data integration tools](/developer-data/best-data-integration-tools/) guide.

## Methodology and Limitations

- Rates are AWS list prices for US East (N. Virginia). Savings plans, private pricing and other regions are not modeled.
- The free tier applies only to new accounts for 12 months. It removes 1 million REST calls, 1 million HTTP calls, 1 million WebSocket messages and 750,000 connection minutes.
- Lambda, CloudWatch logs, AWS WAF, custom domains, private endpoints and VPC links are billed separately.
- Data transfer uses one flat rate. Higher volumes move into cheaper transfer tiers.
- Inputs stay in your browser. A calculation is saved locally after you select Calculate.

## Frequently Asked Questions

### How Much Does AWS API Gateway Cost per Million Requests?

REST APIs start at $3.50 per million calls and HTTP APIs at $1.00 per million in US East (N. Virginia). Both get cheaper at high volume, and data transfer and caching are extra.

### Is an HTTP API Cheaper Than a REST API?

Yes, by about 70% on request charges at the first tier. REST APIs add features such as caching, usage plans, API keys and request validation, so compare features before switching.

### How Are WebSocket APIs Billed?

WebSocket APIs charge for messages and for connection minutes. Messages are metered in 32 KB steps, and ping and pong control frames are not charged.

### Does the Calculator Include the AWS Free Tier?

It can. Choose Apply under Free tier to subtract the monthly free allowance that new AWS accounts receive for 12 months.

## Resources

- [Amazon API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)
- [AWS: Choosing between REST APIs and HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)
- [AWS Price List API](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/price-changes.html)
