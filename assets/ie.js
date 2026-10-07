/* ie.js — shared pieces of the Industrial Electronics site (Oct 2026), on top of circuit.js, ch6.js (canvas text, panels), ch8.js and lesson.js.
   1) colours, number helpers, a canvas pane that follows its card's width, and IE.problem: a picture-only problem (canvas + stepper + try-first box)
   2) IE.ivPlot: a diode characteristic as Boylestad draws it: mA up, tenths of volts to the right, the reverse side on its own scale of tens of
      volts to the left; the reverse current either squeezed into a thin strip under the axis (revPx, as in Fig. 1.24) or on the mA scale
      (to show the Zener region); tangent and chord lines, Δ brackets, dashed guides from a point to the axes
   3) curves: IE.curve (a digitized textbook curve through points, V and mA), IE.logCurve (through a few points, smooth in log current),
      IE.shockley (Eq. 1.2), IE.tableOf (any of them as an engine diode, model 'table')
   4) IE.Lattice: silicon atoms joined by covalent bonds; thermal electron–hole pairs, a donor or an acceptor, holes that hop, free electrons that drift
   5) IE.bands: energy bands (insulator, semiconductor, conductor) with the electrons and holes of a lattice, and a donor or acceptor level
   6) IE.Junction: the p–n junction under bias: depletion width, ions, majority and minority carriers crossing, avalanche in the Zener region
   7) IE.Block: n- or p-type material with its ions, majority and minority carriers (Fig. 1.11) */
