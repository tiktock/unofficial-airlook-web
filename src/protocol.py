"""AIR-Look camera control protocol (UDP/50000).

Two packet formats live on the same UDP port — both reverse-engineered from
``libmlcamera-2.5.so`` inside the official Android app. See ``analysis/`` for
the full wire-format writeup.

* **Format A — "SETCMD" ASCII** (14-byte header + optional payload)::

    [0:6]    b"SETCMD"
    [6:10]   sequence index (LE u32, incremented per request)
    [10:12]  opcode (LE u16)
    [12:14]  payload length (LE u16)
    [14:..]  payload bytes
    response: b"RETCMD" + idx echo + opcode echo + [opt: length + payload]

* **Format B — 0x9999 binary** (fixed 24 bytes)::

    [0:2]    0x9999 magic (LE u16)
    [2:4]    opcode (LE u16)
    [4:8]    sequence index (LE u32)
    [8:12]   int parameter (LE u32, 0 for queries)
    [12:24]  zeros / additional payload
    response: 24+ bytes, same magic + opcode echo

This module exposes a thread-safe :class:`SetcmdClient` plus opcode tables.
"""
from __future__ import annotations

import json
import socket
import struct
import threading

CTRL_PORT = 50000

# Format A (SETCMD ASCII) opcodes
OP_A = {
    "set_name":           0x0001,
    "set_password":       0x0002,
    "clear_password":     0x0003,
    "reboot":             0x0004,
    "set_resolution":     0x0008,
    "get_resolution":     0x0009,
    "get_remote_key":     0x0090,
}

# Format B (0x9999 binary) opcodes
OP_B = {
    "set_ap_params":      0x1010,
    "clear_ap_params":    0x1011,
    "get_pwm":            0x1015,
    "set_pwm":            0x1016,
    "get_battery":        0x1017,
    "set_switch_mode":    0x1018,
    "shutdown":           0x1019,
    "get_ssid_list":      0x101a,
    "get_mac":            0x101b,
    "get_pwm_status":     0x101c,
    "set_pwm_status":     0x101d,
    "set_ultrasonic":     0x1052,
    "get_ultrasonic":     0x1053,
    "set_level":          0x1054,
    "get_level":          0x1055,
    "get_pwm1":           0x1056,
    "set_pwm1":           0x1057,
    "set_ageing":         0x1058,
    "set_calibration":    0x1062,
    "get_reset_calib":    0x1063,
    "reset_encryption":   0x1064,
    "set_camera_style":   0x1070,
    "get_camera_style":   0x1070,
    "get_board_info":     0x1060,
}


