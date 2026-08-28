"use strict";

const $ = selector => document.querySelector(selector);
const els = {
  title: $("#song-title"), composer: $("#song-composer"), midi: $("#midi-input"), track: $("#notes-track"), counts: $("#count-strip"),
  targetName: $("#target-name"), targetOctave: $("#target-octave"), targetHand: $("#target-hand"), heardNote: $("#heard-note"), heardCents: $("#heard-cents"),
  pitchIndicator: $("#pitch-indicator"), mic: $("#mic-button"), hearPhrase: $("#hear-phrase"), phraseLabel: $("#phrase-label"), restart: $("#restart-button"),
  statusTitle: $("#status-title"), statusCopy: $("#status-copy"), followStatus: $(".follow-status"), progressText: $("#progress-text"), progressBar: $("#progress-bar"),
  celebration: $("#celebration"), toast: $("#toast"), help: $("#help-dialog"), settings: $("#settings-button"), dialogClose: $("#dialog-close"),
  library: $("#library-dialog"), libraryButton: $("#library-button"), libraryClose: $("#library-close"), lessonGrid: $("#lesson-grid"), libraryTitle: $("#library-title"), librarySubtitle: $("#library-subtitle"),
  phraseList: $("#phrase-list"), lessonHeading: $("#lesson-heading"), partLabel: $("#part-label"), xpTotal: $("#xp-total"),
  physicalKeyboard: $("#physical-keyboard"), positionHint: $("#position-hint"), handName: $("#hand-name"), fingerNumber: $("#finger-number"),
  guitarFretboard: $("#guitar-fretboard"), fingerName: $("#finger-name"), fingerDots: $("#finger-dots"), fingerPath: $("#finger-path"), comboValue: $("#combo-value"),
  instrumentButtons: [...document.querySelectorAll("[data-instrument]")], appShell: $(".app-shell"), journeyButton: $("#journey-button"), railJourney: $("#rail-journey"),
  journey: $("#journey-dialog"), journeyClose: $("#journey-close"), journeyName: $("#journey-name"), journeyIcon: $("#journey-icon"), achievementGrid: $("#achievement-grid"),
  achievementTitle: $("#achievement-title"), journeyTotalNotes: $("#journey-total-notes"), railMilestone: $("#rail-milestone"), milestoneProgress: $("#milestone-progress"), railBadge: $("#rail-badge"),
  planGrid: $("#plan-grid"), planTitle: $("#plan-title"), inputButtons: [...document.querySelectorAll("[data-input]")], inputStatus: $("#input-status"),
  profileButton: $("#profile-button"), profileAvatar: $("#profile-avatar"), profileName: $("#profile-name"), profiles: $("#profiles-dialog"), profilesClose: $("#profiles-close"), profilesGrid: $("#profiles-grid"), profileForm: $("#profile-form"), profileNameInput: $("#profile-name-input")
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
const CURRICULA = {
  piano: [
    { id:"piano-first-8", songId:"ode", title:"First eight notes", skill:"Right hand · ensemble", excerpt:8, ensemble:true, reward:60 },
    { id:"piano-phrase", songId:"twinkle", title:"Complete a phrase", skill:"Right hand · steady pulse", excerpt:14, ensemble:true, reward:90 },
    { id:"piano-song", songId:"jingle", title:"Join the band", skill:"Longer melody · accompaniment", excerpt:24, ensemble:true, reward:130 },
    { id:"piano-hands", songId:"ode", title:"Bring in the left hand", skill:"Bass + melody coordination", arrangement:"two-hands", ensemble:true, reward:220 },
    { id:"piano-independence", songId:"bach", title:"Two-hand independence", skill:"Full two-hand play-along", arrangement:"two-hands", ensemble:true, reward:320 }
  ],
  guitar: [
    { id:"guitar-first-8", songId:"ode", title:"First eight notes", skill:"Single-string melody · ensemble", excerpt:8, ensemble:true, reward:60 },
    { id:"guitar-phrase", songId:"twinkle", title:"Connect the strings", skill:"Melody across strings", excerpt:14, ensemble:true, reward:90 },
    { id:"guitar-first-strum", songId:"jingle", title:"Your first chord groove", skill:"Down-strums · four chords", arrangement:"strum", excerpt:8, ensemble:true, reward:140 },
    { id:"guitar-rhythm", songId:"ode", title:"Strum with the group", skill:"Down/up rhythm · full form", arrangement:"strum", excerpt:16, ensemble:true, reward:220 },
    { id:"guitar-lead", songId:"fur", title:"Lead guitar play-along", skill:"Full melody · position shifts", ensemble:true, reward:320 }
  ]
};
let song = LESSONS[0];
const PROFILE_COLORS = ["#ff7358","#315cf5","#38a778","#a15ee8","#e29a23","#d75582"];
let family = (() => { try { return JSON.parse(localStorage.getItem("openkeys-family")) || {activeId:"player-1",profiles:[{id:"player-1",name:"Player 1",color:PROFILE_COLORS[0]}]}; } catch (_) { return {activeId:"player-1",profiles:[{id:"player-1",name:"Player 1",color:PROFILE_COLORS[0]}]}; } })();
if (!family.profiles?.length) family = {activeId:"player-1",profiles:[{id:"player-1",name:"Player 1",color:PROFILE_COLORS[0]}]};
let activeProfileId = family.profiles.some(profile => profile.id === family.activeId) ? family.activeId : family.profiles[0].id;
function profileStorageKey(kind,id = activeProfileId) { return `openkeys-${kind}:${id}`; }
function loadProfileGame(id = activeProfileId) { try { const saved = localStorage.getItem(profileStorageKey("progress",id)); if (saved) return JSON.parse(saved); if (id === family.profiles[0].id) { const legacy = localStorage.getItem("openkeys-progress"); if (legacy) return JSON.parse(legacy); } } catch (_) {} return {xp:0,lessons:{}}; }
function loadProfileInstrument(id = activeProfileId) { try { return localStorage.getItem(profileStorageKey("instrument",id)) || (id === family.profiles[0].id ? localStorage.getItem("openkeys-instrument") : null) || "piano"; } catch (_) { return "piano"; } }
let game = loadProfileGame();
let currentIndex = 0, audioContext, masterGain, micStream, micFrame, listening = false, correctFrames = 0, wrongFrames = 0, combo = 0, matchHistory = [], lastAnalysis = 0, lastStrumAt = 0, lastStrumLevel = 0, recognitionMutedUntil = 0, pendingChordAt = 0, midiAccess;
let previewIndex = null, previewFrame = 0, previewing = false;
let activeInput = "mic"; const midiPressed = new Set();
const guitarToneCache = new Map();
let activeInstrument = loadProfileInstrument() === "guitar" ? "guitar" : "piano";

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

function playPianoTone(midi, when = 0, duration = .55, velocity = .75) {
  if (!initAudio()) return;
  const start = audioContext.currentTime + when, base = frequencyFor(midi), body = audioContext.createBiquadFilter(); body.type = "lowpass"; body.frequency.value = Math.min(9000, base * 12); body.Q.value = .35; body.connect(masterGain);
  [[1,.22,0],[2,.075,-2],[3,.035,3],[4,.016,-5]].forEach(([ratio, level, cents], index) => { const osc = audioContext.createOscillator(), gain = audioContext.createGain(); osc.type = index ? "sine" : "triangle"; osc.frequency.value = base * ratio; osc.detune.value = cents; gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(level * velocity,start + .008 + index * .003); gain.gain.exponentialRampToValueAtTime(.0001,start + Math.max(.7,duration + 1.15 - index * .18)); osc.connect(gain).connect(body); osc.start(start); osc.stop(start + Math.max(.8,duration + 1.25)); });
  const hammer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * .018), audioContext.sampleRate), data = hammer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length); const hit = audioContext.createBufferSource(), hitGain = audioContext.createGain(); hit.buffer = hammer; hitGain.gain.value = .035 * velocity; hit.connect(hitGain).connect(body); hit.start(start);
}

