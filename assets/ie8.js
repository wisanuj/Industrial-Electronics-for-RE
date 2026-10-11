/* ie8.js — chapter 8 (linear–digital ICs): comparators, the R-2R ladder DAC, ladder-network and dual-slope ADCs, the 555 timer and the 566
   voltage-controlled oscillator, all solved by circuit.js (op-amps with single-supply rails vhi / vlo, ideal diodes as open-collector outputs,
   switches, sources with fn(t)); the digital parts (the 555's flip-flop, the 566's Schmitt trigger, the ADC counters) run between the time steps
   of OP.Rec through its ctl hook. The global is IC. Sources: course slides "Chapter 8 Linear-Digital ICs" (27 pp.) and Boylestad & Nashelsky,
   11th ed., §13.2–13.5 (Figs. 13.1–13.3, 13.11–13.23; Examples 13.1–13.2 and the two 566 examples of §13.5).
   IC.ckt(o): kind 'comp' (Fig. 13.3), 'window' (Fig. 13.11), 'ladder' (Fig. 13.12), 'adc' (Fig. 13.15), 'dual' (Fig. 13.14), 'in555' (Fig. 13.16),
   't555' (Figs. 13.17 / 13.19), 'v566' (Figs. 13.22–13.23) · IC.box draws an IC outline with pin numbers · IC.ctl* are the controllers ·
   IC.DEF: comp, compInv, sine, window (8.1) · ladder, adc, dual (8.2) · in555, astable, mono (8.3) · vco, vcoPot (8.4) */
(function (global) {
'use strict';
const IC = {}, fd = CH6.fd, R = String.raw, C = IE.COL, T = CH6.text, COL = CH6.COL, TAU = 2 * Math.PI, PURPLE = '#c792ea', ORANGE = '#ffa552';
const t = (th, en) => MC.t(th, en), tt = p => IE.tt(p);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o }), hid = (a, b) => ({ type: 'W', a, b, hidden: true, noDots: true });
const vtx = OP.vtx, itx = OP.itx, uF = OP.uF, fHz = OP.fHz, u3 = (x, n = 3) => LS.u(x, n), kO = r => CK.eng(r, 'Ω');
const pF = c => (c >= 1e-9 ? `${u3(c * 1e9, 3)} nF` : `${u3(c * 1e12, 3)} pF`), ms = x => (x >= 1 ? `${u3(x, 3)} s` : x >= 1e-3 ? `${u3(x * 1e3, 3)} ms` : `${u3(x * 1e6, 3)} µs`);
const bdg = (th, en, ok = true) => [[th, en ?? th], ok === true ? 'ok' : ok === false ? 'wait' : ok];
const LAY = { ...OP.LAY }, LAYT = { ...OP.LAY, rowAsp: 0.5, rowMin: 230 };
const res = (id, a, b, r, name, o = {}) => ({ id, type: 'R', a, b, value: r, name, valText: kO(r), ...o });
const cap = (id, a, b, c, name, o = {}) => ({ id, type: 'C', a, b, value: c, name, valText: c >= 1e-8 ? uF(c) : pF(c), ...o });
const src = (id, a, b, v, name, o = {}) => { const neg = v < 0; return { id, type: 'V', a: neg ? b : a, b: neg ? a : b, value: Math.abs(v), name, valText: vtx(v), ...o }; };
const oa = (id, P, N, O, o = {}) => ({ id, type: 'OA', P, N, O, gain: o.gain, vsat: o.vsat, vhi: o.vhi, vlo: o.vlo, labelSide: o.labelSide, name: o.aName ?? '', valText: o.aText ?? '', label: (o.aName ?? o.aText) !== undefined ? undefined : false });
const led = (id, a, b, o = {}) => ({ id, type: 'D', a, b, model: 'simple', vk: 1.8, led: true, ledColor: o.color || '#ff5a5a', ledFull: 0.02, name: 'LED', valText: '', ...o });
IC.pF = pF; IC.ms = ms;

/* =====================================================================================================================
   1) an IC outline with numbered pins: o = { x0, y0, x1, y1 (grid), name, pins: [{ node, n, side: 'l' | 'r' | 't' | 'b', label }] } */
IC.box = (v, o) => { const ctx = v.ctx, u = v.u, A = v.P([o.x0, o.y0]), B = v.P([o.x1, o.y1]), sz = Math.max(11.5, u * 0.3);
  ctx.save(); ctx.fillStyle = 'rgba(90,209,255,.07)'; ctx.strokeStyle = CK.PAL.body; ctx.lineWidth = Math.max(2, u * 0.055); ctx.beginPath(); ctx.rect(A[0], A[1], B[0] - A[0], B[1] - A[1]); ctx.fill(); ctx.stroke(); ctx.restore();
  T(ctx, o.name, (A[0] + B[0]) / 2, o.nameY !== undefined ? v.P([0, o.nameY])[1] : (A[1] + B[1]) / 2, { color: CK.PAL.ink, size: sz * 1.3, weight: '700' });
  (o.pins || []).forEach(p => { const [x, y] = v.P(p.node), r = Math.max(7, u * 0.2), dx = p.side === 'l' ? r + 2 : p.side === 'r' ? -r - 2 : 0, dy = p.side === 't' ? r + 2 : p.side === 'b' ? -r - 2 : 0;
    ctx.save(); ctx.fillStyle = '#161a2f'; ctx.strokeStyle = CK.PAL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    T(ctx, String(p.n), x + dx, y + dy + 0.5, { color: CK.PAL.ink, size: Math.max(9.5, u * 0.22), weight: '700' });
    if (p.label) { const lx = x + dx + (p.side === 'l' ? r + 4 : p.side === 'r' ? -r - 4 : 0), ly = y + dy + (p.side === 't' ? r + 10 : p.side === 'b' ? -r - 8 : 0.5);
      T(ctx, tt(p.label), lx, ly, { color: CK.PAL.muted, size: Math.max(10, u * 0.23), align: p.side === 'l' ? 'left' : p.side === 'r' ? 'right' : 'center' }); } }); };

/* =====================================================================================================================
   2) the circuits */
/* a 741 comparator (Figs. 13.2–13.3): V_ref from a divider R1–R2 on V+ (or vref given directly, or 0 with the − input grounded) at one input, V_i at the
   other (DC, or sig for a transient), the output through 470 Ω into an LED. inv: V_i at −, V_ref at +. Rails ±vsat (12 V) */
const kComp = o => {
  const inv = !!o.inv, top = inv ? 'P' : 'N', bot = inv ? 'N' : 'P';   // the top input always carries V_ref, the bottom one V_i
  const nodes = { gl: [-0.6, -1.0], vcc: [1.2, -1.0], rm: [1.2, 0.4], rg: [1.2, 1.8], vi: [0.4, 2.6], vig: [0.4, 4.2], [top]: [4, 1.4], [bot]: [4, 2.6], O: [6.2, 2], o: [7.4, 2], d1: [7.4, 3.2], lg: [7.4, 4.4], _padR: [8.7, 2] };
  const parts = [], grounds = ['vig', 'lg'], sp = { ground: 'vig', nodes, parts, grounds, mode: o.mode || 'dc' };
  if (o.vref0) { delete nodes.gl; delete nodes.vcc; delete nodes.rm; nodes.rg = [2.6, 2.2]; parts.push(W_(top, 'rg'), hid('rg', 'vig')); grounds.push('rg'); }   // Fig. 13.2: the reference input grounded
  else { parts.push(src('VCC', 'vcc', 'gl', o.V ?? 12, 'V+'), hid('gl', 'vig'), res('R1', 'vcc', 'rm', o.R1 ?? 10e3, 'R_1'), res('R2', 'rm', 'rg', o.R2 ?? 10e3, 'R_2'), hid('rg', 'vig'), W_('rm', top, { pts: [[3.2, 0.4], [3.2, 1.4]] })); grounds.push('gl', 'rg'); }
  parts.push(o.sig ? { id: 'VI', type: 'V', a: 'vi', b: 'vig', value: 0, wave: o.sig.wave || 'sine', fn: o.sig.fn, name: 'v_i', valText: o.sig.valText ?? '' } : src('VI', 'vi', 'vig', o.vi ?? 0, 'V_i'), W_('vi', bot), oa('A', 'P', 'N', 'O', { vsat: o.vsat ?? 12, aName: '741' }), W_('O', 'o'), res('RL', 'o', 'd1', 470, '', { labelOff: 0.5 }), led('LED', 'd1', 'lg'), hid('lg', 'vig'));
  return sp; };
/* the window detector of Fig. 13.11: two 339 comparators on a single +9 V supply, open-collector outputs (ideal diodes) wire-ANDed through a 5.1 kΩ pull-up.
   Comparator 1: V_ref1 ≅ 5 V at +, the input at −; comparator 2: V_ref2 ≅ 1 V at −, the input at + */
const kWindow = o => {
  const V = o.V ?? 9, nodes = { vs: [-1.4, -0.4], vsg: [-1.4, 1.2], t1: [2.0, -1.6], m1: [2.0, -0.4], g1: [2.0, 0.6], f1: [1.4, -1.6], t2: [2.0, 4.6], m2: [2.0, 5.8], g2: [2.0, 6.8],
    vin: [0, 2.0], ving: [0, 3.6], P1: [4, 0], N1: [4, 1.2], O1: [6.2, 0.6], a1: [7.4, 0.6], P2: [4, 4.4], N2: [4, 5.6], O2: [6.2, 5.0], a2: [7.4, 5.0], pu: [8.4, -1.6], wo: [8.4, 2.8], out: [9.6, 2.8], _padR: [10.9, 2.8], _padL: [-2.7, 0.4] };   // room for the V+ label on phones
  const parts = [src('VS', 'vs', 'vsg', V, 'V+', { side: -1 }), W_('vs', 'f1', { pts: [[-1.4, -1.6]] }), W_('f1', 't1'), W_('t1', 'pu'), hid('vsg', 'ving'),   // the +9 V rail along the top with taps for both dividers and the pull-up
    res('Ra', 't1', 'm1', o.Ra ?? 7.5e3, '', { labelOff: 0.5 }), res('Rb', 'm1', 'g1', o.Rb ?? 9.1e3, '', { labelOff: 0.5 }), hid('g1', 'ving'), W_('m1', 'P1', { pts: [[3.2, -0.4], [3.2, 0]] }),
    W_('f1', 't2', { pts: [[1.4, 4.6]] }), res('Rc', 't2', 'm2', o.Rc ?? 8.2e3, '', { labelOff: 0.5 }), res('Rd', 'm2', 'g2', o.Rd ?? 1e3, '', { labelOff: 0.5 }), hid('g2', 'ving'), W_('m2', 'N2', { pts: [[3.2, 5.8], [3.2, 5.6]] }),
    src('VIN', 'vin', 'ving', o.vin ?? 3, 'V_in', { side: -1 }), W_('vin', 'N1', { pts: [[3.2, 2.0], [3.2, 1.2]] }), W_('vin', 'P2', { pts: [[3.2, 2.0], [3.2, 4.4]] }),
    oa('A1', 'P1', 'N1', 'O1', { vhi: V, vlo: 0, aName: '339 (1)', labelSide: -1 }), oa('A2', 'P2', 'N2', 'O2', { vhi: V, vlo: 0, aName: '339 (2)', labelSide: -1 }),
    { id: 'D1', type: 'D', a: 'a1', b: 'O1', model: 'ideal', name: '', valText: '', side: -1 }, { id: 'D2', type: 'D', a: 'a2', b: 'O2', model: 'ideal', name: '', valText: '' }, W_('a1', 'wo', { pts: [[7.4, 2.8]] }), W_('a2', 'wo', { pts: [[7.4, 2.8]] }),
    res('RP', 'pu', 'wo', o.RP ?? 5.1e3, '', { labelOff: 0.5 }), W_('wo', 'out')];
  return { ground: 'ving', nodes, parts, grounds: ['vsg', 'g1', 'g2', 'ving'], mode: 'dc' }; };
/* the four-stage R-2R ladder of Fig. 13.12: bits D0 (left) … D3 (right) as sources of 0 or V_ref under 2R legs, the series R between the nodes, 2R to ground at the left end; V_o at the right node */
const kLadder = (o, ext = {}) => { const Rv = o.R ?? 10e3, V = o.Vref ?? 16, bits = o.bits || [0, 1, 1, 0], st = o.st, nodes = { gT: [1.2, 2.4], _padL: [-0.5, 0] }, parts = [], grounds = ['gT'];
  for (let k = 0; k < 4; k++) { const x = 1.2 + 2 * k; nodes['n' + k] = [x, 0]; nodes['b' + k] = [x, 2.4]; nodes['bg' + k] = [x, 4.0]; grounds.push('bg' + k);
    parts.push(res('L' + k, 'n' + k, 'b' + k, 2 * Rv, k === 0 ? '2R' : '', { labelOff: 0.5, ...(ext.adc && k > 0 ? { valText: '' } : {}) }), { id: 'D' + k, type: 'V', a: 'b' + k, b: 'bg' + k, value: st ? 0 : bits[k] * V, fn: st ? () => ((st.bits ? st.bits[k] : (st.count >> k) & 1) ? st.Vref : 0) : undefined, name: `D_${k}`, valText: st ? '' : (bits[k] ? vtx(V) : '0 V'), side: -1, labelOff: 0.5 }, hid('bg' + k, 'gT'));
    if (k > 0) parts.push(res('S' + k, 'n' + (k - 1), 'n' + k, Rv, k === 1 ? 'R' : '', { labelOff: 0.5, ...(ext.adc && k > 1 ? { valText: '' } : {}) })); }
  parts.push(res('L0t', 'gT', 'n0', 2 * Rv, '2R', { side: -1, labelOff: 0.5 }), W_('n3', 'o')); nodes.o = [8.4, 0]; nodes._padR = [9.7, 0];
  if (ext.adc) { Object.assign(nodes, { P: [9.6, 0], N: [9.6, 1.2], vin: [8.8, 1.6], ving: [8.8, 3.2], O: [11.8, 0.6], c: [12.8, 0.6], _padR: [14.1, 0.6] }); grounds.push('ving');
    parts.push(W_('o', 'P'), src('VIN', 'vin', 'ving', o.vin ?? 5.7, 'V_in'), hid('ving', 'gT'), W_('vin', 'N', { pts: [[8.8, 1.2]] }), oa('A', 'P', 'N', 'O', { vhi: 5, vlo: 0, aName: '' }), W_('O', 'c')); }
  return { ground: 'gT', nodes, parts, grounds, mode: ext.adc ? 'tran' : 'dc' }; };
