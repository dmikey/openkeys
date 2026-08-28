"use strict";

const $ = selector => document.querySelector(selector);
const els = {
  title: $("#song-title"), composer: $("#song-composer"), midi: $("#midi-input"), track: $("#notes-track"), counts: $("#count-strip"),
  targetName: $("#target-name"), targetOctave: $("#target-octave"), targetHand: $("#target-hand"), heardNote: $("#heard-note"), heardCents: $("#heard-cents"),
  pitchIndicator: $("#pitch-indicator"), mic: $("#mic-button"), reference: $("#reference-button"), hearPhrase: $("#hear-phrase"), restart: $("#restart-button"),
  statusTitle: $("#status-title"), statusCopy: $("#status-copy"), followStatus: $(".follow-status"), progressText: $("#progress-text"), progressBar: $("#progress-bar"),
  celebration: $("#celebration"), toast: $("#toast"), help: $("#help-dialog"), settings: $("#settings-button"), dialogClose: $("#dialog-close"),
  library: $("#library-dialog"), libraryButton: $("#library-button"), libraryClose: $("#library-close"), lessonGrid: $("#lesson-grid"),
  phraseList: $("#phrase-list"), lessonHeading: $("#lesson-heading"), partLabel: $("#part-label"), xpTotal: $("#xp-total"),
  physicalKeyboard: $("#physical-keyboard"), positionHint: $("#position-hint"), handName: $("#hand-name"), fingerNumber: $("#finger-number"),
  fingerName: $("#finger-name"), fingerDots: $("#finger-dots"), fingerPath: $("#finger-path"), comboValue: $("#combo-value")
};

const AudioContext = window.AudioContext || window.webkitAudioContext;
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const ACCEPTANCE_CENTS = 49;
const MATCHES_NEEDED = 2;
const MATCH_WINDOW = 4;
const makeNotes = (pitches, beat = .5) => pitches.map((midi, i) => ({ midi, start: i * beat, duration: beat * .88, velocity: .75 }));
const LESSONS = [
  { id:"ode", name:"Ode to Joy", composer:"L. van Beethoven", level:"Beginner", reward:150, cover:"joy", glyph:"♪", fingers:[3,3,4,5,5,4,3,2,1,1,2,3,3,2,2,3,3,4,5,5,4,3,2,1,1,2,3,2,1,1], pitches:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60] },
  { id:"twinkle", name:"Twinkle, Twinkle", composer:"Traditional French melody", level:"Beginner", reward:120, cover:"twinkle", glyph:"✦", fingers:[1,1,4,4,5,5,4,3,3,2,2,1,1,1,4,4,3,3,2,2,1,4,4,3,3,2,2,1,1,1,4,4,5,5,4,3,3,2,2,1,1,1], pitches:[60,60,67,67,69,69,67,65,65,64,64,62,62,60,67,67,65,65,64,64,62,67,67,65,65,64,64,62,60,60,67,67,69,69,67,65,65,64,64,62,62,60] },
  { id:"jingle", name:"Jingle Bells", composer:"James Lord Pierpont", level:"Beginner", reward:140, cover:"bells", glyph:"♬", pitches:[64,64,64,64,64,64,64,67,60,62,64,65,65,65,65,65,64,64,64,64,62,62,64,62,67,64,64,64,64,64,64,64,67,60,62,64] },
  { id:"fur", name:"Für Elise", composer:"L. van Beethoven", level:"Intermediate", reward:250, cover:"fur", glyph:"E", fingers:[5,4,5,4,5,3,4,2,1,1,2,4,5,1,3,5,1,2,5,4,5,4,5,3,4,2,1,1,2,4,5,1,2,1,1], pitches:[76,75,76,75,76,71,74,72,69,60,64,69,71,64,68,71,72,64,76,75,76,75,76,71,74,72,69,60,64,69,71,64,72,71,69] },
  { id:"mozart", name:"Eine kleine Nachtmusik", composer:"W. A. Mozart", level:"Intermediate", reward:280, cover:"mozart", glyph:"M", pitches:[67,74,67,74,67,74,67,71,74,71,74,71,67,71,67,71,67,66,64,66,64,62,64,62,59,62,67,66,64,66,67,71,74] },
  { id:"bach", name:"Prelude in C Major", composer:"J. S. Bach", level:"Intermediate", reward:300, cover:"bach", glyph:"B", pitches:[60,64,67,72,76,67,72,76,60,62,69,74,77,69,74,77,59,62,67,74,77,67,74,77,60,64,67,72,76,67,72,76] },
  { id:"aria-math", name:"Aria Math", composer:"C418", level:"Advanced", category:"game", reward:600, cover:"aria", glyph:"◇", sourceUrl:"https://onlinesequencer.net/1427781", arrangerUrl:"https://onlinesequencer.net/members/26737", sourceLabel:"Modified MIDI Import · 4/10/2020", pitches:[76,67,64,76,71,71,76,76,76,76,76,76,76,76,83,67,71,67,71,76,71,71,72,71,72,71,72,67,67,67,72,76,71,64,67,67,71,67,64,76,76,72,71,64,67,71,76,79,72,71,71,64,64,64,76,64,64,64,76,71,72,71,64,67,64,64,64,71,71,64,71,64,64,71,64,71,71,64,71,64,64,66,67,66,67,66,62,64,67,64,67,67,64,76,83,71,67,74,66,71,71,67,74,66,71,71,67,74,66,71,76,67,79,78,76,74,76,67,79,79,81,79,78,74,76,83,76,67,79,79,81,79,78,74,76,69,74,71,69,74,71,69,71,69,71,69,71,69,71,69,71,69,71,69,71,69,71,69,71,71,67,74,71,66,64,71,83,67,74,71,66,64,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76,83,76,79,78,79,83,76,86,83,78,76] }
].map(lesson => ({...lesson, notes:makeNotes(lesson.pitches)}));
let song = LESSONS[0];
let game = (() => { try { return JSON.parse(localStorage.getItem("openkeys-progress")) || {xp:0, lessons:{}}; } catch (_) { return {xp:0, lessons:{}}; } })();
let currentIndex = 0, audioContext, masterGain, micStream, micFrame, listening = false, correctFrames = 0, wrongFrames = 0, combo = 0, matchHistory = [], lastAnalysis = 0;

