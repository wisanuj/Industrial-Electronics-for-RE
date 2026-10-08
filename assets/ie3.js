/* ie3.js — chapter 3 (bipolar junction transistors): the transistor characteristics of the book's figures, the circuits, the carrier picture
   and the worked problems, on top of circuit.js (part 'Q'), ie.js and ch8.js.
   Sources: course slides "Chapter 3 BJTs" (20 pp.; no worked examples, and the equations of pp. 10, 13, 14, 15 and 19 are missing from the
   slides: Eqs. 3.4, 3.5, 3.7, 3.10, 3.11, 3.12–3.13, 3.17, 3.18 of the book) and Boylestad & Nashelsky, 11th ed., chapter 3: Examples 3.1–3.2,
   the β of Fig. 3.16, the I_CEO of Eqs. 3.8–3.9, the P_Cmax curve of Fig. 3.22, and end-of-chapter problems 9, 15, 21–24, 26, 28 and 29.
   "Transistor amplifying action" (on the contents slide, p. 2, but on no slide) is a section of earlier editions (Vi = 200 mV, Ri = 20 Ω,
   R = 5 kΩ, Av = 250); the 11th edition dropped it.
   Curves digitized from the book's figures (300 dpi renders of the PDF, traced pixel by pixel; the saturation corner, hidden under the thick
   strokes, is a knee at 86 % of the 1 V level on a common rise of 8.2 mA/V, 150 mA/V for Fig. 3.22):
     F313 Fig. 3.13a, I_B = 0…90 µA — it gives Example 3.2: 3.41 mA at 30 µA and 10 V, 2.51 mA at 20 µA and 15 V
     IN313 Fig. 3.13b at V_CE = 1, 10, 20 V, moved left by up to 11.25 mV (a ramp from 2 to 20 µA) so that the curve at 15 V passes
           the book's reading, 20 µA at 0.7 V (Example 3.2b); without it the figure gives 18 µA
     F316 Fig. 3.16, to 25 V: 2.20, 2.70 and 3.20 mA at 7.5 V for 20, 25 and 30 µA, as the book reads them (β_ac = 100, β_dc = 108)
     IN37 Fig. 3.7 (common base: I_E against V_BE at V_CB = 1, 10, 20 V; 0.733 V at 4 mA and 20 V, where the book reads "about 0.74 V")
     F322 Fig. 3.22 (limits of operation), with the upswing of each curve near BV_CEO as the book draws it
   CH3.DEF: p9 (page 3.1), ex31 alpha amp (3.2), ex32 beta ab (3.3), pc p28 cc (3.4); CH3.problem(n, key) wires a section like CH8.wire */
(function (global) {
'use strict';
const CH3 = {}, fd = CH6.fd, R = String.raw, C = IE.COL, BJT = CK.BJT, DIODE = CK.DIODE, T = CH6.text;
const t = (th, en) => MC.t(th, en);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o });
const v2 = x => fd(x, 2).replace('-', '−'), PURPLE = '#c792ea';

/* =====================================================================================================================
   1) the transistors */
const knee = (pts, gs) => { const i1 = pts[0][1], ik = +(0.86 * i1).toFixed(3); return [[0, 0], [+(ik / gs).toFixed(3), ik], ...pts]; };
const F313 = BJT.family({ ib: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90], curves: [
  [[0, 0], [0.05, 0.1], [0.3, 0.15], [1, 0.216], [1.5, 0.243], [2, 0.253], [3, 0.268], [4, 0.275], [5, 0.284], [6, 0.289], [7, 0.294], [8, 0.299], [10, 0.305], [12, 0.314], [14, 0.32], [16, 0.322], [18, 0.325], [18.83, 0.326]],
  [[0, 0], [0.116, 0.95], [1, 1.105], [1.5, 1.155], [2, 1.172], [3, 1.194], [4, 1.216], [5, 1.234], [6, 1.252], [7, 1.271], [8, 1.288], [10, 1.321], [12, 1.352], [14, 1.383], [16, 1.414], [17.1, 1.43]],
  [[0, 0], [0.209, 1.712], [1, 1.991], [1.5, 2.06], [2, 2.088], [3, 2.134], [4, 2.174], [5, 2.209], [6, 2.243], [7, 2.275], [8, 2.305], [10, 2.368], [12, 2.424], [14, 2.481], [15.14, 2.505]],
  [[0, 0], [0.293, 2.4], [1, 2.791], [1.5, 2.898], [2, 2.945], [3, 3.018], [4, 3.082], [5, 3.141], [6, 3.196], [7, 3.251], [8, 3.303], [10, 3.406], [12, 3.507], [13.33, 3.564]],
  [[0, 0], [0.37, 3.033], [1, 3.527], [1.5, 3.651], [2, 3.708], [3, 3.796], [4, 3.87], [5, 3.937], [6, 4.001], [7, 4.064], [8, 4.123], [10, 4.238], [12, 4.349]],
  [[0, 0], [0.422, 3.459], [1, 4.022], [1.5, 4.225], [2, 4.312], [3, 4.44], [4, 4.548], [5, 4.643], [6, 4.733], [7, 4.821], [8, 4.9], [10, 5.056], [10.46, 5.085]],
  [[0, 0], [0.481, 3.941], [1, 4.583], [1.5, 4.815], [2, 4.934], [3, 5.095], [4, 5.227], [5, 5.343], [6, 5.455], [7, 5.562], [8, 5.661], [9.25, 5.777]],
  [[0, 0], [0.527, 4.322], [1, 5.025], [1.5, 5.319], [2, 5.48], [3, 5.695], [4, 5.865], [5, 6.01], [6, 6.145], [7, 6.271], [7.47, 6.316]],
  [[0, 0], [0.584, 4.792], [1, 5.572], [1.5, 5.865], [2, 6.034], [3, 6.287], [4, 6.495], [5, 6.675], [6, 6.844]],
  [[0, 0], [0.639, 5.237], [1, 6.09], [1.5, 6.432], [2, 6.615], [3, 6.898], [4, 7.123], [4.55, 7.215]]] });
F313.ends = [18.83, 17.1, 15.14, 13.33, 12.09, 10.46, 9.25, 7.47, 6.15, 4.55];
const F316 = BJT.family({ ib: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90], curves: [
  [[0, 0], [0.05, 0.1], [0.3, 0.15], [1, 0.327], [1.5, 0.331], [2, 0.332], [3, 0.335], [4, 0.341], [5, 0.343], [6, 0.349], [7, 0.351], [8, 0.356], [10, 0.364], [12, 0.368], [14, 0.376], [16, 0.38], [18, 0.385], [20, 0.389], [22, 0.39]],
  [[0, 0], [0.121, 0.996], [1, 1.158], [1.5, 1.178], [2, 1.188], [3, 1.207], [4, 1.224], [5, 1.24], [6, 1.257], [7, 1.274], [8, 1.289], [10, 1.32], [12, 1.35], [14, 1.379], [16, 1.408], [18, 1.435], [20, 1.46], [22, 1.482]],
  [[0, 0], [0.202, 1.655], [1, 1.924], [1.5, 2.002], [2, 2.024], [3, 2.062], [4, 2.096], [5, 2.129], [6, 2.154], [8, 2.216], [10, 2.272], [12, 2.326], [14, 2.378], [16, 2.427], [18, 2.475], [20, 2.518], [20.52, 2.527]],
  [[0, 0], [0.28, 2.294], [1, 2.668], [1.5, 2.847], [2, 2.921], [3, 2.996], [4, 3.048], [5, 3.096], [6, 3.141], [8, 3.224], [10, 3.305], [12, 3.381], [14, 3.451], [16, 3.517], [18, 3.578], [19.24, 3.606]],
  [[0, 0], [0.358, 2.935], [1, 3.413], [1.5, 3.618], [2, 3.726], [3, 3.846], [4, 3.908], [5, 3.96], [6, 4.011], [7, 4.057], [8, 4.106], [10, 4.198], [12, 4.286], [14, 4.371], [16, 4.446], [17.53, 4.492]],
  [[0, 0], [0.421, 3.449], [1, 4.011], [1.5, 4.293], [2, 4.459], [3, 4.635], [4, 4.711], [5, 4.779], [6, 4.844], [7, 4.902], [8, 4.959], [10, 5.064], [12, 5.155], [14, 5.229], [16, 5.285]],
  [[0, 0], [0.474, 3.887], [1, 4.52], [1.5, 4.811], [2, 5.001], [3, 5.275], [4, 5.414], [5, 5.513], [6, 5.596], [7, 5.672], [8, 5.742], [10, 5.863], [12, 5.957], [14, 6.014], [14.57, 6.022]],
  [[0, 0], [0.522, 4.284], [1, 4.981], [1.5, 5.365], [2, 5.607], [3, 5.931], [4, 6.123], [5, 6.253], [6, 6.36], [7, 6.448], [8, 6.527], [10, 6.65], [12, 6.732], [13.14, 6.762]],
  [[0, 0], [0.566, 4.638], [1, 5.393], [1.5, 5.825], [2, 6.1], [3, 6.479], [4, 6.719], [5, 6.888], [6, 7.022], [7, 7.13], [8, 7.22], [10, 7.354], [10.98, 7.399]],
  [[0, 0], [0.635, 5.206], [1, 6.054], [1.5, 6.427], [2, 6.667], [3, 7.017], [4, 7.279], [5, 7.482], [6, 7.643], [7, 7.776], [8, 7.893], [8.98, 7.981]]] });
F316.ends = [22, 22, 20.52, 19.24, 17.53, 16.19, 14.57, 13.14, 10.98, 8.98];
const F322 = BJT.family({ ib: [0, 10, 20, 30, 40, 50, 60, 70], curves: [
  [[0, 0], [0.1, 0.8], [0.5, 0.94], [2, 0.94], [4, 0.94], [8, 0.98], [12, 1.01], [16, 1.05], [20, 1.11], [21, 1.18], [22, 1.67], [23, 2.73]],
  knee([[0.5, 8.82], [1, 8.93], [2, 9.04], [4, 9.31], [6, 9.57], [8, 9.68], [11, 10.18], [14, 10.45], [16, 10.65], [18, 10.99], [19, 11.4], [20, 12.02], [21, 12.95], [22, 14.63]], 150),
  knee([[0.5, 16.41], [1, 16.86], [2, 17.06], [4, 17.46], [6, 17.88], [8, 18.29], [10, 18.7], [12, 19.11], [14, 19.53], [16, 19.72], [17, 20.38], [18, 21.16], [19, 22.2], [20, 23.86]], 150),
  knee([[0.5, 23.86], [1, 24.28], [2, 24.61], [4, 25.15], [6, 25.7], [8, 26.3], [10, 26.87], [12, 27.44], [14, 28.02], [15, 28.62], [16, 29.89], [17, 31.5]], 150),
  knee([[0.5, 30.75], [1, 31.69], [2, 32.18], [4, 33.04], [6, 33.91], [8, 34.77], [10, 35.6], [12, 36.45], [13, 37.05], [14, 37.98], [15, 39.59]], 150),
  knee([[0.5, 37.57], [1, 38.89], [2, 39.72], [4, 40.89], [6, 42.01], [8, 43.1], [10, 44.13], [11, 44.75], [12, 45.65], [13, 47.26]], 150),
  knee([[0.5, 43.87], [1, 45.33], [2, 46.26], [4, 47.75], [6, 49.22], [8, 50.75], [9, 51.46], [10, 52.35], [11, 53.69]], 150),
  knee([[0.5, 49.44], [1, 50.55], [2, 51.64], [4, 53.7], [6, 55.74], [8, 57.73], [9, 59.02], [10, 61.23]], 150)] });
F322.ends = [23, 22, 20, 17, 15, 13, 11, 10];
CH3.F313 = F313; CH3.F316 = F316; CH3.F322 = F322;
/* input characteristics: [V_BE (V), I (µA or mA)] read off the figure; tab() makes an engine diode of it (scale k to amperes) */
const ramp = pts => pts.map(([v, i]) => [+(v - 0.01125 * Math.max(0, Math.min(1, (i - 2) / 18))).toFixed(5), i]);
const LOW13 = [[0, 0], [0.45, 0.02], [0.5, 0.3], [0.5375, 1], [0.5716, 2], [0.5864, 3], [0.617, 5], [0.6409, 7.5], [0.6614, 10], [0.6739, 12.5]];
const IN313 = {
  1: ramp([...LOW13, [0.683, 15], [0.692, 17.5], [0.7015, 20], [0.715, 25], [0.7284, 30], [0.7409, 35], [0.7523, 40], [0.7625, 45], [0.7727, 50], [0.7909, 60], [0.8057, 70], [0.8193, 80], [0.8307, 90], [0.8398, 100], [0.8466, 110]]),
  10: ramp([...LOW13, [0.686, 15], [0.698, 17.5], [0.708, 20], [0.726, 25], [0.7466, 30], [0.7602, 35], [0.7727, 40], [0.7852, 45], [0.7966, 50], [0.8182, 60], [0.8375, 70], [0.8545, 80], [0.8682, 90], [0.8784, 100]]),
  20: ramp([...LOW13, [0.69, 15], [0.704, 17.5], [0.7145, 20], [0.737, 25], [0.7556, 30], [0.7738, 35], [0.7898, 40], [0.8057, 45], [0.8193, 50], [0.8455, 60], [0.8693, 70], [0.892, 80], [0.9023, 85]]) };
