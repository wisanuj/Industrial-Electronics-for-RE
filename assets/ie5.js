/* ie5.js — chapter 5 (field-effect transistors: the JFET): the transfer curve, the drain characteristics, the channel cross-section, one circuit
   builder for the three bias configurations of the slides, and the worked problems, on top of circuit.js (part 'J', Shockley's equation with an
   ohmic region) and ch8.js. Sources: course slides "Chapter 5 Field-Effect Transistors (FETs)" (39 pp.) and Boylestad & Nashelsky, 11th ed.,
   chapters 6 (§6.2–6.3, 6.6; Examples 6.1–6.2) and 7 (§7.2–7.4; Examples 7.1–7.4). The slides state the four bias problems without solving them.
   The simulation solves the circuits exactly: Shockley's equation in the saturation region, the square-law ohmic region to the left of the
   pinch-off locus V_DS = V_GS − V_P (which the book draws but never checks: Example 7.1 and Example 7.3(a) land in it; the notes say so).
   CH5.net(o) builds any of the circuits: o = { dev: { idss, vp, pch }, VDD, VGG (the gate supply that constricts the channel: V_GS = −V_GG for an n-channel, +V_GG for a p-channel; a negative VGG gives the opposite polarity), RG, RD, RS, R1 + R2, fb (R_G from gate to drain), qText };
   CH5.sol(o) gives the book's answer from the transfer curve; CH5.DEF: f611, rd, f615, sh, ex61, ex62, ex71, fb2, ex72, ex73, ex74, rs720 */
(function (global) {
'use strict';
const CH5 = {}, fd = CH6.fd, R = String.raw, C = IE.COL, FET = CK.FET, T = CH6.text, COL = CH6.COL;
const t = (th, en) => MC.t(th, en);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o });
const v2 = x => fd(x, 2).replace('-', '−'), kO = r => CK.eng(r, 'Ω'), mA = x => x * 1e3, sg = x => (x < 0 ? '−' : '') + fd(Math.abs(x), Number.isInteger(x) ? 0 : 1);
const LAY = { ...CH3.LAY, cktAspM: 0.62, rowAsp: 0.7, rowMin: 280 }, bdg = (th, en, ok = true) => [[th, en ?? th], ok === true ? 'ok' : ok === false ? 'wait' : ok];
CH5.LAY = LAY;

/* =====================================================================================================================
   1) the devices of the slides and the book: { idss (A), vp (V; negative for an n-channel), pch (p-channel) } */
CH5.DEV = { f611: { idss: 8e-3, vp: -4 }, ex71: { idss: 10e-3, vp: -8 }, ex72: { idss: 8e-3, vp: -6 }, ex61: { idss: 12e-3, vp: -6 }, ex62: { idss: 4e-3, vp: 3, pch: true },
  f613: { idss: 6e-3, vp: 6, pch: true }, rd: { idss: 0.3e-3, vp: -6 } };
CH5.devText = d => (d.kind === 'emos' ? `k = ${fd(d.k * 1e3, 3)} mA/V²\nV_T = ${sg(d.pch ? -d.vt : d.vt)} V` : `I_DSS = ${CK.eng(d.idss, 'A')}\nV_P = ${sg(d.vp)} V`);   // two lines beside the symbol
/* the transfer curve of any kind of FET in mA against the book's V_GS (a p-channel's turned round): Shockley's equation, or k(V_GS − V_T)² */
CH5.sh = (d, vb) => { const v = d.pch ? -vb : vb, { vt, b } = FET.kb(d); return v > vt ? mA(b * (v - vt) * (v - vt)) : 0; };
/* the book's V_P or V_T of a device, and the kind */
const vpOf = d => (d.kind === 'emos' ? (d.pch ? -d.vt : d.vt) : d.vp), kindOf = d => d.kind || 'jfet';

/* =====================================================================================================================
   2) the circuit. Grid: top rail y = −1.2 (V_DD), the transistor's drain and source on x = 3.1 with the gate at (2.3, 1.6), the bottom rail y = 4
   (ground); the gate side hangs on the left (x = 0.6): R_G to the gate supply V_GG (fixed bias), R_G to ground (self bias) or R_1 + R_2 (divider);
   V_DD stands on the right at x = 5.9. Parts that are 0 or absent become wires or are left out; a p-channel device turns both supplies round */
CH5.net = (o = {}) => {
  const d = o.dev || CH5.DEV.f611, s = d.pch ? -1 : 1, VDD = o.VDD || 0, parts = [];
  const nodes = { tL: [0.6, -1.2], gL: [0.6, 1.6], bL: [0.6, 4], g: [2.3, 1.6], tD: [3.1, -1.2], d: [3.1, 0.75], s: [3.1, 2.45], gs: [3.1, 4], tV: [5.9, -1.2], gV: [5.9, 4] };   // the supply stands further right than in CH4.net: room for the device's two-line label
  if (o.fb) { delete nodes.tL; delete nodes.gL; nodes.fa = [2.3, 0.1]; nodes.dr = [3.1, 0.1]; }   // feedback bias (Fig. 7.37): R_G from the gate up to the drain, nothing on the left
  if (VDD) parts.push({ id: 'VDD', type: 'V', a: s > 0 ? 'tV' : 'gV', b: s > 0 ? 'gV' : 'tV', value: VDD, name: 'V_DD', valText: `${sg(s * VDD)} V` }); else parts.push(W_('tV', 'gV'));
  parts.push(W_('tD', 'tV'), W_('gs', 'gV'), W_('bL', 'gs'));
  if (o.fb) parts.push({ id: 'RG', type: 'R', a: 'g', b: 'fa', value: o.RG, name: 'R_G', valText: kO(o.RG), side: -1 }, W_('fa', 'dr'), W_('dr', 'd'));
  else if (o.R1) parts.push(W_('tL', 'tD'), { id: 'R1', type: 'R', a: 'tL', b: 'gL', value: o.R1, name: 'R_1', valText: kO(o.R1), side: -1 }, { id: 'R2', type: 'R', a: 'gL', b: 'bL', value: o.R2, name: 'R_2', valText: kO(o.R2), side: -1 }, W_('gL', 'g'));
  else { if (o.RG) parts.push({ id: 'RG', type: 'R', a: 'g', b: 'gL', value: o.RG, name: 'R_G', valText: kO(o.RG), side: -1, labelOff: 0.1 }); else parts.push(W_('g', 'gL'));
    if (o.VGG) { const plusDown = (s > 0) === (o.VGG > 0);   // V_GS = −V_GG (book signs): + at ground for an n-channel; a negative V_GG (a positive V_GS, the enhancement mode of a depletion MOSFET) turns it round
      parts.push({ id: 'VGG', type: 'V', a: plusDown ? 'bL' : 'gL', b: plusDown ? 'gL' : 'bL', value: Math.abs(o.VGG), name: o.VGGname || 'V_GG', valText: `${fd(Math.abs(o.VGG), Number.isInteger(o.VGG) ? 0 : 1)} V`, side: -1 }); } else parts.push(W_('gL', 'bL')); }
  parts.push(o.RD ? { id: 'RD', type: 'R', a: 'tD', b: o.fb ? 'dr' : 'd', value: o.RD, name: 'R_D', valText: kO(o.RD) } : W_('tD', o.fb ? 'dr' : 'd'));
  parts.push(o.RS ? { id: 'RS', type: 'R', a: 's', b: 'gs', value: o.RS, name: 'R_S', valText: kO(o.RS) } : W_('s', 'gs'));
  parts.push({ id: 'Q', type: 'J', D: 'd', G: 'g', S: 's', idss: d.idss, vp: d.vp, kind: d.kind, k: d.k, vt: d.vt, pch: !!d.pch, name: o.qName ?? 'Q', valText: o.qText ?? CH5.devText(d), pins: true });
  return { ground: 'bL', nodes, parts, o };
};
/* the book's answer (the transfer curve only, V_DS taken from the output loop afterwards): { ID, VGS, VG, VS, VD, VDS, VDG, vov, sat } (n-channel) */
CH5.sol = o => { const d = o.dev || CH5.DEV.f611, VDD = o.VDD || 0, RD = o.RD || 0, RS = o.RS || 0; let VG = 0, q;
  if (o.fb) { q = FET.biasOf(d, RD, VDD); VG = q.vgs; }   // V_GS = V_DS = V_DD − I_D R_D (Eq. 7.36)
  else if (o.R1) { VG = o.R2 * VDD / (o.R1 + o.R2); q = FET.biasOf(d, RS, VG); }
  else if (!RS) { VG = -(o.VGG || 0); q = FET.biasOf(d, 0, VG); }
  else q = FET.biasOf(d, RS, 0);
  const ID = q.id, VGS = q.vgs, VS = ID * RS, VD = VDD - ID * RD, VDS = VD - VS, vov = VGS - FET.kb(d).vt;
  return { ID, VGS, VG, VS, VD, VDS, VDG: VD - VG, IRR: o.R1 ? VDD / (o.R1 + o.R2) : 0, vov, sat: VDS >= vov }; };
/* the readout of a solved circuit: circuit.J plus mA and µA */
CH5.j = c => { const j = c.J('Q'); return { ...j, id: mA(j.ID), ig: j.IG * 1e6, rdk: j.rd / 1e3 }; };
const REG = { cutoff: [t('คัตออฟ', 'cutoff'), 'wait'], ohmic: [t('ย่านโอห์มิก', 'ohmic region'), 'wait'], saturation: [t('ย่านอิ่มตัว (กระแสคงที่)', 'saturation (constant current)'), 'ok'] };
CH5.reg = r => REG[r];

/* =====================================================================================================================
   3) the transfer curve I_D against V_GS (Figs. 6.17–6.18, 7.3–7.4, 7.10–7.11, 7.19): one scale across negative and positive V_GS.
   o = { dev, vmin, vmax (default 0: the I_D axis at the right edge), imax, xt, yt, tbl (the four points of Table 6.1), curve (false: no Shockley
   curve), lines: [{ a: [v, i], b: [v, i], color, w, dash, ext, label, at }] (bias lines), vl: [{ v, label, color }], hl: [{ i, label }],
   pts: [{ v, i, label, color, side, dy, r }], guides: [{ v, i }], title, xl, yl, yLabels, ml, mr } → { X, Y, L, R, Tp, Bt } */
CH5.tPlot = (ctx, b, bd, o = {}) => {
  CH6.bg(ctx, b); const d = o.dev || CH5.DEV.f611, sh = !!(bd && bd.short), vp = vpOf(d), idss = mA(d.idss || 0), kind = kindOf(d);
  const vmin = o.vmin ?? (vp < 0 ? Math.floor(vp * 1.12) : -0.5), vmax = o.vmax ?? (vp < 0 ? 0 : Math.ceil(vp * 1.12)), imax = o.imax ?? Math.ceil(idss * 1.25);
  const ml = o.ml ?? 44, mr = o.mr ?? 18, L = b.x + ml, Rr = b.x + b.w - mr, Tp = b.y + (o.title ? 30 : 12) + 16, Bt = b.y + b.h - 36;
  const X = v => L + (Rr - L) * (v - vmin) / (vmax - vmin), Y = i => Bt - (Bt - Tp) * i / imax, x0 = X(Math.max(vmin, Math.min(vmax, 0)));
  const xt = o.xt || Array.from({ length: Math.floor(vmax) - Math.ceil(vmin) + 1 }, (_, k) => Math.ceil(vmin) + k).filter(v => v !== 0 || vmax > 0);
  const yt = o.yt || (imax > 12 ? [4, 8, 12, 16, 20] : imax > 6 ? [2, 4, 6, 8, 10, 12] : [1, 2, 3, 4, 5, 6]).filter(i => i <= imax);
  ctx.save(); ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  xt.forEach(v => { ctx.beginPath(); ctx.moveTo(X(v), Tp); ctx.lineTo(X(v), Bt); ctx.stroke(); }); yt.forEach(i => { ctx.beginPath(); ctx.moveTo(L, Y(i)); ctx.lineTo(Rr, Y(i)); ctx.stroke(); });
  ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, Bt); ctx.lineTo(Rr, Bt); ctx.moveTo(x0, Tp - 6); ctx.lineTo(x0, Bt); ctx.stroke(); ctx.restore();
  xt.forEach(v => { if (Math.abs(v) < 1e-9) return; T(ctx, IE.num(v, 1), X(v), Bt + 13, { color: COL.muted, size: 11.5 }); });
  T(ctx, '0', x0 + (x0 > Rr - 20 ? -6 : 0), Bt + 13, { color: COL.muted, size: 11.5, align: x0 > Rr - 20 ? 'right' : 'center' });
  if (o.yLabels !== false) yt.forEach(i => T(ctx, IE.num(i, 2), x0 > (L + Rr) / 2 ? x0 + 6 : x0 - 6, Y(i), { align: x0 > (L + Rr) / 2 ? 'left' : 'right', color: COL.muted, size: 11.5 }));
  T(ctx, IE.tt(o.xl ?? 'V_GS (V)'), vmax > 0 ? Rr : L, Bt + 28, { align: vmax > 0 ? 'right' : 'left', color: COL.ink, size: 12.5, weight: '600' });
  T(ctx, IE.tt(o.yl ?? 'I_D (mA)'), x0 > (L + Rr) / 2 ? x0 - 7 : x0 + 7, Tp - 6, { align: x0 > (L + Rr) / 2 ? 'right' : 'left', color: COL.ink, size: 12.5, weight: '600' });
  ctx.save(); ctx.beginPath(); ctx.rect(L - 2, Tp - 6, Rr - L + 4, Bt - Tp + 8); ctx.clip();
  (o.hl || []).forEach(q => { ctx.save(); ctx.strokeStyle = q.color || C.guide; ctx.lineWidth = 1.3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(L, Y(q.i)); ctx.lineTo(Rr, Y(q.i)); ctx.stroke(); ctx.restore(); });
  (o.vl || []).forEach(q => { ctx.save(); ctx.strokeStyle = q.color || C.guide; ctx.lineWidth = q.w || 1.6; ctx.setLineDash(q.dash || [6, 5]); ctx.beginPath(); ctx.moveTo(X(q.v), Tp); ctx.lineTo(X(q.v), Bt); ctx.stroke(); ctx.restore(); });
  if (o.curve !== false) { const lo0 = kind === 'emos' || d.pch ? -Infinity : vp, hi0 = kind === 'emos' || !d.pch ? Infinity : vp;   // Shockley's curve runs from V_P; a JFET's stops at V_GS = 0 (the gate junction), a depletion MOSFET's goes on
    const va = Math.max(vmin, lo0, kind === 'jfet' && d.pch && !o.ext ? 0 : -Infinity), vb = Math.min(vmax, hi0, kind === 'jfet' && !d.pch && !o.ext ? 0 : Infinity); ctx.save(); ctx.strokeStyle = o.color || C.curve; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let k = 0; k <= 200; k++) { const v = va + (vb - va) * k / 200, i = CH5.sh(d, v); k ? ctx.lineTo(X(v), Y(i)) : ctx.moveTo(X(v), Y(i)); } ctx.stroke(); ctx.restore(); }
  (o.lines || []).forEach(s => { let [va, ia] = s.a, [vb, ib] = s.b; if (s.ext) { const dv = vb - va, di = ib - ia; va -= dv * s.ext; ia -= di * s.ext; vb += dv * s.ext; ib += di * s.ext; }
    ctx.save(); ctx.strokeStyle = s.color || C.tan; ctx.lineWidth = s.w || 2.4; ctx.lineCap = 'round'; if (s.dash) ctx.setLineDash(s.dash); ctx.beginPath(); ctx.moveTo(X(va), Y(ia)); ctx.lineTo(X(vb), Y(ib)); ctx.stroke(); ctx.restore(); });
  ctx.restore();
  (o.guides || []).forEach(g => { ctx.save(); ctx.strokeStyle = g.color || C.guide; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(g.v), Y(g.i)); ctx.lineTo(x0, Y(g.i)); ctx.moveTo(X(g.v), Y(g.i)); ctx.lineTo(X(g.v), Bt); ctx.stroke(); ctx.restore(); });
  if (o.tbl) { const P = [[0, idss, 'I_DSS'], [0.3 * vp, idss / 2, 'I_DSS/2'], [0.5 * vp, idss / 4, 'I_DSS/4'], [vp, 0, 'V_P']];
    P.forEach(([v, i, lb], k) => { ctx.save(); ctx.strokeStyle = C.guide; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(X(v), Y(i)); ctx.lineTo(x0, Y(i)); ctx.moveTo(X(v), Y(i)); ctx.lineTo(X(v), Bt); ctx.stroke(); ctx.restore();
      IE.dot(ctx, X(v), Y(i), 4.5, C.avg); if (!sh || k === 0 || k === 3) CH8.lab(ctx, IE.tt(k === 3 ? `${lb} = ${sg(vp)} V` : k === 0 ? `${lb} = ${fd(idss, idss % 1 ? 1 : 0)} mA` : `${lb} ${k === 1 ? t('ที่ 0.3V_P', 'at 0.3V_P') : t('ที่ V_P/2', 'at V_P/2')}`), X(v) + (k === 3 ? 6 : -8), Y(i) - (k === 3 ? 14 : 2), k === 3 ? 'left' : 'right', C.avg, 11.5, b, '600'); }); }
  (o.hl || []).forEach(q => { if (q.label) CH8.lab(ctx, IE.tt(q.label), Rr - 4, Y(q.i) - 9, 'right', q.color || COL.muted, 11.5, b, '600'); });
  (o.vl || []).forEach(q => { if (q.label) CH8.lab(ctx, IE.tt(q.label), X(q.v) + 5, Tp + 4, 'left', q.color || COL.muted, 11.5, b, '600'); });
  (o.lines || []).forEach(s => { if (!s.label) return; const f = s.at ?? 0.5, v = s.a[0] + (s.b[0] - s.a[0]) * f, i = s.a[1] + (s.b[1] - s.a[1]) * f; CH8.lab(ctx, IE.tt(s.label), X(v) + (s.side ?? 1) * 8, Y(i) - 10, (s.side ?? 1) > 0 ? 'left' : 'right', s.color || C.tan, 11.5, b, '600'); });
  (o.pts || []).forEach(p => { const px = X(p.v), py = Y(p.i), col = p.color || C.q; ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = '#0f1220'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, p.r || 6.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    if (p.label) { const right = p.side ? p.side < 0 : px > b.x + b.w * 0.6; CH6.tag(ctx, IE.tt(p.label), right ? px - 11 : px + 11, py - (p.dy ?? 16), col, { align: right ? 'right' : 'left', size: 12 }); } });
  if (o.title) T(ctx, IE.tt(o.title), b.x + 10, b.y + 15, { align: 'left', color: COL.muted, size: 13 });
  return { X, Y, L, R: Rr, Tp, Bt, x0 };
};

