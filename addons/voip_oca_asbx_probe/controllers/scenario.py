from odoo import http
from odoo.http import request

ASBX_SCENARIO_CONTRACT = "two_party_jingle_reply/v1"
ODS_SCENARIO_ID = "jingle_reply_v1"


class AsbxScenarioController(http.Controller):
    @http.route("/asbx/scenario/jingle-reply", type="http", auth="user")
    def jingle_reply(self):
        request.session["asbx_probe"] = True
        request.session["asbx_scenario"] = ODS_SCENARIO_ID
        request.session["asbx_contract"] = ASBX_SCENARIO_CONTRACT
        return request.redirect("/web")
