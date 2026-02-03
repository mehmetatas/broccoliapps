import { Html as HtmlBase, type HtmlProps as HtmlBaseProps } from "@broccoliapps/browser";
import { Layout } from "./Layout";

export type HtmlProps = Omit<HtmlBaseProps, "devPort" | "layout">;

export const Html = (props: HtmlProps) => <HtmlBase devPort={5082} title="Tasquito" description="Simple task management" layout={Layout} {...props} />;
