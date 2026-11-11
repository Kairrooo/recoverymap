// RecoveryMap: muscles, exercise library, search and rest times

var MUSCLES = {
  upperChest: { n: "Upper chest", h: 60 },
  chest: { n: "Mid/lower chest", h: 60 },
  neck: { n: "Neck", h: 24 },
  serratus: { n: "Serratus", h: 30 },
  frontDelt: { n: "Front delts", h: 48 },
  sideDelt: { n: "Side delts", h: 36 },
  rearDelt: { n: "Rear delts", h: 36 },
  traps: { n: "Traps", h: 48 },
  biceps: { n: "Biceps", h: 48 },
  triceps: { n: "Triceps", h: 48 },
  forearms: { n: "Forearms", h: 24 },
  abs: { n: "Abs", h: 24 },
  obliques: { n: "Obliques", h: 24 },
  lats: { n: "Lats", h: 60 },
  upperBack: { n: "Upper back", h: 60 },
  lowerBack: { n: "Lower back", h: 72 },
  glutes: { n: "Glutes", h: 72 },
  quads: { n: "Quads", h: 72 },
  hamstrings: { n: "Hamstrings", h: 72 },
  adductors: { n: "Adductors", h: 60 },
  calves: { n: "Calves", h: 24 },
  tibialis: { n: "Shins (tibialis)", h: 24 },
};
var INT = { light: 0.75, normal: 1, hard: 1.25 };
var SECONDARY = 0.5;

