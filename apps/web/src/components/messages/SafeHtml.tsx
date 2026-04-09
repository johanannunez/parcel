"use client";

import DOMPurify from "dompurify";

/**
 * Renders sanitized HTML content safely.
 * Uses DOMPurify to strip any XSS vectors before rendering.
 */
export function SafeHtml({
  html,
  className,
  style,
}: {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "img",
      "h1", "h2", "h3", "ul", "ol", "li", "blockquote",
      "hr", "span", "div", "sub", "sup", "mark",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "target", "rel",
      "class", "style", "width", "height",
    ],
  });

  return (
    <div
      className={className}
      style={style}
      // Content is sanitized by DOMPurify above: safe to render
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
