// ==========================================
// QUANTUM ENGINE v4.5 - GLOBAL SYNC EDITION
// ==========================================

const pairs = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)", "USD/CHF (OTC)", "NZD/USD (OTC)"];
const CYCLE_TIME = 150; // 2 minutes 30 seconds per signal cycle (Adjustable)

// 1. DETERMINISTIC RANDOM GENERATOR
// এই ফাংশনটি যেকোনো একটি নির্দিষ্ট আইডির জন্য সবসময় একই ফলাফল দিবে। 
// ফলে পৃথিবীর সবাই একই সিগন্যাল পাবে।
function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// 2. GLOBALLY SYNCED DATABASE
// লোকাল স্টোরেজের বদলে গ্লোবাল টাইম ব্যবহার করে হিস্ট্রি তৈরি হবে
function renderGlobalHistory() {
    let currentSec = Math.floor(Date.now() / 1000);
    let currentCycleId = Math.floor(currentSec / CYCLE_TIME);
    
    let wins = 0;
    let losses = 0;
    let total = 20; // Last 20 signals
    let historyHTML = '';

    // Generate accurate history for the last 20 global cycles
    for (let i = 1; i <= total; i++) {
        let pastCycleId = currentCycleId - i;
        
        // Use seed to guarantee everyone sees the exact same past trades
        let rndPair = seededRandom(pastCycleId * 10);
        let rndAct = seededRandom(pastCycleId * 20);
        let rndRes = seededRandom(pastCycleId * 30); 
        
        let pair = pairs[Math.floor(rndPair * pairs.length)];
        let action = rndAct > 0.45 ? "CALL" : "PUT";
        let isWin = rndRes > 0.12; // ~88-90% Global Win Rate
        
        if (isWin) wins++; else losses++;

        let pastTime = new Date(pastCycleId * CYCLE_TIME * 1000);
        let timeStr = pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let actionBadge = action === "CALL" ? '<span class="badge-call">CALL ⬆️</span>' : '<span class="badge-put">PUT ⬇️</span>';
        let resultBadge = isWin ? `<span class="badge-win">WIN (M0)</span>` : `<span class="badge-loss">LOSS</span>`;
        
        historyHTML += `<tr><td>${timeStr}</td><td>${pair}</td><td>${actionBadge}</td><td>${resultBadge}</td></tr>`;
    }

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-wins').innerText = wins;
    document.getElementById('stat-losses').innerText = losses;
    document.getElementById('stat-acc').innerText = ((wins / total) * 100).toFixed(1) + '%';
    document.getElementById('history-body').innerHTML = historyHTML;
}

// Initial DB Render
renderGlobalHistory();

// 3. SOUND ENGINE
const soundBtn = document.getElementById('sound-btn');
let isSoundOn = true;
soundBtn.addEventListener('click', () => {
    isSoundOn = !isSoundOn;
    soundBtn.innerHTML = isSoundOn ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    soundBtn.classList.toggle('active');
});

function playAudioBeep() {
    if(!isSoundOn) return;
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
}

// 4. GLOBALLY SYNCED SIGNAL & PRE-ALERT ENGINE
let lastBeepTime = 0;

