// @broccoliapps/infra
// Reusable CDK constructs for deploying backend/SaaS infrastructure on AWS

import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { fromIni } from "@aws-sdk/credential-providers";
import * as cdk from "aws-cdk-lib";
import {
  aws_certificatemanager as acm,
  aws_cloudfront as cloudfront,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_cloudfront_origins as origins,
  aws_route53 as route53,
  aws_route53_targets as route53targets,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_scheduler as scheduler,
  aws_ses as ses,
} from "aws-cdk-lib";
import fs from "fs";

export type Env = "prod" | string;

export type LambdaConfig = Pick<
  lambda.FunctionProps,
  "memorySize" | "timeout" | "environment" | "reservedConcurrentExecutions"
>;

export const defaultConfig = {
  lambda: {
    memorySize: 256,
    timeout: cdk.Duration.seconds(10),
    environment: {},
    reservedConcurrentExecutions: 10,
  } as LambdaConfig,
  table: {
    gsiCount: 5,
  },
};

type LambdaDef = {
  path: string;
  config?: LambdaConfig;
};

type LambdaOriginDef = {
  pathPattern: string; // e.g., "/*", "/api/*", "/app/*"
  distPath: string;
  config?: LambdaConfig;
};

type S3OriginDef = {
  pathPattern: string; // e.g., "/static/*"
  distPath: string;
};

export type SigninConfig = {
  google?: {
    clientId: string;
    clientSecretSsmParam: string;
  };
  apple?: {
    keyId: string;
    privateKeySsmParam: string;
    servicesId: string;
    teamId: string;
  };
  facebook?: {
    appId: string;
    appSecretSsmParam: string;
  };
};

export type ScheduledJobConfig = {
  schedule: string;  // EventBridge schedule expression: "rate(6 hours)" or "cron(0 3 ? * SUN *)"
  payload: string;  // JSON stringified payload
};

class AppBuilder {
  private stack!: cdk.Stack;

  private domain?: string;
  private subdomains?: string[];
  private sslCertArn?: string;
  private lambdaOrigins: LambdaOriginDef[] = [];
  private s3Origins: S3OriginDef[] = [];
  private cloudfrontFnPath?: string;
  private signinConfig?: SigninConfig;
  private sesDomain?: string;
  private scheduledJobs?: {
    distPath: string;
    jobs: Record<string, ScheduledJobConfig>;
  };

  constructor(
    private readonly appName: string,
    private readonly account: string,
    private readonly region: string,
    private readonly env: Env
  ) { }

  private isProd() {
    return this.env === "prod";
  }

  private resourceName(suffix = ""): string {
    const env = this.isProd() ? "" : `-${this.env}`;
    suffix = suffix ? `-${suffix}` : "";
    return `${this.appName}${env}${suffix}`; // <app> | <app>-<env> | <app>-<env>-<suffix> | <app>-<suffix>
  }

  private subdomain(subdomain: string) {
    if (this.isProd()) {
      return subdomain; // no env suffix appended to prod resources
    }
    if (subdomain === "") {
      return this.env;
    }
    return `${subdomain}-${this.env}`;
  }

  private async getSsmParam(key: string): Promise<string> {
    const paramPath = `/${this.resourceName()}/${key}`;

    console.log("Fetching SSM Param: " + paramPath);

    const profile = process.env.AWS_PROFILE;
    const client = new SSMClient({
      region: this.region,
      credentials: profile ? fromIni({ profile }) : undefined,
    });
    const response = await client.send(
      new GetParameterCommand({
        Name: paramPath,
        WithDecryption: true,
      })
    );
    if (!response.Parameter?.Value) {
      throw new Error(`SSM parameter not found: ${paramPath}`);
    }
    return response.Parameter.Value;
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
    if (subdomains.includes("auth")) {
      throw new Error("auth subdomain is reserved for Cognito");
    }
    this.domain = domain;
    this.subdomains = subdomains.map((sd) => this.subdomain(sd));
    this.sslCertArn = sslCertArn;
    return this;
  }

