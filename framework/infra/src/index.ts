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

class AppBuilder {
  private stack!: cdk.Stack;

  private domain?: string;
  private subdomains?: string[];
  private sslCertArn?: string;
  private ssrLambdaDef?: LambdaDef;
  private apiLambdaDef?: LambdaDef;
  private cloudfrontFnPath?: string;
  private staticPath?: string;
  private signinConfig?: SigninConfig;

  constructor(
    private readonly appName: string,
    private readonly account: string,
    private readonly region: string,
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
    const callbackUrls = [
      ...(!this.isProd() ? ["http://localhost:8080/auth/callback"] : []),
      `https://${appDomain}/auth/callback`,
    ];
    const logoutUrls = [
      ...(!this.isProd() ? ["http://localhost:8080/auth/signout"] : []),
      `https://${appDomain}/auth/signout`,
    ];

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

    // Create Cognito prefix domain (for testing - switch to custom domain later)
    // const domainPrefix = this.resourceName().replace(/\./g, "-"); // broccoliapps-com
    // new cognito.UserPoolDomain(this.stack, this.resourceName("user-pool-domain"), {
    //   userPool,
    //   cognitoDomain: {
    //     domainPrefix,
    //   },
    // });

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

  public withApi(path: string, config?: LambdaConfig) {
    this.apiLambdaDef = { path, config };
    return this;
  }

  public withSsr(path: string, config?: LambdaConfig) {
    this.ssrLambdaDef = { path, config };
    return this;
  }

  public withCloudFrontFn(path: string) {
    this.cloudfrontFnPath = path;
    return this;
  }

  public withStatic(path: string) {
    this.staticPath = path;
    return this;
  }

  public withSignIn(config: SigninConfig) {
    this.signinConfig = config;
    return this;
  }

  private configureStaticBucket(isDefaultOrigin = false) {
    const bucket = new s3.Bucket(this.stack, this.resourceName("static-bucket"), {
      bucketName: this.resourceName("static"),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: this.isProd() ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !this.isProd(),
    });

    // Deploy static files to S3
    // If this is the default origin (static-only site), deploy to root
    // Otherwise, deploy under /static/ prefix
    const deployment = new s3deploy.BucketDeployment(this.stack, this.resourceName("static-deploy"), {
      sources: [s3deploy.Source.asset(this.staticPath!)],
      destinationBucket: bucket,
      destinationKeyPrefix: isDefaultOrigin ? undefined : "static",
      cacheControl: [s3deploy.CacheControl.maxAge(cdk.Duration.days(365))],
    });

    return { bucket, deployment };
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
      ...(config?.environment ?? defaultConfig.lambda.environment),
    };
    if (cognitoConfig) {
      environment.COGNITO_USER_POOL_ID = cognitoConfig.userPoolId;
      environment.COGNITO_CLIENT_ID = cognitoConfig.userPoolClientId;
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
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/${this.resourceName()}/*`], // /parameter/{appname}/* or /parameter/{appname}-{env}/*
      })
    );

    return lambdaFn;
  }

  private configureCloudFront({
    ssrLambda,
    apiLambda,
    staticBucket,
  }: {
    ssrLambda?: lambda.Function;
    apiLambda?: lambda.Function;
    staticBucket?: s3.Bucket;
  }) {
    if (!ssrLambda && !staticBucket && !apiLambda) {
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

    // OAC for Lambda origins
    let cfnOacLambda: cloudfront.FunctionUrlOriginAccessControl | undefined;
    if (ssrLambda || apiLambda) {
      cfnOacLambda = new cloudfront.FunctionUrlOriginAccessControl(this.stack, this.resourceName("oac"), {
        originAccessControlName: this.resourceName("oac"),
        signing: new cloudfront.Signing(cloudfront.SigningProtocol.SIGV4, cloudfront.SigningBehavior.ALWAYS),
      });
    }

    // Build behavior configs
    type BehaviorConfig = { path: string; origin: cloudfront.IOrigin; options: cloudfront.AddBehaviorOptions };
    const behaviors: BehaviorConfig[] = [];

    if (ssrLambda) {
      const ssrFunctionUrl = ssrLambda.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.AWS_IAM });
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
      behaviors.push({
        path: "/*",
        origin: new origins.FunctionUrlOrigin(ssrFunctionUrl, {
          originAccessControlId: cfnOacLambda!.originAccessControlId,
          originId: this.resourceName("ssr-origin"),
        }),
        options: {
          compress: true,
          cachePolicy: ssrCachePolicy,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          functionAssociations,
        },
      });
    }

    if (apiLambda) {
      const apiFunctionUrl = apiLambda.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.AWS_IAM });
      behaviors.push({
        path: "/api/*",
        origin: new origins.FunctionUrlOrigin(apiFunctionUrl, {
          originAccessControlId: cfnOacLambda!.originAccessControlId,
          originId: this.resourceName("api-origin"),
        }),
        options: {
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          functionAssociations,
        },
      });
    }

    if (staticBucket) {
      behaviors.push({
        path: "/static/*",
        origin: origins.S3BucketOrigin.withOriginAccessControl(staticBucket, {
          originId: this.resourceName("static-origin"),
        }),
        options: {
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations,
        },
      });
    }

    // Pop first as default, rest as additional
    const [defaultBehavior, ...additionalBehaviors] = behaviors;

    if (!defaultBehavior) {
      throw new Error("No behaviour found!"); // this should never happen, just added to make compiler happy
    }

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
    if (ssrLambda) {
      this.grantLambdaInvoke(distribution, "ssr", ssrLambda);
    }
    if (apiLambda) {
      this.grantLambdaInvoke(distribution, "api", apiLambda);
    }

    return distribution;
  }

  private grantLambdaInvoke(distribution: cloudfront.Distribution, name: "api" | "ssr", lambdaFn: lambda.Function) {
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

  public async build() {
    if (!this.domain) {
      throw new Error("domain not set");
    }
    if (!this.ssrLambdaDef && !this.staticPath) {
      throw new Error("At least one of SSR Lambda or static path must be set");
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

    // Only create table if we have lambdas that need it
    let table: dynamodb.Table | undefined;
    if (this.ssrLambdaDef || this.apiLambdaDef) {
      table = this.configureDdb();
    }

    // Configure SSR lambda if provided
    let ssrLambda: lambda.Function | undefined;
    if (this.ssrLambdaDef) {
      ssrLambda = this.configureLambda("ssr", this.ssrLambdaDef, { table, cognitoConfig });
    }

    // Configure API lambda if provided
    let apiLambda: lambda.Function | undefined;
    if (this.apiLambdaDef) {
      apiLambda = this.configureLambda("api", this.apiLambdaDef, { table, cognitoConfig });
    }

    // Configure static bucket
    // isDefaultOrigin=true when no SSR lambda (static-only site)
    let staticBucket: s3.Bucket | undefined;
    if (this.staticPath) {
      const isDefaultOrigin = !this.ssrLambdaDef;
      const bucketConfig = this.configureStaticBucket(isDefaultOrigin);
      staticBucket = bucketConfig.bucket;

      // Make sure static asset deployment happens before ssrlambda is updated
      // Otherwise ssrlambda can start referencing app.<newbuildid>.css which is not uploaded yet
      ssrLambda?.node.addDependency(bucketConfig.deployment);
    }

    const distribution = this.configureCloudFront({ ssrLambda, apiLambda, staticBucket });

    if (distribution) {
      this.configureRoute53(distribution);
    }

    app.synth();
  }
}

export const app = (appName: string) => ({
  in: (account: string, region: string) => ({
    env: (env: Env) => new AppBuilder(appName, account, region, env),
  }),
});
