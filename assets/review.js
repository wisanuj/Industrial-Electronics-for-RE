/* review.js — the exam-review page (review.html): for every chapter the formula sheet, the standard recipe, the traps and
   randomised drills (new numbers at every press, the solution step by step, the circuit drawn and solved by the engine as a
   cross-check), then a mixed mock exam and a self-check list built from the learning outcomes in stops.js.
   Global RV. Needs shell.js, circuit.js, lesson.js, ch6.js (quiz) and the chapter libraries ie1–ie8 (circuit builders). */
(function (global) {
'use strict';
const RV = {}, t = (th, en) => MC.t(th, en), R = String.raw, ui = MC.ui;
const fd = (x, d = 3) => { if (!isFinite(x)) return '–'; let s = (+x).toFixed(d); if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, ''); if (s === '-0') s = '0'; return s.replace('-', '−'); };
const fx = (x, d = 3) => fd(x, d).replace('−', '-');   // inside TeX
const kO = r => (r >= 1e6 ? fd(r / 1e6, 2) + ' MΩ' : r >= 1e3 ? fd(r / 1e3, 2) + ' kΩ' : fd(r, 1) + ' Ω');
const kOx = r => (r >= 1e6 ? fx(r / 1e6, 2) + R`\,\text{M}\Omega` : r >= 1e3 ? fx(r / 1e3, 2) + R`\,\text{k}\Omega` : fx(r, 1) + R`\,\Omega`);
const capT = c => (c >= 1e-6 ? fd(c * 1e6, 2) + ' µF' : c >= 1e-9 ? fd(c * 1e9, 2) + ' nF' : fd(c * 1e12, 0) + ' pF');
const capX = c => (c >= 1e-6 ? fx(c * 1e6, 2) + R`\,\mu\text{F}` : c >= 1e-9 ? fx(c * 1e9, 2) + R`\,\text{nF}` : fx(c * 1e12, 0) + R`\,\text{pF}`);
const Vt = (x, d = 2) => `${fd(x, d)} V`, mAt = (x, d = 2) => `${fd(x * 1e3, d)} mA`, uAt = (x, d = 1) => `${fd(x * 1e6, d)} µA`;
const Vx = (x, d = 2) => `${fx(x, d)}\\ \\text{V}`, mAx = (x, d = 2) => `${fx(x * 1e3, d)}\\ \\text{mA}`, uAx = (x, d = 1) => `${fx(x * 1e6, d)}\\ \\mu\\text{A}`;
const pick = a => a[Math.floor(Math.random() * a.length)];
const near = (x, a, tol) => isFinite(x) && isFinite(a) && Math.abs(x - a) <= (tol !== undefined ? tol : Math.max(0.006 * Math.abs(a), 0.0015)) + 1e-12;   // tol: an absolute tolerance; otherwise 0.6 % (three significant figures)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
RV.fd = fd; RV.near = near;

/* =====================================================================================================================
   1) the chapters: title, the pages (from stops.js), the formula sheet [tex, note_th, note_en], the recipe [th, en], the traps [th, en] */
RV.CH = {
1: { title: 'ไดโอดสารกึ่งตัวนำ', en: 'Semiconductor diodes',
  formulas: [
    [R`I_D = I_s\left(e^{V_D/nV_T} - 1\right),\qquad V_T = \frac{kT}{q} \cong 26\ \text{mV}`, 'สมการของช็อกลีย์ T เป็นเคลวิน (273 + °C) ให้ 25.875 mV ที่ 27 °C; n = 1 ถึง 2', 'Shockley\'s equation; T in kelvin (273 + °C) gives 25.875 mV at 27 °C; n = 1 to 2'],
    [R`R_D = \frac{V_D}{I_D}`, 'ความต้านทานกระแสตรง: จุดเดียวบนกราฟ', 'dc resistance: one point of the curve'],
    [R`r_d = \frac{\Delta V_d}{\Delta I_d} \cong \frac{26\ \text{mV}}{I_D}`, 'ความต้านทานกระแสสลับ: ความชันของเส้นสัมผัสที่จุด Q (สูตร 26 mV ใช้เหนือเข่า)', 'ac resistance: the slope of the tangent at Q (the 26 mV form holds above the knee)'],
    [R`r_{av} = \frac{\Delta V_d}{\Delta I_d}\bigg|_{\text{pt. to pt.}}`, 'ความต้านทานเฉลี่ย: เส้นตรงระหว่างสองขีดจำกัดของสัญญาณ', 'average ac resistance: the line between the two limits of the signal'],
    [R`V_K \cong 0.7\ \text{V (Si)},\quad V_K \cong 0.3\ \text{V (Ge)},\quad V_K \cong 1.2\ \text{V (GaAs)}`, 'แรงดันเข่า → แบบจำลอง: อุดมคติ (สวิตช์) · แบบง่าย (V_K) · เชิงเส้นเป็นช่วง (V_K + r_av)', 'knee voltage → the models: ideal (a switch) · simplified (V_K) · piecewise-linear (V_K + r_av)'],
    [R`R = \rho\frac{l}{A},\qquad 1\ \text{eV} = 1.6\times10^{-19}\ \text{J}`, 'ความต้านทานของแท่งวัสดุ และหน่วยพลังงานของช่องว่างแถบ (Si 1.1 eV, Ge 0.67 eV, GaAs 1.43 eV)', 'the resistance of a bar and the energy unit of the band gap (Si 1.1 eV, Ge 0.67 eV, GaAs 1.43 eV)'],
    [[R`\Delta V_D \cong -2.5\ \text{mV/°C},\qquad I_s \times 2\ \text{ทุก }10\ \text{°C}`, R`\Delta V_D \cong -2.5\ \text{mV/°C},\qquad I_s \times 2\ \text{every }10\ \text{°C}`], 'ผลของอุณหภูมิที่กระแสคงที่ และกระแสอิ่มตัวย้อนกลับ', 'temperature: at constant current, and the reverse saturation current']],
  recipe: [['อ่านจุดทำงาน (V_D, I_D) จากกราฟหรือโจทย์', 'Read the operating point (V_D, I_D) off the curve or the problem'],
    ['R_D = V_D/I_D และ r_d = 26 mV/I_D (หรือความชันเส้นสัมผัส) · r_av จากสองจุด', 'R_D = V_D/I_D and r_d = 26 mV/I_D (or the tangent\'s slope); r_av from two points'],
    ['เลือกแบบจำลองจากเงื่อนไข E ≫ V_K (ใช้อุดมคติได้) และ R ≫ r_av (ตัด r_av ได้)', 'Pick the model from E ≫ V_K (the ideal model will do) and R ≫ r_av (drop r_av)'],
    ['วาดวงจรสมมูลแล้วแก้ด้วยกฎแรงดันรอบวง', 'Draw the equivalent circuit and solve it with the loop law']],
  traps: [['หน่วย: 26 mV หาร mA ได้ Ω ตรง ๆ (26/2 = 13 Ω) แต่ถ้าใส่ A ต้องคูณ 10⁻³ ให้ครบ', 'Units: 26 mV over mA is ohms directly (26/2 = 13 Ω); with amperes keep the 10⁻³'],
    ['r_d ≈ 26 mV/I_D ใช้ได้เฉพาะเหนือเข่า ที่กระแสต่ำตำราบวก r_B ของตัวไดโอด', 'r_d ≈ 26 mV/I_D only above the knee; at low current the book adds the body resistance r_B'],
    ['ไบแอสกลับ ≈ เปิดวงจร (กระแส I_s ระดับ nA–µA) จนถึงย่านซีเนอร์', 'Reverse bias ≈ an open circuit (I_s of nA to µA) up to the Zener region'],
    ['GaAs เข่า 1.2 V ไม่ใช่ 0.7 V · เยอรมาเนียม 0.3 V', 'GaAs knees at 1.2 V, not 0.7 V; germanium at 0.3 V']] },
2: { title: 'การประยุกต์ไดโอด', en: 'Diode applications',
  formulas: [
    [R`I_D = \frac{E - V_D}{R}`, 'เส้นโหลด: ตัดแกนที่ E/R และ E จุด Q คือจุดตัดกับกราฟ', 'the load line through E/R and E; Q is where it meets the curve'],
    [R`V_R = E - V_K,\qquad I_D = I_R = \frac{V_R}{R}`, 'วงจรอนุกรม: ไดโอดนำเมื่อทิศถูกและ E > V_K', 'a series circuit: the diode conducts when the direction is right and E > V_K'],
    [[R`V_{dc} = 0.318V_m\ (\text{ครึ่งคลื่น}),\qquad V_{dc} = 0.636V_m\ (\text{เต็มคลื่น})`, R`V_{dc} = 0.318V_m\ (\text{half-wave}),\qquad V_{dc} = 0.636V_m\ (\text{full-wave})`], 'ซิลิคอน: ใช้ (V_m − 0.7) · PIV: ครึ่งคลื่น V_m, บริดจ์ V_m, แท็ปกลาง 2V_m', 'silicon: use (V_m − 0.7) · PIV: half-wave V_m, bridge V_m, centre tap 2V_m'],
    [R`v_i = V \pm V_K`, 'คลิปเปอร์: ระดับเปลี่ยนสถานะ (transition level) คือแรงดันขาเข้าที่ไดโอดเริ่มนำ หาให้ได้ก่อน แล้ววาดขาออกสองช่วง', 'clippers: the transition level is the input at which the diode just conducts; find it first, then sketch the two intervals of the output'],
    [R`RC \gg \tfrac{T}{2},\qquad V_{o(p\text{-}p)} = V_{i(p\text{-}p)}`, 'แคลมเปอร์: สวิงยอดถึงยอดของขาออกเท่าขาเข้า เริ่มจากช่วงที่ไดโอดนำ (C ชาร์จ) แล้วใช้ V_C เลื่อนระดับ', 'clampers: the output\'s peak-to-peak swing equals the input\'s; start from the interval in which the diode conducts (C charges), then shift by V_C'],
    [R`V = \frac{R_L}{R + R_L}V_i,\qquad V \ge V_Z \;\Rightarrow\; V_L = V_Z,\quad I_Z = I_R - I_L`, 'ซีเนอร์: ถอดซีเนอร์ออกก่อนเพื่อหาสถานะ · I_R = (V_i − V_Z)/R, I_L = V_Z/R_L, P_Z = V_Z I_Z', 'Zener: take it out first to find its state · I_R = (V_i − V_Z)/R, I_L = V_Z/R_L, P_Z = V_Z I_Z'],
    [R`R_{L\min} = \frac{RV_Z}{V_i - V_Z},\qquad R_{L\max} = \frac{V_Z}{I_R - I_{ZM}}`, 'ช่วงโหลดที่ยังคุมแรงดันได้ (V_i คงที่) · ช่วงของ V_i เมื่อ R_L คงที่: V_imin = (R_L + R)V_Z/R_L, V_imax = (I_ZM + I_L)R + V_Z', 'the range of load that still regulates (fixed V_i) · the range of V_i for a fixed R_L: V_imin = (R_L + R)V_Z/R_L, V_imax = (I_ZM + I_L)R + V_Z']],
  recipe: [['สมมติสถานะของไดโอดแต่ละตัวจากทิศของแหล่งจ่าย (ดันกระแสตามหัวลูกศร = นำ)', 'Assume each diode\'s state from the direction the sources push (along the arrow = on)'],
    ['แทนตัวที่นำด้วย V_K (0.7 V Si, 0.3 V Ge) ตัวที่ไม่นำด้วยเปิดวงจร', 'Replace an on diode by V_K (0.7 V Si, 0.3 V Ge), an off diode by an open circuit'],
    ['แก้ด้วยกฎแรงดันรอบวงและกฎกระแส', 'Solve with the loop law and the current law'],
    ['ตรวจ: ตัวที่นำต้องมี I_D > 0 ตัวที่ไม่นำต้องมี V_D < V_K ไม่ผ่านให้สมมติใหม่', 'Check: an on diode needs I_D > 0, an off diode needs V_D < V_K; otherwise assume again'],
    ['ซีเนอร์: ถอดออก หา V_L ว่าง ถ้า ≥ V_Z จึงนำ แล้วหา I_Z และ P_Z เทียบพิกัด', 'Zener: remove it, find the open-circuit V_L; it conducts only if ≥ V_Z; then I_Z and P_Z against the ratings']],
  traps: [['ไดโอดขนานต่างชนิด: ตัวที่ V_K ต่ำกว่า (Ge) นำก่อนและตรึงแรงดัน อีกตัวไม่นำเลย', 'Diodes of different kinds in parallel: the lower V_K (Ge) conducts and clamps the voltage, the other stays off'],
    ['PIV ของแท็ปกลางเป็น 2V_m แต่ของบริดจ์เป็น V_m (ไดโอดสองตัวต่ออนุกรมรับแรงดันร่วมกัน)', 'PIV of the centre tap is 2V_m but of the bridge only V_m'],
    ['ครึ่งคลื่นกับซิลิคอน: V_dc = 0.318(V_m − 0.7) ไม่ใช่ 0.318V_m − 0.7', 'Half-wave with silicon: V_dc = 0.318(V_m − 0.7), not 0.318V_m − 0.7'],
    ['ซีเนอร์ที่ V_L ว่างต่ำกว่า V_Z ไม่นำ: V_L คือตัวแบ่งแรงดันธรรมดา I_Z = 0', 'A Zener whose open-circuit V_L is below V_Z is off: V_L is just the divider and I_Z = 0'],
    ['แคลมเปอร์: ห้ามเริ่มวิเคราะห์จากช่วงที่ไดโอดไม่นำ ต้องเริ่มจากช่วงที่ C ชาร์จ', 'Clampers: never start from the interval with the diode off; start where C charges']] },
3: { title: 'ทรานซิสเตอร์แบบรอยต่อคู่ (BJT)', en: 'Bipolar junction transistors',
  formulas: [
    [R`I_E = I_C + I_B`, 'กระแสทั้งสามขา (กฎกระแสที่ตัวทรานซิสเตอร์)', 'the three currents (the current law at the device)'],
    [R`\alpha_{dc} = \frac{I_C}{I_E},\qquad \beta_{dc} = \frac{I_C}{I_B}`, 'แอลฟาใกล้ 1 (0.9–0.998) เบตา 50–400', 'alpha close to 1 (0.9–0.998), beta 50–400'],
    [R`\alpha = \frac{\beta}{\beta + 1},\qquad \beta = \frac{\alpha}{1 - \alpha}`, 'แปลงระหว่างกัน · I_C = βI_B, I_E = (β + 1)I_B', 'converting between them · I_C = βI_B, I_E = (β + 1)I_B'],
    [R`\beta_{ac} = \frac{\Delta I_C}{\Delta I_B}\bigg|_{V_{CE} = \text{const}}`, 'อ่านจากกราฟสองเส้นข้างจุด Q · α_ac = ΔI_C/ΔI_E', 'read off the two curves around Q · α_ac = ΔI_C/ΔI_E'],
    [R`I_{CEO} = (\beta + 1)I_{CBO}`, 'กระแสรั่วเมื่อเบสเปิด ใหญ่กว่า I_CBO เป็น (β + 1) เท่า', 'the leakage with the base open, (β + 1) times I_CBO'],
    [R`V_{BE} \cong 0.7\ \text{V},\qquad P_{C\max} = V_{CE}I_C`, 'ย่านแอกทีฟ: B–E ไบแอสตรง B–C ไบแอสกลับ · ขีดจำกัด I_Cmax, BV_CEO, P_Cmax, V_CEsat ≈ 0.3 V', 'active region: B–E forward, B–C reverse · the limits I_Cmax, BV_CEO, P_Cmax, V_CEsat ≈ 0.3 V']],
  recipe: [['ระบุชนิด (npn/pnp) และทิศของกระแส: ลูกศรที่อิมิตเตอร์ชี้ทิศของ I_E', 'Name the type (npn/pnp) and the current directions: the emitter arrow gives I_E'],
    ['ใช้ I_E = I_C + I_B กับ α หรือ β หากระแสที่เหลือ', 'Use I_E = I_C + I_B with α or β for the missing current'],
    ['อ่านกราฟ: ไปตามเส้น I_B ที่ให้ จนถึง V_CE ที่ให้ แล้วอ่าน I_C', 'Reading curves: follow the given I_B curve to the given V_CE and read I_C'],
    ['ขีดจำกัด: วาดเส้น I_C = P_Cmax/V_CE จากสามจุด แล้วปิดด้วย I_Cmax, BV_CEO, V_CEsat', 'Limits: plot I_C = P_Cmax/V_CE from three points, then close the region with I_Cmax, BV_CEO, V_CEsat']],
  traps: [['α ไม่มีทางเกิน 1 ถ้าได้เกิน แสดงว่าสลับ I_C กับ I_E', 'α can never exceed 1; if it does you swapped I_C and I_E'],
    ['β_ac ใช้ผลต่าง (Δ) ส่วน β_dc ใช้ค่าที่จุด ทั้งสองต่างกันเล็กน้อย', 'β_ac uses differences, β_dc the values at the point; they differ slightly'],
    ['I_CEO กับ I_CBO ต่างกัน (β + 1) เท่า อย่าใช้สลับกัน', 'I_CEO and I_CBO differ by (β + 1); do not swap them'],
    ['ในวงจรเบสร่วม V_CB แทบไม่มีผลต่อ I_C (I_C ≈ αI_E)', 'In the common-base circuit V_CB hardly changes I_C (I_C ≈ αI_E)']] },
4: { title: 'ไบแอสกระแสตรงของ BJT', en: 'DC biasing of BJTs',
  formulas: [
    [R`I_B = \frac{V_{CC} - V_{BE}}{R_B},\qquad V_{CE} = V_{CC} - I_CR_C`, 'ไบแอสคงที่ · อิ่มตัว I_Csat = V_CC/R_C', 'fixed bias · saturation I_Csat = V_CC/R_C'],
    [R`I_B = \frac{V_{CC} - V_{BE}}{R_B + (\beta + 1)R_E},\qquad V_{CE} = V_{CC} - I_C(R_C + R_E)`, 'ไบแอสอิมิตเตอร์: R_E สะท้อนเข้าเบส (β + 1) เท่า · I_Csat = V_CC/(R_C + R_E)', 'emitter bias: R_E reflected into the base (β + 1) times · I_Csat = V_CC/(R_C + R_E)'],
    [R`R_{Th} = R_1 \| R_2,\quad E_{Th} = \frac{R_2V_{CC}}{R_1 + R_2},\quad I_B = \frac{E_{Th} - V_{BE}}{R_{Th} + (\beta + 1)R_E}`, 'ตัวแบ่งแรงดัน (แม่นยำ) · แบบประมาณเมื่อ βR_E ≥ 10R_2: V_B = E_Th, V_E = V_B − 0.7, I_E = V_E/R_E ≅ I_C', 'voltage divider (exact) · approximate when βR_E ≥ 10R_2: V_B = E_Th, V_E = V_B − 0.7, I_E = V_E/R_E ≅ I_C'],
    [R`I_B = \frac{V_{CC} - V_{BE}}{R_F + \beta(R_C + R_E)},\qquad V_{CE} = V_{CC} - I_C(R_C + R_E)`, 'ป้อนกลับคอลเล็กเตอร์ (ตำราใช้ I_C′ ≅ I_C)', 'collector feedback (the book takes I_C′ ≅ I_C)'],
    [R`I_B = \frac{V_{EE} - V_{BE}}{R_B + (\beta + 1)R_E},\qquad V_{CE} = V_{EE} - I_ER_E`, 'ตัวตามอิมิตเตอร์ (คอลเล็กเตอร์ต่อกราวด์ อิมิตเตอร์ต่อ −V_EE) · เบสร่วม: I_E = (V_EE − 0.7)/R_E, V_CB = V_CC − I_CR_C', 'emitter follower (collector grounded, emitter to −V_EE) · common base: I_E = (V_EE − 0.7)/R_E, V_CB = V_CC − I_CR_C'],
    [R`R = \frac{V_R}{I_R},\qquad V_E \cong \tfrac{1}{10}V_{CC},\quad R_2 \le \tfrac{1}{10}\beta R_E`, 'ออกแบบ: ตั้ง Q (I_C, V_CE) แล้วคิดย้อน กฎนิ้วหัวแม่มือของตำรา', 'design: fix Q (I_C, V_CE) and work backwards; the book\'s rules of thumb']],
  recipe: [['วงรอบเบส–อิมิตเตอร์: เขียน KVL ผ่าน V_BE = 0.7 V แล้วแก้ I_B (ถ้ามี R_E ให้สะท้อนเป็น (β + 1)R_E)', 'The base–emitter loop: KVL through V_BE = 0.7 V gives I_B (an R_E appears as (β + 1)R_E)'],
    ['I_C = βI_B และ I_E = (β + 1)I_B', 'I_C = βI_B and I_E = (β + 1)I_B'],
    ['วงรอบคอลเล็กเตอร์–อิมิตเตอร์: V_CE = V_CC − I_CR_C − I_ER_E', 'The collector–emitter loop: V_CE = V_CC − I_CR_C − I_ER_E'],
    ['ตรวจอิ่มตัว: V_CE ต้องเป็นบวก (> 0.3 V) ถ้าติดลบ ทรานซิสเตอร์อิ่มตัว ใช้ I_Csat แทน', 'Check saturation: V_CE must be positive (> 0.3 V); if negative, the transistor is saturated and I_Csat applies'],
    ['แรงดันโหนด: V_E = I_ER_E, V_B = V_E + 0.7, V_C = V_CC − I_CR_C, V_BC = V_B − V_C (ต้องเป็นลบ)', 'Node voltages: V_E = I_ER_E, V_B = V_E + 0.7, V_C = V_CC − I_CR_C, V_BC = V_B − V_C (must be negative)']],
  traps: [['ลืม (β + 1) กับ R_E ในวงรอบเบส ทำให้ I_B ใหญ่เกินจริงหลายเท่า', 'Forgetting the (β + 1) with R_E in the base loop makes I_B several times too large'],
    ['ตัวแบ่งแรงดัน: ตรวจ βR_E ≥ 10R_2 ก่อนใช้วิธีประมาณ ไม่ผ่านต้องใช้เทเวนิน', 'Voltage divider: test βR_E ≥ 10R_2 before the approximate method; otherwise Thévenin'],
    ['V_CE ≠ V_C เมื่อมี R_E (V_C = V_CE + V_E)', 'V_CE ≠ V_C when there is an R_E (V_C = V_CE + V_E)'],
    ['V_CE ที่คำนวณติดลบไม่มีความหมาย: วงจรอิ่มตัว I_C = I_Csat, V_CE ≈ 0', 'A negative computed V_CE is meaningless: the circuit is saturated, I_C = I_Csat, V_CE ≈ 0'],
    ['pnp: ขนาดเท่าเดิม ขั้วกลับ (V_EB = 0.7 V, V_EC บวก)', 'pnp: the same magnitudes with the polarities reversed (V_EB = 0.7 V, V_EC positive)']] },
5: { title: 'ทรานซิสเตอร์สนามไฟฟ้าแบบรอยต่อ (JFET)', en: 'Junction field-effect transistors',
  formulas: [
    [R`I_D = I_{DSS}\left(1 - \frac{V_{GS}}{V_P}\right)^2`, 'สมการของช็อกลีย์ (ย่านอิ่มตัว) · I_G = 0 เสมอ', 'Shockley\'s equation (saturation region) · I_G = 0 always'],
    [R`V_{GS} = V_P\left(1 - \sqrt{\frac{I_D}{I_{DSS}}}\right)`, 'กลับทางจาก I_D ไป V_GS', 'the inverse, from I_D to V_GS'],
    [R`(0,\ I_{DSS}),\quad (0.3V_P,\ \tfrac{I_{DSS}}{2}),\quad (0.5V_P,\ \tfrac{I_{DSS}}{4}),\quad (V_P,\ 0)`, 'สี่จุดสำหรับร่างเส้นถ่ายโอน', 'four points to sketch the transfer curve'],
    [[R`V_{DS} \ge V_{GS} - V_P\ (\text{อิ่มตัว}),\qquad r_d = \frac{r_o}{(1 - V_{GS}/V_P)^2}`, R`V_{DS} \ge V_{GS} - V_P\ (\text{saturation}),\qquad r_d = \frac{r_o}{(1 - V_{GS}/V_P)^2}`], 'พินช์ออฟ: ต้องอยู่ขวาของเส้น V_DS = V_GS − V_P ช็อกลีย์จึงใช้ได้ · ความต้านทานในย่านโอห์มมิก', 'pinch-off: to the right of V_DS = V_GS − V_P Shockley holds · the ohmic-region resistance'],
    [R`V_{GS} = -V_{GG}\quad\cdot\quad V_{GS} = -I_DR_S\quad\cdot\quad V_{GS} = V_G - I_DR_S,\ V_G = \frac{R_2V_{DD}}{R_1 + R_2}`, 'เส้นไบแอสของวงจรคงที่ · ตัวเอง · ตัวแบ่งแรงดัน (ไม่มีโหลดเพราะ I_G = 0)', 'the bias line of the fixed, self and voltage-divider circuits (unloaded because I_G = 0)'],
    [R`V_{DS} = V_{DD} - I_D(R_D + R_S),\quad V_S = I_DR_S,\quad V_D = V_{DD} - I_DR_D`, 'วงรอบเดรน–ซอร์ส หลังได้ I_D', 'the drain–source loop once I_D is known']],
  recipe: [['เขียนสมการวงจรของเกต (เส้นไบแอส) เป็น V_GS ในรูปของ I_D', 'Write the gate circuit\'s equation (the bias line): V_GS in terms of I_D'],
    ['แก้ร่วมกับช็อกลีย์: วาดกราฟ (เส้นถ่ายโอน 4 จุด + เส้นไบแอส) หรือแก้สมการกำลังสองแล้วเลือกรากที่ V_P < V_GS < 0', 'Solve it with Shockley: graphically (the 4-point curve and the bias line) or the quadratic, keeping the root with V_P < V_GS < 0'],
    ['V_DS = V_DD − I_D(R_D + R_S) แล้ว V_S, V_D, V_G, V_DG', 'V_DS = V_DD − I_D(R_D + R_S), then V_S, V_D, V_G, V_DG'],
    ['ตรวจอิ่มตัว: V_DS ≥ V_GS − V_P', 'Check saturation: V_DS ≥ V_GS − V_P']],
  traps: [['V_P เป็นลบสำหรับช่อง n: (1 − V_GS/V_P) กับ V_GS = −2 V, V_P = −6 V คือ (1 − 1/3) ไม่ใช่ (1 + 1/3)', 'V_P is negative for an n-channel: with V_GS = −2 V, V_P = −6 V the bracket is (1 − 1/3), not (1 + 1/3)'],
    ['สมการกำลังสองมีสองราก รากที่ |V_GS| > |V_P| ใช้ไม่ได้ (ทรานซิสเตอร์คัตออฟแล้ว)', 'The quadratic has two roots; the one with |V_GS| > |V_P| is not physical (the device is cut off)'],
    ['กราฟอ่านได้ประมาณ ±0.1 mA ตำราจึงให้ค่าปัด เช่น 2.6 mA แทน 2.59', 'Graphs read to about ±0.1 mA; the book rounds, e.g. 2.6 mA for 2.59'],
    ['ตำราไม่ตรวจพินช์ออฟ: Example 7.1 ของตำราอยู่ในย่านโอห์มมิก (ช็อกลีย์ให้ค่าเกินจริง)', 'The book never checks pinch-off: its Example 7.1 sits in the ohmic region (Shockley overstates I_D)']] },
6: { title: 'มอสเฟต (MOSFET)', en: 'MOSFETs',
  formulas: [
    [[R`I_D = I_{DSS}\left(1 - \frac{V_{GS}}{V_P}\right)^2,\qquad V_{GS} < 0\ \text{และ}\ V_{GS} > 0`, R`I_D = I_{DSS}\left(1 - \frac{V_{GS}}{V_P}\right)^2,\qquad V_{GS} < 0\ \text{and}\ V_{GS} > 0`], 'ดีพลีชัน: ช็อกลีย์ใช้ได้ทั้งสองโหมด ที่ V_GS > 0 ได้ I_D > I_DSS', 'depletion type: Shockley on both sides; for V_GS > 0, I_D > I_DSS'],
    [R`I_D = k(V_{GS} - V_T)^2,\qquad k = \frac{I_{D(\text{on})}}{(V_{GS(\text{on})} - V_T)^2}`, 'เอนฮานซ์เมนต์: ไม่นำจนกว่า V_GS > V_T · k จากจุดบนแผ่นข้อมูล', 'enhancement type: off until V_GS > V_T · k from the data-sheet point'],
    [R`V_{DS\text{sat}} = V_{GS} - V_T`, 'ขอบของย่านอิ่มตัวของเอนฮานซ์เมนต์', 'the edge of the saturation region of an enhancement device'],
    [R`V_{GS} = V_{DS} = V_{DD} - I_DR_D`, 'ไบแอสป้อนกลับ (R_G จากเดรนมาเกต ไม่มีกระแส)', 'feedback bias (R_G from drain to gate carries no current)'],
    [R`V_{GS} = V_G - I_DR_S,\qquad V_G = \frac{R_2V_{DD}}{R_1 + R_2}`, 'ตัวแบ่งแรงดัน เหมือน JFET', 'voltage divider, as for the JFET']],
  recipe: [['ระบุชนิด: ดีพลีชัน (I_DSS, V_P → ช็อกลีย์) หรือเอนฮานซ์เมนต์ (V_T, k)', 'Name the type: depletion (I_DSS, V_P → Shockley) or enhancement (V_T, k)'],
    ['เอนฮานซ์เมนต์: หา k จาก I_D(on) ที่ V_GS(on) ก่อน', 'Enhancement: get k from I_D(on) at V_GS(on) first'],
    ['เส้นไบแอสจากวงจรเกต แล้วแก้ร่วม (กำลังสองหรือกราฟ)', 'The bias line from the gate circuit, then solve jointly (quadratic or graph)'],
    ['V_DS จากวงรอบเดรน แล้วตรวจอิ่มตัว (V_DS ≥ V_GS − V_T หรือ ≥ V_GS − V_P)', 'V_DS from the drain loop, then check saturation (V_DS ≥ V_GS − V_T or ≥ V_GS − V_P)']],
  traps: [['ดีพลีชันที่ V_GS > 0: I_D เกิน I_DSS ได้ (Example 6.3: 15.63 mA จาก 10 mA)', 'A depletion device at V_GS > 0 exceeds I_DSS (Example 6.3: 15.63 mA from 10 mA)'],
    ['ห้ามใช้ช็อกลีย์กับเอนฮานซ์เมนต์ และห้ามใช้ k(V_GS − V_T)² ต่ำกว่า V_T (I_D = 0)', 'Never use Shockley for an enhancement device, nor k(V_GS − V_T)² below V_T (I_D = 0)'],
    ['หน่วยของ k เป็น mA/V²: 6 mA/(8 − 3)² = 0.24 mA/V²', 'k is in mA/V²: 6 mA/(8 − 3)² = 0.24 mA/V²'],
    ['ไบแอสป้อนกลับ: V_G = V_D เพราะ R_G ไม่มีกระแส ไม่ใช่ V_G = 0', 'Feedback bias: V_G = V_D because R_G carries no current, not V_G = 0']] },
7: { title: 'ออปแอมป์', en: 'Operational amplifiers',
  formulas: [
    [R`V_o = A_dV_d + A_cV_c,\quad V_d = V_{i1} - V_{i2},\quad V_c = \frac{V_{i1} + V_{i2}}{2}`, 'วงจรเปิด: ผลต่างกับโหมดร่วม', 'open loop: difference and common-mode parts'],
    [R`\text{CMRR} = \frac{A_d}{A_c},\qquad \text{CMRR(dB)} = 20\log_{10}\frac{A_d}{A_c}`, 'อัตราส่วนปฏิเสธโหมดร่วม (common-mode rejection ratio)', 'the common-mode rejection ratio'],
    [R`V_o = -\frac{R_f}{R_1}V_1\quad\cdot\quad V_o = \left(1 + \frac{R_f}{R_1}\right)V_1\quad\cdot\quad V_o = V_1`, 'กลับเฟส (กราวด์เสมือน) · ไม่กลับเฟส · ตัวตามแรงดัน · ขาออกไม่เกิน ±V_sat', 'inverting (virtual ground) · noninverting · follower · the output never exceeds ±V_sat'],
    [R`V_o = -\left(\frac{R_f}{R_1}V_1 + \frac{R_f}{R_2}V_2 + \frac{R_f}{R_3}V_3\right)`, 'วงจรรวมสัญญาณ: แต่ละขาเข้ามีอัตราขยายของตัวเอง', 'the summing amplifier: each input has its own gain'],
    [R`v_o = -\frac{1}{RC}\int v_1\,dt\quad\cdot\quad v_o = -RC\frac{dv_1}{dt}`, 'อินทิเกรเตอร์: ขาเข้าคงที่ → แรมป์ความชัน −V_1/RC · ดิฟเฟอเรนชิเอเตอร์', 'integrator: a constant input → a ramp of slope −V_1/RC · differentiator'],
    [R`f_{OH} = \frac{1}{2\pi R_1C_1}\ (\text{LP}),\quad f_{OL} = \frac{1}{2\pi R_1C_1}\ (\text{HP}),\quad A_v = 1 + \frac{R_F}{R_G}`, 'ตัวกรองแอกทีฟ: ลด 20 dB/ทศวรรษต่ออันดับ ที่ความถี่ตัด |A| = A_v/√2 (−3 dB)', 'active filters: 20 dB/decade per order; at the cutoff |A| = A_v/√2 (−3 dB)']],
  recipe: [['มีป้อนกลับลบ → ลัดเสมือน V_+ ≈ V_− และ I_in = 0 (ไม่มีป้อนกลับ → เป็นวงจรเปรียบเทียบ บทที่ 8)', 'Negative feedback → virtual short V_+ ≈ V_− and I_in = 0 (no feedback → a comparator, chapter 8)'],
    ['เขียนกฎกระแสที่ขั้ว − : กระแสจากขาเข้าทั้งหมดไหลผ่าน R_f', 'The current law at the − input: every input current flows on through R_f'],
    ['แก้หา V_o แล้วเทียบกับ ±V_sat ถ้าเกินตอบ ±V_sat', 'Solve for V_o and compare with ±V_sat; beyond it the answer is ±V_sat'],
    ['ตัวกรอง: หาความถี่ตัดจาก RC และอัตราขยายย่านผ่านจาก R_F/R_G แยกกัน', 'Filters: the cutoff from RC and the passband gain from R_F/R_G, separately']],
  traps: [['กราวด์เสมือนคือ V_− ≈ 0 V แต่ไม่มีกระแสไหลลงกราวด์ที่ขั้วนั้น', 'The virtual ground means V_− ≈ 0 V, yet no current flows to ground there'],
    ['ไม่กลับเฟสมี "1 +": อัตราขยายต่ำสุดคือ 1 (ตัวตาม)', 'The noninverting gain has the "1 +": its smallest value is 1 (the follower)'],
    ['วงจรรวม: เครื่องหมายลบและอัตราส่วน R_f/R_k ตัวต่อตัว อย่ารวมความต้านทานก่อน', 'Summing: the minus sign and one ratio R_f/R_k per input; do not combine the resistors first'],
    ['ตรวจอิ่มตัวทุกครั้ง: ±13 V บนไฟเลี้ยง ±15 V (ข้อ 8 ของบทที่ 7 ต้องการ −16.5 V จึงได้ −13 V)', 'Always check saturation: ±13 V on ±15 V supplies (chapter 7 Problem 8 wants −16.5 V and gets −13 V)'],
    ['เดซิเบลของอัตราขยายแรงดันใช้ 20 log ไม่ใช่ 10 log', 'Decibels of a voltage gain use 20 log, not 10 log']] },
8: { title: 'ไอซีเชิงเส้น-ดิจิทัล', en: 'Linear-digital ICs',
  formulas: [
    [R`V_+ > V_-:\ V_o = +V_{sat},\qquad V_{ref} = \frac{R_2}{R_1 + R_2}V^+`, 'วงจรเปรียบเทียบ: ไม่มีป้อนกลับ ขาออกสวิงสุด · ตัวตรวจจับหน้าต่าง: สูงเมื่อ V_ref2 < V_in < V_ref1', 'comparator: no feedback, the output swings fully · window detector: high for V_ref2 < V_in < V_ref1'],
    [[R`\text{ขั้น} = \frac{V_{ref}}{2^n},\qquad V_o = \frac{D}{2^n}V_{ref}`, R`\text{step} = \frac{V_{ref}}{2^n},\qquad V_o = \frac{D}{2^n}V_{ref}`], 'บันได R-2R (DAC): n บิต รหัส D · ADC แบบบันได: เวลาแปลงสูงสุด 2ⁿ คาบสัญญาณนาฬิกา', 'the R-2R ladder (DAC): n bits, code D · ladder ADC: at most 2ⁿ clock periods per conversion'],
    [R`T_{high} = 0.7(R_A + R_B)C,\quad T_{low} = 0.7R_BC,\quad f = \frac{1.44}{(R_A + 2R_B)C}`, '555 แอสเทเบิล: C สวิงระหว่าง V_CC/3 กับ 2V_CC/3 (0.7 = ln 2) · duty cycle = T_high/T > 50 % เสมอ', '555 astable: C swings between V_CC/3 and 2V_CC/3 (0.7 = ln 2) · duty cycle = T_high/T, always > 50 %'],
    [R`T_{high} = 1.1R_AC`, '555 โมโนสเทเบิล (วันช็อต): ทริกเกอร์ที่ขา 2 ต่ำกว่า V_CC/3 (1.1 = ln 3)', '555 one-shot: triggered when pin 2 drops below V_CC/3 (1.1 = ln 3)'],
    [R`f_o = \frac{2}{R_1C_1}\left(\frac{V^+ - V_C}{V^+}\right)`, '566: V_C จากตัวแบ่งที่ขา 5 · ขีดจำกัด 0.75V⁺ ≤ V_C ≤ V⁺, 2 kΩ ≤ R_1 ≤ 20 kΩ, f_o ≤ 1 MHz', '566: V_C from the divider at pin 5 · limits 0.75V⁺ ≤ V_C ≤ V⁺, 2 kΩ ≤ R_1 ≤ 20 kΩ, f_o ≤ 1 MHz']],
  recipe: [['ดูว่าออปแอมป์มีป้อนกลับลบ (เชิงเส้น) หรือไม่ (สวิตช์: ขาออก ±V_sat)', 'See whether the op-amp has negative feedback (linear) or not (a switch: ±V_sat out)'],
    ['ตัวแบ่งแรงดันให้ V_ref หรือ V_C ก่อน', 'The divider gives V_ref or V_C first'],
    ['แทนสูตรของไอซีนั้น (ขั้นของ DAC, 0.7/1.1 ของ 555, 2/R_1C_1 ของ 566)', 'Then the IC\'s own formula (the DAC step, 0.7/1.1 of the 555, 2/R_1C_1 of the 566)'],
    ['ตรวจขีดจำกัด: 555 duty > 50 %, 566 ช่วงของ V_C และ R_1, ADC จำนวนนับไม่เกิน 2ⁿ − 1', 'Check the limits: 555 duty > 50 %, 566 ranges of V_C and R_1, ADC count at most 2ⁿ − 1']],
  traps: [['555 แอสเทเบิล: T_high > T_low เสมอ (R_A + R_B เทียบ R_B) ถ้าได้ duty < 50 % แสดงว่าสลับสูตร', '555 astable: T_high > T_low always (R_A + R_B against R_B); a duty below 50 % means the formulas are swapped'],
    ['1.44 ≈ 1/0.693 เป็นค่าประมาณ ความถี่จาก 1/(T_high + T_low) ต่างกันราว 1 %', '1.44 ≈ 1/0.693 is an approximation; 1/(T_high + T_low) differs by about 1 %'],
    ['566 ใช้ V_C ที่ไม่ปัด: 10.43 V ให้ 31.8 kHz ส่วนตำราปัดเป็น 10.4 V แล้วได้ 32.5 kHz', 'Use the unrounded V_C in the 566: 10.43 V gives 31.8 kHz where the book rounds to 10.4 V and gets 32.5 kHz'],
    ['วงจรเปรียบเทียบไม่ใช้สูตรอัตราขยาย: ขาออกคือ ±V_sat ตามเครื่องหมายของ V_+ − V_−', 'A comparator has no gain formula: the output is ±V_sat by the sign of V_+ − V_−'],
    ['ความละเอียดของ ADC/DAC คือ V_ref/2ⁿ ไม่ใช่ V_ref/(2ⁿ − 1) ในตำรานี้', 'Resolution of the ADC/DAC is V_ref/2ⁿ in this book, not V_ref/(2ⁿ − 1)']] }
};

/* =====================================================================================================================
   2) the drills: { ch, page, title, gen() → p, given(p) → html, fields(p) → [{label, ans, tol, alt}], steps(p) → [{why, tex}],
   answer(p) → html, pic(p) → circuit spec | null, engine(circuit, p) → html, view, aspect }.  Every answer has a closed form
   (the book's hand method); the picture is the same circuit solved by the engine, so the student can hover over it and compare. */
const DRILLS = [];
const drill = o => { DRILLS.push(o); return o; };
const SI = { model: 'simple', vk: 0.7 };
const VSAT = 13;
const clip = v => Math.max(-VSAT, Math.min(VSAT, v));
const step = (why, tex) => ({ why, tex });
const W_ = (a, b, o = {}) => ({ type: 'W', a, b, ...o });

/* ---- chapter 1 ---- */
drill({ ch: 1, page: 'ch1_5_resistance.html', title: t('ระดับความต้านทานของไดโอด', 'Resistance levels of a diode'),
  gen: () => { const q = pick([[0.7, 2e-3], [0.8, 20e-3], [0.75, 10e-3], [0.65, 1e-3], [0.85, 40e-3], [0.72, 5e-3]]); return { V: q[0], I: q[1] }; },
  given: p => t(`ไดโอดซิลิคอนทำงานที่จุด \\(V_D = ${fx(p.V)}\\) V, \\(I_D = ${fx(p.I * 1e3)}\\) mA (25 °C) จงหาความต้านทานกระแสตรง \\(R_D\\) และความต้านทานกระแสสลับ \\(r_d\\) ที่จุดนี้ (ใช้ \\(r_d \\cong 26\\ \\text{mV}/I_D\\))`,
    `A silicon diode operates at \\(V_D = ${fx(p.V)}\\) V, \\(I_D = ${fx(p.I * 1e3)}\\) mA (25 °C). Find the dc resistance \\(R_D\\) and the ac resistance \\(r_d\\) at this point (use \\(r_d \\cong 26\\ \\text{mV}/I_D\\)).`),
  fields: p => [{ label: 'R_D (Ω)', ans: p.V / p.I }, { label: 'r_d (Ω)', ans: 0.026 / p.I }],
  steps: p => [step(t('ความต้านทานกระแสตรง: แรงดันหารกระแสที่จุดนั้น', 'dc resistance: the voltage over the current at that point'), R`R_D = \frac{V_D}{I_D} = \frac{${fx(p.V)}\ \text{V}}{${fx(p.I * 1e3)}\ \text{mA}} = ${fx(p.V / p.I, 1)}\ \Omega`),
    step(t('ความต้านทานกระแสสลับ: ความชันของเส้นสัมผัส ซึ่งเหนือเข่าประมาณได้จาก 26 mV/I_D', 'ac resistance: the slope of the tangent, which above the knee is about 26 mV/I_D'), R`r_d \cong \frac{26\ \text{mV}}{I_D} = \frac{26\ \text{mV}}{${fx(p.I * 1e3)}\ \text{mA}} = ${fx(0.026 / p.I, 2)}\ \Omega`),
    step(t('r_d เล็กกว่า R_D เสมอเหนือเข่า เพราะเส้นสัมผัสชันกว่าเส้นจากจุดกำเนิด', 'r_d is always below R_D above the knee: the tangent is steeper than the line from the origin'), '')],
  answer: p => `\\(R_D = ${fx(p.V / p.I, 1)}\\ \\Omega\\), \\(r_d \\cong ${fx(0.026 / p.I, 2)}\\ \\Omega\\)` });

drill({ ch: 1, page: 'ch1_6_equivalent.html', title: t('สามแบบจำลองในวงจรอนุกรม', 'The three models in a series circuit'), aspect: 0.6,
  gen: () => ({ E: pick([5, 8, 10, 12, 15]), Rr: pick([470, 1000, 2200, 4700]), rav: 10 }),
  given: p => t(`แหล่งจ่าย \\(E = ${fx(p.E)}\\) V ต่ออนุกรมกับ \\(R = ${kOx(p.Rr)}\\) และไดโอดซิลิคอน (ไบแอสตรง) จงหา \\(I_D\\) ด้วยแบบจำลองอุดมคติ แบบง่าย (0.7 V) และเชิงเส้นเป็นช่วง (0.7 V กับ \\(r_{av} = 10\\ \\Omega\\))`,
    `A source \\(E = ${fx(p.E)}\\) V in series with \\(R = ${kOx(p.Rr)}\\) and a forward-biased silicon diode. Find \\(I_D\\) with the ideal, the simplified (0.7 V) and the piecewise-linear model (0.7 V with \\(r_{av} = 10\\ \\Omega\\)).`),
  fields: p => [{ label: t('อุดมคติ I_D (mA)', 'ideal I_D (mA)'), ans: p.E / p.Rr * 1e3 }, { label: t('แบบง่าย I_D (mA)', 'simplified I_D (mA)'), ans: (p.E - 0.7) / p.Rr * 1e3 }, { label: t('เชิงเส้นเป็นช่วง I_D (mA)', 'piecewise I_D (mA)'), ans: (p.E - 0.7) / (p.Rr + p.rav) * 1e3 }],
  steps: p => [step(t('อุดมคติ: ไดโอดเป็นลัดวงจร', 'ideal: the diode is a short'), R`I_D = \frac{E}{R} = \frac{${fx(p.E)}}{${kOx(p.Rr)}} = ${mAx(p.E / p.Rr, 3)}`),
    step(t('แบบง่าย: แบตเตอรี่ 0.7 V ต้านอยู่', 'simplified: a 0.7 V battery opposes'), R`I_D = \frac{E - 0.7}{R} = \frac{${fx(p.E - 0.7)}}{${kOx(p.Rr)}} = ${mAx((p.E - 0.7) / p.Rr, 3)}`),
    step(t('เชิงเส้นเป็นช่วง: บวก r_av เข้ากับ R', 'piecewise-linear: r_av adds to R'), R`I_D = \frac{E - 0.7}{R + r_{av}} = \frac{${fx(p.E - 0.7)}}{${kOx(p.Rr + p.rav)}} = ${mAx((p.E - 0.7) / (p.Rr + p.rav), 3)}`),
    step(t(`ต่างกันไม่ถึง ${fx(100 * 0.7 / p.E, 0)} % ระหว่างอุดมคติกับแบบง่าย เพราะ E ≫ 0.7 V และ R ≫ r_av: เลือกแบบง่ายพอ`, `The ideal and simplified answers differ by under ${fx(100 * 0.7 / p.E, 0)} % because E ≫ 0.7 V and R ≫ r_av: the simplified model is enough`), '')],
  answer: p => `\\(I_D = ${fx(p.E / p.Rr * 1e3, 3)}\\), \\(${fx((p.E - 0.7) / p.Rr * 1e3, 3)}\\), \\(${fx((p.E - 0.7) / (p.Rr + p.rav) * 1e3, 3)}\\) mA`,
  pic: p => CH1.series({ E: p.E, R: p.Rr, d: { ...SI, valText: '0.7 V' } }), 
  engine: c => t(`ตัวแก้วงจร (แบบง่าย 0.7 V): \\(I_D = ${fx(c.I('D').re * 1e3, 3)}\\) mA`, `engine (simplified 0.7 V): \\(I_D = ${fx(c.I('D').re * 1e3, 3)}\\) mA`) });

/* ---- chapter 2 ---- */
drill({ ch: 2, page: 'ch2_3_two_diodes.html', title: t('วงจรอนุกรมสองแหล่งจ่าย (แบบ Example 2.9)', 'A series loop with two supplies (as Example 2.9)'), aspect: 0.5,
  gen: () => ({ E1: pick([10, 12, 15]), E2: pick([4, 5, 6]), R1: pick([2200, 3300, 4700]), R2: pick([1000, 2200, 3300]), ge: Math.random() < 0.3 }),
  given: p => t(`แหล่งจ่าย \\(E_1 = +${fx(p.E1)}\\) V ผ่าน \\(R_1 = ${kOx(p.R1)}\\) เข้าไดโอด${p.ge ? 'เยอรมาเนียม' : 'ซิลิคอน'} (แอโนดด้าน \\(R_1\\)) แล้วผ่าน \\(R_2 = ${kOx(p.R2)}\\) ไปยัง \\(E_2 = -${fx(p.E2)}\\) V จงหากระแสในวง และ \\(V_o\\) ที่จุดต่อระหว่างไดโอดกับ \\(R_2\\)`,
    `A supply \\(E_1 = +${fx(p.E1)}\\) V through \\(R_1 = ${kOx(p.R1)}\\) into a ${p.ge ? 'germanium' : 'silicon'} diode (anode on the \\(R_1\\) side), then through \\(R_2 = ${kOx(p.R2)}\\) to \\(E_2 = -${fx(p.E2)}\\) V. Find the loop current and \\(V_o\\) at the junction of the diode and \\(R_2\\).`),
  fields: p => { const vk = p.ge ? 0.3 : 0.7, I = (p.E1 + p.E2 - vk) / (p.R1 + p.R2); return [{ label: 'I (mA)', ans: I * 1e3 }, { label: 'V_o (V)', ans: I * p.R2 - p.E2, tol: 0.03 }]; },
  steps: p => { const vk = p.ge ? 0.3 : 0.7, I = (p.E1 + p.E2 - vk) / (p.R1 + p.R2); return [
    step(t('ทั้งสองแหล่งจ่ายดันกระแสตามหัวลูกศร: ไดโอดนำ แทนด้วย V_K', 'Both supplies push along the arrow: the diode is on, replace it by V_K'), R`E_1 + E_2 - V_K = I(R_1 + R_2)`),
    step(t('กระแสในวง', 'the loop current'), R`I = \frac{${fx(p.E1)} + ${fx(p.E2)} - ${fx(vk)}}{${kOx(p.R1 + p.R2)}} = ${mAx(I, 3)}`),
    step(t('V_o วัดเทียบกราวด์: จาก −E_2 ขึ้นมาตาม I R_2', 'V_o against ground: up from −E_2 by I R_2'), R`V_o = -E_2 + IR_2 = -${fx(p.E2)} + (${mAx(I, 3)})(${kOx(p.R2)}) = ${Vx(I * p.R2 - p.E2, 2)}`)]; },
  answer: p => { const vk = p.ge ? 0.3 : 0.7, I = (p.E1 + p.E2 - vk) / (p.R1 + p.R2); return `\\(I = ${fx(I * 1e3, 3)}\\) mA, \\(V_o = ${fx(I * p.R2 - p.E2, 2)}\\) V`; },
  pic: p => ({ ground: 'g', nodes: { a: [0, 0], b: [2.4, 0], o: [4.8, 0], c: [7.2, 0], g: [0, 2.6], g2: [7.2, 2.6], _padR: [8.4, 0] },
    parts: [{ id: 'E1', type: 'V', a: 'a', b: 'g', value: p.E1, name: 'E_1', valText: `${fd(p.E1)} V`, side: -1 }, { id: 'R1', type: 'R', a: 'a', b: 'b', value: p.R1, name: 'R_1', valText: kO(p.R1) },
      { id: 'D', type: 'D', a: 'b', b: 'o', model: 'simple', vk: p.ge ? 0.3 : 0.7, name: p.ge ? 'Ge' : 'Si', valText: '' }, { id: 'R2', type: 'R', a: 'o', b: 'c', value: p.R2, name: 'R_2', valText: kO(p.R2) },
      { id: 'E2', type: 'V', a: 'g2', b: 'c', value: p.E2, name: 'E_2', valText: `−${fd(p.E2)} V` }, W_('g', 'g2')] }), 
  engine: c => t(`ตัวแก้วงจร: \\(I = ${fx(c.I('R1').re * 1e3, 3)}\\) mA, \\(V_o = ${fx(c.V('o').re, 2)}\\) V`, `engine: \\(I = ${fx(c.I('R1').re * 1e3, 3)}\\) mA, \\(V_o = ${fx(c.V('o').re, 2)}\\) V`) });

drill({ ch: 2, page: 'ch2_6_full_wave.html', title: t('วงจรเรียงกระแส: ค่าเฉลี่ยและ PIV', 'Rectifiers: the dc level and the PIV'), aspect: 0.55,
  gen: () => ({ kind: pick(['hw', 'bridge', 'ct']), Vm: pick([10, 15, 20, 24, 30]), Rr: 2000 }),
  given: p => { const nm = { hw: t('ครึ่งคลื่น (ไดโอดตัวเดียว)', 'half-wave (one diode)'), bridge: t('เต็มคลื่นแบบบริดจ์', 'full-wave bridge'), ct: t('เต็มคลื่นแบบแท็ปกลาง (แต่ละครึ่งของขดทุติยภูมิมียอด V_m)', 'full-wave centre-tapped (each half of the secondary peaks at V_m)') }[p.kind];
    return t(`วงจรเรียงกระแส${nm} ไดโอดอุดมคติ ขาเข้าไซน์ยอด \\(V_m = ${fx(p.Vm)}\\) V จงหาแรงดันกระแสตรงเฉลี่ยของขาออก \\(V_{dc}\\) และพิกัดแรงดันย้อนกลับสูงสุด (PIV) ของไดโอดแต่ละตัว`,
      `A ${nm} rectifier with ideal diodes and a sine input of peak \\(V_m = ${fx(p.Vm)}\\) V. Find the dc (average) output \\(V_{dc}\\) and the peak inverse voltage (PIV) rating of each diode.`); },
  fields: p => [{ label: 'V_dc (V)', ans: (p.kind === 'hw' ? 0.318 : 0.636) * p.Vm, tol: 0.05 }, { label: 'PIV (V)', ans: (p.kind === 'ct' ? 2 : 1) * p.Vm }],
  steps: p => { const k = p.kind === 'hw' ? 0.318 : 0.636; return [
    step(p.kind === 'hw' ? t('ครึ่งคลื่น: ขาออกมีแค่ครึ่งบวก พื้นที่เฉลี่ยทั้งคาบ = V_m/π', 'half-wave: only the positive half gets through; the average over the period is V_m/π') : t('เต็มคลื่น: ทั้งสองครึ่งถูกพลิกเป็นบวก ค่าเฉลี่ย = 2V_m/π', 'full-wave: both halves come out positive; the average is 2V_m/π'), R`V_{dc} = ${fx(k)}V_m = ${fx(k)}(${fx(p.Vm)}) = ${Vx(k * p.Vm, 2)}`),
    step(p.kind === 'ct' ? t('แท็ปกลาง: ไดโอดที่ไม่นำรับแรงดันของทั้งสองครึ่งขดรวมกัน', 'centre tap: the off diode sees both halves of the secondary') : t('ไดโอดที่ไม่นำรับแรงดันยอดของขาเข้า', 'the off diode sees the peak of the input'), R`\text{PIV} = ${p.kind === 'ct' ? '2V_m = ' : ''}${Vx((p.kind === 'ct' ? 2 : 1) * p.Vm, 0)}`),
    step(t('ถ้าไดโอดเป็นซิลิคอน ใช้ (V_m − 0.7) ในสูตร V_dc (บริดจ์: V_m − 1.4 เพราะนำสองตัวต่อครึ่งคาบ)', 'With silicon diodes use (V_m − 0.7) in V_dc (bridge: V_m − 1.4, two diodes conduct each half cycle)'), '')]; },
  answer: p => `\\(V_{dc} = ${fx((p.kind === 'hw' ? 0.318 : 0.636) * p.Vm, 2)}\\) V, PIV = ${fx((p.kind === 'ct' ? 2 : 1) * p.Vm, 0)} V`,
  pic: p => (p.kind === 'hw' ? CH2.hw({ Vm: p.Vm, R: p.Rr }) : p.kind === 'bridge' ? CH2.bridge({ Vm: p.Vm, R: p.Rr }) : CH2.ct({ Vm: p.Vm, R: p.Rr })),
  anim: (p, c, tm) => CH2.drive(c, p.kind === 'ct' ? ['S1', 'S2'] : ['S'], p.Vm * Math.sin(2 * Math.PI * 0.35 * tm)),   // the source swings slowly: watch which diodes carry each half
  engine: () => t('แหล่งจ่ายแกว่งช้า ๆ ดูว่าไดโอดตัวใดนำในแต่ละครึ่งคาบ', 'The source swings slowly: watch which diodes conduct in each half cycle') });

drill({ ch: 2, page: 'ch2_9_zener.html', title: t('ตัวคุมแรงดันซีเนอร์', 'The Zener regulator'), aspect: 0.58,
  gen: () => ({ Vi: pick([16, 20, 24, 30]), Rr: pick([680, 1000, 1500]), Vz: pick([8, 10, 12]), RL: pick([1200, 1800, 2200, 3300, 4700]) }),
  given: p => t(`\\(V_i = ${fx(p.Vi)}\\) V, \\(R = ${kOx(p.Rr)}\\), ซีเนอร์ \\(V_Z = ${fx(p.Vz)}\\) V, โหลด \\(R_L = ${kOx(p.RL)}\\) จงหาสถานะของซีเนอร์ \\(V_L\\), \\(I_Z\\) และ \\(P_Z\\)`,
    `\\(V_i = ${fx(p.Vi)}\\) V, \\(R = ${kOx(p.Rr)}\\), a Zener with \\(V_Z = ${fx(p.Vz)}\\) V and a load \\(R_L = ${kOx(p.RL)}\\). Find the Zener\'s state, \\(V_L\\), \\(I_Z\\) and \\(P_Z\\).`),
  fields: p => { const z = CH2.zcalc(p.Vi, p.Rr, p.RL, p.Vz); return [{ label: 'V_L (V)', ans: z.VL, tol: 0.02 }, { label: 'I_Z (mA)', ans: z.IZ, tol: 0.02 }, { label: 'P_Z (mW)', ans: z.PZ, tol: 0.3 }]; },
  steps: p => { const z = CH2.zcalc(p.Vi, p.Rr, p.RL, p.Vz); return [
    step(t('ถอดซีเนอร์ออก: แรงดันว่างที่โหลดจากตัวแบ่งแรงดัน', 'Take the Zener out: the open-circuit load voltage from the divider'), R`V = \frac{R_L}{R + R_L}V_i = \frac{${kOx(p.RL)}}{${kOx(p.Rr + p.RL)}}(${fx(p.Vi)}) = ${Vx(z.V, 2)}`),
    step(z.on ? t(`V ≥ V_Z: ซีเนอร์นำ ตรึง V_L = V_Z = ${fx(p.Vz)} V`, `V ≥ V_Z: the Zener is on and holds V_L = V_Z = ${fx(p.Vz)} V`) : t(`V < V_Z: ซีเนอร์ไม่นำ V_L = V = ${fx(z.V, 2)} V, I_Z = 0, P_Z = 0`, `V < V_Z: the Zener is off, V_L = V = ${fx(z.V, 2)} V, I_Z = 0, P_Z = 0`), z.on ? R`V_L = V_Z = ${Vx(p.Vz, 0)}` : R`V_L = ${Vx(z.V, 2)},\quad I_Z = 0`),
    ...(z.on ? [step(t('กระแสผ่าน R และผ่านโหลด ส่วนต่างคือกระแสซีเนอร์', 'The current through R and through the load; the difference goes through the Zener'), R`I_R = \frac{V_i - V_Z}{R} = ${fx(z.IR, 2)}\ \text{mA},\quad I_L = \frac{V_Z}{R_L} = ${fx(z.IL, 2)}\ \text{mA},\quad I_Z = I_R - I_L = ${fx(z.IZ, 2)}\ \text{mA}`),
      step(t('กำลังที่ซีเนอร์ (เทียบ P_ZM ของอุปกรณ์)', 'the Zener power (compare with the device\'s P_ZM)'), R`P_Z = V_ZI_Z = (${fx(p.Vz)})(${fx(z.IZ, 2)}\ \text{mA}) = ${fx(z.PZ, 1)}\ \text{mW}`)] : [])]; },
  answer: p => { const z = CH2.zcalc(p.Vi, p.Rr, p.RL, p.Vz); return `${z.on ? t('ซีเนอร์นำ', 'Zener on') : t('ซีเนอร์ไม่นำ', 'Zener off')}: \\(V_L = ${fx(z.VL, 2)}\\) V, \\(I_Z = ${fx(z.IZ, 2)}\\) mA, \\(P_Z = ${fx(z.PZ, 1)}\\) mW`; },
  pic: p => CH2.zreg({ Vi: p.Vi, R: p.Rr, RL: p.RL, Vz: p.Vz }), 
  engine: c => t(`ตัวแก้วงจร: \\(V_L = ${fx(c.V('l').re, 2)}\\) V, \\(I_Z = ${fx(-c.I('DZ').re * 1e3, 2)}\\) mA`, `engine: \\(V_L = ${fx(c.V('l').re, 2)}\\) V, \\(I_Z = ${fx(-c.I('DZ').re * 1e3, 2)}\\) mA`) });

/* ---- chapter 3 ---- */
drill({ ch: 3, page: 'ch3_3_common_emitter.html', title: t('α, β และกระแสทั้งสาม', 'α, β and the three currents'),
  gen: () => ({ b: pick([50, 80, 100, 120, 150, 200]), IB: pick([10, 20, 25, 30, 40, 50]) * 1e-6 }),
  given: p => t(`ทรานซิสเตอร์มี \\(\\beta_{dc} = ${p.b}\\) และกระแสเบส \\(I_B = ${fx(p.IB * 1e6)}\\) µA จงหา \\(I_C\\), \\(I_E\\) และ \\(\\alpha_{dc}\\)`, `A transistor has \\(\\beta_{dc} = ${p.b}\\) and a base current \\(I_B = ${fx(p.IB * 1e6)}\\) µA. Find \\(I_C\\), \\(I_E\\) and \\(\\alpha_{dc}\\).`),
  fields: p => [{ label: 'I_C (mA)', ans: p.b * p.IB * 1e3 }, { label: 'I_E (mA)', ans: (p.b + 1) * p.IB * 1e3 }, { label: 'α_dc', ans: p.b / (p.b + 1), tol: 0.0006 }],
  steps: p => [step(t('กระแสคอลเล็กเตอร์', 'the collector current'), R`I_C = \beta I_B = ${p.b}(${uAx(p.IB, 0)}) = ${mAx(p.b * p.IB, 3)}`),
    step(t('กระแสอิมิตเตอร์: ผลรวม', 'the emitter current: the sum'), R`I_E = I_C + I_B = (\beta + 1)I_B = ${mAx((p.b + 1) * p.IB, 3)}`),
    step(t('แอลฟาจากเบตา', 'alpha from beta'), R`\alpha = \frac{I_C}{I_E} = \frac{\beta}{\beta + 1} = \frac{${p.b}}{${p.b + 1}} = ${fx(p.b / (p.b + 1), 4)}`)],
  answer: p => `\\(I_C = ${fx(p.b * p.IB * 1e3, 3)}\\) mA, \\(I_E = ${fx((p.b + 1) * p.IB * 1e3, 3)}\\) mA, \\(\\alpha = ${fx(p.b / (p.b + 1), 4)}\\)` });

drill({ ch: 3, page: 'ch3_4_limits.html', title: t('กระแสรั่วและขีดจำกัดกำลัง', 'Leakage and the power limit'),
  gen: () => ({ b: pick([50, 100, 150, 200]), ICBO: pick([0.1, 0.5, 1, 2]) * 1e-6, P: pick([300, 500, 800]) * 1e-3, VCE: pick([5, 10, 15, 20]) }),
  given: p => t(`ทรานซิสเตอร์มี \\(\\beta = ${p.b}\\), \\(I_{CBO} = ${fx(p.ICBO * 1e6)}\\) µA และพิกัด \\(P_{C\\max} = ${fx(p.P * 1e3)}\\) mW (ก) กระแสรั่ว \\(I_{CEO}\\) เมื่อเบสเปิด (ข) กระแสคอลเล็กเตอร์สูงสุดที่ยอมได้เมื่อ \\(V_{CE} = ${fx(p.VCE)}\\) V`,
    `A transistor has \\(\\beta = ${p.b}\\), \\(I_{CBO} = ${fx(p.ICBO * 1e6)}\\) µA and a rating \\(P_{C\\max} = ${fx(p.P * 1e3)}\\) mW. (a) The leakage \\(I_{CEO}\\) with the base open. (b) The largest collector current allowed at \\(V_{CE} = ${fx(p.VCE)}\\) V.`),
  fields: p => [{ label: 'I_CEO (µA)', ans: (p.b + 1) * p.ICBO * 1e6 }, { label: 'I_C max (mA)', ans: p.P / p.VCE * 1e3 }],
  steps: p => [step(t('I_CBO ไหลเข้าเบสแล้วถูกขยาย: รวมกันเป็น (β + 1) เท่า', 'I_CBO enters the base and is amplified: (β + 1) times in all'), R`I_{CEO} = (\beta + 1)I_{CBO} = ${p.b + 1}(${fx(p.ICBO * 1e6)}\ \mu\text{A}) = ${uAx((p.b + 1) * p.ICBO, 1)}`),
    step(t('จุดบนเส้นกำลังสูงสุด V_CE I_C = P_Cmax', 'a point on the maximum-power curve V_CE I_C = P_Cmax'), R`I_C = \frac{P_{C\max}}{V_{CE}} = \frac{${fx(p.P * 1e3)}\ \text{mW}}{${fx(p.VCE)}\ \text{V}} = ${mAx(p.P / p.VCE, 2)}`),
    step(t('จุดทำงานต้องอยู่ใต้เส้นนี้ และต่ำกว่า I_Cmax, ซ้ายของ BV_CEO, ขวาของ V_CEsat', 'The operating point must lie under this curve, below I_Cmax, left of BV_CEO and right of V_CEsat'), '')],
  answer: p => `\\(I_{CEO} = ${fx((p.b + 1) * p.ICBO * 1e6, 1)}\\) µA, \\(I_C \\le ${fx(p.P / p.VCE * 1e3, 2)}\\) mA ${t('ที่', 'at')} ${fx(p.VCE)} V` });

const vdApprox = p => { const ETh = p.R2 * p.VCC / (p.R1 + p.R2), VE = ETh - 0.7, IE = VE / p.RE; return { VB: ETh, VE, IE, IC: IE, VCE: p.VCC - IE * (p.RC + p.RE), ok: p.beta * p.RE >= 10 * p.R2 }; };
/* ---- chapter 4: the BJT bias circuits. bq = the exact values (I_E = (β + 1)I_B everywhere, as the engine solves them),
   CH4.sol = the book's hand method (I_E ≅ I_C in the collector loop, I_C' ≅ I_C in collector feedback); the check accepts either */
const bq = p => { const b = p.beta, RC = p.RC || 0, RE = p.RE || 0, VCC = p.VCC; let IB;
  if (p.R1) { const RTh = p.R1 * p.R2 / (p.R1 + p.R2), ETh = p.R2 * VCC / (p.R1 + p.R2); IB = (ETh - 0.7) / (RTh + (b + 1) * RE); }
  else if (p.RF) IB = (VCC - 0.7) / (p.RF + (b + 1) * (RC + RE));
  else IB = (VCC - 0.7) / (p.RB + (b + 1) * RE);
  const IC = b * IB, IE = (b + 1) * IB, VE = IE * RE, VC = VCC - (p.RF ? IE : IC) * RC;
  return { IB, IC, IE, VE, VB: VE + 0.7, VC, VCE: VC - VE, Icsat: VCC / Math.max(RC + RE, 1e-9) }; };
RV.bq = bq;
const bjtQ = c => { const q = c.Q('Q'); return { IB: q.IB, IC: q.IC, VCE: q.VCE }; };
const bjtLine = c => { const q = bjtQ(c); return t(`ตัวแก้วงจร: \\(I_B = ${fx(q.IB * 1e6, 2)}\\) µA, \\(I_C = ${fx(q.IC * 1e3, 3)}\\) mA, \\(V_{CE} = ${fx(q.VCE, 2)}\\) V`, `engine: \\(I_B = ${fx(q.IB * 1e6, 2)}\\) µA, \\(I_C = ${fx(q.IC * 1e3, 3)}\\) mA, \\(V_{CE} = ${fx(q.VCE, 2)}\\) V`); };
const qFields = p => { const e = bq(p), b = CH4.sol(p); return [{ label: 'I_B (µA)', ans: e.IB * 1e6, alt: b.IB * 1e6 }, { label: 'I_C (mA)', ans: e.IC * 1e3, alt: b.IC * 1e3 }, { label: 'V_CE (V)', ans: e.VCE, alt: b.VCE, tol: 0.03 }]; };
const qAnswer = p => { const e = bq(p), b = CH4.sol(p), same = Math.abs(e.VCE - b.VCE) < 0.005 && Math.abs(e.IB - b.IB) < 1e-9;
  return `\\(I_B = ${fx(e.IB * 1e6, 2)}\\) µA, \\(I_C = ${fx(e.IC * 1e3, 3)}\\) mA, \\(V_{CE} = ${fx(e.VCE, 2)}\\) V` + (same ? '' : t(` (วิธีของตำรา: \\(I_B = ${fx(b.IB * 1e6, 2)}\\) µA, \\(V_{CE} = ${fx(b.VCE, 2)}\\) V ตรวจรับทั้งสองแบบ)`, ` (the book's way: \\(I_B = ${fx(b.IB * 1e6, 2)}\\) µA, \\(V_{CE} = ${fx(b.VCE, 2)}\\) V; either is accepted)`)); };
const retry = (gen, ok) => { for (let k = 0; k < 80; k++) { const p = gen(); if (ok(p)) return p; } return gen(); };
const nodeV = e => step(t(`แรงดันโหนด: \\(V_E = ${fx(e.VE, 2)}\\) V, \\(V_B = ${fx(e.VB, 2)}\\) V, \\(V_C = ${fx(e.VC, 2)}\\) V (ต้องได้ \\(V_B < V_C\\): รอยต่อเบส–คอลเล็กเตอร์ไบแอสกลับ)`, `Node voltages: \\(V_E = ${fx(e.VE, 2)}\\) V, \\(V_B = ${fx(e.VB, 2)}\\) V, \\(V_C = ${fx(e.VC, 2)}\\) V (\\(V_B < V_C\\): the base–collector junction is reverse-biased)`), '');

drill({ ch: 4, page: 'ch4_1_fixed_bias.html', title: t('ไบแอสคงที่', 'Fixed bias'), aspect: 0.62,
  gen: () => retry(() => ({ VCC: pick([12, 15, 16, 20]), RB: pick([240e3, 270e3, 330e3, 390e3, 470e3, 560e3]), RC: pick([1800, 2200, 2700, 3300]), beta: pick([50, 75, 100, 120]) }), p => bq(p).VCE > 1.5),
  given: p => t(`ไบแอสคงที่: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_B = ${kOx(p.RB)}\\), \\(R_C = ${kOx(p.RC)}\\), ทรานซิสเตอร์ซิลิคอน \\(\\beta = ${p.beta}\\) จงหา \\(I_{BQ}\\), \\(I_{CQ}\\), \\(V_{CEQ}\\)`,
    `Fixed bias: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_B = ${kOx(p.RB)}\\), \\(R_C = ${kOx(p.RC)}\\), a silicon transistor with \\(\\beta = ${p.beta}\\). Find \\(I_{BQ}\\), \\(I_{CQ}\\), \\(V_{CEQ}\\).`),
  fields: qFields,
  steps: p => { const e = bq(p); return [step(t('วงรอบเบส–อิมิตเตอร์', 'the base–emitter loop'), R`I_B = \frac{V_{CC} - V_{BE}}{R_B} = \frac{${fx(p.VCC)} - 0.7}{${kOx(p.RB)}} = ${uAx(e.IB, 2)}`),
    step(t('ขยายด้วยเบตา', 'times beta'), R`I_C = \beta I_B = ${p.beta}(${uAx(e.IB, 2)}) = ${mAx(e.IC, 3)}`),
    step(t('วงรอบคอลเล็กเตอร์–อิมิตเตอร์', 'the collector–emitter loop'), R`V_{CE} = V_{CC} - I_CR_C = ${fx(p.VCC)} - (${mAx(e.IC, 3)})(${kOx(p.RC)}) = ${Vx(e.VCE, 2)}`),
    step(t(`ตรวจ: \\(V_{CE} > 0\\) และ \\(I_C < I_{C\\text{sat}} = V_{CC}/R_C = ${fx(e.Icsat * 1e3, 2)}\\) mA จึงอยู่ในย่านแอกทีฟ`, `Check: \\(V_{CE} > 0\\) and \\(I_C < I_{C\\text{sat}} = V_{CC}/R_C = ${fx(e.Icsat * 1e3, 2)}\\) mA, so the active region`), '')]; },
  answer: qAnswer, pic: p => CH4.net(p), engine: bjtLine });

drill({ ch: 4, page: 'ch4_2_emitter_bias.html', title: t('ไบแอสอิมิตเตอร์', 'Emitter bias'), aspect: 0.62,
  gen: () => retry(() => ({ VCC: pick([16, 20, 22]), RB: pick([330e3, 390e3, 430e3, 470e3, 560e3]), RC: pick([1800, 2000, 2200, 2700]), RE: pick([680, 1000, 1200, 1500]), beta: pick([50, 80, 100, 120]) }), p => bq(p).VCE > 1.5),
  given: p => t(`ไบแอสอิมิตเตอร์: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_B = ${kOx(p.RB)}\\), \\(R_C = ${kOx(p.RC)}\\), \\(R_E = ${kOx(p.RE)}\\), \\(\\beta = ${p.beta}\\) จงหา \\(I_B\\), \\(I_C\\), \\(V_{CE}\\)`,
    `Emitter bias: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_B = ${kOx(p.RB)}\\), \\(R_C = ${kOx(p.RC)}\\), \\(R_E = ${kOx(p.RE)}\\), \\(\\beta = ${p.beta}\\). Find \\(I_B\\), \\(I_C\\), \\(V_{CE}\\).`),
  fields: qFields,
  steps: p => { const e = bq(p), b = CH4.sol(p); return [step(t('วงรอบเบส: \\(R_E\\) สะท้อนเข้าเบสเป็น \\((\\beta + 1)R_E\\)', 'the base loop: \\(R_E\\) appears as \\((\\beta + 1)R_E\\)'), R`I_B = \frac{V_{CC} - V_{BE}}{R_B + (\beta + 1)R_E} = \frac{${fx(p.VCC - 0.7)}}{${kOx(p.RB)} + ${p.beta + 1}(${kOx(p.RE)})} = ${uAx(e.IB, 2)}`),
    step('', R`I_C = \beta I_B = ${mAx(e.IC, 3)},\qquad I_E = (\beta + 1)I_B = ${mAx(e.IE, 3)}`),
    step(t(`วงรอบคอลเล็กเตอร์ผ่าน \\(R_C\\) และ \\(R_E\\) (ตำราใช้ \\(I_E \\cong I_C\\) ได้ ${fx(b.VCE, 2)} V)`, `the collector loop through \\(R_C\\) and \\(R_E\\) (the book takes \\(I_E \\cong I_C\\) and gets ${fx(b.VCE, 2)} V)`), R`V_{CE} = V_{CC} - I_CR_C - I_ER_E = ${Vx(e.VCE, 2)}`),
    nodeV(e)]; },
  answer: qAnswer, pic: p => CH4.net(p), engine: bjtLine });

drill({ ch: 4, page: 'ch4_3_voltage_divider.html', title: t('ไบแอสตัวแบ่งแรงดัน (แม่นยำและประมาณ)', 'Voltage-divider bias (exact and approximate)'), aspect: 0.62,
  gen: () => retry(() => ({ VCC: pick([16, 18, 20, 22]), R1: pick([33e3, 39e3, 47e3, 56e3, 62e3]), R2: pick([3900, 4700, 5600, 6800, 8200, 10e3]), RC: pick([3900, 4700, 6800, 10e3]), RE: pick([1000, 1200, 1500, 2200]), beta: pick([80, 100, 140, 200]) }), p => bq(p).VCE > 2 && vdApprox(p).VCE > 2),
  given: p => t(`ตัวแบ่งแรงดัน: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_1 = ${kOx(p.R1)}\\), \\(R_2 = ${kOx(p.R2)}\\), \\(R_C = ${kOx(p.RC)}\\), \\(R_E = ${kOx(p.RE)}\\), \\(\\beta = ${p.beta}\\) จงหา \\(I_C\\) และ \\(V_{CE}\\) ด้วยวิธีแม่นยำ แล้วตรวจว่าใช้วิธีประมาณได้หรือไม่ (ช่องตอบรับได้ทั้งสองวิธี)`,
    `Voltage-divider bias: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_1 = ${kOx(p.R1)}\\), \\(R_2 = ${kOx(p.R2)}\\), \\(R_C = ${kOx(p.RC)}\\), \\(R_E = ${kOx(p.RE)}\\), \\(\\beta = ${p.beta}\\). Find \\(I_C\\) and \\(V_{CE}\\) exactly, then say whether the approximate method is allowed (the boxes accept either method).`),
  fields: p => { const e = bq(p), b = CH4.sol(p), a = vdApprox(p); return [{ label: 'I_C (mA)', ans: e.IC * 1e3, alt: a.IC * 1e3 }, { label: 'V_CE (V)', ans: e.VCE, alt: a.VCE, alt2: b.VCE, tol: 0.03 }]; },
  steps: p => { const e = bq(p), a = vdApprox(p), RTh = p.R1 * p.R2 / (p.R1 + p.R2); return [
    step(t('เทเวนินของตัวแบ่ง', 'Thévenin of the divider'), R`R_{Th} = R_1 \| R_2 = ${kOx(RTh)},\qquad E_{Th} = \frac{R_2V_{CC}}{R_1 + R_2} = ${Vx(a.VB, 3)}`),
    step(t('วงรอบเบสแบบแม่นยำ', 'the exact base loop'), R`I_B = \frac{E_{Th} - V_{BE}}{R_{Th} + (\beta + 1)R_E} = \frac{${fx(a.VB - 0.7, 3)}}{${kOx(RTh)} + ${p.beta + 1}(${kOx(p.RE)})} = ${uAx(e.IB, 2)}`),
    step('', R`I_C = \beta I_B = ${mAx(e.IC, 3)},\qquad V_{CE} = V_{CC} - I_CR_C - I_ER_E = ${Vx(e.VCE, 2)}`),
    step(a.ok ? t(`เกณฑ์ \\(\\beta R_E = ${kOx(p.beta * p.RE)} \\ge 10R_2 = ${kOx(10 * p.R2)}\\) ผ่าน: วิธีประมาณใช้ได้`, `The test \\(\\beta R_E = ${kOx(p.beta * p.RE)} \\ge 10R_2 = ${kOx(10 * p.R2)}\\) passes: the approximate method is allowed`)
      : t(`เกณฑ์ \\(\\beta R_E = ${kOx(p.beta * p.RE)} \\ge 10R_2 = ${kOx(10 * p.R2)}\\) ไม่ผ่าน: ต้องใช้วิธีแม่นยำ (วิธีประมาณคลาดไป ${fx(100 * Math.abs(a.IC / e.IC - 1), 0)} %)`, `The test \\(\\beta R_E = ${kOx(p.beta * p.RE)} \\ge 10R_2 = ${kOx(10 * p.R2)}\\) fails: the exact method is required (the approximation is off by ${fx(100 * Math.abs(a.IC / e.IC - 1), 0)} %)`),
      R`V_B \cong E_{Th} = ${Vx(a.VB, 2)},\quad V_E = V_B - 0.7 = ${Vx(a.VE, 2)},\quad I_C \cong I_E = \frac{V_E}{R_E} = ${mAx(a.IE, 3)},\quad V_{CE} = ${Vx(a.VCE, 2)}`)]; },
  answer: p => { const e = bq(p), a = vdApprox(p); return `${t('แม่นยำ', 'exact')}: \\(I_C = ${fx(e.IC * 1e3, 3)}\\) mA, \\(V_{CE} = ${fx(e.VCE, 2)}\\) V · ${t('ประมาณ', 'approximate')}: \\(I_C = ${fx(a.IC * 1e3, 3)}\\) mA, \\(V_{CE} = ${fx(a.VCE, 2)}\\) V`; },
  pic: p => CH4.net(p), engine: bjtLine });

drill({ ch: 4, page: 'ch4_4_collector_feedback.html', title: t('ไบแอสป้อนกลับคอลเล็กเตอร์', 'Collector-feedback bias'), aspect: 0.62,
  gen: () => retry(() => ({ VCC: pick([10, 12, 15, 20]), RF: pick([180e3, 220e3, 250e3, 330e3, 390e3]), RC: pick([2200, 3300, 4700]), RE: pick([0, 1000, 1200]), beta: pick([60, 90, 100, 120]) }), p => bq(p).VCE > 1.5),
  given: p => t(`ป้อนกลับคอลเล็กเตอร์: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_F = ${kOx(p.RF)}\\) (จากคอลเล็กเตอร์มาเบส), \\(R_C = ${kOx(p.RC)}\\)${p.RE ? `, \\(R_E = ${kOx(p.RE)}\\)` : ' ไม่มี \\(R_E\\)'}, \\(\\beta = ${p.beta}\\) จงหา \\(I_B\\), \\(I_C\\), \\(V_{CE}\\)`,
    `Collector feedback: \\(V_{CC} = ${fx(p.VCC)}\\) V, \\(R_F = ${kOx(p.RF)}\\) (collector to base), \\(R_C = ${kOx(p.RC)}\\)${p.RE ? `, \\(R_E = ${kOx(p.RE)}\\)` : ', no \\(R_E\\)'}, \\(\\beta = ${p.beta}\\). Find \\(I_B\\), \\(I_C\\), \\(V_{CE}\\).`),
  fields: qFields,
  steps: p => { const e = bq(p), b = CH4.sol(p); return [step(t('วงรอบเบสผ่าน \\(R_C\\), \\(R_F\\), \\(R_E\\): กระแสใน \\(R_C\\) คือ \\(I_C\\prime = I_C + I_B\\) ตำราประมาณเป็น \\(I_C\\) จึงได้ \\(\\beta\\) แทน \\(\\beta + 1\\)', 'the base loop through \\(R_C\\), \\(R_F\\), \\(R_E\\): the current in \\(R_C\\) is \\(I_C\\prime = I_C + I_B\\), which the book takes as \\(I_C\\), hence \\(\\beta\\) for \\(\\beta + 1\\)'),
      R`I_B = \frac{V_{CC} - V_{BE}}{R_F + \beta(R_C + R_E)} = \frac{${fx(p.VCC - 0.7)}}{${kOx(p.RF)} + ${p.beta}(${kOx(p.RC + p.RE)})} = ${uAx(b.IB, 2)}`),
    step(t('แบบแม่นยำ (ตัวแก้วงจรคิดแบบนี้)', 'exactly (as the engine solves it)'), R`I_B = \frac{V_{CC} - V_{BE}}{R_F + (\beta + 1)(R_C + R_E)} = ${uAx(e.IB, 2)},\qquad I_C = \beta I_B = ${mAx(e.IC, 3)}`),
    step(t('วงรอบคอลเล็กเตอร์', 'the collector loop'), R`V_{CE} = V_{CC} - I_E(R_C + R_E) = ${Vx(e.VCE, 2)}\quad (\text{${t('ตำรา', 'book')}: } ${Vx(b.VCE, 2)})`)]; },
  answer: qAnswer, pic: p => CH4.net(p), engine: bjtLine });

/* ---- chapter 5: JFETs (Shockley by hand; CH5.net + the engine for the picture) ---- */
const shock = (d, vgs) => (vgs <= d.vp ? 0 : d.idss * Math.pow(1 - vgs / d.vp, 2));
const bisect = (f, lo, hi) => { for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; } return (lo + hi) / 2; };   // f increasing, f(lo) < 0 < f(hi)
const fetQ = (d, RS, VG) => { const ID = bisect(x => x - shock(d, VG - x * RS), 0, (VG - d.vp) / Math.max(RS, 1e-9) + 1e-9 + (RS ? 0 : d.idss * 10)); return { ID, VGS: VG - ID * RS }; };
const jLine = c => { const j = c.J('Q'); return t(`ตัวแก้วงจร: \\(I_D = ${fx(j.ID * 1e3, 3)}\\) mA, \\(V_{GS} = ${fx(j.VGS, 3)}\\) V, \\(V_{DS} = ${fx(j.VDS, 2)}\\) V (${({ saturation: 'อิ่มตัว', ohmic: 'โอห์มมิก', cutoff: 'คัตออฟ' })[j.region] || j.region})`, `engine: \\(I_D = ${fx(j.ID * 1e3, 3)}\\) mA, \\(V_{GS} = ${fx(j.VGS, 3)}\\) V, \\(V_{DS} = ${fx(j.VDS, 2)}\\) V (${j.region})`); };
const DEVS = [{ idss: 6e-3, vp: -3 }, { idss: 8e-3, vp: -4 }, { idss: 10e-3, vp: -5 }, { idss: 8e-3, vp: -6 }, { idss: 12e-3, vp: -6 }, { idss: 10e-3, vp: -8 }, { idss: 16e-3, vp: -4 }];

