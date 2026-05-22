# Wi-Fi configuration

The camera is a **SoftAP**. It cannot, on most firmware variants, switch to
station mode and join a normal home Wi-Fi — every STA-side opcode in the SDK
silently no-ops on the firmware we tested. What *does* work is renaming the
SoftAP and setting / clearing its WPA2 password.

## Working commands (Format A SETCMD)

All three are short SETCMD packets to UDP/50000 with a UTF-8 payload:

| Opcode | Function | Payload |
|:---:|---|---|
| `0x0001` | Rename SoftAP | new SSID, up to 32 UTF-8 bytes |
| `0x0002` | Set WPA2 password | new password, 8..63 UTF-8 bytes |
| `0x0003` | Clear password (open AP) | _(none, length=0)_ |

All three return a 12-byte ACK immediately, **but the change is
deferred to the next reboot**. The currently-running Wi-Fi link stays up
with the old credentials until the camera is power-cycled — at which point
the new SSID/password takes effect and any currently-connected clients
have to reconnect with the new credentials.

This makes Wi-Fi configuration safer than it looks: you can issue a set,
verify the ACK, and the device hasn't disconnected anyone yet. Reboot only
when you have the new credentials ready.

## Unsupported (STA-side) commands

The SDK *exports* these as JNI functions, the Android UI presumably wires
them up for other devices in the family, but on the firmware variant we
tested **none of them respond at all**:

| Opcode | Function | Status |
|:---:|---|:-:|
| `0x1010` | `set_ap_params` | no response |
| `0x1011` | `clear_ap_params` (factory reset) | no response |
| `0x1018` | `set_switch_mode` (AP↔STA) | no response |
| `0x101a` | `get_ssid_list` (scan nearby APs) | no response |

The diagnostic is unambiguous: every implemented opcode echoes back as
`RETCMD` or `0x9999` within milliseconds. Total silence means the firmware
has no handler bound to that opcode, not a network issue. (Confirmed by
the fact that pinging the camera and other opcodes work in the same window.)

This is consistent with what the device physically *is* — a fixed-function
otoscope where there's no use case for joining an external Wi-Fi.

## How does "factory reset" work then?

Practically, on a device with only the working-command set:

1. `clear_password` (opcode 0x0003) → removes WPA2 → AP becomes open.
2. Power-cycle.

Now anyone in range can join with no password. A subsequent `set_password`
re-secures it.

The SDK's "factory reset" idea is more general — it would *also* restore
the SSID to default and forget any STA mode that had been configured. On a
SoftAP-only firmware those steps are irrelevant.

## What about the BLE advertisement?

The camera continuously broadcasts a BLE advertisement that encodes its
Wi-Fi MAC. The official app uses this to detect a paired camera within
range and offer one-tap reconnection. It's purely a discovery beacon —
**no GATT services**, no data transfer over BLE. The streaming and control
channels remain Wi-Fi-only.

If you're writing a custom client, you can skip the BLE part entirely and
just join the SoftAP manually.
