# Reverse-engineering notes — AIR-Look WiFi otoscope SDK

The official Android app for a class of consumer WiFi otoscopes ("**AIR-Look**",
package `com.air.airlook`, Play Store) wraps a generic camera SDK called
**mlcamera** that talks to the camera over a proprietary UDP protocol on the
camera's SoftAP. This directory documents the protocol after analysing the
APK, decompiling its `libmlcamera-2.5.so` native library, and verifying every
finding against a real device.

The companion device used for verification is a JesHome-branded P6X otoscope
(manufactured by MoLink Technology, soc TX816). Most findings should apply to
other AIR-Look-compatible cameras — fields that are likely device-specific are
called out in [`firmware-quirks.md`](firmware-quirks.md).

## How the system works (60 seconds)

```
camera (SoftAP)                          phone / PC (this bridge)
192.168.0.10                             192.168.0.x (DHCP client)
       │                                          │
       │  UDP 8032  ──── 24-byte 0x9999 op=1 ────▶ start preview
       │  UDP 8032  ◀─── MJPEG chunks (1460B) ─── 30 fps video
       │                                          │
       │  UDP 50000 ──── SETCMD / 0x9999 cmd ────▶ query/set
       │  UDP 50000 ◀─── RETCMD / 0x9999 reply ───
```

* The camera is the AP. The phone joins its SSID (`JesHome-*` etc.) and gets
  an IP via DHCP. The camera is at the gateway (`192.168.0.10` in our case).
* Video flows from the camera *to* the phone over UDP/8032 (camera pushes
  MJPEG chunks back to whichever source port the start-preview packet came
  from).
* Control is request/response over UDP/50000. Two packet formats coexist —
  `SETCMD` (ASCII magic) and `0x9999` (binary magic).
* **There is no TCP**, no RTSP, no ONVIF, no HTTP service on the camera.

## Documents

| File | Contents |
|---|---|
| [`protocol.md`](protocol.md) | Packet formats (SETCMD + 0x9999), ports, response decoding |
| [`opcodes.md`](opcodes.md) | Complete opcode table extracted from `libmlcamera-2.5.so`, with per-opcode verification status |
| [`video-stream.md`](video-stream.md) | UDP/8032 stream details — start packet, chunk header, JPEG reassembly, embedded accelerometer |
| [`battery.md`](battery.md) | `get_battery` (0x1017) response decoding — voltage in mV, charge-state bitfield, percent extraction |
| [`wifi.md`](wifi.md) | SoftAP credential management, deferred-apply behavior, unsupported STA opcodes |
| [`firmware-quirks.md`](firmware-quirks.md) | Per-device behaviors that may not generalize (P6X has reboot==shutdown, LED is binary, resolution fixed, etc.) |

## How to reproduce the analysis

The APK isn't redistributed here (size + licensing). To re-run the analysis:

```bash
# 1. Grab the APK
#    APKPure: https://apkpure.com/air-look/com.air.airlook
#    or extract from a phone:  adb pull /data/app/com.air.airlook-*/base.apk
#    For the .so library you need the per-architecture split:
#    https://d.apkpure.net/b/XAPK/com.air.airlook?version=latest

# 2. Decompile Java
jadx -d airlook_src airlook.apk

# 3. Extract native libs
unzip airlook.xapk config.arm64_v8a.apk -d _xapk
unzip _xapk/config.arm64_v8a.apk lib/arm64-v8a/*.so -d nativelibs

# 4. Browse decompiled source — the camera SDK lives under
#    `com.wifiview.nativelibs` (CmdSocket, StreamSelf, NativeLibs).

# 5. Disassemble the native library
nm -D nativelibs/lib/arm64-v8a/libmlcamera-2.5.so | grep send
objdump -d --start-address=0xc0fac --stop-address=0xc11d4 \
        nativelibs/lib/arm64-v8a/libmlcamera-2.5.so
```

The control logic is essentially:

* Java `nativeCmd*` JNI methods → tiny C++ wrappers in
  `libmlcamera-2.5.so` → helpers named `send*` / `app_send_*` → all funnel
  into either Format A SETCMD or Format B 0x9999 packets to UDP/50000.
* Video streaming is `SelfCamera::startPreviewOpcom(port5, port3)` →
  `SelfCamera::do_send_cmd(sock, opcode=1, NULL)` → 24-byte 0x9999 packet
  to camera:8032 → camera streams MJPEG back.

## Disclaimer

These notes were produced by analysing the publicly-distributed APK and
sending packets to a personally-owned device. No proprietary firmware, no
binary distribution. They exist to enable users to keep using their hardware
without depending on the (advertising-heavy) official app.

The implementations in `../src/` were written from scratch based on the
information here; no code from the APK or `libmlcamera-2.5.so` is included.
