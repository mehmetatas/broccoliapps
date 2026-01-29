import { app } from "@broccoliapps/infra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AWS_ACCOUNT_ID = "155305329201";
const AWS_REGION = "us-west-2";
const DOMAIN = "broccoliapps.com";
const SSL_CERT_ARN = "arn:aws:acm:us-east-1:155305329201:certificate/9887f1e9-b8f8-4b9e-9135-3c35d35e7ae1"; // *.broccoliapps.com
const GOOGLE_CLIENT_ID = "841028661003-o4qd27u4euae7bg7cs1imnssj54i32f1.apps.googleusercontent.com";

await app("broccoliapps-com")
  .in(AWS_ACCOUNT_ID, AWS_REGION)
  .env("prod")
  .withDomain(DOMAIN, ["www", ""], SSL_CERT_ARN)
  .withSignIn({
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecretSsmParam: "google-client-secret",
    },
    apple: {
      servicesId: "com.broccoliapps.service",
      teamId: "U7M5529BM7",
      keyId: "8SQMTZLN7Q",
      privateKeySsmParam: "apple-private-key",
    },
  })
  .withSes(DOMAIN)
  .withCloudFrontFn(path.join(__dirname, "cloudfront-fn.js"))
  .withLambdaOrigin("/*", path.join(__dirname, "../dist/ssr")) // SSR (default)
  .withLambdaOrigin("/api/*", path.join(__dirname, "../dist/api")) // API
  .withS3Origin("/static/*", path.join(__dirname, "../dist/static")) // Static assets
  .build();
