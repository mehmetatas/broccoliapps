// @apppotato/infra
// Reusable CDK constructs for deploying backend/SaaS infrastructure on AWS

import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";

export const VERSION = "0.0.0";

// AWS Account
export const AWS_ACCOUNT_ID = "155305329201";

// Wildcard SSL certificate for *.apppotato.com (us-east-1, required for CloudFront)
const APPPOTATO_WILDCARD_CERT_ARN =
  "arn:aws:acm:us-east-1:155305329201:certificate/6fe35266-10c9-4581-b199-5928ff4deee5";

/**
 * Returns the wildcard SSL certificate for *.apppotato.com
 * Use this for CloudFront distributions on any apppotato.com subdomain
 */
export function sslCert(scope: Construct): acm.ICertificate {
  return acm.Certificate.fromCertificateArn(
    scope,
    "apppotato-ssl-cert",
    APPPOTATO_WILDCARD_CERT_ARN
  );
}
