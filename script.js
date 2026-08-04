// --- 1. CLEANED UP LIGHT ENGINE (WITHOUT HISTORY LOGGING) ---
const PAIRS = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)", "USD/BRL (OTC)", "USD/INR (OTC)"];
const ACTIONS = ["CALL ⬆️", "PUT ⬇️"];

let soundEnabled = true;

// Tab Switcher Logic
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    if(btnElement) btnElement.classList.add('active');
}

function openDocModal() { document.getElementById('doc-modal').style.display = 'flex'; }
function closeDocModal() { document.getElementById('doc-modal').style.display = 'none'; }

// Web Audio API for Alert Beep
function playAlertBeep() {
    if(!soundEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch(e) {}
}

// Deterministic Pair & Action selection based on exact Minute
function getSignalForMinute(totalMins) {
    let pairIdx = totalMins % PAIRS.length;
    let actionIdx = (totalMins * 3) % 2;
    return {
        pair: PAIRS[pairIdx],
        action: ACTIONS[actionIdx]
    };
}

let lastAlertPlayed = -1;

// Real-Time Signal Engine Loop
function runEngine() {
    const now = new Date();
    const mins = now.getMinutes();
    const secs = now.getSeconds();

    // Round 5-Min interval calculations
    const remMins = 4 - (mins % 5);
    const remSecs = 59 - secs;
    const totalRemainingSecs = remMins * 60 + remSecs;

    const timerBadge = document.getElementById('countdown-timer');
    const card = document.getElementById('signal-card');
    const title = document.getElementById('signal-status-title');
    const body = document.getElementById('signal-body');
    const timerBar = document.getElementById('timer-bar');

    let formattedMin = String(remMins).padStart(2, '0');
    let formattedSec = String(remSecs).padStart(2, '0');
    timerBadge.innerText = `${formattedMin}:${formattedSec}`;

    // Get current round slot signal
    let currentSlotMins = mins + (5 - (mins % 5));
    let signal = getSignalForMinute(currentSlotMins);

    // STATE 1: PRE-ALERT (30s to 1s before round time)
    if (totalRemainingSecs <= 30 && totalRemainingSecs > 0) {
        card.className = "trade-alert-card pre-alert";
        title.innerHTML = `<i class="fa-solid fa-triangle-exclamation fa-fade"></i> PRE-ALERT: GET READY!`;
        timerBar.style.width = `${(totalRemainingSecs / 30) * 100}%`;

        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Upcoming Pair:</span><span class="val text-gold">${signal.pair}</span></div>
            <div class="signal-row"><span class="lbl">Execution In:</span><span class="val font-mono text-gold">${totalRemainingSecs}s</span></div>
        `;
        document.getElementById('ai-log').innerText = `Locking entry coordinates for ${signal.pair}...`;

        if (lastAlertPlayed !== mins && totalRemainingSecs === 25) {
            playAlertBeep();
            lastAlertPlayed = mins;
        }
    } 
    // STATE 2: ACTIVE SIGNAL EXECUTED (At exact 00:00)
    else if (totalRemainingSecs === 0 || totalRemainingSecs >= 270) {
        card.className = "trade-alert-card active-signal";
        title.innerHTML = `<i class="fa-solid fa-bolt fa-beat"></i> LIVE SIGNAL EXECUTED`;
        timerBar.style.width = `100%`;

        let actionClass = signal.action.includes("CALL") ? "call" : "put";

        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Asset Pair:</span><span class="val">${signal.pair}</span></div>
            <div class="signal-row"><span class="lbl">Direction:</span><span class="val-action ${actionClass}">${signal.action}</span></div>
            <div style="font-size:10px; color:#C99400; text-align:center; margin-top:4px;">* If 1st candle loses, use 1-Step MTG</div>
        `;
        document.getElementById('ai-log').innerText = `Executing 5-Min binary contract on ${signal.pair}`;
    } 
    // STATE 3: SCANNING / THINKING MODE
    else {
        card.className = "trade-alert-card analyzing";
        title.innerHTML = `<i class="fa-solid fa-satellite-dish fa-beat"></i> DEEP MARKET SCANNING...`;
        timerBar.style.width = `${((300 - totalRemainingSecs) / 300) * 100}%`;

        body.innerHTML = `
            <p class="waiting-text">Next Signal queued at next round 5-min interval...</p>
        `;
        document.getElementById('ai-log').innerText = `Cross-checking RSI vectors & price action...`;
    }
}

// Active Traders Fluctuation
setInterval(() => {
    const el = document.getElementById('active-traders');
    if (el) {
        let current = parseInt(el.innerText) || 150;
        let change = Math.floor(Math.random() * 7) - 3;
        el.innerText = Math.max(120, Math.min(190, current + change));
    }
}, 4000);

// Sound Toggle Listener
document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundBtn.classList.toggle('active', soundEnabled);
        });
    }
    
    setInterval(runEngine, 1000);
    runEngine();
});
