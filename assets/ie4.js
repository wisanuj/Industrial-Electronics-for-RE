/* ie4.js — chapter 4 (dc biasing of BJTs): one circuit builder for every bias configuration of the slides, the load-line picture, and the
   worked problems, on top of circuit.js (part 'Q' with the 0.7 V model), ie3.js (CH3.outPlot) and ch8.js.
   Sources: course slides "Chapter 4 DC Biasing BJTs (Part I)" (42 pp., Ex.1–Ex.14) and Boylestad & Nashelsky, 11th ed., chapter 4:
   Ex.1 = Example 4.1 (+ 4.2 saturation), Ex.2 = 4.3, Ex.3 = 4.4 (+ 4.6), Ex.4 = 4.8 but with β = 140 (an earlier edition; the 11th uses 100),
   Ex.5 = 4.12 (+ 4.13), Ex.6 = 4.14, Ex.7 = 4.18, Ex.8 = 4.19, Ex.9 = 4.16, Ex.10 = 4.17, Ex.11 = 4.20, Ex.12–14 = 4.21–4.23.
   Extra problems from the book only: Examples 4.5 (β doubled), 4.7 (load line on characteristics), 4.9–4.11 (approximate analysis),
   4.24–4.25 (complete designs).
   The simulation solves the circuits exactly with V_BE = 0.7 V, I_C = β I_B and I_E = (β + 1) I_B: where the book rounds I_E ≅ I_C (emitter
   bias, voltage divider, common base) or I_C' ≅ I_C (collector feedback) the simulated V_CE differs by a few hundredths of a volt; the notes say so.
   CH4.net(o) builds any of the circuits: o = { VCC, VEE (a negative supply under the emitter rail), RB | R1 + R2 | RF (or RF1 + RF2), RC, RE,
   beta, qText }; CH4.sol(o) gives the book's hand solution of the same circuit; CH4.DEF: ex1 … ex14, b5, e7, vd9, vd11, d24, d25 */
(function (global) {
'use strict';
const CH4 = {}, fd = CH6.fd, R = String.raw, C = IE.COL, BJT = CK.BJT;
const t = (th, en) => MC.t(th, en);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o });
const v2 = x => fd(x, 2).replace('-', '−'), SIMPLE = CH3.SIMPLE, kO = r => CK.eng(r, 'Ω');
const LAY = { ...CH3.LAY, cktAspM: 0.62, rowAsp: 0.7, rowMin: 280 }, bdg = (th, en, ok = true) => [[th, en ?? th], ok ? 'ok' : 'wait'];
CH4.LAY = LAY;

/* =====================================================================================================================
   1) the circuit. Grid: top rail y = −1.2 (V_CC), the transistor's collector and emitter on x = 3.1 with the base at (2.3, 1.6), the emitter
   rail y = 4 (ground, or −V_EE); the supplies stand on the right at x = 5.1 with the ground between them (mV). Parts that are 0 or absent
   become wires or are left out: RC = 0 ties the collector to the top rail (an emitter follower), VCC = 0 makes the top rail the ground. */
CH4.net = (o = {}) => {
  const VCC = o.VCC || 0, VEE = o.VEE || 0, beta = o.beta ?? 100, parts = [];
  const nodes = { tL: [0.6, -1.2], f: [0.6, 0.75], f1: [1.85, 0.75], bL: [0.6, 1.6], gL: [0.6, 4], b: [2.3, 1.6], tC: [3.1, -1.2], c: [3.1, 0.75], e: [3.1, 2.45], ge: [3.1, 4], tV: [5.1, -1.2], mV: [5.1, 1.4], gV: [5.1, 4] };
  const left = o.RB || o.R1;   // something hangs from the left end of the top rail
  parts.push(VCC ? { id: 'VCC', type: 'V', a: 'tV', b: 'mV', value: VCC, name: 'V_CC', valText: `${v2(VCC)} V` } : W_('tV', 'mV'));
  parts.push(VEE ? { id: 'VEE', type: 'V', a: 'mV', b: 'gV', value: VEE, name: 'V_EE', valText: `−${v2(VEE)} V` } : W_('mV', 'gV'));
  if (left) parts.push(W_('tL', 'tC')); parts.push(W_('tC', 'tV'), W_('ge', 'gV'));
  if (o.RB) parts.push({ id: 'RB', type: 'R', a: 'tL', b: 'bL', value: o.RB, name: o.RBname || 'R_B', valText: kO(o.RB), side: -1 }, W_('bL', 'b'));
  if (o.R1) parts.push({ id: 'R1', type: 'R', a: 'tL', b: 'bL', value: o.R1, name: 'R_1', valText: kO(o.R1), side: -1 }, { id: 'R2', type: 'R', a: 'bL', b: 'gL', value: o.R2, name: 'R_2', valText: kO(o.R2), side: -1 }, W_('bL', 'b'), W_('gL', 'ge'));
  if (o.RF) parts.push({ id: 'RF', type: 'R', a: 'c', b: 'f', value: o.RF, name: o.RFname || 'R_F', valText: kO(o.RF), side: 1 }, W_('f', 'bL'), W_('bL', 'b'));
  if (o.RF1) parts.push({ id: 'RF1', type: 'R', a: 'c', b: 'f1', value: o.RF1, name: 'R_F1', valText: kO(o.RF1), side: 1 }, { id: 'RF2', type: 'R', a: 'f1', b: 'f', value: o.RF2, name: 'R_F2', valText: kO(o.RF2), side: 1 }, W_('f', 'bL'), W_('bL', 'b'));
  parts.push(o.RC ? { id: 'RC', type: 'R', a: 'tC', b: 'c', value: o.RC, name: 'R_C', valText: kO(o.RC) } : W_('tC', 'c'));
  parts.push(o.RE ? { id: 'RE', type: 'R', a: 'e', b: 'ge', value: o.RE, name: 'R_E', valText: kO(o.RE) } : W_('e', 'ge'));
  parts.push({ id: 'Q', type: 'Q', C: 'c', B: 'b', E: 'e', beta, be: SIMPLE, name: o.qName ?? 'Q', valText: o.qText ?? `β = ${beta}`, pins: true });
  return { ground: 'mV', nodes, parts, o };
};
/* the common-base circuit of Ex.10 is the chapter 3 one (CH3.cb) */
/* the book's hand solution of a CH4.net circuit (0.7 V, I_C = β I_B, I_E ≅ I_C where the book rounds): { IB, IC, IE, VCE, VB, VC, VE, Icsat } */
CH4.sol = o => { const VCC = o.VCC || 0, VEE = o.VEE || 0, b = o.beta ?? 100, RC = o.RC || 0, RE = o.RE || 0, VBE = 0.7; let IB, VB0 = 0;
  if (o.R1) { const RTh = o.R1 * o.R2 / (o.R1 + o.R2), ETh = o.R2 * (VCC + VEE) / (o.R1 + o.R2) - VEE; IB = (ETh + VEE - VBE) / (RTh + (b + 1) * RE); VB0 = ETh - IB * RTh; }
  else if (o.RF || o.RF1) { const RF = o.RF || (o.RF1 + o.RF2); IB = (VCC + VEE - VBE) / (RF + b * (RC + RE)); }
  else { IB = (VCC + VEE - VBE) / (o.RB + (b + 1) * RE); VB0 = -IB * o.RB + VCC; }
  const IC = b * IB, IE = (b + 1) * IB, VE = -VEE + IC * RE, VC = VCC - IC * RC; void VB0;
  return { IB, IC, IE, VCE: VC - VE, VB: VBE + VE, VC, VE, Icsat: (VCC + VEE) / Math.max(RC + RE, 1e-9) }; };
