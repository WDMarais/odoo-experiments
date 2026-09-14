/*
    License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

    A deliberately small in-band test protocol.  This belongs to the Odoo test
    target, not to ASBX: it proves that this browser consumer received a phrase
    before it generated its reply.  The PBX-side driver independently records
    and grades both directions.
*/
import {VoipAgent} from "@voip_oca/services/voip_agent_service.esm";
import {patch} from "@web/core/utils/patch";
import {session} from "@web/session";

const SCENARIO_QUERY_PARAMETER = "odoo_scenario";
const SCENARIO_ID = "jingle_reply_v1";
const CHALLENGE_HZ = [659, 659, 659];
const REPLY_HZ = [659, 784, 523, 587, 659];
const NOTE_SECONDS = 0.4;
const NOTE_GAP_SECONDS = 0.2;
const INPUT_TIMEOUT_MS = 30_000;
const HANGUP_AFTER_REPLY_MS = 3_000;
const ANALYSIS_INTERVAL_MS = 50;
const MIN_SUSTAIN_MS = 220;
const MIN_SILENCE_MS = 100;
const MIN_RMS = 0.008;
const MIN_FRACTION = 0.1;

function scenarioEnabled() {
    return (
        new URLSearchParams(window.location.search).get(SCENARIO_QUERY_PARAMETER) === SCENARIO_ID ||
        session.asbx?.scenario === SCENARIO_ID
    );
}

function now() {
    return Math.round(performance.now());
}

function rms(samples) {
    let total = 0;
    for (const sample of samples) {
        total += sample * sample;
    }
    return Math.sqrt(total / samples.length);
}

function goertzelFraction(samples, sampleRate, frequency, energy) {
    const bin = Math.round((samples.length * frequency) / sampleRate);
    const coefficient = 2 * Math.cos((2 * Math.PI * bin) / samples.length);
    let previous = 0;
    let beforePrevious = 0;
    for (const sample of samples) {
        const current = sample + coefficient * previous - beforePrevious;
        beforePrevious = previous;
        previous = current;
    }
    const power =
        previous * previous +
        beforePrevious * beforePrevious -
        coefficient * previous * beforePrevious;
    return power / (samples.length * energy);
}

function recognizedTone(samples, sampleRate) {
    if (rms(samples) < MIN_RMS) {
        return null;
    }
    let energy = 0;
    for (const sample of samples) {
        energy += sample * sample;
    }
    if (!energy) {
        return null;
    }
    let strongest = {frequency: null, fraction: 0};
    for (const frequency of [...new Set(CHALLENGE_HZ)]) {
        const fraction = goertzelFraction(samples, sampleRate, frequency, energy);
        if (fraction > strongest.fraction) {
            strongest = {frequency, fraction};
        }
    }
    return strongest.fraction >= MIN_FRACTION ? strongest.frequency : null;
}

function createScenarioState() {
    return {
        id: SCENARIO_ID,
        phase: "awaiting_answer",
        started_at_ms: now(),
        recognized_notes: [],
        failure: null,
        completed_at_ms: null,
    };
}