drill({ ch: 5, page: 'ch5_2_transfer.html', title: t('สมการของช็อกลีย์ไปและกลับ', 'Shockley\'s equation both ways'),
  gen: () => { const d = pick(DEVS); return { d, f1: pick([0.25, 0.5, 0.75]), f2: pick([0.25, 0.5, 0.75]) }; },
  given: p => t(`JFET ช่อง n มี \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V (ก) \\(I_D\\) ที่ \\(V_{GS} = ${fx(p.f1 * p.d.vp, 2)}\\) V (ข) \\(V_{GS}\\) ที่ทำให้ \\(I_D = ${fx(p.f2 * p.d.idss * 1e3, 2)}\\) mA`,
    `An n-channel JFET has \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V. (a) \\(I_D\\) at \\(V_{GS} = ${fx(p.f1 * p.d.vp, 2)}\\) V. (b) The \\(V_{GS}\\) that gives \\(I_D = ${fx(p.f2 * p.d.idss * 1e3, 2)}\\) mA.`),
  fields: p => [{ label: '(a) I_D (mA)', ans: shock(p.d, p.f1 * p.d.vp) * 1e3 }, { label: '(b) V_GS (V)', ans: p.d.vp * (1 - Math.sqrt(p.f2)), tol: 0.01 }],
  steps: p => { const v1 = p.f1 * p.d.vp; return [step(t('แทนค่าในช็อกลีย์ (V_GS และ V_P ลบทั้งคู่ อัตราส่วนเป็นบวก)', 'into Shockley (both V_GS and V_P negative: the ratio is positive)'), R`I_D = I_{DSS}\left(1 - \frac{V_{GS}}{V_P}\right)^2 = ${fx(p.d.idss * 1e3)}\left(1 - \frac{${fx(v1, 2)}}{${fx(p.d.vp)}}\right)^2 = ${fx(p.d.idss * 1e3)}(${fx(1 - p.f1, 2)})^2 = ${mAx(shock(p.d, v1), 3)}`),
    step(t('กลับทาง: ถอดรากที่สอง', 'the inverse: take the square root'), R`V_{GS} = V_P\left(1 - \sqrt{\frac{I_D}{I_{DSS}}}\right) = ${fx(p.d.vp)}\left(1 - \sqrt{${fx(p.f2, 2)}}\right) = ${Vx(p.d.vp * (1 - Math.sqrt(p.f2)), 3)}`),
    step(t('ตรวจกับจุดจำ: ที่ 0.3V_P ได้ I_DSS/2 ที่ 0.5V_P ได้ I_DSS/4', 'Check against the memory points: 0.3V_P gives I_DSS/2 and 0.5V_P gives I_DSS/4'), '')]; },
  answer: p => `(a) \\(I_D = ${fx(shock(p.d, p.f1 * p.d.vp) * 1e3, 3)}\\) mA (b) \\(V_{GS} = ${fx(p.d.vp * (1 - Math.sqrt(p.f2)), 3)}\\) V` });

