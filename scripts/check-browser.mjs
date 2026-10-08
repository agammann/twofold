import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";
import {
  input as fixtureInput,
  report as fixtureReport,
} from "../test/fixtures.mjs";
const root = fileURLToPath(new URL("../", import.meta.url)),
  native = process.argv.includes("--native"),
  port = Number(process.env.TWOFOLD_TEST_PORT || 5381),
  origin = "http://127.0.0.1:" + port,
  out = path.join(root, "test-results", native ? "native" : "ordinary");
await mkdir(out, { recursive: true });
const report = { checks: [], errors: [], console: [], nativeRequired: native };
let app,
  browser,
  log = "";
try {
  app = spawn(process.execPath, [path.join(root, "server/index.mjs")], {
    cwd: root,
    windowsHide: true,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (b) => (log += b));
  app.stderr.on("data", (b) => (log += b));
  const deadline = Date.now() + 30000;
  while (true) {
    try {
      const r = await fetch(origin);
      if (r.status === 200) break;
    } catch {}
    assert.equal(app.exitCode, null, log);
    assert(Date.now() < deadline, "Local server startup timed out.");
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.TWOFOLD_BROWSER_EXECUTABLE
      ? { executablePath: process.env.TWOFOLD_BROWSER_EXECUTABLE }
      : native
        ? { channel: "chrome" }
        : {}),
    args: native ? ["--enable-features=WebMCP,WebMCPTesting"] : [],
  });
  report.browser = browser.version();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") report.console.push(m.text());
  });
  const requests = [];
  let mode = "success",
    delayed;
  await page.route("**/api/compare/visitor", async (route) => {
    requests.push(route.request().postDataJSON());
    if (mode === "pending") await new Promise((r) => (delayed = r));
    await route
      .fulfill({
        status: mode === "failure" ? 429 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          mode === "failure"
            ? { error: "Controlled rate limit." }
            : fixtureReport,
        ),
      })
      .catch(() => {});
  });
  await page.goto(origin);
  await page
    .getByRole("heading", {
      name: "Two answers. A clearer picture.",
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator("#hosted-model").inputValue(), "gpt-5.4");
  assert.equal(await page.locator("#api-key").inputValue(), "");
  assert.equal(requests.length, 0);
  report.checks.push(
    "Initial GPT-5.4 mode makes no comparison or model download.",
  );
  await page.getByRole("button", { name: "Load example", exact: true }).click();
  assert.equal(requests.length, 0);
  await page
    .getByRole("button", { name: "Compare with OpenAI", exact: true })
    .click();
  await page.getByRole("alert").waitFor();
  assert.equal(requests.length, 0);
  report.checks.push(
    "Example is prepared without submission; missing key prevents a request.",
  );
  const fill = async (input) => {
    await page.locator("#question").fill(input.question);
    await page.locator("#answer-A").fill(input.answerA);
    await page.locator("#answer-B").fill(input.answerB);
  };
  await fill(fixtureInput);
  await page.locator("#name-A").fill("Alice");
  await page.locator("#name-B").fill("Bob");
  await page
    .locator("#api-key")
    .fill("sk-" + "syntheticBrowserFixture" + "x".repeat(30));
  await page
    .getByRole("button", { name: "Compare with OpenAI", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Comparison results", exact: true })
    .waitFor();
  assert.deepEqual(requests[0].input, {
    question: fixtureInput.question,
    answerA: fixtureInput.answerA,
    answerB: fixtureInput.answerB,
  });
  assert.equal(requests[0].model, "gpt-5.4");
  report.checks.push(
    "Button preserves inputs and excludes author labels from the hosted request.",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export report", exact: true })
    .click();
  await (await download).saveAs(path.join(out, "comparison.md"));
  const markdown = await readFile(path.join(out, "comparison.md"), "utf8");
  assert(
    markdown.includes(fixtureInput.question) &&
      markdown.includes(fixtureInput.answerA) &&
      markdown.includes(fixtureInput.answerB),
  );
  assert(!markdown.includes("syntheticBrowserFixture"));
  assert(markdown.includes(fixtureReport.rationale));
  report.checks.push(
    "Actual Markdown export contains inputs and result but no credentials.",
  );
  await page.getByRole("button", { name: "Swap answers", exact: true }).click();
  assert.equal(
    await page.locator("#answer-A").inputValue(),
    fixtureInput.answerB,
  );
  assert.equal(await page.locator("#name-A").inputValue(), "Bob");
  assert.equal(
    await page
      .getByRole("region", { name: "Comparison results", exact: true })
      .count(),
    0,
  );
  report.checks.push(
    "Swap exchanges answers and labels and clears the stale report.",
  );
  if (native) {
    await page.waitForFunction(
      async () =>
        typeof document.modelContext?.getTools === "function" &&
        (await document.modelContext.getTools()).some(
          (t) => t.name === "prepare_comparison",
        ),
    );
    const before = requests.length;
    const result = await page.evaluate(
      async (input) => {
        const tool = (await document.modelContext.getTools()).find(
          (t) => t.name === "prepare_comparison",
        );
        return await document.modelContext.executeTool(tool, input);
      },
      fixtureInput.question
        ? {
            question: fixtureInput.question,
            answerA: fixtureInput.answerA,
            answerB: fixtureInput.answerB,
          }
        : null,
    );
    assert(JSON.stringify(result).includes("prepared"));
    assert.equal(
      await page.locator("#answer-A").inputValue(),
      fixtureInput.answerA,
    );
    assert.equal(requests.length, before);
    report.nativeWebMCP = { passed: true, names: ["prepare_comparison"] };
    report.checks.push(
      "Genuine native tool prepares the visible form without submitting or charging.",
    );
  }
  await fill(fixtureInput);
  mode = "failure";
  await page
    .getByRole("button", { name: "Compare with OpenAI", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Controlled rate limit." })
    .waitFor();
  assert.equal(
    await page.locator("#answer-A").inputValue(),
    fixtureInput.answerA,
  );
  report.checks.push("Provider error preserves editable inputs.");
  mode = "pending";
  await page
    .getByRole("button", { name: "Compare with OpenAI", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).waitFor();
  assert(await page.locator("#question").isDisabled());
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  delayed?.();
  mode = "success";
  await page.waitForFunction(
    () => !document.querySelector("#question").disabled,
  );
  assert.equal(
    await page.locator("#answer-A").inputValue(),
    fixtureInput.answerA,
  );
  report.checks.push("Cancel preserves input and releases pending controls.");
  await page.getByRole("button", { name: "Clear key", exact: true }).click();
  assert.equal(await page.locator("#api-key").inputValue(), "");
  await page
    .locator("#api-key")
    .fill("sk-" + "syntheticBrowserFixture" + "x".repeat(30));
  await page.getByRole("radio", { name: /On this device/ }).check();
  await page.getByRole("radio", { name: /OpenAI with your key/ }).check();
  assert.equal(await page.locator("#api-key").inputValue(), "");
  await page
    .locator("#api-key")
    .fill("sk-" + "syntheticBrowserFixture" + "x".repeat(30));
  await page.reload();
  assert.equal(await page.locator("#api-key").inputValue(), "");
  assert.equal(await page.locator("#question").inputValue(), "");
  report.checks.push(
    "Clear, mode switching and reload discard keys; reload clears the comparison.",
  );
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    databases: await indexedDB.databases(),
    caches: await caches.keys(),
  }));
  assert(Object.values(storage).every((list) => list.length === 0));
  report.checks.push("Application storage is empty before model downloads.");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width,
    );
    await page.screenshot({
      path: path.join(out, "layout-" + width + ".png"),
      fullPage: true,
    });
  }
  report.checks.push("Desktop and 390/320px layouts fit.");
  assert.deepEqual(report.errors, []);
  assert(
    report.console.every((text) => text.includes("429 (Too Many Requests)")),
    "Unexpected browser console error.",
  );
  report.status = "passed";
} catch (e) {
  report.status = "failed";
  report.failure = e.stack || e.message;
  throw e;
} finally {
  if (browser) await browser.close();
  if (app && app.exitCode === null) {
    if (process.platform === "win32")
      spawnSync("taskkill.exe", ["/PID", String(app.pid), "/T", "/F"], {
        windowsHide: true,
      });
    else app.kill("SIGTERM");
    await new Promise((r) =>
      app.exitCode !== null ? r() : app.once("exit", r),
    );
  }
  await writeFile(path.join(out, "server.log"), log);
  await writeFile(
    path.join(out, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      status: report.status,
      browser: report.browser,
      checks: report.checks.length,
      native: report.nativeWebMCP?.passed,
      failure: report.failure,
    }),
  );
}