const LOW37 = [[0, 0], [0.45, 0.03], [0.5, 0.06], [0.528, 0.1], [0.5689, 0.2], [0.5879, 0.3], [0.6168, 0.5], [0.6368, 0.75], [0.6548, 1], [0.6777, 1.5], [0.6957, 2]];
const IN37 = {
  1: [...LOW37, [0.716, 2.5], [0.734, 3], [0.751, 3.5], [0.7675, 4], [0.7825, 4.5], [0.7964, 5], [0.8104, 5.5], [0.8254, 6]],
  10: [...LOW37, [0.711, 2.5], [0.7245, 3], [0.737, 3.5], [0.7486, 4], [0.7585, 4.5], [0.7665, 5], [0.7755, 5.5], [0.7845, 6], [0.7925, 6.5], [0.8014, 7], [0.8104, 7.5]],
  20: [...LOW37, [0.7055, 2.5], [0.7155, 3], [0.7245, 3.5], [0.7326, 4], [0.7396, 4.5], [0.7466, 5], [0.7525, 5.5], [0.7585, 6], [0.7645, 6.5], [0.7705, 7], [0.7765, 7.5], [0.7825, 8], [0.7885, 8.5], [0.7945, 9]] };
CH3.IN313 = IN313; CH3.IN37 = IN37;
const tab = (pts, k) => ({ model: 'table', curve: pts.map(([v, i], j) => [v, i * k + j * 1e-15]), Irev: 1e-12 });
/* Fig. 3.13 (a + b): the transistor of Example 3.2 and section A of page 3.3 */
CH3.BE313 = [1, 10, 20].map(v => ({ vce: v, ...tab(IN313[v], 1e-6) }));
CH3.Q313 = { fam: F313, be: CH3.BE313, satAt: 0.7 };
CH3.Q316 = { fam: F316, be: CH3.BE313, satAt: 0.7 };
CH3.Q322 = { fam: F322, satAt: 0.3 };
/* Fig. 3.7 with α = 0.995: the common-base transistor of page 3.2 (the common-base form of the model: the input curves give I_E; they sit at
   v_CE = V_CB + 0.75 V) */
CH3.ALPHA_CB = 0.995;
CH3.cbQ = (alpha = CH3.ALPHA_CB) => ({ alpha, vsat: 0.2, be: [1, 10, 20].map(v => ({ vce: v + 0.75, ...tab(IN37[v], 1e-3) })) });
CH3.QCB = CH3.cbQ();

/* =====================================================================================================================
   2) characteristics. Collector characteristics of a family (Figs. 3.13a, 3.16, 3.22): o = { fam, vmax, imax, xt, yt, sat (V: the shaded
   saturation strip), q: { v, i, label, side, dy, ib (A: its own curve, dashed) }, load: { vcc, rc } (Ω), segs, pts, guides, dI, dV, vl, hl,
   title, labels (false: no curve labels), muted (k → true dims curve k) } */
CH3.outPlot = (ctx, b, bd, o = {}) => {
  const fam = o.fam || F313, sh = !!(bd && bd.short), vmax = o.vmax ?? 20, imax = o.imax ?? 8, ends = fam.ends || [];
  const curves = fam.ib.map((ib, k) => { const to = Math.min(vmax, ends[k] ?? vmax), uA = Math.round(ib * 1e6);
    return { f: v => fam(ib, v).i * 1e3, to, n: 170, w: 2, color: o.muted && o.muted(k) ? 'rgba(79,179,255,.45)' : C.curve,
      label: o.labels === false || (sh && k % 2 && k !== fam.ib.length - 1) ? '' : k === 0 ? (sh ? '0' : 'I_B = 0') : `${uA} µA`, labelAt: to }; });
  if (o.q && o.q.ib !== undefined && o.q.dash !== false) curves.push({ f: v => fam(o.q.ib, v).i * 1e3, color: C.q, w: 2.4, dash: [7, 5], n: 170, to: vmax });
  const segs = [...(o.segs || [])], pts = [...(o.pts || [])], guides = [...(o.guides || [])];
  if (o.load) segs.push({ a: [0, o.load.vcc / o.load.rc * 1e3], b: [o.load.vcc, 0], color: C.chord, w: 2.2 });
  if (o.q) { pts.push({ v: o.q.v, i: o.q.i, color: C.q, label: o.q.label ?? 'Q', side: o.q.side, dy: o.q.dy }); if (o.q.guide !== false) guides.push({ v: o.q.v, i: o.q.i }); }
  return IE.ivPlot(ctx, b, { v: [0, vmax], i: [0, imax], xt: o.xt || [5, 10, 15, 20, 25].filter(x => x <= vmax), yt: o.yt || [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => i <= imax), ml: o.ml ?? 40, mr: o.mr ?? (sh ? 30 : 50),
    xl: 'V_CE (V)', yl: 'I_C (mA)', curves, segs, pts, guides, dI: o.dI, dV: o.dV, vl: o.vl, hl: o.hl,
    bands: o.sat ? [{ v1: 0, v2: o.sat, color: 'rgba(255,107,107,.13)' }] : [], title: sh ? '' : (o.title ?? '') });
};
/* input characteristics (Fig. 3.13b, I_B in µA; Fig. 3.7, I_E in mA): o = { kind: 'ce' | 'cb', vce (an extra dashed curve at this V_CE /
   V_CB), q: { v, i, label }, vmax, imax, title, lin (Fig. 3.10: 'pwl' | 'ideal' instead of the curves) } */
CH3.inPlot = (ctx, b, bd, o = {}) => {
  const sh = !!(bd && bd.short), cb = o.kind === 'cb', src = cb ? IN37 : IN313, imax = o.imax ?? (cb ? 9 : 100), keys = [1, 10, 20], cols = [C.tan, C.curve, PURPLE];
  const fOf = pts => { const f = DIODE.pchip(pts); return v => (v <= 0 ? 0 : Math.max(0, f(v).y)); };
  const curves = [], segs = [...(o.segs || [])], pts = [...(o.pts || [])], guides = [];
  if (!o.lin) keys.forEach((key, j) => { const f = fOf(src[key]), top = imax * [0.94, 0.8, 0.66][cb ? 2 - j : j];
    let lo = 0.5, hi = 1.2; for (let n = 0; n < 50; n++) { const m = (lo + hi) / 2; if (f(m) < top) lo = m; else hi = m; }
    curves.push({ f, color: cols[j], w: 2.2, n: 220, from: 0.3, to: Math.min(o.vmax ?? 1, src[key][src[key].length - 1][0] + 0.004), label: sh ? `${key} V` : `${cb ? 'V_CB' : 'V_CE'} = ${key} V`, labelAt: (lo + hi) / 2 }); });
  if (o.lin === 'pwl') segs.push({ a: [0, 0], b: [0.65, 0], color: C.tan, w: 3 }, { a: [0.65, 0], b: [0.82, imax], color: C.tan, w: 3 });
  if (o.lin === 'ideal') segs.push({ a: [0, 0], b: [0.7, 0], color: C.tan, w: 3 }, { a: [0.7, 0], b: [0.7, imax * 1.2], color: C.tan, w: 3 });
  if (o.vce !== undefined && !o.lin) { const p = cb ? CH3.QCB : { be: CH3.BE313 }, sc = cb ? 1e3 : 1e6, vc = cb ? o.vce + 0.75 : o.vce;
    curves.push({ f: v => BJT.ib(p, v, vc).i * sc, color: C.q, w: 2, dash: [6, 5], n: 220, from: 0.3, to: o.vmax ?? 1 }); }
  if (o.q) { pts.push({ v: o.q.v, i: o.q.i, color: C.q, label: o.q.label ?? 'Q', side: o.q.side ?? -1, dy: o.q.dy }); guides.push({ v: o.q.v, i: o.q.i }); }
  return IE.ivPlot(ctx, b, { v: [0, o.vmax ?? 1], i: [0, imax], xt: [0.2, 0.4, 0.6, 0.7, 0.8, 1].filter(x => x <= (o.vmax ?? 1) + 1e-9), yt: cb ? [1, 2, 3, 4, 5, 6, 7, 8] : [20, 40, 60, 80, 100],
    xl: 'V_BE (V)', yl: cb ? 'I_E (mA)' : 'I_B (µA)', curves, segs, pts, guides, ml: 40, mr: sh ? 24 : 70, title: sh ? '' : (o.title ?? '') });
};
/* common-base collector characteristics (Fig. 3.8): I_C against V_CB for I_E = 0…7 mA, the region left of 0 V on its own (wider) scale as
   the book draws it; the curves are the transistor's own (CH3.QCB through BJT.cb), sampled once, with the upswing near BV_CBO = 40 V the
   figure shows (drawn only: the circuits keep V_CB below 30 V) */
const CBC = {};
const cbCurve = IEmA => { if (CBC[IEmA]) return CBC[IEmA]; const xs = [], ys = [];
  for (let j = 0; j <= 60; j++) { const v = -1 + j / 60; xs.push(v); ys.push(BJT.cb(CH3.QCB, IEmA * 1e-3, v).IC * 1e3); }
  for (let j = 1; j <= 160; j++) { const v = j * 0.25; xs.push(v); const up = v > 32 ? (IEmA + 0.5) * 0.3 * Math.pow((v - 32) / 8, 3) : 0; ys.push(BJT.cb(CH3.QCB, IEmA * 1e-3, v).IC * 1e3 + up); }
  const f = v => { if (v <= xs[0]) return ys[0]; let k = 1; while (k < xs.length - 1 && xs[k] < v) k++; const w = (v - xs[k - 1]) / (xs[k] - xs[k - 1]); return ys[k - 1] + (ys[k] - ys[k - 1]) * Math.max(0, Math.min(1, w)); };
  return (CBC[IEmA] = f); };
CH3.cbOut = (ctx, b, bd, o = {}) => {
  const sh = !!(bd && bd.short), vmax = o.vmax ?? 40, curves = [0, 1, 2, 3, 4, 5, 6, 7].map(k => ({ f: cbCurve(k), rev: true, nr: 80, w: 2, color: C.curve, n: 200,
    label: sh && k % 2 ? '' : k === 0 ? (sh ? '0' : 'I_E = 0') : `${k} mA`, labelAt: vmax * 0.82 }));
  const pts = [...(o.pts || [])], guides = [...(o.guides || [])];
  if (o.q) { pts.push({ v: o.q.v, i: o.q.i, color: C.q, label: o.q.label ?? 'Q', side: o.q.side, dy: o.q.dy }); guides.push({ v: o.q.v, i: o.q.i, toX: o.q.v >= 0 }); }
  return IE.ivPlot(ctx, b, { v: [-1, vmax], i: [0, 8.6], negFrac: 0.12, xtNeg: [-1], xt: [10, 20, 30, 40].filter(x => x <= vmax), yt: [1, 2, 3, 4, 5, 6, 7, 8], ml: 40, mr: sh ? 26 : 52,
    xl: 'V_CB (V)', yl: 'I_C (mA)', curves, pts, guides, segs: o.segs, vl: o.vl, hl: o.hl, dI: o.dI,
    bands: [{ v1: -1, v2: 0, color: 'rgba(255,107,107,.13)' }], title: sh ? '' : (o.title ?? '') });
};

/* =====================================================================================================================
   3) circuits */
/* common emitter (Figs. 3.12a, 3.34): V_BB and R_B on the left, R_C and V_CC on the right. o = { VBB, RB, VCC, RC, q (transistor), ib (a current
   source instead of V_BB and R_B), vbe (a voltage source at the base), open (nothing at the base), vce (a voltage source instead of R_C and V_CC),
   qName, qText, pins, pnp } */
CH3.ce = (o = {}) => {
  const nodes = { vb: [0, 1.6], g1: [0, 3.4], b: [2.3, 1.6], c: [3.1, 0.75], ct: [3.1, 0], vt: [5.1, 0], g3: [5.1, 3.4], e: [3.1, 2.45], ge: [3.1, 3.4] }, parts = [], pnp = !!o.pnp;
  if (o.ib !== undefined) parts.push({ id: 'IB', type: 'I', a: pnp ? 'vb' : 'g1', b: pnp ? 'g1' : 'vb', value: o.ib, name: 'I_B', valText: CK.eng(o.ib, 'A'), side: -1 }, W_('vb', 'b'));
  else if (o.vbe !== undefined) parts.push({ id: 'VBE', type: 'V', a: pnp ? 'g1' : 'vb', b: pnp ? 'vb' : 'g1', value: o.vbe, name: 'V_BE', valText: `${fd(o.vbe, 2)} V`, side: -1 }, W_('vb', 'b'));
  else if (!o.open) parts.push({ id: 'VBB', type: 'V', a: pnp ? 'g1' : 'vb', b: pnp ? 'vb' : 'g1', value: o.VBB, name: 'V_BB', valText: `${v2(o.VBB)} V`, side: -1 },
    { id: 'RB', type: 'R', a: 'vb', b: 'b', value: o.RB, name: 'R_B', valText: CK.eng(o.RB, 'Ω') });
  parts.push({ id: 'Q', type: 'Q', C: 'c', B: 'b', E: 'e', name: o.qName ?? 'Q', valText: o.qText ?? '', pins: o.pins ?? true, ...(o.q || CH3.Q313), pnp });
  parts.push(W_('c', 'ct'));
  if (o.vce !== undefined) parts.push(W_('ct', 'vt'), { id: 'VCE', type: 'V', a: pnp ? 'g3' : 'vt', b: pnp ? 'vt' : 'g3', value: o.vce, name: 'V_CE', valText: `${v2(o.vce)} V` });
  else parts.push({ id: 'RC', type: 'R', a: 'ct', b: 'vt', value: o.RC, name: 'R_C', valText: CK.eng(o.RC, 'Ω') }, { id: 'VCC', type: 'V', a: pnp ? 'g3' : 'vt', b: pnp ? 'vt' : 'g3', value: o.VCC, name: 'V_CC', valText: `${v2(o.VCC)} V` });
  parts.push(W_('e', 'ge'), W_('g1', 'ge'), W_('ge', 'g3'));
  return { ground: 'ge', nodes, parts };
};
/* common base (Figs. 3.6, 3.11): emitter on the left (R_E and V_EE), collector on the right (R_C and V_CC), the base down to ground.
   o = { VEE, RE, VCC, RC, pnp, q, ie (a current source instead of R_E and V_EE), vcb (a voltage source instead of R_C and V_CC), qName, qText } */
