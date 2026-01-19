import { app } from "@broccoliapps/infra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: Update these values for your deployment
const AWS_ACCOUNT_ID = "155305329201";
const AWS_REGION = "us-west-2";
const DOMAIN = "networthmonitor.com";
const SSL_CERT_ARN = "arn:aws:acm:us-east-1:155305329201:certificate/53eab553-c9af-412d-8938-b73846b55f4d";

await app("networthmonitor")
  .in(AWS_ACCOUNT_ID, AWS_REGION)
  .env("prod")
  .withDomain(DOMAIN, ["www", ""], SSL_CERT_ARN)
  .withLambdaOrigin("/*", path.join(__dirname, "../dist/www")) // SSR (default)
  .withLambdaOrigin("/api/*", path.join(__dirname, "../dist/api")) // API
  .withLambdaOrigin("/app/*", path.join(__dirname, "../dist/app")) // SPA
  .withS3Origin("/static/*", path.join(__dirname, "../dist/static")) // Static assets
  .build();
