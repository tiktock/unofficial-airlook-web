# Firmware quirks

`libmlcamera-2.5.so` is a generic camera SDK shared across many otoscope and
endoscope models. Individual firmwares implement different subsets and
behave differently for the same opcode. This document catalogs quirks
observed on one specific device (JesHome P6X / MoLink TX816 / firmware
1.0.0, Jun 2025). Other devices in the family probably behave differently;
treat this as a reference for adapting the bridge to a new device, not as
universal truth.

## Reboot = shutdown

`sendReboot` (Format A opcode `0x04`) *does* respond and the camera does
shut down — but it does **not** auto-power-on afterwards. The user has to
press the physical button to bring the camera back. Functionally identical
to `sendSetShutdown` (Format B opcode `0x1019`) on this device.

Why this happens: the SoC has no hardware watchdog wired to power-cycle,
and the firmware's reboot path just calls a clean shutdown handler. There's
no separate "soft reboot" implementation.

**Bridge UI implication.** The reboot button is removed from the UI; only
"shutdown" is exposed, with a confirm dialog that mentions the physical
button. The `/api/reboot` endpoint is kept for scripting on firmware
variants that actually reboot.

## LED is binary (no PWM)

`sendSetPWM` (opcode `0x1016`) accepts any 32-bit value and the firmware
*does* store it — the next `getPWM` returns exactly what you wrote. **But
the LED itself only has two states**: off (value `0`) or on at fixed
brightness (any non-zero value). Sending 1, 50, 128, or 255 all produce the
same visible LED.

This was not obvious from the SDK. The native library has `SetPWM`,
`SetPWM1`, `SetLevel` — all suggesting variable brightness. Whether
intermediate values do anything is purely a firmware/hardware question. On
P6X they don't.

**Bridge UI implication.** The LED toggle button issues `setPwm(0)` or
`setPwm(1)`. The PWM slider stays available under an "experimental" expander
in case a future device honours it.

## Resolution is fixed

`sendChangeResolution` (Format A opcode `0x0008`) accepts arbitrary
`width × height × mode` payloads and acks them. **Actual video output is
always 640×480 MJPEG** — there is no higher-resolution capture mode
available on the sensor, and the SDK call is essentially a no-op on this
device. `getBoardInfo` returns no fields suggesting otherwise (no
`max_resolution`, no `formats`).

**Bridge UI implication.** Resolution buttons exist behind an expander
with a yellow warning that some firmwares ignore them.

## Wi-Fi config is deferred to reboot

See [`wifi.md`](wifi.md). Changes are stored immediately but the Wi-Fi link
keeps the old credentials until the device is power-cycled. Bridge UI says
"will apply on next reboot" instead of "will disconnect now".

## STA-side opcodes silently no-op

The SDK exports a handful of opcodes — `set_ap_params` (`0x1010`),
`clear_ap_params` (`0x1011`), `set_switch_mode` (`0x1018`),
`get_ssid_list` (`0x101a`) — that would let the camera join a third-party
AP. On P6X firmware none of them respond at all. Confirmed by direct
packet probe (every other opcode echoes within milliseconds; these four
return zero bytes).

**Bridge UI implication.** Buttons for scan / STA / factory reset removed.
Methods stay in the Python protocol layer for scripting.

## Battery telemetry on "old equipment"

`sendGetBattery2` returns the same packet layout but with the high bit
(`0x10000`) of `v1_src` **clear** on older firmware variants that don't
expose battery info — the native library treats that case as "no battery
data" and returns `-1` to the Java caller. We've only ever seen the bit
set on P6X, but a different firmware could return no battery, and the
bridge should hide the indicator rather than show `0%`.

`src/protocol.py:get_battery` already does this — returns `percent: None`
when the bit is clear, and the UI shows "—".

## `0x0090` (`GetRemoteKey`) requires a 1-byte payload

The "blank SETCMD" example in the n8henrie WiFi-endoscope writeup
(`53 45 54 43 4d 44 00 14 00 00 90 00 01 00 00`) decodes as opcode
`0x0090` with a 1-byte payload of `0x00`. On P6X it does respond (echo),
but the meaningful effect — reading a physical button on the device —
isn't observable on a device that has no remote button. Other otoscopes in
the family come with a remote-button capsule; on those, this opcode
presumably returns the current button state.

**Bridge UI implication.** Not exposed. The opcode is documented in
`opcodes.md` for completeness.

## Why so many quirks for a "standard" SDK?

`libmlcamera-2.5.so` is licensed to ~dozens of cheap white-label otoscope
brands. The native code is the same; the firmware running on each device
implements only the features that hardware actually supports. The SDK
calls always *succeed* (ACK arrives), so an application sitting on top of
the SDK can never tell which features are real without doing exactly what
this directory's writeup does: send each opcode and see what the device
does in the physical world.

When porting the bridge in `../src/` to a different AIR-Look-compatible
camera, the adaptation steps are:

1. Confirm the camera responds at `192.168.0.10:50000` (or wherever its
   SoftAP gateway is).
2. Run the `get_board_info` request and read the JSON — model / firmware
   versions go straight into the UI.
3. Walk through `opcodes.md` and probe each "?" status to see which ones
   gain real effects on the new device.
4. Add a new entry to this file noting what's different.
