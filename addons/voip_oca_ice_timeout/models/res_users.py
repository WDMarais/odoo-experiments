# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo import models


class ResUsers(models.Model):
    _inherit = "res.users"

    def _voip_get_info(self):
        # Rides the existing session.voip channel: the value lands on the OWL
        # voip_oca service via its Object.assign(this, session.voip), so no
        # frontend ingestion code is needed beyond the agentConfig patch.
        res = super()._voip_get_info()
        res["ice_gathering_timeout"] = self.voip_pbx_id.ice_gathering_timeout
        return res