  public withLambdaOrigin(pathPattern: string, distPath: string, config?: LambdaConfig) {
    this.lambdaOrigins.push({ pathPattern, distPath, config });
    return this;
  }

  public withS3Origin(pathPattern: string, distPath: string) {
    this.s3Origins.push({ pathPattern, distPath });
    return this;
  }

  public withCloudFrontFn(path: string) {
    this.cloudfrontFnPath = path;
    return this;
  }

  // Derive resource name from path pattern: "/api/*" -> "api", "/*" -> "default"
  private nameFromPath(pathPattern: string): string {
    if (pathPattern === "/*") { return "default"; }
    const match = pathPattern.match(/^\/([^/*]+)/);
    return match?.[1] ?? "origin";
  }

  public withSignIn(config: SigninConfig) {
    this.signinConfig = config;
    return this;
  }

  public withScheduledJobs(distPath: string, jobs: Record<string, ScheduledJobConfig>) {
    this.scheduledJobs = { distPath, jobs };
    return this;
  }

  public withSes(domain: string) {
    this.sesDomain = domain;
    return this;
  }

  private configureStaticBucket(pathPattern: string, distPath: string) {
    const name = this.nameFromPath(pathPattern);
    const isDefaultOrigin = pathPattern === "/*";

    const bucket = new s3.Bucket(this.stack, this.resourceName(`${name}-bucket`), {
      bucketName: this.resourceName(name),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: this.isProd() ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !this.isProd(),
    });

    // Deploy static files to S3
    // If this is the default origin (static-only site), deploy to root
    // Otherwise, deploy under prefix stripped from pathPattern
    const prefix = isDefaultOrigin ? undefined : pathPattern.replace(/^\//, "").replace(/\/\*$/, "");
    const deployment = new s3deploy.BucketDeployment(this.stack, this.resourceName(`${name}-deploy`), {
      sources: [s3deploy.Source.asset(distPath)],
      destinationBucket: bucket,
      destinationKeyPrefix: prefix,
      cacheControl: [s3deploy.CacheControl.maxAge(cdk.Duration.days(365))],
    });

    return { bucket, deployment, pathPattern };
  }

  private configureLambda(
    name: string,
    { path, config }: LambdaDef,
    {
      table,
      cognitoConfig,
    }: { table?: dynamodb.Table; cognitoConfig?: { userPoolId: string; userPoolClientId: string } }
  ): lambda.Function {
    // Merge Cognito env vars with user-provided config
    const environment: Record<string, string> = {
      BA_APP_ID: this.appName,
      ...(config?.environment ?? defaultConfig.lambda.environment),
    };
    if (cognitoConfig) {
      environment.COGNITO_USER_POOL_ID = cognitoConfig.userPoolId;
      environment.COGNITO_CLIENT_ID = cognitoConfig.userPoolClientId;
    }
    if (table) {
      environment.TABLE_NAME = table.tableName;
    }
    if (this.sesDomain) {
      environment.SES_DOMAIN = this.sesDomain;
    }

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
      environment,
      reservedConcurrentExecutions:
        config?.reservedConcurrentExecutions ?? defaultConfig.lambda.reservedConcurrentExecutions,
    });

    // All lambdas can read/write table (if table exists)
    if (table) {
      table.grantReadWriteData(lambdaFn);
    }

    // All lambdas can read ssm params
    lambdaFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/${this.resourceName()}/*`, // /parameter/{appname}/* or /parameter/{appname}-{env}/*
        ],
      })
    );

    // Grant SES permissions if SES is configured
    if (this.sesDomain) {
      lambdaFn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: [
            `arn:aws:ses:${this.region}:${this.account}:identity/${this.sesDomain}`,
          ],
        })
      );
    }

    return lambdaFn;
  }

  private configureCloudFront({
    lambdas,
    s3Buckets,
  }: {
    lambdas: Array<{ pathPattern: string; fn: lambda.Function }>;
    s3Buckets: Array<{ pathPattern: string; bucket: s3.Bucket }>;
  }) {
    if (lambdas.length === 0 && s3Buckets.length === 0) {
      // no need to create cloudfront
      return;
    }

    const { domain, subdomains } = this;
    if (!domain || !subdomains) {
      throw new Error("domain and subdomains must be specified for creating cloudfront distribution");
    }

    // Viewer request function
    let functionAssociations: cloudfront.FunctionAssociation[] | undefined;
    if (this.cloudfrontFnPath) {
      functionAssociations = [
        {
          function: new cloudfront.Function(this.stack, this.resourceName("cf-function"), {
            functionName: this.resourceName("cf-function"),
            runtime: cloudfront.FunctionRuntime.JS_2_0,
            code: cloudfront.FunctionCode.fromInline(fs.readFileSync(this.cloudfrontFnPath!, "utf8")),
          }),
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        },
      ];
    }

    // OAC and cache policy for Lambda origins
    let cfnOacLambda: cloudfront.FunctionUrlOriginAccessControl | undefined;
    let lambdaCachePolicy: cloudfront.CachePolicy | undefined;
    if (lambdas.length > 0) {
      cfnOacLambda = new cloudfront.FunctionUrlOriginAccessControl(this.stack, this.resourceName("oac"), {
        originAccessControlName: this.resourceName("oac"),
        signing: new cloudfront.Signing(cloudfront.SigningProtocol.SIGV4, cloudfront.SigningBehavior.ALWAYS),
      });
      lambdaCachePolicy = new cloudfront.CachePolicy(this.stack, this.resourceName("lambda-cache-policy"), {
        cachePolicyName: this.resourceName("lambda-cache-policy"),
        defaultTtl: cdk.Duration.seconds(0),
        minTtl: cdk.Duration.seconds(0),
        maxTtl: cdk.Duration.days(365),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      });
    }

    // Build behavior configs
    type BehaviorConfig = { path: string; origin: cloudfront.IOrigin; options: cloudfront.AddBehaviorOptions };
    const behaviors: BehaviorConfig[] = [];

    // Lambda origins
    for (const { pathPattern, fn } of lambdas) {
      const name = this.nameFromPath(pathPattern);
      const functionUrl = fn.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.AWS_IAM });

      behaviors.push({
        path: pathPattern,
        origin: new origins.FunctionUrlOrigin(functionUrl, {
          originAccessControlId: cfnOacLambda!.originAccessControlId,
          originId: this.resourceName(`${name}-origin`),
        }),
        options: {
          compress: true,
          cachePolicy: lambdaCachePolicy!,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          functionAssociations,
        },
      });
    }

    // S3 origins
    for (const { pathPattern, bucket } of s3Buckets) {
      const name = this.nameFromPath(pathPattern);
      behaviors.push({
        path: pathPattern,
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
          originId: this.resourceName(`${name}-origin`),
        }),
        options: {
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations,
        },
      });
    }

    // Find default behavior (path = "/*")
    const defaultIndex = behaviors.findIndex((b) => b.path === "/*");
    if (defaultIndex === -1) {
      throw new Error("No default origin specified. One origin must have path '/*'");
    }
    const defaultBehavior = behaviors.splice(defaultIndex, 1)[0]!;
    const additionalBehaviors = behaviors;

    const distribution = new cloudfront.Distribution(this.stack, this.resourceName("distribution"), {
      defaultBehavior: {
        origin: defaultBehavior.origin,
        ...defaultBehavior.options,
      },
      additionalBehaviors: Object.fromEntries(
        additionalBehaviors.map((b) => [b.path, { origin: b.origin, ...b.options }])
      ),
      comment: this.resourceName("distribution"),
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      certificate: this.getSslCert(),
      domainNames: subdomains.map((sd) => (sd === "" ? domain : `${sd}.${domain}`)),
      defaultRootObject: "",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Grant Lambda invokes
    for (const { pathPattern, fn } of lambdas) {
      const name = this.nameFromPath(pathPattern);
      this.grantLambdaInvoke(distribution, name, fn);
    }

    return distribution;
  }

  private grantLambdaInvoke(distribution: cloudfront.Distribution, name: string, lambdaFn: lambda.Function) {
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
    if (!this.domain) {
      throw new Error("Cannot create hosted without a domain");
    }
    if (!this.hostedZone) {
      this.hostedZone = route53.HostedZone.fromLookup(this.stack, this.resourceName("hosted-zone"), {
        domainName: this.domain,
      });
    }
    return this.hostedZone;
  }

  private sslCert!: acm.ICertificate;
  private getSslCert(): acm.ICertificate {
    if (!this.sslCertArn) {
      throw new Error("SSL certificate ARN is not set!");
    }
    if (!this.sslCert) {
      this.sslCert = acm.Certificate.fromCertificateArn(this.stack, this.resourceName("ssl-cert"), this.sslCertArn);
    }
    return this.sslCert;
  }

  private configureRoute53(distribution: cloudfront.IDistribution) {
    if (!this.domain || !this.subdomains) {
      throw new Error("Cannot configure route53 without domain and subdomains");
    }
    for (const subdomain of this.subdomains) {
      new route53.ARecord(this.stack, this.resourceName(`alias-record-${subdomain || "-root"}`), {
        zone: this.getHostedZone(),
        recordName: subdomain,
        target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      });
    }
  }

  private configureScheduledJobs(table?: dynamodb.Table) {
    if (!this.scheduledJobs) {
      return;
    }

    const { distPath, jobs } = this.scheduledJobs;

    // Create single Lambda for all jobs
    const jobsLambda = this.configureLambda(
      "jobs",
      { path: distPath },
      { table }
    );

    // Create IAM role for Scheduler to invoke Lambda
    const schedulerRole = new iam.Role(this.stack, this.resourceName("scheduler-role"), {
      roleName: this.resourceName("scheduler-role"),
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
    });
    jobsLambda.grantInvoke(schedulerRole);

    // Create Schedule for each job
    for (const [jobName, config] of Object.entries(jobs)) {
      // Build event payload: { job: "name" } or { job: "name", payload: {...} }
      const parsedPayload = config.payload ? JSON.parse(config.payload) : null;
      const eventPayload = parsedPayload && Object.keys(parsedPayload).length > 0
        ? { job: jobName, payload: parsedPayload }
        : { job: jobName };

      new scheduler.CfnSchedule(this.stack, this.resourceName(`job-${jobName}`), {
        name: this.resourceName(`job-${jobName}`),
        scheduleExpression: config.schedule,
        scheduleExpressionTimezone: "UTC",
        flexibleTimeWindow: { mode: "OFF" },
        state: "ENABLED",
        target: {
          arn: jobsLambda.functionArn,
          roleArn: schedulerRole.roleArn,
          input: JSON.stringify(eventPayload),
        },
      });
    }
  }

  private configureSes() {
    if (!this.sesDomain) {
      return;
    }

    // Create SES email identity with automatic DNS verification via Route53
    new ses.EmailIdentity(this.stack, this.resourceName("ses-identity"), {
      identity: ses.Identity.publicHostedZone(this.getHostedZone()),
      mailFromDomain: `mail.${this.sesDomain}`,
    });

    // Configuration set for reputation metrics
    const configSet = new ses.ConfigurationSet(this.stack, this.resourceName("ses-config-set"), {
      configurationSetName: this.resourceName("ses-config-set"),
      reputationMetrics: true,
      sendingEnabled: true,
    });

    new cdk.CfnOutput(this.stack, this.resourceName("ses-config-set-name"), {
      value: configSet.configurationSetName,
    });
  }

  private async configureCognito(): Promise<{ userPoolId: string; userPoolClientId: string }> {
    if (!this.signinConfig) {
      throw new Error("SigninConfig is required for Cognito");
    }
    if (!this.domain) {
      throw new Error("Domain must be set before configuring Cognito");
    }

    // Create User Pool (social sign-in only, no email/password)
    const userPool = new cognito.UserPool(this.stack, this.resourceName("user-pool"), {
      userPoolName: this.resourceName("user-pool"),
      selfSignUpEnabled: false, // Only social sign-in
      signInAliases: { email: true }, // Email from social providers
      autoVerify: { email: false },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      customAttributes: {
        name: new cognito.StringAttribute({ mutable: true }),
      },
      removalPolicy: this.isProd() ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Create identity providers
    const identityProviders: cognito.UserPoolClientIdentityProvider[] = [];
    const idpDependencies: cdk.Resource[] = [];

    // Google IdP
    if (this.signinConfig.google) {
      const clientId = this.signinConfig.google.clientId;
      const clientSecret = await this.getSsmParam(this.signinConfig.google.clientSecretSsmParam);
      const googleIdp = new cognito.UserPoolIdentityProviderGoogle(this.stack, this.resourceName("google-idp"), {
        userPool,
        clientId,
        clientSecretValue: cdk.SecretValue.unsafePlainText(clientSecret),
        scopes: ["email", "profile", "openid"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        },
      });
      identityProviders.push(cognito.UserPoolClientIdentityProvider.GOOGLE);
      idpDependencies.push(googleIdp);
    }

    // Apple IdP
    if (this.signinConfig.apple) {
      const servicesId = this.signinConfig.apple.servicesId;
      const teamId = this.signinConfig.apple.teamId;
      const keyId = this.signinConfig.apple.keyId;
      const privateKey = await this.getSsmParam(this.signinConfig.apple.privateKeySsmParam);
      const appleIdp = new cognito.UserPoolIdentityProviderApple(this.stack, this.resourceName("apple-idp"), {
        userPool,
        clientId: servicesId,
        teamId,
        keyId,
        privateKey,
        scopes: ["email", "name"],
        attributeMapping: {
          email: cognito.ProviderAttribute.APPLE_EMAIL,
          fullname: cognito.ProviderAttribute.APPLE_NAME,
        },
      });
      identityProviders.push(cognito.UserPoolClientIdentityProvider.APPLE);
      idpDependencies.push(appleIdp);
    }

    // Facebook IdP
    if (this.signinConfig.facebook) {
      const appId = this.signinConfig.facebook.appId;
      const appSecret = await this.getSsmParam(this.signinConfig.facebook.appSecretSsmParam);
      const facebookIdp = new cognito.UserPoolIdentityProviderFacebook(this.stack, this.resourceName("facebook-idp"), {
        userPool,
        clientId: appId,
        clientSecret: appSecret,
        scopes: ["email", "public_profile"],
        attributeMapping: {
          email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
          fullname: cognito.ProviderAttribute.FACEBOOK_NAME,
        },
      });
      identityProviders.push(cognito.UserPoolClientIdentityProvider.FACEBOOK);
      idpDependencies.push(facebookIdp);
    }

    if (identityProviders.length === 0) {
      throw new Error("At least one identity provider must be configured");
    }

    // Build callback/logout URLs
    const primarySubdomain = this.subdomains?.[0] ?? "";
    const appDomain = primarySubdomain === "" ? this.domain : `${primarySubdomain}.${this.domain}`;
    const callbackUrls = ["http://localhost:8080/auth/callback", `https://${appDomain}/auth/callback`];
    const logoutUrls = ["http://localhost:8080/auth/signout", `https://${appDomain}/auth/signout`];

    // Create User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this.stack, this.resourceName("user-pool-client"), {
      userPool,
      userPoolClientName: this.resourceName("user-pool-client"),
      generateSecret: true,
      supportedIdentityProviders: identityProviders,
      accessTokenValidity: this.isProd() ? cdk.Duration.days(1) : cdk.Duration.minutes(5),
      idTokenValidity: this.isProd() ? cdk.Duration.days(1) : cdk.Duration.minutes(5),
      refreshTokenValidity: this.isProd() ? cdk.Duration.days(365) : cdk.Duration.days(7),
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls,
        logoutUrls,
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
      },
    });

    // Add dependencies on IdPs
    for (const idp of idpDependencies) {
      userPoolClient.node.addDependency(idp);
    }

    // Custom cognito domain
    const authDomain = `${this.subdomain("auth")}.${this.domain}`;
    const userPoolDomain = new cognito.UserPoolDomain(this.stack, this.resourceName("user-pool-domain"), {
      userPool,
      customDomain: {
        domainName: authDomain,
        certificate: this.getSslCert(),
      },
    });
    new route53.ARecord(this.stack, this.resourceName("auth-alias-record"), {
      zone: this.getHostedZone(),
      recordName: "auth",
      target: route53.RecordTarget.fromAlias(new route53targets.UserPoolDomainTarget(userPoolDomain)),
    });

    return {
      userPoolId: userPool.userPoolId,
      userPoolClientId: userPoolClient.userPoolClientId,
    };
  }

  public async build() {
    if (!this.domain) {
      throw new Error("domain not set");
    }

    // Validate at least one origin with "/*" exists
    const hasDefaultOrigin =
      this.lambdaOrigins.some((o) => o.pathPattern === "/*") ||
      this.s3Origins.some((o) => o.pathPattern === "/*");
    if (!hasDefaultOrigin) {
      throw new Error("At least one origin must have path '/*' (default behavior)");
    }

    const app = new cdk.App();
    this.stack = new cdk.Stack(app, this.resourceName(), {
      env: {
        account: this.account,
        region: this.region,
      },
    });

    // Configure Cognito if signin is enabled
    let cognitoConfig: { userPoolId: string; userPoolClientId: string } | undefined;
    if (this.signinConfig) {
      cognitoConfig = await this.configureCognito();
    }

    // Create table if we have any lambda origins or scheduled jobs
    let table: dynamodb.Table | undefined;
    if (this.lambdaOrigins.length > 0 || this.scheduledJobs) {
      table = this.configureDdb();
    }

    // Configure all Lambda origins
    const lambdas: Array<{ pathPattern: string; fn: lambda.Function }> = [];
    for (const origin of this.lambdaOrigins) {
      const name = this.nameFromPath(origin.pathPattern);
      const fn = this.configureLambda(name, { path: origin.distPath, config: origin.config }, { table, cognitoConfig });
      lambdas.push({ pathPattern: origin.pathPattern, fn });
    }

    // Configure all S3 origins
    const s3Buckets: Array<{ pathPattern: string; bucket: s3.Bucket; deployment: s3deploy.BucketDeployment }> = [];
    for (const origin of this.s3Origins) {
      const { bucket, deployment, pathPattern } = this.configureStaticBucket(origin.pathPattern, origin.distPath);
      s3Buckets.push({ pathPattern, bucket, deployment });
    }

    // Add dependencies: Lambda origins depend on S3 deployments
    for (const { fn } of lambdas) {
      for (const { deployment } of s3Buckets) {
        fn.node.addDependency(deployment);
      }
    }

    const distribution = this.configureCloudFront({
      lambdas,
      s3Buckets: s3Buckets.map(({ pathPattern, bucket }) => ({ pathPattern, bucket })),
    });

    if (distribution) {
      this.configureRoute53(distribution);
    }

    // Configure scheduled jobs (EventBridge)
    this.configureScheduledJobs(table);

    // Configure SES
    this.configureSes();

    app.synth();
  }
}

export const app = (appName: string) => ({
  in: (account: string, region: string) => ({
    env: (env: Env) => new AppBuilder(appName, account, region, env),
  }),
});