function guitarBuffer(midi) {
  const key = `${midi}:${audioContext.sampleRate}`; if (guitarToneCache.has(key)) return guitarToneCache.get(key);
  const rate = audioContext.sampleRate, length = Math.floor(rate * 2.6), period = Math.max(2, Math.round(rate / frequencyFor(midi))), buffer = audioContext.createBuffer(1,length,rate), data = buffer.getChannelData(0), ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  let previous = 0; for (let i = 0; i < length; i++) { const slot = i % period, next = .497 * (ring[slot] + previous); ring[slot] = next * .9965; previous = next; data[i] = next * Math.exp(-i / (rate * 2.1)); }
  guitarToneCache.set(key,buffer); return buffer;
}

function playGuitarTone(midi, when = 0, duration = .55, velocity = .75) {
  if (!initAudio()) return; const start = audioContext.currentTime + when, source = audioContext.createBufferSource(), gain = audioContext.createGain(), body = audioContext.createBiquadFilter(); source.buffer = guitarBuffer(midi); body.type = "lowpass"; body.frequency.value = Math.min(6500,frequencyFor(midi) * 9); body.Q.value = .7; gain.gain.setValueAtTime(.34 * velocity,start); gain.gain.exponentialRampToValueAtTime(.0001,start + Math.max(.8,duration + 1.25)); source.connect(body).connect(gain).connect(masterGain); source.start(start); source.stop(start + Math.max(.85,duration + 1.3));
}

function playTone(midi, when = 0, duration = .55, velocity = .75) {
  (activeInstrument === "guitar" ? playGuitarTone : playPianoTone)(midi,when,duration,velocity);
}

function harmonyRoot(midi) { const roots = [0,5,7,9], pitch = midi % 12, root = roots.reduce((best,item) => Math.abs(item - pitch) < Math.abs(best - pitch) ? item : best,0); return 48 + root; }
function playEnsembleCue(note, when = 0) {
  if (!song.plan?.ensemble) return; const root = note.chordPitches?.[0] || harmonyRoot(note.midi), chord = note.chordPitches || [root,root + (root % 12 === 9 ? 3 : 4),root + 7];
  if (activeInstrument === "piano") chord.forEach((pitch,index) => playGuitarTone(pitch,when + index * .025,.7,.28));
  else { playPianoTone(root - 12,when,.8,.3); chord.forEach((pitch,index) => playPianoTone(pitch,when + .05 + index * .018,.7,.2)); }
}

function staffY(note) {
  const midi = typeof note === "number" ? note : note.midi;
  if (typeof note === "object" && note.strum) return "0px";
  if (song.plan?.arrangement === "two-hands") { const hand = typeof note === "object" ? note.hand : "right", center = hand === "left" ? 48 : 64, lane = hand === "left" ? 68 : -63; return `${lane - (midi - center) * 5.5}px`; }
  const degree = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 }[midi % 12] ?? 0;
  return `${-((noteOctave(midi) - 4) * 7 + degree - 2) * 12.5}px`;
}

function saveGame() { try { localStorage.setItem(profileStorageKey("progress"),JSON.stringify(game)); } catch (_) {} }
function saveFamily() { try { localStorage.setItem("openkeys-family",JSON.stringify(family)); } catch (_) {} }
function activeProfile() { return family.profiles.find(profile => profile.id === activeProfileId) || family.profiles[0]; }
function profileInitials(name) { return name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase(); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[character]); }
function renderProfiles() {
  const current = activeProfile(); els.profileName.textContent = current.name; els.profileAvatar.textContent = profileInitials(current.name); els.profileAvatar.style.setProperty("--profile-color",current.color); els.profilesGrid.innerHTML = "";
  family.profiles.forEach(profile => { const button = document.createElement("button"); button.type = "button"; button.className = profile.id === activeProfileId ? "active" : ""; const profileGame = loadProfileGame(profile.id), safeName = escapeHtml(profile.name), safeInitials = escapeHtml(profileInitials(profile.name)); button.innerHTML = `<span style="--profile-color:${profile.color}">${safeInitials}</span><div><strong>${safeName}</strong><small>${profileGame.xp || 0} XP · ${Object.values(profileGame.instruments || {}).reduce((sum,path) => sum + Object.values(path.lessons || {}).filter(record => record.rewarded).length,0)} stages</small></div><b>${profile.id === activeProfileId ? "PLAYING" : "SWITCH"}</b>`; button.addEventListener("click",() => activateProfile(profile.id)); els.profilesGrid.append(button); });
}

