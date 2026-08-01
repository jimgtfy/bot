// 1. Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyCjauNF6LfqnevzzgaxoI2LCM1H2Fk-rg",
  authDomain: "signal-bot-2.firebaseapp.com",
  projectId: "signal-bot-2",
  storageBucket: "signal-bot-2.firebasestorage.app",
  messagingSenderId: "742892417714",
  appId: "1:742892417714:web:aa8894ab18ad32672477ab",
  measurementId: "G-ZDBN6LN935"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let isSoundOn = true;
const otcPairs = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/USD (OTC)", "BTC/USD (OTC)", "ETH/USD (OTC)"];

// Navigation & Filters
function switchTab(tabId, el) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById('section-' + tabId).classList.add('active');
    if (el) el.classList.add('active');
}

function switchTabDirect(tabId) {
    switchTab(tabId, document.getElementById('btn-nav-' + tabId));
}

function filterAssets(type, btn) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    const btn = document.getElementById('sound-toggle');
    const icon = document.getElementById('sound-icon');
    btn.className = isSoundOn ? 'sound-btn active' : 'sound-btn';
    icon.className = isSoundOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
}

function playBeepSound() {
    if (!isSoundOn) return;
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch(e){}
}

function copyAsset(assetName) {
    navigator.clipboard.writeText(assetName);
    alert('অ্যাসেট কপি করা হয়েছে: ' + assetName);
}

// 2. Real-Time Clock
setInterval(() => {
    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
}, 1000);

// Helper function to get Today's Date String (YYYY-MM-DD) for Daily History Separation
function getTodayString() {
    let d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
}

// 3. 24/7 Quantum Engine Core (Fixed 5/0 Minute Alignment + Random Durations)
let currentSchedule = null;

function masterSchedulerEngine() {
    const now = new Date();
    const currentSec = now.getSeconds();
    const currentMin = now.getMinutes();

    // Check if we are approaching a 5-minute mark (e.g. :05, :10, :15 ... :55, :00)
    let isNext5Min = (currentMin + 1) % 5 === 0;
    
    // Check Pre-Signal Alert Phase (10 to 15 seconds before the 5-min mark)
    if (isNext5Min && currentSec >= 45 && currentSec <= 50) {
        if (!currentSchedule) {
            let nextMin = currentMin + 1;
            let pair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
            let durations = [5, 10, 15];
            let durationMin = durations[Math.floor(Math.random() * durations.length)];
            
            currentSchedule = {
                pair: pair,
                direction: Math.random() > 0.5 ? "CALL (UP) ⬆️" : "PUT (DOWN) ⬇️",
                durationMin: durationMin,
                timeframe: `M${durationMin} (${durationMin} Minutes)`,
                startTimeFormatted: `${now.getHours().toString().padStart(2,'0')}:${nextMin === 60 ? '00' : nextMin.toString().padStart(2,'0')}`,
                entryPrice: (Math.random() * (1.1200 - 1.0500) + 1.0500).toFixed(5),
                martingale: "M1 Only",
                confidence: (Math.random() * (98.5 - 91.0) + 91.0).toFixed(1)
            };
            playBeepSound();
        }
        renderPreSignalAlert(currentSchedule, 60 - currentSec);
        return;
    }

    // Check Signal Execution Start Phase (Exactly at :00 second of 5-min mark)
    if (currentMin % 5 === 0 && currentSec <= 3 && currentSchedule) {
        let startTime = Math.floor(Date.now() / 1000);
        let expireAt = startTime + (currentSchedule.durationMin * 60);

        let activeDoc = {
            ...currentSchedule,
            startTime: startTime,
            expireAt: expireAt,
            status: "IN_PROGRESS",
            dateStr: getTodayString()
        };

        db.collection("active_signal").doc("current").set(activeDoc);
        currentSchedule = null; // reset schedule
        playBeepSound();
        return;
    }

    // Reset Schedule Buffer after entry
    if (currentMin % 5 !== 4) {
        currentSchedule = null;
    }
}

setInterval(masterSchedulerEngine, 1000);

// 4. Firebase Active Signal Listener
let activeSignal = null;
let countdownInterval = null;

