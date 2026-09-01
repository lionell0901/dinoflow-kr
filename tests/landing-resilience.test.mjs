import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const aboutHtml = readFileSync(new URL("../about.html", import.meta.url), "utf8");
const insuranceHtml = readFileSync(
  new URL("../insurance-ai-training.html", import.meta.url),
  "utf8",
);
const source = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");
const llms = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../sitemap.xml", import.meta.url), "utf8");
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
  assert.match(html, /contact-fallback-note[\s\S]*?카카오톡 상담[\s\S]*?이메일 문의/);
  assert.match(source, /submitButton\.type = 'submit'/);
  assert.match(source, /form\.classList\.add\('is-ready'\)/);
});

test("landing intentionally exposes the founder identity for search and AI answers", () => {
  // 2026-08-15 방향 전환: 조직 중심 익명 표기 → 고윤재(디노) 엔티티 의도 노출 (AEO/SEO)
  assert.match(html, /고윤재/);
  assert.match(html, /"founder"/);
  assert.match(html, /"@id": "https:\/\/dinoflow\.kr\/about#person"/);
  assert.match(html, /href="\/about"/);
});

test("about page carries the person entity with sameAs channels", () => {
  assert.match(aboutHtml, /고윤재/);
  assert.match(aboutHtml, /"@type": "Person"/);
  assert.match(aboutHtml, /"sameAs"/);
  assert.match(aboutHtml, /rel="canonical" href="https:\/\/dinoflow\.kr\/about"/);
  assert.match(aboutHtml, /href="\/css\/style\.min\.css\?v=\d{8}-\d+"/);
  assert.match(aboutHtml, /src="\/js\/main\.min\.js\?v=\d{8}-\d+"/);
  assert.match(aboutHtml, /data-stat="sessions"/);
});

test("homepage keeps visual proof and sends detailed records to Hub", () => {
  assert.match(html, /class="photo-grid reveal"/);
  assert.match(html, /data-stat="b2b-sessions"/);
  assert.match(html, /data-stat="b2b-students"/);
  assert.match(html, /만족도 · 응답 591명/);
  assert.match(html, /href="https:\/\/hub\.dinoflow\.kr\/lectures"/);
  assert.doesNotMatch(html, /recent-lectures|recent-list|recent-status/);
});

test("homepage exposes a low-friction organization readiness funnel", () => {
  const diagnosisHref = "https://blog.dinoflow.kr/diagnosis/ai-readiness?source=dinoflow-home";
  const nav = html.match(/<ul class="nav-links" id="primary-navigation">([\s\S]*?)<\/ul>/)?.[1] || "";

  assert.equal((nav.match(/<li>/g) || []).length, 5);
  assert.match(nav, /href="\/about">소개</);
  assert.doesNotMatch(nav, /#fit/);
  assert.ok(html.split(`href="${diagnosisHref}"`).length - 1 >= 3);
  assert.match(html, /8문항/);
  assert.match(html, /약 3분/);
  assert.match(html, /즉시[\s\S]*결과·우선 과제 확인/);
  assert.match(html, /익명으로 진행되며/);
  assert.match(html, /상담을 요청하기 전에는 이름이나 연락처를 받지 않습니다/);
  assert.doesNotMatch(html, /class="hero-facts"/);
});

test("optional inquiry details stay available behind progressive disclosure", () => {
  assert.match(html, /<details class="optional-fields">[\s\S]*?id="phone"[\s\S]*?id="participants"[\s\S]*?id="schedule"[\s\S]*?<\/details>/);
  ["phone", "participants", "schedule"].forEach((field) => {
    assert.match(source, new RegExp(`getValue\\('${field}'\\)`));
  });
});

test("insurance landing exposes commercial intent, safeguards, and structured data", () => {
  assert.match(
    insuranceHtml,
    /rel="canonical" href="https:\/\/dinoflow\.kr\/insurance-ai-training"/,
  );
  assert.match(insuranceHtml, /"@type": "Service"/);
  assert.match(insuranceHtml, /"@type": "FAQPage"/);
  assert.match(insuranceHtml, /"@type": "BreadcrumbList"/);
  ["조회", "보장분석", "리크루팅", "민원 응대"].forEach((useCase) => {
    assert.match(insuranceHtml, new RegExp(useCase));
  });
  assert.match(insuranceHtml, /가상·비식별 자료/);
  assert.match(insuranceHtml, /AI 결과는 검토 전 초안/);
  assert.match(insuranceHtml, /삼성화재 영업관리자/);
  assert.match(insuranceHtml, /공식 추천·승인을 의미하지 않습니다/);
  assert.match(sitemap, /https:\/\/dinoflow\.kr\/insurance-ai-training/);
  assert.match(llms, /보험사 AI 실무교육/);
});

test("public surfaces use only the official email and Kakao contact", () => {
  const publicSources = [html, aboutHtml, insuranceHtml, llms, source].join("\n");
  assert.match(publicSources, /godino2895@gmail\.com/);
  assert.match(publicSources, /https:\/\/open\.kakao\.com\/me\/tutordino/);
  assert.doesNotMatch(publicSources, /open\.kakao\.com\/o\/suYsYaxf/);
  assert.doesNotMatch(publicSources, /010-4365-2823|\+82-10-4365-2823/);
  assert.doesNotMatch([html, aboutHtml, insuranceHtml].join("\n"), /AI\.Edu/);
});

test("production HTML serves versioned minified assets", () => {
  [html, aboutHtml, insuranceHtml].forEach((page) => {
    assert.match(page, /href="\/css\/style\.min\.css\?v=\d{8}-\d+"/);
    assert.match(page, /src="\/js\/main\.min\.js\?v=\d{8}-\d+"/);
  });
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
  assert.match(css, /\.about-links a \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/);
  assert.match(css, /--coral-dark: #7a2f20;/);
  assert.match(css, /\.insurance-workflow span \{[^}]*color: var\(--coral-dark\);/);
  assert.match(css, /@media \(pointer: coarse\)[\s\S]*?\.footer-business a \{ display: inline-flex; min-height: 44px;/);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?\.evidence-stats div \{ flex-direction: column;/);
});
