# `get_battery` (Format B, opcode 0x1017)

Probably the highest-frequency call in the official app — polled at 2 Hz
from `CmdSocket.startRunKeyThread()` while the app is open. Returns voltage,
charge state, and battery percentage. We verified the byte layout by
A/B-testing all four charge-state combinations on a live device.

## Request

Standard 24-byte Format B packet, no parameters:

```
99 99 17 10 <idx LE u32> 00 00 00 00 00 00 00 00 00 00 00 00
```

## Response

The camera replies with 24 bytes plus a little extra padding. After
stripping the 4-byte magic + opcode echo, the *payload* (what
`SetcmdClient.call_b` returns) looks like this:

```
offset (payload)    size   field
─────────────────────────────────────────────────────────────────
[0:4]               4      idx echo (matches request)
[4:6]               2      battery voltage in mV  (LE u16)
[6]                 1      charge state bitfield  (see below)
[7]                 1      0x05 — constant; "battery present" marker
[8:12]              4      0x00000040 — also constant; some status word
[12:16]             4      v1_src — packs (percent | 0x10000) when valid
```

## Charge-state bitfield (byte [6])

This is the field most useful for UI display. Two independent bits:

| Bit | Mask | Meaning |
|---|---|---|
| 0 | `0x01` | Charging current is flowing |
| 1 | `0x02` | Battery is at full state-of-charge |

All four combinations are observed in practice:

| Value | bit 1 | bit 0 | What it means | When seen |
|:---:|:---:|:---:|---|---|
| `0x00` | 0 | 0 | On battery — discharging | Charger unplugged, SoC < 100% |
| `0x01` | 0 | 1 | Charging in progress (CC or CV) | Plugged in, SoC ramping up |
| `0x02` | 1 | 0 | Battery full, no current | Just unplugged from full charger |
| `0x03` | 1 | 1 | Plugged in & full (trickle / maintenance) | At 100% with charger still attached |

The single-bit test `is_charging = bool(byte & 0x01)` answers "is the
charger pulling current". The bit-1 test `is_full = bool(byte & 0x02)` is
independent — it can be set with the charger present or absent.

This decomposition matters because the firmware reports `0x02` for a few
seconds after unplugging a full battery, then transitions to `0x00` as the
battery starts to drain. A naive "any non-zero byte = charging" check would
get confused; using the bit fields gives correct results without
enumerating values.

## Battery percent (bytes [12:16])

The 32-bit `v1_src` at offset 12 carries both a validity flag and the
percentage:

```python
v1_src = u32(payload, 12)
if v1_src & 0x10000:                  # bit 16 set → "data valid"
    percent = v1_src & 0xFFFF         # low 16 bits are the percent
else:
    percent = None                    # device reports no battery info
```

The native library extracts the same way (see `sendGetBattery2` at
`0xc1170` in libmlcamera-2.5.so). The percentage is 0..100; values up to
65535 are possible by the byte layout but never seen in practice.

When the validity bit is *clear*, the official Java code sets `v1 = -1`
and the app shows no battery indicator — interpret this as "older firmware
without battery telemetry" rather than "0% battery".

## Voltage

Bytes [4:6] are a 16-bit little-endian millivolt reading directly off the
fuel gauge. Observed range on a healthy Li-ion cell:

* `~3870 mV` ↔ 75% SoC
* `~3960 mV` ↔ 85%
* `~4100 mV` ↔ near full while charging (CV phase)
* `~4200 mV` ↔ fully charged, charger present (`charge_byte = 0x03`)
* drops to `~4130 mV` immediately after unplug, then trends down

Matches a standard Li-ion discharge curve, which is a useful sanity check
when adapting this code to a new firmware variant.

## Example: full decode

A real packet captured at 86%, on battery::

```
hex (payload): 0b 00 00 00  79 0f 00 05  40 00 00 00  56 00 01 00
```

| Field | Bytes | Value |
|---|---|---|
| idx echo | `0b 00 00 00` | 11 |
| voltage_mv | `79 0f` | `0x0f79` = 3961 mV |
| charge_byte | `00` | discharging (bit 0 clear), not full (bit 1 clear) |
| const 0x05 | `05` | (battery present) |
| status word | `40 00 00 00` | 64 |
| v1_src | `56 00 01 00` | `0x00010056` → bit 16 set → percent = `0x0056` = **86** |
