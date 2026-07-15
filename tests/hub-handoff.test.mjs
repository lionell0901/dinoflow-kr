import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

function loadScript(hash, search = "") {
  let replacedLocation = "";
  const elements = new Map();
  const document = {
    documentElement: {
      classList: { add() {} },
      style: { scrollBehavior: "" },
    },
    addEventListener() {},
    getElementById(id) {
      return elements.get(id) || null;
    },
    createElement(tagName) {
      return {
        tagName,
        children: [],
        appendChild(child) {
          this.children.push(child);
          return child;
        },
      };
    },
  };
  const window = {
    location: {
      hash,
      search,
      origin: "https://dinoflow.kr",
      pathname: "/",
      replace(nextLocation) {
        replacedLocation = nextLocation;
      },
    },
    history: {
      state: null,
      replaceState(_state, _title, nextLocation) {
        const next = new URL(nextLocation, window.location.origin);
        window.location.hash = next.hash;
        window.location.search = next.search;
      },
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
  };
  const context = vm.createContext({
    document,
    window,
    URLSearchParams,
    console,
  });
  vm.runInContext(source, context);

  const messageField = {
    value: "",
    setCustomValidity() {},
  };
  const form = {
    querySelector(selector) {
      return selector === "#message" ? messageField : null;
    },
  };
  const note = { hidden: true, textContent: "" };

  return {
    context,
    elements,
    form,
    messageField,
    note,
    window,
    replacedLocation: () => replacedLocation,
  };
}

test("prefills only allowlisted Hub reference fields and cleans the handoff query", () => {
  const payload = loadScript(
    "#contact",
    "?from=hub&topic=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&audience=%EC%8B%A4%EB%AC%B4%EC%9E%90%C2%B7%EC%9E%84%EC%A7%81%EC%9B%90&category=%EC%A7%81%EB%AC%B4%ED%8A%B9%ED%99%94&client=%EB%B9%84%EA%B3%B5%EA%B0%9C%EA%B3%A0%EA%B0%9D",
  );

  assert.equal(
    payload.context.applyHubInquiryPrefill(payload.form, payload.note),
    true,
  );
  assert.match(payload.messageField.value, /<img src=x onerror=alert\(1\)>/);
  assert.match(payload.messageField.value, /교육 분야: 직무특화/);
  assert.doesNotMatch(payload.messageField.value, /비공개고객/);
  assert.equal(payload.window.location.hash, "#contact");
  assert.equal(payload.window.location.search, "");
  assert.equal(payload.note.hidden, false);
});

test("preserves an existing inquiry while still cleaning the Hub handoff", () => {
  const payload = loadScript(
    "#contact",
    "?from=hub&topic=%EC%97%85%EB%AC%B4%20%EC%9E%90%EB%8F%99%ED%99%94&category=constructor",
  );
  payload.messageField.value = "이미 작성한 문의";

  assert.equal(
    payload.context.applyHubInquiryPrefill(payload.form, payload.note),
    false,
  );
  assert.equal(payload.messageField.value, "이미 작성한 문의");
  assert.equal(payload.window.location.hash, "#contact");
  assert.equal(payload.window.location.search, "");
  assert.equal(payload.note.hidden, true);
});

test("redirects legacy fragments using only allowlisted handoff fields", () => {
  const payload = loadScript(
    "#contact?from=hub&topic=AI%20%EA%B5%90%EC%9C%A1&client=%EB%B9%84%EA%B3%B5%EA%B0%9C",
  );

  assert.equal(
    payload.context.applyHubInquiryPrefill(payload.form, payload.note),
    false,
  );

  assert.match(payload.replacedLocation(), /^\/\?from=hub&topic=/);
  assert.match(payload.replacedLocation(), /#contact$/);
  assert.doesNotMatch(payload.replacedLocation(), /client|%EB%B9%84%EA%B3%B5%EA%B0%9C/);
});

test("EmailJS source URL excludes the inquiry handoff", () => {
  assert.match(
    source,
    /source_url:\s*window\.location\.origin\s*\+\s*window\.location\.pathname/,
  );
  assert.doesNotMatch(source, /source_url:[^\n]*location\.href/);
});

test("anchor targets receive programmatic focus without an extra scroll", () => {
  const payload = loadScript("");
  let tabindex = null;
  let focusOptions = null;
  const target = {
    hasAttribute(name) {
      return name === "tabindex" && tabindex !== null;
    },
    setAttribute(name, value) {
      if (name === "tabindex") tabindex = value;
    },
    focus(options) {
      focusOptions = options;
    },
  };

  payload.context.focusAnchorTarget(target);

  assert.equal(tabindex, "-1");
  assert.equal(focusOptions.preventScroll, true);
});

test("track record without fetch stays an explicit non-live fallback", async () => {
  const payload = loadScript("");
  const status = { dataset: {}, textContent: "" };
  payload.elements.set("recent-status", status);

  assert.equal(await payload.context.loadTrackRecord(), false);
  assert.equal(status.dataset.state, "fallback");
  assert.equal(status.textContent, "비실시간");
});

test("track record state only claims a Hub connection explicitly", () => {
  const payload = loadScript("");
  const status = { dataset: {}, textContent: "" };
  payload.elements.set("recent-status", status);

  payload.context.setTrackRecordState("connected");
  assert.equal(status.dataset.state, "connected");
  assert.equal(status.textContent, "Hub 연동");

  payload.context.setTrackRecordState("unknown");
  assert.equal(status.dataset.state, "fallback");
  assert.equal(status.textContent, "비실시간");
});

test("malformed Hub recent entries leave the honest static fallback intact", () => {
  const payload = loadScript("");
  const fallback = { textContent: "최근 강의는 활동 허브에서 확인" };
  const list = {
    children: [fallback],
    replaceChildren(...children) {
      this.children = children;
    },
  };
  payload.elements.set("recent-list", list);

  assert.equal(payload.context.renderRecentLectures([null, {}, { date: "2026-07" }]), false);
  assert.deepEqual(list.children, [fallback]);

  assert.equal(
    payload.context.renderRecentLectures([
      null,
      { date: "2026-07-12", client: "테스트 기관", program: "AI 실무교육" },
    ]),
    true,
  );
  assert.equal(list.children.length, 1);
  assert.equal(list.children[0].children[0].children[1].textContent, "테스트 기관");
});
