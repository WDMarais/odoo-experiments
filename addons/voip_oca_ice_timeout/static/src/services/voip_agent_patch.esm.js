/*
    License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

    Feed the per-PBX ice_gathering_timeout (carried on the voip service via
    session.voip) into the SIP.js UserAgent config, so the INVITE is sent once
    gathering is capped instead of stalling on the 5000ms default.
*/
import {patch} from "@web/core/utils/patch";
import {VoipAgent} from "@voip_oca/services/voip_agent_service.esm";

patch(VoipAgent.prototype, {
    get agentConfig() {
        const config = super.agentConfig;
        config.sessionDescriptionHandlerFactoryOptions = {
            ...config.sessionDescriptionHandlerFactoryOptions,
            iceGatheringTimeout: this.voip.ice_gathering_timeout ?? 5000,
        };
        return config;
    },
});
