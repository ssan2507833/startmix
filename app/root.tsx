import {
  type MetaFunction,
  type LinksFunction,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import tailwindStylesheetUrl from "#app/styles/tailwind.css?url";
import { getEnv } from "./utils/env.server";
import { useNonce } from "./utils/nonce-provider";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }].filter(Boolean);
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data ? "Remix Starter" : "Error | Remix Starter" },
    { name: "description", content: "Welcome to Remix Starter" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  return { ENV: getEnv() };
}

function Document({
  children,
  nonce,
  env = {},
}: {
  children: React.ReactNode;
  nonce: string;
  env?: Record<string, string>;
}) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader | null>();
  const nonce = useNonce();
  return (
    <Document nonce={nonce} env={data?.ENV}>
      {children}
    </Document>
  );
}

function App() {
  return <Outlet />;
}

export default function AppWithProviders() {
  return <App />;
}
