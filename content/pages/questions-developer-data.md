---
title: Developer and Data Questions and Answers
seo_title: Developer and Data Questions Answered | Stack Row
description: Clear answers on SQL, databases, data warehouses and data lakes, API gateways, CI/CD and network monitoring, with examples, tables and diagrams.
slug: /questions/developer-data/
type: page
template: questions
icon: code
category: Developer and Data
reviewed: 2026-11-01
author: Darlene Aberin
author_url: /about/darlene-aberin/
sections: database, table, api, git-merge
complete: true
---

# Developer and Data Questions and Answers

Developer and data questions cover how information is stored, moved, and served to apps. Each answer below starts with a short reply you can use on its own. Examples, tables, and diagrams follow where they help.

## SQL and Databases

Most business software sits on a database, and most databases speak SQL. Start here for the basics, including when a spreadsheet stops being enough.

### What Is SQL?

SQL, short for Structured Query Language, is the standard language for working with relational databases. You use it to ask for data, add rows, change records, and define tables. It reads close to plain English. For example, `SELECT name FROM customers WHERE country = 'US'` returns every US customer's name.

SQL has been an ANSI and ISO standard since the 1980s. Each database adds its own extras on top. PostgreSQL, MySQL, Microsoft SQL Server, and Oracle all use SQL, so the core skills carry over. The [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial-sql-intro.html) is a good free place to start.

### Why Is SQL Used?

SQL is used because one short statement can pull exact answers from huge amounts of structured data. You describe what you want, and the database works out how to fetch it fast. Analysts, developers, and reporting tools all rely on it daily.

Here are the four jobs SQL does most often.

- **Querying.** `SELECT` pulls the rows and columns you ask for.
- **Changing data.** `INSERT`, `UPDATE`, and `DELETE` add, edit, and remove rows.
- **Defining structure.** `CREATE TABLE` sets up tables, columns, and rules.
- **Controlling access.** `GRANT` and `REVOKE` decide who can see or change what.

### What Is a Database?

A database is an organized store of data that software can search, update, and protect. Most business databases are relational. Data sits in tables of rows and columns, linked by shared keys. A database management system, like PostgreSQL or MySQL, handles storage, speed, and access control.

### Why Are Databases Needed?

Files and spreadsheets break down when many people and apps share the same data. That's why databases exist. A database keeps one trusted copy and lets thousands of users read and write safely at once. It also enforces rules, so an order can't reference a customer who doesn't exist.

### What Is Database Normalization?

Database normalization is the practice of organizing tables so each fact is stored once. A customer's address goes in a customers table once. Each order links to it instead of repeating it. That cuts duplicate data and stops records from contradicting each other.

The common levels are called normal forms. Here's what the first three require, in plain terms:

1. **First normal form.** Each cell holds one value, with no lists inside a cell.
2. **Second normal form.** Every column depends on the whole key, never only part of it.
3. **Third normal form.** Columns depend only on the key, not on other columns.

