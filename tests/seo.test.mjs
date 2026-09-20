import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildSitemap } from "../scripts/sitemap.mjs";

const names = ["index", "about", "insurance-ai-training"];
const pages = names.map((name) => ({
  file: `${name}.html`,
  html: readFileSync(new URL(`../${name}.html`, import.meta.url), "utf8"),
}));
const schema = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap((match) => { const value = JSON.parse(match[1]); return value["@graph"] || [value]; });

test("public pages have a unique canonical, one H1, and parseable identity data", () => {
  const urls = new Set();
  for (const { file, html } of pages) {
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    assert.doesNotMatch(html, /name="robots"[^>]*noindex/, file);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(canonical, file);
    assert.ok(!urls.has(canonical), file);
    urls.add(canonical);
    assert.ok(schema(html).length > 0, file);
    assert.match(html, /name="description" content="[^"]+"/, file);
  }
  const about = schema(pages[1].html);
  const profile = about.find((item) => item["@type"] === "ProfilePage");
  const person = about.find((item) => item["@id"] === profile.mainEntity["@id"]);
  assert.equal(person["@type"], "Person");
  assert.equal(person.name, "고윤재");
  assert.equal(person.alumniOf, undefined, "The visible bio states a master's program, not graduation");
});

test("sitemap dates change only when their own page changes, and removed pages disappear", () => {
  const first = buildSitemap(pages, {}, "2026-09-15");
  const rebuild = buildSitemap(pages, first.state, "2026-09-16");
  assert.deepEqual(rebuild, first);
  const changed = [{ ...pages[0], html: pages[0].html.replace("업무 흐름을 AI 관점에서 재설계합니다.", "실제 업무 흐름을 AI 관점에서 재설계합니다.") }, pages[1]];
  const next = buildSitemap(changed, first.state, "2026-09-16");
  assert.equal(next.state["https://dinoflow.kr/"].lastmod, "2026-09-16");
  assert.equal(next.state["https://dinoflow.kr/about"].lastmod, "2026-09-15");
  assert.equal(Object.keys(next.state).length, 2);
  assert.doesNotMatch(next.xml, /insurance-ai-training/);
  assert.throws(() => buildSitemap([pages[0], pages[0]]), /Duplicate canonical/);
  assert.throws(() => buildSitemap([{ file: "broken.html", html: "<h1>Broken</h1>" }]), /Missing or invalid canonical/);
});

test("every structured FAQ answer is present in the visible insurance page", () => {
  const insurance = pages[2].html;
  const visibleBody = insurance.split("<body")[1];
  const faq = schema(insurance).find((item) => item["@type"] === "FAQPage");
  for (const question of faq.mainEntity) {
    assert.ok(visibleBody.includes(question.name), question.name);
    assert.ok(visibleBody.includes(question.acceptedAnswer.text), question.name);
  }
});

test("www root and nested paths both redirect to the canonical host", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  for (const source of ["/", "/:path*"]) {
    const rule = config.redirects.find((entry) => entry.source === source);
    assert.equal(rule.permanent, true);
    assert.ok(rule.has.some((condition) => condition.type === "host" && condition.value === "www.dinoflow.kr"));
    assert.ok(rule.destination.startsWith("https://dinoflow.kr/"));
  }
});
