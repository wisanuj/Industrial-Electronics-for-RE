/* ie7.js — chapter 7 (operational amplifiers): the circuits of the two slide sets on top of circuit.js (part 'OA': v_o = A_d v_d + A_c v_c clipped
   at ±V_sat, infinite input resistance, zero output resistance), ch8.js (CH8.Board, CH8.Prob, CH8.wire, CH8.bars) and ie.js. The global is OP.
   Sources: course slides "Chapter 7 Operational Amplifiers I" (25 pp.) and "II" (18 pp.) and Boylestad & Nashelsky, 11th ed., §10.1, §10.4–10.5,
   §10.9 (Examples 10.5–10.7, 10.21–10.22, Fig. 10.39–10.41, Problems 2, 7, 8–10, 14 of chapter 10) and §11.6 (Examples 11.12–11.14).
   OP.ckt(o) builds every circuit: o.kind = 'pair' (two sources into the two inputs, Figs. 10.2–10.3 and 10.52) | 'inv' (Fig. 10.34) | 'noninv'
   (Fig. 10.35) | 'follower' (Fig. 10.36) | 'sum' (Fig. 10.37) | 'integ' (Fig. 10.38) | 'diff' (Fig. 10.41) | 'lp1' | 'lp2' | 'hp1' | 'hp2' | 'bp'
   (Figs. 11.31–11.34) | 'p14' (Fig. 10.73, three op-amps). Every grounded point carries a ground symbol (spec.grounds; the points are joined by
   hidden wires). OP.plot is a plain x–y graph (linear or log x), OP.Rec records a transient over a fixed window, OP.sweep / OP.xfer sweep the engine
   in frequency / input voltage, OP.explorer wires a section A, OP.DEF holds the problems: modes, ex1021, ex1022 (7.1) · ex105, ex106, p2, p7,
   follower (7.2) · ex107a, ex107b, p9, p14 (7.3) · f1039, p10, sumint, diff (7.4) · ex1112, ex1113, ex1114 (7.5) */
(function (global) {
'use strict';
const OP = {}, fd = CH6.fd, R = String.raw, C = IE.COL, T = CH6.text, COL = CH6.COL, Cx = CK.Cx, TAU = 2 * Math.PI, PURPLE = '#c792ea';
const t = (th, en) => MC.t(th, en), tt = p => IE.tt(p);
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o }), hid = (a, b) => ({ type: 'W', a, b, hidden: true, noDots: true });
const u3 = (x, n = 3) => LS.u(x, n), sigf = x => u3(x, x >= 100 ? 1 : x >= 10 ? 2 : 3);   // three decimals below 10, fewer above
/* voltages and currents written the way the book does: 2 V, 500 mV, 45.8 mV, 20 µA */
const vtx = v => { const a = Math.abs(v) * (1 + 1e-9), s = v < 0 ? '−' : ''; return a >= 1 ? `${s}${sigf(a)} V` : a >= 1e-3 ? `${s}${sigf(a * 1e3)} mV` : a >= 1e-6 ? `${s}${sigf(a * 1e6)} µV` : '0 V'; };
const itx = i => { const a = Math.abs(i) * (1 + 1e-9), s = i < 0 ? '−' : ''; return a >= 1e-3 ? `${s}${sigf(a * 1e3)} mA` : a >= 1e-6 ? `${s}${sigf(a * 1e6)} µA` : a >= 1e-9 ? `${s}${sigf(a * 1e9)} nA` : '0 A'; };
const kO = r => CK.eng(r, 'Ω'), uF = c => `${u3(c * 1e6, 4)} µF`, dB = x => 20 * Math.log10(Math.max(x, 1e-12));
const fHz = f => (f >= 1e6 ? `${u3(f / 1e6, 3)} MHz` : f >= 1e3 ? `${u3(f / 1e3, 3)} kHz` : `${u3(f, 3)} Hz`);
const bdg = (th, en, ok = true) => [[th, en ?? th], ok === true ? 'ok' : ok === false ? 'wait' : ok];
const LAY = { ...CH5.LAY, cktAspM: 0.58, rowAsp: 0.66, rowMin: 270 }, LAYT = { ...LAY, rowAsp: 0.5, rowMin: 230 };
const VSAT = CK.OPAMP.VSAT;
const STATE = { lin: [t('ย่านเชิงเส้น', 'linear'), 'ok'], 'sat+': [t('อิ่มตัวที่ราง +V_sat', 'saturated at +V_sat'), 'wait'], 'sat−': [t('อิ่มตัวที่ราง −V_sat', 'saturated at −V_sat'), 'wait'] };
OP.LAY = LAY; OP.vtx = vtx; OP.itx = itx; OP.uF = uF; OP.fHz = fHz; OP.dB = dB; OP.STATE = STATE;

/* =====================================================================================================================
   1) the circuits. Grid: the op-amp's inputs on x = 4 (y = 1.4 and 2.6), its output lead ends at O = (6.2, 2), the output node o = (7.4, 2);
   the feedback part lies on the rail y = 0 (inverting family) or under the body (noninverting family); ground symbols at y = 3.4–4.8 */
const res = (id, a, b, r, name, o = {}) => ({ id, type: 'R', a, b, value: r, name, valText: kO(r), ...o });
const cap = (id, a, b, c, name, o = {}) => ({ id, type: 'C', a, b, value: c, name, valText: uF(c), ...o });
const src = (id, a, b, v, name, o = {}) => { const neg = v < 0; return { id, type: 'V', a: neg ? b : a, b: neg ? a : b, value: Math.abs(v), name, valText: vtx(v), ...o }; };   // a negative source is turned round (the + sign stays honest)
const sig = (id, a, b, name, o) => ({ id, type: 'V', a, b, value: 0, wave: o.wave || 'square', fn: o.fn, name, valText: o.valText ?? '', ...(o.part || {}) });   // a signal source for a transient: fn(t)
const vac = (id, a, b, amp, name, o = {}) => ({ id, type: 'VAC', a, b, amp, name, valText: `${u3(amp, 3)} V`, ...o });
const oa = (P, N, O, o = {}) => ({ id: o.id || 'A', type: 'OA', P, N, O, gain: o.gain, vsat: o.vsat, gc: o.gc, name: o.aName ?? '', valText: o.aText ?? '', label: (o.aName ?? o.aText) !== undefined ? undefined : false });
const load = (sp, o, gy) => { sp.nodes._padR = [sp.nodes.o[0] + 1.3, sp.nodes.o[1]];   // room for the "V_o = …" tag beside the output node (the view fits every node, this one is not drawn)
  if (!o.RL) return; sp.nodes.lg = [sp.nodes.o[0], gy]; sp.parts.push(res('RL', 'o', 'lg', o.RL, 'R_L'), hid('lg', 'g')); sp.grounds.push('lg'); };

/* two sources into the two inputs (Figs. 10.2–10.3, 10.52): V_i1 to +, V_i2 to −, a load at the output; a null source is a wire to ground */
const kPair = o => {
  const nodes = { s1: [0.8, 1.4], g: [0.8, 4], s2: [2.6, 2.6], g2: [2.6, 4], P: [4, 1.4], N: [4, 2.6], O: [6.2, 2], o: [7.4, 2], lg: [7.4, 4] }, parts = [], sp = { ground: 'g', nodes, parts, grounds: ['g', 'g2', 'lg'], mode: 'dc' };
  parts.push(o.V1 === null ? W_('s1', 'g') : src('V1', 's1', 'g', o.V1, 'V_i1', { side: -1 }), W_('s1', 'P'), o.V2 === null ? W_('s2', 'g2') : src('V2', 's2', 'g2', o.V2, 'V_i2'), W_('s2', 'N'), hid('g2', 'g'));
  parts.push(oa('P', 'N', 'O', { aName: 'A_d', aText: u3(o.gain ?? CK.OPAMP.A, 4), ...o }), W_('O', 'o'), res('RL', 'o', 'lg', o.RL || 1e4, 'R_L'), hid('lg', 'g'));
  nodes._padR = [8.7, 2]; return sp; };
/* the inverting family (Figs. 10.34, 10.38, 10.41): − input on top, + grounded; R_1 (or C) from the source, R_f (or C) on the rail */
const kInv = o => {
  const nodes = { s: [0.8, 1.4], sg: [0.8, 3.4], N: [4, 1.4], P: [4, 2.6], g: [4, 3.4], nf: [4, 0], of: [6.2, 0], O: [6.2, 2], o: [7.4, 2] }, parts = [], sp = { ground: 'g', nodes, parts, grounds: ['g', 'sg'], mode: o.mode || 'dc', w: o.w };
  parts.push(o.sig ? sig('V1', 's', 'sg', o.vName || 'v_1', o.sig) : o.ac ? vac('V1', 's', 'sg', o.amp ?? 1, o.vName || 'V_1') : src('V1', 's', 'sg', o.V1 ?? 0, o.vName || 'V_1'));
  parts.push(o.kind === 'diff' ? cap('C', 's', 'N', o.C, 'C') : res('R1', 's', 'N', o.R1, o.r1Name || 'R_1'));
  parts.push(W_('N', 'nf'), o.kind === 'integ' ? cap('C', 'nf', 'of', o.C, 'C') : res('Rf', 'nf', 'of', o.Rf, o.rfName || 'R_f'), W_('of', 'O'), W_('P', 'g'), oa('P', 'N', 'O', o), W_('O', 'o'), hid('sg', 'g'));
  load(sp, o, 3.4); return sp; };
/* the noninverting amplifier (Fig. 10.35a) and the unity follower (Fig. 10.36a): + input on top fed by the source (through R_s if given), the feedback under the body */
const kNon = o => {
  const fol = o.kind === 'follower', nodes = { s: [0.8, 1.4], g: [0.8, 3.4], P: [4, 1.4], N: [4, 2.6], nb: [4, 3.4], ob: [6.2, 3.4], O: [6.2, 2], o: [7.4, 2] }, parts = [], sp = { ground: 'g', nodes, parts, grounds: ['g'], mode: o.mode || 'dc', w: o.w };
  parts.push(o.ac ? vac('V1', 's', 'g', o.amp ?? 1, o.vName || 'V_1') : src('V1', 's', 'g', o.V1 ?? 0, o.vName || 'V_1'));
  if (o.Rs) { nodes.sr = [2.4, 1.4]; parts.push(res('Rs', 's', 'sr', o.Rs, 'R_s'), W_('sr', 'P')); } else parts.push(W_('s', 'P'));
  parts.push(W_('N', 'nb'));
  if (fol) parts.push(W_('nb', 'ob')); else { nodes.r1g = [4, 4.8]; sp.grounds.push('r1g'); parts.push(res('R1', 'nb', 'r1g', o.R1, 'R_1', { side: -1 }), hid('r1g', 'g'), res('Rf', 'nb', 'ob', o.Rf, 'R_f', { side: -1 })); }
  parts.push(W_('ob', 'O'), oa('P', 'N', 'O', o), W_('O', 'o'));
  load(sp, o, fol ? 3.4 : 4.8); return sp; };
/* the summing amplifier (Fig. 10.37a): n inputs on rows 1.2 apart (V_1 at the top), each a source and its resistor, joined down a column into the − input; R_f on the rail above */
const kSum = o => {
  const n = o.V.length, ys = [1.4, -0.5, -2.4].slice(0, n), rail = ys[n - 1] - 0.8;   // rows 1.9 apart: room for the two-line labels above each row (at 1.2 the labels crowded each other on a phone)
  const nodes = { N: [4, 1.4], P: [4, 2.6], g: [4, 3.4], nf: [4, rail], of: [6.2, rail], O: [6.2, 2], o: [7.4, 2], sg: [0.8, 3.4] }, parts = [], sp = { ground: 'g', nodes, parts, grounds: ['g', 'sg'], mode: 'dc' };
  o.V.forEach((v, k) => { const i = k + 1, y = ys[n - 1 - k]; nodes['g' + i] = [0.2, y]; nodes['s' + i] = [1.6, y]; nodes['r' + i] = [3.4, y]; nodes['j' + i] = [3.7, y];
    parts.push(src('V' + i, 's' + i, 'g' + i, v, `V_${i}`, { side: 1, stack: true }), res('R' + i, 's' + i, 'r' + i, o.R[k], `R_${i}`, { stack: true }), W_('r' + i, 'j' + i), W_('j' + i, i < n ? 'j' + (i + 1) : 'N'), W_('g' + i, i < n ? 'g' + (i + 1) : 'sg')); });   // two-line labels above each row: narrow enough to sit side by side on a phone
  nodes.sg = [0.2, 3.4];
  parts.push(W_('N', 'nf'), res('Rf', 'nf', 'of', o.Rf, 'R_f'), W_('of', 'O'), W_('P', 'g'), oa('P', 'N', 'O', o), W_('O', 'o'), hid('sg', 'g'));
  load(sp, o, 3.4); return sp; };
/* one active-filter stage (Figs. 11.31–11.33): the RC section(s) feed the + input; R_G (to ground) and R_F (to the output) share the rail above the − input.
   dx shifts the stage, ids name its parts, inNode feeds it from an earlier stage instead of a source */
const kFilt = (o, dx = 0, ids = {}, inNode = null) => {
  const kind = o.kind, two = kind === 'lp2' || kind === 'hp2', lp = kind.startsWith('lp'), X = x => x + dx, sfx = ids.sfx || '';
  const gN = sfx ? 'rg' + sfx : 'g', nf = 'nf' + sfx, of = 'of' + sfx, N = 'N' + sfx, P = 'P' + sfx, O = 'O' + sfx;
  const nodes = { [gN]: [X(2.0), 0], [nf]: [X(4), 0], [of]: [X(6.2), 0], [N]: [X(4), 1.4], [P]: [X(4), 2.6], [O]: [X(6.2), 2] }, parts = [], grounds = [gN];   // R_G from x = 2.0: its label clears R_F's
  if (sfx) parts.push(hid(gN, 'g'));
  const x0 = two ? -1.0 : 0.8, sN = inNode || ('s' + sfx);   // two sections: the source moves left so that the first shunt part's label clears the source
  if (!inNode) { nodes[sN] = [X(x0), 2.6]; nodes['sg' + sfx] = [X(x0), 4]; parts.push(vac('V1', sN, 'sg' + sfx, o.amp ?? 1, 'V_1', { side: two ? -1 : 1 }), hid('sg' + sfx, 'g')); grounds.push('sg' + sfx); }
  /* labels of two sections: series 1 above, shunt 1 on the left, series 2 below, shunt 2 on the right (and the source on the left), so that none collide */
  const sec = (a, b, gnode, r, c, rn, cn, rid, cid, sSer = 1, sSh = 1) => { const so = { side: sSer, stack: two }; if (lp) parts.push(res(rid, a, b, r, rn, so), cap(cid, b, gnode, c, cn, { side: sSh })); else parts.push(cap(cid, a, b, c, cn, so), res(rid, b, gnode, r, rn, { side: sSh })); };   // stack: two-line labels fit between the shunt parts
  const p1 = 'p1' + sfx, c1g = 'c1g' + sfx; nodes[p1] = [X(two ? 1.2 : 3.2), 2.6]; nodes[c1g] = [nodes[p1][0], 4]; grounds.push(c1g); parts.push(hid(c1g, 'g'));
  sec(sN, p1, c1g, o.R1, o.C1, ids.rn || 'R_1', ids.cn || 'C_1', ids.r || 'R1', ids.c || 'C1', 1, two ? -1 : 1);
  let last = p1; if (two) { const p2 = 'p2' + sfx, c2g = 'c2g' + sfx; nodes[p2] = [X(3.2), 2.6]; nodes[c2g] = [X(3.2), 4]; grounds.push(c2g); parts.push(hid(c2g, 'g')); sec(p1, p2, c2g, o.R2, o.C2, 'R_2', 'C_2', 'R2', 'C2', -1, 1); last = p2; }
  parts.push(W_(last, P), res(ids.rg || 'RG', gN, nf, o.RG, 'R_G', { stack: true }), W_(nf, N), res(ids.rf || 'RF', nf, of, o.RF, 'R_F', { stack: true }), W_(of, O), oa(P, N, O, { ...o, id: ids.a || 'A' }));
  return { nodes, parts, grounds }; };
const kFilter = o => { const f = kFilt(o); f.nodes.o = [7.4, 2]; f.parts.push(W_('O', 'o')); const sp = { ground: 'g', nodes: f.nodes, parts: f.parts, grounds: f.grounds, mode: o.mode || 'ac', w: o.w || TAU * (o.f || 1000) }; load(sp, o, 4); return sp; };
/* the bandpass filter of Fig. 11.34: a first-order high-pass stage into a first-order low-pass stage */
const kBP = o => {
  const s1 = kFilt({ ...o, kind: 'hp1' }), s2 = kFilt({ ...o, kind: 'lp1', R1: o.R2, C1: o.C2, RG: o.RG2 ?? o.RG, RF: o.RF2 ?? o.RF }, 6.6, { sfx: '2', r: 'R2', c: 'C2', rn: 'R_2', cn: 'C_2', rg: 'RG2', rf: 'RF2', a: 'A2' }, 'm');
  const nodes = { ...s1.nodes, ...s2.nodes, m: [7.4, 2.6], o: [14, 2] }, parts = [...s1.parts, W_('O', 'm', { pts: [[7.4, 2]] }), ...s2.parts, W_('O2', 'o')];
  const sp = { ground: 'g', nodes, parts, grounds: [...s1.grounds, ...s2.grounds], mode: o.mode || 'ac', w: o.w || TAU * (o.f || 1000) }; load(sp, o, 4); return sp; };
