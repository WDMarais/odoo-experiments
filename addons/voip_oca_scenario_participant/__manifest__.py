# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

{
    "name": "Voip OCA: Scenario Participant",
    "summary": "Controlled, audio-gated browser VoIP scenario participant",
    "version": "19.0.1.0.0",
    "author": "WDMarais",
    "website": "https://github.com/OCA/connector-telephony",
    "license": "AGPL-3",
    "category": "Productivity/VOIP",
    "depends": ["voip_oca"],
    "assets": {
        "web.assets_backend": [
            "voip_oca_scenario_participant/static/src/services/jingle_reply.esm.js",
        ],
    },
}
