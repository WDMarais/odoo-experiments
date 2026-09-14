from odoo import http
from odoo.http import request


class AsbxScenarioController(http.Controller):
    @http.route("/asbx/scenario/jingle-reply", type="http", auth="user")
    def jingle_reply(self):
        request.session["asbx_probe"] = True
        request.session["asbx_scenario"] = "jingle_reply_v1"
        return request.redirect("/web")