function noteName(midi) { return NOTE_NAMES[((midi % 12) + 12) % 12]; }
function noteOctave(midi) { return Math.floor(midi / 12) - 1; }
function noteLabel(midi) { return `${noteName(midi)}${noteOctave(midi)}`; }
function frequencyFor(midi) { return 440 * 2 ** ((midi - 69) / 12); }

function initAudio() {
  if (!AudioContext) return false;
  if (!audioContext) { audioContext = new AudioContext(); masterGain = audioContext.createGain(); masterGain.gain.value = .32; masterGain.connect(audioContext.destination); }
  if (audioContext.state === "suspended") audioContext.resume();
  return true;
}

function playTone(midi, when = 0, duration = .55, velocity = .75) {
  if (!initAudio()) return;
  const start = audioContext.currentTime + when, osc = audioContext.createOscillator(), overtone = audioContext.createOscillator();
  const gain = audioContext.createGain(), overGain = audioContext.createGain();
  osc.type = "triangle"; osc.frequency.value = frequencyFor(midi); overtone.type = "sine"; overtone.frequency.value = frequencyFor(midi) * 2;
  gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.2 * velocity, start + .02); gain.gain.exponentialRampToValueAtTime(.0001, start + duration + .25);
  overGain.gain.setValueAtTime(.0001, start); overGain.gain.exponentialRampToValueAtTime(.035 * velocity, start + .015); overGain.gain.exponentialRampToValueAtTime(.0001, start + duration * .7);
  osc.connect(gain).connect(masterGain); overtone.connect(overGain).connect(masterGain); osc.start(start); overtone.start(start); osc.stop(start + duration + .3); overtone.stop(start + duration + .1);
}