drill({ ch: 5, page: 'ch5_4_self_bias.html', title: t('ไบแอสตัวเอง', 'Self bias'), aspect: 0.62,
  gen: () => retry(() => { const d = pick(DEVS); return { d, RS: pick([500, 680, 1000, 1500]), RD: pick([1800, 2200, 3300]), VDD: pick([16, 20]) }; }, p => { const q = fetQ(p.d, p.RS, 0), VDS = p.VDD - q.ID * (p.RD + p.RS); return VDS > q.VGS - p.d.vp + 0.5 && q.ID > 0.5e-3; }),
  given: p => t(`ไบแอสตัวเอง: JFET \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V, \\(R_S = ${kOx(p.RS)}\\), \\(R_D = ${kOx(p.RD)}\\), \\(V_{DD} = ${fx(p.VDD)}\\) V จงหา \\(I_{DQ}\\), \\(V_{GSQ}\\), \\(V_{DS}\\)`,
    `Self bias: a JFET with \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V, \\(R_S = ${kOx(p.RS)}\\), \\(R_D = ${kOx(p.RD)}\\), \\(V_{DD} = ${fx(p.VDD)}\\) V. Find \\(I_{DQ}\\), \\(V_{GSQ}\\), \\(V_{DS}\\).`),
  fields: p => { const q = fetQ(p.d, p.RS, 0); return [{ label: 'I_D (mA)', ans: q.ID * 1e3, tol: 0.03 }, { label: 'V_GS (V)', ans: q.VGS, tol: 0.03 }, { label: 'V_DS (V)', ans: p.VDD - q.ID * (p.RD + p.RS), tol: 0.12 }]; },
  steps: p => { const q = fetQ(p.d, p.RS, 0), a = p.d.idss * p.RS * p.RS / (p.d.vp * p.d.vp), b = 2 * p.d.idss * p.RS / p.d.vp - 1, cc = p.d.idss; return [
    step(t('เส้นไบแอส: เกตที่ 0 V ซอร์สที่ I_D R_S', 'the bias line: the gate at 0 V, the source at I_D R_S'), R`V_{GS} = -I_DR_S`),
    step(t('แทนในช็อกลีย์แล้วจัดเป็นสมการกำลังสองของ I_D (หน่วย A)', 'into Shockley: a quadratic in I_D (amperes)'), R`I_D = I_{DSS}\left(1 + \frac{I_DR_S}{V_P}\right)^2 \;\Rightarrow\; ${fx(a, 1)}I_D^2 ${b < 0 ? '-' : '+'} ${fx(Math.abs(b), 3)}I_D + ${fx(cc * 1e3, 3)}\times10^{-3} = 0`),
    step(t('เลือกรากที่ให้ V_P < V_GS < 0 (รากใหญ่ทำให้ |V_GS| เกิน |V_P|)', 'keep the root with V_P < V_GS < 0 (the larger one puts |V_GS| beyond |V_P|)'), R`I_D = ${mAx(q.ID, 3)},\qquad V_{GS} = -I_DR_S = ${Vx(q.VGS, 3)}`),
    step(t('วงรอบเดรน–ซอร์ส และตรวจอิ่มตัว', 'the drain–source loop, then the saturation check'), R`V_{DS} = V_{DD} - I_D(R_D + R_S) = ${Vx(p.VDD - q.ID * (p.RD + p.RS), 2)} \ge V_{GS} - V_P = ${Vx(q.VGS - p.d.vp, 2)}\ \checkmark`)]; },
  answer: p => { const q = fetQ(p.d, p.RS, 0); return `\\(I_D = ${fx(q.ID * 1e3, 3)}\\) mA, \\(V_{GS} = ${fx(q.VGS, 3)}\\) V, \\(V_{DS} = ${fx(p.VDD - q.ID * (p.RD + p.RS), 2)}\\) V`; },
  pic: p => CH5.net({ dev: p.d, RS: p.RS, RD: p.RD, VDD: p.VDD, RG: 1e6 }), engine: jLine });

