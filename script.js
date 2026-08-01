// ১. Firebase Setup
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

// ২. নেভিগেশন ও ফিল্টার
function switchTab(tabId, el) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById('section-' + tabId).classList.add('active');
    if (el) el.classList.add('active');
}

function switchTabDirect(tabId) {
    const navBtn = document.getElementById('btn-nav-' + tabId);
    switchTab(tabId, navBtn);
}

function filterAssets(type, btn) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    const btn = document.getElementById('sound-toggle');
    const icon = document.getElementById('sound-icon');
    
    if (isSoundOn) {
        btn.classList.add('active');
        icon.className = 'fa-solid fa-volume-high';
    } else {
        btn.classList.remove('active');
        icon.className = 'fa-solid fa-volume-xmark';
    }
}

// ৩. সাউন্ড চেইম (Beep Alert)
function playBeepSound() {
    if (!isSoundOn) return;
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch notification
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch(e){}
}

// ৪. ক্লিপ্রবোর্ড কপি
function copyAsset(assetName) {
    navigator.clipboard.writeText(assetName);
    alert('অ্যাসেট কপি করা হয়েছে: ' + assetName);
}

// ৫. লাইভ ঘড়ি
setInterval(() => {
    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
}, 1000);

const otcPairs = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/USD (OTC)", "BTC/USD (OTC)", "ETH/USD (OTC)"];
let activeSignal = null;
let countdownInterval = null;

// ৬. অটো সিগন্যাল জেনারেটর মেকানিজম
function checkAndAutoGenerateSignal() {
    const now = Math.floor(Date.now() / 1000);

    db.collection("active_signal").doc("current").get().then((doc) => {
        let needNewSignal = false;

        if (!doc.exists) {
            needNewSignal = true;
        } else {
            let data = doc.data();
            if (data.expireAt < now - (data.waitTime || 35)) {
                needNewSignal = true;
            }
        }

        if (needNewSignal) {
            let pair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
            let direction = Math.random() > 0.5 ? "CALL (UP) ⬆️" : "PUT (DOWN) ⬇️";
            let durationMinutes = 5; // M5 time frame
            let randomGapSeconds = Math.floor(Math.random() * 60) + 30; // ৩০-৯০ সেকেন্ড থিংকিং মুড গ্যাপ
            let expireAt = now + (durationMinutes * 60);
            let entryPrice = (Math.random() * (1.1200 - 1.0500) + 1.0500).toFixed(5);

            let newSignal = {
                pair: pair,
                direction: direction,
                timeframe: "M5 (5 Minutes)",
                durationMin: durationMinutes,
                expireAt: expireAt,
                entryPrice: entryPrice,
                martingale: "M1 Only",
                confidence: (Math.random() * (98.8 - 92.5) + 92.5).toFixed(1),
                status: "IN_PROGRESS",
                waitTime: randomGapSeconds,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            db.collection("active_signal").doc("current").set(newSignal);
        }
    });
}

setInterval(checkAndAutoGenerateSignal, 5000);
checkAndAutoGenerateSignal();

// ৭. ফায়ারবেস স্ন্যাপশট ও রেজাল্ট হ্যান্ডলিং
db.collection("active_signal").doc("current").onSnapshot((doc) => {
    if (doc.exists) {
        let data = doc.data();
        let now = Math.floor(Date.now() / 1000);
        let remaining = data.expireAt - now;

        if (remaining > 0) {
            if (!activeSignal || activeSignal.expireAt !== data.expireAt) {
                playBeepSound();
            }
            activeSignal = { ...data, remainingSec: remaining };
            startCountdown();
        } else {
            if (activeSignal) {
                finalizeResult(activeSignal);
            }
            activeSignal = null;
            clearInterval(countdownInterval);
            renderThinkingMode(); // থিংকিং মুড শো করবে
        }
    } else {
        renderThinkingMode();
    }
});

function finalizeResult(signalData) {
    let isWin = Math.random() < 0.91; // ৯১% উইন চান্স
    let closedSignal = {
        ...signalData,
        status: "COMPLETED",
        isWin: isWin,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection("signal_history").add(closedSignal);
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
            renderThinkingMode();
        } else {
            renderActiveCard();
        }
    }, 1000);
}

