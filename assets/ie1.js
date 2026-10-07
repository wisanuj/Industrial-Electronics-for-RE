/* ie1.js — chapter 1 (semiconductor diodes): the textbook curves, the circuits and the worked problems, shared by the pages and tests.html.
   Sources: course slides "Chapter 1 Semiconductor Diodes" (61 pp.) and Boylestad & Nashelsky, Electronic Devices and Circuit Theory, 11th ed., ch. 1.
   Curves are in volts and milliamperes (IE.curve / IE.logCurve); the engine gets them as model 'table' diodes (IE.tableOf).
     F124  Fig. 1.24 (slides 46–48, Ex.1 = Example 1.3): digitized from the slide picture (pixel by pixel), forced through the book's readings
           0.5 V at 2 mA and 0.8 V at 20 mA; reverse current 1 µA (the book reads −1 µA at −10 V)
     F127  Fig. 1.27 (slides 51–53, Ex.2 = Example 1.4): built so that its slopes are those of the book's two tangent lines: 4 mA/0.11 V
           (36.4 mA/V) at (0.7 V, 2 mA) and 10 mA/0.02 V (500 mA/V) at (0.79 V, 25 mA). Below 2 mA an exponential with that slope; above, the
           slope rises as s = s1 + (s2 − s1)(1 − (1 − u)^p), u = (I − 2)/23, p found so that V(25 mA) = 0.79 V exactly; above 25 mA,
           r_d = 26 mV/I + r_B with r_B = 0.96 Ω (so r_d keeps falling instead of staying at 2 Ω). The book's first tangent
           (0.65 V, 0 mA)–(0.76 V, 4 mA) passes 0.705 V at 2 mA, so it is parallel to the curve's tangent 5 mV away, not exactly on it; the
           pchip table the engine uses gives about 36.9 mA/V at Q (the digitized figure is close but its tangents would not be the book's)
     F128  Fig. 1.28 (slides 54–55, average ac resistance): digitized, forced through the book's 0.65 V at 2 mA and 0.725 V at 17 mA
     F118  Fig. 1.18 (Example 1.2): Ge, Si and GaAs through the book's readings at 1, 4 and 30 mA, smooth in ln I
   CH1.DEF: ideal (page 1.1), shock, mats, temp (1.4), ex1, ex2, avg (1.5), models (1.6) · CH1.problem(n, key) wires a section like CH8.wire */
(function (global) {
'use strict';
const CH1 = {}, COL = CH6.COL, fd = CH6.fd, R = String.raw, C = IE.COL;
const t = (th, en) => MC.t(th, en);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o });

/* ---------------- the curves ---------------- */
CH1.F124 = IE.curve([[0, 0], [0.1, 0.05], [0.2, 0.2], [0.3, 0.46], [0.35, 0.7], [0.4, 0.98], [0.45, 1.38], [0.5, 2.0], [0.55, 2.85], [0.6, 4.0], [0.65, 5.9],
  [0.7, 8.7], [0.75, 13.6], [0.8, 20.0], [0.85, 27.2], [0.9, 34.5]], 1e-3);
CH1.F127 = (() => { const s1 = 4 / 0.11, s2 = 10 / 0.02, a = 2 / s1;
  /* the slope (mA/V) rises from s1 at 2 mA to exactly s2 at 25 mA and stays there: s = s1 + (s2 − s1)(1 − (1 − u)^p), u = (I − 2)/23 */
  const slope = (I, p) => (I >= 25 ? s2 : s1 + (s2 - s1) * (1 - Math.pow(1 - (I - 2) / 23, p)));
  /* above 25 mA the slope keeps rising as in a real diode: r_d = 26 mV/I + r_B, r_B = 2 Ω − 26 mV/25 mA = 0.96 Ω (Eq. 1.7), 2 Ω at 25 mA */
  const rB = 1000 / s2 - 26 / 25;
  const vAt = (I, p) => { if (I > 25) return vAt(25, p) + (26 * Math.log(I / 25) + rB * (I - 25)) / 1000; const n = 600, h = (I - 2) / n; let s = 0; for (let k = 0; k <= n; k++) s += (k === 0 || k === n ? 1 : k % 2 ? 4 : 2) / slope(2 + k * h, p); return 0.7 + s * h / 3; };
  let lo = 1.0001, hi = 60; for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2; if (vAt(25, m) > 0.79) lo = m; else hi = m; } const p = (lo + hi) / 2, off = 2 * Math.exp(-0.7 / a), pts = [];
  for (let v = 0; v < 0.7 - 1e-9; v += v < 0.5 ? 0.02 : 0.004) pts.push([+v.toFixed(4), Math.max(0, 2 * Math.exp((v - 0.7) / a) - off)]);
  for (let I = 2; I <= 42 + 1e-9; I += I < 5 ? 0.1 : 0.5) pts.push([vAt(I, p), +I.toFixed(3)]);
  const f = IE.curve(pts, 1e-5); f.p = p; f.s1 = s1; f.s2 = s2; f.rB = rB; return f; })();
CH1.F128 = IE.curve([[0, 0], [0.3, 0.02], [0.4, 0.08], [0.45, 0.16], [0.5, 0.3], [0.55, 0.52], [0.6, 1.0], [0.625, 1.4], [0.65, 2.0], [0.67, 3.0], [0.685, 4.2],
  [0.7, 6.0], [0.71, 8.6], [0.718, 12.2], [0.725, 17.0], [0.729, 20.5], [0.733, 24.5]], 1e-5);
CH1.F118 = { Ge: IE.logCurve([[0.2, 1], [0.3, 4], [0.42, 30]], 1e-3), Si: IE.logCurve([[0.6, 1], [0.7, 4], [0.82, 30]], 1e-8), GaAs: IE.logCurve([[1.1, 1], [1.2, 4], [1.33, 30]], 1e-9) };
CH1.EX12 = { I: [1, 4, 30], V: { Ge: [0.2, 0.3, 0.42], Si: [0.6, 0.7, 0.82], GaAs: [1.1, 1.2, 1.33] }, VK: { Ge: 0.3, Si: 0.7, GaAs: 1.2 } };

/* ---------------- circuits ---------------- */
/* E (left, + up), R along the top, the diode down the right side (anode at the top unless flip). d: the diode part (without id, a, b) */
CH1.series = (o = {}) => { const E = o.E ?? 10, Rv = o.R ?? 1000, flip = !!o.flip, nm = o.names || {};
  const dio = { id: 'D', type: 'D', a: flip ? 'k' : 'b', b: flip ? 'b' : 'k', name: nm.D ?? 'D', side: 1, ...(o.d || { model: 'ideal' }) };
  if (o.eq) { const on = o.eq === 'on'; Object.assign(dio, on ? { type: 'W', name: '' } : { type: 'O', name: '', label: false }); }
  return { ground: 'g', nodes: { a: [0, 0], b: [3.6, 0], k: [3.6, 2.6], g: [0, 2.6] },
    parts: [{ id: 'E', type: 'V', a: 'a', b: 'g', value: E, name: nm.E ?? 'E', valText: o.eText ?? `${fd(E, 2).replace('-', '−')} V`, side: -1 },
      { id: 'R', type: 'R', a: 'a', b: 'b', value: Rv, name: nm.R ?? 'R', valText: o.rText ?? CK.eng(Rv, 'Ω') }, dio, W_('k', 'g')] }; };
/* a current source pushing I (A) up through the diode (Ex.1 and Ex.2 "at I_D = …"), or a voltage source V straight across it (Ex.1 c) */
CH1.drive = (o = {}) => { const d = { id: 'D', type: 'D', a: 'b', b: 'k', name: o.dName ?? 'D', side: 1, ...(o.d || {}) }, src = o.V !== undefined
  ? { id: 'S', type: 'V', a: 'a', b: 'g', value: o.V, name: 'V_D', valText: o.sText ?? `${fd(o.V, 2).replace('-', '−')} V`, side: -1 }
  : { id: 'S', type: 'I', a: 'g', b: 'a', value: o.I, name: 'I_D', valText: o.sText ?? CK.eng(o.I, 'A'), side: -1 };
  return { ground: 'g', nodes: { a: [0, 0], b: [2.8, 0], k: [2.8, 2.6], g: [0, 2.6] }, parts: [src, W_('a', 'b'), d, W_('k', 'g')] }; };

/* =====================================================================================================================
   problems */
const DEF = {};
const LAY = { pad: 1.2, wideAt: 1e9, cktAspM: 0.5, rowAsp: 0.56, rowMin: 250, dotSpeed: 80, view: { acPeak: false }, shortSpec: sp => CH8.margins(sp, 1.2),   // phones keep the source values (they are short here)
  vo: () => ({ speed: 80 / 0.01, dotRef: 0.01 }) };   // dots on a fixed scale (10 mA = 80 px/s), so a reverse current of pA or µA stands still instead of being scaled up to full speed
/* a tag beside the diode's branch (the right side of CH1.series / CH1.drive): 'short' / 'open' when the diode is replaced */
CH1.eqTag = (v, text, col) => { const [x1, y1] = v.P('b'), [x2, y2] = v.P('k'); CH6.tag(v.ctx, IE.tt(text), x1 + v.u * 0.42, (y1 + y2) / 2, col || C.q, { align: 'left', size: Math.max(11.5, v.u * 0.27) }); };
const mA = x => `${fd(x * 1e3, 3)}\\ \\text{mA}`;

/* ---------- page 1.1: an ideal diode with E = 10 V and R = 2 kΩ, then the source reversed (slides pp. 8–11) ---------- */
const ID = { E: 10, R: 2000 };
const idealPlot = (ctx, b, bd, pt, o = {}) => { const sh = bd.short, top = (o.i || [0, 7])[1];
  IE.ivPlot(ctx, b, { v: [-12, 1], i: [0, 7], negFrac: 0.62, xt: [0.5, 1], xtNeg: [-10, -5], yt: [2, 4, 6], xl: 'V_D (V)', yl: 'I_D (mA)',
    title: sh ? '' : t('ลักษณะสมบัติของไดโอดอุดมคติ', 'ideal diode characteristic'),
    segs: [{ a: [-12, 0], b: [0, 0], color: C.red, w: 4 }, { a: [0, 0], b: [0, top * 1.3], color: C.tan, w: 4 }],
    pts: pt ? [{ v: pt.v, i: pt.i, color: C.q, label: pt.label, side: 1 }] : [], ...o }); };