function activateProfile(id) {
  stopListening(); activeProfileId = id; family.activeId = id; saveFamily(); game = loadProfileGame(id); activeInstrument = loadProfileInstrument(id) === "guitar" ? "guitar" : "piano"; currentIndex = 0; combo = 0; matchHistory = []; els.comboValue.textContent = "×0"; els.instrumentButtons.forEach(button => { const active = button.dataset.instrument === activeInstrument; button.classList.toggle("active",active); button.setAttribute("aria-pressed",active); }); const plans = CURRICULA[activeInstrument], next = plans.find(plan => !planComplete(plan)) || plans[plans.length - 1]; song = plannedLesson(next); els.title.textContent = song.name; els.composer.textContent = `${song.composer} · ${next.skill}`; renderProfiles(); renderJourney(); renderLibrary(); render(); if (els.profiles.open) els.profiles.close(); showToast(`${activeProfile().name}'s ${INSTRUMENTS[activeInstrument].name} journey`);
}

function journeyProgress(id = activeInstrument) {
  game.instruments ||= {};
  if (!game.instruments[id]) game.instruments[id] = { lessons:{} };
  if (id === "piano" && !Object.keys(game.instruments.piano.lessons).length && Object.keys(game.lessons || {}).length) game.instruments.piano.lessons = JSON.parse(JSON.stringify(game.lessons));
  return game.instruments[id];
}

function journeyStats(id = activeInstrument) {
  const records = Object.values(journeyProgress(id).lessons), notes = records.reduce((sum, record) => sum + (record.best || 0), 0), songs = records.filter(record => record.rewarded).length;
  return { notes, songs, stars:records.reduce((sum, record) => sum + (record.stars || 0), 0) };
}

function plannedLesson(plan) {
  const base = LESSONS.find(item => item.id === plan.songId), melody = base.notes.slice(0, plan.excerpt || base.notes.length).map(note => ({...note, hand:"right"}));
  let notes = melody;
  if (plan.arrangement === "two-hands") notes = melody.map((note,index) => { if (index % 4 !== 0) return note; let bass = Math.max(40,harmonyRoot(note.midi) - 12); if (bass % 12 === note.midi % 12) bass += 7; return {...note, pitches:[bass,note.midi], hand:"both", type:"chord", requiredPitchClasses:[bass % 12,note.midi % 12]}; });
  if (plan.arrangement === "strum") { const roots = [60,60,65,67,60,65,67,60,57,65,60,67,57,65,67,60]; notes = roots.slice(0,plan.excerpt || roots.length).map((root,index) => { const minor = root % 12 === 9, pitches = [root,root + (minor ? 3 : 4),root + 7]; return { midi:root, pitches, start:index * .7, duration:.6, velocity:.78, strum:true, direction:index % 4 === 3 ? "↑" : "↓", chord:`${noteName(root)} ${minor ? "minor" : "major"}`, chordPitches:pitches, requiredPitchClasses:pitches.slice(0,2).map(pitch => pitch % 12), optionalPitchClasses:[pitches[2] % 12], type:"chord" }; }); }
  return {...base, id:plan.id, baseId:base.id, name:`${base.name} · ${plan.title}`, level:plan.arrangement === "two-hands" || plan.arrangement === "strum" ? "Skills" : "Foundation", reward:plan.reward, notes, fingers:plan.arrangement ? undefined : base.fingers?.slice(0,notes.length), plan};
}

function planComplete(plan,id = activeInstrument) { return Boolean(journeyProgress(id).lessons[plan.id]?.rewarded); }
function planUnlocked(plan,id = activeInstrument) { const plans = CURRICULA[id], index = plans.findIndex(item => item.id === plan.id); return index <= 0 || planComplete(plans[index - 1],id); }
function completedStages(id = activeInstrument) { return CURRICULA[id].filter(plan => planComplete(plan,id)).length; }

function renderPlan() {
  const plans = CURRICULA[activeInstrument]; els.planTitle.textContent = `${INSTRUMENTS[activeInstrument].name} foundations`; els.planGrid.innerHTML = "";
  plans.forEach((plan,index) => { const complete = planComplete(plan), unlocked = planUnlocked(plan), item = document.createElement("button"); item.type = "button"; item.className = `${complete ? "complete" : ""}${unlocked ? "" : " locked"}`; item.disabled = !unlocked; item.innerHTML = `<span>${complete ? "✓" : String(index + 1).padStart(2,"0")}</span><div><small>${index < 2 ? "FOUNDATION" : index < 4 ? "PLAY WITH OTHERS" : "MUSICIANSHIP"}</small><strong>${plan.title}</strong><em>${plan.skill}</em></div><b>${complete ? "REPLAY" : unlocked ? "START" : "LOCKED"}</b>`; item.addEventListener("click", () => startPlan(plan)); els.planGrid.append(item); });
}

function achievementsFor(id = activeInstrument) {
  const shared = [
    { icon:"♪", title:"First sound", copy:"Play your first guided note", test:stats => stats.notes >= 1, current:stats => stats.notes, goal:1 },
    { icon:"25", title:"Finding rhythm", copy:"Play 25 guided notes", test:stats => stats.notes >= 25, current:stats => stats.notes, goal:25 },
    { icon:"★", title:"First play-along", copy:"Complete one guided stage", test:stats => stats.songs >= 1, current:stats => stats.songs, goal:1 }
  ];
  return id === "piano" ? [...shared,
    { icon:"LH", title:"Both hands", copy:"Complete the bass-and-melody stage", test:() => planComplete(CURRICULA.piano[3],"piano"), current:() => completedStages("piano"), goal:4 },
    { icon:"𝄢", title:"Independence", copy:"Complete the full two-hand play-along", test:() => planComplete(CURRICULA.piano[4],"piano"), current:() => completedStages("piano"), goal:5 }
  ] : [...shared,
    { icon:"↓", title:"First groove", copy:"Complete your first chord-strum stage", test:() => planComplete(CURRICULA.guitar[2],"guitar"), current:() => completedStages("guitar"), goal:3 },
    { icon:"↓↑", title:"Rhythm player", copy:"Complete the full strumming play-along", test:() => planComplete(CURRICULA.guitar[3],"guitar"), current:() => completedStages("guitar"), goal:4 }
  ];
}

