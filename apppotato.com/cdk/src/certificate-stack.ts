import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const apexDomain = "apppotato.com";
    const altApexDomain = "appotato.com";

    // Lookup existing hosted zones
    const apppototoZone = route53.HostedZone.fromLookup(this, "apppotato-com-zone", {
      domainName: apexDomain,
    });

    const appototoZone = route53.HostedZone.fromLookup(this, "appotato-com-zone", {
      domainName: altApexDomain,
    });

    // Create certificate in us-east-1 (required for CloudFront)
    this.certificate = new acm.Certificate(this, "certificate", {
      domainName: apexDomain,
      subjectAlternativeNames: [`*.${apexDomain}`, altApexDomain, `*.${altApexDomain}`],
      validation: acm.CertificateValidation.fromDnsMultiZone({
        [apexDomain]: apppototoZone,
        [`*.${apexDomain}`]: apppototoZone,
        [altApexDomain]: appototoZone,
        [`*.${altApexDomain}`]: appototoZone,
      }),
    });

    // Export certificate ARN for use by other stacks (e.g., expense-tracker)
    new cdk.CfnOutput(this, "certificate-arn", {
      value: this.certificate.certificateArn,
      exportName: "apppotato-cert-arn",
      description: "Wildcard certificate ARN for *.apppotato.com",
    });
  }
}