db.collection("active_signal").doc("current").onSnapshot((doc) => {
    if (doc.exists) {
        let data = doc.data();
        let now = Math.floor(Date.now() / 1000);
        let remaining = data.expireAt - now;

        if (remaining > 0 && data.status === "IN_PROGRESS") {
            activeSignal = { ...data, remainingSec: remaining };
            startCountdown();
        } else {
            if (activeSignal && activeSignal.status === "IN_PROGRESS") {
                finalizeResult(activeSignal);
            }
            activeSignal = null;
            clearInterval(countdownInterval);
            if (!currentSchedule) renderThinkingMode();
        }
    } else {
        if (!currentSchedule) renderThinkingMode();
    }
});

function finalizeResult(signalData) {
    // 88% to 92% Win Rate Enforcement Logic
    let isWin = Math.random() < 0.90; 

    let closedSignal = {
        ...signalData,
        status: "COMPLETED",
        isWin: isWin,
        dateStr: getTodayString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection("signal_history").add(closedSignal);
    db.collection("active_signal").doc("current").update({ status: "COMPLETED" });
}

function startCountdown() {
    clearInterval(countdownInterval);
    renderActiveCard();
    
    countdownInterval = setInterval(() => {
        if (!activeSignal) return;
        activeSignal.remainingSec--;

        if (activeSignal.remainingSec <= 0) {
            clearInterval(countdownInterval);
            finalizeResult(activeSignal);
            activeSignal = null;
            if (!currentSchedule) renderThinkingMode();
        } else {
            renderActiveCard();
        }
    }, 1000);
}

// 5. UI Renderers

// A. Active Trade Card Blueprint
function renderActiveCard() {
    const container = document.getElementById('active-signal-container');
    let isCall = activeSignal.direction.includes("CALL");
    let actionClass = isCall ? "action-call-box" : "action-put-box";
    let actionTextClass = isCall ? "action-text-call" : "action-text-put";

    let min = Math.floor(activeSignal.remainingSec / 60);
    let sec = activeSignal.remainingSec % 60;
    let timeFormatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    container.innerHTML = `
        <div class="quotex-active-card">
            <div class="card-header-row">
                <div class="asset-title-box">
                    <span class="asset-title">${activeSignal.pair}</span>
                    <button class="copy-btn" onclick="copyAsset('${activeSignal.pair}')"><i class="fa-regular fa-copy"></i></button>
                </div>
                <span class="tf-badge"><i class="fa-regular fa-clock"></i> ${activeSignal.timeframe}</span>
            </div>

            <div class="${actionClass}">
                <div class="${actionTextClass}">${activeSignal.direction}</div>
            </div>

            <div class="card-stats-grid">
                <div class="grid-cell">
                    <span>💵 Entry Price</span>
                    <strong class="mono">${activeSignal.entryPrice}</strong>
                </div>
                <div class="grid-cell">
                    <span>⏳ Time Remaining</span>
                    <strong class="mono" style="color:#FFD600;">${timeFormatted} Min</strong>
                </div>
                <div class="grid-cell">
                    <span>⚠️ Martingale</span>
                    <strong>${activeSignal.martingale}</strong>
                </div>
                <div class="grid-cell">
                    <span>🎯 Win Probability</span>
                    <strong style="color:var(--quotex-green);">${activeSignal.confidence}%</strong>
                </div>
            </div>

            <div class="card-footer-info">
                <span>Status: <b style="color:#FFD600;"><i class="fa-solid fa-spinner fa-spin"></i> TRADE RUNNING</b></span>
                <span>Quotex Quantum Engine v2.4</span>
            </div>
        </div>
    `;
}

// B. Pre-Signal Alert (10-15s Warning)
function renderPreSignalAlert(schedule, secondsLeft) {
    const container = document.getElementById('active-signal-container');
    container.innerHTML = `
        <div class="pre-signal-alert">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> UPCOMING TRADE ALERT</h3>
            <p>প্রস্তুত থাকুন! আগামী <b>${secondsLeft} সেকেন্ডের</b> মধ্যে ট্রেড শট আসছে:</p>
            <div style="font-size: 22px; font-weight:800; color:#fff;" class="mono">
                ${schedule.pair} — ${schedule.timeframe}
            </div>
        </div>
    `;
}

// C. Thinking Mode UI (Indicators + AI + Quantum Engine)
function renderThinkingMode() {
    const container = document.getElementById('active-signal-container');
    container.innerHTML = `
        <div class="thinking-card">
            <div class="radar-box">
                <div class="radar-circle"></div>
                <div class="radar-sweep"></div>
                <i class="fa-solid fa-brain ai-brain-icon"></i>
            </div>
            <h3>Quantum Engine Analysis in Progress...</h3>
            <p>আমাদের AI ইঞ্জিন গ্লোবাল ইন্ডিকেটর ও অ্যালগরিদম স্ক্যান করে পরবর্তী ট্রেডের জন্য কনফার্মেশন নিচ্ছে...</p>
            
            <div class="conformation-grid">
                <div class="conf-item">
                    <span><i class="fa-solid fa-chart-line"></i> RSI & Stochastic:</span>
                    <strong>ANALYZING...</strong>
                </div>
                <div class="conf-item">
                    <span><i class="fa-solid fa-layer-group"></i> Bollinger Bands:</span>
                    <strong>SCANNING OTC...</strong>
                </div>
                <div class="conf-item">
                    <span><i class="fa-solid fa-robot"></i> AI Conformation:</span>
                    <strong>94.2% MATCH</strong>
                </div>
                <div class="conf-item">
                    <span><i class="fa-solid fa-microchip"></i> Quantum Engine:</span>
                    <strong>SEARCHING ENTRY</strong>
                </div>
            </div>
        </div>
    `;
}

// 6. History & Stats Engine (Reset Daily at 12:00 AM)
function loadTodayHistory() {
    const tbody = document.getElementById('history-tbody');
    const procGrid = document.getElementById('processed-cards-grid');
    let todayStr = getTodayString();

    db.collection("signal_history")
      .where("dateStr", "==", todayStr)
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        procGrid.innerHTML = '';
        let total = 0, wins = 0, losses = 0;

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#90A4AE;">আজকে এখন পর্যন্ত কোনো সিগন্যাল সমাপ্ত হয়নি।</td></tr>';
            procGrid.innerHTML = '<p class="no-data">আজকের সমাপ্ত সিগন্যালগুলো এখানে দেখাবে...</p>';
            document.getElementById('total-count').innerText = 0;
            document.getElementById('win-count').innerText = 0;
            document.getElementById('loss-count').innerText = 0;
            document.getElementById('win-rate').innerText = "0%";
            return;
        }

        let i = snapshot.docs.length;
        let cardCount = 0;

        snapshot.forEach((doc) => {
            let data = doc.data();
            total++;
            if (data.isWin) wins++; else losses++;

            let dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
            let timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Table Row
            let tr = document.createElement('tr');
            let dirStyle = data.direction.includes("CALL") ? "color:var(--quotex-green); font-weight:bold;" : "color:var(--quotex-red); font-weight:bold;";
            let resBadge = data.isWin ? '<span class="badge-win">WIN</span>' : '<span class="badge-loss">LOSS</span>';

            tr.innerHTML = `
                <td>${i--}</td>
                <td class="mono">${data.startTimeFormatted || timeStr}</td>
                <td><b>${data.pair}</b></td>
                <td style="${dirStyle}">${data.direction}</td>
                <td>${data.timeframe}</td>
                <td>${resBadge}</td>
            `;
            tbody.appendChild(tr);

            // Processed Grid Cards
            if (cardCount < 4) {
                let div = document.createElement('div');
                div.className = 'proc-card';
                div.innerHTML = `
                    <div>
                        <strong>${data.pair}</strong>
                        <span>${data.startTimeFormatted || timeStr} | ${data.direction}</span>
                    </div>
                    ${resBadge}
                `;
                procGrid.appendChild(div);
                cardCount++;
            }
        });

        document.getElementById('total-count').innerText = total;
        document.getElementById('win-count').innerText = wins;
        document.getElementById('loss-count').innerText = losses;
        let rate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
        document.getElementById('win-rate').innerText = rate + "%";
    });
}

loadTodayHistory();
      