CH1.idealPlot = idealPlot;
DEF.ideal = { ...LAY, solvedAt: 2,
  spec: k => k >= 4 ? CH1.series({ E: -ID.E, R: ID.R, eq: k >= 5 ? 'off' : undefined, eText: '−10 V' }) : CH1.series({ E: ID.E, R: ID.R, eq: k === 2 || k === 3 ? 'on' : undefined }),
  glow: k => k === 1 ? ['D'] : k === 4 ? ['D'] : null,
  after: (v, k) => { if (k === 2 || k === 3) CH1.eqTag(v, ['ลัดวงจร', 'short'], C.tan); else if (k >= 5) CH1.eqTag(v, ['เปิดวงจร', 'open'], C.red); },
  badge: k => k >= 5 ? [['เปิดวงจร: I_D = 0', 'open circuit: I_D = 0'], 'wait'] : k >= 4 ? [['กลับขั้วแหล่งจ่าย: ไดโอดนำไหม?', 'source reversed: does it conduct?'], 'wait'] : k >= 2 ? [['ลัดวงจร: I_D = 5 mA', 'short circuit: I_D = 5 mA'], 'ok'] : [['ไดโอดนำกระแสไหม?', 'does the diode conduct?'], 'wait'],
  side: (ctx, b, bd, k) => { if (k < 1) return CH8.empty(ctx, b, ['เทียบทิศของกระแสที่แหล่งจ่ายพยายามดันกับหัวลูกศรของไดโอด', 'compare the direction the source tries to push current with the diode arrowhead']);
    if (k <= 3) return idealPlot(ctx, b, bd, k >= 2 ? { v: 0, i: 5, label: bd.short ? '5 mA' : t('จุดทำงาน: 0 V, 5 mA', 'operating point: 0 V, 5 mA') } : null);
    idealPlot(ctx, b, bd, k >= 5 ? { v: -10, i: 0, label: bd.short ? '−10 V' : t('จุดทำงาน: −10 V, 0 mA', 'operating point: −10 V, 0 mA') } : null); },
  steps: () => [
    step(t('<b>(a) ไดโอดนำหรือไม่</b>: แหล่งจ่ายดันกระแสสมมติ (conventional current) ออกจากขั้วบวก ผ่าน R แล้วเข้าไดโอดทางขั้วแอโนด ทิศนี้<b>ตรงกับหัวลูกศร</b>ของสัญลักษณ์ไดโอด ไดโอดจึงนำกระแส (สไลด์หน้า 11 รูป a)', '<b>(a) Does the diode conduct?</b> The source pushes conventional current out of its + terminal, through R and into the diode at the anode. That direction <b>matches the arrowhead</b> of the diode symbol, so the diode conducts (slide p. 11, Fig. a).')),
    step(t('<b>แทนไดโอดด้วยลัดวงจร</b>: ในบริเวณนำกระแส ไดโอดอุดมคติมีความต้านทานเป็นศูนย์ (สไลด์หน้า 8) จึงแทนด้วยเส้นลวดได้ แรงดันทั้งหมดตกคร่อม R (จุดเริ่มวิ่ง)', '<b>Replace the diode by a short</b>: in its conduction region an ideal diode has zero resistance (slide p. 8), so a wire can stand in for it. The whole source voltage is across R (the dots start).'),
      block([R`V_D &= 0\ \text{V}`, R`I_D &= \frac{E}{R} = \frac{10\ \text{V}}{2\ \text{k}\Omega} = \boxed{5\ \text{mA}}`])),
    step(t('<b>ตรวจด้วยกฎของโอห์ม</b>: ความต้านทานขณะไบแอสตรง (forward resistance) ของไดโอดอุดมคติที่จุดทำงานนี้คือ', '<b>Check with Ohm\'s law</b>: the forward resistance of the ideal diode at this operating point is'),
      block([R`R_F &= \frac{V_D}{I_D} = \frac{0\ \text{V}}{5\ \text{mA}} = 0\ \Omega`]), t('จุดทำงานอยู่บนแกนตั้ง (เส้นสีเขียว) ของกราฟลักษณะสมบัติ', 'The operating point sits on the vertical axis (the green line) of the characteristic.')),
    step(t('<b>(b) กลับขั้วแหล่งจ่าย</b> (E = −10 V): แหล่งจ่ายพยายามดันกระแสเข้าไดโอดทางขั้วแคโทด <b>สวนหัวลูกศร</b> ไดโอดอุดมคติไม่ยอมให้กระแสไหลทางนี้ (สไลด์หน้า 11 รูป b)', '<b>(b) The source reversed</b> (E = −10 V): it tries to push current into the cathode, <b>against the arrowhead</b>. An ideal diode lets no current through that way (slide p. 11, Fig. b).')),
    step(t('<b>แทนไดโอดด้วยเปิดวงจร</b>: ไม่มีกระแส จึงไม่มีแรงดันตกคร่อม R แรงดันของแหล่งจ่ายทั้งหมดไปตกคร่อมไดโอด (สไลด์หน้า 9)', '<b>Replace the diode by an open circuit</b>: no current, so no drop across R, and the whole source voltage appears across the diode (slide p. 9).'),
      block([R`I_D &= \boxed{0\ \text{mA}}`, R`V_D &= -10\ \text{V} - (0)(2\ \text{k}\Omega) = \boxed{-10\ \text{V}}`, R`R_R &= \frac{|V_D|}{I_D} = \frac{10\ \text{V}}{0\ \text{mA}} \to \infty\ \Omega`]),
      t('จุดทำงานอยู่บนแกนนอนด้านลบ (เส้นสีแดง) ไดโอดต้องทนแรงดันย้อนกลับนี้ได้ ไดโอดจริงมีพิกัดแรงดันย้อนกลับสูงสุด (peak inverse voltage, PIV) ซึ่งจะพบในหน้า 1.4', 'The operating point sits on the negative horizontal axis (the red line). The diode must withstand this reverse voltage; a real diode has a peak inverse voltage (PIV) rating, met on page 1.4.'))],
  ask: () => ({ fields: [num(t('(a) I<sub>D</sub> (mA) =', '(a) I<sub>D</sub> (mA) ='), 5), num(t('(b) I<sub>D</sub> (mA) =', '(b) I<sub>D</sub> (mA) ='), 0, { tol: 1e-6 }), num(t('(b) V<sub>D</sub> (V) =', '(b) V<sub>D</sub> (V) ='), -10)],
    check: v => near(v[0], 4.65, 0.01) ? t('นั่นคือไดโอดซิลิคอนที่มีแรงดันตก 0.7 V (หน้า 1.6) โจทย์นี้ใช้ไดโอดอุดมคติ: V<sub>D</sub> = 0', 'That is a silicon diode with a 0.7 V drop (page 1.6); this problem uses an ideal diode: V<sub>D</sub> = 0.') : near(v[2], 0, 0.01) ? t('ไดโอดเปิดวงจร แรงดันจึงไม่หายไป: R ไม่มีแรงดันตก แรงดันทั้งหมดไปอยู่ที่ไดโอด', 'An open diode does not make the voltage vanish: R drops nothing, so all of it is across the diode.')
      : near(v[2], 10, 0.01) ? t('V<sub>D</sub> วัดจากแอโนดเทียบกับแคโทด ตอนนี้แคโทดเป็นขั้วบวก จึงได้ −10 V', 'V<sub>D</sub> is anode minus cathode; here the cathode is the + side, so V<sub>D</sub> = −10 V.') : '' }),
  answer: () => t('(a) ลัดวงจร: \\(I_D = 5\\) mA, \\(V_D = 0\\) V (b) เปิดวงจร: \\(I_D = 0\\), \\(V_D = -10\\) V · โจทย์แต่งเพิ่มเพื่อฝึกหลักของสไลด์หน้า 8–11 ไม่มีเฉลยในห้อง', '(a) a short: \\(I_D = 5\\) mA, \\(V_D = 0\\) V (b) an open circuit: \\(I_D = 0\\), \\(V_D = -10\\) V · a practice problem written for slides pp. 8–11; there is no class solution.') };

/* the operating point of E, R and a diode curve f (mA): E = V + I R by bisection → { V, I (mA) } */
CH1.op = (f, E, Rv) => { let lo = Math.min(0, E), hi = Math.max(0, E); for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (m + f(m) / 1000 * Rv < E) lo = m; else hi = m; } const V = (lo + hi) / 2; return { V, I: (E - V) / Rv * 1000 }; };
const tag = on => (on ? C.q : C.muted);   // the point of the open step is amber, earlier ones grey

/* ---------- page 1.4, problem 1: Example 1.1 (V_T at 27 °C) and Eq. (1.2) for the dashed curve of Fig. 1.15 (Is = 10 pA, n = 1) ---------- */
const SK = (() => { const Is = 1e-11, vt = CK.DIODE.vt(27), f = IE.shockley(Is, 1, 27); return { Is, vt, f, x: 0.5 / vt, i05: f(0.5), i05r: 1e-11 * (Math.exp(0.5 / 0.026) - 1) * 1e3, v10: f.vAt(10), d: { model: 'shockley', Is, n: 1, T: 27 } }; })();
CH1.SK = SK;
const skPlot = (ctx, b, bd, k) => { const sh = bd.short, pts = [], guides = [];
  if (k >= 2) { pts.push({ v: 0.5, i: SK.i05, color: tag(k === 2), label: sh ? `${fd(SK.i05, 2)} mA` : `0.5 V, ${fd(SK.i05, 2)} mA` }); guides.push({ v: 0.5, i: SK.i05 }); }
  if (k >= 3) { pts.push({ v: SK.v10, i: 10, color: tag(k === 3), label: sh ? `${fd(SK.v10, 3)} V` : `${fd(SK.v10, 3)} V, 10 mA` }); guides.push({ v: SK.v10, i: 10 }); }
  if (k >= 4) pts.push({ v: -10, i: -1e-8, color: C.q, label: sh ? '−10 pA' : '−10 V, −10 pA', side: 1 });
  IE.ivPlot(ctx, b, { v: [-12, 0.65], i: [0, 12], negFrac: 0.28, revPx: 22, revLabel: '−10 pA', xt: [0.2, 0.4, 0.6], xtNeg: [-10], yt: [5, 10], curves: [{ f: SK.f, rev: true }], pts, guides,
    title: sh ? '' : t('สมการ (1.2): I_s = 10 pA, n = 1, 27 °C', 'Eq. (1.2): I_s = 10 pA, n = 1, 27 °C') }); };