/* the nearest standard 5 % (E24) resistor value */
const E24 = [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
CH4.std = r => { if (!(r > 0)) return r; const e = Math.floor(Math.log10(r)), m = r / Math.pow(10, e); let best = E24[0], bd = Infinity;
  E24.concat([10]).forEach(v => { const d = Math.abs(Math.log(v / m)); if (d < bd) { bd = d; best = v; } }); return +(best * Math.pow(10, e)).toPrecision(3); };

/* =====================================================================================================================
   the explorers of sections A: a CH8.Board on canvas cvA, sliders in pA, a reading list and a sentence in wA. o = { init (state), title,
   controls(panel, S, build), spec(S) → CH4.net spec, side(ctx, box, board, ckt, S), waves: [(ctx, box, board, ckt, S)], badge(ckt, S) → [text, kind],
   rows(ckt, z, S) → [[key, value]], text(ckt, z, S) → HTML, vo } */
CH4.explorer = o => {
  const $ = id => document.getElementById(id), ui = MC.ui, S = { ...o.init };
  const B = new CH8.Board('cvA', { T: 4, mid: true, midMin: 420, cktAspM: o.cktAspM ?? 0.62, rowAsp: o.rowAsp ?? 0.7, rowMin: 280, pad: 1.2, wideAt: 1e9, dotSpeed: 80, shortSpec: sp => CH8.margins(sp, 1.2),
    view: { acPeak: false, minV: 7, glowColor: 'rgba(255,126,182,.4)' },
    side: o.side ? (ctx, b, bd) => { if (B.ckt) o.side(ctx, b, bd, B.ckt, S); } : undefined,
    waves: (o.waves || []).map(w => ({ draw: (ctx, b, bd) => { if (B.ckt) w(ctx, b, bd, B.ckt, S); } })),
    badge: () => (B.ckt ? o.badge(B.ckt, S) : null) });
  const pA = $('pA'), mA = document.createElement('div');
  if (o.title) ui.h2(pA, o.title);
  const build = () => { B.set(o.spec(S), o.vo || { speed: 80 / 0.004, dotRef: 0.004 }); const z = CH3.q(B.ckt); mA.innerHTML = ui.kv(o.rows(B.ckt, z, S));
    if ($('wA')) { $('wA').innerHTML = `<div class="answer">${o.text(B.ckt, z, S)}</div>`; MC.renderMath($('wA')); } };
  o.controls(pA, S, build); pA.appendChild(mA); mA.className = 'metrics';
  B.resize(); build(); window.addEventListener('resize', () => B.resize()); LS.anim($('cvA'), dt => B.frame(dt));
  return { B, S, build };
};
/* I_B curves (µA) that span a load line whose top is topmA, about six of them */
CH4.ibs = (beta, topmA) => { const m = topmA / beta * 1000 / 5, s = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find(x => x >= m) || 1000; return [0, 1, 2, 3, 4, 5, 6].map(k => k * s); };
/* β sensitivity: I_C against β for the circuit mk(β) → CH4.net options, the present β marked, I_Csat as the ceiling */
CH4.betaPlot = (ctx, b, bd, mk, beta, o = {}) => { const sh = bd.short, bs = [], ics = [];
  for (let B = 20; B <= 400; B += 10) { const c = new CK.Circuit(CH4.net(mk(B))); c.solve(); bs.push(B); ics.push(CH3.q(c).ic); }
  const at = B => { let k = 0; while (k < bs.length - 2 && bs[k + 1] < B) k++; const w = (B - bs[k]) / (bs[k + 1] - bs[k]); return ics[k] + (ics[k + 1] - ics[k]) * Math.max(0, Math.min(1, w)); };
  const sat = o.icsat, top = Math.max(sat || 0, ...ics) * 1.15, ymax = +(Math.ceil(top * 4) / 4).toFixed(2), yt = [0.25, 0.5, 1, 2, 5, 10].find(s => ymax / s <= 6) || 10;
  const i1 = at(50), i2 = at(100), pct = (i2 - i1) / i1 * 100;
  CH2.xy(ctx, b, { x: [0, 400], y: [0, ymax], xt: [100, 200, 300, 400], yt: Array.from({ length: Math.floor(ymax / yt) }, (_, k) => +((k + 1) * yt).toFixed(2)), xl: 'β', yl: 'I_C (mA)',
    fns: [{ f: at, color: C.curve, w: 3 }].concat(sat ? [{ f: () => sat, color: C.red, w: 1.6, dash: [6, 5] }] : []),
    pts: [{ x: beta, y: at(beta), color: C.q, r: 6, label: sh ? `β = ${beta}` : `β = ${beta}: ${fd(at(beta), 2)} mA`, side: beta > 250 ? -1 : 1, dy: -12 }],
    title: sh ? t('I_C เทียบกับ β', 'I_C against β') : t(`I_C เทียบกับ β · β 50 → 100: I_C เปลี่ยน ${pct >= 0 ? '+' : ''}${fd(pct, 0)} %`, `I_C against β · β 50 → 100: I_C changes by ${pct >= 0 ? '+' : ''}${fd(pct, 0)} %`) });
  if (sat && !sh) CH8.lab(ctx, `I_Csat = ${fd(sat, 2)} mA`, b.x + b.w - 20, b.y + 30 + (b.h - 66) * (1 - sat / ymax) - 10, 'right', C.red, 11.5, b, '600'); };

/* =====================================================================================================================
   2) the load line on a flat family (the 0.7 V model: I_C = β I_B), as the slides draw Figs. 4.12–4.16. o = { beta, ibs (µA list), vcc, r
   (R_C or R_C + R_E, Ω), q: { v, i (mA) }, imax (mA), vmax, sat (V_CEsat strip), title, labels } */
CH4.fam = (beta, ibs, p = {}) => { const q = { beta, vsat: p.vsat ?? 0, va: p.va, be: SIMPLE }, f = (ib, v) => ({ i: BJT.icAt(q, ib, v) }); f.ib = ibs.map(x => x * 1e-6); f.ends = []; return f; };
CH4.llPlot = (ctx, b, bd, o = {}) => { const ibs = o.ibs || [0, 10, 20, 30, 40, 50], fam = o.fam || CH4.fam(o.beta ?? 100, ibs, o), vmax = o.vmax ?? Math.ceil(o.vcc * 1.15), top = o.vcc / o.r * 1e3;
  const imax = o.imax ?? Math.ceil(top * 1.25 * 2) / 2, segs = o.segs || [];
  return CH3.outPlot(ctx, b, bd, { fam, vmax, imax, xt: o.xt || [5, 10, 15, 20, 25, 30, 35, 40].filter(x => x <= vmax), yt: o.yt || (imax > 12 ? [5, 10, 15, 20, 25] : imax > 6 ? [2, 4, 6, 8, 10, 12] : [1, 2, 3, 4, 5, 6]).filter(i => i <= imax),
    sat: o.sat, load: { vcc: o.vcc, rc: o.r }, q: o.q ? { v: o.q.v, i: o.q.i, ib: o.q.ib, label: o.q.label ?? 'Q', side: o.q.side ?? (o.q.v > o.vcc * 0.6 ? -1 : 1), dy: o.q.dy, dash: false } : null,
    pts: o.pts, segs, labels: o.labels, title: o.title, ml: 44 }); };
/* the three node voltages of a solved circuit as bars: V_B, V_E, V_C (and V_CE as a diamond) */
CH4.vbars = (ctx, b, bd, c, o = {}) => { const V = n => c.V(n).re, q = CH3.q(c), sh = bd.short;
  CH8.bars(ctx, b, [{ label: 'V_B', v: V('b'), color: C.tan, sub: sh ? '' : t('เบส', 'base') }, { label: 'V_E', v: V('e'), color: C.q, sub: sh ? '' : t('อิมิตเตอร์', 'emitter') }, { label: 'V_C', v: V('c'), color: C.curve, sub: sh ? '' : t('คอลเล็กเตอร์', 'collector') },
    { label: 'V_CE', v: q.VCE, color: C.chord, sub: sh ? '' : 'V_C − V_E' }], { title: o.title ?? (sh ? t('แรงดัน (V)', 'voltages (V)') : t('แรงดันเทียบกราวด์ (V) และ V_CE', 'voltages to ground (V), and V_CE')), fmt: v => v2(v), sub: !sh, max: o.max }); };
/* the base–emitter loop as signed voltages that sum to zero (CH2.kvl) for the three "miscellaneous" circuits */
CH4.kvl = (ctx, b, bd, items, title) => CH2.kvl(ctx, b, bd, items, title);

/* =====================================================================================================================
   3) the problems */
const DEF = {}, sol = CH4.sol, q = c => CH3.q(c);
const SP = {};   // one spec object per variant (CH8.Prob rebuilds only when the object changes)
const spec = (key, o) => SP[key] || (SP[key] = CH4.net(o));
const fmtQ = (ic, vce) => `I_C = ${fd(ic, 2)} mA, V_CE = ${fd(vce, 2)} V`;
const mA = x => x * 1e3, uA = x => x * 1e6;
const NOTE_IE = t('ภาพจำลองใช้ \\(I_E = (\\beta + 1)I_B\\) ตรง ๆ ไม่ปัดเป็น \\(I_C\\) ค่าที่ได้จึงต่างจากตำราในหลักที่สอง–สาม', 'The simulation keeps \\(I_E = (\\beta + 1)I_B\\) instead of rounding it to \\(I_C\\), so its values differ from the book\'s in the second or third digit.');

/* ---------------- page 4.1: Ex.1 = Examples 4.1–4.2 (fixed bias), Ex.2 = Example 4.3 (from the load line) ---------------- */
const O1 = { VCC: 12, RB: 240e3, RC: 2200, beta: 50 }, S1 = sol(O1);
DEF.ex1 = { ...LAY, solvedAt: 1, spec: () => spec('ex1', O1),
  glow: k => (k === 1 ? ['RB'] : k === 2 ? ['RC'] : k === 5 ? ['Q'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 5 ? bdg(`I_Csat = V_CC/R_C = 5.45 mA · Q ที่ ${fd(z.ic, 2)} mA`, `I_Csat = V_CC/R_C = 5.45 mA · Q at ${fd(z.ic, 2)} mA`) : k >= 2 ? bdg(fmtQ(z.ic, z.VCE)) : k === 1 ? bdg(`I_B = (12 − 0.7)/240 kΩ = ${fd(z.uA, 2)} µA`) : bdg('V_CC = 12 V, R_B = 240 kΩ, R_C = 2.2 kΩ, β = 50', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt); if (k >= 3 && k <= 4) return CH4.vbars(ctx, b, bd, s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: 50, ibs: [0, 10, 20, 30, 40, 50, 60], vcc: 12, r: 2200, imax: 6, vmax: 14, q: k >= 2 ? { v: z.VCE, i: z.ic, ib: z.IB } : null, labels: !bd.short,
      pts: k >= 5 ? [{ v: 0, i: 5.45, color: C.red, r: 5.5, label: bd.short ? '' : 'I_Csat = 5.45 mA', side: 1, dy: 14 }] : [], title: t('เส้นโหลด V_CE = V_CC − I_C R_C', 'load line V_CE = V_CC − I_C R_C') }); },
  steps: () => [
    step(t('<b>(a) วงเบส–อิมิตเตอร์</b> (สไลด์หน้า 7): กฎแรงดันของเคียร์ชอฟฟ์ (Kirchhoff\'s voltage law) ตามเข็มนาฬิกา \\(V_{CC} - I_BR_B - V_{BE} = 0\\) กระแสเบสคือแรงดันคร่อม \\(R_B\\) หารด้วย \\(R_B\\) (สมการ 4.4)', '<b>(a) The base–emitter loop</b> (slide p. 7): Kirchhoff\'s voltage law clockwise, \\(V_{CC} - I_BR_B - V_{BE} = 0\\); the base current is the voltage across \\(R_B\\) over \\(R_B\\) (Eq. 4.4)'),
      block([R`I_{BQ} &= \frac{V_{CC} - V_{BE}}{R_B} = \frac{12\ \text{V} - 0.7\ \text{V}}{240\ \text{k}\Omega} = \boxed{47.08\ \mu\text{A}}`])),
    step(t('<b>วงคอลเล็กเตอร์–อิมิตเตอร์</b> (สไลด์หน้า 8): \\(I_C = \\beta I_B\\) ไม่ขึ้นกับ \\(R_C\\) (สมการ 4.5) แล้วกฎแรงดันรอบวงให้ \\(V_{CE}\\) (สมการ 4.6)', '<b>The collector–emitter loop</b> (slide p. 8): \\(I_C = \\beta I_B\\), independent of \\(R_C\\) (Eq. 4.5), then the loop gives \\(V_{CE}\\) (Eq. 4.6)'),
      block([R`I_{CQ} &= \beta I_{BQ} = (50)(47.08\ \mu\text{A}) = \boxed{2.35\ \text{mA}}`, R`\text{(b)}\ V_{CEQ} &= V_{CC} - I_CR_C = 12\ \text{V} - (2.35\ \text{mA})(2.2\ \text{k}\Omega) = \boxed{6.83\ \text{V}}`]),
      t(`จุด Q อยู่บนเส้นโหลดที่ตัดเส้น \\(I_B\\) = 47 µA (ภาพจำลอง: ${fd(S1.IC * 1e3, 3)} mA, ${fd(S1.VCE, 3)} V โดยไม่ปัด \\(I_C\\))`, `Q sits on the load line where it meets the \\(I_B\\) = 47 µA curve (simulation: ${fd(S1.IC * 1e3, 3)} mA, ${fd(S1.VCE, 3)} V, with \\(I_C\\) unrounded).`)),
    step(t('<b>(c) แรงดันเทียบกราวด์</b>: อิมิตเตอร์ต่อกราวด์ \\(V_E = 0\\) จึงมี \\(V_B = V_{BE}\\) และ \\(V_C = V_{CE}\\) (สมการ 4.7–4.10; แผงข้างภาพ)', '<b>(c) Voltages to ground</b>: the emitter is grounded, \\(V_E = 0\\), so \\(V_B = V_{BE}\\) and \\(V_C = V_{CE}\\) (Eqs. 4.7–4.10; side panel)'),
      block([R`V_B &= V_{BE} = \boxed{0.7\ \text{V}}`, R`V_C &= V_{CE} = \boxed{6.83\ \text{V}}`])),
    step(t('<b>(d) รอยต่อเบส–คอลเล็กเตอร์</b>ด้วยสัญกรณ์ตัวห้อยคู่ \\(V_{BC} = V_B - V_C\\)', '<b>(d) The base–collector junction</b> in double-subscript notation, \\(V_{BC} = V_B - V_C\\)'),
      block([R`V_{BC} &= V_B - V_C = 0.7\ \text{V} - 6.83\ \text{V} = \boxed{-6.13\ \text{V}}`]), t('เครื่องหมายลบบอกว่ารอยต่อเบส–คอลเล็กเตอร์ไบแอสกลับ ทรานซิสเตอร์อยู่ในย่านแอกทีฟตามที่การขยายต้องการ', 'The negative sign says the base–collector junction is reverse-biased: the transistor is in the active region, as amplification requires.')),
    step(t('<b>การอิ่มตัว</b> (Example 4.2, สไลด์หน้า 10): ลัดวงจรคอลเล็กเตอร์–อิมิตเตอร์ (\\(V_{CE}\\) = 0) แล้วหากระแสคอลเล็กเตอร์ (สมการ 4.11) นี่คือปลายบนของเส้นโหลด', '<b>Saturation</b> (Example 4.2, slide p. 10): short the collector to the emitter (\\(V_{CE}\\) = 0) and find the collector current (Eq. 4.11); this is the top end of the load line'),
      block([R`I_{C\text{sat}} &= \frac{V_{CC}}{R_C} = \frac{12\ \text{V}}{2.2\ \text{k}\Omega} = \boxed{5.45\ \text{mA}}`]),
      t('\\(I_{CQ}\\) = 2.35 mA อยู่ราวครึ่งหนึ่งของค่านี้ ห่างจากย่านอิ่มตัวพอสมควร เส้นโหลด (สไลด์หน้า 11–12) ลากจาก (0 V, 5.45 mA) ถึง (12 V, 0) และจุด Q เลื่อนไปตามเส้นเมื่อ \\(I_B\\) เปลี่ยน', '\\(I_{CQ}\\) = 2.35 mA is about half of it, well clear of saturation. The load line (slides pp. 11–12) runs from (0 V, 5.45 mA) to (12 V, 0), and Q moves along it as \\(I_B\\) changes.'))],
  ask: () => ({ fields: [num('I<sub>BQ</sub> (µA) =', 47.08, { tol: 0.1 }), num('I<sub>CQ</sub> (mA) =', 2.354, { tol: 0.02 }), num('V<sub>CEQ</sub> (V) =', 6.83, { tol: 0.03 }), num('V<sub>BC</sub> (V) =', -6.13, { tol: 0.03 })],
    check: v => (v[3] > 0 && near(v[3], 6.13, 0.05) ? t('V<sub>BC</sub> = V<sub>B</sub> − V<sub>C</sub> ติดลบ: เบสต่ำกว่าคอลเล็กเตอร์', 'V<sub>BC</sub> = V<sub>B</sub> − V<sub>C</sub> is negative: the base is below the collector.') : '') }),
  answer: () => t('(a) \\(I_{BQ}\\) = 47.08 µA, \\(I_{CQ}\\) = 2.35 mA (b) \\(V_{CEQ}\\) = 6.83 V (c) \\(V_B\\) = 0.7 V, \\(V_C\\) = 6.83 V (d) \\(V_{BC}\\) = −6.13 V · \\(I_{C\\text{sat}}\\) = 5.45 mA (Boylestad Examples 4.1–4.2)', '(a) \\(I_{BQ}\\) = 47.08 µA, \\(I_{CQ}\\) = 2.35 mA (b) \\(V_{CEQ}\\) = 6.83 V (c) \\(V_B\\) = 0.7 V, \\(V_C\\) = 6.83 V (d) \\(V_{BC}\\) = −6.13 V · \\(I_{C\\text{sat}}\\) = 5.45 mA (Boylestad Examples 4.1–4.2).') };

const O2 = { VCC: 20, RB: 772e3, RC: 2000, beta: 200 }, FAM2 = CH4.fam(200, [0, 10, 20, 30, 40, 50, 60]);
DEF.ex2 = { ...LAY, solvedAt: 3, spec: () => spec('ex2', O2),
  glow: k => (k === 1 ? ['VCC'] : k === 2 ? ['RC'] : k === 3 ? ['RB'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 3 ? bdg(`R_B = 772 kΩ → ${fmtQ(z.ic, z.VCE)}`) : k === 2 ? bdg('R_C = 20 V/10 mA = 2 kΩ') : k === 1 ? bdg('V_CC = 20 V') : bdg('Q: I_B = 25 µA, I_C = 5 mA, V_CE = 10 V', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { fam: FAM2, vcc: 20, r: 2000, imax: 13, vmax: 22, yt: [2, 4, 6, 8, 10, 12], q: { v: k >= 3 ? z.VCE : 10, i: k >= 3 ? z.ic : 5, ib: 25e-6, label: bd.short ? 'Q' : 'Q (25 µA)', side: 1 },
      pts: [{ v: 0, i: 10, color: C.q, r: 5, label: k >= 2 ? (bd.short ? '' : 'V_CC/R_C = 10 mA') : '', side: 1, dy: 14 }, { v: 20, i: 0, color: C.q, r: 5, label: k >= 1 ? 'V_CC = 20 V' : '', side: -1, dy: -16 }], title: t('รูป 4.16: เส้นโหลดที่ให้มา', 'Fig. 4.16: the given load line') }); },
  steps: () => [
    step(t('<b>จุดตัดแกนนอน</b>: เมื่อ \\(I_C\\) = 0 ไม่มีแรงดันตกคร่อม \\(R_C\\) ดังนั้น \\(V_{CE} = V_{CC}\\) (สมการ 4.13) อ่านจากรูป', '<b>The horizontal intercept</b>: with \\(I_C\\) = 0 nothing drops across \\(R_C\\), so \\(V_{CE} = V_{CC}\\) (Eq. 4.13); read off the figure'),
      block([R`V_{CC} &= V_{CE}\big|_{I_C = 0} = \boxed{20\ \text{V}}`])),
    step(t('<b>จุดตัดแกนตั้ง</b>: เมื่อ \\(V_{CE}\\) = 0 กระแสคือ \\(V_{CC}/R_C\\) (สมการ 4.14) อ่านได้ 10 mA', '<b>The vertical intercept</b>: with \\(V_{CE}\\) = 0 the current is \\(V_{CC}/R_C\\) (Eq. 4.14), read as 10 mA'),
      block([R`R_C &= \frac{V_{CC}}{I_C\big|_{V_{CE} = 0}} = \frac{20\ \text{V}}{10\ \text{mA}} = \boxed{2\ \text{k}\Omega}`])),
    step(t('<b>จุด Q</b> อยู่บนเส้น \\(I_B\\) = 25 µA จึงเลือก \\(R_B\\) ให้ได้กระแสเบสนี้ (สมการ 4.4)', '<b>The Q-point</b> lies on the \\(I_B\\) = 25 µA curve, so choose \\(R_B\\) for that base current (Eq. 4.4)'),
      block([R`R_B &= \frac{V_{CC} - V_{BE}}{I_B} = \frac{20\ \text{V} - 0.7\ \text{V}}{25\ \mu\text{A}} = \boxed{772\ \text{k}\Omega}`]),
      t('ภาพจำลองสร้างวงจรด้วยค่าทั้งสาม (ทรานซิสเตอร์ β = 200 ตามชุดเส้นในรูป: 2 mA ต่อ 10 µA) และได้จุด Q ที่ 5 mA, 10 V ตามรูป', 'The simulation builds the circuit from the three values (a β = 200 transistor, as the figure\'s family: 2 mA per 10 µA) and lands at the figure\'s Q, 5 mA and 10 V.'))],
  ask: () => ({ fields: [num('V<sub>CC</sub> (V) =', 20), num('R<sub>C</sub> (kΩ) =', 2), num('R<sub>B</sub> (kΩ) =', 772, { tol: 1 })] }),
  answer: () => t('\\(V_{CC}\\) = 20 V, \\(R_C\\) = 2 kΩ, \\(R_B\\) = 772 kΩ (Boylestad Example 4.3)', '\\(V_{CC}\\) = 20 V, \\(R_C\\) = 2 kΩ, \\(R_B\\) = 772 kΩ (Boylestad Example 4.3).') };

/* Example 4.5: β doubled on the fixed-bias circuit of Ex.1 */
const O1b = { ...O1, beta: 100 };
DEF.b5 = { ...LAY, solvedAt: 1, spec: k => (k >= 1 ? spec('ex1b', O1b) : spec('ex1', O1)),
  glow: k => (k >= 1 ? ['Q'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 1 ? bdg(`β = 100: ${fmtQ(z.ic, z.VCE)}`) : bdg(`β = 50: ${fmtQ(mA(S1.IC), S1.VCE)}`, null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: k >= 1 ? 100 : 50, ibs: [0, 10, 20, 30, 40, 50, 60], vcc: 12, r: 2200, imax: 6, vmax: 14, q: { v: z.VCE, i: z.ic, ib: z.IB, label: k >= 1 ? 'Q (β = 100)' : 'Q (β = 50)', side: k >= 1 ? 1 : 1 }, labels: !bd.short,
      pts: k >= 1 ? [{ v: S1.VCE, i: mA(S1.IC), color: C.muted, r: 5, label: bd.short ? '' : 'β = 50', side: 1, dy: -16 }] : [], title: t('จุด Q เมื่อ β เพิ่มเป็นสองเท่า', 'Q when β doubles') }); },
  steps: () => [
    step(t('<b>β = 100</b>: \\(I_B\\) ไม่ขึ้นกับ β (สมการ 4.4) จึงเท่าเดิม 47.08 µA แต่ \\(I_C\\) เพิ่มตาม β เป็นสองเท่า', '<b>β = 100</b>: \\(I_B\\) does not depend on β (Eq. 4.4), so it stays at 47.08 µA, but \\(I_C\\) doubles with β'),
      block([R`I_C &= (100)(47.08\ \mu\text{A}) = \boxed{4.71\ \text{mA}}`, R`V_{CE} &= 12\ \text{V} - (4.71\ \text{mA})(2.2\ \text{k}\Omega) = \boxed{1.64\ \text{V}}`]),
      t('\\(I_C\\) เปลี่ยน 100 % และ \\(V_{CE}\\) ลดลง 76 % เมื่อ β เปลี่ยน 100 % จุด Q ไถลไปชิดย่านอิ่มตัว วงจรไบแอสคงที่จึงไวต่อ β มาก (ซึ่งเปลี่ยนตามอุณหภูมิและต่างกันแต่ละตัว) หน้า 4.2 เพิ่ม \\(R_E\\) เพื่อแก้ปัญหานี้', '\\(I_C\\) changes by 100 % and \\(V_{CE}\\) falls by 76 % for a 100 % change in β: Q slides toward saturation. The fixed-bias circuit is very sensitive to β (which changes with temperature and from one device to another); page 4.2 adds \\(R_E\\) to fix this.'))],
  ask: () => ({ fields: [num('I<sub>C</sub> (mA) =', 4.708, { tol: 0.02 }), num('V<sub>CE</sub> (V) =', 1.64, { tol: 0.03 })] }),
  answer: () => t('β = 100: \\(I_B\\) = 47.08 µA เท่าเดิม, \\(I_C\\) = 4.71 mA, \\(V_{CE}\\) = 1.64 V (Boylestad Example 4.5 ส่วนแรก)', 'β = 100: \\(I_B\\) = 47.08 µA as before, \\(I_C\\) = 4.71 mA, \\(V_{CE}\\) = 1.64 V (Boylestad Example 4.5, first part).') };

/* ---------------- page 4.2: Ex.3 = Examples 4.4 + 4.6 (emitter bias); Example 4.5 (β doubled); Example 4.7 (load line on characteristics) ---------------- */
const O3 = { VCC: 20, RB: 430e3, RC: 2000, RE: 1000, beta: 50 }, S3 = sol(O3), O3b = { ...O3, beta: 100 }, S3b = sol(O3b);
DEF.ex3 = { ...LAY, solvedAt: 1, spec: () => spec('ex3', O3),
  glow: k => (k === 1 ? ['RB', 'RE'] : k === 2 ? ['RC', 'RE'] : k === 3 ? ['RE'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 2 ? bdg(fmtQ(z.ic, z.VCE)) : k === 1 ? bdg(`I_B = 19.3 V/481 kΩ = ${fd(z.uA, 1)} µA`) : bdg('V_CC = 20 V, R_B = 430 kΩ, R_C = 2 kΩ, R_E = 1 kΩ, β = 50', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt); if (k >= 3 && k <= 4) return CH4.vbars(ctx, b, bd, s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: 50, ibs: [0, 20, 40, 60, 80, 100, 120], vcc: 20, r: 3000, imax: 8, vmax: 22, yt: [1, 2, 3, 4, 5, 6, 7, 8], q: k >= 2 ? { v: z.VCE, i: z.ic, ib: z.IB } : null, labels: !bd.short,
      pts: k >= 5 ? [{ v: 0, i: 6.67, color: C.red, r: 5.5, label: bd.short ? '' : 'I_Csat = 6.67 mA', side: 1, dy: 14 }] : [], title: t('เส้นโหลด V_CE = V_CC − I_C(R_C + R_E)', 'load line V_CE = V_CC − I_C(R_C + R_E)') }); },
  steps: () => [
    step(t('<b>(a) วงเบส–อิมิตเตอร์</b> (สไลด์หน้า 15): \\(V_{CC} - I_BR_B - V_{BE} - I_ER_E = 0\\) แทน \\(I_E = (\\beta + 1)I_B\\) ตัวต้านทานอิมิตเตอร์จึง "สะท้อน" เข้าวงเบสเป็น \\((\\beta + 1)R_E\\) (สมการ 4.17–4.18)', '<b>(a) The base–emitter loop</b> (slide p. 15): \\(V_{CC} - I_BR_B - V_{BE} - I_ER_E = 0\\) with \\(I_E = (\\beta + 1)I_B\\): the emitter resistor is "reflected" into the base loop as \\((\\beta + 1)R_E\\) (Eqs. 4.17–4.18)'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_B + (\beta + 1)R_E} = \frac{20\ \text{V} - 0.7\ \text{V}}{430\ \text{k}\Omega + (51)(1\ \text{k}\Omega)} = \frac{19.3\ \text{V}}{481\ \text{k}\Omega} = \boxed{40.1\ \mu\text{A}}`])),
    step(t('<b>(b), (c)</b> กระแสคอลเล็กเตอร์ และวงคอลเล็กเตอร์–อิมิตเตอร์ (สไลด์หน้า 16) โดยถือ \\(I_E \\cong I_C\\) (สมการ 4.19)', '<b>(b), (c)</b> The collector current, and the collector–emitter loop (slide p. 16) taking \\(I_E \\cong I_C\\) (Eq. 4.19)'),
      block([R`I_C &= \beta I_B = (50)(40.1\ \mu\text{A}) = \boxed{2.01\ \text{mA}}`, R`V_{CE} &= V_{CC} - I_C(R_C + R_E) = 20\ \text{V} - (2.01\ \text{mA})(3\ \text{k}\Omega) = \boxed{13.97\ \text{V}}`]), t(`${NOTE_IE} (${fd(S3.VCE, 2)} → ภาพจำลอง ${fd(S3.VC - (S3.IE * 1000), 2)} V)`, `${NOTE_IE} (${fd(S3.VCE, 2)} → simulation ${fd(S3.VC - (S3.IE * 1000), 2)} V)`)),
    step(t('<b>(d), (e), (f)</b> แรงดันเทียบกราวด์ (สมการ 4.20–4.24; แผงข้างภาพ)', '<b>(d), (e), (f)</b> The voltages to ground (Eqs. 4.20–4.24; side panel)'),
      block([R`V_C &= V_{CC} - I_CR_C = 20\ \text{V} - (2.01\ \text{mA})(2\ \text{k}\Omega) = \boxed{15.98\ \text{V}}`, R`V_E &= V_C - V_{CE} = 15.98 - 13.97 = \boxed{2.01\ \text{V}}\quad (= I_ER_E \cong I_CR_E)`, R`V_B &= V_{BE} + V_E = 0.7 + 2.01 = \boxed{2.71\ \text{V}}`])),
    step(t('<b>(g)</b> รอยต่อเบส–คอลเล็กเตอร์ไบแอสกลับตามต้องการ', '<b>(g)</b> The base–collector junction is reverse-biased, as required'),
      block([R`V_{BC} &= V_B - V_C = 2.71\ \text{V} - 15.98\ \text{V} = \boxed{-13.27\ \text{V}}`])),
    step(t('<b>การอิ่มตัว</b> (Example 4.6, สไลด์หน้า 18): ลัดวงจร C–E แล้ว \\(R_C\\) กับ \\(R_E\\) อนุกรมกันคร่อม \\(V_{CC}\\) (สมการ 4.25) ตัวต้านทานอิมิตเตอร์ทำให้ระดับอิ่มตัวต่ำกว่าวงจรไบแอสคงที่ที่ใช้ \\(R_C\\) เท่ากัน', '<b>Saturation</b> (Example 4.6, slide p. 18): short C–E and \\(R_C\\), \\(R_E\\) are in series across \\(V_{CC}\\) (Eq. 4.25). The emitter resistor lowers the saturation level below that of a fixed-bias circuit with the same \\(R_C\\)'),
      block([R`I_{C\text{sat}} &= \frac{V_{CC}}{R_C + R_E} = \frac{20\ \text{V}}{3\ \text{k}\Omega} = \boxed{6.67\ \text{mA}}`]), t('ราวสามเท่าของ \\(I_{CQ}\\) เส้นโหลด (สไลด์หน้า 19) ลากจาก (0, 6.67 mA) ถึง (20 V, 0)', 'About three times \\(I_{CQ}\\). The load line (slide p. 19) runs from (0, 6.67 mA) to (20 V, 0).'))],
  ask: () => ({ fields: [num('I<sub>B</sub> (µA) =', 40.1, { tol: 0.15 }), num('I<sub>C</sub> (mA) =', 2.01, { tol: 0.02 }), num('V<sub>CE</sub> (V) =', 13.97, { tol: 0.06 }), num('V<sub>B</sub> (V) =', 2.71, { tol: 0.05 })] }),
  answer: () => t('(a) 40.1 µA (b) 2.01 mA (c) 13.97 V (d) \\(V_C\\) = 15.98 V (e) \\(V_E\\) = 2.01 V (f) \\(V_B\\) = 2.71 V (g) \\(V_{BC}\\) = −13.27 V · \\(I_{C\\text{sat}}\\) = 6.67 mA (Boylestad Examples 4.4, 4.6)', '(a) 40.1 µA (b) 2.01 mA (c) 13.97 V (d) \\(V_C\\) = 15.98 V (e) \\(V_E\\) = 2.01 V (f) \\(V_B\\) = 2.71 V (g) \\(V_{BC}\\) = −13.27 V · \\(I_{C\\text{sat}}\\) = 6.67 mA (Boylestad Examples 4.4, 4.6).') };

DEF.b5e = { ...LAY, solvedAt: 1, spec: k => (k >= 1 ? spec('ex3b', O3b) : spec('ex3', O3)),
  glow: k => (k >= 1 ? ['Q', 'RE'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 1 ? bdg(`β = 100: ${fmtQ(z.ic, z.VCE)}`) : bdg(`β = 50: ${fmtQ(mA(S3.IC), S3.VCE)}`, null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: k >= 1 ? 100 : 50, ibs: [0, 20, 40, 60, 80, 100, 120], vcc: 20, r: 3000, imax: 8, vmax: 22, yt: [1, 2, 3, 4, 5, 6, 7, 8], q: { v: z.VCE, i: z.ic, ib: z.IB, label: k >= 1 ? 'Q (β = 100)' : 'Q (β = 50)', side: -1 }, labels: !bd.short,
      pts: k >= 1 ? [{ v: S3.VCE, i: mA(S3.IC), color: C.muted, r: 5, label: bd.short ? '' : 'β = 50', side: -1, dy: -16 }] : [], title: t('จุด Q เมื่อ β เพิ่มเป็นสองเท่า', 'Q when β doubles') }); },
  steps: () => [
    step(t('<b>β = 100</b>: คราวนี้ β อยู่ในตัวส่วนของ \\(I_B\\) (สมการ 4.17) กระแสเบสจึงลดลงเองเมื่อ β เพิ่ม', '<b>β = 100</b>: this time β is in the denominator of \\(I_B\\) (Eq. 4.17), so the base current falls by itself when β rises'),
      block([R`I_B &= \frac{19.3\ \text{V}}{430\ \text{k}\Omega + (101)(1\ \text{k}\Omega)} = \frac{19.3\ \text{V}}{531\ \text{k}\Omega} = 36.3\ \mu\text{A}`, R`I_C &= (100)(36.3\ \mu\text{A}) = \boxed{3.63\ \text{mA}}`, R`V_{CE} &= 20\ \text{V} - (3.63\ \text{mA})(3\ \text{k}\Omega) = \boxed{9.11\ \text{V}}`]),
      t('\\(I_C\\) เพิ่มราว 81 % (วงจรไบแอสคงที่: 100 %) และ \\(V_{CE}\\) เปลี่ยนราว 35 % (เทียบ 76 %) วงจรนี้จึงเสถียรกว่าสำหรับ β ที่เปลี่ยนเท่ากัน', '\\(I_C\\) rises by about 81 % (fixed bias: 100 %) and \\(V_{CE}\\) changes by about 35 % (against 76 %): this circuit is the more stable one for the same change in β.'))],
  ask: () => ({ fields: [num('I<sub>C</sub> (mA) =', 3.63, { tol: 0.03 }), num('V<sub>CE</sub> (V) =', 9.11, { tol: 0.08 })] }),
  answer: () => t('β = 100: \\(I_B\\) = 36.3 µA, \\(I_C\\) = 3.63 mA, \\(V_{CE}\\) = 9.11 V (Boylestad Example 4.5 ส่วนหลัง)', 'β = 100: \\(I_B\\) = 36.3 µA, \\(I_C\\) = 3.63 mA, \\(V_{CE}\\) = 9.11 V (Boylestad Example 4.5, second part).') };

/* Example 4.7: the load line on a family read as 220 per 1 µA … (Fig. 4.26b: equally spaced 1.1 mA per 5 µA) */
const O7 = { VCC: 18, RB: 910e3, RC: 2200, RE: 1100, beta: 220 }, FAM7 = CH4.fam(220, [0, 5, 10, 15, 20, 25, 30]);
DEF.e7 = { ...LAY, solvedAt: 4, spec: () => spec('e7', O7),
  glow: k => (k === 1 ? ['RC', 'RE'] : k >= 4 ? ['RB'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 4 ? bdg(`R_B = 910 kΩ → ${fmtQ(z.ic, z.VCE)}`) : k === 3 ? bdg('β = 3.3 mA/15 µA = 220') : k === 2 ? bdg('Q: I_C ≅ 3.3 mA, V_CE ≅ 7.5 V') : k === 1 ? bdg('I_Csat = 18 V/3.3 kΩ = 5.45 mA') : bdg('V_CC = 18 V, R_C = 2.2 kΩ, R_E = 1.1 kΩ, R_B = ?', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { fam: FAM7, vcc: 18, r: 3300, imax: 7, vmax: 20, yt: [1, 2, 3, 4, 5, 6], q: k >= 2 ? { v: k >= 4 ? z.VCE : 7.5, i: k >= 4 ? z.ic : 3.3, ib: 15e-6, label: bd.short ? 'Q' : 'Q (15 µA)', side: 1 } : null, labels: !bd.short,
      pts: k >= 1 ? [{ v: 0, i: 5.45, color: C.q, r: 5, label: bd.short ? '' : '5.45 mA', side: 1, dy: 14 }, { v: 18, i: 0, color: C.q, r: 5, label: bd.short ? '' : '18 V', side: -1, dy: -16 }] : [], segs: k === 0 ? [] : undefined, title: t('รูป 4.26b กับเส้นโหลดของวงจร', 'Fig. 4.26b with the circuit\'s load line') }); },
  steps: () => [
    step(t('<b>(a) เส้นโหลด</b> จากสองจุด (สมการ 4.26–4.27)', '<b>(a) The load line</b> from its two points (Eqs. 4.26–4.27)'),
      block([R`V_{CE} = 0:\ I_C &= \frac{V_{CC}}{R_C + R_E} = \frac{18\ \text{V}}{3.3\ \text{k}\Omega} = 5.45\ \text{mA}`, R`I_C = 0:\ V_{CE} &= V_{CC} = 18\ \text{V}`])),
    step(t('<b>(b)</b> จุด Q คือจุดตัดของเส้นโหลดกับเส้น \\(I_B\\) = 15 µA อ่านจากกราฟ', '<b>(b)</b> Q is where the load line meets the \\(I_B\\) = 15 µA curve; read off the graph'),
      block([R`V_{CEQ} &\cong \boxed{7.5\ \text{V}},\quad I_{CQ} \cong \boxed{3.3\ \text{mA}}`])),
    step(t('<b>(c)</b> เบตาแบบไฟตรงที่จุด Q', '<b>(c)</b> The dc beta at Q'), block([R`\beta &= \frac{I_{CQ}}{I_{BQ}} = \frac{3.3\ \text{mA}}{15\ \mu\text{A}} = \boxed{220}`])),
    step(t('<b>(d)</b> ใช้สมการ 4.17 แก้หา \\(R_B\\)', '<b>(d)</b> Solve Eq. 4.17 for \\(R_B\\)'),
      block([R`15\ \mu\text{A} &= \frac{18\ \text{V} - 0.7\ \text{V}}{R_B + (221)(1.1\ \text{k}\Omega)} = \frac{17.3\ \text{V}}{R_B + 243.1\ \text{k}\Omega}`, R`R_B &= \frac{17.3\ \text{V}}{15\ \mu\text{A}} - 243.1\ \text{k}\Omega = 1153.3 - 243.1 = \boxed{910\ \text{k}\Omega}`]),
      t('910 kΩ เป็นค่ามาตรฐานพอดี ภาพจำลองใช้ทรานซิสเตอร์ β = 220 (เส้นห่างเท่ากันอย่างรูป 4.26b) และได้จุด Q ตามที่อ่านจากกราฟ', '910 kΩ happens to be a standard value. The simulation uses a β = 220 transistor (equally spaced curves, like Fig. 4.26b) and lands on the Q read off the graph.'))],
  ask: () => ({ fields: [num('I<sub>CQ</sub> (mA) ≅', 3.3, { tol: 0.1 }), num('V<sub>CEQ</sub> (V) ≅', 7.5, { tol: 0.3 }), num('R<sub>B</sub> (kΩ) =', 910, { tol: 5 })] }),
  answer: () => t('(a) 5.45 mA ถึง 18 V (b) \\(V_{CEQ}\\) ≅ 7.5 V, \\(I_{CQ}\\) ≅ 3.3 mA (c) β = 220 (d) \\(R_B\\) = 910 kΩ (Boylestad Example 4.7)', '(a) 5.45 mA to 18 V (b) \\(V_{CEQ}\\) ≅ 7.5 V, \\(I_{CQ}\\) ≅ 3.3 mA (c) β = 220 (d) \\(R_B\\) = 910 kΩ (Boylestad Example 4.7).') };

/* ---------------- page 4.3: Ex.4 = Example 4.8 (β = 140 on the slide), Examples 4.9–4.10 (approximate, β halved), 4.11 (criterion not met) ---------------- */
const O4 = { VCC: 22, R1: 39e3, R2: 3.9e3, RC: 10e3, RE: 1500, beta: 140 }, S4 = sol(O4), O4b = { ...O4, beta: 50 }, S4b = sol(O4b), O4c = { ...O4, beta: 100 };
DEF.ex4 = { ...LAY, solvedAt: 3, spec: () => spec('ex4', O4),
  glow: k => (k === 1 || k === 2 ? ['R1', 'R2'] : k === 3 ? ['RE'] : k === 4 ? ['RC', 'RE'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 4 ? bdg(fmtQ(z.ic, z.VCE)) : k === 3 ? bdg(`I_B = 1.3 V/215.05 kΩ = ${fd(z.uA, 2)} µA`) : k === 2 ? bdg('E_Th = 2 V') : k === 1 ? bdg('R_Th = 39 kΩ ∥ 3.9 kΩ = 3.55 kΩ') : bdg('V_CC = 22 V, R_1 = 39 kΩ, R_2 = 3.9 kΩ, R_C = 10 kΩ, R_E = 1.5 kΩ, β = 140', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt); if (k <= 2) return CH4.vbars(ctx, b, bd, s.ckt, { title: t('แรงดันเทียบกราวด์ (V): V_B ≅ E_Th − I_B R_Th', 'voltages to ground (V): V_B ≅ E_Th − I_B R_Th') });
    CH4.llPlot(ctx, b, bd, { beta: 140, ibs: [0, 2, 4, 6, 8, 10], vcc: 22, r: 11500, imax: 2.4, vmax: 24, yt: [0.5, 1, 1.5, 2], q: k >= 4 ? { v: z.VCE, i: z.ic, ib: z.IB } : null, labels: !bd.short, title: t('เส้นโหลด V_CE = V_CC − I_C(R_C + R_E)', 'load line V_CE = V_CC − I_C(R_C + R_E)') }); },
  steps: () => [
    step(t('<b>ขั้นที่ 1 \\(R_{Th}\\)</b> (สไลด์หน้า 22): ปิดแหล่งจ่าย (ลัดวงจร \\(V_{CC}\\)) มองจากเบสเข้าไปเห็น \\(R_1\\) ขนาน \\(R_2\\) (สมการ 4.28)', '<b>Step 1, \\(R_{Th}\\)</b> (slide p. 22): kill the source (short \\(V_{CC}\\)); from the base, \\(R_1\\) and \\(R_2\\) are in parallel (Eq. 4.28)'),
      block([R`R_{Th} &= R_1 \parallel R_2 = \frac{(39\ \text{k}\Omega)(3.9\ \text{k}\Omega)}{39\ \text{k}\Omega + 3.9\ \text{k}\Omega} = 3.55\ \text{k}\Omega`])),
    step(t('<b>ขั้นที่ 2 \\(E_{Th}\\)</b>: ใส่ \\(V_{CC}\\) กลับ แรงดันเปิดวงจรที่เบสคือแรงดันคร่อม \\(R_2\\) ของตัวแบ่งแรงดัน (สมการ 4.29)', '<b>Step 2, \\(E_{Th}\\)</b>: put \\(V_{CC}\\) back; the open-circuit voltage at the base is the divider\'s voltage across \\(R_2\\) (Eq. 4.29)'),
      block([R`E_{Th} &= \frac{R_2V_{CC}}{R_1 + R_2} = \frac{(3.9\ \text{k}\Omega)(22\ \text{V})}{42.9\ \text{k}\Omega} = 2\ \text{V}`])),
    step(t('<b>ขั้นที่ 3</b> (สไลด์หน้า 23): แทนด้วยวงจรเทเวนิน แล้วเขียนกฎแรงดันรอบวงเบส–อิมิตเตอร์ \\(E_{Th} - I_BR_{Th} - V_{BE} - I_ER_E = 0\\) รูปแบบเดียวกับสมการ 4.17 (สมการ 4.30)', '<b>Step 3</b> (slide p. 23): insert the Thévenin circuit and write the base–emitter loop, \\(E_{Th} - I_BR_{Th} - V_{BE} - I_ER_E = 0\\), the same form as Eq. 4.17 (Eq. 4.30)'),
      block([R`I_B &= \frac{E_{Th} - V_{BE}}{R_{Th} + (\beta + 1)R_E} = \frac{2\ \text{V} - 0.7\ \text{V}}{3.55\ \text{k}\Omega + (141)(1.5\ \text{k}\Omega)} = \frac{1.3\ \text{V}}{215.05\ \text{k}\Omega} = \boxed{6.05\ \mu\text{A}}`]),
      t('สไลด์ใช้ β = 140 (ตำราฉบับก่อน) ตำราฉบับที่ 11 ใช้ β = 100 ได้ \\(I_B\\) = 8.38 µA, \\(I_C\\) = 0.84 mA, \\(V_{CE}\\) = 12.34 V', 'The slide uses β = 140 (an earlier edition); the 11th edition uses β = 100 and gets \\(I_B\\) = 8.38 µA, \\(I_C\\) = 0.84 mA, \\(V_{CE}\\) = 12.34 V.')),
    step(t('<b>ขั้นที่ 4</b>: ที่เหลือเหมือนวงจรไบแอสอิมิตเตอร์ (สมการ 4.31)', '<b>Step 4</b>: the rest is the emitter-bias circuit again (Eq. 4.31)'),
      block([R`I_C &= \beta I_B = (140)(6.05\ \mu\text{A}) = \boxed{0.847\ \text{mA}}`, R`V_{CE} &= V_{CC} - I_C(R_C + R_E) = 22\ \text{V} - (0.847\ \text{mA})(11.5\ \text{k}\Omega) = \boxed{12.26\ \text{V}}`]),
      t(`${NOTE_IE} (ภาพจำลอง ${fd(S4.VC - S4.IE * 1500, 2)} V)`, `${NOTE_IE} (simulation ${fd(S4.VC - S4.IE * 1500, 2)} V)`))],
  ask: () => ({ fields: [num('I<sub>B</sub> (µA) =', 6.045, { tol: 0.06 }), num('I<sub>C</sub> (mA) =', 0.846, { tol: 0.01 }), num('V<sub>CE</sub> (V) =', 12.26, { tol: 0.08 })],
    check: v => (near(v[0], 8.38, 0.1) ? t('8.38 µA คือค่าเมื่อ β = 100 (ตำรา) โจทย์ในสไลด์ให้ β = 140', '8.38 µA is the value for β = 100 (the book); the slide gives β = 140.') : '') }),
  answer: () => t('\\(R_{Th}\\) = 3.55 kΩ, \\(E_{Th}\\) = 2 V, \\(I_B\\) = 6.05 µA, \\(I_C\\) = 0.847 mA, \\(V_{CE}\\) = 12.26 V (Boylestad Example 4.8 ด้วย β = 140 ของสไลด์)', '\\(R_{Th}\\) = 3.55 kΩ, \\(E_{Th}\\) = 2 V, \\(I_B\\) = 6.05 µA, \\(I_C\\) = 0.847 mA, \\(V_{CE}\\) = 12.26 V (Boylestad Example 4.8 with the slide\'s β = 140).') };

DEF.vd9 = { ...LAY, solvedAt: 1, spec: k => (k >= 3 ? spec('ex4b', O4b) : spec('ex4', O4)),
  glow: k => (k === 1 ? ['R2'] : k === 2 ? ['RE'] : k >= 3 ? ['Q'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 3 ? bdg(`β = 50: ${fmtQ(z.ic, z.VCE)}`) : k === 2 ? bdg('โดยประมาณ: I_C ≅ I_E = 0.867 mA', 'approximate: I_C ≅ I_E = 0.867 mA') : k === 1 ? bdg('V_B ≅ 2 V (ไม่คิด I_B)', 'V_B ≅ 2 V (I_B ignored)') : bdg('β R_E ≥ 10 R_2 ?', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: k >= 3 ? 50 : 140, ibs: k >= 3 ? [0, 5, 10, 15, 20, 25] : [0, 2, 4, 6, 8, 10], vcc: 22, r: 11500, imax: 2.4, vmax: 24, yt: [0.5, 1, 1.5, 2], q: { v: z.VCE, i: z.ic, ib: z.IB, label: k >= 3 ? 'Q (β = 50)' : 'Q (β = 140)' }, labels: !bd.short,
      pts: k >= 3 ? [{ v: S4.VCE, i: mA(S4.IC), color: C.muted, r: 5, label: bd.short ? '' : 'β = 140', side: 1, dy: -16 }] : k >= 2 ? [{ v: 12.03, i: 0.867, color: C.tan, r: 5, label: bd.short ? '' : t('โดยประมาณ', 'approximate'), side: 1, dy: -16 }] : [], title: t('จุด Q: แม่นยำ, โดยประมาณ และเมื่อ β ลดครึ่ง', 'Q: exact, approximate, and with β halved') }); },
  steps: () => [
    step(t('<b>วิธีโดยประมาณ</b> (Example 4.9): ถ้า \\(R_i = (\\beta + 1)R_E \\cong \\beta R_E\\) ใหญ่กว่า \\(R_2\\) มาก กระแสเบสก็น้อยกว่ากระแสในตัวแบ่งมาก ตัดทิ้งได้ \\(R_1\\), \\(R_2\\) อนุกรมกัน แรงดันเบสคือกฎตัวแบ่งแรงดัน (สมการ 4.32–4.33)', '<b>The approximate method</b> (Example 4.9): if \\(R_i = (\\beta + 1)R_E \\cong \\beta R_E\\) is much larger than \\(R_2\\), the base current is much smaller than the divider current and can be ignored: \\(R_1\\), \\(R_2\\) are in series and the base voltage is the divider rule (Eqs. 4.32–4.33)'),
      block([R`\beta R_E &= (140)(1.5\ \text{k}\Omega) = 210\ \text{k}\Omega \ge 10R_2 = 39\ \text{k}\Omega\ \ \checkmark`, R`V_B &= \frac{R_2V_{CC}}{R_1 + R_2} = \frac{(3.9\ \text{k}\Omega)(22\ \text{V})}{42.9\ \text{k}\Omega} = 2\ \text{V}`])),
    step(t('จากนั้น \\(V_E\\), \\(I_E\\) และ \\(V_{CE}\\) โดยไม่ต้องรู้ β เลย (สมการ 4.34–4.37)', 'Then \\(V_E\\), \\(I_E\\) and \\(V_{CE}\\) without ever using β (Eqs. 4.34–4.37)'),
      block([R`V_E &= V_B - V_{BE} = 2\ \text{V} - 0.7\ \text{V} = 1.3\ \text{V}`, R`I_{CQ} &\cong I_E = \frac{V_E}{R_E} = \frac{1.3\ \text{V}}{1.5\ \text{k}\Omega} = \boxed{0.867\ \text{mA}}`, R`V_{CEQ} &= 22\ \text{V} - (0.867\ \text{mA})(11.5\ \text{k}\Omega) = \boxed{12.03\ \text{V}}`]),
      t('เทียบกับวิธีแม่นยำ 0.847 mA และ 12.26 V (β = 140) ใกล้กันมาก เพราะ \\(R_{Th}\\) เล็กกว่า \\((\\beta + 1)R_E\\) มาก', 'Against the exact 0.847 mA and 12.26 V (β = 140): very close, because \\(R_{Th}\\) is much smaller than \\((\\beta + 1)R_E\\).')),
    step(t('<b>β ลดครึ่ง</b> (Example 4.10, β = 50) ด้วยวิธีแม่นยำ: \\(R_{Th}\\), \\(E_{Th}\\) เท่าเดิม', '<b>β halved</b> (Example 4.10, β = 50), exactly: \\(R_{Th}\\) and \\(E_{Th}\\) are unchanged'),
      block([R`I_B &= \frac{1.3\ \text{V}}{3.55\ \text{k}\Omega + (51)(1.5\ \text{k}\Omega)} = \frac{1.3\ \text{V}}{80.05\ \text{k}\Omega} = 16.24\ \mu\text{A}`, R`I_{CQ} &= (50)(16.24\ \mu\text{A}) = \boxed{0.81\ \text{mA}}`, R`V_{CEQ} &= 22\ \text{V} - (0.81\ \text{mA})(11.5\ \text{k}\Omega) = \boxed{12.69\ \text{V}}`]),
      t('β จาก 140 เหลือ 50 แต่จุด Q แทบไม่ขยับ (0.85 → 0.81 mA) ขณะที่วงจรไบแอสคงที่ (หน้า 4.1) \\(V_{CE}\\) เปลี่ยนกว่า 300 % เมื่อ β เปลี่ยนครึ่งหนึ่ง นี่คือเหตุผลที่วงจรนี้เรียกว่า "เสถียรต่อเบตา"', 'β drops from 140 to 50 yet Q barely moves (0.85 → 0.81 mA), while the fixed-bias circuit (page 4.1) saw \\(V_{CE}\\) change by over 300 % for a halving of β. This is why the circuit is called beta-stabilized.'))],
  ask: () => ({ fields: [num(t('โดยประมาณ I<sub>C</sub> (mA) =', 'approximate I<sub>C</sub> (mA) ='), 0.867, { tol: 0.005 }), num(t('β = 50: I<sub>C</sub> (mA) =', 'β = 50: I<sub>C</sub> (mA) ='), 0.812, { tol: 0.01 })] }),
  answer: () => t('โดยประมาณ: \\(I_C\\) = 0.867 mA, \\(V_{CE}\\) = 12.03 V · β = 50: \\(I_C\\) = 0.81 mA, \\(V_{CE}\\) = 12.69 V (Boylestad Examples 4.9–4.10)', 'Approximate: \\(I_C\\) = 0.867 mA, \\(V_{CE}\\) = 12.03 V · β = 50: \\(I_C\\) = 0.81 mA, \\(V_{CE}\\) = 12.69 V (Boylestad Examples 4.9–4.10).') };

const O11 = { VCC: 18, R1: 82e3, R2: 22e3, RC: 5600, RE: 1200, beta: 50 }, S11 = sol(O11);
DEF.vd11 = { ...LAY, solvedAt: 2, spec: () => spec('vd11', O11),
  glow: k => (k === 1 ? ['R2', 'RE'] : k === 2 ? ['R1', 'R2'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 2 ? bdg(`แม่นยำ: ${fmtQ(z.ic, z.VCE)}`, `exact: ${fmtQ(z.ic, z.VCE)}`) : k === 1 ? bdg('β R_E = 60 kΩ < 10 R_2 = 220 kΩ', null, false) : bdg('V_CC = 18 V, R_1 = 82 kΩ, R_2 = 22 kΩ, R_C = 5.6 kΩ, R_E = 1.2 kΩ, β = 50', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: 50, ibs: [0, 10, 20, 30, 40, 50], vcc: 18, r: 6800, imax: 3.2, vmax: 20, yt: [0.5, 1, 1.5, 2, 2.5, 3], q: k >= 2 ? { v: z.VCE, i: z.ic, ib: z.IB, label: bd.short ? 'Q' : t('Q แม่นยำ', 'Q exact') } : null, labels: !bd.short,
      pts: k >= 3 ? [{ v: 3.88, i: 2.59, color: C.red, r: 5.5, label: bd.short ? '' : t('โดยประมาณ', 'approximate'), side: -1, dy: 16 }] : [], title: t('แม่นยำกับโดยประมาณเมื่อเงื่อนไขไม่ผ่าน', 'exact against approximate when the criterion fails') }); },
  steps: () => [
    step(t('<b>ตรวจเงื่อนไข</b> (สมการ 4.33)', '<b>Check the criterion</b> (Eq. 4.33)'), block([R`\beta R_E &= (50)(1.2\ \text{k}\Omega) = 60\ \text{k}\Omega \not\ge 10R_2 = 220\ \text{k}\Omega`]), t('ไม่ผ่าน: กระแสเบสไม่น้อยพอเมื่อเทียบกับกระแสในตัวแบ่ง', 'Not satisfied: the base current is not small enough next to the divider current.')),
    step(t('<b>วิธีแม่นยำ</b>', '<b>Exact analysis</b>'),
      block([R`R_{Th} &= 82\ \text{k}\Omega \parallel 22\ \text{k}\Omega = 17.35\ \text{k}\Omega,\quad E_{Th} = \frac{(22\ \text{k}\Omega)(18\ \text{V})}{104\ \text{k}\Omega} = 3.81\ \text{V}`, R`I_B &= \frac{3.81\ \text{V} - 0.7\ \text{V}}{17.35\ \text{k}\Omega + (51)(1.2\ \text{k}\Omega)} = \frac{3.11\ \text{V}}{78.55\ \text{k}\Omega} = 39.6\ \mu\text{A}`, R`I_{CQ} &= (50)(39.6\ \mu\text{A}) = \boxed{1.98\ \text{mA}},\quad V_{CEQ} = 18\ \text{V} - (1.98\ \text{mA})(6.8\ \text{k}\Omega) = \boxed{4.54\ \text{V}}`])),
    step(t('<b>วิธีโดยประมาณ</b> ทั้งที่เงื่อนไขไม่ผ่าน', '<b>Approximate analysis</b> although the criterion fails'),
      block([R`V_B &= E_{Th} = 3.81\ \text{V},\quad V_E = 3.11\ \text{V}`, R`I_{CQ} &\cong \frac{3.11\ \text{V}}{1.2\ \text{k}\Omega} = \boxed{2.59\ \text{mA}},\quad V_{CEQ} = 18\ \text{V} - (2.59\ \text{mA})(6.8\ \text{k}\Omega) = \boxed{3.88\ \text{V}}`]),
      t('\\(I_{CQ}\\) โดยประมาณสูงกว่าราว 30 % และ \\(V_{CEQ}\\) ต่ำกว่าราว 10 % ต่างกันชัดเจน แม้ \\(\\beta R_E\\) จะใหญ่กว่า \\(R_2\\) ราวสามเท่า ตำราจึงยึดเงื่อนไข 10 เท่าเสมอ', 'The approximate \\(I_{CQ}\\) is about 30 % high and \\(V_{CEQ}\\) about 10 % low: a clear difference, even though \\(\\beta R_E\\) is about three times \\(R_2\\). The book keeps to the factor-of-10 rule.'))],
  ask: () => ({ fields: [num(t('แม่นยำ I<sub>CQ</sub> (mA) =', 'exact I<sub>CQ</sub> (mA) ='), 1.98, { tol: 0.02 }), num(t('โดยประมาณ I<sub>CQ</sub> (mA) =', 'approximate I<sub>CQ</sub> (mA) ='), 2.59, { tol: 0.02 })] }),
  answer: () => t('แม่นยำ: 1.98 mA, 4.54 V · โดยประมาณ: 2.59 mA, 3.88 V (Boylestad Example 4.11)', 'Exact: 1.98 mA, 4.54 V · approximate: 2.59 mA, 3.88 V (Boylestad Example 4.11).') };

/* ---------------- page 4.4: Ex.5 = Examples 4.12–4.13 (collector feedback), Ex.6 = Example 4.14 (R_F1 + R_F2) ---------------- */
const O5 = { VCC: 10, RF: 250e3, RC: 4700, RE: 1200, beta: 90 }, S5 = sol(O5), O5b = { ...O5, beta: 135 }, S5b = sol(O5b);
DEF.ex5 = { ...LAY, solvedAt: 1, spec: k => (k >= 3 ? spec('ex5b', O5b) : spec('ex5', O5)),
  glow: k => (k === 1 ? ['RF'] : k === 2 ? ['RC', 'RE'] : k >= 3 ? ['Q'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 3 ? bdg(`β = 135: ${fmtQ(z.ic, z.VCE)}`) : k >= 2 ? bdg(fmtQ(z.ic, z.VCE)) : k === 1 ? bdg(`I_B = 9.3 V/781 kΩ = ${fd(z.uA, 2)} µA`) : bdg('V_CC = 10 V, R_F = 250 kΩ, R_C = 4.7 kΩ, R_E = 1.2 kΩ, β = 90', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: k >= 3 ? 135 : 90, ibs: [0, 5, 10, 15, 20, 25], vcc: 10, r: 5900, imax: 2.2, vmax: 11, yt: [0.5, 1, 1.5, 2], q: k >= 2 ? { v: z.VCE, i: z.ic, ib: z.IB, label: k >= 3 ? 'Q (β = 135)' : 'Q' } : null, labels: !bd.short,
      pts: k >= 3 ? [{ v: S5.VCE, i: mA(S5.IC), color: C.muted, r: 5, label: bd.short ? '' : 'β = 90', side: 1, dy: -16 }] : [], title: t('เส้นโหลด (I_C\' ≅ I_C)', 'load line (I_C\' ≅ I_C)') }); },
  steps: () => [
    step(t('<b>วงเบส–อิมิตเตอร์</b> (สไลด์หน้า 27–28): \\(V_{CC} - I_C\'R_C - I_BR_F - V_{BE} - I_ER_E = 0\\) กระแสใน \\(R_C\\) คือ \\(I_C\' = I_C + I_B\\) แต่ \\(I_B\\) เล็กมากจึงถือ \\(I_C\' \\cong I_C = \\beta I_B\\) และ \\(I_E \\cong I_C\\) ทั้ง \\(R_C\\) และ \\(R_E\\) สะท้อนเข้าวงเบสด้วย β (สมการ 4.41)', '<b>The base–emitter loop</b> (slides pp. 27–28): \\(V_{CC} - I_C\'R_C - I_BR_F - V_{BE} - I_ER_E = 0\\). The current in \\(R_C\\) is \\(I_C\' = I_C + I_B\\), but \\(I_B\\) is tiny, so \\(I_C\' \\cong I_C = \\beta I_B\\) and \\(I_E \\cong I_C\\): both \\(R_C\\) and \\(R_E\\) are reflected into the base loop by β (Eq. 4.41)'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_F + \beta(R_C + R_E)} = \frac{10\ \text{V} - 0.7\ \text{V}}{250\ \text{k}\Omega + (90)(5.9\ \text{k}\Omega)} = \frac{9.3\ \text{V}}{781\ \text{k}\Omega} = \boxed{11.91\ \mu\text{A}}`])),
    step(t('<b>วงคอลเล็กเตอร์–อิมิตเตอร์</b> (สไลด์หน้า 29): รูปแบบเดียวกับวงจรไบแอสอิมิตเตอร์ (สมการ 4.42)', '<b>The collector–emitter loop</b> (slide p. 29): the same form as the emitter-bias circuit (Eq. 4.42)'),
      block([R`I_{CQ} &= \beta I_B = (90)(11.91\ \mu\text{A}) = \boxed{1.07\ \text{mA}}`, R`V_{CEQ} &= V_{CC} - I_C(R_C + R_E) = 10\ \text{V} - (1.07\ \text{mA})(5.9\ \text{k}\Omega) = \boxed{3.69\ \text{V}}`]),
      t(`ภาพจำลองแก้วงจรโดยไม่ประมาณ (\\(I_C' = I_C + I_B\\), \\(I_E = (\\beta + 1)I_B\\)) ได้ \\(I_B\\) = ${fd(uA(S5.IBx), 2)} µA, \\(I_C\\) = ${fd(mA(S5.ICx), 3)} mA, \\(V_{CE}\\) = ${fd(S5.VCEx, 2)} V`, `The simulation solves the circuit without the approximations (\\(I_C' = I_C + I_B\\), \\(I_E = (\\beta + 1)I_B\\)): \\(I_B\\) = ${fd(uA(S5.IBx), 2)} µA, \\(I_C\\) = ${fd(mA(S5.ICx), 3)} mA, \\(V_{CE}\\) = ${fd(S5.VCEx, 2)} V.`)),
    step(t('<b>β เพิ่ม 50 %</b> (Example 4.13, β = 135): พจน์ \\(\\beta(R_C + R_E)\\) ในตัวส่วนใหญ่กว่า \\(R_F\\) มากอยู่แล้ว กระแสเบสจึงลดลงชดเชย', '<b>β up by 50 %</b> (Example 4.13, β = 135): the term \\(\\beta(R_C + R_E)\\) already dominates \\(R_F\\) in the denominator, so the base current falls to compensate'),
      block([R`I_B &= \frac{9.3\ \text{V}}{250\ \text{k}\Omega + (135)(5.9\ \text{k}\Omega)} = \frac{9.3\ \text{V}}{1046.5\ \text{k}\Omega} = 8.89\ \mu\text{A}`, R`I_{CQ} &= (135)(8.89\ \mu\text{A}) = \boxed{1.2\ \text{mA}},\quad V_{CEQ} = 10\ \text{V} - (1.2\ \text{mA})(5.9\ \text{k}\Omega) = \boxed{2.92\ \text{V}}`]),
      t('β เพิ่ม 50 % แต่ \\(I_{CQ}\\) เพิ่มเพียง 12 % (วงจรไบแอสคงที่จะเพิ่ม 50 %) ยิ่ง \\(\\beta(R_C + R_E)\\) ใหญ่กว่า \\(R_F\\) จุด Q ยิ่งเข้าใกล้ \\(I_C \\cong (V_{CC} - V_{BE})/(R_C + R_E)\\) ซึ่งไม่มี β', 'β rose by 50 % but \\(I_{CQ}\\) only by 12 % (fixed bias would give 50 %). The larger \\(\\beta(R_C + R_E)\\) is next to \\(R_F\\), the closer Q comes to \\(I_C \\cong (V_{CC} - V_{BE})/(R_C + R_E)\\), which has no β in it.'))],
  ask: () => ({ fields: [num('I<sub>B</sub> (µA) =', 11.91, { tol: 0.12 }), num('I<sub>CQ</sub> (mA) =', 1.07, { tol: 0.015 }), num('V<sub>CEQ</sub> (V) =', 3.69, { tol: 0.06 })] }),
  answer: () => t('\\(I_B\\) = 11.91 µA, \\(I_{CQ}\\) = 1.07 mA, \\(V_{CEQ}\\) = 3.69 V · β = 135: 1.2 mA, 2.92 V (Boylestad Examples 4.12–4.13)', '\\(I_B\\) = 11.91 µA, \\(I_{CQ}\\) = 1.07 mA, \\(V_{CEQ}\\) = 3.69 V · β = 135: 1.2 mA, 2.92 V (Boylestad Examples 4.12–4.13).') };

