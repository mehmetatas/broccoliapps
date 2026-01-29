/** @jsxImportSource react */
import { render } from "@react-email/render";
import * as React from "react";
import { MagicLinkEmail, type MagicLinkEmailProps } from "./magic-link";

export const renderMagicLinkEmail = async (props: MagicLinkEmailProps): Promise<string> => {
  return render(<MagicLinkEmail {...props} />);
};