function staffY(midi) {
  const degree = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 }[midi % 12] ?? 0;
  return `${-((noteOctave(midi) - 4) * 7 + degree - 2) * 12.5}px`;
}

function saveGame() { try { localStorage.setItem("openkeys-progress", JSON.stringify(game)); } catch (_) {} }

function sectionSize() {
  if (song.notes.length > 160) return Math.ceil(song.notes.length / 5 / 16) * 16;
  if (song.notes.length > 64) return 32;
  return 16;
}

function renderPhrases() {
  const size = sectionSize(), count = Math.ceil(song.notes.length / size), active = Math.min(count - 1, Math.floor(currentIndex / size));
  const stageNames = ["Opening", "Build", "Core theme", "Variation", "Finale"];
  els.phraseList.innerHTML = ""; els.partLabel.textContent = `PART ${active + 1} OF ${count}`; els.lessonHeading.textContent = song.name;
  for (let i = 0; i < count; i++) {
    const start = i * size + 1, end = Math.min(song.notes.length, (i + 1) * size), item = document.createElement("li");
    if (i === active) item.className = "active";
    const label = count <= 2 ? (i === 0 ? "Opening phrase" : "Final phrase") : (stageNames[i] || `Stage ${i + 1}`);
    item.innerHTML = `<span class="phrase-number">${String(i + 1).padStart(2,"0")}</span><div><strong>${label}</strong><small>Notes ${start}–${end}</small></div>${i === active ? '<span class="phrase-state" aria-label="In progress"></span>' : ''}`;
    els.phraseList.append(item);
  }
}