/* the drain characteristics I_D against V_DS for several V_GS (Figs. 6.7, 6.11, 6.13), with the pinch-off locus V_DS = V_GS − V_P (a parabola from the
   origin to (|V_P|, I_DSS)), a load line and an operating point. o = { dev, vgs: [V, …], vmax, imax, xt, yt, locus, load: { vdd, r }, q: { v, i, label,
   side, dy }, pts, segs, vl, hl, labels, title, ml, mr } */
CH5.dPlot = (ctx, b, bd, o = {}) => {
  const d = o.dev || CH5.DEV.f611, sh = !!(bd && bd.short), kb = FET.kb(d), vt = kb.vt, kB = kb.b, vp = Math.abs(vt), n = d.pch ? -1 : 1, pl = v => (v > 0 ? '+' : '') + sg(v);   // kB: the square-law coefficient (b is the box)
  const vs = o.vgs || [0, 1, 2, 3, 4].map(k => -k * vp / 4), vovMax = Math.max(...vs) - vt, vmax = o.vmax ?? Math.max(20, Math.ceil(vp * 2.5)), imax = o.imax ?? Math.ceil(mA(kB * vovMax * vovMax) * 1.25);
  const curves = vs.map((vgs, k) => ({ f: v => mA(FET.iv(d, vgs, v).i), n: 200, w: 2, color: o.muted && o.muted(k) ? 'rgba(79,179,255,.45)' : C.curve,
    label: o.labels === false || (sh && k % 2 && k !== vs.length - 1) ? '' : (sh ? `${pl(n * vgs)} V` : `V_GS = ${pl(n * vgs)} V`), labelAt: vmax }));
  if (o.locus !== false) curves.push({ f: v => mA(kB * v * v), to: vovMax, n: 80, color: C.avg, w: 1.6, dash: [5, 4], label: sh ? '' : (o.locusLabel ?? t('แนวพินช์ออฟ', 'pinch-off locus')), labelAt: vovMax * 0.78 });
  const segs = [...(o.segs || [])], pts = [...(o.pts || [])], guides = [];
  if (o.load) segs.push({ a: [0, o.load.vdd / o.load.r * 1e3], b: [o.load.vdd, 0], color: C.chord, w: 2.2 });
  if (o.q) { pts.push({ v: o.q.v, i: o.q.i, color: C.q, label: o.q.label ?? 'Q', side: o.q.side, dy: o.q.dy }); if (o.q.guide !== false) guides.push({ v: o.q.v, i: o.q.i }); }
  return IE.ivPlot(ctx, b, { v: [0, vmax], i: [0, imax], xt: o.xt || [5, 10, 15, 20, 25, 30].filter(x => x <= vmax), yt: o.yt || (imax > 12 ? [4, 8, 12, 16] : imax > 6 ? [2, 4, 6, 8, 10, 12] : imax > 1 ? [1, 2, 3, 4, 5, 6] : [0.1, 0.2, 0.3]).filter(i => i <= imax),
    ml: o.ml ?? 42, mr: o.mr ?? (sh ? 30 : 66), xl: d.pch ? 'V_SD = −V_DS (V)' : 'V_DS (V)', yl: 'I_D (mA)', curves, segs, pts, guides, vl: o.vl, hl: o.hl, title: sh ? '' : (o.title ?? '') });
};
/* Fig. 6.17: the transfer curve on the left and the drain characteristics on the right, sharing the I_D scale; the horizontal line at the chosen
   V_GS carries the saturation level across to the transfer curve. o = { dev, vgs, vmaxD, imax, tbl, short } */
CH5.fig617 = (ctx, b, o = {}) => {
  const d = o.dev || CH5.DEV.f611, wL = Math.round(b.w * 0.42), bl = { x: b.x, y: b.y, w: wL, h: b.h }, br = { x: b.x + wL, y: b.y, w: b.w - wL, h: b.h }, imax = o.imax ?? Math.ceil(mA(d.idss) * 1.25), sh = !!o.short;
  const list = o.list || [0, 1, 2, 3, 4].map(k => -k * Math.abs(d.vp) / 4).filter(v => v > d.vp - 1e-9).concat(d.vp === -4 ? [] : [d.vp]).filter((v, k, a) => a.indexOf(v) === k);   // the V_GS curves (n-channel terms)
  const vgs = o.list ? (o.vgs ?? list[0]) : Math.max(d.vp, Math.min(0, o.vgs ?? -1)), id = CH5.sh(d, vgs), vmaxD = o.vmaxD ?? 25;
  const tl = CH5.tPlot(ctx, bl, { short: sh }, { dev: d, imax, mr: 40, ml: 12, yLabels: false, yl: '', tbl: o.tbl, title: sh ? '' : t('เส้นโค้งถ่ายโอน', 'transfer curve'), pts: [{ v: vgs, i: id, label: `${fd(id, 2)} mA`, side: -1, dy: 14 }], ...(o.tp || {}) });
  const dr = CH5.dPlot(ctx, br, { short: sh }, { dev: d, vgs: list, vmax: vmaxD, imax, ml: 40, mr: sh ? 24 : 60, locus: false,
    title: sh ? '' : t('ลักษณะสมบัติด้านเดรน', 'drain characteristics'), muted: k => Math.abs(list[k] - vgs) > 1e-6 && o.mute !== false, ...(o.dp || {}) });
  /* the chosen V_GS: its own curve highlighted, the saturation level carried across to the transfer curve (Fig. 6.17's arrow) */
  ctx.save(); ctx.strokeStyle = C.q; ctx.lineWidth = 2.6; ctx.beginPath(); for (let k = 0; k <= 160; k++) { const v = vmaxD * k / 160, i = mA(FET.iv(d, vgs, v).i); k ? ctx.lineTo(dr.X(v), dr.Y(i)) : ctx.moveTo(dr.X(v), dr.Y(i)); } ctx.stroke();
  ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(dr.X(vmaxD * 0.55), dr.Y(id)); ctx.lineTo(tl.X(vgs), tl.Y(id)); ctx.stroke(); ctx.setLineDash([5, 4]); ctx.strokeStyle = C.guide; ctx.beginPath(); ctx.moveTo(tl.X(vgs), tl.Y(id)); ctx.lineTo(tl.X(vgs), tl.Bt); ctx.stroke(); ctx.restore();
  CH8.lab(ctx, `V_GS = ${(vgs > 0 ? '+' : '') + sg(vgs)} V`, tl.X(vgs) + 4, tl.Bt - 10, (tl.X(vgs) - tl.L) / (tl.R - tl.L) > 0.55 ? 'right' : 'left', C.q, 12, b, '700');
  return { tl, dr, id, vgs };
};

/* =====================================================================================================================
   4) the channel cross-section (Figs. 6.3, 6.5–6.6, 6.8, 6.10, 6.12): the n-channel between the two p-type gates, the depletion regions widening
   with the reverse bias along the channel (v_R(y) = −v_GS + v_DS·y/L up to pinch-off at |V_P|), the carriers running from source to drain at a
   speed set by I_D, and the two supplies. set({ vgs, vds, pch, dev }); step(dt); draw(ctx, box, { short }) */