// Exercise library: [name, group, primary, secondary, search aliases]
var EX = [
  ["Barbell bench press", "Chest", ["chest"], ["upperChest", "frontDelt", "triceps"], "bench flat"],
  [
    "Dumbbell bench press",
    "Chest",
    ["chest"],
    ["upperChest", "frontDelt", "triceps"],
    "db bench flat",
  ],
  [
    "Incline barbell bench press",
    "Chest",
    ["upperChest", "frontDelt"],
    ["chest", "triceps"],
    "incline bench",
  ],
  [
    "Incline dumbbell press",
    "Chest",
    ["upperChest", "frontDelt"],
    ["chest", "triceps"],
    "incline db",
  ],
  ["Decline bench press", "Chest", ["chest"], ["triceps"], ""],
  [
    "Smith machine bench press",
    "Chest",
    ["chest"],
    ["upperChest", "frontDelt", "triceps"],
    "smith",
  ],
  ["Chest press machine", "Chest", ["chest"], ["upperChest", "frontDelt", "triceps"], ""],
  [
    "Push-up",
    "Chest",
    ["chest"],
    ["upperChest", "triceps", "frontDelt", "serratus"],
    "pushup press up",
  ],
  ["Chest dips", "Chest", ["chest", "triceps"], ["frontDelt"], "dip"],
  ["Dumbbell fly", "Chest", ["chest"], ["frontDelt"], "flye db"],
  ["Cable fly", "Chest", ["chest"], ["upperChest", "frontDelt"], "crossover flye"],
  [
    "Low-to-high cable fly",
    "Chest",
    ["upperChest"],
    ["frontDelt"],
    "incline crossover upper chest",
  ],
  ["Incline dumbbell fly", "Chest", ["upperChest"], ["frontDelt"], "incline flye"],
  [
    "Incline smith press",
    "Chest",
    ["upperChest", "frontDelt"],
    ["chest", "triceps"],
    "smith incline",
  ],
  ["Pec deck", "Chest", ["chest"], ["frontDelt"], "butterfly machine fly"],
  [
    "Single-arm dumbbell bench press",
    "Chest",
    ["chest"],
    ["triceps", "frontDelt", "obliques"],
    "one arm unilateral db",
  ],
  ["Single-arm cable fly", "Chest", ["chest"], ["frontDelt"], "one arm unilateral crossover"],
  [
    "Single-arm landmine press",
    "Chest",
    ["upperChest", "frontDelt"],
    ["triceps", "serratus", "obliques"],
    "one arm landmine",
  ],
  [
    "Overhead press",
    "Shoulders",
    ["frontDelt", "sideDelt"],
    ["triceps", "traps"],
    "ohp military barbell",
  ],
  ["Seated dumbbell shoulder press", "Shoulders", ["frontDelt", "sideDelt"], ["triceps"], "db ohp"],
  ["Shoulder press machine", "Shoulders", ["frontDelt", "sideDelt"], ["triceps"], ""],
  ["Arnold press", "Shoulders", ["frontDelt", "sideDelt"], ["triceps"], ""],
  [
    "Single-arm dumbbell shoulder press",
    "Shoulders",
    ["frontDelt", "sideDelt"],
    ["triceps", "obliques"],
    "one arm unilateral ohp",
  ],
  ["Push press", "Shoulders", ["frontDelt", "sideDelt"], ["triceps", "traps", "quads"], ""],
  ["Dumbbell lateral raise", "Shoulders", ["sideDelt"], [], "side raise laterals db"],
  ["Cable lateral raise", "Shoulders", ["sideDelt"], [], "side raise laterals"],
  ["Machine lateral raise", "Shoulders", ["sideDelt"], [], "side raise"],
  ["Front raise", "Shoulders", ["frontDelt"], [], ""],
  ["Rear delt fly", "Shoulders", ["rearDelt"], ["upperBack"], "reverse fly"],
  ["Reverse pec deck", "Shoulders", ["rearDelt"], ["upperBack"], "rear delt machine"],
  ["Face pull", "Shoulders", ["rearDelt"], ["traps", "upperBack"], ""],
  ["Upright row", "Shoulders", ["sideDelt", "traps"], ["biceps"], ""],
  ["Pull-up", "Back", ["lats"], ["biceps", "upperBack", "rearDelt"], "pullup"],
  ["Chin-up", "Back", ["lats", "biceps"], ["upperBack"], "chinup"],
  ["Lat pulldown", "Back", ["lats"], ["biceps", "upperBack"], "pulldown"],
  ["Close-grip lat pulldown", "Back", ["lats"], ["biceps", "upperBack"], "v bar pulldown"],
  ["Straight-arm pulldown", "Back", ["lats"], [], "pushdown lat"],
  [
    "Barbell row",
    "Back",
    ["upperBack", "lats"],
    ["biceps", "rearDelt", "lowerBack"],
    "bent over row bb",
  ],
  ["Pendlay row", "Back", ["upperBack", "lats"], ["biceps", "rearDelt", "lowerBack"], ""],
  ["Dumbbell row", "Back", ["lats", "upperBack"], ["biceps", "rearDelt"], "one arm db row"],
  [
    "Seated cable row",
    "Back",
    ["upperBack", "lats"],
    ["biceps", "rearDelt"],
    "low row v handle close grip",
  ],
  [
    "Seated cable row (wide grip)",
    "Back",
    ["upperBack", "rearDelt"],
    ["lats", "biceps"],
    "low row wide bar",
  ],
  ["T-bar row", "Back", ["upperBack", "lats"], ["biceps", "rearDelt", "lowerBack"], "tbar"],
  [
    "Chest-supported row",
    "Back",
    ["upperBack"],
    ["lats", "rearDelt", "biceps"],
    "seal row incline row",
  ],
  ["Machine row", "Back", ["upperBack", "lats"], ["biceps", "rearDelt"], ""],
  ["Dumbbell pullover", "Back", ["lats"], ["chest", "serratus"], ""],
  [
    "Cable lat pullover (rope)",
    "Back",
    ["lats"],
    ["serratus", "triceps"],
    "pullover rope cable straight arm",
  ],
  [
    "Cable lat pullover (bar)",
    "Back",
    ["lats"],
    ["serratus", "triceps"],
    "pullover bar cable straight arm",
  ],
  ["Machine pullover", "Back", ["lats"], ["serratus"], "pullover machine"],
  [
    "Single-arm lat pulldown (D-handle)",
    "Back",
    ["lats"],
    ["biceps", "upperBack"],
    "one arm unilateral pulldown handle kneeling",
  ],
  ["Wide-grip lat pulldown", "Back", ["lats"], ["upperBack", "biceps"], "wide pulldown"],
  [
    "Neutral-grip lat pulldown",
    "Back",
    ["lats"],
    ["biceps", "upperBack"],
    "neutral parallel pulldown",
  ],
  ["Assisted pull-up machine", "Back", ["lats"], ["biceps", "upperBack"], "assisted pullup"],
  [
    "Single-arm cable row",
    "Back",
    ["lats", "upperBack"],
    ["biceps", "rearDelt"],
    "one arm unilateral row",
  ],
  [
    "Single-arm machine row",
    "Back",
    ["lats", "upperBack"],
    ["biceps", "rearDelt"],
    "one arm unilateral hammer strength row",
  ],
  [
    "Meadows row",
    "Back",
    ["lats", "upperBack"],
    ["biceps", "rearDelt", "forearms"],
    "landmine one arm row",
  ],
  [
    "Kroc row",
    "Back",
    ["lats", "upperBack"],
    ["biceps", "forearms", "traps"],
    "heavy dumbbell row one arm",
  ],
  [
    "Inverted row",
    "Back",
    ["upperBack", "lats"],
    ["biceps", "rearDelt"],
    "bodyweight row australian",
  ],
  [
    "Deadlift",
    "Back",
    ["hamstrings", "glutes", "lowerBack"],
    ["traps", "forearms", "quads", "upperBack"],
    "conventional",
  ],
  ["Rack pull", "Back", ["lowerBack", "traps", "upperBack"], ["glutes", "forearms"], ""],
  ["Back extension", "Back", ["lowerBack"], ["glutes", "hamstrings"], "hyperextension hyper"],
  ["Good morning", "Back", ["lowerBack", "hamstrings"], ["glutes"], ""],
  ["Barbell shrug", "Back", ["traps"], ["forearms", "neck"], "traps"],
  ["Neck curl", "Back", ["neck"], [], "neck flexion"],
  ["Neck extension", "Back", ["neck"], ["traps"], "neck harness"],
  ["Dumbbell shrug", "Back", ["traps"], ["forearms"], "traps"],
  ["Barbell curl", "Arms", ["biceps"], ["forearms"], "bicep"],
  ["Dumbbell curl", "Arms", ["biceps"], ["forearms"], "bicep db"],
  ["EZ-bar curl", "Arms", ["biceps"], ["forearms"], "bicep ez"],
  ["Hammer curl", "Arms", ["biceps", "forearms"], [], ""],
  ["Preacher curl", "Arms", ["biceps"], [], "bicep"],
  ["Incline dumbbell curl", "Arms", ["biceps"], [], "bicep"],
  ["Cable curl (straight bar)", "Arms", ["biceps"], ["forearms"], "bicep bar cable"],
  ["Cable curl (EZ bar)", "Arms", ["biceps"], ["forearms"], "bicep ez cable"],
  ["Rope hammer curl", "Arms", ["biceps", "forearms"], [], "rope cable hammer"],
  ["Concentration curl", "Arms", ["biceps"], [], "bicep"],
  ["Single-arm cable curl", "Arms", ["biceps"], ["forearms"], "one arm unilateral bicep"],
  ["Zottman curl", "Arms", ["biceps", "forearms"], [], "bicep forearm"],
  ["Tricep pushdown (rope)", "Arms", ["triceps"], [], "rope pushdown triceps cable"],
  ["Tricep pushdown (straight bar)", "Arms", ["triceps"], [], "bar pushdown triceps cable"],
  ["Tricep pushdown (V-bar)", "Arms", ["triceps"], [], "v bar vbar pushdown triceps cable"],
  [
    "Reverse-grip tricep pushdown",
    "Arms",
    ["triceps"],
    ["forearms"],
    "underhand supinated pushdown triceps cable",
  ],
  ["Overhead tricep extension", "Arms", ["triceps"], [], "triceps french press dumbbell"],
  [
    "Overhead cable tricep extension (rope)",
    "Arms",
    ["triceps"],
    [],
    "rope overhead triceps cable",
  ],
  ["Skull crusher", "Arms", ["triceps"], [], "triceps lying extension"],
  ["Close-grip bench press", "Arms", ["triceps"], ["chest", "frontDelt"], "triceps cgbp"],
  ["Tricep dips", "Arms", ["triceps"], ["chest", "frontDelt"], "dip bench dip"],
  ["Tricep kickback", "Arms", ["triceps"], [], ""],
  ["JM press", "Arms", ["triceps"], ["chest"], ""],
  ["Single-arm tricep pushdown", "Arms", ["triceps"], [], "one arm unilateral triceps"],
  ["Single-arm overhead dumbbell extension", "Arms", ["triceps"], [], "one arm unilateral triceps"],
  ["Wrist curl", "Forearms", ["forearms"], [], "forearm wrist flexion barbell"],
  ["Dumbbell wrist curl", "Forearms", ["forearms"], [], "forearm one arm wrist"],
  ["Behind-the-back wrist curl", "Forearms", ["forearms"], [], "forearm wrist"],
  ["Reverse wrist curl", "Forearms", ["forearms"], [], "forearm wrist extension"],
  ["Cable wrist curl", "Forearms", ["forearms"], [], "forearm wrist"],
  ["Reverse curl", "Forearms", ["forearms"], ["biceps"], "forearm overhand curl"],
  ["Wrist roller", "Forearms", ["forearms"], [], "forearm roller"],
  ["Plate pinch", "Forearms", ["forearms"], [], "grip pinch"],
  ["Hand gripper", "Forearms", ["forearms"], [], "grip"],
  ["Farmer's walk", "Forearms", ["forearms", "traps"], ["abs"], "farmers carry grip"],
  ["Suitcase carry", "Forearms", ["forearms", "obliques"], ["traps"], "one arm carry grip"],
  ["Dead hang", "Forearms", ["forearms"], ["lats"], "grip hang"],
  ["Back squat", "Legs", ["quads", "glutes"], ["adductors", "lowerBack"], "squat barbell"],
  ["Front squat", "Legs", ["quads"], ["glutes", "abs"], "squat"],
  ["Hack squat", "Legs", ["quads"], ["glutes"], "squat machine"],
  ["Smith machine squat", "Legs", ["quads", "glutes"], ["adductors"], "squat"],
  ["Goblet squat", "Legs", ["quads", "glutes"], ["adductors"], "squat"],
  ["Leg press", "Legs", ["quads", "glutes"], ["adductors"], ""],
  ["Bulgarian split squat", "Legs", ["quads", "glutes"], ["adductors", "hamstrings"], "bss"],
  ["Walking lunge", "Legs", ["quads", "glutes"], ["adductors", "hamstrings"], "lunges"],
  ["Reverse lunge", "Legs", ["quads", "glutes"], ["adductors", "hamstrings"], "lunges"],
  ["Step-up", "Legs", ["quads", "glutes"], ["hamstrings"], "step up"],
  ["Leg extension", "Legs", ["quads"], [], ""],
  ["Single-leg leg extension", "Legs", ["quads"], [], "one leg unilateral"],
  ["Single-leg leg press", "Legs", ["quads", "glutes"], ["adductors"], "one leg unilateral"],
  ["Romanian deadlift", "Legs", ["hamstrings", "glutes"], ["lowerBack", "forearms"], "rdl"],
  ["Stiff-leg deadlift", "Legs", ["hamstrings", "glutes"], ["lowerBack"], "sldl"],
  [
    "Single-leg Romanian deadlift",
    "Legs",
    ["hamstrings", "glutes"],
    ["lowerBack", "adductors"],
    "one leg unilateral rdl",
  ],
  [
    "Sumo deadlift",
    "Legs",
    ["glutes", "quads", "adductors", "hamstrings"],
    ["lowerBack", "traps", "forearms"],
    "",
  ],
  ["Lying leg curl", "Legs", ["hamstrings"], ["calves"], "hamstring curl"],
  ["Seated leg curl", "Legs", ["hamstrings"], ["calves"], "hamstring curl"],
  ["Single-leg leg curl", "Legs", ["hamstrings"], ["calves"], "one leg unilateral hamstring curl"],
  ["Nordic curl", "Legs", ["hamstrings"], [], "nordics"],
  ["Hip thrust", "Legs", ["glutes"], ["hamstrings"], "barbell glute"],
  ["Glute bridge", "Legs", ["glutes"], ["hamstrings"], ""],
  ["Cable glute kickback", "Legs", ["glutes"], ["hamstrings"], ""],
  ["Kettlebell swing", "Legs", ["glutes", "hamstrings"], ["lowerBack", "frontDelt"], "kb"],
  ["Hip abduction machine", "Legs", ["glutes"], [], "abductor"],
  ["Hip adduction machine", "Legs", ["adductors"], [], "adductor inner thigh"],
  ["Copenhagen plank", "Legs", ["adductors"], ["obliques"], ""],
  ["Standing calf raise", "Legs", ["calves"], [], "calves"],
  ["Seated calf raise", "Legs", ["calves"], [], "calves"],
  ["Leg press calf raise", "Legs", ["calves"], [], "calves"],
  ["Single-leg calf raise", "Legs", ["calves"], [], "one leg unilateral calves"],
  ["Tibialis raise", "Legs", ["tibialis"], [], "tib raise shin"],
  ["Crunch", "Core", ["abs"], [], "abs"],
  ["Cable crunch", "Core", ["abs"], [], "abs"],
  ["Sit-up", "Core", ["abs"], [], "situp abs"],
  ["Decline sit-up", "Core", ["abs"], [], "abs"],
  ["Hanging leg raise", "Core", ["abs"], ["obliques", "forearms"], "abs"],
  ["Lying leg raise", "Core", ["abs"], [], "abs"],
  ["Plank", "Core", ["abs"], ["obliques"], "core"],
  ["Ab wheel rollout", "Core", ["abs"], ["lats", "serratus"], "rollout"],
  ["Russian twist", "Core", ["obliques"], ["abs"], ""],
  ["Side plank", "Core", ["obliques"], ["abs"], ""],
  ["Cable woodchopper", "Core", ["obliques"], ["abs"], "woodchop"],
  ["Pallof press", "Core", ["obliques"], ["abs"], "anti rotation"],
  ["Serratus cable punch", "Core", ["serratus"], ["frontDelt"], "scap push up protraction"],
];
var GROUPS = ["All", "Chest", "Shoulders", "Back", "Arms", "Forearms", "Legs", "Core"];
var EXBY = {};
EX.forEach(function (e) {
  EXBY[e[0]] = e;
});
var WEB = true; // show the install hint
function lsGet(k, d) {
  try {
    var v = localStorage.getItem(k);
    return v == null ? d : JSON.parse(v);
  } catch (e) {
    return d;
  }
}
function lsSet(k, v) {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}
// Rest times
var BIG = [
  "Back squat",
  "Front squat",
  "Hack squat",
  "Smith machine squat",
  "Deadlift",
  "Romanian deadlift",
  "Stiff-leg deadlift",
  "Sumo deadlift",
  "Rack pull",
  "Barbell bench press",
  "Incline barbell bench press",
  "Smith machine bench press",
  "Close-grip bench press",
  "Overhead press",
  "Push press",
  "Barbell row",
  "Pendlay row",
  "T-bar row",
  "Leg press",
  "Hip thrust",
  "Good morning",
  "Kroc row",
];
var COMPOUND_RE =
  /press|row|pull-?up|chin-?up|pulldown|dip|lunge|squat|deadlift|thrust|step-up|push-up|swing|carry|walk|pullover/i;
