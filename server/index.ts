import crypto from "node:crypto";
import { createRequestHandler } from "@remix-run/express";
import { type ServerBuild } from "@remix-run/node";
import { ip as ipAddress } from "address";
import chalk from "chalk";
import closeWithGrace from "close-with-grace";
import compression from "compression";
import express from "express";
import getPort, { portNumbers } from "get-port";
import helmet from "helmet";
import morgan from "morgan";

const MODE = process.env.NODE_ENV ?? "development";
const IS_PRODUCTION = MODE === "production";
const IS_DEVELOPMENT = MODE === "development";
const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== "false";

const viteDevServer = IS_PRODUCTION
  ? undefined
  : await import("vite").then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
      }),
    );

const app = express();

const getHost = (req: { get: (key: string) => string | undefined }) =>
  req.get("X-Forwarded-Host") ?? req.get("host") ?? "";

// fly is our proxy
app.set("trust proxy", true);

// ensure HTTPS only (X-Forwarded-Proto comes from Fly)
app.use((req, res, next) => {
  if (req.method === "GET") return next();
  const proto = req.get("X-Forwarded-Proto");
  const host = getHost(req);
  if (proto === "http") {
    res.set("X-Forwarded-Proto", "https");
    res.redirect(`https://${host}${req.originalUrl}`);
    return;
  }
  next();
});

// no ending slashes for SEO reasons
// https://github.com/epicweb-dev/epic-stack/discussions/108
app.get("*", (req, res, next) => {
  if (req.path.endsWith("/") && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    const safepath = req.path.slice(0, -1).replace(/\/+/g, "/");
    res.redirect(302, safepath + query);
  } else {
    next();
  }
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("build/client", { maxAge: "1h" }));

app.get(["/img/*", "/favicons/*"], (_req, res) => {
  // if we made it past the express.static for these, then we're missing something.
  // So we'll just send a 404 and won't bother calling other middleware.
  return res.status(404).send("Not found");
});

morgan.token("url", (req) => decodeURIComponent(req.url ?? ""));
app.use(
  morgan("tiny", {
    skip: (req, res) =>
      res.statusCode === 200 && req.url?.startsWith("/resources/healthcheck"),
  }),
);

app.use((_, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("hex");
  next();
});

app.use(
  helmet({
    xPoweredBy: false,
    referrerPolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      // NOTE: Remove reportOnly when you're ready to enforce this CSP
      reportOnly: true,
      directives: {
        "connect-src": [
          MODE === "development" ? "ws:" : null,
          process.env.SENTRY_DSN ? "*.sentry.io" : null,
          "'self'",
        ].filter(Boolean),
        "font-src": ["'self'"],
        "frame-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "script-src": [
          "'strict-dynamic'",
          "'self'",
          "chrome-extension:",
          // @ts-expect-error
          (_, res) => `'nonce-${res.locals.cspNonce}'`,
        ],
        "script-src-attr": [
          // @ts-expect-error
          (_, res) => `'nonce-${res.locals.cspNonce}'`,
        ],
        "upgrade-insecure-requests": null,
      },
    },
  }),
);

async function getBuild() {
  try {
    const build = viteDevServer
      ? await viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : // @ts-expect-error - the file might not exist yet but it will
        await import("../build/server/index.js");

    return { build: build as unknown as ServerBuild, error: null };
  } catch (error) {
    // Catch error and return null to make express happy and avoid an unrecoverable crash
    console.error("Error creating build:", error);
    return { error: error, build: null as unknown as ServerBuild };
  }
}

if (!ALLOW_INDEXING) {
  app.use((_, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  });
}

app.all(
  "*",
  createRequestHandler({
    getLoadContext: (_: any, res: any) => ({
      cspNonce: res.locals.cspNonce,
      serverBuild: getBuild(),
    }),
    mode: MODE,
    build: async () => {
      const { error, build } = await getBuild();
      // gracefully "catch" the error
      if (error) {
        throw error;
      }
      return build;
    },
  }),
);

const desiredPort = Number(process.env.PORT || 3000);
const portToUse = await getPort({
  port: portNumbers(desiredPort, desiredPort + 100),
});
const portAvailable = desiredPort === portToUse;
if (!portAvailable && !IS_DEVELOPMENT) {
  console.log(`⚠️ Port ${desiredPort} is not available.`);
  process.exit(1);
}

const server = app.listen(portToUse, () => {
  if (!portAvailable) {
    console.warn(
      chalk.yellow(
        `⚠️  Port ${desiredPort} is not available, using ${portToUse} instead.`,
      ),
    );
  }
  console.log(`🚀  We have liftoff!`);
  const localUrl = `http://localhost:${portToUse}`;
  let lanUrl: string | null = null;
  const localIp = ipAddress() ?? "Unknown";
  if (/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(localIp)) {
    lanUrl = `http://${localIp}:${portToUse}`;
  }
  console.log(
    `
${chalk.bold("Local:")}            ${chalk.cyan(localUrl)}
${lanUrl ? `${chalk.bold("On Your Network:")}  ${chalk.cyan(lanUrl)}` : ""}
${chalk.bold("Press Ctrl+C to stop")}
		`.trim(),
  );
});

closeWithGrace(async ({ err }) => {
  await new Promise((resolve, reject) => {
    server.close((e) => (e ? reject(e) : resolve("ok")));
  });
  if (err) {
    console.error(chalk.red(err));
    console.error(chalk.red(err.stack));
  }
});
