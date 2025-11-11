export function jaccard(a = [], b = []) {
  const A = new Set(a.map((x) => x.toLowerCase()));
  const B = new Set(b.map((x) => x.toLowerCase()));
  const inter = [...A].filter((x) => B.has(x)).length;
  const uni = new Set([...A, ...B]).size || 1;
  return inter / uni;
}
export function numSim(a, b, min = 1, max = 5) {
  if (a == null || b == null) return 0;
  return 1 - Math.min(1, Math.abs(a - b) / (max - min));
}
export function budgetOverlap(pu, pv) {
  const lo = Math.max(pu.budgetMin || 0, pv.budgetMin || 0);
  const hi = Math.min(pu.budgetMax || 0, pv.budgetMax || 0);
  return Math.max(0, hi - lo);
}
export function budgetSim(pu, pv) {
  const overlap = budgetOverlap(pu, pv);
  const span = Math.max(
    (pu.budgetMax || 0) - (pu.budgetMin || 0),
    (pv.budgetMax || 0) - (pv.budgetMin || 0),
    1
  );
  return Math.min(1, overlap / span);
}
export function scorePair(myProfile, myPref, otherProfile, otherPref) {
  // optional hard filters
  if ((myPref.roommateGenderPreference || "any") !== "any" &&
      myPref.roommateGenderPreference !== (otherProfile.gender || "other")) return null;
  if ((otherPref.roommateGenderPreference || "any") !== "any" &&
      otherPref.roommateGenderPreference !== (myProfile.gender || "other")) return null;
  if (budgetOverlap(myPref, otherPref) <= 0) return null;

  const W = { budget: 3, clean: 2, noise: 2, sleep: 1, smoke: 2, drink: 1, guests: 1, study: 1, lang: 1 };
  const totalW = Object.values(W).reduce((a, b) => a + b, 0);
  const sim =
    W.budget * budgetSim(myPref, otherPref) +
    W.clean * numSim(myPref.cleanliness, otherPref.cleanliness) +
    W.noise * numSim(myPref.noiseTolerance, otherPref.noiseTolerance) +
    W.sleep * (myPref.sleepSchedule === otherPref.sleepSchedule ? 1 : 0.5) +
    W.smoke * (myPref.smoker === otherPref.smoker ? 1 : 0) +
    W.drink * (myPref.drinker === otherPref.drinker ? 1 : 0) +
    W.guests * numSim(myPref.guestsTolerance, otherPref.guestsTolerance) +
    W.study * (myPref.studyHabits === otherPref.studyHabits ? 1 : 0.5) +
    W.lang * jaccard(myProfile.languages || [], otherProfile.languages || []);
  const reasons = [];
  if (budgetSim(myPref, otherPref) > 0.7) reasons.push("Strong budget overlap");
  if (myPref.cleanliness === otherPref.cleanliness) reasons.push("Same cleanliness");
  if (myPref.sleepSchedule === otherPref.sleepSchedule) reasons.push("Similar sleep schedule");
  if (myPref.smoker === otherPref.smoker) reasons.push("Smoking preference matched");
  if (jaccard(myProfile.languages || [], otherProfile.languages || []) > 0) reasons.push("Common language(s)");

  return { score: sim / totalW, reasons };
}