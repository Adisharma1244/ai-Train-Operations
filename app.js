/* Indian Railways AI Block Planning Engine - frontend only (no Firebase) */
(function () {
  "use strict";

  /* ---------- Config ---------- */
  // Paste your key here for local testing only. Never commit or publish a real key:
  // anything in browser JavaScript can be read by every visitor.


  /* ---------- Stations & routes ---------- */
  const STATIONS = {
    "Delhi":         [28.6619, 77.2274],
    "Meerut":        [28.9845, 77.7064],
    "Muzaffarnagar": [29.4727, 77.7085],
    "Roorkee":       [29.8543, 77.8880],
    "Haridwar":      [29.9457, 78.1642],
    "Dehradun":      [30.3165, 78.0322]
  };
  const STATION_ORDER = ["Delhi", "Meerut", "Muzaffarnagar", "Roorkee", "Haridwar", "Dehradun"];

  // Builds a NEW coordinate array for the journey from one station to another along the main line.
  function makeRoute(from, to) {
    const i = STATION_ORDER.indexOf(from);
    const j = STATION_ORDER.indexOf(to);
    const names = i <= j ? STATION_ORDER.slice(i, j + 1) : STATION_ORDER.slice(j, i + 1).reverse();
    return names.map((n) => STATIONS[n]);
  }

  function stationName(ll) {
    return Object.keys(STATIONS).find((k) => STATIONS[k] === ll) || "";
  }

  /* ---------- Data ---------- */
  const trains = [
    { no: "12017",  name: "Dehradun Shatabdi",       route: "New Delhi - Dehradun",  arr: "11:45", dep: "06:45", pri: "High",   delay: 0, coords: makeRoute("Delhi", "Dehradun") },
    { no: "12055",  name: "Jan Shatabdi",            route: "Delhi - Dehradun",      arr: "22:35", dep: "17:50", pri: "High",   delay: 0, coords: makeRoute("Delhi", "Dehradun") },
    { no: "12205",  name: "Nanda Devi SF Express",   route: "Delhi - Dehradun",      arr: "05:30", dep: "22:50", pri: "High",   delay: 0, coords: makeRoute("Delhi", "Dehradun") },
    { no: "14041",  name: "Mussoorie Express",       route: "Delhi - Dehradun",      arr: "07:10", dep: "21:25", pri: "Medium", delay: 0, coords: makeRoute("Delhi", "Dehradun") },
    { no: "19019",  name: "Dehradun Express",        route: "Delhi - Dehradun",      arr: "05:25", dep: "22:30", pri: "Medium", delay: 0, coords: makeRoute("Delhi", "Dehradun") },
    { no: "12687",  name: "Devbhumi SF Express",     route: "Delhi - Dehradun",      arr: "06:15", dep: "23:40", pri: "High",   delay: 0, coords: makeRoute("Delhi", "Dehradun") },
    { no: "14317",  name: "Dehradun Indore Express", route: "Dehradun - Delhi",      arr: "14:20", dep: "09:05", pri: "Medium", delay: 0, coords: makeRoute("Dehradun", "Delhi") },
    { no: "54471",  name: "Haridwar Passenger",      route: "Delhi - Haridwar",      arr: "16:10", dep: "11:30", pri: "Low",    delay: 0, coords: makeRoute("Delhi", "Haridwar") },
    { no: "54035",  name: "Dehradun Passenger",      route: "Delhi - Dehradun",      arr: "13:05", dep: "08:40", pri: "Low",    delay: 0, coords: makeRoute("Delhi", "Dehradun") },
    { no: "22659",  name: "Dehradun Kochuveli SF",   route: "Dehradun - Delhi",      arr: "20:10", dep: "15:30", pri: "Medium", delay: 0, coords: makeRoute("Dehradun", "Delhi") },
    { no: "13009",  name: "Doon Express",            route: "Dehradun - Delhi",      arr: "08:50", dep: "03:15", pri: "Medium", delay: 0, coords: makeRoute("Dehradun", "Delhi") },
    { no: "DLI-F4", name: "Freight BCNA Rake",       route: "Delhi - Dehradun",      arr: "02:40", dep: "21:00", pri: "Low",    delay: 0, coords: makeRoute("Delhi", "Dehradun") }
  ];

  // Each section is a stretch (t0..t1) of the line between two neighbouring stations.
  const sections = {
    "1A": { label: "Track 1A - Haridwar Outer",  from: "Roorkee",  to: "Haridwar", t0: 0.60, t1: 1.00, start: "01:10" },
    "2B": { label: "Track 2B - Raiwala Yard",    from: "Haridwar", to: "Dehradun", t0: 0.10, t1: 0.35, start: "01:40" },
    "3C": { label: "Track 3C - Doiwala Section", from: "Haridwar", to: "Dehradun", t0: 0.60, t1: 0.85, start: "00:50" },
    "4D": { label: "Track 4D - Roorkee Up Line", from: "Roorkee",  to: "Haridwar", t0: 0.00, t1: 0.40, start: "01:25" },
    "5E": { label: "Track 5E - Laksar Junction", from: "Roorkee",  to: "Haridwar", t0: 0.40, t1: 0.60, start: "02:00" }
  };

  /* ---------- Helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const pad = (n) => (n < 10 ? "0" : "") + n;

  function addMin(hhmm, m) {
    const p = hhmm.split(":");
    let v = Number(p[0]) * 60 + Number(p[1]) + m;
    v = ((v % 1440) + 1440) % 1440;
    return pad(Math.floor(v / 60)) + ":" + pad(v % 60);
  }
  function fmtDur(m) {
    m = Math.round(m);
    return m % 60 === 0 ? m / 60 + "h" : Math.floor(m / 60) + "h " + (m % 60) + "m";
  }
  function nowHHMM() {
    const d = new Date();
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function log(msg) {
    const d = el("div", "", nowHHMM() + "  " + msg);
    const box = $("log");
    box.insertBefore(d, box.firstChild);
  }
  let toastTimer;
  function toast(msg, isErr) {
    const t = $("toast");
    t.textContent = msg;
    t.className = "show" + (isErr ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ""; }, 3600);
  }

  /* ---------- Train list ---------- */
  function renderTrains() {
    const ul = $("trainList");
    ul.innerHTML = "";

    trains.forEach((t) => {
      const li = el("li", "train" + (t.delay >= 30 ? " delayed" : t.delay > 0 ? " warn" : ""));
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-label", "Show route map for train " + t.no + " " + t.name);

      li.appendChild(el("span", "tno", t.no));

      const nameEl = el("span", "tname", t.name);
      if (t.delay > 0) {
        const badge = el("span", "badge " + (t.delay >= 30 ? "b-red" : "b-amber"), "DELAYED (+" + t.delay + "M)");
        badge.style.marginLeft = "8px";
        badge.style.padding = "1px 8px";
        badge.style.fontSize = "11px";
        nameEl.appendChild(badge);
      }
      li.appendChild(nameEl);

      li.appendChild(el("span", "tag p-" + t.pri, t.pri));
      li.appendChild(el("span", "troute", t.route));

      const time = el("span", "ttime", "Arr " + addMin(t.arr, t.delay) + " \u00b7 Dep " + addMin(t.dep, t.delay));
      time.title = "Scheduled Arr " + t.arr + " \u00b7 Dep " + t.dep;
      if (t.delay > 0) time.style.color = t.delay >= 30 ? "var(--red)" : "var(--amber)";
      li.appendChild(time);

      // click listener on every train card
      li.addEventListener("click", () => openMapForTrain(t));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMapForTrain(t); }
      });
      ul.appendChild(li);
    });

    const delayed = trains.filter((t) => t.delay > 0).length;
    const worst = Math.max.apply(null, trains.map((t) => t.delay));
    $("mDelay").textContent = delayed;
    $("mPunct").textContent = (98.4 - delayed * 1.7).toFixed(1) + "%";
    const b = $("tmBadge");
    if (worst >= 30) { b.className = "badge b-red"; b.textContent = "High conflict"; }
    else if (delayed) { b.className = "badge b-amber"; b.textContent = "Minor delays"; }
    else { b.className = "badge b-green"; b.textContent = "All running"; }
  }

  /* ---------- Leaflet map ---------- */
  let map = null;

  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

  function sectionLine(key) {
    const s = sections[key];
    const a = STATIONS[s.from], b = STATIONS[s.to];
    return [lerp(a, b, s.t0), lerp(a, b, s.t1)];
  }

  // True when the train's own route runs over the two stations that bound the section.
  function trainUsesSection(train, key) {
    const s = sections[key];
    const a = STATIONS[s.from], b = STATIONS[s.to];
    for (let i = 0; i < train.coords.length - 1; i++) {
      const p = train.coords[i], q = train.coords[i + 1];
      if ((p === a && q === b) || (p === b && q === a)) return true;
    }
    return false;
  }

  function openMapForTrain(train) {
    const key = $("track").value;
    const modal = $("mapModal");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    // Remove any existing map instance (and with it every old polyline and marker)
    if (map) {
      map.remove();
      map = null;
    }

    map = L.map("map", { zoomControl: true });
    const thisMap = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(thisMap);

    // Route drawn strictly from this train's own coordinates
    const routeLine = L.polyline(train.coords, { color: "#4cc3ff", weight: 5, opacity: 0.9 }).addTo(thisMap);
    routeLine.bindTooltip(train.route, { sticky: true });

    // Station markers for the stops on this train's route only
    train.coords.forEach((ll, idx) => {
      const last = idx === train.coords.length - 1;
      L.circleMarker(ll, {
        radius: last ? 8 : 6,
        color: "#0a1220",
        weight: 2,
        fillColor: last ? "#ffb62e" : "#e4ebf5",
        fillOpacity: 1
      }).addTo(thisMap).bindTooltip(stationName(ll) + (last ? " (destination)" : ""), {
        permanent: true,
        direction: "right",
        offset: [8, 0],
        className: "st-label"
      });
    });

    // Selected maintenance section in red, only if this train actually runs over it
    const onRoute = trainUsesSection(train, key);
    if (onRoute) {
      L.polyline(sectionLine(key), { color: "#ff4d5e", weight: 9, opacity: 1 })
        .addTo(thisMap)
        .bindTooltip(sections[key].label + " (block section)", { sticky: true });
    }

    let sub = train.route + " \u00b7 Block section: " + sections[key].label +
      (onRoute ? "" : " (not on this train's route)");
    if (train.delay > 0) sub += " \u00b7 DELAYED (+" + train.delay + "M)";
    $("mapTitle").textContent = train.no + " " + train.name;
    $("mapSub").textContent = sub;

    // Zoom to this train's journey
    thisMap.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    // The modal is still fading in: refresh the size and refit once it is fully visible
    setTimeout(() => {
      if (map === thisMap) {
        thisMap.invalidateSize();
        thisMap.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
      }
    }, 300);

    $("mapClose").focus();
  }

  function closeMap() {
    const modal = $("mapModal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  $("mapClose").addEventListener("click", closeMap);
  $("mapModal").addEventListener("click", (e) => { if (e.target === $("mapModal")) closeMap(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMap(); });

  /* ---------- Planner ---------- */
  let planned = null;
  let busy = false;

  function readForm() {
    const key = $("track").value;
    return {
      trackKey: key,
      trackLabel: sections[key].label,
      duration: Number($("dur").value),
      depts: Array.prototype.slice.call(document.querySelectorAll("input[name=dept]:checked")).map((c) => c.value),
      emergency: $("emerg").checked
    };
  }

  function delayedTrains() {
    return trains.filter((t) => t.delay > 0);
  }

  function buildPrompt(f) {
    const sched = trains.map((t) =>
      t.no + " " + t.name + " | " + t.route +
      " | scheduled arr " + t.arr + " dep " + t.dep +
      " | expected arr " + addMin(t.arr, t.delay) + " dep " + addMin(t.dep, t.delay) +
      " | priority " + t.pri +
      " | status " + (t.delay ? "DELAYED +" + t.delay + " min" : "on time")
    ).join("\n");

    const late = delayedTrains();
    let delayNote = "";
    if (late.length) {
      delayNote = "\nLIVE DELAY ALERT: " + late.map((t) => t.no + " " + t.name + " is delayed by " + t.delay + " min").join("; ") +
        ". Use the EXPECTED times, not the scheduled ones. Shift the maintenance window so it does not overlap " +
        "the revised paths of delayed High or Medium priority trains, and mention the shift in slot_reason.\n";
    }
    if (planned) {
      delayNote += "Previously planned slot for reference: " + planned.start + "-" + planned.end + " on " + planned.label + ".\n";
    }

    return "You are a railway traffic block planner for the Delhi-Dehradun corridor of Indian Railways.\n" +
      "Find the best maintenance 'shadow slot' (a gap between trains) for the request below.\n\n" +
      "REQUEST:\n" +
      "- Track section: " + f.trackLabel + "\n" +
      "- Requested duration: " + f.duration + " minutes\n" +
      "- Departments: " + (f.depts.join(", ") || "none") + "\n" +
      "- Emergency breakdown: " + (f.emergency ? "YES" : "NO") + "\n" +
      "- Current time: " + nowHHMM() + "\n\n" +
      "TRAIN SCHEDULE (times are 24h HH:MM):\n" + sched + "\n" + delayNote + "\n" +
      "Prefer slots that avoid High priority trains. Combine department work into one joint block.\n" +
      "Respond ONLY with a JSON object with exactly these keys:\n" +
      "{\n" +
      '  "slot_start": "HH:MM",\n' +
      '  "slot_end": "HH:MM",\n' +
      '  "confidence": number 0-100,\n' +
      '  "slot_reason": "one or two sentences",\n' +
      '  "instructions": ["speed regulation or rerouting instruction", "..."],\n' +
      '  "manual_block_minutes": number,\n' +
      '  "downtime_saved_minutes": number,\n' +
      '  "trains_zero_delay": number,\n' +
      '  "trains_impacted": number\n' +
      "}";
  }

  // Offline planner used when no API key is set or the API call fails.
  // It also shifts the block window when a live delay is active.
  function localPlan(f) {
    const late = delayedTrains();
    let shift = 0;
    let worst = null;
    if (!f.emergency) {
      late.forEach((t) => {
        const s = t.pri === "Low" ? 10 : t.delay;
        if (s > shift) { shift = s; worst = t; }
      });
    }

    const baseStart = sections[f.trackKey].start;
    const start = f.emergency ? addMin(nowHHMM(), 20) : addMin(baseStart, shift);
    const impacted = f.emergency ? 2 : 0;
    const manual = f.duration + Math.round(f.duration * 0.38) + (f.depts.length > 2 ? 20 : 0);

    let reason = (f.emergency
      ? "Emergency window opens after the next clear path. "
      : "Night traffic gap with no High priority train in the section. ") +
      f.depts.join(", ") + " work is combined into one joint block on " + f.trackLabel + ".";
    if (worst) {
      reason += " Block moved +" + shift + " min to clear the revised path of " + worst.no + " " + worst.name +
        " (delayed +" + worst.delay + " min).";
    }

    let instructions = f.emergency ? [
      "Apply a 30 km/h caution order on the adjacent line until the block ends.",
      "Reroute 2 Low priority services via the loop line at Laksar Junction.",
      "Hold freight rake DLI-F4 at Roorkee for up to 60 minutes."
    ] : [
      "Impose a 40 km/h speed restriction 20 minutes before and after the block.",
      "Divert freight rake DLI-F4 via the loop line at Laksar Junction.",
      "Pre-position the OHE tower wagon and signal gang at the section boundary."
    ];
    if (worst) {
      instructions = ["Start the block only after " + worst.no + " " + worst.name + " clears the section (expected " +
        addMin(worst.dep, worst.delay) + ")."].concat(instructions);
    }

    return {
      slot_start: start,
      slot_end: addMin(start, f.duration),
      confidence: f.emergency ? 91 : (worst ? 93 : 96),
      slot_reason: reason,
      instructions: instructions,
      manual_block_minutes: manual,
      downtime_saved_minutes: manual - f.duration + (f.emergency ? 0 : 10),
      trains_zero_delay: Math.max(0, trains.length - late.length - impacted),
      trains_impacted: impacted
    };
  }

  async function callGroq(f) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are an expert Indian Railways block planner. Reply with valid JSON only." },
          { role: "user", content: buildPrompt(f) }
        ]
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error("Groq HTTP " + res.status + " " + body.slice(0, 120));
    }
    const data = await res.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return JSON.parse(content);
  }

  function normalise(raw, f) {
    const fb = localPlan(f);
    const timeOk = (s) => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
    const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
    const start = timeOk(raw.slot_start) ? raw.slot_start : fb.slot_start;
    const end = timeOk(raw.slot_end) ? raw.slot_end : addMin(start, f.duration);
    const instr = Array.isArray(raw.instructions) ? raw.instructions.filter((x) => typeof x === "string").slice(0, 5) : [];
    return {
      slot_start: start,
      slot_end: end,
      confidence: Math.max(0, Math.min(100, Math.round(num(raw.confidence, fb.confidence)))),
      slot_reason: typeof raw.slot_reason === "string" ? raw.slot_reason : fb.slot_reason,
      instructions: instr.length ? instr : fb.instructions,
      manual_block_minutes: num(raw.manual_block_minutes, fb.manual_block_minutes),
      downtime_saved_minutes: num(raw.downtime_saved_minutes, fb.downtime_saved_minutes),
      trains_zero_delay: num(raw.trains_zero_delay, fb.trains_zero_delay),
      trains_impacted: num(raw.trains_impacted, fb.trains_impacted)
    };
  }

  function renderPlan(p, f, source, previous) {
    planned = { key: f.trackKey, label: f.trackLabel, start: p.slot_start, end: p.slot_end };

    let src = source;
    if (previous && (previous.start !== p.slot_start || previous.end !== p.slot_end)) {
      src += " \u00b7 Window shifted from " + previous.start + "\u2013" + previous.end +
        " to " + p.slot_start + "\u2013" + p.slot_end;
    }
    $("source").textContent = src;
    $("slotTime").textContent = p.slot_start + " \u2013 " + p.slot_end;
    $("slotNote").textContent = p.slot_reason;
    $("conf").textContent = p.confidence + "% confidence";

    const ul = $("instr");
    ul.innerHTML = "";
    p.instructions.forEach((i) => ul.appendChild(el("li", "", i)));
    $("impactTag").textContent = p.trains_impacted > 0 ? Math.round(p.trains_impacted) + " trains regulated" : "Advisory";

    $("kSaved").textContent = Math.round(p.downtime_saved_minutes) + " min";
    $("kSavedCmp").textContent = "vs " + fmtDur(p.manual_block_minutes) + " manual block";
    $("kZero").textContent = Math.round(p.trains_zero_delay) + " trains";
    $("kZeroCmp").textContent = p.trains_impacted > 0 ? Math.round(p.trains_impacted) + " trains regulated" : "No new delays from the block";
    $("kBefore").textContent = fmtDur(p.manual_block_minutes);
    $("kAfter").textContent = fmtDur(f.duration);

    $("spin").classList.remove("show");
    $("out").classList.add("show");
    $("lockBtn").disabled = false;
    $("lockBtn").textContent = "APPROVE & LOCK BLOCK";

    const b = $("opBadge");
    if (f.emergency || p.trains_impacted > 0) { b.className = "badge b-amber"; b.textContent = "Plan ready - review"; }
    else { b.className = "badge b-green"; b.textContent = "Conflict-free"; }
  }

  async function runPlanner(opts) {
    opts = opts || {};
    if (busy) return;
    const f = readForm();
    if (!f.depts.length) { toast("Select at least one department.", true); return; }

    busy = true;
    $("runBtn").disabled = true;
    $("delayBtn").disabled = true;
    $("empty").style.display = "none";
    $("out").classList.remove("show");
    $("spin").classList.add("show");
    $("opBadge").className = "badge b-amber";
    $("opBadge").textContent = opts.replan ? "Re-planning" : "Planning";

    const previous = opts.replan && planned ? { start: planned.start, end: planned.end } : null;
    log((opts.replan ? "Re-plan started with updated delays: " : "Planner started: ") +
      f.trackLabel + ", " + fmtDur(f.duration) + ", " + f.depts.length + " dept(s)" + (f.emergency ? ", EMERGENCY" : "") + ".");

    let plan, source;
    try {
      if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
        throw new Error("No Groq API key set");
      }
      plan = normalise(await callGroq(f), f);
      source = "Generated by Groq (" + GROQ_MODEL + ")";
      log("Groq plan received: " + plan.slot_start + "-" + plan.slot_end + ".");
    } catch (err) {
      plan = localPlan(f);
      source = "Offline planner (Groq unavailable: " + err.message + ")";
      log("Groq call failed, using offline planner. " + err.message);
      // A live alert toast must stay visible after a delay, so only warn on manual runs.
      if (!opts.replan) toast("Groq unavailable - showing offline plan.", true);
    }

    renderPlan(plan, f, source, previous);
    busy = false;
    $("runBtn").disabled = false;
    $("delayBtn").disabled = false;
  }

  /* ---------- Buttons ---------- */
  $("emerg").addEventListener("change", function () {
    $("emState").textContent = this.checked ? "Yes" : "No";
    $("emState").style.color = this.checked ? "var(--red)" : "";
  });

  $("runBtn").addEventListener("click", () => runPlanner({}));

  $("delayBtn").addEventListener("click", function () {
    if (busy) return;

    // One simulated delay is active at a time: clear the previous one first
    trains.forEach((t) => { t.delay = 0; });

    // Pick any random train from the list
    const t = trains[Math.floor(Math.random() * trains.length)];
    t.delay = DELAY_MINUTES;
    renderTrains();

    log("LIVE ALERT: " + t.no + " " + t.name + " delayed by " + DELAY_MINUTES + " min. Expected arr " +
      addMin(t.arr, t.delay) + ", dep " + addMin(t.dep, t.delay) + ".");
    toast("LIVE ALERT: " + t.name + " delayed by " + DELAY_MINUTES + " mins!", true);

    // Re-run the AI planner with the updated, delayed schedule
    runPlanner({ replan: true });
  });

  let blocks = 3;
  $("lockBtn").addEventListener("click", function () {
    if (!planned) return;
    blocks += 1;
    $("mBlocks").textContent = blocks;
    this.disabled = true;
    this.textContent = "BLOCK LOCKED";
    $("opBadge").className = "badge b-green";
    $("opBadge").textContent = "Locked";
    log("Block locked: " + planned.label + " " + planned.start + "-" + planned.end + ".");
    toast("Block Approved & Locked for Track " + planned.key);
  });

  /* ---------- Clock + init ---------- */
  function tick() {
    const d = new Date();
    $("clock").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + " IST";
  }
  tick();
  setInterval(tick, 1000);
  renderTrains();
})();