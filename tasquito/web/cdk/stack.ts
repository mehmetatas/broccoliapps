import { app } from "@broccoliapps/infra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: Update these values for your deployment
const AWS_ACCOUNT_ID = "155305329201";
const AWS_REGION = "us-west-2";
const DOMAIN = "tasquito.com";
const SSL_CERT_ARN = "arn:aws:acm:us-east-1:155305329201:certificate/f6cac8de-f8fb-49fe-906d-fd5eb3b63f6f"; // createSslCert(AWS_ACCOUNT_ID, DOMAIN);

await app("tasquito")
  .in(AWS_ACCOUNT_ID, AWS_REGION)
  .env("prod")
  .withDomain(DOMAIN, ["www", ""], SSL_CERT_ARN)
  .withCloudFrontFn(path.join(__dirname, "cloudfront-fn.js"))
  .withLambdaOrigin("/*", path.join(__dirname, "../dist/www")) // SSR (default)
  .withLambdaOrigin("/api/*", path.join(__dirname, "../dist/api")) // API
  .withS3Origin("/static/*", path.join(__dirname, "../dist/static")) // Static assets
  .build();