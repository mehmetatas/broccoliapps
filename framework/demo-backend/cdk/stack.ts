import { sslCert } from "@apppotato/infra";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domain = "demo.apppotato.com";
    const apexDomain = "apppotato.com";

    // Lookup existing hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, "apppotato-zone", {
      domainName: apexDomain,
    });

    // Wildcard certificate for *.apppotato.com
    const certificate = sslCert(this);

    // S3 bucket for static website content
    const websiteBucket = new s3.Bucket(this, "website-bucket", {
      bucketName: `demo-website-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda function for API
    const apiFunction = new lambda.Function(this, "api-function", {
      functionName: "demo-api",
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../dist/src")),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    // Lambda Function URL
    const functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // CloudFront Function
    const cloudFrontFunction = new cloudfront.Function(this, "cloudfront-fn", {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Skip API requests
  if (uri.startsWith('/api')) {
    return request;
  }

  // Add index.html for root
  if (uri === '/') {
    request.uri = '/index.html';
    return request;
  }

  // Add .html extension for paths without extension (clean URLs)
  if (!uri.includes('.') && !uri.endsWith('/')) {
    request.uri = uri + '.html';
  }

  return request;
}
      `),
      functionName: "demo-cloudfront-fn",
    });

    // Extract Lambda Function URL domain (remove https:// and trailing /)
    const lambdaDomain = cdk.Fn.select(2, cdk.Fn.split("/", functionUrl.url));

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, "distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: cloudFrontFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.HttpOrigin(lambdaDomain, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      domainNames: [domain],
      certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Deploy static website content
    new s3deploy.BucketDeployment(this, "deploy-website", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../www"))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // Route 53 A record
    new route53.ARecord(this, "a-record", {
      zone: hostedZone,
      recordName: "demo",
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // Route 53 AAAA record (IPv6)
    new route53.AaaaRecord(this, "aaaa-record", {
      zone: hostedZone,
      recordName: "demo",
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // Outputs
    new cdk.CfnOutput(this, "distribution-domain", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain",
    });

    new cdk.CfnOutput(this, "website-url", {
      value: `https://${domain}`,
      description: "Website URL",
    });

    new cdk.CfnOutput(this, "api-url", {
      value: `https://${domain}/api`,
      description: "API URL",
    });

    new cdk.CfnOutput(this, "lambda-function-url", {
      value: functionUrl.url,
      description: "Lambda Function URL (direct)",
    });
  }
}

const app = new cdk.App();

new DemoStack(app, "demo-stack", {
  env: {
    account: "155305329201",
    region: "us-west-2",
  },
  crossRegionReferences: true,
});

app.synth();