DEF.shock = { ...LAY, solvedAt: 2,
  spec: k => (k >= 4 ? CH1.drive({ V: -10, d: SK.d }) : k === 3 ? CH1.drive({ I: 0.01, d: SK.d }) : CH1.drive({ V: 0.5, d: SK.d })),
  glow: k => (k >= 2 && k <= 4 ? ['D'] : null),
  badge: k => (k >= 4 ? [['ไบแอสกลับ: I_D = −I_s = −10 pA', 'reverse bias: I_D = −I_s = −10 pA'], 'wait'] : k === 3 ? [[`I_D = 10 mA: V_D = ${fd(SK.v10, 3)} V`, `I_D = 10 mA: V_D = ${fd(SK.v10, 3)} V`], 'ok']
    : k === 2 ? [[`V_D = 0.5 V: I_D = ${fd(SK.i05, 2)} mA`, `V_D = 0.5 V: I_D = ${fd(SK.i05, 2)} mA`], 'ok'] : [['ไดโอดซิลิคอน I_s = 10 pA ที่ 27 °C', 'a silicon diode, I_s = 10 pA, at 27 °C'], 'wait']),
  side: (ctx, b, bd, k) => skPlot(ctx, b, bd, k),
  steps: () => [
    step(t('<b>Example 1.1: แรงดันความร้อน (thermal voltage)</b> \\(V_T\\) ที่ 27 °C ซึ่งเป็นอุณหภูมิทั่วไปของอุปกรณ์ในกล่องปิด (สมการ 1.3)', '<b>Example 1.1: the thermal voltage</b> \\(V_T\\) at 27 °C, a common temperature for parts inside an enclosure (Eq. 1.3)'),
      block([R`T_K &= 273 + 27 = 300\ \text{K}`, R`V_T &= \frac{kT_K}{q} = \frac{(1.38\times10^{-23})(300)}{1.6\times10^{-19}}`, R`&= \boxed{25.875\ \text{mV}} \cong 26\ \text{mV}`])),
    step(t('<b>กระแสที่ \\(V_D = 0.5\\) V</b> จากสมการของช็อกลีย์ (Shockley, สมการ 1.2) กับไดโอดของรูป 1.15: \\(I_s = 10\\) pA, \\(n = 1\\) (แหล่งจ่าย 0.5 V ต่อคร่อมไดโอด จุดเริ่มวิ่ง)', '<b>The current at \\(V_D = 0.5\\) V</b> from Shockley\'s equation (Eq. 1.2) for the diode of Fig. 1.15: \\(I_s = 10\\) pA, \\(n = 1\\) (a 0.5 V source across the diode; the dots start)'),
      block([R`\frac{V_D}{nV_T} &= \frac{0.5}{0.025875} = ${fd(SK.x, 3)}`, R`I_D &= I_s\left(e^{V_D/nV_T} - 1\right) = (10\ \text{pA})\left(e^{${fd(SK.x, 3)}} - 1\right)`, R`&= \boxed{${fd(SK.i05, 3)}\ \text{mA}}`]),
      t(`เลขชี้กำลังไวมาก: ถ้าปัด \\(V_T\\) เป็น 26 mV จะได้ ${fd(SK.i05r, 2)} mA ต่างไป ${fd(100 * (1 - SK.i05r / SK.i05), 0)} %`, `The exponent is very sensitive: rounding \\(V_T\\) to 26 mV gives ${fd(SK.i05r, 2)} mA, ${fd(100 * (1 - SK.i05r / SK.i05), 0)} % less.`)),
    step(t('<b>แรงดันที่ \\(I_D = 10\\) mA</b>: กลับสมการ (1.2) หา \\(V_D\\) (แหล่งจ่ายกระแส 10 mA)', '<b>The voltage at \\(I_D = 10\\) mA</b>: solve Eq. (1.2) for \\(V_D\\) (a 10 mA current source)'),
      block([R`V_D &= nV_T\ln\left(\frac{I_D}{I_s} + 1\right) = (25.875\ \text{mV})\ln\left(\frac{10\ \text{mA}}{10\ \text{pA}} + 1\right)`, R`&= (25.875\ \text{mV})(${fd(Math.log(1e9 + 1), 3)}) = \boxed{${fd(SK.v10, 3)}\ \text{V}}`]),
      t('กระแสเพิ่ม 10 เท่าทุกครั้งที่ \\(V_D\\) เพิ่ม \\(nV_T\\ln 10 = 59.6\\) mV กราฟจึงตั้งชันเมื่อเลยเข่าของกราฟ (รูป 1.16)', 'The current grows tenfold for every \\(nV_T\\ln 10 = 59.6\\) mV more of \\(V_D\\), so the curve shoots up past its knee (Fig. 1.16).')),
    step(t('<b>ไบแอสกลับ \\(V_D = -10\\) V</b>: เทอมเอกซ์โพเนนเชียลเหลือเกือบศูนย์ กระแสเท่ากับ \\(-I_s\\) (กระแสอิ่มตัวย้อนกลับ)', '<b>Reverse bias, \\(V_D = -10\\) V</b>: the exponential is practically zero, so the current is \\(-I_s\\) (the reverse saturation current)'),
      block([R`e^{-10/0.025875} &= e^{-386.5} \approx 0`, R`I_D &= I_s(0 - 1) = -I_s = \boxed{-10\ \text{pA}}`, R`V_D = 0:\ I_D &= I_s(e^0 - 1) = 0`]),
      t('กระแสย้อนกลับของไดโอดจริงมากกว่า \\(I_s\\) ในสมการ เพราะกระแสรั่ว พื้นที่รอยต่อ และอุณหภูมิ (Boylestad หัวข้อ 1.6)', 'The reverse current of a real diode is larger than the \\(I_s\\) of the equation, because of leakage, the junction area and temperature (Boylestad, section 1.6).'))],
  ask: () => ({ fields: [num(t('I<sub>D</sub> ที่ 0.5 V (mA) =', 'I<sub>D</sub> at 0.5 V (mA) ='), SK.i05, { tol: 0.02 }), num(t('V<sub>D</sub> ที่ 10 mA (V) =', 'V<sub>D</sub> at 10 mA (V) ='), SK.v10, { tol: 0.002 }), num(t('I<sub>D</sub> ที่ −10 V (pA) =', 'I<sub>D</sub> at −10 V (pA) ='), -10, { tol: 0.05 })],
    check: v => (near(v[0], SK.i05r, 0.02) ? t('ใช้ \\(V_T = 25.875\\) mV เต็ม ๆ: ในเลขชี้กำลัง ความต่าง 0.125 mV ทำให้กระแสต่างเกือบ 9 %', 'Use the full \\(V_T = 25.875\\) mV: in the exponent a 0.125 mV difference changes the current by almost 9 %.')
      : near(v[2], 10, 0.05) ? t('กระแสไหลสวนทิศที่นิยาม จึงติดลบ: \\(-I_s\\)', 'The current flows against the defined direction, so it is negative: \\(-I_s\\).') : '') }),
  answer: () => t(`\\(V_T = 25.875\\) mV · \\(I_D(0.5\\ \\text{V}) = ${fd(SK.i05, 2)}\\) mA · \\(V_D(10\\ \\text{mA}) = ${fd(SK.v10, 3)}\\) V · \\(I_D(-10\\ \\text{V}) = -10\\) pA · ส่วนแรกคือ Boylestad Example 1.1 ส่วนที่เหลือคำนวณจากสมการ (1.2) กับ \\(I_s = 10\\) pA ของรูป 1.15`, `\\(V_T = 25.875\\) mV · \\(I_D(0.5\\ \\text{V}) = ${fd(SK.i05, 2)}\\) mA · \\(V_D(10\\ \\text{mA}) = ${fd(SK.v10, 3)}\\) V · \\(I_D(-10\\ \\text{V}) = -10\\) pA · the first part is Boylestad Example 1.1; the rest applies Eq. (1.2) to the \\(I_s = 10\\) pA of Fig. 1.15.`) };

/* ---------- page 1.4, problem 2: Example 1.2 (Fig. 1.18): Ge, Si and GaAs at 1, 4 and 30 mA ---------- */
const MATS = ['Ge', 'Si', 'GaAs'], MCOL = { Ge: '#ffa552', Si: '#4fb3ff', GaAs: '#c792ea' }, MT = {};
MATS.forEach(m => { MT[m] = IE.tableOf(CH1.F118[m], 1.6, 0.005); });
CH1.MCOL = MCOL;
/* three loops side by side, each a current source I (mA) up through one diode; the bottom rail is common */
CH1.three = (I, o = {}) => { const nodes = {}, parts = [];
  MATS.forEach((m, j) => { const x = j * 3.9; nodes['a' + j] = [x, 0]; nodes['b' + j] = [x + 1.9, 0]; nodes['k' + j] = [x + 1.9, 2.4]; nodes['g' + j] = [x, 2.4];
    parts.push({ id: 'S' + j, type: 'I', a: 'g' + j, b: 'a' + j, value: I / 1000, name: '', valText: o.iText ?? `${fd(I, 0)} mA`, side: -1 }, W_('a' + j, 'b' + j),
      { id: 'D' + j, type: 'D', a: 'b' + j, b: 'k' + j, name: m, side: 1, ...MT[m] }, W_('k' + j, 'g' + j));
    if (j) parts.push(W_('k' + (j - 1), 'g' + j)); });
  return { ground: 'g0', nodes, parts }; };
const mPlot = (ctx, b, bd, k) => { const sh = bd.short, j = Math.min(k, 3) - 1, I = CH1.EX12.I[j], pts = [], vl = [];
  if (j >= 0) MATS.forEach(m => pts.push({ v: CH1.EX12.V[m][j], i: I, color: MCOL[m], label: sh ? fd(CH1.EX12.V[m][j], 2) : `${fd(CH1.EX12.V[m][j], 2)} V`, side: 1, dy: I > 20 ? -16 : 16 }));
  if (k >= 4) MATS.forEach(m => vl.push({ v: CH1.EX12.V[m].reduce((a, x) => a + x, 0) / 3, color: MCOL[m], label: sh ? '' : `${fd(CH1.EX12.V[m].reduce((a, x) => a + x, 0) / 3, 3)}` }));
  IE.ivPlot(ctx, b, { v: [0, 1.5], i: [0, 32], xt: [0.3, 0.6, 0.9, 1.2, 1.5], yt: [10, 20, 30], hl: j >= 0 && k < 4 ? [{ i: I, label: `${I} mA` }] : [], vl, pts,
    curves: MATS.map(m => ({ f: CH1.F118[m], color: MCOL[m], label: m, labelAt: CH1.EX12.V[m][2] + 0.03 })), title: sh ? '' : t('รูป 1.18: ไดโอด Ge, Si และ GaAs', 'Fig. 1.18: Ge, Si and GaAs diodes') }); };
