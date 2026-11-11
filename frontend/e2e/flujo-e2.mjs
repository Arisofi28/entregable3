// Prueba de punta a punta de la UI de E2 en Chrome headless vía DevTools Protocol (sin dependencias).
// Requisitos: API en API_URL (por defecto http://127.0.0.1:3999/api) y frontend en APP_URL
// (por defecto http://localhost:5173) apuntando a esa API. Uso: node e2e/flujo-e2.mjs
// Crea sus propios videojuegos; no usar contra la base de producción.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const API = process.env.API_URL ?? "http://127.0.0.1:3999/api";
const APP = process.env.APP_URL ?? "http://localhost:5173";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const post = async (ruta, body) =>
  (
    await fetch(`${API}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  ).json();
const GAME = (
  await post("/videojuegos", { nombre: "E2E metas", plataforma: "PC", genero: "rol" })
)._id;
const DONE = (
  await post("/videojuegos", {
    nombre: "E2E completado",
    plataforma: "PC",
    genero: "rol",
    estado: "completado"
  })
)._id;
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9333",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`,
    "--window-size=1300,2000",
    "about:blank"
  ],
  { stdio: "ignore" }
);

let ws,
  seq = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise(res => {
    const id = ++seq;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evalJs = async expr =>
  (
    await send("Runtime.evaluate", {
      expression: expr,
      awaitPromise: true,
      returnByValue: true
    })
  ).result?.result?.value;

const helpers = `
window.$t = (sel, text) => [...document.querySelectorAll(sel)].find(e => e.textContent.includes(text));
window.$set = (el, v) => { const p = Object.getPrototypeOf(el); Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
window.$panel = () => document.querySelector('.weekly-panel')?.innerText.replace(/\\s+/g, ' ');
window.$hist = () => document.querySelector('.checkpoint-history')?.innerText.replace(/\\s+/g, ' ');
`;

const results = [];
async function step(name, action, check) {
  if (action) await evalJs(`(async () => { ${action} })()`);
  await wait(1200);
  const text = await evalJs(check.expr);
  const ok = check.test(text);
  results.push({ name, ok, text: String(text).slice(0, 220) });
}

try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await wait(250);
    try {
      target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find(
        t => t.type === "page"
      );
    } catch {}
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)({ result: m.result });
      pending.delete(m.id);
    }
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: `${APP}/games/${GAME}` });
  await wait(3000);
  await evalJs(helpers);
  const panel = { expr: "$panel()" };

  await step("CA-03.8 sin meta invita a crear una", null, {
    ...panel,
    test: t => t.includes("No active goal yet") && t.includes("0 hrs")
  });
  await step(
    "CA-01.2 validación en cliente (0 h, 8 días)",
    `
    $t('.weekly-empty button', 'SET A GOAL').click();`,
    { expr: "!!document.querySelector('.goal-form')", test: v => v === true }
  );
  await step(
    "CA-01.2 errores junto al campo, sin enviar",
    `
    const f = document.querySelector('.goal-form'); const [h, d] = f.querySelectorAll('input[type=number]');
    $set(h, '0'); $set(d, '8'); f.requestSubmit();`,
    {
      expr: "document.querySelector('.goal-form').innerText",
      test: t =>
        t.includes("Enter more than 0 and up to 100 hours") && t.includes("from 1 to 7")
    }
  );
  await step(
    "CA-02.2 máximo 5 hitos (botón deshabilitado)",
    `
    const add = $t('.goal-form button', 'ADD MILESTONE'); for (let i = 0; i < 5; i++) add.click();`,
    {
      expr: "$t('.goal-form button','ADD MILESTONE').disabled + ' ' + document.querySelectorAll('.goal-milestone-row').length",
      test: t => t === "true 5"
    }
  );
  await step(
    "CA-01.3 si otra pestaña crea una meta antes, se muestra el 409 del servidor",
    `
    await fetch('${API}/metas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videojuego: '${GAME}', horasSemanales: 1, diasPorSemana: 1 }) });
    const rows = document.querySelectorAll('.goal-milestone-row'); for (let i = 4; i >= 0; i--) rows[i].querySelector('button').click();
    await new Promise(r => setTimeout(r, 300));
    const f = document.querySelector('.goal-form'); const [h, d] = f.querySelectorAll('input[type=number]');
    $set(h, '2'); $set(d, '2'); f.requestSubmit();`,
    {
      expr: "document.querySelector('.goal-form-alert')?.innerText",
      test: t => /ya tiene una meta activa/.test(t ?? "")
    }
  );
  // Se limpia la meta creada "por otra pestaña" y se recarga para seguir el flujo
  await fetch(`${API}/videojuegos/${GAME}/metas`)
    .then(r => r.json())
    .then(metas => fetch(`${API}/metas/${metas[0]._id}/desactivar`, { method: "PATCH" }));
  await send("Page.reload");
  await wait(2500);
  await evalJs(helpers);
  await step(
    "CA-01.1 / CA-02.1 crear meta 2 h / 2 días con 1 hito",
    `
    $t('.weekly-empty button', 'SET A GOAL').click(); await new Promise(r => setTimeout(r, 300));
    const f = document.querySelector('.goal-form'); const [h, d] = f.querySelectorAll('input[type=number]');
    $set(h, '2'); $set(d, '2');
    $t('.goal-form button', 'ADD MILESTONE').click(); await new Promise(r => setTimeout(r, 200));
    const row = f.querySelector('.goal-milestone-row'); $set(row.querySelector('input[type=text]'), 'Reach 10%'); $set(row.querySelector('input[type=number]'), '10');
    f.requestSubmit();`,
    {
      ...panel,
      test: t =>
        t.includes("/ 2 hrs") &&
        t.includes("/ 2 days") &&
        t.includes("Reach 10%") &&
        t.includes("Not yet")
    }
  );
  await step(
    "CA-08.1 registrar partida desde el detalle actualiza el progreso",
    `
    $t('.checkpoint-history button', 'LOG HERE').click(); await new Promise(r => setTimeout(r, 300));
    const f = document.querySelector('.session-quick'); const nums = f.querySelectorAll('input[type=number]');
    const d = new Date(Date.now() - 10 * 60000); const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    $set(f.querySelector('input[type=datetime-local]'), local); $set(nums[0], '60'); $set(nums[1], '15'); f.requestSubmit();`,
    {
      ...panel,
      test: t =>
        t.includes("1 / 2 hrs") &&
        t.includes("50%") &&
        t.includes("Reached") &&
        /CURRENT STREAK 1 day/.test(t)
    }
  );
  await step(
    "CA-08.3 editar la partida (150 min) recalcula: 125 %, horas alcanzadas",
    `
    document.querySelector('.session-row-action.is-edit').click(); await new Promise(r => setTimeout(r, 300));
    const f = document.querySelector('.checkpoint-history .session-quick'); const nums = f.querySelectorAll('input[type=number]');
    $set(nums[0], '150'); f.requestSubmit();`,
    {
      ...panel,
      test: t =>
        t.includes("2.5 / 2 hrs") &&
        t.includes("125%") &&
        t.includes("Goal hours reached!")
    }
  );
  await step("CA-03.4 barra llena al 100 % con 125 %", null, {
    expr: "document.querySelector('.weekly-fill').style.width + ' ' + document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')",
    test: t => t === "100% 100"
  });
  await step(
    "CA-08.2 / CA-05.2 eliminar la partida: horas 0 y el hito deja de estar alcanzado",
    `
    document.querySelector('.session-row-action:not(.is-edit)').click(); await new Promise(r => setTimeout(r, 200));
    $t('.session-row-confirm button', 'Delete').click();`,
    { ...panel, test: t => t.includes("0 / 2 hrs") && t.includes("Not yet") }
  );
  await step(
    "CA-06.1 editar la meta a 4 h",
    `
    $t('.weekly-heading button', 'EDIT GOAL').click(); await new Promise(r => setTimeout(r, 300));
    const f = document.querySelector('.goal-form'); $set(f.querySelectorAll('input[type=number]')[0], '4'); f.requestSubmit();`,
    { ...panel, test: t => t.includes("/ 4 hrs") && t.includes("Goal updated") }
  );
  await step(
    "CA-06.2 desactivar pide confirmación en línea",
    `
    $t('.weekly-heading button', 'DEACTIVATE').click();`,
    { ...panel, test: t => t.includes("Deactivate this goal?") }
  );
  await step(
    "CA-06.2 confirmar deja el juego sin meta activa",
    `
    $t('.goal-confirm button', 'YES, DEACTIVATE').click();`,
    {
      ...panel,
      test: t => t.includes("No active goal yet") && t.includes("Goal deactivated")
    }
  );
  await send("Page.navigate", { url: `${APP}/games/${DONE}` });
  await wait(2500);
  await evalJs(helpers);
  await step("CA-01.4 / F-11 juego completado: sin SET A GOAL y con explicación", null, {
    expr: "$panel() + ' | botones:' + [...document.querySelectorAll('.weekly-panel button')].map(b => b.innerText).join(',')",
    test: t => t.includes("Goals are for games in progress") && !t.includes("SET A GOAL")
  });
} catch (e) {
  results.push({ name: "ERROR", ok: false, text: String(e) });
} finally {
  for (const r of results)
    console.log(`${r.ok ? "✔" : "✘"} ${r.name}${r.ok ? "" : "\n    → " + r.text}`);
  chrome.kill();
  process.exit(results.every(r => r.ok) ? 0 : 1);
}