CH3.cb = (o = {}) => {
  const pnp = !!o.pnp, nodes = { ve: [0, 0.6], e: [2.0, 0.6], c: [4.0, 0.6], vc: [6.0, 0.6], b: [3.0, 1.6], gb: [3.0, 2.6], eg: [0, 2.6], cg: [6.0, 2.6] }, parts = [];
  if (o.ie !== undefined) parts.push({ id: 'IE', type: 'I', a: pnp ? 'eg' : 've', b: pnp ? 've' : 'eg', value: o.ie, name: 'I_E', valText: CK.eng(o.ie, 'A'), side: -1 }, W_('ve', 'e'));
  else parts.push({ id: 'VEE', type: 'V', a: pnp ? 've' : 'eg', b: pnp ? 'eg' : 've', value: o.VEE, name: 'V_EE', valText: `${v2(o.VEE)} V`, side: -1 },
    { id: 'RE', type: 'R', a: 've', b: 'e', value: o.RE, name: 'R_E', valText: CK.eng(o.RE, 'Ω') });
  parts.push({ id: 'Q', type: 'Q', C: 'c', B: 'b', E: 'e', name: o.qName ?? 'Q', valText: o.qText ?? '', pins: o.pins ?? true, ...(o.q || CH3.QCB), pnp });
  if (o.vcb !== undefined) parts.push(W_('c', 'vc'), { id: 'VCB', type: 'V', a: pnp ? 'cg' : 'vc', b: pnp ? 'vc' : 'cg', value: o.vcb, name: 'V_CB', valText: `${v2(o.vcb)} V` });
  else parts.push({ id: 'RC', type: 'R', a: 'c', b: 'vc', value: o.RC, name: 'R_C', valText: CK.eng(o.RC, 'Ω') }, { id: 'VCC', type: 'V', a: pnp ? 'cg' : 'vc', b: pnp ? 'vc' : 'cg', value: o.VCC, name: 'V_CC', valText: `${v2(o.VCC)} V` });
  parts.push(W_('b', 'gb'), W_('eg', 'gb'), W_('gb', 'cg'));
  return { ground: 'gb', nodes, parts };
};
/* the readouts of the transistor 'Q' of a solved circuit, in mA and V (npn terms) */
CH3.q = c => { const q = c.Q('Q'); return { ...q, ib: q.IB * 1e3, ic: q.IC * 1e3, ie: q.IE * 1e3, uA: q.IB * 1e6 }; };
const REG = { cutoff: ['ย่านคัตออฟ', 'cutoff'], saturation: ['ย่านอิ่มตัว', 'saturation'], active: ['ย่านแอกทีฟ', 'active region'] };
CH3.reg = r => REG[r];

/* =====================================================================================================================
   4) the carriers of a transistor (slides pp. 6–7, Figs. 3.4–3.5). Three layers across a bar: emitter 0…0.38, base 0.38…0.5 (thin),
   collector 0.5…1 (shares of the bar). set({ vee, vcc, npn }): the emitter–base junction forward-biased by V_EE, the collector–base junction
   reverse-biased by V_CC. Majority carriers of the emitter cross the forward-biased junction; in the thin base most reach the collector junction
   and are swept across (I_C), a few recombine (the base current makes them up, I_B); without V_CC they leave through the base (Fig. 3.4a).
   Minority carriers cross the reverse-biased junction on their own (I_CO, Fig. 3.4b). The rates show the direction and the trend only. */
CH3.Carriers = class {
  constructor() { this.vee = true; this.vcc = true; this.npn = false; this.c = []; this.acc = { inj: 0, min: 0 }; this.fx = []; this.init(); }
  maj(side) { return this.npn ? (side === 'b' ? 'h' : 'e') : (side === 'b' ? 'e' : 'h'); }
  zone(side) { const w = this.w(); return side === 'e' ? [0.015, 0.38 - w.eb] : side === 'b' ? [0.38 + w.eb, 0.5 - w.cb] : [0.5 + w.cb, 0.985]; }
  w() { return { eb: this.vee ? 0.008 : 0.022, cb: this.vcc ? 0.05 : 0.022 }; }
  mk(side, kind, minority) { const [lo, hi] = this.zone(side); return { side, kind, minority: !!minority, x: lo + Math.random() * (hi - lo), y: 0.08 + Math.random() * 0.84, vx: 0, vy: 0, mode: 'roam', a: 1 }; }
  init() { this.c = []; for (let k = 0; k < 16; k++) this.c.push(this.mk('e', this.maj('e'))); for (let k = 0; k < 14; k++) this.c.push(this.mk('c', this.maj('c')));
    for (let k = 0; k < 4; k++) this.c.push(this.mk('b', this.maj('b'))); this.c.push(this.mk('b', this.maj('e'), true), this.mk('c', this.maj('b'), true)); }
  set(o) { const npn = o.npn ?? this.npn, re = npn !== this.npn; Object.assign(this, o); if (re) this.init(); }
  /* currents (illustrative, α = 0.99, I_CO = 2 µA so that it shows): mA */
  cur() { const ie = this.vee ? 1 : 0, ico = this.vcc ? 0.002 : 0, ic = this.vee && this.vcc ? 0.99 * ie + ico : ico; return { ie, ic, ib: ie - ic }; }
  step(dt) {
    if (!(dt > 0)) return; const w = this.w(), eE = 0.38 - w.eb, eB1 = 0.38 + w.eb, eB2 = 0.5 - w.cb, eC = 0.5 + w.cb, majE = this.maj('e');
    /* injection across the forward-biased emitter junction */
    if (this.vee) { this.acc.inj += dt * 7; while (this.acc.inj >= 1) { this.acc.inj -= 1; const pool = this.c.filter(q => q.mode === 'roam' && q.side === 'e' && !q.minority);
      if (pool.length) { pool.sort((a, b) => b.x - a.x); const q = pool[Math.floor(Math.random() * Math.min(4, pool.length))]; q.mode = 'inj'; q.dest = this.vcc ? (Math.random() < 0.1 ? 'rec' : 'col') : 'base'; } } }
    /* minority carriers swept across the reverse-biased collector junction */
    if (this.vcc) { this.acc.min += dt * 0.5; while (this.acc.min >= 1) { this.acc.min -= 1; const q = this.c.find(z => z.mode === 'roam' && z.minority && z.side === 'b');
      if (q) { q.mode = 'sweep'; q.dir = 1; } const z = this.c.find(r => r.mode === 'roam' && r.minority && r.side === 'c'); if (z) { z.mode = 'sweep'; z.dir = -1; } } }
    const gone = [];
    this.c.forEach(q => { q.vx += (Math.random() - 0.5) * 0.8 * dt; q.vy += (Math.random() - 0.5) * 0.8 * dt; q.vx *= 1 - Math.min(1, dt * 1.6); q.vy *= 1 - Math.min(1, dt * 1.6);
      if (q.mode === 'roam') { q.x += q.vx * dt * 1.4; q.y += q.vy * dt * 1.4; const [lo, hi] = this.zone(q.side); if (q.x < lo) { q.x = lo; q.vx = Math.abs(q.vx); } if (q.x > hi) { q.x = hi; q.vx = -Math.abs(q.vx); } }
      else if (q.mode === 'inj') { q.x += dt * 0.32; q.y += q.vy * dt;
        if (q.x > eB1 + 0.012) { if (q.dest === 'col') { q.mode = 'cross'; } else if (q.dest === 'rec') { q.mode = 'rec'; q.t = 0; } else { q.mode = 'out'; } } }
      else if (q.mode === 'cross') { q.x += dt * (q.x < eB2 ? 0.3 : 0.55); q.y += q.vy * dt; if (q.x > eC + 0.02) { q.mode = 'drift'; } }
      else if (q.mode === 'drift') { q.x += dt * 0.22; if (q.x > 0.985) gone.push(q); }
      else if (q.mode === 'out') { q.x += (0.44 - q.x) * Math.min(1, dt * 3); q.y += dt * 0.45; if (q.y > 1.02) gone.push(q); }
      else if (q.mode === 'rec') { q.t += dt; q.x += (0.44 - q.x) * Math.min(1, dt * 2); if (q.t > 0.55) { gone.push(q); this.fx.push({ x: q.x, y: q.y, t: 0 }); } }
      else if (q.mode === 'sweep') { q.x += q.dir * dt * 0.5; if (q.dir > 0 ? q.x > eC + 0.04 : q.x < eB1 - 0.0) gone.push(q); }
      if (q.y < 0.05) { q.y = 0.05; q.vy = Math.abs(q.vy); } if (q.y > 0.95 && q.mode !== 'out') { q.y = 0.95; q.vy = -Math.abs(q.vy); } });
    this.fx = this.fx.filter(f => (f.t += dt) < 0.5);
    /* every carrier that left is replaced where its kind comes from: the emitter contact, heat (minority carriers), the base contact */
    gone.forEach(q => { const i = this.c.indexOf(q); if (i >= 0) this.c.splice(i, 1);
      if (q.minority) { this.c.push(this.mk(q.side, q.kind, true)); return; }
      if (q.side === 'e') { const n = this.mk('e', majE); n.x = 0.02; this.c.push(n); }
      if (q.mode === 'drift' || q.mode === 'cross') { const keep = this.c.filter(z => z.side === 'c' && !z.minority && z.mode === 'roam'); if (keep.length > 14) { const z = keep[0]; this.c.splice(this.c.indexOf(z), 1); } } });
    this.c.forEach(q => { if (q.mode !== 'roam') return; const [lo, hi] = this.zone(q.side); if (q.x < lo) q.x = lo; if (q.x > hi) q.x = hi; });
  }
  /* draw in box b → layout { X, Y } */
  draw(ctx, b, o = {}) {
    CH6.bg(ctx, b); const sh = !!o.short, x0 = b.x + 40, x1 = b.x + b.w - 40, y0 = b.y + 64, y1 = b.y + b.h - 100, X = s => x0 + (x1 - x0) * s, Y = s => y0 + (y1 - y0) * s, w = this.w();
    const pE = this.npn ? IE.COL.nReg : IE.COL.pReg, pB = this.npn ? IE.COL.pReg : IE.COL.nReg;
    ctx.save(); ctx.fillStyle = pE; ctx.fillRect(X(0), y0, X(0.38) - X(0), y1 - y0); ctx.fillStyle = pB; ctx.fillRect(X(0.38), y0, X(0.5) - X(0.38), y1 - y0); ctx.fillStyle = pE; ctx.fillRect(X(0.5), y0, X(1) - X(0.5), y1 - y0);
    ctx.fillStyle = 'rgba(255,209,102,.12)'; ctx.fillRect(X(0.38 - w.eb), y0, X(0.38 + w.eb) - X(0.38 - w.eb), y1 - y0); ctx.fillRect(X(0.5 - w.cb), y0, X(0.5 + w.cb) - X(0.5 - w.cb), y1 - y0);
    ctx.strokeStyle = CH6.COL.axis; ctx.lineWidth = 1.5; ctx.strokeRect(X(0), y0, X(1) - X(0), y1 - y0); ctx.restore();
    const lt = this.npn ? ['n', 'p', 'n'] : ['p', 'n', 'p'], lc = this.npn ? [IE.COL.elec, IE.COL.hole, IE.COL.elec] : [IE.COL.hole, IE.COL.elec, IE.COL.hole];
    /* the layers' letters inside the bar near its top, the names of the outer layers above it (the badge sits in the top-left corner) */
    ctx.save(); ctx.globalAlpha = 0.75; [[0.19, 0], [0.44, 1], [0.75, 2]].forEach(([s, k]) => T(ctx, lt[k], X(s), y0 + 14, { color: lc[k], size: 15, weight: '700' })); ctx.restore();
    T(ctx, sh ? 'E' : t('อิมิตเตอร์ (E)', 'emitter (E)'), X(0.19), y0 - 13, { color: CH6.COL.ink, size: 12.5, weight: '600' }); T(ctx, sh ? 'C' : t('คอลเล็กเตอร์ (C)', 'collector (C)'), X(0.75), y0 - 13, { color: CH6.COL.ink, size: 12.5, weight: '600' });
    this.c.forEach(q => { const x = X(q.x), y = Y(q.y); ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, q.a));
      if (q.kind === 'h') IE.ring(ctx, x, y, 4.6, IE.COL.hole, 2); else IE.dot(ctx, x, y, 4, IE.COL.elec, q.mode !== 'roam' ? 7 : 0);
      if (q.minority) IE.ring(ctx, x, y, 9, q.kind === 'h' ? 'rgba(255,126,182,.5)' : 'rgba(90,209,255,.5)', 1.2); ctx.restore(); });
    this.fx.forEach(f => IE.ring(ctx, X(f.x), Y(f.y), 4 + f.t * 24, `rgba(255,209,102,${(0.8 * (1 - f.t / 0.5)).toFixed(3)})`, 2));
    /* terminals, the two supplies (Fig. 3.5) and the current arrows */
    const yb = y1 + 46, cu = this.cur(), lw = 2, wire = CH6.COL.axis, xe = X(0), xc = X(1), xb = X(0.44), bat = (xm, on, plusLeft, name) => {
      const xl = plusLeft ? xm - 8 : xm + 4, xs = plusLeft ? xm + 4 : xm - 8;   // the long (thin) plate on the + side, the short (thick) plate on the − side
      ctx.save(); ctx.strokeStyle = on ? wire : 'rgba(154,163,199,.35)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(xl, yb - 12); ctx.lineTo(xl, yb + 12); ctx.stroke(); ctx.lineWidth = lw * 2;
      ctx.beginPath(); ctx.moveTo(xs, yb - 6); ctx.lineTo(xs, yb + 6); ctx.stroke(); ctx.restore();
      if (on) { T(ctx, plusLeft ? '+' : '−', xm - 22, yb - 10, { color: plusLeft ? '#ff6b6b' : '#5ad1ff', size: 15, weight: '700' }); T(ctx, plusLeft ? '−' : '+', xm + 20, yb - 10, { color: plusLeft ? '#5ad1ff' : '#ff6b6b', size: 15, weight: '700' }); }
      T(ctx, on ? name : t(`${name} ปลด`, `${name} off`), xm, yb + 24, { color: on ? CH6.COL.ink : CH6.COL.muted, size: 12.5, weight: '600' }); };
    ctx.save(); ctx.strokeStyle = wire; ctx.lineWidth = lw; ctx.beginPath();
    ctx.moveTo(xe, (y0 + y1) / 2); ctx.lineTo(xe - 18, (y0 + y1) / 2); ctx.lineTo(xe - 18, yb); ctx.lineTo((xe + xb) / 2 - 8, yb); ctx.moveTo((xe + xb) / 2 + 4, yb); ctx.lineTo(xb, yb);
    ctx.moveTo(xc, (y0 + y1) / 2); ctx.lineTo(xc + 18, (y0 + y1) / 2); ctx.lineTo(xc + 18, yb); ctx.lineTo((xb + xc) / 2 + 4, yb); ctx.moveTo((xb + xc) / 2 - 8, yb); ctx.lineTo(xb, yb);
    ctx.moveTo(xb, y1); ctx.lineTo(xb, yb); ctx.stroke(); ctx.restore();
    IE.dot(ctx, xb, yb, 3.5, wire);
    /* V_EE forward-biases the emitter junction (pnp: emitter +), V_CC reverse-biases the collector junction (pnp: base +, collector −): for a pnp
       both supplies have + on the left, as Fig. 3.5 draws them; an npn has both the other way */
    bat((xe + xb) / 2, this.vee, !this.npn, 'V_EE'); bat((xb + xc) / 2, this.vcc, !this.npn, 'V_CC');
    T(ctx, 'B', xb + 10, y1 + 14, { color: CH6.COL.ink, size: 12.5, weight: '700', align: 'left' });
    /* conventional currents: a pnp's I_E enters the emitter and I_C leaves the collector; an npn's run the other way */
    const arr = (xa, ya, xz, yz, col, lab, val) => { if (val < 1e-9) return; CH6.arrow(ctx, xa, ya, xz, yz, col, 2.6); T(ctx, lab, (xa + xz) / 2, Math.min(ya, yz) - 12, { color: col, size: 12.5, weight: '700' }); };   // the values are in the panel
    const ym = (y0 + y1) / 2 - 22, d = this.npn ? -1 : 1;
    arr(d > 0 ? xe - 34 : xe - 6, ym, d > 0 ? xe - 6 : xe - 34, ym, C.q, 'I_E', cu.ie); arr(d > 0 ? xc + 6 : xc + 34, ym, d > 0 ? xc + 34 : xc + 6, ym, C.q, 'I_C', cu.ic);
    if (cu.ib > 1e-6) { const ya = y1 + 6, yz = y1 + 30; CH6.arrow(ctx, xb - 14, d > 0 ? ya : yz, xb - 14, d > 0 ? yz : ya, C.q, 2.2); T(ctx, `I_B ${fd(cu.ib, 3)} mA`, xb - 20, y1 + 18, { color: C.q, size: 12, weight: '700', align: 'right' }); }
    if (cu.ib < -1e-6) T(ctx, `I_B = −I_CO`, xb - 20, y1 + 18, { color: C.q, size: 12, weight: '700', align: 'right' });
    return { X, Y };
  }
};

