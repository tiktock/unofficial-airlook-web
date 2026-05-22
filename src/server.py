"""HTTP server: REST API, MJPEG stream, accelerometer SSE, static UI."""
from __future__ import annotations

import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

from protocol import SetcmdClient
from stream import FrameStore

UI_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ui")
STATIC_MIME = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".png":  "image/png",
    ".svg":  "image/svg+xml",
}


def make_handler(store: FrameStore, setcmd: SetcmdClient):
    """Factory that wires the per-request handler to shared state."""

    class Handler(BaseHTTPRequestHandler):
        BOUNDARY = "frame"

        def log_message(self, *_args) -> None:
            return  # silence default logging

        # ---- helpers ----
        def _send_json(self, obj, status: int = 200) -> None:
            body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _send_static(self, path: str) -> None:
            full = os.path.join(UI_DIR, path)
            if not os.path.isfile(full) or not full.startswith(UI_DIR):
                self.send_error(404)
                return
            ext = os.path.splitext(full)[1].lower()
            mime = STATIC_MIME.get(ext, "application/octet-stream")
            with open(full, "rb") as f:
                body = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _query(self) -> dict[str, str]:
            q = parse_qs(urlparse(self.path).query)
            return {k: v[0] for k, v in q.items()}

        # ---- routing ----
        def do_GET(self) -> None:  # noqa: N802
            p = urlparse(self.path).path.rstrip("/") or "/"
            try:
                if p == "/":
                    self._send_static("index.html")
                elif p.startswith("/ui/"):
                    self._send_static(p[len("/ui/"):])
                elif p in ("/stream.mjpg", "/stream", "/video"):
                    self._stream_mjpeg()
                elif p == "/snapshot.jpg":
                    self._snapshot()
                elif p == "/api/info":
                    self._api_info()
                elif p == "/api/dynamic":
                    self._api_dynamic()
                elif p == "/api/accel/stream":
                    self._sse_accel()
                elif p == "/api/battery":
                    self._send_json({"battery": setcmd.get_battery()})
                elif p == "/api/board":
                    self._send_json({"board": setcmd.get_board_info()})
                elif p == "/api/mac":
                    self._send_json({"mac": setcmd.get_mac()})
                elif p == "/api/led":
                    self._send_json({"pwm": setcmd.get_pwm(), "level": setcmd.get_level()})
                elif p == "/api/help":
                    self._api_help()
                else:
                    self.send_error(404, "unknown path; try /api/help")
            except (BrokenPipeError, ConnectionResetError):
                return

        def do_POST(self) -> None:  # noqa: N802
            p = urlparse(self.path).path.rstrip("/")
            try:
                if p == "/api/led":
                    self._api_led_set()
                elif p == "/api/resolution":
                    self._api_resolution_set()
                elif p == "/api/reboot":
                    self._send_json({"ok": setcmd.reboot()})
                elif p == "/api/shutdown":
                    self._send_json({"ok": setcmd.shutdown()})
                elif p == "/api/wifi/set-name":
                    self._api_wifi_set_name()
                elif p == "/api/wifi/set-password":
                    self._api_wifi_set_password()
                elif p == "/api/wifi/clear-password":
                    self._send_json({"ok": setcmd.clear_password()})
                else:
                    self.send_error(404, "unknown path; try /api/help")
            except (BrokenPipeError, ConnectionResetError):
                return

        # ---- video endpoints ----
        def _stream_mjpeg(self) -> None:
            self.send_response(200)
            self.send_header("Cache-Control", "no-cache, private")
            self.send_header("Pragma", "no-cache")
            self.send_header("Content-Type", f"multipart/x-mixed-replace; boundary={self.BOUNDARY}")
            self.end_headers()
            last = 0
            while True:
                res = store.wait_next(last, timeout=5.0)
                if res is None:
                    continue
                last, jpg = res
                chunk = (
                    f"--{self.BOUNDARY}\r\nContent-Type: image/jpeg\r\n"
                    f"Content-Length: {len(jpg)}\r\n\r\n"
                ).encode("ascii") + jpg + b"\r\n"
                self.wfile.write(chunk)
                self.wfile.flush()

        def _snapshot(self) -> None:
            res = store.wait_next(0, timeout=5.0)
            if res is None:
                self.send_error(503, "no frame yet")
                return
            _, jpg = res
            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Content-Length", str(len(jpg)))
            self.end_headers()
            self.wfile.write(jpg)

        def _sse_accel(self) -> None:
            """Server-Sent Events stream: per-frame accelerometer readings
            (≈30 Hz on this camera)."""
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache, no-transform")
            self.send_header("Connection", "keep-alive")
            self.send_header("X-Accel-Buffering", "no")
            self.end_headers()
            last_seq = 0
            try:
                self.wfile.write(b"retry: 2000\n\n")
                self.wfile.flush()
                while True:
                    res = store.wait_next(last_seq, timeout=4.0)
                    if res is None:
                        self.wfile.write(b": keepalive\n\n")
                        self.wfile.flush()
                        continue
                    last_seq, _ = res
                    accel = store.accel
                    if accel is None:
                        continue
                    payload = json.dumps(accel, separators=(",", ":"))
                    self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError):
                return

        # ---- API endpoints ----
        def _api_info(self) -> None:
            """Full snapshot — slow (~1 s on first call due to get_mac).
            Only called once on page load; subsequent polling uses /api/dynamic."""
            self._send_json({
                "stream": {"frames": store.stats["frames"],
                           "uptime": round(time.time() - store.stats["started"], 1)},
                "board":   setcmd.get_board_info(),
                "battery": setcmd.get_battery(),
                "pwm":     setcmd.get_pwm(),
                "level":   setcmd.get_level(),
                "mac":     setcmd.get_mac(),
                "accel":   store.accel,
            })

        def _api_dynamic(self) -> None:
            """Lightweight polling snapshot — skips static board info and the
            slow get_mac call. board.mac is the same value anyway."""
            self._send_json({
                "stream": {"frames": store.stats["frames"],
                           "uptime": round(time.time() - store.stats["started"], 1)},
                "battery": setcmd.get_battery(),
                "pwm":     setcmd.get_pwm(),
                "level":   setcmd.get_level(),
                "accel":   store.accel,
            })

        def _api_led_set(self) -> None:
            q = self._query()
            if "pwm" in q:
                v = int(q["pwm"])
                self._send_json({"pwm": v, "ok": setcmd.set_pwm(v)})
            elif "level" in q:
                v = int(q["level"])
                self._send_json({"level": v, "ok": setcmd.set_level(v)})
            else:
                self.send_error(400, "specify ?pwm=N or ?level=N")

        def _api_resolution_set(self) -> None:
            q = self._query()
            try:
                w = int(q["w"]); h = int(q["h"]); mode = int(q.get("mode", 0))
            except (KeyError, ValueError):
                self.send_error(400, "specify ?w=W&h=H[&mode=M]")
                return
            self._send_json({"w": w, "h": h, "mode": mode,
                             "ok": setcmd.set_resolution(w, h, mode)})

        def _api_wifi_set_name(self) -> None:
            name = self._query().get("name", "").strip()
            if not name:
                self.send_error(400, "specify ?name=NewSSID")
                return
            if len(name.encode("utf-8")) > 32:
                self.send_error(400, "SSID too long (max 32 bytes utf-8)")
                return
            self._send_json({"name": name, "ok": setcmd.set_ssid(name)})

        def _api_wifi_set_password(self) -> None:
            pw = self._query().get("password", "")
            if len(pw) < 8 or len(pw) > 63:
                self.send_error(400, "password length must be 8..63")
                return
            self._send_json({"ok": setcmd.set_password(pw)})

        def _api_help(self) -> None:
            self._send_json({
                "video": {
                    "GET /":              "web UI",
                    "GET /stream.mjpg":   "live MJPEG over HTTP (multipart)",
                    "GET /snapshot.jpg":  "single JPEG frame",
                },
                "info": {
                    "GET /api/info":      "full snapshot (board + battery + pwm + level + mac + accel)",
                    "GET /api/dynamic":   "light snapshot (no board/mac) — for periodic polling",
                    "GET /api/battery":   "battery info",
                    "GET /api/board":     "board info JSON",
                    "GET /api/mac":       "device MAC",
                    "GET /api/led":       "current PWM + level",
                    "GET /api/accel/stream": "Server-Sent Events: per-frame XYZ accelerometer",
                },
                "control": {
                    "POST /api/led?pwm=N":            "set LED PWM",
                    "POST /api/led?level=N":          "set LED level",
                    "POST /api/resolution?w=W&h=H":   "change resolution",
                    "POST /api/reboot":               "reboot camera",
                    "POST /api/shutdown":             "shutdown camera",
                    "POST /api/wifi/set-name?name=":      "rename SoftAP",
                    "POST /api/wifi/set-password?password=": "set Wi-Fi password",
                    "POST /api/wifi/clear-password":  "remove Wi-Fi password",
                },
            })

    return Handler


def serve(bind: str, port: int, store: FrameStore, setcmd: SetcmdClient):
    """Start the HTTP server (blocks until KeyboardInterrupt)."""
    Handler = make_handler(store, setcmd)
    httpd = ThreadingHTTPServer((bind, port), Handler)
    try:
        httpd.serve_forever()
    finally:
        httpd.server_close()