/* Problem 14 (Fig. 10.73, slide p. 24): a noninverting stage (400 kΩ / 20 kΩ) and a follower on one 0.1 V source, summed by a third op-amp (20 kΩ, 10 kΩ, R_f = 100 kΩ) */
const kP14 = o => {
  const nodes = { s: [0, 2.2], g: [0, 3.4], PA: [2.4, 0], NA: [2.4, 1.2], nbA: [2.4, 2.0], gA: [2.4, 3.2], obA: [4.6, 2.0], OA: [4.6, 0.6], PB: [2.4, 4.4], NB: [2.4, 5.6], nbB: [2.4, 6.2], obB: [4.6, 6.2], OB: [4.6, 5.0],
    ra: [5.8, 0.6], j1: [7.4, 0.6], rb: [5.8, 5.0], j2: [7.4, 5.0], jn: [7.4, 2.2], NS: [8.2, 2.2], PS: [8.2, 3.4], gS: [8.2, 4.2], nfS: [8.2, -0.6], ofS: [10.4, -0.6], OS: [10.4, 2.8], o: [11.6, 2.8], _padL: [-1.6, 2.2] };   // _padL: room for the source's label on the left
  const parts = [src('V1', 's', 'g', o.V1 ?? 0.1, 'V_1', { side: -1 }), W_('s', 'PA', { pts: [[0, 0]] }), W_('s', 'PB', { pts: [[-0.7, 2.2], [-0.7, 4.4]] }),
    W_('NA', 'nbA'), res('R1A', 'nbA', 'gA', o.R1A ?? 20e3, '', { side: -1 }), hid('gA', 'g'), res('RfA', 'nbA', 'obA', o.RfA ?? 400e3, '', { side: -1 }), W_('obA', 'OA'), oa('PA', 'NA', 'OA', { id: 'A1', aName: 'A_1' }),
    W_('NB', 'nbB'), W_('nbB', 'obB'), W_('obB', 'OB'), oa('PB', 'NB', 'OB', { id: 'A2', aName: 'A_2' }),
    W_('OA', 'ra'), res('Ra', 'ra', 'j1', o.Ra ?? 20e3, ''), W_('j1', 'jn'), W_('OB', 'rb'), res('Rb', 'rb', 'j2', o.Rb ?? 10e3, '', { side: -1 }), W_('j2', 'jn'), W_('jn', 'NS'),
    W_('NS', 'nfS'), res('Rf', 'nfS', 'ofS', o.Rf ?? 100e3, 'R_f'), W_('ofS', 'OS'), W_('PS', 'gS'), hid('gS', 'g'), oa('PS', 'NS', 'OS', { id: 'A3', aName: 'A_3' }), W_('OS', 'o')];
  return { ground: 'g', nodes, parts, grounds: ['g', 'gA', 'gS'], mode: 'dc' }; };
OP.ckt = o => { switch (o.kind) { case 'pair': return kPair(o); case 'inv': case 'integ': case 'diff': return kInv(o); case 'noninv': case 'follower': return kNon(o); case 'sum': return kSum(o);
  case 'lp1': case 'lp2': case 'hp1': case 'hp2': return kFilter(o); case 'bp': return kBP(o); case 'p14': return kP14(o); default: throw new Error('OP.ckt: ' + o.kind); } };
/* the readout of a solved circuit: circuit.OA plus the output voltage and the state */
OP.z = (c, id = 'A') => { const a = c.OA(id); return { ...a, st: STATE[a.state] }; };
/* a voltage tag beside a node: text at node + (dx, dy) grid units */
OP.tag = (v, node, text, col, dx = 0.15, dy = -0.45, align = 'left') => { const [x, y] = v.P(node); CH6.tag(v.ctx, tt(text), x + v.u * dx, y + v.u * dy, col || C.q, { align, size: Math.max(11.5, v.u * 0.26) }); };
/* the usual tags of a solved op-amp circuit: V_o at the output node and, for the inverting family, ≈ 0 V at the − input (virtual ground) */
OP.tags = (v, c, o = {}) => { if (!c.result) return; const z = OP.z(c, o.id || 'A'), oN = o.out || 'o', nN = o.vg;
  OP.tag(v, oN, `V_o = ${vtx(z.vo)}`, z.state === 'lin' ? C.q : C.red, 0.1, -0.42);
  if (nN) OP.tag(v, nN, o.vgText ?? 'V_− ≈ 0', C.tan, -0.2, 0.5, 'right'); };   // under the lead into the − input, clear of the resistor's label above it (the exact value is in the badge and the tooltip)

/* =====================================================================================================================
   2) graphs. OP.plot: a plain x–y graph (linear or log x). o = { x: [x0, x1], y: [y0, y1], logx, xt, yt, xf(x), yf(y) (tick text), xl, yl, title,
   curves: [{ f(x) | pts: [[x, y]], color, w, dash, label, labelAt, n }], hl: [{ y, label, color, dash }], vl: [{ x, label, color, dash, top }],
   pts: [{ x, y, label, color, side, dy, r }], guides: [{ x, y, color }], note } → { X, Y, L, R, Tp, Bt } */
OP.plot = (ctx, b, o = {}) => {
  CH6.bg(ctx, b); const [x0, x1] = o.x, [y0, y1] = o.y, lg = !!o.logx, ml = o.ml ?? 46, mr = o.mr ?? 14, L = b.x + ml, Rr = b.x + b.w - mr, Tp = b.y + (o.title ? 30 : 12) + 12, Bt = b.y + b.h - (o.xl ? 40 : 28);
  const lx = x => (lg ? Math.log10(Math.max(x, 1e-30)) : x), X = x => L + (Rr - L) * (lx(x) - lx(x0)) / (lx(x1) - lx(x0)), Y = y => Bt - (Bt - Tp) * (y - y0) / (y1 - y0);
  const xf = o.xf || (lg ? (x => fHz(x)) : (x => IE.num(x, 3))), yf = o.yf || (y => IE.num(y, 2)), xt = o.xt || [], yt = o.yt || [];
  ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = COL.grid;
  if (lg) { for (let d = Math.floor(lx(x0)); d <= Math.ceil(lx(x1)); d++) for (let m = 2; m < 10; m++) { const x = m * Math.pow(10, d); if (x > x0 && x < x1) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(X(x), Tp); ctx.lineTo(X(x), Bt); ctx.stroke(); ctx.globalAlpha = 1; } } }
  xt.forEach(x => { ctx.beginPath(); ctx.moveTo(X(x), Tp); ctx.lineTo(X(x), Bt); ctx.stroke(); }); yt.forEach(y => { ctx.beginPath(); ctx.moveTo(L, Y(y)); ctx.lineTo(Rr, Y(y)); ctx.stroke(); });
  ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5; ctx.beginPath(); const yAx = y0 < 0 && y1 > 0 ? Y(0) : Bt, xAx = !lg && x0 < 0 && x1 > 0 ? X(0) : L;
  ctx.moveTo(L, yAx); ctx.lineTo(Rr, yAx); ctx.moveTo(xAx, Tp - 4); ctx.lineTo(xAx, Bt); ctx.stroke(); ctx.restore();
  let lastX = -1e9; xt.forEach(x => { const s = xf(x), w = CH8.textW(ctx, s, 11.5), px = X(x); if (px - w / 2 < lastX + 6) return; T(ctx, s, px, Bt + 13, { color: COL.muted, size: 11.5 }); lastX = px + w / 2; });
  yt.forEach(y => { if (Math.abs(y) < 1e-12 && y0 < 0) return; T(ctx, yf(y), L - 6, Y(y), { align: 'right', color: COL.muted, size: 11.5 }); });
  if (y0 < 0 && y1 > 0) T(ctx, '0', L - 6, Y(0), { align: 'right', color: COL.muted, size: 11.5 });
  if (o.xl) T(ctx, tt(o.xl), Rr, Bt + 28, { align: 'right', color: COL.ink, size: 12.5, weight: '600' }); if (o.yl) T(ctx, tt(o.yl), L + 4, Tp - 8, { align: 'left', color: COL.ink, size: 12.5, weight: '600' });
  ctx.save(); ctx.beginPath(); ctx.rect(L - 2, Tp - 6, Rr - L + 4, Bt - Tp + 8); ctx.clip();
  (o.hl || []).forEach(h => { ctx.save(); ctx.strokeStyle = h.color || C.guide; ctx.lineWidth = h.w || 1.3; ctx.setLineDash(h.dash || [6, 5]); ctx.beginPath(); ctx.moveTo(L, Y(h.y)); ctx.lineTo(Rr, Y(h.y)); ctx.stroke(); ctx.restore(); });
  (o.vl || []).forEach(q => { ctx.save(); ctx.strokeStyle = q.color || C.guide; ctx.lineWidth = q.w || 1.3; ctx.setLineDash(q.dash || [6, 5]); ctx.beginPath(); ctx.moveTo(X(q.x), Tp); ctx.lineTo(X(q.x), Bt); ctx.stroke(); ctx.restore(); });
  (o.curves || []).forEach(c => { ctx.save(); ctx.strokeStyle = c.color || C.curve; ctx.lineWidth = c.w || 2.6; ctx.lineJoin = 'round'; if (c.dash) ctx.setLineDash(c.dash); ctx.beginPath(); let pen = false;
    const put = (x, y) => { if (!isFinite(y) || !isFinite(x)) { pen = false; return; } const py = Math.max(Tp - 40, Math.min(Bt + 40, Y(y))); if (pen) ctx.lineTo(X(x), py); else { ctx.moveTo(X(x), py); pen = true; } };
    if (c.pts) c.pts.forEach(([x, y]) => put(x, y)); else { const N = c.n || 240; for (let j = 0; j <= N; j++) { const x = lg ? x0 * Math.pow(x1 / x0, j / N) : x0 + (x1 - x0) * j / N; put(x, c.f(x)); } }
    ctx.stroke(); ctx.restore(); });
  ctx.restore();
  (o.hl || []).forEach(h => { if (h.label) CH8.lab(ctx, tt(h.label), h.left ? L + 4 : Rr - 4, Y(h.y) - 9, h.left ? 'left' : 'right', h.color || COL.muted, 11.5, b, '600'); });
  (o.vl || []).forEach(q => { if (q.label) CH8.lab(ctx, tt(q.label), X(q.x) + 5, q.top ? Tp + 4 : Bt - 10, 'left', q.color || COL.muted, 11.5, b, '600'); });
  (o.curves || []).forEach(c => { if (!c.label) return; let x = c.labelAt ?? (lg ? Math.sqrt(x0 * x1) : x0 + (x1 - x0) * 0.8), y; if (c.pts) { const p = c.pts[Math.min(c.pts.length - 1, Math.floor(c.pts.length * 0.8))]; if (!p) return; x = p[0]; y = p[1]; } else y = c.f(x);
    if (!isFinite(y)) return; CH8.lab(ctx, tt(c.label), X(x) + 8, Y(Math.max(y0, Math.min(y1, y))) - 10, 'left', c.color || C.curve, 12, b); });
  (o.guides || []).forEach(g => { ctx.save(); ctx.strokeStyle = g.color || C.guide; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(g.x), Y(g.y)); ctx.lineTo(xAx, Y(g.y)); ctx.moveTo(X(g.x), Y(g.y)); ctx.lineTo(X(g.x), yAx); ctx.stroke(); ctx.restore(); });
  (o.pts || []).forEach(p => { if (!isFinite(p.y)) return; const px = X(p.x), py = Y(Math.max(y0, Math.min(y1, p.y))), col = p.color || C.q; ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = '#0f1220'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, p.r || 6.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    if (p.label) { const right = p.side ? p.side < 0 : px > b.x + b.w * 0.6; CH6.tag(ctx, tt(p.label), right ? px - 11 : px + 11, py - (p.dy ?? 16), col, { align: right ? 'right' : 'left', size: 12 }); } });
  if (o.title) T(ctx, tt(o.title), b.x + 10, b.y + 15, { align: 'left', color: COL.muted, size: 13 });
  if (o.note) CH8.lab(ctx, tt(o.note), Rr - 4, Tp + 4, 'right', COL.muted, 11.5, b, '600');
  return { X, Y, L, R: Rr, Tp, Bt };
};
/* the transfer characteristic V_o against V_1 from the engine: specOf(v1) → spec; n solves between v0 and v1 → [[v1, vo]] */
OP.xfer = (specOf, v0, v1, n = 61, id = 'A') => { const out = []; for (let k = 0; k < n; k++) { const v = v0 + (v1 - v0) * k / (n - 1), c = new CK.Circuit(specOf(v)); c.solve(); out.push([v, c.OA(id).vo]); } return out; };
/* the frequency response |V_o| at the output node from the engine in AC mode: specOf(f) → spec; n log-spaced solves → [[f, |V_o|]] */
OP.sweep = (specOf, f0, f1, n = 61, node = 'o') => { const out = []; for (let k = 0; k < n; k++) { const f = f0 * Math.pow(f1 / f0, k / (n - 1)), c = new CK.Circuit({ ...specOf(f), mode: 'ac', w: TAU * f }); c.solve(); out.push([f, Cx.abs(c.V(node))]); } return out; };
/* the frequency at which a sweep falls to `level` (searched from the passband end toward `from`: 'lo' searches upward, 'hi' downward) */
OP.at = (sw, level, from = 'hi', specOf = null, node = 'o') => { const s = from === 'hi' ? sw.slice().reverse() : sw;
  for (let k = 1; k < s.length; k++) { const [f0, g0] = s[k - 1], [f1, g1] = s[k]; if ((g0 - level) * (g1 - level) <= 0 && g0 !== g1) {
    if (!specOf) return f0 * Math.pow(f1 / f0, (level - g0) / (g1 - g0));
    let a = f0, b = f1, ga = g0;   // refine by bisection on the engine (25 solves)
    for (let j = 0; j < 25; j++) { const m = Math.sqrt(a * b), c = new CK.Circuit({ ...specOf(m), mode: 'ac', w: TAU * m }); c.solve(); const gm = Cx.abs(c.V(node)); if ((ga - level) * (gm - level) <= 0) b = m; else { a = m; ga = gm; } }
    return Math.sqrt(a * b); } } return NaN; };

/* =====================================================================================================================
   3) a transient over a fixed window of Tw seconds in N steps, played back over `slow` real seconds and repeated (after a short hold).
   outs: { key: c => value }; pts(key) → [[t, v]] of the samples so far; t = the recorded time */
OP.Rec = class {
  constructor(Tw, N, outs, slow) { this.Tw = Tw; this.N = N; this.h = Tw / N; this.outs = outs; this.slow = slow ?? Tw; this.c = null; this.i = 0; this.acc = 0; this.hold = 0; this.buf = {}; }
  sync(c) { if (c === this.c) return; this.c = c; this.restart(); }
  restart() { this.i = 0; this.acc = 0; this.hold = 0; this.buf = {}; Object.keys(this.outs).forEach(k => { this.buf[k] = new Float64Array(this.N + 1).fill(NaN); });
    if (this.onRestart) this.onRestart(this);   // the page's own state (a flip-flop, a counter) starts over with the circuit
    if (this.c) { this.c.t = 0; this.c.parts.forEach(p => { if (p.type === 'C') p.vc = p.v0 || 0; if (p.type === 'L') p.il = p.i0 || 0; if (p.type === 'OA') { p.vd = 0; p.vc = 0; } }); this.c.solve(this.h); this.sample(); } }
  sample() { const j = this.i; Object.keys(this.outs).forEach(k => { this.buf[k][j] = this.outs[k](this.c); }); }
  run(c, dt) { if (!c) return; this.sync(c); if (this.i >= this.N) { this.hold += dt; if (this.hold > 1.6) this.restart(); return; }
    this.acc += dt * this.Tw / this.slow; let n = 0; while (this.acc >= this.h && n++ < 400 && this.i < this.N) { this.acc -= this.h; if (this.ctl) this.ctl(this.c, this.t, this); this.c.step(this.h); this.i++; this.sample(); } }   // ctl(c, t, rec): a controller run before each step (switches, flip-flops)
  get t() { return this.i * this.h; }
  pts(k) { const out = [], arr = this.buf[k]; if (!arr) return out; for (let j = 0; j <= this.i; j++) out.push([j * this.h, arr[j]]); return out; }
  last(k) { return this.buf[k] ? this.buf[k][this.i] : NaN; }
};
/* the time plot of a recorder: sigs [{ key, color, label, w, dash }], y range, ms (time axis in ms), hl / vl / pts as OP.plot, mark (text at the cursor) */
OP.timePlot = (ctx, b, rec, o = {}) => { const us = !!o.us, ms = !us && !!o.ms, s = us ? 1e6 : ms ? 1e3 : 1, sh = !!o.short;   // us: microsecond axis (the 566 runs at tens of kHz)
  const curves = (o.sigs || []).map(q => ({ pts: rec.pts(q.key).map(([x, y]) => [x * s, y]), color: q.color, w: q.w || 2.4, dash: q.dash, label: sh ? '' : q.label }));
  const vals = (o.sigs || []).filter(q => q.label).map(q => { const v = rec.last(q.key); return { s: `${q.label} = ${isFinite(v) ? IE.num(v, Math.abs(v) >= 10 ? 1 : 2) : '–'} V`, color: q.color }; });
  const Tw = rec.Tw * s, xt = o.xt || [0.25, 0.5, 0.75, 1].map(f => +(Tw * f).toPrecision(3));
  const g = OP.plot(ctx, b, { x: [0, Tw], y: o.y || [-15, 15], xt, yt: o.yt || [-10, -5, 0, 5, 10], xf: o.xf || (x => IE.num(x, 2)), yf: o.yf, xl: o.xl ?? (us ? 't (µs)' : ms ? 't (ms)' : 't (s)'), yl: o.yl ?? 'V', title: o.title, curves, hl: o.hl, pts: o.pts, note: o.note,
    vl: [{ x: rec.t * s, color: 'rgba(232,236,247,.45)', dash: [2, 3] }].concat(o.vl || []) });
  let lx = b.x + b.w - 10; vals.reverse().forEach(v => { const w = CH8.textW(ctx, v.s, 12.5, '600'); if (lx - w < b.x + (o.title ? CH8.textW(ctx, tt(o.title), 13) + 24 : 10)) return; T(ctx, v.s, lx, b.y + 15, { align: 'right', color: v.color, size: 12.5, weight: '600' }); lx -= w + 16; });
  return g; };