const avg3 = m => CH1.EX12.V[m].reduce((a, x) => a + x, 0) / 3;
DEF.mats = { ...LAY, cktAspM: 0.34, solvedAt: 1,
  spec: k => CH1.three(k <= 1 ? 1 : k === 2 ? 4 : 30),
  glow: k => (k >= 1 && k <= 3 ? ['D0', 'D1', 'D2'] : null),
  badge: k => (k >= 1 && k <= 3 ? [[`กระแส ${CH1.EX12.I[k - 1]} mA ในไดโอดทุกตัว`, `${CH1.EX12.I[k - 1]} mA in every diode`], 'ok'] : k >= 4 ? [['30 mA: เทียบค่าเฉลี่ยกับ V_K', '30 mA: averages against V_K'], 'ok'] : [['กระแสเท่ากัน แรงดันเท่ากันไหม?', 'equal currents: equal voltages?'], 'wait']),
  side: (ctx, b, bd, k) => mPlot(ctx, b, bd, k),
  steps: () => { const row = j => MATS.map(m => R`V_D(\text{${m}}) &= ${fd(CH1.EX12.V[m][j], 2)}\ \text{V}`);
    return [
      step(t('<b>(a) ที่ \\(I_D = 1\\) mA</b>: ลากเส้นนอนที่ 1 mA ไปตัดกราฟทั้งสาม แล้วอ่านแรงดันลงบนแกนนอน (แหล่งจ่ายกระแส 1 mA จ่ายให้ไดโอดทุกตัว)', '<b>(a) At \\(I_D = 1\\) mA</b>: draw the horizontal line at 1 mA to the three curves and read the voltages down on the axis (a 1 mA source feeds each diode)'), block(row(0))),
      step(t('<b>(b) ที่ \\(I_D = 4\\) mA</b>', '<b>(b) At \\(I_D = 4\\) mA</b>'), block(row(1))),
      step(t('<b>(c) ที่ \\(I_D = 30\\) mA</b>: กระแสเพิ่ม 30 เท่าแต่แรงดันเพิ่มเพียงราว 0.2 V', '<b>(c) At \\(I_D = 30\\) mA</b>: the current grows thirtyfold but the voltage only about 0.2 V'), block(row(2))),
      step(t('<b>(d) ค่าเฉลี่ยของแรงดัน</b> ของทั้งสามระดับกระแส', '<b>(d) The average voltage</b> over the three currents'),
        block(MATS.map(m => R`V_{av}(\text{${m}}) &= \frac{${CH1.EX12.V[m].map(x => fd(x, 2)).join(' + ')}}{3} = \boxed{${fd(avg3(m), 3)}\ \text{V}}`))),
      step(t('<b>(e) เทียบกับแรงดันที่เข่าของกราฟ \\(V_K\\)</b> (ตาราง 1.3): ใกล้กันมาก ค่า \\(V_K\\) จึงใช้แทนแรงดันตกคร่อมไดโอดที่นำกระแสได้ สไลด์หน้า 43 ก็ใช้ 0.7 V สำหรับซิลิคอนและ 0.3 V สำหรับเจอร์เมเนียม', '<b>(e) Compare with the knee voltages \\(V_K\\)</b> (Table 1.3): very close, so \\(V_K\\) can stand for the drop across a conducting diode. Slide p. 43 too uses 0.7 V for silicon and 0.3 V for germanium.'),
        block(MATS.map(m => R`\text{${m}}:\ ${fd(avg3(m), 3)}\ \text{V} &\approx V_K = ${fd(CH1.EX12.VK[m], 1)}\ \text{V}`)))]; },
  ask: () => ({ fields: MATS.map(m => num(`V<sub>av</sub> ${m} (V) =`, avg3(m), { tol: 0.004 })) }),
  answer: () => t('Ge 0.2, 0.3, 0.42 V · Si 0.6, 0.7, 0.82 V · GaAs 1.1, 1.2, 1.33 V · ค่าเฉลี่ย 0.307, 0.707 และ 1.21 V ใกล้ \\(V_K\\) = 0.3, 0.7 และ 1.2 V ตรงกับ Boylestad Example 1.2', 'Ge 0.2, 0.3, 0.42 V · Si 0.6, 0.7, 0.82 V · GaAs 1.1, 1.2, 1.33 V · averages 0.307, 0.707 and 1.21 V, close to \\(V_K\\) = 0.3, 0.7 and 1.2 V, as in Boylestad Example 1.2.') };

/* ---------- page 1.4, problem 3: temperature (Boylestad section 1.6): −2.5 mV/°C forward, reverse current doubling every 10 °C ---------- */
/* a silicon diode with 0.7 V at 10 mA at 20 °C: Shockley with n = 2, its I_s set at each temperature so that the 10 mA point moves by −2.5 mV/°C;
   reverse current 10 nA at 20 °C, doubling every 10 °C (the rules of thumb of the book, not physics in detail) */
CH1.tempF = Tc => { const vt2 = 2 * CK.DIODE.vt(Tc), v10 = 0.7 - 0.0025 * (Tc - 20), Is = 0.01 / (Math.exp(v10 / vt2) - 1);
  const f = v => (v < 0 ? -f.irev * (1 - Math.exp(v / 0.01)) : 1000 * Is * (Math.exp(Math.min(v / vt2, 80)) - 1)); f.irev = 1e-5 * Math.pow(2, (Tc - 20) / 10); f.vAt = i => vt2 * Math.log(i / 1000 / Is + 1); f.v10 = v10; f.T = Tc; return f; };
const TP = { f0: CH1.tempF(20), f1: CH1.tempF(100) }; TP.d0 = IE.tableOf(TP.f0, 1.0, 0.004); TP.d1 = IE.tableOf(TP.f1, 1.0, 0.004); CH1.TP = TP;
DEF.temp = { ...LAY, solvedAt: 1,
  spec: k => (k >= 3 ? CH1.drive({ V: -10, d: TP.d1, dName: 'D (100 °C)' }) : k === 2 ? CH1.drive({ I: 0.01, d: TP.d1, dName: 'D (100 °C)' }) : CH1.drive({ I: 0.01, d: TP.d0, dName: 'D (20 °C)' })),
  glow: k => (k >= 1 && k <= 3 ? ['D'] : null),
  badge: k => (k >= 3 ? [['100 °C, ไบแอสกลับ: −2.56 µA', '100 °C, reverse: −2.56 µA'], 'wait'] : k === 2 ? [['100 °C: V_D = 0.5 V ที่ 10 mA', '100 °C: V_D = 0.5 V at 10 mA'], 'ok'] : k === 1 ? [['20 °C: V_D = 0.7 V ที่ 10 mA', '20 °C: V_D = 0.7 V at 10 mA'], 'ok'] : [['ร้อนขึ้น 80 °C แล้วอะไรเปลี่ยน?', '80 °C hotter: what changes?'], 'wait']),
  side: (ctx, b, bd, k) => { const sh = bd.short, pts = [], curves = [{ f: TP.f0, color: '#4fb3ff', rev: k < 3, label: '20 °C', labelAt: 0.74 }];
    if (k >= 2) curves.push({ f: TP.f1, color: '#ff6b6b', rev: k >= 3, label: '100 °C', labelAt: 0.53 });
    if (k >= 1) pts.push({ v: 0.7, i: 10, color: tag(k === 1), label: sh ? '0.7 V' : '0.7 V, 10 mA', side: 1 });
    if (k >= 2) pts.push({ v: 0.5, i: 10, color: tag(k === 2), label: sh ? '0.5 V' : '0.5 V, 10 mA', side: -1 });
    if (k >= 3) pts.push({ v: -10, i: -1e-6, color: C.q, label: sh ? '−2.56 µA' : '−10 V, −2.56 µA', side: 1 });
    IE.ivPlot(ctx, b, { v: [-12, 1], i: [0, 16], negFrac: 0.28, revPx: 22, revLabel: k >= 3 ? '−2.56 µA' : '−10 nA', xt: [0.5, 0.7, 1], xtNeg: [-10], yt: [5, 10, 15], curves, pts,
      dV: k >= 2 ? [{ v1: 0.5, v2: 0.7, at: 12.5, label: '−0.2 V', color: '#ff6b6b', above: true }] : [], title: sh ? '' : t('ไดโอดซิลิคอนที่ 20 °C และ 100 °C', 'a silicon diode at 20 °C and 100 °C') }); },
  steps: () => [
    step(t('<b>ที่อุณหภูมิห้อง 20 °C</b>: ไดโอดนำกระแส 10 mA ที่ \\(V_D = 0.7\\) V กระแสย้อนกลับ 10 nA (ค่าที่โจทย์กำหนด แหล่งจ่ายกระแส 10 mA จุดเริ่มวิ่ง)', '<b>At room temperature, 20 °C</b>: the diode carries 10 mA at \\(V_D = 0.7\\) V, and its reverse current is 10 nA (given; a 10 mA source, the dots start)')),
    step(t('<b>ไบแอสตรงที่ 100 °C</b>: กราฟของไดโอดซิลิคอนเลื่อนไปทางซ้าย 2.5 mV ต่อ °C ที่อุณหภูมิสูงขึ้น (ไดโอดในวงจรเปลี่ยนเป็น 100 °C)', '<b>Forward bias at 100 °C</b>: a silicon diode\'s curve shifts left by 2.5 mV for every °C of rise (the diode in the circuit is now at 100 °C)'),
      block([R`\Delta V_D &= (100 - 20)(-2.5\ \text{mV/°C}) = -0.2\ \text{V}`, R`V_D &= 0.7 - 0.2 = \boxed{0.5\ \text{V}}\quad (I_D = 10\ \text{mA})`])),
    step(t('<b>กระแสย้อนกลับที่ 100 °C</b>: เพิ่มเป็นสองเท่าทุก 10 °C (แหล่งจ่าย −10 V ต่อคร่อมไดโอด)', '<b>The reverse current at 100 °C</b>: it doubles for every 10 °C (a −10 V source across the diode)'),
      block([R`\frac{100 - 20}{10} &= 8\ \text{${t('ครั้ง', 'doublings')}}`, R`I_R &= (10\ \text{nA})(2^8) = (10\ \text{nA})(256) = \boxed{2.56\ \mu\text{A}}`])),
    step(t('<b>ไปต่อที่ 200 °C</b>: \\(2^{18} = 262\\,144\\) เท่า กระแสย้อนกลับกลายเป็น 2.62 mA งานที่อุณหภูมิสูงจึงต้องเลือกไดโอดซิลิคอนที่มี \\(I_s\\) ที่อุณหภูมิห้องราว 10 pA ซึ่งจะเหลือเพียง 2.62 µA', '<b>On to 200 °C</b>: a factor \\(2^{18} = 262\\,144\\) makes the reverse current 2.62 mA, so high-temperature work calls for silicon diodes with a room-temperature \\(I_s\\) near 10 pA, which gives only 2.62 µA'),
      block([R`I_R(200\ ^\circ\text{C}) &= (10\ \text{nA})(2^{18}) = 2.62\ \text{mA}`]))],
  ask: () => ({ fields: [num(t('V<sub>D</sub> ที่ 100 °C (V) =', 'V<sub>D</sub> at 100 °C (V) ='), 0.5, { tol: 0.003 }), num(t('I<sub>R</sub> ที่ 100 °C (µA) =', 'I<sub>R</sub> at 100 °C (µA) ='), 2.56, { tol: 0.01 })],
    check: v => (near(v[0], 0.9, 0.003) ? t('ร้อนขึ้นแล้วกราฟเลื่อนไปทางซ้าย แรงดันที่กระแสเท่าเดิมจึงลดลง', 'Heating shifts the curve to the left, so at the same current the voltage falls.') : near(v[1], 0.08, 0.002) ? t('เพิ่มเป็นสองเท่าทุก 10 °C แปลว่าคูณ 2 แปดครั้ง \\((2^8)\\) ไม่ใช่คูณ 8', 'Doubling every 10 °C means multiplying by 2 eight times \\((2^8)\\), not by 8.') : '') }),
  answer: () => t('\\(V_D = 0.5\\) V ที่ 10 mA และกระแสย้อนกลับ 2.56 µA ที่ 100 °C · ตัวเลขตามย่อหน้า Temperature Effects ของ Boylestad หัวข้อ 1.6', '\\(V_D = 0.5\\) V at 10 mA and a reverse current of 2.56 µA at 100 °C · the numbers of the Temperature Effects paragraph of Boylestad section 1.6.') };