function renderJourney() {
  const stats = journeyStats(), achievements = achievementsFor(), next = achievements.find(item => !item.test(stats));
  els.journeyName.textContent = INSTRUMENTS[activeInstrument].name; els.journeyIcon.textContent = activeInstrument === "piano" ? "🎹" : "🎸";
  els.achievementTitle.textContent = `${INSTRUMENTS[activeInstrument].name} journey`; els.journeyTotalNotes.textContent = `${stats.notes} note${stats.notes === 1 ? "" : "s"} played`;
  $("#piano-journey-stat").textContent = `${journeyStats("piano").songs} songs mastered`; $("#guitar-journey-stat").textContent = `${journeyStats("guitar").songs} songs mastered`;
  renderPlan(); els.achievementGrid.innerHTML = ""; achievements.forEach(item => { const unlocked = item.test(stats), card = document.createElement("article"); card.className = unlocked ? "unlocked" : ""; card.innerHTML = `<span>${unlocked ? item.icon : "◇"}</span><div><strong>${item.title}</strong><small>${item.copy}</small></div><b>${unlocked ? "UNLOCKED" : "LOCKED"}</b>`; els.achievementGrid.append(card); });
  if (!next) { els.railMilestone.textContent = "Journey complete — keep playing"; els.milestoneProgress.style.width = "100%"; els.railBadge.textContent = "★"; }
  else { const current = next.current(stats); els.railMilestone.textContent = next.title; els.milestoneProgress.style.width = `${Math.min(100,current / next.goal * 100)}%`; els.railBadge.textContent = next.icon; }
}

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
  const stats = journeyStats(); els.libraryTitle.textContent = `Choose your next ${INSTRUMENTS[activeInstrument].name.toLowerCase()} song`; els.librarySubtitle.textContent = `${stats.songs} mastered · ${stats.stars} stars · every completed play-along advances this journey.`; els.lessonGrid.innerHTML = "";
  const visible = LESSONS.filter(lesson => filter === "all" || (filter === "game" ? lesson.category === "game" : lesson.level.toLowerCase() === filter));
  let lastSection = "";
  visible.forEach(lesson => {
    const section = lesson.category === "game" ? "Game music · Community MIDI" : "Public-domain essentials";
    if (filter === "all" && section !== lastSection) { const heading = document.createElement("h3"); heading.className = "library-section-label"; heading.textContent = section; els.lessonGrid.append(heading); lastSection = section; }
    const plans = CURRICULA[activeInstrument].filter(plan => plan.songId === lesson.id), completedPlans = plans.filter(plan => planComplete(plan)).length, record = journeyProgress().lessons[lesson.id] || {}, progress = plans.length ? Math.round(completedPlans / plans.length * 100) : Math.round((record.best || 0) / lesson.notes.length * 100), stars = plans.length ? Math.min(3,completedPlans) : record.stars || 0;
    const card = document.createElement("article"); card.className = "lesson-card"; card.dataset.lesson = lesson.id; card.tabIndex = 0; card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Learn ${lesson.name} by ${lesson.composer}`);
    const attribution = lesson.sourceUrl ? `<p class="attribution"><a href="${lesson.sourceUrl}" target="_blank" rel="noreferrer">${lesson.sourceLabel}</a> by <a href="${lesson.arrangerUrl}" target="_blank" rel="noreferrer">Mr. Magicman</a></p>` : "";
    card.innerHTML = `<div class="lesson-cover cover-${lesson.cover}"><span class="cover-glyph">${lesson.glyph}</span><span class="cover-badge">${lesson.category === "game" ? "MINECRAFT" : "OPENKEYS"}</span></div><div class="lesson-card-body"><div class="lesson-card-top"><div><h3>${lesson.name}</h3><p class="composer">${lesson.composer}</p>${attribution}</div><span class="difficulty">${plans.length ? `${completedPlans}/${plans.length} stages` : lesson.level}</span></div><div class="card-stats"><span>${plans.length ? `${plans.length} guided play-alongs` : `${lesson.notes.length} notes`}</span><span>${progress}% mastered</span><span class="reward">${plans.length ? "Journey XP" : `+${lesson.reward} XP`}</span><span class="card-stars">${[1,2,3].map(n => `<i class="${n <= stars ? "earned" : ""}">★</i>`).join("")}</span></div></div>`;
    card.addEventListener("click", event => { if (!event.target.closest("a")) selectLesson(lesson.id); }); card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectLesson(lesson.id); } }); els.lessonGrid.append(card);
  });
}

function selectLesson(id) {
  const matchingPlans = CURRICULA[activeInstrument].filter(plan => plan.songId === id), plan = matchingPlans.find(item => planUnlocked(item) && !planComplete(item)) || [...matchingPlans].reverse().find(item => planComplete(item)); if (plan) { startPlan(plan); return; } if (matchingPlans.length) { const next = CURRICULA[activeInstrument].find(item => planUnlocked(item) && !planComplete(item)); showToast(`Complete “${next.title}” to unlock this play-along`); return; }
  const lesson = LESSONS.find(item => item.id === id); if (!lesson) return;
  stopListening(); song = lesson; currentIndex = 0; correctFrames = 0; wrongFrames = 0; combo = 0; matchHistory = []; els.comboValue.textContent = "×0"; els.title.textContent = lesson.name; els.composer.textContent = `${lesson.composer} · ${lesson.level}`;
  els.statusTitle.textContent = "Ready to listen"; els.statusCopy.textContent = "Turn on your microphone to begin"; render(); els.library.close(); showToast(`${lesson.name} is ready to learn`);
}

function startPlan(plan) {
  stopListening(); song = plannedLesson(plan); currentIndex = 0; correctFrames = 0; wrongFrames = 0; combo = 0; matchHistory = []; els.comboValue.textContent = "×0"; els.title.textContent = song.name; els.composer.textContent = `${song.composer} · ${plan.skill}`; els.statusTitle.textContent = plan.arrangement === "strum" ? "Ready to strum" : "Ready to play with the group"; els.statusCopy.textContent = plan.arrangement === "strum" ? "Start listening, then strum the shown chord" : "The accompaniment answers each note you play"; render(); if (els.library.open) els.library.close(); if (els.journey.open) els.journey.close(); showToast(`${plan.title} is ready`);
}

function pianoFinger(midi, index) {
  if (song.fingers?.[index]) return song.fingers[index];
  const right = midi >= 60, pitch = midi % 12;
  const rightMap = {0:1,1:2,2:2,3:3,4:3,5:4,6:4,7:5,8:3,9:4,10:4,11:5};
  const leftMap = {0:5,1:4,2:4,3:3,4:3,5:2,6:2,7:1,8:3,9:2,10:2,11:1};
  return (right ? rightMap : leftMap)[pitch] || 3;
}

const GUITAR_STRINGS = [
  { name:"1", pitch:64, label:"high E" }, { name:"2", pitch:59, label:"B" }, { name:"3", pitch:55, label:"G" },
  { name:"4", pitch:50, label:"D" }, { name:"5", pitch:45, label:"A" }, { name:"6", pitch:40, label:"low E" }
];

function guitarPosition(midi) {
  const choices = GUITAR_STRINGS.map((string, index) => ({...string, index, fret:midi - string.pitch})).filter(choice => choice.fret >= 0 && choice.fret <= 24);
  return choices.sort((a, b) => (a.fret > 12) - (b.fret > 12) || a.fret - b.fret)[0] || { name:"1", label:"high E", index:0, fret:Math.max(0, midi - 64) };
}

const INSTRUMENTS = {
  piano: {
    name:"Piano", render:renderPianoPlacement,
    describe(midi, index) { const finger = pianoFinger(midi, index), hand = midi < 60 ? "Left hand" : "Right hand"; return { hint:positionHint(midi), primary:hand, number:finger, detail:["Thumb","Index","Middle","Ring","Pinky"][finger - 1], hand }; }
  },
  guitar: {
    name:"Guitar", render:renderGuitarPlacement,
    describe(midi) { const position = guitarPosition(midi), finger = position.fret === 0 ? 0 : ((position.fret - 1) % 4) + 1; return { hint:position.fret ? `String ${position.name} · fret ${position.fret}` : `Open ${position.label} string`, primary:`String ${position.name} · ${position.label}`, number:finger, detail:position.fret ? `Fret ${position.fret}` : "Open", hand:"Fretting hand" }; }
  }
};

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

function renderPianoPlacement(target) {
  const midi = target.midi, finger = pianoFinger(midi, currentIndex), targets = new Set(target.pitches || [midi]);
  [...els.fingerDots.children].forEach((dot, index) => dot.classList.toggle("active", index + 1 === finger));
  els.physicalKeyboard.innerHTML = ""; const lowest = Math.min(...targets), min = lowest < 48 ? 36 : lowest < 60 ? 48 : midi > 83 ? 72 : 60, max = min + 35, whites = [];
  for (let note = min; note <= max; note++) if (![1,3,6,8,10].includes(note % 12)) whites.push(note);
  whites.forEach(note => { const key = document.createElement("i"); key.className = `guide-key white${targets.has(note) ? " target" : ""}${note === 60 ? " middle-c" : ""}`; key.dataset.note = noteLabel(note); if (targets.has(note)) key.dataset.finger = note === midi ? finger : "LH"; els.physicalKeyboard.append(key); });
  whites.forEach((note, index) => {
    if (note < max && [0,2,5,7,9].includes(note % 12)) { const blackMidi = note + 1, key = document.createElement("i"); key.className = `guide-key black${targets.has(blackMidi) ? " target" : ""}`; key.style.left = `${(index + 1) / whites.length * 100}%`; key.dataset.note = noteLabel(blackMidi); if (targets.has(blackMidi)) key.dataset.finger = blackMidi === midi ? finger : "LH"; els.physicalKeyboard.append(key); }
  });
}

function renderGuitarPlacement(target) {
  const position = guitarPosition(target.midi);
  els.guitarFretboard.innerHTML = "";
  const chordShapes = {0:[0,1,0,2,3,null],5:[1,1,2,3,3,1],7:[3,0,0,0,2,3],9:[0,1,2,2,0,null]}, shape = target.strum ? chordShapes[target.midi % 12] : null;
  GUITAR_STRINGS.forEach((string, index) => {
    const row = document.createElement("div"); row.className = `guitar-string${index === position.index ? " target" : ""}`;
    row.dataset.string = string.name;
    for (let fret = 0; fret <= 24; fret++) { const cell = document.createElement("i"), targetFret = shape ? shape[index] : position.fret; if ((shape ? targetFret !== null : index === position.index) && fret === targetFret) { cell.className = "target"; cell.dataset.fret = targetFret || "O"; } row.append(cell); }
    els.guitarFretboard.append(row);
  });
}

function renderPlacement(target,index = currentIndex) {
  const instrument = INSTRUMENTS[activeInstrument], guidance = instrument.describe(target.midi, index);
  if (target.strum) { guidance.hint = `${target.direction} strum · ${target.chord}`; guidance.primary = target.chord; guidance.number = target.direction; guidance.detail = target.direction === "↓" ? "Down-strum" : "Up-strum"; guidance.hand = "Strumming hand"; }
  else if (target.hand) { guidance.hand = target.hand === "both" ? "Both hands together" : `${target.hand === "left" ? "Left" : "Right"} hand`; guidance.primary = guidance.hand; if (target.hand === "both") guidance.hint = `${noteLabel(target.pitches[0])} + ${noteLabel(target.pitches[1])} together`; }
  els.appShell.dataset.instrument = activeInstrument; els.positionHint.textContent = guidance.hint; els.handName.textContent = guidance.primary;
  els.fingerNumber.textContent = guidance.number; els.fingerName.textContent = guidance.detail; els.targetHand.textContent = guidance.hand;
  instrument.render(target); els.fingerPath.innerHTML = "";
  song.notes.slice(index, index + 4).forEach((note, offset) => {
    const next = instrument.describe(note.midi, index + offset), step = document.createElement("span"); step.className = `finger-step${offset === 0 ? " current" : ""}`;
    const dot = document.createElement("i"), label = document.createElement("small"); dot.textContent = note.strum ? note.direction : activeInstrument === "guitar" ? guitarPosition(note.midi).name : next.number; label.textContent = note.strum ? noteName(note.midi) : noteLabel(note.midi); step.append(dot, label); els.fingerPath.append(step);
  });
}

function render() {
  const notes = song.notes, total = notes.length, viewPosition = previewIndex ?? currentIndex, viewIndex = Math.min(total - 1,Math.floor(viewPosition + .001)), target = notes[viewIndex];
  els.appShell.classList.toggle("two-hands",song.plan?.arrangement === "two-hands"); els.appShell.classList.toggle("strum-lesson",song.plan?.arrangement === "strum");
  els.track.innerHTML = ""; els.counts.innerHTML = "";
  const firstVisible = Math.floor(viewPosition) - 2, lastVisible = Math.ceil(viewPosition) + 4;
  for (let index = firstVisible; index <= lastVisible; index++) {
    if (index < 0 || index >= total) continue;
    const note = notes[index], x = 32 + (index - viewPosition) * 17;
    const dot = document.createElement("i"); dot.className = `score-note ${index === viewIndex ? "current" : index < viewIndex ? "past" : "future"}`;
    dot.style.setProperty("--x", `${x}%`); dot.style.setProperty("--y", staffY(note)); els.track.append(dot);
    if (note.pitches?.length > 1) { const bass = document.createElement("i"); bass.className = `score-note chord-part ${offset === 0 ? "current" : offset < 0 ? "past" : "future"}`; bass.style.setProperty("--x",`${x}%`); bass.style.setProperty("--y",staffY({midi:note.pitches[0],hand:"left"})); els.track.append(bass); }
    const label = document.createElement("span"); label.className = "note-letter"; label.textContent = note.strum ? `${note.direction} ${noteName(note.midi)}` : noteLabel(note.midi);
    label.style.setProperty("--x", `${x}%`); label.style.setProperty("--y", staffY(note)); els.track.append(label);
  }
  for (let i = 0; i < 6; i++) { const count = document.createElement("span"); count.textContent = String(viewIndex + i + 1).padStart(2, "0"); els.counts.append(count); }
  els.phraseLabel.textContent = "Preview song";
  if (target) { els.targetName.textContent = target.strum ? target.direction : target.pitches?.length > 1 ? "2" : noteName(target.midi); els.targetOctave.textContent = target.strum ? target.chord : target.pitches?.length > 1 ? "notes together" : `Octave ${noteOctave(target.midi)}`; renderPlacement(target,viewIndex); }
  const done = Math.min(currentIndex, total); els.progressText.textContent = `${done} / ${total}`; els.progressBar.style.width = `${total ? done / total * 100 : 0}%`;
  els.xpTotal.textContent = game.xp || 0; renderPhrases();
}

function advance() {
  const completedNote = song.notes[currentIndex];
  currentIndex++; combo++; wrongFrames = 0; matchHistory = []; els.comboValue.textContent = `×${combo}`; els.comboValue.classList.remove("xp-pop"); requestAnimationFrame(() => els.comboValue.classList.add("xp-pop"));
  if (song.id) {
    const record = journeyProgress().lessons[song.id] ||= {best:0, stars:0, rewarded:false};
    if (currentIndex > record.best) { record.best = currentIndex; game.xp += 5; }
    if (currentIndex >= song.notes.length && !record.rewarded) { record.rewarded = true; record.stars = 3; game.xp += song.reward; }
    saveGame(); renderJourney();
  }
  if (completedNote && song.plan?.ensemble) { playEnsembleCue(completedNote,.05); recognitionMutedUntil = performance.now() + 550; }
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

function signalLevel(buffer) { let sum = 0; for (const value of buffer) sum += value * value; return Math.sqrt(sum / buffer.length); }

function goertzel(buffer,sampleRate,frequency) { const omega = 2 * Math.PI * frequency / sampleRate, coefficient = 2 * Math.cos(omega); let first = 0, second = 0; for (const sample of buffer) { const next = sample + coefficient * first - second; second = first; first = next; } return Math.max(0,second * second + first * first - coefficient * first * second); }
function analyzeChord(buffer,sampleRate,target) {
  const chroma = Array(12).fill(0); for (let midi = 40; midi <= 88; midi++) chroma[midi % 12] += goertzel(buffer,sampleRate,frequencyFor(midi));
  const peak = Math.max(...chroma,1e-9), normalized = chroma.map(value => value / peak), required = target.requiredPitchClasses || [...new Set((target.pitches || [target.midi]).map(pitch => pitch % 12))], optional = target.optionalPitchClasses || [];
  const matched = required.filter(pitchClass => normalized[pitchClass] >= .16), expectedScore = required.reduce((sum,pitchClass) => sum + normalized[pitchClass],0) / required.length, optionalScore = optional.length ? optional.reduce((sum,pitchClass) => sum + normalized[pitchClass],0) / optional.length : expectedScore, confidence = Math.min(1,expectedScore * .82 + optionalScore * .18);
  return { confidence, matched:matched.length, required:required.length, pass:matched.length === required.length && confidence >= .3 };
}

function registerChordResult(result,target) {
  els.heardNote.textContent = `${Math.round(result.confidence * 100)}%`; els.heardCents.textContent = `${result.matched}/${result.required} core tones`;
  if (result.pass) { els.statusTitle.textContent = target.strum ? `Yes — ${target.chord}` : expectedPitches(target).length > 1 ? "Yes — both hands" : `Yes — ${noteLabel(target.midi)}`; els.statusCopy.textContent = activeInput === "midi" ? "Exact MIDI match" : "Chord tones recognized"; advance(); }
  else { els.statusTitle.textContent = `Listening for ${target.strum ? target.chord : "both notes"}`; els.statusCopy.textContent = "Let every required tone ring together"; }
}

function expectedPitches(target) { return target?.pitches || (target ? [target.midi] : []); }
function evaluateMidiTarget() { const target = song.notes[currentIndex]; if (!target) return; const expected = expectedPitches(target), exact = expected.every(pitch => midiPressed.has(pitch)); els.heardNote.textContent = [...midiPressed].sort((a,b) => a-b).map(noteLabel).join("+") || "—"; els.heardCents.textContent = `${midiPressed.size} MIDI note${midiPressed.size === 1 ? "" : "s"}`; if (exact) registerChordResult({confidence:1,matched:expected.length,required:expected.length,pass:true},target); else { els.statusTitle.textContent = `MIDI: ${expected.map(noteLabel).join(" + ")}`; els.statusCopy.textContent = "Hold the highlighted notes together"; } }
function handleMidiMessage(event) { const [status,note,velocity = 0] = event.data, command = status & 240; if (command === 144 && velocity > 0) { midiPressed.add(note); evaluateMidiTarget(); } else if (command === 128 || (command === 144 && velocity === 0)) midiPressed.delete(note); }
async function connectMidi() { if (!navigator.requestMIDIAccess) { showToast("Web MIDI is not available here. Use the device microphone or a supported desktop browser."); setInputMode("mic"); return; } try { midiAccess ||= await navigator.requestMIDIAccess(); for (const input of midiAccess.inputs.values()) input.onmidimessage = handleMidiMessage; midiAccess.onstatechange = () => { for (const input of midiAccess.inputs.values()) input.onmidimessage = handleMidiMessage; els.inputStatus.textContent = midiAccess.inputs.size ? "MIDI keyboard connected" : "Waiting for a MIDI keyboard"; }; els.inputStatus.textContent = midiAccess.inputs.size ? "MIDI keyboard connected" : "Waiting for a MIDI keyboard"; els.statusTitle.textContent = midiAccess.inputs.size ? "MIDI ready" : "Waiting for MIDI keyboard"; els.statusCopy.textContent = "Play the highlighted notes together"; } catch (_) { showToast("MIDI permission was not granted."); setInputMode("mic"); } }
function setInputMode(mode) { activeInput = mode; els.inputButtons.forEach(button => { const active = button.dataset.input === mode; button.classList.toggle("active",active); button.setAttribute("aria-pressed",active); }); if (mode === "midi") { stopListening(); els.mic.disabled = true; els.mic.querySelector("strong").textContent = "MIDI input active"; els.mic.querySelector("small").textContent = "Use your connected keyboard"; connectMidi(); } else { els.mic.disabled = false; els.mic.querySelector("strong").textContent = listening ? "Listening now" : "Start listening"; els.mic.querySelector("small").textContent = listening ? "Tap to stop" : "Uses your device microphone"; els.inputStatus.textContent = "Using device microphone"; } }

async function startListening() {
  if (listening) { stopListening(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { showToast("Microphone input is not supported in this browser."); return; }
  try {
    initAudio(); micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const analyser = audioContext.createAnalyser(); analyser.fftSize = 2048; audioContext.createMediaStreamSource(micStream).connect(analyser); const buffer = new Float32Array(analyser.fftSize);
    listening = true; els.followStatus.classList.add("listening"); els.mic.classList.add("is-on"); els.mic.querySelector("strong").textContent = "Listening now"; els.mic.querySelector("small").textContent = "Tap to stop";
    const firstTarget = song.notes[currentIndex]; els.statusTitle.textContent = firstTarget.strum ? `Listening for ${firstTarget.direction} ${firstTarget.chord}` : `Listening for ${noteLabel(firstTarget.midi)}`; els.statusCopy.textContent = firstTarget.strum ? "Strum the highlighted chord" : "Play the highlighted note";
    const detect = timestamp => { if (!listening) return; if (timestamp - lastAnalysis > 75) { analyser.getFloatTimeDomainData(buffer); const target = song.notes[currentIndex], level = signalLevel(buffer), chordTarget = expectedPitches(target).length > 1; if (timestamp >= recognitionMutedUntil && target?.strum) { if (level > .035 && lastStrumLevel < .025 && timestamp - lastStrumAt > 450) { lastStrumAt = timestamp; pendingChordAt = timestamp + 90; els.statusTitle.textContent = `Checking ${target.chord}…`; els.statusCopy.textContent = "Let the chord ring"; } if (pendingChordAt && timestamp >= pendingChordAt) { pendingChordAt = 0; registerChordResult(analyzeChord(buffer,audioContext.sampleRate,target),target); } } else if (timestamp >= recognitionMutedUntil && chordTarget) { if (level > .018) { const result = analyzeChord(buffer,audioContext.sampleRate,target); if (result.pass) { correctFrames++; if (correctFrames >= MATCHES_NEEDED) { correctFrames = 0; registerChordResult(result,target); } else { els.statusTitle.textContent = "Both hands detected"; els.statusCopy.textContent = "Hold them together…"; } } else { correctFrames = 0; registerChordResult(result,target); } } } else if (timestamp >= recognitionMutedUntil) { const pitch = autoCorrelate(buffer,audioContext.sampleRate); if (pitch > 0) updateHeard(pitch); } lastStrumLevel = level; lastAnalysis = timestamp; } micFrame = requestAnimationFrame(detect); };
    micFrame = requestAnimationFrame(detect);
  } catch (_) { showToast(`Allow microphone access so OpenKeys can hear your ${INSTRUMENTS[activeInstrument].name.toLowerCase()}.`); }
}

function stopListening() {
  listening = false; cancelAnimationFrame(micFrame); micStream?.getTracks().forEach(track => track.stop()); els.followStatus.classList.remove("listening"); els.mic.classList.remove("is-on");
  els.mic.querySelector("strong").textContent = "Start listening"; els.mic.querySelector("small").textContent = "Uses your device microphone";
  if (currentIndex < song.notes.length) { els.statusTitle.textContent = "Listening paused"; els.statusCopy.textContent = "Tap Start listening when you’re ready"; }
}

function playTarget(note,when,duration) { if (note.strum) note.chordPitches.forEach((pitch,index) => playGuitarTone(pitch,when + index * .025,duration,note.velocity)); else if (note.pitches?.length > 1) note.pitches.forEach((pitch,index) => playPianoTone(pitch,when + index * .012,duration,note.velocity)); else playTone(note.midi,when,duration,note.velocity); }
function playPhrase() {
  if (previewing) return;
  if (listening) stopListening();
  const previewSong = song, start = Math.floor(currentIndex / 16) * 16, end = Math.min(start + 16,song.notes.length), stepMs = 430;
  previewing = true;
  els.hearPhrase.disabled = true; els.phraseLabel.textContent = "Playing preview…"; els.statusTitle.textContent = "Listen and watch"; els.statusCopy.textContent = "The play marker follows each note";
  for (let i = start; i < end; i++) {
    const when = (i - start) * stepMs / 1000; playTarget(song.notes[i],when,.34); if (song.plan?.ensemble && (i - start) % 4 === 0) playEnsembleCue(song.notes[i],when + .08);
  }
  const startedAt = performance.now(), totalDuration = (end - start) * stepMs + 150;
  const animate = now => {
    if (song !== previewSong) { previewIndex = null; previewing = false; els.hearPhrase.disabled = false; cancelAnimationFrame(previewFrame); return; }
    const elapsed = now - startedAt;
    previewIndex = start + Math.min(end - start - 1,elapsed / stepMs);
    render(); els.phraseLabel.textContent = "Playing preview…";
    if (elapsed < totalDuration) previewFrame = requestAnimationFrame(animate);
    else { previewIndex = null; previewing = false; previewFrame = 0; els.hearPhrase.disabled = false; render(); els.statusTitle.textContent = "Your turn"; els.statusCopy.textContent = "Play the highlighted note when you’re ready"; }
  };
  previewFrame = requestAnimationFrame(animate);
}
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

els.mic.addEventListener("click", startListening); els.hearPhrase.addEventListener("click", playPhrase);
els.restart.addEventListener("click", () => { currentIndex = 0; correctFrames = 0; wrongFrames = 0; combo = 0; matchHistory = []; els.comboValue.textContent = "×0"; render(); const first = song.notes[0]; els.statusTitle.textContent = listening ? first.strum ? `Listening for ${first.direction} ${first.chord}` : `Listening for ${noteLabel(first.midi)}` : first.strum ? "Ready to strum" : "Ready to listen"; els.statusCopy.textContent = listening ? first.strum ? "Strum the highlighted chord" : "Play the highlighted note" : "Turn on your microphone to begin"; });
els.settings.addEventListener("click", () => els.help.showModal()); els.dialogClose.addEventListener("click", () => els.help.close()); els.help.addEventListener("click", event => { if (event.target === els.help) els.help.close(); });
els.libraryButton.addEventListener("click", () => { renderLibrary(); els.library.showModal(); }); els.libraryClose.addEventListener("click", () => els.library.close());
els.library.addEventListener("click", event => { if (event.target === els.library) els.library.close(); });
function selectInstrument(id) { activeInstrument = id; try { localStorage.setItem(profileStorageKey("instrument"),activeInstrument); } catch (_) {} els.instrumentButtons.forEach(item => { const active = item.dataset.instrument === id; item.classList.toggle("active", active); item.setAttribute("aria-pressed", active); }); renderJourney(); renderLibrary(); const plans = CURRICULA[id], next = plans.find(plan => !planComplete(plan)) || plans[plans.length - 1]; startPlan(next); showToast(`${INSTRUMENTS[id].name} journey · ${next.title}`); }
els.instrumentButtons.forEach(button => button.addEventListener("click", () => selectInstrument(button.dataset.instrument)));
els.inputButtons.forEach(button => button.addEventListener("click", () => setInputMode(button.dataset.input)));
els.profileButton.addEventListener("click",() => { renderProfiles(); els.profiles.showModal(); }); els.profilesClose.addEventListener("click",() => els.profiles.close()); els.profiles.addEventListener("click",event => { if (event.target === els.profiles) els.profiles.close(); });
els.profileForm.addEventListener("submit",event => { event.preventDefault(); const name = els.profileNameInput.value.trim(); if (!name) return; if (family.profiles.length >= 6) { showToast("This device can hold up to six family profiles."); return; } const profile = {id:`player-${Date.now()}`,name,color:PROFILE_COLORS[family.profiles.length % PROFILE_COLORS.length]}; family.profiles.push(profile); els.profileNameInput.value = ""; saveFamily(); activateProfile(profile.id); });
els.journeyButton.addEventListener("click", () => { renderJourney(); els.journey.showModal(); }); els.railJourney.addEventListener("click", () => { renderJourney(); els.journey.showModal(); }); els.journeyClose.addEventListener("click", () => els.journey.close()); els.journey.addEventListener("click", event => { if (event.target === els.journey) els.journey.close(); });
document.querySelectorAll(".library-filter button").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".library-filter button").forEach(item => item.classList.toggle("active", item === button)); renderLibrary(button.dataset.filter); }));
els.midi.addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { stopListening(); song = parseMidi(await file.arrayBuffer()); currentIndex = 0; combo = 0; els.comboValue.textContent = "×0"; els.title.textContent = song.name; els.composer.textContent = `${file.name} · ${song.notes.length} notes`; render(); showToast(`Ready — ${song.notes.length} notes loaded locally`); } catch (error) { showToast(error.message); } event.target.value = ""; });
function showToast(message) { els.toast.textContent = message; els.toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 3000); }
document.addEventListener("visibilitychange", () => { if (document.hidden && listening) stopListening(); });
els.instrumentButtons.forEach(button => { const active = button.dataset.instrument === activeInstrument; button.classList.toggle("active", active); button.setAttribute("aria-pressed", active); }); els.inputButtons.forEach(button => button.setAttribute("aria-pressed",button.dataset.input === activeInput)); const initialPlans = CURRICULA[activeInstrument], initialPlan = initialPlans.find(plan => !planComplete(plan)) || initialPlans[initialPlans.length - 1]; song = plannedLesson(initialPlan); els.title.textContent = song.name; els.composer.textContent = `${song.composer} · ${initialPlan.skill}`; renderProfiles(); renderJourney(); renderLibrary(); render();
