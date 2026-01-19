const isDev = typeof window === "undefined" ? !process.env.LAMBDA_TASK_ROOT : window.location.hostname === "localhost";

export const globalConfig = {
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
  },
};

export type AppId = keyof typeof globalConfig.apps;
