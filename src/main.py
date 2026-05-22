#!/usr/bin/env python3
"""AIR-Look Web — local bridge for the AIR-Look-compatible WiFi otoscope.

The official Android app (``com.air.airlook``) talks to the camera over a
proprietary UDP protocol on its SoftAP. This bridge re-implements that
protocol in Python and serves a browser UI + REST API + MJPEG stream.

Quick start::

    # Camera IP and HTTP port use defaults (192.168.0.10, 8090)
    python3 src/main.py

    # Custom camera IP
    python3 src/main.py -c 192.168.1.1

    # Custom HTTP port
    python3 src/main.py -p 9000

    # Both
    python3 src/main.py -c 192.168.1.1 -p 9000 --bind 127.0.0.1

Open ``http://<bind>:<port>/`` in any browser.
"""
from __future__ import annotations

import argparse
import socket
import sys
import threading

from protocol import SetcmdClient, CTRL_PORT
from stream import FrameStore, START_PKT, STOP_PKT, VIDEO_PORT, receiver, keepalive_sender
from server import serve

DEFAULT_CAM_IP = "192.168.0.10"
DEFAULT_HTTP_PORT = 8090
DEFAULT_BIND = "0.0.0.0"


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(
        prog="airlook-web",
        description="Local bridge + browser UI for AIR-Look-compatible WiFi otoscopes.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  %(prog)s                                  use defaults (cam 192.168.0.10, port 8090)
  %(prog)s -c 192.168.1.1                   custom camera gateway IP
  %(prog)s -p 9000                          serve UI on port 9000
  %(prog)s --bind 127.0.0.1                 listen on loopback only
""",
    )
    ap.add_argument(
        "-c", "--cam-ip", default=DEFAULT_CAM_IP, metavar="IP",
        help=f"camera SoftAP gateway IP (default: {DEFAULT_CAM_IP})",
    )
    ap.add_argument(
        "-p", "--port", dest="http_port", type=int, default=DEFAULT_HTTP_PORT, metavar="PORT",
        help=f"HTTP port for the web UI (default: {DEFAULT_HTTP_PORT})",
    )
    ap.add_argument(
        "--bind", default=DEFAULT_BIND, metavar="ADDR",
        help=f"HTTP bind address (default: {DEFAULT_BIND})",
    )
    return ap.parse_args()


def print_banner(args: argparse.Namespace, local_udp_port: int) -> None:
    ui_url = f"http://{'localhost' if args.bind == '0.0.0.0' else args.bind}:{args.http_port}/"
    print("─" * 60)
    print(f"  AIR-Look Web bridge")
    print("─" * 60)
    print(f"  Camera     {args.cam_ip}   (UDP video:{VIDEO_PORT}, control:{CTRL_PORT})")
    print(f"  Local UDP  :{local_udp_port}                  (video receive)")
    print(f"  Web UI     {ui_url}")
    print(f"  Bind       {args.bind}:{args.http_port}")
    print("─" * 60)
    print("  Ctrl+C to stop.")
    print()


def main() -> None:
    args = parse_args()

    # ---- video UDP socket ----
    vsock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    vsock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 4 * 1024 * 1024)
    try:
        vsock.bind(("0.0.0.0", 0))
    except OSError as e:
        sys.exit(f"[!] could not bind UDP socket: {e}")
    local_udp_port = vsock.getsockname()[1]

    print_banner(args, local_udp_port)

    # initial start burst — 11 packets for UDP reliability (matches what the
    # native library does in SelfCamera::do_send_cmd)
    for _ in range(11):
        vsock.sendto(START_PKT, (args.cam_ip, VIDEO_PORT))

    # ---- shared state + worker threads ----
    store = FrameStore()
    threading.Thread(target=receiver, args=(vsock, store), daemon=True).start()
    threading.Thread(target=keepalive_sender, args=(vsock, args.cam_ip),
                     daemon=True).start()

    setcmd = SetcmdClient(args.cam_ip)

    # ---- HTTP server (blocks) ----
    try:
        serve(args.bind, args.http_port, store, setcmd)
    except KeyboardInterrupt:
        print("\n[*] shutting down ...")
        for _ in range(3):
            vsock.sendto(STOP_PKT, (args.cam_ip, VIDEO_PORT))
        vsock.close()
    except OSError as e:
        sys.exit(f"[!] could not bind HTTP server: {e}")


if __name__ == "__main__":
    main()
