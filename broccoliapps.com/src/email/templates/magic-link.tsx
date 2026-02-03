/** @jsxImportSource react */
import { Button, Heading, Text } from "@react-email/components";
import { BaseEmail } from "./base";

export type MagicLinkEmailProps = {
  appName: string;
  magicLinkUrl: string;
};

export const MagicLinkEmail = ({ appName, magicLinkUrl }: MagicLinkEmailProps) => (
  <BaseEmail preview={`Sign in to ${appName}`}>
    <Heading style={heading}>Sign in to {appName}</Heading>
    <Text style={paragraph}>Click the button below to sign in to your account. This link will expire in 15 minutes.</Text>
    <Button style={button} href={magicLinkUrl}>
      Sign in to {appName}
    </Button>
    <Text style={paragraph}>If the button doesn't work, copy and paste this link into your browser:</Text>
    <Text style={link}>{magicLinkUrl}</Text>
  </BaseEmail>
);

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
};

const button = {
  backgroundColor: "#22c55e",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px",
  margin: "24px 0",
};

const link = {
  fontSize: "12px",
  lineHeight: "16px",
  color: "#8898aa",
  wordBreak: "break-all" as const,
};
