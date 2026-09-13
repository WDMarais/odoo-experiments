# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

{
    "name": "Voip OCA: ASBX Probe Hook",
    "summary": "Query-gated browser hook for controlled VoIP characterization",
    "version": "19.0.1.0.0",
    "author": "WDMarais",
    "website": "https://github.com/OCA/connector-telephony",
    "license": "AGPL-3",
    "category": "Productivity/VOIP",
    "depends": ["voip_oca"],
    "assets": {
        "web.assets_backend": [
            "voip_oca_asbx_probe/static/src/services/voip_agent_probe.esm.js",
        ],
    },
}
