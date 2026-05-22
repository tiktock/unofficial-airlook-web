# Video stream — UDP/8032

Video is **camera-push, MJPEG over UDP**. Each JPEG frame is fragmented
across many 1460-byte UDP packets. To start the stream the client sends a
single command (opcode 1) — the camera then sprays JPEGs back at the
source port of that command.

## Start / stop

```
client → camera:8032   24 bytes
  [0:2]    99 99           magic
  [2:4]    01 00           opcode = 1 (start)  or  02 00 (stop)
  [4:24]   zeros
```

Sent **11 times in a row** at startup — the native library does this
because UDP doesn't retransmit, and a missed start command means a dead
stream. After that, send the same start packet every 500 ms as a keep-alive
or the camera will time out the stream.

The camera streams to whichever source port the start packet originated
from. So bind a UDP socket, send the start packet from it, and recv on the
same socket.

## Chunk header

Every push packet from the camera is layered like:

```
offset  size   field             notes
────────────────────────────────────────────────────────────────────────
[0]     1      0x66              chunk magic, every packet
[1]     1      chunk type        0x01 first, 0x03 middle, 0x02 last
[2:4]   2      frame counter     LE u16, increments per JPEG
[4:6]   2      ???               varies per frame; probably wall-clock
[6:12]  6      zeros
[12:14] 2      packet index      LE u16, within current frame; 0-based
[14:16] 2      payload size      LE u16, bytes of JPEG in this packet
[16:20] 4      accelerometer     packed X/Y/Z (see below) — per-frame, same
                                 value in every chunk of one frame
[20:24] 4      zeros / reserved
[24:..] N      JPEG bytes        first chunk starts with 0xFF 0xD8 (SOI),
                                 last chunk ends with 0xFF 0xD9 (EOI)
```

Useful invariants:

* `payload size` (bytes 14:16) is the canonical length of the JPEG slice in
  this packet. For full chunks this equals `0x059C = 1436` (= 1460 − 24).
* Bytes 16:20 are **the same across every chunk of one frame** — the SDK
  treats them as per-frame metadata. The accelerometer reading is taken
  once per frame on the camera side.
* The last chunk is short. Its payload size tells you exactly how many
  trailing JPEG bytes to read.

## Reassembly

```python
cur = bytearray()
cur_fid = None
cur_idx = -1
while True:
    pkt, _ = sock.recvfrom(2048)
    if pkt[0] != 0x66:                          # not a video packet
        continue
    ctype  = pkt[1]
    fid    = u16(pkt, 2)
    p_idx  = u16(pkt, 12)
    p_len  = u16(pkt, 14)
    accel  = u32(pkt, 16)
    body   = pkt[24:24 + p_len]

    if   ctype == 0x01:                          # first
        cur, cur_fid, cur_idx = bytearray(body), fid, p_idx
    elif ctype == 0x03 and cur_fid == fid and p_idx == cur_idx + 1:
        cur_idx = p_idx
        cur.extend(body)
    elif ctype == 0x02 and cur_fid == fid:
        cur.extend(body)
        if cur.startswith(b"\xff\xd8") and cur.rfind(b"\xff\xd9") > 0:
            yield bytes(cur), decode_accel(accel)
        cur, cur_fid = bytearray(), None
    else:
        cur, cur_fid = bytearray(), None         # drop on out-of-order
```

On a quiet LAN the camera streams at ~17 fps (matches what `bridge.py`
measures). Frames range from ~10 KB (low detail) to ~30 KB (rich texture).

## Accelerometer encoding

The 32-bit integer at bytes 16-19 packs three axis readings:

```
bit 31           20 19         10 9            0
 ┌───────────────┐┌─────────────┐┌─────────────┐
 │   X (12 bit)  ││  Y (10 bit) ││  Z (10 bit) │
 └───────────────┘└─────────────┘└─────────────┘
```

Decode:

```python
x = (raw >> 20) & 0xFFF
y = (raw >> 10) & 0x3FF
z =  raw        & 0x3FF
```

The values are raw ADC counts (0..1023 for Y/Z, 0..4095 for X), not gs.
The official app's `StreamSelf.doExecuteMJPEG()` uses these to compute
device tilt and trigger automatic image rotation when the camera is held
sideways. Our bridge just exposes the raw values via Server-Sent Events at
`GET /api/accel/stream` — let consumers do their own filtering.

## Why is the data in the video packets?

Embedding per-frame sensor metadata in the chunk header is unusual — most
cameras would use a separate control channel. Two practical reasons:

* It synchronises sensor readings with the corresponding frame exactly
  (no clock skew, no separate polling loop).
* It costs zero extra packets / Wi-Fi airtime on a power-constrained
  embedded device.

The SDK exposes the value through `nativeGetAccelerometer(handle)` —
internally just reading whatever the most recent chunk header carried.
