import { Html as HtmlBase, type HtmlProps as HtmlBaseProps } from "@broccoliapps/browser";
import { Layout } from "./Layout";

export type HtmlProps = Omit<HtmlBaseProps, "devPort" | "layout">;

export const Html = (props: HtmlProps) => (
  <HtmlBase devPort={5081} title="Net Worth Monitor" description="Track and monitor your net worth" layout={Layout} {...props} />
);
