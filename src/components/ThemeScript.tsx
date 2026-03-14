/**
 * Inline script to prevent flash of wrong theme on page load.
 * Reads from localStorage or system preference before React hydrates.
 *
 * SECURITY NOTE: This contains a hardcoded static string with zero user input.
 * It is safe to use dangerouslySetInnerHTML here because the content is a
 * compile-time constant that never incorporates external data.
 */
export function ThemeScript() {
  const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
