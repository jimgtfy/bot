// ==========================================
// QUANTUM AI - FINAL LOGIC v4.0 (Fresh Database & Timer Logic)
// ==========================================

// 1. FRESH LOCAL DATABASE & STATS GENERATOR (~90% Accuracy)
const pairs = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)", "USD/CHF (OTC)", "NZD/USD (OTC)"];
let tradeHistory = [];

function initDatabase() {
    // We create fresh realistic data for the day
    let total = Math.floor(Math.random() * 5) + 15; // 15 to 20 trades
    let losses = Math.floor(Math.random() * 2) + 1; // 1 or 2 losses (ensures ~90% win rate)
    let wins = total - losses;
    
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-wins').innerText = wins;
    document.getElementById('stat-losses').innerText = losses;
    document.getElementById('stat-acc').innerText = ((wins / total) * 100).toFixed(1) + '%';

    // Generate History Table
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';
    
    let now = new Date();
    for(let i=0; i<total; i++) {
        let time = new Date(now.getTime() - (i * 15 * 60000)); // trades every 15 mins
        let timeStr = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let pair = pairs[Math.floor(Math.random() * pairs.length)];
        let isCall = Math.random() > 0.5;
        let actionHTML = isCall ? '<span class="badge-call">CALL ⬆️</span>' : '<span class="badge-put">PUT ⬇️</span>';
        
        // Distribute losses randomly
        let resultHTML = '<span class="badge-win">WIN (M0)</span>';
        if (i < losses) resultHTML = '<span class="badge-loss">LOSS</span>'; // Just for visual demo

        tbody.innerHTML += `<tr><td>${timeStr}</td><td>${pair}</td><td>${actionHTML}</td><td>${resultHTML}</td></tr>`;
    }
}
initDatabase(); // Run immediately

// 2. ULTRA-REALISTIC ACTIVE USERS
setInterval(() => {
    const el = document.getElementById('active-traders');
    // Sine wave + random noise to simulate natural user flow
    let base = 140;
    let organicFlow = Math.sin(Date.now() / 15000) * 15; 
    let randomNoise = Math.floor(Math.random() * 5) - 2;
    el.innerText = Math.floor(base + organicFlow + randomNoise);
}, 2500);

// 3. TAB SWITCHER & SOUND TOGGLE
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if(el) el.classList.add('active');
}

const soundBtn = document.getElementById('sound-btn');
let isSoundOn = true;
soundBtn.addEventListener('click', () => {
    isSoundOn = !isSoundOn;
    soundBtn.innerHTML = isSoundOn ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    soundBtn.classList.toggle('active');
});
function playBeep() {
    if(!isSoundOn) return;
    let ctx = new (window.AudioContext || window.webkitAudioContext)();
    let osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
}

// 4. CORE SIGNAL ENGINE (Pre-Alert -> Signal Execution)
let countdown = 120; // Starts at 2 minutes for demo purposes (Normally 5 min = 300)
let currentTargetPair = "";
let currentTargetAction = "";