(function (global) {
'use strict';
const IE = {};
const COL = CH6.COL, T = CH6.text, fd = CH6.fd, TWO_PI = 2 * Math.PI, rnd = Math.random;
const tt = p => (p ? (Array.isArray(p) ? MC.t(p[0], p[1]) : p) : '');
IE.tt = tt;
/* colours on the dark canvas: holes pink, free electrons cyan, donors orange, acceptors purple, the diode curve blue, the Q-point amber */
IE.COL = { hole: '#ff7eb6', elec: '#5ad1ff', donor: '#ffa552', accept: '#c792ea', atom: '#9aa3c7', bond: 'rgba(154,163,199,.5)', curve: '#4fb3ff',
  q: '#ffd166', tan: '#7ee787', chord: '#ff7eb6', avg: '#c792ea', guide: 'rgba(232,236,247,.5)', pReg: 'rgba(255,126,182,.10)', nReg: 'rgba(90,209,255,.10)',
  ink: COL.ink, muted: COL.muted, red: '#ff6b6b' };
/* numbers for canvas text: 0.5, −1 */
IE.num = (x, d = 3) => fd(x, d).replace('-', '−');
/* a canvas that fills its card: hOf(W) gives the height; refits on resize */
IE.pane = (cv, hOf) => { const p = { cv }; p.fit = () => { p.W = Math.max(300, Math.floor(cv.parentElement.clientWidth - 12)); p.H = Math.round(hOf(p.W)); p.ctx = CK.setup(cv, p.W, p.H); };
  p.fit(); window.addEventListener('resize', p.fit); return p; };
const dot = (ctx, x, y, r, col, glow) => { ctx.save(); ctx.fillStyle = col; if (glow) { ctx.shadowColor = col; ctx.shadowBlur = glow; } ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill(); ctx.restore(); };
const ring = (ctx, x, y, r, col, w = 2) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.stroke(); ctx.restore(); };
IE.dot = dot; IE.ring = ring;

/* a problem whose simulation is a picture, not a circuit: canvas cv<n>, controls ctl<n>, try-first box ask<n>, stepper st<n>.
   d: { h(W) (canvas height), draw(ctx, box, k, P), tick(dt, P), init(P), controls(el, P), steps(P), ask(P), answer(P), hint, onSet(k, P) } */
IE.problem = (n, d) => {
  const $ = id => document.getElementById(id), cv = $('cv' + n), P = { k: 0, st: {}, d };
  if (d.init) d.init(P);
  P.pane = IE.pane(cv, W => (d.h ? d.h(W) : Math.max(260, W * 0.6)));
  LS.anim(cv, dt => { if (d.tick) d.tick(dt, P); const { ctx, W, H } = P.pane; ctx.fillStyle = CK.PAL.bg; ctx.fillRect(0, 0, W, H); d.draw(ctx, { x: 0, y: 0, w: W, h: H }, P.k, P); });
  if (d.controls && $('ctl' + n)) d.controls($('ctl' + n), P);
  if (d.ask && $('ask' + n)) LS.ask($('ask' + n), d.ask(P));
  P.colW = $('st' + n).clientWidth;
  P.stepper = LS.stepper($('st' + n), { steps: () => P.list || (P.list = LS.withCol(P.colW, () => d.steps(P))), answer: d.answer ? () => d.answer(P) : undefined, hint: d.hint,
    onStep: k => { P.k = k; if (d.onSet) d.onSet(k, P); } });
  const again = w => { P.colW = w; P.list = null; P.stepper.refresh(true); };
  LS.onFonts(() => again($('st' + n).clientWidth)); LS.watchWidth($('st' + n), again);
  return P;
};

/* =====================================================================================================================
   2) the diode characteristic.
   o: { v: [vmin, vmax] (V; vmin < 0 adds the reverse side, on its own scale), i: [imin, imax] (mA; imin < 0 puts negative currents on the mA scale),
        negFrac (share of the width for v < 0, default 0.3), revPx (the reverse current drawn as a strip this many px under the axis, whatever its size),
        revLabel ('−1 µA'), xt / xtNeg (voltage ticks, v ≥ 0 / v < 0), yt / ytNeg (current ticks, mA), xl, yl (axis labels), title,
        curves: [{ f(v) → mA, rev (also draw v < 0), color, w, dash, label, labelAt (v), from (first v) }],
        segs: [{ a: [v, i], b: [v, i], color, w, dash, ext (lengthen both ends by this share) }], hl: [{ i, color, label }], vl: [{ v, color, label }],
        pts: [{ v, i, color, label, r, dy, side }], guides: [{ v, i, color, toX, toY }] (dashed lines from a point to the axes),
        dV: [{ v1, v2, at (mA), label, color, above }], dI: [{ i1, i2, at (V), label, color, left }] (brackets), bands: [{ v1, v2, color, label }] }
   → { X, Y, xz, yz, L, R, Tp } */
IE.ivPlot = (ctx, b, o = {}) => {
  CH6.bg(ctx, b);
  const [v0, v1] = o.v || [0, 1], [i0, i1] = o.i || [0, 30], neg = v0 < 0, zoom = v0 > 0, nf = neg ? (o.negFrac ?? 0.3) : 0, rp = o.revPx || 0, lin = i0 < 0 && !rp;   // zoom: the voltage axis starts at v0 > 0
  const ml = o.ml ?? 46, mr = o.mr ?? 16, L = b.x + ml, R = b.x + b.w - mr, Tp = b.y + (o.title ? 30 : 12) + 16;
  const Bt = b.y + b.h - (rp ? rp + 34 : lin ? 12 : 36), yz = lin ? Tp + (Bt - Tp) * i1 / (i1 - i0) : Bt, xz = L + (R - L) * nf;
  const X = v => (zoom ? L + (R - L) * (v - v0) / (v1 - v0) : v >= 0 ? xz + (R - xz) * v / v1 : xz - (xz - L) * v / v0);
  const Y = i => (i < 0 && rp ? yz + rp : yz - (yz - Tp) * i / i1);
  const yLow = rp ? yz + rp + 10 : Bt;
  (o.bands || []).forEach(q => { const xa = X(q.v1), xb = X(q.v2); ctx.save(); ctx.fillStyle = q.color || 'rgba(255,209,102,.08)'; ctx.fillRect(xa, Tp, xb - xa, yLow - Tp); ctx.restore();
    if (q.label) CH8.lab(ctx, tt(q.label), (xa + xb) / 2, Tp + 10, 'center', q.text || COL.muted, 11.5, { x: xa, y: b.y, w: xb - xa, h: b.h }, '600'); });
  const xt = o.xt || [0.2, 0.4, 0.6, 0.8, 1].filter(v => v <= v1 + 1e-9), yt = o.yt || [10, 20, 30].filter(i => i <= i1 + 1e-9), ytN = rp ? [] : (o.ytNeg || []);
  ctx.save(); ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
  xt.concat(o.xtNeg || []).forEach(v => { ctx.beginPath(); ctx.moveTo(X(v), lin ? Bt : yz); ctx.lineTo(X(v), Tp); ctx.stroke(); });
  yt.concat(ytN).forEach(i => { ctx.beginPath(); ctx.moveTo(L, Y(i)); ctx.lineTo(R, Y(i)); ctx.stroke(); });
  ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, yz); ctx.lineTo(R, yz); ctx.moveTo(xz, Tp - 6); ctx.lineTo(xz, rp ? yz + rp + 14 : Bt); ctx.stroke();
  if (zoom) { ctx.fillStyle = COL.panel; ctx.fillRect(xz + 7, yz - 6, 9, 12); ctx.beginPath(); ctx.moveTo(xz + 5, yz + 5); ctx.lineTo(xz + 10, yz - 5); ctx.moveTo(xz + 12, yz + 5); ctx.lineTo(xz + 17, yz - 5); ctx.stroke(); }   // axis break: it does not start at 0 V
  ctx.restore();
  /* tick labels that would touch the previous one are skipped (narrow plots) */
  const ticks = (vs, fmt, y) => { let last = -1e9; vs.slice().sort((a, b) => a - b).forEach(v => { const s2 = fmt(v), w = CH8.textW(ctx, s2, 11.5), x = X(v);
    if (x - w / 2 < last + 5) return; T(ctx, s2, x, y, { color: COL.muted, size: 11.5 }); last = x + w / 2; }); };
  ticks(xt, v => IE.num(v, 3), yz + 13); ticks(o.xtNeg || [], v => IE.num(v, 1), yz - 11);
  yt.concat(ytN).forEach(i => T(ctx, IE.num(i, 2), xz - 6, Y(i), { align: 'right', color: COL.muted, size: 11.5 }));
  T(ctx, '0', xz - 6, yz + 12, { align: 'right', color: COL.muted, size: 11.5 });
  if (rp && o.revLabel) T(ctx, tt(o.revLabel), xz + 6, yz + rp, { align: 'left', color: COL.muted, size: 11.5 });
  T(ctx, tt(o.xl ?? 'V_D (V)'), R, yz + 28, { align: 'right', color: COL.ink, size: 12.5, weight: '600' });
  T(ctx, tt(o.yl ?? 'I_D (mA)'), xz + 7, Tp - 6, { align: 'left', color: COL.ink, size: 12.5, weight: '600' });
  /* curves and straight lines, clipped to the plot */
  ctx.save(); ctx.beginPath(); ctx.rect(L - 2, Tp - 6, R - L + 4, yLow - Tp + 8); ctx.clip();
  (o.hl || []).forEach(q => { ctx.save(); ctx.strokeStyle = q.color || IE.COL.guide; ctx.lineWidth = 1.3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(L, Y(q.i)); ctx.lineTo(R, Y(q.i)); ctx.stroke(); ctx.restore(); });
  (o.vl || []).forEach(q => { ctx.save(); ctx.strokeStyle = q.color || IE.COL.guide; ctx.lineWidth = 1.3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(X(q.v), Tp); ctx.lineTo(X(q.v), yLow); ctx.stroke(); ctx.restore(); });
  (o.curves || []).forEach(c => { ctx.save(); ctx.strokeStyle = c.color || IE.COL.curve; ctx.lineWidth = c.w || 3; ctx.lineJoin = 'round'; if (c.dash) ctx.setLineDash(c.dash); ctx.beginPath(); let pen = false;
    const put = (x, y) => { if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; } };
    if (neg && c.rev) { if (rp) { put(L, yz + rp); put(xz - 9, yz + rp); ctx.quadraticCurveTo(xz - 1, yz + rp, xz, yz + rp * 0.35); put(xz, yz); }
      else { const N = c.nr || 240; for (let j = 0; j <= N; j++) { const v = v0 * (1 - j / N), i = c.f(v); if (!isFinite(i)) { pen = false; continue; } put(X(v), Y(Math.max(i, i0 * 1.2))); } } }
    const N = c.n || 280, va = Math.max(zoom ? v0 : 0, c.from ?? 0);
    for (let j = 0; j <= N; j++) { const v = va + (v1 - va) * j / N, i = c.f(v); if (!isFinite(i)) { pen = false; continue; } if (i > i1 * 1.3) { put(X(v), Y(i1 * 1.3)); break; } put(X(v), Y(i)); }
    ctx.stroke(); ctx.restore(); });
  (o.segs || []).forEach(s => { let [va, ia] = s.a, [vb, ib] = s.b; if (s.ext) { const dv = vb - va, di = ib - ia; va -= dv * s.ext; ia -= di * s.ext; vb += dv * s.ext; ib += di * s.ext; }
    ctx.save(); ctx.strokeStyle = s.color || IE.COL.tan; ctx.lineWidth = s.w || 2.4; ctx.lineCap = 'round'; if (s.dash) ctx.setLineDash(s.dash); ctx.beginPath(); ctx.moveTo(X(va), Y(ia)); ctx.lineTo(X(vb), Y(ib)); ctx.stroke(); ctx.restore(); });
  ctx.restore();
  /* labels of reference lines, guides, brackets, points */
  (o.hl || []).forEach(q => { if (q.label) CH8.lab(ctx, tt(q.label), R - 4, Y(q.i) - 9, 'right', q.color || COL.muted, 11.5, b, '600'); });
  (o.vl || []).forEach(q => { if (q.label) CH8.lab(ctx, tt(q.label), X(q.v) + 5, Tp + 4, 'left', q.color || COL.muted, 11.5, b, '600'); });
  (o.guides || []).forEach(g => { ctx.save(); ctx.strokeStyle = g.color || IE.COL.guide; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath();
    if (g.toY !== false) { ctx.moveTo(X(g.v), Y(g.i)); ctx.lineTo(xz, Y(g.i)); } if (g.toX !== false) { ctx.moveTo(X(g.v), Y(g.i)); ctx.lineTo(X(g.v), yz); } ctx.stroke(); ctx.restore(); });
  const brace = (x1, y1, x2, y2, col) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1); [[x1, y1], [x2, y2]].forEach(([x, y]) => { ctx.beginPath(); if (vert) { ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); } else { ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); } ctx.stroke(); }); ctx.restore(); };
  (o.dV || []).forEach(d => { const y = Y(d.at), col = d.color || IE.COL.tan; brace(X(d.v1), y, X(d.v2), y, col);
    if (d.label) CH8.lab(ctx, tt(d.label), (X(d.v1) + X(d.v2)) / 2, y + (d.above ? -12 : 15), 'center', col, 12, b); });
  (o.dI || []).forEach(d => { const x = X(d.at), col = d.color || IE.COL.tan; brace(x, Y(d.i1), x, Y(d.i2), col);
    if (d.label) CH8.lab(ctx, tt(d.label), x + (d.left ? -8 : 8), (Y(d.i1) + Y(d.i2)) / 2, d.left ? 'right' : 'left', col, 12, b); });
  (o.curves || []).forEach(c => { if (!c.label) return; const v = c.labelAt ?? v1 * 0.9, i = Math.min(c.f(v), i1 * 0.9); CH8.lab(ctx, tt(c.label), X(v) + 8, Y(i), 'left', c.color || IE.COL.curve, 12, b); });
  (o.pts || []).forEach(p => { const px = X(p.v), py = Y(p.i), col = p.color || IE.COL.q; ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = '#0f1220'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, p.r || 6.5, 0, TWO_PI); ctx.fill(); ctx.stroke(); ctx.restore();
    if (p.label) { const right = p.side ? p.side < 0 : px > b.x + b.w * 0.58; CH6.tag(ctx, tt(p.label), right ? px - 11 : px + 11, py - (p.dy ?? 16), col, { align: right ? 'right' : 'left', size: 12 }); } });
  if (o.title) T(ctx, tt(o.title), b.x + 10, b.y + 15, { align: 'left', color: COL.muted, size: 13 });
  return { X, Y, xz, yz, L, R, Tp };
};

