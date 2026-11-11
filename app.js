// RecoveryMap: app state, screens and interactions

// State
var state = { sessions: [] };
var LS = "musclemap.v1";
var RENAMES = {
  "Tricep pushdown": "Tricep pushdown (rope)",
  "Cable curl": "Cable curl (straight bar)",
};
function migrate(st) {
  if (!st || typeof st !== "object") st = {};
  if (!Array.isArray(st.sessions)) st.sessions = [];
  if (!Array.isArray(st.templates)) st.templates = [];
  if (!Array.isArray(st.custom)) st.custom = [];
  st.templates.forEach(function (t) {
    (t.ex || []).forEach(function (e) {
      if (RENAMES[e.n]) e.n = RENAMES[e.n];
    });
  });
  st.sessions.forEach(function (s) {
    if (!s.muscles) s.muscles = {};
    if (!Array.isArray(s.ex)) s.ex = [];
    s.ex = s.ex.map(function (e) {
      var x = toSets(typeof e === "string" ? { n: e, i: s.intensity || "normal" } : e);
      if (RENAMES[x.n]) x.n = RENAMES[x.n];
      return x;
    });
    if (!s.h) {
      s.h = {};
      Object.keys(s.muscles).forEach(function (m) {
        if (MUSCLES[m]) s.h[m] = hoursFor(m, s.muscles[m], s.intensity);
      });
    }
    delete s.intensity;
  });
  return st;
}
function toSets(e) {
  if (!Array.isArray(e.sets)) {
    var n = parseInt(e.s) || 0,
      sets = [];
    if (n || e.r || e.w) {
      n = n || 1;
      for (var k = 0; k < n; k++) sets.push({ r: e.r || "", w: e.w || "" });
    }
    e.sets = sets;
  }
  delete e.s;
  delete e.r;
  delete e.w;
  return e;
}
function loadLocal() {
  try {
    var raw = localStorage.getItem(LS);
    if (raw) {
      var j = JSON.parse(raw);
      if (j && j.sessions && j.sessions.length >= state.sessions.length) state = migrate(j);
    }
  } catch (e) {}
}
function saveLocal() {
  try {
    localStorage.setItem(LS, JSON.stringify(state));
  } catch (e) {}
}

var ui = {
  sel: null,
  draft: {},
  manual: {},
  picked: [],
  q: "",
  hi: 0,
  libQ: "",
  libG: "All",
  edit: null,
  saving: false,
  sug: null,
  backup: null,
};

// Shell
var SHELL =
  "" +
  '<div class="wrap">' +
  '<header><div><h1>Recovery<span>Map</span></h1><div class="greet" id="greet"></div><div class="sub" id="status"></div></div><div class="save" id="save"></div></header>' +
  '<div id="install"></div>' +
  '<div class="grid">' +
  '<div class="left"><div class="card o0 week" data-tab="body" id="week"></div><div class="card o1" data-tab="body">' +
  '<div class="bodies"><div class="fig"><div class="lbl">Front</div>' +
  svgFor(FRONT, FRONT_DECO, "Front") +
  '</div><div class="fig"><div class="lbl">Back</div>' +
  svgFor(BACK, BACK_DECO, "Back") +
  "</div></div>" +
  '<div class="legend"><span><i style="background:var(--red)"></i>Just trained</span><span><i style="background:var(--amber)"></i>Recovering</span><span><i style="background:var(--green)"></i>Ready</span><span><i style="background:var(--over)"></i>7+ days since</span><span><i style="background:var(--idle)"></i>No data</span></div>' +
  "</div>" +
  '<div class="card o6" data-tab="lib"><div class="h2">Exercise library <small class="cnt" id="libcnt"></small></div>' +
  '<input class="inp" id="libq" placeholder="Search exercises or muscles…" autocomplete="off">' +
  '<div class="tabs" id="libg">' +
  GROUPS.map(function (g) {
    return (
      '<button class="tab' + (g === "All" ? " on" : "") + '" data-g="' + g + '">' + g + "</button>"
    );
  }).join("") +
  "</div>" +
  '<div class="row" style="margin-top:6px"><button class="ghost" id="cx-open">+ Add your own exercise</button></div><div id="cxform"></div>' +
  '<ul class="lib" id="lib"></ul></div>' +
  "</div>" +
  '<div class="side">' +
  '<div class="card o2" id="logcard" data-tab="log"><div class="h2" id="logTitle">Log a session</div>' +
  '<div class="tpls" id="tpls"></div>' +
  '<input class="inp" id="sname" placeholder="Session name (optional)" autocomplete="off" style="margin-bottom:8px">' +
  '<div class="ac"><input class="inp" id="txt" placeholder="Start typing an exercise… (e.g. bench, rdl, lateral)" autocomplete="off"><ul class="drop" id="drop" hidden></ul></div>' +
  '<div id="picked"></div>' +
  '<div class="sl">Muscles hit</div><div class="chips" id="chips"></div>' +
  '<div class="hint">Set intensity per exercise and reps × kg for each set. Tap a muscle chip to switch primary / secondary / remove.</div>' +
  '<div class="row"><label>When</label><span class="whenbox" id="whenbox"><span id="whentext"></span><input type="datetime-local" id="when"></span><button class="ghost sm" id="timer-tg"></button></div>' +
  '<div class="row"><button class="btn" id="log" disabled>Log session</button><button class="ghost" id="clear">Clear</button><button class="ghost" id="savetpl">Save as workout</button></div>' +
  '<div id="tplform"></div>' +
  "</div>" +
  '<div class="card detail o3" id="detail" data-tab="body"></div>' +
  '<div class="card o4" data-tab="body"><div class="h2">Ready to train</div><div id="ready"></div>' +
  '<div class="row"><button class="ghost" id="suggest">What can I train today?</button></div><div id="sug"></div></div>' +
  '<div class="card o5" data-tab="hist"><div class="h2">History</div><ul class="hist" id="hist"></ul></div>' +
  '<div class="card o7" data-tab="hist"><div class="h2">Backup</div><div class="hint" style="margin-top:0">Your workouts are saved on this device only. Copy a backup now and then and keep it somewhere safe (notes, email to yourself).</div>' +
  '<div class="row"><button class="ghost" id="bk-copy">Copy backup</button><button class="ghost" id="bk-restore">Restore from backup</button></div><div id="bk"></div></div>' +
  "</div>" +
  "</div>" +
  '<footer class="foot" data-tab="body"><p><b>How recovery is estimated:</b> quads, hamstrings, glutes and lower back get about 72 hours. Chest, lats, upper back and adductors get about 60 hours. Front delts, traps, biceps and triceps get about 48 hours, and side and rear delts about 36. Small muscles used every day (forearms, abs, obliques, calves, shins, neck, serratus) recover in about 24–30 hours, so light work on them can be done almost daily. Muscles that only helped get half of that. Light shortens it by 25% and Hard (sets to failure) adds 25%. The hardest exercise that hit a muscle decides its time.</p>' +
  "<p>These are general estimates, not medical advice. Everyone recovers differently, so listen to your body. If something hurts, rest it.</p></footer>" +
  "</div>";
SHELL +=
  '<div id="toast" class="toast" hidden></div>' +
  '<div id="rest" class="restbar" hidden></div>' +
  '<nav class="tabbar" id="tabbar">' +
  [
    ["body", "Body"],
    ["log", "Log"],
    ["lib", "Library"],
    ["hist", "History"],
  ]
    .map(function (t) {
      return (
        '<button data-tabgo="' +
        t[0] +
        '"><span>' +
        t[1] +
        '</span><i class="tbadge" id="badge-' +
        t[0] +
        '"></i></button>'
      );
    })
    .join("") +
  "</nav>";
document.body.insertAdjacentHTML("beforeend", SHELL);
var $ = function (id) {
  return document.getElementById(id);
};

