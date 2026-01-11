import { AppBuilder } from "@broccoliapps/infra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AWS_ACCOUNT_ID = "155305329201";
const AWS_REGION = "us-west-2";
const DOMAIN = "broccoliapps.com";
const SSL_CERT_ARN = "arn:aws:acm:us-east-1:155305329201:certificate/9887f1e9-b8f8-4b9e-9135-3c35d35e7ae1"; // *.broccoliapps.com
const STRIPE_EVENT_BUS_ARN = "arn:aws:events:us-west-2:155305329201:event-bus/aws.partner/stripe.com/ed_test_61TYQS0H3YIIDyw9216TYNXU0W8SoZJVj00jM6AFsMMK";

new AppBuilder(AWS_ACCOUNT_ID, AWS_REGION, "broccoliapps-com", "prod")
  .withDomain(DOMAIN, ["", "www"], SSL_CERT_ARN)
  .withApi(path.join(__dirname, "../dist/api"))
  .withSsr(path.join(__dirname, "../dist/ssr"))
  .withEvents(path.join(__dirname, "../dist/events"))
  .withStripe(path.join(__dirname, "../dist/stripe"), STRIPE_EVENT_BUS_ARN)
  .withJobs(path.join(__dirname, "../dist/jobs"))
  .withScheduledJob("weekly-feed-update", "cron(0 0 ? * SUN *)", {
    job: "feed-update-email",
    frequency: "weekly",
  })
  .withScheduledJob("mothly-feed-update", "cron(0 12 1 * ? *)", {
    job: "feed-update-email",
    frequency: "monthly",
  })
  .withCdn()
  .withSignIn({
    email: true,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    apple: {
      keyId: process.env.APPLE_KEY_ID!,
      privateKey: process.env.APPLE_PRIVATE_KEY!,
      servicesId: process.env.APPLE_SERVICES_ID!,
      teamId: process.env.APPLE_TEAM_ID!,
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID!,
      appSecret: process.env.FACEBOOK_APP_SECRET!,
    },
  })
  .withDashboard()
  .build();
