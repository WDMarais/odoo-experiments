Odoo VoIP scenario participant
==============================

This add-on supplies a deterministic browser participant for an end-to-end media
scenario.  It is separate from ``voip_oca_asbx_probe``: the latter is an
interoperability hook for an external adapter, while this add-on contains a
specific test behavior.

``?odoo_scenario=jingle_reply_v1`` enables the first scenario.  The participant
automatically answers an incoming call, requires three separated 659 Hz tones
within 30 seconds, emits ``659, 784, 523, 587, 659 Hz`` only after recognition,
then hangs up three seconds after the reply.  A missing or malformed challenge
ends the call at the deadline.

``window.__odooScenarioParticipant`` is a local diagnostics object for a
headless test driver.  Its ``snapshot()`` method exposes scenario phase and
recognition timestamps; it neither calls ASBX nor contains SIP identity or
credentials.  A headless Chromium driver must permit audio playback, for
example with ``--autoplay-policy=no-user-gesture-required``.
