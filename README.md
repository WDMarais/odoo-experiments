# odoo-experiments

Personal Odoo addon experiments, version-branched per Odoo series (e.g. `18.0`,
`19.0`) like an OCA repo. Modules live under `addons/`; consumed by an owm
workspace as a `[repos]` source with `addons_paths = ["addons"]`.

## Current inhabitants

- **voip_oca_ice_timeout** - exposes SIP.js `iceGatheringTimeout` as a
  configurable per-PBX field, to avoid multi-second call-setup stalls on clients
  with dead/virtual NICs. Update-safe override of `voip_oca`; staged for an
  upstream OCA/connector-telephony PR.
- **voip_oca_honest_timer** - state-aware call status line (Ringing / On hold)
  and a duration counted from the real answer, not from dial time. Update-safe
  override of `voip_oca`; staged for an upstream OCA/connector-telephony PR.

License: AGPL-3.0-or-later.