drill({ ch: 5, page: 'ch5_5_voltage_divider.html', title: t('ไบแอสตัวแบ่งแรงดันของ JFET', 'Voltage-divider bias of a JFET'), aspect: 0.62,
  gen: () => retry(() => { const d = pick(DEVS); return { d, R1: pick([1.5e6, 2.1e6, 2.2e6, 3.3e6]), R2: pick([220e3, 270e3, 330e3, 470e3]), RS: pick([1000, 1500, 2200]), RD: pick([1800, 2400, 3300]), VDD: pick([16, 18, 20]) }; },
    p => { const VG = p.R2 * p.VDD / (p.R1 + p.R2), q = fetQ(p.d, p.RS, VG), VDS = p.VDD - q.ID * (p.RD + p.RS); return q.VGS < -0.3 && q.ID > 0.5e-3 && VDS > q.VGS - p.d.vp + 0.5; }),
  given: p => t(`ตัวแบ่งแรงดัน: JFET \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V, \\(R_1 = ${kOx(p.R1)}\\), \\(R_2 = ${kOx(p.R2)}\\), \\(R_S = ${kOx(p.RS)}\\), \\(R_D = ${kOx(p.RD)}\\), \\(V_{DD} = ${fx(p.VDD)}\\) V จงหา \\(V_G\\), \\(I_{DQ}\\), \\(V_{DS}\\)`,
    `Voltage divider: a JFET with \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V, \\(R_1 = ${kOx(p.R1)}\\), \\(R_2 = ${kOx(p.R2)}\\), \\(R_S = ${kOx(p.RS)}\\), \\(R_D = ${kOx(p.RD)}\\), \\(V_{DD} = ${fx(p.VDD)}\\) V. Find \\(V_G\\), \\(I_{DQ}\\), \\(V_{DS}\\).`),
  fields: p => { const VG = p.R2 * p.VDD / (p.R1 + p.R2), q = fetQ(p.d, p.RS, VG); return [{ label: 'V_G (V)', ans: VG, tol: 0.01 }, { label: 'I_D (mA)', ans: q.ID * 1e3, tol: 0.03 }, { label: 'V_DS (V)', ans: p.VDD - q.ID * (p.RD + p.RS), tol: 0.12 }]; },
  steps: p => { const VG = p.R2 * p.VDD / (p.R1 + p.R2), q = fetQ(p.d, p.RS, VG); return [
    step(t('แรงดันเกต: ตัวแบ่งไม่มีโหลดเพราะ I_G = 0', 'the gate voltage: the divider is unloaded since I_G = 0'), R`V_G = \frac{R_2V_{DD}}{R_1 + R_2} = \frac{(${kOx(p.R2)})(${fx(p.VDD)})}{${kOx(p.R1 + p.R2)}} = ${Vx(VG, 3)}`),
    step(t('เส้นไบแอส (เส้นตรงจาก (V_GS = V_G, I_D = 0) ชันลง −1/R_S)', 'the bias line (from (V_GS = V_G, I_D = 0) with slope −1/R_S)'), R`V_{GS} = V_G - I_DR_S = ${fx(VG, 3)} - I_D(${kOx(p.RS)})`),
    step(t('ตัดกับเส้นถ่ายโอน (กราฟหรือแก้สมการ)', 'meets the transfer curve (graph or algebra)'), R`I_D = ${mAx(q.ID, 3)},\qquad V_{GS} = ${Vx(q.VGS, 3)}`),
    step(t('วงรอบเดรน และตรวจอิ่มตัว', 'the drain loop and the saturation check'), R`V_{DS} = V_{DD} - I_D(R_D + R_S) = ${Vx(p.VDD - q.ID * (p.RD + p.RS), 2)} \ge V_{GS} - V_P = ${Vx(q.VGS - p.d.vp, 2)}\ \checkmark`)]; },
  answer: p => { const VG = p.R2 * p.VDD / (p.R1 + p.R2), q = fetQ(p.d, p.RS, VG); return `\\(V_G = ${fx(VG, 3)}\\) V, \\(I_D = ${fx(q.ID * 1e3, 3)}\\) mA, \\(V_{GS} = ${fx(q.VGS, 3)}\\) V, \\(V_{DS} = ${fx(p.VDD - q.ID * (p.RD + p.RS), 2)}\\) V`; },
  pic: p => CH5.net({ dev: p.d, R1: p.R1, R2: p.R2, RS: p.RS, RD: p.RD, VDD: p.VDD }), engine: jLine });