CH5.Channel = class {
  constructor() { this.vgs = 0; this.vds = 0; this.pch = false; this.dev = CH5.DEV.f611; this.dots = []; for (let k = 0; k < 28; k++) this.dots.push({ y: Math.random(), x: Math.random() * 2 - 1, ph: Math.random() * 6.28 }); }
  set(o) { Object.assign(this, o); }
  cur() { return FET.iv(this.dev, this.vgs, this.vds); }
  vov() { return Math.max(0, this.vgs - this.dev.vp); }
  vr(y) { return -this.vgs + Math.min(this.vds, this.vov()) * y; }   // reverse bias at y (0 = source end, 1 = drain end), n-channel terms
  w(y) { const VP = -this.dev.vp, vbi = 0.7; return Math.min(1, Math.sqrt((Math.max(0, this.vr(y)) + vbi) / (VP + vbi))); }   // depletion width as a fraction of the half channel
  step(dt) { if (!(dt > 0)) return; const I = this.cur().i, sp = 0.04 + 1.1 * I / this.dev.idss;
    this.dots.forEach(q => { q.y += sp * dt; if (q.y > 1) { q.y -= 1; q.x = Math.random() * 2 - 1; } q.ph += dt * 3; const open = Math.max(0.06, 1 - this.w(q.y)); if (Math.abs(q.x) > open) q.x = Math.sign(q.x) * open * (0.6 + 0.4 * Math.random()); }); }
  draw(ctx, b, o = {}) {
    CH6.bg(ctx, b); const sh = !!o.short, pch = this.pch, cw = Math.min(b.w * 0.34, 150), ch = b.h - 176, cx = b.x + b.w * 0.5, y0 = b.y + 80, y1 = y0 + ch, gw = Math.min(b.w * 0.14, 54), hw = cw / 2;   // the badge sits in the top-left corner above the drain lead
    const nCol = pch ? C.pReg : C.nReg, gCol = pch ? C.nReg : C.pReg, m = this.cur(), Y = s => y1 - (y1 - y0) * s, VP = -this.dev.vp;
    ctx.save(); ctx.fillStyle = nCol; ctx.fillRect(cx - hw, y0, cw, ch); ctx.fillStyle = gCol; ctx.fillRect(cx - hw - gw, y0 + ch * 0.12, gw, ch * 0.76); ctx.fillRect(cx + hw, y0 + ch * 0.12, gw, ch * 0.76);
    /* the depletion regions: a band along each junction whose width follows w(y), wider towards the drain (top) */
    ctx.fillStyle = 'rgba(255,209,102,.16)'; ctx.strokeStyle = 'rgba(255,209,102,.6)'; ctx.lineWidth = 1.2;
    [-1, 1].forEach(sd => { ctx.beginPath(); const xj = cx + sd * hw; ctx.moveTo(xj, y0 + ch * 0.12); for (let k = 0; k <= 40; k++) { const s = 0.88 - 0.76 * k / 40, wd = this.w(s) * hw; ctx.lineTo(xj - sd * wd, Y(s)); } ctx.lineTo(xj, y0 + ch * 0.88); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k <= 40; k++) { const s = 0.88 - 0.76 * k / 40; const x = xj + sd * gw * 0.22 * this.w(s); k ? ctx.lineTo(x, Y(s)) : ctx.moveTo(x, Y(s)); } ctx.stroke(); });
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5; ctx.strokeRect(cx - hw, y0, cw, ch); ctx.strokeRect(cx - hw - gw, y0 + ch * 0.12, gw, ch * 0.76); ctx.strokeRect(cx + hw, y0 + ch * 0.12, gw, ch * 0.76); ctx.restore();
    T(ctx, pch ? 'p' : 'n', cx, y0 + 16, { color: pch ? C.hole : C.elec, size: 15, weight: '700' }); [cx - hw - gw / 2, cx + hw + gw / 2].forEach(x => T(ctx, pch ? 'n' : 'p', x, y0 + ch * 0.5, { color: pch ? C.elec : C.hole, size: 15, weight: '700' }));
    this.dots.forEach(q => { const x = cx + q.x * hw * 0.92, y = Y(q.y); if (pch) IE.ring(ctx, x, y, 4.4, C.hole, 2); else IE.dot(ctx, x, y, 3.8, C.elec, 6); });
    /* contacts and leads: the drain at the top to V_DD on the right, the source at the bottom to ground, the gates to V_GG on the left */
    const lw = 2, wire = COL.axis, xr = b.x + b.w - 52, xl = b.x + 48, yd = y0 - 22, ys = y1 + 22, ym = (y0 + y1) / 2;
    ctx.save(); ctx.strokeStyle = wire; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, yd); ctx.lineTo(xr, yd); ctx.lineTo(xr, ym - 16); ctx.moveTo(xr, ym + 16); ctx.lineTo(xr, ys); ctx.lineTo(cx, ys); ctx.lineTo(cx, y1);
    ctx.moveTo(cx - hw - gw, ym); ctx.lineTo(xl, ym); ctx.lineTo(xl, ys - 36); ctx.moveTo(xl, ys - 8); ctx.lineTo(xl, ys); ctx.lineTo(cx, ys);
    ctx.moveTo(cx + hw + gw, ym); ctx.lineTo(cx + hw + gw + 12, ym); ctx.lineTo(cx + hw + gw + 12, y0 - 10); ctx.lineTo(cx - hw - gw - 12, y0 - 10); ctx.lineTo(cx - hw - gw - 12, ym); ctx.lineTo(cx - hw - gw, ym); ctx.stroke(); ctx.restore();
    const bat = (x, y, vert, pos, on, name, val, lab) => { ctx.save(); ctx.strokeStyle = on ? wire : 'rgba(154,163,199,.35)'; ctx.lineCap = 'round';
      void lab; [[12, 2, pos], [6, 4, -pos]].forEach(([len, w, sgn]) => { ctx.lineWidth = w; ctx.beginPath(); const off = sgn * 5; if (vert) { ctx.moveTo(x - len, y + off); ctx.lineTo(x + len, y + off); } else { ctx.moveTo(x + off, y - len); ctx.lineTo(x + off, y + len); } ctx.stroke(); }); ctx.restore();
      if (vert && pos === 'below') { ctx.save(); ctx.fillStyle = CK.PAL.bg; ctx.fillRect(x - 46, y - 40, 92, 18); ctx.fillRect(x - 46, y + 22, 92, 18); ctx.restore();   // the labels straddle the lead: blank it behind them
        T(ctx, name, x, y - 31, { color: on ? COL.ink : COL.muted, size: 12.5, weight: '600' }); T(ctx, val, x, y + 31, { color: on ? C.q : COL.muted, size: 12, weight: '600' }); return; }
      T(ctx, name, vert ? x + 20 : x, vert ? y - 14 : y - 24, { color: on ? COL.ink : COL.muted, size: 12.5, weight: '600', align: vert ? 'left' : 'center' }); T(ctx, val, vert ? x + 20 : x, vert ? y + 14 : y + 26, { color: on ? C.q : COL.muted, size: 12, weight: '600', align: vert ? 'left' : 'center' }); };
    /* V_DD: + at the drain for an n-channel (the plate nearer the drain lead is the long one), the other way for a p-channel, its labels above and below
       the battery with the lead blanked behind them (the right margin is narrow); V_GG: − at the gate for an n-channel, its labels beside it */
    const batV = (x, y, pos, on, name, val) => { ctx.save(); ctx.strokeStyle = on ? wire : 'rgba(154,163,199,.35)'; ctx.lineCap = 'round';
      [[12, 2, pos], [6, 4, -pos]].forEach(([len, w, sgn]) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x - len, y + sgn * 5); ctx.lineTo(x + len, y + sgn * 5); ctx.stroke(); });
      ctx.fillStyle = CK.PAL.bg; ctx.fillRect(x - 48, y - 42, 96, 20); ctx.fillRect(x - 48, y + 22, 96, 20); ctx.restore();
      T(ctx, name, x, y - 32, { color: on ? COL.ink : COL.muted, size: 12.5, weight: '600' }); T(ctx, val, x, y + 32, { color: on ? C.q : COL.muted, size: 12, weight: '600' }); };
    batV(xr, ym, pch ? 1 : -1, Math.abs(this.vds) > 1e-9, 'V_DD', `V_DS = ${sg(pch ? -this.vds : this.vds)} V`); bat(xl, ys - 22, true, pch ? -1 : 1, Math.abs(this.vgs) > 1e-9, 'V_GG', `V_GS = ${sg(pch ? -this.vgs : this.vgs)} V`);
    T(ctx, sh ? 'D' : t('เดรน (D)', 'drain (D)'), cx + 10, yd - 12, { color: COL.ink, size: 12.5, weight: '600', align: 'left' }); T(ctx, sh ? 'S' : t('ซอร์ส (S)', 'source (S)'), cx + 10, ys + 13, { color: COL.ink, size: 12.5, weight: '600', align: 'left' });
    T(ctx, sh ? 'G' : t('เกต (G)', 'gate (G)'), cx - hw - gw - 16, ym - 12, { color: COL.ink, size: 12.5, weight: '600', align: 'right' });
    /* the current arrow at the drain lead (conventional: into the drain of an n-channel, out of a p-channel's) */
    const I = mA(m.i); if (I > 1e-6) { const yA = yd + 10, dir = pch ? -1 : 1; ctx.save(); ctx.strokeStyle = C.q; ctx.fillStyle = C.q; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx - 14, yA - 8 * dir); ctx.lineTo(cx - 14, yA + 8 * dir); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 14, yA + 12 * dir); ctx.lineTo(cx - 19, yA + 4 * dir); ctx.lineTo(cx - 9, yA + 4 * dir); ctx.closePath(); ctx.fill(); ctx.restore(); }
    T(ctx, `I_D = ${fd(I, 2)} mA`, cx - 22, yd - 12, { color: C.q, size: 12.5, weight: '700', align: 'right' });
    if (!sh) T(ctx, pch ? t('โฮลไหลจากซอร์สไปเดรน', 'holes flow from source to drain') : t('อิเล็กตรอนไหลจากซอร์สไปเดรน', 'electrons flow from source to drain'), cx, ys + 36, { color: COL.muted, size: 11.5 });
    void VP;
  }
};

/* =====================================================================================================================
   5) the explorers of sections A (as CH4.explorer, with the FET readout): o = { init, title, controls(panel, S, build), spec(S) → CH5.net spec,
   side(ctx, box, board, ckt, S), waves: [(ctx, box, board, ckt, S)], badge(ckt, S) → [text, kind], rows(ckt, z, S), text(ckt, z, S), vo } */
CH5.explorer = o => {
  const $ = id => document.getElementById(id), ui = MC.ui, S = { ...o.init };
  const B = new CH8.Board('cvA', { T: 4, mid: true, midMin: 420, cktAspM: o.cktAspM ?? 0.62, rowAsp: o.rowAsp ?? 0.7, rowMin: 280, pad: 1.2, wideAt: 1e9, dotSpeed: 80, shortSpec: sp => CH8.margins(sp, 1.2),
    view: { acPeak: false, minV: 7, glowColor: 'rgba(255,126,182,.4)' },
    side: o.side ? (ctx, b, bd) => { if (B.ckt) o.side(ctx, b, bd, B.ckt, S); } : undefined,
    waves: (o.waves || []).map(w => ({ draw: (ctx, b, bd) => { if (B.ckt) w(ctx, b, bd, B.ckt, S); } })),
    badge: () => (B.ckt ? o.badge(B.ckt, S) : null) });
  const pA = $('pA'), mA_ = document.createElement('div');
  if (o.title) ui.h2(pA, o.title);
  const build = () => { B.set(o.spec(S), o.vo || { speed: 80 / 0.004, dotRef: 0.004 }); const z = CH5.j(B.ckt); mA_.innerHTML = ui.kv(o.rows(B.ckt, z, S));
    if ($('wA')) { $('wA').innerHTML = `<div class="answer">${o.text(B.ckt, z, S)}</div>`; MC.renderMath($('wA')); } };
  o.controls(pA, S, build); pA.appendChild(mA_); mA_.className = 'metrics';
  B.resize(); build(); window.addEventListener('resize', () => B.resize()); LS.anim($('cvA'), dt => B.frame(dt));
  return { B, S, build };
};
/* the node voltages of a solved circuit as bars: V_G, V_S, V_D and V_DS */
CH5.vbars = (ctx, b, bd, c, o = {}) => { const V = n => c.V(n).re, j = c.J('Q'), sh = bd.short;
  CH8.bars(ctx, b, [{ label: 'V_G', v: V('g'), color: C.tan, sub: sh ? '' : t('เกต', 'gate') }, { label: 'V_S', v: V('s'), color: C.q, sub: sh ? '' : t('ซอร์ส', 'source') }, { label: 'V_D', v: V('d'), color: C.curve, sub: sh ? '' : t('เดรน', 'drain') },
    { label: 'V_DS', v: j.VDS * (c.byId.Q.pch ? -1 : 1), color: C.chord, sub: sh ? '' : 'V_D − V_S' }], { title: o.title ?? (sh ? t('แรงดัน (V)', 'voltages (V)') : t('แรงดันเทียบกราวด์ (V) และ V_DS', 'voltages to ground (V), and V_DS')), fmt: v => v2(v), sub: !sh, max: o.max }); };
/* the badge text of a region check: saturation (ok) or the ohmic region / cutoff (wait) */
const regBadge = (z, pre = '') => bdg(`${pre}${REG[z.region][0]}`, null, REG[z.region][1]);

/* =====================================================================================================================
   6) the problems */
const DEF = {}, D = CH5.DEV, SP = {};
const spec = (key, o) => SP[key] || (SP[key] = CH5.net(o));   // one spec object per variant (CH8.Prob rebuilds only when the object changes)
const j = c => CH5.j(c);
const NOTE_OHM = t('ภาพจำลองใช้ย่านโอห์มิก (กฎกำลังสองทางซ้ายของแนวพินช์ออฟ \\(V_{DS} = V_{GS} - V_P\\)) ด้วย สมการของ Shockley ใช้ได้เฉพาะในย่านอิ่มตัว', 'The simulation includes the ohmic region (the square law to the left of the pinch-off locus \\(V_{DS} = V_{GS} - V_P\\)); Shockley\'s equation holds only in the saturation region.');