/* =====================================================================================================================
   5) the problems */
const LAY = { pad: 1.2, wideAt: 1e9, cktAspM: 0.52, rowAsp: 0.66, rowMin: 270, dotSpeed: 80, view: { acPeak: false, minV: 7 }, shortSpec: sp => CH8.margins(sp, 1.2),
  vo: () => ({ speed: 80 / 0.004, dotRef: 0.004 }) };   // a fixed dot scale: 4 mA = 80 px/s; a base current still crawls (minV)
const CBL = { ...LAY, cktAspM: 0.44 };   // the common-base circuit is wide and low
const DEF = {}, SIMPLE = { model: 'simple', vk: 0.7 };
CH3.LAY = LAY; CH3.SIMPLE = SIMPLE;
/* the three currents of the transistor (mA); o: { title, d (decimals), pnp } */
const qbars = (ctx, b, bd, c, o = {}) => { const q = CH3.q(c), sh = bd.short, p = !!o.pnp;
  CH8.bars(ctx, b, [{ label: 'I_E', v: q.ie, color: C.q, sub: sh ? '' : p ? t('เข้า E', 'into E') : t('ออกจาก E', 'out of E') }, { label: 'I_C', v: q.ic, color: C.curve, sub: sh ? '' : p ? t('ออกจาก C', 'out of C') : t('เข้า C', 'into C') },
    { label: 'I_B', v: q.ib, color: C.tan, sub: sh ? '' : p ? t('ออกจาก B', 'out of B') : t('เข้า B', 'into B') }],
    { title: o.title ?? (sh ? t('กระแส (mA)', 'currents (mA)') : t('กระแส (mA): I_E = I_C + I_B', 'currents (mA): I_E = I_C + I_B')), fmt: v => fd(v, o.d ?? 3), sub: !sh }); };
CH3.qbars = qbars;
const bdg = (th, en, ok = true) => [[th, en ?? th], ok ? 'ok' : 'wait'];

/* ---------------- page 3.1: Problem 9 (I_E = I_C + I_B) ---------------- */
const E9 = CH3.cb({ ie: 0.008, vcb: 5, q: { beta: 100, be: SIMPLE }, qText: 'β = 100' });
DEF.p9 = { ...CBL, solvedAt: 2, spec: () => E9,
  glow: k => (k === 1 ? ['Q'] : k === 2 ? ['IE'] : null),
  badge: k => (k >= 3 ? bdg('I_E = I_C + I_B = 7.921 + 0.079 = 8 mA') : k === 2 ? bdg('I_C = 8 mA/1.01 = 7.921 mA') : bdg('I_E = 8 mA, I_B = I_C/100', null, false)),
  side: (ctx, b, bd, k, s) => (k >= 2 ? qbars(ctx, b, bd, s.ckt) : CH8.empty(ctx, b, t('เปิดขั้นที่ 2 เพื่อดูกระแสทั้งสาม', 'open step 2 to see the three currents'))),
  steps: () => [
    step(t('<b>กฎกระแสของเคียร์ชอฟฟ์</b> (Kirchhoff\'s current law): มองทรานซิสเตอร์ทั้งตัวเป็นโหนดเดียว กระแสที่ไหลเข้าเท่ากับกระแสที่ไหลออก (สไลด์หน้า 7, สมการ 3.1) ทรานซิสเตอร์ npn ในภาพมี \\(I_C\\) และ \\(I_B\\) ไหลเข้า และ \\(I_E\\) ไหลออก',
      '<b>Kirchhoff\'s current law</b>: take the whole transistor as one node; what flows in flows out (slide p. 7, Eq. 3.1). The npn transistor here has \\(I_C\\) and \\(I_B\\) flowing in and \\(I_E\\) flowing out'),
      block([R`I_E &= I_C + I_B`])),
    step(t('<b>แทน \\(I_B = I_C/100\\)</b> แล้วแก้หา \\(I_C\\)', '<b>Substitute \\(I_B = I_C/100\\)</b> and solve for \\(I_C\\)'),
      block([R`8\ \text{mA} &= I_C + \frac{I_C}{100} = 1.01I_C`, R`I_C &= \frac{8\ \text{mA}}{1.01} = \boxed{7.921\ \text{mA}}`])),
    step(t('<b>กระแสเบส</b> และตรวจผลรวม (แผงข้างภาพ)', '<b>The base current</b>, and a check of the sum (side panel)'),
      block([R`I_B &= \frac{I_C}{100} = \frac{7.921\ \text{mA}}{100} = \boxed{79.21\ \mu\text{A}}`, R`I_C + I_B &= 7.921 + 0.079 = 8\ \text{mA}\ \ \checkmark`]),
      t('กระแสอิมิตเตอร์มากที่สุด กระแสเบสน้อยที่สุด (ระดับไมโครแอมแปร์) และ \\(I_C\\) ใกล้กับ \\(I_E\\) มาก (สรุปข้อ 4 ของตำรา) · อัตราส่วน \\(I_C/I_B\\) = 100 คือเบตา (β) ของหน้า 3.3 ทรานซิสเตอร์ในภาพจำลองจึงตั้ง β = 100',
        'The emitter current is the largest, the base current the smallest (microamperes), and \\(I_C\\) is very close to \\(I_E\\) (the book\'s summary, point 4). The ratio \\(I_C/I_B\\) = 100 is the beta (β) of page 3.3, so the simulated transistor has β = 100.'))],
  ask: () => ({ fields: [num('I<sub>C</sub> (mA) =', 7.921, { tol: 0.01 }), num('I<sub>B</sub> (µA) =', 79.21, { tol: 0.3 })],
    check: v => (near(v[0], 8, 0.005) ? t('8 mA คือ I<sub>E</sub> ไม่ใช่ I<sub>C</sub>: I<sub>C</sub> น้อยกว่า I<sub>E</sub> อยู่เท่ากับ I<sub>B</sub>', '8 mA is I<sub>E</sub>, not I<sub>C</sub>: I<sub>C</sub> is less than I<sub>E</sub> by I<sub>B</sub>.') : '') }),
  answer: () => t('\\(I_C = 7.921\\) mA, \\(I_B = 79.21\\) µA (Boylestad บทที่ 3 ข้อ 9)', '\\(I_C = 7.921\\) mA, \\(I_B = 79.21\\) µA (Boylestad, chapter 3, problem 9).') };

/* ---------------- page 3.2: Example 3.1 (reading Figs. 3.7, 3.8 and 3.10c) ---------------- */
const E31 = { a: CH3.cb({ ie: 0.003, vcb: 10 }), b: CH3.cb({ ie: 0.003, vcb: 2 }), c: CH3.cb({ ie: 0.004 / CH3.ALPHA_CB, vcb: 20 }),
  d: CH3.cb({ ie: 0.004 / CH3.ALPHA_CB, vcb: 20, q: { alpha: CH3.ALPHA_CB, vsat: 0.2, be: SIMPLE } }) };
CH3.E31 = E31;
DEF.ex31 = { ...CBL, solvedAt: 1, spec: k => (k <= 1 ? E31.a : k === 2 ? E31.b : k === 3 ? E31.c : E31.d),
  glow: k => (k >= 3 ? ['Q'] : k >= 1 ? ['VCB'] : null),
  badge: (k, s) => { const q = CH3.q(s.ckt); return k >= 3 ? bdg(`V_BE = ${fd(q.VBE, k === 4 ? 2 : 3)} V ${k === 4 ? '(รูป 3.10c)' : '(รูป 3.7)'}`, `V_BE = ${fd(q.VBE, k === 4 ? 2 : 3)} V ${k === 4 ? '(Fig. 3.10c)' : '(Fig. 3.7)'}`)
    : k >= 1 ? bdg(`I_C = ${fd(q.ic, 3)} mA ≅ I_E = 3 mA`) : bdg('I_E = 3 mA, V_CB = 10 V: I_C = ?', null, false); },
  side: (ctx, b, bd, k, s) => { const q = CH3.q(s.ckt);
    if (k <= 2) return CH3.cbOut(ctx, b, bd, { q: k >= 1 ? { v: q.VCB, i: q.ic, label: bd.short ? 'Q' : `${fd(q.ic, 3)} mA`, side: 1, dy: 16 } : null, title: t('ลักษณะสมบัติด้านออก (รูป 3.8)', 'output characteristics (Fig. 3.8)') });
    return CH3.inPlot(ctx, b, bd, { kind: 'cb', lin: k === 4 ? 'ideal' : undefined, q: { v: q.VBE, i: q.ie, label: `${fd(q.VBE, k === 4 ? 2 : 3)} V`, side: k === 4 ? 1 : -1 },
      title: k === 4 ? t('รูป 3.10c: V_BE = 0.7 V เมื่อทรานซิสเตอร์นำ', 'Fig. 3.10c: V_BE = 0.7 V once on') : t('ลักษณะสมบัติด้านเข้า (รูป 3.7)', 'input characteristics (Fig. 3.7)') }); },
  steps: () => [
    step(t('<b>(a)</b> อ่านรูป 3.8: เส้น \\(I_E\\) = 3 mA ที่ \\(V_{CB}\\) = 10 V อยู่ในย่านแอกทีฟ (รอยต่อเบส–อิมิตเตอร์ไบแอสตรง รอยต่อคอลเล็กเตอร์–เบสไบแอสกลับ) ซึ่งเส้นแทบราบ (สมการ 3.3)',
      '<b>(a)</b> Read Fig. 3.8: the \\(I_E\\) = 3 mA curve at \\(V_{CB}\\) = 10 V is in the active region (base–emitter junction forward-biased, collector–base junction reverse-biased), where the curves are almost flat (Eq. 3.3)'),
      block([R`I_C &\cong I_E = \boxed{3\ \text{mA}}`]), t('ทรานซิสเตอร์ในภาพจำลองมี α = 0.995 จึงได้ 2.985 mA ซึ่งบนกราฟอ่านได้ 3 mA', 'The simulated transistor has α = 0.995 and gives 2.985 mA, which reads as 3 mA on the graph.')),
    step(t('<b>(b)</b> ลด \\(V_{CB}\\) เหลือ 2 V: ยังอยู่ทางขวาของ 0 V ในย่านแอกทีฟ เส้นราบ ผลของ \\(V_{CB}\\) แทบไม่มี',
      '<b>(b)</b> Reduce \\(V_{CB}\\) to 2 V: still right of 0 V, in the active region, where the curve is flat and \\(V_{CB}\\) has almost no effect'),
      block([R`I_C &\cong \boxed{3\ \text{mA}}`]), t('กระแสคอลเล็กเตอร์ลดลงเมื่อ \\(V_{CB}\\) ต่ำกว่า 0 V ไปราว −0.5 V เท่านั้น (ย่านอิ่มตัว แถบสีแดงทางซ้ายของรูป ซึ่งขยายสเกลแนวนอนไว้)', 'The collector current falls only once \\(V_{CB}\\) goes below 0 V to about −0.5 V (the saturation region, the red strip on the left of the figure, whose horizontal scale is expanded).')),
    step(t('<b>(c)</b> จากรูป 3.8 \\(I_E \\cong I_C\\) = 4 mA แล้วอ่านรูป 3.7 ที่เส้น \\(V_{CB}\\) = 20 V', '<b>(c)</b> From Fig. 3.8, \\(I_E \\cong I_C\\) = 4 mA; then read Fig. 3.7 on the \\(V_{CB}\\) = 20 V curve'),
      block([R`V_{BE} &\cong \boxed{0.74\ \text{V}}`]), t('ตำราอ่านได้ "about 0.74 V" เส้นที่อ่านจากรูปในภาพจำลองให้ 0.733 V · สังเกตว่าเส้นของ \\(V_{CB}\\) สามค่าแทบทับกัน ผลของ \\(V_{CB}\\) ต่อด้านเข้าจึงละได้ในการประมาณ', 'The book reads "about 0.74 V"; the curve read off the figure in the simulation gives 0.733 V. The curves for the three \\(V_{CB}\\) nearly coincide, so the effect of \\(V_{CB}\\) on the input can be ignored to a first approximation.')),
    step(t('<b>(d)</b> ใช้รูป 3.10c (แบบจำลองเส้นตรงที่ตัดความชันทิ้ง): ทรานซิสเตอร์ที่นำมี \\(V_{BE}\\) = 0.7 V ทุกค่าของ \\(I_E\\) (สไลด์หน้า 10, สมการ 3.4)',
      '<b>(d)</b> Use Fig. 3.10c (the straight-line model without its slope): a transistor that conducts has \\(V_{BE}\\) = 0.7 V at any \\(I_E\\) (slide p. 10, Eq. 3.4)'),
      block([R`V_{BE} &= \boxed{0.7\ \text{V}}`]), t('ต่างจากข้อ (c) ราว 0.04 V ซึ่งน้อยมากเมื่อแรงดันในวงจรเป็นหลายโวลต์ แบบจำลองนี้ใช้ตลอดการวิเคราะห์ไฟตรงในบทที่ 4 (ภาพจำลองเปลี่ยนรอยต่อเบส–อิมิตเตอร์เป็นแบบ 0.7 V)', 'About 0.04 V from part (c), very little when the circuit voltages are several volts. This model is used for all the dc analysis of chapter 4 (the simulation switches the base–emitter junction to the 0.7 V model).'))],
  ask: () => ({ fields: [num('(a) I<sub>C</sub> (mA) =', 3, { tol: 0.03 }), num('(b) I<sub>C</sub> (mA) =', 3, { tol: 0.03 }), num('(c) V<sub>BE</sub> (V) =', 0.74, { tol: 0.015 }), num('(d) V<sub>BE</sub> (V) =', 0.7, { tol: 0.005 })] }),
  answer: () => t('(a) 3 mA (b) 3 mA (c) ประมาณ 0.74 V (d) 0.7 V ตาม Boylestad Example 3.1', '(a) 3 mA (b) 3 mA (c) about 0.74 V (d) 0.7 V, as in Boylestad Example 3.1.') };