/* =====================================================================================================================
   4) the explorers of sections A. o = { init, title, controls(panel, S, build), spec(S) → spec, onBuild(c, S), side(ctx, box, board, ckt, S),
   waves: [(ctx, box, board, ckt, S)], badge(ckt, S) → [text, kind], rows(ckt, S), text(ckt, S), after(view, ckt, S), tick(dt, ckt, S, show), vo(S),
   layout: { cktAspM, rowAsp, rowMin } } → { B, S, build, show } */
OP.explorer = o => {
  const $ = id => document.getElementById(id), ui = MC.ui, S = { ...o.init }, L = o.layout || {}, ID = Object.assign({ cv: 'cvA', panel: 'pA', text: 'wA' }, o.ids || {});   // ids: a second explorer on a page (section B)
  const B = new CH8.Board(ID.cv, { T: 4, mid: true, midMin: 420, cktAspM: L.cktAspM ?? 0.55, cktAspN: L.cktAspN, rowAsp: L.rowAsp ?? 0.66, rowMin: L.rowMin ?? 270, pad: 1.2, wideAt: 1e9, dotSpeed: 80, shortSpec: sp => CH8.margins(sp, 1.2),
    view: { acPeak: true, minV: 7, glowColor: 'rgba(255,126,182,.4)' },
    side: o.side ? (ctx, b, bd) => { if (B.ckt) o.side(ctx, b, bd, B.ckt, S); } : undefined,
    waves: (o.waves || []).map(w => ({ draw: (ctx, b, bd) => { if (B.ckt) w(ctx, b, bd, B.ckt, S); } })),
    after: v => { if (o.after && B.ckt) o.after(v, B.ckt, S); },
    badge: () => (B.ckt && o.badge ? o.badge(B.ckt, S) : null) });
  const pA = $(ID.panel), mA_ = document.createElement('div'); mA_.className = 'metrics';
  if (o.title) ui.h2(pA, o.title);
  const show = () => { if (!B.ckt) return; if (o.rows) mA_.innerHTML = ui.kv(o.rows(B.ckt, S)); if ($(ID.text) && o.text) { $(ID.text).innerHTML = `<div class="answer">${o.text(B.ckt, S)}</div>`; MC.renderMath($(ID.text)); } };
  const build = () => { B.set(o.spec(S), o.vo ? o.vo(S) : {}); if (o.onBuild) o.onBuild(B.ckt, S); show(); };
  o.controls(pA, S, build); pA.appendChild(mA_);
  B.resize(); build(); window.addEventListener('resize', () => B.resize()); LS.anim($(ID.cv), dt => { if (o.tick && B.ckt) o.tick(dt, B.ckt, S, show); B.frame(dt); });
  return { B, S, build, show };
};
/* a log-scaled slider for a resistor or a capacitor: value rounded to `rnd` */
OP.logSlider = (p, id, label, lo, hi, get, set, build, fmt, rnd) => MC.ui.slider(p, { id, label, min: Math.log10(lo), max: Math.log10(hi), step: 0.01, value: Math.log10(Math.max(get(), lo)), fmt: () => fmt(get()),
  oninput: v => { let x = Math.pow(10, v); if (rnd) x = rnd(x); set(x); build(); } });
OP.rndR = x => { const d = Math.pow(10, Math.floor(Math.log10(x))); return Math.round(x / d * 10) / 10 * d; };   // two significant digits
/* bars of the terms of an output voltage: items [{ label, v, color, sub }] */
OP.vbars = (ctx, b, items, o = {}) => CH8.bars(ctx, b, items, { title: o.title, fmt: v => vtx(v), sub: !o.short, max: o.max });

/* =====================================================================================================================
   5) the problems */
const DEF = {}, SP = {};
const spec = (key, o) => SP[key] || (SP[key] = OP.ckt(o));   // one spec object per variant (CH8.Prob rebuilds only when the object changes)
const z = (c, id) => OP.z(c, id);
const VG = t('กราวด์เสมือน', 'virtual ground');

/* ---------------- page 7.1: modes of operation, CMRR (slides I pp. 3–13; Examples 10.21–10.22) ---------------- */
const AD21 = 8000, AC21 = 12;   // the op-amp measured in Example 10.21
const M = [{ V1: 1e-3, V2: null }, { V1: null, V2: 1e-3 }, { V1: 0.5e-3, V2: -0.5e-3 }, { V1: 1e-3, V2: 1e-3 }].map((v, k) => ({ kind: 'pair', gain: AD21, gc: AC21, ...v }));
const sideBars = (ctx, b, bd, c, title) => { const a = z(c), Ad = c.byId.A.gain, Ac = c.byId.A.gc || 0;
  OP.vbars(ctx, b, [{ label: 'A_d V_d', v: Ad * a.vd, color: C.q, sub: `${vtx(a.vd)} × ${u3(Ad, 4)}` }, { label: 'A_c V_c', v: Ac * a.vc, color: PURPLE, sub: `${vtx(a.vc)} × ${u3(Ac, 4)}` }, { label: 'V_o', v: a.vo, color: C.curve, sub: a.st[0] }], { title: bd.short ? '' : title, short: bd.short, max: Math.max(Math.abs(a.vo) * 1.15, 1e-3) }); };
DEF.modes = { ...LAY, solvedAt: 1, spec: k => spec('modes_' + Math.max(0, Math.min(k, 4) - 1), M[Math.max(0, Math.min(k, 4) - 1)]),
  glow: k => (k === 1 ? ['V1'] : k === 2 ? ['V2'] : k === 3 ? ['V1', 'V2'] : k === 4 ? ['V1', 'V2'] : ['A']),
  badge: (k, s) => { const a = z(s.ckt); return k >= 1 ? bdg(`V_d = ${vtx(a.vd)}, V_c = ${vtx(a.vc)} → V_o = ${vtx(a.vo)}`, null, a.state === 'lin') : bdg('A_d = 8000, A_c = 12 (Example 10.21)', null, false); },
  side: (ctx, b, bd, k, s) => sideBars(ctx, b, bd, s.ckt, t('สองส่วนของขาออก (สมการ 10.28)', 'the two parts of the output (Eq. 10.28)')),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt); },
  steps: () => [
    step(t('<b>ขาเข้าเดี่ยวที่ขั้ว +</b> (สไลด์หน้า 4, รูป 10.2a): \\(V_{i1}\\) = 1 mV ที่ขั้วบวก ขั้วลบต่อกราวด์ ขาออกมีขั้วเดียวกับขาเข้า ใช้สมการ 10.26–10.28 กับออปแอมป์ที่วัดได้ \\(A_d\\) = 8000, \\(A_c\\) = 12', '<b>Single-ended input at the + terminal</b> (slide p. 4, Fig. 10.2a): \\(V_{i1}\\) = 1 mV at the plus input, the minus input grounded; the output has the polarity of the input. Eqs. 10.26–10.28 with the op-amp measured in Example 10.21, \\(A_d\\) = 8000, \\(A_c\\) = 12'),
      block([R`V_d &= V_{i1} - V_{i2} = 1\ \text{mV} - 0 = 1\ \text{mV}`, R`V_c &= \tfrac{1}{2}(V_{i1} + V_{i2}) = 0.5\ \text{mV}`, R`V_o &= A_dV_d + A_cV_c = 8000(1\ \text{mV}) + 12(0.5\ \text{mV}) = \boxed{8.006\ \text{V}}`]),
      t('ส่วนของโหมดร่วม 6 mV เล็กจนมองข้ามได้: ขาออก ≅ \\(A_dV_{i1}\\)', 'The common-mode part, 6 mV, is negligible: the output ≅ \\(A_dV_{i1}\\).')),
    step(t('<b>ขาเข้าเดี่ยวที่ขั้ว −</b> (รูป 10.2b): \\(V_{i2}\\) = 1 mV ที่ขั้วลบ ขั้วบวกต่อกราวด์ ขาออกกลับขั้ว (ต่างเฟส 180°)', '<b>Single-ended input at the − terminal</b> (Fig. 10.2b): \\(V_{i2}\\) = 1 mV at the minus input, the plus input grounded; the output is inverted (180° out of phase)'),
      block([R`V_d &= 0 - 1\ \text{mV} = -1\ \text{mV},\qquad V_c = 0.5\ \text{mV}`, R`V_o &= 8000(-1\ \text{mV}) + 12(0.5\ \text{mV}) = \boxed{-7.994\ \text{V}}`])),
    step(t('<b>ขาเข้าคู่ (ดิฟเฟอเรนเชียล)</b> (สไลด์หน้า 5, รูป 10.3): สัญญาณตรงข้ามกัน \\(V_{i1} = -V_{i2} = V_s\\) = 0.5 mV: ส่วนร่วมหักล้างหมด ขาออกเป็นอัตราขยายผลต่างคูณ<b>สองเท่า</b>ของสัญญาณที่ขั้วหนึ่ง', '<b>Double-ended (differential) input</b> (slide p. 5, Fig. 10.3): opposite signals, \\(V_{i1} = -V_{i2} = V_s\\) = 0.5 mV: the common part cancels and the output is the differential gain times <b>twice</b> the signal at one terminal'),
      block([R`V_d &= V_s - (-V_s) = 2V_s = 1\ \text{mV},\qquad V_c = \tfrac{1}{2}(V_s - V_s) = 0`, R`V_o &= A_d(2V_s) + A_c(0) = 8000(1\ \text{mV}) = \boxed{8\ \text{V}}`])),
    step(t('<b>โหมดร่วม</b> (สไลด์หน้า 6, รูป 10.4): สัญญาณเดียวกันที่ทั้งสองขั้ว \\(V_{i1} = V_{i2} = V_s\\) = 1 mV: ผลต่างเป็นศูนย์ เหลือแต่ส่วนร่วมที่ถูกขยายน้อยมาก (ในอุดมคติเป็นศูนย์)', '<b>Common-mode operation</b> (slide p. 6, Fig. 10.4): the same signal at both terminals, \\(V_{i1} = V_{i2} = V_s\\) = 1 mV: the difference is zero and only the common part remains, amplified very little (ideally not at all)'),
      block([R`V_d &= V_s - V_s = 0,\qquad V_c = \tfrac{1}{2}(V_s + V_s) = V_s = 1\ \text{mV}`, R`V_o &= A_d(0) + A_cV_s = 12(1\ \text{mV}) = \boxed{12\ \text{mV}}`]),
      t('สัญญาณรบกวนที่เข้ามาเหมือนกันทั้งสองสาย (เช่น ฮัม 50 Hz) คือสัญญาณโหมดร่วม ออปแอมป์จึงตัดมันทิ้งได้ขณะขยายผลต่างที่ต้องการ', 'Noise that enters both leads alike (50 Hz hum, say) is a common-mode signal, so the op-amp rejects it while amplifying the wanted difference.'))],
  ask: () => ({ fields: [num(t('ขาเข้าคู่ ±0.5 mV: V<sub>o</sub> (V) =', 'differential ±0.5 mV: V<sub>o</sub> (V) ='), 8, { tol: 0.05 }), num(t('โหมดร่วม 1 mV: V<sub>o</sub> (mV) =', 'common 1 mV: V<sub>o</sub> (mV) ='), 12, { tol: 0.1 })] }),
  answer: () => t('+8.006 V, −7.994 V, 8 V และ 12 mV (Boylestad รูป 10.2–10.4 และหัวข้อ 10.9 กับออปแอมป์ของ Example 10.21)', '+8.006 V, −7.994 V, 8 V and 12 mV (Boylestad Figs. 10.2–10.4 and §10.9, with the op-amp of Example 10.21).') };

const E21 = [{ V1: 0.5e-3, V2: -0.5e-3 }, { V1: 1e-3, V2: 1e-3 }].map(v => ({ kind: 'pair', gain: AD21, gc: AC21, ...v }));
DEF.ex1021 = { ...LAY, solvedAt: 1, spec: k => spec('e21_' + (k >= 2 ? 1 : 0), E21[k >= 2 ? 1 : 0]),
  glow: k => (k === 1 ? ['V1', 'V2'] : k === 2 ? ['V1', 'V2'] : k >= 3 ? ['A'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 1 ? bdg(`${k >= 2 ? t('โหมดร่วม', 'common mode') : t('โหมดผลต่าง', 'differential mode')}: V_o = ${vtx(a.vo)}`) : bdg(t('วัด A_d แล้ว A_c', 'measure A_d, then A_c'), null, false); },
  side: (ctx, b, bd, k, s) => sideBars(ctx, b, bd, s.ckt, t('รูป 10.52: การวัดทั้งสอง', 'Fig. 10.52: the two measurements')),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt); },
  steps: () => [
    step(t('<b>วัด \\(A_d\\)</b> (สไลด์หน้า 11 ซ้าย, รูป 10.52a): ป้อน \\(V_{i1} = -V_{i2}\\) = 0.5 mV ให้ \\(V_d\\) = 1 mV และ \\(V_c\\) = 0 ขาออกจึงเท่ากับ \\(A_d\\) โดยตรง (ขั้นตอนที่ 1 ของหัวข้อ 10.9)', '<b>Measure \\(A_d\\)</b> (slide p. 11 left, Fig. 10.52a): apply \\(V_{i1} = -V_{i2}\\) = 0.5 mV, so that \\(V_d\\) = 1 mV and \\(V_c\\) = 0; the output then equals \\(A_d\\) directly (step 1 of §10.9)'),
      block([R`A_d &= \frac{V_o}{V_d} = \frac{8\ \text{V}}{1\ \text{mV}} = \boxed{8000}`])),
    step(t('<b>วัด \\(A_c\\)</b> (สไลด์หน้า 11 ขวา, รูป 10.52b): ป้อน \\(V_{i1} = V_{i2}\\) = 1 mV ให้ \\(V_d\\) = 0 และ \\(V_c\\) = 1 mV ขาออกเหลือเพียง 12 mV', '<b>Measure \\(A_c\\)</b> (slide p. 11 right, Fig. 10.52b): apply \\(V_{i1} = V_{i2}\\) = 1 mV, so that \\(V_d\\) = 0 and \\(V_c\\) = 1 mV; the output is only 12 mV'),
      block([R`A_c &= \frac{V_o}{V_c} = \frac{12\ \text{mV}}{1\ \text{mV}} = \boxed{12}`])),
    step(t('<b>อัตราส่วนการปฏิเสธโหมดร่วม</b> (common-mode rejection ratio, CMRR; สมการ 10.29–10.30)', '<b>The common-mode rejection ratio</b> (CMRR; Eqs. 10.29–10.30)'),
      block([R`\text{CMRR} &= \frac{A_d}{A_c} = \frac{8000}{12} = \boxed{666.7}`, R`\text{CMRR (log)} &= 20\log_{10}\frac{A_d}{A_c} = 20\log_{10}666.7 = \boxed{56.48\ \text{dB}}`]),
      t('ยิ่ง CMRR สูงยิ่งดี: ในอุดมคติเป็นอนันต์ ออปแอมป์จริงอยู่ราว 70–120 dB', 'The higher the CMRR the better: ideally infinite, real op-amps lie around 70–120 dB.'))],
  ask: () => ({ fields: [num('A<sub>d</sub> =', 8000, { tol: 1 }), num('A<sub>c</sub> =', 12, { tol: 0.05 }), num('CMRR (dB) =', 56.48, { tol: 0.1 })] }),
  answer: () => t('\\(A_d\\) = 8000, \\(A_c\\) = 12, CMRR = 666.7 = 56.48 dB (Boylestad Example 10.21)', '\\(A_d\\) = 8000, \\(A_c\\) = 12, CMRR = 666.7 = 56.48 dB (Boylestad Example 10.21).') };

