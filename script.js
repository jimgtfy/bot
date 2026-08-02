// ==========================================
// QUANTUM AI - FINAL LOGIC (Working Timer & Modules)
// ==========================================

// 1. Tab Switcher Logic
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    if(el) { el.classList.add('active'); }
}

// 2. Sound Toggle Logic
const soundBtn = document.getElementById('sound-btn');
let isSoundOn = true;
soundBtn.addEventListener('click', () => {
    isSoundOn = !isSoundOn;
    if(isSoundOn) {
        soundBtn.classList.add('active');
        soundBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    } else {
        soundBtn.classList.remove('active');
        soundBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    }
});

// 3. Dynamic Traders Simulator
setInterval(() => {
    const el = document.getElementById('active-traders-count');
    let current = parseInt(el.innerText);
    let shift = Math.floor(Math.random() * 7) - 3; 
    el.innerText = Math.max(80, current + shift);
}, 4000);

// 4. Live Countdown Timer Logic (NEW)
let timeLeft = 45; // Start at 45 seconds for demo
const timerText = document.getElementById('countdown-timer');
const timerBar = document.getElementById('timer-bar');

setInterval(() => {
    timeLeft--;
    if(timeLeft < 0) timeLeft = 59; // Reset to 59s when hits 0
    
    // Format to 00:XX
    let displayTime = timeLeft < 10 ? `00:0${timeLeft}` : `00:${timeLeft}`;
    if (timerText) timerText.innerText = displayTime;
    
    // Decrease Bar Width
    let widthPct = (timeLeft / 59) * 100;
    if (timerBar) timerBar.style.width = `${widthPct}%`;

    // Change color when time is critical (<10s)
    if(timeLeft < 10 && timerBar) {
        timerBar.style.background = 'var(--trade-red)';
        timerText.style.background = 'var(--trade-red)';
        timerText.style.color = '#FFF';
    } else if (timerBar) {
        timerBar.style.background = 'var(--brand-gold)';
        timerText.style.background = 'var(--brand-gold)';
        timerText.style.color = '#000';
    }
}, 1000);

// 5. Living Scanner: Order Book Micro-ticks
setInterval(() => {
    const askPrices = document.querySelectorAll('.ask-price');
    const bidPrices = document.querySelectorAll('.bid-price');
    let basePrice = 1.08535 + (Math.random() * 0.00010);

    askPrices.forEach((el, i) => el.innerText = (basePrice + (0.00004 * (i + 1))).toFixed(5));
    bidPrices.forEach((el, i) => el.innerText = (basePrice - (0.00003 * i)).toFixed(5));
}, 700);

// 6. Living Scanner: Indicator Fluidity
setInterval(() => {
    const rsiValEl = document.getElementById('rsi-val');
    const rsiBarEl = document.getElementById('rsi-bar');
    if (rsiValEl && rsiBarEl) {
        let rsiVal = (22.0 + Math.random() * 5.5).toFixed(1);
        rsiValEl.innerText = `Oversold (${rsiVal})`;
        rsiBarEl.style.width = `${rsiVal}%`;
    }

    const volBarEl = document.getElementById('vol-bar');
    if (volBarEl) volBarEl.style.width = `${(75 + Math.random() * 15).toFixed(0)}%`;

    const matchEl = document.getElementById('node-match');
    const latEl = document.getElementById('node-latency');
    if (matchEl) matchEl.innerText = `MATCHING ${(95.0 + Math.random() * 4.5).toFixed(1)}%`;
    if (latEl) latEl.innerText = `${Math.floor(10 + Math.random() * 8)}ms`;
}, 1500);

// 7. Live Log Matrix Cycle
const msgs = [
    "Analyzing Candle Pattern...", "Scanning Liquidity Depth...", "Testing Support Level...", "Validating Momentum Vector..."
];
let msgIdx = 0;
setInterval(() => {
    const el = document.getElementById('ai-status-text');
    if (el) { msgIdx = (msgIdx + 1) % msgs.length; el.innerText = msgs[msgIdx]; }
}, 3000);

// 8. Docs Modal Control
function openDocModal() { document.getElementById('doc-modal').style.display = 'flex'; }
function closeDocModal() { document.getElementById('doc-modal').style.display = 'none'; }
            