/* ---- chapter 6: MOSFETs ---- */
drill({ ch: 6, page: 'ch6_1_depletion.html', title: t('ดีพลีชันมอสเฟตทั้งสองโหมด', 'A depletion MOSFET in both modes'), aspect: 0.62,
  gen: () => ({ d: pick([{ idss: 6e-3, vp: -3 }, { idss: 8e-3, vp: -4 }, { idss: 10e-3, vp: -4 }, { idss: 12e-3, vp: -6 }, { idss: 8e-3, vp: -6 }]), RD: 470, VDD: 18 }),
  given: p => t(`ดีพลีชันมอสเฟตช่อง n มี \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V จงหา \\(I_D\\) ที่ \\(V_{GS} = +1\\) V (โหมดเอนฮานซ์เมนต์) และที่ \\(V_{GS} = -1\\) V (โหมดดีพลีชัน)`,
    `An n-channel depletion MOSFET has \\(I_{DSS} = ${fx(p.d.idss * 1e3)}\\) mA, \\(V_P = ${fx(p.d.vp)}\\) V. Find \\(I_D\\) at \\(V_{GS} = +1\\) V (enhancement mode) and at \\(V_{GS} = -1\\) V (depletion mode).`),
  fields: p => [{ label: 'I_D(+1 V) (mA)', ans: shock(p.d, 1) * 1e3 }, { label: 'I_D(−1 V) (mA)', ans: shock(p.d, -1) * 1e3 }],
  steps: p => [step(t('ช็อกลีย์ใช้ได้กับ V_GS บวกด้วย: วงเล็บใหญ่กว่า 1 จึงได้ I_D > I_DSS', 'Shockley also holds for positive V_GS: the bracket exceeds 1, so I_D > I_DSS'), R`I_D = ${fx(p.d.idss * 1e3)}\left(1 - \frac{+1}{${fx(p.d.vp)}}\right)^2 = ${fx(p.d.idss * 1e3)}(${fx(1 - 1 / p.d.vp, 3)})^2 = ${mAx(shock(p.d, 1), 2)}`),
    step(t('โหมดดีพลีชันตามปกติ', 'the usual depletion mode'), R`I_D = ${fx(p.d.idss * 1e3)}\left(1 - \frac{-1}{${fx(p.d.vp)}}\right)^2 = ${fx(p.d.idss * 1e3)}(${fx(1 + 1 / p.d.vp, 3)})^2 = ${mAx(shock(p.d, -1), 2)}`),
    step(t('รูปในวงจร: V_GG = 1 V กลับขั้วให้ V_GS = +1 V กับ R_D = 470 Ω, V_DD = 18 V (ยังอยู่ในย่านอิ่มตัว)', 'In the picture: V_GG = 1 V reversed to give V_GS = +1 V, with R_D = 470 Ω, V_DD = 18 V (still in saturation)'), '')],
  answer: p => `\\(I_D(+1\\ \\text{V}) = ${fx(shock(p.d, 1) * 1e3, 2)}\\) mA, \\(I_D(-1\\ \\text{V}) = ${fx(shock(p.d, -1) * 1e3, 2)}\\) mA`,
  pic: p => CH5.net({ dev: { kind: 'dmos', idss: p.d.idss, vp: p.d.vp }, VGG: -1, RG: 1e6, RD: p.RD, VDD: p.VDD }), engine: jLine });

const emosQ = (k, VT, VDD, RD) => { const a = k * RD * RD, b = -(2 * k * RD * (VDD - VT) + 1), c = k * (VDD - VT) * (VDD - VT), disc = Math.sqrt(Math.max(0, b * b - 4 * a * c)); const ID = (-b - disc) / (2 * a); return { ID, VGS: VDD - ID * RD }; };
drill({ ch: 6, page: 'ch6_4_enhancement_bias.html', title: t('เอนฮานซ์เมนต์มอสเฟต: k และไบแอสป้อนกลับ', 'Enhancement MOSFET: k and feedback bias'), aspect: 0.62,
  gen: () => retry(() => ({ Ion: pick([4, 5, 6, 8]) * 1e-3, Von: pick([6, 8, 10]), VT: pick([2, 3, 4]), VDD: pick([12, 15, 18]), RD: pick([1500, 2000, 2200, 3300]) }), p => { if (p.Von < p.VT + 3) return false; const k = p.Ion / Math.pow(p.Von - p.VT, 2), q = emosQ(k, p.VT, p.VDD, p.RD); return q.VGS > p.VT + 1 && q.ID > 0.5e-3; }),
  given: p => t(`แผ่นข้อมูลของเอนฮานซ์เมนต์มอสเฟตช่อง n ให้ \\(I_{D(\\text{on})} = ${fx(p.Ion * 1e3)}\\) mA ที่ \\(V_{GS(\\text{on})} = ${fx(p.Von)}\\) V และ \\(V_T = ${fx(p.VT)}\\) V ต่อแบบไบแอสป้อนกลับ (\\(R_G\\) จากเดรนมาเกต) กับ \\(V_{DD} = ${fx(p.VDD)}\\) V, \\(R_D = ${kOx(p.RD)}\\) จงหา \\(k\\), \\(I_{DQ}\\), \\(V_{DSQ}\\)`,
    `The data sheet of an n-channel enhancement MOSFET gives \\(I_{D(\\text{on})} = ${fx(p.Ion * 1e3)}\\) mA at \\(V_{GS(\\text{on})} = ${fx(p.Von)}\\) V and \\(V_T = ${fx(p.VT)}\\) V. It is feedback-biased (\\(R_G\\) from drain to gate) with \\(V_{DD} = ${fx(p.VDD)}\\) V, \\(R_D = ${kOx(p.RD)}\\). Find \\(k\\), \\(I_{DQ}\\), \\(V_{DSQ}\\).`),
  fields: p => { const k = p.Ion / Math.pow(p.Von - p.VT, 2), q = emosQ(k, p.VT, p.VDD, p.RD); return [{ label: 'k (mA/V²)', ans: k * 1e3, tol: 0.003 }, { label: 'I_D (mA)', ans: q.ID * 1e3, tol: 0.03 }, { label: 'V_DS (V)', ans: q.VGS, tol: 0.06 }]; },
  steps: p => { const k = p.Ion / Math.pow(p.Von - p.VT, 2), q = emosQ(k, p.VT, p.VDD, p.RD); return [
    step(t('ค่าคงที่ k จากจุดบนแผ่นข้อมูล', 'the constant k from the data-sheet point'), R`k = \frac{I_{D(\text{on})}}{(V_{GS(\text{on})} - V_T)^2} = \frac{${fx(p.Ion * 1e3)}\ \text{mA}}{(${fx(p.Von)} - ${fx(p.VT)})^2} = ${fx(k * 1e3, 3)}\ \text{mA/V}^2`),
    step(t('ป้อนกลับ: R_G ไม่มีกระแส จึง V_GS = V_DS', 'feedback: no current in R_G, so V_GS = V_DS'), R`V_{GS} = V_{DD} - I_DR_D = ${fx(p.VDD)} - I_D(${kOx(p.RD)})`),
    step(t('แทนใน I_D = k(V_GS − V_T)² แล้วแก้สมการกำลังสอง เลือกรากที่ V_GS > V_T', 'into I_D = k(V_GS − V_T)², a quadratic; keep the root with V_GS > V_T'), R`I_D = ${mAx(q.ID, 3)},\qquad V_{GS} = V_{DS} = ${Vx(q.VGS, 2)}`),
    step(t(`ตรวจอิ่มตัว: V_DS = V_GS > V_GS − V_T = ${fx(q.VGS - p.VT, 2)} V เสมอในวงจรนี้`, `Saturation check: V_DS = V_GS > V_GS − V_T = ${fx(q.VGS - p.VT, 2)} V, always true here`), '')]; },
  answer: p => { const k = p.Ion / Math.pow(p.Von - p.VT, 2), q = emosQ(k, p.VT, p.VDD, p.RD); return `\\(k = ${fx(k * 1e3, 3)}\\) mA/V², \\(I_D = ${fx(q.ID * 1e3, 3)}\\) mA, \\(V_{DS} = V_{GS} = ${fx(q.VGS, 2)}\\) V`; },
  pic: p => CH5.net({ dev: { kind: 'emos', k: p.Ion / Math.pow(p.Von - p.VT, 2), vt: p.VT }, fb: true, RG: 10e6, RD: p.RD, VDD: p.VDD }), engine: jLine });

/* ---- chapter 7: op-amps ---- */
const oLine = c => t(`ตัวแก้วงจร: \\(V_o = ${fx(c.V('o').re, 3)}\\) V`, `engine: \\(V_o = ${fx(c.V('o').re, 3)}\\) V`);
drill({ ch: 7, page: 'ch7_2_inverting_noninverting.html', title: t('อัตราขยายกลับเฟสและไม่กลับเฟส', 'Inverting and noninverting gains'), aspect: 0.5,
  gen: () => retry(() => ({ R1: pick([10e3, 20e3, 22e3, 47e3, 100e3]), Rf: pick([100e3, 200e3, 220e3, 470e3, 500e3, 1e6]), V1: pick([0.2, 0.5, 1, 1.5, 2, 2.5, 3]) }), p => p.Rf / p.R1 <= 25 && p.Rf / p.R1 >= 2),
  given: p => t(`ออปแอมป์ไฟเลี้ยง ±15 V (\\(V_{sat} = \\pm 13\\) V) \\(R_1 = ${kOx(p.R1)}\\), \\(R_f = ${kOx(p.Rf)}\\), \\(V_1 = ${fx(p.V1)}\\) V จงหา \\(V_o\\) เมื่อต่อเป็นวงจรกลับเฟส และเมื่อต่อเป็นวงจรไม่กลับเฟส (ตรวจการอิ่มตัวด้วย)`,
    `An op-amp on ±15 V (\\(V_{sat} = \\pm 13\\) V), \\(R_1 = ${kOx(p.R1)}\\), \\(R_f = ${kOx(p.Rf)}\\), \\(V_1 = ${fx(p.V1)}\\) V. Find \\(V_o\\) as an inverting amplifier and as a noninverting one (check saturation).`),
  fields: p => [{ label: t('กลับเฟส V_o (V)', 'inverting V_o (V)'), ans: clip(-p.Rf / p.R1 * p.V1), tol: 0.02 }, { label: t('ไม่กลับเฟส V_o (V)', 'noninverting V_o (V)'), ans: clip((1 + p.Rf / p.R1) * p.V1), tol: 0.02 }],
  steps: p => { const vi = -p.Rf / p.R1 * p.V1, vn = (1 + p.Rf / p.R1) * p.V1; return [
    step(t('กลับเฟส: กราวด์เสมือนที่ขั้ว − กระแส V_1/R_1 ไหลต่อผ่าน R_f', 'inverting: the virtual ground at −, the current V_1/R_1 flows on through R_f'), R`V_o = -\frac{R_f}{R_1}V_1 = -\frac{${kOx(p.Rf)}}{${kOx(p.R1)}}(${fx(p.V1)}) = ${Vx(vi, 2)}${Math.abs(vi) > VSAT ? R`\ \Rightarrow\ \text{${t('อิ่มตัวที่', 'clipped at')}} -13\ \text{V}` : ''}`),
    step(t('ไม่กลับเฟส: ลัดเสมือน V_− = V_1 แล้วตัวแบ่ง R_1, R_f', 'noninverting: the virtual short V_− = V_1, then the divider R_1, R_f'), R`V_o = \left(1 + \frac{R_f}{R_1}\right)V_1 = (1 + ${fx(p.Rf / p.R1, 2)})(${fx(p.V1)}) = ${Vx(vn, 2)}${Math.abs(vn) > VSAT ? R`\ \Rightarrow\ \text{${t('อิ่มตัวที่', 'clipped at')}} +13\ \text{V}` : ''}`),
    step(t('ค่าที่เกิน ±13 V เป็นไปไม่ได้: ขาออกถูกตัดที่ V_sat', 'Anything beyond ±13 V is impossible: the output is clipped at V_sat'), '')]; },
  answer: p => `${t('กลับเฟส', 'inverting')}: \\(V_o = ${fx(clip(-p.Rf / p.R1 * p.V1), 2)}\\) V · ${t('ไม่กลับเฟส', 'noninverting')}: \\(V_o = ${fx(clip((1 + p.Rf / p.R1) * p.V1), 2)}\\) V`,
  pic: p => OP.ckt({ kind: 'inv', R1: p.R1, Rf: p.Rf, V1: p.V1, vsat: VSAT }), engine: oLine });

drill({ ch: 7, page: 'ch7_3_summing.html', title: t('วงจรรวมสัญญาณ', 'The summing amplifier'), aspect: 0.6,
  gen: () => retry(() => ({ Rf: pick([100e3, 220e3, 330e3, 470e3, 1e6]), R: [pick([33e3, 47e3, 100e3]), pick([47e3, 68e3, 100e3, 220e3]), pick([100e3, 220e3, 330e3])], V: [pick([-2, -1, 0.5, 1, 2]), pick([-1, -0.5, 1, 2, 3]), pick([-2, 1, 2, 3])] }), p => { const s = -p.R.reduce((a, r, k) => a + p.Rf / r * p.V[k], 0); return Math.abs(s) <= 12 && Math.abs(s) >= 0.3; }),
  given: p => t(`วงจรรวมสัญญาณกลับเฟส \\(R_f = ${kOx(p.Rf)}\\) ขาเข้า \\(V_1 = ${fx(p.V[0])}\\) V ผ่าน \\(R_1 = ${kOx(p.R[0])}\\), \\(V_2 = ${fx(p.V[1])}\\) V ผ่าน \\(R_2 = ${kOx(p.R[1])}\\), \\(V_3 = ${fx(p.V[2])}\\) V ผ่าน \\(R_3 = ${kOx(p.R[2])}\\) จงหา \\(V_o\\) (\\(V_{sat} = \\pm 13\\) V)`,
    `An inverting summing amplifier with \\(R_f = ${kOx(p.Rf)}\\): inputs \\(V_1 = ${fx(p.V[0])}\\) V through \\(R_1 = ${kOx(p.R[0])}\\), \\(V_2 = ${fx(p.V[1])}\\) V through \\(R_2 = ${kOx(p.R[1])}\\), \\(V_3 = ${fx(p.V[2])}\\) V through \\(R_3 = ${kOx(p.R[2])}\\). Find \\(V_o\\) (\\(V_{sat} = \\pm 13\\) V).`),
  fields: p => [{ label: 'V_o (V)', ans: clip(-p.R.reduce((a, r, k) => a + p.Rf / r * p.V[k], 0)), tol: 0.02 }],
  steps: p => { const g = p.R.map(r => p.Rf / r), s = -g.reduce((a, gk, k) => a + gk * p.V[k], 0); return [
    step(t('แต่ละขาเข้ามีอัตราขยาย −R_f/R_k ของตัวเอง (กราวด์เสมือนทำให้ขาเข้าไม่รบกวนกัน)', 'Each input has its own gain −R_f/R_k (the virtual ground keeps them apart)'), R`V_o = -\left(\frac{R_f}{R_1}V_1 + \frac{R_f}{R_2}V_2 + \frac{R_f}{R_3}V_3\right)`),
    step('', R`V_o = -\left[${fx(g[0], 3)}(${fx(p.V[0])}) + ${fx(g[1], 3)}(${fx(p.V[1])}) + ${fx(g[2], 3)}(${fx(p.V[2])})\right] = ${Vx(s, 3)}`),
    step(t('|V_o| < 13 V จึงไม่อิ่มตัว (ถ้าเกิน ตอบ ±13 V)', '|V_o| < 13 V, so no saturation (beyond it the answer would be ±13 V)'), '')]; },
  answer: p => `\\(V_o = ${fx(clip(-p.R.reduce((a, r, k) => a + p.Rf / r * p.V[k], 0)), 3)}\\) V`,
  pic: p => OP.ckt({ kind: 'sum', V: p.V, R: p.R, Rf: p.Rf, vsat: VSAT }), engine: oLine });

drill({ ch: 7, page: 'ch7_4_integrator.html', title: t('อินทิเกรเตอร์กับขาเข้าคงที่', 'The integrator with a constant input'),
  gen: () => ({ Rr: pick([100e3, 220e3, 470e3, 1e6]), C: pick([0.1e-6, 0.47e-6, 1e-6, 2.2e-6]), V1: pick([0.5, 1, 2, 5]) }),
  given: p => t(`อินทิเกรเตอร์ \\(R = ${kOx(p.Rr)}\\), \\(C = ${capX(p.C)}\\) ป้อนขั้น \\(V_1 = ${fx(p.V1)}\\) V ตั้งแต่ t = 0 (C ไม่มีประจุ, \\(V_{sat} = 13\\) V) จงหาความชันของขาออก และเวลาที่ขาออกชน −V_sat`,
    `An integrator with \\(R = ${kOx(p.Rr)}\\), \\(C = ${capX(p.C)}\\) gets a step \\(V_1 = ${fx(p.V1)}\\) V from t = 0 (C uncharged, \\(V_{sat} = 13\\) V). Find the slope of the output and the time at which it hits −V_sat.`),
  fields: p => { const s = -p.V1 / (p.Rr * p.C); return [{ label: t('ความชัน (V/s)', 'slope (V/s)'), ans: s }, { label: 't_sat (s)', ans: VSAT / Math.abs(s) }]; },
  steps: p => { const RC = p.Rr * p.C, s = -p.V1 / RC; return [step(t('ค่าคงที่เวลา', 'the time constant'), R`RC = (${kOx(p.Rr)})(${capX(p.C)}) = ${fx(RC, 4)}\ \text{s}`),
    step(t('ขาเข้าคงที่ → ขาออกเป็นแรมป์ลง', 'a constant input → a falling ramp'), R`v_o = -\frac{1}{RC}\int_0^t V_1\,dt = -\frac{V_1}{RC}t = ${fx(s, 3)}\,t\ \text{V}`),
    step(t('ชนรางลบเมื่อ |v_o| = 13 V', 'it reaches the negative rail when |v_o| = 13 V'), R`t_{sat} = \frac{13\ \text{V}}{${fx(Math.abs(s), 3)}\ \text{V/s}} = ${fx(VSAT / Math.abs(s), 4)}\ \text{s}`)]; },
  answer: p => { const s = -p.V1 / (p.Rr * p.C); return `${t('ความชัน', 'slope')} \\(${fx(s, 3)}\\) V/s, \\(t_{sat} = ${fx(VSAT / Math.abs(s), 4)}\\) s`; } });