/* ---------------- page 5.1: Fig. 6.11 through the circuit of Figs. 6.5 and 6.10, the voltage-controlled resistor (slide p. 11), Fig. 6.15 ---------------- */
const F611 = [[0, 2], [0, 4], [0, 12], [1, 12], [1, 3], [4, 12]].map(([vgg, vdd]) => ({ dev: D.f611, VGG: vgg, VDD: vdd, RG: 0, RD: 0, qText: '' }));
DEF.f611 = { ...LAY, solvedAt: 0, spec: k => spec('f611_' + Math.min(k, 5), F611[Math.min(k, 5)]),
  glow: k => (k === 0 ? ['Q'] : k === 1 || k === 2 ? ['VDD'] : k >= 3 ? ['VGG'] : null),
  badge: (k, s) => { const z = j(s.ckt); return regBadge(z, `V_GS = ${sg(z.VGS)} V, V_DS = ${sg(z.VDS)} V: I_D = ${fd(z.id, 2)} mA · `); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.dPlot(ctx, b, bd, { dev: D.f611, imax: 10, vmax: 25, q: { v: z.VDS, i: z.id, label: bd.short ? '' : `(${sg(z.VDS)} V, ${fd(z.id, 2)} mA)`, side: z.VDS > 12 ? -1 : 1, dy: 16 }, labels: !bd.short,
    vl: k >= 1 && k <= 2 ? [{ v: 4, label: bd.short ? 'V_P' : 'V_P = 4 V' }] : k === 4 ? [{ v: 3, label: bd.short ? '' : 'V_GS − V_P = 3 V' }] : [], title: t('รูป 6.11: I_DSS = 8 mA, V_P = −4 V', 'Fig. 6.11: I_DSS = 8 mA, V_P = −4 V') }); },
  steps: () => [
    step(t('<b>\\(V_{GS}\\) = 0, \\(V_{DS}\\) เล็ก ๆ</b> (สไลด์หน้า 6, รูป 6.5–6.7): เกตต่อตรงกับซอร์ส รอยต่อ p–n ทั้งสองไบแอสกลับเล็กน้อยด้วยแรงดันตกในช่อง กระแส \\(I_D\\) เพิ่มตามกฎของโอห์ม ช่องทำตัวเป็นตัวต้านทาน และ \\(I_G\\) = 0 เพราะรอยต่อไบแอสกลับ (จุดในภาพจำลองไม่วิ่งทางเกต)', '<b>\\(V_{GS}\\) = 0, small \\(V_{DS}\\)</b> (slide p. 6, Figs. 6.5–6.7): the gate is tied to the source, both p–n junctions are slightly reverse-biased by the voltage drop along the channel, and \\(I_D\\) rises by Ohm\'s law: the channel is a resistor, and \\(I_G\\) = 0 because the junctions are reverse-biased (no dots run through the gate in the simulation)'),
      block([R`I_D &\cong \frac{V_{DS}}{r_o}\quad (V_{DS} \ll |V_P|)`]), t('บริเวณปลอดพาหะกว้างกว่าทางด้านเดรน เพราะแรงดันตกในช่องทำให้รอยต่อด้านบนไบแอสกลับมากกว่า (รูป 6.6)', 'The depletion regions are wider at the drain end: the drop along the channel reverse-biases the upper part of each junction more (Fig. 6.6).')),
    step(t('<b>พินช์ออฟ</b> (สไลด์หน้า 7–8, รูป 6.8): เมื่อ \\(V_{DS}\\) ถึง \\(|V_P|\\) = 4 V บริเวณปลอดพาหะสองข้าง "แตะกัน" กระแสหยุดเพิ่มที่ \\(I_{DSS}\\) (drain-to-source current with the gate shorted to the source)', '<b>Pinch-off</b> (slides pp. 7–8, Fig. 6.8): when \\(V_{DS}\\) reaches \\(|V_P|\\) = 4 V the two depletion regions "touch" and the current stops rising, at \\(I_{DSS}\\) (the drain-to-source current with the gate shorted to the source)'),
      block([R`I_{DSS} &= \boxed{8\ \text{mA}}\quad \text{at}\ V_{GS} = 0,\ V_{DS} = V_P = \boxed{4\ \text{V}}`]), t('"พินช์ออฟ" ไม่ได้แปลว่ากระแสถูกบีบจนเป็นศูนย์: ยังมีช่องแคบมากที่กระแสหนาแน่นสูงไหลผ่าน', '"Pinch-off" does not mean the current is pinched to zero: a very narrow channel with a high current density remains.')),
    step(t('<b>ย่านอิ่มตัว</b> (รูป 6.9): เกิน \\(V_P\\) ไปแล้ว \\(I_D\\) คงที่ที่ \\(I_{DSS}\\) ไม่ว่า \\(V_{DS}\\) จะเป็น 12 V หรือ 20 V JFET ทำตัวเป็นแหล่งจ่ายกระแส และแรงดัน \\(V_{DS}\\) ถูกกำหนดโดยโหลดภายนอก', '<b>The saturation region</b> (Fig. 6.9): past \\(V_P\\) the current stays at \\(I_{DSS}\\) whether \\(V_{DS}\\) is 12 V or 20 V. The JFET behaves as a current source, and \\(V_{DS}\\) is set by the external load'),
      block([R`I_D &= I_{DSS} = 8\ \text{mA}\quad (V_{GS} = 0,\ V_{DS} \ge |V_P|)`])),
    step(t('<b>\\(V_{GS}\\) = −1 V</b> (สไลด์หน้า 9, รูป 6.10): แรงดันลบที่เกตไบแอสกลับรอยต่อเพิ่มขึ้นตั้งแต่ \\(V_{DS}\\) = 0 บริเวณปลอดพาหะจึงกว้างกว่าเดิม ช่องแคบลง และอิ่มตัวที่กระแสต่ำกว่า (ภาพจำลอง: \\(I_D\\) ตามสมการของ Shockley หน้า 5.2)', '<b>\\(V_{GS}\\) = −1 V</b> (slide p. 9, Fig. 6.10): a negative gate voltage adds reverse bias from \\(V_{DS}\\) = 0 on, so the depletion regions are wider, the channel narrower, and the current saturates lower (simulation: \\(I_D\\) from Shockley\'s equation, page 5.2)'),
      block([R`I_D\big|_{V_{GS} = -1\ \text{V}} &= \boxed{4.5\ \text{mA}}`])),
    step(t('<b>พินช์ออฟเร็วขึ้น</b>: ด้วย \\(V_{GS}\\) = −1 V ช่องถูกบีบจนแตะกันที่ \\(V_{DS} = V_{GS} - V_P\\) = 3 V เท่านั้น (ภาพจำลองที่ 3 V อยู่พอดีบนแนวพินช์ออฟ) จุดพินช์ออฟของทุกเส้นเรียงกันเป็นเส้นโค้งพาราโบลา (locus of pinch-off values) ซึ่งแบ่งย่านโอห์มิกทางซ้ายกับย่านอิ่มตัวทางขวา', '<b>Pinch-off comes sooner</b>: with \\(V_{GS}\\) = −1 V the channel closes at \\(V_{DS} = V_{GS} - V_P\\) = 3 V only (the simulation at 3 V sits exactly on the pinch-off locus). The pinch-off points of all the curves form a parabola (the locus of pinch-off values) separating the ohmic region on the left from the saturation region on the right'),
      block([R`V_{DS(\text{pinch-off})} &= V_{GS} - V_P = -1 - (-4) = \boxed{3\ \text{V}}`])),
    step(t('<b>คัตออฟ</b> (สไลด์หน้า 10): เมื่อ \\(V_{GS} = V_P\\) = −4 V บริเวณปลอดพาหะปิดช่องทั้งหมดตั้งแต่ \\(V_{DS}\\) = 0 กระแสเป็นศูนย์ ใบข้อมูลมักเรียก \\(V_P\\) ว่า \\(V_{GS(\\text{off})}\\)', '<b>Cutoff</b> (slide p. 10): at \\(V_{GS} = V_P\\) = −4 V the depletion regions close the whole channel from \\(V_{DS}\\) = 0 on and the current is zero. Specification sheets usually call \\(V_P\\) \\(V_{GS(\\text{off})}\\)'),
      block([R`V_{GS} = V_P = -4\ \text{V}:\quad I_D &= \boxed{0\ \text{mA}}`]), t('ยิ่ง \\(V_{GS}\\) ลบมากขึ้น ช่องยิ่งแคบ ระดับอิ่มตัวยิ่งต่ำ แต่ระยะห่างระหว่างเส้นไม่เท่ากัน (จาก 0 ถึง −1 V ลด 3.5 mA จาก −3 ถึง −4 V ลดเพียง 0.5 mA) นี่คือที่มาของกำลังสองในสมการของ Shockley', 'The more negative \\(V_{GS}\\), the narrower the channel and the lower the saturation level, but the curves are not evenly spaced (0 to −1 V loses 3.5 mA, −3 to −4 V only 0.5 mA): the square in Shockley\'s equation.'))],
  ask: () => ({ fields: [num('I<sub>DSS</sub> (mA) =', 8), num('V<sub>P</sub> (V) =', -4), num(t('I<sub>D</sub> ที่ V<sub>GS</sub> = −1 V (mA) =', 'I<sub>D</sub> at V<sub>GS</sub> = −1 V (mA) ='), 4.5, { tol: 0.1 }), num(t('พินช์ออฟที่ V<sub>GS</sub> = −1 V: V<sub>DS</sub> (V) =', 'pinch-off at V<sub>GS</sub> = −1 V: V<sub>DS</sub> (V) ='), 3, { tol: 0.1 })] }),
  answer: () => t('\\(I_{DSS}\\) = 8 mA, \\(V_P\\) = −4 V; ที่ \\(V_{GS}\\) = −1 V กระแสอิ่มตัว 4.5 mA และพินช์ออฟที่ \\(V_{DS}\\) = 3 V; \\(V_{GS}\\) = −4 V ตัดกระแส (Boylestad รูป 6.11)', '\\(I_{DSS}\\) = 8 mA, \\(V_P\\) = −4 V; at \\(V_{GS}\\) = −1 V the current saturates at 4.5 mA and pinch-off is at \\(V_{DS}\\) = 3 V; \\(V_{GS}\\) = −4 V cuts the current off (Boylestad Fig. 6.11).') };

/* the voltage-controlled resistor: r_o = 10 kΩ (V_GS = 0), V_P = −6 V, V_GS = −3 V → Eq. 6.1 gives 40 kΩ; a device with that r_o has I_DSS = |V_P|/(2 r_o) = 0.3 mA */
const RDS = [0, 3].map(vgg => ({ dev: D.rd, VGG: vgg, VDD: 1, RG: 0, RD: 0, qText: '' }));
DEF.rd = { ...LAY, solvedAt: 1, spec: k => spec('rd_' + (k >= 1 ? 1 : 0), RDS[k >= 1 ? 1 : 0]),
  glow: k => (k >= 1 ? ['VGG', 'Q'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GS = ${sg(z.VGS)} V: I_D/V_DS = ${CK.eng(z.VDS / Math.max(z.ID, 1e-12), 'Ω')}`, null, true); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.dPlot(ctx, b, bd, { dev: D.rd, vgs: [0, -1.5, -3, -4.5], vmax: 3, imax: 0.35, xt: [1, 2, 3], yt: [0.1, 0.2, 0.3], locus: false, q: { v: z.VDS, i: z.id, label: bd.short ? '' : `${fd(z.id * 1e3, 0)} µA`, side: 1, dy: 14 }, labels: !bd.short,
    title: t('ย่านโอห์มิก: ความชัน = 1/r_d', 'the ohmic region: slope = 1/r_d') }); },
  steps: () => [
    step(t('<b>สมการ 6.1</b> (สไลด์หน้า 11): ทางซ้ายของแนวพินช์ออฟ JFET คือตัวต้านทานที่ควบคุมด้วยแรงดันเกต ความชันของแต่ละเส้นลดลงเมื่อ \\(V_{GS}\\) ลบมากขึ้น', '<b>Eq. 6.1</b> (slide p. 11): to the left of the pinch-off locus the JFET is a resistor controlled by the gate voltage; the slope of each curve falls as \\(V_{GS}\\) goes more negative'),
      block([R`r_d &= \frac{r_o}{(1 - V_{GS}/V_P)^2} = \frac{10\ \text{k}\Omega}{\left(1 - \dfrac{-3\ \text{V}}{-6\ \text{V}}\right)^2} = \frac{10\ \text{k}\Omega}{(0.5)^2} = \boxed{40\ \text{k}\Omega}`]),
      t('ระวังเครื่องหมาย: \\(V_{GS}/V_P\\) = (−3)/(−6) = +0.5 · ภาพจำลองใช้แบบจำลองกำลังสองซึ่งให้ \\(r_d = r_o/(1 - V_{GS}/V_P)\\) (ยกกำลังหนึ่ง) คือ 20 kΩ สมการ 6.1 เป็น "ค่าประมาณขั้นแรก" ของตำรา ค่าจริงของอุปกรณ์อยู่ระหว่างสองค่านี้แล้วแต่โครงสร้างช่อง', 'Mind the signs: \\(V_{GS}/V_P\\) = (−3)/(−6) = +0.5. The simulation\'s square-law model gives \\(r_d = r_o/(1 - V_{GS}/V_P)\\) (first power), 20 kΩ; Eq. 6.1 is the book\'s "first approximation", and a real device lies between the two depending on its channel geometry.'))],
  ask: () => ({ fields: [num('r<sub>d</sub> (kΩ) =', 40, { tol: 0.5 })] }),
  answer: () => t('\\(r_d\\) = 40 kΩ ที่ \\(V_{GS}\\) = −3 V (Boylestad สมการ 6.1)', '\\(r_d\\) = 40 kΩ at \\(V_{GS}\\) = −3 V (Boylestad Eq. 6.1).') };

/* Fig. 6.15: the three summary circuits, V_DD ≥ |V_P| straight across the device */
const F615 = [0, 1, 4, 6].map(vgg => ({ dev: D.f611, VGG: vgg, VDD: 12, RG: 0, RD: 0, qText: '' }));
DEF.f615 = { ...LAY, solvedAt: 0, spec: k => spec('f615_' + Math.min(k, 3), F615[Math.min(k, 3)]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GG = ${fd(-z.VGS, 0)} V → I_D = ${fd(z.id, 2)} mA`, null, z.id > 1e-6 ? 'ok' : 'wait'); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.f611, imax: 10, vmin: -7, pts: [{ v: z.VGS, i: z.id, label: `${fd(z.id, 2)} mA`, side: -1, dy: 14 }], guides: [{ v: z.VGS, i: z.id }], tbl: !bd.short, title: t('I_D ที่ V_GS = −V_GG', 'I_D at V_GS = −V_GG') }); },
  steps: () => [
    step(t('<b>(a) \\(V_{GS}\\) = 0</b> (สไลด์หน้า 14, รูป 6.15a): เกตลัดถึงซอร์ส และ \\(V_{DD}\\) = 12 V ≥ \\(|V_P|\\) กระแสสูงสุด', '<b>(a) \\(V_{GS}\\) = 0</b> (slide p. 14, Fig. 6.15a): the gate shorted to the source and \\(V_{DD}\\) = 12 V ≥ \\(|V_P|\\): the maximum current'), block([R`I_D &= I_{DSS} = \boxed{8\ \text{mA}}`])),
    step(t('<b>(c) \\(V_{GG}\\) = 1 V</b> (สไลด์หน้า 16, รูป 6.15c): \\(V_{GS}\\) = −1 V อยู่ระหว่าง 0 กับ \\(V_P\\) กระแสอยู่ระหว่าง \\(I_{DSS}\\) กับ 0 (สมการของ Shockley หน้า 5.2)', '<b>(c) \\(V_{GG}\\) = 1 V</b> (slide p. 16, Fig. 6.15c): \\(V_{GS}\\) = −1 V lies between 0 and \\(V_P\\), so the current lies between \\(I_{DSS}\\) and 0 (Shockley\'s equation, page 5.2)'), block([R`I_D &= 8\ \text{mA}\left(1 - \frac{-1}{-4}\right)^2 = \boxed{4.5\ \text{mA}}`])),
    step(t('<b>(b) \\(V_{GG}\\) = 4 V = \\(|V_P|\\)</b> (สไลด์หน้า 15, รูป 6.15b): ช่องปิดสนิท', '<b>(b) \\(V_{GG}\\) = 4 V = \\(|V_P|\\)</b> (slide p. 15, Fig. 6.15b): the channel is closed'), block([R`I_D &= \boxed{0\ \text{mA}}`])),
    step(t('<b>\\(V_{GG}\\) = 6 V > \\(|V_P|\\)</b>: ยังคงเป็นศูนย์ ไบแอสกลับที่มากขึ้นไม่เปลี่ยนอะไร (แต่ต้องไม่เกินแรงดันพังทลายของรอยต่อเกต)', '<b>\\(V_{GG}\\) = 6 V > \\(|V_P|\\)</b>: still zero; more reverse bias changes nothing (but must stay below the breakdown of the gate junction)'), block([R`I_D &= 0\ \text{mA}`]))],
  ask: () => ({ fields: [num('V<sub>GG</sub> = 0: I<sub>D</sub> (mA) =', 8), num('V<sub>GG</sub> = 1 V: I<sub>D</sub> (mA) =', 4.5, { tol: 0.1 }), num('V<sub>GG</sub> = 4 V: I<sub>D</sub> (mA) =', 0, { tol: 0.01 })] }),
  answer: () => t('8 mA, 4.5 mA, 0 mA (Boylestad รูป 6.15)', '8 mA, 4.5 mA, 0 mA (Boylestad Fig. 6.15).') };