/* ---------- page 1.5, problem 1: Ex.1 = Boylestad Example 1.3 (Fig. 1.24) ---------- */
const T124 = IE.tableOf(CH1.F124, 1.0, 0.005);
const ex1Plot = (ctx, b, bd, k) => { const sh = bd.short, pts = [], segs = [], guides = [];
  if (k >= 1) { pts.push({ v: 0.5, i: 2, color: tag(k <= 2), label: sh ? '2 mA' : '0.5 V, 2 mA', side: 1 }); guides.push({ v: 0.5, i: 2 }); }
  if (k >= 2) segs.push({ a: [0, 0], b: [0.5, 2], color: C.chord, w: 2.6 });
  if (k >= 3) { pts.push({ v: 0.8, i: 20, color: tag(k === 3), label: sh ? '20 mA' : '0.8 V, 20 mA', side: -1 }); guides.push({ v: 0.8, i: 20 }); segs.push({ a: [0, 0], b: [0.8, 20], color: C.chord, w: 2.6 }); }
  if (k >= 4) { pts.push({ v: -10, i: -1e-3, color: tag(k === 4), label: sh ? '−1 µA' : '−10 V, −1 µA', side: 1, dy: -16 }); segs.push({ a: [0, 0], b: [-10, -1e-3], color: C.chord, w: 2.6 }); }
  IE.ivPlot(ctx, b, { v: [-12, 1], i: [0, 32], negFrac: 0.3, revPx: 24, revLabel: '−1 µA', xt: [0.5, 0.8], xtNeg: [-10], yt: [2, 10, 20, 30], curves: [{ f: CH1.F124, rev: true }], pts, segs, guides,
    title: sh ? '' : t('รูป 1.24 (สไลด์หน้า 46–48)', 'Fig. 1.24 (slides pp. 46–48)') }); };
DEF.ex1 = { ...LAY, solvedAt: 1,
  spec: k => (k >= 4 ? CH1.drive({ V: -10, d: T124 }) : k === 3 ? CH1.drive({ I: 0.02, d: T124 }) : CH1.drive({ I: 0.002, d: T124 })),
  glow: k => (k >= 1 && k <= 4 ? ['D'] : null),
  badge: k => (k >= 4 ? [['ไบแอสกลับ: R_D = 10 MΩ', 'reverse bias: R_D = 10 MΩ'], 'wait'] : k === 3 ? [['20 mA: R_D = 40 Ω', '20 mA: R_D = 40 Ω'], 'ok'] : k >= 1 ? [['2 mA: R_D = 250 Ω', '2 mA: R_D = 250 Ω'], 'ok'] : [['จุดทำงานกระแสตรง 2 mA', 'a dc operating point at 2 mA'], 'wait']),
  side: (ctx, b, bd, k) => ex1Plot(ctx, b, bd, k),
  steps: () => [
    step(t('<b>(a) อ่านกราฟที่ \\(I_D = 2\\) mA</b>: ลากเส้นนอนจาก 2 mA ไปตัดกราฟ แล้วลากลงหาแกนนอน (แหล่งจ่ายกระแส 2 mA จุดเริ่มวิ่ง)', '<b>(a) Read the curve at \\(I_D = 2\\) mA</b>: across from 2 mA to the curve, then down to the voltage axis (a 2 mA source; the dots start)'), block([R`I_D = 2\ \text{mA} &\Rightarrow V_D = 0.5\ \text{V}`])),
    step(t('<b>ความต้านทานกระแสตรง</b> (dc resistance) ตามสมการ (1.4) คือแรงดันหารด้วยกระแสที่จุดทำงาน เท่ากับส่วนกลับของความชันของเส้นจากจุดกำเนิดถึงจุดทำงาน (เส้นสีชมพู)', '<b>The dc resistance</b> of Eq. (1.4) is the voltage over the current at the operating point: the reciprocal of the slope of the line from the origin to that point (the pink line)'),
      block([R`R_D &= \frac{V_D}{I_D} = \frac{0.5\ \text{V}}{2\ \text{mA}} = \boxed{250\ \Omega}`])),
    step(t('<b>(b) ที่ \\(I_D = 20\\) mA</b> (แหล่งจ่ายกระแส 20 mA): อ่านได้ \\(V_D = 0.8\\) V เส้นจากจุดกำเนิดชันขึ้นมาก', '<b>(b) At \\(I_D = 20\\) mA</b> (a 20 mA source): the curve gives \\(V_D = 0.8\\) V; the line from the origin is much steeper'),
      block([R`R_D &= \frac{V_D}{I_D} = \frac{0.8\ \text{V}}{20\ \text{mA}} = \boxed{40\ \Omega}`])),
    step(t('<b>(c) ไบแอสกลับ \\(V_D = -10\\) V</b> (แหล่งจ่าย −10 V ต่อคร่อมไดโอด): กราฟให้ \\(I_D = -I_s = -1\\ \\mu\\)A', '<b>(c) Reverse bias, \\(V_D = -10\\) V</b> (a −10 V source across the diode): the curve gives \\(I_D = -I_s = -1\\ \\mu\\)A'),
      block([R`R_D &= \frac{V_D}{I_D} = \frac{-10\ \text{V}}{-1\ \mu\text{A}} = \boxed{10\ \text{M}\Omega}`])),
    step(t('<b>สรุป</b>: ยิ่งกระแสสูง ความต้านทานกระแสตรงยิ่งต่ำ ในบริเวณที่ใช้งานจริงอยู่ราว 10 ถึง 80 Ω และในบริเวณไบแอสกลับสูงมาก มัลติมิเตอร์วัดโอห์มจ่ายกระแสคงที่ไม่กี่มิลลิแอมป์ จึงอ่านความต้านทานกระแสตรงที่กระแสนั้น', '<b>Summary</b>: the higher the current, the lower the dc resistance, typically 10 to 80 Ω where diodes are used, and very high under reverse bias. An ohmmeter drives a fixed current of a few milliamperes, so it reads the dc resistance at that current.'),
      block([R`250\ \Omega\ (2\ \text{mA}) &> 40\ \Omega\ (20\ \text{mA})`, R`10\ \text{M}\Omega\ (-10\ \text{V}) &\gg 250\ \Omega`]))],
  ask: () => ({ fields: [num('(a) R<sub>D</sub> (Ω) =', 250, { tol: 1 }), num('(b) R<sub>D</sub> (Ω) =', 40, { tol: 0.2 }), num('(c) R<sub>D</sub> (MΩ) =', 10, { tol: 0.05 })],
    check: v => (near(v[0], 4, 0.05) ? t('กลับเศษกับส่วน: \\(R_D = V_D/I_D\\) ไม่ใช่ \\(I_D/V_D\\)', 'Upside down: \\(R_D = V_D/I_D\\), not \\(I_D/V_D\\).') : near(v[2], 10e6, 1e5) ? t('ตอบช่อง (c) เป็นเมกะโอห์ม: 10 MΩ ใส่ 10', 'Give (c) in megohms: 10 MΩ is 10.') : '') }),
  answer: () => t('(a) 250 Ω (b) 40 Ω (c) 10 MΩ ตรงกับ Boylestad Example 1.3 · สไลด์หน้า 46–48 มีแต่โจทย์ ไม่มีเฉลย', '(a) 250 Ω (b) 40 Ω (c) 10 MΩ, as in Boylestad Example 1.3 · slides pp. 46–48 give the problem only, without a solution.') };

/* ---------- page 1.5, problem 2: Ex.2 = Boylestad Example 1.4 (Fig. 1.27): the ac resistance from tangent lines ---------- */
const T127 = IE.tableOf(CH1.F127, 1.0, 0.002), EX2 = { a: { Q: [0.7, 2], t1: [0.65, 0], t2: [0.76, 4], swing: 1.8 }, b: { Q: [0.79, 25], t1: [0.78, 20], t2: [0.8, 30], swing: 5 } };
CH1.T127 = T127; CH1.EX2 = EX2;
const swingTick = (key, part) => (dt, s) => { if (!s.solved || !s.ckt) return; const P = part(s.k); if (!P) return; s.st.ph = (s.st.ph || 0) + dt * Math.PI * 2 / 4;
  const I = P.Q[1] + P.swing * Math.sin(s.st.ph), p = s.ckt.part('S'); if (p && p.type === 'I') { p.value = I / 1000; s.ckt.solve(); } };
const ex2Part = k => (k >= 3 && k <= 3 ? EX2.b : k >= 1 && k <= 2 ? EX2.a : k >= 4 ? null : null);
const ex2Plot = (ctx, b, bd, k, s) => { const sh = bd.short, segs = [], pts = [], dV = [], dI = [], guides = [];
  /* each part gets its own window: around 2 mA for (a), around 25 mA for (b), the whole curve for the dc comparison */
  const win = k <= 2 ? { v: [0.55, 0.85], i: [0, 8], xt: [0.6, 0.65, 0.7, 0.76, 0.8], yt: [2, 4, 6, 8] } : k === 3 ? { v: [0.7, 0.85], i: [0, 34], xt: [0.75, 0.78, 0.8, 0.85], yt: [10, 20, 25, 30] }
    : { v: [0, 1], i: [0, 32], xt: [0.2, 0.4, 0.6, 0.8, 1], yt: [2, 10, 20, 25, 30] };
  if (k >= 1 && k !== 3) { segs.push({ a: EX2.a.t1, b: EX2.a.t2, color: C.tan, w: 2.4, ext: 0.12 }); pts.push({ v: 0.7, i: 2, color: tag(k <= 2), label: sh ? 'Q' : 'Q: 0.7 V, 2 mA', side: -1 }); }
  if (k === 2) { dV.push({ v1: 0.65, v2: 0.76, at: 5.4, label: 'ΔV_d = 0.11 V', above: true }); dI.push({ i1: 0, i2: 4, at: 0.79, label: 'ΔI_d = 4 mA' }); guides.push({ v: 0.76, i: 4, toY: false }, { v: 0.65, i: 0, toY: false }); }
  if (k >= 3) { segs.push({ a: EX2.b.t1, b: EX2.b.t2, color: C.tan, w: 2.4, ext: 0.25 }); pts.push({ v: 0.79, i: 25, color: tag(k === 3), label: sh ? 'Q' : 'Q: 0.79 V, 25 mA', side: -1 }); }
  if (k === 3) { dV.push({ v1: 0.78, v2: 0.8, at: 15, label: 'ΔV_d = 0.02 V' }); dI.push({ i1: 20, i2: 30, at: 0.82, label: 'ΔI_d = 10 mA' }); guides.push({ v: 0.78, i: 20, toY: false }, { v: 0.8, i: 30, toY: false }); }
  if (k >= 4) { segs.push({ a: [0, 0], b: [0.7, 2], color: C.chord, w: 2, dash: [6, 4] }, { a: [0, 0], b: [0.79, 25], color: C.chord, w: 2, dash: [6, 4] }); }
  if (s && s.solved && s.ckt && (k >= 1 && k <= 3)) { const v = s.ckt.Vab('D').re, i = s.ckt.I('D').re * 1e3; pts.push({ v, i, color: '#e8ecf7', r: 5 }); }
  IE.ivPlot(ctx, b, { ...win, curves: [{ f: CH1.F127 }], segs, pts, dV, dI, guides,
    title: sh ? '' : t(k <= 2 ? 'รูป 1.27 ขยายรอบ 2 mA' : k === 3 ? 'รูป 1.27 ขยายรอบ 25 mA' : 'รูป 1.27 (สไลด์หน้า 51–53)', k <= 2 ? 'Fig. 1.27, zoomed about 2 mA' : k === 3 ? 'Fig. 1.27, zoomed about 25 mA' : 'Fig. 1.27 (slides pp. 51–53)') }); };
