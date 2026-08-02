// ==========================================
// QUANTUM AI - LIVING SCANNER ENGINE (v3.0)
// ==========================================

// 1. NAVIGATION TAB SWITCHER
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    if(el) el.classList.add('active');
}

// 2. ACTIVE TRADERS SIMULATION (DYNAMIC PEAK TRAFFIC)
function updateTradersCount() {
    const el = document.getElementById('active-traders-count');
    if (!el) return;
    
    let now = new Date();
    let hours = now.getHours();
    let base = (hours >= 18 && hours <= 22) ? 220 : 120; // Peak traffic in evening
    let current = parseInt(el.innerText);
    let shift = Math.floor(Math.random() * 9) - 4; // -4 to +4 random shift
    
    let updated = Math.max(25, current + shift);
    el.innerText = updated;
}
setInterval(updateTradersCount, 4000);

// 3. LIVING SCANNER: MICRO-TICKS ORDER BOOK DYNAMIC ANIMATION
function updateOrderBook() {
    const askPrices = document.querySelectorAll('.ask-price');
    const askVolumes = document.querySelectorAll('.ask-vol');
    const bidPrices = document.querySelectorAll('.bid-price');
    const bidVolumes = document.querySelectorAll('.bid-vol');

    let basePrice = 1.08535 + (Math.random() * 0.00010);

    // Update Ask Lines (Red)
    askPrices.forEach((el, index) => {
        let p = (basePrice + (0.00004 * (index + 1))).toFixed(5);
        let v = (Math.floor(Math.random() * 500) * 100 + 10000).toLocaleString();
        el.innerText = p;
        if(askVolumes[index]) askVolumes[index].innerText = `${v} USD`;
    });

    // Update Bid Lines (Green)
    bidPrices.forEach((el, index) => {
        let p = (basePrice - (0.00003 * index)).toFixed(5);
        let v = (Math.floor(Math.random() * 800) * 100 + 15000).toLocaleString();
        el.innerText = p;
        if(bidVolumes[index]) bidVolumes[index].innerText = `${v} USD`;
    });
}
setInterval(updateOrderBook, 600); // Ticks update every 600ms

// 4. LIVING SCANNER: INDICATOR BARS & LATENCY FLUIDITY
function animateIndicators() {
    // RSI Random Fluctuation (Oversold Range)
    const rsiValEl = document.getElementById('rsi-val');
    const rsiBarEl = document.getElementById('rsi-bar');
    if (rsiValEl && rsiBarEl) {
        let rsiVal = (22.0 + Math.random() * 5.5).toFixed(1);
        rsiValEl.innerText = `Oversold (${rsiVal})`;
        rsiBarEl.style.width = `${rsiVal}%`;
    }

    // Volatility Bar Pulsing
    const volBarEl = document.getElementById('vol-bar');
    if (volBarEl) {
        let volPct = (75 + Math.random() * 15).toFixed(0);
        volBarEl.style.width = `${volPct}%`;
    }

    // Node Confirmation Match Rate & Latency
    const nodeMatchEl = document.getElementById('node-match');
    const latencyEl = document.getElementById('node-latency');
    if (nodeMatchEl) {
        let match = (95.0 + Math.random() * 4.5).toFixed(1);
        nodeMatchEl.innerText = `MATCHING ${match}%`;
    }
    if (latencyEl) {
        let ms = Math.floor(10 + Math.random() * 8);
        latencyEl.innerText = `${ms}ms`;
    }
}
setInterval(animateIndicators, 1400);

// 5. LIVING SCANNER: LIVE LOG MATRIX TEXT CYCLE
const statusMessages = [
    "EUR/USD: Analyzing Candle Pattern...",
    "EUR/USD: Scanning Liquidity Depth...",
    "EUR/USD: Testing Support & Resistance...",
    "EUR/USD: Validating Momentum Vector...",
    "EUR/USD: Order Flow Confluence Ready..."
];
let msgIndex = 0;
setInterval(() => {
    const statusTextEl = document.getElementById('ai-status-text');
    if (statusTextEl) {
        msgIndex = (msgIndex + 1) % statusMessages.length;
        statusTextEl.innerText = statusMessages[msgIndex];
    }
}, 3000);

// 6. SYSTEM DOCUMENTATION MODAL CONTROLS
function openDocModal() {
    document.getElementById('doc-modal').style.display = 'flex';
}
function closeDocModal() {
    document.getElementById('doc-modal').style.display = 'none';
           }