function baseRest(n) {
  var e = EXBY[n];
  if (BIG.indexOf(n) >= 0) return 180;
  if (COMPOUND_RE.test(n) && !/calf|wrist|tricep|neck/i.test(n)) return 120;
  if (e && e[2].length >= 2) return 120;
  return 75;
}
function restFor(n, intensity) {
  var own = (lsGet("rm.rest", {}) || {})[n];
  if (own) return own;
  var r = baseRest(n) + (intensity === "hard" ? 30 : intensity === "light" ? -30 : 0);
  return Math.max(30, r);
}
function mmss(sec) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ":" + (sec % 60 < 10 ? "0" : "") + (sec % 60);
}
function recomputeHours() {
  state.sessions.forEach(function (x) {
    x.h = computeHours(x.ex || [], x.muscles || {});
  });
}
function syncCustom() {
  EX = EX.filter(function (e) {
    return !e[5];
  });
  (state.custom || []).forEach(function (c) {
    EX.push([c.n, c.g, c.p, c.s, "custom", true]);
  });
  EXBY = {};
  EX.forEach(function (e) {
    EXBY[e[0]] = e;
  });
}
function norm(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function lastDoneMap() {
  var m = {};
  ((typeof state !== "undefined" && state && state.sessions) || []).forEach(function (s) {
    (s.ex || []).forEach(function (e) {
      if (!m[e.n] || s.t > m[e.n]) m[e.n] = s.t;
    });
  });
  return m;
}
function search(q, group) {
  var nq = norm(q),
    words = nq.split(" ").filter(Boolean);
  var out = [];
  EX.forEach(function (e, i) {
    if (group && group !== "All" && e[1] !== group) return;
    if (!words.length) {
      out.push([0, i, e]);
      return;
    }
    var name = norm(e[0]),
      nameT = name.split(" ");
    var hayT = norm(
      e[0] +
        " " +
        e[4] +
        " " +
        e[2]
          .concat(e[3])
          .map(function (m) {
            return MUSCLES[m].n;
          })
          .join(" ") +
        " " +
        e[1],
    ).split(" ");
    var pre = function (toks) {
      return words.every(function (w) {
        return toks.some(function (t) {
          return t.indexOf(w) === 0;
        });
      });
    };
    var rank;
    if (name.indexOf(nq) === 0) rank = 0;
    else if (name.indexOf(nq) >= 0) rank = 1;
    else if (pre(nameT)) rank = 2;
    else if (
      pre(
        norm(
          e[4] +
            " " +
            e[2]
              .map(function (m) {
                return MUSCLES[m].n;
              })
              .join(" "),
        ).split(" "),
      )
    )
      rank = 3;
    else if (pre(hayT)) rank = 4;
    else return;
    out.push([rank, i, e]);
  });
  var ld = lastDoneMap();
  if (words.length)
    out.sort(function (a, b) {
      return a[0] - b[0] || (ld[b[2][0]] || 0) - (ld[a[2][0]] || 0) || a[1] - b[1];
    });
  return out.map(function (x) {
    return x[2];
  });
}
function musclesFromExercises(list) {
  var out = {};
  list.forEach(function (n) {
    var e = EXBY[n];
    if (!e) return;
    e[2].forEach(function (m) {
      out[m] = "p";
    });
    e[3].forEach(function (m) {
      if (!out[m]) out[m] = "s";
    });
  });
  return out;
}