drill({ ch: 7, page: 'ch7_5_active_filters.html', title: t('ตัวกรองแอกทีฟอันดับหนึ่ง', 'A first-order active filter'), aspect: 0.5,
  gen: () => ({ lp: Math.random() < 0.6, R1: pick([1200, 1500, 2200, 3300, 4700, 10e3]), C1: pick([0.01e-6, 0.02e-6, 0.022e-6, 0.047e-6, 0.1e-6]), RG: pick([10e3, 22e3]), RF: pick([22e3, 47e3, 56e3, 100e3]) }),
  given: p => t(`ตัวกรอง${p.lp ? 'ผ่านต่ำ' : 'ผ่านสูง'}แอกทีฟอันดับหนึ่ง \\(R_1 = ${kOx(p.R1)}\\), \\(C_1 = ${capX(p.C1)}\\) ออปแอมป์ไม่กลับเฟสที่มี \\(R_G = ${kOx(p.RG)}\\), \\(R_F = ${kOx(p.RF)}\\) จงหาความถี่ตัด อัตราขยายย่านผ่าน \\(A_v\\) และขนาดอัตราขยายที่ความถี่ตัด`,
    `A first-order active ${p.lp ? 'low-pass' : 'high-pass'} filter: \\(R_1 = ${kOx(p.R1)}\\), \\(C_1 = ${capX(p.C1)}\\), a noninverting op-amp with \\(R_G = ${kOx(p.RG)}\\), \\(R_F = ${kOx(p.RF)}\\). Find the cutoff frequency, the passband gain \\(A_v\\) and the gain magnitude at the cutoff.`),
  fields: p => { const fc = 1 / (2 * Math.PI * p.R1 * p.C1), Av = 1 + p.RF / p.RG; return [{ label: p.lp ? 'f_OH (Hz)' : 'f_OL (Hz)', ans: fc, tol: 0.01 * fc }, { label: 'A_v', ans: Av, tol: 0.01 }, { label: t('|A| ที่ f_c', '|A| at f_c'), ans: Av / Math.SQRT2, tol: 0.01 }]; },
  steps: p => { const fc = 1 / (2 * Math.PI * p.R1 * p.C1), Av = 1 + p.RF / p.RG; return [step(t('ความถี่ตัดของส่วน RC', 'the cutoff of the RC section'), R`f_{${p.lp ? 'OH' : 'OL'}} = \frac{1}{2\pi R_1C_1} = \frac{1}{2\pi(${kOx(p.R1)})(${capX(p.C1)})} = ${fx(fc, 1)}\ \text{Hz}`),
    step(t('อัตราขยายย่านผ่านของวงจรไม่กลับเฟส', 'the passband gain of the noninverting stage'), R`A_v = 1 + \frac{R_F}{R_G} = 1 + \frac{${kOx(p.RF)}}{${kOx(p.RG)}} = ${fx(Av, 3)}`),
    step(t('ที่ความถี่ตัด ส่วน RC ให้ 1/√2 (−3 dB) หนึ่งทศวรรษถัดไปลดอีก 20 dB', 'At the cutoff the RC section gives 1/√2 (−3 dB); a decade further it is another 20 dB down'), R`|A(f_c)| = \frac{A_v}{\sqrt2} = ${fx(Av / Math.SQRT2, 3)}`)]; },
  answer: p => { const fc = 1 / (2 * Math.PI * p.R1 * p.C1), Av = 1 + p.RF / p.RG; return `\\(f_c = ${fx(fc, 1)}\\) Hz, \\(A_v = ${fx(Av, 3)}\\), \\(|A(f_c)| = ${fx(Av / Math.SQRT2, 3)}\\)`; },
  pic: p => OP.ckt({ kind: p.lp ? 'lp1' : 'hp1', R1: p.R1, C1: p.C1, RG: p.RG, RF: p.RF, f: 1 / (2 * Math.PI * p.R1 * p.C1) }), engine: () => '' });

/* ---- chapter 8: linear-digital ICs ---- */
drill({ ch: 8, page: 'ch8_1_comparators.html', title: t('วงจรเปรียบเทียบกับแรงดันอ้างอิง', 'A comparator with a reference'), aspect: 0.55,
  gen: () => retry(() => ({ Vp: pick([9, 10, 12, 15]), R1: pick([10e3, 15e3, 22e3]), R2: pick([4700, 6800, 10e3, 12e3]), vi: pick([2, 3, 4, 5, 6, 7, 8, 9]) }), p => Math.abs(p.vi - p.R2 / (p.R1 + p.R2) * p.Vp) >= 0.25),   // never on the threshold itself
  given: p => t(`ออปแอมป์ 741 ไฟเลี้ยง ±${fx(p.Vp)} V (ขาออกสวิงถึง ±${fx(p.Vp)} V) ตัวแบ่ง \\(R_1 = ${kOx(p.R1)}\\) (จาก +${fx(p.Vp)} V) กับ \\(R_2 = ${kOx(p.R2)}\\) (ลงกราวด์) ให้ \\(V_{ref}\\) ที่ขั้ว − ส่วน \\(V_i = ${fx(p.vi)}\\) V ป้อนขั้ว + จงหา \\(V_{ref}\\) และ \\(V_o\\)`,
    `A 741 on ±${fx(p.Vp)} V (the output swings to ±${fx(p.Vp)} V). A divider \\(R_1 = ${kOx(p.R1)}\\) (from +${fx(p.Vp)} V) and \\(R_2 = ${kOx(p.R2)}\\) (to ground) sets \\(V_{ref}\\) at the − input; \\(V_i = ${fx(p.vi)}\\) V drives the + input. Find \\(V_{ref}\\) and \\(V_o\\).`),
  fields: p => { const vr = p.R2 / (p.R1 + p.R2) * p.Vp; return [{ label: 'V_ref (V)', ans: vr, tol: 0.02 }, { label: 'V_o (V)', ans: p.vi > vr ? p.Vp : -p.Vp, tol: 0.3 }]; },
  steps: p => { const vr = p.R2 / (p.R1 + p.R2) * p.Vp; return [step(t('แรงดันอ้างอิงจากตัวแบ่ง', 'the reference from the divider'), R`V_{ref} = \frac{R_2}{R_1 + R_2}V^+ = \frac{${kOx(p.R2)}}{${kOx(p.R1 + p.R2)}}(${fx(p.Vp)}) = ${Vx(vr, 2)}`),
    step(t('ไม่มีป้อนกลับ: อัตราขยายเต็มพาขาออกไปสุดราง เครื่องหมายตาม V_+ − V_−', 'no feedback: the full gain drives the output to a rail, the sign following V_+ − V_−'), R`V_i = ${fx(p.vi)}\ \text{V} ${p.vi > vr ? '>' : '<'} V_{ref} \;\Rightarrow\; V_o = ${p.vi > vr ? '+' : '-'}V_{sat} = ${Vx(p.vi > vr ? p.Vp : -p.Vp, 0)}`),
    step(t('สลับขั้วขาเข้าจะได้ผลตรงข้าม (วงจรเปรียบเทียบกลับเฟส)', 'Swapping the inputs gives the opposite (the inverting comparator)'), '')]; },
  answer: p => { const vr = p.R2 / (p.R1 + p.R2) * p.Vp; return `\\(V_{ref} = ${fx(vr, 2)}\\) V, \\(V_o = ${fx(p.vi > vr ? p.Vp : -p.Vp, 0)}\\) V`; },
  pic: p => IC.ckt({ kind: 'comp', vi: p.vi, V: p.Vp, R1: p.R1, R2: p.R2, vsat: p.Vp }), engine: oLine });

drill({ ch: 8, page: 'ch8_2_dac_adc.html', title: t('ตัวเลขของ DAC และ ADC', 'DAC and ADC numbers'),
  gen: () => { const n = pick([4, 6, 8, 10, 12]); return { n, Vref: pick([5, 8, 10, 16]), D: 1 + Math.floor(Math.random() * (Math.pow(2, n) - 1)), fclk: pick([1e3, 10e3, 100e3, 1e6]) }; },
  given: p => t(`DAC แบบบันได R-2R ขนาด \\(n = ${p.n}\\) บิต \\(V_{ref} = ${fx(p.Vref)}\\) V (ก) ขนาดขั้น (ความละเอียด) (ข) \\(V_o\\) เมื่อรหัสดิจิทัลมีค่า \\(D = ${p.D}\\) (ค) ADC แบบบันไดที่ใช้ DAC ตัวนี้กับสัญญาณนาฬิกา \\(${fx(p.fclk / 1e3)}\\) kHz ใช้เวลาแปลงนานที่สุดเท่าใด`,
    `An R-2R ladder DAC with \\(n = ${p.n}\\) bits and \\(V_{ref} = ${fx(p.Vref)}\\) V. (a) The step size (resolution). (b) \\(V_o\\) for the digital code \\(D = ${p.D}\\). (c) The longest conversion time of a ladder ADC built on this DAC with a \\(${fx(p.fclk / 1e3)}\\) kHz clock.`),
  fields: p => { const st = p.Vref / Math.pow(2, p.n); return [{ label: t('ขั้น (mV)', 'step (mV)'), ans: st * 1e3, tol: 0.01 }, { label: 'V_o (V)', ans: p.D * st }, { label: 't_max (ms)', ans: Math.pow(2, p.n) / p.fclk * 1e3 }]; },
  steps: p => { const st = p.Vref / Math.pow(2, p.n); return [step(t('ความละเอียด: V_ref หารด้วยจำนวนระดับ 2ⁿ', 'resolution: V_ref over the 2ⁿ levels'), R`\text{${t('ขั้น', 'step')}} = \frac{V_{ref}}{2^n} = \frac{${fx(p.Vref)}}{${Math.pow(2, p.n)}} = ${fx(st * 1e3, 3)}\ \text{mV}`),
    step(t('ขาออกเป็นรหัสคูณขั้น', 'the output is the code times the step'), R`V_o = D\frac{V_{ref}}{2^n} = ${p.D}(${fx(st * 1e3, 3)}\ \text{mV}) = ${Vx(p.D * st, 3)}`),
    step(t('ADC แบบบันไดนับขึ้นทีละขั้นต่อคาบสัญญาณนาฬิกา กรณีแย่สุดนับจนเต็ม 2ⁿ', 'the ladder ADC counts one step per clock; at worst it counts all 2ⁿ'), R`t_{\max} = 2^n T_{clk} = \frac{${Math.pow(2, p.n)}}{${fx(p.fclk / 1e3)}\ \text{kHz}} = ${fx(Math.pow(2, p.n) / p.fclk * 1e3, 3)}\ \text{ms}`)]; },
  answer: p => { const st = p.Vref / Math.pow(2, p.n); return `${t('ขั้น', 'step')} \\(${fx(st * 1e3, 3)}\\) mV, \\(V_o = ${fx(p.D * st, 3)}\\) V, \\(t_{\\max} = ${fx(Math.pow(2, p.n) / p.fclk * 1e3, 3)}\\) ms`; } });

drill({ ch: 8, page: 'ch8_3_timer_555.html', title: t('555 แอสเทเบิล', 'The 555 astable'), aspect: 0.6,
  gen: () => ({ RA: pick([1000, 2200, 4700, 7500, 10e3]), RB: pick([4700, 7500, 10e3, 22e3, 47e3]), C: pick([0.01e-6, 0.022e-6, 0.047e-6, 0.1e-6, 0.47e-6]), VCC: pick([5, 9, 12]) }),
  given: p => t(`555 ต่อเป็นแอสเทเบิล \\(R_A = ${kOx(p.RA)}\\), \\(R_B = ${kOx(p.RB)}\\), \\(C = ${capX(p.C)}\\), \\(V_{CC} = ${fx(p.VCC)}\\) V จงหา \\(T_{high}\\), \\(T_{low}\\) และความถี่`,
    `A 555 astable with \\(R_A = ${kOx(p.RA)}\\), \\(R_B = ${kOx(p.RB)}\\), \\(C = ${capX(p.C)}\\), \\(V_{CC} = ${fx(p.VCC)}\\) V. Find \\(T_{high}\\), \\(T_{low}\\) and the frequency.`),
  fields: p => { const th = 0.7 * (p.RA + p.RB) * p.C, tl = 0.7 * p.RB * p.C, f = 1.44 / ((p.RA + 2 * p.RB) * p.C); return [{ label: 'T_high (ms)', ans: th * 1e3, tol: 0.01 * th * 1e3 }, { label: 'T_low (ms)', ans: tl * 1e3, tol: 0.01 * tl * 1e3 }, { label: 'f (Hz)', ans: f, tol: 0.02 * f }]; },
  steps: p => { const th = 0.7 * (p.RA + p.RB) * p.C, tl = 0.7 * p.RB * p.C, f = 1.44 / ((p.RA + 2 * p.RB) * p.C); return [step(t('ชาร์จผ่าน R_A + R_B จาก V_CC/3 ถึง 2V_CC/3 (ln 2 ≈ 0.7)', 'charging through R_A + R_B from V_CC/3 to 2V_CC/3 (ln 2 ≈ 0.7)'), R`T_{high} = 0.7(R_A + R_B)C = 0.7(${kOx(p.RA + p.RB)})(${capX(p.C)}) = ${fx(th * 1e3, 4)}\ \text{ms}`),
    step(t('คายผ่าน R_B อย่างเดียว', 'discharging through R_B alone'), R`T_{low} = 0.7R_BC = ${fx(tl * 1e3, 4)}\ \text{ms}`),
    step(t('ความถี่ (สมการ 13.5 ของตำรา; 1/(T_high + T_low) ต่างราว 1 %)', 'the frequency (the book\'s Eq. 13.5; 1/(T_high + T_low) differs by about 1 %)'), R`f = \frac{1.44}{(R_A + 2R_B)C} = \frac{1.44}{(${kOx(p.RA + 2 * p.RB)})(${capX(p.C)})} = ${fx(f, 1)}\ \text{Hz}`),
    step(t(`duty cycle = T_high/(T_high + T_low) = ${fx(100 * th / (th + tl), 1)} % (> 50 % เสมอ) V_CC ไม่มีผลต่อเวลา`, `duty cycle = T_high/(T_high + T_low) = ${fx(100 * th / (th + tl), 1)} % (always > 50 %); V_CC does not enter the timing`), '')]; },
  answer: p => { const th = 0.7 * (p.RA + p.RB) * p.C, tl = 0.7 * p.RB * p.C; return `\\(T_{high} = ${fx(th * 1e3, 4)}\\) ms, \\(T_{low} = ${fx(tl * 1e3, 4)}\\) ms, \\(f = ${fx(1.44 / ((p.RA + 2 * p.RB) * p.C), 1)}\\) Hz`; },
  pic: p => IC.ckt({ kind: 't555', RA: p.RA, RB: p.RB, C: p.C, VCC: p.VCC }), view: { dots: false }, engine: () => '' });

drill({ ch: 8, page: 'ch8_4_vco.html', title: t('วันช็อต 555 และ VCO 566', 'The 555 one-shot and the 566 VCO'), aspect: 0.6,
  gen: () => retry(() => ({ RA: pick([7500, 10e3, 22e3, 47e3, 100e3]), C: pick([0.01e-6, 0.1e-6, 1e-6]), Vp: 12, R2: pick([1500, 2200, 3300]), R3: pick([10e3, 15e3, 22e3]), R1: pick([4700, 10e3, 15e3]), C1: pick([470e-12, 820e-12, 1e-9, 2.2e-9]) }), p => { const VC = p.Vp * p.R3 / (p.R2 + p.R3); return VC >= 0.75 * p.Vp && 2 * (p.Vp - VC) / (p.R1 * p.C1 * p.Vp) < 1e6; }),
  given: p => t(`(ก) 555 โมโนสเทเบิลที่มี \\(R_A = ${kOx(p.RA)}\\), \\(C = ${capX(p.C)}\\) จงหาความกว้างพัลส์ขาออก (ข) 566 ไฟเลี้ยง \\(V^+ = ${fx(p.Vp)}\\) V ตัวแบ่ง \\(R_2 = ${kOx(p.R2)}\\) (บน) กับ \\(R_3 = ${kOx(p.R3)}\\) (ลงกราวด์) ป้อนขา 5, \\(R_1 = ${kOx(p.R1)}\\), \\(C_1 = ${capX(p.C1)}\\) จงหา \\(V_C\\) และ \\(f_o\\)`,
    `(a) A 555 one-shot with \\(R_A = ${kOx(p.RA)}\\), \\(C = ${capX(p.C)}\\): find the output pulse width. (b) A 566 on \\(V^+ = ${fx(p.Vp)}\\) V with a divider \\(R_2 = ${kOx(p.R2)}\\) (top) and \\(R_3 = ${kOx(p.R3)}\\) (to ground) feeding pin 5, \\(R_1 = ${kOx(p.R1)}\\), \\(C_1 = ${capX(p.C1)}\\): find \\(V_C\\) and \\(f_o\\).`),
  fields: p => { const T = 1.1 * p.RA * p.C, VC = p.Vp * p.R3 / (p.R2 + p.R3), fo = 2 * (p.Vp - VC) / (p.R1 * p.C1 * p.Vp); return [{ label: 'T_high (ms)', ans: T * 1e3, tol: 0.01 * T * 1e3 }, { label: 'V_C (V)', ans: VC, tol: 0.02 }, { label: 'f_o (kHz)', ans: fo / 1e3, tol: 0.015 * fo / 1e3 }]; },
  steps: p => { const T = 1.1 * p.RA * p.C, VC = p.Vp * p.R3 / (p.R2 + p.R3), fo = 2 * (p.Vp - VC) / (p.R1 * p.C1 * p.Vp); return [step(t('วันช็อต: C ชาร์จจาก 0 ถึง 2V_CC/3 (ln 3 ≈ 1.1)', 'one-shot: C charges from 0 to 2V_CC/3 (ln 3 ≈ 1.1)'), R`T_{high} = 1.1R_AC = 1.1(${kOx(p.RA)})(${capX(p.C)}) = ${fx(T * 1e3, 4)}\ \text{ms}`),
    step(t('แรงดันควบคุมที่ขา 5 จากตัวแบ่ง (ต้องอยู่ระหว่าง 0.75V⁺ ถึง V⁺)', 'the control voltage at pin 5 from the divider (must lie between 0.75V⁺ and V⁺)'), R`V_C = \frac{R_3}{R_2 + R_3}V^+ = \frac{${kOx(p.R3)}}{${kOx(p.R2 + p.R3)}}(${fx(p.Vp)}) = ${Vx(VC, 3)}`),
    step(t('ความถี่ของ 566 (ใช้ V_C ที่ไม่ปัด)', 'the 566 frequency (with the unrounded V_C)'), R`f_o = \frac{2}{R_1C_1}\left(\frac{V^+ - V_C}{V^+}\right) = \frac{2}{(${kOx(p.R1)})(${capX(p.C1)})}\left(\frac{${fx(p.Vp)} - ${fx(VC, 3)}}{${fx(p.Vp)}}\right) = ${fx(fo / 1e3, 2)}\ \text{kHz}`),
    step(t('ตรวจขีดจำกัด: 2 kΩ ≤ R_1 ≤ 20 kΩ และ f_o ≤ 1 MHz', 'Check the limits: 2 kΩ ≤ R_1 ≤ 20 kΩ and f_o ≤ 1 MHz'), '')]; },
  answer: p => { const T = 1.1 * p.RA * p.C, VC = p.Vp * p.R3 / (p.R2 + p.R3), fo = 2 * (p.Vp - VC) / (p.R1 * p.C1 * p.Vp); return `\\(T_{high} = ${fx(T * 1e3, 4)}\\) ms, \\(V_C = ${fx(VC, 3)}\\) V, \\(f_o = ${fx(fo / 1e3, 2)}\\) kHz`; },
  pic: p => IC.ckt({ kind: 'v566', Vp: p.Vp, R1: p.R1, C1: p.C1, R2: p.R2, R3: p.R3, VC: p.Vp * p.R3 / (p.R2 + p.R3) }), view: { dots: false }, engine: () => '' });
RV.DRILLS = DRILLS;

/* =====================================================================================================================
   3) concept questions: { q: [th, en], o: [[th, en], …], a: index of the right option, why: [th, en] } */
