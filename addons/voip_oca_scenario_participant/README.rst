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

Real browsers require an audio gesture before autonomous WebRTC reply media is
permitted.  The enabled page presents a sticky instruction; click anywhere in
the page once before driving a scenario.  A call received before that is
reported as ``browser_audio_not_armed`` rather than failing the Odoo client.
Headless Chromium can arm at startup when launched with
``--autoplay-policy=no-user-gesture-required``.

``window.__odooScenarioParticipant`` is a local diagnostics object for a
headless test driver.  Its ``snapshot()`` method exposes scenario phase, audio
arming state and recognition timestamps; it neither calls ASBX nor contains SIP identity or
credentials.  A headless Chromium driver must permit audio playback, for
example with ``--autoplay-policy=no-user-gesture-required``.
