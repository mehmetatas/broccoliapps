import { AuthProvider as AuthProviderBase, createTokenStorage } from "@broccoliapps/mobile";
import { globalConfig } from "@broccoliapps/shared";
import { initClient } from "@broccoliapps/tasquito-shared/client";
import React from "react";

const storage = createTokenStorage("com.broccoliapps.tasquito");

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProviderBase apiBaseUrl={globalConfig.apps.tasquito.baseUrl} storage={storage} onInitClient={(cache) => initClient(cache)}>
      {children}
    </AuthProviderBase>
  );
};