/* Example 10.22 in µV: the book prints 4000 × 10 mV = "40 mV"; with the inputs in mV the output would be 40 V, far beyond the rails. The simulation uses 150 µV and 140 µV, which give the book's figures in mV */
const E22 = [{ gc: 40 }, { gc: 0.04 }].map(v => ({ kind: 'pair', gain: 4000, V1: 150e-6, V2: 140e-6, ...v }));
DEF.ex1022 = { ...LAY, solvedAt: 1, spec: k => spec('e22_' + (k >= 3 ? 1 : 0), E22[k >= 3 ? 1 : 0]),
  glow: k => (k === 1 ? ['V1', 'V2'] : k >= 2 ? ['A'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 1 ? bdg(`CMRR = ${k >= 3 ? '10⁵' : '100'}: V_o = ${vtx(a.vo)}`) : bdg('A_d = 4000, V_i1 = 150 µV, V_i2 = 140 µV', null, false); },
  side: (ctx, b, bd, k, s) => sideBars(ctx, b, bd, s.ckt, t('สมการ 10.31: ส่วนผลต่างกับส่วนร่วม', 'Eq. 10.31: the difference and the common parts')),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt); },
  steps: () => [
    step(t('<b>แยกสัญญาณเป็นสองส่วน</b> (สมการ 10.26–10.27)', '<b>Split the signals into the two parts</b> (Eqs. 10.26–10.27)'),
      block([R`V_d &= V_{i1} - V_{i2} = (150 - 140)\ \mu\text{V} = 10\ \mu\text{V}`, R`V_c &= \tfrac{1}{2}(V_{i1} + V_{i2}) = \frac{150 + 140}{2}\ \mu\text{V} = 145\ \mu\text{V}`]),
      t('ตำราเขียนขาเข้าเป็น mV แล้วได้ "40 mV(1.145) = 45.8 mV" แต่ 4000 × 10 mV = 40 V ไม่ใช่ 40 mV (ขาออกจะชนราง) หน้านี้ใช้ µV เพื่อให้ตัวเลขของตำราถูกหน่วย', 'The book writes the inputs in mV and gets "40 mV(1.145) = 45.8 mV", but 4000 × 10 mV = 40 V, not 40 mV (the output would hit the rail). This page uses µV, which makes the book\'s figures come out in the right unit.')),
    step(t('<b>(a) CMRR = 100</b> (สมการ 10.31): ส่วนร่วมถูกแบ่งด้วย CMRR แล้วเทียบกับส่วนผลต่าง', '<b>(a) CMRR = 100</b> (Eq. 10.31): the common part is divided by the CMRR and compared with the difference part'),
      block([R`V_o &= A_dV_d\left(1 + \frac{1}{\text{CMRR}}\frac{V_c}{V_d}\right) = (4000)(10\ \mu\text{V})\left(1 + \frac{1}{100}\cdot\frac{145}{10}\right)`, R`&= 40\ \text{mV}(1.145) = \boxed{45.8\ \text{mV}}`]),
      t('ภาพจำลองใช้ \\(A_c = A_d/\\text{CMRR}\\) = 40 ส่วนร่วม 40 × 145 µV = 5.8 mV บวกกับ 40 mV', 'The simulation uses \\(A_c = A_d/\\text{CMRR}\\) = 40: the common part 40 × 145 µV = 5.8 mV adds to the 40 mV.')),
    step(t('<b>(b) CMRR = 10⁵</b>: ส่วนร่วมเหลือ 0.0145 % ขาออกแทบเป็น \\(A_dV_d\\) ล้วน ๆ', '<b>(b) CMRR = 10⁵</b>: the common part shrinks to 0.0145 % and the output is almost purely \\(A_dV_d\\)'),
      block([R`V_o &= 40\ \text{mV}\left(1 + \frac{1}{10^5}\cdot 14.5\right) = 40\ \text{mV}(1.000145) = \boxed{40.006\ \text{mV}}`]),
      t('CMRR ยิ่งสูง ขาออกยิ่งเข้าใกล้ "ผลต่างคูณอัตราขยายผลต่าง" และสัญญาณร่วมถูกปฏิเสธ', 'The higher the CMRR, the closer the output is to "the difference times the differential gain", with the common signal rejected.'))],
  ask: () => ({ fields: [num('V<sub>d</sub> (µV) =', 10, { tol: 0.05 }), num('V<sub>c</sub> (µV) =', 145, { tol: 0.5 }), num(t('(a) V<sub>o</sub> (mV) =', '(a) V<sub>o</sub> (mV) ='), 45.8, { tol: 0.1 }), num(t('(b) V<sub>o</sub> (mV) =', '(b) V<sub>o</sub> (mV) ='), 40.006, { tol: 0.02 })] }),
  answer: () => t('(a) 45.8 mV (b) 40.006 mV (Boylestad Example 10.22 โดยแก้หน่วยของขาเข้าเป็น µV)', '(a) 45.8 mV (b) 40.006 mV (Boylestad Example 10.22, with the inputs corrected to µV).') };

/* ---------------- page 7.2: the inverting and noninverting amplifiers, the unity follower (slides I pp. 13–18, 21–22) ---------------- */
const xferSide = (ctx, b, bd, c, o) => { const a = z(c), v1 = c.byId.V1, V1 = (v1.a === 's' ? 1 : -1) * v1.value;   // the source may have been turned round
  OP.plot(ctx, b, { x: [-3, 3], y: [-15, 15], xt: [-3, -2, -1, 1, 2, 3], yt: [-10, -5, 0, 5, 10], xl: 'V_1 (V)', yl: 'V_o (V)', title: bd.short ? '' : o.title,
    curves: [{ pts: o.pts, color: C.curve, w: 2.6 }], hl: [{ y: VSAT, label: bd.short ? '' : '+V_sat = 13 V', color: C.red }, { y: -VSAT, label: bd.short ? '' : '−V_sat', color: C.red }].concat(o.hl || []),
    pts: [{ x: V1, y: a.vo, label: bd.short ? '' : `(${vtx(V1)}, ${vtx(a.vo)})`, side: V1 > 0 ? -1 : 1, dy: a.vo > 0 ? 16 : -16 }], guides: [{ x: V1, y: a.vo }], note: o.note }); };
const O105 = { kind: 'inv', V1: 2, R1: 100e3, Rf: 500e3 }, X105 = OP.xfer(v => OP.ckt({ ...O105, V1: v }), -3, 3);
DEF.ex105 = { ...LAY, solvedAt: 2, spec: () => spec('ex105', O105),
  glow: k => (k === 1 ? ['A'] : k === 2 ? ['R1'] : k === 3 ? ['Rf'] : k === 4 ? ['A'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 2 ? bdg(`V_o = ${vtx(a.vo)} · ${a.st[0]}`, null, a.st[1] === 'ok') : k === 1 ? bdg(`V_− = ${vtx(a.vn)} ≈ 0: ${VG}`) : bdg('R_1 = 100 kΩ, R_f = 500 kΩ, V_1 = 2 V', null, false); },
  side: (ctx, b, bd, k, s) => xferSide(ctx, b, bd, s.ckt, { pts: X105, title: t('V_o กับ V_1: ความชัน −R_f/R_1 = −5', 'V_o against V_1: slope −R_f/R_1 = −5'), note: k >= 4 ? t('เกิน ±2.6 V ชนราง', 'beyond ±2.6 V: the rails') : '' }),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N', vgText: `V_− = ${vtx(z(s.ckt).vn)} ≈ 0` }); },
  steps: () => [
    step(t('<b>กราวด์เสมือน</b> (สไลด์หน้า 13–14, รูป 10.33): อัตราขยายวงเปิด \\(A\\) สูงมาก (2 × 10⁵) ขาออกไม่เกิน \\(V_{sat}\\) = 13 V แรงดันระหว่างขั้วเข้าจึงเล็กจิ๋ว ขั้ว − อยู่ที่ศักย์ ≈ 0 เหมือนกราวด์ แต่<b>ไม่มีกระแสไหลเข้า</b>ขั้วนั้น (ความต้านทานขาเข้าสูงมาก)', '<b>Virtual ground</b> (slides pp. 13–14, Fig. 10.33): the open-loop gain \\(A\\) is huge (2 × 10⁵) and the output cannot exceed \\(V_{sat}\\) = 13 V, so the voltage between the input terminals is tiny: the − terminal sits at ≈ 0, like ground, yet <b>no current flows into it</b> (the input resistance is very high)'),
      block([R`V_i &= \frac{V_o}{A} \le \frac{13\ \text{V}}{2 \times 10^5} = 65\ \mu\text{V} \approx 0`])),
    step(t('<b>กระแสผ่าน \\(R_1\\)</b>: ปลายซ้ายอยู่ที่ \\(V_1\\) ปลายขวาที่ 0 (กราวด์เสมือน)', '<b>The current through \\(R_1\\)</b>: its left end at \\(V_1\\), its right end at 0 (virtual ground)'),
      block([R`I_1 &= \frac{V_1 - 0}{R_1} = \frac{2\ \text{V}}{100\ \text{k}\Omega} = 20\ \mu\text{A}`])),
    step(t('<b>กระแสเดียวกันผ่าน \\(R_f\\)</b>: เข้าขั้ว − ไม่ได้ จึงต้องไหลต่อผ่าน \\(R_f\\) ไปยังขาออก (จุดในภาพจำลองวิ่งจาก \\(R_1\\) ขึ้น \\(R_f\\) แล้วหายเข้าออปแอมป์) ขาออกจึงต่ำกว่า 0 อยู่ \\(I_1R_f\\): สมการ 10.8', '<b>The same current through \\(R_f\\)</b>: it cannot enter the − terminal, so it continues through \\(R_f\\) to the output (the dots run from \\(R_1\\) up through \\(R_f\\) and into the op-amp); the output therefore sits \\(I_1R_f\\) below 0: Eq. 10.8'),
      block([R`V_o &= 0 - I_1R_f = -\frac{R_f}{R_1}V_1 = -\frac{500\ \text{k}\Omega}{100\ \text{k}\Omega}(2\ \text{V}) = \boxed{-10\ \text{V}}`]),
      t('อัตราขยาย −5 ถูกกำหนดด้วยตัวต้านทานสองตัวเท่านั้น ไม่ขึ้นกับ \\(A\\) ของออปแอมป์ (ตราบใดที่ \\(A\\) ใหญ่มาก)', 'The gain of −5 is set by two resistors alone, independent of the op-amp\'s \\(A\\) (as long as \\(A\\) is very large).')),
    step(t('<b>ตรวจกับภาพจำลอง</b>: ออปแอมป์ในตัวแก้วงจรมี \\(A\\) = 2 × 10⁵ จริง ๆ ขาออกจึงต่างจาก −10 V เพียงส่วนในแสน และ \\(V_-\\) = +50 µV ไม่ใช่ศูนย์พอดี (ขาออกเป็นลบ ขั้ว − จึงสูงกว่าขั้ว + เล็กน้อย)', '<b>Check against the simulation</b>: the engine\'s op-amp really has \\(A\\) = 2 × 10⁵, so the output differs from −10 V by parts in 10⁵, and \\(V_-\\) = +50 µV rather than exactly zero (the output is negative, so the − terminal sits slightly above the + one)'),
      block([R`V_o &= -\frac{R_f/R_1}{1 + (1 + R_f/R_1)/A}V_1 = -\frac{5}{1 + 6/(2 \times 10^5)}(2\ \text{V}) = -9.9997\ \text{V}`]),
      t('กราฟข้างภาพ: เส้นตรงความชัน −5 จนถึงราง ±13 V ที่ \\(V_1\\) = ∓2.6 V เลยจากนั้นออปแอมป์อิ่มตัว (ส่วน A ลองได้)', 'The graph beside: a straight line of slope −5 up to the ±13 V rails at \\(V_1\\) = ∓2.6 V; beyond that the op-amp saturates (try it in section A).'))],
  ask: () => ({ fields: [num('I<sub>1</sub> (µA) =', 20, { tol: 0.1 }), num('V<sub>o</sub> (V) =', -10, { tol: 0.05 })] }),
  answer: () => t('\\(V_o\\) = −(500 kΩ/100 kΩ)(2 V) = −10 V (Boylestad Example 10.5)', '\\(V_o\\) = −(500 kΩ/100 kΩ)(2 V) = −10 V (Boylestad Example 10.5).') };

const O106 = { kind: 'noninv', V1: 2, R1: 100e3, Rf: 500e3 }, X106 = OP.xfer(v => OP.ckt({ ...O106, V1: v }), -3, 3);
DEF.ex106 = { ...LAY, solvedAt: 2, spec: () => spec('ex106', O106),
  glow: k => (k === 1 ? ['A'] : k === 2 ? ['R1'] : k === 3 ? ['Rf'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 2 ? bdg(`V_o = ${vtx(a.vo)} · ${a.st[0]}`, null, a.st[1] === 'ok') : k === 1 ? bdg(`V_− = ${vtx(a.vn)} = V_1 (${t('ลัดวงจรเสมือน', 'virtual short')})`) : bdg('R_1 = 100 kΩ, R_f = 500 kΩ, V_1 = 2 V', null, false); },
  side: (ctx, b, bd, k, s) => xferSide(ctx, b, bd, s.ckt, { pts: X106, title: t('V_o กับ V_1: ความชัน 1 + R_f/R_1 = 6', 'V_o against V_1: slope 1 + R_f/R_1 = 6') }),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N', vgText: `V_− = ${vtx(z(s.ckt).vn)}` }); },
  steps: () => [
    step(t('<b>ลัดวงจรเสมือน</b> (สไลด์หน้า 16, รูป 10.35b): \\(V_i\\) ≈ 0 ระหว่างขั้ว จึงมีศักย์ \\(V_1\\) ที่ขั้ว − ด้วย นั่นคือแรงดันคร่อม \\(R_1\\) เท่ากับ \\(V_1\\)', '<b>Virtual short</b> (slide p. 16, Fig. 10.35b): \\(V_i\\) ≈ 0 between the terminals, so the − terminal is at \\(V_1\\) as well; the voltage across \\(R_1\\) equals \\(V_1\\)'),
      block([R`V_{R_1} &= V_1 = 2\ \text{V},\qquad I_1 = \frac{V_1}{R_1} = \frac{2\ \text{V}}{100\ \text{k}\Omega} = 20\ \mu\text{A}`])),
    step(t('<b>ตัวแบ่งแรงดัน \\(R_1\\)–\\(R_f\\)</b>: กระแส \\(I_1\\) มาจากขาออกผ่าน \\(R_f\\) (เข้าขั้ว − ไม่ได้) ดังนั้น \\(V_1 = \\frac{R_1}{R_1 + R_f}V_o\\) (สมการ 10.9)', '<b>The \\(R_1\\)–\\(R_f\\) divider</b>: \\(I_1\\) comes from the output through \\(R_f\\) (it cannot enter the − terminal), so \\(V_1 = \\frac{R_1}{R_1 + R_f}V_o\\) (Eq. 10.9)'),
      block([R`V_o &= \left(1 + \frac{R_f}{R_1}\right)V_1 = \left(1 + \frac{500\ \text{k}\Omega}{100\ \text{k}\Omega}\right)(2\ \text{V}) = 6(2\ \text{V}) = \boxed{12\ \text{V}}`]),
      t('ขาออกมีขั้วเดียวกับขาเข้า และอัตราขยายไม่ต่ำกว่า 1 · แหล่งจ่ายไม่ต้องจ่ายกระแสเลย (ความต้านทานขาเข้าของวงจรสูงมาก) จุดจึงวิ่งเฉพาะในวง \\(R_f\\)–\\(R_1\\)', 'The output has the input\'s polarity and the gain is never below 1. The source supplies no current at all (the circuit\'s input resistance is very high), so the dots run only round the \\(R_f\\)–\\(R_1\\) loop.')),
    step(t('<b>เทียบกับวงจรกลับเฟส</b>: ตัวต้านทานชุดเดียวกันให้ −5 กับ +6 ตำราบอกว่าวงจรกลับเฟสใช้มากกว่าเพราะเสถียรทางความถี่ดีกว่า', '<b>Compare with the inverting circuit</b>: the same resistors give −5 and +6; the book notes that the inverting connection is used more because its frequency stability is better'),
      block([R`A_v &= 1 + \frac{R_f}{R_1} = 6 \quad\text{vs}\quad A_v = -\frac{R_f}{R_1} = -5`]))],
  ask: () => ({ fields: [num('V<sub>o</sub> (V) =', 12, { tol: 0.05 })] }),
  answer: () => t('\\(V_o\\) = (1 + 500/100)(2 V) = 12 V (Boylestad Example 10.6)', '\\(V_o\\) = (1 + 500/100)(2 V) = 12 V (Boylestad Example 10.6).') };

/* Problem 2 (slide p. 21): R_1 = 10 kΩ in series with a 10 kΩ potentiometer, R_f = 500 kΩ; the source (0.2 V) is the page's choice */
const P2 = { kind: 'inv', V1: 0.2, R1: 10e3, Rf: 500e3 };
DEF.p2 = { ...LAY, solvedAt: 1, init: s => { s.st.pot = 0; }, spec: (k, s) => OP.ckt({ ...P2, R1: 10e3 + 10e3 * s.st.pot, r1Name: 'R_1 + pot' }),
  controls: (el, s) => { MC.ui.slider(el, { id: 'pot2', label: t('ตำแหน่งโพเทนชิออมิเตอร์', 'potentiometer position'), min: 0, max: 1, step: 0.01, value: 0, fmt: v => `${fd(v * 100, 0)} % → R_1 = ${kO(10e3 + 10e3 * v)}`.replace('R_1', 'R₁'), oninput: v => { s.st.pot = v; s.build(); } }); },
  glow: k => (k >= 1 ? ['R1'] : null),
  badge: (k, s) => { const a = z(s.ckt), r1 = s.ckt.byId.R1.value; return bdg(`R_1 = ${kO(r1)}: A_v = −${fd(500e3 / r1, 1)}, V_o = ${vtx(a.vo)}`, null, a.state === 'lin'); },
  side: (ctx, b, bd, k, s) => { const r1 = s.ckt.byId.R1.value, a = z(s.ckt); OP.plot(ctx, b, { x: [10e3, 20e3], y: [-55, -20], xt: [10e3, 12e3, 14e3, 16e3, 18e3, 20e3], xf: x => `${fd(x / 1e3, 0)}k`, yt: [-50, -40, -30, -20], xl: 'R_1 (Ω)', yl: 'A_v', title: bd.short ? '' : t('อัตราขยายเทียบกับ R_1 ที่ปรับได้', 'the gain against the adjustable R_1'),
    curves: [{ f: x => -500e3 / x, color: C.curve }], pts: [{ x: r1, y: -500e3 / r1, label: bd.short ? '' : `A_v = −${fd(500e3 / r1, 1)}`, side: r1 > 15e3 ? -1 : 1 }], guides: [{ x: r1, y: -500e3 / r1 }], note: bd.short ? '' : `V_o = ${vtx(a.vo)}` }); },
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>ค่าต่ำสุดของ \\(R_1\\)</b>: โพเทนชิออมิเตอร์หมุนไปที่ 0 Ω เหลือ 10 kΩ อัตราขยายใหญ่ที่สุด', '<b>The smallest \\(R_1\\)</b>: the potentiometer turned to 0 Ω leaves 10 kΩ, the largest gain'),
      block([R`A_v &= -\frac{R_f}{R_1} = -\frac{500\ \text{k}\Omega}{10\ \text{k}\Omega} = \boxed{-50}`])),
    step(t('<b>ค่าสูงสุดของ \\(R_1\\)</b>: โพเทนชิออมิเตอร์เต็ม 10 kΩ รวมเป็น 20 kΩ', '<b>The largest \\(R_1\\)</b>: the full 10 kΩ of the potentiometer, 20 kΩ in all'),
      block([R`A_v &= -\frac{500\ \text{k}\Omega}{20\ \text{k}\Omega} = \boxed{-25}`]),
      t('ช่วงอัตราขยาย −50 ถึง −25 เลื่อนแถบด้านซ้ายดู: ด้วย \\(V_1\\) = 0.2 V ขาออกเปลี่ยนจาก −10 V เป็น −5 V ถ้า \\(V_1\\) = 0.3 V ที่ −50 จะได้ −15 V ซึ่งเกินราง 13 V', 'The gain range is −50 to −25. Move the slider on the left: with \\(V_1\\) = 0.2 V the output goes from −10 V to −5 V; at \\(V_1\\) = 0.3 V the gain of −50 would want −15 V, beyond the 13 V rail.'))],
  ask: () => ({ fields: [num(t('อัตราขยายมากสุด =', 'largest gain ='), -50, { tol: 0.1 }), num(t('อัตราขยายน้อยสุด =', 'smallest gain ='), -25, { tol: 0.1 })] }),
  answer: () => t('−50 ถึง −25 (Boylestad ข้อ 2 ท้ายบทที่ 10, สไลด์หน้า 21)', '−50 to −25 (Boylestad chapter 10 Problem 2, slide p. 21).') };

