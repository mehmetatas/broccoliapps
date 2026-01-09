# Framework

A reusable backend/SaaS framework for building web and mobile applications on AWS.

## Overview

Framework provides a NodeJS/TypeScript library and CDK constructs for rapidly deploying serverless backends. Each project gets its own deployment while sharing common infrastructure patterns and runtime utilities.

## Packages

### @framework/runtime

Runtime library providing:

- **HTTP Routing** - Single Lambda function URL that routes requests to handlers
- **Authentication**
  - Cognito integration (Google & Apple sign-in)
  - Magic link email login (without Cognito)
- **Authorization** - Role-based and permission-based access control
- **Rate Limiting** - Request throttling and abuse prevention
- **DB Repositories** - DynamoDB data access patterns
- **AI Clients** - Claude API wrapper for AI features
- **Email** - SendGrid integration for transactional emails
- **Logging** - Structured logging for Lambda
- **Metrics/Analytics** - Custom metrics and analytics tracking
- **Caching** - In-memory and distributed caching
- **Validation** - Request/response validation with Zod

### @framework/infra

CDK constructs for deploying:

- Lambda function URLs
- CloudFront distributions
- DynamoDB tables
- SQS queues
- EventBridge rules (Stripe webhooks)
- S3 buckets
- Cognito user pools

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront                           │
│                    (CDN + Custom Domain)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lambda Function URL                      │
│                   (Single Entry Point)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  @framework/runtime                   │  │
│  │  ┌─────────┐  ┌──────┐  ┌──────┐  ┌────────────────┐  │  │
│  │  │ Router  │→ │ Auth │→ │ Rate │→ │    Handler     │  │  │
│  │  │         │  │      │  │Limit │  │                │  │  │
│  │  └─────────┘  └──────┘  └──────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │DynamoDB │   │   S3    │   │   SQS   │   │ Cognito │
   └─────────┘   └─────────┘   └─────────┘   └─────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │EventBridge│
                              │ (Stripe)  │
                              └───────────┘
```

## AWS Services

| Service | Purpose |
|---------|---------|
| Lambda (Function URLs) | Compute - handles all HTTP requests |
| CloudFront | CDN, custom domains, SSL |
| DynamoDB | Primary database |
| S3 | File storage |
| SQS | Message queuing |
| EventBridge | Event routing (Stripe webhooks) |
| Cognito | Social authentication (Google, Apple) |

## Usage

Each project imports the framework packages:

```typescript
// Runtime usage
import { createRouter, withAuth, withRateLimit } from '@framework/runtime';

// CDK usage
import { ApiConstruct, DatabaseConstruct } from '@framework/infra';
```

## Project Structure

Projects using this framework typically have:

```
my-project/
├── packages/
│   ├── web/          # Next.js or static site
│   ├── mobile/       # React Native app
│   └── backend/      # Lambda handlers using @framework/runtime
└── infra/            # CDK app using @framework/infra
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```
