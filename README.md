<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

To retrieve passwords from 1password run the following command:

```bash
$ op inject -i env.dev.tpl -o .env.development
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Generating migrations

```bash
  # Inject Staging environment variables
  $ make generate_env_stg
```

```ts
  // src/config/typeorm.ts
  import { DataSource, DataSourceOptions } from "typeorm";
  // Change dotenv path to '.env.stg'
  dotenvConfig({ path: '.env.stg' });

  export const config: TypeOrmModuleOptions = {
    ...
  }
```

```bash
  # Run the project in develpoment until it's up, then kill it 
  $ npm run start:dev
```

```bash
  # Generate a new migration 
  $ npm run migration:generate $migration_name
```


```ts
  // src/config/typeorm.ts
  import { DataSource, DataSourceOptions } from "typeorm";
  // Change dotenv path to '.env.stg'
  dotenvConfig({ path: '.env.development' });

  export const config: TypeOrmModuleOptions = {
    ...
    synchronize: true,
    ...
    // migrationsRun: process.env.DATABASE_MIGRATIONS_RUN === 'true',
  }
```

```bash
  # Generate a new migration 
  $ npm run start:dev
```

> [!IMPORTANT]
> Clean up the migration file generated, as it may generate unnecesary SQL code

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

# Documentation
This is a monolith app of OsmoWallet, this app is hosted in Google Cloud using Cloud run service, it also uses CockroachDB as the main DB to manage ACID transactions, MongoDB to save dynamic data, and Redis to cache some data. In GCP, the Cloud Run Service is connected to a VPC connector that belongs to a specific VPC created, it also is connected to Load Balancing. There are 3 environments: Development, Staging, and Production, each environment has its env variables and they are stored in 1Password. This monolith is connected to a microservice that manages custom Lightning addresses. This microservice is documented in other repository. I've included a diagram below that shows its architecture.

![image](https://github.com/SingularAgency/osmowallet_core/assets/107064136/d943623f-1e69-4d49-87ea-69d238b0f0dd)

### Google Cloud Cloud Scheduler
We are using Google Cloud Scheduler as Cron Job trigger, to trigger Http requests to Cloud run service and run some automation tasks.

Currently, we have some automation tasks: 
- *Autologin with Ibex*: every 30 min an HTTP request is triggered to Cloud run service to sign in with Ibex and have a new Access token encrypted in DB.
- *Auto Update*: Every day an HTTP request is triggered to a Cloud Run service to get the new exchange rates provided by a Third-Party service, and those new rates are stored in DB to be them Up to date.
- *Reset Limit amounts*: Each user has Daily and Monthly transaction limits, they are reset to zero every day and monthly.
- *Recurrent Buy*: Every minute an HTTP request is triggered to execute user recurrent buys.
- *Withdraw CSV*: The Financial department needs to know the recent withdrawal requests, so an HTTP request is triggered to retrieve all those withdrawal requests and send them via email.
- *Sign Urls*: Some features have upload files, those files are stored in a special bucket (are not public), so every hour an HTTP request is triggered to know what URL files are about to expire and refresh them in DB.
- *Historic rates*: There is an automation task to save historic exchange rates.
- *Partner transactions*: Automation task to notify our partner what transactions could not be completed.
- *Monthly report*: The Financial department wants to have a historic wallet amount copy every month.
  
**Note**
Every Scheduler task needs to be in each environment, for example, if I have a cloud scheduler name is RECURRENT-BUY, should be RECURRENT-BUY-DEV,  RECURRENT-BUY-STG, and  RECURRENT-BUY-PROD. Please follow this convention

### Google Cloud task
We are using it to process dome tasks that take some time. 
Currently, there are some queues:
- *AUTOCONVERT*: To process Autoconvert to receive.
- *BILLS*: To process bills monthly.
- *INFILE*: To process bills using INFILE third party.
- *CASHOUT*: To process withdraw cashout with ibex.
- *SEND BTC*: To process all kinds of BTC sends (Lightning, LNURL, and on-chain).
- *SWAP*: To process swaps (buy and sell)
- *GET KYC COUNTRY*: Sometimes Metamap doesn't have Country data when the KYC is processed, so the queue is just to retry.
- *REFERRAL REFUND*: If the user is not registered in time, this queue is to process all those pending transactions.
- *SEND GLOBALLY*: Once the SEND BTC is processed, this QUEUE is to trigger to Send globally module and check if the transactions belong to SEND GLOBALLY and finish the transaction (STRIKE PAYOUTS).
- *PARTNER NOTIFIER*: Notify partners the transactions are pending.
- *SOLFIN*: To process all transactions are related to solfin.
  
**IMPORTANT**
Follow the same convention as Scheduler, AUTOCONVERT-DEV, AUTOCONVERT-STG, AUTOCONVERT-PROD.

### Redis
We are using Redis to cache Commerces that are stored in MongoDB, also there are 3 environments connected to its VPC, REDIS in production is the only one that has a replica setup. with 5GB of capacity. STG and DEV have 1GB without a replica. 
  
### Cloud Armor
We are using Cloud Armor as WAF (Web Application Firewall), it has all the rules regarding OWASP Guidelines.

### Load balancing
Cloud run service is connected to Load balancing and it has just one IP of entry, Depending on the subdomain it redirects to the Cloud Run service appropriated (DEV, STG, PROD).

### Cloud run service
Cloun run service was set up with a minimum of 1 instance and a max of 100 so far, using the First Generation to have fast init in Cold Start, 1000 as maximum concurrent requests supported, and finally, the environments variables are injected using Secret manager as Service.

### VPC
The VPC created is different from Default, the purpose of this is to separate networks, improve security, and reduce latency with other services such as MongoDB. We are using VPC peering in this case with MongoDB. We will use VPC peering with CockroachDB once the Dev team increases and the r/s increases. DEV environment is the only environment has a special configuration using a static IP to be connected to MongoDB instead of VPC peering, the reason is that the DB in dev is shared and not dedicated.


### Send BTC
In Send BTC there are 3 ways to send BTC (LNURL, Lightning invoices, and Onchain), to simplify the understanding of those flows, the diagram below represents how they work in general terms when the user executes a transaction. Note that some sends come using FIAT currencies, in this case, there is a FAST BTC BUY process before sending, it is not in the diagram

![Send BTC drawio (3)](https://github.com/SingularAgency/osmowallet_core/assets/107064136/ecd3dc58-964c-41da-8105-6b214e409395)

### Send Fiat via SMS + Referral
Referral and Send via SMS share the same flow, the only difference is, that the referral feature is from the ReferralMain Wallet account to the user account, and Send Fiat SMS is from User to User. That means in the Referral module Osmo is the sponsor of funds.
Here is the flow of them, first the user triggers the invitation, and then when the user creates the account or verifies the phone number the transaction will be completed. If the user has not created the account after 5 days (Send via SMS) or 30 days (referral). The transaction will be reverted, this last one is triggered by a Google Cloud Scheduler to verify pending invitations.

![referral](https://github.com/SingularAgency/osmowallet_core/assets/107064136/3c656d73-743a-4e05-9b42-676e9ff28cc2)


### SWAP
This is the SWAP flow for SELL and BUY BTC, notice that if the transaction is FIAT to FIAT, after creating the transaction, the entire flow will be recalled with different params.
In addition, the ibex transaction can throw an exception in case OSMO MAIN WALLET does not have sufficient balance, to do the transaction.

| Swap | Recurrent Buy |
|-----------------|-----------------|
| ![Swap drawio](https://github.com/SingularAgency/osmowallet_core/assets/107064136/88059f3a-cf09-4c34-b76f-7632990ccf39)    | ![Recurrent Buy drawio](https://github.com/SingularAgency/osmowallet_core/assets/107064136/1735e2ef-b116-48c8-850e-de13d3b2a812)    |

### Send Globally
For each country, there is a partner (USA -> STRIKE), (MEXICO and Brazil -> THE BITCOIN COMPANY), and so on. So basically we are recycling the same SEND BTC FLOW, so each partner provides us an API to generate Invoices and we need to provide them a Webhook URL to receive payment notifications. This module always will be used to send Fiat over Lightning to a specific bank account.


![Send Globally drawio](https://github.com/SingularAgency/osmowallet_core/assets/107064136/e676f4d3-1aca-48e4-bf25-c8f3a98cbdf5)


### Receive via link

Receive link has 3 methods OSMO, CREDIT_CARD and TRANSFER. All those methods are being recycled:
- OSMO: OSMO is using then same send flow fiat osmo to osmo
- CREDIT_CARD: In this case, we are using tokenization but, there should be a way to pay without tokenization, so in this sense, there is a public method to create a temporary payment method and pay (Check Cards folder)
- TRANSFER: Using the same TRANSFER_BANK payment flow in GT


