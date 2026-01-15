// Check if running in browser or Node, and if in development mode
const isBrowser = typeof window !== "undefined";
const isDev = isBrowser ? window.location.hostname === "localhost" : process.env?.NODE_ENV === "development";
const env = isDev ? "dev" : "prod"; // todo: add stg and more custom env support

export const config = {
  env,
  isProd: env === "prod",
  baseUrl: isDev ? "http://localhost:8080" : "https://www.broccoliapps.com",
  cognito: {
    domain: "auth.broccoliapps.com",
    userPoolId: "us-west-2_sYFFH9lyT",
    userPoolClientId: "43it6h2h4d6sml8ks7199redv2",
    userPoolClientSecretName: "/broccoliapps-com/user-pool-client-secret",
  },
};
