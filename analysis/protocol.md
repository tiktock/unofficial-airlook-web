# Protocol overview

All control traffic flows over a single UDP port — **50000** — but uses two
incompatible packet formats. Video streaming is on a separate port,
**8032**. The camera never opens any TCP port.

## Network discovery

The camera advertises a 2.4 GHz SoftAP whose SSID is recognisable
(`JesHome-*`, etc.). After the phone joins:

* Camera IP = SoftAP gateway (typically `192.168.0.10` or `192.168.x.1`)
* Phone IP = whatever DHCP hands out (`192.168.0.100` in our case)

The camera also broadcasts a BLE advertisement containing its Wi-Fi MAC — the
official app uses this only as a quick discovery beacon. No GATT
characteristics are written or read; **BLE is not a streaming channel**.

## Format A — `SETCMD` (ASCII magic)

Used for: rename SSID, set/clear password, change resolution, reboot,
get-board-info, get-resolution.

```
offset   bytes   field                    notes
─────────────────────────────────────────────────────────────────────────
[0:6]    6       b"SETCMD"                ASCII magic
[6:10]   4       cmdSendIndex (LE u32)    monotonically increasing seq
[10:12]  2       opcode (LE u16)          see opcodes.md
[12:14]  2       payload length (LE u16)  0 for queries with no args
[14:..]  N       payload                  variable
```

Total minimum size: **14 bytes**.

### Format A response

```
offset   bytes   field                    notes
─────────────────────────────────────────────────────────────────────────
[0:6]    6       b"RETCMD"
[6:10]   4       idx echo (same as req)
[10:12]  2       opcode echo
[12]     1       0                        padding
[13:15]  2       response payload length  optional, 0 / absent for ACKs
[15:..]  N       response payload         JSON / struct / etc.
```

**SET-type commands** (ChangeName, SetPassword, ChangeResolution, Reboot…)
return a **12-byte** header-only ACK — no length field, no payload. Your
parser must accept this short reply or you'll mistakenly mark the command as
failed.

**GET-type commands** (GetResolution, GetBoardInfo) return the full
15-byte header followed by the payload of declared length.

## Format B — `0x9999` (binary magic)

Used for: get/set battery, PWM, level, ultrasonic, board info, shutdown,
clear/set AP parameters, get MAC, get SSID list. Roughly speaking: anything
the SDK marks as "newer" or numeric-only.

```
offset   bytes   field                    notes
─────────────────────────────────────────────────────────────────────────
[0:2]    2       0x9999 magic (LE u16)
[2:4]    2       opcode (LE u16)          see opcodes.md
[4:8]    4       cmdSendIndex (LE u32)
[8:12]   4       int parameter (LE u32)   value for SET, 0 for GET
[12:24]  12      zeros / additional data
```

Total size: **always 24 bytes**. Format B has no variable-length payload in
the request — values fit in the 4-byte int slot.

### Format B response

```
offset   bytes   field                    notes
─────────────────────────────────────────────────────────────────────────
[0:2]    2       0x9999 magic echo
[2:4]    2       opcode echo
[4:8]    4       idx echo
[8:..]   ...     command-specific         see per-command docs
```

The length and content of the rest depends on the command. `get_battery` is
a fixed 24-byte response; `get_board_info` returns up to ~600 bytes of JSON
preceded by a length field.

## Picking a format

When implementing a new command, the format is **not the developer's
choice** — it's whatever `libmlcamera-2.5.so` already sends, since that's
what the camera firmware listens for. Disassemble the corresponding
`send<CmdName>` helper and read the bytes it writes to the send buffer.

Heuristic: if the C++ helper uses the constant `0x43544553` (`'CTES'` LE =
start of `"SETCMD"`), it's Format A. If it uses the constant `0x9999`, it's
Format B.

## Idle behavior

The camera enters a low-power state when its SoftAP has no traffic for ~30 s.
At that point it stops responding to UDP and even drops the Wi-Fi
association. Keep-alive options:

* Send a low-rate poll on UDP/50000 (e.g. `get_battery` every 500 ms — same
  thing the official app does).
* Or keep the video stream open: the start packet on UDP/8032 produces a
  continuous push, which keeps the radio active.

## Camera initialization

There is no formal handshake. The camera responds to whichever known opcode
arrives first. The official Android app's startup flow is approximately:

1. BLE scan for the camera's MAC advertisement (purely a shortcut).
2. Join the SoftAP via the phone's Wi-Fi stack.
3. Poll `get_battery` (0x1017) every 500 ms to confirm reachability and
   discover whether the device is a "new" model (sets `newEquipment` flag).
4. Send 0x9999 op=1 to camera:8032 — camera starts streaming MJPEG.
5. Optional: `get_board_info` (0x1060) to populate model / SSID / firmware
   strings shown in the UI.
