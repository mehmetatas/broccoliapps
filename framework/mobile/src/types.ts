import type { AppId, AuthExchangeResponse } from "@broccoliapps/shared";
import type { ImageSourcePropType } from "react-native";

export type LoginColors = {
  background: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
  inputText: string;
  inputPlaceholder: string;
  inputBackground: string;
  accent: string;
  accentDisabled: string;
  googleButtonBg: string;
  googleButtonText: string;
  googleButtonBorder: string;
  appleButtonBg: string;
  appleButtonText: string;
  error: string;
  activityIndicator: string;
};

export type AppColors = LoginColors & {
  backgroundSecondary: string;
  backgroundTertiary: string;
  textMuted: string;
  buttonSecondaryBg: string;
  danger: string;
  warning: string;
};

export type LoginProps = {
  title: string;
  slogan: string;
  appId: AppId;
  onLoginSuccess: (result: AuthExchangeResponse) => Promise<void>;
  colors?: Partial<LoginColors>;
  brandingIcon?: ImageSourcePropType;
};