/* ---------------- page 3.2: Problem 15 (α) ---------------- */
const A15 = (2.75e-3 - 1e-7) / 2.8e-3, QA = { alpha: 0.998, vsat: 0.2, be: SIMPLE };
const E15 = { a: CH3.cb({ ie: 0.004, vcb: 10, q: QA, qText: 'α = 0.998' }), b: CH3.cb({ ie: 0.0028, vcb: 10, q: { alpha: A15, icbo: 1e-7, vsat: 0.2, be: SIMPLE }, qText: 'I_CBO = 0.1 µA' }),
  c: CH3.cb({ ie: 0.005, vcb: 10, q: QA, qText: 'α = 0.998' }) };
CH3.A15 = A15;
DEF.alpha = { ...CBL, solvedAt: 1, spec: k => (k === 2 ? E15.b : k === 3 ? E15.c : E15.a),
  glow: k => (k >= 1 ? ['IE'] : null),
  badge: (k, s) => { const q = CH3.q(s.ckt); return k >= 1 ? bdg(`α = I_C/I_E = ${fd(q.ic, 4)}/${fd(q.ie, 1)} = ${fd(q.ic / q.ie, 4)}`) : bdg('α_dc = 0.998, I_E = 4 mA: I_C = ?', null, false); },
  side: (ctx, b, bd, k, s) => qbars(ctx, b, bd, s.ckt, { d: 4 }),
  steps: () => [
    step(t('<b>(a)</b> นิยามของแอลฟาแบบไฟตรง (สไลด์หน้า 10, สมการ 3.5) แล้วแก้หา \\(I_C\\)', '<b>(a)</b> The definition of the dc alpha (slide p. 10, Eq. 3.5), solved for \\(I_C\\)'),
      block([R`\alpha_{dc} &= \frac{I_C}{I_E}\ \Rightarrow\ I_C = \alpha_{dc}I_E = (0.998)(4\ \text{mA}) = \boxed{3.992\ \text{mA}}`]), t('ส่วนที่เหลือคือกระแสเบส \\(I_B = I_E - I_C\\) = 8 µA', 'What is left is the base current, \\(I_B = I_E - I_C\\) = 8 µA.')),
    step(t('<b>(b)</b> รวมกระแสรั่วไหลของรอยต่อคอลเล็กเตอร์ (สมการ 3.6): \\(I_C = \\alpha I_E + I_{CBO}\\) เพราะแอลฟานิยามจากพาหะข้างมากเท่านั้น', '<b>(b)</b> Include the leakage current of the collector junction (Eq. 3.6), \\(I_C = \\alpha I_E + I_{CBO}\\), since alpha is defined for the majority carriers only'),
      block([R`\alpha_{dc} &= \frac{I_C - I_{CBO}}{I_E} = \frac{2.75\ \text{mA} - 0.0001\ \text{mA}}{2.8\ \text{mA}} = \boxed{0.9821}`]),
      t('ถ้าไม่คิด \\(I_{CBO}\\) จะได้ 2.75/2.8 = 0.98214 ต่างกันที่หลักที่ห้า: \\(I_{CBO}\\) = 0.1 µA เล็กมากเมื่อเทียบกับระดับมิลลิแอมแปร์ ตำราจึงมักไม่คิด (แต่จะสำคัญเมื่ออุณหภูมิสูง)', 'Without \\(I_{CBO}\\): 2.75/2.8 = 0.98214, different in the fifth digit. \\(I_{CBO}\\) = 0.1 µA is tiny next to milliamperes, which is why it is usually ignored (it matters at high temperatures).')),
    step(t('<b>แอลฟาแบบไฟสลับ</b> (สมการ 3.7): เมื่อจุดทำงานเลื่อนบนเส้นลักษณะสมบัติ ใช้อัตราส่วนของการเปลี่ยนแปลงที่ \\(V_{CB}\\) คงที่ เช่นทรานซิสเตอร์ของข้อ (a) เมื่อ \\(I_E\\) เพิ่มจาก 4 เป็น 5 mA (ภาพจำลอง)',
      '<b>The ac alpha</b> (Eq. 3.7): when the operating point moves along the characteristics, take the ratio of the changes at a fixed \\(V_{CB}\\); e.g. the transistor of part (a) with \\(I_E\\) raised from 4 to 5 mA (simulation)'),
      block([R`\alpha_{ac} &= \left.\frac{\Delta I_C}{\Delta I_E}\right|_{V_{CB}} = \frac{4.990 - 3.992}{5 - 4} = 0.998`]),
      t('ทรานซิสเตอร์ในภาพจำลองมีแอลฟาคงที่ \\(\\alpha_{ac}\\) จึงเท่ากับ \\(\\alpha_{dc}\\) ในทรานซิสเตอร์จริงสองค่านี้ใกล้กันมากจนใช้แทนกันได้ (ตำรา หัวข้อ 3.4) แอลฟาของอุปกรณ์จริงอยู่ราว 0.90–0.998', 'The simulated transistor has a fixed alpha, so \\(\\alpha_{ac}\\) equals \\(\\alpha_{dc}\\); in real transistors the two are close enough to be used for each other (book, section 3.4). Practical alphas run from about 0.90 to 0.998.'))],
  ask: () => ({ fields: [num('(a) I<sub>C</sub> (mA) =', 3.992, { tol: 0.0015 }), num('(b) α<sub>dc</sub> =', A15, { tol: 0.0002, w: 6 })] }),
  answer: () => t('(a) \\(I_C\\) = 3.992 mA (b) \\(\\alpha_{dc}\\) = 0.9821 (Boylestad บทที่ 3 ข้อ 15)', '(a) \\(I_C\\) = 3.992 mA (b) \\(\\alpha_{dc}\\) = 0.9821 (Boylestad, chapter 3, problem 15).') };

/* ---------------- page 3.2: transistor amplifying action (an earlier edition; contents slide p. 2) ---------------- */
CH3.ampSpec = () => ({ ground: 'g', nodes: { vi: [0, 0.6], ei: [2.4, 0.6], g: [0, 2.6], gi: [2.4, 2.6], fo: [3.8, 2.6], ft: [3.8, 0.6], ro: [6.0, 0.6], rg: [6.0, 2.6] },
  parts: [{ id: 'Vi', type: 'V', a: 'vi', b: 'g', value: 0.2, wave: 'sine', name: 'V_i', valText: '200 mV', side: -1 }, { id: 'Ri', type: 'R', a: 'vi', b: 'ei', value: 20, name: 'R_i', valText: '20 Ω' },
    W_('ei', 'gi'), W_('g', 'gi'), { id: 'F', type: 'F', a: 'fo', b: 'ft', gain: 1, ctrl: 'Ri', name: 'αI_i', valText: 'α = 1', side: -1 }, W_('ft', 'ro'),
    { id: 'RL', type: 'R', a: 'ro', b: 'rg', value: 5000, name: 'R', valText: '5 kΩ' }, W_('rg', 'fo'), W_('gi', 'fo')] });
const EAMP = CH3.ampSpec();
DEF.amp = { ...CBL, solvedAt: 1, vo: () => ({ speed: 80 / 0.01, dotRef: 0.01 }), spec: () => EAMP,
  glow: k => (k === 1 ? ['Ri'] : k === 2 ? ['F', 'RL'] : null),
  badge: (k, s) => (k >= 3 ? bdg('A_v = V_L/V_i = 50 V/0.2 V = 250') : k === 2 ? bdg('I_L = 10 mA, V_L = 50 V') : k === 1 ? bdg('I_i = 200 mV/20 Ω = 10 mA') : bdg('V_i = 200 mV: V_L = ?', null, false)),
  side: (ctx, b, bd, k, s) => { const c = s.ckt, Vi = 0.2, VL = c.Vab('RL').re;
    CH8.bars(ctx, b, [{ label: 'I_i', v: c.I('Ri').re * 1e3, color: C.q, sub: 'mA' }, { label: 'I_L', v: c.I('RL').re * 1e3, color: C.curve, sub: 'mA' }],
      { title: bd.short ? t('กระแส (mA)', 'currents (mA)') : t(`กระแส (mA) · V_L/V_i = ${fd(VL, 1)}/${fd(Vi, 1)} = ${fd(VL / Vi, 0)}`, `currents (mA) · V_L/V_i = ${fd(VL, 1)}/${fd(Vi, 1)} = ${fd(VL / Vi, 0)}`), fmt: v => fd(v, 2), sub: !bd.short }); },
  steps: () => [
    step(t('<b>ด้านเข้า</b>: รอยต่อเบส–อิมิตเตอร์ไบแอสตรง ความต้านทานไฟสลับด้านเข้าของวงจรเบสร่วมจึงต่ำ (10–100 Ω ตามลักษณะสมบัติรูป 3.7) ใช้ 20 Ω',
      '<b>The input</b>: the base–emitter junction is forward-biased, so the ac input resistance of a common-base stage is low (10–100 Ω from the characteristics of Fig. 3.7); take 20 Ω'),
      block([R`I_i &= \frac{V_i}{R_i} = \frac{200\ \text{mV}}{20\ \Omega} = \boxed{10\ \text{mA}}`])),
    step(t('<b>ด้านออก</b>: รอยต่อคอลเล็กเตอร์–เบสไบแอสกลับ ความต้านทานด้านออกสูงมาก (50 kΩ – 1 MΩ ตามรูป 3.8) ทรานซิสเตอร์จึงเป็นแหล่งจ่ายกระแส \\(\\alpha I_i\\) ให้โหลด สมมติ \\(\\alpha_{ac}\\) = 1',
      '<b>The output</b>: the collector–base junction is reverse-biased, so the output resistance is very high (50 kΩ – 1 MΩ from Fig. 3.8) and the transistor acts as a current source \\(\\alpha I_i\\) into the load; take \\(\\alpha_{ac}\\) = 1'),
      block([R`I_L &= I_i = \boxed{10\ \text{mA}}`, R`V_L &= I_LR = (10\ \text{mA})(5\ \text{k}\Omega) = \boxed{50\ \text{V}}`])),
    step(t('<b>อัตราขยายแรงดัน</b>', '<b>The voltage amplification</b>'),
      block([R`A_v &= \frac{V_L}{V_i} = \frac{50\ \text{V}}{200\ \text{mV}} = \boxed{250}`]),
      t('กระแสไม่ได้ขยาย (\\(I_C/I_E = \\alpha\\) < 1 เสมอในวงจรเบสร่วม) แต่กระแสเดิมถูกย้ายจากวงจรความต้านทานต่ำไปยังวงจรความต้านทานสูง: <b>trans</b>fer + re<b>sistor</b> → <b>transistor</b> อัตราขยายแรงดันของวงจรเบสร่วมจริงอยู่ราว 50–300',
        'The current is not amplified (\\(I_C/I_E = \\alpha\\) < 1 always in common base), but the same current is transferred from a low-resistance to a high-resistance circuit: <b>trans</b>fer + re<b>sistor</b> → <b>transistor</b>. Practical common-base voltage gains run from about 50 to 300.'))],
  ask: () => ({ fields: [num('I<sub>i</sub> (mA) =', 10), num('V<sub>L</sub> (V) =', 50), num('A<sub>v</sub> =', 250)] }),
  answer: () => t('\\(I_i = I_L\\) = 10 mA, \\(V_L\\) = 50 V, \\(A_v\\) = 250 (หัวข้อ Transistor Amplifying Action ของ Boylestad ฉบับพิมพ์ก่อนหน้า)', '\\(I_i = I_L\\) = 10 mA, \\(V_L\\) = 50 V, \\(A_v\\) = 250 (the "Transistor amplifying action" section of earlier editions of Boylestad).') };