CH1.ex2Plot = ex2Plot;
DEF.ex2 = { ...LAY, solvedAt: 1, rowAsp: 0.62,
  spec: k => CH1.drive({ I: (k >= 3 ? 25 : 2) / 1000, d: T127, sText: k >= 3 ? (k === 3 ? '25 ± 5 mA' : '25 mA') : k >= 1 && k <= 2 ? '2 ± 1.8 mA' : '2 mA' }),
  tick: swingTick('ex2', ex2Part),
  glow: k => (k === 2 || k === 3 ? ['D'] : null),
  badge: k => (k >= 4 ? [['เทียบความต้านทานกระแสตรงกับกระแสสลับ', 'dc against ac resistance'], 'ok'] : k === 3 ? [['Q = 25 mA: r_d = 2 Ω', 'Q = 25 mA: r_d = 2 Ω'], 'ok'] : k >= 1 ? [['Q = 2 mA: กระแสแกว่งรอบจุดทำงาน', 'Q = 2 mA: the current swings about Q'], 'ok'] : [['จุดทำงาน Q และสัญญาณเล็ก', 'the Q-point and a small signal'], 'wait']),
  side: (ctx, b, bd, k, s) => ex2Plot(ctx, b, bd, k, s),
  steps: () => [
    step(t('<b>(a) จุดทำงาน \\(I_D = 2\\) mA</b>: สัญญาณกระแสสลับทำให้จุดทำงานขยับขึ้นลงรอบจุด Q (จุดสีขาวบนกราฟ) ลากเส้นสัมผัส (tangent) ที่ Q (เส้นสีเขียว) แล้วเลือกช่วงกระแสเท่า ๆ กันทั้งสองข้างของ Q คือ ±2 mA แล้วอ่านแรงดันบนเส้นสัมผัส (ในภาพจำลองแหล่งจ่ายแกว่งเพียง ±1.8 mA เพื่อไม่ให้กระแสลงถึงศูนย์)', '<b>(a) The operating point \\(I_D = 2\\) mA</b>: an ac signal moves the operating point up and down about Q (the white dot on the graph). Draw the tangent at Q (the green line), take equal swings on both sides of Q, ±2 mA, and read the voltages on the tangent (the simulated source swings only ±1.8 mA so that the current never reaches zero)'),
      block([R`I_D = 4\ \text{mA}: &\ V_D = 0.76\ \text{V}`, R`I_D = 0\ \text{mA}: &\ V_D = 0.65\ \text{V}`])),
    step(t('<b>ความต้านทานกระแสสลับ</b> (ac resistance) ตามสมการ (1.5): อัตราส่วนของการเปลี่ยนแปลงตามเส้นสัมผัส', '<b>The ac resistance</b> of Eq. (1.5): the ratio of the changes along the tangent'),
      block([R`\Delta I_d &= 4\ \text{mA} - 0\ \text{mA} = 4\ \text{mA}`, R`\Delta V_d &= 0.76\ \text{V} - 0.65\ \text{V} = 0.11\ \text{V}`, R`r_d &= \frac{\Delta V_d}{\Delta I_d} = \frac{0.11\ \text{V}}{4\ \text{mA}} = \boxed{27.5\ \Omega}`])),
    step(t('<b>(b) ที่ \\(I_D = 25\\) mA</b>: เส้นสัมผัสชันมาก เลือกช่วง ±5 mA (20 ถึง 30 mA) (แหล่งจ่ายกระแสเปลี่ยนเป็น 25 mA)', '<b>(b) At \\(I_D = 25\\) mA</b>: the tangent is very steep; take ±5 mA (20 to 30 mA) (the current source is now 25 mA)'),
      block([R`\Delta I_d &= 30 - 20 = 10\ \text{mA}`, R`\Delta V_d &= 0.8 - 0.78 = 0.02\ \text{V}`, R`r_d &= \frac{0.02\ \text{V}}{10\ \text{mA}} = \boxed{2\ \Omega}`])),
    step(t('<b>(c) เทียบกับความต้านทานกระแสตรง</b> ที่จุดทำงานเดียวกัน (เส้นประสีชมพูจากจุดกำเนิด)', '<b>(c) Compare with the dc resistance</b> at the same points (the dashed pink lines from the origin)'),
      block([R`I_D = 2\ \text{mA}: &\ R_D = \frac{0.7\ \text{V}}{2\ \text{mA}} = \boxed{350\ \Omega} \gg r_d = 27.5\ \Omega`, R`I_D = 25\ \text{mA}: &\ R_D = \frac{0.79\ \text{V}}{25\ \text{mA}} = \boxed{31.62\ \Omega} \gg r_d = 2\ \Omega`])),
    step(t('<b>เทียบกับสูตร \\(r_d = 26\\ \\text{mV}/I_D\\)</b> (สมการ 1.6 จากอนุพันธ์ของสมการ 1.2) ใช้ได้ในช่วงที่กราฟตั้งชัน ที่กระแสต่ำบริเวณเข่าของกราฟใช้ \\(n = 2\\) จึงคูณ 2', '<b>Against \\(r_d = 26\\ \\text{mV}/I_D\\)</b> (Eq. 1.6, from the derivative of Eq. 1.2), valid on the steep part; at low currents, near the knee, \\(n = 2\\), so it doubles'),
      block([R`25\ \text{mA}: &\ r_d = \frac{26\ \text{mV}}{25\ \text{mA}} = 1.04\ \Omega`, R`2\ \text{mA}: &\ r_d = 2\left(\frac{26\ \text{mV}}{2\ \text{mA}}\right) = 26\ \Omega`]),
      t('ส่วนต่างราว 1 Ω และ 1.5 Ω จากค่าที่อ่านจากกราฟถือเป็นความต้านทานของเนื้อสารและหน้าสัมผัส \\(r_B\\) (สมการ 1.7) การอ่านเส้นสัมผัสจากกราฟให้ความแม่นยำจำกัด ตำราจึงเตือนให้ใช้ผลอย่างระมัดระวัง', 'The differences of about 1 Ω and 1.5 Ω from the graphical values are put down to the body and contact resistance \\(r_B\\) (Eq. 1.7). Reading a tangent off a graph is not very precise, as the book itself warns.'))],
  ask: () => ({ fields: [num('(a) r<sub>d</sub> (Ω) =', 27.5, { tol: 0.2 }), num('(b) r<sub>d</sub> (Ω) =', 2, { tol: 0.05 }), num(t('R<sub>D</sub> ที่ 2 mA (Ω) =', 'R<sub>D</sub> at 2 mA (Ω) ='), 350, { tol: 1 }), num(t('R<sub>D</sub> ที่ 25 mA (Ω) =', 'R<sub>D</sub> at 25 mA (Ω) ='), 31.62, { tol: 0.05 })],
    check: v => (near(v[0], 350, 1) ? t('นั่นคือความต้านทานกระแสตรง: ความต้านทานกระแสสลับใช้การเปลี่ยนแปลง \\(\\Delta V_d/\\Delta I_d\\) ตามเส้นสัมผัส', 'That is the dc resistance; the ac resistance uses the changes \\(\\Delta V_d/\\Delta I_d\\) along the tangent.') : '') }),
  answer: () => t('(a) \\(r_d = 27.5\\ \\Omega\\) (b) \\(r_d = 2\\ \\Omega\\) (c) \\(R_D = 350\\ \\Omega\\) และ \\(31.62\\ \\Omega\\) มากกว่า \\(r_d\\) มาก ตรงกับ Boylestad Example 1.4', '(a) \\(r_d = 27.5\\ \\Omega\\) (b) \\(r_d = 2\\ \\Omega\\) (c) \\(R_D = 350\\ \\Omega\\) and \\(31.62\\ \\Omega\\), far above \\(r_d\\), as in Boylestad Example 1.4.') };

