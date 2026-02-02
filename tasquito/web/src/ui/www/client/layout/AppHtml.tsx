import { AppHtml as AppHtmlBase, type AppHtmlProps as AppHtmlBaseProps } from "@broccoliapps/browser";

export type AppHtmlProps = Omit<AppHtmlBaseProps, "devPort">;

export const AppHtml = (props: AppHtmlProps) =>
  <AppHtmlBase devPort={5082} title="Tasquito" description="Simple task management" {...props} />
;