/* ---------------- page 3.3: Example 3.2 (reading Fig. 3.13) ---------------- */
const E32 = { a: CH3.ce({ ib: 30e-6, vce: 10 }), b: CH3.ce({ vbe: 0.7, vce: 15 }) };
CH3.E32 = E32;
DEF.ex32 = { ...LAY, solvedAt: 1, spec: k => (k <= 1 ? E32.a : E32.b),
  glow: k => (k === 1 ? ['IB', 'VCE'] : k >= 2 ? ['VBE', 'VCE'] : null),
  badge: (k, s) => { const q = CH3.q(s.ckt); return k >= 3 ? bdg(`I_B = ${fd(q.uA, 1)} µA → I_C = ${fd(q.ic, 2)} mA`) : k === 2 ? bdg(`V_BE = 0.7 V, V_CE = 15 V → I_B = ${fd(q.uA, 1)} µA`)
    : k === 1 ? bdg(`I_C = ${fd(q.ic, 2)} mA`) : bdg('I_B = 30 µA, V_CE = 10 V: I_C = ?', null, false); },
  side: (ctx, b, bd, k, s) => { const q = CH3.q(s.ckt), on = k === 1 || k >= 3;
    CH3.outPlot(ctx, b, bd, { sat: 0.7, q: on ? { v: q.VCE, i: q.ic, label: `${fd(q.ic, 2)} mA`, side: -1 } : null, vl: on ? [{ v: q.VCE }] : [], title: t('ลักษณะสมบัติด้านออก (รูป 3.13a)', 'collector characteristics (Fig. 3.13a)') }); },
  waves: [{ draw: (ctx, b, bd, k, s) => { const q = CH3.q(s.ckt);
    CH3.inPlot(ctx, b, bd, { vce: k >= 2 ? 15 : undefined, q: k >= 2 ? { v: q.VBE, i: q.uA, label: `${fd(q.uA, 1)} µA` } : null, title: t('ลักษณะสมบัติด้านเข้า (รูป 3.13b)', 'base characteristics (Fig. 3.13b)') }); } }],
  steps: () => [
    step(t('<b>(a)</b> บนลักษณะสมบัติด้านออก (รูป 3.13a) หาจุดตัดของเส้น \\(I_B\\) = 30 µA กับเส้นแนวตั้ง \\(V_{CE}\\) = 10 V แล้วลากไปอ่านที่แกน \\(I_C\\)',
      '<b>(a)</b> On the collector characteristics (Fig. 3.13a), find where the \\(I_B\\) = 30 µA curve meets the vertical line \\(V_{CE}\\) = 10 V, then read across to the \\(I_C\\) axis'),
      block([R`I_C &\cong \boxed{3.4\ \text{mA}}`]), t('ภาพจำลองใช้เส้นที่อ่านจากรูป ได้ 3.41 mA', 'The simulation uses the curves read off the figure: 3.41 mA.')),
    step(t('<b>(b) ขั้นที่ 1</b>: \\(V_{BE}\\) ให้มาจึงเริ่มที่ลักษณะสมบัติด้านเข้า (รูป 3.13b) \\(V_{CE}\\) = 15 V อยู่ระหว่างเส้น 10 V และ 20 V (เส้นประ) ที่ \\(V_{BE}\\) = 0.7 V',
      '<b>(b) Step 1</b>: \\(V_{BE}\\) is given, so start on the base characteristics (Fig. 3.13b). \\(V_{CE}\\) = 15 V lies between the 10 V and 20 V curves (dashed), at \\(V_{BE}\\) = 0.7 V'),
      block([R`I_B &\cong 20\ \mu\text{A}`]), t('ตำราอ่านได้ 20 µA เส้นในภาพจำลองเลื่อนให้ผ่านค่านี้ (รูปให้ราว 18 µA ซึ่งต่างกันไม่ถึง 0.012 V ในแนวนอน)', 'The book reads 20 µA; the simulated curves are moved to pass this reading (the figure gives about 18 µA, less than 0.012 V apart horizontally).')),
    step(t('<b>(b) ขั้นที่ 2</b>: กลับไปที่รูป 3.13a หาจุดตัดของเส้น \\(I_B\\) = 20 µA กับ \\(V_{CE}\\) = 15 V', '<b>(b) Step 2</b>: back on Fig. 3.13a, where the \\(I_B\\) = 20 µA curve meets \\(V_{CE}\\) = 15 V'),
      block([R`I_C &\cong \boxed{2.5\ \text{mA}}`]), t('อุปกรณ์สามขาต้องใช้ลักษณะสมบัติสองชุด (สรุปข้อ 7 ของตำรา): ชุดด้านเข้าโยง \\(V_{BE}\\) กับ \\(I_B\\) ชุดด้านออกโยง \\(I_B\\) และ \\(V_{CE}\\) กับ \\(I_C\\)', 'A three-terminal device needs two sets of characteristics (the book\'s summary, point 7): the input set ties \\(V_{BE}\\) to \\(I_B\\), the output set ties \\(I_B\\) and \\(V_{CE}\\) to \\(I_C\\).'))],
  ask: () => ({ fields: [num('(a) I<sub>C</sub> (mA) =', 3.4, { tol: 0.06 }), num('(b) I<sub>B</sub> (µA) =', 20, { tol: 1.2 }), num('(b) I<sub>C</sub> (mA) =', 2.5, { tol: 0.06 })] }),
  answer: () => t('(a) \\(I_C \\cong\\) 3.4 mA (b) \\(I_B \\cong\\) 20 µA และ \\(I_C \\cong\\) 2.5 mA ตาม Boylestad Example 3.2', '(a) \\(I_C \\cong\\) 3.4 mA (b) \\(I_B \\cong\\) 20 µA and \\(I_C \\cong\\) 2.5 mA, as in Boylestad Example 3.2.') };

/* ---------------- page 3.3: β_ac and β_dc from Fig. 3.16 (slide p. 14) ---------------- */
const B16 = { 20: CH3.ce({ ib: 20e-6, vce: 7.5, q: CH3.Q316 }), 25: CH3.ce({ ib: 25e-6, vce: 7.5, q: CH3.Q316 }), 30: CH3.ce({ ib: 30e-6, vce: 7.5, q: CH3.Q316 }) };
const IC16 = { 20: F316(20e-6, 7.5).i * 1e3, 25: F316(25e-6, 7.5).i * 1e3, 30: F316(30e-6, 7.5).i * 1e3 };
CH3.IC16 = IC16;
DEF.beta = { ...LAY, solvedAt: 1, rowAsp: 0.72, spec: k => (k === 1 ? B16[20] : k === 2 ? B16[30] : B16[25]),
  glow: k => (k >= 1 ? ['IB'] : null),
  badge: (k, s) => (k >= 4 ? bdg(`β_dc = 2.7 mA/25 µA = 108`) : k === 3 ? bdg('β_ac = 1 mA/10 µA = 100') : k === 2 ? bdg('I_B2 = 30 µA → I_C2 = 3.2 mA') : k === 1 ? bdg('I_B1 = 20 µA → I_C1 = 2.2 mA') : bdg('Q: I_B = 25 µA, V_CE = 7.5 V', null, false)),
  side: (ctx, b, bd, k) => { const pts = [], sh = bd.short;
    if (k >= 1) pts.push({ v: 7.5, i: IC16[20], color: C.tan, label: sh ? 'I_C1' : `I_C1 = ${fd(IC16[20], 2)} mA`, side: -1, dy: -16 });
    if (k >= 2) pts.push({ v: 7.5, i: IC16[30], color: C.tan, label: sh ? 'I_C2' : `I_C2 = ${fd(IC16[30], 2)} mA`, side: -1, dy: 16 });
    CH3.outPlot(ctx, b, bd, { fam: F316, vmax: 25, imax: 9, sat: 0.7, pts, vl: [{ v: 7.5, label: sh ? '' : 'V_CE = 7.5 V' }], hl: k >= 1 ? [{ i: IC16[20], color: 'rgba(126,231,135,.5)' }].concat(k >= 2 ? [{ i: IC16[30], color: 'rgba(126,231,135,.5)' }] : []) : [],
      dI: k >= 3 ? [{ i1: IC16[20], i2: IC16[30], at: 3.6, label: 'ΔI_C', color: C.tan, left: true }] : [],
      q: k === 0 || k >= 4 ? { v: 7.5, i: IC16[25], ib: 25e-6, label: sh ? 'Q' : `Q: ${fd(IC16[25], 2)} mA`, side: 1, dy: 16, guide: k >= 4 } : null,
      title: t('รูป 3.16: I_B = 25 µA (เส้นประ), V_CE = 7.5 V', 'Fig. 3.16: I_B = 25 µA (dashed), V_CE = 7.5 V') }); },
  steps: () => [
    step(t('<b>β แบบไฟสลับ</b> หาที่ \\(V_{CE}\\) คงที่ (สมการ 3.11): ลากเส้นแนวตั้งผ่านจุด Q ที่ \\(V_{CE}\\) = 7.5 V แล้วเลือกเส้น \\(I_B\\) สองเส้นที่ห่างจากจุด Q ใกล้เคียงกันทั้งสองข้าง คือ 20 µA และ 30 µA (สไลด์หน้า 14) จุดตัดล่าง:',
      '<b>The ac beta</b> is found at a fixed \\(V_{CE}\\) (Eq. 3.11): draw the vertical line through Q at \\(V_{CE}\\) = 7.5 V and pick two \\(I_B\\) curves about equally far either side of Q, 20 µA and 30 µA (slide p. 14). The lower crossing:'),
      block([R`I_{B_1} = 20\ \mu\text{A}:\ &I_{C_1} \cong 2.2\ \text{mA}`])),
    step(t('จุดตัดบน', 'The upper crossing'), block([R`I_{B_2} = 30\ \mu\text{A}:\ &I_{C_2} \cong 3.2\ \text{mA}`])),
    step(t('<b>β<sub>ac</sub></b> = อัตราส่วนของการเปลี่ยนแปลง', '<b>β<sub>ac</sub></b> is the ratio of the changes'),
      block([R`\beta_{ac} &= \left.\frac{\Delta I_C}{\Delta I_B}\right|_{V_{CE}} = \frac{I_{C_2} - I_{C_1}}{I_{B_2} - I_{B_1}} = \frac{3.2 - 2.2\ \text{mA}}{30 - 20\ \mu\text{A}} = \frac{1\ \text{mA}}{10\ \mu\text{A}} = \boxed{100}`]),
      t('สัญญาณไฟสลับที่เบสจะทำให้กระแสคอลเล็กเตอร์เปลี่ยนราว 100 เท่า', 'An ac signal at the base changes the collector current about 100 times as much.')),
    step(t('<b>β แบบไฟตรง</b> ที่จุด Q (สมการ 3.10)', '<b>The dc beta</b> at Q (Eq. 3.10)'),
      block([R`\beta_{dc} &= \frac{I_C}{I_B} = \frac{2.7\ \text{mA}}{25\ \mu\text{A}} = \boxed{108}`]),
      t('สองค่าไม่เท่ากันแต่ใกล้กัน จึงมักใช้แทนกันได้ (สไลด์หน้า 13 · ในข้อมูลจำเพาะ \\(\\beta_{dc} = h_{FE}\\), \\(\\beta_{ac} = h_{fe}\\)) ถ้าเส้นลักษณะสมบัติเป็นอย่างรูป 3.17 คือราบและห่างเท่ากันทุกที่ (2 mA ต่อ 10 µA) จะได้ \\(\\beta_{ac} = \\beta_{dc}\\) = 200 ทุกจุด เพราะ \\(I_{CEO}\\) = 0',
        'Not equal but close, so they are often used for each other (slide p. 13; on data sheets \\(\\beta_{dc} = h_{FE}\\) and \\(\\beta_{ac} = h_{fe}\\)). With characteristics like Fig. 3.17, flat and equally spaced everywhere (2 mA per 10 µA), \\(\\beta_{ac} = \\beta_{dc}\\) = 200 at every point, because \\(I_{CEO}\\) = 0.'))],
  ask: () => ({ fields: [num('β<sub>ac</sub> =', 100, { tol: 3 }), num('β<sub>dc</sub> =', 108, { tol: 3 })],
    check: v => (near(v[0], 108, 3) && near(v[1], 100, 3) ? t('สลับกัน: β<sub>ac</sub> ใช้การเปลี่ยนแปลง ΔI<sub>C</sub>/ΔI<sub>B</sub> ส่วน β<sub>dc</sub> ใช้ค่าที่จุด Q', 'Swapped: β<sub>ac</sub> uses the changes ΔI<sub>C</sub>/ΔI<sub>B</sub>, β<sub>dc</sub> the values at Q.') : '') }),
  answer: () => t('\\(\\beta_{ac}\\) = 100, \\(\\beta_{dc}\\) = 108 (Boylestad หัวข้อ 3.5 รูป 3.16)', '\\(\\beta_{ac}\\) = 100, \\(\\beta_{dc}\\) = 108 (Boylestad, section 3.5, Fig. 3.16).') };

