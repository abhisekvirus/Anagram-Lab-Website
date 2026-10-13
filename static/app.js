const $ = (id) => document.getElementById(id);
const examples = [
  ["listen", "silent"], ["triangle", "integral"], ["earth", "heart"],
  ["night", "thing"], ["school master", "the classroom"],
  ["astronomer", "moon starer"], ["dusty", "study"], ["apple", "apply"]
];
let round = 0, score = 0, played = 0, current = null, hintLevel = 0, answered = false;
let asked = new Set();

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2300);
}
function normalize(s) {
  return s.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
function isAnagram(a, b) {
  const x = normalize(a), y = normalize(b);
  if (!x || !y) return false;
  if (x.length !== y.length) return false;
  const count = new Map();
  for (const ch of x) count.set(ch, (count.get(ch) || 0) + 1);
  for (const ch of y) {
    if (!count.has(ch)) return false;
    count.set(ch, count.get(ch) - 1);
    if (count.get(ch) < 0) return false;
  }
  return [...count.values()].every(n => n === 0);
}
function freq(s) {
  const c = {};
  for (const ch of normalize(s)) c[ch] = (c[ch] || 0) + 1;
  return c;
}
function chips(obj) {
  const entries = Object.entries(obj);
  return entries.length ? entries.map(([k,v]) => `<span class="freq-chip">${escapeHtml(k)} × ${v}</span>`).join("") : '<span class="freq-chip">None</span>';
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function analyze() {
  const a = $("firstInput").value.trim(), b = $("secondInput").value.trim();
  if (!normalize(a) || !normalize(b)) { toast("Enter two strings with letters or numbers first."); return; }
  const same = isAnagram(a,b), fa = freq(a), fb = freq(b);
  const box = $("checkResult");
  box.className = "result-box " + (same ? "success" : "failure");
  box.innerHTML = `<div class="result-icon">${same ? "✓" : "✕"}</div><div><strong>${same ? "Yes — these are anagrams!" : "Not anagrams this time."}</strong><p>${same ? "Every character appears the same number of times." : "At least one character count is different."}</p></div>`;
  $("frequencyArea").classList.remove("hidden");
  $("frequencyArea").innerHTML = `<h4>Character frequency breakdown</h4><p>First string</p><div class="freq-row">${chips(fa)}</div><p>Second string</p><div class="freq-row">${chips(fb)}</div><p style="color:var(--muted)">Normalization ignores case, spaces, and punctuation.</p>`;
}
$("checkBtn").addEventListener("click", analyze);
$("firstInput").addEventListener("keydown", e => { if(e.key==="Enter") $("secondInput").focus(); });
$("secondInput").addEventListener("keydown", e => { if(e.key==="Enter") analyze(); });
$("exampleBtn").addEventListener("click", () => {
  const [a,b] = examples[Math.floor(Math.random()*examples.length)];
  $("firstInput").value=a; $("secondInput").value=b; analyze();
});
$("clearBtn").addEventListener("click", () => {
  $("firstInput").value=""; $("secondInput").value="";
  $("checkResult").className="result-box empty";
  $("checkResult").innerHTML='<div class="result-icon">✳</div><div><strong>Your result will appear here</strong><p>Enter two strings and analyze their character patterns.</p></div>';
  $("frequencyArea").classList.add("hidden"); $("firstInput").focus();
});
$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  $("themeBtn").textContent = isDark ? "☾" : "☼";
  localStorage.setItem("anagram-theme", isDark ? "dark" : "light");
});
if (localStorage.getItem("anagram-theme")==="dark") { document.body.classList.add("dark"); $("themeBtn").textContent="☾"; }