class SetcmdClient:
    """Synchronous request/response client for camera control.

    Each call opens a short-lived UDP socket, sends, waits up to ``timeout``
    seconds for a reply, retries up to ``retries`` times if the camera doesn't
    respond. Thread-safe — the only shared mutable state is the sequence
    counter.
    """

    def __init__(self, cam_ip: str, port: int = CTRL_PORT, timeout: float = 0.6):
        self.cam_ip = cam_ip
        self.port = port
        self.timeout = timeout
        self._seq = 0
        self._lock = threading.Lock()

    # ---- low-level transport ----
    def _next_seq(self) -> int:
        with self._lock:
            self._seq = (self._seq + 1) & 0xFFFFFFFF
            return self._seq

    def _exchange(self, pkt: bytes, retries: int = 3, recv_size: int = 1500) -> bytes | None:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(self.timeout)
        try:
            for _ in range(retries):
                sock.sendto(pkt, (self.cam_ip, self.port))
                try:
                    data, _ = sock.recvfrom(recv_size)
                    return data
                except socket.timeout:
                    continue
            return None
        finally:
            sock.close()

    # ---- Format A: "SETCMD" ----
    def call_a(self, opcode: int, payload: bytes = b"") -> bytes | None:
        """Send a Format-A command. Returns the response payload (may be empty
        for SET-type commands that ACK with a 12-byte header only), or ``None``
        if the camera doesn't respond or replies with the wrong opcode."""
        idx = self._next_seq()
        hdr = b"SETCMD" + struct.pack("<I", idx) + struct.pack("<HH", opcode, len(payload))
        pkt = hdr + payload
        resp = self._exchange(pkt)
        if not resp or len(resp) < 12 or resp[:6] != b"RETCMD":
            return None
        if struct.unpack_from("<H", resp, 10)[0] != opcode:
            return None
        # GET-type responses carry length at [13:15] and payload at [15:].
        # SET-type ACKs are only 12 bytes (no length field).
        if len(resp) >= 15:
            resp_len = struct.unpack_from("<H", resp, 13)[0]
            return resp[15:15 + resp_len]
        return b""

    # ---- Format B: 0x9999 ----
    def call_b(self, opcode: int, int_param: int = 0, recv_size: int = 1024) -> bytes | None:
        """Send a Format-B command. Returns response bytes *after* the
        magic + opcode echo (so callers see ``[idx][param][zeros][payload]``),
        or ``None`` on failure."""
        idx = self._next_seq()
        pkt = struct.pack("<HHII", 0x9999, opcode, idx, int_param) + bytes(12)
        resp = self._exchange(pkt, recv_size=recv_size)
        if not resp or len(resp) < 8:
            return None
        magic, resp_op = struct.unpack_from("<HH", resp, 0)
        if magic != 0x9999 or resp_op != opcode:
            return None
        return resp[4:]

    # ---- high-level commands ----
    def get_board_info(self) -> dict | None:
        """Returns the firmware board-info JSON (brand, model, firmware, MAC, …)."""
        data = self.call_b(OP_B["get_board_info"], recv_size=4096)
        if not data or len(data) < 24:
            return None
        payload_len = struct.unpack_from("<I", data, 8)[0]
        if payload_len == 0 or payload_len > len(data) - 20:
            payload_len = len(data) - 20
        payload = data[20:20 + payload_len]
        try:
            txt = payload.split(b"\x00", 1)[0].decode("utf-8", errors="replace")
            return json.loads(txt) if txt.strip().startswith("{") else {"raw": txt}
        except Exception:
            return {"raw_hex": payload[:128].hex()}

    def get_battery(self) -> dict | None:
        """Decodes :func:`OP_B.get_battery` response into a useful dict.

        Layout (in ``data`` = response with magic+opcode stripped, verified
        live by A/B testing 4 charge states)::

            [4:6]    voltage in mV (LE u16)
            [6]      bitfield — bit0 = charging current, bit1 = battery full
            [12:16]  v1_src; if bit 16 set, percent = low 16 bits
        """
        data = self.call_b(OP_B["get_battery"])
        if not data or len(data) < 16:
            return None
        padded = data + b"\x00" * 16
        voltage_mv = struct.unpack_from("<H", padded, 4)[0]
        charge_byte = padded[6]
        v0 = struct.unpack_from("<I", padded, 4)[0]
        v1_src = struct.unpack_from("<I", padded, 12)[0]
        percent = (v1_src & 0xFFFF) if (v1_src & 0x10000) else None
        return {
            "percent":     percent,
            "voltage_mv":  voltage_mv,
            "is_charging": bool(charge_byte & 0x01),
            "is_full":     bool(charge_byte & 0x02),
            "charge_byte": charge_byte,
            "v0":          v0,
            "v1_raw":      v1_src,
            "raw_hex":     data[:16].hex(),
        }

    def get_mac(self) -> str | None:
        data = self.call_b(OP_B["get_mac"], recv_size=64)
        if not data or len(data) < 6:
            return None
        for off in (4, 8, 12):
            mac = data[off:off + 6]
            if any(mac):
                return ":".join(f"{b:02x}" for b in mac)
        return None

    def get_pwm(self) -> int | None:
        data = self.call_b(OP_B["get_pwm"])
        if not data or len(data) < 4:
            return None
        return struct.unpack_from("<I", data, 4)[0]

    def get_level(self) -> int | None:
        data = self.call_b(OP_B["get_level"])
        if not data or len(data) < 4:
            return None
        return struct.unpack_from("<I", data, 4)[0]

    def set_pwm(self, value: int) -> bool:
        return self.call_b(OP_B["set_pwm"], int_param=value) is not None

    def set_level(self, value: int) -> bool:
        return self.call_b(OP_B["set_level"], int_param=value) is not None

    def set_resolution(self, width: int, height: int, mode: int = 0) -> bool:
        payload = struct.pack("<HHB", width, height, mode)
        return self.call_a(OP_A["set_resolution"], payload) is not None

    def reboot(self) -> bool:
        return self.call_a(OP_A["reboot"]) is not None

    def shutdown(self) -> bool:
        return self.call_b(OP_B["shutdown"]) is not None

    def set_ssid(self, name: str) -> bool:
        return self.call_a(OP_A["set_name"], name.encode("utf-8")[:32]) is not None

    def set_password(self, password: str) -> bool:
        return self.call_a(OP_A["set_password"], password.encode("utf-8")[:63]) is not None

    def clear_password(self) -> bool:
        return self.call_a(OP_A["clear_password"]) is not None
