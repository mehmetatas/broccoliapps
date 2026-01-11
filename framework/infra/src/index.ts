// @broccoliapps/infra
// Reusable CDK constructs for deploying backend/SaaS infrastructure on AWS

import * as cdk from "aws-cdk-lib";
import {
  aws_certificatemanager as acm,
  aws_cloudfront as cloudfront,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_cloudfront_origins as origins,
  aws_route53 as route53,
  aws_route53_targets as route53targets,
} from "aws-cdk-lib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type Env = "prod" | string;

export type LambdaConfig = Pick<
  lambda.FunctionProps,
  "memorySize" | "timeout" | "environment" | "reservedConcurrentExecutions"
>;

export type CognitoConfig = {
  google?: {
    clientId: string;
    clientSecret: string;
  };
  apple?: {
    servicesId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
  };
  facebook?: {
    appId: string;
    appSecret: string;
  };
  email?: true;
};

export const defaultConfig = {
  lambda: {
    memorySize: 256,
    timeout: cdk.Duration.seconds(10),
    environment: {},
    reservedConcurrentExecutions: 10,
    permissions: [] as Permissions[],
  } as LambdaConfig,
  table: {
    gsiCount: 5,
  },
};

type LambdaDef = {
  path: string;
  config?: LambdaConfig;
};

export class AppBuilder {
  private stack!: cdk.Stack;

  private ssrLambdaDef!: LambdaDef;
  private table!: dynamodb.Table;
  private ssrLambda!: lambda.Function;

  private domain!: string;
  private subdomains!: string[];
  private sslCertArn!: string;

  private apiLambdaDef?: LambdaDef;
  private jobsLambdaDef?: LambdaDef;
  private eventsLambdaDef?: LambdaDef;
  private stripeLambdaDef?: LambdaDef;
  private cloudfrontFnPath?: string;

  private apiLambda?: lambda.Function;
  private eventsLambda?: lambda.Function;
  private jobsLambda?: lambda.Function;
  private stripeLambda?: lambda.Function;

  constructor(
    private readonly account: string,
    private readonly region: string,
    private readonly appName: string,
    private readonly env: Env
  ) {}

  private isProd() {
    return this.env === "prod";
  }

  private resourceName(suffix = ""): string {
    const env = this.isProd() ? "" : `-${this.env}`;
    suffix = suffix ? `-${suffix}` : "";
    return `${this.appName}${env}${suffix}`; // <app> | <app>-<env> | <app>-<env>-<suffix> | <app>-<suffix>
  }