RV.CONCEPTS = {
1: [
  { q: ['ในสารกึ่งตัวนำชนิด n พาหะข้างมากคืออะไร', 'In n-type material the majority carriers are'], o: [['โฮล', 'holes'], ['อิเล็กตรอน', 'electrons'], ['ไอออนบวกของโดเนอร์', 'the positive donor ions'], ['ไอออนลบของแอกเซปเตอร์', 'the negative acceptor ions']], a: 1,
    why: ['อะตอมโดเนอร์ (เวเลนซ์ห้า) ให้อิเล็กตรอนอิสระหนึ่งตัวต่ออะตอม โฮลเป็นพาหะข้างน้อย ส่วนไอออนอยู่กับที่ ไม่ใช่พาหะ', 'Each donor atom (valence five) frees one electron; holes are the minority carriers, and ions are fixed, not carriers'] },
  { q: ['เมื่อไดโอดได้รับไบแอสกลับ บริเวณปลอดพาหะ (depletion region) จะเป็นอย่างไร', 'Under reverse bias the depletion region of a diode'], o: [['แคบลง', 'narrows'], ['หายไป', 'disappears'], ['กว้างขึ้น', 'widens'], ['ไม่เปลี่ยน', 'does not change']], a: 2,
    why: ['ไบแอสกลับดึงพาหะข้างมากออกจากรอยต่อ เหลือไอออนที่ไม่มีพาหะมากขึ้น บริเวณปลอดพาหะจึงกว้างขึ้น เหลือแค่กระแสอิ่มตัวย้อนกลับ I_s', 'Reverse bias pulls the majority carriers away from the junction, uncovering more ions: the region widens and only I_s flows'] },
  { q: ['ไดโอดทำงานที่ \\(I_D = 13\\) mA ความต้านทานกระแสสลับ \\(r_d\\) ประมาณเท่าใด', 'A diode runs at \\(I_D = 13\\) mA. Its ac resistance \\(r_d\\) is about'], o: [['0.5 Ω', '0.5 Ω'], ['2 Ω', '2 Ω'], ['20 Ω', '20 Ω'], ['200 Ω', '200 Ω']], a: 1,
    why: ['\\(r_d \\cong 26\\ \\text{mV}/I_D = 26/13 = 2\\ \\Omega\\)', '\\(r_d \\cong 26\\ \\text{mV}/I_D = 26/13 = 2\\ \\Omega\\)'] },
  { q: ['อุณหภูมิสูงขึ้น 10 °C กระแสอิ่มตัวย้อนกลับ \\(I_s\\) ของไดโอดซิลิคอนเปลี่ยนอย่างไร', 'If the temperature rises by 10 °C, the reverse saturation current \\(I_s\\) of a silicon diode'], o: [['ลดลงครึ่งหนึ่ง', 'halves'], ['คงที่', 'stays the same'], ['เพิ่มเป็นประมาณสองเท่า', 'roughly doubles'], ['เป็นศูนย์', 'drops to zero']], a: 2,
    why: ['ตำรา: \\(I_s\\) เพิ่มเป็นประมาณสองเท่าทุก 10 °C ส่วนแรงดันตกคร่อมขณะนำลดราว 2.5 mV/°C', 'The book: \\(I_s\\) roughly doubles for every 10 °C, while the forward drop falls by about 2.5 mV/°C'] }],
2: [
  { q: ['ไดโอด Si กับ Ge ต่อขนานกันแล้วรับกระแสจากแหล่งจ่าย 10 V ผ่านตัวต้านทาน ไดโอดใดนำ', 'A Si and a Ge diode in parallel are fed from 10 V through a resistor. Which conducts?'], o: [['ทั้งสองแบ่งกระแสเท่ากัน', 'both, sharing equally'], ['เฉพาะ Si', 'only the Si'], ['ไม่มีตัวใดนำ', 'neither'], ['เฉพาะ Ge', 'only the Ge']], a: 3,
    why: ['Ge นำที่ 0.3 V และตรึงแรงดันคร่อมทั้งคู่ไว้ที่ 0.3 V ซึ่งต่ำกว่า 0.7 V ที่ Si ต้องการ Si จึงไม่นำ (Example 2.12)', 'The Ge diode turns on at 0.3 V and holds the pair there, below the 0.7 V the Si diode needs, so the Si stays off (Example 2.12)'] },
  { q: ['PIV ของไดโอดในวงจรเรียงกระแสเต็มคลื่นแบบแท็ปกลาง (แต่ละครึ่งของขดยอด \\(V_m\\)) เท่าใด', 'The PIV of each diode in a centre-tapped full-wave rectifier (each half of the secondary peaks at \\(V_m\\)) is'], o: [['\\(2V_m\\)', '\\(2V_m\\)'], ['\\(V_m\\)', '\\(V_m\\)'], ['\\(V_m/2\\)', '\\(V_m/2\\)'], ['\\(0.636V_m\\)', '\\(0.636V_m\\)']], a: 0,
    why: ['ไดโอดที่ไม่นำรับแรงดันของทั้งสองครึ่งขด: \\(V_m\\) ของขดตัวเอง บวก \\(V_m\\) ที่โหลด (บริดจ์มีแค่ \\(V_m\\))', 'The off diode sees both halves of the secondary: \\(V_m\\) of its own half plus \\(V_m\\) across the load (a bridge sees only \\(V_m\\))'] },
  { q: ['สวิงยอดถึงยอดของขาออกวงจรแคลมเปอร์เทียบกับขาเข้าเป็นอย่างไร', 'The peak-to-peak swing of a clamper\'s output compared with its input is'], o: [['ครึ่งหนึ่ง', 'half'], ['เท่ากัน', 'the same'], ['สองเท่า', 'twice'], ['ขึ้นกับ R', 'set by R']], a: 1,
    why: ['แคลมเปอร์แค่เลื่อนระดับกระแสตรงด้วยแรงดันของ C (\\(RC \\gg T/2\\)) รูปคลื่นและสวิงไม่เปลี่ยน', 'A clamper only shifts the dc level by the capacitor\'s voltage (\\(RC \\gg T/2\\)); the shape and swing stay the same'] },
  { q: ['ถอดซีเนอร์ออกแล้วแรงดันที่โหลด \\(V\\) ต่ำกว่า \\(V_Z\\) แปลว่าอะไร', 'With the Zener removed the load voltage \\(V\\) is below \\(V_Z\\). This means'], o: [['ซีเนอร์นำ \\(V_L = V_Z\\)', 'the Zener is on, \\(V_L = V_Z\\)'], ['\\(I_Z\\) ติดลบ', '\\(I_Z\\) is negative'], ['ซีเนอร์ไม่นำ \\(V_L = V\\), \\(I_Z = 0\\)', 'the Zener is off, \\(V_L = V\\), \\(I_Z = 0\\)'], ['ต้องลด \\(R\\)', '\\(R\\) must be reduced']], a: 2,
    why: ['ซีเนอร์ต้องการอย่างน้อย \\(V_Z\\) จึงพังทลายและนำ ถ้าตัวแบ่งให้ไม่ถึง ซีเนอร์เป็นเปิดวงจร (Example 2.26 กรณี 1.2 kΩ)', 'A Zener needs at least \\(V_Z\\) to break down; if the divider gives less it is an open circuit (Example 2.26 with 1.2 kΩ)'] }],
3: [
  { q: ['ทรานซิสเตอร์มี \\(\\beta = 100\\) ค่า \\(\\alpha\\) เท่าใด', 'A transistor with \\(\\beta = 100\\) has \\(\\alpha\\) equal to'], o: [['0.900', '0.900'], ['0.990', '0.990'], ['0.999', '0.999'], ['1.01', '1.01']], a: 1,
    why: ['\\(\\alpha = \\beta/(\\beta + 1) = 100/101 = 0.990\\) และ α ไม่มีทางเกิน 1', '\\(\\alpha = \\beta/(\\beta + 1) = 100/101 = 0.990\\), and α can never exceed 1'] },
  { q: ['ในย่านแอกทีฟ รอยต่อทั้งสองของ BJT ได้รับไบแอสแบบใด', 'In the active region the two junctions of a BJT are'], o: [['B–E ตรง, B–C กลับ', 'B–E forward, B–C reverse'], ['ทั้งสองตรง', 'both forward'], ['ทั้งสองกลับ', 'both reverse'], ['B–E กลับ, B–C ตรง', 'B–E reverse, B–C forward']], a: 0,
    why: ['ทั้งสองตรง = อิ่มตัว ทั้งสองกลับ = คัตออฟ ย่านแอกทีฟ (ใช้ขยายสัญญาณ) คือ B–E ตรง B–C กลับ', 'Both forward is saturation and both reverse is cutoff; the active (amplifying) region is B–E forward, B–C reverse'] },
  { q: ['กระแสใดใหญ่ที่สุดในทรานซิสเตอร์', 'Which current is the largest in a transistor?'], o: [['\\(I_B\\)', '\\(I_B\\)'], ['\\(I_C\\)', '\\(I_C\\)'], ['\\(I_E\\)', '\\(I_E\\)'], ['เท่ากันหมด', 'all equal']], a: 2,
    why: ['\\(I_E = I_C + I_B\\) อิมิตเตอร์รับกระแสของทั้งสองขา', '\\(I_E = I_C + I_B\\): the emitter carries the other two'] }],
4: [
  { q: ['ในไบแอสอิมิตเตอร์ \\(R_E\\) ปรากฏในวงรอบเบสเป็นเท่าใด', 'In emitter bias, \\(R_E\\) appears in the base loop as'], o: [['\\(R_E\\)', '\\(R_E\\)'], ['\\(R_E/\\beta\\)', '\\(R_E/\\beta\\)'], ['\\((\\beta + 1)R_E\\)', '\\((\\beta + 1)R_E\\)'], ['\\(\\beta R_C\\)', '\\(\\beta R_C\\)']], a: 2,
    why: ['\\(R_E\\) มีกระแส \\(I_E = (\\beta + 1)I_B\\) เมื่อมองจากเบสจึงเหมือนตัวต้านทาน \\((\\beta + 1)R_E\\)', '\\(R_E\\) carries \\(I_E = (\\beta + 1)I_B\\), so seen from the base it looks like \\((\\beta + 1)R_E\\)'] },
  { q: ['คำนวณได้ \\(V_{CE}\\) ติดลบ หมายความว่าอะไร', 'A computed \\(V_{CE}\\) comes out negative. This means'], o: [['ทรานซิสเตอร์คัตออฟ', 'the transistor is cut off'], ['ทรานซิสเตอร์อิ่มตัว ใช้ \\(I_{C\\text{sat}}\\)', 'the transistor is saturated: use \\(I_{C\\text{sat}}\\)'], ['คำตอบถูกแล้ว', 'the answer is fine'], ['β ติดลบ', 'β is negative']], a: 1,
    why: ['\\(I_C = \\beta I_B\\) ใช้ได้เฉพาะย่านแอกทีฟ ถ้า βI_B เกิน \\(I_{C\\text{sat}}\\) ทรานซิสเตอร์อิ่มตัว \\(V_{CE} \\approx 0.1\\)–0.3 V', '\\(I_C = \\beta I_B\\) holds only in the active region; if βI_B exceeds \\(I_{C\\text{sat}}\\) the transistor saturates with \\(V_{CE} \\approx 0.1\\)–0.3 V'] },
  { q: ['ใช้วิธีประมาณของไบแอสตัวแบ่งแรงดันได้เมื่อใด', 'The approximate method for voltage-divider bias is allowed when'], o: [['\\(R_1 = R_2\\)', '\\(R_1 = R_2\\)'], ['\\(\\beta \\ge 10\\)', '\\(\\beta \\ge 10\\)'], ['\\(R_E \\ge 10R_C\\)', '\\(R_E \\ge 10R_C\\)'], ['\\(\\beta R_E \\ge 10R_2\\)', '\\(\\beta R_E \\ge 10R_2\\)']], a: 3,
    why: ['ความต้านทานที่มองเข้าเบส \\(\\beta R_E\\) ต้องใหญ่กว่า \\(R_2\\) อย่างน้อยสิบเท่า กระแสเบสจึงไม่ทำให้ตัวแบ่งเพี้ยน', 'The resistance seen into the base, \\(\\beta R_E\\), must be at least ten times \\(R_2\\) so that the base current hardly loads the divider'] }],
5: [
  { q: ['JFET ช่อง n ที่ \\(V_{GS} = V_P\\) มีกระแส \\(I_D\\) เท่าใด', 'An n-channel JFET at \\(V_{GS} = V_P\\) carries'], o: [['\\(I_{DSS}\\)', '\\(I_{DSS}\\)'], ['0', '0'], ['\\(I_{DSS}/2\\)', '\\(I_{DSS}/2\\)'], ['\\(I_{DSS}/4\\)', '\\(I_{DSS}/4\\)']], a: 1,
    why: ['ช่องถูกบีบปิด (คัตออฟ): \\((1 - V_P/V_P)^2 = 0\\)', 'The channel is pinched shut (cutoff): \\((1 - V_P/V_P)^2 = 0\\)'] },
  { q: ['ที่ \\(V_{GS} = 0.5V_P\\) กระแส \\(I_D\\) ประมาณเท่าใด', 'At \\(V_{GS} = 0.5V_P\\), \\(I_D\\) is about'], o: [['\\(I_{DSS}/4\\)', '\\(I_{DSS}/4\\)'], ['\\(I_{DSS}/2\\)', '\\(I_{DSS}/2\\)'], ['\\(I_{DSS}\\)', '\\(I_{DSS}\\)'], ['0', '0']], a: 0,
    why: ['\\((1 - 0.5)^2 = 0.25\\) ส่วน \\(I_{DSS}/2\\) เกิดที่ \\(V_{GS} \\approx 0.3V_P\\) (ตาราง 6.1)', '\\((1 - 0.5)^2 = 0.25\\); \\(I_{DSS}/2\\) comes at \\(V_{GS} \\approx 0.3V_P\\) (Table 6.1)'] },
  { q: ['กระแสเกต \\(I_G\\) ของ JFET ที่ใช้งานตามปกติเท่าใด', 'In normal use the gate current \\(I_G\\) of a JFET is'], o: [['\\(I_D\\)', '\\(I_D\\)'], ['\\(I_{DSS}\\)', '\\(I_{DSS}\\)'], ['ประมาณ 0', 'about 0'], ['\\(I_S\\)', '\\(I_S\\)']], a: 2,
    why: ['รอยต่อเกต–ช่องได้รับไบแอสกลับ จึงแทบไม่มีกระแส \\(I_D = I_S\\) และตัวแบ่งที่เกตไม่มีโหลด', 'The gate–channel junction is reverse-biased, so almost no current flows: \\(I_D = I_S\\) and a gate divider is unloaded'] },
  { q: ['ในไบแอสตัวเอง สมการของเส้นไบแอสคืออะไร', 'In self bias the bias line is'], o: [['\\(V_{GS} = -V_{GG}\\)', '\\(V_{GS} = -V_{GG}\\)'], ['\\(V_{GS} = -I_DR_S\\)', '\\(V_{GS} = -I_DR_S\\)'], ['\\(V_{GS} = V_{DD} - I_DR_D\\)', '\\(V_{GS} = V_{DD} - I_DR_D\\)'], ['\\(V_{GS} = V_P\\)', '\\(V_{GS} = V_P\\)']], a: 1,
    why: ['เกตอยู่ที่ 0 V (ผ่าน \\(R_G\\) ที่ไม่มีกระแส) ซอร์สอยู่ที่ \\(I_DR_S\\) จึง \\(V_{GS} = -I_DR_S\\) เส้นตรงผ่านจุดกำเนิด', 'The gate sits at 0 V (through a current-free \\(R_G\\)) and the source at \\(I_DR_S\\): \\(V_{GS} = -I_DR_S\\), a line through the origin'] }],
6: [
  { q: ['ดีพลีชันมอสเฟตที่ \\(V_{GS} > 0\\) มีกระแส \\(I_D\\) อย่างไร', 'A depletion MOSFET at \\(V_{GS} > 0\\) has'], o: [['\\(I_D > I_{DSS}\\)', '\\(I_D > I_{DSS}\\)'], ['\\(I_D < I_{DSS}\\)', '\\(I_D < I_{DSS}\\)'], ['\\(I_D = 0\\)', '\\(I_D = 0\\)'], ['\\(I_D = I_{DSS}\\)', '\\(I_D = I_{DSS}\\)']], a: 0,
    why: ['เกตฉนวนจึงใช้ V_GS บวกได้ (โหมดเอนฮานซ์เมนต์) ช็อกลีย์ยังใช้ได้และให้มากกว่า \\(I_{DSS}\\)', 'The insulated gate allows a positive V_GS (enhancement mode); Shockley still holds and gives more than \\(I_{DSS}\\)'] },
  { q: ['เอนฮานซ์เมนต์มอสเฟตช่อง n ที่ \\(V_{GS} < V_T\\) เป็นอย่างไร', 'An n-channel enhancement MOSFET at \\(V_{GS} < V_T\\)'], o: [['นำ \\(I_{DSS}\\)', 'carries \\(I_{DSS}\\)'], ['นำ \\(kV_T^2\\)', 'carries \\(kV_T^2\\)'], ['อิ่มตัวเต็มที่', 'is fully saturated'], ['ไม่นำ \\(I_D = 0\\)', 'is off, \\(I_D = 0\\)']], a: 3,
    why: ['ยังไม่เกิดช่องเหนี่ยวนำจนกว่า \\(V_{GS}\\) เกิน \\(V_T\\) สูตร \\(k(V_{GS} - V_T)^2\\) ใช้เฉพาะเหนือ \\(V_T\\)', 'No channel is induced until \\(V_{GS}\\) exceeds \\(V_T\\); \\(k(V_{GS} - V_T)^2\\) applies only above \\(V_T\\)'] },
  { q: ['ไบแอสป้อนกลับของเอนฮานซ์เมนต์มอสเฟต (\\(R_G\\) จากเดรนมาเกต) ทำให้เกิดอะไร', 'Feedback bias of an enhancement MOSFET (\\(R_G\\) from drain to gate) gives'], o: [['\\(V_G = 0\\)', '\\(V_G = 0\\)'], ['\\(V_{GS} = V_{DS}\\)', '\\(V_{GS} = V_{DS}\\)'], ['\\(V_{DS} = V_{DD}\\)', '\\(V_{DS} = V_{DD}\\)'], ['\\(I_D = I_{DSS}\\)', '\\(I_D = I_{DSS}\\)']], a: 1,
    why: ['ไม่มีกระแสใน \\(R_G\\) แรงดันเกตจึงเท่าแรงดันเดรน ซอร์สต่อกราวด์: \\(V_{GS} = V_{DS} = V_{DD} - I_DR_D\\)', 'No current flows in \\(R_G\\), so the gate sits at the drain voltage with the source grounded: \\(V_{GS} = V_{DS} = V_{DD} - I_DR_D\\)'] }],
7: [
  { q: ['วงจรขยายกลับเฟส \\(R_f = 100\\) kΩ, \\(R_1 = 10\\) kΩ มีอัตราขยายเท่าใด', 'An inverting amplifier with \\(R_f = 100\\) kΩ, \\(R_1 = 10\\) kΩ has a gain of'], o: [['+10', '+10'], ['+11', '+11'], ['−10', '−10'], ['−11', '−11']], a: 2,
    why: ['\\(A_v = -R_f/R_1 = -10\\) ส่วน "1 +" เป็นของวงจรไม่กลับเฟส', '\\(A_v = -R_f/R_1 = -10\\); the "1 +" belongs to the noninverting amplifier'] },
  { q: ['วงจรไม่กลับเฟส \\(R_f = 100\\) kΩ, \\(R_1 = 10\\) kΩ มีอัตราขยายเท่าใด', 'A noninverting amplifier with \\(R_f = 100\\) kΩ, \\(R_1 = 10\\) kΩ has a gain of'], o: [['10', '10'], ['11', '11'], ['−10', '−10'], ['9', '9']], a: 1,
    why: ['\\(A_v = 1 + R_f/R_1 = 11\\)', '\\(A_v = 1 + R_f/R_1 = 11\\)'] },
  { q: ['\\(A_d = 10^5\\) และ CMRR = 100 dB จะได้ \\(A_c\\) เท่าใด', 'With \\(A_d = 10^5\\) and a CMRR of 100 dB, \\(A_c\\) is'], o: [['0.1', '0.1'], ['1', '1'], ['10', '10'], ['1000', '1000']], a: 1,
    why: ['100 dB = \\(10^{100/20} = 10^5\\) จึง \\(A_c = A_d/\\text{CMRR} = 1\\)', '100 dB = \\(10^{100/20} = 10^5\\), so \\(A_c = A_d/\\text{CMRR} = 1\\)'] },
  { q: ['ป้อนแรงดันคงที่บวกเข้าอินทิเกรเตอร์ ขาออกเป็นอย่างไร', 'A constant positive voltage into an integrator gives an output that'], o: [['คงที่', 'is constant'], ['เป็นไซน์', 'is a sine'], ['เป็นแรมป์ขึ้น', 'ramps up'], ['เป็นแรมป์ลงจนชน −V_sat', 'ramps down until it hits −V_sat']], a: 3,
    why: ['\\(v_o = -\\frac{1}{RC}\\int V_1\\,dt = -\\frac{V_1}{RC}t\\) ลาดลบ (วงจรกลับเฟส) จนอิ่มตัว', '\\(v_o = -\\frac{1}{RC}\\int V_1\\,dt = -\\frac{V_1}{RC}t\\): a falling ramp (the circuit inverts) until it saturates'] },
  { q: ['ตัวกรองผ่านต่ำอันดับสอง ลาดลงเหนือความถี่ตัดเท่าใด', 'Above its cutoff a second-order low-pass filter falls at'], o: [['−20 dB/ทศวรรษ', '−20 dB/decade'], ['−40 dB/ทศวรรษ', '−40 dB/decade'], ['−60 dB/ทศวรรษ', '−60 dB/decade'], ['ไม่ลด', 'it does not fall']], a: 1,
    why: ['อันดับละ −20 dB/ทศวรรษ: อันดับสองจึง −40 dB/ทศวรรษ', 'Each order adds −20 dB/decade, so second order gives −40 dB/decade'] }],
8: [
  { q: ['วงจรเปรียบเทียบ: \\(V_+ = 3.000\\) V, \\(V_- = 3.001\\) V ขาออกเป็นเท่าใด', 'A comparator with \\(V_+ = 3.000\\) V and \\(V_- = 3.001\\) V gives'], o: [['0 V', '0 V'], ['+V_sat', '+V_sat'], ['−V_sat', '−V_sat'], ['−1 mV', '−1 mV']], a: 2,
    why: ['ไม่มีป้อนกลับ อัตราขยายเป็นแสนเท่า: −1 mV × 2×10⁵ เกินรางมาก ขาออกจึง −V_sat', 'No feedback and a gain of hundreds of thousands: −1 mV × 2×10⁵ is far beyond the rail, so the output is −V_sat'] },
  { q: ['DAC 4 บิต \\(V_{ref} = 16\\) V รหัส 1010 ให้ \\(V_o\\) เท่าใด', 'A 4-bit DAC with \\(V_{ref} = 16\\) V and code 1010 gives \\(V_o\\) ='], o: [['1.6 V', '1.6 V'], ['5 V', '5 V'], ['10 V', '10 V'], ['16 V', '16 V']], a: 2,
    why: ['ขั้น = 16/2⁴ = 1 V รหัส 1010 = 10 จึงได้ 10 V', 'Step = 16/2⁴ = 1 V and 1010 = 10, so 10 V'] },
  { q: ['555 แอสเทเบิลที่ \\(R_A = R_B\\) มี duty cycle เท่าใด', 'A 555 astable with \\(R_A = R_B\\) has a duty cycle of'], o: [['33.3 %', '33.3 %'], ['50 %', '50 %'], ['66.7 %', '66.7 %'], ['100 %', '100 %']], a: 2,
    why: ['\\(T_{high}/T = (R_A + R_B)/(R_A + 2R_B) = 2/3\\) ไม่มีทางถึง 50 % เพราะ C ชาร์จผ่านสองตัวแต่คายผ่านตัวเดียว', '\\(T_{high}/T = (R_A + R_B)/(R_A + 2R_B) = 2/3\\); it never reaches 50 % because C charges through two resistors and discharges through one'] },
  { q: ['566: เพิ่ม \\(V_C\\) เข้าใกล้ \\(V^+\\) ความถี่ \\(f_o\\) จะเป็นอย่างไร', '566: raising \\(V_C\\) towards \\(V^+\\) makes \\(f_o\\)'], o: [['เพิ่มขึ้น', 'rise'], ['ลดลง', 'fall'], ['คงที่', 'stay the same'], ['เพิ่มเป็นสองเท่า', 'double']], a: 1,
    why: ['\\(f_o \\propto V^+ - V_C\\): กระแสชาร์จ \\((V^+ - V_C)/R_1\\) เล็กลง C จึงชาร์จช้าลง', '\\(f_o \\propto V^+ - V_C\\): the charging current \\((V^+ - V_C)/R_1\\) shrinks, so C charges more slowly'] }]
};

/* =====================================================================================================================
   4) the page: scope switch, chapter tiles, one section per chapter (formula sheet, recipe, traps, concept questions, drills),
   the mock exam and the checklist. Containers in review.html: #rvScope, #rvTiles, #rvChapters, #rvMock, #rvCheck */
const $ = id => document.getElementById(id);
const SCOPES = { all: [1, 2, 3, 4, 5, 6, 7, 8], mid: [1, 2, 3, 4, 5, 6], fin: [7, 8] };
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const CKEY = 'ie-review-check', SKEY = 'ie-review-scope';
DRILLS.forEach(d => { d.id = d.page.replace('.html', ''); });
const pagesOf = ch => MC.live().filter(s => s.ch === ch);
const okOf = f => x => near(x, f.ans, f.tol) || (f.alt !== undefined && near(x, f.alt, f.tol)) || (f.alt2 !== undefined && near(x, f.alt2, f.tol));
RV.okOf = okOf;
const texOf = x => (Array.isArray(x) ? t(x[0], x[1]) : x);
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/* plain-text subscripts for the recipe, the traps and the notes: "V_CE" → V<sub>CE</sub>, "I_CR_C" → I<sub>C</sub>R<sub>C</sub>, "V_+" → V<sub>+</sub> */
const subx = s => esc(s).replace(/_([+−]|[A-Za-z0-9]+)/g, (m, g, off, str) => (str[off + m.length] === '_' && g.length > 1 && /[A-Za-z]$/.test(g) ? `<sub>${g.slice(0, -1)}</sub>${g.slice(-1)}` : `<sub>${g}</sub>`));
RV.subx = subx;