/* the dual-slope converter of Fig. 13.14: an integrator whose input is switched between V_in (for a fixed count) and −V_ref, a comparator that stops the count when the ramp returns to 0 */
const kDual = o => { const st = o.st, nodes = { vin: [0, 0.6], g1: [0, 2.0], vref: [0, 3.0], g2: [0, 4.4], s1: [2.0, 0.6], s2: [2.0, 3.0], sw: [2.0, 1.4], N: [4, 1.4], P: [4, 2.6], g: [4, 3.4], nf: [4, 0], of: [6.2, 0], O: [6.2, 2], o: [7.4, 2],
    N2: [8.6, 2.6], P2: [8.6, 1.4], pg: [7.8, 1.4], O2: [10.8, 2], c: [11.8, 2], _padR: [13.1, 2], _padL: [-1.6, 2] };
  const parts = [src('VIN', 'vin', 'g1', o.vin ?? 3, 'V_in', { side: -1 }), hid('g1', 'g'), src('VREF', 'vref', 'g2', -(o.Vref ?? 10), '−V_ref', { side: -1 }), hid('g2', 'g'),
    { id: 'S1', type: 'S', a: 'vin', b: 's1', closed: true, name: 'S_1', valText: '' }, W_('s1', 'sw'), { id: 'S2', type: 'S', a: 'vref', b: 's2', closed: false, name: 'S_2', valText: '', side: -1 }, W_('s2', 'sw'),
    res('R', 'sw', 'N', o.R ?? 100e3, 'R'), W_('N', 'nf'), cap('C', 'nf', 'of', o.C ?? 1e-6, 'C'), W_('of', 'O'), W_('P', 'g'), oa('A', 'P', 'N', 'O', {}), W_('O', 'o'),
    W_('o', 'N2', { pts: [[7.4, 2.6]] }), W_('P2', 'pg'), hid('pg', 'g'), oa('A2', 'P2', 'N2', 'O2', { vhi: 5, vlo: 0, aName: '' }), W_('O2', 'c')];
  void st; return { ground: 'g', nodes, parts, grounds: ['g1', 'g2', 'g', 'pg'], mode: 'tran' }; };
/* inside the 555 (Fig. 13.16): the three-resistor divider sets 2V_CC/3 and V_CC/3; comparator 1 compares the threshold input with 2V_CC/3, comparator 2 the trigger input with V_CC/3 */
const kIn555 = o => { const V = o.VCC ?? 5, nodes = { vs: [-0.6, -1.4], vsg: [-0.6, 0.2], t: [1.2, -1.4], a: [1.2, 0.2], b: [1.2, 1.8], g: [1.2, 3.4], thr: [2.2, -0.6], thg: [2.2, 0.8], tr: [2.2, 3.2], trg: [2.2, 4.6],
    P1: [4.4, -0.6], N1: [4.4, 0.6], O1: [6.6, 0], P2: [4.4, 2.0], N2: [4.4, 3.2], O2: [6.6, 2.6], c1: [7.6, 0], c2: [7.6, 2.6], _padR: [8.9, 1.3], _padL: [-2.0, 0] };
  const parts = [src('VCC', 'vs', 'vsg', V, 'V_CC', { side: -1 }), hid('vsg', 'g'), W_('vs', 't'), res('Ra', 't', 'a', 5e3, 'R', { side: -1 }), res('Rb', 'a', 'b', 5e3, 'R', { side: -1 }), res('Rc', 'b', 'g', 5e3, 'R', { side: -1 }),
    W_('a', 'N1', { pts: [[3.2, 0.2], [3.2, 0.6]] }), W_('b', 'P2', { pts: [[3.2, 1.8], [3.2, 2.0]] }),
    src('VTHR', 'thr', 'thg', o.thr ?? 2, t('ขา 6', 'pin 6'), { side: -1 }), hid('thg', 'g'), W_('thr', 'P1'), src('VTRG', 'tr', 'trg', o.trg ?? 2, t('ขา 2', 'pin 2'), { side: -1 }), hid('trg', 'g'), W_('tr', 'N2'),
    oa('A1', 'P1', 'N1', 'O1', { vhi: V, vlo: 0, aName: '1' }), oa('A2', 'P2', 'N2', 'O2', { vhi: V, vlo: 0, aName: '2' }), W_('O1', 'c1'), W_('O2', 'c2')];
  return { ground: 'g', nodes, parts, grounds: ['vsg', 'g', 'thg', 'trg'], mode: 'dc' }; };
/* the 555 as an astable (Fig. 13.17) or a one-shot (Fig. 13.19) with the external R_A, R_B, C; inside the box only the discharge switch (pin 7) and the output stage (pin 3) are parts, the flip-flop is IC.ctl555 */
const k555 = o => { const st = o.st, V = o.VCC ?? 5, mono = o.mode === 'mono', nodes = { vs: [0.4, -1.0], vsg: [0.4, 0.6], rat: [1.4, -1.0], dis: [1.4, 1.2], capn: [1.4, 2.4], cg: [1.4, 3.8], j6: [3.2, 2.4],
    p8: [5.0, 0.4], p4: [6.0, 0.4], r8: [5.0, -1.0], r4: [6.0, -1.0], p7: [4.0, 1.2], p6: [4.0, 2.4], p2: [4.0, mono ? 4.0 : 3.6], sg: [5.0, 1.2], og: [5.0, 2.4], p1: [5.0, 4.4], g1: [5.0, 5.6], p3: [7.0, 2.4], out: [8.2, 2.4], p5: [6.0, 4.4], c5g: [6.0, 5.6], _padR: [9.5, 2.4], _padL: [-1.2, 2] };
  const parts = [src('VCC', 'vs', 'vsg', V, 'V_CC', { side: -1 }), hid('vsg', 'g1'), W_('vs', 'rat'), W_('rat', 'r8'), W_('r8', 'p8'), W_('r8', 'r4'), W_('r4', 'p4'),
    res('RA', 'rat', 'dis', o.RA ?? 7.5e3, 'R_A')];
  if (mono) { nodes.trg = [2.8, 4.0]; nodes.tg = [2.8, 5.6]; parts.push(W_('dis', 'p7'), W_('dis', 'capn'), W_('capn', 'p6'), { id: 'VT', type: 'V', a: 'trg', b: 'tg', value: V, wave: 'square', fn: st ? tm => st.trig(tm) : undefined, name: t('ทริกเกอร์', 'trigger'), valText: '', side: -1 }, hid('tg', 'g1'), W_('trg', 'p2')); }   // label on the left, under C's ground, clear of the chip's corner
  else { parts.push(W_('dis', 'p7'), res('RB', 'dis', 'capn', o.RB ?? 7.5e3, 'R_B', { side: -1 }), W_('capn', 'j6'), W_('j6', 'p6'), W_('j6', 'p2', { pts: [[3.2, 3.6]] })); }
  parts.push(cap('C', 'capn', 'cg', o.C ?? 0.1e-6, 'C', { side: -1 }), hid('cg', 'g1'),
    { id: 'S', type: 'S', a: 'p7', b: 'sg', closed: false, name: t('คายประจุ', 'discharge'), valText: '', side: -1, labelOff: 0.5 }, W_('sg', 'og'), W_('og', 'p1'), W_('p1', 'g1'),
    { id: 'VO', type: 'V', a: 'p3', b: 'og', value: V, fn: st ? () => (st.hi ? V : 0) : undefined, name: t('ขาออก', 'output'), valText: '', labelOff: 0.35, side: -1, noDots: true }, W_('p3', 'out'),
    cap('C5', 'p5', 'c5g', 0.01e-6, '', { labelOff: 0.5 }), hid('c5g', 'g1'));
  const grounds = ['vsg', 'cg', 'g1', 'c5g']; if (mono) grounds.push('tg');
  return { ground: 'g1', nodes, parts, grounds, mode: 'tran', box: { x0: 4.0, y0: 0.4, x1: 7.0, y1: 4.4, name: '555', nameY: 3.6, pins: [{ node: 'p8', n: 8, side: 't' }, { node: 'p4', n: 4, side: 't', label: 'RESET' }, { node: 'p7', n: 7, side: 'l' }, { node: 'p6', n: 6, side: 'l' }, { node: 'p2', n: 2, side: 'l' }, { node: 'p3', n: 3, side: 'r' }, { node: 'p1', n: 1, side: 'b' }, { node: 'p5', n: 5, side: 'b' }] } }; };
/* the 566 VCO (Figs. 13.21–13.23): R_1 from V+ to pin 6 (held at V_C inside), V_C at pin 5 from a divider (or a source), C_1 at pin 7 charged and discharged by ±(V+ − V_C)/R_1, the Schmitt trigger is IC.ctl566; square wave at pin 3, triangle at pin 4 */
const k566 = o => { const st = o.st, V = o.Vp ?? 12, nodes = { vs: [0.4, -1.4], vsg: [0.4, 0.2], r1t: [2.0, -1.4], r1b: [2.0, 0.0], p6: [4.0, 0.0], r2t: [1.2, 0.0], vc: [1.2, 1.2], r3b: [1.2, 2.6], p5: [4.0, 1.2],
    p8: [5.2, -0.4], r8: [5.2, -1.4], p7: [4.0, 2.4], c1t: [2.0, 2.4], c1g: [2.0, 4.6], p1: [5.2, 4.4], g1: [5.2, 5.6], p3: [7.0, 1.0], sq: [8.2, 1.0], p4: [7.0, 2.6], tri: [8.2, 2.6], i0: [5.2, 2.4], _padR: [9.5, 1.8] };
  const parts = [src('VP', 'vs', 'vsg', V, 'V+', { side: -1 }), hid('vsg', 'g1'), W_('vs', 'r1t'), W_('r1t', 'r8'), W_('r8', 'p8'), res('R1', 'r1t', 'r1b', o.R1 ?? 10e3, 'R_1'), W_('r1b', 'p6'),
    { id: 'V6', type: 'V', a: 'p6', b: 'i0', value: o.VC ?? 10.4, fn: st ? () => st.VC : undefined, label: false, noDots: true, hidden: true },   // pin 6 sits at V_C inside the 566: the current source's programming resistor sees V+ − V_C
    W_('p7', 'c1t'), cap('C1', 'c1t', 'c1g', o.C1 ?? 820e-12, 'C_1'), hid('c1g', 'g1'),   // label on the right, clear of the V_C divider
    { id: 'I7', type: 'I', a: 'i0', b: 'p7', value: 0, fn: st ? () => (st.up ? st.I : -st.I) : undefined, name: t('ประจุ / คายประจุ', 'charge / discharge'), valText: '', labelOff: 0.35 }, W_('i0', 'p1'), W_('p1', 'g1'),
    { id: 'V3', type: 'V', a: 'p3', b: 'i0', value: V, fn: st ? () => (st.up ? V : 0) : undefined, label: false, noDots: true, hidden: true }, W_('p3', 'sq'),
    { id: 'V4', type: 'V', a: 'p4', b: 'i0', value: 0, fn: st ? () => st.vc1 : undefined, label: false, noDots: true, hidden: true }, W_('p4', 'tri')];
  if (o.R2) { parts.push(W_('r1t', 'r2t', { pts: [[1.2, -1.4]] }), res('R2', 'r2t', 'vc', o.R2, 'R_2'), res('R3', 'vc', 'r3b', o.R3, 'R_3', { side: -1 }), hid('r3b', 'g1'), W_('vc', 'p5')); }
  else { nodes.vcg = [1.2, 2.6]; parts.push(src('VCS', 'vc', 'vcg', o.VC ?? 10.4, 'V_C', { side: -1 }), hid('vcg', 'g1'), W_('vc', 'p5')); delete nodes.r2t; delete nodes.r3b; }
  const grounds = ['vsg', 'c1g', 'g1', o.R2 ? 'r3b' : 'vcg'];
  return { ground: 'g1', nodes, parts, grounds, mode: 'tran', box: { x0: 4.0, y0: -0.4, x1: 7.0, y1: 4.4, name: '566', nameY: 3.6, pins: [{ node: 'p8', n: 8, side: 't', label: 'V+' }, { node: 'p6', n: 6, side: 'l' }, { node: 'p5', n: 5, side: 'l' }, { node: 'p7', n: 7, side: 'l' }, { node: 'p1', n: 1, side: 'b' }, { node: 'p3', n: 3, side: 'r' }, { node: 'p4', n: 4, side: 'r' }] } }; };
