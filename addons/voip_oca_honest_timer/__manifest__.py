# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

{
    "name": "Voip OCA: Honest Call Status",
    "summary": "State-aware call status line (Ringing/On hold) and a duration "
    "counted from the real answer, not from dial time",
    "version": "18.0.1.0.0",
    "author": "WDMarais",
    "website": "https://github.com/OCA/connector-telephony",
    "license": "AGPL-3",
    "category": "Productivity/VOIP",
    "depends": ["voip_oca"],
    "assets": {
        "web.assets_backend": [
            "voip_oca_honest_timer/static/src/components/call_timer_patch.esm.js",
            "voip_oca_honest_timer/static/src/components/call.xml",
        ],
    },
}
