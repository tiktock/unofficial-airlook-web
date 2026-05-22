# `src/` — Unofficial AIR-Look Web bridge

A single-process Python server that talks to an AIR-Look-compatible WiFi
otoscope over the camera's proprietary UDP protocol, re-publishes the video
stream as MJPEG over HTTP, and serves a self-contained web UI with controls,
photo capture, and recording.

The protocol details are in [`../analysis/`](../analysis/).

## Layout

```
src/
├── main.py        — entrypoint; CLI args, wires components together
├── protocol.py    — SetcmdClient + opcode tables + battery/board decoders
├── stream.py      — FrameStore + UDP receiver thread + keep-alive
├── server.py      — HTTP handler (REST + SSE + MJPEG + static UI)
└── ui/
    ├── index.html
    ├── app.css
    └── app.js     — i18n dictionary + view state + canvas capture/record
```

Python 3.10+, no third-party packages — everything is `stdlib`.

## Run

Connect the host to the camera's SoftAP (default SSID like
`JesHome-P6X-XXXXXX`), then:

```bash
python3 src/main.py                          # uses defaults
python3 src/main.py -c 192.168.1.1           # custom camera IP
python3 src/main.py -p 9000                  # custom UI port
python3 src/main.py --bind 127.0.0.1         # loopback only
python3 src/main.py -c 192.168.1.1 -p 9000 --bind 127.0.0.1
```

Available flags:

| Flag | Default | Meaning |
|---|---|---|
| `-c`, `--cam-ip IP` | `192.168.0.10` | Camera SoftAP gateway IP |
| `-p`, `--port PORT` | `8090` | HTTP port for the web UI |
| `--bind ADDR` | `0.0.0.0` | HTTP bind address |

Run `python3 src/main.py --help` for the full reference.

Open `http://localhost:8090/` in any modern browser.

The bridge auto-detects the page language from `navigator.language` (Korean
or English). Toggle via the `EN` / `한` button in the header.

## HTTP endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Web UI (index.html) |
| GET | `/ui/<file>` | Static UI assets |
| GET | `/stream.mjpg` | Live MJPEG (multipart/x-mixed-replace) |
| GET | `/snapshot.jpg` | Single JPEG frame |
| GET | `/api/info` | Full snapshot — slow (~1 s), call once |
| GET | `/api/dynamic` | Light snapshot — battery + LED + accel + stream stats |
| GET | `/api/accel/stream` | Server-Sent Events, per-frame XYZ accelerometer |
| GET | `/api/battery` | `get_battery` direct |
| GET | `/api/board` | `get_board_info` direct |
| GET | `/api/mac` | MAC via `0x101b` (slow — board.mac is the same) |
| GET | `/api/led` | Current PWM + level |
| GET | `/api/help` | JSON endpoint reference |
| POST | `/api/led?pwm=N` | Set LED PWM |
| POST | `/api/led?level=N` | Set LED level |
| POST | `/api/resolution?w=W&h=H` | Change resolution (most firmwares ignore) |
| POST | `/api/reboot` | Reboot (some firmwares = shutdown) |
| POST | `/api/shutdown` | Shutdown |
| POST | `/api/wifi/set-name?name=...` | Rename SoftAP (applies on next reboot) |
| POST | `/api/wifi/set-password?password=...` | Set Wi-Fi password (applies on next reboot) |
| POST | `/api/wifi/clear-password` | Remove password (applies on next reboot) |

## UI features

* Live video display via plain `<img src="/stream.mjpg">` — no plugins.
* Manual rotation (90° steps), horizontal / vertical flip, digital zoom 1–4×.
* **Auto-rotate** that drives the displayed angle from the gyro feed — `atan2`
  of the live accelerometer with low-pass smoothing and a 0.5° dead-band,
  so the displayed image stays upright as the otoscope is twisted in the
  hand. Sub-1° precision; toggle with the `A` key.
* Brightness / contrast / saturation CSS filters — all applied to saved
  photos / recordings via `<canvas>`.
* 📷 Photo save — exports JPEG at the displayed orientation / zoom / filters.
  Bounding-box canvas, so arbitrary rotation angles don't crop the image.
* 🔴 Video record — `MediaRecorder` on a canvas `captureStream`, downloads
  WebM (or MP4 if the browser supports it). Orientation is locked at
  record start.
* Fullscreen toggle (Fullscreen API).
* Keyboard shortcuts (`Space` = photo, `R` = record, `F` = fullscreen,
  `A` = auto-rotate, `H` / `V` = flip, `L` = LED, `←` / `→` = rotate,
  `+` / `-` = zoom, `0` = reset everything).
* Battery state, voltage, charge bitfield interpretation, MAC, firmware,
  SoC — all derived from the SDK's own command set.
* Live XYZ accelerometer feed at ~30 Hz via Server-Sent Events.
* Wi-Fi SoftAP renaming / password change behind an expander with the
  appropriate "applies on next reboot" warning.
* All user-visible strings live in an i18n dictionary; switching language
  re-renders the entire UI instantly.

## Architecture notes

* **One UDP socket** is used for the video stream — the camera pushes
  MJPEG back to the source port of the start packet, so the same socket
  is used to send and receive.
* `FrameStore` holds the most recent JPEG and accelerometer reading. A
  `threading.Condition` is the wake-up channel — every consumer (HTTP
  multipart writer, `/snapshot.jpg`, accel SSE) calls `wait_next(last_seq)`
  to block until a newer frame arrives.
* The control client (`SetcmdClient`) opens a fresh UDP socket per
  command. There's no persistent control connection.
* `get_board_info` is fetched **once** on page load (slow). Subsequent
  polling hits `/api/dynamic` which skips it. This drops the per-poll cost
  from ~1.8 s to ~25 ms and allows a 1 s polling cadence.
* Accelerometer goes through SSE rather than polling because it updates
  every video frame (≈30 Hz) — far above what any poll loop should attempt.
