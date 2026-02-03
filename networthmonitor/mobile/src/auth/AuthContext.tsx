import { AuthProvider as AuthProviderBase, createTokenStorage } from "@broccoliapps/mobile";
import { globalConfig } from "@broccoliapps/shared";
import React from "react";

const storage = createTokenStorage("com.broccoliapps.networthmonitor");

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProviderBase apiBaseUrl={globalConfig.apps.networthmonitor.baseUrl} storage={storage}>
      {children}
    </AuthProviderBase>
  );
};