function renderLibrary(filter = "all") {
  els.lessonGrid.innerHTML = "";
  const visible = LESSONS.filter(lesson => filter === "all" || (filter === "game" ? lesson.category === "game" : lesson.level.toLowerCase() === filter));
  let lastSection = "";
  visible.forEach(lesson => {
    const section = lesson.category === "game" ? "Game music · Community MIDI" : "Public-domain essentials";
    if (filter === "all" && section !== lastSection) { const heading = document.createElement("h3"); heading.className = "library-section-label"; heading.textContent = section; els.lessonGrid.append(heading); lastSection = section; }
    const record = game.lessons[lesson.id] || {}, progress = Math.round((record.best || 0) / lesson.notes.length * 100), stars = record.stars || 0;
    const card = document.createElement("article"); card.className = "lesson-card"; card.dataset.lesson = lesson.id; card.tabIndex = 0; card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Learn ${lesson.name} by ${lesson.composer}`);
    const attribution = lesson.sourceUrl ? `<p class="attribution"><a href="${lesson.sourceUrl}" target="_blank" rel="noreferrer">${lesson.sourceLabel}</a> by <a href="${lesson.arrangerUrl}" target="_blank" rel="noreferrer">Mr. Magicman</a></p>` : "";
    card.innerHTML = `<div class="lesson-cover cover-${lesson.cover}"><span class="cover-glyph">${lesson.glyph}</span><span class="cover-badge">${lesson.category === "game" ? "MINECRAFT" : "OPENKEYS"}</span></div><div class="lesson-card-body"><div class="lesson-card-top"><div><h3>${lesson.name}</h3><p class="composer">${lesson.composer}</p>${attribution}</div><span class="difficulty">${lesson.level}</span></div><div class="card-stats"><span>${lesson.notes.length} notes</span><span>${progress}% learned</span><span class="reward">+${lesson.reward} XP</span><span class="card-stars">${[1,2,3].map(n => `<i class="${n <= stars ? "earned" : ""}">★</i>`).join("")}</span></div></div>`;
    card.addEventListener("click", event => { if (!event.target.closest("a")) selectLesson(lesson.id); }); card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectLesson(lesson.id); } }); els.lessonGrid.append(card);
  });
}

function selectLesson(id) {
  const lesson = LESSONS.find(item => item.id === id); if (!lesson) return;
  stopListening(); song = lesson; currentIndex = 0; correctFrames = 0; wrongFrames = 0; combo = 0; matchHistory = []; els.comboValue.textContent = "×0"; els.title.textContent = lesson.name; els.composer.textContent = `${lesson.composer} · ${lesson.level}`;
  els.statusTitle.textContent = "Ready to listen"; els.statusCopy.textContent = "Turn on your microphone to begin"; render(); els.library.close(); showToast(`${lesson.name} is ready to learn`);
}

function suggestedFinger(midi, index) {
  if (song.fingers?.[index]) return song.fingers[index];
  const right = midi >= 60, pitch = midi % 12;
  const rightMap = {0:1,1:2,2:2,3:3,4:3,5:4,6:4,7:5,8:3,9:4,10:4,11:5};
  const leftMap = {0:5,1:4,2:4,3:3,4:3,5:2,6:2,7:1,8:3,9:2,10:2,11:1};
  return (right ? rightMap : leftMap)[pitch] || 3;
}

function positionHint(midi) {
  if (midi === 60) return "This is Middle C";
  if ([1,3,6,8,10].includes(midi % 12)) {
    const lower = noteName(midi - 1).replace("♯", ""), upper = noteName(midi + 1).replace("♯", "");
    return `Black key between ${lower} and ${upper}`;
  }
  const degrees = {0:0,2:1,4:2,5:3,7:4,9:5,11:6}, whiteIndex = note => noteOctave(note) * 7 + degrees[note % 12];
  const distance = whiteIndex(midi) - whiteIndex(60), side = distance > 0 ? "right" : "left", amount = Math.abs(distance);
  return `${amount === 1 ? "One" : amount} white key${amount === 1 ? "" : "s"} ${side} of Middle C`;
}

function renderPlacement(target) {
  const midi = target.midi, finger = suggestedFinger(midi, currentIndex), right = midi >= 60, fingerNames = ["Thumb","Index","Middle","Ring","Pinky"];
  els.positionHint.textContent = positionHint(midi); els.handName.textContent = right ? "Right hand" : "Left hand"; els.fingerNumber.textContent = finger; els.fingerName.textContent = fingerNames[finger - 1];
  [...els.fingerDots.children].forEach((dot, index) => dot.classList.toggle("active", index + 1 === finger));
  els.physicalKeyboard.innerHTML = ""; const min = midi < 60 ? 48 : midi > 83 ? 72 : 60, max = min + 23, whites = [];
  for (let note = min; note <= max; note++) if (![1,3,6,8,10].includes(note % 12)) whites.push(note);
  whites.forEach(note => { const key = document.createElement("i"); key.className = `guide-key white${note === midi ? " target" : ""}${note === 60 ? " middle-c" : ""}`; key.dataset.note = noteLabel(note); if (note === midi) key.dataset.finger = finger; els.physicalKeyboard.append(key); });
  whites.forEach((note, index) => {
    if (note < max && [0,2,5,7,9].includes(note % 12)) { const blackMidi = note + 1, key = document.createElement("i"); key.className = `guide-key black${blackMidi === midi ? " target" : ""}`; key.style.left = `${(index + 1) / whites.length * 100}%`; key.dataset.note = noteLabel(blackMidi); if (blackMidi === midi) key.dataset.finger = finger; els.physicalKeyboard.append(key); }
  });
  els.fingerPath.innerHTML = "";
  song.notes.slice(currentIndex, currentIndex + 4).forEach((note, offset) => {
    const step = document.createElement("span"); step.className = `finger-step${offset === 0 ? " current" : ""}`;
    const dot = document.createElement("i"), label = document.createElement("small");
    dot.textContent = suggestedFinger(note.midi, currentIndex + offset); label.textContent = noteLabel(note.midi);
    step.append(dot, label); els.fingerPath.append(step);
  });
}

function render() {
  const notes = song.notes, total = notes.length, target = notes[currentIndex];
  els.track.innerHTML = ""; els.counts.innerHTML = "";
  const positions = [-10, 7, 32, 50, 67, 83, 97];
  for (let offset = -2; offset <= 4; offset++) {
    const index = currentIndex + offset; if (index < 0 || index >= total) continue;
    const note = notes[index], x = positions[offset + 2];
    const dot = document.createElement("i"); dot.className = `score-note ${offset === 0 ? "current" : offset < 0 ? "past" : "future"}`;
    dot.style.setProperty("--x", `${x}%`); dot.style.setProperty("--y", staffY(note.midi)); els.track.append(dot);
    const label = document.createElement("span"); label.className = "note-letter"; label.textContent = noteLabel(note.midi);
    label.style.setProperty("--x", `${x}%`); label.style.setProperty("--y", staffY(note.midi)); els.track.append(label);
  }
  for (let i = 0; i < 6; i++) { const count = document.createElement("span"); count.textContent = String(currentIndex + i + 1).padStart(2, "0"); els.counts.append(count); }
  if (target) { els.targetName.textContent = noteName(target.midi); els.targetOctave.textContent = `Octave ${noteOctave(target.midi)}`; els.targetHand.textContent = target.midi < 60 ? "Left hand" : "Right hand"; els.reference.textContent = `Play reference ${noteLabel(target.midi)}`; renderPlacement(target); }
  const done = Math.min(currentIndex, total); els.progressText.textContent = `${done} / ${total}`; els.progressBar.style.width = `${total ? done / total * 100 : 0}%`;
  els.xpTotal.textContent = game.xp || 0; renderPhrases();
}

function advance() {
  currentIndex++; combo++; wrongFrames = 0; matchHistory = []; els.comboValue.textContent = `×${combo}`; els.comboValue.classList.remove("xp-pop"); requestAnimationFrame(() => els.comboValue.classList.add("xp-pop"));
  if (song.id) {
    const record = game.lessons[song.id] ||= {best:0, stars:0, rewarded:false};
    if (currentIndex > record.best) { record.best = currentIndex; game.xp += 5; }
    if (currentIndex >= song.notes.length && !record.rewarded) { record.rewarded = true; record.stars = 3; game.xp += song.reward; }
    saveGame();
  }
  els.celebration.classList.add("show"); clearTimeout(advance.timer); advance.timer = setTimeout(() => els.celebration.classList.remove("show"), 850);
  if (currentIndex >= song.notes.length) { currentIndex = song.notes.length; stopListening(); render(); els.statusTitle.textContent = "Lesson complete"; els.statusCopy.textContent = song.reward ? `Three stars earned · +${song.reward} XP` : "You played every note"; showToast("Beautifully played — lesson complete!"); }
  else { render(); correctFrames = 0; }
}

function updateHeard(frequency) {
  const exactMidi = 69 + 12 * Math.log2(frequency / 440), midi = Math.round(exactMidi), cents = Math.round((exactMidi - midi) * 100);
  els.heardNote.textContent = noteLabel(midi); els.heardCents.textContent = `${cents > 0 ? "+" : ""}${cents} cents`; els.pitchIndicator.style.left = `${Math.max(2, Math.min(98, 50 + cents))}%`;
  const target = song.notes[currentIndex];
  const matches = Boolean(target && midi === target.midi && Math.abs(cents) <= ACCEPTANCE_CENTS);
  matchHistory.push(matches); if (matchHistory.length > MATCH_WINDOW) matchHistory.shift(); correctFrames = matchHistory.filter(Boolean).length;
  if (matches) { wrongFrames = 0; els.statusTitle.textContent = `Yes — ${noteLabel(midi)}`; els.statusCopy.textContent = correctFrames < MATCHES_NEEDED ? "Let it ring…" : "Got it!"; if (correctFrames >= MATCHES_NEEDED) advance(); }
  else { if (target && midi !== target.midi) wrongFrames++; if (wrongFrames >= 5 && combo > 0) { combo = 0; els.comboValue.textContent = "×0"; wrongFrames = 0; } els.statusTitle.textContent = `Listening for ${target ? noteLabel(target.midi) : "your note"}`; els.statusCopy.textContent = midi === target?.midi ? "Close enough — let the note settle" : "Try the highlighted key and finger"; }
}

function autoCorrelate(buffer, sampleRate) {
  let rms = 0; for (const value of buffer) rms += value * value; rms = Math.sqrt(rms / buffer.length); if (rms < .012) return -1;
  const minLag = Math.floor(sampleRate / 1200), maxLag = Math.min(buffer.length - 2, Math.ceil(sampleRate / 55)); let bestLag = -1, best = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) { let sum = 0; for (let i = 0; i < buffer.length - lag; i++) sum += buffer[i] * buffer[i + lag]; if (sum > best) { best = sum; bestLag = lag; } }
  return bestLag < 1 ? -1 : sampleRate / bestLag;
}

async function startListening() {
  if (listening) { stopListening(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { showToast("Microphone input is not supported in this browser."); return; }
  try {
    initAudio(); micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const analyser = audioContext.createAnalyser(); analyser.fftSize = 2048; audioContext.createMediaStreamSource(micStream).connect(analyser); const buffer = new Float32Array(analyser.fftSize);
    listening = true; els.followStatus.classList.add("listening"); els.mic.classList.add("is-on"); els.mic.querySelector("strong").textContent = "Listening now"; els.mic.querySelector("small").textContent = "Tap to stop";
    els.statusTitle.textContent = `Listening for ${noteLabel(song.notes[currentIndex].midi)}`; els.statusCopy.textContent = "Play the highlighted note";
    const detect = timestamp => { if (!listening) return; if (timestamp - lastAnalysis > 75) { analyser.getFloatTimeDomainData(buffer); const pitch = autoCorrelate(buffer, audioContext.sampleRate); if (pitch > 0) updateHeard(pitch); lastAnalysis = timestamp; } micFrame = requestAnimationFrame(detect); };
    micFrame = requestAnimationFrame(detect);
  } catch (_) { showToast("Allow microphone access so OpenKeys can hear your piano."); }
}

function stopListening() {
  listening = false; cancelAnimationFrame(micFrame); micStream?.getTracks().forEach(track => track.stop()); els.followStatus.classList.remove("listening"); els.mic.classList.remove("is-on");
  els.mic.querySelector("strong").textContent = "Start listening"; els.mic.querySelector("small").textContent = "Uses your device microphone";
  if (currentIndex < song.notes.length) { els.statusTitle.textContent = "Listening paused"; els.statusCopy.textContent = "Tap Start listening when you’re ready"; }
}

function playPhrase() { const start = Math.floor(currentIndex / 16) * 16, end = Math.min(start + 16, song.notes.length); for (let i = start; i < end; i++) playTone(song.notes[i].midi, (i - start) * .37, .3, song.notes[i].velocity); }
function readVarInt(view, state) { let value = 0, byte; do { byte = view.getUint8(state.offset++); value = (value << 7) | (byte & 127); } while (byte & 128); return value; }

function parseMidi(buffer) {
  const view = new DataView(buffer), state = { offset: 0 }; const text = len => { let s = ""; while (len--) s += String.fromCharCode(view.getUint8(state.offset++)); return s; };
  if (text(4) !== "MThd") throw new Error("That doesn’t appear to be a standard MIDI file."); const headerLength = view.getUint32(state.offset); state.offset += 4; state.offset += 2;
  const trackCount = view.getUint16(state.offset); state.offset += 2; const division = view.getUint16(state.offset); state.offset += 2; if (division & 0x8000) throw new Error("SMPTE-timed MIDI is not supported yet."); state.offset = 8 + headerLength;
  const events = []; let title = "";
  for (let track = 0; track < trackCount; track++) {
    if (text(4) !== "MTrk") throw new Error("This MIDI track is damaged."); const length = view.getUint32(state.offset); state.offset += 4; const end = state.offset + length; let ticks = 0, running = 0;
    while (state.offset < end) {
      ticks += readVarInt(view, state); let status = view.getUint8(state.offset++); if (status < 128) { state.offset--; status = running; } else if (status < 240) running = status;
      if (status === 255) { const type = view.getUint8(state.offset++), len = readVarInt(view, state); if (type === 81 && len === 3) { const tempo = (view.getUint8(state.offset) << 16) | (view.getUint8(state.offset + 1) << 8) | view.getUint8(state.offset + 2); events.push({ type: "tempo", ticks, tempo }); } else if (type === 3 && !title) { for (let i = 0; i < len; i++) title += String.fromCharCode(view.getUint8(state.offset + i)); } state.offset += len; continue; }
      if (status === 240 || status === 247) { const len = readVarInt(view, state); state.offset += len; continue; }
      const kind = status & 240, channel = status & 15, data1 = view.getUint8(state.offset++), data2 = (kind === 192 || kind === 208) ? 0 : view.getUint8(state.offset++);
      if (kind === 144 && data2 > 0) events.push({ type: "on", ticks, midi: data1, velocity: data2 / 127, channel }); if (kind === 128 || (kind === 144 && data2 === 0)) events.push({ type: "off", ticks, midi: data1, channel });
    } state.offset = end;
  }
  events.sort((a, b) => a.ticks - b.ticks || (a.type === "off" ? -1 : 1)); let tempo = 500000, lastTicks = 0, seconds = 0; const active = new Map(), notes = [];
  events.forEach(event => { seconds += (event.ticks - lastTicks) * tempo / division / 1e6; lastTicks = event.ticks; if (event.type === "tempo") tempo = event.tempo; const key = `${event.channel}:${event.midi}`; if (event.type === "on") active.set(key, { midi: event.midi, start: seconds, velocity: event.velocity }); if (event.type === "off" && active.has(key)) { const note = active.get(key); note.duration = Math.max(.06, seconds - note.start); notes.push(note); active.delete(key); } });
  notes.sort((a, b) => a.start - b.start); if (!notes.length) throw new Error("This MIDI file has no playable notes."); return { name: title || "Imported lesson", notes };
}

els.mic.addEventListener("click", startListening); els.reference.addEventListener("click", () => song.notes[currentIndex] && playTone(song.notes[currentIndex].midi)); els.hearPhrase.addEventListener("click", playPhrase);
els.restart.addEventListener("click", () => { currentIndex = 0; correctFrames = 0; wrongFrames = 0; combo = 0; matchHistory = []; els.comboValue.textContent = "×0"; render(); els.statusTitle.textContent = listening ? `Listening for ${noteLabel(song.notes[0].midi)}` : "Ready to listen"; els.statusCopy.textContent = listening ? "Play the highlighted note" : "Turn on your microphone to begin"; });
els.settings.addEventListener("click", () => els.help.showModal()); els.dialogClose.addEventListener("click", () => els.help.close()); els.help.addEventListener("click", event => { if (event.target === els.help) els.help.close(); });
els.libraryButton.addEventListener("click", () => { renderLibrary(); els.library.showModal(); }); els.libraryClose.addEventListener("click", () => els.library.close());
els.library.addEventListener("click", event => { if (event.target === els.library) els.library.close(); });
document.querySelectorAll(".library-filter button").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".library-filter button").forEach(item => item.classList.toggle("active", item === button)); renderLibrary(button.dataset.filter); }));
els.midi.addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { stopListening(); song = parseMidi(await file.arrayBuffer()); currentIndex = 0; combo = 0; els.comboValue.textContent = "×0"; els.title.textContent = song.name; els.composer.textContent = `${file.name} · ${song.notes.length} notes`; render(); showToast(`Ready — ${song.notes.length} notes loaded locally`); } catch (error) { showToast(error.message); } event.target.value = ""; });
function showToast(message) { els.toast.textContent = message; els.toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 3000); }
document.addEventListener("visibilitychange", () => { if (document.hidden && listening) stopListening(); });
renderLibrary(); render();
