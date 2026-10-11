/* ie6.js — chapter 6 (MOSFETs): the depletion type (Shockley's equation on both sides of V_GS = 0) and the enhancement type (I_D = k(V_GS − V_T)²),
   a planar cross-section with the channel the gate controls, the two-graph figures, and the worked problems, on top of circuit.js (part 'J' with
   kind 'dmos' | 'emos'), ie5.js (CH5.net, CH5.sol, CH5.tPlot, CH5.dPlot, CH5.fig617, CH5.explorer) and ch8.js. The global is MOS (CH6 belongs to the
   shared chart helpers). Sources: course slides "Chapter 6 MOSFET" (36 pp.) and Boylestad & Nashelsky, 11th ed., §6.7–6.9, 6.11 and §7.7–7.9:
   slide pp. 10–12 = Example 7.6 (and 7.7 with R_S = 150 Ω), pp. 13–15 = Example 7.8, pp. 25–27 = Example 7.10, pp. 29–31 = Example 7.11 (each
   statement repeated on identical slides); from the book only: Examples 6.3, 6.4, 7.9, Figs. 6.26, 6.29, 6.35, 6.37, 6.38 and the 2N3797 sheet.
   MOS.DEV: d826, ex63, p629, n3797, ex76, ex78, ex79, e635, e637, ex64, p638, ex710, ex711 · MOS.DEF: ex63, f626, n3797, p629, ex76, ex77, ex78, ex79,
   e635, e637, ex64, p638, ex710, ex711 */