/* Problem 7 (slide p. 22): V_1 = 0.5 V, R_f = 200 kΩ, R_1 = 10 kΩ + a 10 kΩ potentiometer */
const P7 = { kind: 'noninv', V1: 0.5, R1: 10e3, Rf: 200e3 };
DEF.p7 = { ...LAY, solvedAt: 1, init: s => { s.st.pot = 0; }, spec: (k, s) => OP.ckt({ ...P7, R1: 10e3 + 10e3 * s.st.pot }),
  controls: (el, s) => { MC.ui.slider(el, { id: 'pot7', label: t('ตำแหน่งโพเทนชิออมิเตอร์', 'potentiometer position'), min: 0, max: 1, step: 0.01, value: 0, fmt: v => `${fd(v * 100, 0)} % → R₁ = ${kO(10e3 + 10e3 * v)}`, oninput: v => { s.st.pot = v; s.build(); } }); },
  glow: k => (k >= 1 ? ['R1'] : null),
  badge: (k, s) => { const a = z(s.ckt), r1 = s.ckt.byId.R1.value; return bdg(`R_1 = ${kO(r1)}: A_v = ${fd(1 + 200e3 / r1, 1)}, V_o = ${vtx(a.vo)}`, null, a.state === 'lin'); },
  side: (ctx, b, bd, k, s) => { const r1 = s.ckt.byId.R1.value, a = z(s.ckt); OP.plot(ctx, b, { x: [10e3, 20e3], y: [4, 12], xt: [10e3, 12e3, 14e3, 16e3, 18e3, 20e3], xf: x => `${fd(x / 1e3, 0)}k`, yt: [4, 6, 8, 10, 12], xl: 'R_1 (Ω)', yl: 'V_o (V)', title: bd.short ? '' : t('ขาออกเทียบกับ R_1 ที่ปรับได้', 'the output against the adjustable R_1'),
    curves: [{ f: x => 0.5 * (1 + 200e3 / x), color: C.curve }], pts: [{ x: r1, y: a.vo, label: bd.short ? '' : `V_o = ${vtx(a.vo)}`, side: r1 > 15e3 ? -1 : 1 }], guides: [{ x: r1, y: a.vo }] }); },
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt); },
  steps: () => [
    step(t('<b>\\(R_1\\) ต่ำสุด</b> 10 kΩ: อัตราขยายสูงสุด', '<b>The smallest \\(R_1\\)</b>, 10 kΩ: the largest gain'),
      block([R`V_o &= \left(1 + \frac{R_f}{R_1}\right)V_1 = \left(1 + \frac{200\ \text{k}\Omega}{10\ \text{k}\Omega}\right)(0.5\ \text{V}) = 21(0.5\ \text{V}) = \boxed{10.5\ \text{V}}`])),
    step(t('<b>\\(R_1\\) สูงสุด</b> 20 kΩ', '<b>The largest \\(R_1\\)</b>, 20 kΩ'),
      block([R`V_o &= \left(1 + \frac{200\ \text{k}\Omega}{20\ \text{k}\Omega}\right)(0.5\ \text{V}) = 11(0.5\ \text{V}) = \boxed{5.5\ \text{V}}`]),
      t('ช่วงขาออก 5.5–10.5 V ในวงจรไม่กลับเฟสโพเทนชิออมิเตอร์ปรับอัตราขยายได้ไม่ถึง 1 (ต่ำสุดคือ 1 เมื่อ \\(R_1 \\to \\infty\\))', 'The output range is 5.5–10.5 V. In the noninverting circuit the potentiometer can never bring the gain below 1 (the minimum, as \\(R_1 \\to \\infty\\)).'))],
  ask: () => ({ fields: [num(t('V<sub>o</sub> สูงสุด (V) =', 'largest V<sub>o</sub> (V) ='), 10.5, { tol: 0.05 }), num(t('V<sub>o</sub> ต่ำสุด (V) =', 'smallest V<sub>o</sub> (V) ='), 5.5, { tol: 0.05 })] }),
  answer: () => t('10.5 V ลงถึง 5.5 V (Boylestad ข้อ 7 ท้ายบทที่ 10, สไลด์หน้า 22)', '10.5 V down to 5.5 V (Boylestad chapter 10 Problem 7, slide p. 22).') };

/* the unity follower as a buffer: a source with R_s = 10 kΩ feeding R_L = 1 kΩ (the page's example) */
const FOL = { kind: 'follower', V1: 2, Rs: 10e3, RL: 1e3 };
DEF.follower = { ...LAY, solvedAt: 1, spec: () => spec('fol', FOL),
  glow: k => (k === 1 ? ['A'] : k === 2 ? ['Rs'] : k === 3 ? ['RL'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 1 ? bdg(`V_o = V_1 = ${vtx(a.vo)} · I_o = ${itx(a.io)} ${t('มาจากออปแอมป์', 'from the op-amp')}`) : bdg('V_1 = 2 V, R_s = 10 kΩ, R_L = 1 kΩ', null, false); },
  side: (ctx, b, bd, k, s) => { const c = s.ckt, a = z(c), vs = 2 * 1e3 / 11e3; OP.vbars(ctx, b, [{ label: 'V_1', v: 2, color: C.tan, sub: bd.short ? '' : t('แหล่งจ่าย', 'source') }, { label: 'V_+', v: a.vp, color: C.q, sub: bd.short ? '' : t('ไม่มีแรงดันตกใน R_s', 'no drop across R_s') }, { label: 'V_o', v: a.vo, color: C.curve, sub: bd.short ? '' : t('คร่อม R_L', 'across R_L') }, { label: t('ไม่มีบัฟเฟอร์', 'no buffer'), v: vs, color: C.red, sub: bd.short ? '' : 'R_L/(R_s + R_L) × V_1' }], { title: bd.short ? '' : t('ตัวตามแรงดันเป็นบัฟเฟอร์', 'the follower as a buffer'), short: bd.short, max: 2.4 }); },
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt); },
  steps: () => [
    step(t('<b>อัตราขยายหนึ่ง</b> (สไลด์หน้า 18, รูป 10.36): ขาออกต่อตรงกลับเข้าขั้ว − ลัดวงจรเสมือนบังคับ \\(V_- = V_+ = V_1\\) จึงได้สมการ 10.10', '<b>Unity gain</b> (slide p. 18, Fig. 10.36): the output is tied straight back to the − terminal, and the virtual short forces \\(V_- = V_+ = V_1\\): Eq. 10.10'),
      block([R`V_o &= V_1 = \boxed{2\ \text{V}}`])),
    step(t('<b>ทำไมต้องมี</b>: แหล่งจ่ายมีความต้านทานภายใน \\(R_s\\) = 10 kΩ ถ้าต่อโหลด 1 kΩ ตรง ๆ จะเหลือแค่ตัวแบ่งแรงดัน', '<b>Why bother</b>: the source has an internal resistance \\(R_s\\) = 10 kΩ; a 1 kΩ load connected directly would get only a divider\'s share'),
      block([R`V_L &= \frac{R_L}{R_s + R_L}V_1 = \frac{1}{11}(2\ \text{V}) = 0.18\ \text{V}`]),
      t('แต่ขั้ว + ของออปแอมป์ไม่ดึงกระแส \\(R_s\\) จึงไม่มีแรงดันตก \\(V_+ = V_1\\) เต็ม ๆ (ภาพจำลอง: ไม่มีจุดวิ่งใน \\(R_s\\))', 'But the op-amp\'s + terminal draws no current, so nothing drops across \\(R_s\\) and \\(V_+ = V_1\\) in full (simulation: no dots in \\(R_s\\)).')),
    step(t('<b>กระแสโหลดมาจากออปแอมป์</b> ไม่ใช่จากแหล่งจ่าย: ความต้านทานขาออกต่ำมาก', '<b>The load current comes from the op-amp</b>, not from the source: its output resistance is very low'),
      block([R`I_L &= \frac{V_o}{R_L} = \frac{2\ \text{V}}{1\ \text{k}\Omega} = 2\ \text{mA}`]),
      t('ตัวตามแรงดันทำงานเหมือนวงจรอิมิตเตอร์ตามหรือซอร์สตาม (บทที่ 4) แต่อัตราขยายเป็น 1 พอดี ไม่มี 0.7 V หาย', 'The follower works like the emitter or source follower of chapter 4, but with a gain of exactly 1 and no 0.7 V lost.'))],
  ask: () => ({ fields: [num('V<sub>o</sub> (V) =', 2, { tol: 0.02 }), num(t('ไม่มีบัฟเฟอร์: V<sub>L</sub> (V) =', 'no buffer: V<sub>L</sub> (V) ='), 2 / 11, { tol: 0.01 })] }),
  answer: () => t('\\(V_o = V_1\\) = 2 V (ไม่มีบัฟเฟอร์จะเหลือ 0.18 V) (Boylestad รูป 10.36, สมการ 10.10)', '\\(V_o = V_1\\) = 2 V (0.18 V without the buffer) (Boylestad Fig. 10.36, Eq. 10.10).') };

/* ---------------- page 7.3: the summing amplifier (slides I pp. 19–20, 23–24; Example 10.7, Problems 8, 9, 14) ---------------- */
const sumBars = (ctx, b, bd, c, title) => { const a = z(c), rf = c.byId.Rf.value, items = []; let k = 1; while (c.byId['V' + k]) { const v = c.byId['V' + k], r = c.byId['R' + k].value, V = (v.a === 's' + k ? 1 : -1) * v.value; items.push({ label: `−(R_f/R_${k})V_${k}`, v: -rf / r * V, color: [C.tan, PURPLE, C.q][(k - 1) % 3], sub: bd.short ? '' : `−${fd(rf / r, 2)} × ${vtx(V)}` }); k++; }
  items.push({ label: 'V_o', v: a.vo, color: a.state === 'lin' ? C.curve : C.red, sub: bd.short ? '' : a.st[0] }); OP.vbars(ctx, b, items, { title: bd.short ? '' : title, short: bd.short }); };
const O7a = { kind: 'sum', V: [1, 2, 3], R: [500e3, 1e6, 1e6], Rf: 1e6 }, O7b = { kind: 'sum', V: [-2, 3, 1], R: [200e3, 500e3, 1e6], Rf: 1e6 };
DEF.ex107a = { ...LAY, cktAspN: 0.95, solvedAt: 2, spec: () => spec('e7a', O7a),
  glow: k => (k === 1 ? ['R1', 'R2', 'R3'] : k === 2 ? ['Rf'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 2 ? bdg(`V_o = ${vtx(a.vo)}`) : k === 1 ? bdg(`I_1 + I_2 + I_3 = ${itx(-a.io - 0)}`.replace('I_1 + I_2 + I_3 = ', 'ΣI = ')) : bdg(t('สามขาเข้า R_f = 1 MΩ: หา V_o', 'three inputs, R_f = 1 MΩ: find V_o'), null, false); },   // the values are on the picture; a long badge was clipped on a phone
  side: (ctx, b, bd, k, s) => sumBars(ctx, b, bd, s.ckt, t('แต่ละขาเข้าให้ส่วนของมันเอง (สมการ 10.11)', 'each input adds its own term (Eq. 10.11)')),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>กระแสของแต่ละขาเข้า</b> (สไลด์หน้า 19, รูป 10.37b): ปลายขวาของตัวต้านทานทุกตัวอยู่ที่กราวด์เสมือน กระแสจึงไม่ขึ้นต่อกัน', '<b>The current of each input</b> (slide p. 19, Fig. 10.37b): the right end of every resistor is at the virtual ground, so the currents are independent of one another'),
      block([R`I_1 &= \frac{1\ \text{V}}{500\ \text{k}\Omega} = 2\ \mu\text{A},\quad I_2 = \frac{2\ \text{V}}{1\ \text{M}\Omega} = 2\ \mu\text{A},\quad I_3 = \frac{3\ \text{V}}{1\ \text{M}\Omega} = 3\ \mu\text{A}`])),
    step(t('<b>รวมแล้วไหลผ่าน \\(R_f\\)</b>: ขั้ว − รับกระแสไม่ได้ ผลรวม 7 µA จึงผ่าน \\(R_f\\) ไปขาออก (สมการ 10.11)', '<b>The sum flows through \\(R_f\\)</b>: the − terminal takes no current, so the 7 µA total passes through \\(R_f\\) to the output (Eq. 10.11)'),
      block([R`V_o &= -\left(\frac{R_f}{R_1}V_1 + \frac{R_f}{R_2}V_2 + \frac{R_f}{R_3}V_3\right) = -\left[\frac{1000}{500}(1) + \frac{1000}{1000}(2) + \frac{1000}{1000}(3)\right]`, R`&= -[2(1\ \text{V}) + 1(2\ \text{V}) + 1(3\ \text{V})] = \boxed{-7\ \text{V}}`]),
      t('ขาเข้าแต่ละขามี "อัตราขยาย" ของตัวเอง \\(R_f/R_k\\): 2, 1, 1 เปลี่ยน \\(R_1\\) ไม่กระทบส่วนของ \\(V_2\\), \\(V_3\\)', 'Each input has its own "gain" \\(R_f/R_k\\): 2, 1, 1. Changing \\(R_1\\) leaves the \\(V_2\\) and \\(V_3\\) terms untouched.'))],
  ask: () => ({ fields: [num('V<sub>o</sub> (V) =', -7, { tol: 0.05 })] }),
  answer: () => t('\\(V_o\\) = −[2(1) + 1(2) + 1(3)] = −7 V (Boylestad Example 10.7a)', '\\(V_o\\) = −[2(1) + 1(2) + 1(3)] = −7 V (Boylestad Example 10.7a).') };
