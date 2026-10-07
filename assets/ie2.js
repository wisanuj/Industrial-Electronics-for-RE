/* ie2.js — chapter 2 (diode applications): the circuits and the worked problems of the slides, on top of ie.js and ie1.js.
   Sources: course slides "Chapter 2 Diode Applications (Part I)" (51 pp., Ex.1–13) and "(Part II)" (32 pp., Ex.1–7), and
   Boylestad & Nashelsky, 11th ed., chapter 2. Part I Ex.1–3 = Examples 2.1–2.3, Ex.4–5 = 2.4–2.5, Ex.6 = an earlier edition's version of
   Example 2.7 (the 11th has a silicon diode and a red LED), Ex.7 = Example 2.8 with 12 V (the 11th: 20 V), Ex.8–9 = 2.9–2.10, Ex.10 = an
   earlier edition's example (not in the 11th), Ex.11 = an earlier edition's version of Example 2.12 (the 11th: Si in parallel with a green
   LED), Ex.12 = 2.13, Ex.13 = 2.16 · Part II Ex.1 = 2.18, Ex.2 = 2.20, Ex.3–4 = 2.22–2.23, Ex.5–7 = 2.26–2.28.
   F23  Fig. 2.3b (Ex.1): digitized from the slide picture pixel by pixel (the line is thick; its low part was moved down to the axis), then
        moved left by up to 13 mV (a ramp from 2 mA to 18.44 mA) so that it meets the load line at the book's reading, 0.78 V and 18.5 mA.
   Diodes: SI = { model: 'simple', vk: 0.7 }, GE = { vk: 0.3 }, IDEAL (the approximate models of Table 2.1).
   CH2.DEF: ex1 ex2 ex3 (page 2.1), ex4 ex5 (2.2), ex6 ex7 ex8 (2.3), ex9 ex10 ex11 ex12 (2.4), ex13 (2.5), ex17 ct (2.6), clip1 clip2 (2.7),
   cl3 cl4 (2.8, a transient: CH2.Rec), z5 z6 z7 (2.9). Time pictures solve the circuit again each frame (CH2.drive) and plot one cycle
   swept through the same solver (CH2.cycle), so the waveforms are the solver's own.
   CH2.problem(n, key) wires a section like CH8.wire */
(function (global) {
'use strict';
const CH2 = {}, fd = CH6.fd, R = String.raw, C = IE.COL;
const t = (th, en) => MC.t(th, en);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o });
const SI = { model: 'simple', vk: 0.7 }, GE = { model: 'simple', vk: 0.3 }, IDEAL = { model: 'ideal' };
CH2.SI = SI; CH2.GE = GE; CH2.IDEAL = IDEAL;
const v2 = x => fd(x, 2).replace('-', '−'), mAt = x => `${fd(x * 1e3, 3)}\\ \\text{mA}`;
const LAY = { pad: 1.2, wideAt: 1e9, cktAspM: 0.5, rowAsp: 0.56, rowMin: 250, dotSpeed: 80, view: { acPeak: false }, shortSpec: sp => CH8.margins(sp, 1.2),
  vo: () => ({ speed: 80 / 0.01, dotRef: 0.01 }) };   // fixed dot scale: 10 mA = 80 px/s
/* signed voltages around a loop (Kirchhoff's voltage law): rises up, drops down, Σ = 0 */
const kvl = (ctx, b, bd, items, title) => CH8.bars(ctx, b, items, { title: bd.short ? t('แรงดันรอบวง (V)', 'loop voltages (V)') : title, fmt: v => v2(v), sub: !bd.short, sum: true, unit: 'V' });
const vab = (s, id) => (s.ckt ? s.ckt.Vab(id).re : 0), cur = (s, id) => (s.ckt ? s.ckt.I(id).re : 0);
/* a tag beside a part (state of a diode, or a label) */
const tagAt = (v, id, text, col, dx = 0.45, dy = 0) => { const p = v.ckt.part(id); if (!p) return; const [x1, y1] = v.P(p.a), [x2, y2] = v.P(p.b);
  CH6.tag(v.ctx, IE.tt(text), (x1 + x2) / 2 + v.u * dx, (y1 + y2) / 2 + v.u * dy, col || C.q, { align: dx >= 0 ? 'left' : 'right', size: Math.max(11.5, v.u * 0.26) }); };
CH2.tagAt = tagAt; CH2.kvl = kvl;
const ON = ['นำกระแส', 'on'], OFF = ['ไม่นำ', 'off'];

/* ---------------- Fig. 2.3b (Ex.1): a silicon diode, digitized from slide 8 ---------------- */
CH2.F23 = IE.curve([[0, 0], [0.3, 0.05], [0.4, 0.15], [0.45, 0.28], [0.5, 0.5], [0.55, 0.85], [0.6, 1.4], [0.63, 2.0], [0.65, 2.5], [0.67, 3.1], [0.69, 4.0], [0.7, 4.6],
  [0.716, 5.6], [0.725, 6.3], [0.735, 7.3], [0.743, 8.5], [0.752, 9.9], [0.761, 11.2], [0.77, 13.0], [0.78, 15.2], [0.789, 17.4], [0.798, 19.8], [0.807, 22.2], [0.82, 26], [0.84, 32]]
  .map(([v, i]) => [v - 0.013 * Math.max(0, Math.min(1, (i - 2) / 16.44)), i]), 1e-5);   // the book's reading: the load line meets the curve at 0.78 V, 18.5 mA
const T23 = IE.tableOf(CH2.F23, 1.0, 0.002);
CH2.T23 = T23;