/* ---------------- page 5.2: Shockley's equation (slide p. 20), Example 6.1, Example 6.2 ---------------- */
const SH = [0, 1, 2, 3, 1, 1.2].map(vgg => ({ dev: D.f611, VGG: vgg, VDD: 20, RG: 1e6, RD: 0, qText: '' }));
DEF.sh = { ...LAY, solvedAt: 0, spec: k => spec('sh_' + Math.min(k, 5), SH[Math.min(k, 5)]),
  glow: k => (k >= 1 ? ['VGG', 'Q'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GS = ${sg(z.VGS)} V → I_D = ${fd(z.id, 2)} mA`); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.f611, imax: 10, vmin: -5, pts: [{ v: z.VGS, i: z.id, label: `(${sg(z.VGS)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: 14 }], guides: [{ v: z.VGS, i: z.id }], tbl: k >= 2 && !bd.short, title: t('สมการของ Shockley: I_DSS = 8 mA, V_P = −4 V', 'Shockley\'s equation: I_DSS = 8 mA, V_P = −4 V') }); },
  steps: () => [
    step(t('<b>\\(V_{GS}\\) = −1 V</b> (สไลด์หน้า 20): แทนค่าลงในสมการ 6.3 ระวังเครื่องหมายของทั้ง \\(V_{GS}\\) และ \\(V_P\\): เสียเครื่องหมายไปตัวเดียวคำตอบผิดทั้งหมด', '<b>\\(V_{GS}\\) = −1 V</b> (slide p. 20): substitute into Eq. 6.3, minding the signs of both \\(V_{GS}\\) and \\(V_P\\); lose one and the answer is wrong'),
      block([R`I_D &= I_{DSS}\left(1 - \frac{V_{GS}}{V_P}\right)^2 = 8\ \text{mA}\left(1 - \frac{-1\ \text{V}}{-4\ \text{V}}\right)^2 = 8\ \text{mA}(0.75)^2 = \boxed{4.5\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = −2 V = \\(V_P/2\\)</b>: จุดลัดของตาราง 6.1 กระแสเป็นหนึ่งในสี่ของ \\(I_{DSS}\\) เสมอ (สมการ 6.9)', '<b>\\(V_{GS}\\) = −2 V = \\(V_P/2\\)</b>: the shortcut of Table 6.1; the current is always a quarter of \\(I_{DSS}\\) (Eq. 6.9)'),
      block([R`I_D &= 8\ \text{mA}(1 - 0.5)^2 = \frac{I_{DSS}}{4} = \boxed{2\ \text{mA}}`])),
    step(t('<b>\\(V_{GS}\\) = −3 V</b>: ใกล้ \\(V_P\\) กระแสเหลือน้อย ระยะห่างระหว่างขั้น 1 V ของ \\(V_{GS}\\) ไม่เท่ากัน นี่คือรูปร่างพาราโบลาของเส้นโค้งถ่ายโอน', '<b>\\(V_{GS}\\) = −3 V</b>: near \\(V_P\\) little current is left; equal 1 V steps of \\(V_{GS}\\) give unequal steps of \\(I_D\\): the parabola of the transfer curve'),
      block([R`I_D &= 8\ \text{mA}(1 - 0.75)^2 = \boxed{0.5\ \text{mA}}`])),
    step(t('<b>ย้อนกลับ</b> (สมการ 6.8): รู้ \\(I_D\\) หา \\(V_{GS}\\) ตรวจกับค่า 4.5 mA ข้างต้น', '<b>The inverse</b> (Eq. 6.8): given \\(I_D\\), find \\(V_{GS}\\); check with the 4.5 mA above'),
      block([R`V_{GS} &= V_P\left(1 - \sqrt{\frac{I_D}{I_{DSS}}}\right) = -4\ \text{V}\left(1 - \sqrt{\frac{4.5}{8}}\right) = -4\ \text{V}(1 - 0.75) = \boxed{-1\ \text{V}}`])),
    step(t('<b>จุดลัดที่สอง</b> (สมการ 6.10): ที่ \\(I_D = I_{DSS}/2\\) ได้ \\(V_{GS} = V_P(1 - \\sqrt{0.5}) = 0.293V_P \\cong 0.3V_P\\) ภาพจำลองตั้ง \\(V_{GS}\\) = −1.2 V', '<b>The second shortcut</b> (Eq. 6.10): at \\(I_D = I_{DSS}/2\\), \\(V_{GS} = V_P(1 - \\sqrt{0.5}) = 0.293V_P \\cong 0.3V_P\\); the simulation sets \\(V_{GS}\\) = −1.2 V'),
      block([R`V_{GS}\big|_{I_D = 4\ \text{mA}} &\cong 0.3V_P = \boxed{-1.2\ \text{V}}`]),
      t('ค่าแม่นยำคือ −1.17 V และที่ −1.2 V สมการให้ 8(1 − 0.3)² = 3.92 mA · สี่จุดของตาราง 6.1 (0, \\(I_{DSS}\\)), (0.3\\(V_P\\), \\(I_{DSS}/2\\)), (0.5\\(V_P\\), \\(I_{DSS}/4\\)), (\\(V_P\\), 0) พอสำหรับร่างเส้นโค้งในบทที่ 7 ส่วนใหญ่ใช้แค่สามจุด: ปลายทั้งสองกับ \\(V_P/2\\)', 'Exactly it is −1.17 V, and at −1.2 V the equation gives 8(1 − 0.3)² = 3.92 mA. The four points of Table 6.1, (0, \\(I_{DSS}\\)), (0.3\\(V_P\\), \\(I_{DSS}/2\\)), (0.5\\(V_P\\), \\(I_{DSS}/4\\)) and (\\(V_P\\), 0), are enough to sketch the curve; chapter 7 mostly uses three: the two ends and \\(V_P/2\\).'))],
  ask: () => ({ fields: [num('I<sub>D</sub>(−1 V) (mA) =', 4.5, { tol: 0.02 }), num('I<sub>D</sub>(−2 V) (mA) =', 2, { tol: 0.02 }), num('I<sub>D</sub>(−3 V) (mA) =', 0.5, { tol: 0.02 }), num(t('V<sub>GS</sub> ที่ 4.5 mA (V) =', 'V<sub>GS</sub> at 4.5 mA (V) ='), -1, { tol: 0.02 })] }),
  answer: () => t('4.5 mA, 2 mA, 0.5 mA; \\(V_{GS}\\) = −1 V (Boylestad หัวข้อ 6.3, สมการ 6.3–6.10)', '4.5 mA, 2 mA, 0.5 mA; \\(V_{GS}\\) = −1 V (Boylestad §6.3, Eqs. 6.3–6.10).') };

const E61 = [0, 3, 1.8].map(vgg => ({ dev: D.ex61, VGG: vgg, VDD: 20, RG: 1e6, RD: 0, qText: '' }));
DEF.ex61 = { ...LAY, solvedAt: 1, spec: k => spec('e61_' + (k >= 2 ? 2 : k >= 1 ? 1 : 0), E61[k >= 2 ? 2 : k >= 1 ? 1 : 0]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`V_GS = ${sg(z.VGS)} V → I_D = ${fd(z.id, 2)} mA`); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.ex61, imax: 14, vmin: -7, yt: [2, 4, 6, 8, 10, 12], pts: [{ v: z.VGS, i: z.id, label: `(${sg(z.VGS)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: 14 }], guides: [{ v: z.VGS, i: z.id }], tbl: k >= 1, title: t('รูป 6.18: I_DSS = 12 mA, V_P = −6 V', 'Fig. 6.18: I_DSS = 12 mA, V_P = −6 V') }); },
  steps: () => [
    step(t('<b>สองจุดปลาย</b>: ที่ \\(V_{GS}\\) = 0 กระแสคือ \\(I_{DSS}\\) และที่ \\(V_{GS} = V_P\\) กระแสเป็นศูนย์', '<b>The two end points</b>: at \\(V_{GS}\\) = 0 the current is \\(I_{DSS}\\), at \\(V_{GS} = V_P\\) it is zero'),
      block([R`(0\ \text{V},\ 12\ \text{mA})\quad &\text{and}\quad (-6\ \text{V},\ 0\ \text{mA})`])),
    step(t('<b>จุดที่สาม</b> ที่ \\(V_P/2\\) (ภาพจำลอง)', '<b>The third point</b> at \\(V_P/2\\) (simulation)'),
      block([R`V_{GS} = \frac{V_P}{2} = -3\ \text{V}:\quad I_D &= \frac{I_{DSS}}{4} = \boxed{3\ \text{mA}}`])),
    step(t('<b>จุดที่สี่</b> ที่ \\(I_{DSS}/2\\): \\(V_{GS} \\cong 0.3V_P\\) ครบสี่จุดของรูป 6.18 แล้วลากเส้นโค้งเรียบผ่าน', '<b>The fourth point</b> at \\(I_{DSS}/2\\): \\(V_{GS} \\cong 0.3V_P\\); the four points of Fig. 6.18, through which a smooth curve is drawn'),
      block([R`I_D = \frac{I_{DSS}}{2} = 6\ \text{mA}:\quad V_{GS} &\cong 0.3(-6\ \text{V}) = \boxed{-1.8\ \text{V}}`]), t('ภาพจำลองที่ −1.8 V ให้ 5.88 mA (0.3 คือ 0.293 ที่ปัดเศษ)', 'The simulation at −1.8 V gives 5.88 mA (0.3 is 0.293 rounded).'))],
  ask: () => ({ fields: [num(t('I<sub>D</sub> ที่ V<sub>P</sub>/2 (mA) =', 'I<sub>D</sub> at V<sub>P</sub>/2 (mA) ='), 3, { tol: 0.02 }), num(t('V<sub>GS</sub> ที่ I<sub>DSS</sub>/2 (V) =', 'V<sub>GS</sub> at I<sub>DSS</sub>/2 (V) ='), -1.8, { tol: 0.05 })] }),
  answer: () => t('(0, 12 mA), (−6 V, 0), (−3 V, 3 mA), (−1.8 V, 6 mA) (Boylestad Example 6.1)', '(0, 12 mA), (−6 V, 0), (−3 V, 3 mA), (−1.8 V, 6 mA) (Boylestad Example 6.1).') };

/* Example 6.2: a p-channel device; V_GS positive at the gate, V_DD negative at the drain (Fig. 6.12) */
const E62 = [0, 1.5, 0.9].map(vgg => ({ dev: D.ex62, VGG: vgg, VDD: 12, RG: 1e6, RD: 0, qText: '' }));
DEF.ex62 = { ...LAY, solvedAt: 1, spec: k => spec('e62_' + Math.min(k, 2), E62[Math.min(k, 2)]),
  glow: k => (k >= 1 ? ['VGG'] : ['Q', 'VDD']),
  badge: (k, s) => { const z = j(s.ckt); return bdg(`p-channel: V_GS = +${fd(-z.VGS, 1)} V → I_D = ${fd(z.id, 2)} mA`); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.ex62, imax: 5, vmin: -0.5, vmax: 3.6, xt: [1, 2, 3], yt: [1, 2, 3, 4, 5], pts: [{ v: -z.VGS, i: z.id, label: `(+${fd(-z.VGS, 1)} V, ${fd(z.id, 2)} mA)`, side: 1, dy: 14 }], guides: [{ v: -z.VGS, i: z.id }], tbl: k >= 1, title: t('รูป 6.19: p-channel, I_DSS = 4 mA, V_P = +3 V', 'Fig. 6.19: p-channel, I_DSS = 4 mA, V_P = +3 V') }); },
  steps: () => [
    step(t('<b>สมการเดิม ขั้วกลับ</b> (สไลด์หน้า 12–13): อุปกรณ์ p-channel ใช้สมการ 6.3 ตามเดิม แต่ \\(V_P\\) และ \\(V_{GS}\\) เป็นบวกทั้งคู่ \\(V_{DS}\\) เป็นลบ เส้นโค้งคือภาพสะท้อนของ n-channel ในภาพจำลองแหล่งจ่ายทั้งสองกลับขั้ว และลูกศรที่เกตชี้ออก', '<b>The same equation, polarities reversed</b> (slides pp. 12–13): a p-channel device uses Eq. 6.3 as it stands, but \\(V_P\\) and \\(V_{GS}\\) are both positive and \\(V_{DS}\\) negative; the curve is the mirror image of an n-channel\'s. In the simulation both supplies are turned round and the gate arrow points out'),
      block([R`V_{GS} = \frac{V_P}{2} = 1.5\ \text{V}:\quad I_D &= \frac{I_{DSS}}{4} = \boxed{1\ \text{mA}}`])),
    step(t('<b>จุด \\(I_{DSS}/2\\)</b>', '<b>The \\(I_{DSS}/2\\) point</b>'),
      block([R`I_D = 2\ \text{mA}:\quad V_{GS} &\cong 0.3V_P = 0.3(3\ \text{V}) = \boxed{0.9\ \text{V}}`]), t('รวมกับ (0, 4 mA) และ (3 V, 0) ได้สี่จุดของรูป 6.19 · เครื่องหมายลบของ \\(V_{DS}\\) ในรูป 6.13 แค่บอกว่าซอร์สมีศักย์สูงกว่าเดรน', 'With (0, 4 mA) and (3 V, 0) these are the four points of Fig. 6.19. The minus signs of \\(V_{DS}\\) in Fig. 6.13 only say that the source is at a higher potential than the drain.'))],
  ask: () => ({ fields: [num(t('I<sub>D</sub> ที่ V<sub>GS</sub> = 1.5 V (mA) =', 'I<sub>D</sub> at V<sub>GS</sub> = 1.5 V (mA) ='), 1, { tol: 0.02 }), num(t('V<sub>GS</sub> ที่ 2 mA (V) =', 'V<sub>GS</sub> at 2 mA (V) ='), 0.9, { tol: 0.03 })] }),
  answer: () => t('(1.5 V, 1 mA) และ (0.9 V, 2 mA) กับปลาย (0, 4 mA), (3 V, 0) (Boylestad Example 6.2)', '(1.5 V, 1 mA) and (0.9 V, 2 mA), with the ends (0, 4 mA), (3 V, 0) (Boylestad Example 6.2).') };

