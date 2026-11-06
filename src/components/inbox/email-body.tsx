"use client";

import DOMPurify from "dompurify";
import { ImageOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type Sanitised = { html: string; blockedImages: number };

/** Clean the email HTML: no scripts, no forms, no event handlers; remote images optional. */
function sanitise(html: string, allowRemoteImages: boolean): Sanitised {
  let blockedImages = 0;
  DOMPurify.removeAllHooks();
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
    if (node.tagName === "IMG" && !allowRemoteImages) {
      const src = node.getAttribute("src") ?? "";
      if (/^https?:/i.test(src)) {
        node.removeAttribute("src");
        node.removeAttribute("srcset");
        node.setAttribute("alt", node.getAttribute("alt") || "");
        blockedImages += 1;
      }
    }
  });
  // NOTE: <style> and inline styles are kept (newsletters need them). They are harmless here:
  // the frame cannot run scripts and its CSP blocks remote url() loads unless images are allowed.
  const clean = DOMPurify.sanitize(html, {
    FORBID_TAGS: [
      "form",
      "input",
      "button",
      "textarea",
      "select",
      "iframe",
      "object",
      "embed",
      "link",
      "meta",
      "base",
    ],
    ADD_ATTR: ["target"],
    FORCE_BODY: true, // keep <style> blocks that come before the content
  });
  DOMPurify.removeAllHooks();
  return { html: clean, blockedImages };
}

/** Readable defaults inside the iframe; emails are shown on a light "paper" in both themes. */
const FRAME_CSS = `
  :root { color-scheme: light; }
  html, body { margin: 0; padding: 0; background: #fff; color: #1f2330; }
  html { overflow-x: auto; }
  body { font: 14px/1.6 Inter, ui-sans-serif, system-ui, sans-serif; padding: 20px 22px; overflow-wrap: anywhere; }
  img { max-width: 100%; height: auto; }
  table { max-width: 100% !important; }
  a { color: #4f46e5; }
  blockquote { border-left: 3px solid #e3e5ec; margin: 0 0 0 4px; padding-left: 12px; color: #5b6070; }
  pre { white-space: pre-wrap; }
`;

function frameDocument(html: string, allowRemoteImages: boolean): string {
  // CSP inside the frame as a second line of defence: no scripts, images only when allowed.
  const imageSources = allowRemoteImages ? "data: cid: https: http:" : "data: cid:";
  return `<!doctype html><html><head><meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${imageSources}; style-src 'unsafe-inline'; font-src data:;">
    <style>${FRAME_CSS}</style></head><body>${html}</body></html>`;
}

function HtmlFrame({ html }: { html: string }) {
  const [allowImages, setAllowImages] = useState(false);
  const [height, setHeight] = useState(240);
  const frame = useRef<HTMLIFrameElement>(null);
  const { html: clean, blockedImages } = useMemo(() => sanitise(html, allowImages), [html, allowImages]);

  // Grow the iframe to its content (same-origin frame without scripts lets us measure it).
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      const body = node.contentDocument?.body;
      if (!body) return;
      setHeight(Math.max(120, body.scrollHeight + 4));
      observer?.disconnect();
      observer = new ResizeObserver(() => setHeight(Math.max(120, body.scrollHeight + 4)));
      observer.observe(body);
    };
    node.addEventListener("load", measure);
    return () => {
      node.removeEventListener("load", measure);
      observer?.disconnect();
    };
  }, [clean]);

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {blockedImages > 0 && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <ImageOff className="size-3.5" />
          <span className="flex-1">
            {blockedImages} remote image{blockedImages === 1 ? "" : "s"} blocked to protect your privacy.
          </span>
          <Button
            size="xs"
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-300 dark:bg-white dark:hover:bg-slate-100"
            onClick={() => setAllowImages(true)}
          >
            Show images
          </Button>
        </div>
      )}
      <iframe
        ref={frame}
        title="Email content"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={frameDocument(clean, allowImages)}
        style={{ height }}
        className="block w-full border-0 transition-[height] duration-200"
      />
    </div>
  );
}

/** HTML email in a sandboxed frame, or the plain-text body. */
export function EmailBody({
  html,
  text,
}: {
  html: string | null | undefined;
  text: string | null | undefined;
}) {
  if (html) return <HtmlFrame html={html} />;
  if (text)
    return (
      <div className="whitespace-pre-wrap rounded-xl border bg-card px-5 py-4 leading-relaxed shadow-sm">
        {text}
      </div>
    );
  return <p className="text-muted-foreground">This email has no text content.</p>;
}