Edgar F. Codd introduced the idea in his relational model work. The [database normalization](https://en.wikipedia.org/wiki/Database_normalization) entry covers the higher forms.

### What Is the Difference Between SQL and NoSQL?

SQL databases store data in fixed tables and use SQL to query them. NoSQL databases use other shapes, like documents, key-value pairs, or graphs. They often trade strict structure for easier scaling. Choose SQL when relationships and accuracy come first, and NoSQL for flexible or very high-volume data.

| | SQL (relational) | NoSQL |
|---|---|---|
| Data shape | Tables with fixed columns | Documents, key-value, graphs, wide columns |
| Schema | Defined up front | Flexible, can change per record |
| Best for | Orders, finance, inventory | Catalogs, sessions, event streams |
| Scaling | Usually a bigger server first | Usually more servers |
| Examples | PostgreSQL, MySQL | MongoDB, Redis, Cassandra |

### When Is SQL Better Than a Spreadsheet?

SQL beats a spreadsheet once data gets large, shared, or important to keep correct. Excel stops at 1,048,576 rows per sheet. A database holds far more. Many users can edit at once without overwriting each other. It also checks data as it's entered.

Watch for these signs that you've outgrown the spreadsheet.

- Files slow down or crash when you filter or sort.
- Several people keep emailing versions of the same file.
- The same customer appears with three spellings.
- You copy data between sheets by hand every week.

### What Is a Database Schema?

A database schema is the blueprint of a database. It lists the tables, their columns, each column's data type, and the links between tables. In PostgreSQL, "schema" also means a named folder that groups tables. Both meanings describe how the data is organized.

Seeing the schema as a diagram makes it much easier to follow. Stack Row's review of [database visualization tools](/developer-data/database-visualization-tools/) compares tools that draw one from a live database.

## Data Architecture

Data architecture decides where data lands, how it's cleaned, and who can analyze it. These answers explain warehouses, lakes, and the pipelines between them.

### What Is a Data Warehouse?

A data warehouse is a central database built for reporting and analysis, not for running daily transactions. It pulls cleaned data from many systems, like sales, billing, and support, into one consistent structure. Analysts then query years of history quickly. Snowflake, Amazon Redshift, and Google BigQuery are common examples.

### What Is a Data Lake?

A data lake is a large store that keeps raw data in its original format. That can mean tables, logs, images, or documents. Data is saved first and shaped later, when someone needs it. Lakes usually sit on cheap object storage, such as Amazon S3, so they can grow to petabytes.

[[flow: How data typically reaches a dashboard | Apps and systems produce data > Raw files land in the data lake > Pipelines clean and shape them > Tables load into the warehouse > Dashboards and reports query them]]

### What Is the Difference Between a Data Lake and a Data Warehouse?

A data warehouse stores cleaned, structured data that's ready for reporting. A data lake stores raw data of any type, to be shaped later. Warehouses suit known business questions and dashboards. Lakes suit data science, machine learning, and data you might need but haven't modeled yet.

| | Data warehouse | Data lake |
|---|---|---|
| Data stored | Cleaned and structured | Raw, any format |
| Structure applied | Before loading | When reading |
| Main users | Business analysts | Data scientists and engineers |
| Typical cost | Higher per terabyte | Lower per terabyte |
| Example | Amazon Redshift | Amazon S3 with a query engine |

AWS has a side-by-side [comparison of warehouses, lakes, and data marts](https://aws.amazon.com/compare/the-difference-between-a-data-warehouse-data-lake-and-data-mart/) if you want more detail.

### When Should a Company Use a Data Lake?

A data lake suits companies with lots of varied, raw data they can't model yet. Clickstreams, sensor feeds, logs, and documents for machine learning are typical examples. If your main need is clean monthly reporting, a warehouse alone is usually simpler.

### What Is a Data Lakehouse?

A data lakehouse combines a lake's cheap, flexible storage with a warehouse's table structure and fast queries. Data stays in open file formats on object storage. A table layer on top, like Delta Lake or Apache Iceberg, adds transactions and schema rules. One copy then serves both reporting and data science.

### How Is Data Stored in a Warehouse?

Warehouses usually store data by column instead of by row. Reports often read a few columns across millions of rows. Column storage means far less reading from disk. Data is also compressed and spread across many machines, which is why large queries return in seconds.

Most warehouses organize tables into a star schema. That's one central fact table, like sales, ringed by dimension tables for customers, products, and dates.

### What Is an ETL Pipeline?

An ETL pipeline is an automated process with three steps. It extracts data from source systems and transforms it into a clean, consistent shape. Then it loads the result into a target, like a warehouse. Most run on a schedule, such as hourly or nightly, so reports stay current.

[[flow: The three steps of ETL | Extract from apps and databases > Transform: clean, join, standardize > Load into the warehouse]]

Many teams now use ELT instead. They load raw data first, then transform it inside the warehouse, where computing power scales easily.

### What Is Data Visualization?

Data visualization is turning numbers into charts, maps, and dashboards so patterns are easy to see. A line chart shows a trend faster than a table of 365 daily values. Business intelligence tools like Power BI, Tableau, and Looker build these visuals from a database or warehouse.

Stack Row's guide to [business intelligence software](/developer-data/business-intelligence-software/) compares the main tools for dashboards and reporting.

## APIs

APIs let software talk to other software. An API gateway sits in front of them and handles the traffic. These answers explain what a gateway does and when you need one.

### What Is an API Gateway?

An API gateway is a single entry point in front of your backend services. It manages every incoming API call. It routes each request to the right service, checks who's calling, limits traffic, and can cache responses. Amazon API Gateway, Kong, and Azure API Management are common examples.

### How Does an API Gateway Work?

An API gateway receives every client request first. It checks the caller's credentials, applies rate limits, and matches the request path to a backend service. It then forwards the request, collects the response, and returns it to the client. It can also log each call and transform the data on the way through.

[[flow: One request through an API gateway | Client sends a request > Gateway checks the API key or token > Rate limit is applied > Request routes to the right service > Response returns to the client]]

### Why Is an API Gateway Used in Microservices?

In a microservices setup, an app might rely on dozens of small services. An API gateway gives clients one address instead of dozens. It also handles shared work, like authentication, rate limits, and logging, in one place. That keeps each service small and stops every team rebuilding the same checks.

Microsoft's architecture guide covers this [gateway pattern for microservices](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway) in more depth.

### What Is the Difference Between an API Gateway and a Load Balancer?

A load balancer spreads traffic across copies of the same service, so no one server gets overloaded. An API gateway works at the application level. It understands API requests, routes them to different services, checks credentials, and applies limits. Many setups use both, with the gateway in front.

| | Load balancer | API gateway |
|---|---|---|
| Main job | Spread traffic across copies | Manage and route API calls |
| Understands requests | Mostly addresses and ports | Paths, headers, keys, tokens |
| Authentication | Usually no | Yes |
| Rate limiting | Basic or none | Per client or per key |
| Example | AWS Elastic Load Balancing | Amazon API Gateway |

### Can an API Gateway Handle Authentication?

Yes. Most API gateways can check API keys and validate JSON Web Tokens (JWTs). Many also connect to identity providers through OAuth 2.0. Requests that fail the check are rejected before they reach your services. That keeps authentication logic in one place instead of inside every backend service.

### Can an API Gateway Apply Rate Limits?

Yes. Rate limiting is one of a gateway's main jobs. You can cap requests per second, per minute, or per day, for each client or API key. Callers who go over the limit get an HTTP 429 "Too Many Requests" response. That protects your services from overload and abuse.

### What Is API Management?

API management is the wider practice of publishing, securing, documenting, and monitoring APIs across their life. It includes the gateway, plus a developer portal, API keys, usage plans, versioning, and analytics. Teams use it when many partners or customers depend on their APIs.

### How Much Does an API Gateway Cost?

API gateway costs depend on the product and your traffic. Managed cloud gateways usually charge per million requests, plus data transfer and any caching. Self-hosted gateways, like Kong's open-source version, have no license fee. You still pay for servers and the time to run them.

To estimate a managed gateway bill, gather these numbers first.

1. Monthly API calls, at today's level and at your expected peak.
2. Average response size, which drives data transfer charges.
3. Any extras you need, like caching, custom domains, or private networking.
4. Your provider's current per-million-request price for each tier.

Stack Row's comparison of [API gateways](/developer-data/api-gateways/) looks at the main options side by side.

## Development Operations

These answers cover how code moves safely from a laptop to production. They also cover how teams watch the network after release.

### What Is CI/CD?

CI/CD stands for continuous integration and continuous delivery or deployment. Its tools build, test, and release code automatically every time a developer makes a change. Small, frequent releases replace big, risky ones, and broken changes get caught within minutes.

The [cloud and infrastructure questions](/questions/cloud-infrastructure/) include a step-by-step diagram of a typical CI/CD pipeline.

### Why Is CI/CD Important?

CI/CD lets teams release faster with fewer failures. Automated tests catch bugs right after they're written, while the change is still fresh. Automated releases remove manual steps where people make mistakes. Small releases are also easier to roll back when something goes wrong.

### What Happens in a CI/CD Pipeline?

A CI/CD pipeline runs a fixed series of automated stages each time code changes. It builds the app, runs tests, checks security, and packages a release. Passing builds then deploy to a test environment and, after approval or automatically, to production. Any failure stops the pipeline and alerts the team.

Here's what each stage usually checks:

1. **Build.** The code compiles and dependencies install cleanly.
2. **Unit tests.** Small pieces of code behave as expected.
3. **Security scans.** Known vulnerable libraries and leaked secrets get flagged.
4. **Integration tests.** Services work together in a test environment.
5. **Deploy.** The release goes to staging, then production.

### What Is Continuous Integration?

Continuous integration means every developer merges code into a shared main branch at least daily. Each merge triggers an automatic build and test run. Problems show up within minutes of the change behind them. They don't pile up for weeks before a release.

Martin Fowler's article on [continuous integration](https://martinfowler.com/articles/continuousIntegration.html) is still the standard explanation of the practice.

### What Is Continuous Delivery?

Continuous delivery means every change that passes the pipeline is ready to release at any time. The final push to production is one approval click. Continuous deployment goes a step further and releases each passing change automatically, with no human approval.

| | Continuous delivery | Continuous deployment |
|---|---|---|
| Release to production | One manual approval | Automatic |
| Who decides timing | A person | The pipeline |
| Suits | Regulated or scheduled releases | Teams shipping many times a day |

### What Is Network Monitoring?

Network monitoring is the ongoing tracking of a network's devices and traffic. The aim is to spot problems before users do. Tools check routers, switches, and servers, measure speed and packet loss, and alert staff when something breaks. Common data sources include SNMP polling, flow records, and ping checks.

Stack Row's review of [network monitoring tools](/cloud-infrastructure/network-monitoring-tools/) compares the main products.

### How Is Network Monitoring Different From Observability?

Network monitoring watches known health checks on devices. Is a switch up? Is a link congested? Observability looks across the whole system, including apps, so you can investigate problems nobody predicted. Monitoring tells you the network is slow. Observability helps show which request or service caused it.

### What Are Logs, Metrics, and Traces?

Logs, metrics, and traces are the three main kinds of data used to understand running software. Logs record individual events, metrics track numbers over time, and traces follow one request across services. Together they show what happened, how often, and where time was spent.

The [cloud and infrastructure questions](/questions/cloud-infrastructure/) have a side-by-side table of all three, with an example of each.

## Sources

- [PostgreSQL: SQL tutorial](https://www.postgresql.org/docs/current/tutorial-sql-intro.html)
- [Database normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [AWS: data warehouse, data lake, and data mart compared](https://aws.amazon.com/compare/the-difference-between-a-data-warehouse-data-lake-and-data-mart/)
- [Microsoft: gateway pattern for microservices](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway)
- [Amazon API Gateway developer guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- [Martin Fowler: continuous integration](https://martinfowler.com/articles/continuousIntegration.html)