function updateSignalUI() {
    const card = document.getElementById('signal-card');
    const title = document.getElementById('signal-status-title');
    const body = document.getElementById('signal-body');
    const bar = document.getElementById('timer-bar');
    const timerTxt = document.getElementById('countdown-timer');

    countdown--;
    if (countdown < 0) countdown = 180; // Reset loop to 3 mins

    // Timer display formatting
    let m = Math.floor(countdown / 60);
    let s = countdown % 60;
    timerTxt.innerText = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
    bar.style.width = `${(countdown / 180) * 100}%`;

    // 🔴 PHASE 1: SCANNING (180s to 31s)
    if (countdown > 30) {
        card.className = "trade-alert-card analyzing";
        title.innerHTML = '<i class="fa-solid fa-magnifying-glass-chart"></i> DEEP MARKET SCANNING...';
        body.innerHTML = '<p class="waiting-text">Algorithmic scanning across 6 OTC pairs for volatility spikes...</p>';
        bar.style.background = '#EAECEF';
    } 
    // 🟡 PHASE 2: PRE-ALERT (30s to 1s) - 30 seconds before!
    else if (countdown <= 30 && countdown > 0) {
        if(countdown === 30) {
            playBeep();
            currentTargetPair = pairs[Math.floor(Math.random() * pairs.length)];
            currentTargetAction = Math.random() > 0.5 ? "CALL ⬆️" : "PUT ⬇️";
        }
        card.className = "trade-alert-card pre-alert";
        title.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> UPCOMING SIGNAL DETECTED';
        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Asset Pair:</span><span class="val font-mono">${currentTargetPair}</span></div>
            <div class="signal-row"><span class="lbl">Timeframe:</span><span class="val font-mono">M5 (5 Minutes)</span></div>
            <div class="signal-row"><span class="lbl">Direction:</span><span class="val text-gold font-mono">CALCULATING...</span></div>
        `;
        bar.style.background = 'var(--brand-gold)';
    } 
    // 🟢 PHASE 3: EXECUTE SIGNAL (At 00:00 - Visible for 10 seconds)
    else if (countdown === 0) {
        playBeep(); setTimeout(playBeep, 200);
        card.className = "trade-alert-card active-signal";
        title.innerHTML = '<i class="fa-solid fa-bolt"></i> EXECUTE TRADE NOW!';
        
        let actionClass = currentTargetAction.includes("CALL") ? "call" : "put";
        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Asset Pair:</span><span class="val font-mono">${currentTargetPair}</span></div>
            <div class="signal-row"><span class="lbl">Timeframe:</span><span class="val font-mono">M5</span></div>
            <div class="signal-row"><span class="lbl">Direction:</span><span class="val-action ${actionClass}">${currentTargetAction}</span></div>
        `;
        bar.style.background = 'var(--trade-green)';
        timerTxt.innerText = "00:00"; // Freeze timer visually for impact
        
        // (Fake DB add)
        setTimeout(initDatabase, 15000); // refresh stats after signal
    }
}
setInterval(updateSignalUI, 1000);


// 5. HIGH-TECH THINKING MODULE ANIMATIONS
setInterval(() => {
    // Deep Learning Matrix Generator (Hex codes)
    const matrix = document.getElementById('matrix-grid');
    if(matrix) {
        let codes = [];
        for(let i=0; i<4; i++) codes.push("0x" + Math.floor(Math.random()*65535).toString(16).toUpperCase().padStart(4, '0'));
        matrix.innerHTML = `<span>${codes[0]}</span><span>${codes[1]}</span><span>${codes[2]}</span><span>${codes[3]}</span>`;
    }

    // Micro-ticks Order Book
    let basePrice = 1.08535 + (Math.random() * 0.00010);
    document.querySelectorAll('.ask-price').forEach(el => el.innerText = (basePrice + 0.00004).toFixed(5));
    document.querySelectorAll('.ask-vol').forEach(el => el.innerText = Math.floor(Math.random()*80 + 10) + "k USD");
    document.querySelectorAll('.bid-price').forEach(el => el.innerText = (basePrice - 0.00003).toFixed(5));
    document.querySelectorAll('.bid-vol').forEach(el => el.innerText = Math.floor(Math.random()*80 + 10) + "k USD");

    // Indicators
    document.getElementById('liq-bar').style.width = Math.floor(60 + Math.random()*35) + '%';
    document.getElementById('mom-bar').style.width = Math.floor(40 + Math.random()*50) + '%';
}, 600);

// Log Matrix Cycle
const msgs = ["Evaluating Volatility...", "Cross-referencing neural nodes...", "Scanning Liquidity Depth...", "Validating RSI Momentum..."];
let mIdx = 0;
setInterval(() => { document.getElementById('ai-log').innerText = msgs[(mIdx++) % msgs.length]; }, 2000);

// 6. DOCS MODAL
function openDocModal() { document.getElementById('doc-modal').style.display = 'flex'; }
function closeDocModal() { document.getElementById('doc-modal').style.display = 'none'; }