/* =====================================================================================================================
   3) curves (all in volts and milliamperes) */
/* a digitized curve through pts [[V, mA], …] from (0, 0) up; f(v) (0 below the first point; for v < 0 the reverse current −irev mA, reached
   within a few tens of mV, as the engine's 'table' model); f.slope(v) (mA/V); f.vAt(mA) (V, by bisection) */
IE.curve = (pts, irev = 0) => { const f0 = CK.DIODE.pchip(pts);
  const f = v => (v < 0 ? -irev * (1 - Math.exp(v / 0.01)) : v <= pts[0][0] ? 0 : Math.max(0, f0(v).y));
  f.slope = v => f0(v).d; f.vAt = i => { let lo = pts[0][0], hi = pts[pts.length - 1][0] + 1; for (let k = 0; k < 90; k++) { const m = (lo + hi) / 2; if (f(m) < i) lo = m; else hi = m; } return (lo + hi) / 2; };
  f.pts = pts; f.irev = irev; return f; };
/* a curve through a few read-off points [[V, mA], …] (Example 1.2): smooth in ln(I) and straight in ln(I) beyond the ends. Below the first point
   a term i0(1 − v/v1)² (zero slope at v1) takes the current to exactly 0 at 0 V, so the curve still passes through every read-off point */
IE.logCurve = (pts, irev = 0) => { const L = CK.DIODE.pchip(pts.map(([v, i]) => [v, Math.log(i)])), v1 = pts[0][0], i0 = Math.exp(L(0).y);
  const f = v => (v < 0 ? -irev * (1 - Math.exp(v / 0.01)) : Math.exp(L(v).y) - (v < v1 ? i0 * (1 - v / v1) ** 2 : 0));
  f.vAt = i => { let lo = 0, hi = pts[pts.length - 1][0] + 1; for (let k = 0; k < 90; k++) { const m = (lo + hi) / 2; if (f(m) < i) lo = m; else hi = m; } return (lo + hi) / 2; };
  f.pts = pts; f.irev = irev; return f; };
/* Shockley's equation (Eq. 1.2): Is in A, T in °C; f(v) in mA; vz (V): breakdown at −vz with ibv (A) there, as the engine models it */
IE.shockley = (Is, n = 1, Tc = 27, vz = 0, ibv = 1e-3) => { const nvt = n * CK.DIODE.vt(Tc);
  const f = v => 1000 * (Is * (Math.exp(Math.min(v / nvt, 80)) - 1) - (vz ? ibv * Math.exp(Math.min(-(v + vz) / CK.DIODE.vt(Tc), 80)) : 0));
  f.vAt = i => nvt * Math.log(i / 1000 / Is + 1); f.Is = Is; f.n = n; f.T = Tc; f.nvt = nvt; f.irev = Is * 1000; return f; };
/* any curve f (mA) as an engine diode: model 'table' sampled every dv volts up to vmax, reverse current f.irev (mA) */
IE.tableOf = (f, vmax = 1.2, dv = 0.005, extra = {}) => { const curve = []; for (let v = 0; v <= vmax + 1e-9; v += dv) curve.push([+v.toFixed(6), Math.max(0, f(v)) / 1000]);
  for (let k = 1; k < curve.length; k++) if (curve[k][1] <= curve[k - 1][1]) curve[k][1] = curve[k - 1][1] + 1e-15;   // strictly increasing for the solver
  return { type: 'D', model: 'table', curve, Irev: (f.irev || 0) / 1000 || 1e-12, ...extra }; };

/* =====================================================================================================================
   4) the lattice: rows × cols atoms one unit apart, joined by covalent bonds; each bond holds two electrons (slots 0, 1); an empty slot is a hole.
   Bonds at the edge are stubs that run half a unit out (their neighbours are off the picture). setTarget(n) keeps about n electrons out of their
   bonds (thermal pairs: they wander and later fall back into a hole). dope('donor' | 'acceptor', sym, r, c): a pentavalent atom with a loosely
   bound fifth electron, or a trivalent atom with one bond short of an electron. ionize(): the fifth electron leaves (donor ion +), or a neighbour's
   electron fills the void (acceptor ion −). field > 0 points to the right: holes drift right, free electrons left (Fig. 1.10 is field < 0) */