  private configureDdb() {
    const table = new dynamodb.Table(this.stack, this.resourceName("table"), {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: this.resourceName(),
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: this.isProd()
        ? {
            pointInTimeRecoveryEnabled: true,
            recoveryPeriodInDays: 7,
          }
        : undefined,
    });

    for (let i = 1; i <= defaultConfig.table.gsiCount; i++) {
      const indexName = `gsi${i}`;
      table.addGlobalSecondaryIndex({
        indexName,
        partitionKey: { name: `${indexName}_pk`, type: dynamodb.AttributeType.STRING },
        sortKey: { name: `${indexName}_sk`, type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL, // shared GSIs almost always use/need ALL projection
      });
    }

    return table;
  }

  public withDomain(domain: string, subdomains: string[], sslCertArn: string) {
    if (subdomains.length === 0) {
      throw new Error("At least 1 subdomain must be specified");
    }
    this.domain = domain;
    this.subdomains = subdomains;
    this.sslCertArn = sslCertArn;
    return this;
  }

  public withApi(path: string, config?: LambdaConfig) {
    this.apiLambdaDef = { path, config };
    return this;
  }

  public withSsr(path: string, config?: LambdaConfig) {
    this.ssrLambdaDef = { path, config };
    return this;
  }

  public withEvents(path: string, config?: LambdaConfig) {
    this.eventsLambdaDef = { path, config };
    return this;
  }

  public withJobs(path: string, config?: LambdaConfig) {
    this.jobsLambdaDef = { path, config };
    return this;
  }

  public withScheduledJob(name: string, schedule: string, payload: object) {
    return this;
  }

  public withStripe(path: string, eventBusArn: string, config?: LambdaConfig) {
    this.stripeLambdaDef = { path, config };
    return this;
  }

  public withCdn() {
    return this;
  }

  public withSignIn(cognito: CognitoConfig) {
    return this;
  }

  public withDashboard() {
    return this;
  }

  public withCloudFrontFn(path: string) {
    this.cloudfrontFnPath = path;
    return this;
  }

  private configureLambda(name: string, { path, config }: LambdaDef): lambda.Function {
    const lambdaFn = new lambda.Function(this.stack, this.resourceName(name), {
      functionName: this.resourceName(name),
      code: lambda.Code.fromAsset(path),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      // Logging
      logGroup: new logs.LogGroup(this.stack, this.resourceName(`${name}-log-group`), {
        logGroupName: this.resourceName(`${name}-logs`),
        retention: this.isProd() ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
        removalPolicy: this.isProd() ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      }),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: this.isProd() ? lambda.ApplicationLogLevel.INFO : lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      // Config with defaults
      memorySize: config?.memorySize ?? defaultConfig.lambda.memorySize,
      timeout: config?.timeout ?? defaultConfig.lambda.timeout,
      environment: config?.environment ?? defaultConfig.lambda.environment,
      reservedConcurrentExecutions:
        config?.reservedConcurrentExecutions ?? defaultConfig.lambda.reservedConcurrentExecutions,
    });

    // All lambdas can read/write table
    this.table.grantReadWriteData(lambdaFn);

    // All lambdas can read ssm params
    lambdaFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/${this.resourceName()}/*`], // /parameter/{appname}/* or /parameter/{appname}-{env}/*
      })
    );

    return lambdaFn;
  }

  private configureCloudFront() {
    const ssrFunctionUrl = this.ssrLambda!.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.AWS_IAM });
    const apiFunctionUrl = this.apiLambda?.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.AWS_IAM });

    // OAC for CloudFront to access Lambda. To invoke LambdaURL with IAM auth, CloudFront needs to sign the POST and PUT requests.
    const cfnOacLambda = new cloudfront.FunctionUrlOriginAccessControl(this.stack, this.resourceName("oac"), {
      originAccessControlName: this.resourceName("oac"),
      description: "OAC for CloudFront to access Lambda",
      signing: new cloudfront.Signing(cloudfront.SigningProtocol.SIGV4, cloudfront.SigningBehavior.ALWAYS),
    });

    // SSR pages can be cached
    const ssrCachePolicy = new cloudfront.CachePolicy(this.stack, this.resourceName("www-cache-policy"), {
      cachePolicyName: this.resourceName("www-cache-policy"),
      comment: "Cache policy for SSR endpoints",
      defaultTtl: cdk.Duration.seconds(0),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(365),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Create cloudfront function
    let functionAssociations: cloudfront.FunctionAssociation[] | undefined = undefined;
    if (this.cloudfrontFnPath) {
      functionAssociations = [
        {
          function: new cloudfront.Function(this.stack, this.resourceName("cf-function"), {
            functionName: this.resourceName("cf-function"),
            runtime: cloudfront.FunctionRuntime.JS_2_0,
            // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html#functions-event-structure-example
            code: cloudfront.FunctionCode.fromInline(
              fs.readFileSync(path.join(__dirname, "cloudfront-fn/handler.js"), "utf8")
            ),
          }),
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        },
      ];
    }

    // Create CloudFront distribution with SSR Lambda as default origin
    const distribution = new cloudfront.Distribution(this.stack, this.resourceName("distribution"), {
      defaultBehavior: {
        origin: new origins.FunctionUrlOrigin(ssrFunctionUrl, {
          originAccessControlId: cfnOacLambda.originAccessControlId,
          originId: this.resourceName("ssr-origin"),
        }),
        compress: true,
        cachePolicy: ssrCachePolicy,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        functionAssociations,
      },
      comment: this.resourceName("distribution"),
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      certificate: this.getSslCert(),
      domainNames: this.subdomains.map((sd) => (sd === "" ? this.domain : `${sd}.${this.domain}`)),
      defaultRootObject: "",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Add API Lambda as /api/* origin
    if (apiFunctionUrl) {
      const apiUrlOrigin = new origins.FunctionUrlOrigin(apiFunctionUrl, {
        originAccessControlId: cfnOacLambda.originAccessControlId,
        originId: this.resourceName("api-origin"),
      });
      distribution.addBehavior("/api/*", apiUrlOrigin, {
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        functionAssociations,
      });
    }

    // Allow CloudFront distribution to invoke SSR and API lambdas
    this.grantLambdaInvoke(distribution, "ssr");
    this.grantLambdaInvoke(distribution, "api");

    return distribution;
  }

  private grantLambdaInvoke(distribution: cloudfront.Distribution, name: "api" | "ssr") {
    const lambdaFn = name === "api" ? this.apiLambda : this.ssrLambda;

    if (!lambdaFn) {
      return;
    }

    new lambda.CfnPermission(this.stack, this.resourceName(`cf-${name}-invoke-url-perm`), {
      action: "lambda:InvokeFunctionUrl",
      functionName: lambdaFn.functionName,
      principal: "cloudfront.amazonaws.com",
      sourceArn: `arn:aws:cloudfront::${this.stack.account}:distribution/${distribution.distributionId}`,
    });
    new lambda.CfnPermission(this.stack, this.resourceName(`cf-${name}-invoke-perm`), {
      action: "lambda:InvokeFunction",
      functionName: lambdaFn.functionName,
      principal: "cloudfront.amazonaws.com",
      sourceArn: `arn:aws:cloudfront::${this.stack.account}:distribution/${distribution.distributionId}`,
    });
  }

  private hostedZone!: route53.IHostedZone;
  private getHostedZone(): route53.IHostedZone {
    if (!this.hostedZone) {
      this.hostedZone = route53.HostedZone.fromLookup(this.stack, this.resourceName("hosted-zone"), {
        domainName: this.domain,
      });
    }
    return this.hostedZone;
  }

  private sslCert!: acm.ICertificate;
  private getSslCert(): acm.ICertificate {
    if (!this.sslCert) {
      this.sslCert = acm.Certificate.fromCertificateArn(this.stack, this.resourceName("ssl-cert"), this.sslCertArn);
    }
    return this.sslCert;
  }

  private configureRoute53(distribution: cloudfront.IDistribution) {
    for (const subdomain of this.subdomains) {
      new route53.ARecord(this.stack, this.resourceName(`alias-record-${subdomain || "-root"}`), {
        zone: this.getHostedZone(),
        recordName: subdomain,
        target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      });
    }
  }

  public build() {
    if (!this.domain) {
      throw new Error("domain not set");
    }
    if (!this.ssrLambdaDef) {
      throw new Error("SSR Lambda not set");
    }

    const app = new cdk.App();
    this.stack = new cdk.Stack(app, this.resourceName(), {
      env: {
        account: this.account,
        region: this.region,
      },
    });

    this.table = this.configureDdb();

    this.ssrLambda = this.configureLambda("ssr", this.ssrLambdaDef);

    if (this.apiLambdaDef) {
      this.apiLambda = this.configureLambda("api", this.apiLambdaDef);
    }
    if (this.jobsLambdaDef) {
      this.jobsLambda = this.configureLambda("jobs", this.jobsLambdaDef);
    }
    if (this.eventsLambdaDef) {
      this.eventsLambda = this.configureLambda("events", this.eventsLambdaDef);
    }
    if (this.stripeLambdaDef) {
      this.stripeLambda = this.configureLambda("stripe", this.stripeLambdaDef);
    }

    const distribution = this.configureCloudFront();

    this.configureRoute53(distribution);

    new cdk.CfnOutput(this.stack, this.resourceName("out-cf-url"), {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront Distribution URL",
    });

    app.synth();
  }
}