DEF.ex107b = { ...LAY, cktAspN: 0.95, solvedAt: 1, spec: () => spec('e7b', O7b),
  glow: k => (k === 1 ? ['V1', 'R1'] : k === 2 ? ['Rf'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 1 ? bdg(`V_o = ${vtx(a.vo)}`) : bdg(t('สามขาเข้า R_f = 1 MΩ: หา V_o', 'three inputs, R_f = 1 MΩ: find V_o'), null, false); },
  side: (ctx, b, bd, k, s) => sumBars(ctx, b, bd, s.ckt, t('ส่วนบวกกับส่วนลบหักล้างกัน', 'positive and negative terms cancel in part')),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>ขาเข้าลบให้ส่วนบวก</b>: \\(V_1\\) = −2 V ผ่าน 200 kΩ มีอัตราขยาย 5 กระแสของมันไหล<b>ออก</b>จากกราวด์เสมือน (ดูทิศของจุดในแถวบน) ดึงขาออกขึ้น', '<b>A negative input gives a positive term</b>: \\(V_1\\) = −2 V through 200 kΩ has a gain of 5, and its current flows <b>out of</b> the virtual ground (watch the dots on the top row), pulling the output up'),
      block([R`V_o &= -\left[\frac{1000}{200}(-2) + \frac{1000}{500}(3) + \frac{1000}{1000}(1)\right] = -[5(-2\ \text{V}) + 2(3\ \text{V}) + 1(1\ \text{V})]`, R`&= -[-10 + 6 + 1]\ \text{V} = \boxed{+3\ \text{V}}`])),
    step(t('<b>กระแสสุทธิใน \\(R_f\\)</b>: −10 + 6 + 1 µA = −3 µA ไหลจากขาออกเข้าหาขั้ว − (ขาออกเป็นบวก)', '<b>The net current in \\(R_f\\)</b>: −10 + 6 + 1 µA = −3 µA, from the output toward the − terminal (the output is positive)'),
      block([R`I_f &= \frac{V_o - 0}{R_f} = \frac{3\ \text{V}}{1\ \text{M}\Omega} = 3\ \mu\text{A}`]))],
  ask: () => ({ fields: [num('V<sub>o</sub> (V) =', 3, { tol: 0.05 })] }),
  answer: () => t('\\(V_o\\) = −[5(−2) + 2(3) + 1(1)] = +3 V (Boylestad Example 10.7b)', '\\(V_o\\) = −[5(−2) + 2(3) + 1(1)] = +3 V (Boylestad Example 10.7b).') };

/* Problems 9 and 8 (slide p. 23, Fig. 10.68): 33, 22, 12 kΩ with +0.2, −0.5, +0.8 V; R_f = 68 kΩ, then 330 kΩ. The figure marks the input terminal "+": the simulation uses the inverting connection */
const P9 = { kind: 'sum', V: [0.2, -0.5, 0.8], R: [33e3, 22e3, 12e3], Rf: 68e3 }, P8 = { ...P9, Rf: 330e3 };
DEF.p9 = { ...LAY, cktAspN: 0.95, solvedAt: 1, spec: k => (k >= 3 ? spec('p8', P8) : spec('p9', P9)),
  glow: k => (k === 1 ? ['R1', 'R2', 'R3'] : k >= 2 ? ['Rf'] : null),
  badge: (k, s) => { const a = z(s.ckt); return k >= 1 ? bdg(`R_f = ${kO(s.ckt.byId.Rf.value)}: V_o = ${vtx(a.vo)} · ${a.st[0]}`, null, a.state === 'lin') : bdg('+0.2 V, −0.5 V, +0.8 V · 33, 22, 12 kΩ', null, false); },
  side: (ctx, b, bd, k, s) => sumBars(ctx, b, bd, s.ckt, k >= 3 ? t('R_f = 330 kΩ: ผลรวมเกินราง', 'R_f = 330 kΩ: the sum exceeds the rail') : t('R_f = 68 kΩ', 'R_f = 68 kΩ')),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>อัตราขยายของแต่ละขา</b> (ข้อ 9): \\(R_f\\) = 68 kΩ', '<b>The gain of each input</b> (Problem 9): \\(R_f\\) = 68 kΩ'),
      block([R`\frac{R_f}{R_1} &= \frac{68}{33} = 2.061,\quad \frac{R_f}{R_2} = \frac{68}{22} = 3.091,\quad \frac{R_f}{R_3} = \frac{68}{12} = 5.667`])),
    step(t('<b>รวม</b> (สมการ 10.11)', '<b>Sum</b> (Eq. 10.11)'),
      block([R`V_o &= -[2.061(0.2) + 3.091(-0.5) + 5.667(0.8)]\ \text{V}`, R`&= -[0.412 - 1.545 + 4.533]\ \text{V} = \boxed{-3.40\ \text{V}}`])),
    step(t('<b>ข้อ 8: \\(R_f\\) = 330 kΩ</b>: อัตราขยายทุกขาคูณด้วย 330/68 = 4.85', '<b>Problem 8: \\(R_f\\) = 330 kΩ</b>: every gain is multiplied by 330/68 = 4.85'),
      block([R`V_o &= -[10(0.2) + 15(-0.5) + 27.5(0.8)]\ \text{V} = -[2 - 7.5 + 22]\ \text{V} = \boxed{-16.5\ \text{V}}`]),
      t('สมการให้ −16.5 V แต่ออปแอมป์จ่ายได้ไม่เกิน \\(V_{sat}\\) ≈ 13 V ภาพจำลองจึงชนรางที่ −13 V: วงจรจริงต้องลด \\(R_f\\) หรือใช้แหล่งจ่ายไฟสูงขึ้น', 'The equation gives −16.5 V, but the op-amp cannot swing beyond \\(V_{sat}\\) ≈ 13 V, so the simulation sits at the −13 V rail: a real circuit would need a smaller \\(R_f\\) or higher supply rails.'))],
  ask: () => ({ fields: [num(t('R<sub>f</sub> = 68 kΩ: V<sub>o</sub> (V) =', 'R<sub>f</sub> = 68 kΩ: V<sub>o</sub> (V) ='), -3.4, { tol: 0.03 }), num(t('R<sub>f</sub> = 330 kΩ: สมการให้ (V) =', 'R<sub>f</sub> = 330 kΩ: the equation gives (V) ='), -16.5, { tol: 0.1 })] }),
  answer: () => t('ข้อ 9: −3.40 V · ข้อ 8: −16.5 V ตามสมการ แต่อิ่มตัวที่ −13 V (Boylestad ข้อ 8–9 ท้ายบทที่ 10, สไลด์หน้า 23)', 'Problem 9: −3.40 V · Problem 8: −16.5 V by the equation, saturating at −13 V (Boylestad chapter 10 Problems 8–9, slide p. 23).') };

const P14 = { kind: 'p14', V1: 0.1 };
DEF.p14 = { ...LAY, cktAspM: 0.66, solvedAt: 1, spec: () => spec('p14', P14),
  glow: k => (k === 1 ? ['A1', 'R1A', 'RfA'] : k === 2 ? ['A2'] : k === 3 ? ['A3', 'Ra', 'Rb', 'Rf'] : null),
  badge: (k, s) => { const c = s.ckt, v = n => c.V(n).re; return k >= 3 ? bdg(`V_o = ${vtx(v('o'))}`) : k >= 1 ? bdg(`A_1: ${vtx(v('OA'))} · A_2: ${vtx(v('OB'))}`) : bdg('V_1 = 0.1 V', null, false); },
  side: (ctx, b, bd, k, s) => { const c = s.ckt, v = n => c.V(n).re; OP.vbars(ctx, b, [{ label: 'V_1', v: 0.1, color: C.tan, sub: bd.short ? '' : t('ขาเข้า', 'input') }, { label: t('ออก A_1', 'A_1 out'), v: v('OA'), color: C.q, sub: bd.short ? '' : '× 21' }, { label: t('ออก A_2', 'A_2 out'), v: v('OB'), color: PURPLE, sub: bd.short ? '' : '× 1' }, { label: 'V_o', v: v('o'), color: C.curve, sub: bd.short ? '' : '−(5 × 2.1 + 10 × 0.1)' }], { title: bd.short ? '' : t('สามขั้น', 'the three stages'), short: bd.short }); },
  after: (v, k, s) => { if (k >= 1) { const c = s.ckt; OP.tag(v, 'OA', `${vtx(c.V('OA').re)}`, C.q, 0.1, -0.42); OP.tag(v, 'OB', `${vtx(c.V('OB').re)}`, PURPLE, 0.1, -0.42); } },   // V_o is in the badge and the bars (no room for a tag beside the summing op-amp)
  steps: () => [
    step(t('<b>ขั้นแรกบน (\\(A_1\\))</b>: วงจรไม่กลับเฟส 400 kΩ/20 kΩ', '<b>The upper first stage (\\(A_1\\))</b>: a noninverting amplifier, 400 kΩ/20 kΩ'),
      block([R`V_{o1} &= \left(1 + \frac{400\ \text{k}\Omega}{20\ \text{k}\Omega}\right)(0.1\ \text{V}) = 21(0.1\ \text{V}) = 2.1\ \text{V}`])),
    step(t('<b>ขั้นแรกล่าง (\\(A_2\\))</b>: ตัวตามแรงดัน', '<b>The lower first stage (\\(A_2\\))</b>: a unity follower'), block([R`V_{o2} &= V_1 = 0.1\ \text{V}`])),
    step(t('<b>ขั้นรวม (\\(A_3\\))</b>: วงจรรวมสัญญาณ 20 kΩ กับ 10 kΩ และ \\(R_f\\) = 100 kΩ ขั้นก่อนหน้ามีความต้านทานขาออกต่ำ จึงไม่ถูกโหลดโดยตัวต้านทานขาเข้าของขั้นนี้', '<b>The summing stage (\\(A_3\\))</b>: 20 kΩ and 10 kΩ with \\(R_f\\) = 100 kΩ; the earlier stages have a low output resistance, so this stage\'s input resistors do not load them'),
      block([R`V_o &= -\left(\frac{100}{20}V_{o1} + \frac{100}{10}V_{o2}\right) = -[5(2.1\ \text{V}) + 10(0.1\ \text{V})]`, R`&= -(10.5 + 1)\ \text{V} = \boxed{-11.5\ \text{V}}`]),
      t('ยังอยู่ในราง ±13 V ถ้า \\(V_1\\) = 0.12 V จะต้องการ −13.8 V และชนราง', 'Still within the ±13 V rails; at \\(V_1\\) = 0.12 V the circuit would want −13.8 V and hit the rail.'))],
  ask: () => ({ fields: [num('V<sub>o1</sub> (V) =', 2.1, { tol: 0.02 }), num('V<sub>o</sub> (V) =', -11.5, { tol: 0.05 })] }),
  answer: () => t('\\(V_o\\) = −[5(2.1) + 10(0.1)] = −11.5 V (Boylestad ข้อ 14 ท้ายบทที่ 10, สไลด์หน้า 24)', '\\(V_o\\) = −[5(2.1) + 10(0.1)] = −11.5 V (Boylestad chapter 10 Problem 14, slide p. 24).') };

/* ---------------- page 7.4: the integrator and the differentiator (slides II pp. 3–6; Fig. 10.39, Problem 10, Fig. 10.40) ---------------- */
const OUTS = { v1: c => c.Vab('V1').re * (c.byId.V1.a === 's' ? 1 : -1), vo: c => c.V('o').re, vc: c => c.Vab('C').re };
OUTS.v1 = c => { const p = c.byId.V1; return c.V(p.a).re - c.V(p.b).re; };
OP.OUTS = OUTS;
const stepSrc = (A, label) => ({ wave: 'square', fn: tm => (tm >= 0 ? A : 0), valText: label ?? `${vtx(A)} ${t('ขั้น', 'step')}` });
const squareSrc = (A, Tp) => ({ wave: 'square', fn: tm => (((tm % Tp) + Tp) % Tp < Tp / 2 ? A : -A), valText: `±${vtx(A)}, ${fHz(1 / Tp)}` });
const triSrc = (A, Tp) => ({ wave: 'tri', fn: tm => { const q = ((tm % Tp) + Tp) % Tp / Tp; return A * (q < 0.25 ? 4 * q : q < 0.75 ? 2 - 4 * q : 4 * q - 4); }, valText: `±${vtx(A)}, ${fHz(1 / Tp)}` });
const sineSrc = (A, Tp) => ({ wave: 'sine', fn: tm => A * Math.sin(TAU * tm / Tp), valText: `${vtx(A)} ${t('ยอด', 'peak')}, ${fHz(1 / Tp)}` });
OP.src = { step: stepSrc, square: squareSrc, tri: triSrc, sine: sineSrc };
const SAT_HL = short => [{ y: VSAT, label: short ? '' : '+V_sat', color: C.red }, { y: -VSAT, label: short ? '' : '−V_sat', color: C.red }];
/* the two wave panels of a transient: v_1(t) on the left, v_o(t) on the right */
const tranWaves = (o = {}) => [
  { draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'v1', color: C.elec, label: 'v_1' }], y: o.y1 || [-1.5, 1.5], yt: o.yt1 || [-1, 0, 1], ms: o.ms, xt: o.xt, title: bd.short ? '' : (o.t1 || t('ขาเข้า v_1(t)', 'input v_1(t)')), short: bd.short }) },
  { draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vo', color: C.q, label: 'v_o', w: 2.8 }], y: o.y || [-15, 15], yt: o.yt || [-10, -5, 0, 5, 10], ms: o.ms, xt: o.xt, title: bd.short ? '' : (o.t2 ? (typeof o.t2 === 'function' ? o.t2(k, s) : o.t2) : t('ขาออก v_o(t)', 'output v_o(t)')), hl: SAT_HL(bd.short).concat(o.hl ? o.hl(k, s, bd.short) : []), short: bd.short }) }];
const F39 = [{ R1: 1e6 }, { R1: 100e3 }].map(v => ({ kind: 'integ', C: 1e-6, r1Name: 'R', mode: 'tran', sig: stepSrc(1), ...v }));
DEF.f1039 = { ...LAYT, solvedAt: 1, init: s => { s.st.rec = new OP.Rec(3, 1500, OUTS, 6); }, tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: k => spec('f39_' + (k >= 3 ? 1 : 0), F39[k >= 3 ? 1 : 0]),
  glow: k => (k === 1 ? ['R1'] : k === 2 ? ['C'] : k === 3 ? ['R1'] : null),
  badge: (k, s) => { const rec = s.st.rec, r = s.ckt.byId.R1.value; return k >= 1 ? bdg(`−1/RC = −${fd(1 / (r * 1e-6), 0)} V/s · t = ${fd(rec.t, 2)} s, v_o = ${vtx(rec.last('vo'))}`, null, Math.abs(rec.last('vo')) < 0.98 * VSAT) : bdg('v_1 = 1 V step, R = 1 MΩ, C = 1 µF', null, false); },
  waves: tranWaves({ xt: [0.5, 1, 1.5, 2, 2.5, 3], t2: (k, s) => (k >= 3 ? t('R = 100 kΩ: ลาด −10 V/s ชนรางที่ 1.3 s', 'R = 100 kΩ: a −10 V/s ramp, at the rail by 1.3 s') : t('R = 1 MΩ: ลาด −1 V/s (รูป 10.39b)', 'R = 1 MΩ: a −1 V/s ramp (Fig. 10.39b)')) }),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>กระแสคงที่เข้าตัวเก็บประจุ</b> (สไลด์หน้า 3, รูป 10.38b): ขั้ว − เป็นกราวด์เสมือน กระแสผ่าน R จึงคงที่ และต้องไหลต่อเข้า C ทั้งหมด (ขั้ว − รับกระแสไม่ได้)', '<b>A constant current into the capacitor</b> (slide p. 3, Fig. 10.38b): the − terminal is a virtual ground, so the current through R is constant, and all of it must continue into C (the − terminal takes none)'),
      block([R`I &= \frac{v_1}{R} = \frac{1\ \text{V}}{1\ \text{M}\Omega} = 1\ \mu\text{A}`])),
    step(t('<b>ประจุสะสม แรงดันเพิ่มเป็นเส้นตรง</b>: \\(v_C = \\frac{1}{C}\\int I\\,dt\\) ปลายซ้ายของ C อยู่ที่ 0 ขาออกจึงเป็นลบของ \\(v_C\\) (สมการ 10.12–10.13 และสไลด์หน้า 4–5)', '<b>Charge builds up and the voltage rises linearly</b>: \\(v_C = \\frac{1}{C}\\int I\\,dt\\); the left end of C is at 0, so the output is the negative of \\(v_C\\) (Eqs. 10.12–10.13, slides pp. 4–5)'),
      block([R`v_o(t) &= -\frac{1}{RC}\int v_1\,dt = -\frac{1}{(1\ \text{M}\Omega)(1\ \mu\text{F})}\int_0^t 1\,dt = \boxed{-1\ \text{V/s} \times t}`]),
      t('ที่ t = 2 s ขาออกเป็น −2 V (รูป 10.39b) ภาพจำลองวิ่งช้าลง 2 เท่า: 3 วินาทีของวงจรใช้ 6 วินาทีจริง', 'At t = 2 s the output is −2 V (Fig. 10.39b). The simulation runs at half speed: 3 s of circuit time take 6 real seconds.')),
    step(t('<b>R = 100 kΩ</b>: ตัวคูณสเกล 1/RC ใหญ่ขึ้นสิบเท่า (รูป 10.39c)', '<b>R = 100 kΩ</b>: the scale factor 1/RC is ten times larger (Fig. 10.39c)'),
      block([R`-\frac{1}{RC} &= -\frac{1}{(100\ \text{k}\Omega)(1\ \mu\text{F})} = \boxed{-10\ \text{V/s}}`]),
      t('ขาออกลงถึงราง −13 V ภายใน 1.3 s แล้วหยุด: อินทิเกรเตอร์จริงอิ่มตัวได้เสมอถ้าขาเข้ามีองค์ประกอบกระแสตรง', 'The output reaches the −13 V rail within 1.3 s and stops there: a real integrator always saturates eventually if its input has a dc component.'))],
  ask: () => ({ fields: [num(t('R = 1 MΩ: v<sub>o</sub> ที่ 2 s (V) =', 'R = 1 MΩ: v<sub>o</sub> at 2 s (V) ='), -2, { tol: 0.02 }), num(t('R = 100 kΩ: ความชัน (V/s) =', 'R = 100 kΩ: slope (V/s) ='), -10, { tol: 0.05 })] }),
  answer: () => t('ลาด −1 V/s (R = 1 MΩ) และ −10 V/s (R = 100 kΩ) (Boylestad รูป 10.39, สไลด์หน้า 5)', 'Ramps of −1 V/s (R = 1 MΩ) and −10 V/s (R = 100 kΩ) (Boylestad Fig. 10.39, slide p. 5).') };