IE.Lattice = class {
  constructor(o = {}) { this.o = o; this.hop = o.hop ?? 0.9; this.field = 0; this.build(o.rows || 3, o.cols || 4); }
  build(rows, cols) {
    this.rows = rows; this.cols = cols; this.bonds = []; this.free = []; this.jumps = []; this.dop = null; this.target = 0; this.timer = 0.4; this.pops = [];
    const add = (x1, y1, x2, y2, stub) => this.bonds.push({ x1, y1, x2, y2, stub, e: [true, true], res: [false, false] });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      add(c, r, c === cols - 1 ? c + 0.5 : c + 1, r, c === cols - 1); add(c, r, c, r === rows - 1 ? r + 0.5 : r + 1, r === rows - 1);
      if (c === 0) add(-0.5, r, 0, r, true); if (r === 0) add(c, -0.5, c, 0, true); }
    const at = (x, y) => (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < cols && y < rows ? `${x},${y}` : null);
    this.bonds.forEach((B, i) => { B.i = i; B.atoms = [at(B.x1, B.y1), at(B.x2, B.y2)].filter(Boolean); });
    this.nb = this.bonds.map(B => this.bonds.filter(C => C !== B && C.atoms.some(a => B.atoms.includes(a))).map(C => C.i));
  }
  /* where slot k of bond B sits (lattice units): beside the middle of a full bond, or near the outer end of a stub */
  slot(B, k) { const dx = B.x2 - B.x1, dy = B.y2 - B.y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, off = k ? -0.09 : 0.09; let x, y;
    if (B.stub) { const a1 = B.atoms[0] === `${B.x1},${B.y1}`, ax = a1 ? B.x1 : B.x2, ay = a1 ? B.y1 : B.y2, ex = a1 ? B.x2 : B.x1, ey = a1 ? B.y2 : B.y1; x = ax + (ex - ax) * 0.88; y = ay + (ey - ay) * 0.88; }
    else { x = (B.x1 + B.x2) / 2; y = (B.y1 + B.y2) / 2; }
    return [x + nx * off, y + ny * off]; }
  holes() { const h = []; this.bonds.forEach(B => [0, 1].forEach(k => { if (!B.e[k] && !B.res[k]) h.push([B, k]); })); return h; }
  get nHoles() { let n = 0; this.bonds.forEach(B => { n += (!B.e[0]) + (!B.e[1]); }); return n; }
  get nFree() { return this.free.length + this.jumps.filter(j => j.free).length; }
  thermal() { return this.free.filter(e => e.th).length; }
  setTarget(n) { this.target = Math.max(0, Math.round(n)); }
  dope(kind, sym, r, c) {
    this.build(this.rows, this.cols); if (!kind) return;
    this.dop = { kind, sym, r, c, ionized: false, orbit: rnd() * TWO_PI };
    if (kind === 'acceptor') { const B = this.bonds.find(B => B.atoms.includes(`${c},${r}`) && B.y1 === B.y2 && B.x1 === c); B.e[0] = false; B.void = true; this.dop.bond = B.i; }
  }
  ionize() { const d = this.dop; if (!d || d.ionized) return; d.ionized = true;
    if (d.kind === 'donor') { const x = d.c + 0.33 * Math.cos(d.orbit), y = d.r + 0.33 * Math.sin(d.orbit); this.free.push({ x, y, vx: 0.5 * Math.cos(d.orbit), vy: 0.5 * Math.sin(d.orbit), donor: true }); }
    else { const B = this.bonds[d.bond]; B.void = false; this.hopInto(B, 0, true); } }
  /* holes without free electrons (left by acceptors that are not drawn) and free electrons without holes (from donors not drawn) */
  addHole() { const ok = this.bonds.filter(B => B.e[0] && B.e[1] && !B.void); if (!ok.length) return; const B = ok[Math.floor(rnd() * ok.length)]; B.e[rnd() < 0.5 ? 0 : 1] = false; }
  addFree() { this.free.push({ x: rnd() * (this.cols - 1), y: rnd() * (this.rows - 1), vx: 0, vy: 0, donor: true }); }
  /* a neighbouring bond's electron jumps into hole (B, k): the hole moves to that bond (with a field, mostly the way the field points) */
  hopInto(B, k, any) { const cand = []; this.nb[B.i].forEach(j => { const C = this.bonds[j]; [0, 1].forEach(m => { if (C.e[m]) cand.push([C, m]); }); });
    if (!cand.length) return false; let pick = cand[Math.floor(rnd() * cand.length)];
    if (this.field && !any) { const [hx] = this.slot(B, k), w = cand.map(([C, m]) => Math.exp(this.field * 2.6 * (this.slot(C, m)[0] - hx))); let s = w.reduce((a, x) => a + x, 0) * rnd();
      for (let q = 0; q < cand.length; q++) { s -= w[q]; if (s <= 0) { pick = cand[q]; break; } } }
    const [C, m] = pick; C.e[m] = false; B.res[k] = true; const [x0, y0] = this.slot(C, m), [x1, y1] = this.slot(B, k);
    this.jumps.push({ x0, y0, x1, y1, t: 0, dur: 0.32, B, k }); return true; }
  generate() { const ok = this.bonds.filter(B => B.e[0] && B.e[1] && !B.void && !B.res[0] && !B.res[1]); if (!ok.length) return;
    const B = ok[Math.floor(rnd() * ok.length)], k = rnd() < 0.5 ? 0 : 1, [x, y] = this.slot(B, k); B.e[k] = false; const a = rnd() * TWO_PI;
    this.free.push({ x, y, vx: 0.7 * Math.cos(a), vy: 0.7 * Math.sin(a), th: true }); this.pops.push({ x, y, t: 0 }); }
  recombine() { const h = this.holes().filter(([B]) => !B.void); if (!h.length || !this.free.length) return;
    let ei = this.free.findIndex(e => e.th); if (ei < 0) ei = 0; const e = this.free[ei];
    let best = null, bd = 1e9; h.forEach(([B, k]) => { const [x, y] = this.slot(B, k), d = Math.hypot(x - e.x, y - e.y); if (d < bd) { bd = d; best = [B, k, x, y]; } });
    const [B, k, x, y] = best; this.free.splice(ei, 1); B.res[k] = true; this.jumps.push({ x0: e.x, y0: e.y, x1: x, y1: y, t: 0, dur: Math.min(1.2, 0.25 + bd * 0.5), B, k, free: true }); }
  step(dt) {
    if (!(dt > 0)) return; const d = this.dop; if (d && !d.ionized) d.orbit += dt * 2.4;
    this.jumps = this.jumps.filter(j => { j.t += dt; if (j.t < j.dur) return true; j.B.e[j.k] = true; j.B.res[j.k] = false; return false; });
    this.pops = this.pops.filter(p => (p.t += dt) < 0.6);
    const xa = -0.42, xb = this.cols - 0.58, ya = -0.42, yb = this.rows - 0.58, drift = -this.field * 0.6;
    this.free.forEach(e => { e.vx += (rnd() - 0.5) * 3.2 * dt; e.vy += (rnd() - 0.5) * 3.2 * dt; const sp = Math.max(Math.hypot(e.vx, e.vy), 1e-6), g = 1 + (0.55 / sp - 1) * Math.min(1, dt * 2);
      e.vx *= g; e.vy *= g; e.x += (e.vx + drift) * dt; e.y += e.vy * dt;
      if (this.field) { if (e.x < xa) e.x += xb - xa; if (e.x > xb) e.x -= xb - xa; }   // with a field the current keeps going round
      else { if (e.x < xa) { e.x = xa; e.vx = Math.abs(e.vx); } if (e.x > xb) { e.x = xb; e.vx = -Math.abs(e.vx); } }
      if (e.y < ya) { e.y = ya; e.vy = Math.abs(e.vy); } if (e.y > yb) { e.y = yb; e.vy = -Math.abs(e.vy); } });
    /* holes hop: a neighbouring valence electron fills each hole now and then; with a field a hole at the far edge re-enters on the other side */
    if (this.hop > 0) this.holes().forEach(([B, k]) => { if (B.void) return;
      if (this.field && B.stub && B.y1 === B.y2 && (this.field > 0 ? B.x2 > this.cols - 1 : B.x1 < 0) && rnd() < dt * 1.2) {
        const C = this.bonds.find(C => C.stub && C.y1 === B.y1 && C.y2 === B.y2 && (this.field > 0 ? C.x1 < 0 : C.x2 > this.cols - 1)); if (C && C.e[k] && !C.res[k]) { B.e[k] = true; C.e[k] = false; } return; }
      if (rnd() < dt * this.hop * (this.field ? 1.6 : 1)) this.hopInto(B, k); });
    /* thermal pairs drift towards the target number, and keep turning over */
    this.timer -= dt; if (this.timer <= 0) { this.timer = 0.3 + rnd() * 0.5; const n = this.thermal();
      if (n < this.target) this.generate(); else if (n > this.target) this.recombine(); else if (n > 0 && rnd() < 0.3) this.recombine(); }
  }
  /* draw in box b; o: { title, legend (false hides it) } → { P, s } */
  draw(ctx, b, o = {}) {
    CH6.bg(ctx, b); const rows = this.rows, cols = this.cols, top = o.title ? 26 : 6, bot = o.legend === false ? 8 : 26;
    const s = Math.min((b.w - 16) / cols, (b.h - top - bot) / rows), ox = b.x + (b.w - s * cols) / 2 + s / 2, oy = b.y + top + (b.h - top - bot - s * rows) / 2 + s / 2;
    const P = (x, y) => [ox + x * s, oy + y * s], ra = s * 0.19, er = Math.max(2.4, s * 0.042), d = this.dop;
    ctx.save(); ctx.beginPath(); ctx.rect(b.x + 1, b.y + top - 2, b.w - 2, b.h - top - bot + 4); ctx.clip();
    this.bonds.forEach(B => { const dx = B.x2 - B.x1, dy = B.y2 - B.y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * s * 0.06, ny = ux * s * 0.06;
      const in1 = B.atoms.includes(`${B.x1},${B.y1}`) ? ra / s : 0, in2 = B.atoms.includes(`${B.x2},${B.y2}`) ? ra / s : 0;
      const [ax, ay] = P(B.x1 + ux * in1, B.y1 + uy * in1), [bx, by] = P(B.x2 - ux * in2, B.y2 - uy * in2);
      ctx.save(); ctx.strokeStyle = IE.COL.bond; ctx.lineWidth = Math.max(1, s * 0.02); [1, -1].forEach(q => { ctx.beginPath(); ctx.moveTo(ax + nx * q, ay + ny * q); ctx.lineTo(bx + nx * q, by + ny * q); ctx.stroke(); }); ctx.restore();
      [0, 1].forEach(k => { const [x, y] = P(...this.slot(B, k)); if (B.e[k]) dot(ctx, x, y, er, IE.COL.elec);
        else if (!B.res[k]) { ring(ctx, x, y, er * 1.7, IE.COL.hole, 2); if (s > 70) T(ctx, '+', x, y + 0.5, { color: IE.COL.hole, size: Math.max(9, er * 2.3), weight: '700' }); }
        else ring(ctx, x, y, er * 1.7, 'rgba(255,126,182,.45)', 1.5); }); });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const [x, y] = P(c, r), isD = d && d.r === r && d.c === c, col = isD ? (d.kind === 'donor' ? IE.COL.donor : IE.COL.accept) : IE.COL.atom;
      ctx.save(); ctx.fillStyle = '#161a2f'; ctx.strokeStyle = col; ctx.lineWidth = isD ? 2.6 : 1.8; ctx.beginPath(); ctx.arc(x, y, ra, 0, TWO_PI); ctx.fill(); ctx.stroke(); ctx.restore();
      T(ctx, isD ? d.sym : typeof this.o.sym === 'function' ? this.o.sym(r, c) : (this.o.sym || 'Si'), x, y + 0.5, { color: col, size: Math.max(10, ra * 0.78), weight: '700' });   // sym: a symbol, or (r, c) → symbol (GaAs)
      if (isD && d.ionized) { const ix = x + ra * 0.95, iy = y - ra * 0.95, ri = Math.max(7, ra * 0.42); ctx.save(); ctx.fillStyle = '#0f1220'; ctx.beginPath(); ctx.arc(ix, iy, ri, 0, TWO_PI); ctx.fill(); ctx.restore();
        ring(ctx, ix, iy, ri, col, 1.8); T(ctx, d.kind === 'donor' ? '+' : '−', ix, iy + 0.5, { color: col, size: Math.max(10, ra * 0.6), weight: '700' }); } }
    if (d && d.kind === 'donor' && !d.ionized) { const [cx, cy] = P(d.c, d.r), R0 = s * 0.33; ctx.save(); ctx.strokeStyle = 'rgba(255,165,82,.45)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(cx, cy, R0, 0, TWO_PI); ctx.stroke(); ctx.restore();
      dot(ctx, cx + R0 * Math.cos(d.orbit), cy + R0 * Math.sin(d.orbit), er * 1.2, IE.COL.elec, 8); }
    this.pops.forEach(p => { const [x, y] = P(p.x, p.y); ring(ctx, x, y, er * (1.8 + p.t * 9), `rgba(90,209,255,${(0.6 * (1 - p.t / 0.6)).toFixed(3)})`, 1.6); });
    this.jumps.forEach(j => { const f = Math.min(1, j.t / j.dur), e = f * f * (3 - 2 * f), [x, y] = P(j.x0 + (j.x1 - j.x0) * e, j.y0 + (j.y1 - j.y0) * e); dot(ctx, x, y, er * 1.1, IE.COL.elec, 6); });
    this.free.forEach(e => { const [x, y] = P(e.x, e.y); dot(ctx, x, y, er * 1.25, IE.COL.elec, 9); });
    ctx.restore();
    if (o.legend !== false) { const y = b.y + b.h - 13, sz = 11.5, l1 = MC.t('อิเล็กตรอน', 'electron'), l2 = MC.t('โฮล', 'hole'); let x = b.x + 14;
      dot(ctx, x, y, 4, IE.COL.elec); T(ctx, l1, x + 9, y, { align: 'left', color: COL.muted, size: sz }); x += 9 + CH8.textW(ctx, l1, sz) + 18;
      ring(ctx, x, y, 5, IE.COL.hole, 1.8); T(ctx, l2, x + 10, y, { align: 'left', color: COL.muted, size: sz });
      T(ctx, MC.t(`อิเล็กตรอนอิสระ ${this.nFree} · โฮล ${this.nHoles}`, `free electrons ${this.nFree} · holes ${this.nHoles}`), b.x + b.w - 10, y, { align: 'right', color: COL.ink, size: sz, weight: '600' }); }
    if (o.title) T(ctx, tt(o.title), b.x + 10, b.y + 14, { align: 'left', color: COL.muted, size: 13 });
    return { P, s };
  }
};

