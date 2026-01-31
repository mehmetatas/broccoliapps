declare const __DEV__: boolean | undefined;

const isDev =
  typeof window === "undefined"
    ? !process.env.LAMBDA_TASK_ROOT                       // Node.js / Lambda
    : typeof window.location !== "undefined"
      ? window.location.hostname === "localhost"           // Browser
      : typeof __DEV__ !== "undefined" && __DEV__ === true; // React Native

export const globalConfig = {
  isDev,
  isProd: !isDev,
  apps: {
    networthmonitor: {
      baseUrl: isDev ? "http://localhost:8081" : "https://www.networthmonitor.com",
      publicKey: `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArJShNjxl7Fu9z3pgEkdb
7LnT3equW4uIU1zt2AfRw52hGv6XK6Ytzfi/nZg/vRq5QmFHfdrvxXGxHtnnoHSr
LgICsvRfs+tSYx5YGpxUUt18BSM7zvgDpUm70RQImyVk/NjxnrI4qvYGTFuX3VIo
zOPND2d+M1lww+AwSZnU2uJQ1FUpVaxMyuwsWg/4nC36zR0q4iIuAv8fRNaJa1Da
Wbmh8ofH13tQSWXDZyNs/NejhHjb6/WJCyWkvAPQooC0mn5QBXvEHlw8Ca5sh2TP
KA79D8JeSqxuxSbRLwS52HOtmodrsmk6sZ/3d/ofYLWHavc/j2iNGBBaSPA3TVFy
jwIDAQAB
-----END PUBLIC KEY-----
`.trim(),
    },
    "broccoliapps-com": {
      publicKey: "TODO",
      baseUrl: isDev ? "http://localhost:8080" : "https://www.broccoliapps.com",
    },
    tasquito: {
      baseUrl: isDev ? "http://localhost:8082" : "https://www.tasquito.com",
      mobileScheme: "tasquito",
      publicKey: `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuLwnizPrqMsdaDfs9N9r
JS3e/+m6I8lIPx9x3vOiL04xgtzzDLb8zKFySE1ud28GYNnS5m8jQm5BVygiKMNo
d9P9YGFjHWPXesm6wDRdv5rF/WNsCi3hkJ6a7IMI3siStLJijz4UQjWcQdoEUljO
IV58Ocyh+vAtSK+QtkDJ9YmGERq4wXS7H5lNRXGwlA5FBc1PZy/qDWbt3fn6LH4p
7MsRUHKEuu2hizzmTSbAe9rh+LAbOz/qpnklgixJXKrNjauc1eulEoPYBWgIpSmd
s2C08cImZ0wGUMydDBfTGjm9Z4zU2tFNH9gH3R013SMT2N5+u5j6jHX+VKxAvhAl
7QIDAQAB
-----END PUBLIC KEY-----
`.trim(),
    },
  },
};

export type AppId = keyof typeof globalConfig.apps;