patch(VoipAgent.prototype, {
    async onInvite(...args) {
        const result = await super.onInvite(...args);
        if (!scenarioEnabled()) {
            return result;
        }
        this._odooScenarioStart();
        await this.accept();
        return result;
    },

    _onSessionStateChange(newState) {
        const result = super._onSessionStateChange(newState);
        if (this._odooScenario && newState === "Established") {
            this._odooScenarioBeginListening();
        }
        return result;
    },

    async _onHanghup(...args) {
        this._odooScenarioStopListening();
        return super._onHanghup(...args);
    },

    _odooScenarioStart() {
        this._odooScenarioStopListening();
        this._odooScenario = createScenarioState();
        window.__odooScenarioParticipant = Object.freeze({
            snapshot: () => ({
                id: this._odooScenario.id,
                phase: this._odooScenario.phase,
                started_at_ms: this._odooScenario.started_at_ms,
                recognized_notes: [...this._odooScenario.recognized_notes],
                failure: this._odooScenario.failure,
                reply_started_at_ms: this._odooScenario.reply_started_at_ms || null,
                completed_at_ms: this._odooScenario.completed_at_ms,
            }),
        });
    },

    _odooScenarioBeginListening(attempt = 0) {
        const scenario = this._odooScenario;
        const stream = this.session?.sessionDescriptionHandler?.remoteMediaStream;
        if (!scenario || scenario.phase !== "awaiting_answer") {
            return;
        }
        if (!stream?.getAudioTracks()?.length) {
            if (attempt < 40) {
                window.setTimeout(() => this._odooScenarioBeginListening(attempt + 1), 100);
                return;
            }
            this._odooScenarioFail("remote_audio_track_unavailable");
            return;
        }
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        scenario.audio_context = audioContext;
        scenario.analyser = analyser;
        scenario.phase = "listening";
        scenario.deadline = window.setTimeout(
            () => this._odooScenarioFail("challenge_timeout"),
            INPUT_TIMEOUT_MS
        );
        scenario.interval = window.setInterval(
            () => this._odooScenarioAnalyzeFrame(),
            ANALYSIS_INTERVAL_MS
        );
    },

    _odooScenarioAnalyzeFrame() {
        const scenario = this._odooScenario;
        if (!scenario || scenario.phase !== "listening") {
            return;
        }
        const samples = new Float32Array(scenario.analyser.fftSize);
        scenario.analyser.getFloatTimeDomainData(samples);
        const observed = recognizedTone(samples, scenario.audio_context.sampleRate);
        const expected = CHALLENGE_HZ[scenario.recognized_notes.length];

        if (scenario.waiting_for_silence) {
            if (observed === null) {
                scenario.silence_since ??= now();
                if (now() - scenario.silence_since >= MIN_SILENCE_MS) {
                    scenario.waiting_for_silence = false;
                    scenario.candidate_since = null;
                }
            } else {
                scenario.silence_since = null;
            }
            return;
        }
        if (observed !== expected) {
            scenario.candidate_since = null;
            return;
        }
        scenario.candidate_since ??= now();
        if (now() - scenario.candidate_since < MIN_SUSTAIN_MS) {
            return;
        }
        scenario.recognized_notes.push({frequency_hz: observed, at_ms: now()});
        scenario.candidate_since = null;
        scenario.waiting_for_silence = true;
        scenario.silence_since = null;
        if (scenario.recognized_notes.length === CHALLENGE_HZ.length) {
            this._odooScenarioReply();
        }
    },

    async _odooScenarioReply() {
        const scenario = this._odooScenario;
        this._odooScenarioStopListening();
        scenario.phase = "replying";
        const peerConnection = this.session?.sessionDescriptionHandler?.peerConnection;
        const sender = peerConnection
            ?.getSenders()
            .find((candidate) => candidate.track?.kind === "audio");
        if (!sender) {
            this._odooScenarioFail("outbound_audio_sender_unavailable");
            return;
        }
        try {
            const audioContext = new AudioContext();
            await audioContext.resume();
            const destination = audioContext.createMediaStreamDestination();
            const replyTrack = destination.stream.getAudioTracks()[0];
            await sender.replaceTrack(replyTrack);
            scenario.reply_audio_context = audioContext;
            for (const [index, frequency] of REPLY_HZ.entries()) {
                const start = audioContext.currentTime + index * (NOTE_SECONDS + NOTE_GAP_SECONDS);
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                oscillator.frequency.value = frequency;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
                gain.gain.setValueAtTime(0.2, start + NOTE_SECONDS - 0.01);
                gain.gain.linearRampToValueAtTime(0, start + NOTE_SECONDS);
                oscillator.connect(gain).connect(destination);
                oscillator.start(start);
                oscillator.stop(start + NOTE_SECONDS);
            }
            scenario.reply_started_at_ms = now();
            scenario.reply_timer = window.setTimeout(
                () => this._odooScenarioCompleteReply(),
                REPLY_HZ.length * (NOTE_SECONDS + NOTE_GAP_SECONDS) * 1000
            );
        } catch (error) {
            console.error("Odoo VoIP scenario reply failed", error);
            this._odooScenarioFail("outbound_audio_replace_failed");
        }
    },

    _odooScenarioCompleteReply() {
        const scenario = this._odooScenario;
        if (!scenario || scenario.phase !== "replying") {
            return;
        }
        scenario.phase = "completed";
        scenario.completed_at_ms = now();
        scenario.hangup_timer = window.setTimeout(() => this.hangup(), HANGUP_AFTER_REPLY_MS);
    },

    _odooScenarioFail(reason) {
        const scenario = this._odooScenario;
        if (!scenario || scenario.phase === "failed") {
            return;
        }
        this._odooScenarioStopListening();
        scenario.phase = "failed";
        scenario.failure = reason;
        this.hangup();
    },

    _odooScenarioStopListening() {
        const scenario = this._odooScenario;
        if (!scenario) {
            return;
        }
        window.clearInterval(scenario.interval);
        window.clearTimeout(scenario.deadline);
        window.clearTimeout(scenario.reply_timer);
        window.clearTimeout(scenario.hangup_timer);
        scenario.audio_context?.close();
        scenario.reply_audio_context?.close();
        scenario.interval = null;
        scenario.deadline = null;
        scenario.reply_timer = null;
        scenario.hangup_timer = null;
    },
});