IC.ckt = o => { switch (o.kind) { case 'comp': return kComp(o); case 'window': return kWindow(o); case 'ladder': return kLadder(o); case 'adc': return kLadder(o, { adc: true }); case 'dual': return kDual(o); case 'in555': return kIn555(o); case 't555': return k555(o); case 'v566': return k566(o); default: throw new Error('IC.ckt: ' + o.kind); } };
/* V_C of a divider R_2 (to V+) and R_3 (to ground), and the 566's free-running frequency (Eq. 13.8) */
IC.vcOf = (Vp, R2, R3) => Vp * R3 / (R2 + R3);
IC.f566 = (Vp, VC, R1, C1) => 2 / (R1 * C1) * ((Vp - VC) / Vp);
/* the ladder's output by Eq. 13.1 */
IC.ladder = (bits, Vref) => bits.reduce((s, b, k) => s + b * Math.pow(2, k), 0) / 16 * Vref;

/* =====================================================================================================================
   3) the controllers (OP.Rec.ctl): run before every time step with the circuit c and the time t; they read the last solution and set switches and sources */
/* the 555's flip-flop: astable: output high and the discharge switch open while C charges to 2V_CC/3, then low and closed while it discharges to V_CC/3;
   one-shot: idle low with the switch closed; a trigger below V_CC/3 sets it high until C reaches 2V_CC/3. st: { hi, VCC, mono, trig(t), edges: [] } */
const xing = (st, tm, v, thr) => { const t0 = st.pt ?? tm, v0 = st.pv ?? v; return v === v0 ? tm : t0 + (thr - v0) / (v - v0) * (tm - t0); };   // the time the last sample crossed thr (linear between samples)
IC.ctl555 = st => (c, tm) => { const vc = c.V('capn').re, V = st.VCC, S = c.byId.S;
  if (st.mono) { const vt = st.trig(tm); if (!st.hi && vt < V / 3 && !st.armed) { st.hi = true; st.armed = true; st.edges.push(tm); } if (vt >= V / 3) st.armed = false; if (st.hi && vc >= 2 * V / 3) { st.hi = false; st.edges.push(xing(st, tm, vc, 2 * V / 3)); } }
  else { if (st.hi && vc >= 2 * V / 3) { st.hi = false; st.edges.push(xing(st, tm, vc, 2 * V / 3)); } else if (!st.hi && vc <= V / 3) { st.hi = true; st.edges.push(xing(st, tm, vc, V / 3)); } }
  st.pt = tm; st.pv = vc; S.closed = !st.hi; };
/* the 566's Schmitt trigger: charge up to V_hi = 0.625 V+, discharge down to V_lo = 0.375 V+ (a quarter of V+ apart, which gives Eq. 13.8); st: { up, Vp, VC, R1, I, vc1, edges } */
IC.ctl566 = st => (c, tm) => { const vc = c.V('p7').re; st.vc1 = vc; st.I = (st.Vp - st.VC) / st.R1;
  if (st.up && vc >= 0.625 * st.Vp) { st.up = false; st.edges.push(xing(st, tm, vc, 0.625 * st.Vp)); } else if (!st.up && vc <= 0.375 * st.Vp) { st.up = true; st.edges.push(xing(st, tm, vc, 0.375 * st.Vp)); }
  st.pt = tm; st.pv = vc; };
/* the ladder-network ADC's counter: one count per clock period while the comparator says the staircase is still below V_in; st: { count, Tc, next, done, Vref } */
IC.ctlAdc = st => (c, tm) => { if (tm + 1e-12 >= st.next) { st.next += st.Tc; const cmp = c.OA('A').vo > 2.5; if (!st.done) { if (cmp) st.done = true; else if (st.count < 15) st.count++; } st.steps.push([tm, st.count]); } };
/* the dual-slope converter's control logic: phase 1 (S_1) for T_1 = N_1 clocks, then phase 2 (S_2) until the comparator sees the ramp back at 0; st: { Tc, N1, phase, n, t2, done } */
IC.ctlDual = st => (c, tm) => { const vo = c.V('o').re, S1 = c.byId.S1, S2 = c.byId.S2;
  if (st.phase === 1 && tm + 1e-12 >= st.N1 * st.Tc) { st.phase = 2; st.t1 = tm; }
  if (st.phase === 2 && !st.done && vo >= 0 && tm > st.t1 + 2 * st.Tc) { st.done = true; st.t2 = tm; st.n = Math.round((tm - st.t1) / st.Tc); }
  S1.closed = st.phase === 1; S2.closed = st.phase === 2 && !st.done; if (st.done) { S1.closed = false; S2.closed = false; } };
/* the period and the high time from the edge times recorded by a controller (the last full cycle) */
IC.period = st => { const e = st.edges; if (e.length < 3) return null; const n = e.length; return { T: e[n - 1] - e[n - 3], hi: e[n - 2] - e[n - 3], lo: e[n - 1] - e[n - 2] }; };
/* a square-wave trigger for the one-shot: V_CC with a negative pulse of width w every period Tp */
IC.trigger = (V, Tp, w) => tm => ((((tm % Tp) + Tp) % Tp) < w ? 0 : V);

/* =====================================================================================================================
   4) the problems */
const DEF = {}, SP = {};
const spec = (key, o) => SP[key] || (SP[key] = IC.ckt(o));
const OUTS = { vc: c => c.V('capn').re, vo: c => c.V('out').re, vtr: c => (c.byId.VT ? c.Vab('VT').re : NaN) };

/* ---------------- page 8.1: comparators ---------------- */
const compSide = (ctx, b, bd, c, title) => { const a = c.OA('A'), vref = c.nodes.rm ? c.V('rm').re : 0, vi = c.V('vi').re, il = c.I('LED').re;
  OP.plot(ctx, b, { x: [0, 12], y: [-14, 14], xt: [2, 4, 6, 8, 10, 12], yt: [-12, -6, 0, 6, 12], xl: 'V_i (V)', yl: 'V_o (V)', title: bd.short ? '' : title,
    curves: [{ f: x => (c.byId.A.P === 'vi' || c.byId.A.N !== 'vi' ? (x > vref ? 12 : -12) : (x > vref ? -12 : 12)), color: C.curve, w: 2.6, n: 600 }], vl: [{ x: vref, color: C.tan, label: bd.short ? '' : `V_ref = ${vtx(vref)}`, top: true }],
    hl: [{ y: 12, color: C.red, label: bd.short ? '' : '+V_sat' }, { y: -12, color: C.red, label: bd.short ? '' : '−V_sat' }], pts: [{ x: vi, y: a.vo, label: bd.short ? '' : `(${vtx(vi)}, ${vtx(a.vo)}) · LED ${itx(il)}`, side: vi > 6 ? -1 : 1, dy: a.vo > 0 ? 16 : -16 }], guides: [{ x: vi, y: a.vo }] }); };
const COMP = [4, 5, 6, 7, 8].map(v => ({ kind: 'comp', vi: v }));
DEF.comp = { ...LAY, solvedAt: 1, init: s => { s.st.vi = 4; }, spec: (k, s) => IC.ckt({ kind: 'comp', vi: s.st.vi }),
  controls: (el, s) => { MC.ui.slider(el, { id: 'vi1', label: 'V_i', min: 0, max: 12, step: 0.1, value: 4, fmt: v => vtx(v), oninput: v => { s.st.vi = v; s.build(); } }); },
  glow: k => (k === 1 ? ['R1', 'R2'] : k === 2 ? ['A'] : k === 3 ? ['LED', 'RL'] : null),
  badge: (k, s) => { const a = s.ckt.OA('A'), il = s.ckt.I('LED').re; return k >= 1 ? bdg(`V_i = ${vtx(s.st.vi)} ${s.st.vi > 6 ? '>' : '<'} V_ref = 6 V → V_o = ${vtx(a.vo)} · LED ${il > 1e-3 ? t('ติด', 'on') : t('ดับ', 'off')} (${itx(il)})`, null, il > 1e-3) : bdg('R_1 = R_2 = 10 kΩ, V+ = 12 V, 470 Ω, LED', null, false); },
  side: (ctx, b, bd, k, s) => compSide(ctx, b, bd, s.ckt, t('ลักษณะถ่ายโอน: สวิตช์ที่ V_ref', 'transfer characteristic: a switch at V_ref')),
  after: (v, k, s) => { if (k >= 1) { OP.tag(v, 'rm', `V_ref = ${vtx(s.ckt.V('rm').re)}`, C.tan, -0.1, -0.5, 'right'); OP.tag(v, 'o', `V_o = ${vtx(s.ckt.OA('A').vo)}`, s.ckt.OA('A').vo > 0 ? C.q : C.red, 0.1, -0.42); } },
  steps: () => [
    step(t('<b>แรงดันอ้างอิง</b> (สไลด์หน้า 4, รูป 13.3a): ตัวแบ่งแรงดัน 10 kΩ/10 kΩ จาก +12 V ป้อนขั้ว − ขั้วเข้าของออปแอมป์ไม่ดึงกระแส ตัวแบ่งจึงไม่ถูกโหลด', '<b>The reference voltage</b> (slide p. 4, Fig. 13.3a): a 10 kΩ/10 kΩ divider on +12 V feeds the − input; the op-amp input draws no current, so the divider is unloaded'),
      block([R`V_{ref} &= \frac{10\ \text{k}\Omega}{10\ \text{k}\Omega + 10\ \text{k}\Omega}(+12\ \text{V}) = \boxed{+6\ \text{V}}`])),
    step(t('<b>ไม่มีป้อนกลับ: อัตราขยายเต็ม</b> \\(A\\) ≈ 2 × 10⁵ ขาออกจึงเป็นได้แค่สองค่า: \\(V_i\\) สูงกว่า \\(V_{ref}\\) เพียงไม่กี่สิบไมโครโวลต์ก็ชนราง +12 V ต่ำกว่าก็ชนราง −12 V (ขั้ว + รับ \\(V_i\\): ไม่กลับเฟส)', '<b>No feedback: the full gain</b> \\(A\\) ≈ 2 × 10⁵, so the output can only take two values: \\(V_i\\) a few tens of microvolts above \\(V_{ref}\\) hits the +12 V rail, below it the −12 V rail (\\(V_i\\) at the + input: noninverting)'),
      block([R`V_i > V_{ref}:\ V_o &= +V_{sat} = +12\ \text{V}`, R`V_i < V_{ref}:\ V_o &= -V_{sat} = -12\ \text{V}`]), t('กราฟข้าง: ลักษณะถ่ายโอนเป็นขั้นบันไดที่ 6 V (ความกว้างของขอบ 24 V/2 × 10⁵ = 0.12 mV)', 'The graph beside: the transfer characteristic is a step at 6 V (the edge is 24 V/2 × 10⁵ = 0.12 mV wide).')),
    step(t('<b>ไดโอดเปล่งแสง</b>: ขาออก +12 V ดัน 470 Ω กับ LED ให้นำ (ตกคร่อม LED ราว 1.8 V) ขาออก −12 V ไบแอสกลับ LED จึงดับ', '<b>The LED</b>: a +12 V output drives the 470 Ω and the LED on (about 1.8 V across the LED); a −12 V output reverse-biases it, so it is off'),
      block([R`I_{LED} &= \frac{12\ \text{V} - 1.8\ \text{V}}{470\ \Omega} = \boxed{21.7\ \text{mA}}\quad (V_i > 6\ \text{V})`]), t('เลื่อน \\(V_i\\) ผ่าน 6 V ด้วยแถบใต้ภาพ: LED ติดเมื่อ \\(V_i\\) เกิน \\(V_{ref}\\) ตามที่รูป 13.3a เขียน (โปรแกรม PSpice ของตำรา: 20.8 mA ที่ \\(V_i\\) ≥ 6 V, ~0 ต่ำกว่านั้น)', 'Move \\(V_i\\) through 6 V with the slider under the picture: the LED lights when \\(V_i\\) exceeds \\(V_{ref}\\), as Fig. 13.3a says (the book\'s PSpice run: 20.8 mA for \\(V_i\\) ≥ 6 V, ~0 below).'))],
  ask: () => ({ fields: [num('V<sub>ref</sub> (V) =', 6, { tol: 0.02 }), num(t('V<sub>i</sub> = 8 V: V<sub>o</sub> (V) =', 'V<sub>i</sub> = 8 V: V<sub>o</sub> (V) ='), 12, { tol: 0.1 }), num(t('V<sub>i</sub> = 4 V: V<sub>o</sub> (V) =', 'V<sub>i</sub> = 4 V: V<sub>o</sub> (V) ='), -12, { tol: 0.1 })] }),
  answer: () => t('\\(V_{ref}\\) = +6 V · \\(V_o\\) = +12 V (LED ติด) เมื่อ \\(V_i\\) > 6 V, −12 V (ดับ) เมื่อ \\(V_i\\) < 6 V (Boylestad รูป 13.3a)', '\\(V_{ref}\\) = +6 V · \\(V_o\\) = +12 V (LED on) for \\(V_i\\) > 6 V, −12 V (off) for \\(V_i\\) < 6 V (Boylestad Fig. 13.3a).') };