/* ---------------- page 3.3: α and β, and I_CEO (slide p. 15; Problem 24; Eqs. 3.8–3.9) ---------------- */
const E24 = { a: CH3.ce({ ib: 2e-3 / 120, vce: 10, q: { beta: 120, be: SIMPLE }, qText: 'β = 120' }), d: CH3.ce({ open: true, vce: 10, q: { beta: 249, iceo: 0.25e-3, be: SIMPLE }, qText: 'α = 0.996' }) };
DEF.ab = { ...LAY, solvedAt: 3, spec: k => (k >= 4 ? E24.d : E24.a),
  glow: k => (k === 3 ? ['IB'] : k >= 4 ? ['Q'] : null),
  badge: (k, s) => { const q = CH3.q(s.ckt); return k >= 4 ? bdg(`I_B = 0: I_C = I_CEO = ${fd(q.ic, 3)} mA`) : k === 3 ? bdg(`I_B = ${fd(q.uA, 2)} µA, I_E = ${fd(q.ie, 4)} mA`) : bdg('α = β/(β + 1), β = α/(1 − α)', null, false); },
  side: (ctx, b, bd, k, s) => (k >= 3 ? qbars(ctx, b, bd, s.ckt, { d: 4 }) : CH8.empty(ctx, b, t('ขั้นที่ 3 ใช้ทรานซิสเตอร์ β = 120 ที่ I_C = 2 mA', 'step 3 uses a transistor with β = 120 at I_C = 2 mA'))),
  steps: () => [
    step(t('<b>ความสัมพันธ์ของ α และ β</b> (สไลด์หน้า 15): จาก \\(\\beta = I_C/I_B\\) ได้ \\(I_B = I_C/\\beta\\) และจาก \\(\\alpha = I_C/I_E\\) ได้ \\(I_E = I_C/\\alpha\\) แทนใน \\(I_E = I_C + I_B\\) แล้วหารด้วย \\(I_C\\)',
      '<b>Relating α and β</b> (slide p. 15): \\(\\beta = I_C/I_B\\) gives \\(I_B = I_C/\\beta\\) and \\(\\alpha = I_C/I_E\\) gives \\(I_E = I_C/\\alpha\\); put them in \\(I_E = I_C + I_B\\) and divide by \\(I_C\\)'),
      block([R`\frac{I_C}{\alpha} &= I_C + \frac{I_C}{\beta}\ \Rightarrow\ \frac{1}{\alpha} = 1 + \frac{1}{\beta}`, R`\alpha &= \frac{\beta}{\beta + 1}\ \ (3.12)`, R`\beta &= \frac{\alpha}{1 - \alpha}\ \ (3.13)`])),
    step(t('<b>(a)</b> \\(\\alpha_{dc}\\) = 0.980 <b>(b)</b> \\(\\beta_{dc}\\) = 120', '<b>(a)</b> \\(\\alpha_{dc}\\) = 0.980 <b>(b)</b> \\(\\beta_{dc}\\) = 120'),
      block([R`\text{(a)}\ \beta_{dc} &= \frac{0.980}{1 - 0.980} = \frac{0.98}{0.02} = \boxed{49}`, R`\text{(b)}\ \alpha &= \frac{120}{121} = \boxed{0.9917}`]),
      t('α ใกล้ 1 เพียงเล็กน้อยก็ทำให้ β เปลี่ยนมาก: α = 0.99 ให้ β = 99 แต่ α = 0.995 ให้ β = 199', 'A small change of α near 1 moves β a lot: α = 0.99 gives β = 99, but α = 0.995 gives β = 199.')),
    step(t('<b>(c)</b> \\(\\beta_{dc}\\) = 120 และ \\(I_C\\) = 2.0 mA (สมการ 3.15–3.16 · ภาพจำลอง)', '<b>(c)</b> \\(\\beta_{dc}\\) = 120 and \\(I_C\\) = 2.0 mA (Eqs. 3.15–3.16; simulation)'),
      block([R`I_B &= \frac{I_C}{\beta} = \frac{2\ \text{mA}}{120} = \boxed{16.67\ \mu\text{A}}`, R`I_E &= I_C + I_B = (\beta + 1)I_B = \boxed{2.0167\ \text{mA}}`])),
    step(t('<b>(d) \\(I_{CEO}\\)</b>: เปิดวงจรขาเบส (\\(I_B\\) = 0) แทน \\(I_E = I_C + I_B\\) ใน \\(I_C = \\alpha I_E + I_{CBO}\\) (สมการ 3.8–3.9) ด้วย α = 0.996 และ \\(I_{CBO}\\) = 1 µA',
      '<b>(d) \\(I_{CEO}\\)</b>: open the base (\\(I_B\\) = 0) and put \\(I_E = I_C + I_B\\) in \\(I_C = \\alpha I_E + I_{CBO}\\) (Eqs. 3.8–3.9), with α = 0.996 and \\(I_{CBO}\\) = 1 µA'),
      block([R`I_C &= \frac{\alpha I_B}{1 - \alpha} + \frac{I_{CBO}}{1 - \alpha}`, R`I_{CEO} &= \frac{I_{CBO}}{1 - 0.996} = 250I_{CBO} = \boxed{0.25\ \text{mA}}`, R`I_{CEO} &= (\beta + 1)I_{CBO} \cong \beta I_{CBO}\ \ (3.14)`]),
      t('กระแสรั่วไหลของรอยต่อคอลเล็กเตอร์ถูกขยายด้วย β+1 จึงเห็นเป็นเส้น \\(I_B\\) = 0 ที่ลอยเหนือแกนในรูป 3.13a (ราว 0.3 mA) ในวงจรอิมิตเตอร์ร่วม ย่านคัตออฟสำหรับการขยายสัญญาณจึงนิยามที่ \\(I_C = I_{CEO}\\)', 'The leakage of the collector junction is multiplied by β + 1, which is why the \\(I_B\\) = 0 curve of Fig. 3.13a floats above the axis (about 0.3 mA). In common emitter, cutoff for amplification is therefore defined at \\(I_C = I_{CEO}\\).'))],
  ask: () => ({ fields: [num('(a) β<sub>dc</sub> =', 49, { tol: 0.1 }), num('(b) α =', 120 / 121, { tol: 0.0002, w: 6 }), num('(d) I<sub>CEO</sub> (mA) =', 0.25, { tol: 0.002 })] }),
  answer: () => t('(a) 49 (b) 0.9917 (c) \\(I_B\\) = 16.67 µA, \\(I_E\\) = 2.0167 mA (d) \\(I_{CEO}\\) = 0.25 mA (Boylestad บทที่ 3 ข้อ 24 และตัวอย่างในหัวข้อ 3.5)', '(a) 49 (b) 0.9917 (c) \\(I_B\\) = 16.67 µA, \\(I_E\\) = 2.0167 mA (d) \\(I_{CEO}\\) = 0.25 mA (Boylestad, chapter 3, problem 24, and the example of section 3.5).') };

/* ---------------- page 3.4: limits of operation (Fig. 3.22, Eqs. 3.17–3.18) ---------------- */
/* I_B that puts a family's transistor at I_C (mA) and V_CE (V): bisection */
CH3.ibFor = (fam, ic, vce) => { let lo = 0, hi = 150e-6; for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2; if (fam(m, vce).i * 1e3 < ic) lo = m; else hi = m; } return (lo + hi) / 2; };
/* the characteristics with the limits drawn on: I_Cmax, BV_CEO, the P_Cmax hyperbola, V_CEsat, I_CEO, the region outside shaded.
   o = { fam, lim: { icmax (mA), bv (V), pc (mW), vsat (V), iceo (mA) }, vmax, imax, q, pts, segs, load, title, labels } */
CH3.limPlot = (ctx, b, bd, o = {}) => {
  const L = o.lim, sh = bd.short, vmax = o.vmax ?? 22, imax = o.imax ?? 62, RED = 'rgba(255,107,107,.85)';
  const P = CH3.outPlot(ctx, b, bd, { fam: o.fam || F322, vmax, imax, xt: o.xt || [5, 10, 15, 20].filter(x => x <= vmax), yt: o.yt || (imax > 20 ? [10, 20, 30, 40, 50, 60].filter(i => i <= imax) : undefined),
    sat: L.vsat, q: o.q, pts: o.pts, segs: o.segs, load: o.load, labels: o.labels, title: o.title,
    hl: [{ i: L.icmax, color: RED, label: sh ? 'I_Cmax' : `I_Cmax = ${L.icmax} mA` }, { i: L.iceo, color: 'rgba(255,107,107,.55)' }], vl: [{ v: L.bv, color: RED, label: sh ? 'BV_CEO' : `BV_CEO = ${L.bv} V` }] });
  /* the P_Cmax curve, and the shading of what lies beyond the limits (above I_Cmax, right of BV_CEO, above the curve) */
  const { X, Y } = P; ctx.save(); ctx.beginPath(); ctx.rect(P.L, P.Tp - 6, P.R - P.L, P.yz - P.Tp + 6); ctx.clip();
  ctx.fillStyle = 'rgba(255,107,107,.08)'; ctx.beginPath(); ctx.moveTo(X(0), Y(imax * 1.1)); ctx.lineTo(X(0), Y(L.icmax));
  for (let j = 0; j <= 120; j++) { const v = L.pc / L.icmax + (L.bv - L.pc / L.icmax) * j / 120; ctx.lineTo(X(v), Y(Math.min(L.icmax, L.pc / v))); }
  ctx.lineTo(X(L.bv), Y(0)); ctx.lineTo(X(vmax * 1.1), Y(0)); ctx.lineTo(X(vmax * 1.1), Y(imax * 1.1)); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 2.4; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.rect(P.L, P.Tp - 6, P.R - P.L, P.yz - P.Tp + 6); ctx.clip(); ctx.beginPath();
  for (let j = 0; j <= 160; j++) { const v = L.pc / imax + (vmax - L.pc / imax) * j / 160, y = Y(L.pc / v); j ? ctx.lineTo(X(v), y) : ctx.moveTo(X(v), y); } ctx.stroke(); ctx.restore();
  if (!sh) { const v = Math.min(L.bv * 0.82, vmax * 0.7); CH8.lab(ctx, `P_Cmax = ${L.pc} mW`, X(v) + 6, Y(L.pc / v) - 12, 'left', RED, 12, b, '700'); }
  return P; };
const LIM322 = { icmax: 50, bv: 20, pc: 300, vsat: 0.3, iceo: 1 }, LIM28 = { icmax: 6, bv: 15, pc: 35, vsat: 0.7, iceo: 0.3 };
CH3.LIM322 = LIM322; CH3.LIM28 = LIM28;
const PC = [[6, 50], [20, 15], [12, 25]].map(([v, i]) => ({ v, i, spec: CH3.ce({ ib: CH3.ibFor(F322, i, v), vce: v, q: CH3.Q322 }) }));
DEF.pc = { ...LAY, solvedAt: 1, rowAsp: 0.72, vo: () => ({ speed: 80 / 0.03, dotRef: 0.03 }), spec: k => PC[Math.max(0, Math.min(2, k - 1))].spec,
  glow: k => (k >= 1 && k <= 3 ? ['VCE'] : null),
  badge: (k, s) => { const q = CH3.q(s.ckt); return k >= 1 ? bdg(`V_CE I_C = ${fd(q.VCE, 1)} V × ${fd(q.ic, 1)} mA = ${fd(q.VCE * q.ic, 0)} mW`) : bdg('P_Cmax = 300 mW, I_Cmax = 50 mA, BV_CEO = 20 V', null, false); },
  side: (ctx, b, bd, k, s) => { const q = CH3.q(s.ckt), pts = PC.slice(0, Math.min(3, k)).map((p, j) => ({ v: p.v, i: p.i, color: C.tan, r: 5.5, label: bd.short ? '' : `(${p.v} V, ${p.i} mA)`, side: j === 1 ? -1 : 1, dy: j === 1 ? 18 : 16 }));
    CH3.limPlot(ctx, b, bd, { lim: LIM322, pts, q: k >= 1 ? { v: q.VCE, i: q.ic, label: '', guide: true } : null, title: t('รูป 3.22: ย่านทำงานเชิงเส้น (ไม่แรเงา)', 'Fig. 3.22: the linear region (unshaded)') }); },
  steps: () => [
    step(t('<b>เส้นกำลังสูงสุด</b> (สมการ 3.17): ทุกจุดบนเส้นมี \\(V_{CE}I_C\\) = 300 mW เลือก \\(I_C = I_{C\\max}\\) = 50 mA', '<b>The maximum-power curve</b> (Eq. 3.17): every point on it has \\(V_{CE}I_C\\) = 300 mW. Take \\(I_C = I_{C\\max}\\) = 50 mA'),
      block([R`V_{CE} &= \frac{300\ \text{mW}}{50\ \text{mA}} = \boxed{6\ \text{V}}`])),
    step(t('เลือก \\(V_{CE} = BV_{CEO}\\) = 20 V', 'Take \\(V_{CE} = BV_{CEO}\\) = 20 V'), block([R`I_C &= \frac{300\ \text{mW}}{20\ \text{V}} = \boxed{15\ \text{mA}}`])),
    step(t('เลือกกลางช่วง \\(I_C = \\tfrac12 I_{C\\max}\\) = 25 mA', 'Take the middle, \\(I_C = \\tfrac12 I_{C\\max}\\) = 25 mA'), block([R`V_{CE} &= \frac{300\ \text{mW}}{25\ \text{mA}} = \boxed{12\ \text{V}}`]),
      t('สามจุดพอร่างเส้นโค้งได้คร่าว ๆ ยิ่งมีจุดมาก เส้นยิ่งแม่น', 'Three points are enough for a rough sketch of the curve; more points make it more accurate.')),
    step(t('<b>ย่านทำงานเชิงเส้น</b> (สไลด์หน้า 19, สมการ 3.18): ถ้าไม่มีเส้นลักษณะสมบัติ ให้ตรวจ \\(I_C\\), \\(V_{CE}\\) และผลคูณ ทรานซิสเตอร์ของรูป 3.22 มี \\(V_{CE\\text{sat}}\\) = 0.3 V และ \\(I_{CEO}\\) ราว 1 mA (เส้น \\(I_B\\) = 0)',
      '<b>The linear region</b> (slide p. 19, Eq. 3.18): with no characteristics at hand, check \\(I_C\\), \\(V_{CE}\\) and their product. The transistor of Fig. 3.22 has \\(V_{CE\\text{sat}}\\) = 0.3 V and \\(I_{CEO}\\) about 1 mA (the \\(I_B\\) = 0 curve)'),
      block([R`I_{CEO} \le\ &I_C \le I_{C\max}:\ 1\ \text{mA} \le I_C \le 50\ \text{mA}`, R`V_{CE\text{sat}} \le\ &V_{CE} \le V_{CE\max}:\ 0.3\ \text{V} \le V_{CE} \le 20\ \text{V}`, R`&V_{CE}I_C \le P_{C\max} = 300\ \text{mW}`]))],
  ask: () => ({ fields: [num(t('V<sub>CE</sub> ที่ I<sub>Cmax</sub> (V) =', 'V<sub>CE</sub> at I<sub>Cmax</sub> (V) ='), 6), num(t('I<sub>C</sub> ที่ 20 V (mA) =', 'I<sub>C</sub> at 20 V (mA) ='), 15), num(t('V<sub>CE</sub> ที่ 25 mA (V) =', 'V<sub>CE</sub> at 25 mA (V) ='), 12)] }),
  answer: () => t('(6 V, 50 mA), (20 V, 15 mA), (12 V, 25 mA) ตาม Boylestad หัวข้อ 3.7 รูป 3.22', '(6 V, 50 mA), (20 V, 15 mA), (12 V, 25 mA), as in Boylestad section 3.7, Fig. 3.22.') };

