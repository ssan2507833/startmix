/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

function clearBrowserExtensionInjectionsBeforeHydration() {
  document
    .querySelectorAll(
      [
        "html > *:not(body, head)",
        'script[src*="extension://"]',
        'link[href*="extension://"]',
      ].join(", "),
    )
    .forEach((s) => {
      s.parentNode?.removeChild(s);
    });

  const $targets = {
    html: {
      $elm: document.querySelector("html")!,
      allowedAttributes: ["lang", "dir", "class"],
    },
    head: {
      $elm: document.querySelector("head")!,
      allowedAttributes: [""],
    },
    body: {
      $elm: document.querySelector("body")!,
      allowedAttributes: ["class"],
    },
  };

  Object.entries($targets).forEach(([_, target]) => {
    target.$elm.getAttributeNames().forEach((attr) => {
      if (!target.allowedAttributes.includes(attr)) {
        target.$elm.removeAttribute(attr);
      }
    });
  });
}

function hydrate() {
  clearBrowserExtensionInjectionsBeforeHydration();

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>,
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}