void COMP;
DEF.compInv = { ...LAY, solvedAt: 1, init: s => { s.st.vi = 8; }, spec: (k, s) => IC.ckt({ kind: 'comp', inv: true, vi: s.st.vi }),
  controls: (el, s) => { MC.ui.slider(el, { id: 'vi2', label: 'V_i', min: 0, max: 12, step: 0.1, value: 8, fmt: v => vtx(v), oninput: v => { s.st.vi = v; s.build(); } }); },
  glow: k => (k === 1 ? ['A'] : k === 2 ? ['LED'] : null),
  badge: (k, s) => { const a = s.ckt.OA('A'), il = s.ckt.I('LED').re; return k >= 1 ? bdg(`V_i = ${vtx(s.st.vi)} ${s.st.vi > 6 ? '>' : '<'} V_ref → V_o = ${vtx(a.vo)} · LED ${il > 1e-3 ? t('ติด', 'on') : t('ดับ', 'off')}`, null, il > 1e-3) : bdg(t('V_ref = 6 V ที่ขั้ว + · V_i ที่ขั้ว −', 'V_ref = 6 V at + · V_i at −'), null, false); },
  side: (ctx, b, bd, k, s) => compSide(ctx, b, bd, s.ckt, t('กลับเฟส: ขั้นบันไดกลับทิศ', 'inverting: the step turned round')),
  after: (v, k, s) => { if (k >= 1) { OP.tag(v, 'rm', `V_ref = ${vtx(s.ckt.V('rm').re)}`, C.tan, -0.1, -0.5, 'right'); OP.tag(v, 'o', `V_o = ${vtx(s.ckt.OA('A').vo)}`, s.ckt.OA('A').vo > 0 ? C.q : C.red, 0.1, -0.42); } },
  steps: () => [
    step(t('<b>สลับขั้ว</b> (สไลด์หน้า 5, รูป 13.3b): \\(V_{ref}\\) = 6 V เข้าขั้ว + และ \\(V_i\\) เข้าขั้ว − ผลต่าง \\(V_+ - V_- = V_{ref} - V_i\\)', '<b>Swap the inputs</b> (slide p. 5, Fig. 13.3b): \\(V_{ref}\\) = 6 V at +, \\(V_i\\) at −; the difference is \\(V_+ - V_- = V_{ref} - V_i\\)'),
      block([R`V_i > V_{ref}:\ V_o &= -V_{sat} = -12\ \text{V}\ (\text{LED off})`, R`V_i < V_{ref}:\ V_o &= +V_{sat} = +12\ \text{V}\ (\text{LED on})`])),
    step(t('<b>ใช้ทำอะไร</b>: LED ติดเมื่อ \\(V_i\\) ต่ำกว่าระดับอ้างอิง เช่น เตือนแบตเตอรีอ่อน ตำราสรุปว่าเลือกได้ว่าจะให้ติดเมื่อเกินหรือต่ำกว่า \\(V_{ref}\\) ด้วยการเลือกขั้วที่รับสัญญาณ', '<b>What it is for</b>: the LED lights when \\(V_i\\) drops below the reference, a low-battery warning, say. The book\'s point: choose which input takes the signal and the LED lights above or below \\(V_{ref}\\) as you wish'),
      block([R`I_{LED} &= \frac{12 - 1.8}{470}\ \text{A} \cong 21.7\ \text{mA}\quad (V_i < 6\ \text{V})`]))],
  ask: () => ({ fields: [num(t('V<sub>i</sub> = 8 V: V<sub>o</sub> (V) =', 'V<sub>i</sub> = 8 V: V<sub>o</sub> (V) ='), -12, { tol: 0.1 }), num(t('V<sub>i</sub> = 4 V: V<sub>o</sub> (V) =', 'V<sub>i</sub> = 4 V: V<sub>o</sub> (V) ='), 12, { tol: 0.1 })] }),
  answer: () => t('\\(V_o\\) = −12 V (LED ดับ) เมื่อ \\(V_i\\) > 6 V, +12 V (ติด) เมื่อ \\(V_i\\) < 6 V (Boylestad รูป 13.3b)', '\\(V_o\\) = −12 V (LED off) for \\(V_i\\) > 6 V, +12 V (on) for \\(V_i\\) < 6 V (Boylestad Fig. 13.3b).') };