/* ---------------- page 3.4: Problem 28 (the region for Fig. 3.13) ---------------- */
const P28 = [[35 / 6, 6], [15, 35 / 15], [35 / 3, 3]].map(([v, i]) => ({ v, i, spec: CH3.ce({ ib: CH3.ibFor(F313, i, v), vce: v, q: CH3.Q313 }) }));
DEF.p28 = { ...LAY, solvedAt: 1, rowAsp: 0.72, spec: k => P28[Math.max(0, Math.min(2, k - 1))].spec,
  glow: k => (k >= 1 && k <= 3 ? ['VCE'] : null),
  badge: (k, s) => { const q = CH3.q(s.ckt); return k >= 1 ? bdg(`V_CE I_C = ${fd(q.VCE, 2)} V × ${fd(q.ic, 2)} mA = ${fd(q.VCE * q.ic, 1)} mW`) : bdg('I_Cmax = 6 mA, BV_CEO = 15 V, P_Cmax = 35 mW', null, false); },
  side: (ctx, b, bd, k, s) => { const q = CH3.q(s.ckt), pts = P28.slice(0, Math.min(3, k)).map((p, j) => ({ v: p.v, i: p.i, color: C.tan, r: 5.5, label: bd.short ? '' : `(${fd(p.v, 2)} V, ${fd(p.i, 2)} mA)`, side: j === 1 ? -1 : 1, dy: j === 1 ? 18 : 16 }));
    CH3.limPlot(ctx, b, bd, { fam: F313, lim: LIM28, vmax: 20, imax: 8, xt: [5, 10, 15, 20], yt: [1, 2, 3, 4, 5, 6, 7, 8], pts, q: k >= 1 ? { v: q.VCE, i: q.ic, label: '', guide: true } : null, labels: !bd.short,
      title: t('รูป 3.13a กับขีดจำกัดของข้อ 28', 'Fig. 3.13a with the limits of problem 28') }); },
  steps: () => [
    step(t('ที่ \\(I_C = I_{C\\max}\\) = 6 mA (สมการ 3.17)', 'At \\(I_C = I_{C\\max}\\) = 6 mA (Eq. 3.17)'), block([R`V_{CE} &= \frac{35\ \text{mW}}{6\ \text{mA}} = \boxed{5.83\ \text{V}}`])),
    step(t('ที่ \\(V_{CE} = BV_{CEO}\\) = 15 V', 'At \\(V_{CE} = BV_{CEO}\\) = 15 V'), block([R`I_C &= \frac{35\ \text{mW}}{15\ \text{V}} = \boxed{2.33\ \text{mA}}`])),
    step(t('อีกหนึ่งจุดกลางช่วง ที่ \\(I_C\\) = 3 mA', 'One more point in between, at \\(I_C\\) = 3 mA'), block([R`V_{CE} &= \frac{35\ \text{mW}}{3\ \text{mA}} = 11.67\ \text{V}`])),
    step(t('<b>ขอบล่างและขอบซ้าย</b> อ่านจากรูป 3.13a: เส้น \\(I_B\\) = 0 อยู่ที่ราว 0.3 mA (\\(I_{CEO}\\)) และแถบอิ่มตัวสิ้นสุดที่ราว 0.7 V (\\(V_{CE\\text{sat}}\\)) ย่านทำงานจึงเป็น',
      '<b>The lower and left edges</b> come from Fig. 3.13a: the \\(I_B\\) = 0 curve lies at about 0.3 mA (\\(I_{CEO}\\)) and the saturation strip ends at about 0.7 V (\\(V_{CE\\text{sat}}\\)). The region of operation is'),
      block([R`0.3\ \text{mA} \le\ &I_C \le 6\ \text{mA}`, R`0.7\ \text{V} \le\ &V_{CE} \le 15\ \text{V}`, R`&V_{CE}I_C \le 35\ \text{mW}`]),
      t('ส่วนบนของเส้น 70–90 µA อยู่เหนือขีดจำกัดทั้งหมด ทรานซิสเตอร์นี้จึงใช้ได้จริงเพียงส่วนล่างของชุดเส้นในรูป', 'The upper part of the 70–90 µA curves lies beyond the limits, so only the lower part of the family in the figure can be used.'))],
  ask: () => ({ fields: [num(t('V<sub>CE</sub> ที่ 6 mA (V) =', 'V<sub>CE</sub> at 6 mA (V) ='), 35 / 6, { tol: 0.02 }), num(t('I<sub>C</sub> ที่ 15 V (mA) =', 'I<sub>C</sub> at 15 V (mA) ='), 35 / 15, { tol: 0.01 })] }),
  answer: () => t('ขอบกำลัง: (5.83 V, 6 mA) ถึง (15 V, 2.33 mA) · ย่าน 0.3 mA ≤ \\(I_C\\) ≤ 6 mA, 0.7 V ≤ \\(V_{CE}\\) ≤ 15 V, \\(V_{CE}I_C\\) ≤ 35 mW (Boylestad บทที่ 3 ข้อ 28)', 'The power edge runs from (5.83 V, 6 mA) to (15 V, 2.33 mA); the region is 0.3 mA ≤ \\(I_C\\) ≤ 6 mA, 0.7 V ≤ \\(V_{CE}\\) ≤ 15 V, \\(V_{CE}I_C\\) ≤ 35 mW (Boylestad, chapter 3, problem 28).') };

/* ---------------- page 3.4: Problem 26 (common collector, an emitter follower) ---------------- */
/* the base driven by v_i = 4 V dc + 2 V rms; R_E = 1 kΩ to ground; the junction carries 52.63 Ω (seen from the emitter: r = 52.63(β + 1) on the
   base current) so that its ac voltage is the problem's 0.1 V rms */
CH3.ccSpec = (vs = 4) => ({ ground: 'ge', nodes: { sb: [0, 1.25], g1: [0, 3.8], b: [2.3, 1.25], c: [3.1, 0.4], ct: [3.1, 0], vt: [5.1, 0], g3: [5.1, 3.8], e: [3.1, 2.1], ge: [3.1, 3.8] },
  parts: [{ id: 'VS', type: 'V', a: 'sb', b: 'g1', value: vs, wave: 'sine', name: 'v_i', valText: '', side: -1 }, W_('sb', 'b'),
    { id: 'Q', type: 'Q', C: 'c', B: 'b', E: 'e', beta: 100, be: { model: 'pwl', vk: 0.7, r: 52.63 * 101 }, name: 'Q', valText: '', pins: true }, W_('c', 'ct'), W_('ct', 'vt'),
    { id: 'VCC', type: 'V', a: 'vt', b: 'g3', value: 12, name: 'V_CC', valText: '12 V' }, { id: 'RE', type: 'R', a: 'e', b: 'ge', value: 1000, name: 'R_E', valText: '1 kΩ', side: -1 }, W_('g1', 'ge'), W_('ge', 'g3')] });
const VM26 = 2 * Math.SQRT2, VB26 = 4, vi26 = ph => VB26 + VM26 * Math.sin(ph), ECC = CH3.ccSpec(VB26);
let CY26 = null;
CH3.cy26 = () => CY26 || (CY26 = CH2.cycle(ECC, 'VS', vi26, { vi: c => c.V('b').re, vo: c => c.V('e').re, ie: c => c.I('RE').re * 1e3 }, 360));
DEF.cc = { ...LAY, solvedAt: 1, rowAsp: 0.5, rowMin: 230, spec: () => ECC, tick: (dt, s) => CH2.drive(s.ckt, 'VS', vi26(s.B.clk.ph)),
  glow: k => (k === 1 ? ['Q'] : k === 3 ? ['RE'] : null),
  badge: k => (k >= 2 ? bdg('A_v = 1.9 V/2 V = 0.95') : k === 1 ? bdg('V_o = V_i − V_be = 1.9 V rms') : bdg('V_i = 2 V rms, V_be = 0.1 V rms', null, false)),
  waves: [{ title: (bd, k) => (bd.short ? '' : t('แรงดันเบส v_i และแรงดันอิมิตเตอร์ v_o (ไฟตรง + ไฟสลับ)', 'base voltage v_i and emitter voltage v_o (dc + ac)')),
    sigs: (bd, k) => { const cy = CH3.cy26(); return CH2.wsigs(cy, { mag: 7.5, label: 'v_o', fill: 'rgba(255,209,102,.10)' }); } }],
  steps: () => [
    step(t('<b>ตัวตามแรงดันที่อิมิตเตอร์</b> (emitter follower, วงจรคอลเล็กเตอร์ร่วม รูป 3.21): ขาออกที่อิมิตเตอร์ตามแรงดันเบส โดยต่ำกว่าเท่ากับแรงดันคร่อมรอยต่อเบส–อิมิตเตอร์ ใช้ค่า rms ของส่วนไฟสลับ',
      '<b>The emitter follower</b> (common collector, Fig. 3.21): the output at the emitter follows the base voltage, lower by the voltage across the base–emitter junction. In rms values of the ac parts:'),
      block([R`V_o &= V_i - V_{be} = 2\ \text{V} - 0.1\ \text{V} = 1.9\ \text{V}`])),
    step(t('<b>อัตราขยายแรงดัน</b>', '<b>The voltage amplification</b>'), block([R`A_v &= \frac{V_o}{V_i} = \frac{1.9\ \text{V}}{2\ \text{V}} = \boxed{0.95}`]),
      t('อัตราขยายน้อยกว่า 1 เล็กน้อย ประโยชน์ของวงจรนี้คือความต้านทานด้านเข้าสูงและด้านออกต่ำ ใช้จับคู่อิมพีแดนซ์ (impedance matching, สไลด์หน้า 17)', 'A gain a little below 1: the point of this circuit is its high input and low output impedance, used for impedance matching (slide p. 17).')),
    step(t('<b>กระแสอิมิตเตอร์</b> (ส่วนไฟสลับ, rms)', '<b>The emitter current</b> (its ac part, rms)'), block([R`I_e &= \frac{V_o}{R_E} = \frac{1.9\ \text{V}}{1\ \text{k}\Omega} = \boxed{1.9\ \text{mA}}`]),
      t('ทรานซิสเตอร์ในภาพจำลองให้รอยต่อเบส–อิมิตเตอร์มีความต้านทาน 52.6 Ω (มองจากอิมิตเตอร์) เพื่อให้แรงดันไฟสลับคร่อมรอยต่อเป็น 0.1 V rms ตามที่โจทย์สมมติ แรงดันไฟตรงคร่อมรอยต่อจึงเป็นราว 0.87 V แทน 0.7 V ส่วนเบสไบแอสไฟตรงไว้ที่ 4 V เพื่อให้ทรานซิสเตอร์นำตลอดคาบ',
        'The simulated transistor gives its base–emitter junction 52.6 Ω (seen from the emitter) so that the ac voltage across it is the 0.1 V rms the problem assumes; its dc voltage is then about 0.87 V instead of 0.7 V. The base is biased at 4 V dc so that the transistor conducts throughout the cycle.'))],
  ask: () => ({ fields: [num('A<sub>v</sub> =', 0.95, { tol: 0.003 }), num('I<sub>e</sub> (mA rms) =', 1.9, { tol: 0.01 })] }),
  answer: () => t('\\(A_v\\) = 0.95, \\(I_e\\) = 1.9 mA rms (Boylestad บทที่ 3 ข้อ 26)', '\\(A_v\\) = 0.95, \\(I_e\\) = 1.9 mA rms (Boylestad, chapter 3, problem 26).') };

CH3.DEF = DEF;
CH3.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);

global.CH3 = CH3;
})(window);
