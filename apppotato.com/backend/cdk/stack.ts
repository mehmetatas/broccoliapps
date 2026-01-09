import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class BackendStack extends cdk.Stack {
  public readonly apiFunctionUrl: lambda.FunctionUrl;
  public readonly pagesFunctionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedLambdaConfig = {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "../dist")),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
      },
    };

    // API Lambda
    const apiFunction = new lambda.Function(this, "api-function", {
      ...sharedLambdaConfig,
      functionName: "apppotato-backend-api",
      handler: "api.handler",
    });

    this.apiFunctionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // Pages Lambda
    const pagesFunction = new lambda.Function(this, "pages-function", {
      ...sharedLambdaConfig,
      functionName: "apppotato-backend-pages",
      handler: "pages.handler",
    });

    this.pagesFunctionUrl = pagesFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, "distribution", {
      defaultBehavior: {
        origin: new origins.FunctionUrlOrigin(this.pagesFunctionUrl),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.FunctionUrlOrigin(this.apiFunctionUrl),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
    });

    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront Distribution URL",
    });

    new cdk.CfnOutput(this, "ApiFunctionUrl", {
      value: this.apiFunctionUrl.url,
      description: "API Function URL (direct)",
    });

    new cdk.CfnOutput(this, "PagesFunctionUrl", {
      value: this.pagesFunctionUrl.url,
      description: "Pages Function URL (direct)",
    });
  }
}

const app = new cdk.App();

new BackendStack(app, "apppotato-backend", {
  env: {
    account: "155305329201",
    region: "us-west-2",
  },
});

app.synth();
