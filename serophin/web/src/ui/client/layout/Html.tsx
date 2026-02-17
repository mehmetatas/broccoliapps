import { Html as HtmlBase, type HtmlProps as HtmlBaseProps } from "@broccoliapps/browser";
import { Layout } from "./Layout";

export type HtmlProps = Omit<HtmlBaseProps, "devPort" | "clientEntry" | "layout">;

export const Html = (props: HtmlProps) => (
  <HtmlBase devPort={5083} clientEntry="src/ui/client/index.tsx" title="Serophin" description="Meditation & Mindfulness" layout={Layout} {...props} />
);
