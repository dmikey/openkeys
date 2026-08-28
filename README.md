# OpenKeys

OpenKeys is a free, tablet-first piano coach that turns standard MIDI files into interactive lessons. It listens to a real acoustic or digital piano through the device microphone and advances at the player’s pace. It is dependency-free, privacy-friendly, and deployable to any static host.

## Features

- Import `.mid` and `.midi` files directly in the browser
- Browse six included lessons based on public-domain compositions
- Original code-generated cover art, difficulty filters, XP, stars, and saved progress
- Follow mode that waits until the player performs the correct note
- Focused staff view with the current note and upcoming phrase
- Live note-name, octave, and pitch-accuracy feedback
- Reference-note and phrase playback using Web Audio
- Microphone pitch detection for acoustic or digital pianos
- Responsive, keyboard-accessible interface
- No account, server, tracking, or uploaded audio

## Included music

The built-in catalog includes learning arrangements of works by Beethoven, Mozart, Bach, and James Lord Pierpont, plus the traditional French melody commonly known as “Twinkle, Twinkle, Little Star.” The underlying compositions are in the public domain. The simplified note sequences and abstract cover artwork in this repository are original project assets released under the repository license.

## Run locally

Browsers require a secure context for microphone access. Start a local server rather than opening the HTML file directly:

```sh
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Browser support

Recent versions of Chrome, Edge, Firefox, and Safari are supported. The layout is optimized for a tablet in landscape orientation on a music stand. Microphone recognition works best in a quiet room with one note played at a time.

## Roadmap

- Optional Web MIDI hardware input
- Polyphonic microphone recognition
- Fingering and sheet-music views
- Lesson bookmarks stored locally
- Community curriculum and public-domain MIDI library

## Contributing

Issues, lesson ideas, accessibility improvements, and pull requests are welcome. The goal is to make high-quality piano learning available to anyone with a browser.

## License

MIT