const O6 = { VCC: 18, RF1: 91e3, RF2: 110e3, RC: 3300, RE: 510, beta: 75 }, S6 = sol(O6);
DEF.ex6 = { ...LAY, solvedAt: 2, spec: () => spec('ex6', O6),
  glow: k => (k === 1 ? ['RF1', 'RF2'] : k === 2 ? ['RC', 'RE'] : k === 3 ? ['RC'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 3 ? bdg(`V_C = ${fd(s.ckt.V('c').re, 2)} V`) : k >= 2 ? bdg(`I_B = ${fd(z.uA, 1)} µA, I_C = ${fd(z.ic, 2)} mA`) : k === 1 ? bdg('R_B = R_F1 + R_F2 = 201 kΩ', null, false) : bdg('V_CC = 18 V, R_C = 3.3 kΩ, R_E = 510 Ω, β = 75', null, false); },
  side: (ctx, b, bd, k, s) => CH4.vbars(ctx, b, bd, s.ckt),
  steps: () => [
    step(t('<b>ตัวต้านทานเบสในโหมดไฟตรง</b>: ตัวเก็บประจุที่จุดต่อของ \\(R_{F1}\\), \\(R_{F2}\\) เป็นเปิดวงจรสำหรับไฟตรง ทั้งสองจึงอนุกรมกัน', '<b>The base resistance for dc</b>: the capacitor at the junction of \\(R_{F1}\\), \\(R_{F2}\\) is open for dc, so the two are in series'),
      block([R`R_B &= R_{F1} + R_{F2} = 91\ \text{k}\Omega + 110\ \text{k}\Omega = 201\ \text{k}\Omega`]), t('ตัวเก็บประจุมีผลเฉพาะสัญญาณไฟสลับ (ลดการป้อนกลับ) ภาพจำลองวาดเฉพาะส่วนไฟตรง', 'The capacitor matters only for the ac signal (it reduces the feedback); the simulation draws the dc part only.')),
    step(t('<b>กระแสเบสและคอลเล็กเตอร์</b> (สมการ 4.41)', '<b>The base and collector currents</b> (Eq. 4.41)'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_B + \beta(R_C + R_E)} = \frac{18\ \text{V} - 0.7\ \text{V}}{201\ \text{k}\Omega + (75)(3.81\ \text{k}\Omega)} = \frac{17.3\ \text{V}}{486.75\ \text{k}\Omega} = \boxed{35.5\ \mu\text{A}}`, R`I_C &= \beta I_B = (75)(35.5\ \mu\text{A}) = 2.66\ \text{mA}`])),
    step(t('<b>แรงดันคอลเล็กเตอร์</b>เทียบกราวด์ ถือ \\(I_C\' \\cong I_C\\)', '<b>The collector voltage</b> to ground, taking \\(I_C\' \\cong I_C\\)'),
      block([R`V_C &= V_{CC} - I_C'R_C \cong V_{CC} - I_CR_C = 18\ \text{V} - (2.66\ \text{mA})(3.3\ \text{k}\Omega) = \boxed{9.22\ \text{V}}`]), t(`ภาพจำลอง (ไม่ประมาณ) ได้ ${fd(S6.VCx, 2)} V`, `The simulation (no approximation) gives ${fd(S6.VCx, 2)} V.`))],
  ask: () => ({ fields: [num('I<sub>BQ</sub> (µA) =', 35.5, { tol: 0.3 }), num('V<sub>CQ</sub> (V) =', 9.22, { tol: 0.1 })] }),
  answer: () => t('\\(I_{BQ}\\) = 35.5 µA, \\(I_C\\) = 2.66 mA, \\(V_{CQ}\\) = 9.22 V (Boylestad Example 4.14)', '\\(I_{BQ}\\) = 35.5 µA, \\(I_C\\) = 2.66 mA, \\(V_{CQ}\\) = 9.22 V (Boylestad Example 4.14).') };

/* ---------------- page 4.5: Ex.9 = Example 4.16 (emitter follower), Ex.10 = Example 4.17 (common base) ---------------- */
const O9 = { VCC: 0, VEE: 20, RB: 240e3, RC: 0, RE: 2000, beta: 90 }, S9 = sol(O9);
DEF.ex9 = { ...LAY, solvedAt: 1, spec: () => spec('ex9', O9),
  glow: k => (k === 1 ? ['RB', 'RE'] : k === 2 ? ['RE'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 2 ? bdg(`V_CE = ${fd(z.VCE, 2)} V, I_E = ${fd(z.ie, 2)} mA`) : k === 1 ? bdg(`I_B = 19.3 V/422 kΩ = ${fd(z.uA, 2)} µA`) : bdg('V_EE = −20 V, R_B = 240 kΩ, R_E = 2 kΩ, β = 90', null, false); },
  side: (ctx, b, bd, k, s) => CH4.vbars(ctx, b, bd, s.ckt, { title: t('แรงดันเทียบกราวด์ (V): คอลเล็กเตอร์อยู่ที่ 0 V', 'voltages to ground (V): the collector sits at 0 V') }),
  steps: () => [
    step(t('<b>วงเบส–อิมิตเตอร์</b> (รูป 4.47): จากกราวด์ผ่าน \\(R_B\\) รอยต่อ และ \\(R_E\\) ลงไปที่ \\(-V_{EE}\\): \\(-I_BR_B - V_{BE} - I_ER_E + V_{EE} = 0\\) (สมการ 4.44)', '<b>The base–emitter loop</b> (Fig. 4.47): from ground through \\(R_B\\), the junction and \\(R_E\\) down to \\(-V_{EE}\\): \\(-I_BR_B - V_{BE} - I_ER_E + V_{EE} = 0\\) (Eq. 4.44)'),
      block([R`I_B &= \frac{V_{EE} - V_{BE}}{R_B + (\beta + 1)R_E} = \frac{20\ \text{V} - 0.7\ \text{V}}{240\ \text{k}\Omega + (91)(2\ \text{k}\Omega)} = \frac{19.3\ \text{V}}{422\ \text{k}\Omega} = \boxed{45.73\ \mu\text{A}}`])),
    step(t('<b>วงด้านออก</b>: คอลเล็กเตอร์ต่อกราวด์ \\(-V_{CE} - I_ER_E + V_{EE} = 0\\) (สมการ 4.45)', '<b>The output loop</b>: the collector is grounded, \\(-V_{CE} - I_ER_E + V_{EE} = 0\\) (Eq. 4.45)'),
      block([R`I_{EQ} &= (\beta + 1)I_B = (91)(45.73\ \mu\text{A}) = \boxed{4.16\ \text{mA}}`, R`V_{CEQ} &= V_{EE} - I_ER_E = 20\ \text{V} - (4.16\ \text{mA})(2\ \text{k}\Omega) = 20 - 8.32 = \boxed{11.68\ \text{V}}`]),
      t('ขาออกอยู่ที่อิมิตเตอร์ (\\(V_E\\) = −11.68 V, ต่ำกว่าเบสที่ \\(V_B = -I_BR_B\\) = −10.98 V อยู่ 0.7 V) นี่คือตัวตามแรงดันของหน้า 3.4 ในโหมดไฟตรง', 'The output is at the emitter (\\(V_E\\) = −11.68 V, 0.7 V below the base at \\(V_B = -I_BR_B\\) = −10.98 V): the emitter follower of page 3.4, in dc.'))],
  ask: () => ({ fields: [num('I<sub>B</sub> (µA) =', 45.73, { tol: 0.1 }), num('V<sub>CEQ</sub> (V) =', 11.68, { tol: 0.05 }), num('I<sub>EQ</sub> (mA) =', 4.16, { tol: 0.02 })] }),
  answer: () => t('\\(I_B\\) = 45.73 µA, \\(V_{CEQ}\\) = 11.68 V, \\(I_{EQ}\\) = 4.16 mA (Boylestad Example 4.16)', '\\(I_B\\) = 45.73 µA, \\(V_{CEQ}\\) = 11.68 V, \\(I_{EQ}\\) = 4.16 mA (Boylestad Example 4.16).') };

const E10 = CH3.cb({ VEE: 4, RE: 1200, VCC: 10, RC: 2400, q: { beta: 60, be: SIMPLE }, qText: 'β = 60' });
DEF.ex10 = { ...CH3.LAY, cktAspM: 0.44, solvedAt: 1, spec: () => E10,
  glow: k => (k === 1 ? ['RE'] : k === 3 ? ['RC', 'RE'] : k === 4 ? ['RC'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 4 ? bdg(`V_CB = ${fd(z.VCB, 2)} V, I_B = ${fd(z.uA, 2)} µA`) : k === 3 ? bdg(`V_CE = ${fd(z.VCE, 2)} V`) : k >= 1 ? bdg(`I_E = 3.3 V/1.2 kΩ = ${fd(z.ie, 2)} mA`) : bdg('V_EE = 4 V, R_E = 1.2 kΩ, V_CC = 10 V, R_C = 2.4 kΩ, β = 60', null, false); },
  side: (ctx, b, bd, k, s) => CH3.qbars(ctx, b, bd, s.ckt, { d: 3 }),
  steps: () => [
    step(t('<b>ด้านเข้า</b> (รูป 4.50): วงอิมิตเตอร์ \\(-V_{EE} + I_ER_E + V_{BE} = 0\\) ให้กระแสอิมิตเตอร์ตรง ๆ ไม่ต้องผ่าน \\(I_B\\) (สมการ 4.46)', '<b>The input side</b> (Fig. 4.50): the emitter loop \\(-V_{EE} + I_ER_E + V_{BE} = 0\\) gives the emitter current directly, without \\(I_B\\) (Eq. 4.46)'),
      block([R`I_E &= \frac{V_{EE} - V_{BE}}{R_E} = \frac{4\ \text{V} - 0.7\ \text{V}}{1.2\ \text{k}\Omega} = \boxed{2.75\ \text{mA}}`])),
    step(t('<b>กระแสเบส</b> จาก \\(I_E = (\\beta + 1)I_B\\)', '<b>The base current</b> from \\(I_E = (\\beta + 1)I_B\\)'), block([R`I_{BQ} &= \frac{I_E}{\beta + 1} = \frac{2.75\ \text{mA}}{61} = \boxed{45.08\ \mu\text{A}}`])),
    step(t('<b>\\(V_{CE}\\)</b> จากกฎแรงดันรอบขอบนอกทั้งหมด (รูป 4.51) ถือ \\(I_C \\cong I_E\\) (สมการ 4.47)', '<b>\\(V_{CE}\\)</b> from the voltage law round the whole outside (Fig. 4.51), taking \\(I_C \\cong I_E\\) (Eq. 4.47)'),
      block([R`V_{CE} &= V_{EE} + V_{CC} - I_E(R_C + R_E) = 14\ \text{V} - (2.75\ \text{mA})(3.6\ \text{k}\Omega) = \boxed{4.1\ \text{V}}`])),
    step(t('<b>\\(V_{CB}\\)</b> จากวงด้านออก \\(V_{CB} + I_CR_C - V_{CC} = 0\\) (สมการ 4.48)', '<b>\\(V_{CB}\\)</b> from the output loop, \\(V_{CB} + I_CR_C - V_{CC} = 0\\) (Eq. 4.48)'),
      block([R`V_{CBQ} &= V_{CC} - I_CR_C = 10\ \text{V} - (60)(45.08\ \mu\text{A})(2.4\ \text{k}\Omega) = 10 - 6.49 = \boxed{3.51\ \text{V}}`]),
      t('ตำราพิมพ์ "(24 kΩ)" ในบรรทัดนี้ ที่ถูกคือ 2.4 kΩ (ผลลัพธ์ 6.49 V ถูก) · ภาพจำลองได้ \\(V_{CE}\\) = 4.21 V เพราะใช้ \\(I_C = \\alpha I_E\\) = 2.705 mA แทน \\(I_C \\cong I_E\\)', 'The book prints "(24 kΩ)" on this line; 2.4 kΩ is meant (the 6.49 V is right). The simulation gives \\(V_{CE}\\) = 4.21 V because it uses \\(I_C = \\alpha I_E\\) = 2.705 mA rather than \\(I_C \\cong I_E\\).'))],
  ask: () => ({ fields: [num('I<sub>E</sub> (mA) =', 2.75, { tol: 0.01 }), num('I<sub>BQ</sub> (µA) =', 45.08, { tol: 0.1 }), num('V<sub>CBQ</sub> (V) =', 3.51, { tol: 0.03 })] }),
  answer: () => t('\\(I_E\\) = 2.75 mA, \\(I_{BQ}\\) = 45.08 µA, \\(V_{CE}\\) = 4.1 V, \\(V_{CBQ}\\) = 3.51 V (Boylestad Example 4.17)', '\\(I_E\\) = 2.75 mA, \\(I_{BQ}\\) = 45.08 µA, \\(V_{CE}\\) = 4.1 V, \\(V_{CBQ}\\) = 3.51 V (Boylestad Example 4.17).') };

/* ---------------- page 4.6: Ex.7 = Example 4.18 (feedback, R_E = 0), Ex.8 = Example 4.19 (V_EE at the emitter), Ex.11 = Example 4.20 (split supply) ---------------- */
const O7m = { VCC: 20, RF: 680e3, RC: 4700, RE: 0, beta: 120, RFname: 'R_B' }, S7m = sol(O7m);
DEF.ex7 = { ...LAY, solvedAt: 1, spec: () => spec('ex7', O7m),
  glow: k => (k === 1 ? ['RF', 'RC'] : k === 2 ? ['RC'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 2 ? bdg(fmtQ(z.ic, z.VCE)) : k === 1 ? bdg(`I_B = 19.3 V/1.244 MΩ = ${fd(z.uA, 2)} µA`) : bdg('V_CC = 20 V, R_B = 680 kΩ, R_C = 4.7 kΩ, β = 120', null, false); },
  side: (ctx, b, bd, k, s) => CH4.vbars(ctx, b, bd, s.ckt),
  steps: () => [
    step(t('<b>(a)</b> ไม่มี \\(R_E\\) สมการ 4.41 จึงเหลือการสะท้อนของ \\(R_C\\) อย่างเดียว', '<b>(a)</b> With no \\(R_E\\), Eq. 4.41 keeps only the reflection of \\(R_C\\)'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_B + \beta R_C} = \frac{20\ \text{V} - 0.7\ \text{V}}{680\ \text{k}\Omega + (120)(4.7\ \text{k}\Omega)} = \frac{19.3\ \text{V}}{1.244\ \text{M}\Omega} = 15.51\ \mu\text{A}`])),
    step(t('จุดทำงาน', 'The operating point'),
      block([R`I_{CQ} &= \beta I_B = (120)(15.51\ \mu\text{A}) = \boxed{1.86\ \text{mA}}`, R`V_{CEQ} &= V_{CC} - I_CR_C = 20\ \text{V} - (1.86\ \text{mA})(4.7\ \text{k}\Omega) = \boxed{11.26\ \text{V}}`]), t(`ภาพจำลอง (\\(I_C' = I_C + I_B\\)) ได้ ${fd(S7m.VCEx, 2)} V`, `The simulation (\\(I_C' = I_C + I_B\\)) gives ${fd(S7m.VCEx, 2)} V.`)),
    step(t('<b>(b)</b> แรงดันเทียบกราวด์: อิมิตเตอร์ต่อกราวด์', '<b>(b)</b> The voltages to ground: the emitter is grounded'),
      block([R`V_B &= V_{BE} = \boxed{0.7\ \text{V}},\quad V_C = V_{CE} = \boxed{11.26\ \text{V}},\quad V_E = \boxed{0\ \text{V}}`, R`V_{BC} &= V_B - V_C = 0.7 - 11.26 = \boxed{-10.56\ \text{V}}`]))],
  ask: () => ({ fields: [num('I<sub>CQ</sub> (mA) =', 1.86, { tol: 0.02 }), num('V<sub>CEQ</sub> (V) =', 11.26, { tol: 0.1 }), num('V<sub>BC</sub> (V) =', -10.56, { tol: 0.1 })] }),
  answer: () => t('(a) 1.86 mA, 11.26 V (b) \\(V_B\\) = 0.7 V, \\(V_C\\) = 11.26 V, \\(V_E\\) = 0, \\(V_{BC}\\) = −10.56 V (Boylestad Example 4.18)', '(a) 1.86 mA, 11.26 V (b) \\(V_B\\) = 0.7 V, \\(V_C\\) = 11.26 V, \\(V_E\\) = 0, \\(V_{BC}\\) = −10.56 V (Boylestad Example 4.18).') };

const O8 = { VCC: 0, VEE: 9, RB: 100e3, RC: 1200, RE: 0, beta: 45 }, S8 = sol(O8);
DEF.ex8 = { ...LAY, solvedAt: 1, spec: () => spec('ex8', O8),
  glow: k => (k === 1 ? ['RB'] : k === 2 ? ['RC'] : k === 3 ? ['RB'] : null),
  badge: (k, s) => { const c = s.ckt; return k >= 3 ? bdg(`V_C = ${fd(c.V('c').re, 2)} V, V_B = ${fd(c.V('b').re, 2)} V`) : k === 2 ? bdg(`I_C = ${fd(q(c).ic, 3)} mA`) : k === 1 ? bdg(`I_B = 8.3 V/100 kΩ = ${fd(q(c).uA, 0)} µA`) : bdg('V_EE = −9 V, R_B = 100 kΩ, R_C = 1.2 kΩ, β = 45', null, false); },
  side: (ctx, b, bd, k, s) => CH4.vbars(ctx, b, bd, s.ckt, { title: t('แรงดันเทียบกราวด์ (V): ทุกค่าติดลบ', 'voltages to ground (V): all negative') }),
  steps: () => [
    step(t('<b>วงเบส–อิมิตเตอร์</b>: จากกราวด์ผ่าน \\(R_B\\) ลงที่เบส ผ่านรอยต่อถึงอิมิตเตอร์ที่ \\(-V_{EE}\\): \\(-I_BR_B - V_{BE} + V_{EE} = 0\\)', '<b>The base–emitter loop</b>: from ground through \\(R_B\\) to the base, across the junction to the emitter at \\(-V_{EE}\\): \\(-I_BR_B - V_{BE} + V_{EE} = 0\\)'),
      block([R`I_B &= \frac{V_{EE} - V_{BE}}{R_B} = \frac{9\ \text{V} - 0.7\ \text{V}}{100\ \text{k}\Omega} = \boxed{83\ \mu\text{A}}`]), t('ดูแปลกตา แต่สมการเดียวกับวงจรไบแอสคงที่: แหล่งจ่ายอยู่ที่อิมิตเตอร์แทนที่จะอยู่เหนือ \\(R_B\\)', 'Unusual to look at, but the same equation as fixed bias: the supply sits at the emitter instead of above \\(R_B\\).')),
    step(t('<b>แรงดันคอลเล็กเตอร์</b>: \\(R_C\\) ต่อจากคอลเล็กเตอร์ขึ้นกราวด์ กระแส \\(I_C\\) ไหลลงจากกราวด์ผ่าน \\(R_C\\) คอลเล็กเตอร์จึงต่ำกว่ากราวด์', '<b>The collector voltage</b>: \\(R_C\\) runs from the collector up to ground; \\(I_C\\) flows down from ground through \\(R_C\\), so the collector is below ground'),
      block([R`I_C &= \beta I_B = (45)(83\ \mu\text{A}) = 3.735\ \text{mA}`, R`V_C &= -I_CR_C = -(3.735\ \text{mA})(1.2\ \text{k}\Omega) = \boxed{-4.48\ \text{V}}`])),
    step(t('<b>แรงดันเบส</b>: กระแสเบสไหลลงจากกราวด์ผ่าน \\(R_B\\) เช่นกัน', '<b>The base voltage</b>: the base current also flows down from ground through \\(R_B\\)'),
      block([R`V_B &= -I_BR_B = -(83\ \mu\text{A})(100\ \text{k}\Omega) = \boxed{-8.3\ \text{V}}`]), t('ตรวจ: \\(V_E = -9\\) V จึง \\(V_{BE} = -8.3 - (-9) = 0.7\\) V และ \\(V_{CE} = -4.48 + 9 = 4.52\\) V ย่านแอกทีฟ', 'Check: \\(V_E = -9\\) V, so \\(V_{BE} = -8.3 - (-9) = 0.7\\) V and \\(V_{CE} = -4.48 + 9 = 4.52\\) V, the active region.'))],
  ask: () => ({ fields: [num('V<sub>C</sub> (V) =', -4.48, { tol: 0.03 }), num('V<sub>B</sub> (V) =', -8.3, { tol: 0.02 })],
    check: v => (v[0] > 0 || v[1] > 0 ? t('ทั้งสองค่าติดลบ: แหล่งจ่ายเดียวของวงจรคือ −9 V ที่อิมิตเตอร์', 'Both are negative: the circuit\'s only supply is the −9 V at the emitter.') : '') }),
  answer: () => t('\\(I_B\\) = 83 µA, \\(I_C\\) = 3.735 mA, \\(V_C\\) = −4.48 V, \\(V_B\\) = −8.3 V (Boylestad Example 4.19)', '\\(I_B\\) = 83 µA, \\(I_C\\) = 3.735 mA, \\(V_C\\) = −4.48 V, \\(V_B\\) = −8.3 V (Boylestad Example 4.19).') };

const O11s = { VCC: 20, VEE: 20, R1: 8.2e3, R2: 2.2e3, RC: 2700, RE: 1800, beta: 120 }, S11s = sol(O11s);
DEF.ex11 = { ...LAY, solvedAt: 3, spec: () => spec('ex11', O11s),
  glow: k => (k === 1 || k === 2 ? ['R1', 'R2'] : k === 3 ? ['RE'] : k === 4 ? ['RC'] : null),
  badge: (k, s) => { const c = s.ckt, z = q(c); return k >= 4 ? bdg(`V_C = ${fd(c.V('c').re, 2)} V, V_B = ${fd(c.V('b').re, 2)} V`) : k === 3 ? bdg(`I_B = 7.77 V/219.5 kΩ = ${fd(z.uA, 2)} µA`) : k === 2 ? bdg('E_Th = −11.53 V') : k === 1 ? bdg('R_Th = 8.2 kΩ ∥ 2.2 kΩ = 1.73 kΩ') : bdg('V_CC = +20 V, V_EE = −20 V, R_1 = 8.2 kΩ, R_2 = 2.2 kΩ, R_C = 2.7 kΩ, R_E = 1.8 kΩ, β = 120', null, false); },
  side: (ctx, b, bd, k, s) => CH4.vbars(ctx, b, bd, s.ckt, { title: t('แรงดันเทียบกราวด์ (V) ระหว่าง +20 กับ −20 V', 'voltages to ground (V) between +20 and −20 V') }),
  steps: () => [
    step(t('<b>\\(R_{Th}\\)</b> ของตัวแบ่งที่คร่อมระหว่าง \\(V_{CC}\\) กับ \\(V_{EE}\\) (รูป 4.56): ปิดทั้งสองแหล่งจ่าย', '<b>\\(R_{Th}\\)</b> of the divider that spans \\(V_{CC}\\) to \\(V_{EE}\\) (Fig. 4.56): kill both supplies'),
      block([R`R_{Th} &= 8.2\ \text{k}\Omega \parallel 2.2\ \text{k}\Omega = 1.73\ \text{k}\Omega`])),
    step(t('<b>\\(E_{Th}\\)</b> (รูป 4.57): กระแสในตัวแบ่งไหลจาก +20 V ลงถึง −20 V แรงดันที่เบสคือแรงดันคร่อม \\(R_2\\) บวกกับ \\(-V_{EE}\\)', '<b>\\(E_{Th}\\)</b> (Fig. 4.57): the divider current runs from +20 V down to −20 V; the base voltage is the drop across \\(R_2\\) added to \\(-V_{EE}\\)'),
      block([R`I &= \frac{V_{CC} + V_{EE}}{R_1 + R_2} = \frac{40\ \text{V}}{10.4\ \text{k}\Omega} = 3.85\ \text{mA}`, R`E_{Th} &= IR_2 - V_{EE} = (3.85\ \text{mA})(2.2\ \text{k}\Omega) - 20\ \text{V} = -11.53\ \text{V}`])),
    step(t('<b>วงเบส–อิมิตเตอร์</b> (รูป 4.58): \\(-E_{Th} - I_BR_{Th} - V_{BE} - I_ER_E + V_{EE} = 0\\)', '<b>The base–emitter loop</b> (Fig. 4.58): \\(-E_{Th} - I_BR_{Th} - V_{BE} - I_ER_E + V_{EE} = 0\\)'),
      block([R`I_B &= \frac{V_{EE} - E_{Th} - V_{BE}}{R_{Th} + (\beta + 1)R_E} = \frac{20 - 11.53 - 0.7}{1.73\ \text{k}\Omega + (121)(1.8\ \text{k}\Omega)} = \frac{7.77\ \text{V}}{219.53\ \text{k}\Omega} = 35.39\ \mu\text{A}`, R`I_C &= (120)(35.39\ \mu\text{A}) = 4.25\ \text{mA}`]),
      t('ระวังเครื่องหมาย: \\(E_{Th}\\) ติดลบ ค่า "−E_Th" ในวงจึงเป็น +11.53 V ที่ต้องเอาชนะ', 'Mind the signs: \\(E_{Th}\\) is negative, so the "−E_Th" in the loop is +11.53 V that has to be overcome.')),
    step(t('<b>แรงดันเทียบกราวด์</b>', '<b>The voltages to ground</b>'),
      block([R`V_C &= V_{CC} - I_CR_C = 20\ \text{V} - (4.25\ \text{mA})(2.7\ \text{k}\Omega) = \boxed{8.53\ \text{V}}`, R`V_B &= -E_{Th} - I_BR_{Th} = -11.53\ \text{V} - (35.39\ \mu\text{A})(1.73\ \text{k}\Omega) = \boxed{-11.59\ \text{V}}`]),
      t('ตรวจ: \\(V_E = V_B - 0.7 = -12.29\\) V และ \\(V_E = -20 + I_ER_E = -20 + (4.28\\ \\text{mA})(1.8\\ \\text{kΩ}) = -12.29\\) V ตรงกัน', 'Check: \\(V_E = V_B - 0.7 = -12.29\\) V, and \\(V_E = -20 + I_ER_E = -20 + (4.28\\ \\text{mA})(1.8\\ \\text{kΩ}) = -12.29\\) V: they agree.'))],
  ask: () => ({ fields: [num('V<sub>C</sub> (V) =', 8.53, { tol: 0.05 }), num('V<sub>B</sub> (V) =', -11.59, { tol: 0.05 })] }),
  answer: () => t('\\(R_{Th}\\) = 1.73 kΩ, \\(E_{Th}\\) = −11.53 V, \\(I_B\\) = 35.39 µA, \\(I_C\\) = 4.25 mA, \\(V_C\\) = 8.53 V, \\(V_B\\) = −11.59 V (Boylestad Example 4.20)', '\\(R_{Th}\\) = 1.73 kΩ, \\(E_{Th}\\) = −11.53 V, \\(I_B\\) = 35.39 µA, \\(I_C\\) = 4.25 mA, \\(V_C\\) = 8.53 V, \\(V_B\\) = −11.59 V (Boylestad Example 4.20).') };

/* ---------------- page 4.7: Ex.12–14 = Examples 4.21–4.23 (design), Examples 4.24–4.25 (complete designs) ---------------- */
const O12 = { VCC: 20, RB: 482.5e3, RC: 2500, beta: 100 }, O12s = { VCC: 20, RB: 470e3, RC: 2400, beta: 100, qText: 'β = 100' }, FAM12 = CH4.fam(100, [0, 20, 40, 60, 80]);
DEF.ex12 = { ...LAY, solvedAt: 3, spec: k => (k >= 4 ? spec('ex12s', O12s) : spec('ex12', O12)),
  glow: k => (k === 1 ? ['VCC'] : k === 2 ? ['RC'] : k >= 3 ? ['RB'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 4 ? bdg(`ค่ามาตรฐาน 2.4 kΩ, 470 kΩ: I_B = ${fd(z.uA, 1)} µA`, `standard 2.4 kΩ, 470 kΩ: I_B = ${fd(z.uA, 1)} µA`) : k === 3 ? bdg(`R_B = 482.5 kΩ → ${fmtQ(z.ic, z.VCE)}`) : k === 2 ? bdg('R_C = 20 V/8 mA = 2.5 kΩ') : k === 1 ? bdg('V_CC = 20 V') : bdg('Q: I_B = 40 µA on the load line 8 mA – 20 V', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { fam: FAM12, vcc: 20, r: k >= 4 ? 2400 : 2500, imax: 10, vmax: 22, yt: [2, 4, 6, 8], q: { v: k >= 3 ? z.VCE : 10, i: k >= 3 ? z.ic : 4, ib: 40e-6, label: bd.short ? 'Q' : 'Q (40 µA)', side: 1 }, labels: !bd.short,
      pts: [{ v: 0, i: 8, color: C.q, r: 5, label: bd.short ? '' : '8 mA', side: 1, dy: 14 }, { v: 20, i: 0, color: C.q, r: 5, label: bd.short ? '' : '20 V', side: -1, dy: -16 }], title: t('รูป 4.59a: เส้นโหลดที่กำหนด', 'Fig. 4.59a: the specified load line') }); },
  steps: () => [
    step(t('<b>\\(V_{CC}\\)</b> คือจุดตัดแกนนอนของเส้นโหลด', '<b>\\(V_{CC}\\)</b> is the horizontal intercept of the load line'), block([R`V_{CC} &= \boxed{20\ \text{V}}`])),
    step(t('<b>\\(R_C\\)</b> จากจุดตัดแกนตั้ง \\(I_C = V_{CC}/R_C\\) = 8 mA', '<b>\\(R_C\\)</b> from the vertical intercept \\(I_C = V_{CC}/R_C\\) = 8 mA'), block([R`R_C &= \frac{V_{CC}}{I_C} = \frac{20\ \text{V}}{8\ \text{mA}} = \boxed{2.5\ \text{k}\Omega}`])),
    step(t('<b>\\(R_B\\)</b> จากกระแสเบสของเส้น Q (40 µA)', '<b>\\(R_B\\)</b> from the base current of Q\'s curve (40 µA)'), block([R`R_B &= \frac{V_{CC} - V_{BE}}{I_B} = \frac{20\ \text{V} - 0.7\ \text{V}}{40\ \mu\text{A}} = \boxed{482.5\ \text{k}\Omega}`])),
    step(t('<b>ค่ามาตรฐาน</b>: 2.4 kΩ และ 470 kΩ (ภาพจำลอง)', '<b>Standard values</b>: 2.4 kΩ and 470 kΩ (simulation)'), block([R`I_B &= \frac{19.3\ \text{V}}{470\ \text{k}\Omega} = 41.1\ \mu\text{A}`]), t('ห่างจาก 40 µA ไม่ถึง 5 % ซึ่งอยู่ในค่าคลาดเคลื่อนของตัวต้านทานอยู่แล้ว', 'Within 5 % of 40 µA, inside the tolerance of the resistors anyway.'))],
  ask: () => ({ fields: [num('V<sub>CC</sub> (V) =', 20), num('R<sub>C</sub> (kΩ) =', 2.5), num('R<sub>B</sub> (kΩ) =', 482.5, { tol: 1 })] }),
  answer: () => t('\\(V_{CC}\\) = 20 V, \\(R_C\\) = 2.5 kΩ (2.4 kΩ), \\(R_B\\) = 482.5 kΩ (470 kΩ) (Boylestad Example 4.21)', '\\(V_{CC}\\) = 20 V, \\(R_C\\) = 2.5 kΩ (2.4 kΩ), \\(R_B\\) = 482.5 kΩ (470 kΩ) (Boylestad Example 4.21).') };

const O13 = { VCC: 18, R1: 86.52e3, R2: 18e3, RC: 2800, RE: 1200, beta: 200, qText: 'β = 200' }, O13s = { ...O13, R1: 86.7e3 };
DEF.ex13 = { ...LAY, solvedAt: 2, spec: k => (k >= 4 ? spec('ex13s', O13s) : spec('ex13', O13)),
  glow: k => (k === 1 ? ['RE'] : k === 2 ? ['R1', 'R2'] : k === 3 ? ['RC'] : null),
  badge: (k, s) => { const z = q(s.ckt); return k >= 2 ? bdg(`${fmtQ(z.ic, z.VCE)} (β = 200 ในภาพจำลอง)`, `${fmtQ(z.ic, z.VCE)} (β = 200 in the simulation)`) : k === 1 ? bdg('V_E = 2.4 V, V_B = 3.1 V') : bdg('I_CQ = 2 mA, V_CEQ = 10 V: R_1 = ?, R_C = ?', null, false); },
  side: (ctx, b, bd, k, s) => CH4.vbars(ctx, b, bd, s.ckt),
  steps: () => [
    step(t('<b>แรงดันอิมิตเตอร์และเบส</b> จากกระแสที่ต้องการ (ถือ \\(I_E \\cong I_C\\))', '<b>The emitter and base voltages</b> from the required current (taking \\(I_E \\cong I_C\\))'),
      block([R`V_E &= I_ER_E \cong I_CR_E = (2\ \text{mA})(1.2\ \text{k}\Omega) = 2.4\ \text{V}`, R`V_B &= V_{BE} + V_E = 0.7\ \text{V} + 2.4\ \text{V} = 3.1\ \text{V}`])),
    step(t('<b>\\(R_1\\)</b> จากกฎตัวแบ่งแรงดัน (วิธีโดยประมาณ) โดยรู้ \\(R_2\\) = 18 kΩ', '<b>\\(R_1\\)</b> from the divider rule (the approximate method) with \\(R_2\\) = 18 kΩ known'),
      block([R`\frac{R_2V_{CC}}{R_1 + R_2} &= 3.1\ \text{V}\ \Rightarrow\ \frac{(18\ \text{k}\Omega)(18\ \text{V})}{R_1 + 18\ \text{k}\Omega} = 3.1\ \text{V}`, R`3.1R_1 &= 324\ \text{k}\Omega - 55.8\ \text{k}\Omega = 268.2\ \text{k}\Omega\ \Rightarrow\ R_1 = \boxed{86.52\ \text{k}\Omega}`])),
    step(t('<b>\\(R_C\\)</b> จากกฎของโอห์มแบบสมการ 4.49: แรงดันคร่อม \\(R_C\\) หารด้วยกระแส', '<b>\\(R_C\\)</b> from Ohm\'s law in the form of Eq. 4.49: the voltage across \\(R_C\\) over its current'),
      block([R`V_C &= V_{CE} + V_E = 10\ \text{V} + 2.4\ \text{V} = 12.4\ \text{V}`, R`R_C &= \frac{V_{CC} - V_C}{I_C} = \frac{18\ \text{V} - 12.4\ \text{V}}{2\ \text{mA}} = \boxed{2.8\ \text{k}\Omega}`])),
    step(t('<b>ค่ามาตรฐาน</b>: ใกล้ \\(R_1\\) ที่สุดคือ 82 kΩ หรือ 91 kΩ แต่ 82 kΩ + 4.7 kΩ = 86.7 kΩ อนุกรมกันใกล้ค่าออกแบบมาก (ภาพจำลอง)', '<b>Standard values</b>: the nearest to \\(R_1\\) are 82 kΩ and 91 kΩ, but 82 kΩ + 4.7 kΩ = 86.7 kΩ in series comes very close to the design value (simulation)'),
      block([R`R_1 &= 86.7\ \text{k}\Omega`]), t('โจทย์ไม่ให้ β การออกแบบด้วยวิธีโดยประมาณไม่ต้องใช้ ภาพจำลองใช้ β = 200 ได้ \\(I_C\\) = 1.87 mA, \\(V_{CE}\\) = 10.5 V ห่างเป้าหมายราว 6 % เพราะวิธีโดยประมาณตัดกระแสเบสทิ้ง และ \\(\\beta R_E\\) = 240 kΩ เกินเงื่อนไข \\(10R_2\\) = 180 kΩ เพียงเล็กน้อย', 'No β is given: the approximate design needs none. The simulation uses β = 200 and gets \\(I_C\\) = 1.87 mA, \\(V_{CE}\\) = 10.5 V, about 6 % off the target, because the approximate method ignores the base current and \\(\\beta R_E\\) = 240 kΩ only just clears \\(10R_2\\) = 180 kΩ.'))],
  ask: () => ({ fields: [num('R<sub>1</sub> (kΩ) =', 86.52, { tol: 0.3 }), num('R<sub>C</sub> (kΩ) =', 2.8, { tol: 0.02 })] }),
  answer: () => t('\\(R_1\\) = 86.52 kΩ (82 kΩ + 4.7 kΩ), \\(R_C\\) = 2.8 kΩ (Boylestad Example 4.22)', '\\(R_1\\) = 86.52 kΩ (82 kΩ + 4.7 kΩ), \\(R_C\\) = 2.8 kΩ (Boylestad Example 4.22).') };

const O14 = { VCC: 28, RB: 639.8e3, RC: 2500, RE: 1000, beta: 110 }, O14s = { VCC: 28, RB: 620e3, RC: 2400, RE: 1000, beta: 110 };
DEF.ex14 = { ...LAY, solvedAt: 3, spec: k => (k >= 4 ? spec('ex14s', O14s) : spec('ex14', O14)),
  glow: k => (k === 1 ? ['RC'] : k === 2 ? ['RE'] : k >= 3 ? ['RB'] : null),
  badge: (k, s) => { const z = q(s.ckt), c = s.ckt; return k >= 4 ? bdg(`ค่ามาตรฐาน: I_C = ${fd(z.ic, 2)} mA, V_C = ${fd(c.V('c').re, 2)} V`, `standard values: I_C = ${fd(z.ic, 2)} mA, V_C = ${fd(c.V('c').re, 2)} V`) : k >= 3 ? bdg(`I_C = ${fd(z.ic, 2)} mA, V_C = ${fd(c.V('c').re, 2)} V`) : k === 2 ? bdg('R_C + R_E = 28 V/8 mA = 3.5 kΩ') : k === 1 ? bdg('I_CQ = 4 mA, R_C = 10 V/4 mA = 2.5 kΩ') : bdg('I_CQ = ½ I_Csat = 4 mA, V_C = 18 V, β = 110', null, false); },
  side: (ctx, b, bd, k, s) => { const z = q(s.ckt);
    CH4.llPlot(ctx, b, bd, { beta: 110, ibs: [0, 10, 20, 30, 40, 50, 60, 70], vcc: 28, r: k >= 4 ? 3400 : 3500, imax: 10, vmax: 30, yt: [2, 4, 6, 8], q: k >= 3 ? { v: z.VCE, i: z.ic, ib: z.IB } : null, labels: !bd.short,
      pts: [{ v: 0, i: 8, color: C.red, r: 5, label: bd.short ? '' : 'I_Csat = 8 mA', side: 1, dy: 14 }].concat(k < 3 ? [{ v: 14, i: 4, color: C.tan, r: 5.5, label: bd.short ? '' : t('เป้าหมาย 4 mA', 'target 4 mA'), side: 1, dy: -16 }] : []), title: t('I_CQ = ½ I_Csat กลางเส้นโหลด', 'I_CQ = ½ I_Csat, mid load line') }); },
  steps: () => [
    step(t('<b>\\(R_C\\)</b>: กระแสที่ต้องการคือครึ่งหนึ่งของกระแสอิ่มตัว และรู้ \\(V_C\\) = 18 V', '<b>\\(R_C\\)</b>: the required current is half the saturation current, and \\(V_C\\) = 18 V is given'),
      block([R`I_{CQ} &= \tfrac12 I_{C\text{sat}} = 4\ \text{mA}`, R`R_C &= \frac{V_{CC} - V_C}{I_{CQ}} = \frac{28\ \text{V} - 18\ \text{V}}{4\ \text{mA}} = \boxed{2.5\ \text{k}\Omega}`])),
    step(t('<b>\\(R_E\\)</b> จากกระแสอิ่มตัว (สมการ 4.25)', '<b>\\(R_E\\)</b> from the saturation current (Eq. 4.25)'),
      block([R`R_C + R_E &= \frac{V_{CC}}{I_{C\text{sat}}} = \frac{28\ \text{V}}{8\ \text{mA}} = 3.5\ \text{k}\Omega`, R`R_E &= 3.5\ \text{k}\Omega - 2.5\ \text{k}\Omega = \boxed{1\ \text{k}\Omega}`])),
    step(t('<b>\\(R_B\\)</b> จากสมการ 4.17 โดยรู้กระแสเบสที่ต้องการ', '<b>\\(R_B\\)</b> from Eq. 4.17 with the required base current'),
      block([R`I_{BQ} &= \frac{I_{CQ}}{\beta} = \frac{4\ \text{mA}}{110} = 36.36\ \mu\text{A}`, R`R_B &= \frac{V_{CC} - V_{BE}}{I_{BQ}} - (\beta + 1)R_E = \frac{27.3\ \text{V}}{36.36\ \mu\text{A}} - (111)(1\ \text{k}\Omega) = 750.8 - 111 = \boxed{639.8\ \text{k}\Omega}`])),
    step(t('<b>ค่ามาตรฐาน</b>: \\(R_C\\) = 2.4 kΩ, \\(R_E\\) = 1 kΩ, \\(R_B\\) = 620 kΩ (ภาพจำลอง)', '<b>Standard values</b>: \\(R_C\\) = 2.4 kΩ, \\(R_E\\) = 1 kΩ, \\(R_B\\) = 620 kΩ (simulation)'),
      block([R`I_B &= \frac{27.3\ \text{V}}{620\ \text{k}\Omega + 111\ \text{k}\Omega} = 37.3\ \mu\text{A},\quad I_C = 4.11\ \text{mA}`]), t('จุด Q เลื่อนไปราว 3 % ยอมรับได้', 'Q moves by about 3 %, acceptable.'))],
  ask: () => ({ fields: [num('R<sub>C</sub> (kΩ) =', 2.5), num('R<sub>E</sub> (kΩ) =', 1), num('R<sub>B</sub> (kΩ) =', 639.8, { tol: 2 })] }),
  answer: () => t('\\(R_C\\) = 2.5 kΩ (2.4 kΩ), \\(R_E\\) = 1 kΩ, \\(R_B\\) = 639.8 kΩ (620 kΩ) (Boylestad Example 4.23)', '\\(R_C\\) = 2.5 kΩ (2.4 kΩ), \\(R_E\\) = 1 kΩ, \\(R_B\\) = 639.8 kΩ (620 kΩ) (Boylestad Example 4.23).') };

/* exact values of the simulation, for the notes (I_C' = I_C + I_B, I_E = (β + 1) I_B) */
const exact = (o, S) => { const c = new CK.Circuit(CH4.net(o)); c.solve(); const z = q(c); S.IBx = z.IB; S.ICx = z.IC; S.VCEx = z.VCE; S.VCx = c.V('c').re; return S; };
exact(O5, S5); exact(O6, S6); exact(O7m, S7m);

CH4.DEF = DEF;
CH4.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.CH4 = CH4;
})(window);
