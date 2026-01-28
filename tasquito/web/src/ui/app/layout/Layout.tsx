import type { ComponentChildren } from "preact";
import { Footer } from "./Footer";
import { Header } from "./Header";

type LayoutProps = {
  children: ComponentChildren;
  skip?: boolean;
};

export const Layout = ({ children, skip = false }: LayoutProps) => {
  if (skip) {
    return <>{children}</>;
  }

  return (
    <div class="flex flex-col min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-200">
      <Header />
      <main class="flex-1 py-8 px-4 max-w-3xl mx-auto w-full">{children}</main>
      <Footer />
    </div>
  );
};