/* ---------- page 1.5, problem 3: the average ac resistance of Fig. 1.28 (between 2 and 17 mA) ---------- */
const T128 = IE.tableOf(CH1.F128, 0.8, 0.002), AVG = { Q: [0.6875, 9.5], swing: 7.5, r2: 1000 / CH1.F128.slope(0.65), r17: 1000 / CH1.F128.slope(0.725) };
CH1.AVG = AVG;
DEF.avg = { ...LAY, solvedAt: 1, rowAsp: 0.62,
  spec: k => CH1.drive({ I: 9.5e-3, d: T128, sText: k >= 1 ? '2 … 17 mA' : '9.5 mA' }),
  tick: swingTick('avg', k => (k >= 1 ? AVG : null)),
  glow: k => (k === 1 ? ['D'] : null),
  badge: k => (k >= 2 ? [['r_av = 5 Ω ระหว่าง 2 ถึง 17 mA', 'r_av = 5 Ω from 2 to 17 mA'], 'ok'] : k >= 1 ? [['สัญญาณใหญ่: กระแสแกว่ง 2 ถึง 17 mA', 'a large signal: 2 to 17 mA'], 'ok'] : [['สัญญาณใหญ่กวาดกราฟเป็นช่วงกว้าง', 'a large signal sweeps a wide part of the curve'], 'wait']),
  side: (ctx, b, bd, k, s) => { const sh = bd.short, segs = [], pts = [], dV = [], dI = [], guides = [];
    if (k >= 1) { pts.push({ v: 0.65, i: 2, color: C.q, label: sh ? '2 mA' : '0.65 V, 2 mA', side: 1 }, { v: 0.725, i: 17, color: C.q, label: sh ? '17 mA' : '0.725 V, 17 mA', side: -1 }); guides.push({ v: 0.65, i: 2 }, { v: 0.725, i: 17 }); }
    if (k >= 2) { segs.push({ a: [0.65, 2], b: [0.725, 17], color: C.avg, w: 2.6, ext: 0.15 }); dV.push({ v1: 0.65, v2: 0.725, at: 20.5, label: 'ΔV_d = 0.075 V', above: true }); dI.push({ i1: 2, i2: 17, at: 0.765, label: 'ΔI_d = 15 mA' }); }
    if (k >= 3) segs.push({ a: [0.65 - 2 * AVG.r2 / 1000, 0], b: [0.65 + 2 * AVG.r2 / 1000, 4], color: C.tan, w: 2, dash: [6, 4] }, { a: [0.725 - 4 * AVG.r17 / 1000, 13], b: [0.725 + 4 * AVG.r17 / 1000, 21], color: C.tan, w: 2, dash: [6, 4] });
    if (s && s.solved && s.ckt) pts.push({ v: s.ckt.Vab('D').re, i: s.ckt.I('D').re * 1e3, color: '#e8ecf7', r: 5 });
    IE.ivPlot(ctx, b, { v: [0.55, 0.8], i: [0, 22], xt: [0.6, 0.65, 0.7, 0.75, 0.8], yt: [2, 5, 10, 15, 17, 20], curves: [{ f: CH1.F128 }], segs, pts, dV, dI, guides, title: sh ? '' : t('รูป 1.28 ขยายช่วง 0.55–0.8 V', 'Fig. 1.28, 0.55–0.8 V') }); },
  steps: () => [
    step(t('<b>ขอบเขตการทำงาน</b>: สัญญาณขาเข้าใหญ่พอให้กระแสแกว่งจาก 2 mA ถึง 17 mA (จุดสีขาว) อ่านแรงดันที่ปลายทั้งสอง', '<b>The limits of operation</b>: the input is large enough to swing the current from 2 mA to 17 mA (the white dot). Read the voltage at both ends'),
      block([R`I_D = 2\ \text{mA}: &\ V_D = 0.65\ \text{V}`, R`I_D = 17\ \text{mA}: &\ V_D = 0.725\ \text{V}`])),
    step(t('<b>ความต้านทานกระแสสลับเฉลี่ย</b> (average ac resistance) ตามสมการ (1.8): ส่วนกลับของความชันของเส้นตรงที่ลากระหว่างสองจุดนั้น (เส้นสีม่วง)', '<b>The average ac resistance</b> of Eq. (1.8): the reciprocal of the slope of the straight line between the two points (the purple line)'),
      block([R`\Delta I_d &= 17\ \text{mA} - 2\ \text{mA} = 15\ \text{mA}`, R`\Delta V_d &= 0.725\ \text{V} - 0.65\ \text{V} = 0.075\ \text{V}`, R`r_{av} &= \frac{\Delta V_d}{\Delta I_d}\bigg|_{\text{pt. to pt.}} = \frac{0.075\ \text{V}}{15\ \text{mA}} = \boxed{5\ \Omega}`])),
    step(t(`<b>เทียบกับความต้านทานกระแสสลับที่ปลายทั้งสอง</b> (เส้นประสีเขียว อ่านจากเส้นโค้งในภาพจำลอง): ที่ 2 mA ราว ${fd(AVG.r2, 0)} Ω และที่ 17 mA ราว ${fd(AVG.r17, 1)} Ω ค่าเฉลี่ย 5 Ω อยู่ระหว่างสองค่านี้ จึงใช้แทนไดโอดได้ทั้งช่วง ซึ่งจะเป็นประโยชน์กับวงจรสมมูลในหน้า 1.6`, `<b>Against the ac resistance at the two ends</b> (the dashed green lines, read off the curve of the simulation): about ${fd(AVG.r2, 0)} Ω at 2 mA and ${fd(AVG.r17, 1)} Ω at 17 mA. The average, 5 Ω, lies between them, so one value can stand for the diode over the whole range, which the equivalent circuits of page 1.6 use.`),
      block([R`r_d(17\ \text{mA}) &< r_{av} = 5\ \Omega < r_d(2\ \text{mA})`]), t('ยิ่งช่วงกระแสที่ใช้หาค่าเฉลี่ยต่ำ ความต้านทานเฉลี่ยยิ่งสูง เหมือนกับความต้านทานกระแสตรงและกระแสสลับ (สไลด์หน้า 55)', 'The lower the currents used for the average, the higher the average resistance, as with the dc and ac resistances (slide p. 55).'))],
  ask: () => ({ fields: [num('ΔV<sub>d</sub> (V) =', 0.075, { tol: 0.001 }), num('ΔI<sub>d</sub> (mA) =', 15, { tol: 0.05 }), num('r<sub>av</sub> (Ω) =', 5, { tol: 0.05 })],
    check: v => (near(v[2], 0.725 / 17e-3, 0.5) ? t('นั่นคือความต้านทานกระแสตรงที่ 17 mA: ความต้านทานเฉลี่ยใช้ผลต่างระหว่างสองจุด', 'That is the dc resistance at 17 mA; the average resistance uses the differences between the two points.') : '') }),
  answer: () => t('\\(\\Delta V_d = 0.075\\) V, \\(\\Delta I_d = 15\\) mA, \\(r_{av} = 5\\ \\Omega\\) ตรงกับตัวอย่างของ Boylestad หัวข้อ 1.8 (รูป 1.28)', '\\(\\Delta V_d = 0.075\\) V, \\(\\Delta I_d = 15\\) mA, \\(r_{av} = 5\\ \\Omega\\), as in the example of Boylestad section 1.8 (Fig. 1.28).') };

/* ---------- page 1.6: the three equivalent circuits against the actual diode ---------- */
/* the "actual" silicon diode of page 1.6: Shockley (n = 1, 27 °C) plus a 5 Ω body resistance, 0.8 V at 10 mA (the specification point of section 1.9) */
CH1.F129 = (() => { const vt = CK.DIODE.vt(27), rB = 5, Is = 0.01 / (Math.exp((0.8 - 0.01 * rB) / vt) - 1), pts = [[0, 0]];
  for (let e = -7; e <= Math.log10(45) + 1e-9; e += 0.05) { const I = Math.pow(10, e) / 1000; pts.push([vt * Math.log(I / Is + 1) + I * rB, I * 1000]); }
  const f = IE.curve(pts, Is * 1000); f.Is = Is; f.rB = rB; return f; })();
