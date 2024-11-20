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

import { HoneypotProvider } from "remix-utils/honeypot/react";
import tailwindStylesheetUrl from "#app/styles/tailwind.css?url";
import { ClientHintCheck, getHints } from "#app/utils/client-hints";
import { getEnv } from "#app/utils/env.server";
import { honeypot } from "#app/utils/honeypot.server";
import { useNonce } from "#app/utils/nonce-provider";
import { getTheme, type Theme } from "#app/utils/theme.server";

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
  const honeyProps = honeypot.getInputProps();
  return {
    ENV: getEnv(),
    honeyProps,
    requestInfo: {
      hints: getHints(request),
      path: new URL(request.url).pathname,
      userPrefs: {
        theme: getTheme(request),
      },
    },
  };
}

function Document({
  children,
  nonce,
  theme = "light",
  env = {},
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: Theme;
  env?: Record<string, string>;
}) {
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <ClientHintCheck nonce={nonce} />
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
  const theme = useOptionalTheme();
  return (
    <Document nonce={nonce} theme={theme} env={data?.ENV}>
      {children}
    </Document>
  );
}

function App() {
  return <Outlet />;
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  );
}
