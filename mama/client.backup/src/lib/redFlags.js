// Non-diagnostic screening rules. Identical copy lives in client/src/lib/redFlags.js so warnings also work offline.
// Edit ONE file, then: cp server/src/utils/redFlags.js client/src/lib/redFlags.js
// Thresholds follow commonly used danger-sign guidance (e.g. BP 140/90 and 160/110, fever 38 C) but must be
// reviewed by a qualified clinician before any real-world use.

export const SYMPTOMS = [
  'headache_severe', 'vision_changes', 'swelling', 'abdominal_pain', 'bleeding_light', 'bleeding_heavy',
  'fluid_leak', 'reduced_movement', 'fever', 'chest_pain', 'breathless', 'calf_pain', 'foul_discharge',
  'vomiting_severe', 'dizziness', 'convulsion', 'wound_issue', 'breast_pain', 'fatigue', 'self_harm_thoughts',
];
// Shown as tap-chips. The self-harm item is detected from notes and the Phase 7 mood check, not offered as a chip.
export const CHIP_SYMPTOMS = SYMPTOMS.filter((s) => s !== 'self_harm_thoughts');

const RANK = { none: 0, watch: 1, urgent: 2, emergency: 3 };
export const highestLevel = (flags) => flags.reduce((m, f) => (RANK[f.level] > RANK[m] ? f.level : m), 'none');

export function evaluate({ stage = 'pregnant', week = null, vitals = {}, symptoms = [], mood = null }) {
  const found = new Map();
  const add = (code, level) => {
    const cur = found.get(code);
    if (!cur || RANK[level] > RANK[cur]) found.set(code, level);
  };
  const has = (c) => symptoms.includes(c);
  const pregnant = stage === 'pregnant';
  const { systolic: s, diastolic: d, tempC, kicks } = vitals;

  const severeBp = s >= 160 || d >= 110;
  const highBp = s >= 140 || d >= 90;
  const fever = tempC >= 38 || has('fever');

  if (has('convulsion')) add('convulsion', 'emergency');
  if (has('self_harm_thoughts')) add('self_harm_thoughts', 'emergency');
  if (has('chest_pain') || has('breathless')) add('chest_breath', 'emergency');

  if (severeBp) add('bp_severe', 'emergency');
  else if (highBp) add('bp_high', 'urgent');
  if (highBp && (has('headache_severe') || has('vision_changes') || has('swelling') || has('abdominal_pain')))
    add('preeclampsia_signs', 'emergency');

  if (has('headache_severe')) add('headache_severe', 'urgent');
  if (has('vision_changes')) add('vision_changes', 'urgent');
  if (has('abdominal_pain')) add('abdominal_pain', 'urgent');

  if (has('bleeding_heavy')) add('bleeding_heavy', 'emergency');
  if (has('bleeding_light')) add(pregnant ? 'bleeding_light' : 'bleeding_pp', pregnant ? 'urgent' : 'watch');

  if (has('fluid_leak')) add('fluid_leak', 'urgent');
  if (pregnant && week >= 24 && has('reduced_movement')) add('reduced_movement', 'urgent');
  // Kick count convention: fewer than 10 movements in 2 hours from week 28.
  if (pregnant && week >= 28 && Number.isFinite(kicks) && kicks < 10) add('reduced_movement', 'urgent');

  if (fever) add('fever', 'urgent');
  if (has('calf_pain')) add('calf_pain', 'urgent');
  if (has('foul_discharge')) add('foul_discharge', 'urgent');
  if (has('wound_issue')) add(fever ? 'infection_signs' : 'wound_issue', fever ? 'urgent' : 'watch');

  if (has('swelling')) add(pregnant && week >= 20 ? 'swelling_sudden' : 'swelling', pregnant && week >= 20 ? 'urgent' : 'watch');
  if (has('vomiting_severe')) add('vomiting_severe', 'watch');
  if (has('dizziness')) add('dizziness', 'watch');
  if (mood != null && mood <= 2) add('low_mood', 'watch');

  return [...found].map(([code, level]) => ({ code, level })).sort((a, b) => RANK[b.level] - RANK[a.level]);
}
