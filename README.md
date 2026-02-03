# broccoliapps

```
framework/
  backend/            # Code that only runs in lambda (ie authn/authz, logging, rate limiter, repo, http routing etc)
  frontend/           # Code that runs on browsers and mobile devices (ie api contract and client helpers)
  mobile/             # Code that runs only in mobile devices (ie components, sign with google, in-app purchases etc)
  browser/            # Code that runs only in browser (components, sign in with google, stripe checkout etc)
  shared/             # Code that runs everywhere (crypto, date formatting etc)
  infra/              # Shared CDK constructs exposed via AppBuilder
  dev-tools/          # Shared build scripts and dev server code

web-and-mobile-project/
  web/
    scripts/          # build, dev server, and some operational scripts (ie backfill gsi)
    build/            # build and some operational scripts (ie backfill gsi)
    cdk/              # CDK stack, uses AppBuilder
    src/
      api/            # /api/* handlers (CloudFront + lambda)
      ui/
        server/       # SSR handlers and SPA fallback, references shared/*.tsx (CloudFront + lambda)
        client/       # App.tsx, React Router, hydration entry
        shared/       # pages & components (.tsx), also shared UI utils
      jobs/           # Scheduled job handlers (EventBridge Schedule + lambda)
      events/         # Async job handlers (SQS + lambda)
      stripe/         # Stripe webhook handlers (EventBridge + lambda)
      domains/        # business logic or domain (users, posts, notifications etc) services used from lambda handlers. repos are also here but not exposed to lambda handlers - only used from services
  mobile/
  shared/             # Code shared between mobile and backend project (ie api contracts and clients)

web-only-project/     # Same as backend just one level up
  scripts/            # build, dev server, and some operational scripts (ie backfill gsi)
  build/              # build and some operational scripts (ie backfill gsi)
  cdk/                # CDK stack, uses AppBuilder
  src/
    api/              # /api/* handlers (CloudFront + lambda)
    ui/
      server/         # SSR handlers and SPA fallback, references shared/*.tsx (CloudFront + lambda)
      client/         # App.tsx, React Router, hydration entry
      shared/         # pages & components (.tsx), also shared UI utils
    jobs/             # Scheduled job handlers (EventBridge Schedule + lambda)
    events/           # Async job handlers (SQS + lambda)
    stripe/           # Stripe webhook handlers (EventBridge + lambda)
    domains/          # business logic or domain (users, posts, notifications etc) services used from lambda handlers. repos are also here but not exposed to lambda handlers - only used from services
```