/* ---------------- circuits ---------------- */
/* E on the left (+ up), the diode along the top (anode left unless flip), R down the right side: Fig. 2.3a, Ex.4, Ex.5 */
CH2.loop = (o = {}) => { const E = o.E ?? 10, Rv = o.R ?? 500, flip = !!o.flip, d = o.d || SI, nm = o.dName ?? (d === GE ? 'Ge' : d.model === 'ideal' ? '' : 'Si');
  const parts = [{ id: 'E', type: 'V', a: 'a', b: 'g', value: E, name: 'E', valText: `${v2(E)} V`, side: -1 }, W_('a', 'd1'),
    { id: 'D', type: 'D', a: flip ? 'd2' : 'd1', b: flip ? 'd1' : 'd2', name: nm, valText: '', side: -1, ...d }, W_('d2', 'b'),
    { id: 'R', type: 'R', a: 'b', b: 'c', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω') }, W_('c', 'g')];
  /* eq: the diode replaced by its equivalent: 'off' an open gap, 'vk' the battery V_K (+ at the anode side, it opposes conduction), 'on' a wire */
  if (o.eq) { const D = parts[2]; if (o.eq === 'off') Object.assign(D, { type: 'O', name: '', label: false });
    else if (o.eq === 'vk') Object.assign(D, { type: 'V', battery: true, a: flip ? 'd2' : 'd1', b: flip ? 'd1' : 'd2', value: d.vk ?? 0.7, name: 'V_K', valText: `${fd(d.vk ?? 0.7, 1)} V`, side: -1 });
    else if (o.eq === 'res') Object.assign(D, { type: 'R', value: 1000, name: '', valText: '', side: -1 });   // step 1 of slide 17: imagine a resistor in its place
    else Object.assign(D, { type: 'W', name: '' }); }
  return { ground: 'g', nodes: { a: [0, 0], d1: [1.0, 0], d2: [2.6, 0], b: [3.6, 0], c: [3.6, 2.6], g: [0, 2.6] }, parts }; };

/* =====================================================================================================================
   page 2.1: load-line analysis (Part I Ex.1–3 = Examples 2.1–2.3): E = 10 V, R = 0.5 kΩ, a silicon diode */
const LL = (() => { const E = 10, Rv = 500, q = CH1.op(CH2.F23, E, Rv); return { E, R: Rv, Imax: E / Rv * 1000, VQ: q.V, IQ: q.I, book: { V: 0.78, I: 18.5 }, apx: (E - 0.7) / Rv * 1000 }; })();
CH2.LL = LL;
/* the load line on the characteristic. o: { model: 'curve' | 'apx' | 'ideal', zoom, q (point), extra } */
CH2.llPlot = (ctx, b, bd, o = {}) => { const sh = bd.short, E = o.E ?? LL.E, Rv = o.R ?? LL.R, Im = E / Rv * 1000, top = Math.max(22, Math.ceil(Im * 1.2 / 5) * 5), zoom = o.zoom;
  const curves = [], segs = [{ a: [0, Im], b: [E, 0], color: C.q, w: 2.4 }], pts = [], guides = [];
  if (o.model === 'apx') segs.push({ a: [0, 0], b: [0.7, 0], color: C.tan, w: 3.2 }, { a: [0.7, 0], b: [0.7, top * 1.2], color: C.tan, w: 3.2 });
  else if (o.model === 'ideal') segs.push({ a: [0, 0], b: [0, top * 1.2], color: C.tan, w: 3.2 });
  else curves.push({ f: CH2.F23, color: C.curve });
  /* the intercepts: E/R labelled above its point (headroom above), unless Q sits on it (the ideal diode) */
  if (o.ends) pts.push({ v: 0, i: Im, color: C.q, r: 5, label: o.q && Math.abs(o.q.V) < 0.02 ? '' : sh ? `${fd(Im, 1)} mA` : `E/R = ${fd(Im, 1)} mA`, side: 1, dy: 14 }, { v: E, i: 0, color: C.q, r: 5, label: `E = ${fd(E, 1)} V`, side: -1, dy: -16 });
  if (o.q) { pts.push({ v: o.q.V, i: o.q.I, color: C.chord, label: o.q.label, side: 1, dy: o.q.dy ?? (o.ends ? -18 : 16) }); guides.push({ v: o.q.V, i: o.q.I }); }   // dy > 0 is above; with the intercepts shown, under the load line
  IE.ivPlot(ctx, b, { v: zoom ? [0.55, 0.95] : [0, E * 1.05], i: [0, top], xt: zoom ? [0.6, 0.7, 0.78, 0.8, 0.9] : [0.7, 2, 4, 6, 8, 10].filter(x => x <= E * 1.05), yt: zoom ? [5, 10, 15, 18.5, 20] : (st => Array.from({ length: Math.floor((top - 1) / st) }, (_, k) => (k + 1) * st))(top > 50 ? 20 : top > 30 ? 10 : 5),
    curves, segs, pts, guides, title: sh ? '' : o.title || (zoom ? t('ขยายรอบจุดตัด (0.55–0.95 V)', 'zoomed about the intersection (0.55–0.95 V)') : t('เส้นโหลดบนลักษณะสมบัติ', 'load line on the characteristic')) }); };
const ll = (m, k) => CH2.loop({ E: LL.E, R: LL.R, d: m === 'curve' ? T23 : m === 'apx' ? SI : IDEAL, dName: 'Si' });
const DEF = {};
DEF.ex1 = { ...LAY, solvedAt: 2, spec: () => ll('curve'),
  glow: k => (k === 1 ? ['E', 'R'] : k === 2 ? ['D'] : k === 3 ? ['R'] : null),
  badge: k => (k >= 2 ? [[`Q ≅ (0.78 V, 18.5 mA)`, `Q ≅ (0.78 V, 18.5 mA)`], 'ok'] : k === 1 ? [['เส้นโหลดกำหนดโดยวงจร', 'the network sets the load line'], 'wait'] : [['จุดทำงานอยู่ตรงไหน?', 'where is the operating point?'], 'wait']),
  side: (ctx, b, bd, k) => CH2.llPlot(ctx, b, bd, { ends: k >= 1, zoom: k === 2 || k === 4, q: k >= 2 ? { V: LL.VQ, I: LL.IQ, label: bd.short ? 'Q' : t('Q (ตัวแก้วงจร)', 'Q (solver)') } : null }),
  steps: () => [
    step(t('<b>เส้นโหลด</b> (load line) มาจากวงจรล้วน ๆ: กฎแรงดันของเคียร์ชอฟฟ์รอบวงให้ \\(E = V_D + I_DR\\) (สมการ 1 ในสไลด์หน้า 4) จุดตัดแกนทั้งสองหาได้โดยให้ตัวแปรหนึ่งเป็นศูนย์ (สไลด์หน้า 5–6)', '<b>The load line</b> comes from the network alone: Kirchhoff\'s voltage law round the loop gives \\(E = V_D + I_DR\\) (Eq. 1, slide p. 4). Its intercepts follow by setting one variable to zero (slides pp. 5–6)'),
      block([R`V_D = 0: &\ I_D = \frac{E}{R} = \frac{10\ \text{V}}{0.5\ \text{k}\Omega} = 20\ \text{mA}`, R`I_D = 0: &\ V_D = E = 10\ \text{V}`])),
    step(t('<b>(a) จุดทำงาน Q</b>: จุดตัดของเส้นโหลดกับลักษณะสมบัติของไดโอด (ภาพขยายรอบจุดตัด) อ่านค่าลงบนแกนทั้งสอง (สไลด์หน้า 7)', '<b>(a) The Q-point</b>: where the load line meets the diode characteristic (zoomed picture); read it off both axes (slide p. 7)'),
      block([R`V_{DQ} &\cong \boxed{0.78\ \text{V}}`, R`I_{DQ} &\cong \boxed{18.5\ \text{mA}}`]),
      t(`เส้นโค้งในภาพจำลองอ่านจากรูปในสไลด์แล้วปรับให้ผ่านค่าที่ตำราอ่านได้ ตัวแก้วงจรหาจุดตัดได้ ${fd(LL.VQ, 3)} V และ ${fd(LL.IQ, 2)} mA ส่วน 18.5 mA ของตำราเป็นค่าที่อ่านจากกราฟ เส้นโหลดให้ (10 − 0.78)/0.5 kΩ = 18.44 mA`, `The simulated curve is read off the slide's figure and passed through the book's reading; the solver finds the crossing at ${fd(LL.VQ, 3)} V and ${fd(LL.IQ, 2)} mA. The book's 18.5 mA is a graph reading: the load line gives (10 − 0.78)/0.5 kΩ = 18.44 mA.`)),
    step(t('<b>(b) แรงดันคร่อม R</b> จากกฎแรงดันของเคียร์ชอฟฟ์', '<b>(b) The voltage across R</b> from Kirchhoff\'s voltage law'),
      block([R`V_R &= E - V_{DQ} = 10\ \text{V} - 0.78\ \text{V} = \boxed{9.22\ \text{V}}`])),
    step(t('<b>ความต้านทานกระแสตรงที่จุด Q</b> (หน้า 1.5): ใช้แทนไดโอดเฉพาะจุดทำงานนี้ แล้ววงจรกลายเป็นตัวต้านทานสองตัวอนุกรม ได้กระแสเท่าเดิม', '<b>The dc resistance at Q</b> (page 1.5): it can stand for the diode at this operating point only, turning the circuit into two resistors in series with the same current'),
      block([R`R_D &= \frac{V_{DQ}}{I_{DQ}} = \frac{0.78\ \text{V}}{18.5\ \text{mA}} = 42.16\ \Omega`, R`I_D &= \frac{E}{R_D + R} = \frac{10}{42.16 + 500} \cong 18.5\ \text{mA}\ \ \checkmark`]))],
  ask: () => ({ fields: [num('V<sub>DQ</sub> (V) =', 0.78, { tol: 0.012 }), num('I<sub>DQ</sub> (mA) =', 18.45, { tol: 0.2 }), num('V<sub>R</sub> (V) =', 9.22, { tol: 0.03 })],
    check: v => (near(v[1], 20, 0.05) ? t('20 mA คือจุดตัดแกนตั้งของเส้นโหลด (เมื่อ V<sub>D</sub> = 0) ไม่ใช่จุดทำงาน', '20 mA is where the load line meets the vertical axis (V<sub>D</sub> = 0), not the operating point.') : '') }),
  answer: () => t('(a) \\(V_{DQ} \\cong 0.78\\) V, \\(I_{DQ} \\cong 18.5\\) mA (b) \\(V_R = 9.22\\) V ตรงกับ Boylestad Example 2.1 · สไลด์หน้า 8–10 มีแต่โจทย์และรูป', '(a) \\(V_{DQ} \\cong 0.78\\) V, \\(I_{DQ} \\cong 18.5\\) mA (b) \\(V_R = 9.22\\) V, as in Boylestad Example 2.1 · slides pp. 8–10 give the problem and the figure only.') };
DEF.ex2 = { ...LAY, solvedAt: 1, spec: k => (k >= 1 ? CH2.loop({ E: 10, R: 500, d: SI, eq: k === 1 ? 'vk' : undefined }) : ll('apx')),
  glow: k => (k === 1 ? ['D'] : k === 2 ? ['R'] : null), after: (v, k) => { if (k === 1) tagAt(v, 'D', ['0.7 V คงที่', 'a fixed 0.7 V'], C.tan, 0, -0.75); },
  badge: k => (k >= 1 ? [[`V_D = 0.7 V, I_D = ${fd(LL.apx, 1)} mA`, `V_D = 0.7 V, I_D = ${fd(LL.apx, 1)} mA`], 'ok'] : [['แบบจำลองโดยประมาณของซิลิคอน', 'the approximate silicon model'], 'wait']),
  side: (ctx, b, bd, k) => (k >= 2 ? kvl(ctx, b, bd, [{ label: 'E', v: 10, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'V_D', v: -0.7, color: C.tan, sub: t('ตก', 'drop') }, { label: 'V_R', v: -9.3, color: C.q, sub: t('ตก', 'drop') }], t('กฎแรงดันรอบวง (V): Σ = 0', 'Kirchhoff\'s voltage law round the loop (V): Σ = 0'))
    : CH2.llPlot(ctx, b, bd, { model: 'apx', ends: true, q: k >= 1 ? { V: 0.7, I: LL.apx, label: bd.short ? 'Q' : `Q: 0.7 V, ${fd(LL.apx, 1)} mA` } : null })),
  steps: () => [
    step(t('<b>(a) แบบจำลองโดยประมาณ</b> (approximate model, ตาราง 2.1): ซิลิคอนที่นำกระแสมีแรงดันคงที่ \\(V_K = 0.7\\) V เส้นโหลดเดิม (วงจรไม่เปลี่ยน) ตัดเส้นแนวตั้งที่ 0.7 V', '<b>(a) The approximate model</b> (Table 2.1): a conducting silicon diode has a fixed \\(V_K = 0.7\\) V. The load line is the same (the network has not changed); it now meets a vertical line at 0.7 V'),
      block([R`V_{DQ} &= \boxed{0.7\ \text{V}}`, R`I_{DQ} &= \frac{E - V_K}{R} = \frac{10 - 0.7}{0.5\ \text{k}\Omega} = \boxed{18.6\ \text{mA}}`]),
      t('ตำราอ่านจากกราฟได้ 18.5 mA เท่ากับข้อ 1 ทั้งที่เส้นโค้งง่ายกว่ามาก', 'The book reads 18.5 mA off its graph, the same as Ex.1, from a far simpler curve.')),
    step(t('<b>(b) แรงดันคร่อม R</b> และตรวจกฎแรงดันรอบวง (แผงข้างภาพ)', '<b>(b) The voltage across R</b>, and a check of the loop (side panel)'),
      block([R`V_R &= E - V_{DQ} = 10 - 0.7 = \boxed{9.3\ \text{V}}`, R`R_D &= \frac{0.7\ \text{V}}{18.5\ \text{mA}} = 37.84\ \Omega`]), t('ใกล้กับ 42.16 Ω ของข้อ 1', 'Close to the 42.16 Ω of Ex.1.'))],
  ask: () => ({ fields: [num('V<sub>DQ</sub> (V) =', 0.7), num('I<sub>DQ</sub> (mA) =', 18.6, { tol: 0.11 }), num('V<sub>R</sub> (V) =', 9.3)] }),
  answer: () => t('\\(V_{DQ} = 0.7\\) V, \\(I_{DQ} = 18.6\\) mA (ตำราอ่านได้ 18.5 mA), \\(V_R = 9.3\\) V ตาม Boylestad Example 2.2', '\\(V_{DQ} = 0.7\\) V, \\(I_{DQ} = 18.6\\) mA (the book reads 18.5 mA), \\(V_R = 9.3\\) V, as in Boylestad Example 2.2.') };
DEF.ex3 = { ...LAY, solvedAt: 1, spec: k => CH2.loop({ E: 10, R: 500, d: IDEAL, eq: k === 1 ? 'on' : undefined, dName: '' }),
  glow: k => (k === 1 ? ['D'] : null), after: (v, k) => { if (k === 1) tagAt(v, 'D', ['ลัดวงจร', 'short'], C.tan, 0, -0.7); },
  badge: k => (k >= 1 ? [['V_D = 0, I_D = 20 mA', 'V_D = 0, I_D = 20 mA'], 'ok'] : [['แบบจำลองอุดมคติ', 'the ideal model'], 'wait']),
  side: (ctx, b, bd, k) => (k >= 2 ? CH8.bars(ctx, b, [{ label: t('ข้อ 1', 'Ex.1'), v: 0.78, color: C.curve, sub: t('เส้นโค้ง', 'curve') }, { label: t('ข้อ 2', 'Ex.2'), v: 0.7, color: C.tan, sub: t('ประมาณ', 'approx.') }, { label: t('ข้อ 3', 'Ex.3'), v: 0, color: C.chord, text: '0', sub: t('อุดมคติ', 'ideal') }],
      { title: bd.short ? 'V_DQ (V)' : t('V_DQ (V) ของสามแบบจำลอง: I_DQ = 18.5, 18.6, 20 mA', 'V_DQ (V) of the three models: I_DQ = 18.5, 18.6, 20 mA'), fmt: v => fd(v, 2), max: 1, sub: !bd.short })
    : CH2.llPlot(ctx, b, bd, { model: 'ideal', ends: true, q: k >= 1 ? { V: 0, I: 20, label: bd.short ? 'Q' : 'Q: 0 V, 20 mA', dy: 16 } : null })),
  steps: () => [
    step(t('<b>(a) แบบจำลองอุดมคติ</b>: ลักษณะสมบัติคือแกนตั้ง เส้นโหลดเดิมจึงตัดที่แกนตั้งพอดี ไดโอดเป็นลัดวงจร', '<b>(a) The ideal model</b>: its characteristic is the vertical axis, so the same load line meets it right on the axis; the diode is a short'),
      block([R`V_{DQ} &= \boxed{0\ \text{V}}`, R`I_{DQ} &= \frac{E}{R} = \frac{10\ \text{V}}{0.5\ \text{k}\Omega} = \boxed{20\ \text{mA}}`])),
    step(t('<b>(b) แรงดันคร่อม R</b> และเทียบสามแบบจำลอง (แผงข้างภาพ)', '<b>(b) The voltage across R</b>, and the three models side by side (side panel)'),
      block([R`V_R &= E = \boxed{10\ \text{V}}`, R`R_D &= \frac{0\ \text{V}}{20\ \text{mA}} = 0\ \Omega\ \ (\text{short})`]),
      t('ต่างจากข้อ 1 พอสมควร (20 เทียบ 18.5 mA) ตำราจึงแนะนำให้ใช้แบบอุดมคติเมื่อแรงดันในวงจรสูงกว่า \\(V_K\\) มาก และสนใจบทบาทของไดโอดมากกว่าตัวเลขระดับหนึ่งในสิบโวลต์', 'Noticeably off from Ex.1 (20 against 18.5 mA), so the book keeps the ideal model for circuits whose voltages are much larger than \\(V_K\\), where the role of the diode matters more than tenths of a volt.'))],
  ask: () => ({ fields: [num('V<sub>DQ</sub> (V) =', 0, { tol: 1e-6 }), num('I<sub>DQ</sub> (mA) =', 20), num('V<sub>R</sub> (V) =', 10)] }),
  answer: () => t('\\(V_{DQ} = 0\\) V, \\(I_{DQ} = 20\\) mA, \\(V_R = 10\\) V ตาม Boylestad Example 2.3', '\\(V_{DQ} = 0\\) V, \\(I_{DQ} = 20\\) mA, \\(V_R = 10\\) V, as in Boylestad Example 2.3.') };

/* =====================================================================================================================
   page 2.2: series configurations with dc inputs, Ex.4–5 (Examples 2.4–2.5): E = 8 V, R = 2.2 kΩ, a silicon diode, then reversed */
const S4 = { E: 8, R: 2200 }; S4.I = (S4.E - 0.7) / S4.R; CH2.S4 = S4;
DEF.ex4 = { ...LAY, solvedAt: 2, spec: k => CH2.loop({ E: 8, R: 2200, d: SI, eq: k === 2 ? 'vk' : undefined }),
  glow: k => (k === 1 ? ['D'] : k === 3 ? ['R'] : null),
  after: (v, k) => { if (k === 1) tagAt(v, 'D', ['กระแสตามหัวลูกศร: นำ', 'along the arrow: on'], C.tan, 0, -0.75); },
  badge: k => (k >= 2 ? [[`I_D = ${fd(S4.I * 1e3, 2)} mA`, `I_D = ${fd(S4.I * 1e3, 2)} mA`], 'ok'] : [['ไดโอดนำหรือไม่?', 'is the diode on?'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['ขั้นแรก: หาสถานะของไดโอดก่อน (สไลด์หน้า 16–17)', 'first find the state of the diode (slides pp. 16–17)'])
    : kvl(ctx, b, bd, [{ label: 'E', v: 8, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'V_D', v: -0.7, color: C.tan, sub: 'Si' }, { label: 'V_R', v: -7.3, color: C.q, sub: 'I_D R' }], t('กฎแรงดันรอบวง (V): Σ = 0', 'Kirchhoff\'s voltage law round the loop (V): Σ = 0'))),
  steps: () => [
    step(t('<b>หาสถานะของไดโอด</b>: นึกว่าไดโอดเป็นตัวต้านทาน (สไลด์หน้า 17) E ดันกระแสตามเข็มนาฬิกาออกจากขั้วบวก ผ่านตำแหน่งของไดโอดในทิศเดียวกับหัวลูกศร และ 8 V มากกว่า 0.7 V ไดโอดจึง<b>นำกระแส</b>', '<b>The state of the diode</b>: imagine it is a resistor (slide p. 17). E pushes current clockwise out of its + terminal, through the diode\'s place in the direction of the arrowhead, and 8 V is more than 0.7 V, so the diode is <b>on</b>')),
    step(t('<b>แทนด้วยแบบจำลอง</b>: ซิลิคอนที่นำกระแสคือแบตเตอรี 0.7 V (ตาราง 2.1) ขั้วของ \\(V_D\\) เหมือนกับตัวต้านทาน (สไลด์หน้า 18)', '<b>Substitute the model</b>: a conducting silicon diode is a 0.7 V battery (Table 2.1); \\(V_D\\) has the same polarity as for a resistor (slide p. 18)'),
      block([R`V_D &= V_K = \boxed{0.7\ \text{V}}`, R`V_R &= E - V_K = 8 - 0.7 = \boxed{7.3\ \text{V}}`])),
    step(t('<b>กระแส</b>: วงจรอนุกรม กระแสเดียวกันไหลผ่านทุกตัว', '<b>The current</b>: a series circuit carries one current'),
      block([R`I_D &= I_R = \frac{V_R}{R} = \frac{7.3\ \text{V}}{2.2\ \text{k}\Omega} = \boxed{${fd(S4.I * 1e3, 2)}\ \text{mA}}`]))],
  ask: () => ({ fields: [num('V<sub>D</sub> (V) =', 0.7), num('V<sub>R</sub> (V) =', 7.3), num('I<sub>D</sub> (mA) =', S4.I * 1e3, { tol: 0.01 })],
    check: v => (near(v[2], 8 / 2.2, 0.01) ? t('ลืมแรงดัน 0.7 V ของไดโอด: ใช้ \\(V_R = E - 0.7\\)', 'You left out the diode\'s 0.7 V: use \\(V_R = E - 0.7\\).') : '') }),
  answer: () => t(`\\(V_D = 0.7\\) V, \\(V_R = 7.3\\) V, \\(I_D = ${fd(S4.I * 1e3, 2)}\\) mA ตาม Boylestad Example 2.4`, `\\(V_D = 0.7\\) V, \\(V_R = 7.3\\) V, \\(I_D = ${fd(S4.I * 1e3, 2)}\\) mA, as in Boylestad Example 2.4.`) };
DEF.ex5 = { ...LAY, solvedAt: 2, spec: k => CH2.loop({ E: 8, R: 2200, d: SI, flip: true, eq: k === 2 ? 'off' : undefined }),
  glow: k => (k === 1 ? ['D'] : k === 3 ? ['D'] : null),
  after: (v, k) => { if (k === 1) tagAt(v, 'D', ['กระแสสวนหัวลูกศร: ไม่นำ', 'against the arrow: off'], C.red, 0, -0.75); else if (k >= 2) tagAt(v, 'D', [`เปิดวงจร: 8 V`, `open: 8 V`], C.red, 0, -0.75); },
  badge: k => (k >= 2 ? [['I_D = 0, ไดโอดรับแรงดันทั้งหมด 8 V', 'I_D = 0, all 8 V across the diode'], 'wait'] : [['กลับทิศไดโอด: นำหรือไม่?', 'diode reversed: on or off?'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['กลับทิศไดโอดของข้อ 4 แล้วหาสถานะใหม่ (สไลด์หน้า 19)', 'the diode of Ex.4 turned round: find its state again (slide p. 19)'])
    : kvl(ctx, b, bd, [{ label: 'E', v: 8, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'V_D', v: -8, color: C.red, sub: t('เปิดวงจร', 'open') }, { label: 'V_R', v: 0, color: C.q, text: '0', sub: 'I_D R = 0' }], t('กฎแรงดันรอบวง (V): Σ = 0', 'Kirchhoff\'s voltage law round the loop (V): Σ = 0'))),
  steps: () => [
    step(t('<b>หาสถานะ</b>: แทนไดโอดด้วยตัวต้านทาน กระแสที่ E ดันออกไปจะผ่านตำแหน่งของไดโอดในทิศ<b>สวน</b>หัวลูกศร ไดโอดจึง<b>ไม่นำกระแส</b> (สไลด์หน้า 19)', '<b>The state</b>: with a resistor in its place, the current E pushes would pass the diode <b>against</b> its arrowhead, so the diode is <b>off</b> (slide p. 19)')),
    step(t('<b>แทนด้วยเปิดวงจร</b>: ไม่มีกระแส ตัวต้านทานจึงไม่มีแรงดันตก', '<b>Substitute an open circuit</b>: no current, so no drop across the resistor'),
      block([R`I_D &= \boxed{0\ \text{A}}`, R`V_R &= I_RR = (0)R = \boxed{0\ \text{V}}`])),
    step(t('<b>แรงดันคร่อมไดโอด</b> จากกฎแรงดันของเคียร์ชอฟฟ์: แรงดันทั้งหมดของ E ไปอยู่ที่เปิดวงจร (ด้านซ้ายบวก ตามขั้ว \\(V_D\\) ในรูป)', '<b>The voltage across the diode</b> from Kirchhoff\'s voltage law: the whole of E appears across the open circuit (left side positive, as \\(V_D\\) is marked)'),
      block([R`E - V_D - V_R &= 0 \Rightarrow V_D = E - 0 = \boxed{8\ \text{V}}`]),
      t('กระแสเป็นศูนย์แต่แรงดันสูง เปิดวงจรมีแรงดันเท่าไรก็ได้ แต่กระแสเป็นศูนย์เสมอ (สไลด์หน้า 22)', 'Zero current but a large voltage: an open circuit can have any voltage, but its current is always zero (slide p. 22).'))],
  ask: () => ({ fields: [num('V<sub>D</sub> (V) =', 8), num('V<sub>R</sub> (V) =', 0, { tol: 1e-6 }), num('I<sub>D</sub> (mA) =', 0, { tol: 1e-6 })],
    check: v => (near(v[0], 0, 1e-3) ? t('ไดโอดที่ไม่นำคือเปิดวงจร แรงดันคร่อมไม่ใช่ศูนย์: ตัวต้านทานไม่มีแรงดันตก แรงดันทั้งหมดจึงอยู่ที่ไดโอด', 'An off diode is an open circuit, and its voltage is not zero: R drops nothing, so all the voltage is across the diode.') : '') }),
  answer: () => t('\\(I_D = 0\\), \\(V_R = 0\\), \\(V_D = 8\\) V ตาม Boylestad Example 2.5', '\\(I_D = 0\\), \\(V_R = 0\\), \\(V_D = 8\\) V, as in Boylestad Example 2.5.') };

/* =====================================================================================================================
   page 2.3: two diodes in series, Ex.6–7 (Examples 2.7–2.8), and two sources, Ex.8 (Example 2.9) */
/* +E on the left, two diodes along the top (d1: first, d2: second; flip2 turns the second round), R down the right side to ground */
CH2.two = (o = {}) => { const E = o.E ?? 12, Rv = o.R ?? 5600, d1 = o.d1 || SI, d2 = o.d2 || GE, eq = o.eq || [];
  const D = (id, a, b, d, nm, e) => (e === 'vk' ? { id, type: 'V', battery: true, a, b, value: d.vk, name: 'V_K', valText: `${fd(d.vk, 1)} V`, side: -1 } : e === 'off' ? { id, type: 'O', a, b, name: '', label: false } : { id, type: 'D', a, b, name: nm, valText: '', side: -1, ...d });
  return { ground: 'g', nodes: { a: [0, 0], x: [0.6, 0], s: [2.0, 0], y: [3.4, 0], o: [4.2, 0], c: [4.2, 2.6], g: [0, 2.6] },
    parts: [{ id: 'E', type: 'V', a: 'a', b: 'g', value: E, name: 'E', valText: `${fd(E, 0)} V`, side: -1 }, W_('a', 'x'),
      D('D1', 'x', 's', d1, d1 === GE ? 'Ge' : 'Si', eq[0]), o.flip2 ? D('D2', 'y', 's', d2, d2 === GE ? 'Ge' : 'Si', eq[1]) : D('D2', 's', 'y', d2, d2 === GE ? 'Ge' : 'Si', eq[1]), W_('y', 'o'),
      { id: 'R', type: 'R', a: 'o', b: 'c', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω') }, W_('c', 'g')] }; };
const voTag = (v, txt) => { const [x, y] = v.P('o'); CH6.tag(v.ctx, IE.tt(txt), x + v.u * 0.3, y - v.u * 0.45, C.q, { align: 'left', size: Math.max(11.5, v.u * 0.26) }); };
DEF.ex6 = { ...LAY, solvedAt: 2, spec: k => CH2.two({ E: 12, R: 5600, d1: SI, d2: GE, eq: k === 2 ? ['vk', 'vk'] : [] }),
  glow: k => (k === 1 ? ['D1', 'D2'] : k === 3 ? ['R'] : null),
  after: (v, k) => { if (k === 1) { tagAt(v, 'D1', ON, C.tan, 0, -0.75); tagAt(v, 'D2', ON, C.tan, 0, -0.75); } if (k >= 2) voTag(v, 'V_o = 11 V'); },
  badge: k => (k >= 2 ? [['V_o = 11 V, I_D = 1.96 mA', 'V_o = 11 V, I_D = 1.96 mA'], 'ok'] : [['ซิลิคอนกับเจอร์เมเนียมอนุกรมกัน', 'silicon and germanium in series'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['ไดโอดสองตัวอนุกรม ต้องนำทั้งคู่จึงมีกระแส', 'two diodes in series: both must conduct for any current'])
    : kvl(ctx, b, bd, [{ label: 'E', v: 12, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'Si', v: -0.7, color: C.tan, sub: 'V_K1' }, { label: 'Ge', v: -0.3, color: C.tan, sub: 'V_K2' }, { label: 'V_o', v: -11, color: C.q, sub: 'I_D R' }], t('กฎแรงดันรอบวง (V): Σ = 0', 'Kirchhoff\'s voltage law round the loop (V): Σ = 0'))),
  steps: () => [
    step(t('<b>สถานะ</b>: E ดันกระแสผ่านไดโอดทั้งสองตามหัวลูกศร และ 12 V มากกว่า 0.7 + 0.3 V ไดโอดทั้งคู่<b>นำกระแส</b>', '<b>The states</b>: E pushes current through both diodes along their arrowheads, and 12 V is more than 0.7 + 0.3 V, so both are <b>on</b>')),
    step(t('<b>แทนด้วยแบตเตอรี</b> 0.7 V (Si) และ 0.3 V (Ge) แล้วหาแรงดันขาออกด้วยกฎแรงดันของเคียร์ชอฟฟ์', '<b>Substitute the batteries</b>, 0.7 V (Si) and 0.3 V (Ge), and find the output with Kirchhoff\'s voltage law'),
      block([R`V_o &= E - V_{K_1} - V_{K_2} = 12 - 0.7 - 0.3 = \boxed{11\ \text{V}}`])),
    step(t('<b>กระแส</b>: \\(V_o\\) คร่อม R พอดี', '<b>The current</b>: \\(V_o\\) is right across R'),
      block([R`I_D &= I_R = \frac{V_o}{R} = \frac{11\ \text{V}}{5.6\ \text{k}\Omega} = \boxed{1.96\ \text{mA}}`]))],
  ask: () => ({ fields: [num('V<sub>o</sub> (V) =', 11), num('I<sub>D</sub> (mA) =', 11 / 5.6, { tol: 0.01 })],
    check: v => (near(v[0], 10.6, 0.01) ? t('ไดโอดตัวที่สองเป็นเจอร์เมเนียม: 0.3 V ไม่ใช่ 0.7 V', 'The second diode is germanium: 0.3 V, not 0.7 V.') : '') }),
  answer: () => t('\\(V_o = 11\\) V, \\(I_D = 1.96\\) mA · ตัวอย่างนี้มาจากตำราฉบับก่อน ฉบับที่ 11 (Example 2.7) เปลี่ยนเป็นไดโอดซิลิคอนกับไดโอดเปล่งแสงสีแดง (1.8 V) และ 680 Ω ได้ \\(V_o = 9.5\\) V', '\\(V_o = 11\\) V, \\(I_D = 1.96\\) mA · this example is from an earlier edition; the 11th edition (Example 2.7) uses a silicon diode with a red LED (1.8 V) and 680 Ω, giving \\(V_o = 9.5\\) V.') };
/* Ex.7: with no current the forward diode D1 is left at V_D ≈ 0 (the solver's GFWD; the book: when I_D = 0 A, V_D = 0 V) */
DEF.ex7 = { ...LAY, solvedAt: 2, spec: k => CH2.two({ E: 12, R: 5600, d1: SI, d2: SI, flip2: true, eq: k === 2 ? [undefined, 'off'] : [] }),
  glow: k => (k === 1 ? ['D2'] : k === 3 ? ['D2'] : null),
  after: (v, k) => { if (k === 1) { tagAt(v, 'D1', ['ตามลูกศร', 'along'], C.tan, 0, -0.75); tagAt(v, 'D2', ['สวนลูกศร: ไม่นำ', 'against: off'], C.red, 0, -0.75); } if (k >= 2) { voTag(v, 'V_o = 0 V'); tagAt(v, 'D2', ['V_D2 = 12 V', 'V_D2 = 12 V'], C.red, 0, -0.75); } },
  badge: k => (k >= 2 ? [['ไม่มีกระแส: V_o = 0, V_D2 = 12 V', 'no current: V_o = 0, V_D2 = 12 V'], 'wait'] : [['ไดโอดตัวที่สองกลับทิศ', 'the second diode turned round'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['ไดโอดอนุกรมสองตัวหันสวนกัน', 'two series diodes facing each other'])
    : kvl(ctx, b, bd, [{ label: 'E', v: 12, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'V_D1', v: 0, text: '0', color: C.tan, sub: t('ไม่มีกระแส', 'no current') }, { label: 'V_D2', v: -12, color: C.red, sub: t('เปิดวงจร', 'open') }, { label: 'V_o', v: 0, text: '0', color: C.q, sub: '(0)R' }], t('กฎแรงดันรอบวง (V): Σ = 0', 'Kirchhoff\'s voltage law round the loop (V): Σ = 0'))),
  steps: () => [
    step(t('<b>สถานะ</b>: แทนไดโอดทั้งสองด้วยตัวต้านทาน กระแสจาก E จะผ่าน D1 ตามหัวลูกศรแต่ผ่าน D2 <b>สวน</b>หัวลูกศร D2 จึงไม่นำ และเมื่อ D2 เปิดวงจร ทั้งวงก็ไม่มีกระแส', '<b>The states</b>: with resistors in their place, the current from E would pass D1 along its arrowhead but D2 <b>against</b> it. D2 is off, and with D2 open the whole loop carries no current')),
    step(t('<b>แทน D2 ด้วยเปิดวงจร</b>: กระแสเป็นศูนย์ แรงดันคร่อม R จึงเป็นศูนย์', '<b>Replace D2 by an open circuit</b>: zero current, so zero voltage across R'),
      block([R`I_D &= \boxed{0\ \text{A}}`, R`V_o &= I_RR = (0)R = \boxed{0\ \text{V}}`])),
    step(t('<b>แรงดันคร่อม D2</b>: ไดโอดจริงที่ไม่มีกระแสมีแรงดันเป็นศูนย์ (สภาวะไม่ไบแอส หน้า 1.4) D1 จึงไม่มีแรงดันตก แรงดันของแหล่งจ่ายทั้งหมดไปอยู่ที่เปิดวงจร', '<b>The voltage across D2</b>: an actual diode with no current has no voltage (the no-bias condition, page 1.4), so D1 drops nothing and the whole supply voltage is across the open circuit'),
      block([R`V_{D_2} &= E - V_{D_1} - V_o = 12 - 0 - 0 = \boxed{12\ \text{V}}`]), t('ไดโอดที่ไม่นำต้องทนแรงดันย้อนกลับเท่ากับแหล่งจ่ายทั้งหมด จึงต้องเลือกไดโอดที่มีพิกัด PIV สูงพอ', 'The off diode must withstand the whole supply in reverse, so its PIV rating must be high enough.'))],
  ask: () => ({ fields: [num('I<sub>D</sub> (mA) =', 0, { tol: 1e-6 }), num('V<sub>D2</sub> (V) =', 12), num('V<sub>o</sub> (V) =', 0, { tol: 1e-6 })],
    check: v => (near(v[1], 11.3, 0.01) ? t('ไม่มีกระแส D1 จึงไม่มีแรงดัน 0.7 V: แรงดันทั้ง 12 V อยู่ที่ D2', 'No current, so D1 has no 0.7 V: all 12 V are across D2.') : '') }),
  answer: () => t('\\(I_D = 0\\), \\(V_{D_2} = 12\\) V, \\(V_o = 0\\) V ตาม Boylestad Example 2.8 (ตำราใช้ E = 20 V จึงได้ \\(V_{D_2} = 20\\) V)', '\\(I_D = 0\\), \\(V_{D_2} = 12\\) V, \\(V_o = 0\\) V, as in Boylestad Example 2.8 (the book uses E = 20 V, so its \\(V_{D_2} = 20\\) V).') };
/* Ex.8: E1 = 10 V, R1 = 4.7 kΩ, a silicon diode, R2 = 2.2 kΩ down to E2 = −5 V */
const S8 = (() => { const I = (10 + 5 - 0.7) / 6900; return { I, V1: I * 4700, V2: I * 2200, Vo: I * 2200 - 5 }; })(); CH2.S8 = S8;
CH2.ex8 = (eq) => ({ ground: 'g', nodes: { a: [0, 0], m: [2.4, 0], o: [4.2, 0], n: [4.2, 1.5], g: [0, 3.0], gb: [4.2, 3.0] },
  parts: [{ id: 'E1', type: 'V', a: 'a', b: 'g', value: 10, name: 'E_1', valText: '10 V', side: -1 }, { id: 'R1', type: 'R', a: 'a', b: 'm', value: 4700, name: 'R_1', valText: '4.7 kΩ' },
    eq ? { id: 'D', type: 'V', battery: true, a: 'm', b: 'o', value: 0.7, name: 'V_K', valText: '0.7 V' } : { id: 'D', type: 'D', a: 'm', b: 'o', name: 'Si', ...SI },
    { id: 'R2', type: 'R', a: 'o', b: 'n', value: 2200, name: 'R_2', valText: '2.2 kΩ' }, { id: 'E2', type: 'V', a: 'gb', b: 'n', value: 5, name: 'E_2', valText: '5 V' }, W_('gb', 'g')] });
DEF.ex8 = { ...LAY, solvedAt: 2, spec: k => CH2.ex8(k === 2 || k === 3),
  glow: k => (k === 1 ? ['E1', 'E2'] : k === 3 ? ['R1', 'R2'] : null),
  after: (v, k) => { if (k >= 1) { const [x, y] = v.P('n'); CH6.tag(v.ctx, MC.t('จุดนี้ −5 V เทียบกับกราวด์', 'this node is −5 V'), x + v.u * 0.9, y, C.red, { align: 'left', size: Math.max(11.5, v.u * 0.24) }); } if (k >= 4) voTag(v, `V_o = ${v2(S8.Vo)} V`); },
  badge: k => (k >= 2 ? [[`I = ${fd(S8.I * 1e3, 2)} mA`, `I = ${fd(S8.I * 1e3, 2)} mA`], 'ok'] : [['แหล่งจ่ายสองตัว: +10 V และ −5 V', 'two supplies: +10 V and −5 V'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['E₂ = −5 V คือแหล่งจ่ายที่ขั้วบวกต่อกราวด์ (สไลด์หน้า 25)', 'E₂ = −5 V is a supply with its + terminal grounded (slide p. 25)'])
    : kvl(ctx, b, bd, [{ label: 'E_1', v: 10, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'E_2', v: 5, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'V_1', v: -S8.V1, color: C.q, sub: 'IR_1' }, { label: 'V_D', v: -0.7, color: C.tan, sub: 'Si' }, { label: 'V_2', v: -S8.V2, color: C.q, sub: 'IR_2' }], t('กฎแรงดันรอบวง (V): Σ = 0', 'Kirchhoff\'s voltage law round the loop (V): Σ = 0'))),
  steps: () => [
    step(t('<b>วาดแหล่งจ่ายให้ครบวง</b>: −5 V ที่ปลาย R<sub>2</sub> คือแหล่งจ่าย 5 V ที่ขั้วบวกต่อกราวด์ (ลูกศรสีน้ำเงินในสไลด์หน้า 25) แหล่งจ่ายทั้งสองดันกระแสไปทางเดียวกัน ผ่านไดโอดตามหัวลูกศร ไดโอด<b>นำกระแส</b>', '<b>Draw the supplies as a loop</b>: the −5 V at the end of R<sub>2</sub> is a 5 V supply with its + terminal grounded (the blue arrow on slide p. 25). Both supplies push current the same way, through the diode along its arrowhead, so it is <b>on</b>')),
    step(t('<b>กระแส</b> จากกฎแรงดันรอบวง (ไดโอดเป็นแบตเตอรี 0.7 V)', '<b>The current</b> from Kirchhoff\'s voltage law round the loop (the diode is a 0.7 V battery)'),
      block([R`I &= \frac{E_1 + E_2 - V_K}{R_1 + R_2} = \frac{10 + 5 - 0.7}{4.7\ \text{k}\Omega + 2.2\ \text{k}\Omega} = \frac{14.3\ \text{V}}{6.9\ \text{k}\Omega} = \boxed{${fd(S8.I * 1e3, 2)}\ \text{mA}}`])),
    step(t('<b>แรงดันคร่อมตัวต้านทาน</b>', '<b>The voltages across the resistors</b>'),
      block([R`V_1 &= IR_1 = (${fd(S8.I * 1e3, 3)}\ \text{mA})(4.7\ \text{k}\Omega) = \boxed{${fd(S8.V1, 2)}\ \text{V}}`, R`V_2 &= IR_2 = (${fd(S8.I * 1e3, 3)}\ \text{mA})(2.2\ \text{k}\Omega) = \boxed{${fd(S8.V2, 2)}\ \text{V}}`])),
    step(t('<b>แรงดันขาออก</b>: เดินจากกราวด์ผ่าน E<sub>2</sub> (−5 V) ขึ้นมาตาม R<sub>2</sub> (+4.56 V)', '<b>The output</b>: walk from ground through E<sub>2</sub> (−5 V) and up R<sub>2</sub> (+4.56 V)'),
      block([R`V_o &= V_2 - E_2 = ${fd(S8.V2, 2)} - 5 = \boxed{${v2(S8.Vo)}\ \text{V}}`]), t('ติดลบ: จุดขาออกต่ำกว่ากราวด์เล็กน้อย', 'Negative: the output sits a little below ground.'))],
  ask: () => ({ fields: [num('I (mA) =', S8.I * 1e3, { tol: 0.01 }), num('V<sub>1</sub> (V) =', S8.V1, { tol: 0.02 }), num('V<sub>2</sub> (V) =', S8.V2, { tol: 0.02 }), num('V<sub>o</sub> (V) =', S8.Vo, { tol: 0.02 })],
    check: v => (near(v[0], (10 - 5 - 0.7) / 6.9, 0.01) ? t('E<sub>2</sub> = −5 V ช่วยดันกระแสไปทางเดียวกับ E<sub>1</sub>: ต้องบวกกัน 10 + 5', 'E<sub>2</sub> = −5 V pushes the same way as E<sub>1</sub>: they add, 10 + 5.') : '') }),
  answer: () => t(`\\(I = ${fd(S8.I * 1e3, 2)}\\) mA, \\(V_1 = ${fd(S8.V1, 2)}\\) V, \\(V_2 = ${fd(S8.V2, 2)}\\) V, \\(V_o = ${v2(S8.Vo)}\\) V ตาม Boylestad Example 2.9`, `\\(I = ${fd(S8.I * 1e3, 2)}\\) mA, \\(V_1 = ${fd(S8.V1, 2)}\\) V, \\(V_2 = ${fd(S8.V2, 2)}\\) V, \\(V_o = ${v2(S8.Vo)}\\) V, as in Boylestad Example 2.9.`) };

/* =====================================================================================================================
   page 2.4: parallel and series–parallel, Ex.9–12 (Examples 2.10, —, 2.12, 2.13) */
const curBars = (ctx, b, bd, items, title) => CH8.bars(ctx, b, items, { title: bd.short ? t('กระแส (mA)', 'currents (mA)') : title, fmt: v => fd(v, 2), sub: !bd.short });
/* Ex.9: E = 10 V, R = 0.33 kΩ, two silicon diodes in parallel down to ground */
CH2.ex9 = eq => ({ ground: 'g', nodes: { a: [0, 0], m: [2.4, 0], m2: [3.6, 0], o: [4.6, 0], k1: [2.4, 2.6], k2: [3.6, 2.6], ob: [4.6, 2.6], g: [0, 2.6] },
  parts: [{ id: 'E', type: 'V', a: 'a', b: 'g', value: 10, name: 'E', valText: '10 V', side: -1 }, { id: 'R', type: 'R', a: 'a', b: 'm', value: 330, name: 'R', valText: '0.33 kΩ' }, W_('m', 'm2'), W_('m2', 'o'),
    eq ? { id: 'D1', type: 'V', battery: true, a: 'm', b: 'k1', value: 0.7, name: 'V_K', valText: '0.7 V', side: -1 } : { id: 'D1', type: 'D', a: 'm', b: 'k1', name: 'D_1', valText: 'Si', side: -1, ...SI },
    eq ? { id: 'D2', type: 'V', battery: true, a: 'm2', b: 'k2', value: 0.7, name: 'V_K', valText: '0.7 V' } : { id: 'D2', type: 'D', a: 'm2', b: 'k2', name: 'D_2', valText: 'Si', ...SI },
    W_('k2', 'k1'), W_('k1', 'g'), W_('ob', 'k2'), { id: 'VO', type: 'VM', a: 'o', b: 'ob', name: 'V_o', valText: '', hidden: true }] });
const S9 = { I1: 9.3 / 330 }; S9.ID = S9.I1 / 2; CH2.S9 = S9;
DEF.ex9 = { ...LAY, solvedAt: 1, spec: k => CH2.ex9(k === 2),
  glow: k => (k === 1 ? ['D1', 'D2'] : k === 3 ? ['R'] : null),
  after: (v, k) => { if (k >= 2) { const [x, y] = v.P('o'); CH6.tag(v.ctx, 'V_o = 0.7 V', x + v.u * 0.15, y + v.u * 1.2, C.q, { align: 'left', size: Math.max(11.5, v.u * 0.26) }); } },
  badge: k => (k >= 3 ? [[`I1 = ${fd(S9.I1 * 1e3, 2)} mA = 2 × ${fd(S9.ID * 1e3, 2)} mA`, `I1 = ${fd(S9.I1 * 1e3, 2)} mA = 2 × ${fd(S9.ID * 1e3, 2)} mA`], 'ok'] : k >= 1 ? [['ไดโอดทั้งสองนำ: V_o = 0.7 V', 'both diodes on: V_o = 0.7 V'], 'ok'] : [['ไดโอดสองตัวขนานกัน', 'two diodes in parallel'], 'wait']),
  side: (ctx, b, bd, k) => (k < 3 ? CH8.empty(ctx, b, ['ไดโอดขนานกันมีแรงดันเท่ากัน (สไลด์หน้า 26–27)', 'diodes in parallel share one voltage (slides pp. 26–27)'])
    : curBars(ctx, b, bd, [{ label: 'I_1', v: S9.I1 * 1e3, color: C.q, sub: t('ผ่าน R', 'through R') }, { label: 'I_D1', v: S9.ID * 1e3, color: C.tan, sub: 'D_1' }, { label: 'I_D2', v: S9.ID * 1e3, color: C.tan, sub: 'D_2' }], t('กระแส (mA): I_1 = I_D1 + I_D2', 'currents (mA): I_1 = I_D1 + I_D2'))),
  steps: () => [
    step(t('<b>สถานะ</b>: E ดันกระแสผ่าน R แล้วลงผ่านไดโอดทั้งสองตามหัวลูกศร 10 V มากพอ ไดโอดทั้งสอง<b>นำกระแส</b> และเพราะต่อขนานกัน แรงดันคร่อมจึงเท่ากัน', '<b>The states</b>: E pushes current through R and down through both diodes along their arrowheads; 10 V is plenty, so both are <b>on</b>, and being in parallel they share one voltage'),
      block([R`V_o &= V_K = \boxed{0.7\ \text{V}}`])),
    step(t('<b>แทนด้วยแบตเตอรี 0.7 V</b> ที่ขนานกัน', '<b>Substitute the 0.7 V batteries</b>, in parallel')),
    step(t('<b>กระแสผ่าน R</b>', '<b>The current through R</b>'),
      block([R`I_1 &= \frac{E - V_K}{R} = \frac{10 - 0.7}{0.33\ \text{k}\Omega} = \boxed{${fd(S9.I1 * 1e3, 2)}\ \text{mA}}`])),
    step(t('<b>กระแสในไดโอดแต่ละตัว</b>: ไดโอดเหมือนกัน แบ่งกระแสเท่ากัน (กฎกระแสของเคียร์ชอฟฟ์)', '<b>The current in each diode</b>: identical diodes share it equally (Kirchhoff\'s current law)'),
      block([R`I_{D_1} &= I_{D_2} = \frac{I_1}{2} = \frac{${fd(S9.I1 * 1e3, 2)}\ \text{mA}}{2} = \boxed{${fd(S9.ID * 1e3, 2)}\ \text{mA}}`]),
      t('ถ้าไดโอดแต่ละตัวทนได้เพียง 20 mA การต่อขนานสองตัวช่วยให้แต่ละตัวรับเพียง 14.09 mA แทน 28.18 mA', 'If each diode is rated for only 20 mA, two in parallel carry 14.09 mA each instead of 28.18 mA.'))],
  ask: () => ({ fields: [num('V<sub>o</sub> (V) =', 0.7), num('I<sub>1</sub> (mA) =', S9.I1 * 1e3, { tol: 0.03 }), num('I<sub>D1</sub> (mA) =', S9.ID * 1e3, { tol: 0.02 })],
    check: v => (near(v[0], 1.4, 0.01) ? t('ไดโอดขนานกัน ไม่ใช่อนุกรม: แรงดันเท่ากัน 0.7 V ไม่ต้องรวม', 'The diodes are in parallel, not in series: one 0.7 V, not two.') : '') }),
  answer: () => t(`\\(V_o = 0.7\\) V, \\(I_1 = ${fd(S9.I1 * 1e3, 2)}\\) mA, \\(I_{D_1} = I_{D_2} = ${fd(S9.ID * 1e3, 2)}\\) mA ตาม Boylestad Example 2.10`, `\\(V_o = 0.7\\) V, \\(I_1 = ${fd(S9.I1 * 1e3, 2)}\\) mA, \\(I_{D_1} = I_{D_2} = ${fd(S9.ID * 1e3, 2)}\\) mA, as in Boylestad Example 2.10.`) };
/* Ex.10: E1 = 20 V, R = 2.2 kΩ, D1 (Si, →) and D2 (Si, ←) in parallel, then E2 = 4 V */
CH2.ex10 = eq => ({ ground: 'g', nodes: { a: [0, 0], m: [2.4, 0], mt: [2.4, -0.9], mb: [2.4, 0.9], n: [4.6, 0], nt: [4.6, -0.9], nb: [4.6, 0.9], e: [5.8, 0], g: [0, 2.6], eg: [5.8, 2.6] },
  parts: [{ id: 'E1', type: 'V', a: 'a', b: 'g', value: 20, name: 'E_1', valText: '20 V', side: -1 }, { id: 'R', type: 'R', a: 'a', b: 'm', value: 2200, name: 'R', valText: '2.2 kΩ' },
    W_('m', 'mt'), W_('m', 'mb'), W_('nt', 'n'), W_('nb', 'n'),
    eq ? { id: 'D1', type: 'V', battery: true, a: 'mt', b: 'nt', value: 0.7, name: 'V_K', valText: '0.7 V' } : { id: 'D1', type: 'D', a: 'mt', b: 'nt', name: 'D_1', valText: 'Si', ...SI },
    eq ? { id: 'D2', type: 'O', a: 'nb', b: 'mb', name: '', label: false } : { id: 'D2', type: 'D', a: 'nb', b: 'mb', name: 'D_2', valText: 'Si', side: -1, ...SI },
    W_('n', 'e'), { id: 'E2', type: 'V', a: 'e', b: 'eg', value: 4, name: 'E_2', valText: '4 V' }, W_('eg', 'g')] });
const S10 = { I: (20 - 4 - 0.7) / 2200 }; CH2.S10 = S10;
DEF.ex10 = { ...LAY, solvedAt: 2, spec: k => CH2.ex10(k >= 2 && k <= 3),
  glow: k => (k === 1 ? ['D1', 'D2'] : k === 3 ? ['R'] : null),
  after: (v, k) => { if (k === 1) { tagAt(v, 'D1', ON, C.tan, 0, -0.62); tagAt(v, 'D2', OFF, C.red, 0, 0.62); } },
  badge: k => (k >= 2 ? [[`I = ${fd(S10.I * 1e3, 2)} mA ผ่าน D1`, `I = ${fd(S10.I * 1e3, 2)} mA through D1`], 'ok'] : [['ไดโอดสองตัวหันสวนกัน ขนานกัน', 'two diodes in parallel, facing opposite ways'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['E₁ = 20 V มากกว่า E₂ = 4 V: กระแสไหลจากซ้ายไปขวา', 'E₁ = 20 V beats E₂ = 4 V: current flows left to right'])
    : kvl(ctx, b, bd, [{ label: 'E_1', v: 20, color: C.elec, sub: t('ยกขึ้น', 'rise') }, { label: 'V_R', v: -S10.I * 2200, color: C.q, sub: 'IR' }, { label: 'V_D1', v: -0.7, color: C.tan, sub: 'Si' }, { label: 'E_2', v: -4, color: C.elec, sub: t('ตก', 'drop') }], t('กฎแรงดันรอบวง (V): Σ = 0', 'Kirchhoff\'s voltage law round the loop (V): Σ = 0'))),
  steps: () => [
    step(t('<b>สถานะ</b>: E<sub>1</sub> = 20 V สูงกว่า E<sub>2</sub> = 4 V กระแสจึงไหลจากซ้ายไปขวา ผ่าน D<sub>1</sub> ตามหัวลูกศร (<b>นำ</b>) แต่สวนหัวลูกศรของ D<sub>2</sub> (<b>ไม่นำ</b>)', '<b>The states</b>: E<sub>1</sub> = 20 V is above E<sub>2</sub> = 4 V, so current flows left to right: along D<sub>1</sub>\'s arrowhead (<b>on</b>) but against D<sub>2</sub>\'s (<b>off</b>)')),
    step(t('<b>แทน D<sub>1</sub> ด้วย 0.7 V และ D<sub>2</sub> ด้วยเปิดวงจร</b> แล้วใช้กฎแรงดันรอบวง', '<b>Replace D<sub>1</sub> by 0.7 V and D<sub>2</sub> by an open circuit</b>, then Kirchhoff\'s voltage law round the loop'),
      block([R`I &= \frac{E_1 - E_2 - V_K}{R} = \frac{20 - 4 - 0.7}{2.2\ \text{k}\Omega} = \frac{15.3\ \text{V}}{2.2\ \text{k}\Omega} = \boxed{${fd(S10.I * 1e3, 2)}\ \text{mA}}`])),
    step(t('<b>ตรวจ D<sub>2</sub></b>: แรงดันคร่อม D<sub>2</sub> เท่ากับ 0.7 V ของ D<sub>1</sub> แต่ขั้วกลับ (ไบแอสกลับ) D<sub>2</sub> ไม่นำจริง', '<b>Check D<sub>2</sub></b>: it has the 0.7 V of D<sub>1</sub> across it, the wrong way round (reverse bias), so it really is off'),
      block([R`V_{D_2} &= -0.7\ \text{V} < 0 \quad \text{(off)}`]))],
  ask: () => ({ fields: [num('I (mA) =', S10.I * 1e3, { tol: 0.01 })], check: v => (near(v[0], 24.3 / 2.2, 0.02) ? t('E<sub>2</sub> = 4 V ต้านกระแสจาก E<sub>1</sub>: ต้องลบ ไม่ใช่บวก', 'E<sub>2</sub> = 4 V opposes E<sub>1</sub>: subtract it, do not add.') : '') }),
  answer: () => t(`\\(I = ${fd(S10.I * 1e3, 2)}\\) mA (D<sub>1</sub> นำ D<sub>2</sub> ไม่นำ) · ตัวอย่างนี้อยู่ในตำราฉบับก่อน ไม่มีในฉบับที่ 11`, `\\(I = ${fd(S10.I * 1e3, 2)}\\) mA (D<sub>1</sub> on, D<sub>2</sub> off) · this example is from an earlier edition of the book, not the 11th.`) };
/* Ex.11: +12 V, Si and Ge in parallel (both pointing down), joined at the output node; R = 2.2 kΩ from there to ground */
CH2.ex11 = eq => ({ ground: 'g', nodes: { a: [0, 0], s1: [1.3, 0], s2: [3.5, 0], o1: [1.3, 1.6], m: [2.4, 1.6], o2: [3.5, 1.6], o: [5.0, 1.6], rb: [2.4, 3.3], g: [0, 3.3] },
  parts: [{ id: 'E', type: 'V', a: 'a', b: 'g', value: 12, name: 'E', valText: '12 V', side: -1 }, W_('a', 's1'), W_('s1', 's2'),
    eq ? { id: 'D1', type: 'O', a: 's1', b: 'o1', name: '', label: false } : { id: 'D1', type: 'D', a: 's1', b: 'o1', name: 'Si', side: -1, ...SI },
    eq ? { id: 'D2', type: 'V', battery: true, a: 's2', b: 'o2', value: 0.3, name: 'V_K', valText: '0.3 V' } : { id: 'D2', type: 'D', a: 's2', b: 'o2', name: 'Ge', ...GE },
    W_('o1', 'm'), W_('m', 'o2'), W_('o2', 'o'), { id: 'R', type: 'R', a: 'm', b: 'rb', value: 2200, name: 'R', valText: '2.2 kΩ', side: -1 }, W_('rb', 'g')] });
DEF.ex11 = { ...LAY, solvedAt: 1, spec: k => CH2.ex11(k >= 2),
  glow: k => (k === 1 ? ['D1', 'D2'] : k === 3 ? ['R'] : null),
  after: (v, k) => { if (k === 1) { tagAt(v, 'D1', OFF, C.red, -0.55); tagAt(v, 'D2', ON, C.tan, 0.55); } if (k >= 2) { const [x, y] = v.P('o'); CH6.tag(v.ctx, 'V_o = 11.7 V', x, y + v.u * 0.5, C.q, { align: 'right', size: Math.max(11.5, v.u * 0.26) }); } },   // under the output wire, clear of the battery label
  badge: k => (k >= 2 ? [['V_o = 11.7 V: Ge นำ, Si ไม่นำ', 'V_o = 11.7 V: Ge on, Si off'], 'ok'] : [['ซิลิคอนขนานกับเจอร์เมเนียม', 'silicon in parallel with germanium'], 'wait']),
  side: (ctx, b, bd, k) => (k < 3 ? CH8.empty(ctx, b, ['ไดโอดขนานกันมีแรงดันเท่ากันเสมอ', 'parallel diodes always share one voltage'])
    : curBars(ctx, b, bd, [{ label: 'I_R', v: 11.7 / 2.2, color: C.q, sub: 'V_o/R' }, { label: 'I_Ge', v: 11.7 / 2.2, color: C.tan, sub: t('นำ', 'on') }, { label: 'I_Si', v: 0, text: '0', color: C.red, sub: t('ไม่นำ', 'off') }], t('กระแส (mA)', 'currents (mA)'))),
  steps: () => [
    step(t('<b>สถานะ</b>: ไดโอดทั้งสองหันตามทิศกระแส แต่ต่อขนานกันจึงมีแรงดันเท่ากัน Ge นำที่ 0.3 V ก่อน และตรึงแรงดันคร่อมคู่นี้ไว้ที่ 0.3 V ซึ่งไม่ถึง 0.7 V Si จึง<b>ไม่นำ</b>', '<b>The states</b>: both diodes point with the current, but in parallel they share one voltage. Ge turns on first, at 0.3 V, and holds the pair at 0.3 V, short of 0.7 V, so the Si diode is <b>off</b>')),
    step(t('<b>แทน Ge ด้วย 0.3 V และ Si ด้วยเปิดวงจร</b>', '<b>Replace Ge by 0.3 V and Si by an open circuit</b>'),
      block([R`V_o &= E - V_{K(\text{Ge})} = 12 - 0.3 = \boxed{11.7\ \text{V}}`])),
    step(t('<b>กระแส</b> (ผ่าน Ge ทั้งหมด)', '<b>The current</b> (all of it through the Ge diode)'),
      block([R`I &= \frac{V_o}{R} = \frac{11.7\ \text{V}}{2.2\ \text{k}\Omega} = ${fd(11.7 / 2.2, 2)}\ \text{mA}`]))],
  ask: () => ({ fields: [num('V<sub>o</sub> (V) =', 11.7)], check: v => (near(v[0], 11.3, 0.01) ? t('ซิลิคอนไม่ได้นำ: เจอร์เมเนียมตรึงแรงดันไว้ที่ 0.3 V ก่อน', 'The silicon diode is not on: the germanium one holds the voltage at 0.3 V first.') : '') }),
  answer: () => t('\\(V_o = 11.7\\) V (Ge นำ Si ไม่นำ) · ตัวอย่างนี้มาจากตำราฉบับก่อน ฉบับที่ 11 (Example 2.12) ใช้ไดโอดซิลิคอนขนานกับไดโอดเปล่งแสงสีเขียว ซิลิคอนนำก่อนจึงได้ \\(V_o = 11.3\\) V ด้วยเหตุผลเดียวกัน', '\\(V_o = 11.7\\) V (Ge on, Si off) · this example is from an earlier edition; the 11th edition (Example 2.12) puts a silicon diode in parallel with a green LED: the silicon diode turns on first, so \\(V_o = 11.3\\) V, by the same reasoning.') };
/* Ex.12: E = 20 V, D1 (Si) in series, then R1 = 3.3 kΩ in parallel with D2 (Si), then R2 = 5.6 kΩ back to E */
const S12 = { I1: 0.7 / 3300, I2: (20 - 1.4) / 5600 }; S12.ID2 = S12.I2 - S12.I1; CH2.S12 = S12;
CH2.ex12 = eq => ({ ground: 'g', nodes: { a: [0, 0], x: [0.7, 0], m: [2.4, 0], r: [4.8, 0], rb: [4.8, 2.6], q: [2.4, 2.6], g: [0, 2.6] },
  parts: [{ id: 'E', type: 'V', a: 'a', b: 'g', value: 20, name: 'E', valText: '20 V', side: -1 }, W_('a', 'x'),
    eq ? { id: 'D1', type: 'V', battery: true, a: 'x', b: 'm', value: 0.7, name: 'V_K1', valText: '0.7 V' } : { id: 'D1', type: 'D', a: 'x', b: 'm', name: 'D_1', valText: 'Si', ...SI },
    { id: 'R1', type: 'R', a: 'm', b: 'r', value: 3300, name: 'R_1', valText: '3.3 kΩ' }, W_('r', 'rb'), W_('rb', 'q'),
    eq ? { id: 'D2', type: 'V', battery: true, a: 'm', b: 'q', value: 0.7, name: 'V_K2', valText: '0.7 V', side: -1 } : { id: 'D2', type: 'D', a: 'm', b: 'q', name: 'D_2', valText: 'Si', side: -1, ...SI },
    { id: 'R2', type: 'R', a: 'q', b: 'g', value: 5600, name: 'R_2', valText: '5.6 kΩ', side: -1 }] });
DEF.ex12 = { ...LAY, solvedAt: 1, spec: k => CH2.ex12(k >= 2),
  glow: k => (k === 2 ? ['R1', 'D2'] : k === 3 ? ['R2'] : k === 4 ? ['D2'] : null),
  badge: k => (k >= 4 ? [[`I_D2 = ${fd(S12.ID2 * 1e3, 2)} mA`, `I_D2 = ${fd(S12.ID2 * 1e3, 2)} mA`], 'ok'] : k >= 1 ? [['D1 และ D2 นำ', 'D1 and D2 on'], 'ok'] : [['วงจรอนุกรม–ขนาน', 'a series–parallel network'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['R₁ ขนานกับ D₂ ทั้งคู่อนุกรมกับ D₁ และ R₂', 'R₁ is in parallel with D₂, and both in series with D₁ and R₂'])
    : curBars(ctx, b, bd, [{ label: 'I_2', v: S12.I2 * 1e3, color: C.q, sub: t('ผ่าน R₂', 'through R₂') }, { label: 'I_1', v: k >= 2 ? S12.I1 * 1e3 : 0, color: C.q, sub: t('ผ่าน R₁', 'through R₁') }, { label: 'I_D2', v: k >= 4 ? S12.ID2 * 1e3 : 0, text: k >= 4 ? undefined : '?', color: C.tan, sub: 'I_2 − I_1' }], t('กระแส (mA): I_2 = I_1 + I_D2', 'currents (mA): I_2 = I_1 + I_D2'))),
  steps: () => [
    step(t('<b>สถานะ</b>: E ดันกระแสผ่าน D<sub>1</sub> ตามหัวลูกศร ที่ปลายของ D<sub>1</sub> กระแสแยกเข้า R<sub>1</sub> และ D<sub>2</sub> ซึ่งหันตามทิศกระแสเช่นกัน 20 V มากพอ ไดโอดทั้งสอง<b>นำกระแส</b>', '<b>The states</b>: E pushes current through D<sub>1</sub> along its arrowhead; past D<sub>1</sub> it splits between R<sub>1</sub> and D<sub>2</sub>, which also points with the current. 20 V is plenty: both diodes are <b>on</b>')),
    step(t('<b>กระแสผ่าน R<sub>1</sub></b>: R<sub>1</sub> ขนานกับ D<sub>2</sub> จึงมีแรงดัน 0.7 V เท่ากัน', '<b>The current through R<sub>1</sub></b>: R<sub>1</sub> is in parallel with D<sub>2</sub>, so it has the same 0.7 V'),
      block([R`I_1 &= \frac{V_{K_2}}{R_1} = \frac{0.7\ \text{V}}{3.3\ \text{k}\Omega} = \boxed{${fd(S12.I1 * 1e3, 3)}\ \text{mA}}`])),
    step(t('<b>กระแสผ่าน R<sub>2</sub></b>: กฎแรงดันรอบวงนอก ผ่าน D<sub>1</sub>, D<sub>2</sub> และ R<sub>2</sub>', '<b>The current through R<sub>2</sub></b>: Kirchhoff\'s voltage law round the outer loop, through D<sub>1</sub>, D<sub>2</sub> and R<sub>2</sub>'),
      block([R`I_2 &= \frac{E - V_{K_1} - V_{K_2}}{R_2} = \frac{20 - 0.7 - 0.7}{5.6\ \text{k}\Omega} = \frac{18.6\ \text{V}}{5.6\ \text{k}\Omega} = \boxed{${fd(S12.I2 * 1e3, 2)}\ \text{mA}}`])),
    step(t('<b>กระแสใน D<sub>2</sub></b> จากกฎกระแสของเคียร์ชอฟฟ์ที่จุดต่อด้านล่าง', '<b>The current in D<sub>2</sub></b> from Kirchhoff\'s current law at the lower node'),
      block([R`I_{D_2} &= I_2 - I_1 = ${fd(S12.I2 * 1e3, 2)} - ${fd(S12.I1 * 1e3, 3)} = \boxed{${fd(S12.ID2 * 1e3, 2)}\ \text{mA}}`]))],
  ask: () => ({ fields: [num('I<sub>1</sub> (mA) =', S12.I1 * 1e3, { tol: 0.003 }), num('I<sub>2</sub> (mA) =', S12.I2 * 1e3, { tol: 0.01 }), num('I<sub>D2</sub> (mA) =', S12.ID2 * 1e3, { tol: 0.01 })],
    check: v => (near(v[1], 19.3 / 5.6, 0.01) ? t('วงนอกผ่านไดโอดสองตัว: หัก 0.7 V สองครั้ง', 'The outer loop passes two diodes: take off 0.7 V twice.') : '') }),
  answer: () => t(`\\(I_1 = ${fd(S12.I1 * 1e3, 3)}\\) mA, \\(I_2 = ${fd(S12.I2 * 1e3, 2)}\\) mA, \\(I_{D_2} = ${fd(S12.ID2 * 1e3, 2)}\\) mA ตาม Boylestad Example 2.13`, `\\(I_1 = ${fd(S12.I1 * 1e3, 3)}\\) mA, \\(I_2 = ${fd(S12.I2 * 1e3, 2)}\\) mA, \\(I_{D_2} = ${fd(S12.ID2 * 1e3, 2)}\\) mA, as in Boylestad Example 2.13.`) };

/* =====================================================================================================================
   signals in time (pages 2.5–2.8). θ is the phase of the board's clock: one input cycle lasts 4 s of slow motion */
const TAU = 2 * Math.PI, wrap = th => ((th % TAU) + TAU) % TAU, COL = CH6.COL, T = CH6.text;
CH2.sine = Vm => th => Vm * Math.sin(th);
CH2.square = (hi, lo) => th => (wrap(th) < Math.PI ? hi : lo);
CH2.tri = Vm => th => { const q = wrap(th) / TAU; return Vm * (q < 0.25 ? 4 * q : q < 0.75 ? 2 - 4 * q : 4 * q - 4); };
/* sets the source(s) `ids` of a circuit to v and solves again: a resistive circuit with diodes has no memory, so its state follows the input */
CH2.drive = (c, ids, v) => { if (!c) return; [].concat(ids).forEach(id => { const p = c.part(id); if (p) p.value = v; }); c.solve(); };
/* one cycle of such a circuit, solved at n + 1 points. outs = { key: circuit → number } →
   { f(key): deg → value (straight between samples), avg(key) (mean over the cycle), max(key), min(key) } */
CH2.cycle = (spec, ids, vi, outs, n = 720) => { const c = new CK.Circuit(spec), keys = Object.keys(outs), R = {};
  keys.forEach(k => { R[k] = new Float64Array(n + 1); });
  for (let j = 0; j <= n; j++) { CH2.drive(c, ids, vi(TAU * j / n)); keys.forEach(k => { R[k][j] = outs[k](c); }); }
  const f = k => d => { const x = wrap(d * Math.PI / 180) / TAU * n, j = Math.min(n - 1, Math.floor(x)), a = R[k]; return a[j] + (a[j + 1] - a[j]) * (x - j); };
  const avg = k => { const a = R[k]; let s = 0; for (let j = 0; j < n; j++) s += (a[j] + a[j + 1]) / 2; return s / n; };
  return { R, f, avg, max: k => Math.max(...R[k]), min: k => Math.min(...R[k]), n }; };
/* the waveforms of CH6.waves: v_i, v_o (shaded; or another key), and dashed levels lines: [{ v, label, color }] */
CH2.wsigs = (cy, o = {}) => { const m = o.mag ?? Math.max(Math.abs(cy.max('vi')), Math.abs(cy.min('vi')), 1e-9), s = [];
  if (o.vi !== false) s.push({ f: cy.f('vi'), color: C.elec, label: 'v_i', unit: 'V', g: 'v', mag: m, w: 2 });
  if (o.vo !== false) s.push({ f: cy.f(o.key || 'vo'), color: o.color || C.q, label: o.label || 'v_o', unit: 'V', g: 'v', mag: m, w: 3, fill: o.fill ?? 'rgba(255,209,102,.16)' });
  (o.lines || []).forEach(L => s.push({ f: () => L.v, color: L.color || C.tan, label: L.label, unit: 'V', g: 'v', mag: Math.min(m, 9.99), w: 2, dash: [7, 5] }));   // mag < 10: the value with 2 decimals (the scale follows the group's largest mag)
  return s; };
/* on/off tags beside diodes, from the current through each at this instant */
/* list: [[id, dx, dy, name]]; with a name the tag reads "D_1 on" (for diodes drawn without labels) */
const stTags = (v, list) => list.forEach(([id, dx, dy, nm]) => { const c = v.ckt, p = c && c.part(id); if (!p || p.type !== 'D') return; const on = c.I(id).re > 1e-6, s = on ? ON : OFF;   // > 1 µA: above the leakage below the knee
  tagAt(v, id, nm ? [`${nm} ${s[0]}`, `${nm} ${s[1]}`] : s, on ? C.tan : C.red, dx, dy); });
CH2.stTags = stTags;
const LAYT = { ...LAY, rowAsp: 0.5, rowMin: 220 };   // a circuit and one full-width waveform panel under it

/* a plain x–y plot: o = { x: [x0, x1], y: [y0, y1], xt, yt (ticks), xfmt, yfmt, xl, yl (axis labels), title, fns: [{ f(x), color, w, dash }],
   band: { x1, x2, color, label } (a shaded range), pts: [{ x, y, color, label, side, dy }] } */
CH2.xy = (ctx, b, o = {}) => { CH6.bg(ctx, b); const [x0, x1] = o.x, [y0, y1] = o.y, ml = 46, mr = 16, mt = o.title ? 30 : 14, mb = 36;
  const L = b.x + ml, Rr = b.x + b.w - mr, Tp = b.y + mt, Bt = b.y + b.h - mb, X = x => L + (Rr - L) * (x - x0) / (x1 - x0), Y = y => Bt - (Bt - Tp) * (y - y0) / (y1 - y0);
  ctx.save(); ctx.lineWidth = 1;
  if (o.band) { ctx.fillStyle = o.band.color || 'rgba(126,231,135,.13)'; ctx.fillRect(X(o.band.x1), Tp, X(o.band.x2) - X(o.band.x1), Bt - Tp);
    if (o.band.label) T(ctx, IE.tt(o.band.label), (X(o.band.x1) + X(o.band.x2)) / 2, Tp + 12, { color: C.tan, size: 12, weight: '600' }); }
  (o.xt || []).forEach(x => { ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(X(x), Tp); ctx.lineTo(X(x), Bt); ctx.stroke(); T(ctx, (o.xfmt || IE.num)(x), X(x), Bt + 13, { color: COL.muted, size: 11.5 }); });
  (o.yt || []).forEach(y => { ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(L, Y(y)); ctx.lineTo(Rr, Y(y)); ctx.stroke(); T(ctx, (o.yfmt || IE.num)(y), L - 6, Y(y), { color: COL.muted, size: 11.5, align: 'right' }); });
  ctx.strokeStyle = COL.axis; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, Bt); ctx.lineTo(Rr, Bt); ctx.stroke(); ctx.restore();
  (o.fns || []).forEach(F => { ctx.save(); ctx.strokeStyle = F.color || C.curve; ctx.lineWidth = F.w || 2.6; if (F.dash) ctx.setLineDash(F.dash); ctx.beginPath();
    for (let k = 0; k <= 240; k++) { const x = x0 + (x1 - x0) * k / 240, y = Math.max(y0, Math.min(y1, F.f(x))); k ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke(); ctx.restore(); });
  (o.pts || []).forEach(P => { const px = X(P.x), py = Y(Math.max(y0, Math.min(y1, P.y))); ctx.save(); ctx.fillStyle = P.color || C.q; ctx.beginPath(); ctx.arc(px, py, P.r || 5, 0, TAU); ctx.fill(); ctx.restore();
    if (P.label) CH8.lab(ctx, IE.tt(P.label), px + (P.side ?? 1) * 9, py + (P.dy ?? -12), (P.side ?? 1) > 0 ? 'left' : 'right', P.color || C.q, 12.5, b, '700'); });
  if (o.xl) T(ctx, IE.tt(o.xl), Rr, Bt + 28, { align: 'right', color: COL.ink, size: 12.5, weight: '600' });
  if (o.yl) T(ctx, IE.tt(o.yl), L + 6, Tp + 9, { align: 'left', color: COL.ink, size: 12.5, weight: '600' });
  if (o.title) T(ctx, IE.tt(o.title), b.x + 10, b.y + 15, { align: 'left', color: COL.muted, size: 13 });
  return { X, Y }; };

/* =====================================================================================================================
   page 2.5: half-wave rectification (slides pp. 31–39). v_i on the left (+ up), the diode along the top (anode at the source
   unless flip), R down the right side; v_o across R */
CH2.hw = (o = {}) => { const Vm = o.Vm ?? 20, Rv = o.R ?? 2000, d = o.d || IDEAL, flip = !!o.flip;
  return { ground: 'g', nodes: { a: [0, 0], d1: [1.1, 0], d2: [2.7, 0], o: [3.8, 0], c: [3.8, 2.6], g: [0, 2.6] },
    parts: [{ id: 'S', type: 'V', wave: 'sine', a: 'a', b: 'g', value: 0, name: 'v_i', valText: `V_m = ${fd(Vm, 0)} V`, side: -1 }, W_('a', 'd1'),
      { id: 'D', type: 'D', a: flip ? 'd2' : 'd1', b: flip ? 'd1' : 'd2', name: o.dName ?? (d.model === 'ideal' ? t('อุดมคติ', 'ideal') : d.model === 'table' ? t('จริง', 'real') : 'Si'), valText: '', side: -1, ...d }, W_('d2', 'o'),
      { id: 'R', type: 'R', a: 'o', b: 'c', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω') }, W_('c', 'g')] }; };
const HWOUT = { vi: c => c.Vab('S').re, vo: c => c.Vab('R').re, vd: c => c.Vab('D').re };
CH2.HWOUT = HWOUT;
const hwc = (Vm, d) => CH2.cycle(CH2.hw({ Vm, d, flip: true }), 'S', CH2.sine(Vm), HWOUT);
const E13 = { a: hwc(20, IDEAL), b: hwc(20, SI), ca: hwc(200, IDEAL), cb: hwc(200, SI) };
CH2.E13 = E13;
DEF.ex13 = { ...LAYT, solvedAt: 1,
  spec: k => CH2.hw({ Vm: k === 4 ? 200 : 20, d: k >= 3 ? SI : IDEAL, flip: true }),
  tick: (dt, s) => CH2.drive(s.ckt, 'S', (s.k === 4 ? 200 : 20) * Math.sin(s.B.clk.ph)),
  glow: k => (k === 1 || k === 3 || k === 5 ? ['D'] : null),
  after: (v, k) => { if (k >= 1) stTags(v, [['D', 0, -0.78]]); },
  badge: k => (k >= 5 ? [['PIV ≥ V_m = 20 V', 'PIV ≥ V_m = 20 V'], 'ok'] : k === 4 ? [['V_m = 200 V: V_K แทบไม่มีผล', 'V_m = 200 V: V_K hardly matters'], 'ok'] : k === 3 ? [['Si: V_dc ≅ −0.318(V_m − 0.7 V)', 'Si: V_dc ≅ −0.318(V_m − 0.7 V)'], 'ok']
    : k === 2 ? [['V_dc = −0.318 V_m', 'V_dc = −0.318 V_m'], 'ok'] : k === 1 ? [['นำเฉพาะครึ่งลบ: v_o = v_i', 'on in the negative half only: v_o = v_i'], 'ok'] : [['ไดโอดหันหัวลูกศรเข้าหาแหล่งจ่าย', 'the arrowhead points at the source'], 'wait']),
  waves: [{ title: (bd, k) => (bd.short ? '' : k === 5 ? t('v_i และแรงดันคร่อมไดโอด v_D', 'v_i and the diode voltage v_D') : k === 4 ? t('V_m = 200 V, ไดโอดซิลิคอน', 'V_m = 200 V, a silicon diode') : t('สัญญาณขาเข้าและขาออก', 'input and output')),
    sigs: (bd, k) => { const cy = k === 4 ? E13.cb : k >= 3 ? E13.b : E13.a;
      if (k === 0) return CH2.wsigs(cy, { vo: false });
      if (k === 5) return CH2.wsigs(cy, { key: 'vd', label: 'v_D', color: C.hole, fill: 'rgba(255,126,182,.12)', lines: [{ v: -20, label: '−V_m', color: C.red }] });
      return CH2.wsigs(cy, { lines: k >= 2 ? [{ v: cy.avg('vo'), label: 'V_dc' }] : [] }); } }],
  steps: () => [
    step(t('<b>(a) ไดโอดนำในครึ่งไหน</b>: หัวลูกศรของไดโอดชี้เข้าหาแหล่งจ่าย ในครึ่งบวก \\(v_i\\) ดันกระแสเข้าทางแคโทด สวนหัวลูกศร ไดโอด<b>ไม่นำ</b> ไม่มีกระแส \\(v_o = 0\\) ส่วนในครึ่งลบ กระแสไหลจากกราวด์ขึ้นผ่าน R แล้วผ่านไดโอดตามหัวลูกศรกลับเข้าแหล่งจ่าย ไดโอด<b>นำ</b> (ลัดวงจร) \\(v_o = v_i\\) (จุดเริ่มวิ่งตามเวลาจริงที่ช้าลง)',
      '<b>(a) Which half does the diode conduct?</b> Its arrowhead points at the source. In the positive half \\(v_i\\) pushes current into the cathode, against the arrowhead: the diode is <b>off</b>, no current flows and \\(v_o = 0\\). In the negative half current flows up from ground through R and along the arrowhead back into the source: the diode is <b>on</b> (a short) and \\(v_o = v_i\\) (the dots now run in slowed-down time)'),
      block([R`0 < \omega t < \pi: &\ v_o = 0`, R`\pi < \omega t < 2\pi: &\ v_o = v_i`])),
    step(t('<b>ระดับกระแสตรง</b> (dc level) คือค่าเฉลี่ยของ \\(v_o\\) ตลอดคาบ (สไลด์หน้า 34) พื้นที่ใต้กราฟอยู่ใต้แกน ค่าจึงติดลบ: ขั้วของ \\(v_o\\) กลับจากที่นิยามไว้ในรูป',
      '<b>The dc level</b> is the average of \\(v_o\\) over a period (slide p. 34). The area lies below the axis, so it is negative: the output has the opposite polarity to the one defined in the figure'),
      block([R`V_{dc} &= -0.318V_m = -0.318(20\ \text{V}) = \boxed{-6.36\ \text{V}}`]),
      t(`เส้นประสีเขียวคือค่าเฉลี่ยที่ตัวแก้วงจรหาจากคลื่นจริง ${v2(E13.a.avg('vo'))} V (0.318 คือ \\(1/\\pi\\) ที่ปัดเศษ)`, `The dashed green line is the average the solver finds from the actual wave, ${v2(E13.a.avg('vo'))} V (0.318 is \\(1/\\pi\\) rounded).`)),
    step(t('<b>(b) ไดโอดซิลิคอน</b>: ไดโอดเริ่มนำเมื่อ \\(v_i\\) ต่ำกว่า −0.7 V และขณะนำ \\(v_o = v_i + 0.7\\) V (สไลด์หน้า 35) ยอดของ \\(v_o\\) จึงเหลือ −19.3 V สูตร (2.8) ของตำราให้',
      '<b>(b) A silicon diode</b>: it conducts once \\(v_i\\) is below −0.7 V, and then \\(v_o = v_i + 0.7\\) V (slide p. 35), so the output peaks at −19.3 V. Eq. (2.8) of the book gives'),
      block([R`V_{dc} &\cong -0.318(V_m - V_K) = -0.318(19.3\ \text{V}) = \boxed{-6.14\ \text{V}}`]),
      t(`ลดลง 0.22 V หรือราว 3.5 % · ค่าเฉลี่ยจริงของคลื่นในภาพจำลองคือ ${v2(E13.b.avg('vo'))} V เพราะขณะนำไดโอดกินแรงดัน \\(V_K\\) ไปตลอดราวครึ่งคาบ ค่าเฉลี่ยจึงลดลงราว \\(V_K/2 = 0.35\\) V ไม่ใช่ \\(0.318V_K\\) สูตร (2.8) จึงเป็นค่าประมาณ ใช้ได้ดีเมื่อ \\(V_m \\gg V_K\\)`,
        `A drop of 0.22 V, about 3.5 %. The actual average of the simulated wave is ${v2(E13.b.avg('vo'))} V: while conducting, the diode takes \\(V_K\\) for about half the period, so the average falls by about \\(V_K/2 = 0.35\\) V, not \\(0.318V_K\\). Eq. (2.8) is an approximation, good when \\(V_m \\gg V_K\\).`)),
    step(t('<b>(c) เพิ่ม \\(V_m\\) เป็น 200 V</b> แล้วเทียบสองสูตร', '<b>(c) Raise \\(V_m\\) to 200 V</b> and compare the two equations'),
      block([R`\text{(2.7)}:\ V_{dc} &= -0.318(200\ \text{V}) = \boxed{-63.6\ \text{V}}`, R`\text{(2.8)}:\ V_{dc} &\cong -0.318(200\ \text{V} - 0.7\ \text{V}) = \boxed{-63.38\ \text{V}}`]),
      t(`ต่างกันเพียงราว 0.35 % ไม่มีผลในทางปฏิบัติ บนออสซิลโลสโคปก็มองไม่เห็นความต่างของยอดคลื่น (ภาพจำลองได้ ${v2(E13.cb.avg('vo'))} V) \\(V_K\\) สำคัญเฉพาะเมื่อ \\(V_m\\) ไม่ใหญ่กว่า \\(V_K\\) มากนัก`, `Only about 0.35 % apart: no practical difference, and invisible on an oscilloscope showing the whole wave (the simulation gives ${v2(E13.cb.avg('vo'))} V). \\(V_K\\) matters only when \\(V_m\\) is not much larger than \\(V_K\\).`)),
    step(t('<b>แรงดันย้อนกลับสูงสุด</b> (peak inverse voltage, PIV): ขณะไดโอดไม่นำในครึ่งบวก กระแสเป็นศูนย์ R ไม่มีแรงดันตก แรงดันของแหล่งจ่ายทั้งหมดอยู่ที่ไดโอด (สไลด์หน้า 39 · เส้นสีชมพูคือ \\(v_D\\))',
      '<b>The peak inverse voltage</b> (PIV): while the diode is off in the positive half, the current is zero, R drops nothing and the whole source voltage is across the diode (slide p. 39; the pink line is \\(v_D\\))'),
      block([R`\text{PIV} &\ge V_m = \boxed{20\ \text{V}}`]), t('ต้องเลือกไดโอดที่พิกัด PIV สูงกว่านี้ ไม่อย่างนั้นไดโอดจะเข้าย่านซีเนอร์ (หน้า 1.4)', 'The diode must be rated above this, or it enters the Zener region (page 1.4).'))],
  ask: () => ({ fields: [num(t('(a) V<sub>dc</sub> (V) =', '(a) V<sub>dc</sub> (V) ='), -6.36, { tol: 0.03 }), num(t('(b) V<sub>dc</sub> ซิลิคอน (V) =', '(b) V<sub>dc</sub> silicon (V) ='), -6.14, { tol: 0.13 }), num(t('(c) V<sub>dc</sub> อุดมคติ (V) =', '(c) V<sub>dc</sub> ideal (V) ='), -63.6, { tol: 0.1 })],
    check: v => (v[0] > 0 ? t('ไดโอดนำในครึ่งลบ ขาออกจึงติดลบ: \\(V_{dc} = -0.318V_m\\)', 'The diode conducts in the negative half, so the output is negative: \\(V_{dc} = -0.318V_m\\).') : near(v[1], -5.66, 0.02) ? t('นั่นคือสูตรของสไลด์หน้า 50 ที่ลบ 0.7 V หลังหาค่าเฉลี่ย ตำราและสไลด์หน้า 35 ลบ \\(V_K\\) ออกจาก \\(V_m\\) ก่อน: \\(-0.318(V_m - V_K)\\)', 'That is the formula of slide p. 50, which takes 0.7 V off after averaging; the book and slide p. 35 take \\(V_K\\) off \\(V_m\\) first: \\(-0.318(V_m - V_K)\\).') : '') }),
  answer: () => t('(a) \\(V_{dc} = -6.36\\) V (b) \\(-6.14\\) V (c) \\(-63.6\\) V และ \\(-63.38\\) V ตาม Boylestad Example 2.16 · PIV ≥ 20 V (สไลด์หน้า 39) · สไลด์หน้า 37–38 ที่ควรเป็นเฉลยว่างเปล่า', '(a) \\(V_{dc} = -6.36\\) V (b) \\(-6.14\\) V (c) \\(-63.6\\) V and \\(-63.38\\) V, as in Boylestad Example 2.16 · PIV ≥ 20 V (slide p. 39) · slides pp. 37–38, where the solution should be, are blank.') };

/* =====================================================================================================================
   page 2.6: full-wave rectification (slides pp. 40–50). The bridge of slide 40: v_i + at the top corner, − at the bottom one;
   D1 left → top, D2 top → right, D3 left → bottom, D4 bottom → right (slide 41: D2 and D3 conduct in the positive half; slide 42:
   D1 and D4); R from the right corner (+) to the left one. arms: { D3: 2000, … } puts a resistor in place of a diode (Example 2.17) */
CH2.bridge = (o = {}) => { const Vm = o.Vm ?? 10, Rv = o.R ?? 2000, d = o.d || IDEAL, arms = o.arms || {};
  /* the arms carry no labels of their own: CH2.bridgeTags writes "D1 on/off" (or the resistor value) outside each arm */
  const arm = (id, a, b) => (arms[id] ? { id, type: 'R', a, b, value: arms[id], name: '', valText: '', label: false } : { id, type: 'D', a, b, name: '', valText: '', label: false, ...d });
  return { ground: 'g', nodes: { a: [0, 0], t: [3.0, 0], l: [1.4, 1.8], r: [4.6, 1.8], bt: [3.0, 3.6], g: [0, 3.6], _padR: [6.3, 1.8] },   // _padR: room for the R tag
    parts: [{ id: 'S', type: 'V', wave: 'sine', a: 'a', b: 'g', value: 0, name: 'v_i', valText: `V_m = ${fd(Vm, 0)} V`, side: -1 }, W_('a', 't'), W_('g', 'bt'),
      arm('D1', 'l', 't'), arm('D2', 't', 'r'), arm('D3', 'l', 'bt'), arm('D4', 'bt', 'r'),
      { id: 'R', type: 'R', a: 'r', b: 'l', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω'), label: false }] }; };   // R is tagged outside the right corner (CH2.bridgeTags)
/* the labels outside the four arms of CH2.bridge: "D1 on" / "D1 off" from the current now (state false: the name only), or the resistor value */
const ARMS = { D1: ['l', 't', -1, -1], D2: ['t', 'r', 1, -1], D3: ['l', 'bt', -1, 1], D4: ['bt', 'r', 1, 1] };
CH2.bridgeTags = (v, state = true) => { const c = v.ckt, size = Math.max(11.5, v.u * 0.26);
  Object.keys(ARMS).forEach(id => { const p = c && c.part(id); if (!p) return; const [n1, n2, sx, sy] = ARMS[id], [x1, y1] = v.P(n1), [x2, y2] = v.P(n2), x = (x1 + x2) / 2 + sx * v.u * 0.42, y = (y1 + y2) / 2 + sy * v.u * 0.38;
    if (p.type === 'R') { CH6.tag(v.ctx, CK.eng(p.value, 'Ω'), x, y, COL.ink, { align: sx < 0 ? 'right' : 'left', size }); return; }
    const on = c.I(id).re > 1e-6; CH6.tag(v.ctx, `D_${id[1]}` + (state ? ' ' + (on ? t('นำ', 'on') : t('ไม่นำ', 'off')) : ''), x, y, state ? (on ? C.tan : C.red) : COL.ink, { align: sx < 0 ? 'right' : 'left', size }); });
  const pr = c && c.part('R'); if (pr) { const [x, y] = v.P('r'); CH6.tag(v.ctx, `R = ${CK.eng(pr.value, 'Ω')}`, x + v.u * 0.25, y - v.u * 0.42, C.q, { align: 'left', size }); } };
/* the centre-tapped rectifier of slide 46: the two halves of the 1:2 secondary are drawn as two sources, each equal to v_i, with the
   centre tap (CT) between them as the reference; D1 from the upper end and D2 from the lower end to the right node; R from there to CT */
CH2.ct = (o = {}) => { const Vm = o.Vm ?? 20, Rv = o.R ?? 1000, d = o.d || IDEAL;
  return { ground: 'ct', nodes: { s1: [0.8, 0], ct: [0.8, 1.5], s2: [0.8, 3.0], d1: [1.5, 0], k1: [2.9, 0], x1: [3.9, 0], o: [3.9, 1.5], d2: [1.5, 3.0], k2: [2.9, 3.0], x2: [3.9, 3.0] },
    parts: [{ id: 'S1', type: 'V', wave: 'sine', a: 's1', b: 'ct', value: 0, name: 'v_i', valText: t('ขดบน', 'upper half'), side: -1 }, { id: 'S2', type: 'V', wave: 'sine', a: 'ct', b: 's2', value: 0, name: 'v_i', valText: t('ขดล่าง', 'lower half'), side: -1 },
      W_('s1', 'd1'), { id: 'D1', type: 'D', a: 'd1', b: 'k1', name: 'D_1', label: false, ...d }, W_('k1', 'x1'), W_('x1', 'o'),   // named in the on/off tags
      W_('s2', 'd2'), { id: 'D2', type: 'D', a: 'd2', b: 'k2', name: 'D_2', label: false, ...d }, W_('k2', 'x2'), W_('x2', 'o'),
      { id: 'R', type: 'R', a: 'o', b: 'ct', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω') }] }; };
const BROUT = { vi: c => c.Vab('S').re, vo: c => c.Vab('R').re }, CTOUT = { vi: c => c.Vab('S1').re, vo: c => c.Vab('R').re, v1: c => c.Vab('D1').re, v2: c => c.Vab('D2').re };
CH2.BROUT = BROUT; CH2.CTOUT = CTOUT;
const B17 = CH2.cycle(CH2.bridge({ Vm: 10, arms: { D3: 2000, D4: 2000 } }), 'S', CH2.sine(10), { ...BROUT, v1: c => c.Vab('D1').re, v2: c => c.Vab('D2').re });
CH2.B17 = B17;
DEF.ex17 = { ...LAYT, solvedAt: 1, cktAspM: 0.56, spec: () => CH2.bridge({ Vm: 10, arms: { D3: 2000, D4: 2000 } }),
  tick: (dt, s) => CH2.drive(s.ckt, 'S', 10 * Math.sin(s.B.clk.ph)),
  glow: k => (k === 1 || k === 2 ? ['D1', 'D2'] : k === 4 ? ['D1'] : null),
  after: (v, k) => CH2.bridgeTags(v, k >= 1),
  badge: k => (k >= 4 ? [['PIV = 5 V', 'PIV = 5 V'], 'ok'] : k === 3 ? [['V_dc = 0.636(5 V) = 3.18 V', 'V_dc = 0.636(5 V) = 3.18 V'], 'ok'] : k >= 1 ? [['ครึ่งละไดโอดหนึ่งตัว: v_o = v_i/2', 'one diode per half: v_o = v_i/2'], 'ok'] : [['บริดจ์ที่มีไดโอดเพียงสองตัว', 'a bridge with only two diodes'], 'wait']),
  waves: [{ title: (bd, k) => (bd.short ? '' : k === 4 ? t('v_i และแรงดันคร่อม D1', 'v_i and the voltage across D1') : t('สัญญาณขาเข้าและขาออก', 'input and output')),
    sigs: (bd, k) => (k === 0 ? CH2.wsigs(B17, { vo: false }) : k === 4 ? CH2.wsigs(B17, { key: 'v1', label: 'v_D1', color: C.hole, fill: 'rgba(255,126,182,.12)', lines: [{ v: -5, label: '−5 V', color: C.red }] })
      : CH2.wsigs(B17, { lines: k >= 3 ? [{ v: B17.avg('vo'), label: 'V_dc' }] : [] })) }],
  steps: () => [
    step(t('<b>ครึ่งบวก</b>: มุมบนเป็นบวก D<sub>2</sub> ได้กระแสตามหัวลูกศร (<b>นำ</b>) ส่วนแคโทดของ D<sub>1</sub> อยู่ที่มุมบนซึ่งสูงที่สุด D<sub>1</sub> จึง<b>ไม่นำ</b> วาดวงจรใหม่ได้ \\(v_i\\) คร่อมตัวต้านทาน 2 kΩ แขนขวาล่าง และคร่อม R อนุกรมกับ 2 kΩ แขนซ้ายล่างด้วย (Fig. 2.66) R จึงได้ครึ่งหนึ่งของ \\(v_i\\)',
      '<b>The positive half</b>: the top corner is positive, so D<sub>2</sub> passes current along its arrowhead (<b>on</b>), while the cathode of D<sub>1</sub> sits at the top corner, the highest point, so D<sub>1</sub> is <b>off</b>. Redrawn, \\(v_i\\) is across the lower-right 2 kΩ, and also across R in series with the lower-left 2 kΩ (Fig. 2.66), so R gets half of \\(v_i\\)'),
      block([R`v_o &= v_i\frac{2\ \text{k}\Omega}{2\ \text{k}\Omega + 2\ \text{k}\Omega} = \frac{v_i}{2}`, R`V_{o(\max)} &= \frac{10\ \text{V}}{2} = \boxed{5\ \text{V}}`])),
    step(t('<b>ครึ่งลบ</b>: มุมล่างเป็นบวก บทบาทของไดโอดสลับกัน D<sub>1</sub> นำ D<sub>2</sub> ไม่นำ กระแสผ่าน R ยังคงไหลจากขวาไปซ้ายเหมือนเดิม \\(v_o\\) จึงเป็นบวกอีกครั้ง (Fig. 2.67)',
      '<b>The negative half</b>: the bottom corner is positive and the diodes swap roles, D<sub>1</sub> on and D<sub>2</sub> off. The current through R still flows from right to left, so \\(v_o\\) is positive again (Fig. 2.67)'),
      block([R`v_o &= \frac{|v_i|}{2}`])),
    step(t('<b>ระดับกระแสตรง</b>: คลื่นเต็มรูปที่ยอด 5 V', '<b>The dc level</b>: a full-wave output with a 5 V peak'),
      block([R`V_{dc} &= 0.636(5\ \text{V}) = \boxed{3.18\ \text{V}}`]),
      t('เท่ากับที่วงจรเรียงกระแสครึ่งคลื่นให้จากขาเข้าเดียวกัน (0.318 × 10 V) การเอาไดโอดสองตัวออกจากบริดจ์จึงทำให้ระดับกระแสตรงลดลงครึ่งหนึ่ง', 'The same as a half-wave rectifier would give from this input (0.318 × 10 V): taking two diodes out of the bridge halves the dc level.')),
    step(t('<b>PIV ของไดโอดแต่ละตัว</b>: ที่ยอดของครึ่งบวก D<sub>1</sub> ไม่นำ แคโทดอยู่ที่ 10 V แอโนดอยู่ที่มุมซ้ายซึ่งมีแรงดัน 10 − 5 = 5 V (เส้นสีชมพู)', '<b>The PIV of each diode</b>: at the positive peak D<sub>1</sub> is off with its cathode at 10 V and its anode at the left corner, 10 − 5 = 5 V (the pink line)'),
      block([R`\text{PIV} &= V_{o(\max)} = \boxed{5\ \text{V}}`]), t('ครึ่งหนึ่งของที่วงจรครึ่งคลื่นต้องการ (10 V) จากขาเข้าเดียวกัน', 'Half of what a half-wave rectifier would need (10 V) with the same input.'))],
  ask: () => ({ fields: [num(t('V<sub>o(max)</sub> (V) =', 'V<sub>o(max)</sub> (V) ='), 5), num('V<sub>dc</sub> (V) =', 3.18, { tol: 0.02 }), num('PIV (V) =', 5)],
    check: v => (near(v[0], 10, 0.01) ? t('ขาออกอยู่คร่อม R ที่อนุกรมกับตัวต้านทาน 2 kΩ อีกตัว จึงได้เพียงครึ่งหนึ่งของ \\(v_i\\)', 'R is in series with another 2 kΩ across \\(v_i\\), so it gets only half of it.') : '') }),
  answer: () => t('\\(V_{o(\\max)} = 5\\) V, \\(V_{dc} = 3.18\\) V, PIV = 5 V ตาม Boylestad Example 2.17 · สไลด์ไม่มีตัวอย่างของหัวข้อนี้ จึงใช้ตัวอย่างจากตำรา', '\\(V_{o(\\max)} = 5\\) V, \\(V_{dc} = 3.18\\) V, PIV = 5 V, as in Boylestad Example 2.17 · the slides have no example for this topic, so this one is from the book.') };
const CT = { a: CH2.cycle(CH2.ct({ Vm: 20 }), ['S1', 'S2'], CH2.sine(20), CTOUT), b: CH2.cycle(CH2.ct({ Vm: 20, d: SI }), ['S1', 'S2'], CH2.sine(20), CTOUT) };
CH2.CT = CT;
DEF.ct = { ...LAYT, solvedAt: 1, cktAspM: 0.56, spec: k => CH2.ct({ Vm: 20, d: k === 3 ? SI : IDEAL }),
  tick: (dt, s) => CH2.drive(s.ckt, ['S1', 'S2'], 20 * Math.sin(s.B.clk.ph)),
  glow: k => (k === 1 || k === 2 ? ['D1', 'D2'] : k === 4 ? ['D2'] : null),
  after: (v, k) => stTags(v, [['D1', 0, -0.7, 'D_1'], ['D2', 0, 0.7, 'D_2']]),
  badge: k => (k >= 4 ? [['PIV = 2V_m = 40 V', 'PIV = 2V_m = 40 V'], 'ok'] : k === 3 ? [['Si: ไดโอดหนึ่งตัวในแต่ละเส้นทาง', 'Si: one diode in each path'], 'ok'] : k >= 1 ? [['ไดโอดผลัดกันนำครึ่งละตัว', 'the diodes take turns, one per half'], 'ok'] : [['หม้อแปลงแท็ปกลาง 1:2', 'a 1:2 centre-tapped transformer'], 'wait']),
  waves: [{ title: (bd, k) => (bd.short ? '' : k === 4 ? t('v_i และแรงดันคร่อม D2', 'v_i and the voltage across D2') : k === 3 ? t('ไดโอดซิลิคอน', 'silicon diodes') : t('สัญญาณขาเข้า (ขดบน) และขาออก', 'input (upper half) and output')),
    sigs: (bd, k) => (k === 0 ? CH2.wsigs(CT.a, { vo: false, mag: 40 }) : k === 4 ? CH2.wsigs(CT.a, { key: 'v2', label: 'v_D2', color: C.hole, fill: 'rgba(255,126,182,.12)', mag: 40, lines: [{ v: -40, label: '−2V_m', color: C.red }] })
      : CH2.wsigs(k === 3 ? CT.b : CT.a, { mag: 40, lines: k >= 3 ? [{ v: (k === 3 ? CT.b : CT.a).avg('vo'), label: 'V_dc' }] : [] })) }],
  steps: () => [
    step(t('<b>ครึ่งบวก</b>: ปลายบนของขดทุติยภูมิเป็น \\(+v_i\\) ปลายล่างเป็น \\(-v_i\\) เทียบกับแท็ปกลาง D<sub>1</sub> <b>นำ</b> D<sub>2</sub> <b>ไม่นำ</b> (สไลด์หน้า 47)', '<b>The positive half</b>: the upper end of the secondary is at \\(+v_i\\) and the lower end at \\(-v_i\\) with respect to the centre tap, so D<sub>1</sub> is <b>on</b> and D<sub>2</sub> <b>off</b> (slide p. 47)'),
      block([R`v_o &= v_i\ \ (\text{D}_1\ \text{on})`])),
    step(t('<b>ครึ่งลบ</b>: บทบาทสลับกัน D<sub>2</sub> นำ D<sub>1</sub> ไม่นำ กระแสผ่าน R ยังไหลทางเดิม ขั้วของ \\(v_o\\) จึงเหมือนเดิม (สไลด์หน้า 48)', '<b>The negative half</b>: the roles swap, D<sub>2</sub> on and D<sub>1</sub> off; the current through R keeps its direction, so \\(v_o\\) keeps its polarity (slide p. 48)'),
      block([R`v_o &= -v_i = |v_i|\ \ (\text{D}_2\ \text{on})`])),
    step(t('<b>ระดับกระแสตรง</b>: ไดโอดอุดมคติ และไดโอดซิลิคอน ซึ่งมีไดโอดเพียงตัวเดียวในแต่ละเส้นทาง (ภาพจำลองเปลี่ยนเป็นซิลิคอน)', '<b>The dc level</b>: with ideal diodes, and with silicon diodes, one in each path (the simulation now uses silicon)'),
      block([R`\text{ideal}:\ V_{dc} &= 0.636V_m = 0.636(20\ \text{V}) = \boxed{12.72\ \text{V}}`, R`\text{Si}:\ V_{dc} &\cong 0.636(V_m - V_K) = 0.636(19.3\ \text{V}) = 12.27\ \text{V}`]),
      t(`สไลด์หน้า 50 ให้ \\(0.636V_m - 0.7\\) V = 12.02 V ส่วนค่าเฉลี่ยจริงของคลื่นในภาพจำลองคือ ${v2(CT.b.avg('vo'))} V (ลดลงราว \\(V_K\\) ตลอดเวลาที่นำ)`, `Slide p. 50 gives \\(0.636V_m - 0.7\\) V = 12.02 V; the actual average of the simulated wave is ${v2(CT.b.avg('vo'))} V (it loses about \\(V_K\\) whenever it conducts).`)),
    step(t('<b>PIV</b>: ที่ยอดของครึ่งบวก D<sub>2</sub> ไม่นำ แอโนดอยู่ที่ \\(-V_m\\) แคโทดอยู่ที่ \\(v_o = +V_m\\) (เส้นสีชมพู สไลด์หน้า 49)', '<b>The PIV</b>: at the positive peak D<sub>2</sub> is off with its anode at \\(-V_m\\) and its cathode at \\(v_o = +V_m\\) (the pink line, slide p. 49)'),
      block([R`\text{PIV} &= V_{\text{secondary}} + V_R = V_m + V_m = \boxed{2V_m = 40\ \text{V}}`]), t('สองเท่าของวงจรบริดจ์ที่ใช้ขาเข้าเท่ากัน แลกกับการใช้ไดโอดเพียงสองตัว', 'Twice that of a bridge with the same input: the price of using only two diodes.'))],
  ask: () => ({ fields: [num(t('V<sub>dc</sub> อุดมคติ (V) =', 'V<sub>dc</sub> ideal (V) ='), 12.72, { tol: 0.05 }), num('PIV (V) =', 40)],
    check: v => (near(v[1], 20, 0.01) ? t('ไดโอดที่ไม่นำรับทั้งแรงดันของขดครึ่งหนึ่งและแรงดันขาออก: \\(V_m + V_m\\)', 'The off diode sees the half-winding and the output in series: \\(V_m + V_m\\).') : near(v[0], 6.36, 0.03) ? t('นั่นคือครึ่งคลื่น วงจรนี้เรียงกระแสทั้งสองครึ่ง: \\(0.636V_m\\)', 'That is half-wave; this circuit uses both halves: \\(0.636V_m\\).') : '') }),
  answer: () => t('\\(V_{dc} = 12.72\\) V (ซิลิคอน \\(\\cong\\) 12.27 V) และ PIV = \\(2V_m\\) = 40 V · โจทย์แต่งเพิ่มเพื่อฝึกสไลด์หน้า 46–49 ไม่มีเฉลยในห้อง', '\\(V_{dc} = 12.72\\) V (silicon \\(\\cong\\) 12.27 V) and PIV = \\(2V_m\\) = 40 V · a practice problem written for slides pp. 46–49; no class solution.') };

/* =====================================================================================================================
   page 2.7: clippers (Part II slides pp. 3–13). Series: v_i, the battery V along the top (+ towards the diode for V > 0, as in Ex.1),
   the diode (anode first unless flip), R down the right side, v_o across R. Parallel: v_i, R along the top, the diode and the battery V
   down the output branch (Ex.2: anode at the battery's + terminal, cathode at the output; flip turns the diode round), v_o across that branch */
CH2.sclip = (o = {}) => { const V = o.V ?? 5, d = o.d || IDEAL, flip = !!o.flip, Rv = o.R ?? 1000, pos = V >= 0;
  const parts = [{ id: 'S', type: 'V', wave: o.wave || 'sine', a: 'a', b: 'g', value: 0, name: 'v_i', valText: o.viText ?? '', side: -1 }, W_('a', 'n1')];
  if (Math.abs(V) > 1e-12) parts.push({ id: 'B', type: 'V', battery: true, a: pos ? 'n2' : 'n1', b: pos ? 'n1' : 'n2', value: Math.abs(V), name: 'V', valText: `${fd(Math.abs(V), 1)} V`, side: -1 }); else parts.push(W_('n1', 'n2'));
  parts.push(W_('n2', 'd1'), { id: 'D', type: 'D', a: flip ? 'd2' : 'd1', b: flip ? 'd1' : 'd2', name: d.model === 'simple' ? 'Si' : '', valText: '', side: -1, ...d }, W_('d2', 'o'), { id: 'R', type: 'R', a: 'o', b: 'c', value: Rv, name: 'R', valText: '' }, W_('c', 'g'));
  return { ground: 'g', nodes: { a: [0, 0], n1: [0.7, 0], n2: [1.7, 0], d1: [2.1, 0], d2: [3.3, 0], o: [4.1, 0], c: [4.1, 2.6], g: [0, 2.6] }, parts }; };
CH2.pclip = (o = {}) => { const V = o.V ?? 4, d = o.d || IDEAL, flip = !!o.flip, Rv = o.R ?? 1000, pos = V >= 0;
  const parts = [{ id: 'S', type: 'V', wave: o.wave || 'tri', a: 'a', b: 'g', value: 0, name: 'v_i', valText: o.viText ?? '', side: -1 }, { id: 'R', type: 'R', a: 'a', b: 'o', value: Rv, name: 'R', valText: '' },
    W_('o', 'x'), { id: 'D', type: 'D', a: flip ? 'o' : 'm', b: flip ? 'm' : 'o', name: d.model === 'simple' ? 'Si' : '', valText: '', side: -1, ...d }];
  if (Math.abs(V) > 1e-12) parts.push({ id: 'B', type: 'V', battery: true, a: pos ? 'm' : 'gb', b: pos ? 'gb' : 'm', value: Math.abs(V), name: 'V', valText: `${fd(Math.abs(V), 1)} V`, side: -1 }); else parts.push(W_('m', 'gb'));
  parts.push(W_('gb', 'g'), W_('xb', 'gb'));
  return { ground: 'g', nodes: { a: [0, 0], o: [2.6, 0], x: [3.8, 0], m: [2.6, 1.4], gb: [2.6, 2.8], xb: [3.8, 2.8], g: [0, 2.8] }, parts }; };
const SCOUT = { vi: c => c.Vab('S').re, vo: c => c.Vab('R').re, vd: c => c.Vab('D').re }, PCOUT = { vi: c => c.Vab('S').re, vo: c => c.V('o').re - c.V('g').re, vd: c => c.Vab('D').re };
CH2.SCOUT = SCOUT; CH2.PCOUT = PCOUT;
const E18 = CH2.cycle(CH2.sclip({ V: 5 }), 'S', CH2.sine(20), SCOUT), E20 = CH2.cycle(CH2.pclip({ V: 4 }), 'S', CH2.tri(16), PCOUT);
CH2.E18 = E18; CH2.E20 = E20;
const trLine = (v, label) => ({ v, label: label || t('จุดเปลี่ยนสถานะ', 'transition'), color: C.red });
DEF.clip1 = { ...LAYT, solvedAt: 2, spec: () => CH2.sclip({ V: 5, viText: '20 V' }),
  tick: (dt, s) => CH2.drive(s.ckt, 'S', 20 * Math.sin(s.B.clk.ph)),
  glow: k => (k === 1 ? ['R'] : k === 2 ? ['B', 'D'] : null),
  after: (v, k) => { if (k >= 2) stTags(v, [['D', 0, -0.78]]); },
  badge: k => (k >= 5 ? [['v_o: 0 ถึง 25 V', 'v_o: 0 to 25 V'], 'ok'] : k === 4 ? [['ไดโอดนำ: v_o = v_i + 5 V', 'on: v_o = v_i + 5 V'], 'ok'] : k === 3 ? [['เปลี่ยนสถานะที่ v_i = −5 V', 'changes state at v_i = −5 V'], 'ok'] : k === 2 ? [['v_i บวกและแบตเตอรีช่วยกันดันให้นำ', 'v_i > 0 and the battery both push it on'], 'ok'] : [['วงจรตัดแบบอนุกรมกับแบตเตอรี 5 V', 'a series clipper with a 5 V battery'], 'wait']),
  waves: [{ title: (bd, k) => (bd.short ? '' : t('สัญญาณขาเข้าและขาออก', 'input and output')),
    sigs: (bd, k) => (k <= 2 ? CH2.wsigs(E18, { vo: false, mag: 25 }) : k === 3 ? CH2.wsigs(E18, { vo: false, mag: 25, lines: [trLine(-5)] }) : CH2.wsigs(E18, { mag: 25, lines: [trLine(-5)] })) }],
  steps: () => [
    step(t('<b>ขั้นที่ 1: \\(v_o\\) อยู่คร่อมอะไร</b> ขาออกอยู่คร่อม R โดยตรง เมื่อไดโอดไม่นำ กระแสเป็นศูนย์ \\(v_o = iR = 0\\)', '<b>Step 1: what is \\(v_o\\) across?</b> The output is directly across R; when the diode is off the current is zero and \\(v_o = iR = 0\\)')),
    step(t('<b>ขั้นที่ 2: ไดโอดน่าจะนำเมื่อไร</b> ทั้ง \\(v_i\\) ในครึ่งบวกและแบตเตอรี 5 V ดันกระแสไปทางหัวลูกศรเหมือนกัน ไดโอดจึงนำตลอดช่วงที่ \\(v_i\\) เป็นบวก และเมื่อ \\(v_i\\) ติดลบ ต้องติดลบเกิน 5 V จึงชนะแบตเตอรีและทำให้ไดโอดหยุดนำ (จุดเริ่มวิ่ง)',
      '<b>Step 2: when is the diode likely on?</b> The positive half of \\(v_i\\) and the 5 V battery both push current along the arrowhead, so the diode is on for all positive \\(v_i\\); once \\(v_i\\) goes negative it must pass −5 V to beat the battery and turn the diode off (the dots start)')),
    step(t('<b>ขั้นที่ 3: ระดับเปลี่ยนสถานะ</b> (transition level) ขณะเปลี่ยนสถานะ ไดโอดเป็นลัดวงจรที่ยังไม่มีกระแส \\(v_d = 0\\) และ \\(i_d = 0\\) (สไลด์หน้า 7) กฎแรงดันของเคียร์ชอฟฟ์รอบวงให้', '<b>Step 3: the transition level</b>: at the change of state the diode is a short with no current yet, \\(v_d = 0\\) and \\(i_d = 0\\) (slide p. 7); Kirchhoff\'s voltage law round the loop gives'),
      block([R`v_i + 5\ \text{V} &= 0 \Rightarrow v_i = \boxed{-5\ \text{V}}`]), t('เส้นประสีแดงบนกราฟ: เหนือเส้นนี้ไดโอดนำ ใต้เส้นนี้ไม่นำ', 'The dashed red line on the graph: above it the diode is on, below it off.')),
    step(t('<b>ขั้นที่ 4: ขณะไดโอดนำ</b> (\\(v_i > -5\\) V) ไดโอดเป็นลัดวงจร กฎแรงดันรอบวงให้', '<b>Step 4: while the diode is on</b> (\\(v_i > -5\\) V) it is a short, and Kirchhoff\'s voltage law gives'),
      block([R`v_o &= v_i + 5\ \text{V}`, R`v_i = 20\ \text{V}: &\ v_o = \boxed{25\ \text{V}}`, R`v_i = 0: &\ v_o = 5\ \text{V}`, R`v_i = -5\ \text{V}: &\ v_o = 0`])),
    step(t('<b>ขณะไดโอดไม่นำ</b> (\\(v_i < -5\\) V) วงจรเปิด ไม่มีกระแส', '<b>While the diode is off</b> (\\(v_i < -5\\) V) the loop is open and carries no current'),
      block([R`v_o &= \boxed{0\ \text{V}}`]), t('ขาออกไม่ติดลบเลย และส่วนที่ผ่านไปได้ถูกยกขึ้น 5 V ตามแบตเตอรี (สไลด์หน้า 9 แถวกลาง)', 'The output never goes negative, and the part that passes is lifted by the 5 V of the battery (slide p. 9).'))],
  ask: () => ({ fields: [num(t('v<sub>o</sub> สูงสุด (V) =', 'v<sub>o</sub> max (V) ='), 25), num(t('v<sub>i</sub> ที่เปลี่ยนสถานะ (V) =', 'v<sub>i</sub> at the transition (V) ='), -5), num(t('v<sub>o</sub> ต่ำสุด (V) =', 'v<sub>o</sub> min (V) ='), 0, { tol: 1e-3 })],
    check: v => (near(v[0], 15, 0.01) ? t('แบตเตอรีหันขั้วบวกเข้าหาไดโอด จึงบวกเพิ่ม: \\(v_i + 5\\) ไม่ใช่ \\(v_i - 5\\)', 'The battery has its + side towards the diode, so it adds: \\(v_i + 5\\), not \\(v_i - 5\\).') : near(v[1], 5, 0.01) ? t('จุดเปลี่ยนคือเมื่อ \\(v_i + 5 = 0\\): \\(v_i = -5\\) V', 'The transition is where \\(v_i + 5 = 0\\): \\(v_i = -5\\) V.') : '') }),
  answer: () => t('\\(v_o = v_i + 5\\) V เมื่อ \\(v_i > -5\\) V (สูงสุด 25 V) และ \\(v_o = 0\\) เมื่อ \\(v_i < -5\\) V ตาม Boylestad Example 2.18', '\\(v_o = v_i + 5\\) V for \\(v_i > -5\\) V (up to 25 V) and \\(v_o = 0\\) for \\(v_i < -5\\) V, as in Boylestad Example 2.18.') };
DEF.clip2 = { ...LAYT, solvedAt: 2, spec: () => CH2.pclip({ V: 4, viText: '16 V' }),
  tick: (dt, s) => CH2.drive(s.ckt, 'S', CH2.tri(16)(s.B.clk.ph)),
  glow: k => (k === 1 ? ['D', 'B'] : k === 2 ? ['B'] : k === 4 ? ['R'] : null),
  after: (v, k) => { if (k >= 2) stTags(v, [['D', -0.5, 0]]); },
  badge: k => (k >= 4 ? [['v_o = v_i เหนือ 4 V, 4 V ใต้ลงมา', 'v_o = v_i above 4 V, 4 V below'], 'ok'] : k === 3 ? [['เปลี่ยนสถานะที่ v_i = 4 V', 'changes state at v_i = 4 V'], 'ok'] : k === 2 ? [['ไดโอดนำ: v_o = 4 V', 'on: v_o = 4 V'], 'ok'] : [['วงจรตัดแบบขนานกับแบตเตอรี 4 V', 'a parallel clipper with a 4 V battery'], 'wait']),
  waves: [{ title: (bd, k) => (bd.short ? '' : t('สัญญาณขาเข้า (สามเหลี่ยม) และขาออก', 'input (triangle) and output')),
    sigs: (bd, k) => (k <= 2 ? CH2.wsigs(E20, { vo: false }) : k === 3 ? CH2.wsigs(E20, { vo: false, lines: [trLine(4)] }) : CH2.wsigs(E20, { lines: [trLine(4)] })) }],
  steps: () => [
    step(t('<b>ขั้นที่ 1</b>: ในข้อนี้ขาออกอยู่คร่อมแบตเตอรี 4 V อนุกรมกับไดโอด ไม่ได้คร่อม R', '<b>Step 1</b>: here the output is across the 4 V battery in series with the diode, not across R')),
    step(t('<b>ขั้นที่ 2</b>: ขั้วของแบตเตอรีและทิศของไดโอดบอกว่าไดโอดจะนำในช่วงส่วนใหญ่ของครึ่งลบ ขณะนำ ขาออกคร่อมแบตเตอรีโดยตรง (จุดเริ่มวิ่ง)', '<b>Step 2</b>: the battery polarity and the diode direction say the diode will be on for much of the negative region; while it is on, the output is directly across the battery (the dots start)'),
      block([R`\text{on}:\ v_o &= V = \boxed{4\ \text{V}}`])),
    step(t('<b>ขั้นที่ 3: ระดับเปลี่ยนสถานะ</b> ขณะเปลี่ยน \\(i_d = 0\\) R ไม่มีแรงดันตก \\(v_o = v_i\\) และ \\(v_d = 0\\) ทำให้ \\(v_o = 4\\) V (สไลด์หน้า 12)', '<b>Step 3: the transition level</b>: at the change \\(i_d = 0\\), so R drops nothing and \\(v_o = v_i\\); and \\(v_d = 0\\) makes \\(v_o = 4\\) V (slide p. 12)'),
      block([R`v_i &= \boxed{4\ \text{V}}`])),
    step(t('<b>ขั้นที่ 4</b>: เมื่อ \\(v_i > 4\\) V ไดโอดไม่นำ ไม่มีกระแส \\(v_R = 0\\) ขาออกตาม \\(v_i\\) ขึ้นไปถึง 16 V เมื่อ \\(v_i < 4\\) V ไดโอดนำ ขาออกค้างที่ 4 V', '<b>Step 4</b>: for \\(v_i > 4\\) V the diode is off, no current, \\(v_R = 0\\), so the output follows \\(v_i\\) up to 16 V; for \\(v_i < 4\\) V the diode is on and the output stays at 4 V'),
      block([R`v_i > 4\ \text{V}: &\ v_o = v_i\ \ (\max\ \boxed{16\ \text{V}})`, R`v_i < 4\ \text{V}: &\ v_o = \boxed{4\ \text{V}}`]),
      t('ในตำราประโยคหลังรูป 2.84 เขียนเหมือน \\(v_o = 4\\) V เมื่อ \\(v_i \\ge 4\\) V ซึ่งกลับกัน รูป 2.84 และสไลด์หน้า 12 แสดง \\(v_o = v_i\\) ในช่วงนั้น', 'In the book, the sentence after Fig. 2.84 reads as if \\(v_o = 4\\) V for \\(v_i \\ge 4\\) V, which is the wrong way round: Fig. 2.84 and slide p. 12 show \\(v_o = v_i\\) there.'))],
  ask: () => ({ fields: [num(t('v<sub>o</sub> สูงสุด (V) =', 'v<sub>o</sub> max (V) ='), 16), num(t('v<sub>o</sub> ต่ำสุด (V) =', 'v<sub>o</sub> min (V) ='), 4), num(t('v<sub>i</sub> ที่เปลี่ยนสถานะ (V) =', 'v<sub>i</sub> at the transition (V) ='), 4)],
    check: v => (near(v[1], -16, 0.01) ? t('ขณะไดโอดนำ ขาออกคร่อมแบตเตอรี 4 V โดยตรง ไม่ตามขาเข้าลงไป', 'While the diode is on the output is right across the 4 V battery; it does not follow the input down.') : '') }),
  answer: () => t('\\(v_o = v_i\\) เมื่อ \\(v_i \\ge 4\\) V (สูงสุด 16 V) และ \\(v_o = 4\\) V เมื่อ \\(v_i < 4\\) V ตาม Boylestad Example 2.20 (รูป 2.84)', '\\(v_o = v_i\\) for \\(v_i \\ge 4\\) V (up to 16 V) and \\(v_o = 4\\) V for \\(v_i < 4\\) V, as in Boylestad Example 2.20 (Fig. 2.84).') };

/* =====================================================================================================================
   page 2.8: clampers (Part II slides pp. 14–20): a real transient, the input period slowed down to 4 s.
   v_i (square: hi for the first half period, lo for the second), C along the top, the diode and the battery V down the first branch
   (Ex.3: anode at the battery's + terminal, cathode at the output; flip turns it round), R down the second; v_o across R */
CH2.clamp = (o = {}) => { const hi = o.hi ?? 10, lo = o.lo ?? -20, f = o.f ?? 1000, Tp = 1 / f, V = o.V ?? 5, d = o.d || IDEAL, flip = !!o.flip, pos = V >= 0, Cv = o.C ?? 1e-6, Rv = o.R ?? 1e5;
  const parts = [{ id: 'S', type: 'V', wave: 'square', a: 'a', b: 'g', fn: tm => (((tm % Tp) + Tp) % Tp < Tp / 2 ? hi : lo), value: hi, name: 'v_i', valText: `${fd(f, 0)} Hz`, side: -1 },
    W_('a', 'c1'), { id: 'C', type: 'C', a: 'c1', b: 'o', value: Cv, name: 'C', valText: CK.eng(Cv, 'F'), vmax: 30 },
    { id: 'D', type: 'D', a: flip ? 'o' : 'm', b: flip ? 'm' : 'o', name: d.model === 'simple' ? 'Si' : '', valText: '', side: -1, ...d }];
  if (Math.abs(V) > 1e-12) parts.push({ id: 'B', type: 'V', battery: true, a: pos ? 'm' : 'gb', b: pos ? 'gb' : 'm', value: Math.abs(V), name: 'V', valText: `${fd(Math.abs(V), 1)} V`, side: -1 }); else parts.push(W_('m', 'gb'));
  parts.push(W_('o', 'r'), { id: 'R', type: 'R', a: 'r', b: 'rb', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω') }, W_('rb', 'gb'), W_('gb', 'g'));
  return { ground: 'g', mode: 'tran', nodes: { a: [0, 0], c1: [0.6, 0], o: [2.4, 0], m: [2.4, 1.4], gb: [2.4, 2.8], r: [3.8, 0], rb: [3.8, 2.8], g: [0, 2.8] }, parts }; };
const CLOUT = { vi: c => c.Vab('S').re, vo: c => c.Vab('R').re, vc: c => -c.Vab('C').re };   // v_C as the book marks it: + on the output side
CH2.CLOUT = CLOUT;
/* records a transient on a board: one input period = per steps; keeps four periods. The sweep shows two periods: before the cursor the
   current sweep, after it the previous one, as on an oscilloscope */
CH2.Rec = class {
  constructor(Tp, outs, per = 400) { this.Tp = Tp; this.per = per; this.h = Tp / per; this.N = 4 * per; this.outs = outs; this.c = null; this.i = 0; this.acc = 0; this.buf = {}; }
  sync(c) { if (c === this.c) return; this.c = c; this.i = 0; this.acc = 0; this.buf = {}; Object.keys(this.outs).forEach(k => { this.buf[k] = new Float64Array(this.N).fill(NaN); }); }
  run(c, dt, slow = 4) { if (!c) return; this.sync(c); this.acc += dt * this.Tp / slow; let n = 0;
    while (this.acc >= this.h && n++ < 80) { this.acc -= this.h; c.step(this.h); const j = this.i % this.N; Object.keys(this.outs).forEach(k => { this.buf[k][j] = this.outs[k](c); }); this.i++; } }
  /* jumps ahead by whole periods at once (for a steady state without waiting) */
  skip(c, periods) { this.sync(c); for (let k = 0; k < periods * this.per; k++) { c.step(this.h); const j = this.i % this.N; Object.keys(this.outs).forEach(q => { this.buf[q][j] = this.outs[q](c); }); this.i++; } }
  f(k) { return d => { const span = 2 * this.per, cur = this.i - 1; if (cur < 0) return NaN; const w0 = Math.floor(cur / span) * span; let j = w0 + Math.round(d / 360 * this.per);
    if (j > cur) { if (w0 === 0) return NaN; j -= span; }   // after the cursor: the previous sweep (none yet during the first one)
    return j < 0 || j <= cur - this.N ? NaN : this.buf[k][j % this.N]; }; }
  get now() { return (Math.max(0, this.i - 1) % (2 * this.per)) / this.per * TAU; }
  last(k) { return this.i ? this.buf[k][(this.i - 1) % this.N] : NaN; }
};
const clSigs = (rec, o = {}) => { const m = o.mag ?? 40, s = [{ f: rec.f('vi'), color: C.elec, label: 'v_i', unit: 'V', g: 'v', mag: m, w: 2 }];
  if (o.vo !== false) s.push({ f: rec.f('vo'), color: C.q, label: 'v_o', unit: 'V', g: 'v', mag: m, w: 3 });
  if (o.vc) s.push({ f: rec.f('vc'), color: C.avg, label: 'v_C', unit: 'V', g: 'v', mag: m, w: 2, dash: [6, 4] });
  (o.lines || []).forEach(L => s.push({ f: () => L.v, color: L.color || C.tan, label: L.label, unit: 'V', g: 'v', mag: m, w: 1.6, dash: [3, 4], noValue: true }));
  return s; };
CH2.clSigs = clSigs;
const clDef = (si) => { const vk = si ? 0.7 : 0, on = 5 - vk, VC = 20 + on, off = 10 + VC, SP = CH2.clamp({ d: si ? SI : IDEAL });
  return { ...LAYT, solvedAt: 1, spec: () => SP, init: s => { s.st.rec = new CH2.Rec(1e-3, CLOUT); },
    tick: (dt, s) => s.st.rec.run(s.ckt, dt),
    glow: k => (k === 1 ? ['D', 'B', 'C'] : k === 2 ? ['C'] : k === 3 ? ['R', 'C'] : null),
    after: (v, k) => { if (k >= 1) stTags(v, [['D', -0.5, 0]]); },
    badge: k => (k >= 4 ? [['สวิงขาออก 30 V = สวิงขาเข้า', 'output swing 30 V = input swing'], 'ok'] : k === 3 ? [['RC ≫ T/2: C รักษาแรงดันไว้', 'RC ≫ T/2: C holds its voltage'], 'ok'] : k === 2 ? [[`v_i = +10 V: v_o = ${fd(off, 1)} V`, `v_i = +10 V: v_o = ${fd(off, 1)} V`], 'ok']
      : k === 1 ? [[`v_i = −20 V: v_o = ${fd(on, 1)} V, V_C = ${fd(VC, 1)} V`, `v_i = −20 V: v_o = ${fd(on, 1)} V, V_C = ${fd(VC, 1)} V`], 'ok'] : [[si ? 'ไดโอดซิลิคอน V_K = 0.7 V' : 'วงจรยึดระดับสัญญาณ: C, ไดโอด, R และแบตเตอรี 5 V', si ? 'a silicon diode, V_K = 0.7 V' : 'a clamper: C, a diode, R and a 5 V battery'], 'wait']),
    waves: [{ title: (bd) => (bd.short ? '' : t('ภาพจำลองตามเวลา: 1 คาบ (1 ms) ใช้ 4 วินาที', 'a transient: one period (1 ms) takes 4 s')), sigs: (bd, k, s) => clSigs(s.st.rec, { vo: k >= 1, vc: k >= 1, lines: k >= 2 ? [{ v: on, label: '' }, { v: off, label: '' }] : [] }),
      opts: (bd, k, s) => ({ now: s.st.rec.now, w: TAU * 1000 }) }],
    steps: () => [
      step(t(`<b>เริ่มจากช่วงที่ขาเข้าไบแอสตรงไดโอด</b> (สไลด์หน้า 17): \\(t_1 \\to t_2\\), \\(v_i = -20\\) V ไดโอดนำ${si ? 'ด้วยแรงดัน 0.7 V' : 'เป็นลัดวงจร'} ขาออกคร่อมแบตเตอรีโดยตรง ส่วนกฎแรงดันรอบวงขาเข้าให้แรงดันที่ C ชาร์จถึงทันที`, `<b>Start with the part of the input that forward-biases the diode</b> (slide p. 17): \\(t_1 \\to t_2\\), \\(v_i = -20\\) V. The diode is on${si ? ', with 0.7 V across it,' : ' (a short),'} and the output is directly across the battery; Kirchhoff\'s voltage law round the input loop gives the voltage C charges to at once`),
        block(si ? [R`v_o &= 5\ \text{V} - 0.7\ \text{V} = \boxed{4.3\ \text{V}}`, R`-20\ \text{V} + V_C + 0.7\ \text{V} - 5\ \text{V} &= 0 \Rightarrow V_C = \boxed{24.3\ \text{V}}`] : [R`v_o &= V = \boxed{5\ \text{V}}`, R`-20\ \text{V} + V_C - 5\ \text{V} &= 0 \Rightarrow V_C = \boxed{25\ \text{V}}`]),
        t('ครึ่งคาบแรกของภาพจำลอง C ยังไม่มีประจุ ไดโอดไม่นำ \\(v_o = v_i = 10\\) V ตั้งแต่ครึ่งลบแรกเป็นต้นไปจึงเห็นการยึดระดับ', 'In the first half period of the simulation C is still empty and the diode is off, so \\(v_o = v_i = 10\\) V; the clamping shows from the first negative half on.')),
      step(t('<b>\\(t_2 \\to t_3\\), \\(v_i = +10\\) V</b>: ทั้งขาเข้าและแรงดันที่ C ดันกระแสเข้าไดโอดทางแคโทด ไดโอดไม่นำ แบตเตอรีจึงไม่มีผล กฎแรงดันรอบวงนอก', '<b>\\(t_2 \\to t_3\\), \\(v_i = +10\\) V</b>: the input and the capacitor voltage both push current into the cathode, so the diode is off and the battery drops out; Kirchhoff\'s voltage law round the outer loop'),
        block(si ? [R`+10\ \text{V} + 24.3\ \text{V} - v_o &= 0 \Rightarrow v_o = \boxed{34.3\ \text{V}}`] : [R`+10\ \text{V} + 25\ \text{V} - v_o &= 0 \Rightarrow v_o = \boxed{35\ \text{V}}`])),
      step(t('<b>C รักษาแรงดันไว้ได้หรือไม่</b>: ค่าคงตัวเวลาของการคายประจุผ่าน R เทียบกับครึ่งคาบ 0.5 ms', '<b>Does C hold its voltage?</b> The time constant of the discharge through R against the half period of 0.5 ms'),
        block([R`\tau &= RC = (100\ \text{k}\Omega)(1\ \mu\text{F}) = 0.1\ \text{s}`, R`5\tau &= 0.5\ \text{s} \gg \frac{T}{2} = 0.5\ \text{ms}`]),
        t('เส้นประสีม่วง (\\(v_C\\)) แทบไม่ขยับระหว่างพัลส์ ตำราใช้ C = 0.1 µF ได้ \\(\\tau\\) = 10 ms ซึ่งยังมากกว่าครึ่งคาบมากเช่นกัน', 'The dashed purple line (\\(v_C\\)) hardly moves between pulses. The book uses C = 0.1 µF, giving \\(\\tau\\) = 10 ms, still far longer than half a period.')),
      step(t('<b>ตรวจคำตอบ</b>: สวิงของขาออกต้องเท่ากับสวิงของขาเข้า (สไลด์หน้า 17)', '<b>Check</b>: the output swing must equal the input swing (slide p. 17)'),
        block([si ? R`34.3\ \text{V} - 4.3\ \text{V} &= 30\ \text{V} = 10\ \text{V} - (-20\ \text{V})\ \ \checkmark` : R`35\ \text{V} - 5\ \text{V} &= 30\ \text{V} = 10\ \text{V} - (-20\ \text{V})\ \ \checkmark`]),
        t('รูปคลื่นไม่เปลี่ยน แต่ถูกเลื่อนขึ้นทั้งก้อนจนส่วนล่างไปอยู่ที่ระดับของแบตเตอรี', 'The shape of the wave is unchanged; it is shifted up as a whole until its bottom sits at the battery level.'))],
    ask: () => ({ fields: [num(t('v<sub>o</sub> เมื่อ v<sub>i</sub> = −20 V (V) =', 'v<sub>o</sub> at v<sub>i</sub> = −20 V (V) ='), on), num('V<sub>C</sub> (V) =', VC), num(t('v<sub>o</sub> เมื่อ v<sub>i</sub> = +10 V (V) =', 'v<sub>o</sub> at v<sub>i</sub> = +10 V (V) ='), off)],
      check: v => (near(v[2], 10, 0.01) ? t('C ยังมีแรงดันอยู่ ต้องบวกเข้าไป: \\(v_o = v_i + V_C\\)', 'C still holds its voltage; add it: \\(v_o = v_i + V_C\\).') : near(v[1], 15, 0.01) ? t('ทั้งขาเข้า −20 V และแบตเตอรีอยู่ในวงขาเข้า: \\(V_C = 20 + 5\\)', 'Both the −20 V input and the battery are in the input loop: \\(V_C = 20 + 5\\).') : '') }),
    answer: () => t(si ? '\\(v_o = 4.3\\) V และ 34.3 V, \\(V_C = 24.3\\) V ตาม Boylestad Example 2.23' : '\\(v_o = 5\\) V และ 35 V, \\(V_C = 25\\) V ตาม Boylestad Example 2.22 (ตำราใช้ C = 0.1 µF)', si ? '\\(v_o = 4.3\\) V and 34.3 V, \\(V_C = 24.3\\) V, as in Boylestad Example 2.23.' : '\\(v_o = 5\\) V and 35 V, \\(V_C = 25\\) V, as in Boylestad Example 2.22 (the book uses C = 0.1 µF).') }; };
DEF.cl3 = clDef(false); DEF.cl4 = clDef(true);

/* =====================================================================================================================
   page 2.9: Zener diodes (Part II slides pp. 21–31). V_i on the left, R along the top, the Zener (cathode up) and R_L down two branches.
   eq: 'off' an open gap (step 1 of slide 22), 'on' the battery V_Z (slide 21a) */
CH2.zreg = (o = {}) => { const Vi = o.Vi ?? 16, Rv = o.R ?? 1000, RL = o.RL ?? 1200, Vz = o.Vz ?? 10;
  const Z = o.eq === 'off' ? { id: 'DZ', type: 'O', a: 'z', b: 'b', name: '', label: false } : o.eq === 'on' ? { id: 'DZ', type: 'V', battery: true, a: 'b', b: 'z', value: Vz, name: 'V_Z', valText: `${fd(Vz, 0)} V`, side: -1 }
    : { id: 'DZ', type: 'D', a: 'z', b: 'b', model: 'simple', vk: 0.7, vz: Vz, name: 'V_Z', valText: `${fd(Vz, 0)} V`, side: -1 };
  return { ground: 'g', nodes: { a: [0, 0], b: [2.4, 0], z: [2.4, 2.6], l: [4.0, 0], lb: [4.0, 2.6], g: [0, 2.6] },
    parts: [{ id: 'Vi', type: 'V', a: 'a', b: 'g', value: Vi, name: 'V_i', valText: `${fd(Vi, 2)} V`, side: -1 }, { id: 'R', type: 'R', a: 'a', b: 'b', value: Rv, name: 'R', valText: CK.eng(Rv, 'Ω') }, Z,
      W_('b', 'l'), { id: 'RL', type: 'R', a: 'l', b: 'lb', value: RL, name: 'R_L', valText: CK.eng(RL, 'Ω') }, W_('lb', 'z'), W_('z', 'g')] }; };
/* the regulator by hand (V, mA, mW): { V (the open-circuit voltage of step 1), on, VL, VR, IR, IL, IZ, PZ } */
CH2.zcalc = (Vi, Rv, RL, Vz) => { const V = RL * Vi / (Rv + RL), on = V > Vz, VL = on ? Vz : V, VR = Vi - VL, IR = VR / Rv * 1000, IL = VL / RL * 1000, IZ = on ? IR - IL : 0;
  return { V, on, VL, VR, IR, IL, IZ, PZ: on ? Vz * IZ : 0 }; };
/* the Zener current (mA) of a solved circuit: from cathode to anode */
CH2.iz = c => { const p = c && c.part('DZ'); if (!p) return 0; return p.type === 'D' ? -c.I('DZ').re * 1000 : p.type === 'V' ? c.I('DZ').re * 1000 : 0; };
const zBars = (ctx, b, bd, z, title, pzm) => CH8.bars(ctx, b, [{ label: 'I_R', v: z.IR, color: C.q, sub: 'V_R/R' }, { label: 'I_L', v: z.IL, color: C.elec, sub: 'V_L/R_L' }, { label: 'I_Z', v: z.IZ, color: z.on ? C.tan : C.red, text: z.on ? undefined : '0', sub: z.on ? `P_Z = ${fd(z.PZ, 1)} mW` : t('ไม่นำ', 'off') }],
  { title: bd.short ? t('กระแส (mA)', 'currents (mA)') : title, fmt: v => fd(v, 2), sub: !bd.short });
const Z5 = { a: CH2.zcalc(16, 1000, 1200, 10), b: CH2.zcalc(16, 1000, 3000, 10) }; CH2.Z5 = Z5;
DEF.z5 = { ...LAY, solvedAt: 1, spec: k => CH2.zreg({ Vi: 16, R: 1000, RL: k >= 3 ? 3000 : 1200, Vz: 10, eq: k === 1 || k === 3 ? 'off' : k === 4 ? 'on' : undefined }),
  glow: k => (k === 1 || k === 3 ? ['DZ'] : k === 4 ? ['DZ'] : null),
  after: (v, k) => { const z = k >= 3 ? Z5.b : Z5.a; if (k === 1 || k === 3) { const [x, y] = v.P('b'); CH6.tag(v.ctx, IE.tt([`V = ${fd(z.V, 2)} V`, `V = ${fd(z.V, 2)} V`]), x + v.u * 0.3, y + v.u * 1.3, z.on ? C.tan : C.red, { align: 'left', size: Math.max(11.5, v.u * 0.26) }); } },
  badge: k => (k >= 5 ? [[`I_Z = ${fd(Z5.b.IZ, 2)} mA, P_Z = ${fd(Z5.b.PZ, 1)} mW < 30 mW`, `I_Z = ${fd(Z5.b.IZ, 2)} mA, P_Z = ${fd(Z5.b.PZ, 1)} mW < 30 mW`], 'ok'] : k === 4 ? [['ซีเนอร์นำ: V_L = V_Z = 10 V', 'Zener on: V_L = V_Z = 10 V'], 'ok'] : k === 3 ? [['(b) R_L = 3 kΩ: V = 12 V > V_Z', '(b) R_L = 3 kΩ: V = 12 V > V_Z'], 'ok']
    : k === 2 ? [['(a) ซีเนอร์ไม่นำ: V_L = 8.73 V', '(a) Zener off: V_L = 8.73 V'], 'wait'] : k === 1 ? [['ขั้นที่ 1: ถอดซีเนอร์ออก', 'step 1: remove the Zener'], 'wait'] : [['V_i = 16 V, V_Z = 10 V, P_ZM = 30 mW', 'V_i = 16 V, V_Z = 10 V, P_ZM = 30 mW'], 'wait']),
  side: (ctx, b, bd, k) => (k < 2 ? CH8.empty(ctx, b, ['ขั้นที่ 1 (สไลด์หน้า 22): ถอดซีเนอร์ออก แล้วหาแรงดันคร่อมช่องเปิด', 'step 1 (slide p. 22): take the Zener out and find the voltage across the gap'])
    : zBars(ctx, b, bd, k >= 3 ? Z5.b : Z5.a, k >= 3 ? t('(b) R_L = 3 kΩ: กระแส (mA)', '(b) R_L = 3 kΩ: currents (mA)') : t('(a) R_L = 1.2 kΩ: กระแส (mA)', '(a) R_L = 1.2 kΩ: currents (mA)'))),
  steps: () => [
    step(t('<b>(a) ขั้นที่ 1: ถอดซีเนอร์ออก</b> แล้วหาแรงดัน V คร่อมช่องเปิดด้วยตัวแบ่งแรงดัน (สไลด์หน้า 22 · สมการ 2.16)', '<b>(a) Step 1: take the Zener out</b> and find the voltage V across the gap with the voltage divider (slide p. 22, Eq. 2.16)'),
      block([R`V &= \frac{R_LV_i}{R + R_L} = \frac{(1.2\ \text{k}\Omega)(16\ \text{V})}{1\ \text{k}\Omega + 1.2\ \text{k}\Omega} = ${fd(Z5.a.V, 2)}\ \text{V}`])),
    step(t('<b>ขั้นที่ 2</b>: \\(V = 8.73\\) V น้อยกว่า \\(V_Z = 10\\) V ซีเนอร์จึง<b>ไม่นำ</b> (เปิดวงจร) วงจรเหมือนในขั้นที่ 1', '<b>Step 2</b>: \\(V = 8.73\\) V is below \\(V_Z = 10\\) V, so the Zener is <b>off</b> (an open circuit) and the network is that of step 1'),
      block([R`V_L &= V = \boxed{8.73\ \text{V}}`, R`V_R &= V_i - V_L = 16 - 8.73 = \boxed{7.27\ \text{V}}`, R`I_Z &= \boxed{0\ \text{A}},\quad P_Z = V_ZI_Z = \boxed{0\ \text{W}}`])),
    step(t('<b>(b) \\(R_L\\) = 3 kΩ: ขั้นที่ 1 อีกครั้ง</b>', '<b>(b) \\(R_L\\) = 3 kΩ: step 1 again</b>'),
      block([R`V &= \frac{(3\ \text{k}\Omega)(16\ \text{V})}{1\ \text{k}\Omega + 3\ \text{k}\Omega} = 12\ \text{V} > V_Z = 10\ \text{V}`]), t('ซีเนอร์จะ<b>นำ</b> (ย่านซีเนอร์)', 'The Zener will be <b>on</b> (in its Zener region).')),
    step(t('<b>แทนซีเนอร์ด้วยแบตเตอรี \\(V_Z\\)</b> (สไลด์หน้า 21 รูป a) แรงดันคร่อมสิ่งที่ขนานกันเท่ากัน (สมการ 2.17)', '<b>Replace the Zener by the battery \\(V_Z\\)</b> (slide p. 21, Fig. a); parallel elements share one voltage (Eq. 2.17)'),
      block([R`V_L &= V_Z = \boxed{10\ \text{V}}`, R`V_R &= V_i - V_L = 16 - 10 = \boxed{6\ \text{V}}`])),
    step(t('<b>กระแสและกำลังของซีเนอร์</b> จากกฎกระแสของเคียร์ชอฟฟ์ (สมการ 2.18–2.19)', '<b>The Zener current and power</b> from Kirchhoff\'s current law (Eqs. 2.18–2.19)'),
      block([R`I_L &= \frac{V_L}{R_L} = \frac{10\ \text{V}}{3\ \text{k}\Omega} = 3.33\ \text{mA},\quad I_R = \frac{V_R}{R} = \frac{6\ \text{V}}{1\ \text{k}\Omega} = 6\ \text{mA}`, R`I_Z &= I_R - I_L = 6 - 3.33 = \boxed{2.67\ \text{mA}}`, R`P_Z &= V_ZI_Z = (10\ \text{V})(2.67\ \text{mA}) = \boxed{26.7\ \text{mW}} < P_{ZM} = 30\ \text{mW}`]))],
  ask: () => ({ fields: [num(t('(a) V<sub>L</sub> (V) =', '(a) V<sub>L</sub> (V) ='), Z5.a.V, { tol: 0.01 }), num(t('(b) I<sub>Z</sub> (mA) =', '(b) I<sub>Z</sub> (mA) ='), Z5.b.IZ, { tol: 0.01 }), num(t('(b) P<sub>Z</sub> (mW) =', '(b) P<sub>Z</sub> (mW) ='), Z5.b.PZ, { tol: 0.1 })],
    check: v => (near(v[0], 10, 0.01) ? t('ตรวจสถานะก่อน: แรงดันเปิดวงจร 8.73 V ไม่ถึง \\(V_Z\\) ซีเนอร์จึงไม่นำ', 'Check the state first: the open-circuit voltage, 8.73 V, does not reach \\(V_Z\\), so the Zener is off.') : '') }),
  answer: () => t('(a) \\(V_L = 8.73\\) V, \\(V_R = 7.27\\) V, \\(I_Z = 0\\), \\(P_Z = 0\\) (b) \\(V_L = 10\\) V, \\(V_R = 6\\) V, \\(I_Z = 2.67\\) mA, \\(P_Z = 26.7\\) mW ตาม Boylestad Example 2.26', '(a) \\(V_L = 8.73\\) V, \\(V_R = 7.27\\) V, \\(I_Z = 0\\), \\(P_Z = 0\\) (b) \\(V_L = 10\\) V, \\(V_R = 6\\) V, \\(I_Z = 2.67\\) mA, \\(P_Z = 26.7\\) mW, as in Boylestad Example 2.26.') };
/* Ex.6: V_i = 50 V, R = 1 kΩ, V_Z = 10 V, I_ZM = 32 mA, R_L variable */
const Z6 = { RLmin: 1000 * 10 / 40, ILmax: 10 / 250 * 1000, IR: 40, ILmin: 40 - 32 }; Z6.RLmax = 10 / Z6.ILmin * 1000; CH2.Z6 = Z6;
const vlRL = (Vi, Rv, Vz) => RL => Math.min(Vz, RL * Vi / (Rv + RL));
DEF.z6 = { ...LAY, solvedAt: 1, spec: k => CH2.zreg({ Vi: 50, R: 1000, RL: k >= 4 ? Z6.RLmax : Z6.RLmin, Vz: 10 }),
  glow: k => (k === 1 ? ['RL'] : k === 3 ? ['R'] : k === 4 ? ['DZ', 'RL'] : k === 5 ? ['DZ'] : null),
  badge: k => (k >= 5 ? [['P_max = 320 mW', 'P_max = 320 mW'], 'ok'] : k === 4 ? [['R_L = 1.25 kΩ: I_Z = I_ZM = 32 mA', 'R_L = 1.25 kΩ: I_Z = I_ZM = 32 mA'], 'ok'] : k >= 1 ? [['R_L = 250 Ω: ซีเนอร์เพิ่งเริ่มนำ (I_Z = 0)', 'R_L = 250 Ω: the Zener just turns on (I_Z = 0)'], 'ok'] : [['V_i คงที่ 50 V, R_L ปรับได้', 'fixed V_i = 50 V, variable R_L'], 'wait']),
  side: (ctx, b, bd, k) => CH2.xy(ctx, b, { x: [0, 2000], y: [0, 12], xt: [250, 1000, 1250, 2000], yt: [5, 10], xfmt: x => CK.eng(x, 'Ω'), xl: 'R_L', yl: 'V_L (V)', title: bd.short ? '' : t('V_L เทียบกับ R_L (รูป 2.120a)', 'V_L against R_L (Fig. 2.120a)'),
    fns: [{ f: vlRL(50, 1000, 10), color: C.curve }], band: k >= 4 ? { x1: Z6.RLmin, x2: Z6.RLmax, label: ['ช่วงที่คุมแรงดันได้', 'regulated range'] } : null,
    pts: k >= 1 ? [{ x: k >= 4 ? Z6.RLmax : Z6.RLmin, y: 10, label: k >= 4 ? 'R_Lmax' : 'R_Lmin', side: k >= 4 ? 1 : 1, dy: -14 }] : [] }),
  steps: () => [
    step(t('<b>\\(R_L\\) ต่ำสุดที่ทำให้ซีเนอร์นำ</b>: ตอนเริ่มนำ แรงดันจากตัวแบ่งแรงดันพอดี \\(V_Z\\) (สไลด์หน้า 26 · สมการ 2.20)', '<b>The smallest \\(R_L\\) that turns the Zener on</b>: at turn-on the divider gives exactly \\(V_Z\\) (slide p. 26, Eq. 2.20)'),
      block([R`R_{L\min} &= \frac{RV_Z}{V_i - V_Z} = \frac{(1\ \text{k}\Omega)(10\ \text{V})}{50\ \text{V} - 10\ \text{V}} = \boxed{250\ \Omega}`])),
    step(t('<b>กระแสโหลดสูงสุด</b> เกิดที่ \\(R_{L\\min}\\) (สมการ 2.21)', '<b>The largest load current</b> comes with \\(R_{L\\min}\\) (Eq. 2.21)'),
      block([R`I_{L\max} &= \frac{V_Z}{R_{L\min}} = \frac{10\ \text{V}}{250\ \Omega} = \boxed{40\ \text{mA}}`])),
    step(t('<b>เมื่อซีเนอร์นำ แรงดันและกระแสของ R คงที่</b> (สมการ 2.22–2.23) ไม่ว่า \\(R_L\\) จะเท่าไร', '<b>With the Zener on, R has a fixed voltage and current</b> (Eqs. 2.22–2.23), whatever \\(R_L\\) is'),
      block([R`V_R &= V_i - V_Z = 50 - 10 = 40\ \text{V}`, R`I_R &= \frac{V_R}{R} = \frac{40\ \text{V}}{1\ \text{k}\Omega} = 40\ \text{mA}`]), t('\\(I_Z\\) ต่ำสุดเมื่อ \\(I_L\\) สูงสุด และสูงสุดเมื่อ \\(I_L\\) ต่ำสุด (สไลด์หน้า 27)', '\\(I_Z\\) is least when \\(I_L\\) is greatest, and greatest when \\(I_L\\) is least (slide p. 27).')),
    step(t('<b>\\(I_Z\\) ต้องไม่เกิน \\(I_{ZM}\\)</b> จึงได้ \\(I_L\\) ต่ำสุดและ \\(R_L\\) สูงสุด (สมการ 2.25–2.26)', '<b>\\(I_Z\\) must not exceed \\(I_{ZM}\\)</b>, which sets the least \\(I_L\\) and the largest \\(R_L\\) (Eqs. 2.25–2.26)'),
      block([R`I_{L\min} &= I_R - I_{ZM} = 40 - 32 = \boxed{8\ \text{mA}}`, R`R_{L\max} &= \frac{V_Z}{I_{L\min}} = \frac{10\ \text{V}}{8\ \text{mA}} = \boxed{1.25\ \text{k}\Omega}`]), t('แถบสีเขียวในกราฟคือช่วง \\(R_L\\) ที่ \\(V_L\\) คงที่ 10 V', 'The green band of the graph is the range of \\(R_L\\) that holds \\(V_L\\) at 10 V.')),
    step(t('<b>(b) พิกัดกำลังสูงสุดของซีเนอร์</b>', '<b>(b) The maximum power rating of the Zener</b>'),
      block([R`P_{\max} &= V_ZI_{ZM} = (10\ \text{V})(32\ \text{mA}) = \boxed{320\ \text{mW}}`]))],
  ask: () => ({ fields: [num(t('R<sub>Lmin</sub> (Ω) =', 'R<sub>Lmin</sub> (Ω) ='), 250), num(t('R<sub>Lmax</sub> (kΩ) =', 'R<sub>Lmax</sub> (kΩ) ='), 1.25), num(t('I<sub>Lmin</sub> (mA) =', 'I<sub>Lmin</sub> (mA) ='), 8), num('P<sub>max</sub> (mW) =', 320)],
    check: v => (near(v[0], 200, 1) ? t('ตัวแบ่งแรงดันใช้ \\(V_i - V_Z\\) ที่ตัวส่วน: \\(RV_Z/(V_i - V_Z)\\)', 'The divider puts \\(V_i - V_Z\\) underneath: \\(RV_Z/(V_i - V_Z)\\).') : '') }),
  answer: () => t('250 Ω ≤ \\(R_L\\) ≤ 1.25 kΩ และ 8 mA ≤ \\(I_L\\) ≤ 40 mA · \\(P_{\\max}\\) = 320 mW ตาม Boylestad Example 2.27', '250 Ω ≤ \\(R_L\\) ≤ 1.25 kΩ and 8 mA ≤ \\(I_L\\) ≤ 40 mA · \\(P_{\\max}\\) = 320 mW, as in Boylestad Example 2.27.') };
/* Ex.7: R = 220 Ω, V_Z = 20 V, I_ZM = 60 mA, R_L = 1.2 kΩ, V_i variable */
const Z7 = { Vimin: (1200 + 220) * 20 / 1200, IL: 20 / 1.2, IRmax: 60 + 20 / 1.2 }; Z7.Vimax = Z7.IRmax / 1000 * 220 + 20; CH2.Z7 = Z7;
DEF.z7 = { ...LAY, solvedAt: 1, spec: k => CH2.zreg({ Vi: k >= 3 ? Z7.Vimax : Z7.Vimin, R: 220, RL: 1200, Vz: 20 }),
  glow: k => (k === 1 ? ['Vi'] : k === 2 ? ['RL'] : k === 3 ? ['DZ', 'Vi'] : null),
  badge: k => (k >= 3 ? [[`V_i = ${fd(Z7.Vimax, 2)} V: I_Z = I_ZM`, `V_i = ${fd(Z7.Vimax, 2)} V: I_Z = I_ZM`], 'ok'] : k >= 1 ? [[`V_i = ${fd(Z7.Vimin, 2)} V: ซีเนอร์เพิ่งเริ่มนำ`, `V_i = ${fd(Z7.Vimin, 2)} V: the Zener just turns on`], 'ok'] : [['R_L คงที่ 1.2 kΩ, V_i ปรับได้', 'fixed R_L = 1.2 kΩ, variable V_i'], 'wait']),
  side: (ctx, b, bd, k) => CH2.xy(ctx, b, { x: [0, 45], y: [0, 24], xt: [10, Z7.Vimin, Z7.Vimax], yt: [10, 20], xfmt: x => fd(x, x % 1 ? 2 : 0), xl: 'V_i (V)', yl: 'V_L (V)', title: bd.short ? '' : t('V_L เทียบกับ V_i (รูป 2.122)', 'V_L against V_i (Fig. 2.122)'),
    fns: [{ f: Vi => Math.min(20, Vi * 1200 / 1420), color: C.curve }], band: k >= 3 ? { x1: Z7.Vimin, x2: Z7.Vimax, label: ['ช่วงที่คุมแรงดันได้', 'regulated range'] } : null,
    pts: k >= 1 ? [{ x: k >= 3 ? Z7.Vimax : Z7.Vimin, y: 20, label: k >= 3 ? 'V_imax' : 'V_imin', side: k >= 3 ? -1 : 1, dy: -14 }] : [] }),
  steps: () => [
    step(t('<b>\\(V_i\\) ต่ำสุดที่ทำให้ซีเนอร์นำ</b>: ตัวแบ่งแรงดันต้องให้ \\(V_L = V_Z\\) พอดี (สไลด์หน้า 30 · สมการ 2.27)', '<b>The least \\(V_i\\) that turns the Zener on</b>: the divider must give exactly \\(V_L = V_Z\\) (slide p. 30, Eq. 2.27)'),
      block([R`V_{i\min} &= \frac{(R_L + R)V_Z}{R_L} = \frac{(1200\ \Omega + 220\ \Omega)(20\ \text{V})}{1200\ \Omega} = \boxed{${fd(Z7.Vimin, 2)}\ \text{V}}`])),
    step(t('<b>กระแสโหลดคงที่</b> เพราะ \\(V_L = V_Z\\) และ \\(R_L\\) คงที่ กระแสผ่าน R สูงสุดเมื่อ \\(I_Z = I_{ZM}\\) (สมการ 2.28)', '<b>The load current is fixed</b>, since \\(V_L = V_Z\\) and \\(R_L\\) is fixed; the current through R is greatest when \\(I_Z = I_{ZM}\\) (Eq. 2.28)'),
      block([R`I_L &= \frac{V_Z}{R_L} = \frac{20\ \text{V}}{1.2\ \text{k}\Omega} = ${fd(Z7.IL, 2)}\ \text{mA}`, R`I_{R\max} &= I_{ZM} + I_L = 60 + ${fd(Z7.IL, 2)} = ${fd(Z7.IRmax, 2)}\ \text{mA}`])),
    step(t('<b>\\(V_i\\) สูงสุด</b> (สมการ 2.29)', '<b>The greatest \\(V_i\\)</b> (Eq. 2.29)'),
      block([R`V_{i\max} &= I_{R\max}R + V_Z = (${fd(Z7.IRmax, 2)}\ \text{mA})(0.22\ \text{k}\Omega) + 20\ \text{V} = \boxed{${fd(Z7.Vimax, 2)}\ \text{V}}`]),
      t('แถบสีเขียวคือช่วงของ \\(V_i\\) ที่ \\(V_L\\) คงที่ 20 V (รูป 2.122)', 'The green band is the range of \\(V_i\\) that holds \\(V_L\\) at 20 V (Fig. 2.122).'))],
  ask: () => ({ fields: [num(t('V<sub>imin</sub> (V) =', 'V<sub>imin</sub> (V) ='), Z7.Vimin, { tol: 0.02 }), num(t('V<sub>imax</sub> (V) =', 'V<sub>imax</sub> (V) ='), Z7.Vimax, { tol: 0.03 })],
    check: v => (near(v[1], 33.2, 0.05) ? t('กระแสผ่าน R คือ \\(I_{ZM} + I_L\\) ไม่ใช่ \\(I_{ZM}\\) อย่างเดียว', 'The current through R is \\(I_{ZM} + I_L\\), not \\(I_{ZM}\\) alone.') : '') }),
  answer: () => t(`${fd(Z7.Vimin, 2)} V ≤ \\(V_i\\) ≤ ${fd(Z7.Vimax, 2)} V ตาม Boylestad Example 2.28`, `${fd(Z7.Vimin, 2)} V ≤ \\(V_i\\) ≤ ${fd(Z7.Vimax, 2)} V, as in Boylestad Example 2.28.`) };

CH2.DEF = DEF;
CH2.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.CH2 = CH2;
})(window);