(function (global) {
'use strict';
const MOS = {}, fd = CH6.fd, R = String.raw, C = IE.COL, FET = CK.FET, T = CH6.text, COL = CH6.COL;
const t = (th, en) => MC.t(th, en);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const mA = x => x * 1e3, sg = x => (x < 0 ? '−' : '') + fd(Math.abs(x), Number.isInteger(x) ? 0 : 2), pl = x => (x > 0 ? '+' : '') + sg(x);
const LAY = CH5.LAY, bdg = (th, en, ok = true) => [[th, en ?? th], ok === true ? 'ok' : ok === false ? 'wait' : ok];
const REG = { cutoff: [t('คัตออฟ', 'cutoff'), 'wait'], ohmic: [t('ย่านโอห์มิก', 'ohmic region'), 'wait'], saturation: [t('ย่านอิ่มตัว (กระแสคงที่)', 'saturation (constant current)'), 'ok'] };
const regBadge = (z, pre = '') => bdg(`${pre}${REG[z.region][0]}`, null, REG[z.region][1]);
const j = c => CH5.j(c);

/* =====================================================================================================================
   1) the devices: depletion type { kind: 'dmos', idss, vp }, enhancement type { kind: 'emos', k (A/V²), vt (V, a magnitude) }, p-channel ones with pch */
MOS.k = (idon, vgson, vt) => idon / ((vgson - vt) * (vgson - vt));   // Eq. 6.16 / 7.34
MOS.DEV = {
  d826: { kind: 'dmos', idss: 8e-3, vp: -6 }, ex63: { kind: 'dmos', idss: 10e-3, vp: -4 }, p629: { kind: 'dmos', idss: 6e-3, vp: 6, pch: true }, n3797: { kind: 'dmos', idss: 2.9e-3, vp: -5 },
  ex76: { kind: 'dmos', idss: 6e-3, vp: -3 }, ex78: { kind: 'dmos', idss: 8e-3, vp: -8 }, ex79: { kind: 'dmos', idss: 10e-3, vp: -4 },
  e635: { kind: 'emos', k: MOS.k(10e-3, 8, 2), vt: 2 }, e637: { kind: 'emos', k: 0.5e-3, vt: 4 }, ex64: { kind: 'emos', k: MOS.k(3e-3, 10, 3), vt: 3 }, p638: { kind: 'emos', k: 0.5e-3, vt: 2, pch: true },
  ex710: { kind: 'emos', k: MOS.k(6e-3, 8, 3), vt: 3 }, ex711: { kind: 'emos', k: MOS.k(3e-3, 10, 5), vt: 5 } };
/* I_D of an enhancement device in mA at V_GS (book signs) */
MOS.ke = (d, v) => CH5.sh(d, v);

/* =====================================================================================================================
   2) the planar cross-section (Figs. 6.24–6.27, 6.32–6.34): the substrate, the two n-doped wells under the source and drain contacts, the SiO2
   layer with the metal gate on top, and the channel under the oxide — built in for the depletion type and thinned or thickened by the gate, induced
   by the gate above V_T for the enhancement type; it tapers toward the drain as V_DS rises (pinch-off). Carriers run from source to drain at a speed
   set by I_D. set({ dev, vgs, vds }) (n-channel terms); step(dt); draw(ctx, box, { short }) */
MOS.Mos = class {
  constructor(dev) { this.dev = dev || MOS.DEV.d826; this.vgs = 0; this.vds = 5; this.dots = []; for (let k = 0; k < 30; k++) this.dots.push({ x: Math.random(), y: Math.random(), ph: Math.random() * 6.28 }); }
  set(o) { Object.assign(this, o); }
  cur() { return FET.iv(this.dev, this.vgs, this.vds); }
  kb() { return FET.kb(this.dev); }
  vov() { return this.vgs - this.kb().vt; }
  /* channel thickness at x (0 = source end, 1 = drain end) as a fraction of the full built-in / fully enhanced thickness */
  th(x) { const { vt } = this.kb(), vov = this.vov(); if (vov <= 0) return 0; const local = vov - Math.min(this.vds, vov) * x; return Math.max(0.05, Math.min(1.6, local / Math.abs(vt))); }
  step(dt) { if (!(dt > 0)) return; const m = this.cur(), { b, vt } = this.kb(), iref = b * vt * vt, sp = m.i > 0 ? 0.05 + 0.9 * Math.min(1.5, m.i / Math.max(iref, 1e-9)) : 0;
    this.dots.forEach(q => { q.ph += dt * 2; if (sp > 0) { q.x += sp * dt; if (q.x > 1) { q.x -= 1; q.y = Math.random(); } } else { q.x += Math.sin(q.ph) * dt * 0.02; } }); }
  draw(ctx, b, o = {}) {
    CH6.bg(ctx, b); const sh = !!o.short, d = this.dev, pch = !!d.pch, emos = d.kind === 'emos', m = this.cur(), vov = this.vov();
    const W = Math.min(b.w - 90, 440), H = Math.min(b.h - 164, 230), x0 = b.x + (b.w - W) / 2, y0 = b.y + 92, x1 = x0 + W, y1 = y0 + H;   // the badge sits above the terminal labels
    const subCol = pch ? C.nReg : C.pReg, wellCol = pch ? C.pReg : C.nReg, carCol = pch ? C.hole : C.elec, wW = W * 0.16, wH = H * 0.3, ox = H * 0.07;
    /* substrate, wells, oxide and gate */
    ctx.save(); ctx.fillStyle = subCol; ctx.fillRect(x0, y0, W, H); ctx.fillStyle = wellCol; ctx.fillRect(x0 + W * 0.08, y0, wW, wH); ctx.fillRect(x1 - W * 0.08 - wW, y0, wW, wH);
    const cL = x0 + W * 0.08 + wW, cR = x1 - W * 0.08 - wW, cw = cR - cL, thMax = H * 0.2;
    /* the depletion region under the channel (holes pushed down by a positive gate, Fig. 6.33) */
    const dep = Math.max(0, Math.min(1, (this.vgs + Math.abs(this.kb().vt)) / (2 * Math.abs(this.kb().vt)))) * H * 0.22;
    if (dep > 1) { ctx.fillStyle = 'rgba(255,209,102,.14)'; ctx.fillRect(cL, y0, cw, thMax * 1.6 + dep); }
    /* the channel: a strip under the oxide whose thickness follows the local overdrive */
    if (vov > 0) { ctx.fillStyle = pch ? 'rgba(255,126,182,.35)' : 'rgba(90,209,255,.35)'; ctx.beginPath(); ctx.moveTo(cL, y0); for (let k = 0; k <= 30; k++) { const x = k / 30; ctx.lineTo(cL + cw * x, y0 + thMax * this.th(x)); } ctx.lineTo(cR, y0); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,209,102,.55)'; ctx.fillRect(cL - 4, y0 - ox, cw + 8, ox);   // SiO2
    ctx.fillStyle = '#9aa3c7'; ctx.fillRect(cL - 4, y0 - ox - 9, cw + 8, 9);   // the gate metal
    ctx.fillRect(x0 + W * 0.08, y0 - 9, wW, 9); ctx.fillRect(x1 - W * 0.08 - wW, y0 - 9, wW, 9); ctx.fillRect(x0 + W * 0.42, y1, W * 0.16, 8);   // contacts: S, D, SS
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, W, H); ctx.restore();
    /* carriers in the wells and the channel */
    this.dots.forEach((q, k) => { let x, y; if (vov > 0 && m.i > 0) { x = cL + cw * q.x; y = y0 + 2 + (thMax * this.th(q.x) - 4) * q.y; } else { const left = k % 2 === 0; x = (left ? x0 + W * 0.08 : x1 - W * 0.08 - wW) + 4 + (wW - 8) * q.y; y = y0 + 4 + (wH - 8) * ((q.x * 7) % 1); }
      if (pch) IE.ring(ctx, x, y, 3.6, C.hole, 1.8); else IE.dot(ctx, x, y, 3.2, carCol, vov > 0 ? 5 : 0); });
    /* the gate's charge (Figs. 6.27, 6.33): + signs on a positive gate, − on a negative one, more of them the larger |V_GS|; and the substrate's own
       carriers (the holes of a p-substrate) pushed down below the depleted band */
    const nq = Math.min(8, Math.round(Math.abs(this.vgs) * 1.5)); for (let k = 0; k < nq; k++) T(ctx, this.vgs > 0 ? '+' : '−', cL + cw * (k + 0.5) / nq, y0 - ox - 4, { color: this.vgs > 0 ? '#ff6b6b' : C.elec, size: 11, weight: '700' });
    const yh = y0 + thMax * 1.6 + Math.max(dep, 4) + 16; for (let k = 0; k < 7; k++) { const x = cL + cw * (k + 0.5) / 7 + Math.sin(k * 2.1) * 6, y = yh + ((k * 37) % 23); if (pch) IE.dot(ctx, x, y, 3, C.elec, 0); else IE.ring(ctx, x, y, 3.6, C.hole, 1.6); }
    /* letters */
    T(ctx, pch ? 'p' : 'n', x0 + W * 0.08 + wW / 2, y0 + wH / 2, { color: carCol, size: 14, weight: '700' }); T(ctx, pch ? 'p' : 'n', x1 - W * 0.08 - wW / 2, y0 + wH / 2, { color: carCol, size: 14, weight: '700' });
    T(ctx, pch ? t('สารฐาน n', 'n-substrate') : t('สารฐาน p', 'p-substrate'), x0 + W / 2, y0 + H * 0.68, { color: COL.muted, size: 12.5, weight: '600' });
    T(ctx, sh ? 'S' : t('ซอร์ส (S)', 'source (S)'), x0 + W * 0.08 + wW / 2, y0 - 22, { color: COL.ink, size: 12.5, weight: '600' }); T(ctx, sh ? 'D' : t('เดรน (D)', 'drain (D)'), x1 - W * 0.08 - wW / 2, y0 - 22, { color: COL.ink, size: 12.5, weight: '600' });
    T(ctx, sh ? 'G' : t('เกต (G)', 'gate (G)'), x0 + W / 2, y0 - ox - 22, { color: COL.ink, size: 12.5, weight: '600' }); T(ctx, 'SS', x0 + W / 2, y1 + 20, { color: COL.muted, size: 12, weight: '600' });
    /* the state of the channel */
    const { vt } = this.kb(), msg = vov <= 0 ? (emos ? t(`V_GS = ${pl(this.vgs)} V < V_T: ไม่มีช่อง`, `V_GS = ${pl(this.vgs)} V < V_T: no channel`) : t('V_GS ≤ V_P: ช่องปิดสนิท (คัตออฟ)', 'V_GS ≤ V_P: the channel is closed (cutoff)'))
      : emos ? t(`ช่องเหนี่ยวนำ: V_GS − V_T = ${fd(vov, 1)} V`, `induced channel: V_GS − V_T = ${fd(vov, 1)} V`) : this.vgs < 0 ? t('ดีพลีชันโหมด: ช่องแคบลง', 'depletion mode: the channel narrows') : this.vgs > 0 ? t('เอนแฮนซ์เมนต์โหมด: ช่องกว้างขึ้น', 'enhancement mode: the channel widens') : t('V_GS = 0: ช่องที่สร้างมา (I_DSS)', 'V_GS = 0: the built-in channel (I_DSS)');
    T(ctx, msg, x0 + W / 2, y1 + 42, { color: C.q, size: 12.5, weight: '600' });
    if (!sh) T(ctx, m.region === 'saturation' ? t('ช่องถูกบีบที่ปลายเดรน (พินช์ออฟ) กระแสคงที่', 'the channel is pinched at the drain end: constant current') : m.region === 'ohmic' ? t('ช่องเปิดตลอด: ตัวต้านทาน', 'the channel is open along its length: a resistor') : '', x0 + W / 2, y1 + 60, { color: COL.muted, size: 11.5 });
    T(ctx, `I_D = ${fd(mA(m.i), 2)} mA`, x1 - W * 0.08 - wW / 2, y0 - 42, { color: C.q, size: 12.5, weight: '700' }); void vt;
  }
};

/* =====================================================================================================================
   3) the problems */
const DEF = {}, D = MOS.DEV, SP = {};
const spec = (key, o) => SP[key] || (SP[key] = CH5.net(o));
const exact = (o) => { const c = new CK.Circuit(CH5.net(o)); c.solve(); return j(c); };
const NOTE_OHM = t('ภาพจำลองมีย่านโอห์มิก (ทางซ้ายของแนวพินช์ออฟ \\(V_{DS} = V_{GS} - V_P\\)) สมการของ Shockley ใช้ได้เฉพาะในย่านอิ่มตัว', 'The simulation includes the ohmic region (left of the pinch-off locus \\(V_{DS} = V_{GS} - V_P\\)); Shockley\'s equation holds only in saturation.');

/* ---------------- page 6.1: the depletion type ---------------- */
const FIX = (dev, vgs, vdd, key) => ({ dev, VGG: dev.pch ? vgs : -vgs, VDD: vdd, RG: 1e6, RD: 0, qText: '', key });   // vgs in the book's signs. CH5.net's V_GG is the polarity that constricts the channel (n-channel: V_GS = −V_GG, p-channel: V_GS = +V_GG), so a p-channel takes vgs as it is; a gate supply through R_G (no drop), V_DD straight across D–S
const E63 = [0, -2, -1.2, 1].map(v => FIX(D.ex63, v, 20));
DEF.ex63 = { ...LAY, solvedAt: 0, spec: k => spec('e63_' + Math.min(k, 3), E63[Math.min(k, 3)]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GS = ${pl(z.VGS)} V → I_D = ${fd(z.id, 2)} mA${z.VGS > 0 ? ' (> I_DSS)' : ''}`); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.ex63, imax: 20, vmin: -5, vmax: 2, yt: [4, 8, 12, 16, 20], tbl: k >= 1 && !bd.short, pts: [{ v: z.VGS, i: z.id, label: `(${pl(z.VGS)} V, ${fd(z.id, 2)} mA)`, side: z.VGS > 0 ? -1 : 1, dy: 14 }], guides: [{ v: z.VGS, i: z.id }],
    vl: [{ v: 0, color: 'rgba(232,236,247,.25)', w: 1, dash: [3, 3] }], title: t('รูป 6.28: I_DSS = 10 mA, V_P = −4 V ต่อเข้าฝั่ง V_GS > 0', 'Fig. 6.28: I_DSS = 10 mA, V_P = −4 V, continued into V_GS > 0') }); },
  steps: () => [
    step(t('<b>ฝั่งดีพลีชัน</b>: เหมือน JFET ทุกประการ (ตาราง 6.1): \\(V_{GS}\\) = 0 ให้ \\(I_{DSS}\\) และ \\(V_{GS} = V_P\\) ให้ศูนย์', '<b>The depletion side</b>: exactly as for a JFET (Table 6.1): \\(V_{GS}\\) = 0 gives \\(I_{DSS}\\), \\(V_{GS} = V_P\\) gives zero'),
      block([R`(0\ \text{V},\ 10\ \text{mA})\quad &\text{and}\quad (-4\ \text{V},\ 0)`])),
    step(t('<b>จุดลัด</b> ที่ \\(V_P/2\\) (ภาพจำลอง)', '<b>The shortcut</b> at \\(V_P/2\\) (simulation)'), block([R`V_{GS} = \frac{V_P}{2} = -2\ \text{V}:\quad I_D &= \frac{I_{DSS}}{4} = \boxed{2.5\ \text{mA}}`])),
    step(t('<b>จุดลัดที่สอง</b> ที่ \\(I_{DSS}/2\\)', '<b>The second shortcut</b> at \\(I_{DSS}/2\\)'), block([R`I_D = \frac{I_{DSS}}{2} = 5\ \text{mA}:\quad V_{GS} &\cong 0.3V_P = \boxed{-1.2\ \text{V}}`])),
    step(t('<b>ฝั่งเอนแฮนซ์เมนต์</b>: ต่างจาก JFET ตรงที่ \\(V_{GS}\\) เป็นบวกได้ (ฉนวน SiO₂ ไม่มีรอยต่อให้ไบแอสตรง) สมการของ Shockley ยังใช้ได้ แต่กระแสพุ่งเร็ว เลือกค่าอย่างระมัดระวัง: ลอง +1 V', '<b>The enhancement side</b>: unlike a JFET, \\(V_{GS}\\) may be positive (the SiO₂ insulator has no junction to forward-bias). Shockley\'s equation still holds, but the current rises fast, so choose conservatively: try +1 V'),
      block([R`I_D &= 10\ \text{mA}\left(1 - \frac{+1\ \text{V}}{-4\ \text{V}}\right)^2 = 10\ \text{mA}(1.25)^2 = \boxed{15.63\ \text{mA}}`]),
      t('ค่าเกิน \\(I_{DSS}\\) แล้ว พอสำหรับจบรูป 6.28 ระวังพิกัดกระแสสูงสุดของอุปกรณ์เมื่อไบแอสฝั่งบวก', 'Already above \\(I_{DSS}\\), enough to finish Fig. 6.28; mind the device\'s maximum current rating when biasing on the positive side.'))],
  ask: () => ({ fields: [num(t('I<sub>D</sub> ที่ V<sub>P</sub>/2 (mA) =', 'I<sub>D</sub> at V<sub>P</sub>/2 (mA) ='), 2.5, { tol: 0.02 }), num(t('I<sub>D</sub> ที่ +1 V (mA) =', 'I<sub>D</sub> at +1 V (mA) ='), 15.63, { tol: 0.05 })] }),
  answer: () => t('(0, 10 mA), (−4 V, 0), (−2 V, 2.5 mA), (−1.2 V, 5 mA) และ (+1 V, 15.63 mA) (Boylestad Example 6.3)', '(0, 10 mA), (−4 V, 0), (−2 V, 2.5 mA), (−1.2 V, 5 mA) and (+1 V, 15.63 mA) (Boylestad Example 6.3).') };

const F626 = [0, -1, 1, 4].map(v => FIX(D.d826, v, 25));
DEF.f626 = { ...LAY, solvedAt: 0, spec: k => spec('f626_' + Math.min(k, 3), F626[Math.min(k, 3)]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GS = ${pl(z.VGS)} V → I_D = ${fd(z.id, 2)} mA · ${z.VGS < 0 ? t('ดีพลีชันโหมด', 'depletion mode') : z.VGS > 0 ? t('เอนแฮนซ์เมนต์โหมด', 'enhancement mode') : 'I_DSS'}`, null, z.id > 20 ? 'wait' : true); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt), big = k >= 3;   // the +4 V step needs twice the current scale
    CH5.dPlot(ctx, b, bd, { dev: D.d826, vgs: (big ? [4] : []).concat([1, 0, -1, -2, -3, -4, -5, -6]), vmax: 25, imax: big ? 24 : 12, yt: big ? [4, 8, 12, 16, 20, 24] : [2, 4, 6, 8, 10, 12], q: { v: Math.min(z.VDS, 24), i: z.id, label: bd.short ? '' : `${fd(z.id, 2)} mA`, side: -1, dy: 14 }, labels: !bd.short,
    title: big ? t('รูป 6.26 ขยายสเกล: เส้น V_GS = +4 V ที่ 22.2 mA', 'Fig. 6.26 rescaled: the V_GS = +4 V curve at 22.2 mA') : t('รูป 6.26: I_DSS = 8 mA, V_P = −6 V กับเส้น V_GS = +1 V', 'Fig. 6.26: I_DSS = 8 mA, V_P = −6 V, with the V_GS = +1 V curve') }); },
  steps: () => [
    step(t('<b>\\(V_{GS}\\) = −1 V (ดีพลีชันโหมด)</b>: ศักย์ลบที่เกตผลักอิเล็กตรอนในช่องลงไปรวมตัวกับโฮลของสารฐาน พาหะในช่องน้อยลง กระแสลดลงตามสมการของ Shockley เหมือน JFET', '<b>\\(V_{GS}\\) = −1 V (depletion mode)</b>: the negative gate pushes channel electrons down to recombine with holes of the substrate; fewer carriers remain and the current falls by Shockley\'s equation, as for a JFET'),
      block([R`I_D &= 8\ \text{mA}\left(1 - \frac{-1}{-6}\right)^2 = 8\ \text{mA}(0.6944) = \boxed{5.56\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = +1 V (เอนแฮนซ์เมนต์โหมด)</b>: ศักย์บวกที่เกตดึงอิเล็กตรอนเพิ่มจากสารฐานเข้าช่อง พาหะมากขึ้น กระแสเกิน \\(I_{DSS}\\) สมการเดิมใช้ได้แค่ใส่เครื่องหมายให้ถูก', '<b>\\(V_{GS}\\) = +1 V (enhancement mode)</b>: the positive gate draws extra electrons from the substrate into the channel; more carriers, and the current exceeds \\(I_{DSS}\\). The same equation applies, with the signs kept right'),
      block([R`I_D &= 8\ \text{mA}\left(1 - \frac{+1}{-6}\right)^2 = 8\ \text{mA}(1.361) = \boxed{10.89\ \text{mA}}`]), t('ระยะห่างระหว่างเส้น 0 กับ +1 V ในรูป 6.26 (ราว 2.9 mA) ใหญ่กว่าระหว่าง 0 กับ −1 V (2.4 mA): ฝั่งบวกชันกว่า', 'The gap between the 0 and +1 V curves of Fig. 6.26 (about 2.9 mA) is larger than between 0 and −1 V (2.4 mA): the positive side is steeper.')),
    step(t('<b>\\(V_{GS}\\) = +4 V</b>: กระแสพุ่งเกินสองเท่าของ \\(I_{DSS}\\) อาจเกินพิกัดกระแสหรือกำลังของอุปกรณ์ ผู้ใช้ต้องตรวจใบข้อมูลก่อนไบแอสฝั่งบวก', '<b>\\(V_{GS}\\) = +4 V</b>: the current shoots past twice \\(I_{DSS}\\) and may exceed the device\'s current or power rating; check the data sheet before biasing on the positive side'),
      block([R`I_D &= 8\ \text{mA}\left(1 + \frac{4}{6}\right)^2 = 8\ \text{mA}(2.778) = \boxed{22.2\ \text{mA}}`]))],
  ask: () => ({ fields: [num(t('I<sub>D</sub> ที่ −1 V (mA) =', 'I<sub>D</sub> at −1 V (mA) ='), 5.56, { tol: 0.03 }), num(t('I<sub>D</sub> ที่ +1 V (mA) =', 'I<sub>D</sub> at +1 V (mA) ='), 10.89, { tol: 0.05 })] }),
  answer: () => t('−1 V: 5.56 mA · +1 V: 10.89 mA · +4 V: 22.2 mA (Boylestad รูป 6.26 และหัวข้อ 6.7)', '−1 V: 5.56 mA · +1 V: 10.89 mA · +4 V: 22.2 mA (Boylestad Fig. 6.26 and §6.7).') };

/* the 2N3797 sheet (slide p. 8): I_DSS 2–6 mA (typ. 2.9), V_GS(off) −5 to −7 V (typ. −5), I_D(on) 9–18 mA (typ. 14) at V_GS = +3.5 V */
const N37 = [0, 3.5].map(v => FIX(D.n3797, v, 10)), N37max = FIX({ kind: 'dmos', idss: 6e-3, vp: -7 }, 3.5, 10);
DEF.n3797 = { ...LAY, solvedAt: 1, spec: k => (k >= 2 ? spec('n37max', N37max) : spec('n37_' + Math.min(k, 1), N37[Math.min(k, 1)])),
  glow: k => (k >= 1 ? ['VGG', 'Q'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`${k >= 2 ? 'max' : 'typ'}: V_GS = ${pl(z.VGS)} V → I_D = ${fd(z.id, 2)} mA`); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt), d = k >= 2 ? N37max.dev : D.n3797; CH5.tPlot(ctx, b, bd, { dev: d, imax: 20, vmin: -8, vmax: 4.5, yt: [4, 8, 12, 16, 20], xt: [-8, -6, -4, -2, 2, 4], pts: [{ v: z.VGS, i: z.id, label: `${fd(z.id, 2)} mA`, side: -1, dy: 14 }].concat(k >= 1 ? [{ v: 3.5, i: 14, color: C.tan, r: 5, label: bd.short ? '' : t('ใบข้อมูล typ 14 mA', 'sheet typ. 14 mA'), side: -1, dy: -14 }] : []), guides: [{ v: z.VGS, i: z.id }],
    vl: [{ v: 0, color: 'rgba(232,236,247,.25)', w: 1, dash: [3, 3] }], title: k >= 2 ? t('2N3797 ค่าสูงสุด: I_DSS = 6 mA, V_P = −7 V', '2N3797 maximum: I_DSS = 6 mA, V_P = −7 V') : t('2N3797 ค่าตัวแบบ: I_DSS = 2.9 mA, V_P = −5 V', '2N3797 typical: I_DSS = 2.9 mA, V_P = −5 V') }); },
  steps: () => [
    step(t('<b>ใบข้อมูล</b> (สไลด์หน้า 8): \\(I_{DSS}\\) ("zero-gate-voltage drain current") 2–6 mA ค่าตัวแบบ 2.9 mA, \\(V_{GS(\\text{off})}\\) = \\(V_P\\) −5 ถึง −7 V และ \\(I_{D(\\text{on})}\\) ที่ \\(V_{GS}\\) = +3.5 V: 9–18 mA ค่าตัวแบบ 14 mA จุดสุดท้ายมีเฉพาะมอสเฟตแบบดีพลีชัน เพราะกระแสเกิน \\(I_{DSS}\\) ได้', '<b>The sheet</b> (slide p. 8): \\(I_{DSS}\\) ("zero-gate-voltage drain current") 2–6 mA, typically 2.9 mA; \\(V_{GS(\\text{off})}\\) = \\(V_P\\) −5 to −7 V; and \\(I_{D(\\text{on})}\\) at \\(V_{GS}\\) = +3.5 V: 9–18 mA, typically 14 mA. That last point exists only for a depletion MOSFET, since its current can exceed \\(I_{DSS}\\)'),
      block([R`I_D(+3.5\ \text{V}) &= 2.9\ \text{mA}\left(1 + \frac{3.5}{5}\right)^2 = 2.9(2.89) = \boxed{8.38\ \text{mA}}`]),
      t('น้อยกว่าค่าตัวแบบของใบข้อมูล (14 mA) ราว 40 %: สมการของ Shockley เป็นแบบจำลอง ในฝั่งเอนแฮนซ์เมนต์อุปกรณ์จริงให้กระแสมากกว่า (พาหะถูกดึงเข้ามาเพิ่มจากสารฐาน) ใบข้อมูลจึงให้จุด \\(I_{D(\\text{on})}\\) ไว้ต่างหาก', 'About 40 % below the sheet\'s typical 14 mA: Shockley\'s equation is a model, and on the enhancement side a real device gives more (extra carriers drawn in from the substrate), which is why the sheet gives the \\(I_{D(\\text{on})}\\) point separately.')),
    step(t('<b>ค่าสูงสุด</b>: ถ้าอุปกรณ์ตัวหนึ่งมีทั้ง \\(I_{DSS}\\) = 6 mA และ \\(V_P\\) = −7 V', '<b>The maximum values</b>: if one device had both \\(I_{DSS}\\) = 6 mA and \\(V_P\\) = −7 V'),
      block([R`I_D(+3.5\ \text{V}) &= 6\ \text{mA}\left(1 + \frac{3.5}{7}\right)^2 = 6(2.25) = \boxed{13.5\ \text{mA}}`]), t('ยังอยู่ในช่วง 9–18 mA ของใบข้อมูล การกระจายของ \\(I_{DSS}\\) และ \\(V_P\\) ระหว่างอุปกรณ์ (เกือบสามเท่า) ใหญ่กว่าความคลาดเคลื่อนของแบบจำลองมาก นี่คือเหตุที่การไบแอสต้องทนต่อการเปลี่ยนอุปกรณ์', 'Still within the sheet\'s 9–18 mA. The spread of \\(I_{DSS}\\) and \\(V_P\\) between devices (nearly threefold) dwarfs the model\'s error, which is why a bias circuit must tolerate a change of device.'))],
  ask: () => ({ fields: [num(t('Shockley (ค่าตัวแบบ) ที่ +3.5 V: I<sub>D</sub> (mA) =', 'Shockley (typical) at +3.5 V: I<sub>D</sub> (mA) ='), 8.38, { tol: 0.05 })] }),
  answer: () => t('8.38 mA (ค่าตัวแบบ) และ 13.5 mA (ค่าสูงสุด) เทียบกับใบข้อมูล 9–18 mA (2N3797, สไลด์หน้า 8)', '8.38 mA (typical) and 13.5 mA (maximum) against the sheet\'s 9–18 mA (2N3797, slide p. 8).') };

const P629 = [0, 3, -1].map(v => FIX(D.p629, v, 12));   // a p-channel: V_GS (book signs) = +3 V depletes, −1 V enhances; CH5.net turns the supplies round
DEF.p629 = { ...LAY, solvedAt: 1, spec: k => spec('p629_' + Math.min(k, 2), P629[Math.min(k, 2)]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q', 'VDD']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`p-channel: V_GS = ${pl(-z.VGS)} V → I_D = ${fd(z.id, 2)} mA`); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.p629, imax: 10, vmin: -2, vmax: 7, xt: [-2, -1, 1, 2, 3, 4, 5, 6, 7], yt: [2, 4, 6, 8, 10], tbl: !bd.short, pts: [{ v: -z.VGS, i: z.id, label: `(${pl(-z.VGS)} V, ${fd(z.id, 2)} mA)`, side: 1, dy: 14 }], guides: [{ v: -z.VGS, i: z.id }],
    vl: [{ v: 0, color: 'rgba(232,236,247,.25)', w: 1, dash: [3, 3] }], title: t('รูป 6.29: p-channel, I_DSS = 6 mA, V_P = +6 V', 'Fig. 6.29: p-channel, I_DSS = 6 mA, V_P = +6 V') }); },
  steps: () => [
    step(t('<b>ภาพสะท้อน</b> (สไลด์หน้า 6, รูป 6.29): p-channel มี \\(V_P\\) บวก \\(V_{GS}\\) บวกทำให้ช่องแคบลง (ดีพลีชัน) ที่ \\(V_P/2\\) = +3 V', '<b>The mirror image</b> (slide p. 6, Fig. 6.29): a p-channel has a positive \\(V_P\\); a positive \\(V_{GS}\\) narrows the channel (depletion). At \\(V_P/2\\) = +3 V'),
      block([R`I_D &= 6\ \text{mA}\left(1 - \frac{3}{6}\right)^2 = \frac{I_{DSS}}{4} = \boxed{1.5\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = −1 V</b>: ฝั่งลบคือเอนแฮนซ์เมนต์ของ p-channel กระแสเกิน \\(I_{DSS}\\) ส่วน \\(V_{DS}\\) เป็นลบและ \\(I_D\\) ไหลออกจากเดรน (ภาพจำลองกลับขั้วแหล่งจ่ายทั้งสอง)', '<b>\\(V_{GS}\\) = −1 V</b>: the negative side is the p-channel\'s enhancement; the current exceeds \\(I_{DSS}\\), while \\(V_{DS}\\) is negative and \\(I_D\\) flows out of the drain (both supplies are turned round in the simulation)'),
      block([R`I_D &= 6\ \text{mA}\left(1 - \frac{-1}{+6}\right)^2 = 6\ \text{mA}(1.361) = \boxed{8.17\ \text{mA}}`]))],
  ask: () => ({ fields: [num(t('I<sub>D</sub> ที่ +3 V (mA) =', 'I<sub>D</sub> at +3 V (mA) ='), 1.5, { tol: 0.02 }), num(t('I<sub>D</sub> ที่ −1 V (mA) =', 'I<sub>D</sub> at −1 V (mA) ='), 8.17, { tol: 0.05 })] }),
  answer: () => t('+3 V: 1.5 mA · −1 V: 8.17 mA (Boylestad รูป 6.29)', '+3 V: 1.5 mA · −1 V: 8.17 mA (Boylestad Fig. 6.29).') };

/* ---------------- page 6.2: depletion-type circuits, Examples 7.6–7.9 ---------------- */
const O76 = { dev: D.ex76, VDD: 18, R1: 110e6, R2: 10e6, RD: 1800, RS: 750 }, S76 = CH5.sol(O76), Z76 = exact(O76), O77 = { ...O76, RS: 150 }, S77 = CH5.sol(O77), Z77 = exact(O77);
const divLine = (vg, rs, imax, label, o = {}) => ({ a: [vg, 0], b: [vg - imax * rs / 1e3, imax], label, ...o });
DEF.ex76 = { ...LAY, solvedAt: 3, spec: () => spec('ex76', O76),
  glow: k => (k === 1 ? ['Q'] : k === 2 ? ['R1', 'R2'] : k === 3 ? ['RS'] : k === 4 ? ['RD', 'RS'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 3 ? regBadge(z, `I_D = ${fd(z.id, 2)} mA, V_GS = ${sg(z.VGS)} V · `) : k === 2 ? bdg(`V_G = R_2 V_DD/(R_1 + R_2) = ${fd(S76.VG, 2)} V`) : bdg('V_DD = 18 V, R_1 = 110 MΩ, R_2 = 10 MΩ, R_D = 1.8 kΩ, R_S = 750 Ω, I_DSS = 6 mA, V_P = −3 V', null, false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); if (k >= 5) return CH5.dPlot(ctx, b, bd, { dev: D.ex76, vgs: [1, 0.5, 0, -1, -2, -3], imax: 12, vmax: 20, yt: [2, 4, 6, 8, 10, 12], load: { vdd: 18, r: 2550 }, q: { v: z.VDS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VDS, 2)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: -16 }, labels: !bd.short, title: t('เส้นโหลด V_DS = V_DD − I_D(R_D + R_S)', 'load line V_DS = V_DD − I_D(R_D + R_S)') });
    CH5.tPlot(ctx, b, bd, { dev: D.ex76, imax: 12, vmin: -4, vmax: 2, yt: [2, 4, 6, 8, 10, 12], tbl: k >= 1 && !bd.short, lines: k >= 3 ? [divLine(S76.VG, 750, 12, bd.short ? '' : 'V_GS = V_G − I_D R_S', { at: 0.12 })] : [],
      pts: (k >= 1 ? [{ v: 1, i: 10.67, color: C.avg, r: 4.5, label: bd.short ? '' : '(+1 V, 10.67 mA)', side: -1, dy: 14 }] : []).concat(k >= 3 ? [{ v: S76.VG, i: 0, color: C.tan, r: 5, label: bd.short ? '' : `V_G = ${fd(S76.VG, 1)} V`, side: 1, dy: 16 }, { v: 0, i: 2, color: C.tan, r: 5, label: bd.short ? '' : 'V_G/R_S = 2 mA', side: 1, dy: 14 }, { v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${sg(z.VGS)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: -14 }] : []),
      guides: k >= 3 ? [{ v: z.VGS, i: z.id }] : [], vl: [{ v: 0, color: 'rgba(232,236,247,.25)', w: 1, dash: [3, 3] }], title: t('รูป 7.31: เส้นโค้งถ่ายโอนต่อเข้าฝั่งบวก ตัดเส้นของวงจร', 'Fig. 7.31: the transfer curve, continued into V_GS > 0, meets the network line') }); },
  steps: () => [
    step(t('<b>เส้นโค้งถ่ายโอน</b> (สไลด์หน้า 9–10): ร่างเหมือน JFET จาก (0, 6 mA), (\\(V_P/2\\) = −1.5 V, 1.5 mA), (−3 V, 0) แล้ว<b>ต่อเข้าฝั่งบวก</b>เพราะมอสเฟตแบบดีพลีชันทำงานที่ \\(V_{GS}\\) > 0 ได้ เลือก +1 V', '<b>The transfer curve</b> (slides pp. 9–10): sketch it as for a JFET from (0, 6 mA), (\\(V_P/2\\) = −1.5 V, 1.5 mA), (−3 V, 0), then <b>continue into the positive side</b>, since a depletion MOSFET may operate at \\(V_{GS}\\) > 0; choose +1 V'),
      block([R`I_D(+1\ \text{V}) &= 6\ \text{mA}\left(1 - \frac{+1}{-3}\right)^2 = 6\ \text{mA}(1.778) = \boxed{10.67\ \text{mA}}`])),
    step(t('<b>\\(V_G\\)</b> (สมการ 7.15): \\(I_G\\) = 0 ตัวแบ่งแรงดันให้ \\(V_G\\) ตรง ๆ ตัวต้านทานระดับ 100 MΩ ใช้ได้เพราะเกตเป็นฉนวน', '<b>\\(V_G\\)</b> (Eq. 7.15): \\(I_G\\) = 0, so the divider gives \\(V_G\\) directly; resistors of 100 MΩ are usable because the gate is insulated'),
      block([R`V_G &= \frac{R_2V_{DD}}{R_1 + R_2} = \frac{(10\ \text{M}\Omega)(18\ \text{V})}{10\ \text{M}\Omega + 110\ \text{M}\Omega} = \boxed{1.5\ \text{V}}`])),
    step(t('<b>(a) เส้นของวงจรและจุด Q</b> (สมการ 7.16–7.18): ผ่าน (\\(V_G\\), 0) และ (0, \\(V_G/R_S\\))', '<b>(a) The network line and Q</b> (Eqs. 7.16–7.18): through (\\(V_G\\), 0) and (0, \\(V_G/R_S\\))'),
      block([R`V_{GS} &= V_G - I_DR_S = 1.5\ \text{V} - I_D(750\ \Omega)`, R`I_D = 0:\ V_{GS} &= 1.5\ \text{V}`, R`V_{GS} = 0:\ I_D &= \frac{1.5\ \text{V}}{750\ \Omega} = 2\ \text{mA}`, R`I_{D_Q} &\cong \boxed{3.1\ \text{mA}},\qquad V_{GS_Q} \cong \boxed{-0.8\ \text{V}}`]),
      t(`คำตอบแม่นยำ (ภาพจำลอง): ${fd(Z76.id, 2)} mA, ${sg(Z76.VGS)} V · จุด Q อยู่ฝั่งลบ (ดีพลีชันโหมด) แม้เส้นโค้งจะต่อเข้าฝั่งบวกแล้วก็ตาม`, `Exactly (simulation): ${fd(Z76.id, 2)} mA, ${sg(Z76.VGS)} V. Q lies on the negative side (depletion mode) although the curve was continued into the positive side.`)),
    step(t('<b>(b) \\(V_{DS}\\)</b> (สมการ 7.19)', '<b>(b) \\(V_{DS}\\)</b> (Eq. 7.19)'),
      block([R`V_{DS} &= V_{DD} - I_D(R_D + R_S) = 18\ \text{V} - (3.1\ \text{mA})(1.8\ \text{k}\Omega + 750\ \Omega) \cong \boxed{10.1\ \text{V}}`])),
    step(t('<b>ตรวจย่าน</b>: \\(V_{GS} - V_P\\) = −0.8 + 3 = 2.2 V ≤ \\(V_{DS}\\) = 10.1 V ย่านอิ่มตัว ✓', '<b>Check the region</b>: \\(V_{GS} - V_P\\) = −0.8 + 3 = 2.2 V ≤ \\(V_{DS}\\) = 10.1 V: saturation ✓'),
      block([R`V_{DS} = 10.1\ \text{V} &\ge 2.2\ \text{V}\ \checkmark`]))],
  ask: () => ({ fields: [num('V<sub>G</sub> (V) =', 1.5, { tol: 0.02 }), num('I<sub>DQ</sub> (mA) =', 3.1, { tol: 0.1 }), num('V<sub>GSQ</sub> (V) =', -0.8, { tol: 0.1 }), num('V<sub>DS</sub> (V) =', 10.1, { tol: 0.3 })] }),
  answer: () => t('(a) \\(I_{D_Q}\\) ≅ 3.1 mA, \\(V_{GS_Q}\\) ≅ −0.8 V (b) \\(V_{DS}\\) ≅ 10.1 V (Boylestad Example 7.6)', '(a) \\(I_{D_Q}\\) ≅ 3.1 mA, \\(V_{GS_Q}\\) ≅ −0.8 V (b) \\(V_{DS}\\) ≅ 10.1 V (Boylestad Example 7.6).') };

DEF.ex77 = { ...LAY, solvedAt: 1, spec: k => (k >= 1 ? spec('ex77', O77) : spec('ex76', O76)),
  glow: k => (k >= 1 ? ['RS'] : null),
  badge: (k, s) => { const z = j(s.ckt); return regBadge(z, `R_S = ${CK.eng(s.ckt.byId.RS.value, 'Ω')}: I_D = ${fd(z.id, 2)} mA, V_GS = ${pl(z.VGS)} V · `); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); if (k >= 3) return CH5.dPlot(ctx, b, bd, { dev: D.ex76, vgs: [1, 0.5, 0, -1, -2, -3], imax: 12, vmax: 20, yt: [2, 4, 6, 8, 10, 12], load: { vdd: 18, r: 1950 }, q: { v: z.VDS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VDS, 2)} V, ${fd(z.id, 2)} mA)`, side: 1, dy: -16 }, labels: !bd.short,
      pts: [{ v: S77.VDS, i: mA(S77.ID), color: C.tan, r: 5, label: bd.short ? '' : t('ตำรา 7.6 mA', 'book 7.6 mA'), side: 1, dy: 16 }], title: t('เส้นโหลด R_D + R_S = 1.95 kΩ กับแนวพินช์ออฟ', 'load line with R_D + R_S = 1.95 kΩ, and the pinch-off locus') });
    CH5.tPlot(ctx, b, bd, { dev: D.ex76, imax: 12, vmin: -4, vmax: 2, yt: [2, 4, 6, 8, 10, 12], lines: [divLine(1.5, 750, 12, bd.short ? '' : '750 Ω', { color: 'rgba(126,231,135,.45)', w: 1.6, at: 0.12 })].concat(k >= 1 ? [divLine(1.5, 150, 12, bd.short ? '' : 'R_S = 150 Ω', { at: 0.55 })] : []),
      pts: [{ v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${pl(z.VGS)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: k >= 1 ? 16 : -14 }].concat(k >= 1 ? [{ v: 1.5, i: 0, color: C.tan, r: 4.5 }, { v: 0, i: 10, color: C.tan, r: 5, label: bd.short ? '' : 'V_G/R_S = 10 mA', side: -1, dy: -14 }] : []), guides: [{ v: z.VGS, i: z.id }],
      vl: [{ v: 0, color: 'rgba(232,236,247,.25)', w: 1, dash: [3, 3] }], title: t('รูป 7.32: R_S เล็กลง เส้นชันขึ้น จุด Q ข้ามไปฝั่งบวก', 'Fig. 7.32: a smaller R_S steepens the line and Q crosses to the positive side') }); },
  steps: () => [
    step(t('<b>\\(R_S\\) = 150 Ω</b>: จุดตัดแกนตั้งเพิ่มเป็น \\(V_G/R_S\\) = 1.5 V/150 Ω = 10 mA เส้นชันขึ้นโดยยังผ่าน (1.5 V, 0) จุดตัดกับเส้นโค้งอยู่<b>ฝั่งบวก</b>และกระแส<b>เกิน \\(I_{DSS}\\)</b> ซึ่ง JFET ทำไม่ได้', '<b>\\(R_S\\) = 150 Ω</b>: the vertical intercept rises to \\(V_G/R_S\\) = 1.5 V/150 Ω = 10 mA; the line steepens while still passing through (1.5 V, 0), and it meets the curve on the <b>positive side</b> with a current <b>above \\(I_{DSS}\\)</b>, which a JFET cannot do'),
      block([R`I_{D_Q} &\cong \boxed{7.6\ \text{mA}},\qquad V_{GS_Q} \cong \boxed{+0.35\ \text{V}}`])),
    step(t('<b>\\(V_{DS}\\)</b>', '<b>\\(V_{DS}\\)</b>'),
      block([R`V_{DS} &= 18\ \text{V} - (7.6\ \text{mA})(1.8\ \text{k}\Omega + 150\ \Omega) = \boxed{3.18\ \text{V}}`])),
    step(t('<b>ตรวจย่าน</b> (ตำราไม่ได้ทำ): \\(V_{GS} - V_P\\) = 0.35 + 3 = 3.35 V แต่ \\(V_{DS}\\) = 3.18 V น้อยกว่าเล็กน้อย: จุด Q อยู่ซ้ายแนวพินช์ออฟนิดเดียว (ย่านโอห์มิก)', '<b>Check the region</b> (the book does not): \\(V_{GS} - V_P\\) = 0.35 + 3 = 3.35 V, but \\(V_{DS}\\) = 3.18 V is slightly less: Q sits just left of the pinch-off locus (the ohmic region)'),
      block([R`V_{DS} = 3.18\ \text{V} &< V_{GS} - V_P = 3.35\ \text{V}`]),
      t(`ภาพจำลอง: \\(I_D\\) = ${fd(Z77.id, 2)} mA, \\(V_{GS}\\) = ${pl(Z77.VGS)} V, \\(V_{DS}\\) = ${fd(Z77.VDS, 2)} V ต่างจากตำราราว ${fd((mA(S77.ID) - Z77.id) / Z77.id * 100, 0)} % ใช้งานจริงควรลด \\(R_D\\) ให้ Q กลับเข้าย่านอิ่มตัว · ${NOTE_OHM}`, `Simulation: \\(I_D\\) = ${fd(Z77.id, 2)} mA, \\(V_{GS}\\) = ${pl(Z77.VGS)} V, \\(V_{DS}\\) = ${fd(Z77.VDS, 2)} V, about ${fd((mA(S77.ID) - Z77.id) / Z77.id * 100, 0)} % from the book; in practice lower \\(R_D\\) to bring Q back into saturation. ${NOTE_OHM}`))],
  ask: () => ({ fields: [num('I<sub>DQ</sub> (mA) =', 7.6, { tol: 0.15 }), num('V<sub>GSQ</sub> (V) =', 0.35, { tol: 0.08 }), num('V<sub>DS</sub> (V) =', 3.18, { tol: 0.3 })] }),
  answer: () => t('\\(I_{D_Q}\\) ≅ 7.6 mA, \\(V_{GS_Q}\\) ≅ +0.35 V, \\(V_{DS}\\) = 3.18 V (Boylestad Example 7.7; วงจรจริงอยู่ในย่านโอห์มิกเล็กน้อย)', '\\(I_{D_Q}\\) ≅ 7.6 mA, \\(V_{GS_Q}\\) ≅ +0.35 V, \\(V_{DS}\\) = 3.18 V (Boylestad Example 7.7; the real circuit is slightly into the ohmic region).') };

const O78 = { dev: D.ex78, VDD: 20, RG: 1e6, RD: 6200, RS: 2400 }, S78 = CH5.sol(O78), Z78 = exact(O78);
DEF.ex78 = { ...LAY, solvedAt: 2, spec: () => spec('ex78', O78),
  glow: k => (k === 1 ? ['RS', 'RG'] : k === 2 ? ['Q'] : k === 3 ? ['RD'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 2 ? regBadge(z, `I_D = ${fd(z.id, 2)} mA, V_GS = ${sg(z.VGS)} V · `) : k === 1 ? bdg('V_GS = −I_D R_S', null, false) : bdg('V_DD = 20 V, R_D = 6.2 kΩ, R_S = 2.4 kΩ, I_DSS = 8 mA, V_P = −8 V', null, false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); if (k >= 3) return CH5.vbars(ctx, b, bd, s.ckt);
    CH5.tPlot(ctx, b, bd, { dev: D.ex78, imax: 14, vmin: -9, vmax: 3, yt: [2, 4, 6, 8, 10, 12, 14], xt: [-8, -6, -4, -2, 2], tbl: k >= 1 && !bd.short, lines: k >= 1 ? [{ a: [0, 0], b: [-6, 2.5], ext: 2, label: bd.short ? '' : 'V_GS = −I_D R_S', at: 0.9 }] : [],
      pts: (k >= 1 ? [{ v: 2, i: 12.5, color: C.avg, r: 4.5, label: bd.short ? '' : '(+2 V, 12.5 mA)', side: -1, dy: 14 }, { v: -6, i: 2.5, color: C.tan, r: 5, label: bd.short ? '' : '(−6 V, 2.5 mA)', side: -1, dy: 14 }] : []).concat(k >= 2 ? [{ v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${sg(z.VGS)} V, ${fd(z.id, 2)} mA)`, side: 1, dy: -14 }] : []), guides: k >= 2 ? [{ v: z.VGS, i: z.id }] : [],
      vl: [{ v: 0, color: 'rgba(232,236,247,.25)', w: 1, dash: [3, 3] }], title: t('รูป 7.34: ไบแอสตัวเองไปได้แต่ฝั่งลบ', 'Fig. 7.34: self bias can only reach the negative side') }); },
  steps: () => [
    step(t('<b>เส้นโค้งถ่ายโอน</b> (สไลด์หน้า 13): จุด (\\(V_P/2\\) = −4 V, \\(I_{DSS}/4\\) = 2 mA) และฝั่งบวกเลือก +2 V (ไม่จำเป็นสำหรับวงจรนี้ แต่วาดให้ครบ)', '<b>The transfer curve</b> (slide p. 13): the point (\\(V_P/2\\) = −4 V, \\(I_{DSS}/4\\) = 2 mA) and, on the positive side, +2 V (not needed for this circuit, but drawn to complete it)'),
      block([R`I_D(+2\ \text{V}) &= 8\ \text{mA}\left(1 - \frac{+2}{-8}\right)^2 = 8\ \text{mA}(1.5625) = 12.5\ \text{mA}`, R`V_{GS} &= -I_DR_S;\quad V_{GS} = -6\ \text{V} \Rightarrow I_D = \frac{6\ \text{V}}{2.4\ \text{k}\Omega} = 2.5\ \text{mA}`]),
      t('เส้นของวงจรผ่านจุดกำเนิดและอยู่ในจตุภาคที่ \\(V_{GS}\\) < 0 เสมอ: ไบแอสตัวเองพามอสเฟตแบบดีพลีชันเข้าฝั่งบวกไม่ได้ จึงเหมือน JFET ทุกประการ', 'The network line passes through the origin and stays in the quadrant \\(V_{GS}\\) < 0: self bias cannot take a depletion MOSFET into the positive side, so it behaves exactly as a JFET.')),
    step(t('<b>(a) จุด Q</b>', '<b>(a) The Q-point</b>'), block([R`I_{D_Q} &\cong \boxed{1.7\ \text{mA}},\qquad V_{GS_Q} \cong \boxed{-4.3\ \text{V}}`]), t(`คำตอบแม่นยำ: ${fd(Z78.id, 3)} mA, ${sg(Z78.VGS)} V`, `Exactly: ${fd(Z78.id, 3)} mA, ${sg(Z78.VGS)} V.`)),
    step(t('<b>(b) \\(V_D\\)</b> (สมการ 7.20)', '<b>(b) \\(V_D\\)</b> (Eq. 7.20)'), block([R`V_D &= V_{DD} - I_DR_D = 20\ \text{V} - (1.7\ \text{mA})(6.2\ \text{k}\Omega) = \boxed{9.46\ \text{V}}`]),
      t(`ตรวจย่าน: \\(V_{DS}\\) = 20 − 1.7(8.6) = 5.4 V ≥ \\(V_{GS} - V_P\\) = 3.7 V ✓ (ภาพจำลอง \\(V_{DS}\\) = ${fd(Z78.VDS, 2)} V)`, `Check: \\(V_{DS}\\) = 20 − 1.7(8.6) = 5.4 V ≥ \\(V_{GS} - V_P\\) = 3.7 V ✓ (simulation \\(V_{DS}\\) = ${fd(Z78.VDS, 2)} V).`))],
  ask: () => ({ fields: [num('I<sub>DQ</sub> (mA) =', 1.7, { tol: 0.1 }), num('V<sub>GSQ</sub> (V) =', -4.3, { tol: 0.15 }), num('V<sub>D</sub> (V) =', 9.46, { tol: 0.4 })] }),
  answer: () => t('(a) \\(I_{D_Q}\\) ≅ 1.7 mA, \\(V_{GS_Q}\\) ≅ −4.3 V (b) \\(V_D\\) = 9.46 V (Boylestad Example 7.8)', '(a) \\(I_{D_Q}\\) ≅ 1.7 mA, \\(V_{GS_Q}\\) ≅ −4.3 V (b) \\(V_D\\) = 9.46 V (Boylestad Example 7.8).') };

