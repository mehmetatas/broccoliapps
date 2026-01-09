import type { VNode } from "preact";

export type PageComponent<TProps> = (props: TProps) => VNode;
