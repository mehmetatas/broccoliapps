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
    <div class="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
      <Header />
      <main class="flex-1 max-w-2xl mx-auto px-6 py-4 w-full">{children}</main>
      <Footer />
    </div>
  );
};