const O79 = { dev: D.ex79, VDD: 20, RG: 0, RD: 1500, qText: '' }, Z79 = exact(O79);
DEF.ex79 = { ...LAY, solvedAt: 1, spec: () => spec('ex79', O79),
  glow: k => (k === 1 ? ['Q'] : k === 2 ? ['RD'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 1 ? regBadge(z, `V_GS = 0: I_D = I_DSS = ${fd(z.id, 2)} mA, V_D = ${fd(s.ckt.V('d').re, 2)} V · `) : bdg(t('เกตต่อตรงกับซอร์ส', 'the gate tied to the source'), null, false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.dPlot(ctx, b, bd, { dev: D.ex79, vgs: [1, 0, -1, -2, -3, -4], imax: 16, vmax: 22, yt: [4, 8, 12, 16], load: { vdd: 20, r: 1500 }, q: { v: z.VDS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VDS, 1)} V, ${fd(z.id, 1)} mA)`, side: 1, dy: -16 }, labels: !bd.short, title: t('V_GS = 0: จุด Q บนเส้น I_DSS', 'V_GS = 0: Q on the I_DSS curve') }); },
  steps: () => [
    step(t('<b>\\(V_{GS}\\) = 0</b>: เกตต่อตรงกับซอร์ส ไม่ต้องวาดเส้นโค้งเลย กระแสคือ \\(I_{DSS}\\) ตามนิยาม', '<b>\\(V_{GS}\\) = 0</b>: the gate is tied to the source; no curve is needed, the current is \\(I_{DSS}\\) by definition'),
      block([R`V_{GS_Q} &= 0\ \text{V},\qquad I_{D_Q} = I_{DSS} = \boxed{10\ \text{mA}}`])),
    step(t('<b>\\(V_D\\)</b>', '<b>\\(V_D\\)</b>'), block([R`V_D &= V_{DD} - I_DR_D = 20\ \text{V} - (10\ \text{mA})(1.5\ \text{k}\Omega) = \boxed{5\ \text{V}}`]),
      t(`ตรวจย่าน: \\(V_{DS}\\) = 5 V ≥ \\(|V_P|\\) = 4 V ✓ แค่พอดี ถ้า \\(R_D\\) ใหญ่กว่า 1.6 kΩ จุด Q จะหลุดเข้าย่านโอห์มิก (ภาพจำลอง: ${fd(Z79.id, 2)} mA, ${fd(Z79.VDS, 2)} V)`, `Check: \\(V_{DS}\\) = 5 V ≥ \\(|V_P|\\) = 4 V ✓, just; with \\(R_D\\) above 1.6 kΩ Q would slip into the ohmic region (simulation: ${fd(Z79.id, 2)} mA, ${fd(Z79.VDS, 2)} V).`))],
  ask: () => ({ fields: [num('I<sub>DQ</sub> (mA) =', 10, { tol: 0.05 }), num('V<sub>D</sub> (V) =', 5, { tol: 0.05 })] }),
  answer: () => t('\\(V_{GS_Q}\\) = 0, \\(I_{D_Q}\\) = 10 mA, \\(V_D\\) = 5 V (Boylestad Example 7.9)', '\\(V_{GS_Q}\\) = 0, \\(I_{D_Q}\\) = 10 mA, \\(V_D\\) = 5 V (Boylestad Example 7.9).') };

/* ---------------- page 6.3: the enhancement type ---------------- */
const E635 = [2, 4, 8].map(v => FIX(D.e635, v, 20));
DEF.e635 = { ...LAY, solvedAt: 1, spec: k => spec('e635_' + Math.min(k, 2), E635[Math.min(k, 2)]),
  glow: k => (k >= 1 ? ['VGG', 'Q'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return regBadge(z, `V_GS = ${pl(z.VGS)} V → I_D = ${fd(z.id, 2)} mA · `); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.dPlot(ctx, b, bd, { dev: D.e635, vgs: [8, 7, 6, 5, 4, 3, 2], imax: 12, vmax: 25, yt: [2, 4, 6, 8, 10, 12], q: { v: z.VDS, i: z.id, label: bd.short ? '' : `${fd(z.id, 2)} mA`, side: -1, dy: 14 }, labels: !bd.short, locusLabel: t('แนว V_DSsat = V_GS − V_T', 'locus V_DSsat = V_GS − V_T'),
    title: t('รูป 6.35: V_T = 2 V, k = 0.278 mA/V²', 'Fig. 6.35: V_T = 2 V, k = 0.278 mA/V²') }); },
  steps: () => [
    step(t('<b>\\(k\\) จากจุดบนลักษณะสมบัติ</b> (สไลด์หน้า 18, สมการ 6.16): เส้นบนสุด \\(V_{GS}\\) = 8 V อิ่มตัวที่ 10 mA และกระแสหายไปที่ \\(V_{GS} = V_T\\) = 2 V', '<b>\\(k\\) from a point of the characteristics</b> (slide p. 18, Eq. 6.16): the top curve \\(V_{GS}\\) = 8 V saturates at 10 mA, and the current vanishes at \\(V_{GS} = V_T\\) = 2 V'),
      block([R`k &= \frac{I_{D(\text{on})}}{(V_{GS(\text{on})} - V_T)^2} = \frac{10\ \text{mA}}{(8\ \text{V} - 2\ \text{V})^2} = \frac{10\ \text{mA}}{36\ \text{V}^2} = \boxed{0.278 \times 10^{-3}\ \text{A/V}^2}`])),
    step(t('<b>สมการทั่วไปของอุปกรณ์</b> (สมการ 6.15) แล้วแทน \\(V_{GS}\\) = 4 V', '<b>The device\'s general equation</b> (Eq. 6.15), then \\(V_{GS}\\) = 4 V'),
      block([R`I_D &= 0.278 \times 10^{-3}(V_{GS} - 2\ \text{V})^2`, R`I_D(4\ \text{V}) &= 0.278 \times 10^{-3}(2)^2 = \boxed{1.11\ \text{mA}}`]), t('ตรงกับเส้น \\(V_{GS}\\) = 4 V ของรูป 6.35 ที่ \\(V_{GS} = V_T\\) วงเล็บเป็นศูนย์ กระแสเป็นศูนย์', 'As the \\(V_{GS}\\) = 4 V curve of Fig. 6.35 shows; at \\(V_{GS} = V_T\\) the bracket is zero and so is the current.')),
    step(t('<b>พินช์ออฟ</b> (สมการ 6.14): ช่องที่เหนี่ยวนำแคบลงทางด้านเดรนเมื่อ \\(V_{DG} = V_{DS} - V_{GS}\\) เป็นลบน้อยลง และอิ่มตัวที่ \\(V_{DS_\\text{sat}} = V_{GS} - V_T\\)', '<b>Pinch-off</b> (Eq. 6.14): the induced channel narrows at the drain end as \\(V_{DG} = V_{DS} - V_{GS}\\) becomes less negative, and saturates at \\(V_{DS_\\text{sat}} = V_{GS} - V_T\\)'),
      block([R`V_{GS} = 8\ \text{V}:\quad V_{DS_\text{sat}} &= 8 - 2 = \boxed{6\ \text{V}}`]), t('แนว \\(V_{DS_\\text{sat}}\\) (เส้นประ) คือแนวพินช์ออฟของบทที่ 5 ในชื่อใหม่: ขวาของมันคือย่านอิ่มตัวที่ใช้ขยายสัญญาณ', 'The \\(V_{DS_\\text{sat}}\\) locus (dashed) is chapter 5\'s pinch-off locus under a new name: to its right is the saturation region used for amplification.'))],
  ask: () => ({ fields: [num('k (mA/V²) =', 0.278, { tol: 0.003 }), num(t('I<sub>D</sub> ที่ 4 V (mA) =', 'I<sub>D</sub> at 4 V (mA) ='), 1.11, { tol: 0.02 }), num(t('V<sub>DSsat</sub> ที่ 8 V (V) =', 'V<sub>DSsat</sub> at 8 V (V) ='), 6, { tol: 0.05 })] }),
  answer: () => t('\\(k\\) = 0.278 × 10⁻³ A/V², \\(I_D\\)(4 V) = 1.11 mA, \\(V_{DS_\\text{sat}}\\)(8 V) = 6 V (Boylestad รูป 6.35, สมการ 6.14–6.16)', '\\(k\\) = 0.278 × 10⁻³ A/V², \\(I_D\\)(4 V) = 1.11 mA, \\(V_{DS_\\text{sat}}\\)(8 V) = 6 V (Boylestad Fig. 6.35, Eqs. 6.14–6.16).') };

const E637 = [4, 5, 6, 7, 8].map(v => FIX(D.e637, v, 20));
DEF.e637 = { ...LAY, solvedAt: 1, spec: k => spec('e637_' + Math.min(k, 4), E637[Math.min(k, 4)]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GS = ${pl(z.VGS)} V → I_D = ${fd(z.id, 2)} mA`, null, z.id > 0.01); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.e637, imax: 10, vmin: -0.5, vmax: 9, xt: [1, 2, 3, 4, 5, 6, 7, 8, 9], pts: [{ v: z.VGS, i: z.id, label: `(${fd(z.VGS, 0)} V, ${fd(z.id, 1)} mA)`, side: -1, dy: 14 }].concat([5, 6, 7, 8].slice(0, Math.max(0, k)).map(v => ({ v, i: MOS.ke(D.e637, v), color: C.avg, r: 4.5 }))), guides: [{ v: z.VGS, i: z.id }],
    vl: [{ v: 4, label: bd.short ? 'V_T' : 'V_T = 4 V' }], title: t('รูป 6.37: k = 0.5 mA/V², V_T = 4 V', 'Fig. 6.37: k = 0.5 mA/V², V_T = 4 V') }); },
  steps: () => [
    step(t('<b>ต่ำกว่า \\(V_T\\)</b>: เส้นนอนที่ \\(I_D\\) = 0 จาก 0 ถึง 4 V (รูป 6.37a) ไม่มีช่อง', '<b>Below \\(V_T\\)</b>: a horizontal line at \\(I_D\\) = 0 from 0 to 4 V (Fig. 6.37a); there is no channel'), block([R`V_{GS} \le 4\ \text{V}:\quad I_D &= 0`])),
    step(t('<b>\\(V_{GS}\\) = 5 V</b> (รูป 6.37b)', '<b>\\(V_{GS}\\) = 5 V</b> (Fig. 6.37b)'), block([R`I_D &= 0.5 \times 10^{-3}(5 - 4)^2 = \boxed{0.5\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = 6 V</b>', '<b>\\(V_{GS}\\) = 6 V</b>'), block([R`I_D &= 0.5 \times 10^{-3}(2)^2 = \boxed{2\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = 7 V</b>', '<b>\\(V_{GS}\\) = 7 V</b>'), block([R`I_D &= 0.5 \times 10^{-3}(3)^2 = \boxed{4.5\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = 8 V</b> (รูป 6.37c)', '<b>\\(V_{GS}\\) = 8 V</b> (Fig. 6.37c)'), block([R`I_D &= 0.5 \times 10^{-3}(4)^2 = \boxed{8\ \text{mA}}`]), t('ขั้นละ 1 V ของ \\(V_{GS}\\) ให้ 0.5, 1.5, 2.5, 3.5 mA เพิ่มขึ้นเรื่อย ๆ: พาราโบลาที่เริ่มจาก \\(V_T\\) ไม่ใช่จาก \\(I_{DSS}\\)', 'Equal 1 V steps give 0.5, 1.5, 2.5, 3.5 mA more each time: a parabola starting at \\(V_T\\), not at \\(I_{DSS}\\).'))],
  ask: () => ({ fields: [num('I<sub>D</sub>(5 V) (mA) =', 0.5, { tol: 0.01 }), num('I<sub>D</sub>(6 V) (mA) =', 2, { tol: 0.01 }), num('I<sub>D</sub>(8 V) (mA) =', 8, { tol: 0.02 })] }),
  answer: () => t('0, 0.5, 2, 4.5, 8 mA ที่ 4, 5, 6, 7, 8 V (Boylestad รูป 6.37)', '0, 0.5, 2, 4.5, 8 mA at 4, 5, 6, 7, 8 V (Boylestad Fig. 6.37).') };

const E64 = [10, 5, 14].map(v => FIX(D.ex64, v, 20));
DEF.ex64 = { ...LAY, solvedAt: 1, spec: k => spec('e64_' + (k >= 3 ? 2 : k >= 2 ? 1 : 0), E64[k >= 3 ? 2 : k >= 2 ? 1 : 0]),
  glow: k => (k >= 2 ? ['VGG'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GS = ${pl(z.VGS)} V → I_D = ${fd(z.id, 3)} mA`); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.ex64, imax: 8, vmin: -0.5, vmax: 15, xt: [3, 6, 9, 12, 15], yt: [2, 4, 6, 8], pts: [{ v: z.VGS, i: z.id, label: `(${fd(z.VGS, 0)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: 14 }, { v: 10, i: 3, color: C.tan, r: 5, label: bd.short ? '' : 'I_D(on) = 3 mA', side: 1, dy: -14 }].concat(k >= 2 ? [5, 8, 12, 14].map(v => ({ v, i: MOS.ke(D.ex64, v), color: C.avg, r: 4.5 })) : []), guides: [{ v: z.VGS, i: z.id }],
    vl: [{ v: 3, label: bd.short ? 'V_T' : 'V_GS(Th) = 3 V' }], title: t('รูป 6.41: 2N4351, V_T = 3 V, I_D(on) = 3 mA ที่ 10 V', 'Fig. 6.41: 2N4351, V_T = 3 V, I_D(on) = 3 mA at 10 V') }); },
  steps: () => [
    step(t('<b>(a) \\(k\\)</b> (สมการ 6.16): ใบข้อมูลไม่ให้ \\(k\\) แต่ให้ \\(V_{GS(\\text{Th})}\\) = 1–5 V (เฉลี่ย 3 V) และ \\(I_{D(\\text{on})}\\) = 3 mA ที่ \\(V_{GS(\\text{on})}\\) = 10 V', '<b>(a) \\(k\\)</b> (Eq. 6.16): the sheet gives no \\(k\\), but \\(V_{GS(\\text{Th})}\\) = 1–5 V (average 3 V) and \\(I_{D(\\text{on})}\\) = 3 mA at \\(V_{GS(\\text{on})}\\) = 10 V'),
      block([R`k &= \frac{3\ \text{mA}}{(10\ \text{V} - 3\ \text{V})^2} = \frac{3 \times 10^{-3}}{49}\ \text{A/V}^2 = \boxed{0.061 \times 10^{-3}\ \text{A/V}^2}`])),
    step(t('<b>(b) สมการและจุดที่ 5 V</b>', '<b>(b) The equation and the point at 5 V</b>'),
      block([R`I_D &= 0.061 \times 10^{-3}(V_{GS} - 3\ \text{V})^2`, R`I_D(5\ \text{V}) &= 0.061 \times 10^{-3}(2)^2 = \boxed{0.244\ \text{mA}}`])),
    step(t('<b>จุดอื่น ๆ</b> ที่ 8, 10, 12 และ 14 V (ภาพจำลองที่ 14 V)', '<b>Further points</b> at 8, 10, 12 and 14 V (simulation at 14 V)'),
      block([R`I_D &= 1.525,\ 3\ (\text{as given}),\ 4.94,\ \boxed{7.38\ \text{mA}}`]), t('กระแสขณะปิด \\(I_{DSS}\\) ของอุปกรณ์นี้เพียง 10 nA: ต่างจาก JFET และแบบดีพลีชันที่ \\(I_{DSS}\\) เป็นกระแสสูงสุด', 'The off-state \\(I_{DSS}\\) of this device is only 10 nA, unlike the JFET and the depletion type, whose \\(I_{DSS}\\) is the maximum current.'))],
  ask: () => ({ fields: [num('k (mA/V²) =', 0.0612, { tol: 0.001 }), num('I<sub>D</sub>(5 V) (mA) =', 0.245, { tol: 0.005 }), num('I<sub>D</sub>(14 V) (mA) =', 7.41, { tol: 0.06 })] }),
  answer: () => t('(a) \\(k\\) = 0.061 × 10⁻³ A/V² (b) 0.244, 1.525, 3, 4.94, 7.38 mA ที่ 5, 8, 10, 12, 14 V (Boylestad Example 6.4)', '(a) \\(k\\) = 0.061 × 10⁻³ A/V² (b) 0.244, 1.525, 3, 4.94, 7.38 mA at 5, 8, 10, 12, 14 V (Boylestad Example 6.4).') };