/* =====================================================================================================================
   5) energy bands (slides pp. 20–22, 26). o: { kind: 'insulator' | 'semi' | 'conductor', Eg (eV; sets the drawn gap, capped), gapLabel, nE (electrons
   in the conduction band), nH (holes in the valence band), level: { kind: 'donor' | 'acceptor', n (states drawn), full (states holding an electron:
   donors not yet ionized, or acceptors already ionized), label }, title, short } */
IE.bands = (ctx, b, o = {}) => {
  CH6.bg(ctx, b); const kind = o.kind || 'semi', top = o.title ? 28 : 10, x0 = b.x + 50, x1 = b.x + b.w - 12, y0 = b.y + top + 8, y1 = b.y + b.h - 10, h = y1 - y0;
  const bandH = Math.min(h * 0.27, 60), Eg = kind === 'conductor' ? 0 : Math.min(o.Eg ?? 1.1, 6), gapPx = kind === 'conductor' ? -bandH * 0.35 : Math.max(12, (h - 2 * bandH - 8) * Math.min(1, Eg / 1.6));
  const cbT = y0 + Math.max(0, (h - 2 * bandH - gapPx) / 2), cbB = cbT + bandH, vbT = cbB + gapPx, vbB = vbT + bandH;
  ctx.save(); ctx.lineWidth = 1.4; ctx.fillStyle = 'rgba(90,209,255,.13)'; ctx.strokeStyle = 'rgba(90,209,255,.5)'; ctx.fillRect(x0, cbT, x1 - x0, bandH); ctx.strokeRect(x0, cbT, x1 - x0, bandH);
  ctx.fillStyle = 'rgba(199,146,234,.13)'; ctx.strokeStyle = 'rgba(199,146,234,.5)'; ctx.fillRect(x0, vbT, x1 - x0, bandH); ctx.strokeRect(x0, vbT, x1 - x0, bandH); ctx.restore();
  const sz = o.short ? 11 : 12;
  T(ctx, MC.t('แถบนำ', 'conduction band'), x1 - 6, cbT + 11, { align: 'right', color: COL.muted, size: sz, weight: '600' });
  T(ctx, MC.t('แถบเวเลนซ์', 'valence band'), x1 - 6, vbB - 10, { align: 'right', color: COL.muted, size: sz, weight: '600' });
  CH6.arrow(ctx, b.x + 20, y1, b.x + 20, y0 - 4, COL.axis, 1.4); T(ctx, MC.t('พลังงาน', 'energy'), b.x + 26, y0 + 2, { align: 'left', color: COL.muted, size: 11 });
  if (gapPx > 10) { const gx = x0 + 16; CH6.arrow(ctx, gx, (cbB + vbT) / 2, gx, cbB + 1, COL.ink, 1.3); CH6.arrow(ctx, gx, (cbB + vbT) / 2, gx, vbT - 1, COL.ink, 1.3);
    T(ctx, tt(o.gapLabel || `E_g = ${o.Eg} eV`), gx + 8, (cbB + vbT) / 2, { align: 'left', color: COL.ink, size: sz + 0.5, weight: '700' }); }
  else if (kind === 'conductor') T(ctx, MC.t('แถบซ้อนกัน', 'the bands overlap'), x0 + 8, cbB + gapPx / 2 + 1, { align: 'left', color: COL.ink, size: sz, weight: '700' });
  const lane = (n, y, draw, xs, xe) => { const step = (xe - xs) / Math.max(n, 1); for (let k = 0; k < n; k++) draw(xs + step * (k + 0.5), y, k); };
  const xs = x0 + 44, xe = x1 - 14, nv = Math.max(8, Math.min(16, Math.floor((xe - xs) / 20)));
  if (kind !== 'conductor') { const nH = Math.min(o.nH || 0, nv), holes = new Set(); for (let k = 0; k < nH; k++) holes.add(Math.min(nv - 1, Math.floor((k + 0.5) * nv / nH)));
    lane(nv, vbT + bandH * 0.45, (x, y, k) => (holes.has(k) ? ring(ctx, x, y, 5.2, IE.COL.hole, 2) : dot(ctx, x, y, 4.2, IE.COL.elec)), xs, xe);
    const nE = Math.min(o.nE || 0, nv); lane(nE, cbT + bandH * 0.6, (x, y) => dot(ctx, x, y, 4.4, IE.COL.elec, 6), xs, xs + (xe - xs) * nE / nv);
    if ((o.nE || 0) > nv) T(ctx, `×${o.nE}`, x1 - 8, cbT + bandH * 0.6, { align: 'right', color: IE.COL.elec, size: 11 }); }
  else lane(nv, cbB + gapPx / 2 - 8, (x, y) => dot(ctx, x, y, 4.2, IE.COL.elec, 6), xs, xe);
  if (o.level && kind === 'semi') { const lv = o.level, don = lv.kind === 'donor', y = don ? cbB + Math.max(7, gapPx * 0.13) : vbT - Math.max(7, gapPx * 0.13), col = don ? IE.COL.donor : IE.COL.accept, n = lv.n ?? 4, lx = x0 + 120;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([7, 4]); ctx.beginPath(); ctx.moveTo(lx - 6, y); ctx.lineTo(xe, y); ctx.stroke(); ctx.restore();
    lane(n, y, (x, yy, k) => { if (k < (lv.full ?? 0)) dot(ctx, x, yy, 4.2, IE.COL.elec, 5); else { ctx.save(); ctx.fillStyle = '#121629'; ctx.beginPath(); ctx.arc(x, yy, 5.6, 0, TWO_PI); ctx.fill(); ctx.restore(); ring(ctx, x, yy, 5.6, col, 1.6); } }, lx, xe);
    T(ctx, tt(lv.label || (don ? ['ระดับโดเนอร์', 'donor level'] : ['ระดับแอกเซปเตอร์', 'acceptor level'])), lx - 12, y, { align: 'right', color: col, size: 11, weight: '600' }); }
  if (o.title) T(ctx, tt(o.title), b.x + 10, b.y + 14, { align: 'left', color: COL.muted, size: 13 });
  return { cbT, cbB, vbT, vbB };
};