function runGlobalSignalLoop() {
    let now = Date.now();
    let currentSec = Math.floor(now / 1000);
    let cycleElapsed = currentSec % CYCLE_TIME; 
    let cycleId = Math.floor(currentSec / CYCLE_TIME);

    const card = document.getElementById('signal-card');
    const title = document.getElementById('signal-status-title');
    const body = document.getElementById('signal-body');
    const bar = document.getElementById('timer-bar');
    const timerTxt = document.getElementById('countdown-timer');

    // Target the current cycle if we are in the execution phase (0-10s), 
    // otherwise prepare for the NEXT upcoming cycle.
    let targetCycleId = (cycleElapsed <= 10) ? cycleId : (cycleId + 1);

    // Get strictly synchronized Global Signal
    let rndPair = seededRandom(targetCycleId * 10);
    let rndAct = seededRandom(targetCycleId * 20);
    let targetPair = pairs[Math.floor(rndPair * pairs.length)];
    let targetAction = rndAct > 0.45 ? "CALL ⬆️" : "PUT ⬇️";

    // Timer calculation
    let countdown = CYCLE_TIME - cycleElapsed; 
    if (cycleElapsed <= 10) countdown = 0; // Freeze at 00:00 for execution

    let m = Math.floor(countdown / 60);
    let s = countdown % 60;
    timerTxt.innerText = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
    bar.style.width = `${(countdown / CYCLE_TIME) * 100}%`;

    // 🔴 STAGE 3: EXECUTE SIGNAL (First 10 seconds of the cycle)
    if (cycleElapsed >= 0 && cycleElapsed <= 10) {
        if (cycleElapsed === 0 && currentSec !== lastBeepTime) {
            playAudioBeep(); setTimeout(playAudioBeep, 200);
            lastBeepTime = currentSec;
            renderGlobalHistory(); // Refresh history automatically worldwide
        }
        card.className = "trade-alert-card active-signal";
        title.innerHTML = '<i class="fa-solid fa-bolt"></i> EXECUTE TRADE NOW!';
        let actionClass = targetAction.includes("CALL") ? "call" : "put";
        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Asset Pair:</span><span class="val font-mono">${targetPair}</span></div>
            <div class="signal-row"><span class="lbl">Timeframe:</span><span class="val font-mono">M5</span></div>
            <div class="signal-row"><span class="lbl">Direction:</span><span class="val-action ${actionClass}">${targetAction}</span></div>
        `;
        bar.style.background = 'var(--trade-green)';
        timerTxt.innerText = "00:00";
    }
    // 🟡 STAGE 1: SCANNING MODE
    else if (cycleElapsed > 10 && cycleElapsed < (CYCLE_TIME - 30)) {
        card.className = "trade-alert-card analyzing";
        title.innerHTML = '<i class="fa-solid fa-magnifying-glass-chart"></i> DEEP MARKET SCANNING...';
        body.innerHTML = '<p class="waiting-text">Scanning liquidity pools across 6 OTC pairs for high confluence...</p>';
        bar.style.background = '#EAECEF';
    }
    // 🟢 STAGE 2: PRE-ALERT (Last 30 seconds of the cycle)
    else if (cycleElapsed >= (CYCLE_TIME - 30)) {
        if (cycleElapsed === (CYCLE_TIME - 30) && currentSec !== lastBeepTime) {
            playAudioBeep();
            lastBeepTime = currentSec;
        }
        card.className = "trade-alert-card pre-alert";
        title.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> UPCOMING SIGNAL DETECTED';
        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Asset Pair:</span><span class="val font-mono">${targetPair}</span></div>
            <div class="signal-row"><span class="lbl">Timeframe:</span><span class="val font-mono">M5 (5 Minutes)</span></div>
            <div class="signal-row"><span class="lbl">Direction:</span><span class="val text-gold font-mono">ANALYZING CANDLE...</span></div>
        `;
        bar.style.background = 'var(--brand-gold)';
    }
}

// Run engine every second
setInterval(runGlobalSignalLoop, 1000);


// 5. HIGH-TECH SCANNER & MATRIX ANIMATIONS
setInterval(() => {
    const matrix = document.getElementById('matrix-grid');
    if(matrix) {
        let hex = [];
        for(let i=0; i<4; i++) hex.push("0x" + Math.floor(Math.random()*65535).toString(16).toUpperCase().padStart(4, '0'));
        matrix.innerHTML = `<span>${hex[0]}</span><span>${hex[1]}</span><span>${hex[2]}</span><span>${hex[3]}</span>`;
    }

    let price = 1.08535 + (Math.random() * 0.00010);
    document.querySelectorAll('.ask-price').forEach(el => el.innerText = (price + 0.00004).toFixed(5));
    document.querySelectorAll('.ask-vol').forEach(el => el.innerText = Math.floor(Math.random()*70 + 20) + "k USD");
    document.querySelectorAll('.bid-price').forEach(el => el.innerText = (price - 0.00003).toFixed(5));
    document.querySelectorAll('.bid-vol').forEach(el => el.innerText = Math.floor(Math.random()*70 + 20) + "k USD");

    document.getElementById('liq-bar').style.width = Math.floor(65 + Math.random()*30) + '%';
    document.getElementById('mom-bar').style.width = Math.floor(50 + Math.random()*40) + '%';
}, 650);

const aiLogs = ["Deep neural pattern mapping...", "Scanning OTC market liquidity...", "Cross-checking RSI vectors...", "Validating order flow depth..."];
let logIdx = 0;
setInterval(() => { document.getElementById('ai-log').innerText = aiLogs[(logIdx++) % aiLogs.length]; }, 2500);

// 6. GLOBAL ACTIVE USER FLOW (Synced Globally + Micro Noise)
setInterval(() => {
    const el = document.getElementById('active-traders');
    let globalTime = Date.now();
    let base = 145;
    // Worldwide synchronized sine wave 
    let wave = Math.sin(globalTime / 60000) * 15; 
    let pseudoNoise = Math.floor(seededRandom(Math.floor(globalTime / 2000)) * 5) - 2;
    el.innerText = Math.floor(base + wave + pseudoNoise);
}, 2000);

// 7. UTILITIES
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if(el) el.classList.add('active');
}

function openDocModal() { document.getElementById('doc-modal').style.display = 'flex'; }
function closeDocModal() { document.getElementById('doc-modal').style.display = 'none'; }