const P638 = [0, 4, 6].map(v => FIX(D.p638, -v, 12));   // book signs: V_GS = −4 V and −6 V enhance a p-channel (below its V_T = −2 V)
DEF.p638 = { ...LAY, solvedAt: 1, spec: k => spec('p638_' + Math.min(k, 2), P638[Math.min(k, 2)]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q', 'VDD']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`p-channel: V_GS = ${pl(-z.VGS)} V → I_D = ${fd(z.id, 2)} mA`, null, z.id > 0.01); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.p638, imax: 10, vmin: -7, vmax: 0.5, xt: [-6, -5, -4, -3, -2, -1], yt: [2, 4, 6, 8, 10], pts: [{ v: -z.VGS, i: z.id, label: `(${pl(-z.VGS)} V, ${fd(z.id, 1)} mA)`, side: 1, dy: 14 }], guides: [{ v: -z.VGS, i: z.id }],
    vl: [{ v: -2, label: bd.short ? 'V_T' : 'V_T = −2 V' }], title: t('รูป 6.38: p-channel, V_T = −2 V, k = 0.5 mA/V²', 'Fig. 6.38: p-channel, V_T = −2 V, k = 0.5 mA/V²') }); },
  steps: () => [
    step(t('<b>ภาพสะท้อน</b> (สไลด์หน้า 20, รูป 6.38): p-channel มี \\(V_T\\) ลบ ช่องเหนี่ยวนำ (โฮล) เกิดเมื่อ \\(V_{GS}\\) ลบกว่า \\(V_T\\) สมการ 6.15 ใช้ได้โดยใส่เครื่องหมาย', '<b>The mirror image</b> (slide p. 20, Fig. 6.38): a p-channel has a negative \\(V_T\\); the induced channel (holes) forms when \\(V_{GS}\\) is more negative than \\(V_T\\), and Eq. 6.15 applies with the signs'),
      block([R`V_{GS} = -4\ \text{V}:\quad I_D &= 0.5 \times 10^{-3}(-4 - (-2))^2 = 0.5 \times 10^{-3}(4) = \boxed{2\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = −6 V</b>: \\(V_{DS}\\) เป็นลบ \\(I_D\\) ไหลออกจากเดรน ลูกศรสารฐานในสัญลักษณ์ชี้ออก', '<b>\\(V_{GS}\\) = −6 V</b>: \\(V_{DS}\\) is negative, \\(I_D\\) flows out of the drain, and the substrate arrow of the symbol points out'),
      block([R`I_D &= 0.5 \times 10^{-3}(-6 + 2)^2 = \boxed{8\ \text{mA}}`]))],
  ask: () => ({ fields: [num('I<sub>D</sub>(−4 V) (mA) =', 2, { tol: 0.02 }), num('I<sub>D</sub>(−6 V) (mA) =', 8, { tol: 0.05 })] }),
  answer: () => t('−4 V: 2 mA · −6 V: 8 mA (Boylestad รูป 6.38)', '−4 V: 2 mA · −6 V: 8 mA (Boylestad Fig. 6.38).') };

/* ---------------- page 6.4: enhancement-type circuits, Examples 7.10–7.11 ---------------- */
const O710 = { dev: D.ex710, VDD: 12, RG: 10e6, RD: 2000, fb: true }, S710 = CH5.sol(O710), Z710 = exact(O710);
const O711 = { dev: D.ex711, VDD: 40, R1: 22e6, R2: 18e6, RD: 3000, RS: 820 }, S711 = CH5.sol(O711), Z711 = exact(O711);
DEF.ex710 = { ...LAY, solvedAt: 3, spec: () => spec('ex710', O710),
  glow: k => (k === 1 ? ['Q'] : k === 2 ? ['RG'] : k === 3 ? ['RD', 'RG'] : k === 4 ? ['Q'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 3 ? regBadge(z, `I_D = ${fd(z.id, 2)} mA, V_GS = V_DS = ${fd(z.VGS, 2)} V · `) : k === 2 ? bdg('I_G = 0: V_RG = 0, V_G = V_D, V_GS = V_DS') : k === 1 ? bdg('k = 6 mA/(8 − 3)² = 0.24 mA/V²') : bdg('V_DD = 12 V, R_D = 2 kΩ, R_G = 10 MΩ, I_D(on) = 6 mA ที่ 8 V, V_GS(Th) = 3 V', 'V_DD = 12 V, R_D = 2 kΩ, R_G = 10 MΩ, I_D(on) = 6 mA at 8 V, V_GS(Th) = 3 V', false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); if (k >= 4) return CH5.dPlot(ctx, b, bd, { dev: D.ex710, vgs: [10, 8, 7, 6, 5, 4, 3], imax: 12, vmax: 14, xt: [2, 4, 6, 8, 10, 12, 14], yt: [2, 4, 6, 8, 10, 12], load: { vdd: 12, r: 2000 }, q: { v: z.VDS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VDS, 2)} V, ${fd(z.id, 2)} mA)`, side: 1, dy: -16 }, labels: !bd.short, locusLabel: 'V_DSsat', title: t('เส้นโหลด V_DS = V_DD − I_D R_D: Q อยู่ขวาแนว V_DSsat เสมอ', 'load line V_DS = V_DD − I_D R_D: Q is always right of the V_DSsat locus') });
    CH5.tPlot(ctx, b, bd, { dev: D.ex710, imax: 12, vmin: -0.5, vmax: 13, xt: [2, 4, 6, 8, 10, 12], yt: [2, 4, 6, 8, 10, 12], lines: k >= 3 ? [{ a: [12, 0], b: [0, 6], label: bd.short ? '' : 'V_GS = V_DD − I_D R_D', at: 0.3 }] : [],
      pts: (k >= 1 ? [{ v: 8, i: 6, color: C.tan, r: 5, label: bd.short ? '' : 'I_D(on)', side: 1, dy: 14 }, { v: 3, i: 0, color: C.tan, r: 5, label: bd.short ? '' : 'V_GS(Th)', side: 1, dy: 16 }, { v: 6, i: 2.16, color: C.avg, r: 4.5 }, { v: 10, i: 11.76, color: C.avg, r: 4.5, label: bd.short ? '' : '(10 V, 11.76 mA)', side: -1, dy: 10 }] : []).concat(k >= 3 ? [{ v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VGS, 2)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: -14 }] : []),
      guides: k >= 3 ? [{ v: z.VGS, i: z.id }] : [], title: t('รูป 7.41–7.42: เส้นโค้งจากใบข้อมูล ตัดเส้นป้อนกลับ', 'Figs. 7.41–7.42: the curve from the sheet meets the feedback line') }); },
  steps: () => [
    step(t('<b>เส้นโค้งถ่ายโอน</b> (สไลด์หน้า 22): ใบข้อมูลให้สองจุดทันที (\\(V_{GS(\\text{Th})}\\), 0) และ (\\(V_{GS(\\text{on})}\\), \\(I_{D(\\text{on})}\\)) หา \\(k\\) (สมการ 7.34) แล้วเติมจุดระหว่างกับจุดเลย \\(V_{GS(\\text{on})}\\)', '<b>The transfer curve</b> (slide p. 22): the sheet gives two points at once, (\\(V_{GS(\\text{Th})}\\), 0) and (\\(V_{GS(\\text{on})}\\), \\(I_{D(\\text{on})}\\)); find \\(k\\) (Eq. 7.34), then add a point between and one beyond \\(V_{GS(\\text{on})}\\)'),
      block([R`k &= \frac{6\ \text{mA}}{(8\ \text{V} - 3\ \text{V})^2} = \boxed{0.24 \times 10^{-3}\ \text{A/V}^2}`, R`I_D(6\ \text{V}) &= 0.24 \times 10^{-3}(3)^2 = 2.16\ \text{mA},\qquad I_D(10\ \text{V}) = 0.24 \times 10^{-3}(7)^2 = 11.76\ \text{mA}`])),
    step(t('<b>วงจรป้อนกลับ</b> (สไลด์หน้า 23, รูป 7.37–7.38): \\(R_G\\) ต่อเดรนกับเกต \\(I_G\\) = 0 จึงไม่มีแรงดันตก \\(V_G = V_D\\) และ \\(V_{GS} = V_{DS}\\) (สมการ 7.35) \\(R_G\\) ใหญ่มากมีไว้ดึงเกตให้สูงพอเปิดมอสเฟต', '<b>The feedback circuit</b> (slide p. 23, Figs. 7.37–7.38): \\(R_G\\) joins drain and gate; with \\(I_G\\) = 0 nothing drops across it, so \\(V_G = V_D\\) and \\(V_{GS} = V_{DS}\\) (Eq. 7.35). The large \\(R_G\\) is there to lift the gate high enough to turn the MOSFET on'),
      block([R`V_{DS} &= V_{DD} - I_DR_D \quad\Rightarrow\quad V_{GS} = V_{DD} - I_DR_D`])),
    step(t('<b>เส้นของวงจรและจุด Q</b> (สมการ 7.36–7.38): ผ่าน (\\(V_{DD}\\), 0) และ (0, \\(V_{DD}/R_D\\)) สังเกตว่าเหมือนเส้นโหลดแต่อยู่บนกราฟถ่ายโอน', '<b>The network line and Q</b> (Eqs. 7.36–7.38): through (\\(V_{DD}\\), 0) and (0, \\(V_{DD}/R_D\\)); it looks like a load line but lives on the transfer graph'),
      block([R`I_D = 0:\ V_{GS} &= V_{DD} = 12\ \text{V}`, R`V_{GS} = 0:\ I_D &= \frac{12\ \text{V}}{2\ \text{k}\Omega} = 6\ \text{mA}`, R`I_{D_Q} &\cong \boxed{2.75\ \text{mA}},\qquad V_{GS_Q} = V_{DS_Q} \cong \boxed{6.4\ \text{V}}`]),
      t(`คำตอบแม่นยำ (สมการกำลังสอง \\(I_D = 0.24(9 - 2I_D)^2\\), mA): ${fd(Z710.id, 3)} mA, ${fd(Z710.VGS, 2)} V ภาพจำลองตรงกัน`, `Exactly (the quadratic \\(I_D = 0.24(9 - 2I_D)^2\\) in mA): ${fd(Z710.id, 3)} mA, ${fd(Z710.VGS, 2)} V; the simulation agrees.`)),
    step(t('<b>ย่าน</b>: วงจรป้อนกลับอยู่ในย่านอิ่มตัว<b>เสมอ</b> เพราะ \\(V_{DS} = V_{GS} > V_{GS} - V_T\\) ทุกกรณี (\\(V_{DG}\\) = 0 เกตไม่เคยสูงกว่าเดรน) แนว \\(V_{DS_\\text{sat}}\\) จึงอยู่ซ้ายจุด Q ตลอด', '<b>The region</b>: feedback bias is <b>always</b> in saturation, since \\(V_{DS} = V_{GS} > V_{GS} - V_T\\) in every case (\\(V_{DG}\\) = 0: the gate is never above the drain), so the \\(V_{DS_\\text{sat}}\\) locus always lies left of Q'),
      block([R`V_{DS} = 6.4\ \text{V} &\ge V_{GS} - V_T = 3.4\ \text{V}\ \checkmark`]))],
  ask: () => ({ fields: [num('k (mA/V²) =', 0.24, { tol: 0.003 }), num('I<sub>DQ</sub> (mA) =', 2.75, { tol: 0.1 }), num('V<sub>DSQ</sub> (V) =', 6.4, { tol: 0.15 })] }),
  answer: () => t('\\(k\\) = 0.24 × 10⁻³ A/V², \\(I_{D_Q}\\) ≅ 2.75 mA, \\(V_{GS_Q}\\) = \\(V_{DS_Q}\\) ≅ 6.4 V (Boylestad Example 7.10)', '\\(k\\) = 0.24 × 10⁻³ A/V², \\(I_{D_Q}\\) ≅ 2.75 mA, \\(V_{GS_Q}\\) = \\(V_{DS_Q}\\) ≅ 6.4 V (Boylestad Example 7.10).') };