/* formulas: top-level separators ("a = b,\qquad c = d") become rows of an aligned block, each aligned at its first "=" */
const SEPS = [',\\qquad ', '\\quad\\cdot\\quad ', ',\\quad ', '\\qquad '];
const segs = s => { const out = []; let d = 0, lr = 0, last = 0, i = 0;
  while (i < s.length) { const c = s[i];
    if (!d && !lr) { const sp = SEPS.find(x => s.startsWith(x, i)); if (sp) { out.push(s.slice(last, i)); i += sp.length; last = i; continue; } }
    if (c === '\\') { const m = /^\\([a-zA-Z]+|[\s\S])/.exec(s.slice(i)); if (m[1] === 'left') lr++; else if (m[1] === 'right') lr--; i += m[0].length; continue; }
    if (c === '{') d++; else if (c === '}') d--; i++; }
  out.push(s.slice(last)); return out.map(x => x.trim()).filter(Boolean); };
const RELS = ['cong', 'approx', 'ge', 'le', 'geq', 'leq', 'gg', 'll', 'propto', 'neq'];
const alignRow = r => { let d = 0, lr = 0;   // the "&" goes before the first top-level relation: =, <, > or \ge, \cong, \gg …
  for (let i = 0; i < r.length; i++) { const c = r[i];
    if (c === '\\') { const m = /^\\([a-zA-Z]+|[\s\S])/.exec(r.slice(i)); if (m[1] === 'left') lr++; else if (m[1] === 'right') lr--; else if (!d && !lr && RELS.includes(m[1])) return `${r.slice(0, i)}&${r.slice(i)}`; i += m[0].length - 1; continue; }
    if (c === '{') d++; else if (c === '}') d--; else if ('=<>'.includes(c) && !d && !lr) return `${r.slice(0, i)}&${r.slice(i)}`; }
  return '&' + r; };
const stack = tex => { const ss = segs(tex); return ss.length < 2 ? tex : `\\begin{aligned} ${ss.map(alignRow).join(' \\\\ ')} \\end{aligned}`; };
RV.stack = stack;
/* a drill's steps laid out for a column w px wide (LS.step reshapes what does not fit; separated formulas are stacked first) */
const fitSteps = (list, w) => LS.withCol(w, () => list.map(s => (s.tex ? LS.step(s.why, LS.texW(s.tex) <= (w || innerWidth) - 50 ? s.tex : stack(s.tex)) : { why: s.why })));
const stepsHTML = list => `<div class="stepper rv-static"><ol class="steps">${list.map(s => `<li class="done noanim"><div class="sb">${s.why ? `<div class="why">${s.why}</div>` : ''}${s.tex ? MC.tex(s.tex, true) : ''}${s.body || ''}</div></li>`).join('')}</ol></div>`;   // inside .stepper: the same formula size as the probe that LS.fit measures with

/* ---- the circuit picture of a drill: solved by the engine (every frame when the drill animates a source); a fresh canvas per build ---- */
class Pic {
  constructor(host, d, o = {}) { this.host = host; this.d = d; this.o = o; LS.watchWidth(host, () => { if (this.spec0) this.build(); }); }
  set(p) { this.p = p; this.spec0 = this.d.pic(p); this.tm = 0.7; this.build(); }
  build() {
    const host = this.host, d = this.d, cv = document.createElement('canvas'); host.innerHTML = ''; host.appendChild(cv); this.cv = cv;
    const narrow = host.clientWidth < 520, sp = narrow ? CH6.shortLabels(this.spec0, 1.2) : CH8.margins(this.spec0, 1.2);
    if (narrow) sp.parts = sp.parts.map(q => (q.type === 'J' ? { ...q, valText: '' } : q));   // a FET's two-line I_DSS/V_P label runs into the supply on a phone; the problem text states them
    const c = new CK.Circuit(sp); if (d.anim) d.anim(this.p, c, this.tm); else c.solve();
    const pts = Object.values(sp.nodes).concat(...sp.parts.map(q => q.pts || [])), xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const asp = Math.min(1.05, Math.max(0.42, (Math.max(...ys) - Math.min(...ys) + 2.4) / (Math.max(...xs) - Math.min(...xs) + 2.4) + 0.1));   // the canvas follows the circuit's own proportions (+ the band for the meter button)
    const im = Math.max(CH6.imax(c), 1e-9), r = CK.fit(cv, asp, 300);
    const v = new CK.View(cv, c, Object.assign({ speed: 95 / im, ground: false, showI: false, pad: 1.2, tips: true, acPeak: true, dotRef: im, grounds: sp.grounds }, d.view || {}, this.o.view || {}));
    v.ctx = r.ctx; v.W = r.w; v.H = r.h; v.fit({ x: 4, y: 30, w: r.w - 8, h: r.h - 34 });
    this.ckt = c; this.view = v; this.sp = sp; this.frame(0);
    LS.anim(cv, dt => { if (cv === this.cv && cv.isConnected) this.frame(dt); });
  }
  frame(dt) { const v = this.view, g = v.ctx; if (this.d.anim && dt) { this.tm += dt; this.d.anim(this.p, this.ckt, this.tm); }
    v.advance(dt); g.fillStyle = CK.PAL.bg; g.fillRect(0, 0, v.W, v.H); v.draw(); if (this.sp.box) IC.box(v, this.sp.box); }
}
RV.Pic = Pic;

/* ---- one drill card ---- */
function drillCard(host, d, no) {
  const sec = document.createElement('section'), st = MC.live().find(s => s.file === d.page);
  sec.className = 'prob rv-drill'; sec.id = 'd-' + d.id;
  sec.innerHTML = `<div class="prob-head"><span class="prob-no">${d.ch}.${no}</span><div><h2>${d.title}</h2>
      <div class="src">${t('ทบทวนจากหน้า', 'Revises page')} <a href="${d.page}">${st ? `${st.step} ${esc(MC.stopTitle(st))}` : d.page}</a></div></div></div>
    <div class="rv-bar"><button type="button" class="btn on" data-new>🎲 ${t('สุ่มตัวเลขใหม่', 'New numbers')}</button><span class="rv-cnt"></span></div>
    <div class="given"><div class="gl">${t('โจทย์', 'Problem')}</div><p class="rv-given"></p></div>
    <div class="${d.pic ? 'duo' : 'rv-one'}">${d.pic ? '<div class="card sim"><div class="rv-cv"></div><div class="simnote rv-eng"></div></div>' : ''}<div class="card solve"><div class="rv-ask"></div><div class="rv-steps"></div></div></div>`;
  host.appendChild(sec);
  const q = s => sec.querySelector(s), gEl = q('.rv-given'), askEl = q('.rv-ask'), stEl = q('.rv-steps'), eng = q('.rv-eng'), pic = d.pic ? new Pic(q('.rv-cv'), d) : null;
  let p = null, stp = null, n = 0;
  const fresh = () => { p = d.gen(); n++; q('.rv-cnt').textContent = n > 1 ? t(`ชุดที่ ${n}`, `set ${n}`) : '';
    gEl.innerHTML = d.given(p); MC.renderMath(gEl);
    LS.ask(askEl, { fields: d.fields(p).map(f => ({ label: ui.subs(f.label), ok: okOf(f), w: 6 })) });
    if (eng) eng.innerHTML = '';
    stp = LS.stepper(stEl, { steps: () => fitSteps(d.steps(p), stEl.clientWidth), answer: () => d.answer(p),
      onStep: (k, m) => { if (!eng) return; eng.innerHTML = k === m && m > 0 ? d.engine(pic.ckt, p) : ''; MC.renderMath(eng); } });
    if (pic) pic.set(p); };
  q('[data-new]').addEventListener('click', fresh);
  LS.watchWidth(stEl, () => { if (stp) stp.refresh(); }); LS.onFonts(() => { if (stp) stp.refresh(); });
  fresh();
}

/* ---- one chapter ---- */
function chapter(host, ch) {
  const C = RV.CH[ch], sec = document.createElement('section'), vis = MC.visited();
  sec.className = 'rv-ch'; sec.id = 'rv-ch' + ch; sec.dataset.ch = ch;
  sec.innerHTML = `<div class="group-head"><h2>${t('บทที่', 'Chapter')} ${ch} · ${t(C.title, C.en)}</h2></div>
    <div class="rv-pages">${pagesOf(ch).map(s => `<a class="rv-pg${vis[s.file] ? ' seen' : ''}" href="${s.file}"><b>${s.step}</b> ${esc(MC.stopTitle(s))}</a>`).join('')}</div>
    <h3 class="rv-h3">${t('สูตรที่ต้องจำ', 'Formulas to know')}</h3><div class="rv-fgrid"></div>
    <div class="rv-two"><div class="card rv-rc"><h3 class="rv-h3">${t('ขั้นตอนมาตรฐาน', 'The standard recipe')}</h3><ol class="rv-recipe">${C.recipe.map(r => `<li>${subx(t(r[0], r[1]))}</li>`).join('')}</ol></div>
      <div class="card rv-tc"><h3 class="rv-h3">${t('จุดที่มักพลาด', 'Common traps')}</h3><ul class="rv-traps">${C.traps.map(r => `<li>${subx(t(r[0], r[1]))}</li>`).join('')}</ul></div></div>
    <h3 class="rv-h3">${t('คำถามแนวคิด', 'Concept questions')}</h3><div class="rv-concepts"></div>
    <h3 class="rv-h3">${t('โจทย์ฝึก: กดสุ่มตัวเลขใหม่ได้ไม่จำกัด', 'Drills: press for new numbers as often as you like')}</h3><div class="rv-drills"></div>`;
  host.appendChild(sec);
  const grid = sec.querySelector('.rv-fgrid');
  grid.innerHTML = C.formulas.map(f => `<div class="card rv-f"><div class="rv-fx"></div><div class="rv-fn">${subx(t(f[1], f[2]))}</div></div>`).join('');
  const fit = () => [...grid.querySelectorAll('.rv-fx')].forEach((el, k) => { const tex = stack(texOf(C.formulas[k][0])); el.innerHTML = MC.tex(el.clientWidth ? LS.fitIn(el, tex) : tex, true); });
  fit(); LS.watchWidth(grid, fit); LS.onFonts(fit);
  const cq = sec.querySelector('.rv-concepts');
  (RV.CONCEPTS[ch] || []).forEach((c, k) => { const box = document.createElement('div'); box.className = 'rv-cq';
    box.innerHTML = `<div class="rv-cqq"><b>${k + 1}.</b> ${t(c.q[0], c.q[1])}</div><div class="rv-cqa"></div><div class="rv-cqw" hidden></div>`; cq.appendChild(box);
    LS.choose(box.querySelector('.rv-cqa'), { options: c.o.map(o => t(o[0], o[1])), answer: c.a,
      onPick: (i, ok) => { const w = box.querySelector('.rv-cqw'); w.hidden = !ok; if (ok) { w.innerHTML = `<b>${t('เหตุผล', 'Why')}:</b> ${t(c.why[0], c.why[1])}`; MC.renderMath(w); } } });
    MC.renderMath(box); });
  const dh = sec.querySelector('.rv-drills');
  DRILLS.filter(d => d.ch === ch).forEach((d, k) => drillCard(dh, d, k + 1));
}

/* ---- the tiles at the top: reading progress and checklist progress per chapter ---- */
function tiles(host) {
  const vis = MC.visited(), ck = store.get(CKEY, {});
  host.innerHTML = SCOPES.all.map(ch => { const ps = pagesOf(ch), nv = ps.filter(s => vis[s.file]).length, nc = ps.filter(s => ck[s.file]).length, C = RV.CH[ch];
    return `<a class="rv-tile" data-ch="${ch}" href="#rv-ch${ch}"><span class="rv-tn">${t('บทที่', 'Chapter')} ${ch}</span><b>${t(C.title, C.en)}</b>
      <span class="rv-tm">${t(`เปิดอ่านแล้ว ${nv}/${ps.length} หน้า · ทำได้ ${nc}/${ps.length} ข้อ`, `read ${nv}/${ps.length} pages · can do ${nc}/${ps.length}`)}</span>
      <span class="rv-tb"><i style="width:${Math.round(100 * nc / Math.max(ps.length, 1))}%"></i></span></a>`; }).join('');
}

/* ---- the checklist: the "you will be able to" line of every page, ticked by the student (kept in this browser only) ---- */
function checklist(host, scope) {
  const ck = store.get(CKEY, {}), chs = SCOPES[scope];
  const all = chs.flatMap(pagesOf), done = all.filter(s => ck[s.file]).length;
  host.innerHTML = `<div class="rv-ckhead"><b>${t(`ทำได้แล้ว ${done} จาก ${all.length} ข้อ`, `${done} of ${all.length} done`)}</b>
      <span class="rv-tb rv-wide"><i style="width:${Math.round(100 * done / Math.max(all.length, 1))}%"></i></span>
      <button type="button" class="btn" data-clear>${t('ล้างเครื่องหมาย', 'Clear the ticks')}</button></div>` +
    chs.map(ch => `<div class="rv-ckg"><h3 class="rv-h3">${t('บทที่', 'Chapter')} ${ch} · ${t(RV.CH[ch].title, RV.CH[ch].en)}</h3>` +
      pagesOf(ch).map(s => `<label class="rv-ck"><input type="checkbox" data-f="${s.file}"${ck[s.file] ? ' checked' : ''}><span><b>${s.step}</b> ${t('', 'I can ')}${MC.t(s.outcome, s.outcome_en)}</span><a href="${s.file}">${t('ไปหน้านี้', 'open')} →</a></label>`).join('') + '</div>').join('');
  MC.renderMath(host);
  host.querySelectorAll('input[data-f]').forEach(b => b.addEventListener('change', () => { const c = store.get(CKEY, {}); if (b.checked) c[b.dataset.f] = 1; else delete c[b.dataset.f]; store.set(CKEY, c); checklist(host, scope); tiles($('rvTiles')); }));
  host.querySelector('[data-clear]').addEventListener('click', () => { const c = store.get(CKEY, {}); all.forEach(s => delete c[s.file]); store.set(CKEY, c); checklist(host, scope); tiles($('rvTiles')); });
}

/* ---- the mock exam: numeric problems drawn from the drills (one per chapter first) and concept questions, graded together ---- */
const mock = { timer: null };
function mockExam(host, scope) {
  const chs = SCOPES[scope], nNum = 6, nCon = 4;
  const pool = shuffle(DRILLS.filter(d => chs.includes(d.ch))), pickD = [];
  shuffle(chs).forEach(ch => { const d = pool.find(x => x.ch === ch && !pickD.includes(x)); if (d && pickD.length < nNum) pickD.push(d); });
  pool.forEach(d => { if (pickD.length < nNum && !pickD.includes(d)) pickD.push(d); });
  pickD.sort((a, b) => a.ch - b.ch);
  const cons = shuffle(chs.flatMap(ch => (RV.CONCEPTS[ch] || []).map(c => ({ ch, c })))).slice(0, nCon).sort((a, b) => a.ch - b.ch);
  const items = pickD.map(d => ({ d, p: d.gen() })), t0 = Date.now();
  host.innerHTML = `<div class="rv-mbar"><button type="button" class="btn on" data-new>🎲 ${t('สร้างชุดใหม่', 'New paper')}</button><span class="rv-timer"></span></div><div class="rv-mlist"></div>
    <div class="rv-mfoot"><button type="button" class="btn on" data-grade>${t('ส่งคำตอบและตรวจทั้งชุด', 'Hand in and mark the paper')}</button><div class="rv-mscore"></div></div>`;
  const list = host.querySelector('.rv-mlist'), pics = [];
  items.forEach((it, k) => { const d = it.d, F = d.fields(it.p), sec = document.createElement('section');
    sec.className = 'prob rv-mq'; sec.dataset.sol = '0';
    sec.innerHTML = `<div class="rv-mh"><b>${t('ข้อ', 'Question')} ${k + 1}</b><span class="tag">${t('บทที่', 'Ch.')} ${d.ch} · ${d.title}</span><span class="rv-mres"></span></div>
      <div class="${d.pic ? 'rv-mduo' : ''}"><div><p class="rv-mg">${d.given(it.p)}</p><div class="rv-mins">${F.map((f, j) => `<label>${ui.subs(f.label)} <input class="mi" data-j="${j}" inputmode="decimal" autocomplete="off" style="width:6.5em"></label>`).join(' ')}</div></div>${d.pic ? '<div class="card sim rv-mcv"></div>' : ''}</div>
      <details class="rv-msol" hidden><summary>${t('ดูเฉลยทีละขั้น', 'Show the worked solution')}</summary><div class="rv-msteps"></div><div class="answer"></div>
        <p class="rv-mmore"><a href="#d-${d.id}">${t('ฝึกโจทย์แบบนี้เพิ่ม', 'Practise more of these')} →</a></p></details>`;
    list.appendChild(sec); it.sec = sec; it.F = F;
    if (d.pic) { const pc = new Pic(sec.querySelector('.rv-mcv'), d, { view: { dots: false, tips: false } }); pc.set(it.p); pics.push(pc); it.pic = pc; } });
  cons.forEach((x, k) => { const c = x.c, sec = document.createElement('section'), nm = 'rvm' + k + '_' + t0;
    sec.className = 'prob rv-mq'; sec.innerHTML = `<div class="rv-mh"><b>${t('ข้อ', 'Question')} ${items.length + k + 1}</b><span class="tag">${t('บทที่', 'Ch.')} ${x.ch} · ${t('แนวคิด', 'concept')}</span><span class="rv-mres"></span></div>
      <p class="rv-mg">${t(c.q[0], c.q[1])}</p><div class="rv-mopts">${c.o.map((o, j) => `<label><input type="radio" name="${nm}" value="${j}"> ${'abcd'[j]}) ${t(o[0], o[1])}</label>`).join('')}</div><div class="rv-cqw" hidden></div>`;
    list.appendChild(sec); x.sec = sec; });
  MC.renderMath(list);
  clearInterval(mock.timer); const tick = () => { const s = Math.floor((Date.now() - t0) / 1000), el = host.querySelector('.rv-timer'); if (el) el.textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  tick(); mock.timer = setInterval(tick, 1000);
  host.querySelector('[data-new]').addEventListener('click', () => mockExam(host, scope));
  host.querySelector('[data-grade]').addEventListener('click', () => {
    clearInterval(mock.timer); let right = 0; const weak = new Set();
    items.forEach(it => { const ins = [...it.sec.querySelectorAll('input.mi')]; let ok = true;
      ins.forEach((inp, j) => { const x = parseFloat(inp.value.replace(/−/g, '-').replace(',', '.')), g = okOf(it.F[j])(x); inp.classList.toggle('ok', g); inp.classList.toggle('no', !g); if (!g) ok = false; });
      if (ok) right++; else weak.add(it.d.ch);
      it.sec.querySelector('.rv-mres').innerHTML = ok ? '<span class="pill good">✓</span>' : '<span class="pill bad">✗</span>';
      const sol = it.sec.querySelector('.rv-msol'); sol.hidden = false; it.sec.dataset.sol = '1';
      const w = Math.max(260, it.sec.clientWidth - 26); sol.querySelector('.rv-msteps').innerHTML = stepsHTML(fitSteps(it.d.steps(it.p), w)); sol.querySelector('.answer').innerHTML = it.d.answer(it.p); MC.renderMath(sol);
      if (it.pic) { it.pic.o.view = { dots: false, tips: true }; it.pic.build(); } });
    cons.forEach(x => { const sel = x.sec.querySelector('input:checked'), ok = !!sel && +sel.value === x.c.a; if (ok) right++; else weak.add(x.ch);
      x.sec.querySelector('.rv-mres').innerHTML = ok ? '<span class="pill good">✓</span>' : `<span class="pill bad">✗</span> ${t('คำตอบ', 'answer')} ${'abcd'[x.c.a]})`;
      const w = x.sec.querySelector('.rv-cqw'); w.hidden = false; w.innerHTML = `<b>${t('เหตุผล', 'Why')}:</b> ${t(x.c.why[0], x.c.why[1])}`; MC.renderMath(w); });
    const total = items.length + cons.length, s = Math.floor((Date.now() - t0) / 1000);
    host.querySelector('.rv-mscore').innerHTML = `<b>${t(`ได้ ${right} จาก ${total} ข้อ`, `${right} of ${total} right`)}</b> · ${t('ใช้เวลา', 'time')} ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` +
      (weak.size ? ` · ${t('ควรทบทวน', 'revise')}: ${[...weak].sort().map(ch => `<a href="#rv-ch${ch}">${t('บทที่', 'chapter')} ${ch}</a>`).join(', ')}` : ` · ${t('ครบทุกข้อ ยอดเยี่ยม', 'all correct, well done')}`);
  });
}

/* ---- the scope switch ---- */
function applyScope(scope) {
  store.set(SKEY, scope); const chs = SCOPES[scope];
  document.querySelectorAll('.rv-ch').forEach(s => { s.hidden = !chs.includes(+s.dataset.ch); });
  document.querySelectorAll('.rv-tile').forEach(a => a.classList.toggle('off', !chs.includes(+a.dataset.ch)));
  document.querySelectorAll('.toc a[data-ch]').forEach(a => { a.hidden = !chs.includes(+a.dataset.ch); });
  mockExam($('rvMock'), scope); checklist($('rvCheck'), scope);
}
RV.init = async () => {
  /* KaTeX's fonts load only when first used, and nothing above the fold uses them here: load them before any formula is measured,
     or the column fitting (LS.texW, cached per formula) works with the fallback font and every long formula overflows by a quarter */
  if (document.fonts && document.fonts.load) { try { await Promise.race([Promise.all(['1em KaTeX_Main', 'bold 1em KaTeX_Main', 'italic 1em KaTeX_Main', 'italic 1em KaTeX_Math', '1em KaTeX_AMS', '1em KaTeX_Size1', '1em KaTeX_Size2', '1em KaTeX_Size3', '1em KaTeX_Size4'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 4000))]); } catch (e) {} }
  let scope = store.get(SKEY, 'all'); if (!SCOPES[scope]) scope = 'all';
  const r = ui.radio($('rvScope'), [{ id: 'all', label: t('ทุกบท', 'All chapters'), on: scope === 'all' }, { id: 'mid', label: t('สอบกลางภาค: บทที่ 1–6', 'Midterm: chapters 1–6'), on: scope === 'mid' }, { id: 'fin', label: t('สอบปลายภาค: บทที่ 7–8', 'Final: chapters 7–8'), on: scope === 'fin' }], id => applyScope(id));
  void r; tiles($('rvTiles'));
  SCOPES.all.forEach(ch => chapter($('rvChapters'), ch));
  applyScope(scope);
};
RV.SCOPES = SCOPES;
global.RV = RV;
})(window);
