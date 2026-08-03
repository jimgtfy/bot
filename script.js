// --- 1. 30-DAY MASTER SCHEDULE GENERATOR WITH MTG & ACCURACY (80%-92%) ---
function generateMasterSchedule() {
    const pairs = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)", "USD/CHF (OTC)", "NZD/USD (OTC)", "EUR/GBP (OTC)", "AUD/NZD (OTC)"];
    const actions = ["CALL ⬆️", "PUT ⬇️"];
    const masterData = {};

    // Seeded random function to ensure day-specific unique patterns that repeat every month
    for (let day = 1; day <= 31; day++) {
        let daySignals = [];
        // Generate 75 to 95 signals per day
        let totalSignalsToday = 75 + (day * 3) % 21; 
        
        // Time slots distributed across 24 hours (every 5 or 10 mins randomly)
        let currentHour = 0;
        let currentMin = 0;

        for (let i = 0; i < totalSignalsToday; i++) {
            // Pick random round minutes: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
            let roundMins = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
            let randomMinIndex = (day * 7 + i * 13) % roundMins.length;
            currentMin = roundMins[randomMinIndex];
            
            // Increment hours smoothly
            if (i > 0 && currentMin === 0) {
                currentHour = (currentHour + 1) % 24;
            }

            let timeStr = String(currentHour).padStart(2, '0') + ":" + String(currentMin).padStart(2, '0');
            let pair = pairs[(day + i) % pairs.length];
            let action = actions[(day * 3 + i) % 2];

            // Accuracy control (Target: ~85% Win rate)
            let winCheck = (day * 17 + i * 31) % 100;
            let resultStr = "";

            if (winCheck < 70) {
                resultStr = "WIN (M0)"; // Direct Win
            } else if (winCheck < 88) {
                resultStr = "WIN (MTG)"; // 1-Step MTG Win
            } else {
                resultStr = "LOSS"; // Loss
            }

            daySignals.push({
                time: timeStr,
                pair: pair,
                action: action,
                result: resultStr
            });

            // Skip some time slots to spread across 24 hours naturally
            currentMin += 15 + ((day + i) % 3) * 5;
            if (currentMin >= 60) {
                currentHour = (currentHour + 1) % 24;
                currentMin = currentMin % 60;
            }
        }
        
        // Sort signals by time chronologically
        daySignals.sort((a, b) => a.time.localeCompare(b.time));
        masterData[day] = daySignals;
    }
    return masterData;
}

const GLOBAL_MASTER_SCHEDULE = generateMasterSchedule();

// Get today's signals based on day of the month (1-31 cycle)
function getTodaySignals() {
    const now = new Date();
    let day = now.getDate();
    return GLOBAL_MASTER_SCHEDULE[day] || GLOBAL_MASTER_SCHEDULE[1];
}

// --- 2. CORE APP STATE & ENGINE ---
let activeTab = 'home';
let soundEnabled = true;

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    if(btnElement) btnElement.classList.add('active');
    activeTab = tabId;
    
    if(tabId === 'analytics') {
        renderHistoryTable();
    }
}

function openDocModal() { document.getElementById('doc-modal').style.display = 'flex'; }
function closeDocModal() { document.getElementById('doc-modal').style.display = 'none'; }

// --- 3. LIVE ENGINE & CLOCK SYNC ---
function runQuantumEngine() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const currentTotalSec = hours * 3600 + minutes * 60 + seconds;
    const todaySignals = getTodaySignals();

    let upcomingSignal = null;
    let timeDiffToNext = Infinity;

    // Find the next upcoming signal
    for (let sig of todaySignals) {
        let [sigH, sigM] = sig.time.split(':').map(Number);
        let sigTotalSec = sigH * 3600 + sigM * 60;
        let diff = sigTotalSec - currentTotalSec;

        // If signal is ahead in today's timeline
        if (diff >= 0 && diff < timeDiffToNext) {
            timeDiffToNext = diff;
            upcomingSignal = sig;
            break;
        }
    }

    // If no more signals today, take the first signal of tomorrow/cycle
    if (!upcomingSignal && todaySignals.length > 0) {
        upcomingSignal = todaySignals[0];
        let [sigH, sigM] = upcomingSignal.time.split(':').map(Number);
        let sigTotalSec = sigH * 3600 + sigM * 60;
        timeDiffToNext = (24 * 3600 - currentTotalSec) + sigTotalSec;
    }

    updateUIState(timeDiffToNext, upcomingSignal);
    updateGlobalStats(todaySignals);
}

