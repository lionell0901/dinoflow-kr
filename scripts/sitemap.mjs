import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("../", import.meta.url);

export function buildSitemap(pages, previous = {}, date = new Date().toISOString().slice(0, 10)) {
  const state = {};
  const entries = pages.map(({ file, html }) => {
    const url = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
    if (!url || !/^https:\/\/dinoflow\.kr\/(?:[a-z0-9-]+)?$/.test(url)) {
      throw new Error(`Missing or invalid canonical: ${file}`);
    }
    if (state[url]) throw new Error(`Duplicate canonical: ${url}`);
    const hash = createHash("sha256").update(html).digest("hex");
    // A rebuild alone must not claim that the page content was updated.
    const lastmod = previous[url]?.hash === hash ? previous[url].lastmod : date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod) || lastmod > date) {
      throw new Error(`Invalid or future lastmod: ${url}`);
    }
    state[url] = { hash, lastmod };
    return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  });
  return {
    state,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const stateFile = new URL("sitemap-state.json", root);
  const previous = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : {};
  const pages = readdirSync(root)
    .filter((file) => file.endsWith(".html") && file !== "404.html")
    .sort((a, b) => Number(b === "index.html") - Number(a === "index.html") || a.localeCompare(b))
    .map((file) => ({ file, html: readFileSync(new URL(file, root), "utf8") }));
  const { state, xml } = buildSitemap(pages, previous);
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  writeFileSync(new URL("sitemap.xml", root), xml);
  console.log(`Sitemap updated: ${pages.length} canonical pages`);
}
