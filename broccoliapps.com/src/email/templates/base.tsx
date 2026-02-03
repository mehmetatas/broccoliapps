/** @jsxImportSource react */
import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

export type BaseEmailProps = {
  preview: string;
  children: React.ReactNode;
};

export const BaseEmail = ({ preview, children }: BaseEmailProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={content}>{children}</Section>
        <Text style={footer}>This email was sent by Broccoli Apps. If you did not request this email, you can safely ignore it.</Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const content = {
  padding: "0 48px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "32px",
};
