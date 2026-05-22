"""Video-stream layer.

Camera pushes MJPEG over UDP/8032 in 1460-byte chunks. Each chunk has a
24-byte header (magic 0x66, frame counter, packet index, accelerometer reading)
followed by raw JPEG bytes. The receiver thread reassembles JPEGs and
publishes them through :class:`FrameStore`.

Start/stop is a 24-byte 0x9999 packet to ``cam:8032`` (sent 11× initially +
500 ms keep-alive). See ``analysis/video-stream.md`` for the protocol.
"""
from __future__ import annotations

import socket
import struct
import threading
import time

VIDEO_PORT = 8032
HEADER_LEN = 24
CHUNK_FIRST, CHUNK_MIDDLE, CHUNK_LAST = 0x01, 0x03, 0x02

START_PKT = bytes([0x99, 0x99, 0x01, 0x00]) + bytes(20)
STOP_PKT  = bytes([0x99, 0x99, 0x02, 0x00]) + bytes(20)


class FrameStore:
    """Latest-frame buffer with a condition variable for waiters.

    Producers (the UDP receiver) call :meth:`publish` whenever a complete JPEG
    frame is assembled. Consumers (HTTP MJPEG stream, snapshot endpoint, SSE
    accelerometer stream) call :meth:`wait_next` to block until something
    newer than their last-seen sequence number appears.
    """

    def __init__(self) -> None:
        self._cv = threading.Condition()
        self._latest: bytes | None = None
        self._seq = 0
        self._stats = {"frames": 0, "started": time.time()}
        self._accel: dict | None = None

    @property
    def seq(self) -> int:
        return self._seq

    @property
    def stats(self) -> dict:
        return self._stats

    @property
    def accel(self) -> dict | None:
        return self._accel

    def publish(self, jpg: bytes, accel: dict | None = None) -> None:
        with self._cv:
            self._latest = jpg
            self._seq += 1
            self._stats["frames"] += 1
            if accel is not None:
                self._accel = accel
            self._cv.notify_all()

    def wait_next(self, last_seen: int, timeout: float = 5.0):
        """Block until a frame newer than ``last_seen`` is published.
        Returns ``(seq, jpg_bytes)`` or ``None`` on timeout."""
        with self._cv:
            if self._seq == last_seen:
                self._cv.wait(timeout=timeout)
            if self._latest is None or self._seq == last_seen:
                return None
            return self._seq, self._latest


def _decode_accel(raw: int) -> dict:
    """Decode the packed accelerometer field from a video chunk header.

    Bit layout matches the Java reference implementation in
    ``StreamSelf.doExecuteMJPEG()``::

        X = (raw >> 20) & 0xFFF   (12 bits)
        Y = (raw >> 10) & 0x3FF   (10 bits)
        Z =  raw        & 0x3FF   (10 bits)
    """
    return {
        "x": (raw >> 20) & 0xFFF,
        "y": (raw >> 10) & 0x3FF,
        "z":  raw         & 0x3FF,
        "raw": raw,
    }


def receiver(sock: socket.socket, store: FrameStore) -> None:
    """UDP receiver loop. Runs in its own thread.

    Reassembles JPEG frames from chunked UDP packets and publishes each
    complete frame (plus the latest accelerometer reading) to ``store``.
    """
    cur = bytearray()
    cur_fid: int | None = None
    cur_idx = -1
    cur_accel: dict | None = None
    while True:
        try:
            data, _ = sock.recvfrom(2048)
        except OSError:
            return
        if len(data) < HEADER_LEN or data[0] != 0x66:
            continue
        ctype = data[1]
        fid = struct.unpack_from("<H", data, 2)[0]
        pkt_idx = struct.unpack_from("<H", data, 12)[0]
        plen = struct.unpack_from("<H", data, 14)[0]
        accel_raw = struct.unpack_from("<I", data, 16)[0]
        payload = data[HEADER_LEN:HEADER_LEN + plen] if plen else data[HEADER_LEN:]

        if ctype == CHUNK_FIRST:
            cur = bytearray(payload); cur_fid = fid; cur_idx = pkt_idx
            cur_accel = _decode_accel(accel_raw)
        elif ctype == CHUNK_MIDDLE:
            if cur_fid != fid or pkt_idx != cur_idx + 1:
                cur = bytearray(); cur_fid = None
                continue
            cur_idx = pkt_idx
            cur.extend(payload)
        elif ctype == CHUNK_LAST:
            if cur_fid != fid:
                cur = bytearray(); cur_fid = None
                continue
            cur.extend(payload)
            if len(cur) > 4 and cur[0] == 0xFF and cur[1] == 0xD8:
                eoi = cur.rfind(b"\xff\xd9")
                if eoi > 0:
                    store.publish(bytes(cur[: eoi + 2]), accel=cur_accel)
            cur = bytearray(); cur_fid = None; cur_idx = -1
            cur_accel = None


def keepalive_sender(sock: socket.socket, cam_ip: str, interval: float = 0.5) -> None:
    """Re-send the start-preview opcode periodically so the camera keeps the
    UDP stream alive.

    Loops forever. Transient network errors (Wi-Fi blip, host unreachable
    while the camera is asleep) are swallowed so the thread survives — when
    the link comes back, the next ``sendto`` succeeds and streaming resumes.
    """
    while True:
        try:
            sock.sendto(START_PKT, (cam_ip, VIDEO_PORT))
        except OSError:
            pass  # network down for a moment — keep trying
        time.sleep(interval)
