import { AppHtml as AppHtmlBase, type AppHtmlProps as AppHtmlBaseProps } from "@broccoliapps/browser";

export type AppHtmlProps = Omit<AppHtmlBaseProps, "devPort">;

export const AppHtml = (props: AppHtmlProps) =>
  <AppHtmlBase devPort={5081} title="Net Worth Monitor" description="Track and monitor your net worth" {...props} />
;
