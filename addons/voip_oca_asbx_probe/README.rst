ASBX probe hook for ``voip_oca``
================================

This add-on is installed only on a controlled Odoo test target.  It makes no
network request to ASBX and does not alter the ordinary softphone flow.

Opening a logged-in backend page with ``?asbx_probe=1`` exposes the small
``window.__asbxVoipProbe`` browser API.  A private browser adapter can poll
``snapshot()``, answer an incoming call with ``answer()``, and end it with
``hangup()``.  Snapshots contain only connection and aggregate inbound-audio
facts; they deliberately exclude dialled numbers, SIP credentials, and raw
media.

The scenario route maps the Odoo-local ``jingle_reply_v1`` participant behavior
to ASBX's public ``two_party_jingle_reply/v1`` contract.  The local identifier
and query parameter remain Odoo implementation details; an external adapter
should report the public contract identifier.

The adapter is responsible for authenticating to the test target, driving the
browser, and translating these facts into ASBX's public adapter-report schema.