function shuffle(s) {
  const chars = [...normalize(s)];
  for(let i=chars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[chars[i],chars[j]]=[chars[j],chars[i]];}
  return chars.join("");
}
function createQuestion() {
  const level = $("difficulty").value;
  const pool = examples.filter(([a]) => level==="easy" ? normalize(a).length <= 6 : level==="medium" ? normalize(a).length > 4 : normalize(a).length >= 7);
  const [seed, paired] = (pool.length ? pool : examples)[Math.floor(Math.random()*(pool.length ? pool : examples).length)];
  const positive = Math.random() < 0.5;
  let first = seed, second;
  if (positive) {
    second = shuffle(seed);
    if (second === normalize(seed)) second = paired;
    // If paired is not a genuine anagram (e.g. a seeded negative pair), use a shuffled exact string.
    if (!isAnagram(seed, second)) second = shuffle(seed);
  } else {
    second = shuffle(seed) + "x";
  }
  const key = `${normalize(first)}|${normalize(second)}|${positive}`;
  if (asked.has(key) && asked.size < 1000) return createQuestion();
  asked.add(key);
  current = {first, second, answer:isAnagram(first,second)};
  answered = false; hintLevel = 0;
  $("wordOne").textContent = first;
  $("wordTwo").textContent = second;
  $("roundCount").textContent = `ROUND ${String(++round).padStart(2,"0")}`;
  $("roundTag").textContent = level==="easy" ? "WARM UP" : level==="medium" ? "LEVEL UP" : "BRAIN BENDER";
  $("practiceFeedback").textContent = "Choose an answer to lock in your guess.";
  $("practiceFeedback").style.color = "var(--muted)";
  $("hintBox").classList.add("hidden"); $("hintBox").textContent="";
  $("hintCount").textContent="0/3";
  $("yesBtn").disabled=false; $("noBtn").disabled=false;
}
function answer(value) {
  if (!current) { toast("Start a new round first."); return; }
  if (answered) { toast("This round is already scored. Try the next one!"); return; }
  answered = true; played++;
  const correct = value === current.answer;
  if (correct) score += hintLevel ? 7 : 10;
  $("practiceFeedback").textContent = correct
    ? `Correct! ${hintLevel ? "7" : "10"} points ${hintLevel ? "with hints" : "— clean solve"} ✨`
    : `Not quite. The answer is ${current.answer ? "YES" : "NO"}. Compare the character counts.`;
  $("practiceFeedback").style.color = correct ? "var(--mint-ink)" : "#e25b72";
  $("yesBtn").disabled=true; $("noBtn").disabled=true;
  updateStats();
}
$("yesBtn").addEventListener("click", () => answer(true));
$("noBtn").addEventListener("click", () => answer(false));
$("nextBtn").addEventListener("click", createQuestion);
$("difficulty").addEventListener("change", createQuestion);
$("hintBtn").addEventListener("click", async () => {
  if (!current) { toast("Start a new round first."); return; }
  if (hintLevel >= 3) { toast("You've used all three hints."); return; }
  hintLevel++;
  let hint;
  if (hintLevel===1) hint="Hint 1 · Ignore letter order. Compare the characters themselves.";
  else if (hintLevel===2) hint=`Hint 2 · Normalized lengths: ${normalize(current.first).length} and ${normalize(current.second).length}.`;
  else hint=`Hint 3 · ${current.answer ? "The character frequencies match." : "At least one character frequency differs."}`;
  $("hintBox").textContent=hint; $("hintBox").classList.remove("hidden");
  $("hintCount").textContent=`${hintLevel}/3`;
});
function updateStats() {
  $("scoreStat").textContent=score;
  $("playedStat").textContent=played;
  const accuracy = played ? Math.round((scoreCorrect/played)*100) : null;
  // Score includes hint-adjusted points, so accuracy is tracked separately below.
  $("accuracyStat").textContent=played ? `${Math.round((correctAnswers/played)*100)}%` : "—";
  const pct = played ? Math.round((correctAnswers/played)*100) : 0;
  $("progressText").textContent=`${pct}%`;
  $("progressBar").style.width=`${pct}%`;
}
let correctAnswers=0, scoreCorrect=0;
const originalAnswer = answer;
answer = function(value) {
  if (!current) { toast("Start a new round first."); return; }
  if (answered) { toast("This round is already scored. Try the next one!"); return; }
  const isCorrect = value === current.answer;
  if (isCorrect) { correctAnswers++; scoreCorrect++; }
  originalAnswer(value);
};
$("resetStatsBtn").addEventListener("click", () => {
  if (!confirm("Reset your score and session statistics?")) return;
  score=0; played=0; correctAnswers=0; scoreCorrect=0; round=0; asked.clear();
  updateStats(); createQuestion(); toast("Session stats reset.");
});
createQuestion();
