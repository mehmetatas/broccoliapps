
## AWS Infra

- Lambda
  - ssr
  - api
  - events (sqs handler)
  - job (eventbridge scheduler)
  - stripe (eventbridge)
- CloudFront
  - Origins
    - Lambda URL (API, SSR)
    - S3 (CDN, SPA)
  - CloudFront Function
- DynamoDB
  - Single table, GSIs, ttl, On demand
- SQS
  - For async jobs
- EventBridge
  - Scheduled Jobs
  - Stripe Bus
- Cognito
  - Signin with Google (optionally Apple & Facebook)
- Certificate Manager
  - SSL Cert
- ClaudWatch
  - Logs
  - Alarms
  - Dashboard
- SSM Params
  - Secrets (google, apple, stripe, jwt etc)
- S3
  - private bucket
  - public bucket (CDN)
- Route 53
  - Domains
- EC2 & ECR
  - Long (15+8 min) running tasks (Article generation)

### Modules

- SSR
  - Lambda with URL (www)
  - CloudFront
  - Route 53 (domain/subdomain)
- API
  - Lambda with URL (api)
  - CloudFront
  - Route 53 (domain/subdomain)
- SheduledJobs
  - Lambda (job)
  - SQS (dlq)
  - EventBridge Schedule
- Events
  - Lambda (sqs)
  - SQS (queues & dlq)
- CDN
  - S3 public bucket
  - CloudFront
  - Route 53 (domain/subdomain)
- Signin
  - Cognito
- Payments
  - EventBridge Bus


```
  project("appname")
    .withDdb(...)
    .withSSR(...)
    .withAPI(...)
    .withCDN(...)
    .withEvents(...)
    .withPayments(...)
    .withScheduledJobs(...)
    .withDashboard(...)
    .build();


```

## Integrations

- Payments: Stripe
- Email: SendGrid
- Captcha: CloudFlare Turstile or Google Captcha 