/* ---------------- page 5.3: fixed bias, Example 7.1 (+ V_GG = V_P/2) ---------------- */
const O71 = { dev: D.ex71, VGG: 2, VDD: 16, RG: 1e6, RD: 2000 }, S71 = CH5.sol(O71), O71b = { ...O71, VGG: 4 }, S71b = CH5.sol(O71b);
const exact = (o, S) => { const c = new CK.Circuit(CH5.net(o)); c.solve(); const z = j(c); S.IDx = z.ID; S.VGSx = z.VGS; S.VDSx = z.VDS; S.regx = z.region; return S; };
exact(O71, S71); exact(O71b, S71b);
DEF.ex71 = { ...LAY, solvedAt: 1, spec: () => spec('ex71', O71),
  glow: k => (k === 1 ? ['RG', 'VGG'] : k === 2 ? ['Q'] : k === 3 ? ['RD'] : k === 7 ? ['Q', 'RD'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 7 ? regBadge(z, `I_D = ${fd(z.id, 2)} mA, V_DS = ${fd(z.VDS, 2)} V · `) : k >= 2 ? bdg(`V_GS = −2 V → I_D = ${fd(z.id, 2)} mA (Shockley: 5.625)`) : k === 1 ? bdg('I_G = 0: V_RG = 0, V_GS = −V_GG = −2 V') : bdg('V_DD = 16 V, R_D = 2 kΩ, V_GG = 2 V, I_DSS = 10 mA, V_P = −8 V', null, false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt);
    if (k >= 7) return CH5.dPlot(ctx, b, bd, { dev: D.ex71, imax: 12, vmax: 20, yt: [2, 4, 6, 8, 10, 12], load: { vdd: 16, r: 2000 }, q: { v: z.VDS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.id, 2)} mA, ${fd(z.VDS, 2)} V)`, side: 1, dy: -18 }, labels: !bd.short,
      pts: [{ v: S71.VDS, i: mA(S71.ID), color: C.tan, r: 5, label: bd.short ? '' : t('ตำรา 5.625 mA', 'book 5.625 mA'), side: 1, dy: 18 }], title: t('เส้นโหลด V_DS = V_DD − I_D R_D กับแนวพินช์ออฟ', 'load line V_DS = V_DD − I_D R_D and the pinch-off locus') });
    if (k >= 4 && k <= 5) return CH5.vbars(ctx, b, bd, s.ckt);
    CH5.tPlot(ctx, b, bd, { dev: D.ex71, imax: 12, vmin: -9, yt: [2, 4, 6, 8, 10, 12], vl: k >= 1 ? [{ v: -2, label: bd.short ? '' : t('V_GS = −V_GG = −2 V', 'V_GS = −V_GG = −2 V'), color: C.tan, w: 2.2, dash: [] }] : [], tbl: k >= 6,
      pts: k >= 2 ? [{ v: -2, i: mA(S71.ID), label: bd.short ? 'Q' : `Q: ${fd(mA(S71.ID), 3)} mA`, side: -1, dy: 14 }] : [], guides: k >= 2 ? [{ v: -2, i: mA(S71.ID) }] : [], title: t('รูป 7.4/7.7: เส้นตั้งที่ V_GS = −V_GG ตัดเส้นโค้ง', 'Figs. 7.4/7.7: the vertical line at V_GS = −V_GG meets the curve') }); },
  steps: () => [
    step(t('<b>(a) วงเกต–ซอร์ส</b> (สไลด์หน้า 23–24): \\(I_G \\cong 0\\) จึง \\(V_{R_G} = I_GR_G = 0\\) ตัวต้านทาน \\(R_G\\) แทนได้ด้วยลัดวงจร (ในภาพจำลองไม่มีจุดวิ่งผ่านมัน) กฎแรงดันของเคียร์ชอฟฟ์ (Kirchhoff\'s voltage law) ตามเข็มนาฬิกา: \\(-V_{GG} - V_{GS} = 0\\) (สมการ 7.5)', '<b>(a) The gate–source loop</b> (slides pp. 23–24): \\(I_G \\cong 0\\), so \\(V_{R_G} = I_GR_G = 0\\) and \\(R_G\\) may be replaced by a short (no dots run through it in the simulation). Kirchhoff\'s voltage law clockwise: \\(-V_{GG} - V_{GS} = 0\\) (Eq. 7.5)'),
      block([R`V_{GS_Q} &= -V_{GG} = \boxed{-2\ \text{V}}`]), t('"ไบแอสคงที่" เพราะ \\(V_{GS}\\) ถูกตรึงด้วยแหล่งจ่ายโดยตรง ไม่ขึ้นกับ \\(I_D\\)', '"Fixed bias" because \\(V_{GS}\\) is pinned by the supply, independent of \\(I_D\\).')),
    step(t('<b>(b) วิธีคณิตศาสตร์</b>: แทน \\(V_{GS}\\) ลงในสมการของ Shockley ได้ \\(I_D\\) โดยตรง เป็นวงจร FET ไม่กี่แบบที่แก้แบบนี้ได้', '<b>(b) The mathematical approach</b>: substitute \\(V_{GS}\\) into Shockley\'s equation for \\(I_D\\) directly, one of the few FET circuits that allow it'),
      block([R`I_{D_Q} &= I_{DSS}\left(1 - \frac{V_{GS}}{V_P}\right)^2 = 10\ \text{mA}\left(1 - \frac{-2\ \text{V}}{-8\ \text{V}}\right)^2 = 10\ \text{mA}(0.75)^2 = \boxed{5.625\ \text{mA}}`])),
    step(t('<b>(c) วงเดรน–ซอร์ส</b> (สไลด์หน้า 25): \\(+V_{DS} + I_DR_D - V_{DD} = 0\\) (สมการ 7.6)', '<b>(c) The drain–source loop</b> (slide p. 25): \\(+V_{DS} + I_DR_D - V_{DD} = 0\\) (Eq. 7.6)'),
      block([R`V_{DS} &= V_{DD} - I_DR_D = 16\ \text{V} - (5.625\ \text{mA})(2\ \text{k}\Omega) = 16 - 11.25 = \boxed{4.75\ \text{V}}`])),
    step(t('<b>(d), (e), (f) แรงดันเทียบกราวด์</b> (สมการ 7.7–7.9; แผงข้างภาพ): ซอร์สต่อกราวด์ ตัวห้อยคู่กับตัวห้อยเดี่ยวจึงเท่ากัน', '<b>(d), (e), (f) Voltages to ground</b> (Eqs. 7.7–7.9; side panel): the source is grounded, so double- and single-subscript voltages coincide'),
      block([R`V_S &= 0\ \text{V}`, R`V_D &= V_{DS} + V_S = \boxed{4.75\ \text{V}}`, R`V_G &= V_{GS} + V_S = \boxed{-2\ \text{V}}`])),
    step(t('<b>ข้อสังเกต</b>: วงจรนี้ต้องใช้แหล่งจ่ายสองตัว (\\(V_{GG}\\) และ \\(V_{DD}\\)) จึงใช้จริงน้อย หน้า 5.4 กำจัด \\(V_{GG}\\) ด้วย \\(R_S\\)', '<b>Note</b>: this circuit needs two supplies (\\(V_{GG}\\) and \\(V_{DD}\\)) and is seldom used; page 5.4 removes \\(V_{GG}\\) with \\(R_S\\)'),
      block([R`V_{DG} &= V_D - V_G = 4.75 - (-2) = 6.75\ \text{V}`])),
    step(t('<b>วิธีกราฟ</b> (รูป 7.7): ร่างเส้นโค้งของ Shockley จากสามจุด (0, 10 mA), (\\(V_P/2\\) = −4 V, \\(I_{DSS}/4\\) = 2.5 mA), (−8 V, 0) แล้วลากเส้นตั้งที่ \\(V_{GS}\\) = −2 V จุดตัดคือจุด Q อ่านได้ราว 5.6 mA', '<b>The graphical approach</b> (Fig. 7.7): sketch Shockley\'s curve from three points, (0, 10 mA), (\\(V_P/2\\) = −4 V, \\(I_{DSS}/4\\) = 2.5 mA), (−8 V, 0), and draw the vertical line at \\(V_{GS}\\) = −2 V; the intersection is Q, read as about 5.6 mA'),
      block([R`I_{D_Q} &\cong 5.6\ \text{mA},\quad V_{DS} = 16 - (5.6)(2) = 4.8\ \text{V}`]), t('ทั้งสองวิธีให้คำตอบใกล้กัน วิธีกราฟแม่นถึงทศนิยมหนึ่งตำแหน่ง แต่เร็วกว่าสำหรับวงจรหน้า 5.4–5.5 ที่สมการเป็นกำลังสอง', 'The two approaches agree closely; the graph is good to one decimal place but is quicker for the circuits of pages 5.4–5.5, where the equation is quadratic.')),
    step(t('<b>ตรวจย่านการทำงาน</b> (ตำราไม่ได้ทำ): สมการของ Shockley ใช้ได้เมื่อ \\(V_{DS} \\ge V_{GS} - V_P\\) (ขวาของแนวพินช์ออฟ)', '<b>Check the region</b> (the book does not): Shockley\'s equation holds when \\(V_{DS} \\ge V_{GS} - V_P\\) (to the right of the pinch-off locus)'),
      block([R`V_{GS} - V_P &= -2 - (-8) = 6\ \text{V} > V_{DS} = 4.75\ \text{V}`]),
      t(`จุด Q ของตำราอยู่ทางซ้ายของแนวพินช์ออฟเล็กน้อย คือในย่านโอห์มิก ภาพจำลองซึ่งมีย่านนี้ให้ \\(I_D\\) = ${fd(mA(S71.IDx), 2)} mA, \\(V_{DS}\\) = ${fd(S71.VDSx, 2)} V (ต่างจากตำรา 2.6 %) ถ้าอยากให้ Q อยู่ในย่านอิ่มตัวจริง ต้องให้ \\(V_{DD} - I_DR_D \\ge 6\\) V เช่น \\(R_D \\le\\) 1.78 kΩ · ${NOTE_OHM}`,
        `The book's Q sits just left of the pinch-off locus, in the ohmic region. The simulation, which has that region, gives \\(I_D\\) = ${fd(mA(S71.IDx), 2)} mA, \\(V_{DS}\\) = ${fd(S71.VDSx, 2)} V (2.6 % from the book). To keep Q truly in saturation, \\(V_{DD} - I_DR_D \\ge 6\\) V is needed, e.g. \\(R_D \\le\\) 1.78 kΩ. ${NOTE_OHM}`))],
  ask: () => ({ fields: [num('V<sub>GSQ</sub> (V) =', -2, { tol: 0.01 }), num('I<sub>DQ</sub> (mA) =', 5.625, { tol: 0.05 }), num('V<sub>DS</sub> (V) =', 4.75, { tol: 0.1 }), num('V<sub>D</sub> (V) =', 4.75, { tol: 0.1 })],
    check: v => (near(v[1], 2.5, 0.1) ? t('2.5 mA คือค่าที่ V<sub>GS</sub> = V<sub>P</sub>/2 = −4 V โจทย์ให้ V<sub>GG</sub> = 2 V', '2.5 mA is the value at V<sub>GS</sub> = V<sub>P</sub>/2 = −4 V; the problem gives V<sub>GG</sub> = 2 V.') : '') }),
  answer: () => t('(a) \\(V_{GS_Q}\\) = −2 V (b) \\(I_{D_Q}\\) = 5.625 mA (c) \\(V_{DS}\\) = 4.75 V (d) \\(V_D\\) = 4.75 V (e) \\(V_G\\) = −2 V (f) \\(V_S\\) = 0 V · กราฟ: 5.6 mA, 4.8 V (Boylestad Example 7.1)', '(a) \\(V_{GS_Q}\\) = −2 V (b) \\(I_{D_Q}\\) = 5.625 mA (c) \\(V_{DS}\\) = 4.75 V (d) \\(V_D\\) = 4.75 V (e) \\(V_G\\) = −2 V (f) \\(V_S\\) = 0 V · graph: 5.6 mA, 4.8 V (Boylestad Example 7.1).') };

DEF.fb2 = { ...LAY, solvedAt: 1, spec: k => (k >= 1 ? spec('ex71b', O71b) : spec('ex71', O71)),
  glow: k => (k >= 1 ? ['VGG', 'Q'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 1 ? regBadge(z, `V_GG = 4 V: I_D = ${fd(z.id, 2)} mA, V_DS = ${fd(z.VDS, 2)} V · `) : bdg(`V_GG = 2 V: I_D = ${fd(z.id, 2)} mA`, null, false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); CH5.tPlot(ctx, b, bd, { dev: D.ex71, imax: 12, vmin: -9, yt: [2, 4, 6, 8, 10, 12], vl: [{ v: z.VGS, label: bd.short ? '' : `V_GS = ${sg(z.VGS)} V`, color: C.tan, w: 2.2, dash: [] }], tbl: k >= 1,
    pts: [{ v: z.VGS, i: z.id, label: `${fd(z.id, 2)} mA`, side: -1, dy: 14 }], guides: [{ v: z.VGS, i: z.id }], title: t('จุด Q เมื่อ V_GG เปลี่ยน', 'Q as V_GG changes') }); },
  steps: () => [
    step(t('<b>\\(V_{GG}\\) = 4 V</b>: \\(V_{GS}\\) = −4 V = \\(V_P/2\\) พอดี ใช้จุดลัดของตาราง 6.1 ได้ทันทีโดยไม่ต้องคำนวณ', '<b>\\(V_{GG}\\) = 4 V</b>: \\(V_{GS}\\) = −4 V = \\(V_P/2\\) exactly, so the shortcut of Table 6.1 applies with no arithmetic'),
      block([R`I_D &= \frac{I_{DSS}}{4} = \boxed{2.5\ \text{mA}}`, R`V_{DS} &= 16\ \text{V} - (2.5\ \text{mA})(2\ \text{k}\Omega) = \boxed{11\ \text{V}}`]),
      t(`คราวนี้ \\(V_{DS}\\) = 11 V ≥ \\(V_{GS} - V_P\\) = 4 V อยู่ในย่านอิ่มตัวแน่นอน ภาพจำลองตรงกับการคำนวณ (${fd(mA(S71b.IDx), 3)} mA, ${fd(S71b.VDSx, 2)} V) เปรียบเทียบ: \\(V_{GG}\\) เพิ่ม 2 V ทำให้ \\(I_D\\) ลดกว่าครึ่ง วงจรไบแอสคงที่ไวต่อ \\(V_{GG}\\) มาก`, `Now \\(V_{DS}\\) = 11 V ≥ \\(V_{GS} - V_P\\) = 4 V, well inside saturation, and the simulation agrees (${fd(mA(S71b.IDx), 3)} mA, ${fd(S71b.VDSx, 2)} V). Compare: 2 V more \\(V_{GG}\\) more than halves \\(I_D\\); fixed bias is very sensitive to \\(V_{GG}\\).`))],
  ask: () => ({ fields: [num('I<sub>D</sub> (mA) =', 2.5, { tol: 0.02 }), num('V<sub>DS</sub> (V) =', 11, { tol: 0.05 })] }),
  answer: () => t('\\(I_D\\) = 2.5 mA, \\(V_{DS}\\) = 11 V (ตาราง 6.1 กับสมการ 7.6)', '\\(I_D\\) = 2.5 mA, \\(V_{DS}\\) = 11 V (Table 6.1 and Eq. 7.6).') };

/* ---------------- page 5.4: self bias, Examples 7.2–7.3 ---------------- */
const O72 = { dev: D.ex72, VDD: 20, RG: 1e6, RD: 3300, RS: 1000 }, S72 = CH5.sol(O72), O73a = { ...O72, RS: 100 }, S73a = CH5.sol(O73a), O73b = { ...O72, RS: 10000 }, S73b = CH5.sol(O73b);
exact(O72, S72); exact(O73a, S73a); exact(O73b, S73b);
const selfLine = (rs, idss, label, o = {}) => ({ a: [0, 0], b: [-mA(idss) / 2 * rs / 1e3 * 2, mA(idss)], label, ...o });   // V_GS = −I_D R_S through the origin, up to I_D = I_DSS
DEF.ex72 = { ...LAY, solvedAt: 2, spec: () => spec('ex72', O72),
  glow: k => (k === 1 ? ['RS', 'RG'] : k === 2 ? ['Q'] : k === 3 ? ['RD', 'RS'] : k === 4 ? ['RS'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 2 ? regBadge(z, `I_D = ${fd(z.id, 2)} mA, V_GS = ${fd(z.VGS, 2)} V · `) : k === 1 ? bdg('V_GS = −I_D R_S', null, false) : bdg('V_DD = 20 V, R_D = 3.3 kΩ, R_S = 1 kΩ, I_DSS = 8 mA, V_P = −6 V', null, false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); if (k >= 4 && k <= 6) return CH5.vbars(ctx, b, bd, s.ckt);
    if (k >= 7) return CH5.dPlot(ctx, b, bd, { dev: D.ex72, imax: 10, vmax: 22, load: { vdd: 20, r: 4300 }, q: { v: z.VDS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.id, 2)} mA, ${fd(z.VDS, 2)} V)`, side: 1, dy: -18 }, labels: !bd.short, title: t('เส้นโหลด V_DS = V_DD − I_D(R_D + R_S)', 'load line V_DS = V_DD − I_D(R_D + R_S)') });
    CH5.tPlot(ctx, b, bd, { dev: D.ex72, imax: 10, vmin: -8.5, lines: k >= 1 ? [selfLine(1000, 8e-3, bd.short ? '' : 'V_GS = −I_D R_S', { ext: 0 })] : [], tbl: k >= 2 && !bd.short, curve: k >= 2 || k === 0,
      pts: k >= 1 ? [{ v: -4, i: 4, color: C.tan, r: 5, label: bd.short ? '' : '(−4 V, 4 mA)', side: -1, dy: 14 }].concat(k >= 2 ? [{ v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VGS, 2)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: -14 }] : []) : [], guides: k >= 2 ? [{ v: z.VGS, i: z.id }] : [],
      title: t('รูป 7.13–7.15: เส้นไบแอสตัวเองตัดเส้นโค้งถ่ายโอน', 'Figs. 7.13–7.15: the self-bias line meets the transfer curve') }); },
  steps: () => [
    step(t('<b>(a) วงเกต–ซอร์ส</b> (สไลด์หน้า 29): \\(I_G\\) = 0 จึง \\(R_G\\) เป็นลัดวงจร กระแสใน \\(R_S\\) คือ \\(I_S = I_D\\) กฎแรงดันรอบวง \\(-V_{GS} - V_{R_S} = 0\\) ให้สมการของวงจร (สมการ 7.10) ซึ่งเป็นเส้นตรงผ่านจุดกำเนิดบนกราฟถ่ายโอน: เลือก \\(I_D\\) = 4 mA ได้จุดที่สอง', '<b>(a) The gate–source loop</b> (slide p. 29): \\(I_G\\) = 0, so \\(R_G\\) is a short; the current in \\(R_S\\) is \\(I_S = I_D\\), and the loop \\(-V_{GS} - V_{R_S} = 0\\) gives the network equation (Eq. 7.10), a straight line through the origin of the transfer graph: choose \\(I_D\\) = 4 mA for the second point'),
      block([R`V_{GS} &= -I_DR_S`, R`I_D = 4\ \text{mA}:\quad V_{GS} &= -(4\ \text{mA})(1\ \text{k}\Omega) = -4\ \text{V}`]), t('เลือก 8 mA ก็ได้ −8 V อยู่บนเส้นเดียวกัน (รูป 7.13) ค่าใดก็ได้ตราบที่คู่กันตามสมการ 7.10', 'Choosing 8 mA gives −8 V on the same line (Fig. 7.13); any pair satisfying Eq. 7.10 will do.')),
    step(t('<b>จุด Q</b> (รูป 7.14–7.15): ร่างเส้นโค้งจาก (0, 8 mA), (\\(V_P/2\\) = −3 V, 2 mA), (−6 V, 0) แล้วหาจุดตัดกับเส้นตรง', '<b>The Q-point</b> (Figs. 7.14–7.15): sketch the curve from (0, 8 mA), (\\(V_P/2\\) = −3 V, 2 mA), (−6 V, 0) and find where the line crosses it'),
      block([R`V_{GS_Q} &\cong \boxed{-2.6\ \text{V}}`, R`\text{(b)}\ I_{D_Q} &\cong \boxed{2.6\ \text{mA}}`]),
      t(`วิธีคณิตศาสตร์: แทน \\(V_{GS} = -I_DR_S\\) ลงในสมการของ Shockley \\(I_D = 8(1 - I_D/6)^2\\) (mA) เป็นสมการกำลังสอง \\(0.222I_D^2 - 3.667I_D + 8 = 0\\) ได้ \\(I_D\\) = ${fd(mA(S72.ID), 3)} mA (อีกรากหนึ่ง 13.9 mA เกิน \\(I_{DSS}\\) ตัดทิ้ง) ภาพจำลองให้ค่านี้พอดี`, `Mathematically: put \\(V_{GS} = -I_DR_S\\) into Shockley's equation, \\(I_D = 8(1 - I_D/6)^2\\) (mA), a quadratic \\(0.222I_D^2 - 3.667I_D + 8 = 0\\) with \\(I_D\\) = ${fd(mA(S72.ID), 3)} mA (the other root, 13.9 mA, exceeds \\(I_{DSS}\\) and is discarded); the simulation gives exactly this.`)),
    step(t('<b>(c) วงเดรน–ซอร์ส</b> (สไลด์หน้า 31): \\(V_{R_S} + V_{DS} + V_{R_D} - V_{DD} = 0\\) กับ \\(I_S = I_D\\) (สมการ 7.11)', '<b>(c) The drain–source loop</b> (slide p. 31): \\(V_{R_S} + V_{DS} + V_{R_D} - V_{DD} = 0\\) with \\(I_S = I_D\\) (Eq. 7.11)'),
      block([R`V_{DS} &= V_{DD} - I_D(R_S + R_D) = 20\ \text{V} - (2.6\ \text{mA})(1\ \text{k}\Omega + 3.3\ \text{k}\Omega) = 20 - 11.18 = \boxed{8.82\ \text{V}}`]), t(`ภาพจำลอง ${fd(S72.VDSx, 2)} V ด้วย \\(I_D\\) ที่ไม่ปัดเศษ`, `Simulation: ${fd(S72.VDSx, 2)} V with \\(I_D\\) unrounded.`)),
    step(t('<b>(d) \\(V_S\\)</b> (สมการ 7.12)', '<b>(d) \\(V_S\\)</b> (Eq. 7.12)'), block([R`V_S &= I_DR_S = (2.6\ \text{mA})(1\ \text{k}\Omega) = \boxed{2.6\ \text{V}}`])),
    step(t('<b>(e) \\(V_G\\)</b> (สมการ 7.13): ไม่มีกระแสใน \\(R_G\\) เกตจึงอยู่ที่ศักย์กราวด์ แม้ \\(R_G\\) จะเป็น 1 MΩ', '<b>(e) \\(V_G\\)</b> (Eq. 7.13): no current in \\(R_G\\), so the gate sits at ground potential even through 1 MΩ'), block([R`V_G &= \boxed{0\ \text{V}}`])),
    step(t('<b>(f) \\(V_D\\)</b> (สมการ 7.14) สองทาง', '<b>(f) \\(V_D\\)</b> (Eq. 7.14), two ways'),
      block([R`V_D &= V_{DS} + V_S = 8.82 + 2.6 = \boxed{11.42\ \text{V}}`, R`V_D &= V_{DD} - I_DR_D = 20 - (2.6)(3.3) = 11.42\ \text{V}`])),
    step(t('<b>ตรวจย่าน</b>: \\(V_{GS} - V_P\\) = −2.6 + 6 = 3.4 V ≤ \\(V_{DS}\\) = 8.82 V อยู่ในย่านอิ่มตัว สมการของ Shockley ใช้ได้ (ต่างจาก Example 7.1)', '<b>Check the region</b>: \\(V_{GS} - V_P\\) = −2.6 + 6 = 3.4 V ≤ \\(V_{DS}\\) = 8.82 V: saturation, so Shockley\'s equation was legitimate (unlike Example 7.1)'),
      block([R`V_{DS} = 8.82\ \text{V} &\ge V_{GS} - V_P = 3.4\ \text{V}\ \checkmark`]))],
  ask: () => ({ fields: [num('V<sub>GSQ</sub> (V) =', -2.6, { tol: 0.1 }), num('I<sub>DQ</sub> (mA) =', 2.6, { tol: 0.1 }), num('V<sub>DS</sub> (V) =', 8.82, { tol: 0.2 }), num('V<sub>D</sub> (V) =', 11.42, { tol: 0.2 })] }),
  answer: () => t('(a) \\(V_{GS_Q}\\) = −2.6 V (b) \\(I_{D_Q}\\) = 2.6 mA (c) \\(V_{DS}\\) = 8.82 V (d) \\(V_S\\) = 2.6 V (e) \\(V_G\\) = 0 V (f) \\(V_D\\) = 11.42 V (Boylestad Example 7.2)', '(a) \\(V_{GS_Q}\\) = −2.6 V (b) \\(I_{D_Q}\\) = 2.6 mA (c) \\(V_{DS}\\) = 8.82 V (d) \\(V_S\\) = 2.6 V (e) \\(V_G\\) = 0 V (f) \\(V_D\\) = 11.42 V (Boylestad Example 7.2).') };

DEF.ex73 = { ...LAY, solvedAt: 1, spec: k => (k >= 2 ? spec('ex73b', O73b) : k === 1 ? spec('ex73a', O73a) : spec('ex72', O72)),
  glow: k => (k >= 1 ? ['RS'] : null),
  badge: (k, s) => { const z = j(s.ckt); return regBadge(z, `R_S = ${kO(s.ckt.byId.RS.value)}: I_D = ${fd(z.id, 2)} mA, V_GS = ${fd(z.VGS, 2)} V · `); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); const L = [selfLine(1000, 8e-3, bd.short ? '' : '1 kΩ', { color: 'rgba(126,231,135,.45)', w: 1.6 })];
    if (k >= 1) L.push(selfLine(100, 8e-3, bd.short ? '' : 'R_S = 100 Ω', { ext: 0 })); if (k >= 2) L.push(selfLine(10000, 8e-3, bd.short ? '' : 'R_S = 10 kΩ', { at: 0.06, side: -1 }));
    const bookQ = k >= 2 ? { v: S73b.VGS, i: mA(S73b.ID) } : k === 1 ? { v: S73a.VGS, i: mA(S73a.ID) } : { v: S72.VGS, i: mA(S72.ID) };
    CH5.tPlot(ctx, b, bd, { dev: D.ex72, imax: 10, vmin: -8.5, lines: L, pts: [{ v: bookQ.v, i: bookQ.i, color: C.tan, r: 5.5, label: bd.short ? '' : t('จากเส้นโค้ง', 'from the curve'), side: -1, dy: k === 1 ? -14 : 14 }, { v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q ${t('ภาพจำลอง', 'simulation')} (${fd(z.VGS, 2)} V, ${fd(z.id, 2)} mA)`, side: k >= 2 ? 1 : -1, dy: k === 1 ? 16 : -14 }],
      guides: [{ v: z.VGS, i: z.id }], title: t('รูป 7.16: R_S เล็กเข้าหาแกน I_D, R_S ใหญ่เข้าหาแกน V_GS', 'Fig. 7.16: small R_S hugs the I_D axis, large R_S the V_GS axis') }); },
  steps: () => [
    step(t('<b>(a) \\(R_S\\) = 100 Ω</b> (สไลด์หน้า 33): เส้นไบแอสเกือบตั้งฉาก จุดที่สอง (4 mA, −0.4 V) ตัดเส้นโค้งใกล้ \\(I_{DSS}\\)', '<b>(a) \\(R_S\\) = 100 Ω</b> (slide p. 33): the bias line is nearly vertical; its second point (4 mA, −0.4 V) and it meets the curve near \\(I_{DSS}\\)'),
      block([R`I_{D_Q} &\cong \boxed{6.4\ \text{mA}},\qquad V_{GS_Q} = -I_DR_S \cong \boxed{-0.64\ \text{V}}`]),
      t(`แต่ลองใส่ค่านี้ในวงเดรน: \\(V_{DS} = 20 - (6.4\\ \\text{mA})(3.4\\ \\text{k}\\Omega) = -1.8\\) V เป็นไปไม่ได้ ตำราตอบจากเส้นโค้งถ่ายโอนอย่างเดียว ในวงจรจริง \\(R_D + R_S\\) กิน \\(V_{DD}\\) หมดก่อน JFET จึงถูกดันเข้าย่านโอห์มิก ภาพจำลองให้ \\(I_D\\) = ${fd(mA(S73a.IDx), 2)} mA, \\(V_{GS}\\) = ${fd(S73a.VGSx, 2)} V, \\(V_{DS}\\) = ${fd(S73a.VDSx, 2)} V (< \\(V_{GS} - V_P\\) = ${fd(S73a.VGSx + 6, 2)} V) จุด Q จึงหลุดจากเส้นโค้งของ Shockley · ${NOTE_OHM}`,
        `But put this into the drain loop: \\(V_{DS} = 20 - (6.4\\ \\text{mA})(3.4\\ \\text{k}\\Omega) = -1.8\\) V, impossible. The book answers from the transfer curve alone; in the real circuit \\(R_D + R_S\\) use up \\(V_{DD}\\) first and the JFET is pushed into the ohmic region. The simulation gives \\(I_D\\) = ${fd(mA(S73a.IDx), 2)} mA, \\(V_{GS}\\) = ${fd(S73a.VGSx, 2)} V, \\(V_{DS}\\) = ${fd(S73a.VDSx, 2)} V (< \\(V_{GS} - V_P\\) = ${fd(S73a.VGSx + 6, 2)} V), so Q leaves Shockley's curve. ${NOTE_OHM}`)),
    step(t('<b>(b) \\(R_S\\) = 10 kΩ</b>: เส้นไบแอสเกือบราบ จุดที่สอง (0.4 mA, −4 V) ตัดเส้นโค้งใกล้ \\(V_P\\)', '<b>(b) \\(R_S\\) = 10 kΩ</b>: the bias line is nearly flat; its second point (0.4 mA, −4 V) and it meets the curve near \\(V_P\\)'),
      block([R`V_{GS_Q} &\cong \boxed{-4.6\ \text{V}},\qquad I_{D_Q} = \frac{-V_{GS}}{R_S} \cong \boxed{0.46\ \text{mA}}`]),
      t(`คราวนี้ \\(V_{DS}\\) = 20 − (0.46)(13.3) = 13.9 V อยู่ในย่านอิ่มตัว ภาพจำลองตรงกัน (${fd(mA(S73b.IDx), 3)} mA, ${fd(S73b.VGSx, 2)} V) สรุป: \\(R_S\\) เล็กดึงเส้นโหลดเข้าหาแกน \\(I_D\\) (กระแสมาก) \\(R_S\\) ใหญ่ดึงเข้าหาแกน \\(V_{GS}\\) (กระแสน้อย)`, `This time \\(V_{DS}\\) = 20 − (0.46)(13.3) = 13.9 V, in saturation, and the simulation agrees (${fd(mA(S73b.IDx), 3)} mA, ${fd(S73b.VGSx, 2)} V). In short: a small \\(R_S\\) pulls the bias line toward the \\(I_D\\) axis (more current), a large one toward the \\(V_{GS}\\) axis (less).`))],
  ask: () => ({ fields: [num(t('R<sub>S</sub> = 100 Ω: I<sub>DQ</sub> จากเส้นโค้ง (mA) =', 'R<sub>S</sub> = 100 Ω: I<sub>DQ</sub> from the curve (mA) ='), 6.4, { tol: 0.15 }), num('R<sub>S</sub> = 10 kΩ: V<sub>GSQ</sub> (V) =', -4.6, { tol: 0.1 })] }),
  answer: () => t('(a) \\(I_{D_Q}\\) ≅ 6.4 mA, \\(V_{GS_Q}\\) ≅ −0.64 V (จากเส้นโค้ง; วงจรจริงอยู่ในย่านโอห์มิก) (b) \\(V_{GS_Q}\\) ≅ −4.6 V, \\(I_{D_Q}\\) ≅ 0.46 mA (Boylestad Example 7.3)', '(a) \\(I_{D_Q}\\) ≅ 6.4 mA, \\(V_{GS_Q}\\) ≅ −0.64 V (from the curve; the real circuit is in the ohmic region) (b) \\(V_{GS_Q}\\) ≅ −4.6 V, \\(I_{D_Q}\\) ≅ 0.46 mA (Boylestad Example 7.3).') };

/* ---------------- page 5.5: voltage-divider bias, Example 7.4 (+ the effect of R_S, Fig. 7.20) ---------------- */
const O74 = { dev: D.f611, VDD: 16, R1: 2.1e6, R2: 270e3, RD: 2400, RS: 1500 }, S74 = CH5.sol(O74), O74a = { ...O74, RS: 500 }, S74a = CH5.sol(O74a), O74b = { ...O74, RS: 3000 }, S74b = CH5.sol(O74b);
exact(O74, S74); exact(O74a, S74a); exact(O74b, S74b);
const divLine = (vg, rs, label, o = {}) => ({ a: [vg, 0], b: [vg - 8 * rs / 1e3 - 1, 9 + 1e3 / rs], label, ...o });   // V_GS = V_G − I_D R_S from (V_G, 0), past the I_D axis
DEF.ex74 = { ...LAY, solvedAt: 2, spec: () => spec('ex74', O74),
  glow: k => (k === 0 ? ['R1', 'R2'] : k === 1 ? ['RS'] : k === 2 ? ['Q'] : k === 3 ? ['RD'] : k === 4 ? ['RS'] : null),
  badge: (k, s) => { const z = j(s.ckt); return k >= 2 ? regBadge(z, `I_D = ${fd(z.id, 2)} mA, V_GS = ${fd(z.VGS, 2)} V · `) : k === 1 ? bdg('V_GS = V_G − I_D R_S', null, false) : k === 0 ? bdg(`V_G = R_2 V_DD/(R_1 + R_2) = ${fd(s.ckt.V('g').re, 2)} V`) : bdg('', null, false); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt); if (k >= 3 && k <= 5) return CH5.vbars(ctx, b, bd, s.ckt);
    if (k >= 6) return CH5.dPlot(ctx, b, bd, { dev: D.f611, imax: 10, vmax: 18, load: { vdd: 16, r: 3900 }, q: { v: z.VDS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.id, 2)} mA, ${fd(z.VDS, 2)} V)`, side: 1, dy: -18 }, labels: !bd.short, title: t('เส้นโหลด V_DS = V_DD − I_D(R_D + R_S)', 'load line V_DS = V_DD − I_D(R_D + R_S)') });
    CH5.tPlot(ctx, b, bd, { dev: D.f611, imax: 10, vmin: -5, vmax: 3, lines: k >= 1 ? [divLine(S74.VG, 1500, bd.short ? '' : 'V_GS = V_G − I_D R_S', { at: 0.22 })] : [], tbl: k >= 2 && !bd.short,
      pts: (k >= 1 ? [{ v: S74.VG, i: 0, color: C.tan, r: 5, label: bd.short ? '' : `V_G = ${fd(S74.VG, 2)} V`, side: 1, dy: 16 }, { v: 0, i: mA(S74.VG / 1500), color: C.tan, r: 5, label: bd.short ? '' : `V_G/R_S = ${fd(mA(S74.VG / 1500), 2)} mA`, side: 1, dy: 14 }] : []).concat(k >= 2 ? [{ v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VGS, 2)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: -14 }] : []),
      guides: k >= 2 ? [{ v: z.VGS, i: z.id }] : [], title: t('รูป 7.19/7.22: เส้นของวงจรไม่ผ่านจุดกำเนิดแล้ว', 'Figs. 7.19/7.22: the network line no longer passes through the origin') }); },
  steps: () => [
    step(t('<b>(a) \\(V_G\\)</b> (สไลด์หน้า 35): \\(I_G\\) = 0 จึง \\(I_{R_1} = I_{R_2}\\) ตัวแบ่งแรงดันให้ \\(V_G\\) ตรง ๆ (สมการ 7.15) ไม่ต้องทำเทเวนินเหมือน BJT เพราะไม่มีกระแสเกตมาดึง', '<b>(a) \\(V_G\\)</b> (slide p. 35): \\(I_G\\) = 0, so \\(I_{R_1} = I_{R_2}\\) and the divider gives \\(V_G\\) directly (Eq. 7.15); no Thévenin as for the BJT, since no gate current loads it'),
      block([R`V_G &= \frac{R_2V_{DD}}{R_1 + R_2} = \frac{(270\ \text{k}\Omega)(16\ \text{V})}{2.1\ \text{M}\Omega + 0.27\ \text{M}\Omega} = \boxed{1.82\ \text{V}}`])),
    step(t('<b>สมการของวงจร</b> (สมการ 7.16–7.18): วงเกต–ซอร์ส \\(V_G - V_{GS} - V_{R_S} = 0\\) เส้นตรงที่ไม่ผ่านจุดกำเนิด หาสองจุดจากจุดตัดแกน', '<b>The network equation</b> (Eqs. 7.16–7.18): the gate–source loop \\(V_G - V_{GS} - V_{R_S} = 0\\), a straight line that misses the origin; take its two axis intercepts'),
      block([R`V_{GS} &= V_G - I_DR_S = 1.82\ \text{V} - I_D(1.5\ \text{k}\Omega)`, R`I_D = 0:\quad V_{GS} &= V_G = +1.82\ \text{V}`, R`V_{GS} = 0:\quad I_D &= \frac{V_G}{R_S} = \frac{1.82\ \text{V}}{1.5\ \text{k}\Omega} = 1.21\ \text{mA}`])),
    step(t('<b>จุด Q</b> (รูป 7.22): เส้นโค้งจาก (0, 8 mA), (\\(V_P/2\\) = −2 V, 2 mA), (−4 V, 0) ตัดกับเส้นตรง', '<b>The Q-point</b> (Fig. 7.22): the curve from (0, 8 mA), (\\(V_P/2\\) = −2 V, 2 mA), (−4 V, 0) meets the line'),
      block([R`I_{D_Q} &\cong \boxed{2.4\ \text{mA}},\qquad V_{GS_Q} \cong \boxed{-1.8\ \text{V}}`]), t(`คำตอบแม่นยำ (ภาพจำลอง): ${fd(mA(S74.IDx), 3)} mA, ${fd(S74.VGSx, 3)} V · ตรวจ: 1.82 − (2.4)(1.5) = −1.78 V ✓`, `Exactly (simulation): ${fd(mA(S74.IDx), 3)} mA, ${fd(S74.VGSx, 3)} V. Check: 1.82 − (2.4)(1.5) = −1.78 V ✓`)),
    step(t('<b>(b) \\(V_D\\)</b> (สมการ 7.20; แผงข้างภาพ)', '<b>(b) \\(V_D\\)</b> (Eq. 7.20; side panel)'), block([R`V_D &= V_{DD} - I_DR_D = 16\ \text{V} - (2.4\ \text{mA})(2.4\ \text{k}\Omega) = \boxed{10.24\ \text{V}}`])),
    step(t('<b>(c) \\(V_S\\)</b> (สมการ 7.21)', '<b>(c) \\(V_S\\)</b> (Eq. 7.21)'), block([R`V_S &= I_DR_S = (2.4\ \text{mA})(1.5\ \text{k}\Omega) = \boxed{3.6\ \text{V}}`])),
    step(t('<b>(d) \\(V_{DS}\\)</b> (สมการ 7.19) สองทาง และ <b>(e) \\(V_{DG}\\)</b>', '<b>(d) \\(V_{DS}\\)</b> (Eq. 7.19), two ways, and <b>(e) \\(V_{DG}\\)</b>'),
      block([R`V_{DS} &= V_{DD} - I_D(R_D + R_S) = 16 - (2.4)(3.9) = \boxed{6.64\ \text{V}} = V_D - V_S`, R`V_{DG} &= V_D - V_G = 10.24 - 1.82 = \boxed{8.42\ \text{V}}`]),
      t(`ภาพจำลอง: \\(V_{DS}\\) = ${fd(S74.VDSx, 2)} V ด้วย \\(I_D\\) ที่ไม่ปัดเศษ · กระแสในตัวแบ่ง \\(I_{R_1} = I_{R_2} = V_{DD}/(R_1 + R_2)\\) = ${fd(S74.IRR * 1e6, 2)} µA (สมการ 7.22) น้อยมากเพราะตัวต้านทานระดับเมกะโอห์ม ซึ่งใช้ได้เพราะ \\(I_G\\) = 0`, `Simulation: \\(V_{DS}\\) = ${fd(S74.VDSx, 2)} V with \\(I_D\\) unrounded. The divider current \\(I_{R_1} = I_{R_2} = V_{DD}/(R_1 + R_2)\\) = ${fd(S74.IRR * 1e6, 2)} µA (Eq. 7.22) is tiny because the resistors are in the megohms, which \\(I_G\\) = 0 allows.`)),
    step(t('<b>ตรวจย่าน</b>: \\(V_{GS} - V_P\\) = −1.8 + 4 = 2.2 V ≤ \\(V_{DS}\\) = 6.64 V ย่านอิ่มตัว ✓', '<b>Check the region</b>: \\(V_{GS} - V_P\\) = −1.8 + 4 = 2.2 V ≤ \\(V_{DS}\\) = 6.64 V: saturation ✓'),
      block([R`V_{DS} = 6.64\ \text{V} &\ge 2.2\ \text{V}\ \checkmark`]))],
  ask: () => ({ fields: [num('V<sub>G</sub> (V) =', 1.82, { tol: 0.02 }), num('I<sub>DQ</sub> (mA) =', 2.4, { tol: 0.1 }), num('V<sub>GSQ</sub> (V) =', -1.8, { tol: 0.1 }), num('V<sub>DS</sub> (V) =', 6.64, { tol: 0.3 })] }),
  answer: () => t('(a) \\(I_{D_Q}\\) ≅ 2.4 mA, \\(V_{GS_Q}\\) ≅ −1.8 V (b) \\(V_D\\) = 10.24 V (c) \\(V_S\\) = 3.6 V (d) \\(V_{DS}\\) = 6.64 V (e) \\(V_{DG}\\) = 8.42 V (Boylestad Example 7.4)', '(a) \\(I_{D_Q}\\) ≅ 2.4 mA, \\(V_{GS_Q}\\) ≅ −1.8 V (b) \\(V_D\\) = 10.24 V (c) \\(V_S\\) = 3.6 V (d) \\(V_{DS}\\) = 6.64 V (e) \\(V_{DG}\\) = 8.42 V (Boylestad Example 7.4).') };

DEF.rs720 = { ...LAY, solvedAt: 1, spec: k => (k >= 2 ? spec('ex74b', O74b) : k === 1 ? spec('ex74a', O74a) : spec('ex74', O74)),
  glow: k => (k >= 1 ? ['RS'] : null),
  badge: (k, s) => { const z = j(s.ckt); return regBadge(z, `R_S = ${kO(s.ckt.byId.RS.value)}: I_D = ${fd(z.id, 2)} mA, V_GS = ${fd(z.VGS, 2)} V · `); },
  side: (ctx, b, bd, k, s) => { const z = j(s.ckt), L = [divLine(S74.VG, 1500, bd.short ? '' : '1.5 kΩ', { color: 'rgba(126,231,135,.45)', w: 1.6 })];
    if (k >= 1) L.push(divLine(S74.VG, 500, bd.short ? '' : 'R_S = 0.5 kΩ', { at: 0.3 })); if (k >= 2) L.push(divLine(S74.VG, 3000, bd.short ? '' : 'R_S = 3 kΩ', { at: 0.15, side: -1 }));
    CH5.tPlot(ctx, b, bd, { dev: D.f611, imax: 10, vmin: -5, vmax: 3, lines: L, pts: [{ v: z.VGS, i: z.id, label: bd.short ? 'Q' : `Q (${fd(z.VGS, 2)} V, ${fd(z.id, 2)} mA)`, side: -1, dy: -14 }, { v: S74.VG, i: 0, color: C.tan, r: 4.5 }], guides: [{ v: z.VGS, i: z.id }],
      title: t('รูป 7.20: ทุกเส้นหมุนรอบจุด V_G บนแกนนอน', 'Fig. 7.20: every line pivots about V_G on the horizontal axis') }); },
  steps: () => [
    step(t('<b>\\(R_S\\) = 0.5 kΩ</b>: จุดตัดแกนตั้ง \\(V_G/R_S\\) = 3.64 mA สูงขึ้น เส้นชันขึ้นโดยยังผ่าน (1.82 V, 0) จุด Q เลื่อนขึ้นตามเส้นโค้ง', '<b>\\(R_S\\) = 0.5 kΩ</b>: the vertical intercept \\(V_G/R_S\\) = 3.64 mA is higher, the line steeper while still passing through (1.82 V, 0), and Q climbs the curve'),
      block([R`I_{D_Q} &\cong ${fd(mA(S74a.ID), 2)}\ \text{mA},\qquad V_{GS_Q} \cong ${fd(S74a.VGS, 2)}\ \text{V}`]), t(`\\(V_{DS}\\) = 16 − (${fd(mA(S74a.ID), 2)})(2.9) = ${fd(S74a.VDS, 2)} V ยังอยู่ในย่านอิ่มตัว (\\(V_{GS} - V_P\\) = ${fd(S74a.vov, 2)} V)`, `\\(V_{DS}\\) = 16 − (${fd(mA(S74a.ID), 2)})(2.9) = ${fd(S74a.VDS, 2)} V, still in saturation (\\(V_{GS} - V_P\\) = ${fd(S74a.vov, 2)} V).`)),
    step(t('<b>\\(R_S\\) = 3 kΩ</b>: จุดตัดแกนตั้งลดเหลือ 0.61 mA เส้นราบลง จุด Q เลื่อนลงไปทาง \\(V_P\\)', '<b>\\(R_S\\) = 3 kΩ</b>: the vertical intercept falls to 0.61 mA, the line flattens, and Q slides down toward \\(V_P\\)'),
      block([R`I_{D_Q} &\cong ${fd(mA(S74b.ID), 2)}\ \text{mA},\qquad V_{GS_Q} \cong ${fd(S74b.VGS, 2)}\ \text{V}`]),
      t('สรุปตามตำรา: \\(R_S\\) ที่ใหญ่ขึ้นให้ \\(I_{D_Q}\\) น้อยลงและ \\(V_{GS_Q}\\) ลบมากขึ้น ส่วน \\(V_G\\) ที่สูงขึ้น (เพิ่ม \\(R_2\\)) เลื่อนจุดหมุนไปทางขวาและยก Q ขึ้น ลองในส่วน A', 'As the book puts it: a larger \\(R_S\\) gives a lower \\(I_{D_Q}\\) and a more negative \\(V_{GS_Q}\\); a higher \\(V_G\\) (more \\(R_2\\)) moves the pivot right and lifts Q. Try it in section A.'))],
  ask: () => ({ fields: [num('R<sub>S</sub> = 0.5 kΩ: I<sub>DQ</sub> (mA) =', mA(S74a.ID), { tol: 0.1 }), num('R<sub>S</sub> = 3 kΩ: I<sub>DQ</sub> (mA) =', mA(S74b.ID), { tol: 0.06 })] }),
  answer: () => t(`\\(R_S\\) = 0.5 kΩ: ${fd(mA(S74a.ID), 2)} mA, ${fd(S74a.VGS, 2)} V · \\(R_S\\) = 3 kΩ: ${fd(mA(S74b.ID), 2)} mA, ${fd(S74b.VGS, 2)} V (Boylestad รูป 7.20)`, `\\(R_S\\) = 0.5 kΩ: ${fd(mA(S74a.ID), 2)} mA, ${fd(S74a.VGS, 2)} V · \\(R_S\\) = 3 kΩ: ${fd(mA(S74b.ID), 2)} mA, ${fd(S74b.VGS, 2)} V (Boylestad Fig. 7.20).`) };

CH5.S = { S71, S71b, S72, S73a, S73b, S74, S74a, S74b };
CH5.DEF = DEF;
CH5.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.CH5 = CH5;
})(window);
