import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");

function loadScript(hash) {
  let scrolled = false;
  const document = {
    documentElement: {
      classList: { add() {} },
      style: { scrollBehavior: "" },
    },
    addEventListener() {},
  };
  const window = {
    location: {
      hash,
      origin: "https://dinoflow.kr",
      pathname: "/",
    },
    history: {
      state: null,
      replaceState(_state, _title, nextHash) {
        window.location.hash = nextHash;
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
    scrollIntoView() {
      scrolled = true;
    },
  };
  const note = { hidden: true, textContent: "" };

  return {
    context,
    form,
    messageField,
    note,
    window,
    wasScrolled: () => scrolled,
  };
}

test("prefills only allowlisted Hub reference fields and cleans the fragment", () => {
  const payload = loadScript(
    "#contact?from=hub&topic=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&audience=%EC%8B%A4%EB%AC%B4%EC%9E%90%C2%B7%EC%9E%84%EC%A7%81%EC%9B%90&category=%EC%A7%81%EB%AC%B4%ED%8A%B9%ED%99%94&client=%EB%B9%84%EA%B3%B5%EA%B0%9C%EA%B3%A0%EA%B0%9D",
  );

  assert.equal(
    payload.context.applyHubInquiryPrefill(payload.form, payload.note),
    true,
  );
  assert.match(payload.messageField.value, /<img src=x onerror=alert\(1\)>/);
  assert.match(payload.messageField.value, /교육 분야: 직무특화/);
  assert.doesNotMatch(payload.messageField.value, /비공개고객/);
  assert.equal(payload.window.location.hash, "#contact");
  assert.equal(payload.note.hidden, false);
  assert.equal(payload.wasScrolled(), true);
});

test("preserves an existing inquiry while still cleaning the Hub fragment", () => {
  const payload = loadScript(
    "#contact?from=hub&topic=%EC%97%85%EB%AC%B4%20%EC%9E%90%EB%8F%99%ED%99%94&category=constructor",
  );
  payload.messageField.value = "이미 작성한 문의";

  assert.equal(
    payload.context.applyHubInquiryPrefill(payload.form, payload.note),
    false,
  );
  assert.equal(payload.messageField.value, "이미 작성한 문의");
  assert.equal(payload.window.location.hash, "#contact");
  assert.equal(payload.note.hidden, true);
});

test("EmailJS source URL excludes the inquiry fragment", () => {
  assert.match(
    source,
    /source_url:\s*window\.location\.origin\s*\+\s*window\.location\.pathname/,
  );
  assert.doesNotMatch(source, /source_url:[^\n]*location\.href/);
});
