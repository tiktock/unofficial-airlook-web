# Opcode catalog

Every opcode below is exported from `libmlcamera-2.5.so` as either a JNI
function (`nativeCmd*`) or a C++ helper (`send*` / `app_send_*`). Opcodes
were extracted by disassembling each helper and reading the constant moved
into the request buffer at offset `[10:12]` (Format A) or `[2:4]` (Format B).

The **Live status** column reflects what the P6X firmware actually does:

* `✓` — responds and the documented effect is verifiable.
* `?` — responds but the effect cannot be observed remotely
  (e.g. internal calibration).
* `✗` — does not respond at all (firmware no-op on this device).

Other firmwares in the AIR-Look family likely implement different subsets —
treat `✗` as "may need to be checked on your device", not a permanent
rejection.

## Format A — `SETCMD` ASCII (UDP/50000)

| Opcode | Helper | JNI export | Live |
|---:|---|---|:-:|
| `0x0001` | `sendChangeName` | `nativeCmdSetName` | ✓ |
| `0x0002` | `sendChangePassword` | `nativeCmdSetPassword` | ✓ |
| `0x0003` | `sendClearPassword` | `nativeCmdClearPassword` | ✓ |
| `0x0004` | `sendReboot` | `nativeCmdSendReboot` | ✓\* |
| `0x0008` | `sendChangeResolution` | `nativeCmdSetResolution` | ✓\*\* |
| `0x0009` | _inline (build inside JNI)_ | `nativeCmdGetResolution` | ✓ |
| `0x0090` | `sendGetRemoteKey` | `nativeCmdGetRemoteKey` | ✓ |

\* Behaves as shutdown on P6X (no auto power-on after).
\*\* ACKs but actual resolution doesn't change on P6X (fixed 640×480 hardware).

## Format B — `0x9999` binary (UDP/50000)

| Opcode | Helper | JNI export | Live |
|---:|---|---|:-:|
| `0x1010` | `sendSetApParams` | _(via SetStaMode)_ | ✗ |
| `0x1011` | `sendClearApParams` | `nativeCmdSendClearSta` | ✗ |
| `0x1015` | `sendGetPWM` | `nativeCmdGetPWM` | ✓ |
| `0x1016` | `sendSetPWM` | `nativeCmdSetPWM` | ✓† |
| `0x1017` | `sendGetBattery2` | `nativeCmdGetBattery2` | ✓ |
| `0x1018` | `sendSetSwitchMode` | _(not exported directly)_ | ✗ |
| `0x1019` | `sendSetShutdown` | `nativeCmdSendShutdown` | ✓ |
| `0x101a` | `app_send_get_ssid_list` | `nativeCmdSendGetSSIDList` | ✗ |
| `0x101b` | `app_send_get_mac` | `nativeCmdSendGetDeviceMac` | ✗ |
| `0x101c` | `sendGetPwmStatus` | _(internal)_ | ? |
| `0x101d` | `sendSetPwmStatus` | _(internal)_ | ? |
| `0x1052` | `sendSetUltrasonic` | `nativeCmdSetUltrasonic` | ? |
| `0x1053` | `sendGetUltrasonic` | `nativeCmdGetUltrasonic` | ? |
| `0x1054` | `sendSetLevel` | `nativeCmdSetLevel` | ✓† |
| `0x1055` | `sendGetLevel` | `nativeCmdGetLevel` | ✓ |
| `0x1056` | `sendGetPWM1` | `nativeCmdGetPWM1` | ? |
| `0x1057` | `sendSetPWM1` | `nativeCmdSetPWM1` | ? |
| `0x1058` | `sendSetAgeing` | `nativeCmdSetAgeing` | ? |
| `0x1060` | `app_send_get_board_info` | `nativeCmdGetBoardInfo` | ✓ |
| `0x1062` | `sendSetCalibration` | `nativeCmdSetResetCalibration` | ? |
| `0x1063` | `sendGetResetCalibration` | `nativeCmdGetResetCalibration` | ? |
| `0x1064` | `sendResetEncryption` | _(internal)_ | ? |
| `0x1070` | `sendSet/GetCameraStyle` | `nativeCmdSet/GetCameraStyle` | ? |

† PWM/Level commands ACK and the value is echoed by GetPWM, but on P6X the
LED is binary (any non-zero value gives the same brightness as 1).

## Video streaming — separate port

| Opcode | Helper | Sent to | Effect |
|---:|---|---|---|
| `0x0001` | `SelfCamera::do_send_cmd(sock, 1, NULL)` | UDP/8032 | start MJPEG push |
| `0x0002` | `SelfCamera::do_send_cmd(sock, 2, NULL)` | UDP/8032 | stop MJPEG push |

Both are 24-byte 0x9999 packets (same wire format as Format B) but on a
**different UDP port**. Sent 11× consecutively for UDP reliability — the
camera de-duplicates by sequence index.

## How to add a new opcode

1. Find the JNI export in `libmlcamera-2.5.so` — usually
   `Java_com_wifiview_nativelibs_NativeLibs_nativeCmd<Name>`.
2. Read the disassembly. Most JNI wrappers just marshal arguments and tail-call
   into a C++ helper (`b _Z<len><name>...@plt`).
3. Disassemble the helper. Pattern-match: store of `0x9999` or build of
   `"SETC" + "MD"` reveals the format; store at offset `[10:12]` or `[2:4]`
   is the opcode.
4. Add the opcode to either `OP_A` or `OP_B` in `src/protocol.py` and
   wrap it as a method on `SetcmdClient`.
5. Send it once with a Python script and inspect the raw response before
   wiring it up to the UI.