// ৮. ইউআই রেন্ডারার (Quotex Blueprint Active Card)
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
                    <span>⏳ Expires In</span>
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
                <span>Status: <b style="color:#FFD600;"><i class="fa-solid fa-spinner fa-spin"></i> LIVE EXECUTION</b></span>
                <span>Quotex Quantum Engine v2.4</span>
            </div>
        </div>
    `;
}

// ৯. থিংকিং মুড রেন্ডারার (Thinking Mode UI)
function renderThinkingMode() {
    const container = document.getElementById('active-signal-container');
    container.innerHTML = `
        <div class="thinking-card">
            <div class="radar-box">
                <div class="radar-circle"></div>
                <div class="radar-sweep"></div>
                <i class="fa-solid fa-brain ai-brain-icon"></i>
            </div>
            <h3><i class="fa-solid fa-microchip" style="color:var(--quotex-green);"></i> AI Market Analysis in Progress...</h3>
            <p>আমাদের কোয়ান্ট অ্যালগরিদম গভীরতম ক্যান্ডেলস্টিক প্যাটার্ন এবং ভলিউম স্ক্যান করছে। নতুন সিগন্যাল যেকোনো মুহূর্তে আসছে...</p>
            
            <div class="scanned-assets">
                <span class="asset-pill"><i class="fa-solid fa-spinner fa-spin"></i> EUR/USD</span>
                <span class="asset-pill"><i class="fa-solid fa-spinner fa-spin"></i> GBP/USD</span>
                <span class="asset-pill"><i class="fa-solid fa-spinner fa-spin"></i> BTC/USD</span>
                <span class="asset-pill"><i class="fa-solid fa-spinner fa-spin"></i> AUD/USD</span>
            </div>
        </div>
    `;
}

// ১০. হিস্ট্রি টেবিল ও প্রসেসড কার্ড লোড
function loadHistory() {
    const tbody = document.getElementById('history-tbody');
    const procGrid = document.getElementById('processed-cards-grid');

    db.collection("signal_history").orderBy("timestamp", "desc").limit(30).onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        procGrid.innerHTML = '';
        let total = 0, wins = 0, losses = 0;

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#90A4AE;">কোনো রেকর্ড পাওয়া যায়নি।</td></tr>';
            procGrid.innerHTML = '<p class="no-data">কোনো সমাপ্ত সিগন্যাল লোড হয়নি...</p>';
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
            let dateStr = dateObj.toLocaleDateString();

            // Table Row
            let tr = document.createElement('tr');
            let dirStyle = data.direction.includes("CALL") ? "color:var(--quotex-green); font-weight:bold;" : "color:var(--quotex-red); font-weight:bold;";
            let resBadge = data.isWin ? '<span class="badge-win">WIN</span>' : '<span class="badge-loss">LOSS</span>';

            tr.innerHTML = `
                <td>${i--}</td>
                <td class="mono">${dateStr} ${timeStr}</td>
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
                        <span>${timeStr} | ${data.direction}</span>
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

loadHistory();

// ১১. টোস্ট নোটিফিকেশন
setInterval(() => {
    const sampleUsers = ["@trader_rakib", "@sumon_fx", "@quotex_pro", "@binary_king", "@tanvir_vip"];
    let randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    let randomPair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
    let randomAmount = Math.floor(Math.random() * 220) + 50;

    document.getElementById('toast-user').innerText = randomUser;
    document.getElementById('toast-text').innerText = `${randomPair}-এ $${randomAmount} প্রফিট করেছেন!`;

    const toast = document.getElementById('live-win-toast');
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}, 22000);
              
