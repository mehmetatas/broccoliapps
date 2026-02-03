/** @jsxImportSource react */
import { render } from "@react-email/render";
import { MagicLinkEmail, type MagicLinkEmailProps } from "./magic-link";

export const renderMagicLinkEmail = async (props: MagicLinkEmailProps): Promise<string> => {
  return render(<MagicLinkEmail {...props} />);
};