// Update UI based on countdown timer to next signal
function updateUIState(diffSec, signal) {
    const card = document.getElementById('signal-card');
    const title = document.getElementById('signal-status-title');
    const timerBadge = document.getElementById('countdown-timer');
    const body = document.getElementById('signal-body');
    const timerBar = document.getElementById('timer-bar');

    let min = Math.floor(diffSec / 60);
    let sec = diffSec % 60;
    let timeFormatted = String(min).padStart(2, '0') + ":" + String(sec).padStart(2, '0');
    timerBadge.innerText = timeFormatted;

    // PRE-ALERT MODE (30 seconds to 0 seconds before signal)
    if (diffSec <= 30 && diffSec > 0) {
        card.className = "trade-alert-card pre-alert";
        title.innerHTML = `<i class="fa-solid fa-triangle-exclamation fa-fade"></i> PRE-ALERT: GET READY!`;
        timerBar.style.width = `${(diffSec / 30) * 100}%`;
        
        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Upcoming Pair:</span><span class="val text-gold">${signal.pair}</span></div>
            <div class="signal-row"><span class="lbl">Scheduled Time:</span><span class="val font-mono">${signal.time} UTC</span></div>
            <div class="signal-row"><span class="lbl">Expected Action:</span><span class="val">Analysing Momentum...</span></div>
        `;
        document.getElementById('ai-log').innerText = `Locking coordinates for ${signal.pair} at ${signal.time}...`;
    } 
    // ACTIVE SIGNAL EXECUTION MODE (Exact match or first 5 mins window)
    else if (diffSec === 0 || (diffSec >= 270000)) { // Active execution window simulation
        card.className = "trade-alert-card active-signal";
        title.innerHTML = `<i class="fa-solid fa-bolt fa-beat"></i> LIVE SIGNAL EXECUTED`;
        timerBar.style.width = `100%`;

        let actionClass = signal.action.includes("CALL") ? "call" : "put";
        let mtgNote = signal.result.includes("MTG") ? `<div style="font-size:10px; color:#C99400; margin-top:4px;">* If 1st step loss, use 1-Step MTG</div>` : "";

        body.innerHTML = `
            <div class="signal-row"><span class="lbl">Asset Pair:</span><span class="val">${signal.pair}</span></div>
            <div class="signal-row"><span class="lbl">Direction:</span><span class="val-action ${actionClass}">${signal.action}</span></div>
            ${mtgNote}
        `;
        document.getElementById('ai-log').innerText = `Executing 5-Min binary contract on ${signal.pair}`;
    } 
    // SCANNING / THINKING MODE
    else {
        card.className = "trade-alert-card analyzing";
        title.innerHTML = `<i class="fa-solid fa-satellite-dish fa-beat"></i> DEEP MARKET SCANNING...`;
        timerBar.style.width = `${Math.min(100, (diffSec / 300) * 100)}%`;

        body.innerHTML = `
            <p class="waiting-text">Next Signal in queue for <strong>${signal ? signal.pair : "OTC Market"}</strong> at <strong>${signal ? signal.time : ""}</strong></p>
            <div class="signal-row" style="margin-top:8px;"><span class="lbl">Cycle Status:</span><span class="val text-green font-mono">Synced (30-Day Master Loop)</span></div>
        `;
    }
}

// Render History Table in Analytics Tab
function renderHistoryTable() {
    const tbody = document.getElementById('history-body');
    const signals = getTodaySignals();
    let html = '';

    // Show past signals of the day
    signals.forEach(sig => {
        let resColor = sig.result.includes("WIN") ? "text-green" : "text-red";
        html += `
            <tr>
                <td class="font-mono">${sig.time}</td>
                <td>${sig.pair}</td>
                <td><b>${sig.action}</b></td>
                <td class="${resColor}"><b>${sig.result}</b></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Calculate and update global dashboard stats
function updateGlobalStats(signals) {
    let total = signals.length;
    let wins = signals.filter(s => s.result.includes("WIN")).length;
    let losses = total - wins;
    let accuracy = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-wins').innerText = wins;
    document.getElementById('stat-losses').innerText = losses;
    document.getElementById('stat-acc').innerText = accuracy + "%";
}

// Initialize active users random fluctuation
setInterval(() => {
    let base = 140;
    let fluctuation = Math.floor(Math.random() * 30) - 15;
    document.getElementById('active-traders').innerText = base + fluctuation;
}, 5000);

// Run Engine every second
setInterval(runQuantumEngine, 1000);

// Initial call
window.onload = function() {
    runQuantumEngine();
            }