/* Fig. 13.2: a 741 with the − input at 0 V and a 5 V, 100 Hz sine at + */
const SINE = { kind: 'comp', vref0: true, mode: 'tran', sig: { wave: 'sine', fn: tm => 5 * Math.sin(TAU * 100 * tm), valText: '5 V, 100 Hz' } };
DEF.sine = { ...LAYT, solvedAt: 1, init: s => { s.st.rec = new OP.Rec(0.02, 1000, { vi: c => c.V('vi').re, vo: c => c.V('o').re, il: c => c.I('LED').re }, 5); }, tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => spec('sine', SINE), glow: k => (k === 1 ? ['VI'] : k === 2 ? ['A'] : null),
  badge: (k, s) => { const rec = s.st.rec, vi = rec.last('vi'), vo = rec.last('vo'); return k >= 1 ? bdg(`t = ${fd(rec.t * 1e3, 1)} ms: v_i = ${vtx(vi)} → v_o = ${vtx(vo)}`, null, vo > 0) : bdg(t('V_ref = 0: ตัวตรวจจับการข้ามศูนย์', 'V_ref = 0: a zero-crossing detector'), null, false); },
  waves: [{ draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vi', color: C.elec, label: 'v_i' }, { key: 'vo', color: C.q, label: 'v_o', w: 2.8 }], y: [-15, 15], yt: [-12, -6, 0, 6, 12], ms: true, xt: [5, 10, 15, 20], title: bd.short ? '' : t('ขาเข้าเชิงเส้น ขาออกดิจิทัล (รูป 13.2b)', 'a linear input, a digital output (Fig. 13.2b)'), hl: [{ y: 0, color: C.tan, dash: [2, 3] }], short: bd.short }) }],
  steps: () => [
    step(t('<b>ขาเข้าเชิงเส้น</b> (สไลด์หน้า 3, รูป 13.2): ไซน์ 5 V ยอด เข้าขั้ว + ขั้ว − ต่อกราวด์ (\\(V_{ref}\\) = 0)', '<b>A linear input</b> (slide p. 3, Fig. 13.2): a 5 V peak sine at the + input, the − input grounded (\\(V_{ref}\\) = 0)'),
      block([R`v_o &= +V_{sat}\ \text{while}\ v_i > 0,\qquad v_o = -V_{sat}\ \text{while}\ v_i < 0`])),
    step(t('<b>ขาออกดิจิทัล</b>: คลื่นสี่เหลี่ยม ±12 V ความถี่เดียวกับขาเข้า เปลี่ยนสถานะทุกครั้งที่ขาเข้าข้ามศูนย์ "แม้แค่เศษเสี้ยวของมิลลิโวลต์" ก็พอ เพราะอัตราขยายเกิน 100 000', '<b>A digital output</b>: a ±12 V square wave at the input\'s frequency, switching each time the input crosses zero; "even a fraction of a millivolt" is enough, since the gain exceeds 100 000'),
      block([R`\Delta v_i &= \frac{24\ \text{V}}{2 \times 10^5} = 0.12\ \text{mV}`]), t('ออปแอมป์ 741 สลับช้า (สลูว์เรต 0.5 V/µs: 24 V ใช้ 48 µs) ไอซีเปรียบเทียบเฉพาะทาง (311, 339) เร็วกว่าและมีภูมิคุ้มกันสัญญาณรบกวน (สไลด์หน้า 7)', 'A 741 switches slowly (slew rate 0.5 V/µs: 24 V takes 48 µs); dedicated comparator ICs (311, 339) are faster and have built-in noise immunity (slide p. 7).'))],
  ask: () => ({ fields: [num(t('v<sub>o</sub> ขณะ v<sub>i</sub> = +0.1 V (V) =', 'v<sub>o</sub> while v<sub>i</sub> = +0.1 V (V) ='), 12, { tol: 0.1 }), num(t('ความถี่ของ v<sub>o</sub> (Hz) =', 'frequency of v<sub>o</sub> (Hz) ='), 100, { tol: 0.5 })] }),
  answer: () => t('คลื่นสี่เหลี่ยม ±12 V ที่ 100 Hz สลับที่ทุกจุดข้ามศูนย์ของขาเข้า (Boylestad รูป 13.2)', 'A ±12 V square wave at 100 Hz, switching at every zero crossing of the input (Boylestad Fig. 13.2).') };
const VREF1 = IC.vcOf(9, 7.5e3, 9.1e3), VREF2 = IC.vcOf(9, 8.2e3, 1e3);
DEF.window = { ...LAY, cktAspM: 0.7, solvedAt: 1, init: s => { s.st.vin = 3; }, spec: (k, s) => IC.ckt({ kind: 'window', vin: s.st.vin }),
  controls: (el, s) => { MC.ui.slider(el, { id: 'vin4', label: t('ขาเข้า', 'input'), min: 0, max: 9, step: 0.05, value: 3, fmt: v => vtx(v), oninput: v => { s.st.vin = v; s.build(); } }); },
  glow: k => (k === 1 ? ['Ra', 'Rb', 'Rc', 'Rd'] : k === 2 ? ['A1', 'D1'] : k === 3 ? ['A2', 'D2'] : k === 4 ? ['RP'] : null),
  badge: (k, s) => { const vo = s.ckt.V('out').re, vin = s.st.vin; return k >= 1 ? bdg(`${t('ขาเข้า', 'input')} ${vtx(vin)}: ${vin < VREF2 ? t('ต่ำกว่า 1 V', 'below 1 V') : vin > VREF1 ? t('สูงกว่า 5 V', 'above 5 V') : t('อยู่ในหน้าต่าง 1–5 V', 'inside the 1–5 V window')} → ${t('ขาออก', 'output')} ${vo > 4.5 ? t('สูง', 'high') : t('ต่ำ', 'low')} (${vtx(vo)})`, null, vo > 4.5) : bdg('V+ = 9 V · 7.5/9.1 kΩ → 5 V · 8.2/1 kΩ → 1 V', null, false); },
  side: (ctx, b, bd, k, s) => { const vin = s.st.vin, vo = s.ckt.V('out').re; OP.plot(ctx, b, { x: [0, 9], y: [-1, 10], xt: [1, 2, 3, 4, 5, 6, 7, 8, 9], yt: [0, 3, 6, 9], xl: t('ขาเข้า (V)', 'input (V)'), yl: t('ขาออก (V)', 'output (V)'), title: bd.short ? '' : t('ตัวตรวจจับหน้าต่าง: สูงเฉพาะ 1 V < ขาเข้า < 5 V', 'window detector: high only for 1 V < input < 5 V'),
    curves: [{ f: x => (x > VREF2 && x < VREF1 ? 9 : 0), color: C.curve, w: 2.6, n: 900 }], vl: [{ x: VREF2, color: C.tan, label: bd.short ? '' : `V_ref2 = ${vtx(VREF2)}`, top: true }, { x: VREF1, color: C.tan, label: bd.short ? '' : `V_ref1 = ${vtx(VREF1)}`, top: true }],
    pts: [{ x: vin, y: vo, label: bd.short ? '' : `(${vtx(vin)}, ${vtx(vo)})`, side: vin > 5 ? -1 : 1, dy: vo > 4 ? 16 : -16 }], guides: [{ x: vin, y: vo }] }); },
  after: (v, k, s) => { if (k >= 1) { OP.tag(v, 'm1', `${vtx(VREF1)}`, C.tan, -0.4, 0, 'right'); OP.tag(v, 'm2', `${vtx(VREF2)}`, C.tan, -0.4, 0, 'right'); OP.tag(v, 'out', `${vtx(s.ckt.V('out').re)}`, s.ckt.V('out').re > 4.5 ? C.q : C.red, 0.1, -0.42); } },
  steps: () => [
    step(t('<b>สองระดับอ้างอิง</b> (สไลด์หน้า 6, รูป 13.11): ตัวแบ่งแรงดันสองชุดบน +9 V', '<b>Two reference levels</b> (slide p. 6, Fig. 13.11): two dividers on +9 V'),
      block([R`V_{ref1} &= \frac{9.1\ \text{k}\Omega}{7.5\ \text{k}\Omega + 9.1\ \text{k}\Omega}(9\ \text{V}) = ${fd(VREF1, 2)}\ \text{V} \cong +5\ \text{V}`, R`V_{ref2} &= \frac{1\ \text{k}\Omega}{8.2\ \text{k}\Omega + 1\ \text{k}\Omega}(9\ \text{V}) = ${fd(VREF2, 2)}\ \text{V} \cong +1\ \text{V}`])),
    step(t('<b>ตัวเปรียบเทียบ 1</b>: \\(V_{ref1}\\) ที่ขั้ว + ขาเข้าที่ขั้ว − ขาเข้าเกิน 5 V ทำให้ผลต่างเป็นลบ ทรานซิสเตอร์ขาออก (คอลเล็กเตอร์เปิด) นำ ดึงจุดขาออกร่วมลง 0 V ในภาพจำลองทรานซิสเตอร์นั้นคือไดโอดอุดมคติที่หันแคโทดเข้าขาออกของตัวเปรียบเทียบ', '<b>Comparator 1</b>: \\(V_{ref1}\\) at +, the input at −. An input above 5 V makes the difference negative, its open-collector output transistor conducts and pulls the common output node to 0 V. In the simulation that transistor is an ideal diode with its cathode at the comparator output'),
      block([R`\text{input} > 5\ \text{V} &\Rightarrow \text{output low}`])),
    step(t('<b>ตัวเปรียบเทียบ 2</b>: \\(V_{ref2}\\) ที่ขั้ว − ขาเข้าที่ขั้ว + ขาเข้าต่ำกว่า 1 V ทำให้ผลต่างเป็นลบ ขาออกร่วมถูกดึงลงเช่นกัน', '<b>Comparator 2</b>: \\(V_{ref2}\\) at −, the input at +. An input below 1 V makes its difference negative and the common output is pulled low as well'),
      block([R`\text{input} < 1\ \text{V} &\Rightarrow \text{output low}`])),
    step(t('<b>ขาออกต่อร่วม (wired-AND)</b>: ตัวต้านทานดึงขึ้น 5.1 kΩ ให้ +9 V เฉพาะเมื่อทรานซิสเตอร์ทั้งสองไม่นำ คือขาเข้าอยู่ระหว่าง 1 V กับ 5 V: หน้าต่างแรงดัน', '<b>The wired-AND output</b>: the 5.1 kΩ pull-up gives +9 V only when neither transistor conducts, that is when the input lies between 1 V and 5 V: a voltage window'),
      block([R`1\ \text{V} < \text{input} < 5\ \text{V} &\Rightarrow \text{output high (+9 V)}`]), t('เลื่อนขาเข้าด้วยแถบใต้ภาพ: ดูจุดวิ่งในตัวต้านทานดึงขึ้นหายไปเมื่ออยู่ในหน้าต่าง (ไม่มีทางให้กระแสลง)', 'Move the input with the slider: the dots in the pull-up vanish inside the window (the current has nowhere to go).'))],
  ask: () => ({ fields: [num('V<sub>ref1</sub> (V) =', VREF1, { tol: 0.05 }), num('V<sub>ref2</sub> (V) =', VREF2, { tol: 0.03 }), num(t('ขาเข้า 3 V: ขาออก (V) =', 'input 3 V: output (V) ='), 9, { tol: 0.1 })] }),
  answer: () => t(`ขาออกสูง (+9 V) เฉพาะ ${fd(VREF2, 2)} V < ขาเข้า < ${fd(VREF1, 2)} V ต่ำกว่าหรือสูงกว่านั้นขาออกต่ำ (Boylestad รูป 13.11)`, `The output is high (+9 V) only for ${fd(VREF2, 2)} V < input < ${fd(VREF1, 2)} V, low below or above (Boylestad Fig. 13.11).`) };

/* ---------------- page 8.2: DAC and ADC ---------------- */
const stair = (ctx, b, bd, Vref, code, title) => OP.plot(ctx, b, { x: [-0.5, 15.5], y: [0, Vref * 1.05], xt: [0, 2, 4, 6, 8, 10, 12, 14], yt: [0, Vref / 4, Vref / 2, 3 * Vref / 4, Vref], yf: y => IE.num(y, 1), xl: t('รหัส (ฐานสิบ)', 'code (decimal)'), yl: 'V_o (V)', title: bd.short ? '' : title,
  curves: [{ pts: [...Array(16).keys()].flatMap(k => [[k - 0.5, k * Vref / 16], [k + 0.5, k * Vref / 16]]), color: C.curve, w: 2.4 }], pts: [{ x: code, y: code * Vref / 16, label: bd.short ? '' : `${code.toString(2).padStart(4, '0')} → ${vtx(code * Vref / 16)}`, side: code > 8 ? -1 : 1 }], guides: [{ x: code, y: code * Vref / 16 }] });
DEF.ladder = { ...LAY, solvedAt: 1, spec: k => spec('ladder_' + (k >= 3 ? 'f' : k >= 2 ? '1' : '6'), { kind: 'ladder', bits: k >= 3 ? [1, 1, 1, 1] : k >= 2 ? [1, 0, 0, 0] : [0, 1, 1, 0], Vref: 16 }),
  glow: k => (k === 1 ? ['D1', 'D2'] : k === 2 ? ['D0', 'L0'] : k === 3 ? ['D0', 'D1', 'D2', 'D3'] : null),
  badge: (k, s) => { const vo = s.ckt.V('o').re, bits = [0, 1, 2, 3].map(j => s.ckt.byId['D' + j].value > 0 ? 1 : 0), code = bits.reduce((a, b, j) => a + b * Math.pow(2, j), 0); return k >= 1 ? bdg(`D_3D_2D_1D_0 = ${bits.slice().reverse().join('')} (${code}) → V_o = ${vtx(vo)}`) : bdg('R = 10 kΩ, 2R = 20 kΩ, V_ref = 16 V', null, false); },
  side: (ctx, b, bd, k, s) => { const bits = [0, 1, 2, 3].map(j => s.ckt.byId['D' + j].value > 0 ? 1 : 0); stair(ctx, b, bd, 16, bits.reduce((a, bb, j) => a + bb * Math.pow(2, j), 0), t('16 ระดับ ขั้นละ V_ref/16 = 1 V', '16 levels, V_ref/16 = 1 V apart')); },
  after: (v, k, s) => { if (k >= 1) OP.tag(v, 'o', `V_o = ${vtx(s.ckt.V('o').re)}`, C.q, 0.1, -0.42); },
  steps: () => [
    step(t('<b>รหัส 0110</b> (สไลด์หน้า 10, รูป 13.12b): \\(D_1 = D_2\\) = 1 ต่อกับ \\(V_{ref}\\) = 16 V ที่เหลือต่อ 0 V ใช้สมการ 13.1', '<b>The code 0110</b> (slide p. 10, Fig. 13.12b): \\(D_1 = D_2\\) = 1 connect to \\(V_{ref}\\) = 16 V, the rest to 0 V; Eq. 13.1'),
      block([R`V_o &= \frac{D_0 \times 2^0 + D_1 \times 2^1 + D_2 \times 2^2 + D_3 \times 2^3}{2^4}V_{ref}`, R`&= \frac{0 \times 1 + 1 \times 2 + 1 \times 4 + 0 \times 8}{16}(16\ \text{V}) = \boxed{6\ \text{V}}`]),
      t('ภาพจำลองแก้บันไดจริง: ไม่ว่ารหัสใด ตัวต้านทานที่มองจากโหนดใดก็เป็น R, R, 2R และแต่ละขั้นไปทางซ้ายลดน้ำหนักลงครึ่งหนึ่ง นี่คือเหตุที่ใช้แค่ค่า R กับ 2R', 'The simulation solves the real ladder: whatever the code, the resistance seen from any node is R, R, 2R, and each stage to the left halves the weight; that is why only R and 2R are needed.')),
    step(t('<b>บิตต่ำสุด 0001</b>: ขั้นเล็กที่สุดคือความละเอียด \\(V_{ref}/2^n\\) (สมการ 13.2)', '<b>The lowest bit, 0001</b>: the smallest step is the resolution \\(V_{ref}/2^n\\) (Eq. 13.2)'),
      block([R`\text{resolution} &= \frac{V_{ref}}{2^4} = \frac{16\ \text{V}}{16} = \boxed{1\ \text{V}}`])),
    step(t('<b>รหัสเต็ม 1111</b>: ขาออกสูงสุดคือ 15/16 ของ \\(V_{ref}\\) ไม่ใช่ \\(V_{ref}\\) เอง', '<b>The full code 1111</b>: the largest output is 15/16 of \\(V_{ref}\\), not \\(V_{ref}\\) itself'),
      block([R`V_o &= \frac{15}{16}(16\ \text{V}) = \boxed{15\ \text{V}}`]), t('บันได 10 ขั้นกับ 10 V ให้ขั้นละ 10/1024 ≈ 10 mV ยิ่งหลายขั้นยิ่งละเอียด (ตำราหน้า 730)', 'A 10-stage ladder with 10 V steps by 10/1024 ≈ 10 mV; more stages, finer steps (book p. 730).'))],
  ask: () => ({ fields: [num(t('0110: V<sub>o</sub> (V) =', '0110: V<sub>o</sub> (V) ='), 6, { tol: 0.02 }), num(t('1111: V<sub>o</sub> (V) =', '1111: V<sub>o</sub> (V) ='), 15, { tol: 0.02 })] }),
  answer: () => t('0110 → 6 V, 0001 → 1 V (ความละเอียด), 1111 → 15 V (Boylestad รูป 13.12, สมการ 13.1–13.2)', '0110 → 6 V, 0001 → 1 V (the resolution), 1111 → 15 V (Boylestad Fig. 13.12, Eqs. 13.1–13.2).') };
/* the ladder-network ADC with a 1 kHz clock converting V_in = 5.7 V: the staircase climbs 1 V per clock until it passes V_in (count 6, 6 ms) */
const ADC_ST = { count: 0, Tc: 1e-3, next: 0, done: false, Vref: 16, steps: [] }, ADC_RESET = st => { st.count = 0; st.next = 0; st.done = false; st.steps = []; };
const ADC_OUTS = { vdac: c => c.V('o').re, vin: c => c.V('vin').re, cmp: c => c.V('c').re };
DEF.adc = { ...LAYT, cktAspM: 0.5, solvedAt: 1, init: s => { s.st.x = ADC_ST; s.st.rec = new OP.Rec(0.016, 800, ADC_OUTS, 8); s.st.rec.ctl = IC.ctlAdc(s.st.x); s.st.rec.onRestart = () => ADC_RESET(s.st.x); },
  tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => spec('adc', { kind: 'adc', st: ADC_ST, vin: 5.7 }), glow: k => (k === 1 ? ['D0', 'D1', 'D2', 'D3'] : k === 2 ? ['A'] : null),
  badge: (k, s) => { const x = s.st.x; return k >= 1 ? bdg(`${t('นับ', 'count')} ${x.count} (${x.count.toString(2).padStart(4, '0')}) · ${t('บันได', 'staircase')} ${vtx(x.count)} ${x.done ? '≥ 5.7 V → ' + t('หยุดนับ', 'stop') : '< 5.7 V'}`, null, x.done) : bdg('V_in = 5.7 V, V_ref = 16 V, clock 1 kHz', null, false); },
  waves: [{ draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vdac', color: C.q, label: t('บันได', 'staircase'), w: 2.8 }, { key: 'vin', color: C.elec, label: 'V_in', dash: [6, 4] }, { key: 'cmp', color: C.tan, label: t('หยุด', 'stop') }], y: [0, 16], yt: [0, 4, 8, 12, 16], ms: true, xt: [4, 8, 12, 16], title: bd.short ? '' : t('ตัวนับเดินขึ้นจนบันไดเกิน V_in (รูป 13.15b)', 'the counter climbs until the staircase passes V_in (Fig. 13.15b)'), short: bd.short }) }],
  after: (v, k, s) => { if (k >= 1) { OP.tag(v, 'o', `${vtx(s.ckt.V('o').re)}`, C.q, 0.1, -0.42); OP.tag(v, 'c', s.st.x.done ? t('หยุดนับ', 'stop') : t('นับต่อ', 'count'), s.st.x.done ? C.q : C.tan, 0.1, -0.42); } },
  steps: () => [
    step(t('<b>วงจร</b> (สไลด์หน้า 15, รูป 13.15): ตัวนับ 4 บิตขับบันได R-2R ให้แรงดันบันไดขึ้นทีละ \\(V_{ref}/16\\) = 1 V ต่อสัญญาณนาฬิกา ตัวเปรียบเทียบเทียบบันไดกับ \\(V_{in}\\)', '<b>The circuit</b> (slide p. 15, Fig. 13.15): a 4-bit counter drives the R-2R ladder, so the staircase climbs by \\(V_{ref}/16\\) = 1 V per clock; a comparator compares the staircase with \\(V_{in}\\)'),
      block([R`\text{step} &= \frac{V_{ref}}{2^n} = \frac{16\ \text{V}}{16} = 1\ \text{V},\qquad T_c = \frac{1}{1\ \text{kHz}} = 1\ \text{ms}`])),
    step(t('<b>หยุดนับ</b>: เมื่อบันไดสูงกว่า \\(V_{in}\\) = 5.7 V เป็นครั้งแรก (ที่นับ 6: 6 V) ตรรกะควบคุมหยุดตัวนับ ค่านับคือผลการแปลง', '<b>Stop</b>: the first time the staircase exceeds \\(V_{in}\\) = 5.7 V (at count 6: 6 V) the control logic stops the counter; the count is the conversion'),
      block([R`\text{count} &= \boxed{6 = 0110_2},\qquad t_{conv} = 6T_c = 6\ \text{ms}`]), t('ผลลัพธ์ 6 แทน 5.7 V: ความคลาดเคลื่อนไม่เกินหนึ่งขั้น (1 V) ลดได้ด้วยบิตที่มากขึ้น', 'The result 6 stands for 5.7 V: the error is within one step (1 V), reduced by more bits.')),
    step(t('<b>ความละเอียดและเวลาแปลง</b> (สไลด์หน้า 16–17): บันได 12 บิตกับ \\(V_{ref}\\) = 10 V และนาฬิกา 1 MHz', '<b>Resolution and conversion time</b> (slides pp. 16–17): a 12-bit ladder with \\(V_{ref}\\) = 10 V and a 1 MHz clock'),
      block([R`\frac{V_{ref}}{2^{12}} &= \frac{10\ \text{V}}{4096} = \boxed{2.44\ \text{mV}}`, R`T_{conv} &= \frac{2^n}{f} = \frac{4096}{10^6\ \text{Hz}} = \boxed{4.096\ \text{ms}}`]),
      t('อย่างมาก 4.1 ms ต่อครั้ง (244 ครั้ง/วินาที) โดยเฉลี่ยครึ่งหนึ่ง (488 ครั้ง/วินาที) เพราะค่าเล็กนับถึงเร็ว (ตำราหน้า 731–732)', 'At most 4.1 ms per conversion (244 per second), half that on average (488 per second), since small values are reached quickly (book pp. 731–732).'))],
  ask: () => ({ fields: [num(t('นับได้ =', 'count ='), 6, { tol: 0.01 }), num(t('12 บิต, 10 V: ความละเอียด (mV) =', '12-bit, 10 V: resolution (mV) ='), 2.44, { tol: 0.01 }), num(t('1 MHz: T<sub>conv</sub> (ms) =', '1 MHz: T<sub>conv</sub> (ms) ='), 4.096, { tol: 0.01 })] }),
  answer: () => t('นับได้ 6 (0110) ใน 6 ms · 12 บิต/10 V: 2.44 mV · 1 MHz: 4.096 ms (Boylestad รูป 13.15, หน้า 731)', 'Count 6 (0110) in 6 ms · 12 bits/10 V: 2.44 mV · 1 MHz: 4.096 ms (Boylestad Fig. 13.15, p. 731).') };
/* the dual-slope converter: V_in = 3 V integrated for N_1 = 10 clocks (10 ms), then −V_ref = −10 V until the ramp is back at 0: N_2 = N_1 V_in/V_ref = 3 */
const DUAL_ST = { Tc: 1e-3, N1: 10, phase: 1, t1: 0, t2: 0, n: 0, done: false }, DUAL_RESET = st => { st.phase = 1; st.t1 = 0; st.t2 = 0; st.n = 0; st.done = false; };
const DUAL_OUTS = { vo: c => c.V('o').re, cmp: c => c.V('c').re, vsw: c => c.V('sw').re };
DEF.dual = { ...LAYT, cktAspM: 0.5, solvedAt: 1, init: s => { s.st.x = DUAL_ST; s.st.rec = new OP.Rec(0.016, 800, DUAL_OUTS, 8); s.st.rec.ctl = IC.ctlDual(s.st.x); s.st.rec.onRestart = () => DUAL_RESET(s.st.x); },
  tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => spec('dual', { kind: 'dual', st: DUAL_ST, vin: 3, Vref: 10, R: 10e3, C: 1e-6 }), glow: k => (k === 1 ? ['S1', 'R', 'C'] : k === 2 ? ['S2'] : k === 3 ? ['A2'] : null),
  badge: (k, s) => { const x = s.st.x, rec = s.st.rec; return k >= 1 ? bdg(x.done ? `${t('นับได้', 'count')} N_2 = ${x.n} → ${vtx(x.n / x.N1 * 10)}` : x.phase === 1 ? `${t('ช่วงที่ 1: อินทิเกรต V_in นาน 10 ms', 'phase 1: integrate V_in for 10 ms')} · t = ${fd(rec.t * 1e3, 1)} ms` : `${t('ช่วงที่ 2: −V_ref จนกลับถึง 0', 'phase 2: −V_ref until back at 0')} · t = ${fd(rec.t * 1e3, 1)} ms`, null, x.done) : bdg('V_in = 3 V, V_ref = 10 V, RC = 10 ms, clock 1 kHz, N_1 = 10', null, false); },
  waves: [{ draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vo', color: C.q, label: 'v_o', w: 2.8 }, { key: 'cmp', color: C.tan, label: t('หยุด', 'stop') }], y: [-4, 1.2], yt: [-3, -2, -1, 0, 1], ms: true, xt: [4, 8, 12, 16], title: bd.short ? '' : t('ลาดด้วย V_in นานคงที่ แล้วกลับด้วย V_ref (รูป 13.14b กลับหัว: อินทิเกรเตอร์กลับเฟส)', 'a ramp with V_in for a fixed time, then back with V_ref (Fig. 13.14b upside down: an inverting integrator)'), hl: [{ y: 0, color: 'rgba(232,236,247,.3)' }], vl: [{ x: 10, color: C.elec, dash: [2, 3], label: bd.short ? '' : 'T_1' }], short: bd.short }) }],
  after: (v, k, s) => { if (k >= 1) { OP.tag(v, 'o', `${vtx(s.ckt.V('o').re)}`, C.q, 0.1, -0.42); OP.tag(v, 'c', s.st.x.done ? t('หยุดนับ', 'stop') : '', C.tan, 0.1, -0.42); } },
  steps: () => [
    step(t('<b>ช่วงที่ 1: ความชันแรก</b> (สไลด์หน้า 12–13, รูป 13.14): สวิตช์ \\(S_1\\) ต่อ \\(V_{in}\\) เข้าอินทิเกรเตอร์ (บทที่ 7) นาน \\(T_1 = N_1T_c\\) คงที่ ขาออกลาดเป็นเส้นตรงถึงระดับที่แปรตาม \\(V_{in}\\) (อินทิเกรเตอร์ของบทที่ 7 กลับเฟส ขาออกจึงลาดลง ตำราวาดขึ้น)', '<b>Phase 1: the first slope</b> (slides pp. 12–13, Fig. 13.14): switch \\(S_1\\) connects \\(V_{in}\\) to the integrator (chapter 7) for a fixed \\(T_1 = N_1T_c\\); the output ramps to a level proportional to \\(V_{in}\\) (chapter 7\'s integrator inverts, so the ramp goes down where the book draws it going up)'),
      block([R`v_o(T_1) &= -\frac{V_{in}T_1}{RC} = -\frac{(3\ \text{V})(10\ \text{ms})}{10\ \text{ms}} = -3\ \text{V}`])),
    step(t('<b>ช่วงที่ 2: ความชันคงที่กลับมา</b> (หน้า 14): ตัวนับถูกล้างเป็นศูนย์ สวิตช์ \\(S_2\\) เปลี่ยนไป \\(-V_{ref}\\) ขาออกกลับด้วยอัตราคงที่ \\(V_{ref}/RC\\) จนตัวเปรียบเทียบเห็นว่าถึง 0 แล้วหยุดนับ', '<b>Phase 2: the fixed return slope</b> (p. 14): the counter is cleared, switch \\(S_2\\) moves to \\(-V_{ref}\\), and the output returns at the fixed rate \\(V_{ref}/RC\\) until the comparator sees it reach 0 and stops the count'),
      block([R`T_2 &= \frac{|v_o(T_1)|}{V_{ref}/RC} = T_1\frac{V_{in}}{V_{ref}} = (10\ \text{ms})\frac{3}{10} = 3\ \text{ms}`, R`N_2 &= N_1\frac{V_{in}}{V_{ref}} = 10 \times 0.3 = \boxed{3}`])),
    step(t('<b>ทำไมแม่นยำ</b>: \\(RC\\) และความถี่นาฬิกาหายไปจากผลลัพธ์ (ใช้ชุดเดียวกันทั้งขึ้นและลง) ผลการแปลงขึ้นกับ \\(V_{in}/V_{ref}\\) เท่านั้น นี่คือวิธีของมัลติมิเตอร์ดิจิทัล', '<b>Why it is accurate</b>: \\(RC\\) and the clock frequency cancel out (the same ones serve both slopes); the result depends only on \\(V_{in}/V_{ref}\\). This is how digital multimeters work'),
      block([R`N_2 &= N_1\frac{V_{in}}{V_{ref}}\quad(\text{no } R, C, f_{clock})`]))],
  ask: () => ({ fields: [num(t('|v<sub>o</sub>(T<sub>1</sub>)| (V) =', '|v<sub>o</sub>(T<sub>1</sub>)| (V) ='), 3, { tol: 0.02 }), num('T<sub>2</sub> (ms) =', 3, { tol: 0.05 }), num('N<sub>2</sub> =', 3, { tol: 0.01 })] }),
  answer: () => t('ลาดถึง −3 V ใน 10 ms กลับถึง 0 ใน 3 ms: นับได้ \\(N_2\\) = 3 = 10 × 3 V/10 V (Boylestad รูป 13.14)', 'A ramp to −3 V in 10 ms, back to 0 in 3 ms: a count \\(N_2\\) = 3 = 10 × 3 V/10 V (Boylestad Fig. 13.14).') };

/* ---------------- page 8.3: the 555 timer ---------------- */
DEF.in555 = { ...LAY, cktAspM: 0.62, solvedAt: 1, init: s => { s.st.thr = 2; s.st.trg = 2; }, spec: (k, s) => IC.ckt({ kind: 'in555', VCC: 5, thr: s.st.thr, trg: s.st.trg }),
  controls: (el, s) => { MC.ui.slider(el, { id: 'thr', label: t('ขา 6 (threshold)', 'pin 6 (threshold)'), min: 0, max: 5, step: 0.05, value: 2, fmt: v => vtx(v), oninput: v => { s.st.thr = v; s.build(); } }); MC.ui.slider(el, { id: 'trg', label: t('ขา 2 (trigger)', 'pin 2 (trigger)'), min: 0, max: 5, step: 0.05, value: 2, fmt: v => vtx(v), oninput: v => { s.st.trg = v; s.build(); } }); },
  glow: k => (k === 1 ? ['Ra', 'Rb', 'Rc'] : k === 2 ? ['A1'] : k === 3 ? ['A2'] : null),
  badge: (k, s) => { const c1 = s.ckt.V('c1').re > 2.5, c2 = s.ckt.V('c2').re > 2.5; return k >= 1 ? bdg(`${t('ตัวเปรียบเทียบ 1', 'comparator 1')}: ${c1 ? t('รีเซ็ต (ขาออกต่ำ, คายประจุ)', 'reset (output low, discharge)') : '–'} · ${t('ตัวเปรียบเทียบ 2', 'comparator 2')}: ${c2 ? t('เซ็ต (ขาออกสูง)', 'set (output high)') : '–'}${!c1 && !c2 ? ' · ' + t('ฟลิปฟล็อปคงสถานะเดิม', 'the flip-flop holds') : ''}`, null, c1 !== c2) : bdg('V_CC = 5 V: 2V_CC/3 = 3.33 V, V_CC/3 = 1.67 V', null, false); },
  side: (ctx, b, bd, k, s) => { const V = 5, thr = s.st.thr, trg = s.st.trg; CH8.bars(ctx, b, [{ label: t('ขา 6', 'pin 6'), v: thr, color: C.tan, sub: bd.short ? '' : t('เทียบ 3.33 V', 'vs 3.33 V') }, { label: '2V_CC/3', v: 2 * V / 3, color: C.q, sub: bd.short ? '' : t('รีเซ็ตเมื่อขา 6 สูงกว่า', 'reset when pin 6 is above') }, { label: 'V_CC/3', v: V / 3, color: PURPLE, sub: bd.short ? '' : t('เซ็ตเมื่อขา 2 ต่ำกว่า', 'set when pin 2 is below') }, { label: t('ขา 2', 'pin 2'), v: trg, color: C.elec, sub: bd.short ? '' : t('เทียบ 1.67 V', 'vs 1.67 V') }], { title: bd.short ? '' : t('สองระดับจากตัวแบ่ง 3R', 'the two levels from the 3R divider'), max: 5.5, fmt: v => vtx(v), sub: !bd.short }); },
  after: (v, k, s) => { if (k >= 1) { OP.tag(v, 'a', `${vtx(s.ckt.V('a').re)}`, C.q, -0.55, 0, 'right'); OP.tag(v, 'b', `${vtx(s.ckt.V('b').re)}`, PURPLE, -0.55, 0, 'right'); OP.tag(v, 'c1', s.ckt.V('c1').re > 2.5 ? 'R' : '', C.q, 0.1, -0.42); OP.tag(v, 'c2', s.ckt.V('c2').re > 2.5 ? 'S' : '', PURPLE, 0.1, -0.42); } },
  steps: () => [
    step(t('<b>ตัวแบ่งแรงดันสามตัว</b> (สไลด์หน้า 18, รูป 13.16): ตัวต้านทาน R เท่ากันสามตัวจาก \\(V_{CC}\\) ลงกราวด์ให้สองระดับอ้างอิง', '<b>The three-resistor divider</b> (slide p. 18, Fig. 13.16): three equal R from \\(V_{CC}\\) to ground give two reference levels'),
      block([R`\frac{2}{3}V_{CC} &= \frac{2}{3}(5\ \text{V}) = 3.33\ \text{V},\qquad \frac{1}{3}V_{CC} = 1.67\ \text{V}`]), t('ขา 5 (control voltage) ต่ออยู่ที่จุด 2V_CC/3 ปกติต่อ 0.01 µF ลงกราวด์เพื่อกันสัญญาณรบกวน', 'Pin 5 (control voltage) sits at the 2V_CC/3 node; usually a 0.01 µF capacitor to ground keeps noise out.')),
    step(t('<b>ตัวเปรียบเทียบ 1</b>: ขา 6 (threshold) ที่ขั้ว + เทียบกับ 2V_CC/3 ที่ขั้ว − เมื่อขา 6 สูงกว่า 3.33 V ขาออกของมันสูง → <b>รีเซ็ต</b>ฟลิปฟล็อป: ขาออก (ขา 3) ต่ำ และทรานซิสเตอร์คายประจุ (ขา 7) นำ', '<b>Comparator 1</b>: pin 6 (threshold) at + against 2V_CC/3 at −. When pin 6 rises above 3.33 V its output goes high and <b>resets</b> the flip-flop: the output (pin 3) goes low and the discharge transistor (pin 7) conducts'),
      block([R`V_6 > \tfrac{2}{3}V_{CC} &\Rightarrow \text{reset}`])),
    step(t('<b>ตัวเปรียบเทียบ 2</b>: V_CC/3 ที่ขั้ว + ขา 2 (trigger) ที่ขั้ว − เมื่อขา 2 ต่ำกว่า 1.67 V ขาออกของมันสูง → <b>เซ็ต</b>: ขา 3 สูง ทรานซิสเตอร์คายประจุหยุดนำ ระหว่าง 1.67 ถึง 3.33 V ไม่มีตัวใดสั่ง ฟลิปฟล็อปจำสถานะเดิม: นี่คือหัวใจของการจับเวลา', '<b>Comparator 2</b>: V_CC/3 at +, pin 2 (trigger) at −. When pin 2 falls below 1.67 V its output goes high and <b>sets</b> the flip-flop: pin 3 high, the discharge transistor off. Between 1.67 and 3.33 V neither comparator speaks and the flip-flop remembers: that memory is the heart of the timing'),
      block([R`V_2 < \tfrac{1}{3}V_{CC} &\Rightarrow \text{set}`]), t('เลื่อนแถบใต้ภาพ: ขา 6 ขึ้นเกิน 3.33 V หรือขา 2 ลงต่ำกว่า 1.67 V แล้วดูป้าย', 'Move the sliders under the picture: take pin 6 above 3.33 V or pin 2 below 1.67 V and watch the badge.'))],
  ask: () => ({ fields: [num('2V<sub>CC</sub>/3 (V) =', 10 / 3, { tol: 0.02 }), num('V<sub>CC</sub>/3 (V) =', 5 / 3, { tol: 0.02 })] }),
  answer: () => t('3.33 V (รีเซ็ตเมื่อขา 6 สูงกว่า) และ 1.67 V (เซ็ตเมื่อขา 2 ต่ำกว่า) (Boylestad รูป 13.16)', '3.33 V (reset when pin 6 is above it) and 1.67 V (set when pin 2 is below it) (Boylestad Fig. 13.16).') };
/* the astable of Example 13.1 (slide p. 20): R_A = R_B = 7.5 kΩ, C = 0.1 µF, V_CC = 5 V */
const AST = { hi: true, VCC: 5, mono: false, edges: [] }, AST_RESET = st => { st.hi = true; st.edges = []; st.pt = undefined; st.pv = undefined; };
const f555 = (RA, RB, Cv) => ({ th: 0.693 * (RA + RB) * Cv, tl: 0.693 * RB * Cv, f: 1.44 / ((RA + 2 * RB) * Cv) });
const E131 = f555(7.5e3, 7.5e3, 0.1e-6);
DEF.astable = { ...LAYT, cktAspM: 0.62, solvedAt: 1, init: s => { s.st.x = AST; s.st.rec = new OP.Rec(4 / E131.f, 1600, OUTS, 5); s.st.rec.ctl = IC.ctl555(s.st.x); s.st.rec.onRestart = () => AST_RESET(s.st.x); },
  tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => spec('ast', { kind: 't555', st: AST, VCC: 5, RA: 7.5e3, RB: 7.5e3, C: 0.1e-6 }), glow: k => (k === 1 ? ['RA', 'RB', 'C'] : k === 2 ? ['S', 'RB'] : k === 3 ? ['VO'] : null),
  badge: (k, s) => { const p = IC.period(s.st.x), rec = s.st.rec; return k >= 1 ? bdg(p ? `${t('วัดได้', 'measured')}: T_high = ${ms(p.hi)}, T_low = ${ms(p.lo)}, f = ${fHz(1 / p.T)}` : `t = ${fd(rec.t * 1e3, 2)} ms · ${s.st.x.hi ? t('ชาร์จผ่าน R_A + R_B', 'charging through R_A + R_B') : t('คายผ่าน R_B', 'discharging through R_B')}`) : bdg('R_A = R_B = 7.5 kΩ, C = 0.1 µF, V_CC = 5 V', null, false); },
  waves: [{ draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vc', color: C.q, label: 'v_C', w: 2.6 }, { key: 'vo', color: C.elec, label: 'v_o', w: 2.2 }], y: [-0.5, 6], yt: [0, 5 / 3, 10 / 3, 5], yf: y => IE.num(y, 2), ms: true, xt: [1.5, 3, 4.5, 6], title: bd.short ? '' : t('v_C ระหว่าง V_CC/3 กับ 2V_CC/3, v_o สูงขณะชาร์จ (รูป 13.18b)', 'v_C between V_CC/3 and 2V_CC/3, v_o high while charging (Fig. 13.18b)'), hl: [{ y: 10 / 3, color: C.tan, label: bd.short ? '' : '2V_CC/3' }, { y: 5 / 3, color: C.tan, label: bd.short ? '' : 'V_CC/3', left: true }], short: bd.short }) }],
  after: (v, k, s) => { IC.box(v, s.spec.box); },   // v_C is read off the waveform (a tag beside C collides with R_B's label)
  steps: () => [
    step(t('<b>ชาร์จ</b> (สไลด์หน้า 19, รูป 13.17): ขาออกสูง ทรานซิสเตอร์คายประจุไม่นำ C ชาร์จผ่าน \\(R_A + R_B\\) จาก \\(V_{CC}/3\\) ขึ้นไปถึง \\(2V_{CC}/3\\) (สมการ 13.3)', '<b>Charging</b> (slide p. 19, Fig. 13.17): the output is high and the discharge transistor off; C charges through \\(R_A + R_B\\) from \\(V_{CC}/3\\) up to \\(2V_{CC}/3\\) (Eq. 13.3)'),
      block([R`T_{high} &\cong 0.7(R_A + R_B)C = 0.7(7.5 \times 10^3 + 7.5 \times 10^3)(0.1 \times 10^{-6}) = \boxed{1.05\ \text{ms}}`]),
      t('ที่ \\(2V_{CC}/3\\) ตัวเปรียบเทียบ 1 รีเซ็ตฟลิปฟล็อป (ข้อ 1) ค่าแม่นยำคือ ln 2 = 0.693 แทน 0.7: 1.04 ms ตามที่ภาพจำลองวัดได้', 'At \\(2V_{CC}/3\\) comparator 1 resets the flip-flop (problem 1). The exact factor is ln 2 = 0.693 rather than 0.7: 1.04 ms, as the simulation measures.')),
    step(t('<b>คายประจุ</b>: ขาออกต่ำ ทรานซิสเตอร์คายประจุนำ ขา 7 ลงกราวด์ C คายผ่าน \\(R_B\\) เท่านั้นจนถึง \\(V_{CC}/3\\) (สมการ 13.4) จึงสั้นกว่า', '<b>Discharging</b>: the output is low, the discharge transistor conducts and pin 7 is grounded; C discharges through \\(R_B\\) alone down to \\(V_{CC}/3\\) (Eq. 13.4), so this half is shorter'),
      block([R`T_{low} &\cong 0.7R_BC = 0.7(7.5 \times 10^3)(0.1 \times 10^{-6}) = \boxed{0.525\ \text{ms}}`])),
    step(t('<b>คาบและความถี่</b> (สมการ 13.5–13.6)', '<b>Period and frequency</b> (Eqs. 13.5–13.6)'),
      block([R`T &= T_{high} + T_{low} = 1.05 + 0.525 = 1.575\ \text{ms}`, R`f &= \frac{1}{T} = \frac{1}{1.575 \times 10^{-3}} \cong \boxed{635\ \text{Hz}}`, R`f &\cong \frac{1.44}{(R_A + 2R_B)C} = \frac{1.44}{(22.5 \times 10^3)(0.1 \times 10^{-6})} = 640\ \text{Hz}`]),
      t('ขาออกสูงนานกว่าต่ำเสมอ (รอบการทำงาน > 50 %) เพราะชาร์จผ่าน \\(R_A + R_B\\) แต่คายผ่าน \\(R_B\\)', 'The output is high longer than low (duty cycle above 50 %), because it charges through \\(R_A + R_B\\) but discharges through \\(R_B\\).'))],
  ask: () => ({ fields: [num('T<sub>high</sub> (ms) =', 1.05, { tol: 0.02 }), num('T<sub>low</sub> (ms) =', 0.525, { tol: 0.01 }), num('f (Hz) =', 635, { tol: 6 })] }),
  answer: () => t('\\(T_{high}\\) = 1.05 ms, \\(T_{low}\\) = 0.525 ms, T = 1.575 ms, f ≈ 635 Hz (Boylestad Example 13.1, สไลด์หน้า 20)', '\\(T_{high}\\) = 1.05 ms, \\(T_{low}\\) = 0.525 ms, T = 1.575 ms, f ≈ 635 Hz (Boylestad Example 13.1, slide p. 20).') };
/* the one-shot of Example 13.2 (slide p. 22): R_A = 7.5 kΩ, C = 0.1 µF, triggered by a negative pulse every 3 ms */
const MONO = { hi: false, VCC: 5, mono: true, armed: false, edges: [], trig: IC.trigger(5, 3e-3, 0.1e-3) }, MONO_RESET = st => { st.hi = false; st.armed = false; st.edges = []; st.pt = undefined; st.pv = undefined; };
DEF.mono = { ...LAYT, cktAspM: 0.62, solvedAt: 1, init: s => { s.st.x = MONO; s.st.rec = new OP.Rec(6e-3, 1500, OUTS, 5); s.st.rec.ctl = IC.ctl555(s.st.x); s.st.rec.onRestart = () => MONO_RESET(s.st.x); },
  tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => spec('mono', { kind: 't555', mode: 'mono', st: MONO, VCC: 5, RA: 7.5e3, C: 0.1e-6 }), glow: k => (k === 1 ? ['VT'] : k === 2 ? ['RA', 'C'] : null),
  badge: (k, s) => { const e = s.st.x.edges, rec = s.st.rec, w = e.length >= 2 ? e[e.length - 1] - e[e.length - 2] : null; return k >= 1 ? bdg(w !== null && !s.st.x.hi ? `${t('พัลส์ขาออกวัดได้', 'output pulse measured')} ${ms(w)}` : `t = ${fd(rec.t * 1e3, 2)} ms · ${s.st.x.hi ? t('ขาออกสูง: C ชาร์จผ่าน R_A', 'output high: C charges through R_A') : t('รอทริกเกอร์', 'waiting for a trigger')}`) : bdg('R_A = 7.5 kΩ, C = 0.1 µF, V_CC = 5 V', null, false); },
  waves: [{ draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vtr', color: C.tan, label: t('ทริกเกอร์', 'trigger'), w: 1.8 }, { key: 'vc', color: C.q, label: 'v_C', w: 2.6 }, { key: 'vo', color: C.elec, label: 'v_o', w: 2.2 }], y: [-0.5, 6], yt: [0, 5 / 3, 10 / 3, 5], yf: y => IE.num(y, 2), ms: true, xt: [1.5, 3, 4.5, 6], title: bd.short ? '' : t('ขอบลงของทริกเกอร์เซ็ต ขาออกสูงจน v_C ถึง 2V_CC/3 (รูป 13.19b)', 'the trigger\'s falling edge sets, the output stays high until v_C reaches 2V_CC/3 (Fig. 13.19b)'), hl: [{ y: 10 / 3, color: C.tan, label: bd.short ? '' : '2V_CC/3' }], short: bd.short }) }],
  after: (v, k, s) => { IC.box(v, s.spec.box); },
  steps: () => [
    step(t('<b>ทริกเกอร์</b> (สไลด์หน้า 21, รูป 13.19): ขา 2 ปกติอยู่ที่ \\(V_{CC}\\) เมื่อพัลส์ลบดึงมันต่ำกว่า \\(V_{CC}/3\\) ตัวเปรียบเทียบ 2 เซ็ตฟลิปฟล็อป ขาออกสูง ทรานซิสเตอร์คายประจุปล่อย C (ซึ่งถูกกดไว้ที่ 0 V)', '<b>The trigger</b> (slide p. 21, Fig. 13.19): pin 2 normally sits at \\(V_{CC}\\); when a negative pulse pulls it below \\(V_{CC}/3\\), comparator 2 sets the flip-flop, the output goes high and the discharge transistor releases C (held at 0 V until then)'),
      block([R`V_2 < \tfrac{1}{3}V_{CC} &\Rightarrow v_o = V_{CC}`])),
    step(t('<b>ชาร์จจาก 0 ถึง \\(2V_{CC}/3\\)</b> ผ่าน \\(R_A\\) อย่างเดียว: ใช้เวลา ln 3 ≈ 1.1 ค่าคงตัวเวลา (สมการ 13.7) แล้วตัวเปรียบเทียบ 1 รีเซ็ต ขาออกกลับต่ำ และ C ถูกคายจนหมดรอทริกเกอร์ครั้งต่อไป', '<b>Charging from 0 to \\(2V_{CC}/3\\)</b> through \\(R_A\\) alone takes ln 3 ≈ 1.1 time constants (Eq. 13.7); then comparator 1 resets, the output returns low and C is emptied, waiting for the next trigger'),
      block([R`T_{high} &= 1.1R_AC = 1.1(7.5 \times 10^3)(0.1 \times 10^{-6}) = \boxed{0.825\ \text{ms}}`]),
      t('ความกว้างของพัลส์ขาออกไม่ขึ้นกับความกว้างของทริกเกอร์ (ตราบใดที่ทริกเกอร์สั้นกว่า) ภาพจำลองทริกเกอร์ทุก 3 ms', 'The output pulse width does not depend on the trigger width (as long as the trigger is shorter); the simulation triggers every 3 ms.'))],
  ask: () => ({ fields: [num('T<sub>high</sub> (ms) =', 0.825, { tol: 0.01 })] }),
  answer: () => t('\\(T_{high}\\) = 1.1(7.5 kΩ)(0.1 µF) = 0.825 ms (Boylestad Example 13.2, สไลด์หน้า 22)', '\\(T_{high}\\) = 1.1(7.5 kΩ)(0.1 µF) = 0.825 ms (Boylestad Example 13.2, slide p. 22).') };

/* ---------------- page 8.4: the 566 VCO ---------------- */
const vcoRec = (st, fo) => { const rec = new OP.Rec(4 / fo, 2000, { vc: c => c.V('p7').re, sq: c => c.V('sq').re }, 5); rec.ctl = IC.ctl566(st); rec.onRestart = () => { st.up = true; st.edges = []; st.pt = undefined; st.pv = undefined; }; return rec; };
const vcoWaves = (o = {}) => [{ draw: (ctx, b, bd, k, s) => { const V = s.st.x.Vp; OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vc', color: C.q, label: bd.short ? t('สามเหลี่ยม', 'triangle') : t('สามเหลี่ยม (ขา 4)', 'triangle (pin 4)'), w: 2.6 }, { key: 'sq', color: C.elec, label: bd.short ? t('สี่เหลี่ยม', 'square') : t('สี่เหลี่ยม (ขา 3)', 'square (pin 3)'), w: 2.2 }], y: [-0.5, V * 1.1], yt: [0, V / 4, V / 2, 3 * V / 4, V], yf: y => IE.num(y, 1), ms: s.st.rec.Tw >= 1e-3, us: s.st.rec.Tw < 1e-3, xf: x => IE.num(x, 1), xl: s.st.rec.Tw >= 1e-3 ? 't (ms)' : 't (µs)', title: bd.short ? '' : (o.title || t('C_1 ชาร์จและคายด้วยกระแสคงที่ระหว่างสองระดับของชมิตต์ทริกเกอร์', 'C_1 charged and discharged at constant current between the Schmitt trigger levels')), short: bd.short }); } }];
const VCO = { up: true, Vp: 12, VC: IC.vcOf(12, 1.5e3, 10e3), R1: 10e3, I: 0, vc1: 0, edges: [] }, F1322 = IC.f566(12, VCO.VC, 10e3, 820e-12);
DEF.vco = { ...LAYT, cktAspM: 0.62, solvedAt: 1, init: s => { s.st.x = VCO; s.st.rec = vcoRec(VCO, F1322); },
  tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => spec('vco', { kind: 'v566', st: VCO, Vp: 12, R1: 10e3, C1: 820e-12, R2: 1.5e3, R3: 10e3 }), glow: k => (k === 1 ? ['R2', 'R3'] : k === 2 ? ['R1', 'C1'] : null),
  badge: (k, s) => { const p = IC.period(s.st.x); return k >= 1 ? bdg(p ? `${t('วัดได้', 'measured')} f = ${fHz(1 / p.T)} · ${t('สูตร', 'formula')} ${fHz(F1322)}` : `V_C = ${vtx(VCO.VC)}, I = ${itx(VCO.I)}`) : bdg('V+ = 12 V, R_1 = 10 kΩ, C_1 = 820 pF, R_2 = 1.5 kΩ, R_3 = 10 kΩ', null, false); },
  waves: vcoWaves(),
  after: (v, k, s) => { IC.box(v, s.spec.box); if (k >= 1) OP.tag(v, 'vc', 'V_C', C.tan, 0.3, 0.45); },   // name only, under the wire into pin 5: the value is in the badge, a full tag would run into the current source's label
  steps: () => [
    step(t('<b>แรงดันมอดูเลต</b> (สไลด์หน้า 25, รูป 13.22): ตัวแบ่ง \\(R_2\\)–\\(R_3\\) ตั้ง \\(V_C\\) ที่ขา 5 ต้องอยู่ในช่วง 0.75V+ = 9 V ถึง V+ = 12 V', '<b>The modulating voltage</b> (slide p. 25, Fig. 13.22): the \\(R_2\\)–\\(R_3\\) divider sets \\(V_C\\) at pin 5; it must lie between 0.75V+ = 9 V and V+ = 12 V'),
      block([R`V_C &= \frac{R_3}{R_2 + R_3}V^+ = \frac{10\ \text{k}\Omega}{1.5\ \text{k}\Omega + 10\ \text{k}\Omega}(12\ \text{V}) = \boxed{10.4\ \text{V}}`])),
    step(t('<b>ความถี่อิสระ</b> (สมการ 13.8): กระแส \\((V^+ - V_C)/R_1\\) ชาร์จและคาย \\(C_1\\) ระหว่างสองระดับที่ห่างกัน V+/4 ของชมิตต์ทริกเกอร์', '<b>The free-running frequency</b> (Eq. 13.8): the current \\((V^+ - V_C)/R_1\\) charges and discharges \\(C_1\\) between the Schmitt trigger levels, V+/4 apart'),
      block([R`f_o &= \frac{2}{R_1C_1}\left(\frac{V^+ - V_C}{V^+}\right) = \frac{2}{(10 \times 10^3)(820 \times 10^{-12})}\left(\frac{12 - 10.4}{12}\right) \cong \boxed{32.5\ \text{kHz}}`]),
      t(`ตำราปัด \\(V_C\\) เป็น 10.4 V ค่าเต็ม 10.43 V ให้ ${fHz(F1322)} ซึ่งภาพจำลองวัดได้ ภายในชิป ขา 6 อยู่ที่ \\(V_C\\) กระแสใน \\(R_1\\) จึงเท่ากับ (12 − 10.43)/10 kΩ = ${itx((12 - VCO.VC) / 1e4)} (ชี้เมาส์ที่ \\(R_1\\))`, `The book rounds \\(V_C\\) to 10.4 V; the full 10.43 V gives ${fHz(F1322)}, which the simulation measures. Inside the chip pin 6 sits at \\(V_C\\), so the current in \\(R_1\\) is (12 − 10.43)/10 kΩ = ${itx((12 - VCO.VC) / 1e4)} (hover over \\(R_1\\)).`)),
    step(t('<b>สองรูปคลื่น</b> (สไลด์หน้า 23): สามเหลี่ยมคือแรงดันบน \\(C_1\\) (ขา 4) สี่เหลี่ยมคือขาออกของชมิตต์ทริกเกอร์ (ขา 3) ความถี่เดียวกัน', '<b>The two waveforms</b> (slide p. 23): the triangle is the voltage on \\(C_1\\) (pin 4), the square the Schmitt trigger\'s output (pin 3), both at the same frequency'),
      block([R`T &= \frac{1}{f_o} = \frac{1}{32.5\ \text{kHz}} = 30.8\ \mu\text{s}`]))],
  ask: () => ({ fields: [num('V<sub>C</sub> (V) =', 10.4, { tol: 0.05 }), num('f<sub>o</sub> (kHz) =', 32.5, { tol: 0.8 })] }),
  answer: () => t('\\(V_C\\) = 10.4 V, \\(f_o\\) ≈ 32.5 kHz (Boylestad รูป 13.22, สไลด์หน้า 25)', '\\(V_C\\) = 10.4 V, \\(f_o\\) ≈ 32.5 kHz (Boylestad Fig. 13.22, slide p. 25).') };
/* Fig. 13.23 (slide p. 26): R_2 = 510 Ω, R_3 = 5 kΩ potentiometer, R_4 = 18 kΩ: V_C from 11.74 V (top) to 9.19 V (bottom), f_o from 19.7 kHz to 212.9 kHz with C_1 = 220 pF */
const POT = { up: true, Vp: 12, VC: 11.74, R1: 10e3, I: 0, vc1: 0, edges: [] }, vcPot = x => IC.vcOf(12, 510 + 5e3 * (1 - x), 18e3 + 5e3 * x);   // x = 0: wiper at the bottom (R_3 above the wiper), x = 1: at the top
const FP = x => IC.f566(12, vcPot(x), 10e3, 220e-12);
DEF.vcoPot = { ...LAYT, cktAspM: 0.62, solvedAt: 1, init: s => { s.st.pot = 1; POT.VC = vcPot(1); s.st.x = POT; s.st.rec = vcoRec(POT, FP(1)); },
  controls: (el, s) => { MC.ui.slider(el, { id: 'pot', label: t('ตำแหน่งไวเปอร์ R_3', 'wiper of R_3'), min: 0, max: 1, step: 0.01, value: 1, fmt: v => `${fd(v * 100, 0)} % → V_C = ${vtx(vcPot(v))}`.replace('V_C', 'V꜀'), oninput: v => { s.st.pot = v; POT.VC = vcPot(v); s.st.rec = vcoRec(POT, FP(v)); s.build(); } }); },
  tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: (k, s) => IC.ckt({ kind: 'v566', st: POT, Vp: 12, R1: 10e3, C1: 220e-12, R2: 510 + 5e3 * (1 - s.st.pot), R3: 18e3 + 5e3 * s.st.pot }), glow: k => (k === 1 ? ['R2', 'R3'] : k === 2 ? ['R2', 'R3'] : null),
  badge: (k, s) => { const p = IC.period(s.st.x); return k >= 1 ? bdg(`V_C = ${vtx(POT.VC)} → ${t('สูตร', 'formula')} ${fHz(FP(s.st.pot))}${p ? ` · ${t('วัดได้', 'measured')} ${fHz(1 / p.T)}` : ''}`) : bdg('R_2 = 510 Ω, R_3 = 5 kΩ pot, R_4 = 18 kΩ, R_1 = 10 kΩ, C_1 = 220 pF', null, false); },
  waves: vcoWaves({ title: t('หมุน R_3: V_C ต่ำลง ความถี่สูงขึ้น', 'turn R_3: a lower V_C, a higher frequency') }),
  after: (v, k, s) => { IC.box(v, s.spec.box); if (k >= 1) OP.tag(v, 'vc', 'V_C', C.tan, 0.3, 0.45); },
  steps: () => [
    step(t('<b>ไวเปอร์บนสุด</b> (สไลด์หน้า 26, รูป 13.23): \\(R_3 + R_4\\) อยู่ใต้ไวเปอร์ \\(V_C\\) สูงสุด ความถี่ต่ำสุด (ภาพจำลองรวมโพเทนชิออมิเตอร์เข้ากับ \\(R_2\\) และ \\(R_4\\) ตามตำแหน่งไวเปอร์)', '<b>Wiper at the top</b> (slide p. 26, Fig. 13.23): \\(R_3 + R_4\\) below the wiper, the highest \\(V_C\\), the lowest frequency (the simulation folds the potentiometer into \\(R_2\\) and \\(R_4\\) according to the wiper)'),
      block([R`V_C &= \frac{R_3 + R_4}{R_2 + R_3 + R_4}V^+ = \frac{5 + 18}{0.51 + 5 + 18}(12\ \text{V}) = 11.74\ \text{V}`, R`f_o &= \frac{2}{(10 \times 10^3)(220 \times 10^{-12})}\left(\frac{12 - 11.74}{12}\right) \cong \boxed{19.7\ \text{kHz}}`])),
    step(t('<b>ไวเปอร์ล่างสุด</b>: เหลือ \\(R_4\\) ใต้ไวเปอร์ \\(V_C\\) ต่ำสุด ความถี่สูงสุด', '<b>Wiper at the bottom</b>: only \\(R_4\\) below the wiper, the lowest \\(V_C\\), the highest frequency'),
      block([R`V_C &= \frac{18}{23.51}(12\ \text{V}) = 9.19\ \text{V}`, R`f_o &= 909.1 \times 10^3\left(\frac{12 - 9.19}{12}\right) \cong \boxed{212.9\ \text{kHz}}`]),
      t('ช่วงกว้างกว่า 10 ต่อ 1 ตามที่ตำราต้องการ: \\(V_C\\) ต้องไม่ต่ำกว่า 0.75V+ = 9 V (9.19 V ยังอยู่ในเกณฑ์) เลื่อนแถบใต้ภาพแล้วดูความถี่ที่วัดได้', 'More than a 10-to-1 range, as the book wants; \\(V_C\\) must not drop below 0.75V+ = 9 V (9.19 V still qualifies). Move the slider and watch the measured frequency.'))],
  ask: () => ({ fields: [num(t('บนสุด: f<sub>o</sub> (kHz) =', 'top: f<sub>o</sub> (kHz) ='), 19.7, { tol: 0.5 }), num(t('ล่างสุด: f<sub>o</sub> (kHz) =', 'bottom: f<sub>o</sub> (kHz) ='), 212.9, { tol: 3 })] }),
  answer: () => t('19.7 kHz (ไวเปอร์บนสุด, V_C = 11.74 V) ถึง 212.9 kHz (ล่างสุด, 9.19 V) (Boylestad รูป 13.23, สไลด์หน้า 26)', '19.7 kHz (wiper at the top, V_C = 11.74 V) to 212.9 kHz (at the bottom, 9.19 V) (Boylestad Fig. 13.23, slide p. 26).') };

IC.S = { VREF1, VREF2, E131, F1322, vcPot, FP, f555 };
IC.ST = { ADC_ST, ADC_RESET, DUAL_ST, DUAL_RESET, AST, AST_RESET, MONO, MONO_RESET, VCO, POT };
IC.DEF = DEF;
IC.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.IC = IC;
})(window);