DEF.ex711 = { ...LAY, solvedAt: 3, spec: () => spec('ex711', O711),
  glow: k => (k === 1 ? ['R1', 'R2'] : k === 2 ? ['RS'] : k === 3 ? ['Q'] : k === 4 ? ['RD', 'RS'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 3 ? regBadge(z, `I_D = ${fd(z.id, 2)} mA, V_GS = ${fd(z.VGS, 2)} V · `) : k >= 1 ? bdg(`V_G = R_2 V_DD/(R_1 + R_2) = ${fd(S711.VG, 1)} V`) : bdg('V_DD = 40 V, R_1 = 22 MΩ, R_2 = 18 MΩ, R_D = 3 kΩ, R_S = 0.82 kΩ, I_D(on) = 3 mA ที่ 10 V, V_GS(Th) = 5 V', 'V_DD = 40 V, R_1 = 22 MΩ, R_2 = 18 MΩ, R_D = 3 kΩ, R_S = 0.82 kΩ, I_D(on) = 3 mA at 10 V, V_GS(Th) = 5 V', false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); if (k >= 4) return CH5.vbars(ctx, b, bd, s.ckt);
    CH5.tPlot(ctx, b, bd, { dev: D.ex711, imax: 30, vmin: -1, vmax: 25, xt: [5, 10, 15, 20, 25], yt: [10, 20, 30], lines: k >= 2 ? [{ a: [18, 0], b: [0, 21.95], label: bd.short ? '' : 'V_GS = V_G − I_D R_S', at: 0.25 }] : [],
      pts: (k >= 1 ? [{ v: 18, i: 0, color: C.tan, r: 5, label: bd.short ? '' : 'V_G = 18 V', side: 1, dy: 16 }] : []).concat(k >= 2 ? [{ v: 0, i: 21.95, color: C.tan, r: 5, label: bd.short ? '' : 'V_G/R_S = 21.95 mA', side: 1, dy: 14 }, { v: 10, i: 3, color: C.avg, r: 4.5, label: bd.short ? '' : 'I_D(on)', side: 1, dy: 14 }, { v: 5, i: 0, color: C.avg, r: 4.5 }] : []).concat(k >= 3 ? [{ v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VGS, 1)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: -14 }] : []),
      guides: k >= 3 ? [{ v: z.VGS, i: z.id }] : [], vl: k >= 2 ? [{ v: 5, label: bd.short ? '' : 'V_GS(Th)' }] : [], title: t('รูป 7.45: เส้นของตัวแบ่งแรงดันตัดเส้นโค้ง', 'Fig. 7.45: the divider line meets the curve') }); },
  steps: () => [
    step(t('<b>วงจร</b> (สไลด์หน้า 28, สมการ 7.39): \\(I_G\\) = 0 ตัวแบ่งให้ \\(V_G\\) ตรง ๆ', '<b>The network</b> (slide p. 28, Eq. 7.39): \\(I_G\\) = 0, so the divider gives \\(V_G\\) directly'),
      block([R`V_G &= \frac{R_2V_{DD}}{R_1 + R_2} = \frac{(18\ \text{M}\Omega)(40\ \text{V})}{22\ \text{M}\Omega + 18\ \text{M}\Omega} = \boxed{18\ \text{V}}`])),
    step(t('<b>เส้นของวงจร</b> (สมการ 7.40): วงเกต–ซอร์สเหมือน JFET ทุกประการ', '<b>The network line</b> (Eq. 7.40): the gate–source loop, exactly as for a JFET'),
      block([R`V_{GS} &= V_G - I_DR_S = 18\ \text{V} - I_D(0.82\ \text{k}\Omega)`, R`I_D = 0:\ V_{GS} &= 18\ \text{V}`, R`V_{GS} = 0:\ I_D &= \frac{18\ \text{V}}{0.82\ \text{k}\Omega} = 21.95\ \text{mA}`])),
    step(t('<b>อุปกรณ์และจุด Q</b> (สมการ 7.34): \\(V_{GS(\\text{Th})}\\) = 5 V, \\(I_{D(\\text{on})}\\) = 3 mA ที่ 10 V', '<b>The device and Q</b> (Eq. 7.34): \\(V_{GS(\\text{Th})}\\) = 5 V, \\(I_{D(\\text{on})}\\) = 3 mA at 10 V'),
      block([R`k &= \frac{3\ \text{mA}}{(10\ \text{V} - 5\ \text{V})^2} = 0.12 \times 10^{-3}\ \text{A/V}^2`, R`I_D &= 0.12 \times 10^{-3}(V_{GS} - 5)^2`, R`I_{D_Q} &\cong \boxed{6.7\ \text{mA}},\qquad V_{GS_Q} \cong \boxed{12.5\ \text{V}}`]),
      t(`คำตอบแม่นยำ: ${fd(Z711.id, 2)} mA, ${fd(Z711.VGS, 2)} V (ภาพจำลอง) · ตรวจ: 18 − 6.7(0.82) = 12.5 V ✓`, `Exactly: ${fd(Z711.id, 2)} mA, ${fd(Z711.VGS, 2)} V (simulation). Check: 18 − 6.7(0.82) = 12.5 V ✓`)),
    step(t('<b>\\(V_{DS}\\)</b> (สมการ 7.41; แผงข้างภาพ)', '<b>\\(V_{DS}\\)</b> (Eq. 7.41; side panel)'),
      block([R`V_{DS} &= V_{DD} - I_D(R_S + R_D) = 40\ \text{V} - (6.7\ \text{mA})(0.82\ \text{k}\Omega + 3\ \text{k}\Omega) = 40 - 25.6 = \boxed{14.4\ \text{V}}`]),
      t(`ตรวจย่าน: \\(V_{GS} - V_T\\) = 7.5 V ≤ 14.4 V ✓ (ภาพจำลอง \\(V_{DS}\\) = ${fd(Z711.VDS, 2)} V)`, `Check: \\(V_{GS} - V_T\\) = 7.5 V ≤ 14.4 V ✓ (simulation \\(V_{DS}\\) = ${fd(Z711.VDS, 2)} V).`))],
  ask: () => ({ fields: [num('V<sub>G</sub> (V) =', 18, { tol: 0.05 }), num('I<sub>DQ</sub> (mA) =', 6.7, { tol: 0.15 }), num('V<sub>GSQ</sub> (V) =', 12.5, { tol: 0.2 }), num('V<sub>DS</sub> (V) =', 14.4, { tol: 0.5 })] }),
  answer: () => t('\\(V_G\\) = 18 V, \\(I_{D_Q}\\) ≅ 6.7 mA, \\(V_{GS_Q}\\) ≅ 12.5 V, \\(V_{DS}\\) = 14.4 V (Boylestad Example 7.11)', '\\(V_G\\) = 18 V, \\(I_{D_Q}\\) ≅ 6.7 mA, \\(V_{GS_Q}\\) ≅ 12.5 V, \\(V_{DS}\\) = 14.4 V (Boylestad Example 7.11).') };

MOS.S = { S76, Z76, S77, Z77, S78, Z78, Z79, S710, Z710, S711, Z711 };
MOS.DEF = DEF;
MOS.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.MOS = MOS;
})(window);