/* =====================================================================================================================
   6) the p–n junction (slides pp. 32–42; Figs. 1.12–1.14 and 1.17). Positions are shares of the bar: x 0 (p contact) … 1 (n contact), y 0 … 1.
   set(V, o): V = V_D across the junction (p side +), o.vbv (breakdown voltage, V). The depletion half-width, the rates of majority carriers
   crossing (∝ e^{V/0.12}, capped), of minority carriers swept across (constant, equal to the majority rate at V = 0, so the net flow is zero with
   no bias) and of avalanche pairs (beyond −vbv) are qualitative: they show the direction and the trend, not the numbers */
IE.Junction = class {
  constructor(o = {}) { this.o = o; this.V = 0; this.vbv = o.vbv ?? 50; this.c = []; this.fx = []; this.acc = { maj: 0, min: 0, av: 0 }; this.flow = { maj: 0.35, min: 0.35 }; this.init(); }
  w() { const V = this.V, w0 = 0.07; return V >= 0 ? w0 * Math.sqrt(Math.max(0.05, 1 - V / 0.78)) : Math.min(0.3, w0 * (1 + 0.85 * Math.log10(1 + -V / 0.7))); }
  edge(side) { return side === 'p' ? 0.5 - this.w() : 0.5 + this.w(); }
  mk(kind, side, minority, x) { const lo = side === 'p' ? 0.015 : this.edge('n') + 0.01, hi = side === 'p' ? this.edge('p') - 0.01 : 0.985;
    return { kind, side, minority: !!minority, x: x ?? lo + rnd() * Math.max(0.01, hi - lo), y: 0.07 + rnd() * 0.86, vx: (rnd() - 0.5) * 0.1, vy: (rnd() - 0.5) * 0.1, mode: 'roam', a: 1 }; }
  init() { this.c = []; const n = this.o.n ?? 22; for (let k = 0; k < n; k++) { this.c.push(this.mk('h', 'p')); this.c.push(this.mk('e', 'n')); }
    for (let k = 0; k < 2; k++) { this.c.push(this.mk('e', 'p', true)); this.c.push(this.mk('h', 'n', true)); } }
  set(V, o = {}) { this.V = V; if (o.vbv) this.vbv = o.vbv; }
  rates() { const V = this.V, base = 0.35; return { maj: Math.min(14, base * Math.exp(V / 0.12)), min: base, av: V <= -this.vbv + 0.05 ? 12 * Math.min(1, (-V - this.vbv + 0.6) / 2) : 0 }; }
  step(dt) {
    if (!(dt > 0)) return; const r = this.rates(); this.flow.maj += (r.maj - this.flow.maj) * Math.min(1, dt * 3); this.flow.min += (r.min + r.av - this.flow.min) * Math.min(1, dt * 3);
    const eP = this.edge('p'), eN = this.edge('n');
    this.acc.maj += dt * r.maj; while (this.acc.maj >= 1) { this.acc.maj -= 1; const kind = rnd() < 0.5 ? 'h' : 'e', side = kind === 'h' ? 'p' : 'n';
      const pool = this.c.filter(q => q.mode === 'roam' && !q.minority && q.kind === kind && q.side === side);
      if (pool.length) { pool.sort((a, b) => (side === 'p' ? b.x - a.x : a.x - b.x)); const q = pool[Math.floor(rnd() * Math.min(4, pool.length))]; q.mode = 'cross'; q.dir = side === 'p' ? 1 : -1; } }
    this.acc.min += dt * r.min; while (this.acc.min >= 1) { this.acc.min -= 1; const pool = this.c.filter(q => q.mode === 'roam' && q.minority);
      if (pool.length) { const q = pool[Math.floor(rnd() * pool.length)]; q.mode = 'sweep'; q.dir = q.side === 'p' ? 1 : -1; } }
    this.acc.av += dt * r.av; while (this.acc.av >= 1) { this.acc.av -= 1; const x = 0.5 + (rnd() - 0.5) * 1.8 * this.w(), y = 0.1 + rnd() * 0.8;
      this.c.push({ kind: 'e', side: 'dep', x, y, vx: 0, vy: 0, mode: 'sweep', dir: 1, a: 1, av: true }, { kind: 'h', side: 'dep', x, y, vx: 0, vy: 0, mode: 'sweep', dir: -1, a: 1, av: true }); this.fx.push({ x, y, t: 0 }); }
    this.fx = this.fx.filter(f => (f.t += dt) < 0.5);
    const gone = [];
    this.c.forEach(q => { q.vx += (rnd() - 0.5) * 0.9 * dt; q.vy += (rnd() - 0.5) * 0.9 * dt; q.vx *= 1 - Math.min(1, dt * 1.5); q.vy *= 1 - Math.min(1, dt * 1.5);
      if (q.mode === 'roam') { q.x += q.vx * dt * 1.6; q.y += q.vy * dt * 1.6; const lo = q.side === 'p' ? 0.012 : eN + 0.008, hi = q.side === 'p' ? eP - 0.008 : 0.988;
        if (q.x < lo) { q.x = lo; q.vx = Math.abs(q.vx); } if (q.x > hi) { q.x = hi; q.vx = -Math.abs(q.vx); } }
      else { q.x += q.dir * dt * (q.mode === 'sweep' ? 0.55 : 0.3); q.y += q.vy * dt; const far = q.dir > 0 ? q.x > eN + 0.06 : q.x < eP - 0.06; if (far) { q.a -= dt * 2.2; if (q.a <= 0) gone.push(q); } }
      if (q.y < 0.05) { q.y = 0.05; q.vy = Math.abs(q.vy); } if (q.y > 0.95) { q.y = 0.95; q.vy = -Math.abs(q.vy); } });
    /* a carrier that crossed recombines; the contact (majority) or heat (minority) brings a new one, so each region keeps its numbers */
    gone.forEach(q => { const i = this.c.indexOf(q); if (i >= 0) this.c.splice(i, 1); if (q.av) return;
      this.c.push(q.minority ? this.mk(q.kind, q.side, true) : this.mk(q.kind, q.side, false, q.side === 'p' ? 0.015 : 0.985)); });
    this.c.forEach(q => { if (q.mode !== 'roam') return; if (q.side === 'p' && q.x > eP - 0.008) q.x = eP - 0.008; if (q.side === 'n' && q.x < eN + 0.008) q.x = eN + 0.008; });
  }
  /* draw in box b. o: { title, short, battery (false hides the bias and V_D) } → { x0, x1, y0, y1, X } */
  draw(ctx, b, o = {}) {
    CH6.bg(ctx, b); const sh = o.short, top = (o.title ? 26 : 8) + 36, x0 = b.x + 34, x1 = b.x + b.w - 34, y0 = b.y + top, y1 = b.y + b.h - (o.battery === false ? 30 : 46);
    const X = x => x0 + (x1 - x0) * x, Yb = y => y0 + (y1 - y0) * y, w = this.w(), dl = X(0.5 - w), dr = X(0.5 + w), xm = X(0.5);
    ctx.save(); ctx.fillStyle = IE.COL.pReg; ctx.fillRect(x0, y0, xm - x0, y1 - y0); ctx.fillStyle = IE.COL.nReg; ctx.fillRect(xm, y0, x1 - xm, y1 - y0);
    ctx.fillStyle = 'rgba(255,209,102,.10)'; ctx.fillRect(dl, y0, dr - dl, y1 - y0); ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,209,102,.75)'; ctx.beginPath(); ctx.moveTo(dl, y0); ctx.lineTo(dl, y1); ctx.moveTo(dr, y0); ctx.lineTo(dr, y1); ctx.stroke(); ctx.restore();
    /* uncovered ions: − (acceptor) on the p side, + (donor) on the n side of the junction */
    const cols = Math.max(1, Math.round(w * 26)), rows = 4, r0 = Math.max(4.5, Math.min(7, (y1 - y0) / 16));
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const yy = Yb((j + 0.5) / rows), fx = (i + 0.5) / cols;
      [[xm - (xm - dl) * fx, '−', IE.COL.accept], [xm + (dr - xm) * fx, '+', IE.COL.donor]].forEach(([xx, sg, c]) => { ring(ctx, xx, yy, r0, c, 1.4); T(ctx, sg, xx, yy + 0.5, { color: c, size: r0 * 1.6, weight: '700' }); }); }
    this.c.forEach(q => { const x = X(q.x), y = Yb(q.y); ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, q.a)); if (q.kind === 'h') ring(ctx, x, y, 4.6, IE.COL.hole, 2); else dot(ctx, x, y, 4, IE.COL.elec, q.mode !== 'roam' ? 8 : 0); ctx.restore(); });
    this.fx.forEach(f => ring(ctx, X(f.x), Yb(f.y), 4 + f.t * 26, `rgba(255,209,102,${(0.8 * (1 - f.t / 0.5)).toFixed(3)})`, 2));
    T(ctx, 'p', (x0 + dl) / 2, y1 + 13, { color: IE.COL.hole, size: 14, weight: '700' }); T(ctx, 'n', (dr + x1) / 2, y1 + 13, { color: IE.COL.elec, size: 14, weight: '700' });
    if (!sh) CH8.lab(ctx, MC.t('บริเวณปลอดพาหะ', 'depletion region'), xm, y1 + 13, 'center', '#ffd166', 11.5, { x: dl - 70, y: b.y, w: dr - dl + 140, h: b.h }, '600');
    if (o.battery !== false) { const V = this.V, mid = (y0 + y1) / 2, cs = V > 1e-9 ? ['+', '−'] : V < -1e-9 ? ['−', '+'] : ['', ''];
      [[x0 - 18, cs[0], x0], [x1 + 18, cs[1], x1]].forEach(([x, s2, xe]) => { ctx.save(); ctx.strokeStyle = COL.axis; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xe, mid); ctx.lineTo(x, mid); ctx.stroke(); ctx.restore();
        if (s2) T(ctx, s2, x, mid - 14, { color: s2 === '+' ? '#ff6b6b' : '#5ad1ff', size: 17, weight: '700' }); });
      T(ctx, `V_D = ${IE.num(V, Math.abs(V) >= 10 ? 1 : 2)} V`, (x0 + x1) / 2, b.y + b.h - 13, { color: V > 1e-9 ? IE.COL.tan : V < -1e-9 ? IE.COL.red : COL.ink, size: 12.5, weight: '700' }); }
    /* flow vectors (Fig. 1.12c): majority carriers across the junction one way, minority carriers the other; their sizes follow the crossing rates */
    const fy = b.y + (o.title ? 26 : 8) + 10, maxL = (x1 - x0) * 0.4, len = r => Math.min(maxL, 30 * Math.log(1 + r / 0.06)), mj = this.flow.maj, mn = this.flow.min;
    if (mj > 0.02) CH6.arrow(ctx, xm - len(mj) / 2, fy, xm + len(mj) / 2, fy, IE.COL.tan, 3); else T(ctx, '≈ 0', xm, fy, { color: IE.COL.tan, size: 11.5, weight: '700' });
    CH6.arrow(ctx, xm + len(mn) / 2, fy + 17, xm - len(mn) / 2, fy + 17, IE.COL.hole, 2.4);
    T(ctx, sh ? MC.t('ข้างมาก', 'majority') : MC.t('พาหะข้างมาก', 'majority carriers'), xm + Math.max(len(mj), 30) / 2 + 8, fy, { align: 'left', color: IE.COL.tan, size: 11.5, weight: '600' });
    T(ctx, sh ? MC.t('ข้างน้อย', 'minority') : MC.t('พาหะข้างน้อย', 'minority carriers'), xm - len(mn) / 2 - 8, fy + 17, { align: 'right', color: IE.COL.hole, size: 11.5, weight: '600' });
    if (o.title) T(ctx, tt(o.title), b.x + 10, b.y + 14, { align: 'left', color: COL.muted, size: 13 });
    return { x0, x1, y0, y1, X };
  }
};