// Helpers
function pad(n) {
  return (n < 10 ? "0" : "") + n;
}
function toLocalInput(d) {
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}
var fmt = {
  format: function (d) {
    return dmy(d, true);
  },
};
var fmtD = {
  format: function (d) {
    return dmy(d, false);
  },
};
function fdate(t) {
  return dmy(new Date(t), true);
}
function dur(ms) {
  ms = Math.abs(ms);
  var h = Math.floor(ms / 3600000),
    d = Math.floor(h / 24);
  h = h % 24;
  var m = Math.floor(ms / 60000) % 60;
  if (d > 0) return d + "d " + h + "h";
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function mix(a, b, t) {
  var pa = [
    parseInt(a.substr(1, 2), 16),
    parseInt(a.substr(3, 2), 16),
    parseInt(a.substr(5, 2), 16),
  ];
  var pb = [
    parseInt(b.substr(1, 2), 16),
    parseInt(b.substr(3, 2), 16),
    parseInt(b.substr(5, 2), 16),
  ];
  return (
    "rgb(" +
    pa
      .map(function (v, i) {
        return Math.round(v + (pb[i] - v) * t);
      })
      .join(",") +
    ")"
  );
}
function hoursFor(m, role, intensity) {
  return MUSCLES[m].h * (INT[intensity] || 1) * (role === "p" ? 1 : SECONDARY);
}
function hits(n, m) {
  var e = EXBY[n];
  return !!e && (e[2].indexOf(m) >= 0 || e[3].indexOf(m) >= 0);
}
function numStr(e) {
  var sets = (e.sets || []).filter(function (x) {
    return x.r || x.w;
  });
  if (!sets.length) return "";
  var one = function (x) {
    return (x.r ? x.r : "?") + (x.w ? "×" + x.w + "kg" : " reps");
  };
  var same = sets.every(function (x) {
    return x.r == sets[0].r && x.w == sets[0].w;
  });
  if (same && sets.length > 1)
    return sets.length + "×" + (sets[0].r || "?") + (sets[0].w ? " @ " + sets[0].w + "kg" : "");
  if (sets.length === 1)
    return "1×" + (sets[0].r || "?") + (sets[0].w ? " @ " + sets[0].w + "kg" : "");
  return sets.map(one).join(" · ");
}
function sumStr(e) {
  var sets = (e.sets || []).filter(function (x) {
    return x.r || x.w;
  });
  if (!sets.length) return "";
  var rs = sets
      .map(function (x) {
        return +x.r || 0;
      })
      .filter(Boolean),
    ws = sets
      .map(function (x) {
        return +x.w || 0;
      })
      .filter(Boolean);
  var rng = function (a) {
    if (!a.length) return "";
    var lo = Math.min.apply(null, a),
      hi = Math.max.apply(null, a);
    return lo === hi ? String(lo) : lo + "–" + hi;
  };
  var r = rng(rs),
    w = rng(ws);
  return sets.length + "×" + (r || "?") + (w ? " @ " + w + "kg" : "");
}
function lastFor(n) {
  var best = null;
  state.sessions.forEach(function (s) {
    if (s.id === ui.edit) return;
    s.ex.forEach(function (e) {
      if (e.n === n && (!best || s.t > best.t)) best = { t: s.t, e: e };
    });
  });
  return best;
}
function newEntry(n) {
  var l = lastFor(n),
    e = { n: n, i: "normal", sets: [{ r: "", w: "" }] };
  if (l) {
    e.i = l.e.i || "normal";
    if (l.e.sets && l.e.sets.length)
      e.sets = l.e.sets.map(function (x) {
        return { r: x.r || "", w: x.w || "" };
      });
  }
  return e;
}
function pickedNames() {
  return ui.picked.map(function (e) {
    return e.n;
  });
}
function computeHours(entries, draft) {
  var h = {};
  Object.keys(draft).forEach(function (m) {
    var best = null;
    entries.forEach(function (e) {
      if (hits(e.n, m)) {
        var k = INT[e.i] || 1;
        if (best === null || k > best) best = k;
      }
    });
    h[m] = MUSCLES[m].h * (best === null ? 1 : best) * (draft[m] === "p" ? 1 : SECONDARY);
  });
  return h;
}
function sessHours(s, m) {
  return (s.h && s.h[m]) || hoursFor(m, s.muscles[m], "normal");
}

function muscleStatus(m, now) {
  var hs = state.sessions.filter(function (s) {
    return s.muscles[m];
  });
  if (!hs.length) return { st: "none", color: "var(--idle)", label: "No data", pct: 1 };
  var last = 0,
    readyAt = 0,
    start = 0;
  hs.forEach(function (s) {
    if (s.t > last) last = s.t;
    var r = s.t + sessHours(s, m) * 3600000;
    if (r > readyAt) {
      readyAt = r;
      start = s.t;
    }
  });
  var o = { hits: hs, last: last, readyAt: readyAt };
  if (now < readyAt) {
    var pct = Math.max(0, Math.min(1, (now - start) / (readyAt - start)));
    o.st = "rec";
    o.pct = pct;
    o.color =
      pct < 0.5 ? mix("#ef4444", "#f97316", pct * 2) : mix("#f97316", "#f59e0b", (pct - 0.5) * 2);
    o.label = pct < 0.35 ? "Just trained" : "Recovering";
  } else if (now - last > 7 * 86400000) {
    o.st = "over";
    o.pct = 1;
    o.color = "var(--over)";
    o.label = "7+ days since";
  } else {
    o.st = "ready";
    o.pct = 1;
    o.color = "var(--green)";
    o.label = "Ready";
  }
  return o;
}

// Suggestions
var SPLITS = [
  ["Push day", ["chest", "upperChest", "frontDelt", "sideDelt", "triceps"]],
  ["Pull day", ["lats", "upperBack", "rearDelt", "biceps", "traps"]],
  ["Leg day", ["quads", "hamstrings", "glutes", "calves", "adductors"]],
  [
    "Upper body",
    ["chest", "upperChest", "lats", "upperBack", "sideDelt", "rearDelt", "biceps", "triceps"],
  ],
  ["Arms & core", ["biceps", "triceps", "forearms", "abs", "obliques"]],
];
function suggest() {
  var now = Date.now(),
    st = {};
  Object.keys(MUSCLES).forEach(function (m) {
    st[m] = muscleStatus(m, now);
  });
  var best = null;
  SPLITS.forEach(function (sp, idx) {
    var score =
      sp[1].reduce(function (a, m) {
        return a + st[m].pct;
      }, 0) / sp[1].length;
    if (!best || score > best.score + 0.001)
      best = { name: sp[0], ms: sp[1], score: score, idx: idx };
  });
  var ready = best.ms.filter(function (m) {
    return st[m].pct >= 1;
  });
  var notReady = best.ms.filter(function (m) {
    return st[m].pct < 1;
  });
  var picks = [];
  ready.forEach(function (m) {
    if (picks.length >= 5) return;
    if (
      picks.some(function (n) {
        return EXBY[n][2].indexOf(m) >= 0;
      })
    )
      return;
    var cands = EX.filter(function (e) {
      return (
        e[2].indexOf(m) >= 0 &&
        picks.indexOf(e[0]) < 0 &&
        !e[2].concat(e[3]).some(function (x) {
          return notReady.indexOf(x) >= 0 && e[2].indexOf(x) >= 0;
        })
      );
    });
    if (!cands.length) return;
    cands.sort(function (a, b) {
      var la = lastFor(a[0]),
        lb = lastFor(b[0]);
      return (lb ? lb.t : 0) - (la ? la.t : 0);
    });
    picks.push(cands[0][0]);
  });
  for (var k = 0; picks.length < 4 && k < ready.length; k++) {
    var iso = EX.filter(function (e) {
      return e[2].length === 1 && e[2][0] === ready[k] && picks.indexOf(e[0]) < 0;
    });
    if (iso.length) picks.push(iso[0][0]);
  }
  return {
    name: best.name,
    score: best.score,
    ready: ready,
    notReady: notReady,
    picks: picks,
    st: st,
  };
}

// Render
function currentDraft() {
  var d = musclesFromExercises(pickedNames());
  Object.keys(ui.manual).forEach(function (m) {
    if (ui.manual[m] === "x") delete d[m];
    else d[m] = ui.manual[m];
  });
  return d;
}
function renderPicked() {
  $("picked").innerHTML = ui.picked
    .map(function (e, i) {
      var l = lastFor(e.n);
      var seg = ["light", "normal", "hard"]
        .map(function (v) {
          return (
            '<button class="' +
            (e.i === v ? "on" : "") +
            '" data-int="' +
            i +
            ":" +
            v +
            '">' +
            v[0].toUpperCase() +
            v.slice(1) +
            "</button>"
          );
        })
        .join("");
      return (
        '<div class="exrow"><div class="exhead"><b>' +
        esc(e.n) +
        '</b><button class="x" data-unpick="' +
        i +
        '" title="Remove">×</button></div>' +
        '<div class="exctl"><div class="seg sm">' +
        seg +
        "</div></div>" +
        '<div class="sets">' +
        e.sets
          .map(function (x, k) {
            return (
              '<div class="setrow' +
              (x.d ? " done" : "") +
              '"><span class="sn">' +
              (k + 1) +
              "</span>" +
              '<span class="stp"><button data-step="' +
              i +
              ":" +
              k +
              ':r:-1">−</button><input type="number" inputmode="numeric" min="0" placeholder="reps" data-i="' +
              i +
              '" data-k="' +
              k +
              '" data-f="r" value="' +
              esc(x.r) +
              '"><button data-step="' +
              i +
              ":" +
              k +
              ':r:1">+</button></span>' +
              '<span class="stp"><button data-step="' +
              i +
              ":" +
              k +
              ':w:-2.5">−</button><input type="number" inputmode="decimal" min="0" step="0.5" placeholder="kg" data-i="' +
              i +
              '" data-k="' +
              k +
              '" data-f="w" value="' +
              esc(x.w) +
              '"><button data-step="' +
              i +
              ":" +
              k +
              ':w:2.5">+</button></span>' +
              '<button class="tick" data-done="' +
              i +
              ":" +
              k +
              '" title="Set done">✓</button>' +
              '<button class="x" data-delset="' +
              i +
              ":" +
              k +
              '" title="Remove set">×</button></div>'
            );
          })
          .join("") +
        '<div class="setfoot"><button class="addset" data-addset="' +
        i +
        '">+ Add set</button><span class="restinfo">Rest ' +
        mmss(restFor(e.n, e.i)) +
        '</span></div><div class="sethead"><span></span><span>reps</span><span>kg</span></div></div>' +
        (l && numStr(l.e)
          ? '<div class="last">Last time: ' +
            esc(numStr(l.e)) +
            " · " +
            fmtD.format(new Date(l.t)) +
            "</div>"
          : l
            ? '<div class="last">Last done ' + fmtD.format(new Date(l.t)) + "</div>"
            : "") +
        "</div>"
      );
    })
    .join("");
}
function renderTemplates() {
  $("tpls").innerHTML = state.templates.length
    ? '<span class="tl">Saved workouts</span>' +
      state.templates
        .map(function (t) {
          return (
            '<span class="tpl"><button data-tpl="' +
            t.id +
            '">' +
            esc(t.name) +
            '</button><button class="x" data-deltpl="' +
            t.id +
            '" title="Delete">×</button></span>'
          );
        })
        .join("")
    : "";
  $("tplform").innerHTML = ui.saving
    ? '<div class="row"><input class="inp" id="tplname" placeholder="Name, e.g. Leg day" style="flex:1;min-width:160px"><button class="btn" id="tplok">Save</button><button class="ghost" id="tplcancel">Cancel</button></div>'
    : "";
  $("savetpl").disabled = !ui.picked.length;
}
var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dmy(d, withTime) {
  return (
    WD[d.getDay()] +
    " " +
    pad(d.getDate()) +
    "/" +
    pad(d.getMonth() + 1) +
    "/" +
    d.getFullYear() +
    (withTime ? " · " + pad(d.getHours()) + ":" + pad(d.getMinutes()) : "")
  );
}
function updateWhenText() {
  var v = $("when").value,
    d = v ? new Date(v) : null;
  $("whentext").textContent = d && !isNaN(d) ? dmy(d, true) : "Pick date";
}
function saveDraft() {
  updateWhenText();
  if (!ui.picked.length && !$("sname").value.trim() && !ui.edit) {
    lsSet("rm.draft", null);
    return;
  }
  lsSet("rm.draft", {
    picked: ui.picked,
    manual: ui.manual,
    name: $("sname").value,
    when: $("when").value,
    whenTouched: !!ui.whenTouched,
    edit: ui.edit,
  });
}
function loadDraft() {
  var d = lsGet("rm.draft", null);
  if (!d || !Array.isArray(d.picked)) return;
  d.picked.forEach(function (e) {
    if (RENAMES[e.n]) e.n = RENAMES[e.n];
  });
  ui.picked = d.picked
    .filter(function (e) {
      return EXBY[e.n];
    })
    .map(function (e) {
      if (!Array.isArray(e.sets)) e.sets = [{ r: "", w: "" }];
      return e;
    });
  ui.manual = d.manual || {};
  $("sname").value = d.name || "";
  if (d.when) $("when").value = d.when;
  ui.whenTouched = !!d.whenTouched;
  ui.edit =
    d.edit &&
    state.sessions.some(function (s) {
      return s.id === d.edit;
    })
      ? d.edit
      : null;
}
function setTab(t) {
  ui.tab = t;
  lsSet("rm.tab", t);
  document.body.setAttribute("data-tab", t);
  document.querySelectorAll("#tabbar [data-tabgo]").forEach(function (b) {
    b.classList.toggle("on", b.getAttribute("data-tabgo") === t);
  });
  try {
    window.scrollTo(0, 0);
  } catch (e) {}
}
function renderLogMeta() {
  var bl = $("badge-log");
  if (bl) {
    bl.textContent = ui.picked.length || "";
    bl.style.display = ui.picked.length ? "" : "none";
  }
  var tg = $("timer-tg");
  if (tg) tg.textContent = "Rest timer: " + (lsGet("rm.timer", true) ? "On" : "Off");
  $("logTitle").textContent = ui.edit ? "Edit session" : "Log a session";
  $("log").textContent = ui.edit ? "Save changes" : "Log session";
  $("clear").textContent = ui.edit ? "Cancel" : "Clear";
  $("logcard").classList.toggle("editing", !!ui.edit);
}
function renderAll() {
  renderPicked();
  renderTemplates();
  renderLogMeta();
  renderCx();
  render();
  saveDraft();
}
var REGION = {
  chest: "chest",
  upperChest: "chest",
  frontDelt: "shoulders",
  sideDelt: "shoulders",
  rearDelt: "shoulders",
  traps: "back",
  lats: "back",
  upperBack: "back",
  lowerBack: "back",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abs: "core",
  obliques: "core",
  serratus: "core",
  neck: "neck",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  adductors: "legs",
  calves: "legs",
  tibialis: "legs",
};
var REGION_MAIN = {
  chest: ["chest"],
  shoulders: ["frontDelt", "sideDelt"],
  back: ["lats", "upperBack"],
  arms: ["biceps", "triceps"],
  legs: ["quads", "hamstrings", "glutes"],
  core: ["abs"],
};
function listJoin(a) {
  return a.length < 2 ? a[0] || "" : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}
function cap(x) {
  return x.charAt(0).toUpperCase() + x.slice(1);
}
function weekStart(d) {
  var x = new Date(d);
  x.setHours(0, 0, 0, 0);
  var wd = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - wd);
  return x.getTime();
}
function renderGreeting(stats, now) {
  var h = new Date(now).getHours(),
    name = (lsGet("rm.name", "") || "").trim();
  var hi =
    h < 5
      ? "Late night"
      : h < 12
        ? "Good morning"
        : h < 18
          ? "Good afternoon"
          : h < 23
            ? "Good evening"
            : "Late night";
  if (ui.naming) {
    $("greet").innerHTML =
      '<span class="nm">What should we call you?</span> <input class="inp nmin" id="nm-in" value="' +
      esc(name) +
      '" placeholder="Your name" maxlength="24"> <button class="btn sm" id="nm-ok">Save</button>';
  } else {
    $("greet").innerHTML =
      esc(hi) +
      (name ? ", <b>" + esc(name) + "</b>" : "") +
      (name ? "" : ' <button class="linkb" id="nm-edit">add your name</button>') +
      (name ? ' <button class="linkb pen" id="nm-edit" title="Change name">✎</button>' : "");
  }
  var msg;
  var dayLbl = function (t) {
    var d = new Date(t),
      n = new Date(now),
      td = new Date(n);
    td.setHours(0, 0, 0, 0);
    var diff = Math.floor((new Date(d).setHours(0, 0, 0, 0) - td.getTime()) / 86400000);
    return diff <= 0
      ? "today " + pad(d.getHours()) + ":" + pad(d.getMinutes())
      : diff === 1
        ? "tomorrow"
        : WD[d.getDay()];
  };
  if (!state.sessions.length) msg = "Log your first workout to start your map.";
  else {
    var regions = Object.keys(REGION_MAIN).filter(function (r) {
      return REGION_MAIN[r].every(function (m) {
        return stats[m].pct >= 1;
      });
    });
    var tired = Object.keys(REGION_MAIN)
      .filter(function (r) {
        return regions.indexOf(r) < 0;
      })
      .map(function (r) {
        return {
          r: r,
          t: Math.max.apply(
            null,
            REGION_MAIN[r].map(function (m) {
              return stats[m].readyAt || 0;
            }),
          ),
        };
      })
      .sort(function (a, b) {
        return a.t - b.t;
      });
    var grp = {},
      order = [];
    tired.forEach(function (x) {
      var l = dayLbl(x.t);
      if (!grp[l]) {
        grp[l] = [];
        order.push(l);
      }
      grp[l].push(x.r);
    });
    var later = order.map(function (l) {
      return listJoin(grp[l]) + " " + l;
    });
    if (!regions.length)
      msg = "Everything is recovering. Next up: " + later.slice(0, 2).join(", ") + ".";
    else
      msg =
        cap(listJoin(regions)) +
        (regions.length > 1 ? " are" : " is") +
        " ready." +
        (later.length ? " " + cap(later.slice(0, 3).join(", ")) + "." : "");
  }
  $("status").textContent = msg;
}
function weekStreak(now) {
  var weeks = {};
  state.sessions.forEach(function (s) {
    weeks[weekStart(s.t)] = 1;
  });
  var w = weekStart(now),
    n = 0;
  if (!weeks[w]) w -= 7 * 86400000;
  while (weeks[w]) {
    n++;
    w = weekStart(w - 3 * 86400000);
  }
  return n;
}
function renderWeek(now) {
  var el = $("week");
  if (!state.sessions.length) {
    el.style.display = "none";
    return;
  }
  el.style.display = "";
  var ws = weekStart(now),
    days = [],
    count = 0,
    today = new Date(now).toDateString();
  for (var i = 0; i < 7; i++) {
    var d = new Date(ws);
    d.setDate(d.getDate() + i);
    var ds = d.toDateString(),
      has = state.sessions.some(function (s) {
        return new Date(s.t).toDateString() === ds;
      });
    if (has) count++;
    days.push(
      '<span class="dd' +
        (has ? " on" : "") +
        (ds === today ? " now" : "") +
        '"><i></i><small>' +
        "MTWTFSS"[i] +
        "</small></span>",
    );
  }
  var streak = weekStreak(now);
  var line = count
    ? count + " workout" + (count > 1 ? "s" : "") + " this week"
    : "No workouts yet this week";
  var sub =
    streak >= 2
      ? "<b>🔥 " + streak + "-week streak</b>"
      : count
        ? "Train next week to start a streak."
        : streak === 1
          ? "Train this week to start a streak."
          : "";
  el.innerHTML =
    '<div class="wk"><div><div class="wkt">' +
    line +
    "</div>" +
    (sub ? '<div class="wks">' + sub + "</div>" : "") +
    '</div><div class="dots">' +
    days.join("") +
    "</div></div>";
}
function flashSaved() {
  var el = $("save");
  el.textContent = "Saved ✓";
  el.classList.add("flash");
  setTimeout(function () {
    el.classList.remove("flash");
  }, 1600);
}
function showToast(t) {
  var el = $("toast");
  if (!t) {
    el.hidden = true;
    return;
  }
  el.innerHTML =
    '<div class="tt">' +
    esc(t.title) +
    "</div>" +
    (t.lines || [])
      .map(function (l) {
        return '<div class="tl2">' + esc(l) + "</div>";
      })
      .join("") +
    '<button class="x" id="toast-x">×</button>';
  el.hidden = false;
  clearTimeout(ui.toastT);
  ui.toastT = setTimeout(function () {
    el.hidden = true;
  }, 6500);
}
function bestWeight(n, excludeId) {
  var b = 0;
  state.sessions.forEach(function (s) {
    if (s.id === excludeId) return;
    s.ex.forEach(function (e) {
      if (e.n !== n) return;
      (e.sets || []).forEach(function (x) {
        if (+x.w > b) b = +x.w;
      });
    });
  });
  return b;
}
function render() {
  var now = Date.now();
  ui.draft = currentDraft();
  var stats = {};
  Object.keys(MUSCLES).forEach(function (m) {
    stats[m] = muscleStatus(m, now);
  });
  renderGreeting(stats, now);
  renderWeek(now);
  document.querySelectorAll("svg.body .m").forEach(function (p) {
    var m = p.getAttribute("data-m");
    p.style.fill = stats[m].color;
    p.classList.toggle("sel", ui.sel === m);
    p.classList.toggle("draft", !!ui.draft[m]);
  });
  var keys = Object.keys(ui.draft);
  $("chips").innerHTML = keys
    .map(function (m) {
      var r = ui.draft[m];
      return (
        '<span class="chip ' +
        r +
        '" data-m="' +
        m +
        '">' +
        MUSCLES[m].n +
        "<small>" +
        (r === "p" ? "primary" : "secondary") +
        "</small></span>"
      );
    })
    .join("");
  $("log").disabled = !keys.length;
  $("savetpl").disabled = !ui.picked.length;
  renderDrop();
  renderLib();
  // ready
  var ready = Object.keys(MUSCLES).filter(function (m) {
    return stats[m].st === "ready" || stats[m].st === "over";
  });
  var rec = Object.keys(MUSCLES)
    .filter(function (m) {
      return stats[m].st === "rec";
    })
    .sort(function (a, b) {
      return stats[a].readyAt - stats[b].readyAt;
    });
  var html = "";
  if (!state.sessions.length)
    html =
      '<div class="empty">Nothing here yet. Log your first workout and the map comes alive.</div>';
  else {
    html +=
      '<div class="ready-list">' +
      (ready.length
        ? ready
            .map(function (m) {
              return (
                '<span class="chip" data-pick="' +
                m +
                '" style="border-color:' +
                stats[m].color +
                '">' +
                MUSCLES[m].n +
                "</span>"
              );
            })
            .join("")
        : '<div class="empty">Everything you trained is still recovering. Rest is part of the plan.</div>') +
      "</div>";
    if (rec.length)
      html +=
        '<div class="sl">Recovering</div><ul class="reclist">' +
        rec
          .map(function (m) {
            return (
              '<li data-pick="' +
              m +
              '"><i style="background:' +
              stats[m].color +
              '"></i><span>' +
              esc(MUSCLES[m].n) +
              "</span><b>" +
              dur(stats[m].readyAt - now) +
              "</b><small>" +
              fmt.format(new Date(stats[m].readyAt)) +
              "</small></li>"
            );
          })
          .join("") +
        "</ul>";
  }
  $("ready").innerHTML = html;
  // suggestion
  if (ui.sug) {
    var g = ui.sug;
    $("sug").innerHTML =
      '<div class="sug"><div class="sugt">' +
      esc(g.name) +
      " <small>" +
      Math.round(g.score * 100) +
      "% recovered</small></div>" +
      (g.ready.length
        ? '<div class="hint" style="margin-top:4px">Ready: ' +
          g.ready
            .map(function (m) {
              return esc(MUSCLES[m].n);
            })
            .join(", ") +
          "</div>"
        : "") +
      (g.notReady.length
        ? '<div class="hint" style="margin-top:2px">Still recovering (go light or skip): ' +
          g.notReady
            .map(function (m) {
              return esc(MUSCLES[m].n);
            })
            .join(", ") +
          "</div>"
        : "") +
      (g.picks.length
        ? '<ul class="sugl">' +
          g.picks
            .map(function (n) {
              return "<li>" + esc(n) + "</li>";
            })
            .join("") +
          '</ul><div class="row"><button class="btn" id="sugload">Load into log</button><button class="ghost" id="sugclose">Close</button></div>'
        : '<div class="empty" style="margin-top:8px">Everything is still recovering. Rest day.</div><div class="row"><button class="ghost" id="sugclose">Close</button></div>') +
      "</div>";
  } else $("sug").innerHTML = "";
  renderDetail(stats, now);
  // history
  var ss = state.sessions.slice().sort(function (a, b) {
    return b.t - a.t;
  });
  $("hist").innerHTML = ss.length
    ? ss
        .slice(0, 40)
        .map(function (s) {
          var ms = Object.keys(s.muscles)
            .filter(function (m) {
              return s.muscles[m] === "p";
            })
            .map(function (m) {
              return MUSCLES[m].n;
            })
            .join(", ");
          var lines = s.ex.length
            ? s.ex
                .map(function (e) {
                  var ns = sumStr(e),
                    it = e.i && e.i !== "normal" ? e.i : "";
                  return (
                    '<div class="hx"><span>' +
                    esc(e.n) +
                    "</span><small>" +
                    esc(ns) +
                    (ns && it ? " · " : "") +
                    (it ? '<b class="it-' + it + '">' + it + "</b>" : "") +
                    "</small></div>"
                  );
                })
                .join("")
            : "<div>" + esc(s.text || ms) + "</div>";
          return (
            '<li class="hs' +
            (ui.edit === s.id ? " ed" : "") +
            '"><div class="hh"><div class="hb" data-edit="' +
            s.id +
            '">' +
            (s.name ? '<div class="hn">' + esc(s.name) + "</div>" : "") +
            '<div class="t">' +
            fdate(s.t) +
            (ui.edit === s.id ? " · editing" : "") +
            "</div></div>" +
            '<div class="ha"><button class="ghost sm" data-again="' +
            s.id +
            '">Do again</button><button class="ghost sm" data-edit="' +
            s.id +
            '">Edit</button><button class="x" title="Delete" data-del="' +
            s.id +
            '">×</button></div></div>' +
            '<div class="hl" data-edit="' +
            s.id +
            '">' +
            lines +
            '<div class="t hm">' +
            esc(ms) +
            "</div></div></li>"
          );
        })
        .join("")
    : '<li class="empty" style="border:0">No workouts yet. Your first one will show up here.</li>';
  // backup
  if (ui.backup === "copy") {
    $("bk").innerHTML =
      '<div class="hint">' +
      (ui.copied ? "Copied! Paste it somewhere safe. " : "Select all and copy this text:") +
      '</div><textarea id="bktext" readonly>' +
      esc(JSON.stringify(state)) +
      "</textarea>";
  } else if (ui.backup === "restore") {
    $("bk").innerHTML =
      '<div class="hint">Paste your backup text below. This replaces everything currently in the app.</div><textarea id="bkin" placeholder="Paste backup here…"></textarea><div class="row"><button class="btn" id="bk-do">Replace with backup</button><button class="ghost" id="bk-cancel">Cancel</button></div><div class="hint" id="bkmsg"></div>';
  } else $("bk").innerHTML = "";
}
function renderDrop() {
  var d = $("drop"),
    q = ui.q.trim();
  if (!q) {
    if (document.activeElement !== $("txt") || ui.hideRecent) {
      d.hidden = true;
      d.innerHTML = "";
      return;
    }
    var ld = lastDoneMap(),
      rec = Object.keys(ld)
        .filter(function (n) {
          return EXBY[n];
        })
        .sort(function (a, b) {
          return ld[b] - ld[a];
        })
        .slice(0, 8),
      nm = pickedNames();
    if (!rec.length) {
      d.hidden = true;
      d.innerHTML = "";
      return;
    }
    d.hidden = false;
    d.innerHTML =
      '<li class="dh">Recent</li>' +
      rec
        .map(function (n) {
          return (
            '<li data-add="' +
            esc(n) +
            '"><span>' +
            esc(n) +
            (nm.indexOf(n) >= 0 ? " <em>✓ added</em>" : "") +
            "</span><small>" +
            EXBY[n][2]
              .map(function (m) {
                return MUSCLES[m].n;
              })
              .join(", ") +
            "</small></li>"
          );
        })
        .join("");
    return;
  }
  var r = search(q).slice(0, 8),
    names = pickedNames();
  if (ui.hi >= r.length) ui.hi = Math.max(0, r.length - 1);
  d.hidden = false;
  d.innerHTML = r.length
    ? r
        .map(function (e, i) {
          var has = names.indexOf(e[0]) >= 0;
          return (
            '<li class="' +
            (i === ui.hi ? "hi" : "") +
            '" data-add="' +
            esc(e[0]) +
            '"><span>' +
            esc(e[0]) +
            (has ? " <em>✓ added</em>" : "") +
            "</span><small>" +
            e[2]
              .map(function (m) {
                return MUSCLES[m].n;
              })
              .join(", ") +
            "</small></li>"
          );
        })
        .join("")
    : '<li class="none">No exercise called “' +
      esc(q) +
      '” in the list</li><li class="addown" data-addown="' +
      esc(q) +
      '">+ Add “' +
      esc(q) +
      "” as your own exercise</li>";
}
function renderLib() {
  var r = search(ui.libQ, ui.libG),
    html = "",
    last = "",
    names = pickedNames();
  var grouped = ui.libG === "All" && !ui.libQ.trim();
  if (grouped) {
    var gi = function (e) {
      return GROUPS.indexOf(e[1]);
    };
    r = r
      .map(function (e, i) {
        return [e, i];
      })
      .sort(function (a, b) {
        return gi(a[0]) - gi(b[0]) || a[1] - b[1];
      })
      .map(function (x) {
        return x[0];
      });
  }
  r.forEach(function (e) {
    if (grouped && e[1] !== last) {
      html += '<li class="gh">' + e[1] + "</li>";
      last = e[1];
    }
    var has = names.indexOf(e[0]) >= 0;
    html +=
      '<li class="li' +
      (has ? " on" : "") +
      '" data-add="' +
      esc(e[0]) +
      '"><div><div>' +
      esc(e[0]) +
      (e[5] ? ' <span class="ctag">Custom</span>' : "") +
      "</div><small><b>" +
      e[2]
        .map(function (m) {
          return MUSCLES[m].n;
        })
        .join(", ") +
      "</b>" +
      (e[3].length
        ? " · " +
          e[3]
            .map(function (m) {
              return MUSCLES[m].n;
            })
            .join(", ")
        : "") +
      "</small></div>" +
      '<span class="lact">' +
      (e[5]
        ? '<button class="x" data-delcx="' +
          esc(e[0]) +
          '" title="Delete custom exercise">×</button>'
        : "") +
      '<span class="add">' +
      (has ? "✓" : "+") +
      "</span></span></li>";
  });
  $("lib").innerHTML = html || '<li class="empty" style="padding:8px 0">Nothing matches.</li>';
  $("libcnt").textContent = EX.length;
}
function renderCx() {
  if (!ui.cx) {
    $("cxform").innerHTML = "";
    $("cx-open").style.display = "";
    return;
  }
  $("cx-open").style.display = "none";
  var c = ui.cx;
  $("cxform").innerHTML =
    '<div class="cxf"><div class="h3">New exercise</div>' +
    '<input class="inp" id="cx-name" placeholder="Exercise name, e.g. Hammer Strength incline press" value="' +
    esc(c.n) +
    '" autocomplete="off">' +
    '<div class="row"><label>Group</label><select id="cx-g">' +
    GROUPS.slice(1)
      .map(function (g) {
        return "<option" + (g === c.g ? " selected" : "") + ">" + g + "</option>";
      })
      .join("") +
    "</select></div>" +
    '<div class="sl">Muscles it works <small>tap once for primary, twice for secondary</small></div>' +
    '<div class="chips">' +
    Object.keys(MUSCLES)
      .map(function (m) {
        var r = c.m[m];
        return (
          '<span class="chip ' +
          (r || "") +
          '" data-cxm="' +
          m +
          '">' +
          MUSCLES[m].n +
          (r ? "<small>" + (r === "p" ? "primary" : "secondary") + "</small>" : "") +
          "</span>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="hint" id="cx-msg"></div>' +
    '<div class="row"><button class="btn" id="cx-save">Save exercise</button><button class="ghost" id="cx-cancel">Cancel</button></div></div>';
}
var audioCtx = null;
function beep() {
  try {
    if (!audioCtx) return;
    [0, 0.25, 0.5].forEach(function (t0) {
      var o = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(audioCtx.destination);
      var t = audioCtx.currentTime + t0;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch (e) {}
}
function startRest(i) {
  if (!lsGet("rm.timer", true)) return;
  var e = ui.picked[i];
  if (!e) return;
  var total = restFor(e.n, e.i);
  var doneCount = e.sets.filter(function (x) {
    return x.d;
  }).length;
  ui.rest = {
    end: Date.now() + total * 1000,
    total: total,
    n: e.n,
    label: e.n + " · set " + doneCount + " done",
    alerted: false,
  };
  tickRest();
}
function tickRest() {
  var el = $("rest"),
    r = ui.rest;
  if (!r) {
    el.hidden = true;
    return;
  }
  var left = (r.end - Date.now()) / 1000;
  if (left <= 0 && !r.alerted) {
    r.alerted = true;
    beep();
    try {
      navigator.vibrate && navigator.vibrate([250, 120, 250]);
    } catch (e) {}
  }
  if (left <= -15) {
    ui.rest = null;
    el.hidden = true;
    return;
  }
  el.hidden = false;
  var pct = Math.max(0, Math.min(1, left / r.total));
  el.className = "restbar" + (left <= 0 ? " go" : "");
  el.innerHTML =
    '<div class="rbfill" style="width:' +
    pct * 100 +
    '%"></div><div class="rbin"><div><div class="rbt">' +
    (left > 0 ? mmss(left) : "Go! Next set") +
    '</div><div class="rbl">' +
    esc(r.label) +
    "</div></div>" +
    '<div class="rbb"><button data-rest="-15">−15s</button><button data-rest="15">+15s</button><button data-rest="skip">Skip</button></div></div>';
}
setInterval(function () {
  if (ui.rest) tickRest();
}, 250);
function renderInstall() {
  var el = $("install");
  if (!el) return;
  if (!WEB || ui.noInstall) {
    el.innerHTML = "";
    return;
  }
  var standalone =
    window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  if (standalone) {
    el.innerHTML = "";
    return;
  }
  var ua = navigator.userAgent || "",
    ios =
      /iPhone|iPad|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var msg = "";
  if (ui.installEvt)
    msg =
      '<b>Install RecoveryMap</b> to open it from your home screen like an app.</div><div class="row" style="margin-top:8px"><button class="btn" id="inst-go">Install app</button>';
  else if (ios)
    msg =
      "<b>Install RecoveryMap:</b> tap the <b>Share</b> button in Safari, then <b>Add to Home Screen</b>. It opens like an app and keeps your workouts safer.";
  else {
    el.innerHTML = "";
    return;
  }
  el.innerHTML =
    '<div class="install"><div>' +
    msg +
    '</div><button class="x" id="inst-x" title="Dismiss">×</button></div>';
}
function addEx(n) {
  if (pickedNames().indexOf(n) < 0) ui.picked.push(newEntry(n));
}
function toggleEx(n) {
  var i = pickedNames().indexOf(n);
  if (i >= 0) ui.picked.splice(i, 1);
  else ui.picked.push(newEntry(n));
}
function renderDetail(stats, now) {
  var el = $("detail");
  if (!ui.sel) {
    el.innerHTML =
      '<div class="h2">Muscle info</div><div class="empty">Tap any muscle on the body to see when you last trained it and when it’s ready again.</div>';
    return;
  }
  var m = ui.sel,
    s = stats[m],
    M = MUSCLES[m];
  var h =
    '<div class="name">' +
    M.n +
    '</div><span class="badge" style="background:' +
    s.color +
    ";color:" +
    (s.st === "none" ? "var(--text)" : "#111") +
    '">' +
    s.label +
    "</span>";
  if (s.st === "none") {
    h +=
      '<div class="big">Not trained yet</div><dl class="kv"><dt>Recovery window</dt><dd>' +
      M.h +
      "h (normal intensity)</dd></dl>";
  } else {
    h +=
      '<div class="big">' +
      (s.st === "rec" ? "Ready in " + dur(s.readyAt - now) : "Ready to go") +
      "</div>";
    h +=
      '<div class="bar"><div style="width:' +
      Math.round(s.pct * 100) +
      "%;background:" +
      s.color +
      '"></div></div>';
    h +=
      '<dl class="kv"><dt>Last trained</dt><dd>' +
      fdate(s.last) +
      " (" +
      dur(now - s.last) +
      " ago)</dd>";
    h +=
      "<dt>" +
      (s.st === "rec" ? "Ready at" : "Was ready") +
      "</dt><dd>" +
      fdate(s.readyAt) +
      "</dd>";
    h += "<dt>Recovered</dt><dd>" + Math.round(s.pct * 100) + "%</dd>";
    h +=
      "<dt>Window</dt><dd>" +
      M.h +
      "h primary · " +
      Math.round(M.h * SECONDARY) +
      "h secondary (normal)</dd>";
    h +=
      "<dt>Last 7 days</dt><dd>" +
      s.hits.filter(function (x) {
        return now - x.t < 7 * 86400000;
      }).length +
      " session(s)</dd></dl>";
    var recent = s.hits
      .slice()
      .sort(function (a, b) {
        return b.t - a.t;
      })
      .slice(0, 3);
    h +=
      '<ul class="hist">' +
      recent
        .map(function (x) {
          var ex = x.ex
            .filter(function (e) {
              return hits(e.n, m);
            })
            .map(function (e) {
              var ns = numStr(e);
              return esc(e.n) + (ns ? ' <small class="t">' + esc(ns) + "</small>" : "");
            })
            .join("<br>");
          return (
            "<li><div>" +
            (x.name ? '<div class="hn">' + esc(x.name) + "</div>" : "") +
            '<div class="t">' +
            fdate(x.t) +
            " · " +
            (x.muscles[m] === "p" ? "primary" : "secondary") +
            "</div><div>" +
            (ex || esc(x.text || "")) +
            "</div></div></li>"
          );
        })
        .join("") +
      "</ul>";
  }
  h +=
    '<div class="row"><button class="ghost" data-toggle="' +
    m +
    '">' +
    (ui.draft[m] ? "Remove from this session" : "+ Add to this session") +
    "</button></div>";
  el.innerHTML = h;
}

// Persistence
function persist() {
  saveLocal();
  $("save").textContent = "Saved on this device";
  renderAll();
}
function resetLog() {
  ui.whenTouched = false;
  $("sname").value = "";
  ui.picked = [];
  ui.q = "";
  ui.manual = {};
  ui.edit = null;
  ui.saving = false;
  $("txt").value = "";
  $("when").value = toLocalInput(new Date());
}
function startEdit(id) {
  var s = state.sessions.filter(function (x) {
    return x.id === id;
  })[0];
  if (!s) return;
  ui.edit = id;
  ui.saving = false;
  $("sname").value = s.name || "";
  ui.picked = s.ex.map(function (e) {
    var sets = (e.sets || []).map(function (x) {
      return { r: x.r || "", w: x.w || "" };
    });
    if (!sets.length) sets = [{ r: "", w: "" }];
    return { n: e.n, i: e.i || "normal", sets: sets };
  });
  var auto = musclesFromExercises(pickedNames());
  ui.manual = {};
  Object.keys(s.muscles).forEach(function (m) {
    if (auto[m] !== s.muscles[m]) ui.manual[m] = s.muscles[m];
  });
  Object.keys(auto).forEach(function (m) {
    if (!s.muscles[m]) ui.manual[m] = "x";
  });
  $("when").value = toLocalInput(new Date(s.t));
  renderAll();
  try {
    $("logcard").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {}
}
function cleanEntry(e) {
  var num = function (v) {
    v = parseFloat(v);
    return !isNaN(v) && v > 0 ? v : "";
  };
  var sets = (e.sets || [])
    .map(function (x) {
      return { r: num(x.r), w: num(x.w) };
    })
    .filter(function (x) {
      return x.r || x.w;
    });
  return { n: e.n, i: e.i || "normal", sets: sets };
}

// Events
document.addEventListener("click", function (e) {
  var t = e.target;
  if (!t.closest) return;
  var c;
  if ((c = t.closest("svg [data-m]"))) {
    var id = c.getAttribute("data-m");
    ui.sel = ui.sel === id ? null : id;
    render();
    return;
  }
  if ((c = t.closest("[data-tabgo]"))) {
    setTab(c.getAttribute("data-tabgo"));
    return;
  }
  if ((c = t.closest("[data-rest]"))) {
    var rv = c.getAttribute("data-rest");
    if (!ui.rest) return;
    if (rv === "skip") {
      ui.rest = null;
      tickRest();
      return;
    }
    ui.rest.end += +rv * 1000;
    ui.rest.total = Math.max(15, ui.rest.total + +rv);
    ui.rest.alerted = false;
    var prefs = lsGet("rm.rest", {}) || {};
    prefs[ui.rest.n] = ui.rest.total;
    lsSet("rm.rest", prefs);
    renderPicked();
    tickRest();
    return;
  }
  if ((c = t.closest("[data-step]"))) {
    var sp = c.getAttribute("data-step").split(":"),
      se = ui.picked[+sp[0]];
    if (!se) return;
    var st = se.sets[+sp[1]];
    if (!st) return;
    var f = sp[2],
      dlt = parseFloat(sp[3]);
    var cur = parseFloat(st[f]);
    if (isNaN(cur)) {
      var prevS = se.sets[+sp[1] - 1];
      cur = prevS && parseFloat(prevS[f]) ? parseFloat(prevS[f]) : 0;
      if (dlt > 0 && cur) dlt = 0;
    }
    var nv = Math.max(0, Math.round((cur + dlt) * 10) / 10);
    st[f] = nv ? String(nv) : "";
    var inp = document.querySelector(
      '#picked input[data-i="' + sp[0] + '"][data-k="' + sp[1] + '"][data-f="' + f + '"]',
    );
    if (inp) inp.value = st[f];
    saveDraft();
    return;
  }
  if ((c = t.closest("[data-done]"))) {
    var dp2 = c.getAttribute("data-done").split(":"),
      de2 = ui.picked[+dp2[0]];
    if (!de2) return;
    var ds = de2.sets[+dp2[1]];
    if (!ds) return;
    ds.d = !ds.d;
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    } catch (er) {}
    if (ds.d && !ui.edit && !ui.whenTouched) {
      $("when").value = toLocalInput(new Date());
    }
    renderPicked();
    saveDraft();
    if (ds.d) startRest(+dp2[0]);
    return;
  }
  if ((c = t.closest("[data-again]"))) {
    var sa = state.sessions.filter(function (x) {
      return x.id === c.getAttribute("data-again");
    })[0];
    if (!sa) return;
    resetLog();
    ui.picked = sa.ex
      .filter(function (e) {
        return EXBY[e.n];
      })
      .map(function (e) {
        var sets = (e.sets || []).map(function (x) {
          return { r: x.r || "", w: x.w || "" };
        });
        if (!sets.length) sets = [{ r: "", w: "" }];
        return { n: e.n, i: e.i || "normal", sets: sets };
      });
    $("sname").value = sa.name || "";
    renderAll();
    setTab("log");
    return;
  }
  if ((c = t.closest("[data-delcx]"))) {
    if (c.dataset.armed) {
      var cn = c.getAttribute("data-delcx");
      state.custom = state.custom.filter(function (x) {
        return x.n !== cn;
      });
      syncCustom();
      ui.picked = ui.picked.filter(function (x) {
        return EXBY[x.n];
      });
      persist();
    } else {
      c.dataset.armed = "1";
      c.textContent = "Delete?";
      c.style.color = "var(--red)";
      c.style.fontSize = "12px";
      setTimeout(function () {
        if (c.isConnected) {
          delete c.dataset.armed;
          c.textContent = "×";
          c.style.color = "";
          c.style.fontSize = "";
        }
      }, 3000);
    }
    return;
  }
  if ((c = t.closest("[data-addown]"))) {
    ui.cx = { n: c.getAttribute("data-addown"), g: "Chest", m: {} };
    ui.q = "";
    $("txt").value = "";
    $("drop").hidden = true;
    renderCx();
    setTab("lib");
    try {
      $("cxform").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (er) {}
    return;
  }
  if ((c = t.closest("[data-cxm]"))) {
    var mm = c.getAttribute("data-cxm"),
      cur0 = ui.cx.m[mm];
    ui.cx.n = $("cx-name").value;
    ui.cx.g = $("cx-g").value;
    if (!cur0) ui.cx.m[mm] = "p";
    else if (cur0 === "p") ui.cx.m[mm] = "s";
    else delete ui.cx.m[mm];
    renderCx();
    return;
  }
  if ((c = t.closest("[data-add]"))) {
    toggleEx(c.getAttribute("data-add"));
    if (c.closest("#drop")) {
      ui.q = "";
      $("txt").value = "";
      $("txt").focus();
      ui.hideRecent = true;
    }
    renderAll();
    return;
  }
  if ((c = t.closest("[data-unpick]"))) {
    ui.picked.splice(+c.getAttribute("data-unpick"), 1);
    renderAll();
    return;
  }
  if ((c = t.closest("[data-addset]"))) {
    var ai = +c.getAttribute("data-addset"),
      en = ui.picked[ai];
    if (!en) return;
    var lastSet = en.sets[en.sets.length - 1] || { r: "", w: "" };
    en.sets.push({ r: lastSet.r, w: lastSet.w });
    renderPicked();
    var ins = document.querySelectorAll('#picked input[data-i="' + ai + '"][data-f="w"]');
    if (ins.length) ins[ins.length - 1].focus();
    return;
  }
  if ((c = t.closest("[data-delset]"))) {
    var dp = c.getAttribute("data-delset").split(":"),
      de = ui.picked[+dp[0]];
    if (!de) return;
    de.sets.splice(+dp[1], 1);
    if (!de.sets.length) de.sets.push({ r: "", w: "" });
    renderPicked();
    return;
  }
  if ((c = t.closest("[data-int]"))) {
    var pr = c.getAttribute("data-int").split(":");
    ui.picked[+pr[0]].i = pr[1];
    renderPicked();
    return;
  }
  if ((c = t.closest("[data-g]"))) {
    ui.libG = c.getAttribute("data-g");
    document.querySelectorAll("#libg .tab").forEach(function (b) {
      b.classList.toggle("on", b === c);
    });
    renderLib();
    return;
  }
  if (!t.closest(".ac")) {
    $("drop").hidden = true;
  }
  if ((c = t.closest(".chip[data-m]"))) {
    var cm = c.getAttribute("data-m");
    ui.manual[cm] = ui.draft[cm] === "p" ? "s" : "x";
    render();
    return;
  }
  if ((c = t.closest("[data-pick]"))) {
    ui.sel = c.getAttribute("data-pick");
    render();
    try {
      $("detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (er) {}
    return;
  }
  if ((c = t.closest("[data-toggle]"))) {
    var tm = c.getAttribute("data-toggle");
    ui.manual[tm] = ui.draft[tm] ? "x" : "p";
    render();
    return;
  }
  if ((c = t.closest("[data-del]"))) {
    if (c.dataset.armed) {
      var did = c.getAttribute("data-del");
      state.sessions = state.sessions.filter(function (s) {
        return s.id !== did;
      });
      if (ui.edit === did) resetLog();
      persist();
    } else {
      c.dataset.armed = "1";
      c.textContent = "Delete?";
      c.style.color = "var(--red)";
      c.style.fontSize = "12px";
      setTimeout(function () {
        if (c.isConnected) {
          delete c.dataset.armed;
          c.textContent = "×";
          c.style.color = "";
          c.style.fontSize = "";
        }
      }, 3000);
    }
    return;
  }
  if ((c = t.closest("[data-edit]"))) {
    startEdit(c.getAttribute("data-edit"));
    setTab("log");
    return;
  }
  if ((c = t.closest("[data-tpl]"))) {
    var tp = state.templates.filter(function (x) {
      return x.id === c.getAttribute("data-tpl");
    })[0];
    if (!tp) return;
    ui.picked = [];
    ui.manual = {};
    $("sname").value = tp.name;
    tp.ex.forEach(function (te) {
      var en = newEntry(te.n);
      en.i = te.i || en.i;
      ui.picked.push(en);
    });
    renderAll();
    return;
  }
  if ((c = t.closest("[data-deltpl]"))) {
    if (c.dataset.armed) {
      var tid = c.getAttribute("data-deltpl");
      state.templates = state.templates.filter(function (x) {
        return x.id !== tid;
      });
      persist();
    } else {
      c.dataset.armed = "1";
      c.textContent = "Delete?";
      c.style.color = "var(--red)";
      setTimeout(function () {
        if (c.isConnected) {
          delete c.dataset.armed;
          c.textContent = "×";
          c.style.color = "";
        }
      }, 3000);
    }
    return;
  }
  if ((c = t.closest("#whenbox")) && t.id !== "when") {
    var wi = $("when");
    try {
      wi.showPicker();
    } catch (er) {
      c.classList.add("native");
      wi.focus();
    }
    return;
  }
  switch (t.id) {
    case "nm-edit":
      ui.naming = true;
      render();
      setTimeout(function () {
        var n = $("nm-in");
        if (n) {
          n.focus();
          n.select();
        }
      }, 0);
      return;
    case "nm-ok":
      lsSet("rm.name", ($("nm-in").value || "").trim().slice(0, 24));
      ui.naming = false;
      render();
      return;
    case "toast-x":
      lsSet("rm.toast", null);
      showToast(null);
      return;
    case "timer-tg":
      lsSet("rm.timer", !lsGet("rm.timer", true));
      if (!lsGet("rm.timer", true)) {
        ui.rest = null;
        tickRest();
      }
      renderLogMeta();
      return;
    case "cx-open":
      ui.cx = { n: "", g: ui.libG !== "All" ? ui.libG : "Chest", m: {} };
      renderCx();
      setTimeout(function () {
        var n = $("cx-name");
        if (n) n.focus();
      }, 0);
      return;
    case "cx-cancel":
      ui.cx = null;
      renderCx();
      return;
    case "cx-save":
      var nm2 = ($("cx-name").value || "").trim().replace(/\s+/g, " "),
        g2 = $("cx-g").value;
      nm2 = nm2.charAt(0).toUpperCase() + nm2.slice(1);
      var p2 = Object.keys(ui.cx.m).filter(function (m) {
          return ui.cx.m[m] === "p";
        }),
        s2 = Object.keys(ui.cx.m).filter(function (m) {
          return ui.cx.m[m] === "s";
        });
      if (!nm2) {
        $("cx-msg").textContent = "Give it a name.";
        return;
      }
      if (
        EX.some(function (e) {
          return e[0].toLowerCase() === nm2.toLowerCase();
        })
      ) {
        $("cx-msg").textContent = "That exercise is already in the list.";
        return;
      }
      if (!p2.length) {
        $("cx-msg").textContent = "Pick at least one primary muscle.";
        return;
      }
      state.custom.push({ n: nm2, g: g2, p: p2, s: s2 });
      syncCustom();
      ui.cx = null;
      addEx(nm2);
      persist();
      return;
    case "inst-x":
      ui.noInstall = true;
      try {
        localStorage.setItem("rm.noinstall", "1");
      } catch (er) {}
      renderInstall();
      return;
    case "inst-go":
      if (ui.installEvt) {
        ui.installEvt.prompt();
        ui.installEvt = null;
        renderInstall();
      }
      return;
    case "savetpl":
      ui.saving = true;
      renderTemplates();
      setTimeout(function () {
        var n = $("tplname");
        if (n) n.focus();
      }, 0);
      return;
    case "tplcancel":
      ui.saving = false;
      renderTemplates();
      return;
    case "tplok":
      var nm = ($("tplname").value || "").trim();
      if (!nm || !ui.picked.length) return;
      state.templates = state.templates.filter(function (x) {
        return x.name.toLowerCase() !== nm.toLowerCase();
      });
      state.templates.push({
        id: Date.now().toString(36),
        name: nm,
        ex: ui.picked.map(function (e) {
          return { n: e.n, i: e.i };
        }),
      });
      if (!$("sname").value.trim()) $("sname").value = nm;
      ui.saving = false;
      persist();
      return;
    case "suggest":
      ui.sug = suggest();
      render();
      return;
    case "sugclose":
      ui.sug = null;
      render();
      return;
    case "sugload":
      if (!ui.edit) {
        ui.picked = [];
        ui.manual = {};
      }
      ui.sug.picks.forEach(addEx);
      ui.sug = null;
      renderAll();
      setTab("log");
      try {
        $("logcard").scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (er) {}
      return;
    case "bk-copy":
      ui.backup = "copy";
      ui.copied = false;
      var txt = JSON.stringify(state);
      try {
        navigator.clipboard
          .writeText(txt)
          .then(function () {
            ui.copied = true;
            render();
          })
          .catch(function () {});
      } catch (er) {}
      render();
      var ta = $("bktext");
      if (ta) {
        ta.focus();
        ta.select();
      }
      return;
    case "bk-restore":
      ui.backup = "restore";
      render();
      return;
    case "bk-cancel":
      ui.backup = null;
      render();
      return;
    case "bk-do":
      var raw = ($("bkin").value || "").trim(),
        j = null;
      try {
        j = JSON.parse(raw);
      } catch (er) {}
      if (!j || !Array.isArray(j.sessions)) {
        $("bkmsg").textContent = "That doesn’t look like a RecoveryMap backup.";
        return;
      }
      if (!t.dataset.armed) {
        t.dataset.armed = "1";
        t.textContent = "Tap again to replace " + state.sessions.length + " session(s)";
        return;
      }
      state = migrate(j);
      syncCustom();
      recomputeHours();
      ui.backup = null;
      resetLog();
      persist();
      return;
  }
});
document.addEventListener("input", function (e) {
  var t = e.target;
  if (t.matches && t.matches("#picked input[data-f]")) {
    var i = +t.getAttribute("data-i"),
      k = +t.getAttribute("data-k");
    if (ui.picked[i] && ui.picked[i].sets[k])
      ui.picked[i].sets[k][t.getAttribute("data-f")] = t.value;
    saveDraft();
  }
  if (t.id === "sname") saveDraft();
  if (t.id === "when") {
    ui.whenTouched = true;
    saveDraft();
  }
});
$("txt").addEventListener("input", function () {
  ui.q = this.value;
  ui.hi = 0;
  ui.hideRecent = false;
  renderDrop();
});
$("txt").addEventListener("focus", function () {
  ui.hideRecent = false;
  setTimeout(renderDrop, 0);
});
$("txt").addEventListener("keydown", function (e) {
  var r = ui.q.trim() ? search(ui.q).slice(0, 8) : [];
  if (e.key === "ArrowDown") {
    ui.hi = Math.min(r.length - 1, ui.hi + 1);
    renderDrop();
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    ui.hi = Math.max(0, ui.hi - 1);
    renderDrop();
    e.preventDefault();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (r[ui.hi]) {
      addEx(r[ui.hi][0]);
      ui.q = "";
      this.value = "";
      ui.hideRecent = true;
      renderAll();
    }
  } else if (e.key === "Escape") {
    $("drop").hidden = true;
  }
});
document.addEventListener("keydown", function (e) {
  if (e.target && e.target.id === "nm-in" && e.key === "Enter") {
    e.preventDefault();
    $("nm-ok").click();
  }
});
$("libq").addEventListener("input", function () {
  ui.libQ = this.value;
  renderLib();
});
$("clear").addEventListener("click", function () {
  resetLog();
  renderAll();
});
$("log").addEventListener("click", function () {
  var d = currentDraft();
  if (!Object.keys(d).length) return;
  var when = $("when").value ? new Date($("when").value).getTime() : Date.now();
  if (isNaN(when)) when = Date.now();
  var entries = ui.picked.map(cleanEntry);
  var sess = {
    id: ui.edit || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    t: when,
    ex: entries,
    muscles: d,
    h: computeHours(entries, d),
  };
  var nmv = $("sname").value.trim();
  if (nmv) sess.name = nmv;
  var prs = [],
    setsN = 0;
  entries.forEach(function (e) {
    setsN += e.sets.length;
    var top = Math.max.apply(
      null,
      [0].concat(
        e.sets.map(function (x) {
          return +x.w || 0;
        }),
      ),
    );
    var prev = bestWeight(e.n, ui.edit);
    if (top > 0 && prev > 0 && top > prev)
      prs.push("🏆 New best: " + e.n + " " + top + "kg (was " + prev + "kg)");
  });
  var before = weekStreak(Date.now()),
    hadThisWeek = state.sessions.some(function (x) {
      return x.id !== ui.edit && weekStart(x.t) === weekStart(Date.now());
    });
  var toast = null;
  if (!ui.edit && weekStart(sess.t) === weekStart(Date.now()) && !hadThisWeek && before >= 1)
    toast = { title: "🔥 " + (before + 1) + "-week streak", lines: [] };
  if (prs.length) {
    if (!toast) toast = { title: "🏆 New best", lines: [] };
    else toast.lines.push("🏆 New best");
    toast.lines = toast.lines.concat(
      prs
        .map(function (x) {
          return x.replace("🏆 New best: ", "");
        })
        .slice(0, 3),
    );
  }
  lsSet("rm.toast", toast ? { title: toast.title, lines: toast.lines, at: Date.now() } : null);
  if (ui.edit)
    state.sessions = state.sessions.map(function (s) {
      return s.id === ui.edit ? sess : s;
    });
  else state.sessions.push(sess);
  ui.rest = null;
  tickRest();
  resetLog();
  lsSet("rm.draft", null);
  setTab("body");
  showToast(lsGet("rm.toast", null));
  persist();
  flashSaved();
});
$("when").value = toLocalInput(new Date());
$("when").addEventListener("change", function () {
  ui.whenTouched = true;
  saveDraft();
});
$("when").addEventListener("blur", function () {
  $("whenbox").classList.remove("native");
  updateWhenText();
});
setInterval(render, 60000);

// Start
state = migrate(state);
loadLocal();
syncCustom();
recomputeHours();
try {
  ui.noInstall = localStorage.getItem("rm.noinstall") === "1";
} catch (e) {}
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  ui.installEvt = e;
  renderInstall();
});
renderInstall();
loadDraft();
setTab(lsGet("rm.tab", "body"));
(function () {
  var t = lsGet("rm.toast", null);
  if (t && Date.now() - t.at < 20000) showToast(t);
  lsSet("rm.toast", null);
})();
renderAll();
$("save").textContent = "Saved on this device";
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