const P10 = { kind: 'integ', R1: 200e3, C: 0.1e-6, r1Name: 'R', mode: 'tran', sig: stepSrc(1.5) };
DEF.p10 = { ...LAYT, solvedAt: 1, init: s => { s.st.rec = new OP.Rec(0.25, 1250, OUTS, 5); }, tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => spec('p10', P10), glow: k => (k === 1 ? ['R1', 'C'] : k === 2 ? ['A'] : null),
  badge: (k, s) => { const rec = s.st.rec; return k >= 1 ? bdg(`−1/RC = −50 s⁻¹ → −75 V/s · t = ${fd(rec.t * 1e3, 0)} ms, v_o = ${vtx(rec.last('vo'))}`, null, Math.abs(rec.last('vo')) < 0.98 * VSAT) : bdg('v_1 = 1.5 V step, R = 200 kΩ, C = 0.1 µF', null, false); },
  waves: tranWaves({ ms: true, xt: [50, 100, 150, 200, 250], y1: [-2, 2], yt1: [-1.5, 0, 1.5], t2: t('ลาด −75 V/s ชนรางที่ 173 ms', 'a −75 V/s ramp, at the rail by 173 ms') }),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>ตัวคูณสเกล</b> (สมการ 10.13)', '<b>The scale factor</b> (Eq. 10.13)'),
      block([R`-\frac{1}{RC} &= -\frac{1}{(200\ \text{k}\Omega)(0.1\ \mu\text{F})} = -\frac{1}{0.02\ \text{s}} = -50\ \text{s}^{-1}`])),
    step(t('<b>ขาออก</b>: ขั้น 1.5 V ให้ลาดลง', '<b>The output</b>: the 1.5 V step gives a falling ramp'),
      block([R`v_o(t) &= -50 \times 1.5\ \text{V} \times t = \boxed{-75\ \text{V/s} \times t}`]),
      t(`ถึงราง −13 V เมื่อ t = 13/75 = 0.173 s แล้วค้างอยู่ (ภาพจำลองช้าลง 20 เท่า) ถ้าขาเข้ากลับเป็น 0 V ขาออกจะค้างที่ค่าสุดท้าย: C จำประจุไว้`, 'It reaches the −13 V rail at t = 13/75 = 0.173 s and stays there (the simulation is slowed 20×). Were the input returned to 0 V, the output would hold its last value: C remembers its charge.'))],
  ask: () => ({ fields: [num(t('ความชัน (V/s) =', 'slope (V/s) ='), -75, { tol: 0.5 }), num(t('เวลาถึง −13 V (ms) =', 'time to −13 V (ms) ='), 173.3, { tol: 1 })] }),
  answer: () => t('ลาด −75 V/s ชนราง −13 V ที่ 173 ms (Boylestad ข้อ 10 ท้ายบทที่ 10, รูป 10.69)', 'A −75 V/s ramp that hits the −13 V rail at 173 ms (Boylestad chapter 10 Problem 10, Fig. 10.69).') };

/* the summing integrator of Fig. 10.40b: 200 kΩ, 100 kΩ, 1 MΩ with C = 1 µF (scale factors 5, 10, 1); the page chooses V_1 = 0.2 V, V_2 = −0.1 V, V_3 = 1 V */
const SI = { ground: 'g', mode: 'tran', nodes: { g1: [0.2, -1.0], s1: [1.6, -1.0], r1: [3.4, -1.0], j1: [3.7, -1.0], g2: [0.2, 0.2], s2: [1.6, 0.2], r2: [3.4, 0.2], j2: [3.7, 0.2], g3: [0.2, 1.4], s3: [1.6, 1.4], r3: [3.4, 1.4], j3: [3.7, 1.4], sg: [0.2, 3.4],
    N: [4, 1.4], P: [4, 2.6], g: [4, 3.4], nf: [4, -1.8], of: [6.2, -1.8], O: [6.2, 2], o: [7.4, 2] }, grounds: ['g', 'sg'],
  parts: [src('V1', 's1', 'g1', 0.2, 'V_1', { side: -1 }), res('R1', 's1', 'r1', 200e3, 'R_1'), W_('r1', 'j1'), W_('j1', 'j2'), W_('g1', 'g2'), src('V2', 's2', 'g2', -0.1, 'V_2', { side: -1 }), res('R2', 's2', 'r2', 100e3, 'R_2'), W_('r2', 'j2'), W_('j2', 'j3'), W_('g2', 'g3'),
    src('V3', 's3', 'g3', 1, 'V_3', { side: -1 }), res('R3', 's3', 'r3', 1e6, 'R_3'), W_('r3', 'j3'), W_('j3', 'N'), W_('g3', 'sg'), W_('N', 'nf'), cap('C', 'nf', 'of', 1e-6, 'C'), W_('of', 'O'), W_('P', 'g'), oa('P', 'N', 'O', {}), W_('O', 'o'), hid('sg', 'g')] };
DEF.sumint = { ...LAYT, cktAspM: 0.66, solvedAt: 1, init: s => { s.st.rec = new OP.Rec(4, 1600, OUTS, 8); }, tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); },
  spec: () => SI, glow: k => (k === 1 ? ['R1', 'R2', 'R3'] : k === 2 ? ['C'] : null),
  badge: (k, s) => { const rec = s.st.rec; return k >= 1 ? bdg(`${t('ความชันรวม', 'net slope')} −1 V/s · t = ${fd(rec.t, 2)} s, v_o = ${vtx(rec.last('vo'))}`) : bdg('V_1 = 0.2 V, V_2 = −0.1 V, V_3 = 1 V', null, false); },
  waves: [{ draw: (ctx, b, bd, k, s) => OP.timePlot(ctx, b, s.st.rec, { sigs: [{ key: 'vo', color: C.q, label: 'v_o', w: 2.8 }], y: [-6, 2], yt: [-6, -4, -2, 0, 2], xt: [1, 2, 3, 4], title: bd.short ? '' : t('v_o(t) = −[5∫V_1 + 10∫V_2 + 1∫V_3] dt', 'v_o(t) = −[5∫V_1 + 10∫V_2 + 1∫V_3] dt'), short: bd.short,
    curves: [], hl: [{ y: 0 }] }) }],
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>ตัวคูณสเกลของแต่ละขา</b> (สมการ 10.14, รูป 10.40c): ขาเข้าแต่ละขามี 1/R<sub>k</sub>C ของตัวเอง', '<b>The scale factor of each input</b> (Eq. 10.14, Fig. 10.40c): each input has its own 1/R<sub>k</sub>C'),
      block([R`\frac{1}{R_1C} &= \frac{1}{(200\ \text{k}\Omega)(1\ \mu\text{F})} = 5,\quad \frac{1}{R_2C} = 10,\quad \frac{1}{R_3C} = 1\ \ (\text{s}^{-1})`])),
    step(t('<b>ความชันรวมของขาออก</b> ด้วยขาเข้าคงที่ที่เลือกไว้: กระแสทั้งสามรวมกันเข้า C', '<b>The net slope of the output</b> with the chosen constant inputs: the three currents add up into C'),
      block([R`\frac{dv_o}{dt} &= -[5(0.2) + 10(-0.1) + 1(1)]\ \text{V/s} = -[1 - 1 + 1]\ \text{V/s} = \boxed{-1\ \text{V/s}}`]),
      t('ขา \\(V_2\\) ที่เป็นลบหักล้างขา \\(V_1\\) พอดี เหลือแต่ขา \\(V_3\\) ลองคิดใหม่ถ้า \\(V_2\\) = 0: ความชัน −2 V/s', 'The negative \\(V_2\\) input exactly cancels the \\(V_1\\) input, leaving the \\(V_3\\) one. With \\(V_2\\) = 0 the slope would be −2 V/s.'))],
  ask: () => ({ fields: [num(t('ความชัน (V/s) =', 'slope (V/s) ='), -1, { tol: 0.02 }), num(t('v<sub>o</sub> ที่ 3 s (V) =', 'v<sub>o</sub> at 3 s (V) ='), -3, { tol: 0.05 })] }),
  answer: () => t('ลาด −1 V/s: −3 V ที่ 3 s (Boylestad รูป 10.40b–c, สมการ 10.14)', 'A −1 V/s ramp: −3 V at 3 s (Boylestad Fig. 10.40b–c, Eq. 10.14).') };

/* the differentiator (Fig. 10.41): a ±1 V, 100 Hz triangle through C = 0.1 µF with R = 10 kΩ (RC = 1 ms) gives a ∓0.4 V square wave */
const DF = { kind: 'diff', C: 0.1e-6, Rf: 10e3, rfName: 'R', mode: 'tran', sig: triSrc(1, 0.01) };
DEF.diff = { ...LAYT, solvedAt: 1, init: s => { s.st.rec = new OP.Rec(0.02, 1000, OUTS, 6); }, tick: (dt, s) => { if (s.solved) s.st.rec.run(s.ckt, dt); }, vo: () => ({ speed: 80 / 4e-5, dotRef: 4e-5 }),   // the triangle starts at 0 V: the dots' reference current is the 40 µA of the ramps, not the first solve
  spec: () => spec('diff', DF), glow: k => (k === 1 ? ['C'] : k === 2 ? ['Rf'] : null),
  badge: (k, s) => { const rec = s.st.rec; return k >= 1 ? bdg(`v_o = −RC dv_1/dt = ∓0.4 V · t = ${fd(rec.t * 1e3, 1)} ms, v_o = ${vtx(rec.last('vo'))}`) : bdg('v_1: ±1 V triangle, 100 Hz · C = 0.1 µF, R = 10 kΩ', null, false); },
  waves: tranWaves({ ms: true, xt: [5, 10, 15, 20], y: [-1, 1], yt: [-0.8, -0.4, 0, 0.4, 0.8], t2: t('ขาออก: คลื่นสี่เหลี่ยม ∓0.4 V', 'output: a ∓0.4 V square wave'), hl: (k, s, sh) => (sh ? [] : [{ y: -0.4, color: C.tan }, { y: 0.4, color: C.tan }]) }),
  after: (v, k, s) => { if (k >= 1) OP.tags(v, s.ckt, { vg: 'N' }); },
  steps: () => [
    step(t('<b>กระแสของตัวเก็บประจุ</b> (สไลด์หน้า 6): ปลายขวาของ C อยู่ที่กราวด์เสมือน แรงดันคร่อม C จึงเท่ากับ \\(v_1\\) และกระแสเป็นอนุพันธ์ของมัน', '<b>The capacitor\'s current</b> (slide p. 6): the right end of C is at the virtual ground, so the voltage across C equals \\(v_1\\) and its current is the derivative'),
      block([R`i &= C\frac{dv_1}{dt},\qquad \frac{dv_1}{dt} = \pm\frac{2\ \text{V}}{5\ \text{ms}} = \pm 400\ \text{V/s}`]),
      t('คลื่นสามเหลี่ยม ±1 V ที่ 100 Hz ขึ้น 2 V ในครึ่งคาบ 5 ms แล้วลง 2 V ในอีก 5 ms', 'The ±1 V, 100 Hz triangle rises 2 V in a 5 ms half period, then falls 2 V in the next.')),
    step(t('<b>กระแสนั้นผ่าน R ไปขาออก</b> (สมการ 10.15)', '<b>That current flows through R to the output</b> (Eq. 10.15)'),
      block([R`v_o &= -iR = -RC\frac{dv_1}{dt} = -(10\ \text{k}\Omega)(0.1\ \mu\text{F})(\pm 400\ \text{V/s}) = \boxed{\mp 0.4\ \text{V}}`]),
      t('ขาออกเป็นคลื่นสี่เหลี่ยม: −0.4 V ขณะขาเข้าขึ้น +0.4 V ขณะลง · ถ้าขาเข้าเป็นขั้นหรือคลื่นสี่เหลี่ยม อนุพันธ์เป็นอนันต์ ขาออกจะกระชากชนรางชั่วขณะ (ส่วน A ลองได้)', 'The output is a square wave: −0.4 V while the input rises, +0.4 V while it falls. For a step or square input the derivative is infinite and the output spikes to the rail for an instant (try it in section A).'))],
  ask: () => ({ fields: [num('dv<sub>1</sub>/dt (V/s) =', 400, { tol: 1 }), num(t('|v<sub>o</sub>| (V) =', '|v<sub>o</sub>| (V) ='), 0.4, { tol: 0.005 })] }),
  answer: () => t('คลื่นสี่เหลี่ยม ∓0.4 V (Boylestad รูป 10.41, สมการ 10.15)', 'A ∓0.4 V square wave (Boylestad Fig. 10.41, Eq. 10.15).') };

/* ---------------- page 7.5: active filters (slides II pp. 7–17; Examples 11.12–11.14) ---------------- */
/* the Bode magnitude plot of a filter: sw = the engine's sweep, Av the passband gain, fc the formula's cutoff, order n (the asymptote's slope), hp (high-pass), f (the current frequency) */
OP.bode = (ctx, b, bd, o) => { const sw = o.sw, f0 = sw[0][0], f1 = sw[sw.length - 1][0], AdB = dB(o.Av), lo = o.lo ?? -50, hi = o.hi ?? Math.ceil((AdB + 10) / 10) * 10, dec = [];
  for (let d = Math.ceil(Math.log10(f0)); d <= Math.floor(Math.log10(f1)); d++) dec.push(Math.pow(10, d));
  const asym = o.fc ? (x => (o.hp ? (x < o.fc ? AdB - 20 * o.n * Math.log10(o.fc / x) : AdB) : (x > o.fc ? AdB - 20 * o.n * Math.log10(x / o.fc) : AdB))) : null;
  const cur = o.f ? sw.length && (() => { const c = new CK.Circuit({ ...o.spec, mode: 'ac', w: TAU * o.f }); c.solve(); return Cx.abs(c.V('o')); })() : NaN;
  OP.plot(ctx, b, { x: [f0, f1], y: [lo, hi], logx: true, xt: dec, yt: [...Array(Math.floor((hi - lo) / 10) + 1).keys()].map(k => lo + 10 * k), yf: y => `${y}`, xl: 'f (Hz)', yl: '|V_o/V_1| (dB)', title: bd.short ? '' : o.title,
    curves: [{ pts: sw.map(([f, g]) => [f, dB(g)]), color: C.curve, w: 2.8, label: bd.short ? '' : t('ตัวแก้วงจร', 'engine') }].concat(asym ? [{ f: asym, color: C.tan, w: 1.6, dash: [6, 4], label: bd.short ? '' : `−${20 * o.n} dB/decade` , labelAt: o.hp ? o.fc / 8 : o.fc * 8 }] : []),
    hl: [{ y: AdB, color: 'rgba(232,236,247,.3)', label: bd.short ? '' : `A_v = ${fd(o.Av, 2)} = ${fd(AdB, 1)} dB` }, { y: AdB - 3, color: PURPLE, dash: [2, 3], label: bd.short ? '' : '−3 dB', left: true }],
    vl: (o.fc ? [{ x: o.fc, color: C.tan, label: bd.short ? '' : (o.fcLabel || `f_c = ${fHz(o.fc)}`), top: true }] : []).concat((o.fcs || []).map(q => ({ x: q.f, color: C.tan, label: bd.short ? '' : q.label, top: true }))).concat(o.f3 ? [{ x: o.f3, color: PURPLE, dash: [2, 3], label: bd.short ? '' : `−3 dB ${t('จริง', 'actual')} ${fHz(o.f3)}` }] : []).concat(o.f3b ? [{ x: o.f3b, color: PURPLE, dash: [2, 3], label: bd.short ? '' : `${fHz(o.f3b)}` }] : []),
    pts: o.f ? [{ x: o.f, y: dB(cur), label: bd.short ? '' : `${fHz(o.f)}: ${fd(dB(cur), 1)} dB`, side: o.f > Math.sqrt(f0 * f1) ? -1 : 1 }] : [], guides: o.f ? [{ x: o.f, y: dB(cur) }] : [] }); };
/* the input and output sinusoids at the board's clock */
OP.acWaves = (ctx, b, bd, c, o = {}) => { const vi = c.V(o.inNode || 's'), vo = c.V('o'), ang = q => CH6.deg(q), m = Math.max(Cx.abs(vi), Cx.abs(vo), 1e-9);
  CH6.waves(ctx, b, [{ mag: Cx.abs(vi), ang: ang(vi), color: C.elec, label: 'v_1', unit: 'V', g: 'v', w: 2 }, { mag: Cx.abs(vo), ang: ang(vo), color: C.q, label: 'v_o', unit: 'V', g: 'v', w: 3 }], { now: bd.clk.ph, w: c.w, max: { v: m }, title: bd.short ? '' : (o.title || t(`ที่ ${fHz(c.w / TAU)}: 1 รอบใช้ 4 วินาที`, `at ${fHz(c.w / TAU)}: one cycle takes 4 s`)) }); };