/* =====================================================================================================================
   7) n- or p-type material (Fig. 1.11): fixed ions (donor + / acceptor −), many majority carriers and a few minority carriers that jiggle */
IE.Block = class {
  constructor(kind, o = {}) { this.kind = kind; this.o = o; const n = o.n ?? 16, m = o.m ?? 2, rowsN = Math.ceil(n / 4); this.ions = []; this.q = [];
    for (let k = 0; k < n; k++) this.ions.push({ x: (k % 4 + 0.5 + (rnd() - 0.5) * 0.4) / 4, y: (Math.floor(k / 4) + 0.5 + (rnd() - 0.5) * 0.4) / rowsN });
    const maj = kind === 'n' ? 'e' : 'h', min = kind === 'n' ? 'h' : 'e';
    /* neutral: every ion's carrier plus one majority partner for each thermal minority carrier (n-type: electrons = donors + holes) */
    for (let k = 0; k < n + m; k++) this.q.push({ kind: maj, x: rnd(), y: rnd(), vx: 0, vy: 0 }); for (let k = 0; k < m; k++) this.q.push({ kind: min, x: rnd(), y: rnd(), vx: 0, vy: 0, min: true }); }
  step(dt) { this.q.forEach(p => { p.vx += (rnd() - 0.5) * 1.4 * dt; p.vy += (rnd() - 0.5) * 1.4 * dt; p.vx *= 1 - Math.min(1, dt); p.vy *= 1 - Math.min(1, dt); p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0.04) { p.x = 0.04; p.vx = Math.abs(p.vx); } if (p.x > 0.96) { p.x = 0.96; p.vx = -Math.abs(p.vx); } if (p.y < 0.06) { p.y = 0.06; p.vy = Math.abs(p.vy); } if (p.y > 0.94) { p.y = 0.94; p.vy = -Math.abs(p.vy); } }); }
  draw(ctx, b, o = {}) { const n = this.kind === 'n', top = 24, x0 = b.x + 8, y0 = b.y + top, w = b.w - 16, h = b.h - top - 28;
    CH6.bg(ctx, b); ctx.save(); ctx.fillStyle = n ? IE.COL.nReg : IE.COL.pReg; ctx.fillRect(x0, y0, w, h); ctx.strokeStyle = COL.axis; ctx.strokeRect(x0, y0, w, h); ctx.restore();
    const ic = n ? IE.COL.donor : IE.COL.accept, r0 = Math.max(6, Math.min(9, w / 26));
    this.ions.forEach(p => { const x = x0 + p.x * w, y = y0 + p.y * h; ring(ctx, x, y, r0, ic, 1.6); T(ctx, n ? '+' : '−', x, y + 0.5, { color: ic, size: r0 * 1.5, weight: '700' }); });
    this.q.forEach(p => { const x = x0 + p.x * w, y = y0 + p.y * h; if (p.kind === 'e') dot(ctx, x, y, 4, IE.COL.elec); else ring(ctx, x, y, 4.8, IE.COL.hole, 2);
      if (p.min) ring(ctx, x, y, 10, p.kind === 'e' ? 'rgba(90,209,255,.55)' : 'rgba(255,126,182,.55)', 1.3); });
    T(ctx, tt(o.title || (n ? ['ชนิด n', 'n-type'] : ['ชนิด p', 'p-type'])), b.x + 10, b.y + 12, { align: 'left', color: n ? IE.COL.elec : IE.COL.hole, size: 13, weight: '700' });
    const ne = this.q.filter(p => p.kind === 'e').length, nh = this.q.filter(p => p.kind === 'h').length;
    T(ctx, MC.t(`ไอออน ${this.ions.length} · อิเล็กตรอน ${ne} · โฮล ${nh}`, `ions ${this.ions.length} · electrons ${ne} · holes ${nh}`), b.x + b.w / 2, b.y + b.h - 13, { color: COL.muted, size: 11.5 }); }
};

global.IE = IE;
})(window);
