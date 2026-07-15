import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");
const vercel = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
);

test("contact form never posts Korean inquiry fields through a mailto action", () => {
  assert.match(html, /<form[^>]+id="contact-form"[^>]*>/);
  assert.doesNotMatch(html, /<form[^>]+action="mailto:/);
  assert.match(html, /<button type="button" class="button submit-button">/);
  assert.match(
    html,
    /id="form-message"[^>]+role="status"[^>]+aria-live="polite"[^>]+tabindex="-1"/,
  );
  assert.doesNotMatch(
    html,
    /overseas-consent|국외 전송에 동의/,
    "Overseas transfer is disclosed in the privacy policy, not gated behind a consent checkbox",
  );
  assert.match(html, /emailjs-delivery-note[\s\S]*?privacy#overseas-transfer/);
  assert.match(css, /\.emailjs-delivery-note \{ display: none; \}/);
  assert.match(css, /\.submit-button \{ display: none;/);
  assert.match(css, /\.contact-form\.is-ready \.submit-button \{ display: inline-flex; \}/);
  assert.match(css, /\.contact-form-fields \{ display: none; \}/);
  assert.match(css, /\.contact-form\.is-ready \.contact-form-fields \{ display: block; \}/);
  assert.match(html, /contact-fallback-note[\s\S]*?카카오톡으로 상담[\s\S]*?이메일로 문의/);
  assert.match(source, /submitButton\.type = 'submit'/);
  assert.match(source, /form\.classList\.add\('is-ready'\)/);
});

test("landing copy stays organization-framed without personal names", () => {
  assert.doesNotMatch(html, /고윤재/);
  assert.doesNotMatch(html, /대표 강사/);
  assert.doesNotMatch(html, /"founder"/);
});

test("recent lecture fallback never claims to be live", () => {
  assert.doesNotMatch(html, />LIVE</);
  assert.match(html, /id="recent-status"[^>]+data-state="fallback">비실시간</);
  assert.match(html, /최근 강의는 활동 허브에서 확인/);
  assert.doesNotMatch(html, /recent-fallback[^>]*>[^<]*금융·보험/);
});

test("production HTML serves versioned minified assets", () => {
  assert.match(html, /href="\/css\/style\.min\.css\?v=\d{8}-\d+"/);
  assert.match(html, /src="\/js\/main\.min\.js\?v=\d{8}-\d+"/);
  assert.doesNotMatch(html, /href="\/css\/style\.css\?v=/);
  assert.doesNotMatch(html, /src="\/js\/main\.js\?v=/);
});

test("cache policy matches versioned and mutable asset behavior", () => {
  const headersBySource = new Map(
    vercel.headers.map((entry) => [
      entry.source,
      Object.fromEntries(entry.headers.map((header) => [header.key, header.value])),
    ]),
  );

  assert.equal(
    headersBySource.get("/css/(.*)\\.min\\.css")["Cache-Control"],
    "public, max-age=0, must-revalidate",
  );
  assert.equal(
    headersBySource.get("/js/(.*)\\.min\\.js")["Cache-Control"],
    "public, max-age=0, must-revalidate",
  );
  assert.equal(
    headersBySource.get("/(.*)\\.(jpg|jpeg|png|webp|svg|ico)")[
      "Cache-Control"
    ],
    "public, max-age=86400, stale-while-revalidate=604800",
  );
});

test("status focus respects reduced motion and does not blur the submitter", () => {
  assert.doesNotMatch(source, /\.blur\(/);
  assert.match(
    source,
    /behavior:\s*prefersReducedMotion\(\)\s*\?\s*'auto'\s*:\s*'smooth'/,
  );
  assert.match(source, /focusWithoutScrolling\(message\)/);
});

test("narrow and enlarged text can shrink grid content instead of overflowing", () => {
  assert.match(
    css,
    /grid-template-columns:\s*36px minmax\(0, 1fr\) 30px/,
  );
  assert.match(css, /\.contact-layout > \*, \.form-row > \*, \.form-field \{ min-width: 0; \}/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?\.evidence-stats div \{ flex-direction: column;/);
});
