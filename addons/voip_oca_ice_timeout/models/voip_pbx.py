# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo import fields, models


class VoipOcaPbx(models.Model):
    _inherit = "voip.pbx"

    ice_gathering_timeout = fields.Integer(
        default=5000,
        help="Maximum milliseconds SIP.js waits for ICE candidate gathering "
        "before sending the SIP offer. Lower it (e.g. 1000) to avoid multi-second "
        "call-setup delays on clients with dead or virtual network interfaces "
        "(VPN, WSL). 0 waits for full natural gathering and is not recommended.",
    )
