import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { type AppId, globalConfig } from "@broccoliapps/shared";
import { renderMagicLinkEmail } from "./templates";

const ses = new SESClient({});

const SES_DOMAIN = process.env.SES_DOMAIN ?? "broccoliapps.com";

type SendMagicLinkEmailParams = {
  to: string;
  app: AppId;
  token: string;
};

export const sendMagicLinkEmail = async ({ to, app, token }: SendMagicLinkEmailParams): Promise<void> => {
  const appName = formatAppName(app);
  const magicLinkUrl = `${globalConfig.apps["broccoliapps-com"].baseUrl}/auth/email-callback?token=${token}`;

  const html = await renderMagicLinkEmail({
    appName,
    magicLinkUrl,
  });

  const fromEmail = `${app}@${SES_DOMAIN}`;

  await ses.send(
    new SendEmailCommand({
      Source: `${appName} <${fromEmail}>`,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: `Sign in to ${appName}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
        },
      },
    }),
  );
};

const formatAppName = (app: AppId): string => {
  const names: Record<AppId, string> = {
    "broccoliapps-com": "Broccoli Apps",
    networthmonitor: "Net Worth Monitor",
    tasquito: "Tasquito",
  };
  return names[app] ?? app;
};
