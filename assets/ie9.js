/* ie9.js — supplements A and B: small-signal (ac) analysis of BJT and FET amplifiers, built from the textbook because the course slides stop
   at dc biasing. Sources: Boylestad & Nashelsky, Electronic Devices and Circuit Theory, 11th ed., chapter 5 (BJT AC Analysis) and chapter 8
   (FET Amplifiers). The global is AC.
   The engine solves the real amplifier: coupling and bypass capacitors, the supply, and a transistor whose model is set up so that its
   operating point is the book's (V_BE = 0.7 V at the solved base current, I_C = βI_B, and r_o = 1/(slope) at the Q-point; for a FET Shockley's
   equation with r_d = 1/y_os). A dc solve finds the Q-point, an ac solve (circuit.js mode 'ac' with dcFirst) linearises the transistor there:
   g_m = I_C/V_T, r_π = V_T/I_B, r_o (BJT); g_m = 2I_DSS/|V_P|·(1 − V_GS/V_P) (or 2k(V_GS − V_T)), r_d (FET). The book's r_e model is the same
   small-signal circuit with I_C ≅ I_E, so the hand results and the engine agree to about 1 %; the pages say where the difference comes from.
   1) the transistor models (AC.tune) · 2) the amplifiers (AC.bjt, AC.fet) · 3) measurements of a solved amplifier (AC.measure)
   4) the small-signal equivalent circuits (AC.eq) · 5) pictures (scope, bars, transfer curve with its slope) · 6) the problems (AC.DEF) */
(function (global) {
'use strict';
const AC = {}, Cx = CK.Cx, fd = CH6.fd, R = String.raw, C = IE.COL, T = CH6.text, COL = CH6.COL, TAU = 2 * Math.PI, PURPLE = '#c792ea';
const t = (th, en) => MC.t(th, en), tt = p => IE.tt(p);
/* V_T = 26 mV exactly, as the book's r_e = 26 mV/I_E: the temperature (°C) at which kT/q = 26 mV with the engine's constants */
const VT = 0.026, TVT = VT * 1.6e-19 / 1.38e-23 - 273;
AC.VT = VT;
const kO = r => CK.eng(r, 'Ω'), uF = c => `${LS.u(c * 1e6, 3)} µF`;
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o });
const res = (id, a, b, r, name, o = {}) => ({ id, type: 'R', a, b, value: r, name, valText: kO(r), ...o });
const cap = (id, a, b, c, name, o = {}) => ({ id, type: 'C', a, b, value: c, name, valText: uF(c), ...o });

/* =====================================================================================================================
   1) the transistor models. A BJT gets a Shockley base–emitter junction at V_T = 26 mV whose saturation current is chosen so that V_BE = 0.7 V
   at the base current the circuit settles to (the book's dc analysis), so the dc point is the book's exact one; r_o comes from an Early
   voltage, with β scaled down by (1 + V_CE/V_A) so that I_C = βI_B still holds at the Q-point. A FET gets λ (circuit.js lam) for r_d, with
   I_DSS (or k) scaled by 1/(1 + λV_DS) for the same reason. Each call returns a new spec; the parts carry the tuned values. */
/* the dc operating point of a spec: the ac sources off */
AC.dcOf = sp => { const c = new CK.Circuit({ ...sp, mode: 'dc', dcFirst: false, parts: sp.parts.map(p => (p.type === 'VAC' || p.type === 'IAC' ? { ...p, amp: 0 } : p)) }); c.solve(); return c; };
AC.tune = (spec, o = {}) => {
  const sp = { ...spec, parts: spec.parts.map(p => ({ ...p })) }, dcC = () => AC.dcOf(sp);
  const qs = sp.parts.filter(p => p.type === 'Q'), j = sp.parts.find(p => p.type === 'J');
  if (qs.length) { const cfg = (spec.o && spec.o.cfg) || 'fixed';
    /* the junction's V_T: the engine's small-signal model is a hybrid-π (g_m = I_C/V_T, r_π = V_T/I_B). With V_T = 26 mV·β/(β + 1) it is
       exactly the book's common-emitter r_e model (Z_b = βr_e, the source βI_b = v_be/r_e, r_e = 26 mV/I_E); with V_T = 26 mV the emitter sees
       exactly r_e = 26 mV/I_E and the collector αI_e, the book's common-base and emitter-follower model */
    const S = qs.map(q => { const beta = q.betaBook ?? q.beta ?? 100, vt = o.vt ?? ((cfg === 'cb' || cfg === 'ef') ? VT : VT * beta / (beta + 1));
      q.betaBook = beta; q.beta = beta; q.vtUsed = vt; delete q.va; q.be = { model: 'shockley', n: 1, T: vt * 1.6e-19 / 1.38e-23 - 273, Is: 1e-15 }; return { q, beta, vt, ro: o.ro ?? q.ro }; });
    const vbe = o.vbe ?? 0.7;
    for (let k = 0; k < 8; k++) { const c = dcC();
      S.forEach(x => { const z = c.Q(x.q.id); if (!(z.IB > 1e-12)) return; x.q.be = { ...x.q.be, Is: z.IB / Math.expm1(vbe / x.vt) };
        if (x.ro && isFinite(x.ro) && z.VCE > 0.2) { const va = x.ro * z.IC - z.VCE; if (va > 1) { x.q.va = va; x.q.beta = x.beta / (1 + z.VCE / va); } } }); } }
  if (j) { const rd = o.rd ?? j.rd; if (rd && isFinite(rd)) { const kind = j.kind || 'jfet', base = { idss: j.idssBook ?? j.idss, k: j.kBook ?? j.k };
      j.idssBook = base.idss; j.kBook = base.k; delete j.lam; if (kind === 'emos') j.k = base.k; else j.idss = base.idss;
      for (let k = 0; k < 6; k++) { const c = dcC(), z = c.J(j.id), id0 = Math.abs(z.ID), vds = Math.abs(z.VDS); if (!(id0 > 1e-9)) break;
        const lam = 1 / (rd * id0 - vds); if (!(lam > 0)) break; j.lam = lam; const f = 1 / (1 + lam * vds); if (kind === 'emos') j.k = base.k * f; else j.idss = base.idss * f; } } }
  return sp;
};

/* =====================================================================================================================
   2) the amplifiers, drawn like the book's figures: the source v_s (and R_s) on the left, coupling capacitor C_1 into the base (gate),
   the bias resistors, the transistor in the middle, C_2 to the load R_L (or an open output terminal) on the right, V_CC on the far right.
   Grid: top rail y = −1.2 (V_CC), bottom rail y = 4 (ground), the transistor's C (D) at (3.1, 0.75), E (S) at (3.1, 2.45), B (G) at (2.3, 1.6).
   o = { dev: 'bjt' | 'jfet' | 'dmos' | 'emos', cfg: 'fixed' | 'vdb' | 'ef' (emitter/source follower) | 'cb' (common base/gate) | 'cf' (collector or
   drain feedback), VCC, VEE (cb: the emitter supply), VGG (jfet fixed bias, positive number = gate negative), RB, R1, R2, RC, RE, CE (true: RE
   bypassed), RF, Rs, RL, vs (peak V), f (Hz), beta, ro, idss, vp, k, vt, rd, C1, C2, CEv (capacitor values), names: { … } overrides } */
const VS_DEF = 0.01, F_DEF = 100e3;   // 100 kHz: every coupling and bypass capacitor of the book's examples is a short to 0.1 % (the transistor has no internal capacitances: the book's mid-band model)
/* wires along a rail through every named node on it, in order of x (a wire joins only its two end nodes) */
const rail = (nodes, names) => { const ns = names.filter(n => nodes[n]).sort((a, b) => nodes[a][0] - nodes[b][0]), out = []; for (let k = 1; k < ns.length; k++) out.push(W_(ns[k - 1], ns[k])); return out; };
/* FET names as aliases: V_DD, R_D, R_S, C_S (bypass) for V_CC, R_C, R_E, C_E */
AC.norm = o => ({ ...o, VCC: o.VCC ?? o.VDD, RC: o.RC ?? o.RD, RE: o.RE ?? o.RS, CE: o.CE ?? o.CS, CEv: o.CEv ?? o.CSv });
AC.amp = (o0 = {}) => { const o = AC.norm(o0);
  const fet = o.dev && o.dev !== 'bjt', N = fet ? { B: 'G', C: 'D', E: 'S', RB: 'R_G', RC: 'R_D', RE: 'R_S', CE: 'C_S', VCC: 'V_DD', VEE: 'V_SS' } : { B: 'B', C: 'C', E: 'E', RB: 'R_B', RC: 'R_C', RE: 'R_E', CE: 'C_E', VCC: 'V_CC', VEE: 'V_EE' };
  const nm = Object.assign({}, N, o.names || {}), VCC = o.VCC || 0, cfg = o.cfg || 'fixed', cb = cfg === 'cb', outE = cfg === 'ef', parts = [], vs = o.vs ?? VS_DEF;
  const yi = cb ? 2.45 : 1.6, yo = outE ? 2.45 : 0.75, yG = cb ? 5.2 : outE ? 4.4 : 4;   // common base: the ground rail lower, to leave room for R_E and V_EE under the input line; a follower: for C_2's label under it
  /* with R_s the source moves left (R_s's label above the line, the v_i tag under it); with R_L the supply moves right (R_L's label between them) */
  const xs = o.Rs ? -3.6 : -3.0, xV = o.RL ? 8.4 : 7.6, xo = outE ? 6.3 : 5.8;   // a follower's C_2 label hangs under it: more room before R_L
  const nodes = { s: [xs, yi], gS: [xs, yG], i: [-1.2, yi], tC: [3.1, -1.2], c: [3.1, 0.75], e: [3.1, 2.45], ge: [3.1, yG], tV: [xV, -1.2], mV: [xV, 1.4], gV: [xV, yG], o: [xo, yo], gO: [xo, yG] };
  const top = ['tC', 'tV'], bot = ['gS', 'ge', 'gO', 'gV'];
  /* the source, its resistance and the supply */
  parts.push({ id: 'vs', type: 'VAC', a: 's', b: 'gS', amp: vs, phase: 0, name: 'v_s', valText: `${LS.u(vs * 1e3, 3)} mV` });
  parts.push(o.Rs ? res('Rs', 's', 'i', o.Rs, 'R_s') : W_('s', 'i'));
  const pnp = !!o.pnp;   // a pnp: the supplies turn round (V_CC below ground, V_EE above), the ac model is the same
  parts.push(VCC ? { id: 'VCC', type: 'V', a: pnp ? 'mV' : 'tV', b: pnp ? 'tV' : 'mV', value: VCC, name: nm.VCC, valText: `${pnp ? '−' : ''}${LS.u(VCC, 3)} V` } : W_('tV', 'mV'), W_('mV', 'gV'));
  if (cb) {   /* common base (gate): base to ground on the right of the symbol, the signal into the emitter, R_E to −V_EE (or ground) */
    Object.assign(nodes, { b: [3.9, 1.6], bG: [3.9, yG], eL: [0.9, 2.45], gL: [0.9, yG] }); bot.push('bG', 'gL'); delete nodes.ge; bot.splice(bot.indexOf('ge'), 1);
    parts.push(cap('C1', 'i', 'eL', o.C1 ?? 10e-6, 'C_1', { side: -1, stack: true }), W_('eL', 'e'), W_('b', 'bG'));
    if (o.VEE) { nodes.vE = [0.9, 3.85]; parts.push(res('RE', 'eL', 'vE', o.RE, nm.RE), { id: 'VEE', type: 'V', a: pnp ? 'vE' : 'gL', b: pnp ? 'gL' : 'vE', value: o.VEE, name: nm.VEE, valText: `${pnp ? '' : '−'}${LS.u(o.VEE, 3)} V` }); }
    else parts.push(res('RE', 'eL', 'gL', o.RE, nm.RE));
  } else {
    /* C_1's label (name over value) sits above the line, left of the bias column; the upper bias resistor stops short of the line (node bU)
       to leave room for it, and the lower one keeps the space under the line for its own label */
    Object.assign(nodes, { bL: [0.6, 1.6], tL: [0.6, -1.2], gL: [0.6, yG], b: [2.3, 1.6] });
    parts.push(cap('C1', 'i', 'bL', o.C1 ?? 10e-6, 'C_1', { side: 1, stack: true, labelOff: 0.5 }), W_('bL', 'b'));
    if (o.RB || o.R1) { top.push('tL'); nodes.bU = [0.6, 0.05]; parts.push(W_('bU', 'bL')); }
    if (o.RB) parts.push(res('RB', 'tL', 'bU', o.RB, nm.RB, { side: -1 }));
    if (o.R1) { parts.push(res('R1', 'tL', 'bU', o.R1, 'R_1', { side: -1 }), res('R2', 'bL', 'gL', o.R2, 'R_2', { side: -1 })); bot.push('gL'); }
    if (o.RG && cfg === 'fixed' && o.VGG) {   // R_G to the gate supply: V_GG > 0 makes the gate negative (a battery with + at ground), V_GG < 0 positive (a MOSFET)
      const neg = o.VGG > 0; nodes.vg = [0.6, 3.0]; bot.push('gL');
      parts.push(res('RG', 'bL', 'vg', o.RG, nm.RB), { id: 'VGG', type: 'V', a: neg ? 'gL' : 'vg', b: neg ? 'vg' : 'gL', value: Math.abs(o.VGG), name: 'V_GG', valText: `${LS.u(Math.abs(o.VGG), 3)} V` }); }
    else if (o.RG) { parts.push(res('RG', 'bL', 'gL', o.RG, nm.RB, { side: -1 })); bot.push('gL'); }
    /* collector (drain) feedback: R_F leaves a junction above the collector terminal (R_C ends there), runs left over the base and drops to the
       base line; its label hangs under it, between R_F and the base line */
    if (o.RF) { Object.assign(nodes, { cJ: [3.1, 0.1], fR: [2.3, 0.1], f: [0.6, 0.1] }); parts.push(W_('c', 'cJ'), W_('cJ', 'fR'), res('RF', 'fR', 'f', o.RF, 'R_F', { side: -1, stack: true, labelOff: 0.45 }), W_('f', 'bL')); }
    if (o.RE) { parts.push(res('RE', 'e', 'ge', o.RE, nm.RE, { side: -1 }));
      if (o.CE) { nodes.eC = [4.2, 2.45]; nodes.gC = [4.2, yG]; bot.push('gC'); parts.push(W_('e', 'eC'), cap('CE', 'eC', 'gC', o.CEv ?? 20e-6, nm.CE)); } }
    else parts.push(W_('e', 'ge'));
  }
  const cTop = o.RF && !cb ? 'cJ' : 'c';   // with R_F the collector resistor ends at R_F's junction
  parts.push(o.RC ? res('RC', 'tC', cTop, o.RC, nm.RC, { side: -1 }) : W_('tC', cTop));
  if (outE) { nodes.eO = [4.2, 2.45]; parts.push(W_('e', 'eO')); }   // a follower: C_2 starts right of the emitter, clear of the transistor's label
  parts.push(cap('C2', outE ? 'eO' : 'c', 'o', o.C2 ?? 10e-6, 'C_2', { side: outE ? -1 : 1, stack: true }));
  if (o.RL) parts.push(res('RL', 'o', 'gO', o.RL, 'R_L'));
  else { delete nodes.gO; bot.splice(bot.indexOf('gO'), 1); parts.push({ id: 'Rp', type: 'R', a: 'o', b: 'gV', value: 1e9, hidden: true, label: false }); }   // an open output: a hidden 1 GΩ gives it a dc level (and loads it by under 0.001 %)
  parts.push(...rail(nodes, top), ...rail(nodes, bot), AC.dev(o, 'c', 'b', 'e'));
  return AC.fitLabels({ ground: 'gV', nodes, parts, mode: 'ac', w: TAU * (o.f ?? F_DEF), dcFirst: true, o });
};
/* the transistor part: BJT (beta, ro) or FET (idss, vp | k, vt; rd) */
AC.dev = (o, c, b, e) => { if (o.dev && o.dev !== 'bjt') { const kind = o.dev;
    return { id: 'Q', type: 'J', D: c, G: b, S: e, kind, idss: o.idss, vp: o.vp, k: o.k, vt: o.vt, rd: o.rd, gate: kind === 'jfet' ? false : null, name: o.qName ?? '', valText: o.qText ?? '', pins: true }; }
  return { id: 'Q', type: 'Q', C: c, B: b, E: e, beta: o.beta ?? 100, ro: o.ro, pnp: !!o.pnp, name: o.qName ?? '', valText: o.qText ?? (o.alpha ? `α = ${o.alpha}` : `β = ${o.beta ?? 100}`), pins: true }; };

/* =====================================================================================================================
   3) measurements of an amplifier spec (tuned): the Q-point, and the small-signal results of the engine at f. Z_i = v_i/i_i at the amplifier's
   input terminal (after R_s), A_v = v_o/v_i, A_vs = v_o/v_s, Z_o from a 1 mA test current into the output with v_s = 0 and R_L removed (the book's
   definition), A_vNL = the no-load gain (R_L removed). Returns numbers (magnitudes and signed real parts) and the phasors */
AC.solve = sp => { const c = new CK.Circuit(sp); c.solve(); return c; };
AC.measure = (sp, o = {}) => {
  const c = AC.solve(sp), q = sp.parts.find(p => p.type === 'Q' || p.type === 'J'), isQ = q && q.type === 'Q';
  const vi = c.V('i'), vo = c.V('o'), vs = c.V('s'), ii = c.I('C1');
  const Zi = Cx.div(vi, ii), Av = Cx.div(vo, vi), Avs = Cx.div(vo, vs);
  /* Z_o: v_s off, R_L off, a test current into the output node */
  const zp = sp.parts.filter(p => p.id !== 'RL' && p.id !== 'Rp').map(p => (p.id === 'vs' ? { ...p, amp: 0 } : p)).concat([{ id: 'It', type: 'IAC', a: sp.ground, b: 'o', amp: 1e-3, phase: 0 }]);
  const cz = new CK.Circuit({ ...sp, parts: zp }); cz.solve(); const Zo = Cx.scale(cz.V('o'), 1e3);
  /* no-load gain */
  const nl = (() => { const cn = new CK.Circuit({ ...sp, parts: sp.parts.filter(p => p.id !== 'RL' && p.id !== 'Rp') }); cn.solve(); return Cx.div(cn.V('o'), cn.V('i')); })();
  const zq = AC.dcOf(sp), Q = !q ? null : isQ ? zq.Q(q.id) : zq.J(q.id);
  const sgn = z => (z.re < 0 ? -1 : 1) * Cx.abs(z);
  return { c, Q, Zi: Cx.abs(Zi), Zo: Cx.abs(Zo), Av: sgn(Av), Avs: sgn(Avs), AvNL: sgn(nl), ph: { Zi, Zo, Av, Avs, vi, vo, vs, ii } };
};

/* |A_v| (and the phasors) over frequency on one circuit: the dc point is found once, then the ac solve is repeated at each frequency */
AC.sweep = (sp, fs, out = 'o', inp = 'i') => { const c = new CK.Circuit({ ...sp, mode: 'ac', dcFirst: true }); return fs.map(f => { c.w = TAU * f; c.solve(); return [f, Cx.abs(Cx.div(c.V(out), c.V(inp)))]; }); };
AC.logspace = (f0, f1, n) => Array.from({ length: n }, (_, k) => f0 * Math.pow(f1 / f0, k / (n - 1)));
/* the real (nonlinear) amplifier in time steps: the capacitors start at their dc voltages, one period settles, then `periods` periods are kept.
   The source runs as v_s sin ωt (the sine reference of the phasor pictures). keys: { name: c => value } read after every step.
   Returns { n (samples per period), periods, h, data: { name: Float64Array } } and f(name) → (θ in degrees, 0…360·periods) → value */
AC.tran = (sp, keys, o = {}) => {
  const n = o.n || 160, periods = o.periods || 2, h = TAU / sp.w / n, cd = AC.dcOf(sp);
  const parts = sp.parts.map(p => (p.type === 'C' ? { ...p, v0: cd.V(p.a).re - cd.V(p.b).re } : p.type === 'VAC' ? { ...p, phase: (p.phase || 0) - 90 } : p));
  const c = new CK.Circuit({ ...sp, parts, mode: 'tran', dcFirst: false });
  cd.parts.forEach(q => { const r = c.part(q.id); if (r && (q.type === 'Q' || q.type === 'J' || q.type === 'D')) ['vbe', 'vce', 'vgs', 'vds', 'vd'].forEach(k => { if (q[k] !== undefined) r[k] = q[k]; }); });
  const data = {}; Object.keys(keys).forEach(k => { data[k] = new Float64Array(n * periods + 1); });
  for (let j = 0; j < n * (1 + periods); j++) { c.step(h); const m = j + 1 - n; if (m >= 0) Object.keys(keys).forEach(k => { data[k][m] = keys[k](c); }); }
  const f = k => d => { const x = (d / 360) * n, i = Math.max(0, Math.min(n * periods - 1, Math.floor(x))), w = x - i, a = data[k]; return a[i] + (a[i + 1] - a[i]) * w; };
  const span = k => { const a = data[k]; let lo = Infinity, hi = -Infinity; for (let i = 0; i <= n * periods; i++) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); } return { lo, hi, pp: hi - lo, mid: (hi + lo) / 2 }; };
  return { n, periods, h, data, f, span, c };
};
/* the terminals of an amplifier drawing: "v_i" at the input node, "v_o" at the output (an open terminal when there is no R_L) */
AC.ampTags = (v, sp, o = {}) => { const ctx = v.ctx, u = v.u, N = v.ckt.nodes;
  if (N.o && !sp.parts.some(p => p.id === 'RL')) { const [x, y] = v.P('o'); ctx.save(); ctx.strokeStyle = '#e8ecf7'; ctx.lineWidth = 2; ctx.fillStyle = CK.PAL.bg; ctx.beginPath(); ctx.arc(x, y, Math.max(4, u * 0.1), 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  if (N.o) OP.tag(v, 'o', o.outText || 'v_o', o.color || '#5ad1ff', 0.18, -(Math.max(11.5, u * 0.26) / 2 + 4 + Math.max(4, u * 0.1) + 3) / u);   // the box clears the open-terminal circle
  const rs = sp.parts.some(p => p.id === 'Rs');   // with R_s its label is above the line: the tag goes under it
  const hh = Math.max(11.5, u * 0.26) / 2 + 4, dyI = rs ? (hh + 0.24 * u + 3) / u : -(hh + 3) / u;   // the box 3 px clear of the line (under it: clear of R_s's zigzag too)
  if (N.i && o.inTag !== false) OP.tag(v, 'i', o.inText || 'v_i', o.inColor || '#ffd166', -0.1, dyI, 'right'); };

/* labels that give way: a vertical resistor's value is written only where it fits before the next part on its label side (the problem text
   and the table carry every value, so on a phone most equivalent-circuit labels shrink to the names). room = grid units to the nearest part,
   measured at build time; the text width at draw time (the view is passed to valText) */
AC.fitLabels = sp => { const N = sp.nodes, HW = { R: 0.24, C: 0.3, G: 0.45, E: 0.45, F: 0.45, H: 0.45, VAC: 0.45, V: 0.45, I: 0.45, IAC: 0.45 };
  const segs = sp.parts.filter(q => !q.hidden && N[q.a] && N[q.b]).map(q => ({ q, a: N[q.a], b: N[q.b], hw: HW[q.type] ?? 0.03 }));
  sp.parts.forEach(p => { if (p.type !== 'R' || p.hidden || p.label === false || typeof p.valText === 'function') return; const a = N[p.a], b = N[p.b];
    if (!a || !b || Math.abs(a[0] - b[0]) > 1e-6) return;
    const x = a[0], ym = (a[1] + b[1]) / 2, s = p.side || 1, obs = [];   // the parts on the label's side: their height range and distance
    segs.forEach(g => { if (g.q === p) return; const xa = Math.min(g.a[0], g.b[0]) - g.hw, xb = Math.max(g.a[0], g.b[0]) + g.hw, d = s > 0 ? xa - x : x - xb;
      if (d > 0.05) obs.push({ ya: Math.min(g.a[1], g.b[1]) - g.hw, yb: Math.max(g.a[1], g.b[1]) + g.hw, d }); });
    const val = p.valText ?? kO(p.value); if (!val || !obs.length) return;
    p.valText = (pp, v) => { if (!v || !v.ctx || !v.u) return val; const ctx = v.ctx, sz = Math.max(11.5, v.u * 0.31), band = 1.1 * sz / v.u;   // the two label lines span ±1.1 sz about the middle
      const room = Math.min(Infinity, ...obs.filter(q => q.yb >= ym - band && q.ya <= ym + band).map(q => q.d)); if (!isFinite(room)) return val;
      ctx.save(); ctx.font = `${sz * 0.92}px "IBM Plex Mono", ui-monospace, Menlo, monospace`; const w = ctx.measureText(val).width; ctx.restore();
      return (p.labelOff || 0.62) * v.u + w + 4 <= room * v.u ? val : ''; }; });
  return sp; };

/* =====================================================================================================================
   4) the small-signal equivalent circuits, drawn like the book's: v_s (and R_s) on the left, the bias resistors to ground (V_CC is an ac ground),
   the transistor model in the middle, R_C (R_D), r_o (r_d) and R_L on the right, one ground rail along the bottom (y = 2.8). The capacitors are
   shorts at mid-band. p = the small-signal values to draw: { re, beta, ro, alpha } (BJT) or { gm, rd } (FET). A linear circuit in mode 'ac';
   its parts carry ids that the problems glow: vs, Rs, RB | R1 + R2 | RG, Rpi (βr_e or r_e), Gm (the controlled source), ro, RC, RE, RF, RL.
   Spacing: GAP between plain resistors (their values show where they fit), WIDE after a model element whose value should always show */
AC.eq = (o0, p = {}) => { const o = AC.norm(o0);
  const fet = o.dev && o.dev !== 'bjt', cfg = o.cfg || 'fixed', vs = o.vs ?? VS_DEF, xi = o.Rs ? 2.2 : 1.6, nodes = { s: [0, 0], g0: [0, 2.8], i: [xi, 0] }, parts = [];
  const N = fet ? { RB: 'R_G', RC: 'R_D', RE: 'R_S', ro: 'r_d' } : { RB: 'R_B', RC: 'R_C', RE: 'R_E', ro: 'r_o' };
  const ro = fet ? p.rd : p.ro, roOn = ro && isFinite(ro), unby = o.RE && !o.CE && cfg !== 'cb' && cfg !== 'ef';
  const yE = 1.6, gnd = 'g0', top = [], bot = ['g0'], topO = [], GAP = 1.6, WIDE = 2.7;
  parts.push({ id: 'vs', type: 'VAC', a: 's', b: 'g0', amp: vs, phase: 0, name: 'v_s', valText: `${LS.u(vs * 1e3, 3)} mV`, side: -1 });
  parts.push(o.Rs ? res('Rs', 's', 'i', o.Rs, 'R_s') : W_('s', 'i'));
  top.push('i');
  const vert = (id, x, y0, y1, a, b, r, name, extra = {}) => { nodes[a] = nodes[a] || [x, y0]; nodes[b] = nodes[b] || [x, y1]; parts.push(res(id, a, b, r, name, extra)); };
  const gSrc = (a, b, gain, cn, dn, name, valText) => ({ id: 'Gm', type: 'G', a, b, c: cn, d: dn, gain, name, valText });
  /* the output side: r_o (r_d), R_C (R_D), R_L from x on, between the rail `tn` (y = yt) and ground or the emitter rail */
  const outSide = (x, yTop, yBot, botN) => {
    if (roOn) { nodes.co = [x, yTop]; nodes[botN ? 'eo' : 'go'] = [x, yBot]; parts.push(res('ro', 'co', botN ? 'eo' : 'go', ro, N.ro)); topO.push('co'); if (botN) parts.push(W_(botN, 'eo')); else bot.push('go'); x += WIDE - 0.3; }
    if (o.RC) { nodes.cc = [x, yTop]; nodes.gc = [x, 2.8]; parts.push(res('RC', 'cc', 'gc', o.RC, N.RC)); topO.push('cc'); bot.push('gc'); x += GAP; }
    if (o.RL) { nodes.cl = [x, yTop]; nodes.gl = [x, 2.8]; parts.push(res('RL', 'cl', 'gl', o.RL, 'R_L')); topO.push('cl'); bot.push('gl'); x += GAP; }
    return x; };
  let x = xi + 1.4, xEnd, zoN = 'c';
  if (cfg === 'cb' && fet) {   /* common gate (Figs. 8.25–8.26): the gate is ground, so V_gs = −V_s; the source g_mV_gs runs from drain to source, r_d above it */
    vert('RE', x, 0, 2.8, 'eR', 'gR', o.RE, N.RE); top.push('eR'); bot.push('gR');
    const xe = x + GAP + 0.6, xc = xe + 2.8; nodes.e = [xe, 0]; top.push('e'); nodes.c = [xc, 0]; topO.push('c');
    parts.push(gSrc('c', 'e', p.gm, gnd, 'e', 'g_m V_gs', ''));
    if (roOn) { nodes.cT = [xc, -1.3]; nodes.eT = [xe, -1.3]; parts.push(W_('c', 'cT'), res('ro', 'cT', 'eT', ro, N.ro), W_('eT', 'e')); }
    x = xc + 1.6;
    if (o.RC) { nodes.cc = [x, 0]; nodes.gc = [x, 2.8]; parts.push(res('RC', 'cc', 'gc', o.RC, N.RC)); topO.push('cc'); bot.push('gc'); x += GAP; }
    if (o.RL) { nodes.cl = [x, 0]; nodes.gl = [x, 2.8]; parts.push(res('RL', 'cl', 'gl', o.RL, 'R_L')); topO.push('cl'); bot.push('gl'); x += GAP; }
    xEnd = x;
  } else if (cfg === 'cb') {   /* common base: the input is the emitter: R_E (bias) and r_e to ground (the base is the ground); αI_e from the collector to ground */
    vert('RE', x, 0, 2.8, 'eR', 'gR', o.RE, N.RE); top.push('eR'); bot.push('gR'); x += GAP + 0.4;
    nodes.e = [x, 0]; top.push('e'); vert('Rpi', x, 0, 2.8, 'e', 'gP', p.re, 'r_e'); bot.push('gP'); x += WIDE - 0.4;
    nodes.c = [x, 0]; nodes.gG = [x, 2.8]; bot.push('gG'); topO.push('c');
    parts.push(gSrc('c', 'gG', (p.alpha ?? 1) / p.re, gnd, 'e', 'αI_e', '')); x += 2.0;
    xEnd = outSide(x, 0, 2.8, null);   // r_o beside αI_e (Fig. 5.18)
  } else {
    /* the bias network from the input node to ground */
    if (o.RB) { vert('RB', x, 0, 2.8, 'rb', 'grb', o.RB, N.RB); top.push('rb'); bot.push('grb'); x += GAP; }
    if (o.RG) { vert('RB', x, 0, 2.8, 'rb', 'grb', o.RG, N.RB); top.push('rb'); bot.push('grb'); x += GAP; }
    if (o.R1) { vert('R1', x, 0, 2.8, 'r1', 'gr1', o.R1, 'R_1'); vert('R2', x + GAP, 0, 2.8, 'r2', 'gr2', o.R2, 'R_2'); top.push('r1', 'r2'); bot.push('gr1', 'gr2'); x += 2 * GAP; }
    if (fet) x -= 0.4;   // a FET's gate column carries no part
    const xb = x; nodes.b = [xb, 0]; top.push('b');
    const eNode = (unby || cfg === 'ef') ? 'e' : null;
    if (eNode) nodes.e = [xb, yE];
    /* B–E: βr_e (BJT); the gate is an open circuit (FET) */
    if (!fet) { if (eNode) vert('Rpi', xb, 0, yE, 'b', 'e', p.beta * p.re, 'βr_e'); else { vert('Rpi', xb, 0, 2.8, 'b', 'gP', p.beta * p.re, 'βr_e'); bot.push('gP'); } }
    if (cfg === 'ef') {   /* the output is the emitter (source): the source pushes up from the collector (drain), which is at ac ground */
      const xr = xb + 1.4, xg = xr + WIDE; nodes.eR = [xr, yE]; nodes.gEr = [xr, 2.8]; parts.push(res('RE', 'eR', 'gEr', o.RE, N.RE)); bot.push('gEr');
      nodes.eG = [xg, yE]; nodes.gG = [xg, 2.8]; bot.push('gG');
      parts.push(fet ? gSrc('gG', 'eG', p.gm, 'b', 'e', 'g_m V_gs', '') : gSrc('gG', 'eG', 1 / p.re, 'b', 'e', 'βI_b', ''));
      const eRail = ['e', 'eR', 'eG']; x = xg + (fet ? 3.0 : 2.0); zoN = 'eG';   // g_mV_gs is a longer name than βI_b
      if (roOn) { nodes.eo = [x, yE]; nodes.go = [x, 2.8]; parts.push(res('ro', 'eo', 'go', ro, N.ro)); eRail.push('eo'); bot.push('go'); zoN = 'eo'; x += WIDE - 0.3; }
      if (o.RL) { nodes.eL = [x, yE]; nodes.gL = [x, 2.8]; parts.push(res('RL', 'eL', 'gL', o.RL, 'R_L')); eRail.push('eL'); bot.push('gL'); zoN = 'eL'; x += GAP; }
      parts.push(...rail(nodes, eRail)); xEnd = x;
    } else {
      /* the controlled source from the collector (drain) to the emitter (source): ground when bypassed. An unbypassed R_E sits between the
         base column and the source, its label on the left (under the short βr_e) */
      const xc = xb + (fet ? 2.9 : WIDE); nodes.c = [xc, 0]; topO.push('c'); const eB = eNode ? 'eG' : 'gG'; nodes[eB] = [xc, eNode ? yE : 2.8]; if (!eNode) bot.push('gG');
      parts.push(fet ? { ...gSrc('c', eB, p.gm, 'b', eNode || gnd, 'g_m V_gs', ''), side: -1 } : gSrc('c', eB, 1 / p.re, 'b', eNode || gnd, 'βI_b', ''));   // a FET's gate column is empty: g_mV_gs's long name goes there
      if (eNode) { const xr = xb + 1.15; nodes.eR = [xr, yE]; nodes.gEr = [xr, 2.8]; parts.push(res('RE', 'eR', 'gEr', o.RE, N.RE, { side: -1 }), ...rail(nodes, ['e', 'eR', 'eG'])); bot.push('gEr'); }
      xEnd = outSide(xc + 2.0, 0, eNode ? yE : 2.8, eNode ? 'eG' : null);
      if (o.RF) { nodes.bF = [xb, -1.3]; nodes.cF = [xc, -1.3]; parts.push(W_('b', 'bF'), res('RF', 'bF', 'cF', o.RF, 'R_F'), W_('cF', 'c')); }
    }
  }
  nodes._padR = [xEnd + 0.2, 1.4];   // room for the last part's label at the right edge
  parts.push(...rail(nodes, top), ...rail(nodes, topO), ...rail(nodes, bot));
  const out = cfg === 'ef' ? 'e' : 'c';   // the output node (with R_L, R_C and r_o on the same net)
  return AC.fitLabels({ ground: gnd, nodes, parts, mode: 'ac', w: TAU * (o.f ?? F_DEF), o, p, out, zoN, inN: cfg === 'cb' ? 'e' : 'b' });
};

/* a chain of two-port blocks (section 5.15, Fig. 5.62): each block is its input resistance R_i (= Z_i) and a controlled source A_vNL·V_i behind
   its output resistance R_o (= Z_o). blocks: [{ Zi, Zo, Av, name: [th, en] }], o = { Rs, RL, vs }. The spec carries dashed outlines (boxes) for
   AC.boxes and the output node (out) */
AC.tp = (blocks, o = {}) => {
  const nodes = { s: [0, 0], g0: [0, 2.8], i: [1.6, 0] }, parts = [], bot = ['g0'], boxes = [], one = blocks.length === 1, vs = o.vs ?? VS_DEF;
  parts.push({ id: 'vs', type: 'VAC', a: 's', b: 'g0', amp: vs, phase: 0, name: 'v_s', valText: vs >= 1e-3 ? `${LS.u(vs * 1e3, 3)} mV` : `${LS.u(vs * 1e6, 3)} µV`, side: -1 });
  parts.push(o.Rs ? res('Rs', 's', 'i', o.Rs, 'R_s') : W_('s', 'i'));
  let x = 1.6, last = 'i';
  blocks.forEach((B, k) => { const n = k + 1, xa = x + 1.4, xe = xa + 2.0, xo = xe + 2.0, sub = one ? '' : String(n);
    Object.assign(nodes, { ['a' + n]: [xa, 0], ['ga' + n]: [xa, 2.8], ['e' + n]: [xe, 0], ['ge' + n]: [xe, 2.8], ['o' + n]: [xo, 0] });
    parts.push(W_(last, 'a' + n), res('Ri' + n, 'a' + n, 'ga' + n, B.Zi, one ? 'Z_i' : `Z_i${sub}`),
      { id: 'E' + n, type: 'E', a: 'e' + n, b: 'ge' + n, c: 'a' + n, d: 'ga' + n, gain: B.Av, name: one ? 'A_vNL V_i' : `A_v${sub}V_i${sub}`, valText: `${fd(B.Av, Math.abs(B.Av) >= 100 ? 0 : 2).replace('-', '−')} V/V` },
      res('Ro' + n, 'e' + n, 'o' + n, B.Zo, one ? 'Z_o' : `Z_o${sub}`));
    bot.push('ga' + n, 'ge' + n); boxes.push({ x0: xa - 0.8, x1: xo + 0.3, y0: -1.05, y1: 3.75, label: B.name });
    last = 'o' + n; x = xo; });
  if (o.RL) { nodes.oL = [x + 1.4, 0]; nodes.gL = [x + 1.4, 2.8]; parts.push(W_(last, 'oL'), res('RL', 'oL', 'gL', o.RL, 'R_L')); bot.push('gL'); }
  parts.push(...rail(nodes, bot));
  nodes._padR = [x + (o.RL ? 1.4 : 0) + 1.4, 1.4];
  return AC.fitLabels({ ground: 'g0', nodes, parts, mode: 'ac', w: TAU * F_DEF, boxes, out: last });
};
/* dashed outlines with a name in the corner, in grid units */
AC.boxes = (v, boxes) => { const ctx = v.ctx; boxes.forEach(B => { const [x0, y0] = v.P([B.x0, B.y0]), [x1, y1] = v.P([B.x1, B.y1]);
  ctx.save(); ctx.strokeStyle = 'rgba(199,146,234,.75)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
  if (!B.label) return; const size = Math.max(11.5, v.u * 0.27), full = tt(B.label), txt = CH8.textW(ctx, full, size, '700') <= x1 - x0 - 10 ? full : full.split(':')[0];   // a narrow box keeps the part before the colon
  T(ctx, txt, x0 + 6, y1 - Math.max(10, v.u * 0.24), { color: PURPLE, size, align: 'left', weight: '700' }); }); };   // the name in the bottom corner, under the ground rail
/* two identical voltage-divider stages, RC-coupled (Example 5.15, Fig. 5.69): stage 1 at x 0…4, stage 2 shifted 6.4 to the right */
AC.amp2 = (o0 = {}) => { const o = AC.norm(o0), parts = [], vs = o.vs ?? VS_DEF, D = 6.4;
  const xV = o.RL ? 14.8 : 14.2;   // the supply clear of the v_o tag (and of R_L's label)
  const nodes = { s: [-3.0, 1.6], gS: [-3.0, 4], i: [-1.2, 1.6], tV: [xV, -1.2], mV: [xV, 1.4], gV: [xV, 4], k1: [4.7, 0.75], k2: [6.1, 0.75], k3: [6.1, 1.6], o: [12.1, 0.75], gO: [12.1, 4] };
  const top = ['tV'], bot = ['gS', 'gV'];
  parts.push({ id: 'vs', type: 'VAC', a: 's', b: 'gS', amp: vs, phase: 0, name: 'v_i', valText: vs >= 1e-3 ? `${LS.u(vs * 1e3, 3)} mV` : `${LS.u(vs * 1e6, 3)} µV` }, o.Rs ? res('Rs', 's', 'i', o.Rs, 'R_s') : W_('s', 'i'),
    { id: 'VCC', type: 'V', a: 'tV', b: 'mV', value: o.VCC, name: (o.dev && o.dev !== 'bjt') ? 'V_DD' : 'V_CC', valText: `${LS.u(o.VCC, 3)} V` }, W_('mV', 'gV'));
  const fet = o.dev && o.dev !== 'bjt', N2 = fet ? ['R_D', 'R_S', 'C_S'] : ['R_C', 'R_E', 'C_E'];   // FET stages: self bias with R_G to ground (Example 8.16)
  [1, 2].forEach(n => { const X = (n - 1) * D, sd = 1, P = (k, x, y) => { nodes[k + n] = [x + X, y]; }, vt = { valText: '' };   // two stages are too wide for value labels: names only (the problem lists the values)
    P('bL', 0.6, 1.6); P('tL', 0.6, -1.2); P('gL', 0.6, 4); P('b', 2.3, 1.6); P('tC', 3.1, -1.2); P('c', 3.1, 0.75); P('e', 3.1, 2.45); P('ge', 3.1, 4); P('eC', 4.2, 2.45); P('gC', 4.2, 4);
    top.push('tC' + n); bot.push('gL' + n, 'ge' + n, 'gC' + n);
    if (fet) parts.push(res('RG_' + n, 'bL' + n, 'gL' + n, o.RG, 'R_G', { side: sd, ...vt }), W_('bL' + n, 'b' + n));
    else { top.push('tL' + n); parts.push(res('R1_' + n, 'tL' + n, 'bL' + n, o.R1, 'R_1', { side: sd, ...vt }), res('R2_' + n, 'bL' + n, 'gL' + n, o.R2, 'R_2', { side: sd, ...vt }), W_('bL' + n, 'b' + n)); }
    parts.push(res('RC_' + n, 'tC' + n, 'c' + n, o.RC, N2[0], { side: -1, ...vt }), res('RE_' + n, 'e' + n, 'ge' + n, o.RE, N2[1], { side: -1, ...vt }), W_('e' + n, 'eC' + n), cap('CE_' + n, 'eC' + n, 'gC' + n, o.CEv ?? 20e-6, N2[2], vt),
      fet ? { id: 'Q' + n, type: 'J', D: 'c' + n, G: 'b' + n, S: 'e' + n, kind: o.dev, idss: o.idss, vp: o.vp, k: o.k, vt: o.vt, gate: o.dev === 'jfet' ? false : null, name: `Q_${n}`, valText: '', pins: false }
        : { id: 'Q' + n, type: 'Q', C: 'c' + n, B: 'b' + n, E: 'e' + n, beta: o.beta ?? 100, name: `Q_${n}`, valText: '', pins: false }); });   // β is in the problem text
  parts.push(cap('C1', 'i', 'bL1', o.C1 ?? 10e-6, 'C_1', { side: -1, valText: '' }), W_('c1', 'k1'), cap('Cc', 'k1', 'k2', o.Cc ?? 10e-6, 'C_C', { side: 1, valText: '' }), W_('k2', 'k3'), W_('k3', 'bL2'),
    cap('C2', 'c2', 'o', o.C2 ?? 10e-6, 'C_2', { side: 1, valText: '' }));
  if (o.RL) { parts.push(res('RL', 'o', 'gO', o.RL, 'R_L')); bot.push('gO'); } else { delete nodes.gO; parts.push({ id: 'Rp', type: 'R', a: 'o', b: 'gV', value: 1e9, hidden: true, label: false }); }
  parts.push(...rail(nodes, top), ...rail(nodes, bot));
  return AC.fitLabels({ ground: 'gV', nodes, parts, mode: 'ac', w: TAU * (o.f ?? F_DEF), dcFirst: true, o: { ...o, cfg: 'vdb' } });
};

/* the input and output impedance arrows of a drawn circuit: "Z_i →" into the node `inN`, "← Z_o" into `outN` (grid offsets dx, dy) */
AC.zArrows = (v, o = {}) => { const ctx = v.ctx, u = v.u, col = o.color || '#ffd166', sz = Math.max(12, u * 0.3);
  const one = (n, dir, text, dx = 0, dy = -0.55) => { if (!v.ckt.nodes[n]) return; const [x, y] = v.P(n), y0 = y + dy * u, x1 = x + dx * u, len = 0.75 * u;
    CH6.arrow(ctx, x1 - dir * len, y0, x1 - dir * 0.12 * u, y0, col, 2.4); T(ctx, text, x1 - dir * (len + 0.1 * u + 3), y0, { color: col, size: sz, weight: '700', align: dir > 0 ? 'right' : 'left' }); };   // the name beside the tail
  if (o.inN) one(o.inN, 1, o.inText || 'Z_i', o.inDx ?? 0, o.inDy);
  if (o.outN) one(o.outN, -1, o.outText || 'Z_o', o.outDx ?? 0, o.outDy); };

/* =====================================================================================================================
   5) pictures. AC.scope: a two- or three-channel oscilloscope screen (10 × 8 divisions, each channel with its own volts per division, chosen on
   the 1–2–5 scale so that its peak covers about three divisions), two periods across, the board's clock as a cursor. chans: [{ label, z (peak
   phasor, V) or f (θ in degrees → V), mag (peak, for f), dc (V, a DC-coupled channel drawn about its own level), color }], o = { w (rad/s), now,
   title, short, notes: [text] } */
const SEQ = [1, 2, 5]; const perDiv = a => { const t0 = a / 3; let e = Math.floor(Math.log10(t0)), best = null; for (let k = e - 1; k <= e + 1; k++) SEQ.forEach(m => { const v = m * Math.pow(10, k); if (v >= t0 && (best === null || v < best)) best = v; }); return best; };
const vU = v => { const a = Math.abs(v); return a >= 1 ? `${LS.u(v, 3)} V` : a >= 1e-3 ? `${LS.u(v * 1e3, 3)} mV` : `${LS.u(v * 1e6, 3)} µV`; };
const tU = s => (s >= 1e-3 ? `${LS.u(s * 1e3, 3)} ms` : `${LS.u(s * 1e6, 3)} µs`);
AC.vU = vU;
AC.scope = (ctx, b, o = {}) => {
  CH6.bg(ctx, b); const sh = !!o.short, chans = o.chans || [], top = o.title ? 30 : 10, bottom = sh ? 34 : 40, ml = 26, mr = 12;
  const gw = b.w - ml - mr, gh = b.h - top - bottom, x0 = b.x + ml, y0 = b.y + top, dx = gw / 10, dy = gh / 8, ym = y0 + gh / 2;
  ctx.save(); ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; for (let k = 0; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(x0 + k * dx, y0); ctx.lineTo(x0 + k * dx, y0 + gh); ctx.stroke(); }
  for (let k = 0; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(x0, y0 + k * dy); ctx.lineTo(x0 + gw, y0 + k * dy); ctx.stroke(); }
  ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, ym); ctx.lineTo(x0 + gw, ym); ctx.moveTo(x0 + gw / 2, y0); ctx.lineTo(x0 + gw / 2, y0 + gh); ctx.stroke(); ctx.restore();
  const val = (ch, d) => (ch.f ? ch.f(d) : CH8.atDeg(ch.z, d));   // d: θ in degrees (sine reference)
  const info = chans.map(ch => { const a = ch.mag ?? (ch.z ? Cx.abs(ch.z) : 0), vd = perDiv(Math.max(a, 1e-9)); return { ...ch, a, vd }; });
  info.forEach((ch, k) => { const off = ch.pos ?? 0, Yv = v => ym - (v / ch.vd + off) * dy;   // pos: the channel's zero in divisions above the centre (a scope's position knob)
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, gw, gh); ctx.clip(); ctx.strokeStyle = ch.color; ctx.lineWidth = ch.w || 2.4; ctx.beginPath();
    for (let j = 0; j <= 300; j++) { const d = 720 * j / 300, y = Yv(val(ch, d)); j ? ctx.lineTo(x0 + gw * j / 300, y) : ctx.moveTo(x0, y); } ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = ch.color; const yr = Math.max(y0 + 6, Math.min(y0 + gh - 6, ym - off * dy)); ctx.beginPath(); ctx.moveTo(b.x + 6, yr - 6); ctx.lineTo(b.x + 18, yr); ctx.lineTo(b.x + 6, yr + 6); ctx.closePath(); ctx.fill(); ctx.restore();
    T(ctx, String(k + 1), b.x + 3, yr - 9, { color: ch.color, size: 10.5, weight: '700', align: 'left' }); });
  if (o.now !== undefined) { const d = ((o.now * 180 / Math.PI) % 720 + 720) % 720, px = x0 + gw * d / 720; ctx.save(); ctx.strokeStyle = 'rgba(232,236,247,.5)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y0 + gh); ctx.stroke(); ctx.restore();
    info.forEach(ch => { const off = ch.pos ?? 0, py = ym - (val(ch, d) / ch.vd + off) * dy; if (py > y0 && py < y0 + gh) IE.dot(ctx, px, py, 4, ch.color); }); }
  /* the channel settings along the bottom, the time base at the right */
  let x = b.x + 8; const yb = b.y + b.h - (sh ? 12 : 14);
  info.forEach((ch, k) => { const s = sh ? `${k + 1}: ${vU(ch.vd)}/div` : `${k + 1} ${tt(ch.label)}: ${vU(ch.vd)}/div`; T(ctx, s, x, yb, { color: ch.color, size: sh ? 11 : 12, weight: '700', align: 'left' }); x += CH8.textW(ctx, s, sh ? 11 : 12, '700') + 14; });
  if (o.w) { const s = `${tU(2 * TAU / o.w / 10)}/div`; T(ctx, s, b.x + b.w - 8, yb - (x > b.x + b.w - CH8.textW(ctx, s, 12) - 16 ? 15 : 0), { color: COL.muted, size: sh ? 11 : 12, align: 'right' }); }
  if (o.title) T(ctx, tt(o.title), b.x + 10, b.y + 15, { color: COL.muted, size: 13, align: 'left' });
  (o.notes || []).forEach((n, k) => CH8.lab(ctx, tt(n.text ?? n), x0 + gw - 6, y0 + 14 + k * 16, 'right', n.color || COL.ink, 12, b, '600'));
  return info;
};
/* a small table drawn on the canvas: rows [[label, book, simulator]] with a header */
AC.table = (ctx, b, rows, o = {}) => { CH6.bg(ctx, b); const sh = !!o.short, head = o.head || [t('ค่า', 'quantity'), t('คำนวณมือ', 'by hand'), t('ภาพจำลอง', 'simulator')];
  const top = o.title ? 34 : 14, rh = Math.min(30, (b.h - top - 30) / (rows.length + 1)), cw = [0.34, 0.33, 0.33].map(f => f * (b.w - 20)), xs = [b.x + 10, b.x + 10 + cw[0], b.x + 10 + cw[0] + cw[1]];
  if (o.title) T(ctx, tt(o.title), b.x + 10, b.y + 15, { color: COL.muted, size: 13, align: 'left' });
  head.forEach((h, k) => T(ctx, tt(h), xs[k] + (k ? cw[k] - 8 : 0), b.y + top + rh * 0.6, { color: COL.muted, size: sh ? 11.5 : 12.5, weight: '600', align: k ? 'right' : 'left' }));
  rows.forEach((r, j) => { const y = b.y + top + rh * (j + 1.6); ctx.save(); ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(b.x + 8, y - rh * 0.62); ctx.lineTo(b.x + b.w - 8, y - rh * 0.62); ctx.stroke(); ctx.restore();
    r.forEach((c, k) => T(ctx, tt(c), xs[k] + (k ? cw[k] - 8 : 0), y, { color: k === 0 ? COL.ink : k === 1 ? '#ffd166' : '#5ad1ff', size: sh ? 12 : 13.5, weight: k ? '700' : '600', align: k ? 'right' : 'left' })); });
};

/* =====================================================================================================================
   6) the explorers of sections A and B (OP.explorer on canvas cv…, panel p…, text w…) */
AC.EX = {};
const AMBER = '#ffd166', CYAN = '#5ad1ff', PINK = '#ff7eb6';
AC.COL = { vi: AMBER, vo: CYAN, vc: PINK };
const degNow = bd => ((bd.clk.ph * 180 / Math.PI) % 720 + 720) % 720;
/* page A.1, section A: the common-emitter amplifier of Example 5.1 run in time steps; the operating point swings along the load line */
const B51 = { VCC: 12, RB: 470e3, RC: 3000, beta: 100, ro: 50e3 };
AC.EX.swing = (ids = {}) => { const ui = MC.ui;
  return OP.explorer({ ids, init: { vs: 0.002, beta: 100, RC: 3000 }, title: t('สัญญาณขาเข้าและวงจร', 'The input and the circuit'), layout: { cktAspM: 0.5, rowAsp: 0.64, rowMin: 260, cktAspN: 0.62 },
    controls: (p, S, build) => {
      ui.slider(p, { id: (ids.pre || 'a') + 'Vs', label: 'v_s', min: 1, max: 40, step: 0.5, value: S.vs * 1e3, fmt: v => `${fd(v, 1)} mV`, oninput: v => { S.vs = v / 1e3; build(); } });
      ui.slider(p, { id: (ids.pre || 'a') + 'B', label: 'β', min: 50, max: 250, step: 10, value: S.beta, fmt: v => `${v}`, oninput: v => { S.beta = v; build(); } });
      ui.slider(p, { id: (ids.pre || 'a') + 'RC', label: 'R_C', min: 1000, max: 4700, step: 100, value: S.RC, fmt: v => kO(v), oninput: v => { S.RC = v; build(); } }); },
    spec: S => { const sp = AC.tune(AC.amp({ dev: 'bjt', cfg: 'fixed', ...B51, beta: S.beta, RC: S.RC, vs: S.vs })); S.sp = sp; S.m = AC.measure(sp);
      S.tr = AC.tran(sp, { vi: c => c.V('i').re, vo: c => c.V('o').re, vc: c => c.V('c').re }); S.sv = S.tr.span('vc'); S.so = S.tr.span('vo'); S.si = S.tr.span('vi'); return sp; },
    after: (v, c, S) => AC.ampTags(v, S.sp),
    side: (ctx, b, bd, c, S) => { const Q = S.m.Q, RC = S.RC, ll = v => Math.max(0, (B51.VCC - v) / RC * 1e3), vn = S.tr.f('vc')(degNow(bd)), sh = bd.short;
      CH4.llPlot(ctx, b, bd, { beta: S.beta, ibs: CH4.ibs(S.beta, B51.VCC / RC * 1e3), vcc: B51.VCC, r: RC, q: { v: Q.VCE, i: Q.IC * 1e3, label: 'Q' }, labels: !sh,
        segs: [{ a: [S.sv.lo, ll(S.sv.lo)], b: [S.sv.hi, ll(S.sv.hi)], color: AMBER, w: 6 }], pts: [{ v: vn, i: ll(vn), color: CYAN, r: 5.5 }],
        title: sh ? t('เส้นโหลด', 'load line') : t('จุดทำงานแกว่งไปตามเส้นโหลด (แถบเหลือง)', 'the operating point swings along the load line (amber)') }); },
    waves: [(ctx, b, bd, c, S) => AC.scope(ctx, b, { chans: [{ label: 'v_i', f: S.tr.f('vi'), mag: S.si.pp / 2, color: AMBER }, { label: 'v_o', f: S.tr.f('vo'), mag: S.so.pp / 2, color: CYAN }],
      w: c.w, now: bd.clk.ph, short: bd.short, title: bd.short ? '' : t('ออสซิลโลสโคป: สองช่อง สองสเกล', 'oscilloscope: two channels, two scales') })],
    badge: (c, S) => { const lo = S.sv.lo, hi = S.sv.hi, g = S.so.pp / S.si.pp;
      if (lo < 0.25) return [[`ยอดล่างของ v_C ชนย่านอิ่มตัว (${fd(lo, 2)} V): ขาออกถูกตัด`, `v_C bottoms out in saturation (${fd(lo, 2)} V): the output clips`], 'wait'];
      if (hi > B51.VCC - 0.25) return [['ยอดบนของ v_C ชนคัตออฟ: ขาออกถูกตัด', 'v_C tops out at cutoff: the output clips'], 'wait'];
      return [[`|v_o/v_i| = ${fd(g, 1)} (แบบจำลอง r_e: ${fd(-S.m.Av, 1)})`, `|v_o/v_i| = ${fd(g, 1)} (r_e model: ${fd(-S.m.Av, 1)})`], Math.abs(g / -S.m.Av - 1) < 0.03 ? 'ok' : 'wait']; },
    rows: (c, S) => { const Q = S.m.Q, re = VT / Q.IE; return [['I_E', `${fd(Q.IE * 1e3, 3)} mA`], ['r_e = 26 mV/I_E', `${fd(re, 2)} Ω`], ['V_CEQ', `${fd(Q.VCE, 2)} V`],
      ['−(R_C ‖ r_o)/r_e', fd(S.m.Av, 1)], [t('|v_o/v_i| ที่วัดได้', '|v_o/v_i| measured'), fd(S.so.pp / S.si.pp, 1)], [t('ยอดบน/ล่างของ v_o', 'v_o peaks'), `+${fd(S.so.hi, 2)} / ${fd(S.so.lo, 2)} V`.replace('-', '−')]]; },
    text: (c, S) => { const g = S.so.pp / S.si.pp, up = S.so.hi, dn = -S.so.lo, asym = Math.abs(up - dn) / Math.max(up, dn) * 100;
      if (S.sv.lo < 0.25) return t(`ขาเข้า ${fd(S.vs * 1e3, 1)} mV ใหญ่เกินไป: ครึ่งรอบที่ \\(v_C\\) ลดลงไปชนย่านอิ่มตัว (ทรานซิสเตอร์นำเต็มที่) ยอดล่างของ \\(v_C\\) จึงแบน และอัตราขยายเฉลี่ยตกเหลือ ${fd(g, 0)} แบบจำลองสัญญาณเล็กใช้ไม่ได้แล้ว`, `An input of ${fd(S.vs * 1e3, 1)} mV is too big: in the half-cycle where \\(v_C\\) falls it runs into saturation (the transistor fully on), the bottom of \\(v_C\\) flattens and the average gain drops to ${fd(g, 0)}. The small-signal model no longer applies.`);
      return t(`ขาเข้า ${fd(S.vs * 1e3, 1)} mV ยอด ให้ขาออกยอด +${fd(up, 2)} / −${fd(dn, 2)} V กลับเฟส 180° อัตราขยายที่วัดได้ ${fd(g, 1)} ใกล้ \\((R_C \\parallel r_o)/r_e\\) = ${fd(-S.m.Av, 1)} ${asym > 4 ? `แต่ยอดบนกับยอดล่างต่างกัน ${fd(asym, 0)} %: เส้นโค้งของรอยต่อเริ่มไม่ตรงแล้ว ลด \\(v_s\\) ลงดูความต่างหายไป` : 'และยอดทั้งสองเท่ากัน: สัญญาณเล็กพอที่เส้นโค้งดูเหมือนเส้นตรง'}`,
        `An input of ${fd(S.vs * 1e3, 1)} mV peak gives an output of +${fd(up, 2)} / −${fd(dn, 2)} V, inverted by 180°. The measured gain ${fd(g, 1)} is close to \\((R_C \\parallel r_o)/r_e\\) = ${fd(-S.m.Av, 1)}${asym > 4 ? `, but the two peaks differ by ${fd(asym, 0)} %: the junction's curve is no longer straight over the swing. Lower \\(v_s\\) and watch the difference vanish.` : ', and the two peaks are equal: the signal is small enough for the curve to look straight.'}`); } }); };
/* page A.2, section A: the emitter-bias amplifier of Examples 5.3–5.4 with the bypass capacitor switched in and out, β and the frequency.
   The plot is |A_v| in dB against frequency for both cases: the bypass only works where its reactance is small next to r_e */
const dBv = x => 20 * Math.log10(Math.max(x, 1e-9)), fHz = f => (f >= 1e3 ? `${LS.u(f / 1e3, 3)} kHz` : `${LS.u(f, 3)} Hz`);
AC.fHz = fHz;
AC.EX.bypass = (ids = {}) => { const ui = MC.ui, pre = ids.pre || 'a', FS = AC.logspace(20, 200e3, 61);
  return OP.explorer({ ids, init: { CE: false, beta: 120, f: 100e3 }, title: t('ตัวเก็บประจุบายพาส β และความถี่', 'The bypass capacitor, β and the frequency'), layout: { cktAspM: 0.5, rowAsp: 0.64, rowMin: 260, cktAspN: 0.62 },
    controls: (p, S, build) => {
      ui.radio(p, [{ id: pre + 'off', label: t('ไม่ต่อ C_E', 'C_E out'), on: !S.CE }, { id: pre + 'on', label: t('ต่อ C_E = 10 µF', 'C_E = 10 µF in'), on: S.CE }], id => { S.CE = id === pre + 'on'; build(); });
      ui.slider(p, { id: pre + 'B', label: 'β', min: 60, max: 240, step: 10, value: S.beta, fmt: v => `${v}`, oninput: v => { S.beta = v; build(); } });
      OP.logSlider(p, pre + 'F', 'f', 20, 200e3, () => S.f, v => { S.f = v; }, build, fHz, x => +x.toPrecision(2)); },
    spec: S => { const o = { ...O53, beta: S.beta, CE: S.CE, f: S.f }, sp = AC.tune(AC.amp(o)); S.sp = sp; S.m = AC.measure(sp);
      if (S._b !== S.beta) { S._b = S.beta; S.on = AC.sweep(AC.tune(AC.amp({ ...O53, beta: S.beta, CE: true })), FS); S.off = AC.sweep(AC.tune(AC.amp({ ...O53, beta: S.beta, CE: false })), FS);
        S.mid = { on: AC.measure(AC.tune(AC.amp({ ...O53, beta: S.beta, CE: true }))), off: AC.measure(AC.tune(AC.amp({ ...O53, beta: S.beta, CE: false }))) }; }
      return sp; },
    after: (v, c, S) => AC.ampTags(v, S.sp),
    side: (ctx, b, bd, c, S) => { const g = Math.abs(S.m.Av), sh = bd.short;
      OP.plot(ctx, b, { x: [20, 200e3], logx: true, y: [0, 60], xt: [100, 1e3, 10e3, 100e3], yt: [10, 20, 30, 40, 50, 60], xf: f => fHz(f).replace(' ', ''), yf: y => fd(y, 0), xl: 'f', yl: '|A_v| (dB)', ml: 34,
        curves: [{ pts: S.on.map(([f, a]) => [f, dBv(a)]), color: S.CE ? C.curve : 'rgba(79,179,255,.45)', w: S.CE ? 3 : 2, label: sh ? '' : t('มี C_E', 'C_E in'), labelAt: 30e3 },
          { pts: S.off.map(([f, a]) => [f, dBv(a)]), color: S.CE ? 'rgba(255,209,102,.45)' : AMBER, w: S.CE ? 2 : 3, label: sh ? '' : t('ไม่มี C_E', 'C_E out'), labelAt: 30e3 }],
        pts: [{ x: S.f, y: dBv(g), color: PINK, r: 6, label: sh ? '' : `${fd(g, g >= 100 ? 0 : 2)} (${fd(dBv(g), 1)} dB)`, side: S.f > 20e3 ? -1 : 1 }],
        title: sh ? '|A_v|(f)' : t('|A_v| เทียบความถี่: C_E ใช้ได้เฉพาะเมื่อ X_C เล็กกว่า r_e มาก', '|A_v| against frequency: C_E only works where X_C is far below r_e') }); },
    waves: [(ctx, b, bd, c, S) => AC.scope(ctx, b, scopeOf(S.m, bd, bd.short ? '' : t(`ออสซิลโลสโคปที่ ${fHz(S.f)}`, `oscilloscope at ${fHz(S.f)}`)))],
    badge: (c, S) => { const g = Math.abs(S.m.Av), mid = Math.abs((S.CE ? S.mid.on : S.mid.off).Av); return [[`|A_v| = ${fd(g, g >= 100 ? 1 : 3)} ที่ ${fHz(S.f)} (ย่านกลาง ${fd(mid, mid >= 100 ? 1 : 3)})`, `|A_v| = ${fd(g, g >= 100 ? 1 : 3)} at ${fHz(S.f)} (mid band ${fd(mid, mid >= 100 ? 1 : 3)})`], g > 0.97 * mid ? 'ok' : 'wait']; },
    rows: (c, S) => { const q = S.m.Q, re = 0.026 / q.IE, xc = 1 / (TAU * S.f * 10e-6); return [['I_E', `${fd(q.IE * 1e3, 3)} mA`], ['r_e', `${fd(re, 2)} Ω`], ['X_CE = 1/2πfC_E', `${fd(xc, xc >= 10 ? 1 : 3)} Ω`],
      ['Z_i', kOx(S.m.Zi)], ['|A_v|', fd(Math.abs(S.m.Av), Math.abs(S.m.Av) >= 100 ? 1 : 3)], ['R_C/R_E', fd(2200 / 560, 3)], ['R_C/r_e', fd(2200 / re, 1)]]; },
    text: (c, S) => { const q = S.m.Q, re = 0.026 / q.IE, xc = 1 / (TAU * S.f * 10e-6), g = Math.abs(S.m.Av);
      if (!S.CE) return t(`ไม่มี \\(C_E\\): \\(R_E\\) อยู่ในวงจร ac อัตราขยาย ${fd(g, 2)} ใกล้ \\(R_C/R_E\\) = 3.93 ทุกความถี่ และแทบไม่ขยับเมื่อเปลี่ยน β (ลองเลื่อน β) ส่วน \\(Z_i\\) = ${kOx(S.m.Zi)} สูงเพราะเบสมองเห็น \\(\\beta(r_e + R_E)\\)`,
        `Without \\(C_E\\), \\(R_E\\) stays in the ac circuit: the gain ${fd(g, 2)} is close to \\(R_C/R_E\\) = 3.93 at every frequency and barely moves with β (try the β slider), while \\(Z_i\\) = ${kOx(S.m.Zi)} is high because the base sees \\(\\beta(r_e + R_E)\\).`);
      return t(`มี \\(C_E\\) = 10 µF: ที่ ${fHz(S.f)} รีแอกแตนซ์ของมัน ${fd(xc, xc >= 10 ? 1 : 2)} Ω ${xc < 0.2 * re ? `เล็กกว่า \\(r_e\\) = ${fd(re, 2)} Ω มาก \\(R_E\\) จึงถูกลัดวงจรจริง อัตราขยาย ${fd(g, 0)} ≈ \\(R_C/r_e\\)` : `ไม่เล็กกว่า \\(r_e\\) = ${fd(re, 2)} Ω อัตราขยายจึงเหลือแค่ ${fd(g, 0)} จากราว ${fd(2200 / re, 0)} ในย่านกลาง ตัวเก็บประจุบายพาสต้องใหญ่กว่านี้หากจะใช้ที่ความถี่ต่ำ (บทที่ 9 ของตำรา)`}`,
        `With \\(C_E\\) = 10 µF: at ${fHz(S.f)} its reactance is ${fd(xc, xc >= 10 ? 1 : 2)} Ω, ${xc < 0.2 * re ? `far below \\(r_e\\) = ${fd(re, 2)} Ω, so \\(R_E\\) really is shorted and the gain ${fd(g, 0)} ≈ \\(R_C/r_e\\).` : `not small next to \\(r_e\\) = ${fd(re, 2)} Ω, so the gain is only ${fd(g, 0)} instead of about ${fd(2200 / re, 0)} in the mid band. A bypass capacitor has to be larger than this for low frequencies (chapter 9 of the book).`}`); } }); };
/* page A.3, section A: the emitter follower of Example 5.7 as a buffer: R_L and R_s on sliders; |A_vL| against R_L stays near one down to tens of
   ohms because Z_o ≈ r_e; Z_o grows with R_s (Table 5.2: R_E ‖ (R_s′/β + r_e)) and Z_i falls with R_L (β(R_E ‖ R_L)) */
AC.EX.follower = (ids = {}) => { const ui = MC.ui, pre = ids.pre || 'a', RLS = AC.logspace(20, 100e3, 41);
  const withRL = (sp, RL) => ({ ...sp, parts: sp.parts.map(q => (q.id === 'RL' ? { ...q, value: RL, valText: kO(RL) } : q)) });
  return OP.explorer({ ids, init: { RL: 1000, Rs: 0 }, title: t('โหลดและแหล่งสัญญาณ', 'The load and the source'), layout: { cktAspM: 0.5, rowAsp: 0.64, rowMin: 260, cktAspN: 0.62 },
    controls: (p, S, build) => {
      OP.logSlider(p, pre + 'RL', 'R_L', 20, 100e3, () => S.RL, v => { S.RL = v; }, build, v => kO(v), OP.rndR);
      ui.slider(p, { id: pre + 'Rs', label: 'R_s', min: 0, max: 20, step: 0.5, value: S.Rs / 1e3, fmt: v => kO(v * 1e3), oninput: v => { S.Rs = v * 1e3; build(); } }); },
    spec: S => { const base = AC.tune(AC.amp({ ...O57, RL: S.RL, Rs: S.Rs || undefined })); S.sp = base; S.m = AC.measure(base);
      if (S._rs !== S.Rs) { S._rs = S.Rs; S.sw = RLS.map(RL => { const c = AC.solve(withRL(base, RL)); return [RL, Cx.abs(Cx.div(c.V('o'), c.V('i')))]; }); }
      return base; },
    after: (v, c, S) => AC.ampTags(v, S.sp),
    side: (ctx, b, bd, c, S) => { const sh = bd.short, g = Math.abs(S.m.Av);
      OP.plot(ctx, b, { x: [20, 100e3], logx: true, y: [0, 1.1], xt: [100, 1e3, 10e3, 100e3], yt: [0.2, 0.4, 0.6, 0.8, 1], xf: v => kO(v).replace(' ', ''), yf: y => fd(y, 1), xl: 'R_L', yl: '|A_vL|', ml: 34,
        curves: [{ pts: S.sw, color: C.curve, w: 3 }], pts: [{ x: S.RL, y: g, color: PINK, r: 6, label: sh ? '' : `${fd(g, 3)}`, side: S.RL > 5e3 ? -1 : 1 }],
        title: sh ? t('|A_vL| เทียบ R_L', '|A_vL| against R_L') : t('อัตราขยายแทบไม่ตกจนโหลดเหลือไม่กี่สิบโอห์ม', 'the gain hardly drops until the load is down to tens of ohms') }); },
    waves: [(ctx, b, bd, c, S) => AC.scope(ctx, b, scopeOf(S.m, bd))],
    badge: (c, S) => [[`A_vL = ${fd(S.m.Av, 3)}, Z_o = ${kO(S.m.Zo)}`], Math.abs(S.m.Av) > 0.9 ? 'ok' : 'wait'],
    rows: (c, S) => { const re = 0.026 / S.m.Q.IE, Rsp = S.Rs ? 1 / (1 / S.Rs + 1 / 220e3) : 0;
      return [['r_e', `${fd(re, 2)} Ω`], ['Z_i (R_L)', kO(S.m.Zi)], ['Z_o (R_s)', kO(S.m.Zo)], ['R_E ‖ (R_s′/β + r_e)', kO(1 / (1 / 3300 + 1 / (Rsp / 100 + re)))], ['A_vL = v_o/v_i', fd(S.m.Av, 4)], ['A_vs = v_o/v_s', fd(S.m.Avs, 4)]]; },
    text: (c, S) => t(`\\(R_L\\) = ${kO(S.RL)}: อัตราขยาย ${fd(S.m.Av, 3)} เพราะ \\(Z_o\\) = ${kO(S.m.Zo)} เล็กกว่าโหลดมาก ตัวตามแรงดันจึงรักษาแรงดันขาออกไว้ได้ แต่ \\(Z_i\\) ลดลงเหลือ ${kO(S.m.Zi)} เพราะเบสมองเห็น \\(\\beta(R_E \\parallel R_L)\\) และเมื่อ \\(R_s\\) เพิ่ม \\(Z_o\\) โตขึ้นตาม \\(R_s'/\\beta\\) (ตาราง 5.2): ตัวตามแรงดันส่งความต้านทานของแหล่งสัญญาณมาที่ขาออกโดยหารด้วย β`,
      `\\(R_L\\) = ${kO(S.RL)}: the gain is ${fd(S.m.Av, 3)} because \\(Z_o\\) = ${kO(S.m.Zo)} is far below the load, so the follower holds its output voltage. But \\(Z_i\\) drops to ${kO(S.m.Zi)}, because the base sees \\(\\beta(R_E \\parallel R_L)\\); and as \\(R_s\\) grows, \\(Z_o\\) grows with \\(R_s'/\\beta\\) (Table 5.2): the follower passes the source resistance to its output divided by β.`) }); };
/* page A.4, section A: the packaged amplifier of Example 5.13 (A_vNL = −480, Z_i = 4 kΩ, Z_o = 2 kΩ) between a source with R_s and a load R_L */
AC.EX.twoport = (ids = {}) => { const ui = MC.ui, pre = ids.pre || 'a', B = { Zi: 4e3, Zo: 2e3, Av: -480 };
  return OP.explorer({ ids, init: { Rs: 200, RL: 1200 }, title: t('แหล่งสัญญาณและโหลด', 'The source and the load'), layout: { cktAspM: 0.42, rowAsp: 0.64, rowMin: 260, cktAspN: 0.52 },
    controls: (p, S, build) => {
      ui.slider(p, { id: pre + 'Rs', label: 'R_s', min: 0, max: 5000, step: 50, value: S.Rs, fmt: v => kO(v), oninput: v => { S.Rs = v; build(); } });
      OP.logSlider(p, pre + 'RL', 'R_L', 100, 100e3, () => S.RL, v => { S.RL = v; }, build, v => kO(v), OP.rndR); },
    spec: S => (S.sp = AC.tp([{ ...B, name: t('วงจรขยาย (กล่อง)', 'the amplifier (a box)') }], { Rs: S.Rs || undefined, RL: S.RL })),
    onBuild: (c, S) => { S.vi = c.V('a1'); S.vo = c.V('o1'); S.vs = c.V('s'); },
    after: (v, c, S) => AC.boxes(v, S.sp.boxes),
    side: (ctx, b, bd, c, S) => { const AvL = Cx.abs(Cx.div(S.vo, S.vi)), Avs = Cx.abs(Cx.div(S.vo, S.vs));
      CH8.bars(ctx, b, [{ label: 'A_vNL', v: 480, color: C.curve, sub: bd.short ? '' : t('ไม่มีโหลด', 'no load') }, { label: 'A_vL', v: AvL, color: AMBER, sub: bd.short ? '' : t('มีโหลด', 'loaded') }, { label: 'A_vs', v: Avs, color: PINK, sub: bd.short ? '' : t('จากแหล่ง', 'from v_s') }],
        { title: bd.short ? '|A_v|' : t('ขนาดของอัตราขยาย: A_vNL > A_vL > A_vs เสมอ', 'the size of the gain: always A_vNL > A_vL > A_vs'), fmt: v => fd(v, 0), max: 520 }); },
    waves: [(ctx, b, bd, c, S) => AC.scope(ctx, b, { chans: [{ label: 'v_s', z: S.vs, color: AMBER }, { label: 'v_o', z: S.vo, color: CYAN }], w: c.w, now: bd.clk.ph, short: bd.short, title: bd.short ? '' : t('v_s (ช่อง 1) และ v_o (ช่อง 2)', 'v_s (channel 1) and v_o (channel 2)') })],
    badge: (c, S) => [[`A_vL = ${fd(Cx.abs(Cx.div(S.vo, S.vi)) * -1, 1)}, A_vs = ${fd(Cx.abs(Cx.div(S.vo, S.vs)) * -1, 1)}`], 'ok'],
    rows: (c, S) => { const kL = S.RL / (S.RL + 2e3), kS = 4e3 / (4e3 + S.Rs); return [['R_L/(R_L + Z_o)', fd(kL, 3)], ['Z_i/(Z_i + R_s)', fd(kS, 3)], ['A_vL = A_vNL·R_L/(R_L + Z_o)', fd(-480 * kL, 1)], ['A_vs = A_vL·Z_i/(Z_i + R_s)', fd(-480 * kL * kS, 1)], ['A_iL = −A_vL Z_i/R_L', fd(480 * kL * 4e3 / S.RL, 1)]]; },
    text: (c, S) => { const kL = S.RL / (S.RL + 2e3), kS = 4e3 / (4e3 + S.Rs);
      return t(`โหลด \\(R_L\\) = ${kO(S.RL)} กับ \\(Z_o\\) = 2 kΩ เป็นตัวแบ่งแรงดันที่ขาออก: เหลือ ${fd(kL * 100, 0)} % ของ \\(A_{v_{NL}}V_i\\) ส่วน \\(R_s\\) = ${kO(S.Rs)} กับ \\(Z_i\\) = 4 kΩ เป็นตัวแบ่งแรงดันที่ขาเข้า: สัญญาณเข้าวงจรได้ ${fd(kS * 100, 0)} % อัตราขยายจากแหล่งจึงเป็น ${fd(-480 * kL * kS, 1)} (สมการ 5.96)`,
        `The load \\(R_L\\) = ${kO(S.RL)} and \\(Z_o\\) = 2 kΩ form a divider at the output that keeps ${fd(kL * 100, 0)} % of \\(A_{v_{NL}}V_i\\); \\(R_s\\) = ${kO(S.Rs)} and \\(Z_i\\) = 4 kΩ form a divider at the input that lets ${fd(kS * 100, 0)} % of the signal in. The gain from the source is therefore ${fd(-480 * kL * kS, 1)} (Eq. 5.96).`); } }); };
/* page A.1, section B: the base–emitter junction, I_E against V_BE, with the tangent at the operating point: it always meets the axis 26 mV
   to the left, so its slope is I_E/26 mV and r_e = 26 mV/I_E */
const IS_BE = 2.43e-3 / Math.expm1(0.7 / VT);
AC.EX.re = (ids = {}) => { const ui = MC.ui;
  return OP.explorer({ ids, init: { IE: 2.43, beta: 100 }, title: t('จุดทำงานของรอยต่อ', 'The junction\'s operating point'), layout: { cktAspM: 0.42, rowAsp: 0.7, rowMin: 270, cktAspN: 0.5 },
    controls: (p, S, build) => {
      ui.slider(p, { id: (ids.pre || 'b') + 'IE', label: 'I_E', min: 0.2, max: 6, step: 0.01, value: S.IE, fmt: v => `${fd(v, 2)} mA`, oninput: v => { S.IE = v; build(); } });
      ui.slider(p, { id: (ids.pre || 'b') + 'B', label: 'β', min: 50, max: 250, step: 10, value: S.beta, fmt: v => `${v}`, oninput: v => { S.beta = v; build(); } }); },
    spec: S => ({ ground: 'g', nodes: { a: [0, 0], b: [2.6, 0], g: [0, 2.6], k: [2.6, 2.6] }, parts: [{ id: 'IE', type: 'I', a: 'g', b: 'a', value: S.IE * 1e-3, name: 'I_E', valText: `${fd(S.IE, 2)} mA`, side: -1 },
      W_('a', 'b'), { id: 'D', type: 'D', a: 'b', b: 'k', model: 'shockley', Is: IS_BE, n: 1, T: TVT, name: t('รอยต่อ B–E', 'B–E junction'), valText: '' }, W_('k', 'g')], mode: 'dc' }),
    side: (ctx, b, bd, c, S) => { const I = S.IE, V = VT * Math.log(I * 1e-3 / IS_BE + 1), sh = bd.short;
      OP.plot(ctx, b, { x: [0.6, 0.76], y: [0, 7], xt: [0.62, 0.66, 0.7, 0.74], yt: [1, 2, 3, 4, 5, 6, 7], xf: x => fd(x, 2), xl: 'V_BE (V)', yl: 'I_E (mA)', ml: 34,
        curves: [{ f: x => IS_BE * Math.expm1(x / VT) * 1e3, color: C.curve, w: 3 }, { f: x => I + (x - V) * I / (VT * 1e3) * 1e3, color: AMBER, w: 2, dash: [7, 5] }],
        vl: [{ x: V - VT, color: 'rgba(255,209,102,.6)', dash: [2, 3] }, { x: V, color: 'rgba(232,236,247,.35)', dash: [2, 3] }],
        pts: [{ x: V, y: I, color: PINK, r: 6, label: sh ? '' : `Q: ${fd(V, 3)} V, ${fd(I, 2)} mA`, side: -1 }],
        title: sh ? t('ความชัน = I_E/26 mV', 'slope = I_E/26 mV') : t('เส้นสัมผัสที่จุดทำงานตัดแกนห่างไป 26 mV เสมอ', 'the tangent at the operating point always meets the axis 26 mV away') });
      const X = x => b.x + 34 + (b.w - 34 - 14) * (x - 0.6) / 0.16, yA = b.y + b.h - 40 - 8; ctx.save(); ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(V - VT), yA); ctx.lineTo(X(V), yA); ctx.stroke(); ctx.restore();
      T(ctx, '26 mV', (X(V - VT) + X(V)) / 2, yA - 9, { color: AMBER, size: 12, weight: '700' }); },
    badge: (c, S) => [[`r_e = 26 mV / ${fd(S.IE, 2)} mA = ${fd(VT / S.IE * 1e3, 2)} Ω`], 'ok'],
    rows: (c, S) => { const re = VT / (S.IE * 1e-3); return [['V_BE', `${fd(VT * Math.log(S.IE * 1e-3 / IS_BE + 1), 3)} V`], ['r_e = 26 mV/I_E', `${fd(re, 2)} Ω`], ['βr_e', kO(S.beta * re)], ['g_m = 1/r_e', `${fd(1 / re * 1e3, 1)} mS`]]; },
    text: (c, S) => { const re = VT / (S.IE * 1e-3); return t(`ที่ \\(I_E\\) = ${fd(S.IE, 2)} mA ความชันของเส้นโค้งคือ \\(I_E/26\\ \\text{mV}\\) ความต้านทาน ac ของรอยต่อจึงเป็น \\(r_e\\) = ${fd(re, 2)} Ω เพิ่ม \\(I_E\\) เป็นสองเท่าแล้ว \\(r_e\\) ลดครึ่งหนึ่ง ฝั่งเบสมองเห็นความต้านทานนี้ใหญ่ขึ้น β เท่า: \\(\\beta r_e\\) = ${kO(S.beta * re)}`, `At \\(I_E\\) = ${fd(S.IE, 2)} mA the curve's slope is \\(I_E/26\\ \\text{mV}\\), so the junction's ac resistance is \\(r_e\\) = ${fd(re, 2)} Ω. Double \\(I_E\\) and \\(r_e\\) halves. From the base this resistance looks β times larger: \\(\\beta r_e\\) = ${kO(S.beta * re)}.`); } }); };

/* =====================================================================================================================
   7) the problems. Each one: the real amplifier (dc view: the bias currents; then its ac solution drives the scope), the ac equivalent circuit
   from the step that draws it, a table "by hand | simulator" that fills as the steps open, the oscilloscope with v_i and v_o */
const step = (why, tex, note) => LS.step(why, tex, note), block = rows => LS.block(rows);
const near = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(2e-3, 0.005 * Math.abs(a)));
const num = (label, ans, o = {}) => ({ label, w: o.w || 5, ok: x => near(x, ans, o.tol) });
const bdg = (th, en, ok = true) => [[th, en ?? th], ok === true ? 'ok' : ok === false ? 'wait' : ok];
const LAY = { cktAspM: 0.5, rowAsp: 0.66, rowMin: 260, cktAspN: 0.62, sideAspN: 0.7 };
AC.LAY = LAY;
const LAY2 = { ckt2AspM: 0.4, ckt2AspN: 0.48, ckt2AspW: 0.3 };   // the second circuit box (the ac equivalent under the real circuit)
/* a name in the top-left corner of a circuit box */
AC.caption = (v, text, above) => { const b = v.box; if (b) T(v.ctx, tt(text), b.x + 8, above ? b.y - 8 : b.y + 11, { align: 'left', color: COL.muted, size: 12 }); };   // above: in the band the board leaves over the second box
const DEF = {};
/* one amplifier, tuned and measured: { o, sp, m, dc (the same circuit in dc mode, for the bias view) } */
AC.mk = o => { const sp = AC.tune(AC.amp(o)); return { o, sp, m: AC.measure(sp), dc: { ...sp, mode: 'dc', dcFirst: false } }; };
/* an in-phase output would hide under the input on a shared screen: then channel 1 sits 2 divisions up and channel 2 two down */
const scopeOf = (m, bd, title) => { const ph = z => Math.atan2(z.im, z.re), sep = Math.cos(ph(m.ph.vo) - ph(m.ph.vi)) > 0 ? 2 : 0;
  return { chans: [{ label: 'v_i', z: m.ph.vi, color: AMBER, pos: sep }, { label: 'v_o', z: m.ph.vo, color: CYAN, pos: -sep }], w: m.c.w, now: bd.clk.ph, short: bd.short,
  title: bd.short ? '' : (title || t('ออสซิลโลสโคป: v_i (ช่อง 1) และ v_o (ช่อง 2)', 'oscilloscope: v_i (channel 1) and v_o (channel 2)')) }; };
const kOx = (r, d = 3) => CK.eng(r, 'Ω', d), num2 = (x, d = 2) => fd(x, d).replace('-', '−');
const tbl = (ctx, b, bd, rows, title) => (rows.length ? AC.table(ctx, b, rows, { short: bd.short, title: bd.short ? '' : title }) : CH8.empty(ctx, b, [t('เปิดขั้นแรกเพื่อเริ่ม: ตารางนี้เทียบค่าที่คำนวณมือกับภาพจำลอง', 'Open the first step: this table compares the hand values with the simulator'), '']));

/* one amplifier problem. c = { o (AC.amp options with the book's values), ro (Ω, the "with r_o" part from step roFrom), p (the hand values
   that label the equivalent circuit: { re, beta } or { gm, rd }), eqFrom (the first step that draws the equivalent circuit), alt: { o, p, from }
   (a second version of the circuit from step `from`, e.g. with the bypass capacitor), rows: [[from, label, book, m → simulator text]],
   glow: { k: [ids] }, badge(k, m) → text | [th, en], title, steps, ask, answer }. The circuits are built the first time the problem is drawn;
   m = { X, Xr, A (each AC.mk), EQ, EQr, EQa (equivalent circuits) } */
const ampDef = c => { let M = null; const fetQ = c.o.dev && c.o.dev !== 'bjt';
  const mk = () => (M && M.lang === MC.lang) ? M : (M = { lang: MC.lang, X: AC.mk(c.o), Xr: c.ro ? AC.mk({ ...c.o, [fetQ ? 'rd' : 'ro']: c.ro }) : null, A: c.alt ? AC.mk(c.alt.o || c.o) : null,
    EQ: AC.eq(c.o, c.p), EQr: c.ro ? AC.eq(c.o, { ...c.p, [fetQ ? 'rd' : 'ro']: c.ro }) : null, EQa: c.alt ? (c.alt.eq ? c.alt.eq() : AC.eq(c.alt.o, c.alt.p || c.p)) : null });
  const altOn = k => c.alt && k >= c.alt.from, roOn = k => c.ro && k >= c.roFrom;
  const cur = k => { const m = mk(); return altOn(k) ? m.A : roOn(k) ? m.Xr : m.X; };
  /* the real circuit stays in the first box for the whole solution (dc view: the dots are the dc currents, where the bias comes from); the ac
     equivalent appears in the second box from the step that draws it (eqFrom), so each of its parts can be traced back. A second version with a
     circuit of its own (alt.o: C_E connected, the book's values) replaces the real circuit from alt.from */
  const realOf = k => { const m = mk(); return altOn(k) && c.alt.o ? m.A : m.X; };
  const eqOf = k => { const m = mk(); return altOn(k) && !c.alt.real ? m.EQa : roOn(k) ? m.EQr : m.EQ; };
  return { ...LAY, ...LAY2, solvedAt: 1, probe: mk,
    spec: k => realOf(k).dc,
    spec2: k => (k < c.eqFrom ? null : eqOf(k)),
    after: (v, k) => { AC.ampTags(v, realOf(k).sp); AC.caption(v, t('วงจรจริง · จุดคือกระแสไฟตรง (dc)', 'the real circuit · dots: dc currents')); },
    after2: (v, k) => { const e = eqOf(k); if (e.boxes) AC.boxes(v, e.boxes);
      AC.zArrows(v, { inN: 'i', outN: e.zoN || e.out, outDx: 0.25, inDy: e.parts.some(q => q.id === 'Rs') ? 0.62 : undefined });   // with R_s the Z_i arrow goes under the line (R_s's label is above)
      AC.caption(v, t('วงจรสมมูล ac · จุดคือกระแสสัญญาณ', 'ac equivalent · dots: signal currents'), true); },
    empty2: (ctx, b) => { CH8.empty(ctx, b, [`ขั้นที่ ${c.eqFrom} วาดวงจรสมมูล ac ของวงจรข้างบนที่นี่`, `Step ${c.eqFrom} draws the ac equivalent of the circuit above here`]);
      T(ctx, t('วงจรสมมูล ac', 'ac equivalent'), b.x + 8, b.y - 8, { align: 'left', color: COL.muted, size: 12 }); },
    glow: k => (c.glow && c.glow[k]) || null,
    badge: k => { const b = c.badge ? c.badge(k, mk()) : null; return b ? (Array.isArray(b) ? bdg(b[0], b[1]) : bdg(b)) : null; },
    side: (ctx, b, bd, k) => { const m = mk(); tbl(ctx, b, bd, c.rows.filter(r => k >= r[0]).map(r => [r[1], r[2], r[3](m)]), c.title); },
    waves: [{ draw: (ctx, b, bd, k) => AC.scope(ctx, b, scopeOf(cur(k).m, bd)) }],
    steps: c.steps, ask: c.ask, answer: c.answer };
};
AC.ampDef = ampDef;
const mAx = I => `${fd(I * 1e3, 3)} mA`, reX = (m, X = 'X') => `${fd(0.026 / m[X].m.Q.IE, 2)} Ω`, grp = x => Math.round(x).toLocaleString('en-US').replace(/,/g, ' ');   // 34 641
/* an answer field that accepts the book's value or the exact one */
const num2a = (label, ans, alt, tol) => ({ label, w: 5, ok: x => near(x, ans, tol) || (alt !== undefined && near(x, alt, tol)) });

/* ---------------- page A.1: Example 5.1, common-emitter fixed bias (Fig. 5.25) ---------------- */
const O51 = { dev: 'bjt', cfg: 'fixed', VCC: 12, RB: 470e3, RC: 3000, beta: 100, vs: 0.01 };
DEF.ex51 = ampDef({ o: O51, ro: 50e3, roFrom: 7, p: { re: 0.026 / 2.428e-3, beta: 100 }, eqFrom: 3, title: ['Example 5.1: มือ | ภาพจำลอง', 'Example 5.1: hand | simulator'],
  rows: [[1, 'I_E', '2.428 mA', m => mAx(m.X.m.Q.IE)], [2, 'r_e', '10.71 Ω', m => reX(m)], [4, 'Z_i', '1.07 kΩ', m => kOx(m.X.m.Zi)], [5, 'Z_o', '3 kΩ', m => kOx(m.X.m.Zo)],
    [6, 'A_v', '−280.11', m => num2(m.X.m.Av)], [7, 'Z_o (r_o)', '2.83 kΩ', m => kOx(m.Xr.m.Zo)], [7, 'A_v (r_o)', '−264.24', m => num2(m.Xr.m.Av)]],
  glow: { 1: ['RB'], 2: ['Q'], 3: ['Rpi', 'Gm'], 4: ['RB', 'Rpi'], 5: ['RC'], 6: ['Gm', 'RC'], 7: ['ro', 'RC'] },
  badge: (k, m) => [null, 'dc: I_B = 24.04 µA, I_E = 2.428 mA', 'r_e = 26 mV/2.428 mA = 10.71 Ω', ['วงจรสมมูล ac: จุดคือกระแสสัญญาณ', 'ac equivalent: the dots are the signal currents'],
    `Z_i = R_B ‖ βr_e = ${kOx(m.X.m.Zi)}`, `Z_o = R_C = ${kOx(m.X.m.Zo)}`, `A_v = −R_C/r_e = ${num2(m.X.m.Av)}`, `r_o = 50 kΩ: A_v = ${num2(m.Xr.m.Av)}`][k] ?? null,
  steps: () => [
    step(t('<b>(a) วิเคราะห์ dc ก่อน</b>: ไฟตรงผ่านตัวเก็บประจุไม่ได้ ที่เหลือคือวงจรไบแอสคงที่ของหน้า 4.1 วงเบส–อิมิตเตอร์ให้ \\(I_B\\) แล้ว \\(I_E = (\\beta + 1)I_B\\) (ภาพจำลอง: จุดคือกระแสไฟตรง)', '<b>(a) The dc analysis first</b>: dc cannot pass the capacitors, so what is left is the fixed-bias circuit of page 4.1. The base–emitter loop gives \\(I_B\\), then \\(I_E = (\\beta + 1)I_B\\) (simulation: the dots are the dc currents).'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_B} = \frac{12\ \text{V} - 0.7\ \text{V}}{470\ \text{k}\Omega} = 24.04\ \mu\text{A}`, R`I_E &= (\beta + 1)I_B = (101)(24.04\ \mu\text{A}) = 2.428\ \text{mA}`])),
    step(t('<b>(a) \\(r_e\\)</b>: ความต้านทาน ac ของรอยต่อเบส–อิมิตเตอร์ที่กระแส \\(I_E\\) เหมือน \\(r_D = 26\\ \\text{mV}/I_D\\) ของไดโอด (หน้า 1.5 · ส่วน B ข้างบน)', '<b>(a) \\(r_e\\)</b>: the ac resistance of the base–emitter junction at the current \\(I_E\\), like a diode\'s \\(r_D = 26\\ \\text{mV}/I_D\\) (page 1.5 · section B above)'),
      block([R`r_e &= \frac{26\ \text{mV}}{I_E} = \frac{26\ \text{mV}}{2.428\ \text{mA}} = \boxed{10.71\ \Omega}`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 5.22): ตัวเก็บประจุ 10 µF เป็นลัดวงจรที่ความถี่สัญญาณ (ที่ 100 kHz มีรีแอกแตนซ์ 0.16 Ω) \\(V_{CC}\\) เป็นกราวด์ของสัญญาณ \\(R_B\\) และ \\(R_C\\) จึงต่อลงกราวด์ แล้วแทนทรานซิสเตอร์ด้วยแบบจำลอง \\(r_e\\): \\(\\beta r_e\\) ระหว่างเบสกับอิมิตเตอร์ และแหล่งกระแส \\(\\beta I_b\\) จากคอลเล็กเตอร์ลงอิมิตเตอร์', '<b>The ac equivalent circuit</b> (Fig. 5.22): the 10 µF capacitors are shorts at the signal frequency (0.16 Ω of reactance at 100 kHz), \\(V_{CC}\\) is an ac ground so \\(R_B\\) and \\(R_C\\) go to ground, and the transistor becomes its \\(r_e\\) model: \\(\\beta r_e\\) from base to emitter and a current source \\(\\beta I_b\\) from collector to emitter.'),
      block([R`\beta r_e &= (100)(10.71\ \Omega) = 1.071\ \text{k}\Omega`]), t('วงจรสมมูลปรากฏใต้วงจรจริง: ในรูปล่างจุดที่เคลื่อนที่คือกระแสสัญญาณ ac ไม่มีไฟตรง ส่วนรูปบนยังเป็นกระแสไฟตรง ไล่ดูได้ว่า \\(R_B\\) กับ \\(R_C\\) ไปลงกราวด์ได้อย่างไร', 'The equivalent circuit appears under the real one: in the lower picture the moving dots are the ac signal currents, with no dc, while the upper picture still shows the dc currents. Trace how \\(R_B\\) and \\(R_C\\) end up at ground.')),
    step(t('<b>(b) \\(Z_i\\)</b> (สมการ 5.5–5.6): มองเข้าที่ขาเข้าเห็น \\(R_B\\) ขนานกับ \\(\\beta r_e\\) และเพราะ \\(R_B\\) ใหญ่กว่ามาก \\(Z_i \\cong \\beta r_e\\)', '<b>(b) \\(Z_i\\)</b> (Eqs. 5.5–5.6): looking into the input one sees \\(R_B\\) in parallel with \\(\\beta r_e\\), and since \\(R_B\\) is far larger, \\(Z_i \\cong \\beta r_e\\)'),
      block([R`Z_i &= R_B \parallel \beta r_e = 470\ \text{k}\Omega \parallel 1.071\ \text{k}\Omega = \boxed{1.07\ \text{k}\Omega}`])),
    step(t('<b>(c) \\(Z_o\\)</b> (สมการ 5.8): ปิดแหล่งสัญญาณ (\\(V_i\\) = 0) แล้ว \\(I_b\\) = 0 แหล่งกระแส \\(\\beta I_b\\) จึงเป็นเปิดวงจร มองเข้าที่ขาออกเหลือ \\(R_C\\)', '<b>(c) \\(Z_o\\)</b> (Eq. 5.8): switch the signal off (\\(V_i\\) = 0); then \\(I_b\\) = 0 and the source \\(\\beta I_b\\) is an open circuit, so looking into the output leaves \\(R_C\\)'),
      block([R`Z_o &= R_C = \boxed{3\ \text{k}\Omega}\quad (r_o = \infty)`])),
    step(t('<b>(d) \\(A_v\\)</b> (สมการ 5.10): กระแส \\(\\beta I_b\\) ไหลลงผ่านแหล่งกระแส จึงไหลขึ้นผ่าน \\(R_C\\) จากกราวด์ \\(V_o = -\\beta I_bR_C\\) และ \\(I_b = V_i/\\beta r_e\\) β จึงตัดกันหมด', '<b>(d) \\(A_v\\)</b> (Eq. 5.10): the current \\(\\beta I_b\\) flows down through the source, so it flows up through \\(R_C\\) from ground: \\(V_o = -\\beta I_bR_C\\), and \\(I_b = V_i/\\beta r_e\\), so β cancels'),
      block([R`A_v &= \frac{V_o}{V_i} = \frac{-\beta I_bR_C}{I_b\,\beta r_e} = -\frac{R_C}{r_e} = -\frac{3\ \text{k}\Omega}{10.71\ \Omega} = \boxed{-280.11}`]),
      t('เครื่องหมายลบคือขาออกกลับเฟส 180°: ช่อง 2 ของออสซิลโลสโคปขึ้นเมื่อช่อง 1 ลง', 'The minus sign is a 180° phase inversion: channel 2 of the oscilloscope rises when channel 1 falls.')),
    step(t('<b>(e) รวม \\(r_o\\) = 50 kΩ</b> (สมการ 5.7, 5.9): \\(r_o\\) อยู่ขนานกับ \\(R_C\\) ทั้งใน \\(Z_o\\) และในอัตราขยาย', '<b>(e) With \\(r_o\\) = 50 kΩ</b> (Eqs. 5.7, 5.9): \\(r_o\\) sits in parallel with \\(R_C\\) in \\(Z_o\\) and in the gain'),
      block([R`Z_o &= r_o \parallel R_C = 50\ \text{k}\Omega \parallel 3\ \text{k}\Omega = \boxed{2.83\ \text{k}\Omega}`, R`A_v &= -\frac{r_o \parallel R_C}{r_e} = -\frac{2.83\ \text{k}\Omega}{10.71\ \Omega} = \boxed{-264.24}`]),
      t('อัตราขยายลดลงราว 6 % ตำราจึงละ \\(r_o\\) เมื่อ \\(r_o \\ge 10R_C\\) (ที่นี่ 50 kΩ ≥ 30 kΩ) ภาพจำลองได้ −264.33 เพราะไม่ปัด \\(r_e\\) เป็น 10.71 Ω', 'The gain drops by about 6 %, which is why the book ignores \\(r_o\\) when \\(r_o \\ge 10R_C\\) (here 50 kΩ ≥ 30 kΩ). The simulator gets −264.33 because it does not round \\(r_e\\) to 10.71 Ω.')) ],
  ask: () => ({ fields: [num('r<sub>e</sub> (Ω) =', 10.71, { tol: 0.05 }), num('Z<sub>i</sub> (kΩ) =', 1.07, { tol: 0.01 }), num('A<sub>v</sub> (r<sub>o</sub> = ∞) =', -280.11, { tol: 1.5 }), num('A<sub>v</sub> (r<sub>o</sub> = 50 kΩ) =', -264.24, { tol: 1.5 })],
    check: v => (v[2] > 0 || v[3] > 0 ? t('A<sub>v</sub> ของวงจรอิมิตเตอร์ร่วมติดลบ: ขาออกกลับเฟส', 'A<sub>v</sub> of a common-emitter amplifier is negative: the output is inverted.') : near(v[1], 1068.6, 30) ? t('Z<sub>i</sub> หน่วยเป็น kΩ', 'Z<sub>i</sub> is asked in kΩ.') : '') }),
  answer: () => t('(a) \\(r_e\\) = 10.71 Ω (b) \\(Z_i\\) = 1.07 kΩ (c) \\(Z_o\\) = 3 kΩ (d) \\(A_v\\) = −280.11 (e) \\(Z_o\\) = 2.83 kΩ, \\(A_v\\) = −264.24 (Boylestad Example 5.1)', '(a) \\(r_e\\) = 10.71 Ω (b) \\(Z_i\\) = 1.07 kΩ (c) \\(Z_o\\) = 3 kΩ (d) \\(A_v\\) = −280.11 (e) \\(Z_o\\) = 2.83 kΩ, \\(A_v\\) = −264.24 (Boylestad Example 5.1)') });

/* ---------------- page A.2: Example 5.2, voltage divider with R_E bypassed (Fig. 5.28) ---------------- */
const O52 = { dev: 'bjt', cfg: 'vdb', VCC: 22, R1: 56e3, R2: 8.2e3, RC: 6.8e3, RE: 1.5e3, CE: true, CEv: 20e-6, beta: 90, vs: 0.01 };
DEF.ex52 = ampDef({ o: O52, ro: 50e3, roFrom: 7, p: { re: 18.44, beta: 90 }, eqFrom: 3, title: ['Example 5.2: ตำรา (ประมาณ) | ภาพจำลอง (ละเอียด)', 'Example 5.2: book (approximate) | simulator (exact)'],
  rows: [[1, 'I_E', '1.41 mA', m => mAx(m.X.m.Q.IE)], [2, 'r_e', '18.44 Ω', m => reX(m)], [4, 'Z_i', '1.35 kΩ', m => kOx(m.X.m.Zi)], [5, 'Z_o', '6.8 kΩ', m => kOx(m.X.m.Zo)],
    [6, 'A_v', '−368.76', m => num2(m.X.m.Av)], [7, 'Z_o (r_o)', '5.98 kΩ', m => kOx(m.Xr.m.Zo)], [7, 'A_v (r_o)', '−324.3', m => num2(m.Xr.m.Av)]],
  glow: { 1: ['R1', 'R2'], 2: ['Q'], 3: ['R1', 'R2', 'Rpi', 'Gm'], 4: ['R1', 'R2', 'Rpi'], 5: ['RC'], 6: ['Gm', 'RC'], 7: ['ro', 'RC'] },
  badge: (k, m) => [null, ['dc (วิธีประมาณ): I_E = 1.41 mA · วิธีละเอียด 1.337 mA', 'dc (approximate): I_E = 1.41 mA · exact 1.337 mA'], ['r_e = 18.44 Ω (ละเอียด 19.45 Ω)', 'r_e = 18.44 Ω (exact 19.45 Ω)'], ['วงจรสมมูล ac: R′ = R_1 ‖ R_2, C_E ลัด R_E', 'ac equivalent: R′ = R_1 ‖ R_2, C_E shorts R_E'],
    `Z_i = R′ ‖ βr_e = ${kOx(m.X.m.Zi)}`, `Z_o = R_C = ${kOx(m.X.m.Zo)}`, `A_v = ${num2(m.X.m.Av)}`, `r_o = 50 kΩ: A_v = ${num2(m.Xr.m.Av)}`][k] ?? null,
  steps: () => [
    step(t('<b>(a) วิเคราะห์ dc</b>: ตรวจเงื่อนไขของวิธีประมาณ (หน้า 4.3) \\(\\beta R_E\\) = (90)(1.5 kΩ) = 135 kΩ ≥ \\(10R_2\\) = 82 kΩ จึงหา \\(V_B\\) จากตัวแบ่งแรงดันโดยไม่คิดกระแสเบส', '<b>(a) The dc analysis</b>: check the condition of the approximate method (page 4.3): \\(\\beta R_E\\) = (90)(1.5 kΩ) = 135 kΩ ≥ \\(10R_2\\) = 82 kΩ, so \\(V_B\\) comes from the divider, ignoring the base current'),
      block([R`V_B &= \frac{R_2V_{CC}}{R_1 + R_2} = \frac{(8.2\ \text{k}\Omega)(22\ \text{V})}{56\ \text{k}\Omega + 8.2\ \text{k}\Omega} = 2.81\ \text{V}`, R`V_E &= V_B - V_{BE} = 2.11\ \text{V},\quad I_E = \frac{V_E}{R_E} = \frac{2.11\ \text{V}}{1.5\ \text{k}\Omega} = 1.41\ \text{mA}`]),
      t('วิธีละเอียด (เทวินิน หน้า 4.3) ได้ \\(I_E\\) = 1.337 mA ต่ำกว่าราว 5 % ภาพจำลองแก้วงจรแบบละเอียด คอลัมน์ภาพจำลองจึงต่างจากตำราราว 5 % ตลอดโจทย์นี้', 'The exact (Thevenin) method of page 4.3 gives \\(I_E\\) = 1.337 mA, about 5 % lower. The simulator solves the circuit exactly, so its column differs from the book by about 5 % throughout this problem.')),
    step(t('<b>(a) \\(r_e\\)</b>', '<b>(a) \\(r_e\\)</b>'), block([R`r_e &= \frac{26\ \text{mV}}{I_E} = \frac{26\ \text{mV}}{1.41\ \text{mA}} = \boxed{18.44\ \Omega}`]),
      t('ค่าละเอียด 26 mV/1.337 mA = 19.45 Ω', 'Exact: 26 mV/1.337 mA = 19.45 Ω.')),
    step(t('<b>วงจรสมมูล ac</b> (รูป 5.26–5.27): \\(V_{CC}\\) เป็นกราวด์ \\(R_1\\) จึงลงกราวด์เหมือน \\(R_2\\) ทั้งสองขนานกันเป็น \\(R\'\\) (สมการ 5.11) ตัวเก็บประจุ \\(C_E\\) ลัดวงจร \\(R_E\\) อิมิตเตอร์จึงลงกราวด์ตรง ๆ ที่เหลือเหมือนวงจรไบแอสคงที่ทุกประการ', '<b>The ac equivalent circuit</b> (Figs. 5.26–5.27): \\(V_{CC}\\) is a ground, so \\(R_1\\) goes to ground like \\(R_2\\) and the two are in parallel as \\(R\'\\) (Eq. 5.11); \\(C_E\\) shorts \\(R_E\\), so the emitter goes straight to ground. The rest is exactly the fixed-bias circuit.'),
      block([R`R' &= R_1 \parallel R_2 = 56\ \text{k}\Omega \parallel 8.2\ \text{k}\Omega = 7.15\ \text{k}\Omega`, R`\beta r_e &= (90)(18.44\ \Omega) = 1.66\ \text{k}\Omega`])),
    step(t('<b>(b) \\(Z_i\\)</b> (สมการ 5.12): ครั้งนี้ \\(R\'\\) ไม่ได้ใหญ่กว่า \\(\\beta r_e\\) มาก ตัดทิ้งไม่ได้', '<b>(b) \\(Z_i\\)</b> (Eq. 5.12): this time \\(R\'\\) is not much larger than \\(\\beta r_e\\), so it cannot be dropped'),
      block([R`Z_i &= R' \parallel \beta r_e = 7.15\ \text{k}\Omega \parallel 1.66\ \text{k}\Omega = \boxed{1.35\ \text{k}\Omega}`])),
    step(t('<b>(c) \\(Z_o\\)</b> (สมการ 5.14)', '<b>(c) \\(Z_o\\)</b> (Eq. 5.14)'), block([R`Z_o &= R_C = \boxed{6.8\ \text{k}\Omega}\quad (r_o = \infty)`])),
    step(t('<b>(d) \\(A_v\\)</b> (สมการ 5.16)', '<b>(d) \\(A_v\\)</b> (Eq. 5.16)'), block([R`A_v &= -\frac{R_C}{r_e} = -\frac{6.8\ \text{k}\Omega}{18.44\ \Omega} = \boxed{-368.76}`]),
      t('ด้วย \\(r_e\\) แบบละเอียด 19.45 Ω ได้ −349.6 ซึ่งคือค่าที่ภาพจำลองแสดง: ความคลาดของการวิเคราะห์ dc ส่งต่อถึงอัตราขยาย ac ตรง ๆ', 'With the exact \\(r_e\\) of 19.45 Ω the gain is −349.6, the value the simulator shows: an error in the dc analysis carries straight into the ac gain.')),
    step(t('<b>(e) รวม \\(r_o\\) = 50 kΩ</b> (สมการ 5.13, 5.15): \\(Z_i\\) ไม่เปลี่ยน', '<b>(e) With \\(r_o\\) = 50 kΩ</b> (Eqs. 5.13, 5.15): \\(Z_i\\) does not change'),
      block([R`Z_o &= R_C \parallel r_o = 6.8\ \text{k}\Omega \parallel 50\ \text{k}\Omega = \boxed{5.98\ \text{k}\Omega}`, R`A_v &= -\frac{R_C \parallel r_o}{r_e} = -\frac{5.98\ \text{k}\Omega}{18.44\ \Omega} = \boxed{-324.3}`])) ],
  ask: () => ({ fields: [num2a('r<sub>e</sub> (Ω) =', 18.44, 19.45, 0.12), num2a('Z<sub>i</sub> (kΩ) =', 1.35, 1.406, 0.02), num2a('A<sub>v</sub> (r<sub>o</sub> = ∞) =', -368.76, -349.6, 2.5), num2a('A<sub>v</sub> (r<sub>o</sub> = 50 kΩ) =', -324.3, -307.7, 2.5)],
    check: v => (near(v[2], -280, 40) ? t('อย่าลืมว่า \\(r_e\\) มาจาก \\(I_E\\) ของวงจรนี้', 'Remember that \\(r_e\\) comes from this circuit\'s \\(I_E\\).') : '') }),
  answer: () => t('(a) \\(r_e\\) = 18.44 Ω (b) \\(Z_i\\) = 1.35 kΩ (c) \\(Z_o\\) = 6.8 kΩ (d) \\(A_v\\) = −368.76 (e) \\(Z_o\\) = 5.98 kΩ, \\(A_v\\) = −324.3 (Boylestad Example 5.2, วิธี dc แบบประมาณ · แบบละเอียด: \\(r_e\\) = 19.45 Ω, \\(A_v\\) = −349.6 และ −307.7)', '(a) \\(r_e\\) = 18.44 Ω (b) \\(Z_i\\) = 1.35 kΩ (c) \\(Z_o\\) = 6.8 kΩ (d) \\(A_v\\) = −368.76 (e) \\(Z_o\\) = 5.98 kΩ, \\(A_v\\) = −324.3 (Boylestad Example 5.2, approximate dc · exact: \\(r_e\\) = 19.45 Ω, \\(A_v\\) = −349.6 and −307.7)') });

/* ---------------- page A.2: Examples 5.3 and 5.4, emitter bias without and with C_E (Fig. 5.32) ---------------- */
const O53 = { dev: 'bjt', cfg: 'fixed', VCC: 20, RB: 470e3, RC: 2.2e3, RE: 0.56e3, CE: false, CEv: 10e-6, beta: 120, vs: 0.01 };
AC.O53 = O53;
DEF.ex53 = ampDef({ o: O53, alt: { o: { ...O53, CE: true }, from: 7 }, p: { re: 5.99, beta: 120 }, eqFrom: 3, title: ['Examples 5.3–5.4: มือ | ภาพจำลอง', 'Examples 5.3–5.4: hand | simulator'],
  rows: [[1, 'I_E', '4.34 mA', m => mAx(m.X.m.Q.IE)], [2, 'r_e', '5.99 Ω', m => reX(m)], [3, 'Z_b', '67.92 kΩ', m => kOx(1 / (1 / m.X.m.Zi - 1 / 470e3))], [4, 'Z_i', '59.34 kΩ', m => kOx(m.X.m.Zi)],
    [5, 'Z_o', '2.2 kΩ', m => kOx(m.X.m.Zo)], [6, 'A_v', '−3.89', m => num2(m.X.m.Av)], [7, 'Z_i (C_E)', '717.7 Ω', m => kOx(m.A.m.Zi)], [7, 'A_v (C_E)', '−367.28', m => num2(m.A.m.Av)]],
  glow: { 1: ['RB', 'RE'], 2: ['Q'], 3: ['Rpi', 'RE'], 4: ['RB', 'Rpi', 'RE'], 5: ['RC'], 6: ['RC', 'RE'], 7: ['Rpi', 'RC'] },
  badge: (k, m) => [null, 'dc: I_B = 35.89 µA, I_E = 4.34 mA', 'r_e = 26 mV/4.34 mA = 5.99 Ω', ['R_E อยู่ในวงจร ac: เบสเห็น β(r_e + R_E)', 'R_E stays in the ac circuit: the base sees β(r_e + R_E)'],
    `Z_i = R_B ‖ Z_b = ${kOx(m.X.m.Zi)}`, `Z_o = R_C = ${kOx(m.X.m.Zo)}`, `A_v = ${num2(m.X.m.Av)} ≅ −R_C/R_E`, [`ต่อ C_E: A_v = ${num2(m.A.m.Av)}, Z_i = ${kOx(m.A.m.Zi)}`, `C_E in: A_v = ${num2(m.A.m.Av)}, Z_i = ${kOx(m.A.m.Zi)}`]][k] ?? null,
  steps: () => [
    step(t('<b>dc</b> (Example 5.3, รูป 5.32): ตัวเก็บประจุ \\(C_E\\) ยังไม่ต่อ (และไม่มีผลต่อไฟตรงอยู่แล้ว) วงเบส–อิมิตเตอร์คือวงจรไบแอสอิมิตเตอร์ของหน้า 4.2', '<b>dc</b> (Example 5.3, Fig. 5.32): the capacitor \\(C_E\\) is not connected yet (it would not affect dc anyway); the base–emitter loop is the emitter-bias circuit of page 4.2'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_B + (\beta + 1)R_E} = \frac{20\ \text{V} - 0.7\ \text{V}}{470\ \text{k}\Omega + (121)(0.56\ \text{k}\Omega)} = 35.89\ \mu\text{A}`, R`I_E &= (\beta + 1)I_B = (121)(35.89\ \mu\text{A}) = 4.34\ \text{mA}`])),
    step(t('<b>\\(r_e\\)</b>', '<b>\\(r_e\\)</b>'), block([R`r_e &= \frac{26\ \text{mV}}{4.34\ \text{mA}} = \boxed{5.99\ \Omega}`])),
    step(t('<b>วงจรสมมูล ac ที่มี \\(R_E\\)</b> (รูป 5.30, สมการ 5.17–5.18): กระแส \\(I_e = (\\beta + 1)I_b\\) ไหลผ่าน \\(R_E\\) แรงดันที่เบสจึงต้องดันทั้ง \\(\\beta r_e\\) และ \\(R_E\\) ที่ใหญ่ขึ้นราว β เท่า', '<b>The ac equivalent with \\(R_E\\)</b> (Fig. 5.30, Eqs. 5.17–5.18): the current \\(I_e = (\\beta + 1)I_b\\) flows through \\(R_E\\), so the base voltage has to drive \\(\\beta r_e\\) and an \\(R_E\\) that looks about β times larger'),
      block([R`Z_b &= \beta r_e + (\beta + 1)R_E \cong \beta(r_e + R_E) = (120)(5.99\ \Omega + 560\ \Omega) = \boxed{67.92\ \text{k}\Omega}`]),
      t('ตำราใช้ β แทน β + 1 ค่าเต็มคือ 68.48 kΩ (คอลัมน์ภาพจำลอง) ส่วน \\(r_o\\) = 40 kΩ ≥ \\(10(R_C + R_E)\\) = 27.6 kΩ จึงละ \\(r_o\\)', 'The book uses β in place of β + 1; the full value is 68.48 kΩ (simulator column). And \\(r_o\\) = 40 kΩ ≥ \\(10(R_C + R_E)\\) = 27.6 kΩ, so \\(r_o\\) is dropped.')),
    step(t('<b>\\(Z_i\\)</b> (สมการ 5.20)', '<b>\\(Z_i\\)</b> (Eq. 5.20)'), block([R`Z_i &= R_B \parallel Z_b = 470\ \text{k}\Omega \parallel 67.92\ \text{k}\Omega = \boxed{59.34\ \text{k}\Omega}`])),
    step(t('<b>\\(Z_o\\)</b> (สมการ 5.21)', '<b>\\(Z_o\\)</b> (Eq. 5.21)'), block([R`Z_o &= R_C = \boxed{2.2\ \text{k}\Omega}`])),
    step(t('<b>\\(A_v\\)</b> (สมการ 5.22–5.24): \\(V_o = -\\beta I_bR_C\\) และ \\(I_b = V_i/Z_b\\)', '<b>\\(A_v\\)</b> (Eqs. 5.22–5.24): \\(V_o = -\\beta I_bR_C\\) and \\(I_b = V_i/Z_b\\)'),
      block([R`A_v &= -\frac{\beta R_C}{Z_b} = -\frac{(120)(2.2\ \text{k}\Omega)}{67.92\ \text{k}\Omega} = \boxed{-3.89}\ \cong -\frac{R_C}{R_E} = -3.93`]),
      t('อัตราขยายถูกกำหนดด้วยตัวต้านทานสองตัว แทบไม่ขึ้นกับ β และ \\(r_e\\): ส่วน A เปลี่ยน β จาก 60 เป็น 240 อัตราขยายแทบไม่ขยับ', 'The gain is set by two resistors and hardly depends on β or \\(r_e\\): in section A take β from 60 to 240 and it barely moves.')),
    step(t('<b>Example 5.4: ต่อ \\(C_E\\)</b> (หัวข้อ 5.7): \\(R_E\\) ถูกลัดวงจรสำหรับ ac วงจรกลับเป็นไบแอสคงที่ (สมการ 5.5, 5.10)', '<b>Example 5.4: connect \\(C_E\\)</b> (section 5.7): \\(R_E\\) is shorted for ac and the circuit is back to fixed bias (Eqs. 5.5, 5.10)'),
      block([R`Z_i &= R_B \parallel \beta r_e = 470\ \text{k}\Omega \parallel 718.8\ \Omega = \boxed{717.7\ \Omega}`, R`A_v &= -\frac{R_C}{r_e} = -\frac{2.2\ \text{k}\Omega}{5.99\ \Omega} = \boxed{-367.28}`]),
      t('อัตราขยายเพิ่มราว 94 เท่า แต่ \\(Z_i\\) ลดลงราว 83 เท่า และอัตราขยายกลับไปขึ้นกับ \\(r_e\\) ซึ่งขึ้นกับจุดทำงาน β และอุณหภูมิ', 'The gain grows about 94 times, but \\(Z_i\\) shrinks about 83 times, and the gain depends on \\(r_e\\) again, which depends on the operating point, β and temperature.')) ],
  ask: () => ({ fields: [num2a('Z<sub>i</sub> ไม่มี C<sub>E</sub> (kΩ) =', 59.34, 59.77, 0.6), num2a('A<sub>v</sub> ไม่มี C<sub>E</sub> =', -3.89, -3.855, 0.045), num('A<sub>v</sub> มี C<sub>E</sub> =', -367.28, { tol: 2 })],
    check: v => (near(v[1], -367.28, 30) ? t('ไม่มี C<sub>E</sub>: R<sub>E</sub> ยังอยู่ในวงจร ac อัตราขยายใกล้ −R<sub>C</sub>/R<sub>E</sub>', 'Without C<sub>E</sub>, R<sub>E</sub> stays in the ac circuit: the gain is near −R<sub>C</sub>/R<sub>E</sub>.') : '') }),
  answer: () => t('ไม่มี \\(C_E\\): \\(r_e\\) = 5.99 Ω, \\(Z_b\\) = 67.92 kΩ, \\(Z_i\\) = 59.34 kΩ, \\(Z_o\\) = 2.2 kΩ, \\(A_v\\) = −3.89 · มี \\(C_E\\): \\(Z_i\\) = 717.7 Ω, \\(A_v\\) = −367.28 (Boylestad Examples 5.3–5.4)', 'Without \\(C_E\\): \\(r_e\\) = 5.99 Ω, \\(Z_b\\) = 67.92 kΩ, \\(Z_i\\) = 59.34 kΩ, \\(Z_o\\) = 2.2 kΩ, \\(A_v\\) = −3.89 · with \\(C_E\\): \\(Z_i\\) = 717.7 Ω, \\(A_v\\) = −367.28 (Boylestad Examples 5.3–5.4)') });

/* ---------------- page A.3: Example 5.7, emitter follower (Fig. 5.39) ---------------- */
const O57 = { dev: 'bjt', cfg: 'ef', VCC: 12, RB: 220e3, RE: 3.3e3, beta: 100, vs: 0.01 };
AC.O57 = O57;
DEF.ex57 = ampDef({ o: O57, ro: 25e3, roFrom: 7, p: { re: 12.61, beta: 100 }, eqFrom: 3, title: ['Example 5.7: มือ | ภาพจำลอง', 'Example 5.7: hand | simulator'],
  rows: [[1, 'I_E', '2.062 mA', m => mAx(m.X.m.Q.IE)], [2, 'r_e', '12.61 Ω', m => reX(m)], [4, 'Z_i', '132.72 kΩ', m => kOx(m.X.m.Zi)], [5, 'Z_o', '12.56 Ω', m => kOx(m.X.m.Zo)],
    [6, 'A_v', '0.996', m => fd(m.X.m.Av, 4)], [7, 'Z_i (r_o)', '126.15 kΩ', m => kOx(m.Xr.m.Zi)], [7, 'A_v (r_o)', '0.996', m => fd(m.Xr.m.Av, 4)]],
  glow: { 1: ['RB', 'RE'], 2: ['Q'], 3: ['Rpi', 'Gm'], 4: ['RB', 'Rpi', 'RE'], 5: ['RE', 'Rpi'], 6: ['RE', 'Rpi'], 7: ['ro', 'RE'] },
  badge: (k, m) => [null, 'dc: I_B = 20.42 µA, I_E = 2.062 mA', 'r_e = 26 mV/2.062 mA = 12.61 Ω', ['วงจรสมมูล ac: คอลเล็กเตอร์เป็นกราวด์ ขาออกที่อิมิตเตอร์', 'ac equivalent: the collector is at ground, the output at the emitter'],
    `Z_i = R_B ‖ Z_b = ${kOx(m.X.m.Zi)}`, `Z_o = R_E ‖ r_e = ${kOx(m.X.m.Zo)}`, [`A_v = ${fd(m.X.m.Av, 4)} (ไม่กลับเฟส)`, `A_v = ${fd(m.X.m.Av, 4)} (in phase)`], `r_o = 25 kΩ: Z_i = ${kOx(m.Xr.m.Zi)}`][k] ?? null,
  steps: () => [
    step(t('<b>(a) dc</b> (รูป 5.39): ไม่มี \\(R_C\\) คอลเล็กเตอร์ต่อ \\(V_{CC}\\) ตรง ๆ วงเบส–อิมิตเตอร์คือไบแอสอิมิตเตอร์ของหน้า 4.2 (และตัวตามแรงดันของหน้า 4.5)', '<b>(a) dc</b> (Fig. 5.39): there is no \\(R_C\\), the collector goes straight to \\(V_{CC}\\), and the base–emitter loop is the emitter-bias loop of page 4.2 (and the follower of page 4.5)'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_B + (\beta + 1)R_E} = \frac{11.3\ \text{V}}{220\ \text{k}\Omega + (101)(3.3\ \text{k}\Omega)} = 20.42\ \mu\text{A}`, R`I_E &= (\beta + 1)I_B = 2.062\ \text{mA}`])),
    step(t('<b>(a) \\(r_e\\)</b>', '<b>(a) \\(r_e\\)</b>'), block([R`r_e &= \frac{26\ \text{mV}}{2.062\ \text{mA}} = \boxed{12.61\ \Omega}`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 5.36–5.37): คอลเล็กเตอร์อยู่ที่ \\(V_{CC}\\) ซึ่งเป็นกราวด์ของ ac แหล่งกระแส \\(\\beta I_b\\) จึงดันกระแสจากกราวด์ขึ้นเข้าอิมิตเตอร์ ขาออกคือแรงดันที่อิมิตเตอร์คร่อม \\(R_E\\)', '<b>The ac equivalent circuit</b> (Figs. 5.36–5.37): the collector sits at \\(V_{CC}\\), an ac ground, so the source \\(\\beta I_b\\) pushes current up from ground into the emitter; the output is the emitter voltage across \\(R_E\\)'),
      block([R`\beta r_e &= (100)(12.61\ \Omega) = 1.261\ \text{k}\Omega`])),
    step(t('<b>(b) \\(Z_i\\)</b> (สมการ 5.31–5.32): \\(R_E\\) ทั้งตัวอยู่ในวงจร ac และถูกคูณด้วย \\(\\beta + 1\\) เหมือนหน้า A.2', '<b>(b) \\(Z_i\\)</b> (Eqs. 5.31–5.32): all of \\(R_E\\) is in the ac circuit, multiplied by \\(\\beta + 1\\) as on page A.2'),
      block([R`Z_b &= \beta r_e + (\beta + 1)R_E = 1.261\ \text{k}\Omega + 333.3\ \text{k}\Omega = 334.56\ \text{k}\Omega`, R`Z_i &= R_B \parallel Z_b = 220\ \text{k}\Omega \parallel 334.56\ \text{k}\Omega = \boxed{132.72\ \text{k}\Omega}`])),
    step(t('<b>(c) \\(Z_o\\)</b> (สมการ 5.36–5.37): ปิดแหล่งสัญญาณ แล้วมองย้อนเข้าอิมิตเตอร์ กระแส \\(I_e\\) เห็นแค่ \\(r_e\\) (ฝั่งเบสลงกราวด์ผ่านแหล่งสัญญาณ) ขนานกับ \\(R_E\\)', '<b>(c) \\(Z_o\\)</b> (Eqs. 5.36–5.37): switch the source off and look back into the emitter: the current \\(I_e\\) sees only \\(r_e\\) (the base goes to ground through the source), in parallel with \\(R_E\\)'),
      block([R`Z_o &= R_E \parallel r_e = 3.3\ \text{k}\Omega \parallel 12.61\ \Omega = \boxed{12.56\ \Omega} \cong r_e`]),
      t('อิมพีแดนซ์ขาออกต่ำมาก: ต่อโหลดหนัก ๆ แรงดันขาออกก็แทบไม่ตก วงจรนี้จึงใช้เป็นบัฟเฟอร์ (ส่วน A)', 'A very low output impedance: a heavy load hardly pulls the output down, which is why this circuit is used as a buffer (section A).')),
    step(t('<b>(d) \\(A_v\\)</b> (สมการ 5.38–5.39): \\(V_o = I_eR_E\\) และ \\(V_i = I_e(r_e + R_E)\\)', '<b>(d) \\(A_v\\)</b> (Eqs. 5.38–5.39): \\(V_o = I_eR_E\\) and \\(V_i = I_e(r_e + R_E)\\)'),
      block([R`A_v &= \frac{R_E}{R_E + r_e} = \frac{3.3\ \text{k}\Omega}{3.3\ \text{k}\Omega + 12.61\ \Omega} = \boxed{0.996} \cong 1`]),
      t('ขาออกตามขาเข้าทั้งขนาดและเฟส: ช่อง 1 กับช่อง 2 ของออสซิลโลสโคปซ้อนกัน', 'The output follows the input in size and phase: channels 1 and 2 of the oscilloscope lie on top of each other.')),
    step(t('<b>(e) รวม \\(r_o\\) = 25 kΩ</b> (สมการ 5.40–5.44): ครั้งนี้ \\(r_o < 10R_E\\) = 33 kΩ จึงละไม่ได้ \\(r_o\\) ขนานกับ \\(R_E\\) ในวงจร ac', '<b>(e) With \\(r_o\\) = 25 kΩ</b> (Eqs. 5.40–5.44): this time \\(r_o < 10R_E\\) = 33 kΩ, so it cannot be dropped; in the ac circuit \\(r_o\\) is in parallel with \\(R_E\\)'),
      block([R`Z_b &= \beta r_e + \frac{(\beta + 1)R_E}{1 + R_E/r_o} = 1.261\ \text{k}\Omega + \frac{333.3\ \text{k}\Omega}{1.132} = 295.7\ \text{k}\Omega`, R`Z_i &= 220\ \text{k}\Omega \parallel 295.7\ \text{k}\Omega = \boxed{126.15\ \text{k}\Omega}`]),
      t('\\(Z_o\\) และ \\(A_v\\) แทบไม่เปลี่ยน (12.56 Ω และ 0.996) \\(r_o\\) มีผลกับ \\(Z_i\\) เท่านั้น', '\\(Z_o\\) and \\(A_v\\) hardly change (12.56 Ω and 0.996); \\(r_o\\) only affects \\(Z_i\\).')) ],
  ask: () => ({ fields: [num('Z<sub>i</sub> (kΩ) =', 132.72, { tol: 1.3 }), num2a('Z<sub>o</sub> (Ω) =', 12.56, 12.44, 0.12), num('A<sub>v</sub> =', 0.996, { tol: 0.0025 })],
    check: v => (v[2] < 0 ? t('ตัวตามแรงดันไม่กลับเฟส: A<sub>v</sub> เป็นบวก', 'A follower does not invert: A<sub>v</sub> is positive.') : near(v[1], 3300, 50) ? t('Z<sub>o</sub> คือ R<sub>E</sub> ขนานกับ r<sub>e</sub> ไม่ใช่ R<sub>E</sub>', 'Z<sub>o</sub> is R<sub>E</sub> in parallel with r<sub>e</sub>, not R<sub>E</sub>.') : '') }),
  answer: () => t('(a) \\(r_e\\) = 12.61 Ω (b) \\(Z_i\\) = 132.72 kΩ (c) \\(Z_o\\) = 12.56 Ω (d) \\(A_v\\) = 0.996 (e) \\(Z_i\\) = 126.15 kΩ, \\(Z_o\\) = 12.56 Ω, \\(A_v\\) = 0.996 (Boylestad Example 5.7)', '(a) \\(r_e\\) = 12.61 Ω (b) \\(Z_i\\) = 132.72 kΩ (c) \\(Z_o\\) = 12.56 Ω (d) \\(A_v\\) = 0.996 (e) \\(Z_i\\) = 126.15 kΩ, \\(Z_o\\) = 12.56 Ω, \\(A_v\\) = 0.996 (Boylestad Example 5.7)') });

/* ---------------- page A.3: Example 5.8, common base, pnp (Fig. 5.44) ---------------- */
const O58 = { dev: 'bjt', cfg: 'cb', pnp: true, VCC: 8, VEE: 2, RE: 1e3, RC: 5e3, beta: 49, alpha: 0.98, vs: 0.01 };
DEF.ex58 = ampDef({ o: O58, p: { re: 20, alpha: 0.98 }, eqFrom: 3, title: ['Example 5.8: มือ | ภาพจำลอง', 'Example 5.8: hand | simulator'],
  rows: [[1, 'I_E', '1.3 mA', m => mAx(m.X.m.Q.IE)], [2, 'r_e', '20 Ω', m => reX(m)], [4, 'Z_i', '19.61 Ω', m => kOx(m.X.m.Zi)], [5, 'Z_o', '5 kΩ', m => kOx(m.X.m.Zo)],
    [6, 'A_v', '245', m => fd(m.X.m.Av, 1)], [7, 'A_i', '−0.961', m => fd(-m.X.m.Av * m.X.m.Zi / 5e3, 3)]],
  glow: { 1: ['RE', 'VEE'], 2: ['Q'], 3: ['Rpi', 'Gm'], 4: ['RE', 'Rpi'], 5: ['RC'], 6: ['Gm', 'RC'], 7: ['Gm'] },
  badge: (k, m) => [null, 'dc: I_E = (2 V − 0.7 V)/1 kΩ = 1.3 mA', 'r_e = 26 mV/1.3 mA = 20 Ω', ['วงจรสมมูล ac: เบสเป็นกราวด์ สัญญาณเข้าที่อิมิตเตอร์', 'ac equivalent: the base is ground, the signal enters at the emitter'],
    `Z_i = R_E ‖ r_e = ${kOx(m.X.m.Zi)}`, `Z_o = R_C = ${kOx(m.X.m.Zo)}`, [`A_v = αR_C/r_e = ${fd(m.X.m.Av, 1)} (ไม่กลับเฟส)`, `A_v = αR_C/r_e = ${fd(m.X.m.Av, 1)} (noninverting)`], 'A_i = −α R_E/(R_E + r_e) = −0.961'][k] ?? null,
  steps: () => [
    step(t('<b>(a) dc</b> (รูป 5.44, ทรานซิสเตอร์ pnp): เบสต่อกราวด์ วงอิมิตเตอร์ \\(V_{EE} - I_ER_E - V_{EB} = 0\\) ให้ \\(I_E\\) โดยไม่ต้องรู้ β (หน้า 4.5)', '<b>(a) dc</b> (Fig. 5.44, a pnp transistor): the base is grounded and the emitter loop \\(V_{EE} - I_ER_E - V_{EB} = 0\\) gives \\(I_E\\) without β (page 4.5)'),
      block([R`I_E &= \frac{V_{EE} - V_{EB}}{R_E} = \frac{2\ \text{V} - 0.7\ \text{V}}{1\ \text{k}\Omega} = 1.3\ \text{mA}`])),
    step(t('<b>(a) \\(r_e\\)</b>', '<b>(a) \\(r_e\\)</b>'), block([R`r_e &= \frac{26\ \text{mV}}{1.3\ \text{mA}} = \boxed{20\ \Omega}`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 5.42–5.43): เบสอยู่ที่กราวด์ สัญญาณเข้าที่อิมิตเตอร์ จึงเห็น \\(r_e\\) ตรง ๆ ไม่ถูกคูณด้วย β ฝั่งคอลเล็กเตอร์คือแหล่งกระแส \\(\\alpha I_e\\) แบบจำลอง ac ของ pnp เหมือน npn ทุกประการ', '<b>The ac equivalent circuit</b> (Figs. 5.42–5.43): the base is at ground and the signal enters at the emitter, so it sees \\(r_e\\) itself, not multiplied by β; the collector side is a current source \\(\\alpha I_e\\). A pnp has exactly the ac model of an npn.'),
      block([R`\alpha &= \frac{\beta}{\beta + 1} = 0.98`])),
    step(t('<b>(b) \\(Z_i\\)</b> (สมการ 5.46)', '<b>(b) \\(Z_i\\)</b> (Eq. 5.46)'), block([R`Z_i &= R_E \parallel r_e = 1\ \text{k}\Omega \parallel 20\ \Omega = \boxed{19.61\ \Omega} \cong r_e`]),
      t('อิมพีแดนซ์ขาเข้าต่ำมาก แหล่งสัญญาณที่มีความต้านทานภายในแม้ไม่กี่ร้อยโอห์มจะเสียสัญญาณเกือบหมด (หน้า A.4)', 'A very low input impedance: a source with even a few hundred ohms inside loses almost all of its signal (page A.4).')),
    step(t('<b>(c) \\(Z_o\\)</b> (สมการ 5.47): \\(r_o\\) ของวงจรเบสร่วมอยู่หลักเมกะโอห์ม', '<b>(c) \\(Z_o\\)</b> (Eq. 5.47): the \\(r_o\\) of a common-base stage is in the megohms'), block([R`Z_o &= R_C = \boxed{5\ \text{k}\Omega}`])),
    step(t('<b>(d) \\(A_v\\)</b> (สมการ 5.48): \\(V_o = \\alpha I_eR_C\\) และ \\(I_e = V_i/r_e\\)', '<b>(d) \\(A_v\\)</b> (Eq. 5.48): \\(V_o = \\alpha I_eR_C\\) and \\(I_e = V_i/r_e\\)'),
      block([R`A_v &= \frac{\alpha R_C}{r_e} = \frac{(0.98)(5\ \text{k}\Omega)}{20\ \Omega} = \boxed{245} \cong \frac{R_C}{r_e} = 250`]),
      t('ตำราพิมพ์ 250 เพราะปัด \\(\\alpha \\cong 1\\) ทั้งที่โจทย์ให้ α = 0.98 ค่าที่ตรงกับโจทย์คือ 245 (ภาพจำลองก็ได้ 245) อัตราขยายเป็นบวก: ขาออกไม่กลับเฟส', 'The book prints 250 because it rounds \\(\\alpha \\cong 1\\), although the problem gives α = 0.98; the value that matches the problem is 245 (so does the simulator). The gain is positive: the output is not inverted.')),
    step(t('<b>(e) \\(A_i\\)</b> (สมการ 5.49): กระแสขาออกคือ \\(\\alpha I_e\\) ส่วนกระแสขาเข้าแบ่งระหว่าง \\(R_E\\) กับ \\(r_e\\) เข้าอิมิตเตอร์ได้ \\(I_e = I_iR_E/(R_E + r_e)\\)', '<b>(e) \\(A_i\\)</b> (Eq. 5.49): the output current is \\(\\alpha I_e\\), and the input current divides between \\(R_E\\) and \\(r_e\\): \\(I_e = I_iR_E/(R_E + r_e)\\) enters the emitter'),
      block([R`A_i &= \frac{I_o}{I_i} = -\alpha\frac{R_E}{R_E + r_e} = -(0.98)\frac{1\ \text{k}\Omega}{1.02\ \text{k}\Omega} = \boxed{-0.961} \cong -\alpha \cong -1`]),
      t('ตำราตอบ \\(-\\alpha\\) = −0.98 โดยถือว่า \\(I_e \\cong I_i\\) แต่ \\(R_E\\) รับกระแสขาเข้าไป 2 % เครื่องหมายลบมาจากทิศอ้างอิงของ \\(I_o\\) ที่ชี้เข้าวงจร (รูป 5.5)', 'The book answers \\(-\\alpha\\) = −0.98, taking \\(I_e \\cong I_i\\), but \\(R_E\\) takes 2 % of the input current. The minus sign comes from the reference direction of \\(I_o\\), into the circuit (Fig. 5.5).')) ],
  ask: () => ({ fields: [num('Z<sub>i</sub> (Ω) =', 19.61, { tol: 0.15 }), num('Z<sub>o</sub> (kΩ) =', 5, { tol: 0.02 }), num2a('A<sub>v</sub> =', 245, 250, 1.5)],
    check: v => (v[2] < 0 ? t('วงจรเบสร่วมไม่กลับเฟส: A<sub>v</sub> เป็นบวก', 'A common-base stage does not invert: A<sub>v</sub> is positive.') : '') }),
  answer: () => t('(a) \\(r_e\\) = 20 Ω (b) \\(Z_i\\) = 19.61 Ω (c) \\(Z_o\\) = 5 kΩ (d) \\(A_v\\) = 245 (ตำราพิมพ์ 250) (e) \\(A_i\\) = −0.961 ≅ −1 (ตำราพิมพ์ −0.98) (Boylestad Example 5.8)', '(a) \\(r_e\\) = 20 Ω (b) \\(Z_i\\) = 19.61 Ω (c) \\(Z_o\\) = 5 kΩ (d) \\(A_v\\) = 245 (the book prints 250) (e) \\(A_i\\) = −0.961 ≅ −1 (the book prints −0.98) (Boylestad Example 5.8)') });

/* ---------------- page A.3: Example 5.9, collector feedback (Fig. 5.48) ---------------- */
const O59 = { dev: 'bjt', cfg: 'cf', VCC: 9, RC: 2.7e3, RF: 180e3, beta: 200, vs: 0.01 };
DEF.ex59 = ampDef({ o: O59, ro: 20e3, roFrom: 7, p: { re: 11.21, beta: 200 }, eqFrom: 3, title: ['Example 5.9: มือ | ภาพจำลอง (dc แบบละเอียด)', 'Example 5.9: hand | simulator (exact dc)'],
  rows: [[1, 'I_E', '2.32 mA', m => mAx(m.X.m.Q.IE)], [2, 'r_e', '11.21 Ω', m => reX(m)], [4, 'Z_i', '566.8 Ω', m => kOx(m.X.m.Zi)], [5, 'Z_o', '2.66 kΩ', m => kOx(m.X.m.Zo)],
    [6, 'A_v', '−240.86', m => num2(m.X.m.Av)], [7, 'Z_i (r_o)', '619.2 Ω', m => kOx(m.Xr.m.Zi)], [7, 'Z_o (r_o)', '2.35 kΩ', m => kOx(m.Xr.m.Zo)], [7, 'A_v (r_o)', '−209.4', m => num2(m.Xr.m.Av)]],
  glow: { 1: ['RF', 'RC'], 2: ['Q'], 3: ['RF', 'Rpi', 'Gm'], 4: ['RF', 'Rpi'], 5: ['RC', 'RF'], 6: ['Gm', 'RC'], 7: ['ro', 'RC', 'RF'] },
  badge: (k, m) => [null, 'dc: I_B = 11.53 µA, I_E = 2.32 mA', 'r_e = 26 mV/2.32 mA = 11.21 Ω', ['R_F ป้อนขาออกกลับเข้าเบส', 'R_F feeds the output back to the base'],
    [`Z_i = ${kOx(m.X.m.Zi)} (ต่ำกว่า βr_e = 2.24 kΩ)`, `Z_i = ${kOx(m.X.m.Zi)} (below βr_e = 2.24 kΩ)`], `Z_o = R_C ‖ R_F = ${kOx(m.X.m.Zo)}`, `A_v = ${num2(m.X.m.Av)}`, `r_o = 20 kΩ: A_v = ${num2(m.Xr.m.Av)}`][k] ?? null,
  steps: () => [
    step(t('<b>(a) dc</b> (หน้า 4.4): วงจรป้อนกลับคอลเล็กเตอร์ \\(I_C\\) ไหลผ่าน \\(R_C\\) พร้อม \\(I_B\\) ตำราประมาณ \\(I_C\' \\cong I_C = \\beta I_B\\)', '<b>(a) dc</b> (page 4.4): in the collector-feedback circuit \\(I_C\\) and \\(I_B\\) both flow through \\(R_C\\); the book takes \\(I_C\' \\cong I_C = \\beta I_B\\)'),
      block([R`I_B &= \frac{V_{CC} - V_{BE}}{R_F + \beta R_C} = \frac{8.3\ \text{V}}{180\ \text{k}\Omega + (200)(2.7\ \text{k}\Omega)} = 11.53\ \mu\text{A}`, R`I_E &= (\beta + 1)I_B = 2.32\ \text{mA}`]),
      t('แบบละเอียดใช้ \\((\\beta + 1)R_C\\) ได้ \\(I_E\\) = 2.308 mA (ต่างไม่ถึง 1 % ภาพจำลองใช้ค่านี้)', 'The exact loop uses \\((\\beta + 1)R_C\\) and gives \\(I_E\\) = 2.308 mA (under 1 % apart; the simulator uses this).')),
    step(t('<b>(a) \\(r_e\\)</b>', '<b>(a) \\(r_e\\)</b>'), block([R`r_e &= \frac{26\ \text{mV}}{2.32\ \text{mA}} = \boxed{11.21\ \Omega}`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 5.46–5.47): \\(R_F\\) เชื่อมขาออกกับขาเข้า ขาออกกลับเฟสและใหญ่กว่าขาเข้าหลายร้อยเท่า แรงดันคร่อม \\(R_F\\) จึงเกือบเท่า \\(|A_v|V_i\\) และดึงกระแสจากเบสมาก: อิมพีแดนซ์ขาเข้าจึงต่ำลง', '<b>The ac equivalent circuit</b> (Figs. 5.46–5.47): \\(R_F\\) connects the output to the input. The output is inverted and hundreds of times larger than the input, so the voltage across \\(R_F\\) is nearly \\(|A_v|V_i\\) and it draws a large current from the base: the input impedance drops.'),
      block([R`\beta r_e &= (200)(11.21\ \Omega) = 2.24\ \text{k}\Omega`])),
    step(t('<b>(b) \\(Z_i\\)</b> (สมการ 5.50)', '<b>(b) \\(Z_i\\)</b> (Eq. 5.50)'),
      block([R`Z_i &= \frac{r_e}{\dfrac{1}{\beta} + \dfrac{R_C}{R_C + R_F}} = \frac{11.21\ \Omega}{0.005 + 0.01478} = \boxed{566.8\ \Omega}`]),
      t('ต่ำกว่า \\(\\beta r_e\\) = 2.24 kΩ ของวงจรที่ไม่มีการป้อนกลับราวสี่เท่า ตำราปัดตัวหารเป็น 0.0198 จึงพิมพ์ 566.16 Ω', 'About four times below the \\(\\beta r_e\\) = 2.24 kΩ of the same stage without feedback. The book rounds the denominator to 0.0198 and prints 566.16 Ω.')),
    step(t('<b>(c) \\(Z_o\\)</b> (สมการ 5.51): ปิดแหล่งสัญญาณ เบสลงกราวด์ \\(R_F\\) จึงขนานกับ \\(R_C\\)', '<b>(c) \\(Z_o\\)</b> (Eq. 5.51): with the source off the base is at ground, so \\(R_F\\) is in parallel with \\(R_C\\)'),
      block([R`Z_o &= R_C \parallel R_F = 2.7\ \text{k}\Omega \parallel 180\ \text{k}\Omega = \boxed{2.66\ \text{k}\Omega}`])),
    step(t('<b>(d) \\(A_v\\)</b> (สมการ 5.52–5.53)', '<b>(d) \\(A_v\\)</b> (Eqs. 5.52–5.53)'),
      block([R`A_v &= -\left(\frac{R_F}{R_C + R_F}\right)\frac{R_C}{r_e} \cong -\frac{R_C}{r_e} = -\frac{2.7\ \text{k}\Omega}{11.21\ \Omega} = \boxed{-240.86}`]),
      t('ตำราใช้รูปประมาณ รูปเต็มของสมการ 5.52 ให้ −237.3 และภาพจำลองที่ใช้ dc แบบละเอียดได้ราว −236', 'The book uses the approximate form; the full Eq. 5.52 gives −237.3, and the simulator with the exact dc gets about −236.')),
    step(t('<b>(e) รวม \\(r_o\\) = 20 kΩ</b> (สมการ 5.54, 5.56, 5.59): \\(r_o\\) ขนานกับ \\(R_C\\)', '<b>(e) With \\(r_o\\) = 20 kΩ</b> (Eqs. 5.54, 5.56, 5.59): \\(r_o\\) is in parallel with \\(R_C\\)'),
      block([R`Z_i &= \boxed{619.2\ \Omega},\quad Z_o = r_o \parallel R_C \parallel R_F = \boxed{2.35\ \text{k}\Omega}`, R`A_v &= -\left(\frac{R_F}{R_C \parallel r_o + R_F}\right)\frac{R_C \parallel r_o}{r_e} = -(0.9870)(212.2) = \boxed{-209.4}`]),
      t('ตำราได้ 617.7 Ω และ −209.54 จากพจน์ที่ปัดแล้ว สมการ 5.54 และ 5.59 เป็นสูตรเต็มของวงจรนี้ ค่าเทียบที่ถูกของผลจาก \\(r_o\\) คือ −237.3 → −209.4 (ลดลง 12 %)', 'The book gets 617.7 Ω and −209.54 from rounded terms. Eqs. 5.54 and 5.59 are exact for this circuit; the fair comparison of the \\(r_o\\) effect is −237.3 → −209.4 (12 % less).')) ],
  ask: () => ({ fields: [num('Z<sub>i</sub> (Ω) =', 566.8, { tol: 5 }), num('Z<sub>o</sub> (kΩ) =', 2.66, { tol: 0.02 }), num2a('A<sub>v</sub> =', -240.86, -237.3, 2)],
    check: v => (near(v[0], 2242, 60) ? t('นั่นคือ βr<sub>e</sub> ไม่รวมผลของ R<sub>F</sub>', 'That is βr<sub>e</sub> without the effect of R<sub>F</sub>.') : '') }),
  answer: () => t('(a) \\(r_e\\) = 11.21 Ω (b) \\(Z_i\\) = 566.8 Ω (ตำราพิมพ์ 566.16) (c) \\(Z_o\\) = 2.66 kΩ (d) \\(A_v\\) ≅ −240.86 (รูปเต็ม −237.3) (e) \\(Z_i\\) = 619.2 Ω, \\(Z_o\\) = 2.35 kΩ, \\(A_v\\) = −209.4 (ตำราพิมพ์ 617.7 Ω, −209.54) (Boylestad Example 5.9)', '(a) \\(r_e\\) = 11.21 Ω (b) \\(Z_i\\) = 566.8 Ω (the book prints 566.16) (c) \\(Z_o\\) = 2.66 kΩ (d) \\(A_v\\) ≅ −240.86 (full form −237.3) (e) \\(Z_i\\) = 619.2 Ω, \\(Z_o\\) = 2.35 kΩ, \\(A_v\\) = −209.4 (the book prints 617.7 Ω, −209.54) (Boylestad Example 5.9)') });

/* ---------------- page A.4: Examples 5.11–5.12, Example 5.1 with R_s and R_L (Figs. 5.54c, 5.55, 5.62) ---------------- */
const O511 = { ...O51, Rs: 300, RL: 4700 };
DEF.ex511 = ampDef({ o: O511, p: { re: 10.71, beta: 100 }, eqFrom: 1, alt: { from: 5, eq: () => AC.tp([{ Zi: 1070, Zo: 3000, Av: -280.11, name: t('Example 5.1: กล่องสองพอร์ต', 'Example 5.1: a two-port box') }], { Rs: 300, RL: 4700 }) },
  title: ['Examples 5.11–5.12: มือ | ภาพจำลอง', 'Examples 5.11–5.12: hand | simulator'],
  rows: [[1, 'A_vNL', '−280.11', m => num2(m.X.m.AvNL)], [2, 'A_vL', '−170.98', m => num2(m.X.m.Av)], [3, 'A_vs', '−133.54', m => num2(m.X.m.Avs)], [4, 'Z_i', '1.07 kΩ', m => kOx(m.X.m.Zi)], [4, 'Z_o', '3 kΩ', m => kOx(m.X.m.Zo)]],
  glow: { 1: ['RL', 'Rs'], 2: ['RC', 'RL'], 3: ['Rs', 'RB', 'Rpi'], 4: ['RB', 'Rpi', 'RC'], 5: ['Ro1', 'RL'], 6: ['Rs', 'Ri1', 'Ro1', 'RL'] },
  badge: (k, m) => [null, ['วงจรสมมูลของ Example 5.1 กับ R_s และ R_L', 'the equivalent of Example 5.1 with R_s and R_L'], `A_vL = −(R_C ‖ R_L)/r_e = ${num2(m.X.m.Av)}`, `A_vs = ${num2(m.X.m.Avs)}`,
    ['Z_i, Z_o ไม่เปลี่ยน', 'Z_i, Z_o unchanged'], ['แบบจำลองสองพอร์ต: R_i, A_vNL V_i, R_o', 'two-port model: R_i, A_vNL V_i, R_o'], `A_vNL > A_vL > A_vs`][k] ?? null,
  steps: () => [
    step(t('<b>จาก Example 5.1</b> (\\(r_o = \\infty\\)): \\(r_e\\) = 10.71 Ω, \\(Z_i\\) = 1.07 kΩ, \\(Z_o\\) = 3 kΩ, \\(A_{v_{NL}}\\) = −280.11 ตอนนี้ต่อแหล่งสัญญาณที่มี \\(R_s\\) = 0.3 kΩ และโหลด \\(R_L\\) = 4.7 kΩ (รูป 5.54c) ในวงจรสมมูล (รูป 5.55) \\(R_L\\) ขนานกับ \\(R_C\\) และ \\(R_s\\) อนุกรมกับแหล่งสัญญาณ', '<b>From Example 5.1</b> (\\(r_o = \\infty\\)): \\(r_e\\) = 10.71 Ω, \\(Z_i\\) = 1.07 kΩ, \\(Z_o\\) = 3 kΩ, \\(A_{v_{NL}}\\) = −280.11. Now connect a source with \\(R_s\\) = 0.3 kΩ and a load \\(R_L\\) = 4.7 kΩ (Fig. 5.54c). In the equivalent circuit (Fig. 5.55) \\(R_L\\) is in parallel with \\(R_C\\), and \\(R_s\\) is in series with the source.'),
      block([R`R_C \parallel R_L &= 3\ \text{k}\Omega \parallel 4.7\ \text{k}\Omega = 1.831\ \text{k}\Omega`])),
    step(t('<b>\\(A_{v_L}\\)</b> (สมการ 5.73): กระแส \\(\\beta I_b\\) ตอนนี้ไหลผ่าน \\(R_C \\parallel R_L\\)', '<b>\\(A_{v_L}\\)</b> (Eq. 5.73): the current \\(\\beta I_b\\) now flows through \\(R_C \\parallel R_L\\)'),
      block([R`A_{v_L} &= \frac{V_o}{V_i} = -\frac{R_C \parallel R_L}{r_e} = -\frac{1.831\ \text{k}\Omega}{10.71\ \Omega} = \boxed{-170.98}`])),
    step(t('<b>\\(A_{v_s}\\)</b> (สมการ 5.76): \\(R_s\\) กับ \\(Z_i\\) แบ่งแรงดันของแหล่ง สัญญาณที่เข้าวงจรจริงคือ \\(V_i = Z_iV_s/(Z_i + R_s)\\)', '<b>\\(A_{v_s}\\)</b> (Eq. 5.76): \\(R_s\\) and \\(Z_i\\) divide the source voltage, so what really gets in is \\(V_i = Z_iV_s/(Z_i + R_s)\\)'),
      block([R`A_{v_s} &= \frac{V_o}{V_s} = \frac{Z_i}{Z_i + R_s}A_{v_L} = \frac{1.07\ \text{k}\Omega}{1.37\ \text{k}\Omega}(-170.98) = \boxed{-133.54}`])),
    step(t('<b>\\(Z_i\\) และ \\(Z_o\\) ไม่เปลี่ยน</b>: \\(Z_i = R_B \\parallel \\beta r_e\\) ไม่มี \\(R_L\\) อยู่ในนั้น และ \\(Z_o = R_C\\) ไม่มี \\(R_s\\) ตัวเก็บประจุคัปปลิงยังทำให้จุดทำงานไม่ขึ้นกับ \\(R_s\\), \\(R_L\\)', '<b>\\(Z_i\\) and \\(Z_o\\) do not change</b>: \\(Z_i = R_B \\parallel \\beta r_e\\) contains no \\(R_L\\) and \\(Z_o = R_C\\) contains no \\(R_s\\); the coupling capacitors also keep the operating point independent of \\(R_s\\) and \\(R_L\\)'),
      block([R`Z_i &= 1.07\ \text{k}\Omega,\quad Z_o = 3\ \text{k}\Omega`]), t('สำหรับตัวตามแรงดันและวงจรป้อนกลับ ข้อนี้ไม่จริง: \\(Z_i\\) ขึ้นกับ \\(R_L\\) และ \\(Z_o\\) ขึ้นกับ \\(R_s\\) (ส่วน A ของหน้า A.3)', 'For the follower and the feedback stage this is not true: \\(Z_i\\) depends on \\(R_L\\) and \\(Z_o\\) on \\(R_s\\) (section A of page A.3).')),
    step(t('<b>Example 5.12: แบบจำลองสองพอร์ต</b> (หัวข้อ 5.15, รูป 5.62): มองวงจรขยายเป็นกล่องที่มีแค่สามตัวเลข: \\(R_i = Z_i\\) ที่ขาเข้า และแหล่งแรงดัน \\(A_{v_{NL}}V_i\\) อนุกรมกับ \\(R_o = Z_o\\) ที่ขาออก แล้ว \\(R_o\\) กับ \\(R_L\\) แบ่งแรงดัน (สมการ 5.89)', '<b>Example 5.12: the two-port model</b> (section 5.15, Fig. 5.62): treat the amplifier as a box with just three numbers: \\(R_i = Z_i\\) at the input, and a voltage source \\(A_{v_{NL}}V_i\\) in series with \\(R_o = Z_o\\) at the output; then \\(R_o\\) and \\(R_L\\) divide the voltage (Eq. 5.89)'),
      block([R`A_{v_L} &= \frac{R_L}{R_L + R_o}A_{v_{NL}} = \frac{4.7\ \text{k}\Omega}{7.7\ \text{k}\Omega}(-280.11) = \boxed{-170.98}`])),
    step(t('<b>\\(A_{v_s}\\) แบบสองพอร์ต</b> (สมการ 5.96): ตัวแบ่งแรงดันทั้งสองฝั่งคูณกัน ได้ผลเท่าข้อ 3', '<b>\\(A_{v_s}\\) the two-port way</b> (Eq. 5.96): the two dividers multiply, giving the result of step 3'),
      block([R`A_{v_s} &= \frac{R_i}{R_i + R_s}\cdot\frac{R_L}{R_L + R_o}\cdot A_{v_{NL}} = (0.7810)(0.6104)(-280.11) = \boxed{-133.54}`]),
      t('ตำราพิมพ์ −133.45 จากตัวคูณที่ปัดแล้ว ลำดับขนาดคือ \\(|A_{v_{NL}}| > |A_{v_L}| > |A_{v_s}|\\) เสมอ (ส่วน A)', 'The book prints −133.45 from rounded factors. The order is always \\(|A_{v_{NL}}| > |A_{v_L}| > |A_{v_s}|\\) (section A).')) ],
  ask: () => ({ fields: [num('A<sub>vL</sub> =', -170.98, { tol: 1 }), num2a('A<sub>vs</sub> =', -133.54, -133.45, 0.9)],
    check: v => (v[0] > 0 || v[1] > 0 ? t('อิมิตเตอร์ร่วม: อัตราขยายติดลบ', 'A common emitter: the gains are negative.') : near(v[0], -280.11, 3) ? t('นั่นคือ A<sub>vNL</sub> ยังไม่รวม R<sub>L</sub>', 'That is A<sub>vNL</sub>, without R<sub>L</sub>.') : '') }),
  answer: () => t('\\(A_{v_L}\\) = −170.98, \\(A_{v_s}\\) = −133.54, \\(Z_i\\) = 1.07 kΩ, \\(Z_o\\) = 3 kΩ ไม่ว่าจะคิดจากวงจรสมมูลหรือแบบจำลองสองพอร์ต (Boylestad Examples 5.11–5.12)', '\\(A_{v_L}\\) = −170.98, \\(A_{v_s}\\) = −133.54, \\(Z_i\\) = 1.07 kΩ, \\(Z_o\\) = 3 kΩ, from the equivalent circuit or from the two-port model alike (Boylestad Examples 5.11–5.12)') });

/* ---------------- page A.4: Example 5.14, an emitter follower before a common-base stage (Fig. 5.68), as two-port blocks ---------------- */
let M514 = null;
const mk514 = () => (M514 && M514.lang === MC.lang) ? M514 : (M514 = (() => { const b = [{ Zi: 10e3, Zo: 12, Av: 1, name: t('ภาค 1: ตัวตามแรงดัน', 'stage 1: emitter follower') }, { Zi: 26, Zo: 5.1e3, Av: 240, name: t('ภาค 2: เบสร่วม', 'stage 2: common base') }];
  const sp = AC.tp(b, { Rs: 1e3, RL: 8.2e3 }), sp2 = AC.tp([b[1]], { Rs: 1e3, RL: 8.2e3 }), c = AC.solve(sp), c2 = AC.solve(sp2), r = (cc, a, bb) => Cx.abs(Cx.div(cc.V(a), cc.V(bb)));
  return { lang: MC.lang, sp, sp2, c, c2, Av1: r(c, 'o1', 'a1'), Av2: r(c, 'o2', 'a2'), AvT: r(c, 'o2', 'a1'), Avs: r(c, 'o2', 's'), Avs2: r(c2, 'o1', 's') }; })());
DEF.ex514 = { ...LAY, solvedAt: 1, probe: mk514,
  spec: k => (k >= 5 ? mk514().sp2 : mk514().sp),
  after: (v, k) => { const m = mk514(); AC.boxes(v, (k >= 5 ? m.sp2 : m.sp).boxes); },
  glow: k => ({ 1: ['Ro1', 'Ri2'], 2: ['Ro2', 'RL'], 3: ['Rs', 'Ri1'], 4: ['Ri1', 'RL'], 5: ['Rs', 'Ri1'] })[k] || null,
  badge: k => { const m = mk514(); return [null, bdg(`A_v1 = ${fd(m.Av1, 3)}`), bdg(`A_v2 = ${fd(m.Av2, 2)}`), bdg(`A_vT = ${fd(m.AvT, 1)}, A_vs = ${fd(m.Avs, 1)}`), bdg(`A_iT = ${fd(-m.AvT * 10e3 / 8.2e3, 1)}`), bdg(t(`ไม่มีตัวตามแรงดัน: A_vs = ${fd(m.Avs2, 2)}`, `without the follower: A_vs = ${fd(m.Avs2, 2)}`), null, false)][k] ?? null; },
  side: (ctx, b, bd, k) => { const m = mk514(), rows = [[1, 'A_v1', '0.684', fd(m.Av1, 3)], [2, 'A_v2', '147.97', fd(m.Av2, 2)], [3, 'A_vT', '101.2', fd(m.AvT, 1)], [3, 'A_vs', '92.0', fd(m.Avs, 1)], [4, 'A_iT', '−123.5', num2(-m.AvT * 10e3 / 8.2e3, 1)], [5, t('A_vs ไม่มี EF', 'A_vs, no EF'), '3.75', fd(m.Avs2, 2)]];
    tbl(ctx, b, bd, rows.filter(r => k >= r[0]).map(r => r.slice(1)), ['Example 5.14: มือ | ภาพจำลอง', 'Example 5.14: hand | simulator']); },
  waves: [{ draw: (ctx, b, bd, k) => { const m = mk514(), c = k >= 5 ? m.c2 : m.c, out = k >= 5 ? 'o1' : 'o2'; AC.scope(ctx, b, { chans: [{ label: 'v_s', z: c.V('s'), color: AMBER }, { label: 'v_o', z: c.V(out), color: CYAN }], w: c.w, now: bd.clk.ph, short: bd.short, title: bd.short ? '' : t('v_s (ช่อง 1) และ v_o (ช่อง 2)', 'v_s (channel 1) and v_o (channel 2)') }); } }],
  steps: () => [
    step(t('<b>(a) อัตราขยายของภาค 1 เมื่อมีโหลด</b> (สมการ 5.89): โหลดของภาค 1 คือ \\(Z_{i2}\\) = 26 Ω ของภาค 2 ซึ่งต่ำมาก แต่ \\(Z_{o1}\\) = 12 Ω ต่ำกว่า', '<b>(a) The loaded gain of stage 1</b> (Eq. 5.89): the load of stage 1 is the \\(Z_{i2}\\) = 26 Ω of stage 2, which is very low, but \\(Z_{o1}\\) = 12 Ω is lower still'),
      block([R`A_{v_1} &= \frac{Z_{i_2}}{Z_{i_2} + Z_{o_1}}A_{v_{NL_1}} = \frac{26\ \Omega}{26\ \Omega + 12\ \Omega}(1) = \boxed{0.684}`])),
    step(t('<b>(a) อัตราขยายของภาค 2 เมื่อมีโหลด</b>', '<b>(a) The loaded gain of stage 2</b>'), block([R`A_{v_2} &= \frac{R_L}{R_L + Z_{o_2}}A_{v_{NL_2}} = \frac{8.2\ \text{k}\Omega}{13.3\ \text{k}\Omega}(240) = \boxed{147.97}`])),
    step(t('<b>(b) อัตราขยายรวม</b> (สมการ 5.99): อัตราขยายที่มีโหลดของแต่ละภาคคูณกัน แล้วคูณตัวแบ่งแรงดันที่ขาเข้า', '<b>(b) The overall gain</b> (Eq. 5.99): the loaded gains of the stages multiply, then the input divider'),
      block([R`A_{v_T} &= A_{v_1}A_{v_2} = (0.684)(147.97) = \boxed{101.2}`, R`A_{v_s} &= \frac{Z_{i_1}}{Z_{i_1} + R_s}A_{v_T} = \frac{10\ \text{k}\Omega}{11\ \text{k}\Omega}(101.2) = \boxed{92.0}`])),
    step(t('<b>(c) อัตราขยายกระแสรวม</b> (สมการ 5.100)', '<b>(c) The overall current gain</b> (Eq. 5.100)'), block([R`A_{i_T} &= -A_{v_T}\frac{Z_{i_1}}{R_L} = -(101.24)\frac{10\ \text{k}\Omega}{8.2\ \text{k}\Omega} = \boxed{-123.5}`])),
    step(t('<b>(d) ถอดตัวตามแรงดันออก</b>: แหล่งสัญญาณ \\(R_s\\) = 1 kΩ ต้องขับ \\(Z_i\\) = 26 Ω ของวงจรเบสร่วมเอง สัญญาณเข้าได้นิดเดียว', '<b>(d) Remove the follower</b>: the source with \\(R_s\\) = 1 kΩ now has to drive the 26 Ω \\(Z_i\\) of the common base itself, and very little gets in'),
      block([R`\frac{V_i}{V_s} &= \frac{26\ \Omega}{26\ \Omega + 1\ \text{k}\Omega} = 0.0253,\quad A_{v_s} = (0.0253)(147.97) = \boxed{3.75}`]),
      t('น้อยกว่ากรณีมีตัวตามแรงดัน 24.5 เท่า (ตำราปัด 0.0253 เป็น 0.025 จึงพิมพ์ 3.7 และ "ราว 25 เท่า"): ตัวตามแรงดันไม่ได้ขยายแรงดันเลย แต่ช่วยให้สัญญาณเข้าภาคถัดไปได้', '24.5 times less than with the follower (the book rounds 0.0253 to 0.025 and prints 3.7 and "about 25 times"): the follower adds no voltage gain at all, but it lets the signal into the next stage.')) ],
  ask: () => ({ fields: [num('A<sub>v1</sub> =', 0.684, { tol: 0.005 }), num('A<sub>vT</sub> =', 101.2, { tol: 0.6 }), num2a('A<sub>vs</sub> ไม่มี EF =', 3.75, 3.7, 0.04)],
    check: v => (near(v[0], 1, 0.01) ? t('ภาค 1 มีโหลด 26 Ω: A<sub>v1</sub> ไม่ใช่ 1', 'Stage 1 is loaded by 26 Ω: A<sub>v1</sub> is not 1.') : '') }),
  answer: () => t('(a) \\(A_{v_1}\\) = 0.684, \\(A_{v_2}\\) = 147.97 (b) \\(A_{v_T}\\) = 101.2, \\(A_{v_s}\\) = 92.0 (c) \\(A_{i_T}\\) = −123.5 (d) ไม่มีตัวตามแรงดัน \\(A_{v_s}\\) = 3.75 (Boylestad Example 5.14)', '(a) \\(A_{v_1}\\) = 0.684, \\(A_{v_2}\\) = 147.97 (b) \\(A_{v_T}\\) = 101.2, \\(A_{v_s}\\) = 92.0 (c) \\(A_{i_T}\\) = −123.5 (d) without the follower \\(A_{v_s}\\) = 3.75 (Boylestad Example 5.14)') };

/* ---------------- page A.4: Example 5.15, two RC-coupled voltage-divider stages (Fig. 5.69) ---------------- */
const O515 = { VCC: 20, R1: 15e3, R2: 4.7e3, RC: 2.2e3, RE: 1e3, CEv: 20e-6, beta: 200, vs: 25e-6 };
let M515 = null;
const mk515 = () => M515 || (M515 = (() => { const sp = AC.tune(AC.amp2(O515)), spL = AC.tune(AC.amp2({ ...O515, RL: 4.7e3 })), m = AC.measure(sp), mL = AC.measure(spL), z = AC.dcOf(sp);
  const Q1 = z.Q('Q1'), Q2 = z.Q('Q2'), r = (cc, a, b) => Cx.div(cc.V(a), cc.V(b)), sg = q => (q.re < 0 ? -1 : 1) * Cx.abs(q), par = (...x) => 1 / x.reduce((a, b) => a + 1 / b, 0);
  return { sp, spL, m, mL, dc: { ...sp, mode: 'dc', dcFirst: false }, Q1, Q2, Av1: sg(r(m.c, 'c1', 'i')), Av2: sg(r(m.c, 'o', 'k3')), AvT: sg(r(m.c, 'o', 'i')), AvTL: sg(r(mL.c, 'o', 'i')), Zi2: par(15e3, 4.7e3, 200 * 0.026 / Q2.IE) }; })());
DEF.ex515 = { ...LAY, cktAspM: 0.36, cktAspN: 0.42, solvedAt: 1, probe: mk515,
  spec: k => { const m = mk515(); return k <= 2 ? m.dc : k >= 7 ? m.spL : m.sp; },
  after: (v, k) => { const m = mk515(); AC.ampTags(v, k >= 7 ? m.spL : m.sp); },
  glow: k => ({ 1: ['R1_1', 'R2_1', 'RE_1', 'R1_2', 'R2_2', 'RE_2'], 2: ['Q1', 'Q2'], 3: ['R1_2', 'R2_2', 'Q2'], 4: ['RC_1', 'R1_2', 'R2_2'], 5: ['RC_2'], 6: ['Q1', 'Q2'], 7: ['RL'], 8: ['R1_1', 'R2_1', 'RC_2'] })[k] || null,
  badge: k => { const m = mk515(); return [null, bdg(t('dc เหมือนกันทั้งสองภาค', 'dc: both stages alike')), bdg(`r_e = ${fd(0.026 / m.Q1.IE, 2)} Ω (${t('ภาพจำลอง', 'simulator')})`), bdg(`Z_i2 = ${kOx(m.Zi2)}`), bdg(`A_v1 = ${num2(m.Av1, 1)}`), bdg(`A_v2 = ${num2(m.Av2, 1)}`),
    bdg(`A_vT = ${fd(m.AvT, 0)}: v_o = ${fd(m.AvT * 25e-3, 1)} mV`), bdg(`R_L = 4.7 kΩ: A_vT = ${fd(m.AvTL, 0)}`), bdg(`Z_i1 = ${kOx(m.m.Zi)}, Z_o2 = ${kOx(m.m.Zo)}`)][k] ?? null; },
  side: (ctx, b, bd, k) => { const m = mk515(), rows = [[1, 'I_E', '4.1 mA', mAx(m.Q1.IE)], [2, 'r_e', '6.34 Ω', `${fd(0.026 / m.Q1.IE, 2)} Ω`], [3, 'Z_i2', '0.937 kΩ', kOx(m.Zi2)], [4, 'A_v1', '−103.6', num2(m.Av1, 1)], [5, 'A_v2', '−347', num2(m.Av2, 1)],
      [6, 'A_vT', '35 900', grp(m.AvT)], [7, 'A_vT (R_L)', '24 500', grp(m.AvTL)], [8, 'Z_i1', '0.94 kΩ', kOx(m.m.Zi)], [8, 'Z_o2', '2.2 kΩ', kOx(m.m.Zo)]];
    tbl(ctx, b, bd, rows.filter(r => k >= r[0]).map(r => r.slice(1)), ['Example 5.15: ตำรา (dc ประมาณ) | ภาพจำลอง', 'Example 5.15: book (approximate dc) | simulator']); },
  waves: [{ draw: (ctx, b, bd, k) => { const m = mk515(), mm = k >= 7 ? m.mL : m.m; AC.scope(ctx, b, scopeOf(mm, bd, bd.short ? '' : t('v_i = 25 µV (ช่อง 1) กับ v_o (ช่อง 2): สเกลต่างกันหลายหมื่นเท่า', 'v_i = 25 µV (channel 1) and v_o (channel 2): scales tens of thousands apart'))); } }],
  steps: () => [
    step(t('<b>dc</b> (วิธีประมาณ ทั้งสองภาคเหมือนกัน): \\(\\beta R_E\\) = 200 kΩ ≥ \\(10R_2\\) = 47 kΩ ตัวเก็บประจุคัปปลิงแยกจุดทำงานของสองภาคออกจากกัน', '<b>dc</b> (approximate method, both stages alike): \\(\\beta R_E\\) = 200 kΩ ≥ \\(10R_2\\) = 47 kΩ, and the coupling capacitor keeps the two operating points apart'),
      block([R`V_B &= \frac{(4.7\ \text{k}\Omega)(20\ \text{V})}{19.7\ \text{k}\Omega} = 4.8\ \text{V},\ V_E = 4.1\ \text{V},\ I_E = \frac{4.1\ \text{V}}{1\ \text{k}\Omega} = 4.1\ \text{mA}`]),
      t('ตำราปัด \\(V_B\\) = 4.77 V เป็น 4.8 V วิธีละเอียดได้ \\(I_E\\) = 4.00 mA (ภาพจำลอง)', 'The book rounds \\(V_B\\) = 4.77 V to 4.8 V; the exact method gives \\(I_E\\) = 4.00 mA (simulator).')),
    step(t('<b>\\(r_e\\)</b>', '<b>\\(r_e\\)</b>'), block([R`r_e &= \frac{26\ \text{mV}}{4.1\ \text{mA}} = \boxed{6.34\ \Omega},\quad \beta r_e = 1.268\ \text{k}\Omega`])),
    step(t('<b>โหลดของภาค 1</b>: ภาค 2 คือโหลดของภาค 1 \\(Z_{i_2}\\) ขนานกับ \\(R_{C_1}\\) ที่คอลเล็กเตอร์ของ \\(Q_1\\)', '<b>The load of stage 1</b>: stage 2 is the load of stage 1, its \\(Z_{i_2}\\) in parallel with \\(R_{C_1}\\) at the collector of \\(Q_1\\)'),
      block([R`Z_{i_2} &= R_1 \parallel R_2 \parallel \beta r_e = 15\ \text{k}\Omega \parallel 4.7\ \text{k}\Omega \parallel 1.268\ \text{k}\Omega = \boxed{0.937\ \text{k}\Omega}`])),
    step(t('<b>\\(A_{v_1}\\)</b>', '<b>\\(A_{v_1}\\)</b>'), block([R`A_{v_1} &= -\frac{R_C \parallel Z_{i_2}}{r_e} = -\frac{656.8\ \Omega}{6.34\ \Omega} = \boxed{-103.6}`]),
      t('ตำราพิมพ์ 659.2 Ω และ −104 ที่ถูกคือ 656.8 Ω และ −103.6 ภาคแรกให้อัตราขยายแค่ราวหนึ่งในสามของภาคที่สอง เพราะ \\(Z_{i_2}\\) ต่ำ', 'The book prints 659.2 Ω and −104; 656.8 Ω and −103.6 are right. Stage 1 gives only about a third of stage 2\'s gain because \\(Z_{i_2}\\) is low.')),
    step(t('<b>\\(A_{v_2}\\)</b>: ภาค 2 ไม่มีโหลด', '<b>\\(A_{v_2}\\)</b>: stage 2 has no load'), block([R`A_{v_2} &= -\frac{R_C}{r_e} = -\frac{2.2\ \text{k}\Omega}{6.34\ \Omega} = \boxed{-347}`])),
    step(t('<b>(a) อัตราขยายรวมและแรงดันขาออก</b>: เครื่องหมายลบสองตัวคูณกันเป็นบวก ขาออกจึงไม่กลับเฟส', '<b>(a) The overall gain and the output voltage</b>: two minus signs multiply to a plus, so the output is not inverted'),
      block([R`A_{v_T} &= A_{v_1}A_{v_2} = (-103.6)(-347) \cong \boxed{35.9 \times 10^3}`, R`V_o &= A_{v_T}V_i = (35.9 \times 10^3)(25\ \mu\text{V}) \cong \boxed{0.90\ \text{V}}`]),
      t('ตำราใช้ \\(A_{v_1}\\) = −104 ที่ผิด จึงพิมพ์ 36.1 × 10³ และ 902.5 mV ภาพจำลองที่ใช้ dc แบบละเอียด (\\(r_e\\) = 6.50 Ω แทน 6.34 Ω) ได้ราว 34.6 × 10³: อัตราขยายสองภาคไวต่อ \\(r_e\\) เป็นกำลังสอง', 'The book carries its wrong \\(A_{v_1}\\) = −104 and prints 36.1 × 10³ and 902.5 mV. The simulator with the exact dc (\\(r_e\\) = 6.50 Ω instead of 6.34 Ω) gets about 34.6 × 10³: a two-stage gain goes with the square of \\(r_e\\).')),
    step(t('<b>(b) ต่อโหลด \\(R_L\\) = 4.7 kΩ</b> (สมการ 5.89): ภาค 1 ไม่เห็นโหลดนี้ จึงคูณอัตราขยายรวมด้วยตัวแบ่งแรงดันที่ขาออกได้เลย', '<b>(b) Connect \\(R_L\\) = 4.7 kΩ</b> (Eq. 5.89): stage 1 does not see this load, so the overall gain can simply be multiplied by the output divider'),
      block([R`A_{v_T} &= \frac{R_L}{R_L + R_C}(35.9 \times 10^3) = \frac{4.7}{6.9}(35.9 \times 10^3) = \boxed{24.5 \times 10^3},\quad V_o = 612\ \text{mV}`]),
      t('ตำราพิมพ์ "10-kΩ load" ในข้อความแต่คำนวณด้วย 4.7 kΩ และได้ 24.6 × 10³ (615 mV) เพราะต่อจาก 36.1 × 10³', 'The book\'s text says "10-kΩ load" but computes with 4.7 kΩ, and gets 24.6 × 10³ (615 mV) because it starts from 36.1 × 10³.')),
    step(t('<b>(c) \\(Z_{i_1}\\) และ \\(Z_{o_2}\\)</b>: อิมพีแดนซ์ขาเข้าเป็นของภาคแรก ขาออกเป็นของภาคสุดท้าย', '<b>(c) \\(Z_{i_1}\\) and \\(Z_{o_2}\\)</b>: the input impedance is the first stage\'s, the output impedance the last stage\'s'),
      block([R`Z_{i_1} &= R_1 \parallel R_2 \parallel \beta r_e = \boxed{0.94\ \text{k}\Omega},\quad Z_{o_2} = R_C = \boxed{2.2\ \text{k}\Omega}`])) ],
  ask: () => ({ fields: [num2a('A<sub>v1</sub> =', -103.6, -104, 1.2), num('A<sub>v2</sub> =', -347, { tol: 3 }), num2a('A<sub>vT</sub> (× 10³) =', 35.9, 34.6, 0.5)],
    check: v => (v[2] < 0 ? t('สองภาคกลับเฟสสองครั้ง: A<sub>vT</sub> เป็นบวก', 'Two inverting stages: A<sub>vT</sub> is positive.') : near(v[0], -347, 5) ? t('ภาค 1 มีโหลดคือ Z<sub>i2</sub> ขนานกับ R<sub>C</sub>', 'Stage 1 is loaded: Z<sub>i2</sub> in parallel with R<sub>C</sub>.') : '') }),
  answer: () => t('\\(r_e\\) = 6.34 Ω, \\(A_{v_1}\\) = −103.6, \\(A_{v_2}\\) = −347, \\(A_{v_T}\\) ≅ 35.9 × 10³ (\\(V_o\\) ≅ 0.90 V) · มี \\(R_L\\): 24.5 × 10³ (612 mV) · \\(Z_{i_1}\\) = 0.94 kΩ, \\(Z_{o_2}\\) = 2.2 kΩ (Boylestad Example 5.15; dc แบบละเอียด: 34.6 × 10³)', '\\(r_e\\) = 6.34 Ω, \\(A_{v_1}\\) = −103.6, \\(A_{v_2}\\) = −347, \\(A_{v_T}\\) ≅ 35.9 × 10³ (\\(V_o\\) ≅ 0.90 V) · with \\(R_L\\): 24.5 × 10³ (612 mV) · \\(Z_{i_1}\\) = 0.94 kΩ, \\(Z_{o_2}\\) = 2.2 kΩ (Boylestad Example 5.15; exact dc: 34.6 × 10³)') };

/* =====================================================================================================================
   supplement B, page B.1: g_m and r_d */
const FETk = CK.FET, shk = (idss, vp, v) => FETk.id(idss, vp, v) * 1e3;   // Shockley in mA
/* the transfer curve with the tangent at Q and the chord through Q ± h (a parabola: the chord centred on Q is exactly as steep as the tangent) */
AC.gmPlot = (ctx, b, bd, o) => { const { idss, vp } = o, vq = o.vgs, iq = shk(idss, vp, vq), gm = 2 * idss / Math.abs(vp) * (1 - vq / vp) * 1e3, h = o.h ?? 0.5, sh = bd.short;
  const lines = [{ a: [vq - 1.2, iq - 1.2 * gm], b: [vq + 1.2, iq + 1.2 * gm], color: AMBER, w: 2.2, dash: [7, 5], label: sh ? '' : t('เส้นสัมผัส', 'tangent'), at: 0.9 }];
  if (o.chord !== false && vq - h >= vp && vq + h <= 0) lines.push({ a: [vq - h, shk(idss, vp, vq - h)], b: [vq + h, shk(idss, vp, vq + h)], color: PURPLE, w: 2.6 });
  const g = CH5.tPlot(ctx, b, bd, { dev: { idss, vp }, lines, pts: [...(o.pts || []), { v: vq, i: iq, color: PINK, label: sh ? '' : `g_m = ${fd(gm, 2)} mS`, side: vq > vp / 2 ? -1 : 1, dy: 18 }],
    guides: [{ v: vq, i: iq }], title: o.title ?? (sh ? t('g_m = ความชันที่ Q', 'g_m = slope at Q') : t('g_m คือความชันของเส้นโค้งที่จุดทำงาน (เส้นสัมผัสเหลือง คอร์ดม่วง)', 'g_m is the slope of the curve at the operating point (amber tangent, purple chord)')) });
  return { g, gm, iq }; };
/* g_m against V_GS: the straight line of Eq. 8.6 from 0 at V_P to g_m0 at 0 V */
AC.gmLine = (ctx, b, bd, o) => { const { idss, vp } = o, gm0 = 2 * idss / Math.abs(vp) * 1e3, f = v => Math.max(0, gm0 * (1 - v / vp)), top = Math.ceil(gm0 * 1.15);
  OP.plot(ctx, b, { x: [Math.floor(vp), 0], y: [0, top], xt: Array.from({ length: -Math.floor(vp) }, (_, k) => Math.floor(vp) + k), yt: Array.from({ length: top }, (_, k) => k + 1), xf: v => fd(v, 0), xl: 'V_GS (V)', yl: 'g_m (mS)', ml: 34,
    curves: [{ f, color: C.curve, w: 3 }], hl: [{ y: gm0, color: 'rgba(232,236,247,.35)', label: bd.short ? '' : `g_m0 = ${fd(gm0, 2)} mS` }],
    pts: (o.pts || []).concat(o.vgs !== undefined ? [{ x: o.vgs, y: f(o.vgs), color: PINK, r: 6 }] : []),
    title: bd.short ? 'g_m(V_GS)' : t('g_m ลดลงเป็นเส้นตรงจาก g_m0 ที่ 0 V ถึงศูนย์ที่ V_P', 'g_m falls in a straight line from g_m0 at 0 V to zero at V_P') }); };
/* the drain characteristics with a slope (λ): curves for several V_GS, the operating point and its tangent, r_d = 1/slope */
AC.rdPlot = (ctx, b, bd, o) => { const dev = { idss: o.idss, vp: o.vp, lam: o.lam }, vgsList = o.list || [0, -1, -2, -3], vmax = o.vmax ?? 20, sh = bd.short, I = (vg, vd) => FETk.iv(dev, vg, vd).i * 1e3;
  const imax = Math.ceil(I(0, vmax) * 1.12), q = FETk.iv(dev, o.vgs, o.vds), iq = q.i * 1e3, sl = q.gds * 1e3, rd = 1 / q.gds;
  OP.plot(ctx, b, { x: [0, vmax], y: [0, imax], xt: [5, 10, 15, 20].filter(v => v <= vmax), yt: Array.from({ length: imax }, (_, k) => k + 1).filter(k => imax <= 10 || k % 2 === 0), xf: v => fd(v, 0), xl: 'V_DS (V)', yl: 'I_D (mA)', ml: 34,
    curves: vgsList.map(vg => ({ f: vd => I(vg, vd), color: Math.abs(vg - o.vgs) < 1e-9 ? C.curve : 'rgba(79,179,255,.45)', w: Math.abs(vg - o.vgs) < 1e-9 ? 3 : 2, label: sh ? '' : `V_GS = ${fd(vg, 0).replace('-', '−')} V`, labelAt: vmax * 0.78 }))
      .concat(vgsList.includes(o.vgs) ? [] : [{ f: vd => I(o.vgs, vd), color: C.curve, w: 3 }]).concat([{ f: vd => iq + (vd - o.vds) * sl, color: AMBER, w: 2, dash: [7, 5] }]),
    pts: [{ x: o.vds, y: iq, color: PINK, r: 6, label: sh ? '' : `r_d = ${kOx(rd)}`, side: o.vds > vmax * 0.6 ? -1 : 1, dy: 18 }],
    title: sh ? t('r_d = 1/ความชัน', 'r_d = 1/slope') : t('r_d คือส่วนกลับของความชันของเส้นเดรน (V_GS คงที่)', 'r_d is the inverse slope of a drain curve (V_GS held constant)') });
  return { rd, iq }; };
/* the circuit beside these pictures: the JFET with its gate held at V_GS by a battery and a small ac source, the drain fed through 1 kΩ */
const gmSpec = (idss, vp, vgs) => AC.amp({ dev: 'jfet', cfg: 'fixed', VDD: 15, RG: 1e6, VGG: -vgs, RD: 1000, idss, vp, vs: 0.1, C1: 10e-6, C2: 10e-6, qText: '' });
AC.EX.gm = (ids = {}) => { const ui = MC.ui;
  return OP.explorer({ ids, init: { vgs: -1.5, idss: 8, vp: -4 }, title: t('อุปกรณ์และจุดทำงาน', 'The device and its operating point'), layout: { cktAspM: 0.44, rowAsp: 0.7, rowMin: 270, cktAspN: 0.56 },
    controls: (p, S, build) => {
      ui.slider(p, { id: (ids.pre || 'a') + 'V', label: 'V_GS', min: -8, max: 0, step: 0.05, value: S.vgs, fmt: v => `${fd(v, 2).replace('-', '−')} V`, oninput: v => { S.vgs = Math.max(v, S.vp + 0.05); build(); } });
      ui.slider(p, { id: (ids.pre || 'a') + 'I', label: 'I_DSS', min: 2, max: 16, step: 0.5, value: S.idss, fmt: v => `${fd(v, 1)} mA`, oninput: v => { S.idss = v; build(); } });
      ui.slider(p, { id: (ids.pre || 'a') + 'P', label: 'V_P', min: -8, max: -2, step: 0.5, value: S.vp, fmt: v => `${fd(v, 1).replace('-', '−')} V`, oninput: v => { S.vp = v; S.vgs = Math.max(S.vgs, v + 0.05); build(); } }); },
    spec: S => { const sp = gmSpec(S.idss * 1e-3, S.vp, S.vgs); S.sp = sp; S.m = AC.measure(sp); return sp; },
    after: (v, c, S) => AC.ampTags(v, S.sp, { inText: 'v_gs', outText: 'v_o' }),
    side: (ctx, b, bd, c, S) => { AC.gmPlot(ctx, b, bd, { idss: S.idss * 1e-3, vp: S.vp, vgs: S.vgs }); },
    waves: [(ctx, b, bd, c, S) => AC.gmLine(ctx, b, bd, { idss: S.idss * 1e-3, vp: S.vp, vgs: S.vgs })],
    badge: (c, S) => { const gm = 2 * S.idss / Math.abs(S.vp) * (1 - S.vgs / S.vp); return [[`g_m = ${fd(gm, 3)} mS ที่ V_GS = ${fd(S.vgs, 2)} V`, `g_m = ${fd(gm, 3)} mS at V_GS = ${fd(S.vgs, 2)} V`], 'ok']; },
    rows: (c, S) => { const gm0 = 2 * S.idss / Math.abs(S.vp), gm = gm0 * (1 - S.vgs / S.vp), id = shk(S.idss * 1e-3, S.vp, S.vgs), gsim = Cx.abs(c.I('RC')) / Cx.abs(Cx.sub(c.V('b'), c.V('e'))) * 1e3;
      return [['I_D', `${fd(id, 3)} mA`], ['g_m0 = 2I_DSS/|V_P|', `${fd(gm0, 3)} mS`], ['g_m = g_m0(1 − V_GS/V_P)', `${fd(gm, 3)} mS`], ['g_m0 √(I_D/I_DSS)', `${fd(gm0 * Math.sqrt(id / S.idss), 3)} mS`], [t('ภาพจำลอง i_d/v_gs', 'simulator i_d/v_gs'), `${fd(gsim, 3)} mS`]]; },
    text: (c, S) => { const gm0 = 2 * S.idss / Math.abs(S.vp), gm = gm0 * (1 - S.vgs / S.vp), id = shk(S.idss * 1e-3, S.vp, S.vgs);
      return t(`ที่ \\(V_{GS}\\) = ${fd(S.vgs, 2)} V กระแส \\(I_D\\) = ${fd(id, 2)} mA และความชัน \\(g_m\\) = ${fd(gm, 2)} mS: แรงดันเกตแกว่ง 1 mV ทำให้กระแสเดรนแกว่ง ${fd(gm, 2)} µA (จุดในวงจรคือกระแสสัญญาณนี้) เลื่อน \\(V_{GS}\\) เข้าใกล้ศูนย์ \\(g_m\\) เพิ่มจนถึง \\(g_{m0}\\) = ${fd(gm0, 2)} mS เลื่อนเข้าใกล้ \\(V_P\\) \\(g_m\\) ลดลงเป็นศูนย์`,
        `At \\(V_{GS}\\) = ${fd(S.vgs, 2)} V the current is \\(I_D\\) = ${fd(id, 2)} mA and the slope \\(g_m\\) = ${fd(gm, 2)} mS: a 1 mV swing of the gate gives a ${fd(gm, 2)} µA swing of the drain current (the dots in the circuit are this signal current). Move \\(V_{GS}\\) towards zero and \\(g_m\\) rises to \\(g_{m0}\\) = ${fd(gm0, 2)} mS; towards \\(V_P\\) it falls to zero.`); } }); };
/* page B.1, section B: r_d from the drain curves (λ = 0.005 V⁻¹: r_d = 25 kΩ at V_GS = 0, I_DSS = 8 mA) */
const RD_DEV = { idss: 8e-3, vp: -4, lam: 0.005 };
/* the circuit beside the drain curves: V_GG holds the gate, V_DS is applied straight across drain and source (a curve tracer) */
AC.rdSpec = (vgs, vds) => ({ ground: 'g', nodes: { vg: [0, 1.6], g0: [0, 4], b: [1.7, 1.6], c: [2.5, 0.75], e: [2.5, 2.45], ge: [2.5, 4], t: [2.5, -0.6], tV: [4.6, -0.6], gD: [4.6, 4], g: [2.5, 4.6] },
  parts: [{ id: 'VGG', type: 'V', a: 'g0', b: 'vg', value: -vgs, name: 'V_GG', valText: `${fd(-vgs, 2)} V`, side: -1 }, W_('vg', 'b'), W_('e', 'ge'), W_('g0', 'ge'), W_('ge', 'gD'), W_('ge', 'g', { hidden: true, noDots: true }),
    W_('c', 't'), W_('t', 'tV'), { id: 'VDS', type: 'V', a: 'tV', b: 'gD', value: vds, name: 'V_DS', valText: `${fd(vds, 1)} V` },
    { id: 'Q', type: 'J', D: 'c', G: 'b', S: 'e', kind: 'jfet', ...RD_DEV, gate: false, pins: true, name: '', valText: '' }], mode: 'dc' });

/* page B.1, section B: the drain curves with a slope; r_d = 1/slope at the chosen point */
AC.EX.rd = (ids = {}) => { const ui = MC.ui, pre = ids.pre || 'b';
  return OP.explorer({ ids, init: { vgs: 0, vds: 8 }, title: t('จุดบนเส้นเดรน', 'A point on the drain curves'), layout: { cktAspM: 0.42, rowAsp: 0.7, rowMin: 270, cktAspN: 0.5 },
    controls: (p, S, build) => {
      ui.slider(p, { id: pre + 'G', label: 'V_GS', min: -3.5, max: 0, step: 0.1, value: S.vgs, fmt: v => `${fd(v, 1).replace('-', '−')} V`, oninput: v => { S.vgs = v; build(); } });
      ui.slider(p, { id: pre + 'D', label: 'V_DS', min: 1, max: 18, step: 0.5, value: S.vds, fmt: v => `${fd(v, 1)} V`, oninput: v => { S.vds = v; build(); } }); },
    spec: S => AC.rdSpec(S.vgs, S.vds),
    side: (ctx, b, bd, c, S) => { AC.rdPlot(ctx, b, bd, { ...RD_DEV, vgs: S.vgs, vds: S.vds, list: [0, -1, -2, -3] }); },
    badge: (c, S) => { const q = FETk.iv(RD_DEV, S.vgs, S.vds); return [[`r_d = 1/g_os = ${kOx(1 / q.gds)} (${q.region === 'saturation' ? t('ย่านอิ่มตัว', 'saturation') : t('ย่านโอห์มมิก', 'ohmic region')})`], q.region === 'saturation' ? 'ok' : 'wait']; },
    rows: (c, S) => { const q = FETk.iv(RD_DEV, S.vgs, S.vds); return [['I_D', `${fd(q.i * 1e3, 3)} mA`], ['ΔI_D/ΔV_DS = g_os', `${fd(q.gds * 1e6, 2)} µS`], ['r_d = 1/g_os', kOx(1 / q.gds)], [t('ย่าน', 'region'), q.region === 'saturation' ? t('อิ่มตัว (pinch-off)', 'saturation (pinch-off)') : t('โอห์มมิก', 'ohmic')]]; },
    text: (c, S) => { const q = FETk.iv(RD_DEV, S.vgs, S.vds), rd = 1 / q.gds;
      if (q.region !== 'saturation') return t(`ที่ \\(V_{DS}\\) = ${fd(S.vds, 1)} V จุดทำงานอยู่ทางซ้ายของเส้น pinch-off (ย่านโอห์มมิก) เส้นเดรนชันมาก \\(r_d\\) = ${kOx(rd)} เท่านั้น ช่องทำตัวเหมือนตัวต้านทาน วงจรขยายต้องให้ FET อยู่ในย่านอิ่มตัว`, `At \\(V_{DS}\\) = ${fd(S.vds, 1)} V the point is left of the pinch-off line (the ohmic region): the curve is steep and \\(r_d\\) is only ${kOx(rd)}; the channel acts as a resistor. An amplifier needs the FET in saturation.`);
      return t(`ในย่านอิ่มตัว เส้นเดรนเกือบราบ: \\(V_{DS}\\) เปลี่ยน 5 V กระแสเปลี่ยนเพียง ${fd(5 * q.gds * 1e3, 3)} mA จึงได้ \\(r_d\\) = ${kOx(rd)} (สมการ 8.12) ลด \\(V_{GS}\\) ลง \\(I_D\\) น้อยลง เส้นยิ่งราบ \\(r_d\\) ยิ่งสูง`, `In saturation the drain curve is nearly flat: a 5 V change of \\(V_{DS}\\) changes the current by only ${fd(5 * q.gds * 1e3, 3)} mA, so \\(r_d\\) = ${kOx(rd)} (Eq. 8.12). Lower \\(V_{GS}\\): less \\(I_D\\), a flatter curve and a higher \\(r_d\\).`); } }); };

/* ---------------- page B.1: Examples 8.1–8.2 (Figs. 8.2–8.5), g_m from the curve and from Shockley ---------------- */
const VG81 = [-0.5, -1.5, -2.5], D81 = { idss: 8e-3, vp: -4 };
let SP81 = null; const sp81 = v => (SP81 = SP81 || {}, SP81[v] || (SP81[v] = gmSpec(D81.idss, D81.vp, v)));
DEF.ex81 = { ...LAY, solvedAt: 1,
  spec: k => sp81(k <= 1 ? -0.5 : k === 2 ? -1.5 : -2.5),
  after: v => AC.ampTags(v, sp81(-0.5), { inText: 'v_gs', outText: 'v_o' }),
  glow: k => (k >= 1 && k <= 3 ? ['Q'] : null),
  badge: k => { const v = k <= 1 ? -0.5 : k === 2 ? -1.5 : -2.5, gm = 4 * (1 - v / -4); return k === 0 ? bdg('I_DSS = 8 mA, V_P = −4 V', null, false) : k <= 3 ? bdg(t(`กราฟ: ที่ V_GS = ${num2(v, 1)} V ความชัน ${fd([3.5, 2.5, 1.5][k - 1], 2)} mS`, `graph: at V_GS = ${num2(v, 1)} V the slope is ${fd([3.5, 2.5, 1.5][k - 1], 2)} mS`)) : k === 4 ? bdg('g_m0 = 2I_DSS/|V_P| = 4 mS') : k === 5 ? bdg('g_m = 3.5, 2.5, 1.5 mS') : bdg('g_m = g_m0 √(I_D/I_DSS)'); },
  side: (ctx, b, bd, k) => { const v = k <= 1 ? -0.5 : k === 2 ? -1.5 : -2.5, pts = VG81.slice(0, Math.min(k, 3) - 1).map(x => ({ v: x, i: shk(D81.idss, D81.vp, x), color: 'rgba(255,126,182,.55)', r: 4.5 }));
    if (k === 0) { CH5.tPlot(ctx, b, bd, { dev: D81, title: t('เส้นโค้งถ่ายโอนของ Example 8.1', 'the transfer curve of Example 8.1') }); return; }
    AC.gmPlot(ctx, b, bd, { ...D81, vgs: v, pts, chord: k !== 1 && k !== 3 }); },
  waves: [{ draw: (ctx, b, bd, k) => AC.gmLine(ctx, b, bd, { ...D81, vgs: k === 0 ? undefined : k <= 1 ? -0.5 : k === 2 ? -1.5 : -2.5, pts: k >= 5 ? VG81.map(x => ({ x, y: 4 * (1 - x / -4), color: AMBER, r: 5 })) : [] }) }],
  steps: () => [
    step(t('<b>(a) จากกราฟ ที่ \\(V_{GS}\\) = −0.5 V</b> (รูป 8.2, สมการ 8.2): ลากเส้นสัมผัสเส้นโค้งที่จุดทำงาน แล้วอ่านช่วงเปลี่ยนของ \\(I_D\\) และ \\(V_{GS}\\) บนเส้นสัมผัส', '<b>(a) From the graph, at \\(V_{GS}\\) = −0.5 V</b> (Fig. 8.2, Eq. 8.2): draw the tangent to the curve at the operating point and read the changes of \\(I_D\\) and \\(V_{GS}\\) along it'),
      block([R`g_m &= \frac{\Delta I_D}{\Delta V_{GS}} \cong \frac{2.1\ \text{mA}}{0.6\ \text{V}} = \boxed{3.5\ \text{mS}}`])),
    step(t('<b>ที่ \\(V_{GS}\\) = −1.5 V</b>', '<b>At \\(V_{GS}\\) = −1.5 V</b>'), block([R`g_m &\cong \frac{1.75\ \text{mA}}{0.7\ \text{V}} = \boxed{2.5\ \text{mS}}`]),
      t('ตำราอ่าน \\(\\Delta I_D\\) ได้ 1.8 mA จึงพิมพ์ 2.57 mS ซึ่งสูงไป 3 % เคล็ดลับ: เส้นโค้งของ Shockley เป็นพาราโบลา เส้นคอร์ดผ่านสองจุดที่ห่างจากจุดทำงานเท่ากันสองข้าง (เส้นม่วง) ชันเท่าเส้นสัมผัสพอดี 0.7 V รอบ −1.5 V ครอบ 1.75 mA พอดี', 'The book reads \\(\\Delta I_D\\) as 1.8 mA and prints 2.57 mS, 3 % too high. A trick: Shockley\'s curve is a parabola, so the chord through two points equally far either side of the operating point (purple) is exactly as steep as the tangent: 0.7 V around −1.5 V spans exactly 1.75 mA.')),
    step(t('<b>ที่ \\(V_{GS}\\) = −2.5 V</b>', '<b>At \\(V_{GS}\\) = −2.5 V</b>'), block([R`g_m &\cong \frac{1.5\ \text{mA}}{1.0\ \text{V}} = \boxed{1.5\ \text{mS}}`]),
      t('ยิ่งเข้าใกล้ \\(V_P\\) เส้นโค้งยิ่งราบ \\(g_m\\) ยิ่งน้อย', 'The closer to \\(V_P\\), the flatter the curve and the smaller \\(g_m\\).')),
    step(t('<b>(b) จากสูตร: \\(g_m\\) สูงสุด</b> (สมการ 8.5): อนุพันธ์ของสมการของ Shockley ที่ \\(V_{GS}\\) = 0', '<b>(b) From the formula: the largest \\(g_m\\)</b> (Eq. 8.5): the derivative of Shockley\'s equation at \\(V_{GS}\\) = 0'),
      block([R`g_{m0} &= \frac{2I_{DSS}}{|V_P|} = \frac{2(8\ \text{mA})}{4\ \text{V}} = \boxed{4\ \text{mS}}`])),
    step(t('<b>ที่จุดทำงานทั้งสาม</b> (สมการ 8.6): \\(g_m\\) ลดลงเป็นเส้นตรงจาก \\(g_{m0}\\) ที่ 0 V ถึงศูนย์ที่ \\(V_P\\) (Example 8.3, แผงล่าง)', '<b>At the three operating points</b> (Eq. 8.6): \\(g_m\\) falls in a straight line from \\(g_{m0}\\) at 0 V to zero at \\(V_P\\) (Example 8.3, lower panel)'),
      block([R`g_m &= g_{m0}\left(1 - \frac{V_{GS}}{V_P}\right):\quad 4\ \text{mS}(1 - 0.125) = 3.5\ \text{mS},\ 4\ \text{mS}(1 - 0.375) = 2.5\ \text{mS},\ 4\ \text{mS}(1 - 0.625) = 1.5\ \text{mS}`])),
    step(t('<b>\\(g_m\\) เป็นฟังก์ชันของ \\(I_D\\)</b> (สมการ 8.8–8.9, Example 8.4): จากสมการของ Shockley \\(1 - V_{GS}/V_P = \\sqrt{I_D/I_{DSS}}\\)', '<b>\\(g_m\\) as a function of \\(I_D\\)</b> (Eqs. 8.8–8.9, Example 8.4): from Shockley\'s equation \\(1 - V_{GS}/V_P = \\sqrt{I_D/I_{DSS}}\\)'),
      block([R`g_m &= g_{m0}\sqrt{\frac{I_D}{I_{DSS}}}:\quad I_D = \tfrac14 I_{DSS} = 2\ \text{mA} \Rightarrow \boxed{2\ \text{mS}},\quad I_D = \tfrac12 I_{DSS} \Rightarrow 2.83\ \text{mS}`]),
      t('ที่กระแสครึ่งหนึ่งของ \\(I_{DSS}\\) \\(g_m\\) ยังเหลือ 71 % ของ \\(g_{m0}\\)', 'At half of \\(I_{DSS}\\), \\(g_m\\) still has 71 % of \\(g_{m0}\\).')) ],
  ask: () => ({ fields: [num('g<sub>m0</sub> (mS) =', 4, { tol: 0.02 }), num('g<sub>m</sub> ที่ −1.5 V (mS) =', 2.5, { tol: 0.08 }), num('g<sub>m</sub> ที่ I<sub>D</sub> = 2 mA (mS) =', 2, { tol: 0.02 })] }),
  answer: () => t('(a) กราฟ: 3.5, 2.5, 1.5 mS (ตำราอ่านค่ากลางได้ 2.57) (b) \\(g_{m0}\\) = 4 mS; สูตร: 3.5, 2.5, 1.5 mS · \\(g_m\\) = 2 mS ที่ \\(I_D\\) = 2 mA (Boylestad Examples 8.1–8.4)', '(a) graph: 3.5, 2.5, 1.5 mS (the book reads 2.57 for the middle one) (b) \\(g_{m0}\\) = 4 mS; formula: 3.5, 2.5, 1.5 mS · \\(g_m\\) = 2 mS at \\(I_D\\) = 2 mA (Boylestad Examples 8.1–8.4)') };

/* ---------------- page B.1: Examples 8.5–8.6 (Figs. 8.7–8.9), r_d and the FET model ---------------- */
let M85 = null;
const mk85 = () => (M85 && M85.lang === MC.lang) ? M85 : (M85 = (() => { const o = { dev: 'jfet', cfg: 'fixed', RG: 1e6, vs: 0.01 }, eq = AC.eq(o, { gm: 3.8e-3, rd: 50e3 }), c = AC.solve(eq);
  return { lang: MC.lang, eq, c, Av: Cx.abs(Cx.div(c.V('c'), c.V('b'))) * -1, rd0: AC.rdSpec(0, 8), rd2: AC.rdSpec(-2, 8) }; })());
DEF.ex85 = { ...LAY, solvedAt: 1, probe: mk85,
  spec: k => { const m = mk85(); return k <= 1 ? m.rd0 : k === 2 ? m.rd2 : m.eq; },
  after: (v, k) => { if (k >= 3) AC.zArrows(v, { outN: 'c', outDx: 0.25, outText: 'Z_o = r_d' }); },
  glow: k => ({ 3: ['Gm', 'ro'], 4: ['Gm', 'ro'] })[k] || null,
  badge: k => { const m = mk85(); return [bdg(t('เส้นเดรนของ JFET: I_DSS = 8 mA, V_P = −4 V', 'drain curves of a JFET: I_DSS = 8 mA, V_P = −4 V'), null, false), bdg('V_GS = 0: r_d = 25 kΩ'), bdg(t('V_GS = −2 V: r_d สูงขึ้น', 'V_GS = −2 V: r_d higher')), bdg('g_m = 3.8 mS, r_d = 50 kΩ'), bdg(`A_v(FET) = −g_m r_d = ${fd(m.Av, 1)}`)][k] ?? null; },
  side: (ctx, b, bd, k) => { const m = mk85(); if (k <= 2) { AC.rdPlot(ctx, b, bd, { ...RD_DEV, vgs: k === 2 ? -2 : 0, vds: 8 }); return; }
    tbl(ctx, b, bd, [['g_m = g_fs', '3.8 mS', '3.8 mS'], ['r_d = 1/g_os', '50 kΩ', '50 kΩ']].concat(k >= 4 ? [['A_v(FET)', '−190', fd(m.Av, 1)]] : []), ['Example 8.6: มือ | ภาพจำลอง', 'Example 8.6: hand | simulator']); },
  waves: [{ draw: (ctx, b, bd, k) => { if (k < 3) { const I0 = FETk.iv(RD_DEV, k === 2 ? -2 : 0, 8).i * 1e3, lam = RD_DEV.lam, rdk = i => 1 / (lam * i * 1e-3) / 1e3;
      OP.plot(ctx, b, { x: [0, 9], y: [0, 220], xt: [2, 4, 6, 8], yt: [50, 100, 150, 200], xf: x => fd(x, 0), yf: y => fd(y, 0), xl: 'I_D (mA)', yl: 'r_d (kΩ)', ml: 38, curves: [{ f: i => (i > 0.4 ? rdk(i) : NaN), color: C.curve, w: 3 }],
        pts: [{ x: I0, y: rdk(I0), color: PINK, r: 6, label: bd.short ? '' : kOx(rdk(I0) * 1e3), side: I0 > 4 ? -1 : 1 }], title: bd.short ? 'r_d(I_D)' : t('r_d = 1/λI_D: กระแสน้อย r_d สูง', 'r_d = 1/λI_D: less current, higher r_d') }); return; } const m = mk85();
    AC.scope(ctx, b, { chans: [{ label: 'v_gs', z: m.c.V('b'), color: AMBER }, { label: 'v_o', z: m.c.V('c'), color: CYAN }], w: m.c.w, now: bd.clk.ph, short: bd.short, title: bd.short ? '' : t('v_gs (ช่อง 1) และ v_ds (ช่อง 2)', 'v_gs (channel 1) and v_ds (channel 2)') }); } }],
  steps: () => [
    step(t('<b>Example 8.5: \\(r_d\\) ที่ \\(V_{GS}\\) = 0 V</b> (รูป 8.7, สมการ 8.12): \\(r_d\\) คือส่วนกลับของความชันของเส้นเดรนเส้นเดียว (\\(V_{GS}\\) คงที่) ในย่านอิ่มตัว ตำราอ่านรอบ \\(V_{DS}\\) = 8 V', '<b>Example 8.5: \\(r_d\\) at \\(V_{GS}\\) = 0 V</b> (Fig. 8.7, Eq. 8.12): \\(r_d\\) is the inverse slope of one drain curve (\\(V_{GS}\\) held constant) in saturation; the book reads it around \\(V_{DS}\\) = 8 V'),
      block([R`r_d &= \left.\frac{\Delta V_{DS}}{\Delta I_D}\right|_{V_{GS}\ \text{const}} = \frac{5\ \text{V}}{0.2\ \text{mA}} = \boxed{25\ \text{k}\Omega}`])),
    step(t('<b>ที่ \\(V_{GS}\\) = −2 V</b>: เส้นราบกว่า', '<b>At \\(V_{GS}\\) = −2 V</b>: a flatter curve'), block([R`r_d &= \frac{8\ \text{V}}{0.1\ \text{mA}} = \boxed{80\ \text{k}\Omega}`]),
      t('\\(r_d\\) สูงขึ้นเมื่อ \\(I_D\\) ลดลง ภาพจำลองใช้ λ = 0.005 V⁻¹ (\\(r_d = 1/\\lambda I_D\\)) ได้ 100 kΩ ที่ −2 V ส่วนรูป 8.7 ของตำราเป็นเส้นวาดมือ', '\\(r_d\\) rises as \\(I_D\\) falls. The simulator uses λ = 0.005 V⁻¹ (\\(r_d = 1/\\lambda I_D\\)) and gets 100 kΩ at −2 V; the book\'s Fig. 8.7 is hand-drawn.')),
    step(t('<b>Example 8.6: แบบจำลอง ac ของ FET</b> (รูป 8.8–8.9, สมการ 8.7, 8.10–8.11): ใบข้อมูลให้ \\(g_{fs}\\) = 3.8 mS และ \\(g_{os}\\) = 20 µS เกตเป็นเปิดวงจร (\\(Z_i = \\infty\\)) ด้านเดรนเป็นแหล่งกระแส \\(g_mV_{gs}\\) จากเดรนลงซอร์ส ขนานกับ \\(r_d\\)', '<b>Example 8.6: the FET ac model</b> (Figs. 8.8–8.9, Eqs. 8.7, 8.10–8.11): a data sheet gives \\(g_{fs}\\) = 3.8 mS and \\(g_{os}\\) = 20 µS. The gate is an open circuit (\\(Z_i = \\infty\\)); the drain side is a current source \\(g_mV_{gs}\\) from drain to source, in parallel with \\(r_d\\)'),
      block([R`g_m &= g_{fs} = \boxed{3.8\ \text{mS}},\quad r_d = \frac{1}{g_{os}} = \frac{1}{20\ \mu\text{S}} = \boxed{50\ \text{k}\Omega}`]),
      t('เทียบกับ BJT: ไม่มี \\(\\beta r_e\\) ระหว่างเกตกับซอร์ส และแหล่งกระแสถูกควบคุมด้วยแรงดัน \\(V_{gs}\\) แทนกระแส \\(I_b\\)', 'Compared with the BJT there is no \\(\\beta r_e\\) between gate and source, and the source is controlled by the voltage \\(V_{gs}\\) instead of the current \\(I_b\\).')),
    step(t('<b>อัตราขยายของตัว FET เอง</b> (ข้อ 9 ท้ายบท): เมื่อไม่มีโหลดภายนอก กระแส \\(g_mV_{gs}\\) ไหลผ่าน \\(r_d\\) อย่างเดียว', '<b>The FET\'s own gain</b> (Problem 9): with no external load the current \\(g_mV_{gs}\\) flows through \\(r_d\\) alone'),
      block([R`A_{v(\text{FET})} &= \frac{V_o}{V_{gs}} = -g_mr_d = -(3.8\ \text{mS})(50\ \text{k}\Omega) = \boxed{-190}`]),
      t('นี่คือขีดสูงสุดที่ FET ตัวนี้ขยายได้ \\(R_D\\) ภายนอกขนานกับ \\(r_d\\) จะลดอัตราขยายลงเสมอ (หน้า B.2)', 'This is the most this FET can amplify; an external \\(R_D\\) in parallel with \\(r_d\\) always lowers the gain (page B.2).')) ],
  ask: () => ({ fields: [num('r<sub>d</sub> ที่ V<sub>GS</sub> = 0 (kΩ) =', 25, { tol: 0.3 }), num('r<sub>d</sub> = 1/g<sub>os</sub> (kΩ) =', 50, { tol: 0.3 }), num('A<sub>v(FET)</sub> =', -190, { tol: 1 })] }),
  answer: () => t('Example 8.5: \\(r_d\\) = 25 kΩ (\\(V_{GS}\\) = 0) และ 80 kΩ (\\(V_{GS}\\) = −2 V) · Example 8.6: \\(g_m\\) = 3.8 mS, \\(r_d\\) = 50 kΩ, \\(A_{v(\\text{FET})}\\) = −190', 'Example 8.5: \\(r_d\\) = 25 kΩ (\\(V_{GS}\\) = 0) and 80 kΩ (\\(V_{GS}\\) = −2 V) · Example 8.6: \\(g_m\\) = 3.8 mS, \\(r_d\\) = 50 kΩ, \\(A_{v(\\text{FET})}\\) = −190') };

/* =====================================================================================================================
   supplement B, page B.2: JFET common-source amplifiers */
/* the transfer curve with a bias line (v_GS = v_G − I_D R_S), the Q-point and the tangent there */
AC.biasPlot = (ctx, b, bd, o) => { const d = { idss: o.idss, vp: o.vp }, vq = o.vgs, iq = shk(o.idss, o.vp, vq), gm = 2 * o.idss / Math.abs(o.vp) * (1 - vq / o.vp) * 1e3, vg = o.vg || 0, rs = o.rs || 0;
  const lines = [{ a: [vq - 1.1, iq - 1.1 * gm], b: [vq + 1.1, iq + 1.1 * gm], color: AMBER, w: 2, dash: [7, 5] }];
  if (rs > 0) lines.push({ a: [vg, 0], b: [vg - o.idss * 1.3 * rs, o.idss * 1.3e3], color: C.tan, w: 2.4, label: bd.short ? '' : t('เส้นไบแอส', 'bias line'), at: 0.35 });
  else lines.push({ a: [vq, 0], b: [vq, o.idss * 1.25e3], color: C.tan, w: 2.4, label: bd.short ? '' : `V_GS = ${num2(vq, 1)} V`, at: 0.8 });
  CH5.tPlot(ctx, b, bd, { dev: d, vmax: o.vmax ?? 0, lines, pts: [{ v: vq, i: iq, color: PINK, label: bd.short ? 'Q' : `Q: ${num2(vq, 2)} V, ${fd(iq, 2)} mA`, side: -1, dy: 18 }],
    title: o.title ?? (bd.short ? `g_m = ${fd(gm, 2)} mS` : t(`จุด Q จากเส้นไบแอส แล้ว g_m = ความชันที่ Q = ${fd(gm, 2)} mS`, `Q from the bias line, then g_m = the slope at Q = ${fd(gm, 2)} mS`)) });
  return gm; };
const O88b = { dev: 'jfet', cfg: 'fixed', VDD: 20, RG: 1e6, idss: 8e-3, vp: -6, rd: 50e3, vs: 0.01 };
AC.EX.cs = (ids = {}) => { const ui = MC.ui, pre = ids.pre || 'a';
  return OP.explorer({ ids, init: { CS: false, RS: 1000, RD: 3300 }, title: t('ไบแอสตัวเองกับตัวเก็บประจุ C_S', 'Self bias and the capacitor C_S'), layout: { cktAspM: 0.5, rowAsp: 0.66, rowMin: 260, cktAspN: 0.62 },
    controls: (p, S, build) => {
      ui.radio(p, [{ id: pre + 'off', label: t('ไม่ต่อ C_S', 'C_S out'), on: !S.CS }, { id: pre + 'on', label: t('ต่อ C_S', 'C_S in'), on: S.CS }], id => { S.CS = id === pre + 'on'; build(); });
      OP.logSlider(p, pre + 'RS', 'R_S', 100, 4700, () => S.RS, v => { S.RS = v; }, build, v => kO(v), OP.rndR);
      OP.logSlider(p, pre + 'RD', 'R_D', 1000, 6800, () => S.RD, v => { S.RD = v; }, build, v => kO(v), OP.rndR); },
    spec: S => { const sp = AC.tune(AC.amp({ ...O88b, RD: S.RD, RS: S.RS, CS: S.CS })); S.sp = sp; S.m = AC.measure(sp); return sp; },
    after: (v, c, S) => AC.ampTags(v, S.sp),
    side: (ctx, b, bd, c, S) => { S.gm = AC.biasPlot(ctx, b, bd, { idss: 8e-3, vp: -6, vgs: S.m.Q.VGS, rs: S.RS }); },
    waves: [(ctx, b, bd, c, S) => AC.scope(ctx, b, scopeOf(S.m, bd))],
    badge: (c, S) => { const sat = S.m.Q.region === 'saturation'; return [[sat ? `A_v = ${num2(S.m.Av, 2)}` : t('ออกนอกย่านอิ่มตัว: ลด R_D', 'out of saturation: lower R_D'), sat ? `A_v = ${num2(S.m.Av, 2)}` : 'out of saturation: lower R_D'], sat ? 'ok' : 'wait']; },
    rows: (c, S) => { const q = S.m.Q, gm = 2 * 8e-3 / 6 * (1 - q.VGS / -6), rd = 50e3, RD = S.RD, RS = S.RS, par = (a, b2) => a * b2 / (a + b2);
      const f = S.CS ? -gm * par(RD, rd) : -gm * RD / (1 + gm * RS + (RD + RS) / rd);
      return [['V_GSQ', `${num2(q.VGS, 3)} V`], ['I_DQ', `${fd(Math.abs(q.ID) * 1e3, 3)} mA`], ['V_DSQ', `${fd(q.VDS, 2)} V`], ['g_m', `${fd(gm * 1e3, 3)} mS`], [S.CS ? '−g_m(R_D ‖ r_d)' : '−g_mR_D/(1 + g_mR_S + …)', fd(f, 3)], [t('A_v ภาพจำลอง', 'A_v simulator'), fd(S.m.Av, 3)]]; },
    text: (c, S) => { const q = S.m.Q, gm = 2 * 8e-3 / 6 * (1 - q.VGS / -6);
      if (q.region !== 'saturation') return t(`\\(V_{DS}\\) = ${fd(q.VDS, 2)} V น้อยกว่า \\(V_{GS} - V_P\\) = ${fd(q.VGS + 6, 2)} V: JFET ออกจากย่านอิ่มตัวไปอยู่ในย่านโอห์มมิก แบบจำลอง \\(g_m\\) ใช้ไม่ได้ ลด \\(R_D\\) หรือเพิ่ม \\(R_S\\)`, `\\(V_{DS}\\) = ${fd(q.VDS, 2)} V is below \\(V_{GS} - V_P\\) = ${fd(q.VGS + 6, 2)} V: the JFET has left saturation for the ohmic region and the \\(g_m\\) model no longer holds. Lower \\(R_D\\) or raise \\(R_S\\).`);
      return S.CS ? t(`ต่อ \\(C_S\\): \\(R_S\\) หายไปจากวงจร ac อัตราขยาย \\(-g_m(R_D \\parallel r_d)\\) = ${fd(S.m.Av, 2)} \\(R_S\\) ยังกำหนดจุดทำงาน: เพิ่ม \\(R_S\\) แล้ว \\(I_D\\) ลด \\(g_m\\) ลด อัตราขยายจึงลดตาม`, `With \\(C_S\\), \\(R_S\\) is gone from the ac circuit and the gain is \\(-g_m(R_D \\parallel r_d)\\) = ${fd(S.m.Av, 2)}. \\(R_S\\) still sets the operating point: raise it and \\(I_D\\) falls, \\(g_m\\) falls, and so does the gain.`)
        : t(`ไม่ต่อ \\(C_S\\): \\(R_S\\) อยู่ในวงจร ac แรงดันสัญญาณส่วนหนึ่งตกคร่อม \\(R_S\\) อัตราขยายเหลือ ${fd(S.m.Av, 2)} ≈ \\(-g_mR_D/(1 + g_mR_S)\\) โดย \\(g_mR_S\\) = ${fd(gm * S.RS, 2)} ยิ่ง \\(g_mR_S\\) มาก อัตราขยายยิ่งใกล้ \\(-R_D/R_S\\)`, `Without \\(C_S\\), \\(R_S\\) is in the ac circuit and part of the signal drops across it: the gain is ${fd(S.m.Av, 2)} ≈ \\(-g_mR_D/(1 + g_mR_S)\\), with \\(g_mR_S\\) = ${fd(gm * S.RS, 2)}. The larger \\(g_mR_S\\), the closer the gain gets to \\(-R_D/R_S\\).`); } }); };

/* ---------------- page B.2: Example 8.7, fixed bias (Fig. 8.14, V_DD = 20 V) ---------------- */
const O87 = { dev: 'jfet', cfg: 'fixed', VDD: 20, RG: 1e6, VGG: 2, RD: 2e3, idss: 10e-3, vp: -8, vs: 0.01 };
DEF.ex87 = ampDef({ o: O87, ro: 25e3, roFrom: 6, p: { gm: 1.875e-3 }, eqFrom: 3, title: ['Example 8.7: มือ | ภาพจำลอง', 'Example 8.7: hand | simulator'],
  rows: [[1, 'V_GSQ', '−2 V', m => `${num2(m.X.m.Q.VGS, 3)} V`], [1, 'I_DQ', '5.625 mA', m => mAx(Math.abs(m.X.m.Q.ID))], [2, 'g_m', '1.875 mS', m => `${fd(2 * 10 / 8 * (1 - m.X.m.Q.VGS / -8), 3)} mS`], [4, 'Z_i', '1 MΩ', m => kOx(m.X.m.Zi)],
    [5, 'Z_o', '2 kΩ', m => kOx(m.X.m.Zo)], [5, 'A_v', '−3.75', m => num2(m.X.m.Av, 3)], [6, 'Z_o (r_d)', '1.85 kΩ', m => kOx(m.Xr.m.Zo)], [6, 'A_v (r_d)', '−3.47', m => num2(m.Xr.m.Av, 3)]],
  glow: { 1: ['RG', 'VGG'], 2: ['Q'], 3: ['Gm'], 4: ['RB'], 5: ['RC', 'Gm'], 6: ['ro', 'RC'] },
  badge: (k, m) => [null, 'V_GSQ = −V_GG = −2 V, I_DQ = 5.625 mA', 'g_m = 2.5 mS (1 − 2/8) = 1.875 mS', ['วงจรสมมูล ac: เกตเปิดวงจร', 'ac equivalent: the gate is open'], `Z_i = R_G = ${kOx(m.X.m.Zi)}`, `A_v = −g_mR_D = ${num2(m.X.m.Av, 3)}`, `r_d = 25 kΩ: A_v = ${num2(m.Xr.m.Av, 3)}`][k] ?? null,
  steps: () => [
    step(t('<b>จุดทำงาน</b> (Example 7.1): เกตไม่กินกระแส แรงดันที่ \\(R_G\\) เป็นศูนย์ \\(V_{GS} = -V_{GG}\\) แล้วสมการของ Shockley ให้ \\(I_D\\)', '<b>The operating point</b> (Example 7.1): the gate takes no current, so there is no voltage across \\(R_G\\): \\(V_{GS} = -V_{GG}\\), and Shockley\'s equation gives \\(I_D\\)'),
      block([R`V_{GSQ} &= -2\ \text{V},\quad I_{DQ} = 10\ \text{mA}\left(1 - \frac{-2}{-8}\right)^2 = 5.625\ \text{mA}`]),
      t('รูป 8.14 ใช้ \\(V_{DD}\\) = 20 V ส่วน Example 7.1 ใช้ 16 V ซึ่งให้ \\(V_{DS}\\) = 4.75 V น้อยกว่า \\(V_{GS} - V_P\\) = 6 V (ย่านโอห์มมิก) หน้านี้ใช้ 20 V: \\(V_{DS}\\) = 8.75 V อยู่ในย่านอิ่มตัว', 'Fig. 8.14 uses \\(V_{DD}\\) = 20 V, while Example 7.1 used 16 V, which gives \\(V_{DS}\\) = 4.75 V, below \\(V_{GS} - V_P\\) = 6 V (the ohmic region). This page uses 20 V: \\(V_{DS}\\) = 8.75 V, in saturation.')),
    step(t('<b>(a) \\(g_m\\)</b> (สมการ 8.5–8.6)', '<b>(a) \\(g_m\\)</b> (Eqs. 8.5–8.6)'), block([R`g_{m0} &= \frac{2(10\ \text{mA})}{8\ \text{V}} = 2.5\ \text{mS},\quad g_m = 2.5\ \text{mS}\left(1 - \frac{-2}{-8}\right) = \boxed{1.875\ \text{mS}}`]),
      t('ตำราปัดเป็น 1.88 mS ก่อนนำไปคูณ คำตอบ \\(A_v\\) ของตำราจึงเกินไปในหลักสุดท้าย (−3.76 และ −3.48)', 'The book rounds it to 1.88 mS before multiplying, so its \\(A_v\\) answers are off in the last digit (−3.76 and −3.48).')),
    step(t('<b>วงจรสมมูล ac</b> (รูป 8.12–8.13): \\(V_{GG}\\) และ \\(V_{DD}\\) เป็นกราวด์ของ ac ตัวเก็บประจุลัดวงจร เกตต่อกราวด์ผ่าน \\(R_G\\) อย่างเดียว ไม่มีทางให้กระแสสัญญาณเข้า FET', '<b>The ac equivalent circuit</b> (Figs. 8.12–8.13): \\(V_{GG}\\) and \\(V_{DD}\\) are ac grounds and the capacitors are shorts; the gate goes to ground only through \\(R_G\\), and no signal current can enter the FET'),
      block([R`I_g &= 0\quad\Rightarrow\quad V_{gs} = V_i`])),
    step(t('<b>(c) \\(Z_i\\)</b> (สมการ 8.13)', '<b>(c) \\(Z_i\\)</b> (Eq. 8.13)'), block([R`Z_i &= R_G = \boxed{1\ \text{M}\Omega}`]),
      t('สูงกว่าวงจร BJT ของหน้า A.1 ราวพันเท่า', 'About a thousand times higher than the BJT stage of page A.1.')),
    step(t('<b>(f) \\(Z_o\\) และ \\(A_v\\) เมื่อละ \\(r_d\\)</b> (สมการ 8.14, 8.17): กระแส \\(g_mV_{gs}\\) ไหลขึ้นผ่าน \\(R_D\\) จากกราวด์ \\(V_o = -g_mV_{gs}R_D\\)', '<b>(f) \\(Z_o\\) and \\(A_v\\) without \\(r_d\\)</b> (Eqs. 8.14, 8.17): the current \\(g_mV_{gs}\\) flows up through \\(R_D\\) from ground, \\(V_o = -g_mV_{gs}R_D\\)'),
      block([R`Z_o &= R_D = 2\ \text{k}\Omega,\quad A_v = -g_mR_D = -(1.875\ \text{mS})(2\ \text{k}\Omega) = \boxed{-3.75}`]),
      t('ตำราใช้ \\(g_m\\) ที่ปัดแล้วจึงพิมพ์ −3.76 ภาพจำลองได้ −3.75 พอดี', 'The book uses the rounded \\(g_m\\) and prints −3.76; the simulator gets exactly −3.75.')),
    step(t('<b>(b), (d), (e) รวม \\(r_d\\)</b> (สมการ 8.11, 8.14, 8.16): \\(y_{os}\\) = 40 µS ให้ \\(r_d\\) = 25 kΩ ซึ่งขนานกับ \\(R_D\\)', '<b>(b), (d), (e) With \\(r_d\\)</b> (Eqs. 8.11, 8.14, 8.16): \\(y_{os}\\) = 40 µS gives \\(r_d\\) = 25 kΩ, in parallel with \\(R_D\\)'),
      block([R`r_d &= \frac{1}{40\ \mu\text{S}} = 25\ \text{k}\Omega,\quad Z_o = R_D \parallel r_d = \boxed{1.85\ \text{k}\Omega}`, R`A_v &= -g_m(r_d \parallel R_D) = -(1.875\ \text{mS})(1.852\ \text{k}\Omega) = \boxed{-3.47}`]),
      t('\\(r_d\\) = 12.5 \\(R_D\\) ทำให้อัตราขยายลดลง 8 % (ตำราพิมพ์ −3.48 จาก \\(g_m\\) ที่ปัด)', '\\(r_d\\) = 12.5 \\(R_D\\) costs 8 % of the gain (the book prints −3.48 from the rounded \\(g_m\\)).')) ],
  ask: () => ({ fields: [num('g<sub>m</sub> (mS) =', 1.875, { tol: 0.012 }), num('Z<sub>i</sub> (MΩ) =', 1, { tol: 0.01 }), num2a('A<sub>v</sub> (r<sub>d</sub> = 25 kΩ) =', -3.47, -3.48, 0.012)],
    check: v => (v[2] > 0 ? t('ซอร์สร่วม: ขาออกกลับเฟส', 'A common source inverts: the gain is negative.') : '') }),
  answer: () => t('(a) \\(g_m\\) = 1.875 mS (b) \\(r_d\\) = 25 kΩ (c) \\(Z_i\\) = 1 MΩ (d) \\(Z_o\\) = 1.85 kΩ (e) \\(A_v\\) = −3.47 (f) ละ \\(r_d\\): \\(A_v\\) = −3.75 (ตำราปัด \\(g_m\\) เป็น 1.88 mS จึงพิมพ์ −3.48 และ −3.76) (Boylestad Example 8.7)', '(a) \\(g_m\\) = 1.875 mS (b) \\(r_d\\) = 25 kΩ (c) \\(Z_i\\) = 1 MΩ (d) \\(Z_o\\) = 1.85 kΩ (e) \\(A_v\\) = −3.47 (f) without \\(r_d\\): \\(A_v\\) = −3.75 (the book rounds \\(g_m\\) to 1.88 mS and prints −3.48 and −3.76) (Boylestad Example 8.7)') });

/* ---------------- page B.2: Example 8.8, self bias with R_S unbypassed (Fig. 8.20), then bypassed ---------------- */
const O88 = { dev: 'jfet', cfg: 'fixed', VDD: 20, RG: 1e6, RD: 3.3e3, RS: 1e3, CS: false, idss: 8e-3, vp: -6, vs: 0.01 };
DEF.ex88 = ampDef({ o: O88, ro: 50e3, roFrom: 6, alt: { o: { ...O88, CS: true, rd: 50e3 }, p: { gm: 1.51e-3, rd: 50e3 }, from: 7 }, p: { gm: 1.51e-3 }, eqFrom: 3, title: ['Example 8.8: มือ | ภาพจำลอง', 'Example 8.8: hand | simulator'],
  rows: [[1, 'V_GSQ', '−2.6 V', m => `${num2(m.X.m.Q.VGS, 3)} V`], [2, 'g_m', '1.51 mS', m => `${fd(2 * 8 / 6 * (1 - m.X.m.Q.VGS / -6), 3)} mS`], [4, 'Z_i', '1 MΩ', m => kOx(m.X.m.Zi)], [5, 'A_v', '−1.99', m => num2(m.X.m.Av, 3)],
    [6, 'A_v (r_d)', '−1.92', m => num2(m.Xr.m.Av, 3)], [6, 'Z_o (r_d)', '3.22 kΩ', m => kOx(m.Xr.m.Zo)], [7, 'A_v (C_S)', '−4.68', m => num2(m.A.m.Av, 3)]],
  glow: { 1: ['RG', 'RE'], 2: ['Q'], 3: ['Gm', 'RE'], 4: ['RB'], 5: ['Gm', 'RC', 'RE'], 6: ['ro', 'RC'], 7: ['Gm', 'RC'] },
  badge: (k, m) => [null, 'Q: V_GS ≈ −2.6 V, I_D ≈ 2.6 mA', 'g_m = 2.67 mS (1 − 2.6/6) = 1.51 mS', ['R_S อยู่ในวงจร ac: V_gs = V_i − I_dR_S', 'R_S stays in the ac circuit: V_gs = V_i − I_dR_S'], `Z_i = R_G = ${kOx(m.X.m.Zi)}`, `A_v = ${num2(m.X.m.Av, 3)}`, `r_d = 50 kΩ: A_v = ${num2(m.Xr.m.Av, 3)}`, [`ต่อ C_S: A_v = ${num2(m.A.m.Av, 3)}`, `C_S in: A_v = ${num2(m.A.m.Av, 3)}`]][k] ?? null,
  steps: () => [
    step(t('<b>จุดทำงาน</b> (Example 7.2, หน้า 5.4): เส้นไบแอส \\(V_{GS} = -I_DR_S\\) ตัดเส้นโค้งของ Shockley ตำราอ่านกราฟได้', '<b>The operating point</b> (Example 7.2, page 5.4): the bias line \\(V_{GS} = -I_DR_S\\) meets Shockley\'s curve; the book reads from the graph'),
      block([R`V_{GSQ} &\cong -2.6\ \text{V},\quad I_{DQ} \cong 2.6\ \text{mA}`]), t('แก้สมการตรง ๆ ได้ −2.588 V, 2.588 mA (ภาพจำลอง)', 'Solving exactly gives −2.588 V and 2.588 mA (simulator).')),
    step(t('<b>\\(g_m\\)</b> (สมการ 8.6)', '<b>\\(g_m\\)</b> (Eq. 8.6)'), block([R`g_{m0} &= \frac{2(8\ \text{mA})}{6\ \text{V}} = 2.67\ \text{mS},\quad g_m = 2.67\ \text{mS}\left(1 - \frac{-2.6}{-6}\right) = \boxed{1.51\ \text{mS}}`])),
    step(t('<b>วงจรสมมูล ac ที่ \\(R_S\\) ยังอยู่</b> (รูป 8.19): กระแส \\(I_d\\) ไหลผ่าน \\(R_S\\) ทำให้ซอร์สแกว่งตาม แรงดันที่คุม FET จริง ๆ จึงเหลือ \\(V_{gs} = V_i - I_dR_S\\)', '<b>The ac equivalent with \\(R_S\\)</b> (Fig. 8.19): the current \\(I_d\\) through \\(R_S\\) makes the source swing too, so the voltage that really controls the FET is only \\(V_{gs} = V_i - I_dR_S\\)'),
      block([R`I_d &= g_mV_{gs} = g_m(V_i - I_dR_S)\quad\Rightarrow\quad I_d = \frac{g_mV_i}{1 + g_mR_S}`])),
    step(t('<b>\\(Z_i\\)</b> (สมการ 8.23)', '<b>\\(Z_i\\)</b> (Eq. 8.23)'), block([R`Z_i &= R_G = \boxed{1\ \text{M}\Omega}`])),
    step(t('<b>\\(A_v\\) เมื่อละ \\(r_d\\)</b> (สมการ 8.27)', '<b>\\(A_v\\) without \\(r_d\\)</b> (Eq. 8.27)'),
      block([R`A_v &= -\frac{g_mR_D}{1 + g_mR_S} = -\frac{(1.51\ \text{mS})(3.3\ \text{k}\Omega)}{1 + (1.51\ \text{mS})(1\ \text{k}\Omega)} = -\frac{4.983}{2.51} = \boxed{-1.99}`]),
      t('เทียบกับ \\(-g_mR_D\\) = −4.98: \\(R_S\\) ที่ไม่บายพาสกินอัตราขยายไป 1 + \\(g_mR_S\\) = 2.5 เท่า (ตำราตัดเศษ −1.985 เหลือ −1.98)', 'Compared with \\(-g_mR_D\\) = −4.98, the unbypassed \\(R_S\\) takes away a factor 1 + \\(g_mR_S\\) = 2.5 (the book truncates −1.985 to −1.98).')),
    step(t('<b>รวม \\(r_d\\) = 50 kΩ</b> (สมการ 8.25–8.26)', '<b>With \\(r_d\\) = 50 kΩ</b> (Eqs. 8.25–8.26)'),
      block([R`A_v &= -\frac{g_mR_D}{1 + g_mR_S + \dfrac{R_D + R_S}{r_d}} = -\frac{4.98}{1 + 1.51 + 0.086} = \boxed{-1.92}`, R`Z_o &= \frac{\left(1 + g_mR_S + \dfrac{R_S}{r_d}\right)R_D}{1 + g_mR_S + \dfrac{R_S}{r_d} + \dfrac{R_D}{r_d}} = \frac{2.53}{2.596}(3.3\ \text{k}\Omega) = \boxed{3.22\ \text{k}\Omega} \cong R_D`]),
      t('ตำราตอบ \\(Z_o\\) = 3.3 kΩ จากรูปประมาณ \\(Z_o \\cong R_D\\) (สมการ 8.25b) รูปเต็ม (8.25a) ได้ 3.22 kΩ ตรงกับภาพจำลอง', 'The book answers \\(Z_o\\) = 3.3 kΩ from the approximation \\(Z_o \\cong R_D\\) (Eq. 8.25b); the full Eq. 8.25a gives 3.22 kΩ, matching the simulator.')),
    step(t('<b>ต่อ \\(C_S\\) ขนาน \\(R_S\\)</b> (หัวข้อ 8.4, สมการ 8.21): \\(R_S\\) หายไปจากวงจร ac วงจรเหมือนไบแอสคงที่', '<b>Connect \\(C_S\\) across \\(R_S\\)</b> (section 8.4, Eq. 8.21): \\(R_S\\) leaves the ac circuit, which is now like fixed bias'),
      block([R`A_v &= -g_m(R_D \parallel r_d) = -(1.51\ \text{mS})(3.1\ \text{k}\Omega) = \boxed{-4.68}`])) ],
  ask: () => ({ fields: [num2a('g<sub>m</sub> (mS) =', 1.51, 1.517, 0.008), num2a('A<sub>v</sub> ไม่มี C<sub>S</sub>, ละ r<sub>d</sub> =', -1.99, -1.985, 0.012), num2a('A<sub>v</sub> ไม่มี C<sub>S</sub>, r<sub>d</sub> = 50 kΩ =', -1.92, -1.923, 0.012)],
    check: v => (near(v[1], -4.98, 0.1) ? t('นั่นคือ −g<sub>m</sub>R<sub>D</sub> ของกรณีบายพาส: R<sub>S</sub> ที่ไม่บายพาสต้องหารด้วย 1 + g<sub>m</sub>R<sub>S</sub>', 'That is −g<sub>m</sub>R<sub>D</sub> of the bypassed case: an unbypassed R<sub>S</sub> divides by 1 + g<sub>m</sub>R<sub>S</sub>.') : '') }),
  answer: () => t('\\(g_m\\) = 1.51 mS, \\(r_d\\) = 50 kΩ, \\(Z_i\\) = 1 MΩ, \\(Z_o\\) = 3.22 kΩ ≅ \\(R_D\\), \\(A_v\\) = −1.92 (ละ \\(r_d\\): −1.99; ตำราพิมพ์ −1.98) · ต่อ \\(C_S\\): −4.68 (Boylestad Example 8.8)', '\\(g_m\\) = 1.51 mS, \\(r_d\\) = 50 kΩ, \\(Z_i\\) = 1 MΩ, \\(Z_o\\) = 3.22 kΩ ≅ \\(R_D\\), \\(A_v\\) = −1.92 (without \\(r_d\\): −1.99; the book prints −1.98) · with \\(C_S\\): −4.68 (Boylestad Example 8.8)') });

/* ---------------- page B.2: a JFET voltage divider (Example 7.4 values, Fig. 8.63; the chapter has no numbered example) ---------------- */
const OVD = { dev: 'jfet', cfg: 'vdb', VDD: 16, R1: 2.1e6, R2: 270e3, RD: 2.4e3, RS: 1.5e3, CS: true, CSv: 40e-6, idss: 8e-3, vp: -4, vs: 0.01 };
DEF.exvd = ampDef({ o: OVD, p: { gm: 2.2e-3 }, eqFrom: 3, title: ['ตัวแบ่งแรงดัน: มือ | ภาพจำลอง', 'Voltage divider: hand | simulator'],
  rows: [[1, 'V_G', '1.82 V', m => `${fd(16 * 270 / 2370, 3)} V`], [1, 'V_GSQ', '−1.8 V', m => `${num2(m.X.m.Q.VGS, 3)} V`], [1, 'I_DQ', '2.4 mA', m => mAx(Math.abs(m.X.m.Q.ID))], [2, 'g_m', '2.2 mS', m => `${fd(2 * 8 / 4 * (1 - m.X.m.Q.VGS / -4), 3)} mS`],
    [4, 'Z_i', '239 kΩ', m => kOx(m.X.m.Zi)], [5, 'Z_o', '2.4 kΩ', m => kOx(m.X.m.Zo)], [6, 'A_v', '−5.28', m => num2(m.X.m.Av, 3)]],
  glow: { 1: ['R1', 'R2', 'RE'], 2: ['Q'], 3: ['R1', 'R2', 'Gm'], 4: ['R1', 'R2'], 5: ['RC'], 6: ['Gm', 'RC'] },
  badge: (k, m) => [null, 'V_G = 1.82 V, Q ≈ (−1.8 V, 2.4 mA)', 'g_m = 4 mS (1 − 1.8/4) = 2.2 mS', ['C_S ลัด R_S: วงจรเหมือนไบแอสคงที่', 'C_S shorts R_S: the circuit is like fixed bias'], `Z_i = R_1 ‖ R_2 = ${kOx(m.X.m.Zi)}`, `Z_o = R_D = ${kOx(m.X.m.Zo)}`, `A_v = −g_mR_D = ${num2(m.X.m.Av, 3)}`][k] ?? null,
  steps: () => [
    step(t('<b>จุดทำงาน</b> (Example 7.4, หน้า 5.5): ตัวแบ่งแรงดันให้ \\(V_G\\) แล้วเส้นไบแอส \\(V_{GS} = V_G - I_DR_S\\) ตัดเส้นโค้งของ Shockley', '<b>The operating point</b> (Example 7.4, page 5.5): the divider gives \\(V_G\\), then the bias line \\(V_{GS} = V_G - I_DR_S\\) meets Shockley\'s curve'),
      block([R`V_G &= \frac{R_2V_{DD}}{R_1 + R_2} = \frac{(270\ \text{k}\Omega)(16\ \text{V})}{2.37\ \text{M}\Omega} = 1.82\ \text{V},\quad V_{GSQ} \cong -1.8\ \text{V},\quad I_{DQ} \cong 2.4\ \text{mA}`]),
      t('บทที่ 8 ไม่มีตัวอย่างของวงจรนี้ หน้านี้ใช้ค่าของ Example 7.4 ซึ่งตำรานำมาจำลองด้วย PSpice ในหัวข้อ 8.19 (รูป 8.63) แก้ตรง ๆ ได้ −1.802 V, 2.416 mA', 'Chapter 8 has no example of this circuit; this page uses the values of Example 7.4, which the book simulates with PSpice in section 8.19 (Fig. 8.63). Solving exactly gives −1.802 V and 2.416 mA.')),
    step(t('<b>\\(g_m\\)</b>', '<b>\\(g_m\\)</b>'), block([R`g_{m0} &= \frac{2(8\ \text{mA})}{4\ \text{V}} = 4\ \text{mS},\quad g_m = 4\ \text{mS}\left(1 - \frac{-1.8}{-4}\right) = \boxed{2.2\ \text{mS}}`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 8.23): \\(R_1\\) และ \\(R_2\\) ต่างลงกราวด์ของ ac จึงขนานกันที่เกต \\(C_S\\) ลัด \\(R_S\\)', '<b>The ac equivalent circuit</b> (Fig. 8.23): \\(R_1\\) and \\(R_2\\) both go to ac ground, in parallel at the gate; \\(C_S\\) shorts \\(R_S\\)'),
      block([R`V_{gs} &= V_i`])),
    step(t('<b>\\(Z_i\\)</b> (สมการ 8.28): เกตไม่กินกระแส อิมพีแดนซ์ขาเข้าคือตัวแบ่งแรงดันเท่านั้น', '<b>\\(Z_i\\)</b> (Eq. 8.28): the gate takes no current, so the input impedance is just the divider'),
      block([R`Z_i &= R_1 \parallel R_2 = 2.1\ \text{M}\Omega \parallel 270\ \text{k}\Omega = \boxed{239\ \text{k}\Omega}`]),
      t('ต่ำกว่าไบแอสคงที่ (1 MΩ) เพราะ \\(R_2\\) แต่ยังสูงกว่าวงจร BJT หลายร้อยเท่า', 'Lower than fixed bias (1 MΩ) because of \\(R_2\\), yet hundreds of times above a BJT stage.')),
    step(t('<b>\\(Z_o\\)</b> (สมการ 8.30, \\(r_d = \\infty\\))', '<b>\\(Z_o\\)</b> (Eq. 8.30, \\(r_d = \\infty\\))'), block([R`Z_o &= R_D = \boxed{2.4\ \text{k}\Omega}`])),
    step(t('<b>\\(A_v\\)</b> (สมการ 8.32)', '<b>\\(A_v\\)</b> (Eq. 8.32)'), block([R`A_v &= -g_mR_D = -(2.2\ \text{mS})(2.4\ \text{k}\Omega) = \boxed{-5.28}`]),
      t('PSpice ของตำราได้ 5.24 (หัวข้อ 8.19) ภาพจำลองของหน้านี้ได้ −5.28 จาก \\(g_m\\) = 2.198 mS', 'The book\'s PSpice run gets 5.24 (section 8.19); this page\'s simulator gets −5.28 from \\(g_m\\) = 2.198 mS.')) ],
  ask: () => ({ fields: [num('g<sub>m</sub> (mS) =', 2.2, { tol: 0.015 }), num('Z<sub>i</sub> (kΩ) =', 239, { tol: 1.5 }), num('A<sub>v</sub> =', -5.28, { tol: 0.04 })] }),
  answer: () => t('\\(V_{GSQ}\\) ≅ −1.8 V, \\(I_{DQ}\\) ≅ 2.4 mA, \\(g_m\\) = 2.2 mS, \\(Z_i\\) = 239 kΩ, \\(Z_o\\) = 2.4 kΩ, \\(A_v\\) = −5.28 (ค่าของ Boylestad Example 7.4 และรูป 8.63)', '\\(V_{GSQ}\\) ≅ −1.8 V, \\(I_{DQ}\\) ≅ 2.4 mA, \\(g_m\\) = 2.2 mS, \\(Z_i\\) = 239 kΩ, \\(Z_o\\) = 2.4 kΩ, \\(A_v\\) = −5.28 (the values of Boylestad Example 7.4 and Fig. 8.63)') });

/* =====================================================================================================================
   supplement B, page B.3: common gate and source follower */
const O810 = { dev: 'jfet', cfg: 'ef', VDD: 9, RG: 1e6, RS: 2.2e3, idss: 16e-3, vp: -4, C1: 0.05e-6, C2: 0.05e-6, vs: 0.01 };
/* page B.3, section A: the source follower of Example 8.10 with a load R_L: the gain stays near g_mR′/(1 + g_mR′) and Z_o ≈ R_S ‖ 1/g_m */
AC.EX.sf = (ids = {}) => { const ui = MC.ui, pre = ids.pre || 'a', RLS = AC.logspace(50, 100e3, 41);
  const withRL = (sp, RL) => ({ ...sp, parts: sp.parts.map(q => (q.id === 'RL' ? { ...q, value: RL, valText: kO(RL) } : q)) });
  return OP.explorer({ ids, init: { RL: 2200 }, title: t('โหลดของตัวตามแรงดันที่ซอร์ส', 'The load of the source follower'), layout: { cktAspM: 0.5, rowAsp: 0.64, rowMin: 260, cktAspN: 0.62 },
    controls: (p, S, build) => { OP.logSlider(p, pre + 'RL', 'R_L', 50, 100e3, () => S.RL, v => { S.RL = v; }, build, v => kO(v), OP.rndR); },
    spec: S => { const base = AC.tune(AC.amp({ ...O810, rd: 40e3, RL: S.RL })); S.sp = base; S.m = AC.measure(base);
      if (!S.sw) S.sw = RLS.map(RL => { const c = AC.solve(withRL(base, RL)); return [RL, Cx.abs(Cx.div(c.V('o'), c.V('i')))]; });
      return base; },
    after: (v, c, S) => AC.ampTags(v, S.sp),
    side: (ctx, b, bd, c, S) => { const sh = bd.short, g = Math.abs(S.m.Av);
      OP.plot(ctx, b, { x: [50, 100e3], logx: true, y: [0, 1], xt: [100, 1e3, 10e3, 100e3], yt: [0.2, 0.4, 0.6, 0.8, 1], xf: v => kO(v).replace(' ', ''), yf: y => fd(y, 1), xl: 'R_L', yl: '|A_vL|', ml: 34,
        curves: [{ pts: S.sw, color: C.curve, w: 3 }], pts: [{ x: S.RL, y: g, color: PINK, r: 6, label: sh ? '' : fd(g, 3), side: S.RL > 5e3 ? -1 : 1 }],
        title: sh ? t('|A_vL| เทียบ R_L', '|A_vL| against R_L') : t('ต่ำกว่าหนึ่งเสมอ และตกช้า ๆ เมื่อโหลดหนักขึ้น', 'always below one, falling slowly as the load gets heavier') }); },
    waves: [(ctx, b, bd, c, S) => AC.scope(ctx, b, scopeOf(S.m, bd))],
    badge: (c, S) => [[`A_vL = ${fd(S.m.Av, 3)}, Z_o = ${kO(S.m.Zo)}`], 'ok'],
    rows: (c, S) => { const gm = 2 * 16 / 4 * (1 - S.m.Q.VGS / -4) * 1e-3, Rp = 1 / (1 / 40e3 + 1 / 2200 + 1 / S.RL);
      return [['V_GSQ, I_DQ', `${num2(S.m.Q.VGS, 2)} V, ${fd(Math.abs(S.m.Q.ID) * 1e3, 2)} mA`], ['g_m', `${fd(gm * 1e3, 3)} mS`], ['1/g_m', kO(1 / gm)], ['Z_o', kO(S.m.Zo)], ['g_mR′/(1 + g_mR′)', fd(gm * Rp / (1 + gm * Rp), 4)], ['A_vL', fd(S.m.Av, 4)]]; },
    text: (c, S) => t(`ตัวตามแรงดันที่ซอร์สคือคู่แฝดของตัวตามแรงดันที่อิมิตเตอร์ แต่ \\(g_m\\) ของ FET เล็กกว่ามาก \\(Z_o \\cong R_S \\parallel 1/g_m\\) = ${kO(S.m.Zo)} จึงสูงกว่าของ BJT (ราว 12 Ω) หลายสิบเท่า และอัตราขยาย ${fd(S.m.Av, 3)} ไม่ถึง 0.99 แม้ไม่มีโหลด`,
      `The source follower is the twin of the emitter follower, but a FET's \\(g_m\\) is much smaller: \\(Z_o \\cong R_S \\parallel 1/g_m\\) = ${kO(S.m.Zo)} is tens of times higher than a BJT's (about 12 Ω), and the gain ${fd(S.m.Av, 3)} stays below 0.99 even with no load.`) }); };

/* ---------------- page B.3: Example 8.9, common gate (Fig. 8.27) ---------------- */
const O89 = { dev: 'jfet', cfg: 'cb', VDD: 12, RS: 1.1e3, RD: 3.6e3, idss: 10e-3, vp: -4, vs: 0.04 };
DEF.ex89 = ampDef({ o: O89, ro: 20e3, roFrom: 6, p: { gm: 2.25e-3 }, eqFrom: 3, title: ['Example 8.9: มือ | ภาพจำลอง', 'Example 8.9: hand | simulator'],
  rows: [[1, 'V_GSQ', '−2.2 V', m => `${num2(m.X.m.Q.VGS, 3)} V`], [2, 'g_m', '2.25 mS', m => `${fd(5 * (1 - m.X.m.Q.VGS / -4), 3)} mS`], [4, 'Z_i', '0.32 kΩ', m => kOx(m.X.m.Zi)], [5, 'Z_o', '3.6 kΩ', m => kOx(m.X.m.Zo)], [5, 'A_v', '8.1', m => fd(m.X.m.Av, 3)],
    [6, 'Z_i (r_d)', '0.35 kΩ', m => kOx(m.Xr.m.Zi)], [6, 'Z_o (r_d)', '3.05 kΩ', m => kOx(m.Xr.m.Zo)], [6, 'A_v (r_d)', '7.02', m => fd(m.Xr.m.Av, 3)], [6, 'V_o (r_d)', '280.8 mV', m => `${fd(m.Xr.m.Av * 40, 1)} mV`]],
  glow: { 1: ['RE'], 2: ['Q'], 3: ['Gm'], 4: ['RE', 'Gm'], 5: ['RC', 'Gm'], 6: ['ro', 'RC'] },
  badge: (k, m) => [null, 'V_GSQ ≈ −2.2 V, I_DQ ≈ 2.03 mA', 'g_m = 5 mS (1 − 2.2/4) = 2.25 mS', ['เกตเป็นกราวด์: V_gs = −V_i', 'the gate is ground: V_gs = −V_i'], `Z_i = R_S ‖ 1/g_m = ${kOx(m.X.m.Zi)}`, `A_v = g_mR_D = ${fd(m.X.m.Av, 2)}`, `r_d = 20 kΩ: A_v = ${fd(m.Xr.m.Av, 2)}`][k] ?? null,
  steps: () => [
    step(t('<b>จุดทำงาน</b> (รูป 8.27): วงจรนี้วาดจนดูไม่ออกว่าเป็นเกตร่วม เกตต่อกราวด์ตรง ๆ สัญญาณเข้าที่ซอร์สผ่านตัวเก็บประจุ และ \\(R_S\\) ทำไบแอสตัวเอง ตำราให้จุดทำงานมาเลย', '<b>The operating point</b> (Fig. 8.27): the circuit is drawn so that it does not look like a common gate at first: the gate is tied to ground, the signal enters the source through a capacitor, and \\(R_S\\) gives self bias. The book gives the operating point'),
      block([R`V_{GSQ} &= -2.2\ \text{V},\quad I_{DQ} = 2.03\ \text{mA}`]), t('แก้สมการตรง ๆ ได้ −2.208 V, 2.007 mA (ภาพจำลอง) \\(V_{DS}\\) = 2.57 V มากกว่า \\(V_{GS} - V_P\\) = 1.79 V จึงอยู่ในย่านอิ่มตัว', 'Solving exactly gives −2.208 V and 2.007 mA (simulator); \\(V_{DS}\\) = 2.57 V exceeds \\(V_{GS} - V_P\\) = 1.79 V, so it is in saturation.')),
    step(t('<b>\\(g_m\\) และ \\(r_d\\)</b>', '<b>\\(g_m\\) and \\(r_d\\)</b>'), block([R`g_{m0} &= \frac{2(10\ \text{mA})}{4\ \text{V}} = 5\ \text{mS},\quad g_m = 5\ \text{mS}\left(1 - \frac{-2.2}{-4}\right) = \boxed{2.25\ \text{mS}},\quad r_d = \frac{1}{50\ \mu\text{S}} = 20\ \text{k}\Omega`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 8.25–8.26): เกตเป็นกราวด์ แรงดันขาเข้าที่ซอร์สจึงเป็น \\(V_{gs} = -V_i\\) แหล่งกระแส \\(g_mV_{gs}\\) อยู่ระหว่างเดรนกับซอร์ส กระแสสัญญาณที่เข้าทางซอร์สไหลทะลุ FET ออกที่เดรน', '<b>The ac equivalent circuit</b> (Figs. 8.25–8.26): the gate is ground, so the input voltage at the source makes \\(V_{gs} = -V_i\\); the current source \\(g_mV_{gs}\\) sits between drain and source, and the signal current that enters the source passes through the FET to the drain'),
      block([R`V_{gs} &= -V_i`])),
    step(t('<b>\\(Z_i\\) เมื่อละ \\(r_d\\)</b> (สมการ 8.35): ที่ซอร์ส กระแส \\(g_mV_i\\) ไหลเข้า FET เหมือนตัวต้านทาน \\(1/g_m\\) ขนานกับ \\(R_S\\)', '<b>\\(Z_i\\) without \\(r_d\\)</b> (Eq. 8.35): at the source a current \\(g_mV_i\\) flows into the FET, as through a resistor \\(1/g_m\\) in parallel with \\(R_S\\)'),
      block([R`Z_i &= R_S \parallel \frac{1}{g_m} = 1.1\ \text{k}\Omega \parallel 444\ \Omega = \boxed{0.32\ \text{k}\Omega}`]),
      t('ต่ำเหมือนวงจรเบสร่วม ตำราพิมพ์ 0.31 kΩ จากการปัด', 'Low, like a common base; the book prints 0.31 kΩ from rounding.')),
    step(t('<b>\\(Z_o\\) และ \\(A_v\\) เมื่อละ \\(r_d\\)</b> (สมการ 8.37, 8.39): กระแส \\(g_mV_i\\) ที่ไหลเข้าซอร์สออกที่เดรนแล้วไหลผ่าน \\(R_D\\) ขาออกจึงไม่กลับเฟส', '<b>\\(Z_o\\) and \\(A_v\\) without \\(r_d\\)</b> (Eqs. 8.37, 8.39): the current \\(g_mV_i\\) that enters the source leaves at the drain and flows through \\(R_D\\), so the output is not inverted'),
      block([R`Z_o &= R_D = 3.6\ \text{k}\Omega,\quad A_v = g_mR_D = (2.25\ \text{mS})(3.6\ \text{k}\Omega) = \boxed{8.1},\quad V_o = 324\ \text{mV}`])),
    step(t('<b>รวม \\(r_d\\) = 20 kΩ</b> (สมการ 8.34, 8.36, 8.38): \\(r_d\\) น้อยกว่า \\(10R_D\\) = 36 kΩ จึงละไม่ได้ \\(r_d\\) เชื่อมเดรนกับซอร์ส ขาออกจึงส่งผลกลับมาที่ขาเข้า', '<b>With \\(r_d\\) = 20 kΩ</b> (Eqs. 8.34, 8.36, 8.38): \\(r_d\\) is below \\(10R_D\\) = 36 kΩ, so it cannot be dropped; it links drain and source, so the output reaches back to the input'),
      block([R`Z_i &= R_S \parallel \frac{r_d + R_D}{1 + g_mr_d} = 1.1\ \text{k}\Omega \parallel 0.51\ \text{k}\Omega = \boxed{0.35\ \text{k}\Omega}`, R`Z_o &= R_D \parallel r_d = \boxed{3.05\ \text{k}\Omega}`, R`A_v &= \frac{g_mR_D + R_D/r_d}{1 + R_D/r_d} = \frac{8.1 + 0.18}{1 + 0.18} = \boxed{7.02},\quad V_o = 280.8\ \text{mV}`])) ],
  ask: () => ({ fields: [num2a('Z<sub>i</sub> ละ r<sub>d</sub> (kΩ) =', 0.317, 0.31, 0.008), num2a('A<sub>v</sub> ละ r<sub>d</sub> =', 8.1, 8.06, 0.05), num2a('A<sub>v</sub> รวม r<sub>d</sub> =', 7.02, 6.99, 0.04)],
    check: v => (v[1] < 0 || v[2] < 0 ? t('เกตร่วมไม่กลับเฟส: A<sub>v</sub> เป็นบวก', 'A common gate does not invert: A<sub>v</sub> is positive.') : '') }),
  answer: () => t('\\(g_m\\) = 2.25 mS, \\(r_d\\) = 20 kΩ · ละ \\(r_d\\): \\(Z_i\\) = 0.32 kΩ, \\(Z_o\\) = 3.6 kΩ, \\(A_v\\) = 8.1 (\\(V_o\\) = 324 mV) · รวม \\(r_d\\): \\(Z_i\\) = 0.35 kΩ, \\(Z_o\\) = 3.05 kΩ, \\(A_v\\) = 7.02 (\\(V_o\\) = 280.8 mV) (Boylestad Example 8.9)', '\\(g_m\\) = 2.25 mS, \\(r_d\\) = 20 kΩ · without \\(r_d\\): \\(Z_i\\) = 0.32 kΩ, \\(Z_o\\) = 3.6 kΩ, \\(A_v\\) = 8.1 (\\(V_o\\) = 324 mV) · with \\(r_d\\): \\(Z_i\\) = 0.35 kΩ, \\(Z_o\\) = 3.05 kΩ, \\(A_v\\) = 7.02 (\\(V_o\\) = 280.8 mV) (Boylestad Example 8.9)') });

/* ---------------- page B.3: Example 8.10, source follower (Fig. 8.32) ---------------- */
DEF.ex810 = ampDef({ o: O810, ro: 40e3, roFrom: 6, p: { gm: 2.28e-3 }, eqFrom: 3, title: ['Example 8.10: มือ | ภาพจำลอง', 'Example 8.10: hand | simulator'],
  rows: [[1, 'V_GSQ', '−2.86 V', m => `${num2(m.X.m.Q.VGS, 3)} V`], [1, 'I_DQ', '1.30 mA', m => mAx(Math.abs(m.X.m.Q.ID))], [2, 'g_m', '2.28 mS', m => `${fd(8 * (1 - m.X.m.Q.VGS / -4), 3)} mS`], [4, 'Z_i', '1 MΩ', m => kOx(m.X.m.Zi)],
    [5, 'Z_o', '365.7 Ω', m => kOx(m.X.m.Zo)], [5, 'A_v', '0.834', m => fd(m.X.m.Av, 4)], [6, 'Z_o (r_d)', '362.4 Ω', m => kOx(m.Xr.m.Zo)], [6, 'A_v (r_d)', '0.826', m => fd(m.Xr.m.Av, 4)]],
  glow: { 1: ['RG', 'RE'], 2: ['Q'], 3: ['Gm', 'RE'], 4: ['RB'], 5: ['RE', 'Gm'], 6: ['ro', 'RE'] },
  badge: (k, m) => [null, ['V_GSQ = −2.86 V, I_DQ = 1.30 mA (ตำราพิมพ์ 4.56 mA)', 'V_GSQ = −2.86 V, I_DQ = 1.30 mA (the book prints 4.56 mA)'], 'g_m = 8 mS (1 − 2.86/4) = 2.28 mS', ['เดรนเป็นกราวด์ ขาออกที่ซอร์ส', 'the drain is ground, the output at the source'], `Z_i = R_G = ${kOx(m.X.m.Zi)}`, `Z_o = R_S ‖ 1/g_m = ${kOx(m.X.m.Zo)}`, `r_d = 40 kΩ: A_v = ${fd(m.Xr.m.Av, 3)}`][k] ?? null,
  steps: () => [
    step(t('<b>จุดทำงาน</b> (รูป 8.32): เดรนต่อ +9 V ตรง ๆ \\(R_S\\) ทำไบแอสตัวเอง ตำราให้ \\(V_{GSQ}\\) = −2.86 V', '<b>The operating point</b> (Fig. 8.32): the drain goes straight to +9 V and \\(R_S\\) gives self bias; the book gives \\(V_{GSQ}\\) = −2.86 V'),
      block([R`I_{DQ} &= 16\ \text{mA}\left(1 - \frac{-2.86}{-4}\right)^2 = 1.30\ \text{mA} = \frac{2.86\ \text{V}}{2.2\ \text{k}\Omega}`]),
      t('<b>ตำราพิมพ์ \\(I_{DQ}\\) = 4.56 mA</b> ซึ่งเป็นไปไม่ได้: 4.56 mA ผ่าน 2.2 kΩ ต้องใช้ 10 V จากแหล่ง 9 V ค่าที่ถูกคือ 1.30 mA ผลทาง ac ไม่เปลี่ยน เพราะ \\(g_m\\) คำนวณจาก \\(V_{GSQ}\\)', '<b>The book prints \\(I_{DQ}\\) = 4.56 mA</b>, which is impossible: 4.56 mA through 2.2 kΩ would need 10 V from a 9 V supply. The correct value is 1.30 mA; the ac results do not change, because \\(g_m\\) is computed from \\(V_{GSQ}\\).')),
    step(t('<b>\\(g_m\\) และ \\(r_d\\)</b>', '<b>\\(g_m\\) and \\(r_d\\)</b>'), block([R`g_{m0} &= \frac{2(16\ \text{mA})}{4\ \text{V}} = 8\ \text{mS},\quad g_m = 8\ \text{mS}\left(1 - \frac{-2.86}{-4}\right) = \boxed{2.28\ \text{mS}},\quad r_d = \frac{1}{25\ \mu\text{S}} = 40\ \text{k}\Omega`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 8.30–8.31): เดรนอยู่ที่กราวด์ของ ac ขาออกคือซอร์ส แรงดันที่คุม FET คือ \\(V_{gs} = V_i - V_o\\) ซึ่งเล็กกว่า \\(V_i\\) มาก', '<b>The ac equivalent circuit</b> (Figs. 8.30–8.31): the drain is at ac ground and the output is the source, so the voltage that controls the FET is \\(V_{gs} = V_i - V_o\\), much smaller than \\(V_i\\)'),
      block([R`V_o &= g_mV_{gs}(R_S) = g_m(V_i - V_o)R_S`])),
    step(t('<b>\\(Z_i\\)</b> (สมการ 8.40)', '<b>\\(Z_i\\)</b> (Eq. 8.40)'), block([R`Z_i &= R_G = \boxed{1\ \text{M}\Omega}`])),
    step(t('<b>\\(Z_o\\) และ \\(A_v\\) เมื่อละ \\(r_d\\)</b> (สมการ 8.42, 8.44)', '<b>\\(Z_o\\) and \\(A_v\\) without \\(r_d\\)</b> (Eqs. 8.42, 8.44)'),
      block([R`Z_o &= R_S \parallel \frac{1}{g_m} = 2.2\ \text{k}\Omega \parallel 438.6\ \Omega = \boxed{365.7\ \Omega}`, R`A_v &= \frac{g_mR_S}{1 + g_mR_S} = \frac{5.02}{6.02} = \boxed{0.834}`]),
      t('อัตราขยายต่ำกว่าหนึ่งและไม่กลับเฟส เหมือนตัวตามแรงดันที่อิมิตเตอร์ แต่ \\(Z_o\\) สูงกว่ามากเพราะ \\(1/g_m\\) ของ FET ใหญ่กว่า \\(r_e\\)', 'A gain below one without inversion, like the emitter follower, but a much higher \\(Z_o\\) because the FET\'s \\(1/g_m\\) is far larger than \\(r_e\\).')),
    step(t('<b>รวม \\(r_d\\) = 40 kΩ</b> (สมการ 8.41, 8.43): \\(r_d\\) ขนานกับ \\(R_S\\) แทบไม่มีผล', '<b>With \\(r_d\\) = 40 kΩ</b> (Eqs. 8.41, 8.43): \\(r_d\\) is in parallel with \\(R_S\\) and hardly matters'),
      block([R`Z_o &= r_d \parallel R_S \parallel \frac{1}{g_m} = 40\ \text{k}\Omega \parallel 2.2\ \text{k}\Omega \parallel 438.6\ \Omega = \boxed{362.4\ \Omega}`, R`A_v &= \frac{g_m(r_d \parallel R_S)}{1 + g_m(r_d \parallel R_S)} = \frac{4.75}{5.75} = \boxed{0.826}`]),
      t('ตำราพิมพ์ 362.52 Ω เพราะปัด \\(r_d \\parallel R_S\\) เป็น 2.09 kΩ (ค่าเต็ม 2.085 kΩ)', 'The book prints 362.52 Ω because it rounds \\(r_d \\parallel R_S\\) to 2.09 kΩ (2.085 kΩ in full).')) ],
  ask: () => ({ fields: [num('g<sub>m</sub> (mS) =', 2.28, { tol: 0.012 }), num2a('Z<sub>o</sub> ละ r<sub>d</sub> (Ω) =', 365.7, 362.4, 3), num2a('A<sub>v</sub> =', 0.834, 0.826, 0.006)],
    check: v => (near(v[1], 2200, 30) ? t('Z<sub>o</sub> คือ R<sub>S</sub> ขนานกับ 1/g<sub>m</sub>', 'Z<sub>o</sub> is R<sub>S</sub> in parallel with 1/g<sub>m</sub>.') : '') }),
  answer: () => t('\\(I_{DQ}\\) = 1.30 mA (ไม่ใช่ 4.56 mA), \\(g_m\\) = 2.28 mS, \\(r_d\\) = 40 kΩ, \\(Z_i\\) = 1 MΩ · ละ \\(r_d\\): \\(Z_o\\) = 365.7 Ω, \\(A_v\\) = 0.834 · รวม \\(r_d\\): \\(Z_o\\) = 362.4 Ω, \\(A_v\\) = 0.826 (Boylestad Example 8.10)', '\\(I_{DQ}\\) = 1.30 mA (not 4.56 mA), \\(g_m\\) = 2.28 mS, \\(r_d\\) = 40 kΩ, \\(Z_i\\) = 1 MΩ · without \\(r_d\\): \\(Z_o\\) = 365.7 Ω, \\(A_v\\) = 0.834 · with \\(r_d\\): \\(Z_o\\) = 362.4 Ω, \\(A_v\\) = 0.826 (Boylestad Example 8.10)') });

/* =====================================================================================================================
   supplement B, page B.4: MOSFET amplifiers and a two-stage FET amplifier */
/* the two MOSFETs of the page: the D-MOSFET of Example 8.11 and the E-MOSFET of Example 8.12 */
const DM = { kind: 'dmos', idss: 6e-3, vp: -3 }, EM = { kind: 'emos', k: 0.24e-3, vt: 3 };
const mosI = (d, v) => (d.kind === 'emos' ? (v > d.vt ? d.k * (v - d.vt) ** 2 : 0) : (v > d.vp ? d.idss * (1 - v / d.vp) ** 2 : 0));   // A
const mosGm = (d, v) => (d.kind === 'emos' ? (v > d.vt ? 2 * d.k * (v - d.vt) : 0) : (v > d.vp ? 2 * d.idss / Math.abs(d.vp) * (1 - v / d.vp) : 0));   // S
AC.mosI = mosI; AC.mosGm = mosGm;
/* the transfer curve of either MOSFET with the tangent at Q (slope g_m); a D-MOSFET's curve runs on past V_GS = 0. OP.plot keeps the I_D
   numbers at the left edge, clear of a curve that climbs on the right of the V_GS = 0 axis */
AC.mosPlot = (ctx, b, bd, o) => { const d = o.dev, e = d.kind === 'emos', vq = o.vgs, iq = mosI(d, vq) * 1e3, gm = mosGm(d, vq) * 1e3, sh = bd.short, h = e ? 1.6 : 0.9, x0 = e ? 2 : -3.5, x1 = e ? 10 : 2, top = e ? 14 : 16;
  OP.plot(ctx, b, { x: [x0, x1], y: [0, top], xt: e ? [2, 4, 6, 8, 10] : [-3, -2, -1, 0, 1, 2], yt: [2, 4, 6, 8, 10, 12, 14, 16].filter(v => v <= top), xf: v => fd(v, 0).replace('-', '−'), yf: v => fd(v, 0), xl: 'V_GS (V)', yl: 'I_D (mA)', ml: 34,
    curves: [{ f: v => mosI(d, v) * 1e3, color: C.curve, w: 3 }, { pts: [[vq - h, iq - h * gm], [vq + h, iq + h * gm]], color: AMBER, w: 2.2, dash: [7, 5] }],
    vl: e ? [{ x: d.vt, label: sh ? '' : 'V_T', color: 'rgba(232,236,247,.4)' }] : [], hl: e ? [] : [{ y: d.idss * 1e3, label: sh ? '' : 'I_DSS', color: 'rgba(232,236,247,.35)' }],
    pts: [{ x: vq, y: iq, color: PINK, r: 6, label: sh ? '' : `g_m = ${fd(gm, 2)} mS`, side: (vq - x0) / (x1 - x0) > 0.55 ? -1 : 1, dy: 18 }], guides: [{ x: vq, y: iq }],
    title: o.title ?? (sh ? t('ความชัน = g_m', 'slope = g_m') : e ? t('E-MOSFET: I_D = k(V_GS − V_T)² เริ่มที่ V_T', 'E-MOSFET: I_D = k(V_GS − V_T)², starting at V_T') : t('D-MOSFET: เส้นของช็อกลีย์เลย V_GS = 0 ต่อไปได้', 'D-MOSFET: Shockley\'s curve goes on past V_GS = 0')) });
  return gm; };
/* g_m against V_GS: a straight line from zero at V_P (V_T) */
AC.mosGmLine = (ctx, b, bd, o) => { const d = o.dev, e = d.kind === 'emos', x0 = e ? 2 : -3.5, x1 = e ? 10 : 2, top = e ? 4 : 7, gm0 = e ? null : mosGm(d, 0) * 1e3;
  OP.plot(ctx, b, { x: [x0, x1], y: [0, top], xt: e ? [2, 4, 6, 8, 10] : [-3, -2, -1, 0, 1, 2], yt: Array.from({ length: top }, (_, k) => k + 1), xf: v => fd(v, 0).replace('-', '−'), xl: 'V_GS (V)', yl: 'g_m (mS)', ml: 34,
    curves: [{ f: v => mosGm(d, v) * 1e3, color: C.curve, w: 3 }], hl: gm0 ? [{ y: gm0, color: 'rgba(232,236,247,.35)', label: bd.short ? '' : `g_m0 = ${fd(gm0, 2)} mS` }] : [],
    pts: [{ x: o.vgs, y: mosGm(d, o.vgs) * 1e3, color: PINK, r: 6 }],
    title: bd.short ? 'g_m(V_GS)' : e ? t('g_m = 2k(V_GS − V_T): ศูนย์ที่ V_T แล้วเพิ่มเป็นเส้นตรง', 'g_m = 2k(V_GS − V_T): zero at V_T, then a straight line') : t('g_m = g_m0(1 − V_GS/V_P): เกิน g_m0 เมื่อ V_GS > 0', 'g_m = g_m0(1 − V_GS/V_P): above g_m0 once V_GS > 0') }); };
/* the circuit beside them: the MOSFET with its gate held at V_GS by V_GG through R_G (V_GG turns round for a positive gate) */
const mosSpec = (d, vgs) => AC.amp({ dev: d.kind, cfg: 'fixed', VDD: 20, RG: 1e6, VGG: -vgs, RD: 680, ...(d.kind === 'emos' ? { k: d.k, vt: d.vt } : { idss: d.idss, vp: d.vp }), vs: 0.05, qText: '' });
AC.EX.mos = (ids = {}) => { const ui = MC.ui, pre = ids.pre || 'a'; let sd = null, se = null;
  const vis = S => { sd.block.style.display = S.kind === 'dmos' ? '' : 'none'; se.block.style.display = S.kind === 'emos' ? '' : 'none'; };
  return OP.explorer({ ids, init: { kind: 'dmos', vd: 0.35, ve: 6.4 }, title: t('MOSFET สองชนิดและจุดทำงาน', 'Two kinds of MOSFET and the operating point'), layout: { cktAspM: 0.44, rowAsp: 0.7, rowMin: 270, cktAspN: 0.56 },
    controls: (p, S, build) => {
      ui.radio(p, [{ id: pre + 'd', label: t('ดีพลีชัน (D)', 'depletion (D)'), on: S.kind === 'dmos' }, { id: pre + 'e', label: t('เอนแฮนซ์เมนต์ (E)', 'enhancement (E)'), on: S.kind === 'emos' }], id => { S.kind = id === pre + 'e' ? 'emos' : 'dmos'; vis(S); build(); });
      sd = ui.slider(p, { id: pre + 'VD', label: 'V_GS', min: -2.8, max: 1.5, step: 0.05, value: S.vd, fmt: v => `${fd(v, 2).replace('-', '−')} V`, oninput: v => { S.vd = v; build(); } });
      se = ui.slider(p, { id: pre + 'VE', label: 'V_GS', min: 3.2, max: 9, step: 0.05, value: S.ve, fmt: v => `${fd(v, 2)} V`, oninput: v => { S.ve = v; build(); } });
      vis(S); },
    spec: S => { S.d = S.kind === 'emos' ? EM : DM; S.v = S.kind === 'emos' ? S.ve : S.vd; const sp = mosSpec(S.d, S.v); S.sp = sp; S.m = AC.measure(sp); return sp; },
    after: (v, c, S) => AC.ampTags(v, S.sp, { inText: 'v_gs' }),
    side: (ctx, b, bd, c, S) => { AC.mosPlot(ctx, b, bd, { dev: S.d, vgs: S.v }); },
    waves: [(ctx, b, bd, c, S) => AC.mosGmLine(ctx, b, bd, { dev: S.d, vgs: S.v })],
    badge: (c, S) => { const gm = mosGm(S.d, S.v) * 1e3, up = S.kind === 'dmos' && S.v > 0;
      return [[`g_m = ${fd(gm, 3)} mS ที่ V_GS = ${fd(S.v, 2)} V${up ? ' (> g_m0)' : ''}`, `g_m = ${fd(gm, 3)} mS at V_GS = ${fd(S.v, 2)} V${up ? ' (> g_m0)' : ''}`], 'ok']; },
    rows: (c, S) => { const d = S.d, id = mosI(d, S.v) * 1e3, gm = mosGm(d, S.v) * 1e3, q = S.m.Q, gsim = Cx.abs(c.I('RC')) / Cx.abs(Cx.sub(c.V('b'), c.V('e'))) * 1e3;
      return (S.kind === 'emos' ? [['I_D = k(V_GS − V_T)²', `${fd(id, 3)} mA`], ['g_m = 2k(V_GS − V_T)', `${fd(gm, 3)} mS`], ['2√(kI_D)', `${fd(2 * Math.sqrt(d.k * id * 1e-3) * 1e3, 3)} mS`]]
        : [['I_D', `${fd(id, 3)} mA`], ['g_m0 = 2I_DSS/|V_P|', `${fd(mosGm(d, 0) * 1e3, 3)} mS`], ['g_m = g_m0(1 − V_GS/V_P)', `${fd(gm, 3)} mS`]])
        .concat([[t('ภาพจำลอง i_d/v_gs', 'simulator i_d/v_gs'), `${fd(gsim, 3)} mS`], ['V_DS', `${fd(q.VDS, 2)} V`]]); },
    text: (c, S) => { const d = S.d, id = mosI(d, S.v) * 1e3, gm = mosGm(d, S.v) * 1e3;
      if (S.kind === 'emos') return t(`E-MOSFET ไม่มีช่องนำไฟฟ้าจนกว่า \\(V_{GS}\\) จะเกิน \\(V_T\\) = 3 V ที่ \\(V_{GS}\\) = ${fd(S.v, 2)} V กระแส \\(I_D = k(V_{GS} - V_T)^2\\) = ${fd(id, 2)} mA และ \\(g_m = 2k(V_{GS} - V_T)\\) = ${fd(gm, 2)} mS (สมการ 8.48) \\(g_m\\) เพิ่มเป็นเส้นตรงตาม \\(V_{GS}\\) ไม่มีเพดาน \\(g_{m0}\\) แบบ JFET`,
        `An E-MOSFET has no channel until \\(V_{GS}\\) exceeds \\(V_T\\) = 3 V. At \\(V_{GS}\\) = ${fd(S.v, 2)} V the current is \\(I_D = k(V_{GS} - V_T)^2\\) = ${fd(id, 2)} mA and \\(g_m = 2k(V_{GS} - V_T)\\) = ${fd(gm, 2)} mS (Eq. 8.48). \\(g_m\\) rises in a straight line with \\(V_{GS}\\), with no \\(g_{m0}\\) ceiling as in a JFET.`);
      return S.v > 0 ? t(`\\(V_{GS}\\) = +${fd(S.v, 2)} V เป็นบวก: D-MOSFET ทำงานในโหมดเอนแฮนซ์เมนต์ได้ กระแส ${fd(id, 2)} mA เกิน \\(I_{DSS}\\) = 6 mA และ \\(g_m\\) = ${fd(gm, 2)} mS มากกว่า \\(g_{m0}\\) = 4 mS ด้วย สูตรเดียวกับ JFET ใช้ต่อได้ทั้งสองฝั่งของศูนย์ (หัวข้อ 8.8) JFET ทำแบบนี้ไม่ได้ เพราะรอยต่อที่เกตจะนำไฟฟ้า`,
        `\\(V_{GS}\\) = +${fd(S.v, 2)} V is positive: a D-MOSFET can run in the enhancement mode. The current, ${fd(id, 2)} mA, exceeds \\(I_{DSS}\\) = 6 mA, and \\(g_m\\) = ${fd(gm, 2)} mS is above \\(g_{m0}\\) = 4 mS too. The JFET formula holds on both sides of zero (section 8.8). A JFET cannot do this: its gate junction would conduct.`)
        : t(`\\(V_{GS}\\) = ${fd(S.v, 2)} V ติดลบ: D-MOSFET ทำงานเหมือน JFET ทุกประการ กระแส ${fd(id, 2)} mA และ \\(g_m = g_{m0}(1 - V_{GS}/V_P)\\) = ${fd(gm, 2)} mS เลื่อน \\(V_{GS}\\) ขึ้นเลยศูนย์ดู \\(g_m\\) เกิน \\(g_{m0}\\)`,
          `\\(V_{GS}\\) = ${fd(S.v, 2)} V is negative: the D-MOSFET behaves exactly like a JFET, with ${fd(id, 2)} mA and \\(g_m = g_{m0}(1 - V_{GS}/V_P)\\) = ${fd(gm, 2)} mS. Move \\(V_{GS}\\) past zero and watch \\(g_m\\) exceed \\(g_{m0}\\).`); } }); };

/* ---------------- page B.4: Example 8.11, D-MOSFET voltage divider (Figs. 8.34–8.35; dc from Example 7.7) ----------------
   The book's values (V_DD = 18 V, R_1 = 110 MΩ) leave the MOSFET 0.17 V inside the ohmic region, so the book's answers do not hold for its own
   circuit. The page corrects them to V_DD = 24 V, R_1 = 150 MΩ (the same V_G = 1.5 V, hence the same Q-point) and runs the book's circuit last */
const O811 = { dev: 'dmos', cfg: 'vdb', VDD: 24, R1: 150e6, R2: 10e6, RD: 1.8e3, RS: 150, CS: true, CSv: 100e-6, idss: 6e-3, vp: -3, rd: 100e3, vs: 0.01 },
  O811b = { ...O811, VDD: 18, R1: 110e6 };
DEF.ex811 = ampDef({ o: O811, p: { gm: 4.47e-3, rd: 100e3 }, eqFrom: 4, alt: { o: O811b, from: 8, real: true }, title: ['Example 8.11 (ค่าที่แก้แล้ว): มือ | ภาพจำลอง', 'Example 8.11 (corrected): hand | simulator'],
  rows: [[1, 'V_GSQ', '0.35 V', m => `${num2(m.X.m.Q.VGS, 3)} V`], [1, 'I_DQ', '7.6 mA', m => mAx(Math.abs(m.X.m.Q.ID))], [1, 'V_DSQ', '9.18 V', m => `${fd(m.X.m.Q.VDS, 2)} V`],
    [2, 'g_m', '4.47 mS', m => `${fd(mosGm(DM, m.X.m.Q.VGS) * 1e3, 3)} mS`], [5, 'Z_i', '9.375 MΩ', m => kOx(m.X.m.Zi, 4)], [6, 'Z_o', '1.77 kΩ', m => kOx(m.X.m.Zo)], [7, 'A_v', '−7.90', m => num2(m.X.m.Av, 2)],
    [8, t('ค่าตำรา: V_DSQ', 'book values: V_DSQ'), '3.18 V', m => `${fd(m.A.m.Q.VDS, 2)} V`], [8, t('ค่าตำรา: A_v', 'book values: A_v'), '−8.05', m => num2(m.A.m.Av, 2)]],
  glow: { 1: ['VCC', 'R1', 'R2', 'RC', 'RE'], 2: ['Q'], 3: ['Q'], 4: ['Gm', 'ro'], 5: ['R1', 'R2'], 6: ['ro', 'RC'], 7: ['Gm', 'ro', 'RC'], 8: ['VCC', 'R1'] },
  badge: (k, m) => [null, [`V_DS = ${fd(m.X.m.Q.VDS, 2)} V ≥ V_GS − V_P = ${fd(m.X.m.Q.VGS + 3, 2)} V: ย่านอิ่มตัว`, `V_DS = ${fd(m.X.m.Q.VDS, 2)} V ≥ V_GS − V_P = ${fd(m.X.m.Q.VGS + 3, 2)} V: saturation`],
    'g_m = 4.47 mS > g_m0 = 4 mS', 'r_d = 1/g_os = 100 kΩ', ['วงจรเดียวกับ JFET แบบแบ่งแรงดัน', 'the same circuit as the JFET divider'], `Z_i = R_1 ‖ R_2 = ${kOx(m.X.m.Zi)}`, `Z_o = r_d ‖ R_D = ${kOx(m.X.m.Zo)}`, `A_v = −g_m(r_d ‖ R_D): ${num2(m.X.m.Av, 2)}`,
    [`ค่าตำรา 18 V: V_DS = ${fd(m.A.m.Q.VDS, 2)} V < ${fd(m.A.m.Q.VGS + 3, 2)} V ย่านโอห์มมิก, A_v = ${num2(m.A.m.Av, 2)}`, `book values, 18 V: V_DS = ${fd(m.A.m.Q.VDS, 2)} V < ${fd(m.A.m.Q.VGS + 3, 2)} V, ohmic, A_v = ${num2(m.A.m.Av, 2)}`]][k] ?? null,
  steps: () => [
    step(t('<b>จุดทำงานและการตรวจย่านอิ่มตัว</b>: วงจร dc คือ Example 7.7 ตัวแบ่งแรงดันให้ \\(V_G\\) = 1.5 V เท่ากับค่าของตำรา จุดทำงานจึงเป็นจุดเดียวกับที่ตำราอ่านจากกราฟ: \\(V_{GSQ}\\) = +0.35 V, \\(I_{DQ}\\) = 7.6 mA ก่อนใช้แบบจำลอง \\(g_m\\) ต้องตรวจว่ามอสเฟตอยู่ในย่านอิ่มตัว (\\(V_{DS} \\ge V_{GS} - V_P\\))', '<b>The operating point and the saturation check</b>: the dc circuit is Example 7.7; the divider gives \\(V_G\\) = 1.5 V, as with the book\'s values, so the operating point is the one the book reads off its graph: \\(V_{GSQ}\\) = +0.35 V, \\(I_{DQ}\\) = 7.6 mA. Before the \\(g_m\\) model can be used, the MOSFET must be in saturation (\\(V_{DS} \\ge V_{GS} - V_P\\))'),
      block([R`V_G &= \frac{10\ \text{M}\Omega}{160\ \text{M}\Omega}(24\ \text{V}) = 1.5\ \text{V}`, R`V_{DS} &= V_{DD} - I_D(R_D + R_S) = 24\ \text{V} - (7.6\ \text{mA})(1.95\ \text{k}\Omega) = \boxed{9.18\ \text{V}}`, R`V_{GS} - V_P &= 0.35\ \text{V} - (-3\ \text{V}) = 3.35\ \text{V} \le V_{DS}`]),
      t('ผ่าน: อยู่ในย่านอิ่มตัว ค่าของตำรา (\\(V_{DD}\\) = 18 V, \\(R_1\\) = 110 MΩ) ให้ \\(V_G\\) และจุดทำงานเดียวกัน แต่ \\(V_{DS}\\) = 18 − 14.82 = 3.18 V ต่ำกว่า 3.35 V จึงไม่ผ่าน (ขั้นที่ 8) แก้สมการตรง ๆ ได้ \\(V_{GSQ}\\) = 0.367 V, \\(I_{DQ}\\) = 7.56 mA (ภาพจำลอง)', 'It passes: the MOSFET is in saturation. The book\'s values (\\(V_{DD}\\) = 18 V, \\(R_1\\) = 110 MΩ) give the same \\(V_G\\) and operating point, but \\(V_{DS}\\) = 18 − 14.82 = 3.18 V is below 3.35 V, so they fail (step 8). Solving exactly gives \\(V_{GSQ}\\) = 0.367 V, \\(I_{DQ}\\) = 7.56 mA (simulator).')),
    step(t('<b>(a) \\(g_m\\)</b>: \\(V_{GS}\\) เป็นบวก มอสเฟตตัวนี้จึงทำงานในโหมดเอนแฮนซ์เมนต์ สูตร \\(g_m\\) ของ JFET ใช้ได้เหมือนเดิม', '<b>(a) \\(g_m\\)</b>: \\(V_{GS}\\) is positive, so this MOSFET runs in the enhancement mode; the JFET formula for \\(g_m\\) still holds'),
      block([R`g_{m0} &= \frac{2I_{DSS}}{|V_P|} = \frac{2(6\ \text{mA})}{3\ \text{V}} = 4\ \text{mS}`, R`g_m &= g_{m0}\left(1 - \frac{V_{GSQ}}{V_P}\right) = 4\ \text{mS}\left(1 - \frac{+0.35\ \text{V}}{-3\ \text{V}}\right) = \boxed{4.47\ \text{mS}}`]),
      t('\\(g_m\\) มากกว่า \\(g_{m0}\\) เพราะ \\(V_{GS}\\) > 0 (ดูส่วน A)', '\\(g_m\\) exceeds \\(g_{m0}\\) because \\(V_{GS}\\) > 0 (see section A).')),
    step(t('<b>(b) \\(r_d\\)</b>', '<b>(b) \\(r_d\\)</b>'), block([R`r_d &= \frac{1}{g_{os}} = \frac{1}{10\ \mu\text{S}} = \boxed{100\ \text{k}\Omega}`])),
    step(t('<b>(c) วงจรสมมูล ac</b> (รูป 8.35): เหมือนวงจรแบ่งแรงดันของ JFET (รูป 8.23) ทุกอย่าง \\(V_{DD}\\) เป็นกราวด์ของ ac \\(R_1\\) กับ \\(R_2\\) จึงขนานกันที่เกต \\(C_S\\) ลัดวงจร \\(R_S\\) ซอร์สจึงอยู่ที่กราวด์ และ \\(g_mV_{gs}\\) ขนานกับ \\(r_d\\) และ \\(R_D\\)', '<b>(c) The ac equivalent circuit</b> (Fig. 8.35): exactly the JFET voltage divider (Fig. 8.23). \\(V_{DD}\\) is an ac ground, so \\(R_1\\) and \\(R_2\\) are in parallel at the gate; \\(C_S\\) shorts \\(R_S\\), so the source is at ground; and \\(g_mV_{gs}\\) is in parallel with \\(r_d\\) and \\(R_D\\).'),
      block([R`V_o &= -g_mV_{gs}(r_d \parallel R_D),\quad V_{gs} = V_i`])),
    step(t('<b>(d) \\(Z_i\\)</b> (สมการ 8.52): เกตไม่กินกระแส เหลือแต่ตัวแบ่งแรงดัน', '<b>(d) \\(Z_i\\)</b> (Eq. 8.52): the gate draws no current, which leaves the divider'),
      block([R`Z_i &= R_1 \parallel R_2 = 150\ \text{M}\Omega \parallel 10\ \text{M}\Omega = \boxed{9.375\ \text{M}\Omega}`]),
      t('ค่าของตำรา (\\(R_1\\) = 110 MΩ) ได้ 9.17 MΩ เป็นผลทาง ac ข้อเดียวที่เปลี่ยนไปเพราะการแก้ค่า', 'The book\'s values (\\(R_1\\) = 110 MΩ) give 9.17 MΩ; it is the only ac result the correction changes.')),
    step(t('<b>(e) \\(Z_o\\)</b> (สมการ 8.53)', '<b>(e) \\(Z_o\\)</b> (Eq. 8.53)'),
      block([R`Z_o &= r_d \parallel R_D = 100\ \text{k}\Omega \parallel 1.8\ \text{k}\Omega = \boxed{1.77\ \text{k}\Omega} \cong R_D`])),
    step(t('<b>(f) \\(A_v\\)</b> (สมการ 8.54–8.55): ซอร์สร่วมกลับเฟส อัตราขยายจึงติดลบ', '<b>(f) \\(A_v\\)</b> (Eqs. 8.54–8.55): a common source inverts, so the gain is negative'),
      block([R`A_v &= -g_m(r_d \parallel R_D) = -(4.47\ \text{mS})(1.77\ \text{k}\Omega) = \boxed{-7.90}`, R`A_v &\cong -g_mR_D = -(4.47\ \text{mS})(1.8\ \text{k}\Omega) = -8.05\quad (r_d \ge 10R_D)`]),
      t('ตำราใช้รูปประมาณได้ −8.05 และพิมพ์ "8.05" โดยตกเครื่องหมายลบ ภาพจำลองได้ราว −7.94 ตรงกับมือ', 'The book uses the approximate form, −8.05, and prints it as "8.05" without its minus sign. The simulator gets about −7.94, matching the hand result.')),
    step(t('<b>ลองค่าของตำรา</b> (\\(V_{DD}\\) = 18 V, \\(R_1\\) = 110 MΩ; ภาพจำลองตอนนี้คือวงจรตามตำรา): จุดทำงานเดิม แต่แรงดันที่เหลือให้มอสเฟตไม่พอ', '<b>Try the book\'s values</b> (\\(V_{DD}\\) = 18 V, \\(R_1\\) = 110 MΩ; the simulation now shows the book\'s circuit): the same operating point, but too little voltage left for the MOSFET'),
      block([R`V_{DS} &= 18\ \text{V} - (7.6\ \text{mA})(1.95\ \text{k}\Omega) = 3.18\ \text{V} < V_{GS} - V_P = 3.35\ \text{V}`]),
      t('ช่องนำไฟฟ้ายังไม่ถูกบีบ (pinch-off) มันทำตัวเหมือนตัวต้านทานราว 8 kΩ ขนานกับ \\(R_D\\) ภาพจำลองจึงได้อัตราขยายแค่ราว −6.3 คำตอบ −8.05 ของตำราใช้ไม่ได้กับวงจรของตำราเอง บทเรียน: ตรวจ \\(V_{DS} \\ge V_{GS} - V_P\\) ทุกครั้งก่อนใช้แบบจำลอง \\(g_m\\)', 'The channel is not pinched off, so it acts like a resistor of about 8 kΩ in parallel with \\(R_D\\): the simulator gets a gain of only about −6.3. The book\'s −8.05 does not hold for the book\'s own circuit. The lesson: always check \\(V_{DS} \\ge V_{GS} - V_P\\) before using the \\(g_m\\) model.')) ],
  ask: () => ({ fields: [num('g<sub>m</sub> (mS) =', 4.47, { tol: 0.02 }), num('Z<sub>i</sub> (MΩ) =', 9.375, { tol: 0.02 }), num2a('A<sub>v</sub> =', -7.90, -8.05, 0.06)],
    check: v => (v[0] > 0 && v[0] < 4.01 ? t('V<sub>GS</sub> เป็นบวก: g<sub>m</sub> ต้องมากกว่า g<sub>m0</sub> = 4 mS', 'V<sub>GS</sub> is positive: g<sub>m</sub> must exceed g<sub>m0</sub> = 4 mS.') : near(v[1], 9.17, 0.02) ? t('9.17 MΩ ใช้ R<sub>1</sub> = 110 MΩ ของตำรา โจทย์นี้ใช้ค่าที่แก้แล้ว 150 MΩ', '9.17 MΩ uses the book\'s R<sub>1</sub> = 110 MΩ; this problem uses the corrected 150 MΩ.') : v[2] > 0 ? t('ซอร์สร่วมกลับเฟส: A<sub>v</sub> ติดลบ', 'A common source inverts: A<sub>v</sub> is negative.') : '') }),
  answer: () => t('\\(V_{DS}\\) = 9.18 V (ย่านอิ่มตัว), \\(g_m\\) = 4.47 mS (> \\(g_{m0}\\) = 4 mS), \\(r_d\\) = 100 kΩ, \\(Z_i\\) = 9.375 MΩ, \\(Z_o\\) = 1.77 kΩ, \\(A_v\\) = −7.90 (รูปประมาณ −8.05) · ค่าของตำรา (18 V, 110 MΩ) ทำให้มอสเฟตอยู่ในย่านโอห์มมิก วงจรจริงได้ราว −6.3 (Boylestad Example 8.11 แก้ค่าแล้ว)',
    '\\(V_{DS}\\) = 9.18 V (saturation), \\(g_m\\) = 4.47 mS (> \\(g_{m0}\\) = 4 mS), \\(r_d\\) = 100 kΩ, \\(Z_i\\) = 9.375 MΩ, \\(Z_o\\) = 1.77 kΩ, \\(A_v\\) = −7.90 (approximate form −8.05) · the book\'s values (18 V, 110 MΩ) leave the MOSFET in the ohmic region, where the real circuit gives about −6.3 (Boylestad Example 8.11, corrected)') });

/* ---------------- page B.4: Example 8.12, E-MOSFET drain feedback (Fig. 8.40; dc from Example 7.10) ---------------- */
const O812 = { dev: 'emos', cfg: 'cf', VDD: 12, RF: 10e6, RD: 2e3, k: 0.24e-3, vt: 3, C1: 1e-6, C2: 1e-6, vs: 0.01 };
DEF.ex812 = ampDef({ o: O812, ro: 50e3, roFrom: 6, p: { gm: 1.63e-3 }, eqFrom: 3, title: ['Example 8.12: ตำรา (แก้แล้ว) | ภาพจำลอง', 'Example 8.12: book (corrected) | simulator'],
  rows: [[1, 'V_GSQ', '6.4 V', m => `${fd(m.X.m.Q.VGS, 3)} V`], [1, 'I_DQ', '2.75 mA', m => mAx(Math.abs(m.X.m.Q.ID))], [2, 'g_m', '1.63 mS', m => `${fd(mosGm(EM, m.X.m.Q.VGS) * 1e3, 3)} mS`],
    [4, 'Z_i', '2.35 MΩ', m => kOx(m.X.m.Zi)], [5, 'Z_o', '2 kΩ', m => kOx(m.X.m.Zo)], [5, 'A_v', '−3.26', m => num2(m.X.m.Av, 3)],
    [6, 'Z_i (r_d)', '2.42 MΩ', m => kOx(m.Xr.m.Zi)], [6, 'Z_o (r_d)', '1.92 kΩ', m => kOx(m.Xr.m.Zo)], [6, 'A_v (r_d)', '−3.13', m => num2(m.Xr.m.Av, 3)]],
  glow: { 1: ['RF', 'RC'], 2: ['Q'], 3: ['RF', 'Gm'], 4: ['RF'], 5: ['RC', 'Gm'], 6: ['ro', 'RF', 'RC'] },
  badge: (k, m) => [null, ['I_G = 0: V_GS = V_DS', 'I_G = 0: V_GS = V_DS'], 'g_m = 2k(V_GS − V_T) = 1.63 mS', ['R_F ต่อเกตกับเดรน', 'R_F joins gate and drain'], `Z_i = R_F/(1 + g_mR_D) = ${kOx(m.X.m.Zi)}`, `A_v ≅ −g_mR_D = ${num2(m.X.m.Av, 2)}`, `r_d = 50 kΩ: A_v = ${num2(m.Xr.m.Av, 2)}`][k] ?? null,
  steps: () => [
    step(t('<b>จุดทำงาน</b> (Example 7.10): \\(k\\) หาจากจุดในแผ่นข้อมูล \\(I_{D(on)}\\) = 6 mA ที่ \\(V_{GS(on)}\\) = 8 V เกตไม่กินกระแส จึงไม่มีแรงดันตกบน \\(R_F\\) และ \\(V_{GS} = V_{DS}\\) เสมอ', '<b>The operating point</b> (Example 7.10): \\(k\\) comes from the data-sheet point \\(I_{D(on)}\\) = 6 mA at \\(V_{GS(on)}\\) = 8 V. The gate draws no current, so nothing drops across \\(R_F\\) and \\(V_{GS} = V_{DS}\\) always'),
      block([R`k &= \frac{I_{D(on)}}{(V_{GS(on)} - V_T)^2} = \frac{6\ \text{mA}}{(8\ \text{V} - 3\ \text{V})^2} = 0.24\ \text{mA/V}^2`, R`V_{GSQ} &= 6.4\ \text{V},\quad I_{DQ} = 2.75\ \text{mA}\ \ (\text{Example 7.10})`]),
      t('ตำราอ่านจากกราฟ แก้สมการ \\(V_{GS} = 12 - 2I_D\\) กับ \\(I_D = k(V_{GS} - 3)^2\\) ตรง ๆ ได้ 6.41 V, 2.79 mA (ภาพจำลอง) และเพราะ \\(V_{DS} = V_{GS} > V_{GS} - V_T\\) วงจรนี้อยู่ในย่านอิ่มตัวเสมอ', 'The book reads its graph; solving \\(V_{GS} = 12 - 2I_D\\) with \\(I_D = k(V_{GS} - 3)^2\\) exactly gives 6.41 V and 2.79 mA (simulator). And since \\(V_{DS} = V_{GS} > V_{GS} - V_T\\), this circuit is always in saturation.')),
    step(t('<b>\\(g_m\\) และ \\(r_d\\)</b> (สมการ 8.48)', '<b>\\(g_m\\) and \\(r_d\\)</b> (Eq. 8.48)'),
      block([R`g_m &= 2k(V_{GSQ} - V_T) = 2(0.24\ \text{mA/V}^2)(6.4\ \text{V} - 3\ \text{V}) = \boxed{1.63\ \text{mS}}`, R`r_d &= \frac{1}{g_{os}} = \frac{1}{20\ \mu\text{S}} = 50\ \text{k}\Omega`])),
    step(t('<b>วงจรสมมูล ac</b> (รูป 8.38): ซอร์สอยู่ที่กราวด์ \\(R_F\\) ต่อจากเกตไปเดรน ขาเข้าและขาออกจึงเชื่อมกันผ่าน \\(R_F\\) กระแสใน \\(R_F\\) ขึ้นกับแรงดันทั้งสองฝั่ง', '<b>The ac equivalent circuit</b> (Fig. 8.38): the source is at ground and \\(R_F\\) runs from gate to drain, so the input and the output are linked through \\(R_F\\); its current depends on the voltages at both ends'),
      block([R`I_i &= \frac{V_i - V_o}{R_F}`])),
    step(t('<b>\\(Z_i\\) เมื่อละ \\(r_d\\)</b> (สมการ 8.50): ขาออกแกว่งกลับเฟส \\(-g_mR_D V_i\\) แรงดันคร่อม \\(R_F\\) จึงเป็น \\(V_i(1 + g_mR_D)\\) \\(R_F\\) ดูเล็กลง \\(1 + g_mR_D\\) เท่า (ปรากฏการณ์ Miller)', '<b>\\(Z_i\\) without \\(r_d\\)</b> (Eq. 8.50): the output swings the other way, \\(-g_mR_D V_i\\), so the voltage across \\(R_F\\) is \\(V_i(1 + g_mR_D)\\): \\(R_F\\) looks \\(1 + g_mR_D\\) times smaller (the Miller effect)'),
      block([R`Z_i &\cong \frac{R_F}{1 + g_mR_D} = \frac{10\ \text{M}\Omega}{1 + (1.63\ \text{mS})(2\ \text{k}\Omega)} = \frac{10\ \text{M}\Omega}{4.26} = \boxed{2.35\ \text{M}\Omega}`]),
      t('<b>ตำราพิมพ์ 2.53 MΩ</b> ซึ่งคำนวณผิด: 10/4.26 = 2.35 ค่าประมาณนี้ต่ำกว่าค่าเต็ม (2.42 MΩ ในขั้นที่ 6) เล็กน้อย', '<b>The book prints 2.53 MΩ</b>, an arithmetic slip: 10/4.26 = 2.35. This approximate value is slightly below the full one (2.42 MΩ in step 6).')),
    step(t('<b>\\(Z_o\\) และ \\(A_v\\) เมื่อละ \\(r_d\\)</b> (สมการ 8.51): \\(R_F\\) = 10 MΩ ใหญ่มากเมื่อเทียบกับ \\(R_D\\)', '<b>\\(Z_o\\) and \\(A_v\\) without \\(r_d\\)</b> (Eq. 8.51): \\(R_F\\) = 10 MΩ is huge next to \\(R_D\\)'),
      block([R`Z_o &= R_F \parallel R_D \cong R_D = \boxed{2\ \text{k}\Omega},\quad A_v \cong -g_mR_D = -(1.63\ \text{mS})(2\ \text{k}\Omega) = \boxed{-3.26}`])),
    step(t('<b>รวม \\(r_d\\) = 50 kΩ</b> (สมการ 8.49–8.51): \\(r_d\\) ขนานกับ \\(R_D\\) ได้ \\(r_d \\parallel R_D\\) = 1.92 kΩ แทน \\(R_D\\) ทุกที่', '<b>With \\(r_d\\) = 50 kΩ</b> (Eqs. 8.49–8.51): \\(r_d\\) is in parallel with \\(R_D\\); use \\(r_d \\parallel R_D\\) = 1.92 kΩ in place of \\(R_D\\) everywhere'),
      block([R`Z_i &= \frac{R_F + r_d \parallel R_D}{1 + g_m(r_d \parallel R_D)} = \frac{10\ \text{M}\Omega + 1.92\ \text{k}\Omega}{1 + (1.63)(1.92)} = \boxed{2.42\ \text{M}\Omega}`, R`Z_o &= R_F \parallel r_d \parallel R_D = \boxed{1.92\ \text{k}\Omega}`, R`A_v &= -g_m(R_F \parallel r_d \parallel R_D) = -(1.63\ \text{mS})(1.92\ \text{k}\Omega) = \boxed{-3.13}`]),
      t('<b>ตำราพิมพ์ −3.21</b> ซึ่งคำนวณผิดอีกจุด: 1.63 × 1.92 = 3.13', '<b>The book prints −3.21</b>, another arithmetic slip: 1.63 × 1.92 = 3.13.')) ],
  ask: () => ({ fields: [num('g<sub>m</sub> (mS) =', 1.63, { tol: 0.012 }), num2a('Z<sub>i</sub> ละ r<sub>d</sub> (MΩ) =', 2.35, 2.345, 0.02), num2a('A<sub>v</sub> รวม r<sub>d</sub> =', -3.13, -3.14, 0.02)],
    check: v => (near(v[1], 2.53, 0.02) ? t('2.53 MΩ คือค่าที่ตำราพิมพ์ผิด: 10 MΩ/4.26 = ?', '2.53 MΩ is the book\'s slip: 10 MΩ/4.26 = ?') : near(v[1], 10, 0.1) ? t('R<sub>F</sub> ดูเล็กลง (1 + g<sub>m</sub>R<sub>D</sub>) เท่า', 'R<sub>F</sub> looks (1 + g<sub>m</sub>R<sub>D</sub>) times smaller.') : near(v[2], -3.21, 0.01) ? t('−3.21 คือค่าที่ตำราพิมพ์ผิด: 1.63 × 1.92 = ?', '−3.21 is the book\'s slip: 1.63 × 1.92 = ?') : '') }),
  answer: () => t('\\(g_m\\) = 1.63 mS, \\(r_d\\) = 50 kΩ · ละ \\(r_d\\): \\(Z_i\\) = 2.35 MΩ (ตำราพิมพ์ 2.53), \\(Z_o\\) = 2 kΩ, \\(A_v\\) = −3.26 · รวม \\(r_d\\): \\(Z_i\\) = 2.42 MΩ, \\(Z_o\\) = 1.92 kΩ, \\(A_v\\) = −3.13 (ตำราพิมพ์ −3.21) (Boylestad Example 8.12)',
    '\\(g_m\\) = 1.63 mS, \\(r_d\\) = 50 kΩ · without \\(r_d\\): \\(Z_i\\) = 2.35 MΩ (the book prints 2.53), \\(Z_o\\) = 2 kΩ, \\(A_v\\) = −3.26 · with \\(r_d\\): \\(Z_i\\) = 2.42 MΩ, \\(Z_o\\) = 1.92 kΩ, \\(A_v\\) = −3.13 (the book prints −3.21) (Boylestad Example 8.12)') });

/* ---------------- page B.4: Example 8.16, two JFET stages in cascade (Fig. 8.48) ---------------- */
const O816 = { dev: 'jfet', VDD: 20, RG: 3.3e6, RD: 2.4e3, RS: 680, CSv: 100e-6, idss: 10e-3, vp: -4, C1: 0.05e-6, Cc: 0.05e-6, C2: 0.05e-6, vs: 0.01 };
let M816 = null;
const mk816 = () => M816 || (M816 = (() => { const sp = AC.tune(AC.amp2(O816)), m = AC.measure(sp), z = AC.dcOf(sp), J1 = z.J('Q1'), J2 = z.J('Q2'), r = (cc, a, b) => Cx.div(cc.V(a), cc.V(b)), sg = q => (q.re < 0 ? -1 : 1) * Cx.abs(q);
  return { sp, m, dc: { ...sp, mode: 'dc', dcFirst: false }, J1, J2, Av1: sg(r(m.c, 'c1', 'i')), Av2: sg(r(m.c, 'o', 'k3')), AvT: sg(r(m.c, 'o', 'i')) }; })());
AC.mk816 = mk816;
DEF.ex816 = { ...LAY, cktAspM: 0.36, cktAspN: 0.42, solvedAt: 1, probe: mk816,
  spec: k => { const m = mk816(); return k <= 1 ? m.dc : m.sp; },
  after: (v, k) => { AC.ampTags(v, mk816().sp); },
  glow: k => ({ 1: ['RG_1', 'RE_1', 'RG_2', 'RE_2'], 2: ['Q1', 'Q2'], 3: ['RC_2'], 4: ['RC_1', 'RG_2'], 5: ['Q1', 'Q2'], 6: ['RG_1', 'RC_2'] })[k] || null,
  badge: k => { const m = mk816(); return [null, bdg(t(`dc เหมือนกันทั้งสองภาค: V_GS = ${num2(m.J1.VGS, 2)} V`, `dc alike in both stages: V_GS = ${num2(m.J1.VGS, 2)} V`)), bdg(`g_m = ${fd(mosGm({ kind: 'jfet', idss: 10e-3, vp: -4 }, m.J1.VGS) * 1e3, 3)} mS (${t('ภาพจำลอง', 'simulator')})`), bdg(`A_v2 = ${num2(m.Av2, 2)}`), bdg(`A_v1 = ${num2(m.Av1, 2)}`),
    bdg(`A_v = ${fd(m.AvT, 1)}: v_o = ${fd(m.AvT * 10, 0)} mV`), bdg(`Z_i = ${kOx(m.m.Zi)}, Z_o = ${kOx(m.m.Zo)}`)][k] ?? null; },
  side: (ctx, b, bd, k) => { const m = mk816(), gm = mosGm({ kind: 'jfet', idss: 10e-3, vp: -4 }, m.J1.VGS) * 1e3,
    rows = [[1, 'V_GSQ', '−1.89 V', `${num2(m.J1.VGS, 3)} V`], [1, 'I_DQ', '2.78 mA', mAx(Math.abs(m.J1.ID))], [2, 'g_m', '2.64 mS', `${fd(gm, 3)} mS`], [3, 'A_v2', '−6.33', num2(m.Av2, 2)], [4, 'A_v1', '−6.32', num2(m.Av1, 2)],
      [5, 'A_v', '40.0', fd(m.AvT, 1)], [5, 'V_o', '400 mV', `${fd(m.AvT * 10, 0)} mV`], [6, 'Z_i', '3.3 MΩ', kOx(m.m.Zi)], [6, 'Z_o', '2.4 kΩ', kOx(m.m.Zo)]];
    tbl(ctx, b, bd, rows.filter(r => k >= r[0]).map(r => r.slice(1)), ['Example 8.16: มือ | ภาพจำลอง', 'Example 8.16: hand | simulator']); },
  waves: [{ draw: (ctx, b, bd, k) => AC.scope(ctx, b, scopeOf(mk816().m, bd, bd.short ? '' : t('v_i = 10 mV (ช่อง 1) กับ v_o (ช่อง 2): ไม่กลับเฟส', 'v_i = 10 mV (channel 1) and v_o (channel 2): not inverted'))) }],
  steps: () => [
    step(t('<b>dc</b>: สองภาคเหมือนกันทุกอย่าง และตัวเก็บประจุคัปปลิงแยกจุดทำงานออกจากกัน แต่ละภาคเป็นไบแอสตัวเอง แทน \\(V_{GS} = -I_DR_S\\) ลงในสมการของช็อกลีย์ (\\(I_D\\) เป็น mA, \\(R_S\\) = 0.68 kΩ)', '<b>dc</b>: the two stages are identical and the coupling capacitor keeps their operating points apart. Each is a self-bias stage: put \\(V_{GS} = -I_DR_S\\) into Shockley\'s equation (\\(I_D\\) in mA, \\(R_S\\) = 0.68 kΩ)'),
      block([R`I_D &= 10\left(1 - \frac{0.68I_D}{4}\right)^2 = 10(1 - 0.17I_D)^2`, R`0 &= 0.289I_D^2 - 4.4I_D + 10\quad\Rightarrow\quad I_{DQ} = \boxed{2.78\ \text{mA}}`, R`V_{GSQ} &= -(2.78\ \text{mA})(0.68\ \text{k}\Omega) = \boxed{-1.89\ \text{V}}`]),
      t('อีกรากหนึ่ง 12.4 mA ให้ \\(V_{GS}\\) = −8.5 V เลย \\(V_P\\) ไปแล้ว จึงใช้ไม่ได้ ตำราอ่านจากกราฟได้ −1.9 V, 2.8 mA (PSpice ในหัวข้อ 8.19 ของตำราได้ −1.89 V, 2.78 mA เท่ากับที่แก้ได้) \\(V_{DS}\\) = 20 − 2.78(3.08) = 11.4 V จึงอยู่ในย่านอิ่มตัว', 'The other root, 12.4 mA, gives \\(V_{GS}\\) = −8.5 V, beyond \\(V_P\\), so it is rejected. The book reads −1.9 V and 2.8 mA off its graph (its own PSpice run in section 8.19 gets −1.89 V and 2.78 mA, as solved here). \\(V_{DS}\\) = 20 − 2.78(3.08) = 11.4 V, so both stages are in saturation.')),
    step(t('<b>\\(g_m\\)</b>', '<b>\\(g_m\\)</b>'), block([R`g_{m0} &= \frac{2(10\ \text{mA})}{4\ \text{V}} = 5\ \text{mS},\quad g_m = 5\ \text{mS}\left(1 - \frac{-1.89}{-4}\right) = \boxed{2.64\ \text{mS}}`]),
      t('ตำราใช้ค่าจากกราฟ −1.9 V และปัดเป็น 2.6 mS', 'The book uses the graph value −1.9 V and rounds to 2.6 mS.')),
    step(t('<b>\\(A_{v_2}\\)</b>: ภาค 2 ไม่มีโหลด \\(C_S\\) ลัดวงจร \\(R_S\\)', '<b>\\(A_{v_2}\\)</b>: stage 2 has no load and \\(C_S\\) shorts \\(R_S\\)'),
      block([R`A_{v_2} &= -g_mR_D = -(2.64\ \text{mS})(2.4\ \text{k}\Omega) = \boxed{-6.33}`])),
    step(t('<b>\\(A_{v_1}\\)</b>: โหลดของภาค 1 คือ \\(R_G\\) = 3.3 MΩ ของภาค 2 ขนานกับ \\(R_D\\) ซึ่งแทบไม่เปลี่ยนอะไร: ภาค 2 ไม่ดึงอัตราขยายของภาค 1 ลงเลย', '<b>\\(A_{v_1}\\)</b>: the load of stage 1 is stage 2\'s \\(R_G\\) = 3.3 MΩ in parallel with \\(R_D\\), which changes almost nothing: stage 2 does not pull stage 1\'s gain down at all'),
      block([R`A_{v_1} &= -g_m(R_D \parallel R_G) = -(2.64\ \text{mS})(2.398\ \text{k}\Omega) = \boxed{-6.32}`]),
      t('เทียบกับ Example 5.15 (หน้า A.4) ที่ \\(Z_{i_2}\\) = 0.94 kΩ ของ BJT ตัดอัตราขยายภาคแรกเหลือหนึ่งในสาม: อิมพีแดนซ์ขาเข้าสูงของ FET ทำให้ต่อภาคได้โดยไม่เสียอัตราขยาย', 'Compare Example 5.15 (page A.4), where the BJT\'s \\(Z_{i_2}\\) = 0.94 kΩ cut the first stage\'s gain to a third: a FET\'s high input impedance lets stages be cascaded without losing gain.')),
    step(t('<b>อัตราขยายรวมและแรงดันขาออก</b>: สองภาคกลับเฟสสองครั้ง ขาออกจึงไม่กลับเฟส', '<b>The overall gain and the output voltage</b>: two inversions, so the output is not inverted'),
      block([R`A_v &= A_{v_1}A_{v_2} = (-6.32)(-6.33) = \boxed{40.0}`, R`V_o &= A_vV_i = (40.0)(10\ \text{mV}) = \boxed{400\ \text{mV}}`]),
      t('ตำราใช้ \\(g_m\\) = 2.6 mS ได้ −6.24 ต่อภาค แล้วยังปัดเป็น −6.2 ก่อนคูณ จึงพิมพ์ 38.4 และ 384 mV (ถ้าไม่ปัดได้ 38.9) อัตราขยายสองภาคไวต่อ \\(g_m\\) เป็นกำลังสอง: \\(g_m\\) ต่าง 1.4 % ทำให้ \\(A_v\\) ต่าง 2.8 %', 'The book uses \\(g_m\\) = 2.6 mS, gets −6.24 per stage, then rounds it to −6.2 before multiplying, so it prints 38.4 and 384 mV (38.9 without that rounding). A two-stage gain goes with the square of \\(g_m\\): 1.4 % in \\(g_m\\) is 2.8 % in \\(A_v\\).')),
    step(t('<b>\\(Z_i\\) และ \\(Z_o\\)</b> (สมการ 8.67–8.68): ขาเข้าเป็นของภาคแรก ขาออกเป็นของภาคสุดท้าย', '<b>\\(Z_i\\) and \\(Z_o\\)</b> (Eqs. 8.67–8.68): the input belongs to the first stage, the output to the last'),
      block([R`Z_i &= R_{G_1} = \boxed{3.3\ \text{M}\Omega},\quad Z_o = R_{D_2} = \boxed{2.4\ \text{k}\Omega}`])) ],
  ask: () => ({ fields: [num2a('g<sub>m</sub> (mS) =', 2.64, 2.6, 0.03), num2a('A<sub>v1</sub> =', -6.32, -6.24, 0.05), { label: 'A<sub>v</sub> =', w: 5, ok: x => near(x, 40.0, 0.4) || near(x, 38.9, 0.3) }],
    check: v => (v[2] < 0 ? t('สองภาคกลับเฟสสองครั้ง: A<sub>v</sub> เป็นบวก', 'Two inverting stages: A<sub>v</sub> is positive.') : near(v[2], 12.6, 0.6) ? t('อัตราขยายสองภาคคูณกัน ไม่ได้บวกกัน', 'The two gains multiply; they do not add.') : near(v[2], 38.4, 0.1) ? t('38.4 มาจากการปัด −6.24 เป็น −6.2 ก่อนคูณ', '38.4 comes from rounding −6.24 to −6.2 before multiplying.') : '') }),
  answer: () => t('\\(V_{GSQ}\\) = −1.89 V, \\(I_{DQ}\\) = 2.78 mA, \\(g_m\\) = 2.64 mS, \\(A_{v_1}\\) = −6.32, \\(A_{v_2}\\) = −6.33, \\(A_v\\) = 40.0, \\(V_o\\) = 400 mV, \\(Z_i\\) = 3.3 MΩ, \\(Z_o\\) = 2.4 kΩ (Boylestad Example 8.16; ตำราใช้ค่าจากกราฟและการปัดได้ 38.4, 384 mV)',
    '\\(V_{GSQ}\\) = −1.89 V, \\(I_{DQ}\\) = 2.78 mA, \\(g_m\\) = 2.64 mS, \\(A_{v_1}\\) = −6.32, \\(A_{v_2}\\) = −6.33, \\(A_v\\) = 40.0, \\(V_o\\) = 400 mV, \\(Z_i\\) = 3.3 MΩ, \\(Z_o\\) = 2.4 kΩ (Boylestad Example 8.16; the book\'s graph values and rounding give 38.4, 384 mV)') };

AC.DEF = DEF;
AC.problem = (n, key, o = {}) => CH8.wire(n, DEF[key], o);
global.AC = AC;
})(window);