const fcOf = (r, c) => 1 / (TAU * r * c);
const F12 = { kind: 'lp1', R1: 1200, C1: 0.02e-6, RG: 10e3, RF: 50e3 }, FC12 = fcOf(1200, 0.02e-6), SW12 = OP.sweep(f => OP.ckt({ ...F12, f }), 10, 1e6, 73);
const atF = (o, f) => spec(`${o.kind}_${f}`, { ...o, f });
DEF.ex1112 = { ...LAY, solvedAt: 1, spec: k => atF(F12, k >= 3 ? 66300 : k >= 2 ? 6630 : 100), glow: k => (k === 1 ? ['RG', 'RF'] : k === 2 ? ['R1', 'C1'] : null),
  badge: (k, s) => { const c = s.ckt, g = Cx.abs(c.V('o')); return k >= 1 ? bdg(`f = ${fHz(c.w / TAU)}: |V_o/V_1| = ${fd(g, 3)} = ${fd(dB(g), 1)} dB`) : bdg('R_1 = 1.2 kΩ, C_1 = 0.02 µF, R_G = 10 kΩ, R_F = 50 kΩ', null, false); },
  side: (ctx, b, bd, k, s) => OP.bode(ctx, b, bd, { sw: SW12, Av: 6, fc: FC12, n: 1, f: k >= 1 ? s.ckt.w / TAU : 0, spec: s.spec, title: t('ตัวกรองผ่านต่ำอันดับหนึ่ง: −20 dB/decade', 'first-order low-pass: −20 dB/decade') }),
  waves: [{ draw: (ctx, b, bd, k, s) => OP.acWaves(ctx, b, bd, s.ckt) }],
  steps: () => [
    step(t('<b>อัตราขยายในแถบผ่าน</b> (สมการ 11.13): ออปแอมป์ต่อเป็นวงจรไม่กลับเฟสด้วย \\(R_G\\), \\(R_F\\) (สไลด์ไม่ให้ค่า หน้านี้ใช้ 10 kΩ กับ 50 kΩ ของ Example 11.13)', '<b>The passband gain</b> (Eq. 11.13): the op-amp is a noninverting amplifier with \\(R_G\\), \\(R_F\\) (the slide gives no values; this page uses the 10 kΩ and 50 kΩ of Example 11.13)'),
      block([R`A_v &= 1 + \frac{R_F}{R_G} = 1 + \frac{50\ \text{k}\Omega}{10\ \text{k}\Omega} = 6 = 15.6\ \text{dB}`])),
    step(t('<b>ความถี่ตัด</b> (สมการ 11.14): ตัวแบ่งแรงดัน \\(R_1\\)–\\(C_1\\) ให้ \\(V_+\\) = \\(V_1/\\sqrt 2\\) เมื่อ \\(X_{C1} = R_1\\)', '<b>The cutoff frequency</b> (Eq. 11.14): the \\(R_1\\)–\\(C_1\\) divider gives \\(V_+\\) = \\(V_1/\\sqrt 2\\) where \\(X_{C1} = R_1\\)'),
      block([R`f_{OH} &= \frac{1}{2\pi R_1C_1} = \frac{1}{2\pi(1.2 \times 10^3)(0.02 \times 10^{-6})} = \boxed{6.63\ \text{kHz}}`]),
      t('ภาพจำลองที่ 6.63 kHz: |V_o/V_1| = 6/√2 = 4.24 (−3 dB จากแถบผ่าน) และขาออกช้ากว่าขาเข้า 45°', 'The simulation at 6.63 kHz: |V_o/V_1| = 6/√2 = 4.24 (3 dB below the passband) and the output lags the input by 45°.')),
    step(t('<b>ความชัน −20 dB ต่อทศ</b> (สไลด์หน้า 10): หนึ่งทศเหนือ \\(f_{OH}\\) อัตราขยายเหลือหนึ่งในสิบ', '<b>The −20 dB per decade slope</b> (slide p. 10): one decade above \\(f_{OH}\\) the gain is down to a tenth'),
      block([R`|A_v(66.3\ \text{kHz})| &\cong \frac{6}{10} = 0.6 = 15.6 - 20 = -4.4\ \text{dB}`]),
      t('ตัวกรองอันดับหนึ่งค่อย ๆ ลด ไม่ตัดขาดเหมือนรูปอุดมคติหน้า 7', 'A first-order filter rolls off gently, nothing like the brick wall of the ideal response on p. 7.'))],
  ask: () => ({ fields: [num('A<sub>v</sub> =', 6, { tol: 0.02 }), num('f<sub>OH</sub> (kHz) =', 6.63, { tol: 0.03 })] }),
  answer: () => t('\\(f_{OH}\\) = 6.63 kHz, \\(A_v\\) = 6 (Boylestad Example 11.12)', '\\(f_{OH}\\) = 6.63 kHz, \\(A_v\\) = 6 (Boylestad Example 11.12).') };

const F13 = { kind: 'hp2', R1: 2100, R2: 2100, C1: 0.05e-6, C2: 0.05e-6, RG: 10e3, RF: 50e3 }, FC13 = fcOf(2100, 0.05e-6), SW13 = OP.sweep(f => OP.ckt({ ...F13, f }), 10, 1e6, 73), F3_13 = OP.at(SW13, 6 / Math.SQRT2, 'hi', f => OP.ckt({ ...F13, f }));
DEF.ex1113 = { ...LAY, solvedAt: 1, spec: k => atF(F13, k >= 4 ? 151.6 : k >= 2 ? 1516 : 50000), glow: k => (k === 1 ? ['RG', 'RF'] : k === 2 ? ['R1', 'C1', 'R2', 'C2'] : null),
  badge: (k, s) => { const c = s.ckt, g = Cx.abs(c.V('o')); return k >= 1 ? bdg(`f = ${fHz(c.w / TAU)}: |V_o/V_1| = ${fd(g, 3)} = ${fd(dB(g), 1)} dB`) : bdg('R_1 = R_2 = 2.1 kΩ, C_1 = C_2 = 0.05 µF, R_G = 10 kΩ, R_F = 50 kΩ', null, false); },
  side: (ctx, b, bd, k, s) => OP.bode(ctx, b, bd, { sw: SW13, Av: 6, fc: FC13, n: 2, hp: true, f: k >= 1 ? s.ckt.w / TAU : 0, spec: s.spec, f3: k >= 3 ? F3_13 : 0, lo: -70, title: t('ตัวกรองผ่านสูงอันดับสอง: −40 dB/decade', 'second-order high-pass: −40 dB/decade') }),
  waves: [{ draw: (ctx, b, bd, k, s) => OP.acWaves(ctx, b, bd, s.ckt) }],
  steps: () => [
    step(t('<b>อัตราขยายในแถบผ่าน</b> (สมการ 11.13)', '<b>The passband gain</b> (Eq. 11.13)'), block([R`A_v &= 1 + \frac{R_F}{R_G} = 1 + \frac{50\ \text{k}\Omega}{10\ \text{k}\Omega} = \boxed{6}`])),
    step(t('<b>ความถี่ตัด</b> (สมการ 11.15): ตำราใช้สูตรเดียวกับอันดับหนึ่ง เมื่อ \\(R_1 = R_2\\), \\(C_1 = C_2\\)', '<b>The cutoff frequency</b> (Eq. 11.15): the book uses the first-order formula when \\(R_1 = R_2\\), \\(C_1 = C_2\\)'),
      block([R`f_{OL} &= \frac{1}{2\pi R_1C_1} = \frac{1}{2\pi(2.1 \times 10^3)(0.05 \times 10^{-6})} = \boxed{1.5\ \text{kHz}}`])),
    step(t('<b>ข้อค้นพบจากภาพจำลอง</b>: ที่ 1.5 kHz วงจรจริงให้ |V_o/V_1| = 2 (−9.5 dB) ไม่ใช่ 4.24 (−3 dB) เพราะ \\(R_1C_1\\) สองชุดต่อกันโดยไม่มีบัฟเฟอร์ ชุดที่สองโหลดชุดแรก ฟังก์ชันถ่ายโอนของบันไดนี้คือ', '<b>What the simulation finds</b>: at 1.5 kHz the actual circuit gives |V_o/V_1| = 2 (−9.5 dB), not 4.24 (−3 dB), because the two \\(R_1C_1\\) sections are cascaded without a buffer and the second loads the first. The ladder\'s transfer function is'),
      block([R`\frac{V_+}{V_1} &= \frac{(sRC)^2}{(sRC)^2 + 3sRC + 1}\quad\Rightarrow\quad \left|\frac{V_+}{V_1}\right|_{f = f_{OL}} = \frac{1}{3}`]),
      t(`จุด −3 dB จริงอยู่ที่ 2.67\\(f_{OL}\\) = ${fHz(F3_13)} (เส้นประม่วงในกราฟ) สูตรของตำราให้เฉพาะจุดตัดของเส้นกำกับ ตัวกรองอันดับสองที่ความถี่ตัดตรงสูตรต้องใช้โครงสร้าง Sallen–Key ที่ป้อนกลับผ่านตัวเก็บประจุ`, `The actual −3 dB point lies at 2.67\\(f_{OL}\\) = ${fHz(F3_13)} (the purple dashed line in the graph). The book's formula gives only where the asymptotes meet; a second-order filter whose cutoff matches the formula needs the Sallen–Key structure with feedback through a capacitor.`)),
    step(t('<b>ความชัน −40 dB ต่อทศ</b> (สไลด์หน้า 13): หนึ่งทศใต้ \\(f_{OL}\\) อัตราขยายเหลือหนึ่งในร้อย ชันกว่าอันดับหนึ่งสองเท่า', '<b>The −40 dB per decade slope</b> (slide p. 13): one decade below \\(f_{OL}\\) the gain is down to a hundredth, twice as steep as first order'),
      block([R`|A_v(151.6\ \text{Hz})| &\cong \frac{6}{100} = 0.06 = -24.4\ \text{dB}`]), t('ตัวแก้วงจร: 0.058 (−24.7 dB) ใกล้เส้นกำกับแล้วเพราะอยู่ห่างความถี่ตัดจริงกว่าหนึ่งทศ', 'The engine: 0.058 (−24.7 dB), close to the asymptote because the point lies more than a decade below the actual cutoff.'))],
  ask: () => ({ fields: [num('A<sub>v</sub> =', 6, { tol: 0.02 }), num(t('f<sub>OL</sub> ตามสูตร (kHz) =', 'f<sub>OL</sub> by the formula (kHz) ='), 1.516, { tol: 0.03 })] }),
  answer: () => t(`\\(A_v\\) = 6, \\(f_{OL}\\) ≈ 1.5 kHz ตามตำรา (Boylestad Example 11.13) จุด −3 dB จริงของวงจรนี้อยู่ที่ ${fHz(F3_13)}`, `\\(A_v\\) = 6, \\(f_{OL}\\) ≈ 1.5 kHz by the book (Boylestad Example 11.13); the circuit's actual −3 dB point is at ${fHz(F3_13)}.`) };

const F14 = { kind: 'bp', R1: 10e3, R2: 10e3, C1: 0.1e-6, C2: 0.002e-6, RG: 10e3, RF: 50e3 }, FL14 = fcOf(10e3, 0.1e-6), FH14 = fcOf(10e3, 0.002e-6), SW14 = OP.sweep(f => OP.ckt({ ...F14, f }), 1, 1e6, 85);
DEF.ex1114 = { ...LAY, cktAspM: 0.42, wideAt: 1e9, solvedAt: 1, spec: k => atF(F14, k >= 3 ? 7960 : k >= 2 ? 159.15 : 1000), glow: k => (k === 1 ? ['C1', 'R1'] : k === 2 ? ['R2', 'C2'] : null),
  badge: (k, s) => { const c = s.ckt, g = Cx.abs(c.V('o')); return k >= 1 ? bdg(`f = ${fHz(c.w / TAU)}: |V_o/V_1| = ${fd(g, 2)} = ${fd(dB(g), 1)} dB`) : bdg('R_1 = R_2 = 10 kΩ, C_1 = 0.1 µF, C_2 = 0.002 µF', null, false); },
  side: (ctx, b, bd, k, s) => { const o = { sw: SW14, Av: 36, f: k >= 1 ? s.ckt.w / TAU : 0, spec: s.spec, lo: -30, hi: 40, title: t('ผ่านแถบ: ผ่านสูง 159 Hz แล้วผ่านต่ำ 7.96 kHz', 'bandpass: high-pass at 159 Hz, then low-pass at 7.96 kHz') };
    OP.plot(ctx, b, { x: [1, 1e6], y: [o.lo, o.hi], logx: true, xt: [1, 10, 100, 1e3, 1e4, 1e5, 1e6], yt: [-30, -20, -10, 0, 10, 20, 30, 40], yf: y => `${y}`, xl: 'f (Hz)', yl: '|V_o/V_1| (dB)', title: bd.short ? '' : o.title,
      curves: [{ pts: SW14.map(([f, g]) => [f, dB(g)]), color: C.curve, w: 2.8 }], hl: [{ y: dB(36), color: 'rgba(232,236,247,.3)', label: bd.short ? '' : 'A_mid = 36 = 31.1 dB' }, { y: dB(36) - 3, color: PURPLE, dash: [2, 3], label: bd.short ? '' : '−3 dB', left: true }],
      vl: [{ x: FL14, color: C.tan, label: bd.short ? '' : `f_OL = ${fHz(FL14)}`, top: true }, { x: FH14, color: C.tan, label: bd.short ? '' : `f_OH = ${fHz(FH14)}`, top: true }],
      pts: o.f ? [{ x: o.f, y: dB(Cx.abs(s.ckt.V('o'))), label: bd.short ? '' : `${fHz(o.f)}: ${fd(dB(Cx.abs(s.ckt.V('o'))), 1)} dB`, side: o.f > 1e3 ? -1 : 1 }] : [], guides: o.f ? [{ x: o.f, y: dB(Cx.abs(s.ckt.V('o'))) }] : [] }); },
  waves: [{ draw: (ctx, b, bd, k, s) => OP.acWaves(ctx, b, bd, s.ckt) }],
  steps: () => [
    step(t('<b>ขั้นแรก: ผ่านสูงอันดับหนึ่ง</b> (สไลด์หน้า 15, รูป 11.34 ซ้าย): \\(C_1\\) อนุกรม \\(R_1\\) ลงกราวด์ ความถี่ตัดล่าง', '<b>First stage: a first-order high-pass</b> (slide p. 15, Fig. 11.34 left): \\(C_1\\) in series, \\(R_1\\) to ground; the lower cutoff'),
      block([R`f_{OL} &= \frac{1}{2\pi R_1C_1} = \frac{1}{2\pi(10 \times 10^3)(0.1 \times 10^{-6})} = \boxed{159.15\ \text{Hz}}`])),
    step(t('<b>ขั้นที่สอง: ผ่านต่ำอันดับหนึ่ง</b> (รูป 11.34 ขวา): \\(R_2\\) อนุกรม \\(C_2\\) ลงกราวด์ ความถี่ตัดบน ขาออกของขั้นแรกมีความต้านทานต่ำ ขั้นที่สองจึงไม่โหลดมัน: การตอบสนองเป็นผลคูณของทั้งสอง (ต่างจาก Example 11.13)', '<b>Second stage: a first-order low-pass</b> (Fig. 11.34 right): \\(R_2\\) in series, \\(C_2\\) to ground; the upper cutoff. The first stage\'s output resistance is low, so the second does not load it: the response is the product of the two (unlike Example 11.13)'),
      block([R`f_{OH} &= \frac{1}{2\pi R_2C_2} = \frac{1}{2\pi(10 \times 10^3)(0.002 \times 10^{-6})} = \boxed{7.96\ \text{kHz}}`])),
    step(t('<b>อัตราขยายกลางแถบ</b>: ออปแอมป์ทั้งสองมี \\(R_G\\) = 10 kΩ, \\(R_F\\) = 50 kΩ (หน้านี้เลือก) ขยาย 6 × 6', '<b>The mid-band gain</b>: both op-amps have \\(R_G\\) = 10 kΩ, \\(R_F\\) = 50 kΩ (this page\'s choice), 6 × 6'),
      block([R`A_{\text{mid}} &= \left(1 + \frac{R_F}{R_G}\right)^2 = 36 = 31.1\ \text{dB}`]),
      t('แถบผ่านกว้าง 159 Hz – 7.96 kHz (ราว 1.7 ทศ) ที่ความถี่ตัดแต่ละข้างอัตราขยายลด 3 dB และลาด −20 dB ต่อทศออกไปทั้งสองข้าง (สไลด์หน้า 16)', 'The passband runs from 159 Hz to 7.96 kHz (about 1.7 decades); at each cutoff the gain is 3 dB down and rolls off at −20 dB per decade on both sides (slide p. 16).'))],
  ask: () => ({ fields: [num('f<sub>OL</sub> (Hz) =', 159.15, { tol: 0.5 }), num('f<sub>OH</sub> (kHz) =', 7.96, { tol: 0.03 })] }),
  answer: () => t('\\(f_{OL}\\) = 159.15 Hz, \\(f_{OH}\\) = 7.96 kHz (Boylestad Example 11.14)', '\\(f_{OL}\\) = 159.15 Hz, \\(f_{OH}\\) = 7.96 kHz (Boylestad Example 11.14).') };

OP.S = { X105, X106, SW12, SW13, SW14, FC12, FC13, F3_13, FL14, FH14 };
OP.DEF = DEF;
OP.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.OP = OP;
})(window);