const T129 = IE.tableOf(CH1.F129, 1.0, 0.002);
CH1.MODELS = ['actual', 'pwl', 'simple', 'ideal'];
CH1.MNAME = { actual: ['ไดโอดจริง', 'actual diode'], pwl: ['เชิงเส้นเป็นช่วง', 'piecewise-linear'], simple: ['แบบง่าย', 'simplified'], ideal: ['อุดมคติ', 'ideal'] };
CH1.MCOLS = { actual: '#4fb3ff', pwl: '#7ee787', simple: '#ffd166', ideal: '#ff7eb6' };
/* E, R and one diode model; the models are drawn as their parts (Fig. 1.30–1.32): the battery V_K (+ towards the anode, it opposes conduction), r_av, an ideal diode */
CH1.model = (m, o = {}) => { const E = o.E ?? 10, Rv = o.R ?? 1000, vk = o.vk ?? 0.7, rav = o.rav ?? 10, nodes = { a: [0, 0], b: [3.6, 0], k: [3.6, 2.8], g: [0, 2.8] };
  const parts = [{ id: 'E', type: 'V', a: 'a', b: 'g', value: E, name: 'E', valText: `${fd(E, 2)} V`, side: -1 }, { id: 'R', type: 'R', a: 'a', b: 'b', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω') }, W_('k', 'g')];
  if (m === 'actual') parts.push({ id: 'D', type: 'D', a: 'b', b: 'k', name: 'D', side: 1, ...T129 });
  else if (m === 'ideal') parts.push({ id: 'D', type: 'D', a: 'b', b: 'k', model: 'ideal', name: t('อุดมคติ', 'ideal'), side: 1 });
  else { nodes.m1 = [3.6, 0.95]; nodes.m2 = [3.6, 1.85];
    parts.push({ id: 'VK', type: 'V', a: 'b', b: 'm1', value: vk, name: 'V_K', valText: `${fd(vk, 1)} V`, side: 1 });
    if (m === 'pwl') parts.push({ id: 'Rav', type: 'R', a: 'm1', b: 'm2', value: rav, name: 'r_av', valText: `${fd(rav, 0)} Ω`, side: 1 }); else parts.push(W_('m1', 'm2'));
    parts.push({ id: 'D', type: 'D', a: 'm2', b: 'k', model: 'ideal', name: t('อุดมคติ', 'ideal'), side: 1 }); }
  return { ground: 'g', nodes, parts }; };
/* the current each model gives (mA) */
CH1.mI = (m, E, Rv, vk = 0.7, rav = 10) => (m === 'actual' ? CH1.op(CH1.F129, E, Rv).I : m === 'pwl' ? Math.max(0, (E - vk) / (Rv + rav)) * 1000 : m === 'simple' ? Math.max(0, (E - vk) / Rv) * 1000 : Math.max(0, E / Rv) * 1000);
/* the characteristic of a model (mA) */
CH1.mF = (m, vk = 0.7, rav = 10) => (m === 'actual' ? CH1.F129 : m === 'pwl' ? v => Math.max(0, (v - vk) / rav * 1000) : m === 'simple' ? v => (v < vk ? 0 : NaN) : v => (v < 0 ? 0 : NaN));
const MD = { c1: { E: 10, R: 1000 }, c2: { E: 2, R: 100 } };
MD.c1.I = {}; MD.c2.I = {}; CH1.MODELS.forEach(m => { MD.c1.I[m] = CH1.mI(m, 10, 1000); MD.c2.I[m] = CH1.mI(m, 2, 100); }); CH1.MD = MD;
const err = (c, m) => 100 * (c.I[m] / c.I.actual - 1), MN = m => t(...CH1.MNAME[m]);
const mdBars = (ctx, b, bd, c, title) => CH8.bars(ctx, b, CH1.MODELS.map(m => ({ label: bd.short ? m === 'actual' ? t('จริง', 'real') : m === 'pwl' ? t('เชิงเส้น', 'PWL') : m === 'simple' ? t('ง่าย', 'simple') : t('อุดมคติ', 'ideal') : t(...CH1.MNAME[m]), v: c.I[m], color: CH1.MCOLS[m],
  sub: m === 'actual' ? '' : `${err(c, m) >= 0 ? '+' : '−'}${fd(Math.abs(err(c, m)), 1)} %` })), { title: bd.short ? 'I_D (mA)' : title, fmt: v => fd(v, 2), sub: true });
const mdPlot = (ctx, b, bd, m, op, o = {}) => { const sh = bd.short, segs = [], curves = [{ f: CH1.F129, color: CH1.MCOLS.actual, w: m === 'actual' ? 3 : 2, dash: m === 'actual' ? null : [6, 4] }];
  if (m === 'pwl' || o.all) segs.push({ a: [0, 0], b: [0.7, 0], color: CH1.MCOLS.pwl, w: 3 }, { a: [0.7, 0], b: [0.84, 14], color: CH1.MCOLS.pwl, w: 3 });
  if (m === 'simple') segs.push({ a: [0, 0], b: [0.7, 0], color: CH1.MCOLS.simple, w: 3 }, { a: [0.7, 0], b: [0.7, 14], color: CH1.MCOLS.simple, w: 3 });
  if (m === 'ideal') segs.push({ a: [0, 0], b: [0, 14], color: CH1.MCOLS.ideal, w: 3 });
  /* a point above the plot (I > 11.8 mA) is pinned where the model's line leaves the top, marked ↑; the label keeps the true values */
  const vTop = m === 'actual' ? CH1.F129.vAt(11.8) : m === 'pwl' ? 0.7 + 11.8 / 100 : m === 'simple' ? 0.7 : 0, up = op && op.I > 11.8;
  const pts = op ? [{ v: up ? vTop : Math.min(op.V, 0.99), i: Math.min(op.I, 11.8), color: C.q, label: (up ? '↑ ' : '') + (sh ? `${fd(op.I, 2)} mA` : `${fd(op.V, 3)} V, ${fd(op.I, 2)} mA`), side: op.V > 0.5 ? -1 : 1 }] : [];
  if (o.spec) pts.push({ v: 0.8, i: 10, color: '#e8ecf7', label: sh ? '10 mA' : t('จุดจากเอกสารข้อมูล 0.8 V, 10 mA', 'data-sheet point 0.8 V, 10 mA'), side: -1 });
  IE.ivPlot(ctx, b, { v: [0, 1], i: [0, 12], xt: [0.2, 0.4, 0.6, 0.7, 0.8, 1], yt: [5, 10], curves, segs, pts, title: sh ? '' : o.title || t(`ลักษณะสมบัติ: ${CH1.MNAME[m][0]}`, `characteristic: ${CH1.MNAME[m][1]}`),
    dV: o.spec ? [{ v1: 0.7, v2: 0.8, at: 11, label: '0.1 V', above: true, color: CH1.MCOLS.pwl }] : [] }); };
CH1.mdPlot = mdPlot; CH1.mdBars = mdBars;
DEF.models = { ...LAY, solvedAt: 2,
  spec: k => (k >= 6 ? CH1.model('actual', { E: 2, R: 100 }) : k === 5 ? CH1.model('actual') : k === 4 ? CH1.model('ideal') : k === 3 ? CH1.model('simple') : k === 2 ? CH1.model('pwl') : CH1.model('actual')),
  glow: k => (k === 2 ? ['VK', 'Rav'] : k === 3 ? ['VK'] : k === 4 ? ['D'] : null),
  badge: k => (k >= 6 ? [['E = 2 V, R = 100 Ω: แบบจำลองใดยังใช้ได้?', 'E = 2 V, R = 100 Ω: which model still works?'], 'wait'] : k === 5 ? [[`ไดโอดจริง: ${fd(MD.c1.I.actual, 3)} mA`, `actual diode: ${fd(MD.c1.I.actual, 3)} mA`], 'ok']
    : k >= 2 ? [[`${CH1.MNAME[['pwl', 'simple', 'ideal'][k - 2]][0]}: ${fd(MD.c1.I[['pwl', 'simple', 'ideal'][k - 2]], 3)} mA`, `${CH1.MNAME[['pwl', 'simple', 'ideal'][k - 2]][1]}: ${fd(MD.c1.I[['pwl', 'simple', 'ideal'][k - 2]], 3)} mA`], 'ok'] : [['E = 10 V, R = 1 kΩ, ไดโอดซิลิคอน', 'E = 10 V, R = 1 kΩ, a silicon diode'], 'wait']),
  side: (ctx, b, bd, k) => { if (k >= 6) return mdBars(ctx, b, bd, MD.c2, t('I_D (mA) เมื่อ E = 2 V, R = 100 Ω', 'I_D (mA) for E = 2 V, R = 100 Ω'));
    if (k === 5) return mdBars(ctx, b, bd, MD.c1, t('I_D (mA) เมื่อ E = 10 V, R = 1 kΩ', 'I_D (mA) for E = 10 V, R = 1 kΩ'));
    if (k >= 2) { const m = ['pwl', 'simple', 'ideal'][k - 2], I = MD.c1.I[m]; return mdPlot(ctx, b, bd, m, { V: m === 'ideal' ? 0 : 0.7 + (m === 'pwl' ? I / 1000 * 10 : 0), I }); }
    mdPlot(ctx, b, bd, 'pwl', null, { spec: k >= 1, title: t('ไดโอดจริง (เส้นประ) และเส้นตรงสองช่วง', 'the actual diode (dashed) and two straight lines') }); },
  steps: () => [
    step(t('<b>(a) หา \\(r_{av}\\)</b> จากจุดในเอกสารข้อมูล (data sheet) \\(I_F = 10\\) mA ที่ \\(V_F = 0.8\\) V: ซิลิคอนเริ่มนำที่ \\(V_K = 0.7\\) V จึงลากเส้นตรงจาก (0.7 V, 0) ไปยังจุดนั้น (รูป 1.29)', '<b>(a) Find \\(r_{av}\\)</b> from the data-sheet point \\(I_F = 10\\) mA at \\(V_F = 0.8\\) V: silicon starts to conduct at \\(V_K = 0.7\\) V, so the line runs from (0.7 V, 0) to that point (Fig. 1.29)'),
      block([R`r_{av} &= \frac{V_F - V_K}{I_F - 0} = \frac{0.8\ \text{V} - 0.7\ \text{V}}{10\ \text{mA} - 0\ \text{mA}} = \boxed{10\ \Omega}`])),
    step(t('<b>(b) แบบจำลองเชิงเส้นเป็นช่วง</b> (piecewise-linear): ไดโอดกลายเป็นแบตเตอรี \\(V_K\\) ที่ต้านการนำ ต่ออนุกรมกับ \\(r_{av}\\) และไดโอดอุดมคติ (รูป 1.30) ไดโอดอุดมคตินำ จึงใช้กฎแรงดันของเคียร์ชอฟฟ์ได้ตรง ๆ', '<b>(b) The piecewise-linear model</b>: the diode becomes a battery \\(V_K\\) opposing conduction, in series with \\(r_{av}\\) and an ideal diode (Fig. 1.30). The ideal diode conducts, so Kirchhoff\'s voltage law applies directly'),
      block([R`I_D &= \frac{E - V_K}{R + r_{av}} = \frac{10 - 0.7}{1000 + 10} = \boxed{${fd(MD.c1.I.pwl, 3)}\ \text{mA}}`])),
    step(t('<b>(c) แบบจำลองแบบง่าย</b> (simplified): ตัด \\(r_{av}\\) ออกเพราะเล็กมากเมื่อเทียบกับ R เหลือแบตเตอรี 0.7 V กับไดโอดอุดมคติ (รูป 1.31)', '<b>(c) The simplified model</b>: drop \\(r_{av}\\), tiny next to R, leaving the 0.7 V battery and an ideal diode (Fig. 1.31)'),
      block([R`I_D &= \frac{E - V_K}{R} = \frac{10 - 0.7}{1\ \text{k}\Omega} = \boxed{9.3\ \text{mA}}`])),
    step(t('<b>(d) แบบจำลองอุดมคติ</b> (ideal): ตัด 0.7 V ออกด้วย เพราะเล็กเมื่อเทียบกับ E = 10 V (รูป 1.32)', '<b>(d) The ideal model</b>: drop the 0.7 V as well, small next to E = 10 V (Fig. 1.32)'),
      block([R`I_D &= \frac{E}{R} = \frac{10}{1\ \text{k}\Omega} = \boxed{10\ \text{mA}}`])),
    step(t('<b>(e) เทียบกับไดโอดจริง</b> (ไดโอดซิลิคอนที่ผ่านจุด 0.8 V, 10 mA ตัวแก้วงจรหาจุดทำงานจากเส้นโค้งจริง) แผงข้างภาพแสดงความคลาดเคลื่อนของแต่ละแบบ', '<b>(e) Against the actual diode</b> (a silicon diode through the point 0.8 V, 10 mA; the solver finds its operating point on the real curve). The side panel shows each model\'s error'),
      block([R`I_D(\text{${MN('actual')}}) &= ${fd(MD.c1.I.actual, 3)}\ \text{mA}`, R`\text{${MN('pwl')}} &: +${fd(err(MD.c1, 'pwl'), 2)}\,\%`, R`\text{${MN('simple')}} &: +${fd(err(MD.c1, 'simple'), 1)}\,\%`, R`\text{${MN('ideal')}} &: +${fd(err(MD.c1, 'ideal'), 1)}\,\%`])),
    step(t('<b>(f) ลด E เป็น 2 V และ R เป็น 100 Ω</b>: ตอนนี้ E ไม่ได้มากกว่า \\(V_K\\) มาก และ R ไม่ได้มากกว่า \\(r_{av}\\) มาก', '<b>(f) Lower E to 2 V and R to 100 Ω</b>: now E is not much larger than \\(V_K\\), nor R much larger than \\(r_{av}\\)'),
      block([R`\text{${MN('pwl')}}: &\ \frac{2 - 0.7}{100 + 10} = ${fd(MD.c2.I.pwl, 2)}\ \text{mA}`, R`\text{${MN('simple')}}: &\ \frac{2 - 0.7}{100} = 13\ \text{mA}`, R`\text{${MN('ideal')}}: &\ \frac{2}{100} = 20\ \text{mA}`, R`\text{${MN('actual')}}: &\ ${fd(MD.c2.I.actual, 2)}\ \text{mA}`]),
      t(`แบบอุดมคติคลาดไป +${fd(err(MD.c2, 'ideal'), 0)} % แบบง่าย +${fd(err(MD.c2, 'simple'), 0)} % ส่วนแบบเชิงเส้นเป็นช่วงยังแม่น ตรงกับเงื่อนไขในตาราง 1.7: แบบง่ายใช้เมื่อ \\(R_{network} \\gg r_{av}\\) แบบอุดมคติใช้เมื่อ \\(E_{network} \\gg V_K\\) ด้วย`, `The ideal model is off by +${fd(err(MD.c2, 'ideal'), 0)} %, the simplified one by +${fd(err(MD.c2, 'simple'), 0)} %, while the piecewise-linear model stays close: the conditions of Table 1.7, the simplified model needs \\(R_{network} \\gg r_{av}\\), the ideal one also \\(E_{network} \\gg V_K\\).`))],
  ask: () => ({ fields: [num('r<sub>av</sub> (Ω) =', 10, { tol: 0.05 }), num(t('I<sub>D</sub> เชิงเส้นเป็นช่วง (mA) =', 'I<sub>D</sub> piecewise-linear (mA) ='), MD.c1.I.pwl, { tol: 0.005 }), num(t('I<sub>D</sub> แบบง่าย (mA) =', 'I<sub>D</sub> simplified (mA) ='), 9.3, { tol: 0.005 }), num(t('I<sub>D</sub> อุดมคติ (mA) =', 'I<sub>D</sub> ideal (mA) ='), 10, { tol: 0.005 })],
    check: v => (near(v[0], 80, 0.5) ? t('นั่นคือความต้านทานกระแสตรงที่ 10 mA: \\(r_{av}\\) วัดจาก 0.7 V ไม่ใช่จาก 0 V', 'That is the dc resistance at 10 mA; \\(r_{av}\\) is measured from 0.7 V, not from 0 V.') : near(v[1], 10.7 / 1010 * 1000, 0.01) ? t('แบตเตอรี \\(V_K\\) ต้านการนำ จึงลบออกจาก E', 'The battery \\(V_K\\) opposes conduction, so it is subtracted from E.') : '') }),
  answer: () => t(`\\(r_{av} = 10\\ \\Omega\\) · E = 10 V, R = 1 kΩ: ${fd(MD.c1.I.pwl, 3)}, 9.3 และ 10 mA เทียบกับไดโอดจริง ${fd(MD.c1.I.actual, 3)} mA · E = 2 V, R = 100 Ω: ${fd(MD.c2.I.pwl, 2)}, 13 และ 20 mA เทียบกับ ${fd(MD.c2.I.actual, 2)} mA · \\(r_{av}\\) ตาม Boylestad หัวข้อ 1.9 ส่วนวงจรแต่งเพิ่มเพื่อฝึก`, `\\(r_{av} = 10\\ \\Omega\\) · E = 10 V, R = 1 kΩ: ${fd(MD.c1.I.pwl, 3)}, 9.3 and 10 mA against ${fd(MD.c1.I.actual, 3)} mA for the actual diode · E = 2 V, R = 100 Ω: ${fd(MD.c2.I.pwl, 2)}, 13 and 20 mA against ${fd(MD.c2.I.actual, 2)} mA · \\(r_{av}\\) as in Boylestad section 1.9; the circuits are added for practice.`) };

CH1.DEF = DEF;
CH1.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.CH1 = CH1;
})(window);
