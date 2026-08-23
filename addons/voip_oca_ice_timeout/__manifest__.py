# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

{
    "name": "Voip OCA: Configurable ICE Gathering Timeout",
    "summary": "Expose SIP.js iceGatheringTimeout as a per-PBX field",
    "version": "18.0.1.0.0",
    "author": "WDMarais",
    "website": "https://github.com/OCA/connector-telephony",
    "license": "AGPL-3",
    "category": "Productivity/VOIP",
    "depends": ["voip_oca"],
    "data": [
        "views/voip_pbx.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "voip_oca_ice_timeout/static/src/services/voip_agent_patch.esm.js",
        ],
    },
}
