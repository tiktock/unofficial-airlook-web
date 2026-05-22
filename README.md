# Unofficial AIR-Look Web

<img width="698" height="664" alt="image" src="https://github.com/user-attachments/assets/957dd8ef-55e1-46ba-a275-15965c7b8f52" />

A self-hosted browser interface for **AIR-Look-compatible WiFi otoscopes**
(`com.air.airlook` and family) — the cheap WiFi-SoftAP ear / skin / pet
inspection cameras built around the **mlcamera SDK**. Live video, photo
capture, video recording, LED control, Wi-Fi configuration, all without
installing the (advertising-heavy) official app.

The cameras advertise a `JesHome-*`-style SoftAP that the official Android
app connects to over a proprietary UDP protocol. This project reverse-
engineers that protocol and re-implements the client in Python.

## What's here

```
.
├── src/        ← runnable Python bridge + web UI
└── analysis/   ← reverse-engineering writeup of the UDP protocol
```

* **[`src/`](src/)** — dependency-free Python bridge (stdlib only) plus a
  self-contained web UI. Run it on any host that's connected to the camera's
  SoftAP. Open `http://localhost:8090/`.
* **[`analysis/`](analysis/)** — documents the camera's UDP protocol in
  enough detail that you can write your own client in any language. Covers
  packet formats, the full opcode catalog, video-stream layout, battery /
  accelerometer encoding, and firmware-specific quirks.

## Quick start

```bash
# 1. Connect your laptop's Wi-Fi to the camera's SoftAP
#    (typically named something like `JesHome-P6X-XXXXXX`)
# 2. Run the bridge — defaults work for most cameras
python3 src/main.py
# 3. Open http://localhost:8090/ in a browser
```

Common overrides:

```bash
python3 src/main.py -c 192.168.1.1     # different camera gateway IP
python3 src/main.py -p 9000            # different HTTP port
python3 src/main.py --bind 127.0.0.1   # listen on loopback only
python3 src/main.py --help             # full reference
```

Python 3.10+ — that's the only requirement, no `pip install` needed.

## Features

| Capability | How |
|---|---|
| Live video | MJPEG over HTTP, served as `multipart/x-mixed-replace` to a plain `<img>` |
| Photo save | Client-side `<canvas>` capture, browser download |
| Video record | `MediaRecorder` on canvas `captureStream`, WebM/MP4 |
| Rotation 90° / horizontal-flip / vertical-flip | CSS transform — applied to saved images too |
| Digital zoom 1–4× | CSS transform |
| Brightness / contrast / saturation | CSS `filter:` |
| LED toggle | UDP control command |
| Battery / voltage / charging state | Decoded from the SDK's own polling command |
| Live 30 Hz XYZ accelerometer | Server-Sent Events; data is in every video chunk header |
| Wi-Fi SoftAP rename / password change | UDP control command — applies on next reboot |
| Fullscreen | Fullscreen API |
| Keyboard shortcuts | Space/R/F/H/V/L/←/→/+/-/0 |
| Multi-language UI (KO / EN) | Auto-detect, toggle from header |

## Compatibility

Tested device: **JesHome P6X otoscope** (firmware 1.0.0, MoLink TX816 SoC).
Other devices in the AIR-Look / mlcamera family should work but their
firmware may not implement every opcode equally — see
[`analysis/firmware-quirks.md`](analysis/firmware-quirks.md). The bridge
degrades gracefully: unsupported commands return error toasts in the UI
without crashing.

## Why?

The official Android app works fine but:

* Plays interstitial ads
* No desktop client
* No WebRTC / RTSP / open API
* Hard-coded UI orientation and minimal image controls
* Closed source

This project is the answer to *"my otoscope is a perfectly good little
camera, can I just use it like one?"*

## Acknowledgments

* The SDK is sometimes called **JoyHonest / JHCMD** by other vendors using
  the same chipset family. Existing community reverse-engineering of those
  cameras informed the initial exploration:
  * [n8henrie's WiFi endoscope series](https://n8henrie.com/2019/02/reverse-engineering-my-wifi-endoscope-part-1/)
  * [CHZ-Soft's Wifi microscope writeup](https://www.chzsoft.de/site/hardware/reverse-engineering-a-wifi-microscope/)
  * [mplough's borescope stream rewrite](https://mplough.github.io/2019/12/14/borescope.html)

  The AIR-Look protocol turned out to be a different variant (Format B is
  `0x9999` rather than `JHCMD`), but the structural similarities were a
  useful starting point.
