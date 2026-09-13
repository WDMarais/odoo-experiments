/*
    License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

    This is deliberately a test-target hook, not an ASBX integration.  A private
    browser adapter may opt in with ?asbx_probe=1 and drive only the ordinary
    incoming-call actions already provided by voip_oca.  It exposes compact,
    non-identifying WebRTC facts so the adapter can make a sanitized report to
    ASBX without depending on Odoo's UI structure.
*/
import {VoipAgent} from "@voip_oca/services/voip_agent_service.esm";
import {patch} from "@web/core/utils/patch";

const PROBE_QUERY_PARAMETER = "asbx_probe";
const PROBE_VERSION = "v1";

function probeEnabled() {
    return new URLSearchParams(window.location.search).get(PROBE_QUERY_PARAMETER) === "1";
}

function numericStat(value) {
    return Number.isFinite(value) ? value : null;
}

patch(VoipAgent.prototype, {
    connectAgent(...args) {
        this._asbxInstallProbe();
        return super.connectAgent(...args);
    },

    _asbxInstallProbe() {
        if (!probeEnabled() || window.__asbxVoipProbe) {
            return;
        }
        const agent = this;
        window.__asbxVoipProbe = Object.freeze({
            version: PROBE_VERSION,
            snapshot: () => agent._asbxSnapshot(),
            answer: () => agent._asbxAnswer(),
            hangup: () => agent._asbxHangup(),
        });
    },

    async _asbxSnapshot() {
        const session = this.session || null;
        const handler = session?.sessionDescriptionHandler;
        const peerConnection = handler?.peerConnection;
        const remoteTrackCount = handler?.remoteMediaStream?.getAudioTracks?.().length ?? 0;
        const inboundAudio = {
            bytes_received: 0,
            packets_received: 0,
            audio_level: null,
        };

        if (peerConnection?.getStats) {
            const stats = await peerConnection.getStats();
            for (const stat of stats.values()) {
                if (
                    stat.type !== "inbound-rtp" ||
                    (stat.kind !== "audio" && stat.mediaType !== "audio")
                ) {
                    continue;
                }
                inboundAudio.bytes_received += numericStat(stat.bytesReceived) || 0;
                inboundAudio.packets_received += numericStat(stat.packetsReceived) || 0;
                const level = numericStat(stat.audioLevel);
                if (level !== null) {
                    inboundAudio.audio_level = level;
                }
            }
        }

        return {
            version: PROBE_VERSION,
            registration: this.voip.status || "unknown",
            call: session
                ? {
                      direction: this.voip.call?.typeCall || "unknown",
                      state: session.state || "unknown",
                  }
                : null,
            webrtc: {
                connection_state: peerConnection?.connectionState || "unavailable",
                ice_connection_state: peerConnection?.iceConnectionState || "unavailable",
                remote_audio_track_count: remoteTrackCount,
                inbound_audio: inboundAudio,
            },
        };
    },

    async _asbxAnswer() {
        if (!this.session || this.voip.call?.typeCall !== "incoming") {
            throw new Error("No incoming call is awaiting an answer");
        }
        await this.accept();
        return this._asbxSnapshot();
    },

    async _asbxHangup() {
        if (!this.session) {
            throw new Error("No active call is available to hang up");
        }
        await this.hangup();
        return this._asbxSnapshot();
    },
});
