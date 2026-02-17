import { app } from "@broccoliapps/infra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AWS_ACCOUNT_ID = "155305329201";
const AWS_REGION = "us-west-2";
const DOMAIN = "serophin.com";
const SSL_CERT_ARN = "arn:aws:acm:us-east-1:155305329201:certificate/0751e125-cd5b-4713-aeb4-00ba00a92e5f";

await app("serophin")
  .in(AWS_ACCOUNT_ID, AWS_REGION)
  .env("prod")
  .withDomain(DOMAIN, ["www", ""], SSL_CERT_ARN)
  .withCloudFrontFn(path.join(__dirname, "cloudfront-fn.js"))
  .withLambdaOrigin("/*", path.join(__dirname, "../dist/www")) // SSR (default)
  .withS3Origin("/static/*", path.join(__dirname, "../dist/static")) // Static assets
  .build();
