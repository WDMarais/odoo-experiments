from odoo import models
from odoo.http import request


class IrHttp(models.AbstractModel):
    _inherit = "ir.http"

    def session_info(self):
        result = super().session_info()
        result["asbx"] = {
            "probe": bool(request.session.get("asbx_probe")),
            "scenario": request.session.get("asbx_scenario"),
        }
        return result
