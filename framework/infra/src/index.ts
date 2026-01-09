// @apppotato/infra
// Reusable CDK constructs for deploying backend/SaaS infrastructure on AWS

import * as cdk from "aws-cdk-lib";
import {
  aws_certificatemanager as acm,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_route53 as route53,
  aws_sqs as sqs,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import path from "path";

export const VERSION = "0.0.0";

// AWS Account
export const AWS_ACCOUNT_ID = "155305329201";

export const APEX_DOMAIN = "apppotato.com";

// Wildcard SSL certificate for *.apppotato.com (us-east-1, required for CloudFront)
const APPPOTATO_WILDCARD_CERT_ARN =
  "arn:aws:acm:us-east-1:155305329201:certificate/6fe35266-10c9-4581-b199-5928ff4deee5";

/**
 * Returns the wildcard SSL certificate for *.apppotato.com
 * Use this for CloudFront distributions on any apppotato.com subdomain
 */
export const sslCert = (scope: Construct): acm.ICertificate => {
  return acm.Certificate.fromCertificateArn(scope, "apppotato-ssl-cert", APPPOTATO_WILDCARD_CERT_ARN);
};

export const hostedZone = (scope: Construct, _domain: string): route53.IHostedZone => {
  return route53.HostedZone.fromLookup(scope, "apppotato-hosted-zone", {
    domainName: APEX_DOMAIN,
  });
};

/*****************************/

export type Env = "prod" | string;

export type LambdaConfig = Pick<
  lambda.FunctionProps,
  "memorySize" | "timeout" | "environment" | "reservedConcurrentExecutions"
> & {
  permissions?: Permissions[];
  queue?: {
    queue: sqs.Queue;
    read?: true;
    write?: true;
  };
  table?: {
    table: dynamodb.Table;
    read?: true;
    write?: true;
  };
};

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
  accountId: "155305329201",
  region: "us-west-2",
  apexDomain: "apppotato.com",
  sslCertArn: "arn:aws:acm:us-east-1:155305329201:certificate/6fe35266-10c9-4581-b199-5928ff4deee5",
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

export class AppBuilder {
  private readonly app: cdk.App;
  private readonly stack: cdk.Stack;

  private readonly table: dynamodb.Table;

  private apiLambda?: lambda.Function;
  private ssrLambda?: lambda.Function;
  private eventLambda?: lambda.Function;
  private jobLambda?: lambda.Function;
  private stripeLambda?: lambda.Function;

  constructor(
    private readonly appName: string,
    private readonly env: Env
  ) {
    this.app = new cdk.App();
    this.stack = new cdk.Stack(this.app, this.resourceName("stack"));

    this.table = this.configureDdb();
  }

  private isProd() {
    return this.env === "prod";
  }

  private resourceName(suffix = ""): string {
    const env = this.isProd() ? "" : `-${this.env}`;
    suffix = suffix ? `-${suffix}` : "";
    return `${this.appName}${env}${suffix}`;
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

  public withApi(config?: LambdaConfig) {
    this.apiLambda = this.configureLambda("api", config);
    this.apiLambda.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.AWS_IAM });
    return this;
  }

  public withSsr(config?: LambdaConfig) {
    this.ssrLambda = this.configureLambda("ssr", config);
    this.ssrLambda.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.AWS_IAM });
    return this;
  }

  public withEvents(config?: LambdaConfig) {
    this.eventLambda = this.configureLambda("event", config);
    return this;
  }

  public withScheduledJob(config?: LambdaConfig) {
    if (!this.jobLambda) {
      this.jobLambda = this.configureLambda("event", config);
    }
    return this;
  }

  public withStripe(config?: LambdaConfig) {
    this.stripeLambda = this.configureLambda("stripe", config);
    return this;
  }

  public withCdn() {
    return this;
  }

  public withSignIn() {
    return this;
  }

  public withDashboard() {
    return this;
  }

  private configureLambda(name: string, config?: LambdaConfig): lambda.Function {
    const lambdaFn = new lambda.Function(this.stack, this.resourceName(name), {
      functionName: this.resourceName(name),
      code: lambda.Code.fromAsset(path.join(__dirname, `../build/${name}`)),
      handler: "index.handle",
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
        resources: [
          `arn:aws:ssm:${defaultConfig.region}:${defaultConfig.accountId}:parameter/${this.resourceName()}/*`,
        ], // /parameter/{appname}/* or /parameter/{appname}-{env}/*
      })
    );

    if (config?.permissions) {
      for (const permission of config.permissions) {
        lambdaFn.addToRolePolicy(
          new iam.PolicyStatement({
            actions: permission.actions,
            resources: permission.resources,
          })
        );
      }
    }

    return lambdaFn;
  }

  public build() {}
}

export type Permissions = {
  actions: string[];
  resources: string[];
};
