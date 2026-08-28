"use strict";

const $ = selector => document.querySelector(selector);
const els = {
  title: $("#song-title"), composer: $("#song-composer"), midi: $("#midi-input"), track: $("#notes-track"), counts: $("#count-strip"),
  targetName: $("#target-name"), targetOctave: $("#target-octave"), targetHand: $("#target-hand"), heardNote: $("#heard-note"), heardCents: $("#heard-cents"),
  pitchIndicator: $("#pitch-indicator"), mic: $("#mic-button"), reference: $("#reference-button"), hearPhrase: $("#hear-phrase"), restart: $("#restart-button"),
  statusTitle: $("#status-title"), statusCopy: $("#status-copy"), followStatus: $(".follow-status"), progressText: $("#progress-text"), progressBar: $("#progress-bar"),
  celebration: $("#celebration"), toast: $("#toast"), help: $("#help-dialog"), settings: $("#settings-button"), dialogClose: $("#dialog-close")
};

const AudioContext = window.AudioContext || window.webkitAudioContext;
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const melody = [64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60];
let song = { name: "Ode to Joy", notes: melody.map((midi, i) => ({ midi, start: i * .5, duration: .45, velocity: .75 })) };
let currentIndex = 0, audioContext, masterGain, micStream, micFrame, listening = false, correctFrames = 0, lastAnalysis = 0;

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
  if (target) { els.targetName.textContent = noteName(target.midi); els.targetOctave.textContent = `Octave ${noteOctave(target.midi)}`; els.targetHand.textContent = target.midi < 60 ? "Left hand" : "Right hand"; els.reference.textContent = `Play reference ${noteLabel(target.midi)}`; }
  const done = Math.min(currentIndex, total); els.progressText.textContent = `${done} / ${total}`; els.progressBar.style.width = `${total ? done / total * 100 : 0}%`;
  document.querySelectorAll(".phrase-list li").forEach((item, i) => item.classList.toggle("active", i === (currentIndex < 15 ? 0 : 1)));
}

function advance() {
  currentIndex++; els.celebration.classList.add("show"); clearTimeout(advance.timer); advance.timer = setTimeout(() => els.celebration.classList.remove("show"), 850);
  if (currentIndex >= song.notes.length) { currentIndex = song.notes.length; stopListening(); els.statusTitle.textContent = "Lesson complete"; els.statusCopy.textContent = "You played every note"; showToast("Beautifully played — lesson complete!"); }
  else { render(); correctFrames = 0; }
}

function updateHeard(frequency) {
  const exactMidi = 69 + 12 * Math.log2(frequency / 440), midi = Math.round(exactMidi), cents = Math.round((exactMidi - midi) * 100);
  els.heardNote.textContent = noteLabel(midi); els.heardCents.textContent = `${cents > 0 ? "+" : ""}${cents} cents`; els.pitchIndicator.style.left = `${Math.max(2, Math.min(98, 50 + cents))}%`;
  const target = song.notes[currentIndex];
  if (target && midi === target.midi && Math.abs(cents) < 38) { correctFrames++; els.statusTitle.textContent = `Yes — ${noteLabel(midi)}`; els.statusCopy.textContent = "Hold it just a moment…"; if (correctFrames >= 3) advance(); }
  else { correctFrames = 0; els.statusTitle.textContent = `Listening for ${target ? noteLabel(target.midi) : "your note"}`; els.statusCopy.textContent = midi === target?.midi ? "Very close — let the note ring" : "Try the highlighted note"; }
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

function playPhrase() { const start = Math.floor(currentIndex / 15) * 15, end = Math.min(start + 15, song.notes.length); for (let i = start; i < end; i++) playTone(song.notes[i].midi, (i - start) * .37, .3, song.notes[i].velocity); }
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
els.restart.addEventListener("click", () => { currentIndex = 0; correctFrames = 0; render(); els.statusTitle.textContent = listening ? `Listening for ${noteLabel(song.notes[0].midi)}` : "Ready to listen"; els.statusCopy.textContent = listening ? "Play the highlighted note" : "Turn on your microphone to begin"; });
els.settings.addEventListener("click", () => els.help.showModal()); els.dialogClose.addEventListener("click", () => els.help.close()); els.help.addEventListener("click", event => { if (event.target === els.help) els.help.close(); });
els.midi.addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { stopListening(); song = parseMidi(await file.arrayBuffer()); currentIndex = 0; els.title.textContent = song.name; els.composer.textContent = `${file.name} · ${song.notes.length} notes`; render(); showToast(`Ready — ${song.notes.length} notes loaded locally`); } catch (error) { showToast(error.message); } event.target.value = ""; });
function showToast(message) { els.toast.textContent = message; els.toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 3000); }
document.addEventListener("visibilitychange", () => { if (document.hidden && listening) stopListening(); });
render();
