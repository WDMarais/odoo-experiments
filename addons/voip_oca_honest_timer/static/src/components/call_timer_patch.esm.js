/*
    License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

    Honest call status line. Stock voip_oca always renders "In call for: MM:SS"
    and starts the timer at dial time (inCall flips the moment you click call),
    so a slow-to-answer callee shows a running clock while it is still only
    ringing. Two fixes, composed:

    1. startTimer only counts while voip.call.state === "ongoing" (the real
       answer, set on the backend by accept_call for both the outgoing 200-OK
       path via _onInviteAccepted and the incoming Accept button). Before that
       the elapsed count is pinned to zero, so the clock starts clean on answer.
    2. callStatus replaces the always-"In call for" label with a state-aware
       one: Ringing / Incoming while calling, On hold when held, and the honest
       running duration only once the call is actually ongoing.
*/
import {Call} from "@voip_oca/components/call/call.esm";
import {patch} from "@web/core/utils/patch";

patch(Call.prototype, {
    startTimer() {
        this.timer = setInterval(() => {
            if (!(this.voip.call && this.voip.call.state === "ongoing")) {
                // Still ringing (or already ended): hold at zero, don't count.
                this.state.elapsedSeconds = 0;
                this.state.duration = " 00:00";
                return;
            }
            this.state.elapsedSeconds += 1;
            const minutes = String(
                Math.floor(this.state.elapsedSeconds / 60)
            ).padStart(2, "0");
            const seconds = String(this.state.elapsedSeconds % 60).padStart(2, "0");
            this.state.duration = ` ${minutes}:${seconds}`;
        }, 1000);
    },

    get callStatus() {
        const call = this.voip.call;
        if (!call || !call.state) {
            return "";
        }
        if (call.state === "calling") {
            return call.typeCall === "incoming" ? "Incoming call…" : "Ringing…";
        }
        if (call.state === "ongoing") {
            // duration is always total-call-so-far, so hold is a flag beside it,
            // not its own timer (which would falsely read as time-spent-on-hold).
            return this.agent.isHolded
                ? `In call for:${this.duration} (on hold)`
                : `In call for:${this.duration}`;
        }
        return "Call ended";
    },
});
