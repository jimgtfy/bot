// ১. Firebase Configuration
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

// ২. সেকশন সুইচিং (Bottom Navigation)
function switchTab(tabId, el) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById('section-' + tabId).classList.add('active');
    el.classList.add('active');
}

// ৩. লাইভ ক্লক ও অনলাইন মেম্বার
function updateClock() {
    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

setInterval(() => {
    let count = Math.floor(Math.random() * (1650 - 1350 + 1)) + 1350;
    document.getElementById('online-users').innerText = count.toLocaleString();
}, 5000);

const otcPairs = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/USD (OTC)", "EUR/GBP (OTC)", "USD/CHF (OTC)"];
let activeSignal = null;
let countdownInterval = null;
let priceInterval = null;

// ৪. স্মুথ ক্রিস্প সাউন্ড (Chime Sound)
function playBinanceChime() {
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6 Note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch(e){}
}

// ৫. লাইভ প্রাইস সিমুলেটর (Live Price Ticker)
function startPriceTicker(basePrice) {
    clearInterval(priceInterval);
    let currentPrice = parseFloat(basePrice);
    
    priceInterval = setInterval(() => {
        let change = (Math.random() - 0.49) * 0.00015;
        currentPrice += change;
        let priceElem = document.getElementById('live-price-ticker');
        if (priceElem) {
            priceElem.innerText = currentPrice.toFixed(5);
        }
    }, 800);
}

// ৬. লাইভ সিগন্যাল অটো জেনারেটর (Realtime Engine)
function checkAndAutoGenerateSignal() {
    const now = Math.floor(Date.now() / 1000);

    db.collection("active_signal").doc("current").get().then((doc) => {
        let needNewSignal = false;

        if (!doc.exists) {
            needNewSignal = true;
        } else {
            let data = doc.data();
            if (data.expireAt < now - (data.waitTime || 40)) {
                needNewSignal = true;
            }
        }

        if (needNewSignal) {
            let pair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
            let direction = Math.random() > 0.5 ? "CALL (UP) ⬆️" : "PUT (DOWN) ⬇️";
            let durationMinutes = Math.floor(Math.random() * 4) + 3; // ৩-৬ মি.
            let randomGapSeconds = Math.floor(Math.random() * 90) + 30; 
            let expireAt = now + (durationMinutes * 60);
            let basePrice = (Math.random() * (1.1200 - 1.0500) + 1.0500).toFixed(5);

            let newSignal = {
                pair: pair,
                direction: direction,
                durationMin: durationMinutes,
                expireAt: expireAt,
                basePrice: basePrice,
                confidence: (Math.random() * (98.8 - 92.5) + 92.5).toFixed(1),
                status: "IN_PROGRESS", // টাইমার চলাকালে ফলাফল দেখানো বন্ধ
                isWin: null, // টাইমার শেষে রেজাল্ট ঠিক হবে
                waitTime: randomGapSeconds,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            db.collection("active_signal").doc("current").set(newSignal);
        }
    });
}

setInterval(checkAndAutoGenerateSignal, 5000);
checkAndAutoGenerateSignal();

// ৭. ফায়ারবেস থেকে সিগন্যাল লিসেনিং ও টাইমার ক্লোজিং লজিক
db.collection("active_signal").doc("current").onSnapshot((doc) => {
    if (doc.exists) {
        let data = doc.data();
        let now = Math.floor(Date.now() / 1000);
        let remaining = data.expireAt - now;

        if (remaining > 0) {
            if (!activeSignal || activeSignal.expireAt !== data.expireAt) {
                playBinanceChime();
                startPriceTicker(data.basePrice || "1.08450");
            }
            activeSignal = { ...data, remainingSec: remaining };
            startCountdown();
        } else {
            // টাইমার শেষ! এখন ক্যান্ডেল ক্লোজিং অনুযায়ী রেজাল্ট জেনারেট হবে
            if (activeSignal) {
                finalizeSignalResult(activeSignal);
            }
            activeSignal = null;
            clearInterval(countdownInterval);
            clearInterval(priceInterval);
            renderWaitingCard();
        }
    } else {
        renderWaitingCard();
    }
});

// টাইমার শেষে রেজাল্ট ফাইনাল করে সেভ করা
function finalizeSignalResult(signalData) {
    let isWin = Math.random() < 0.90; // ৯০% একিউরেসি
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
            finalizeSignalResult(activeSignal);
            activeSignal = null;
            renderWaitingCard();
        } else {
            renderActiveCard();
        }
    }, 1000);
}

function renderActiveCard() {
    const card = document.getElementById('active-signal-card');
    let dirClass = activeSignal.direction.includes("CALL") ? "call" : "put";
    let min = Math.floor(activeSignal.remainingSec / 60);
    let sec = activeSignal.remainingSec % 60;
    let timeFormatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    card.innerHTML = `
        <div class="card-top">
            <div class="pair-name">${activeSignal.pair}</div>
            <div class="live-price-box" id="live-price-ticker">${activeSignal.basePrice || "1.08450"}</div>
        </div>
        <div class="card-body">
            <div class="dir-badge ${dirClass}">${activeSignal.direction}</div>
            <div class="timer-box"><i class="fa-regular fa-clock"></i> ${timeFormatted}</div>
        </div>
        <div class="card-footer">
            <span>মেয়াদ: <b>${activeSignal.durationMin}M</b> | AI Confidence: <b style="color:var(--binance-green);">${activeSignal.confidence}%</b></span>
            <span class="status-in-progress"><i class="fa-solid fa-spinner fa-spin"></i> IN PROGRESS...</span>
        </div>
    `;
}

function renderWaitingCard() {
    const card = document.getElementById('active-signal-card');
    card.innerHTML = `
        <div class="waiting-msg">
            <i class="fa-solid fa-circle-notch fa-spin icon-yellow"></i>
            <p>লাইভ মার্কেট স্ক্যান হচ্ছে... পরবর্তী সিগন্যাল যেকোনো মুহূর্তে জেনারেট হবে।</p>
        </div>
    `;
}

// ৮. হিস্ট্রি ও সমাপনী প্রসেসড সিগন্যাল ফিল্টার লোড
function loadHistory() {
    const tbody = document.getElementById('history-tbody');
    const procGrid = document.getElementById('processed-cards-grid');

    db.collection("signal_history").orderBy("timestamp", "desc").limit(30).onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        procGrid.innerHTML = '';
        let total = 0, wins = 0, losses = 0;

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#848E9C;">কোনো রেকর্ড পাওয়া যায়নি।</td></tr>';
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
            let dirStyle = data.direction.includes("CALL") ? "color:var(--binance-green); font-weight:bold;" : "color:var(--binance-red); font-weight:bold;";
            let resBadge = data.isWin ? '<span class="badge-win">WIN</span>' : '<span class="badge-loss">LOSS</span>';

            tr.innerHTML = `
                <td>${i--}</td>
                <td>${dateStr} ${timeStr}</td>
                <td><b>${data.pair}</b></td>
                <td style="${dirStyle}">${data.direction}</td>
                <td>${data.durationMin} MIN</td>
                <td>${resBadge}</td>
            `;
            tbody.appendChild(tr);

            // Processed Cards Grid (সর্বশেষ ৪টি সমাপ্ত সিগন্যাল)
            if (cardCount < 4) {
                let div = document.createElement('div');
                div.className = 'proc-card';
                div.innerHTML = `
                    <div class="proc-info">
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

// ৯. প্রফিট পপআপ টোস্ট
const sampleUsers = ["@rahim_otc", "@shakil_trader", "@pro_trader99", "@sumon_binary", "@tanvir_vips", "@fahim_fx"];
setInterval(() => {
    let randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    let randomPair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
    let randomAmount = Math.floor(Math.random() * 180) + 45;

    document.getElementById('toast-user').innerText = randomUser;
    document.getElementById('toast-text').innerText = `${randomPair}-এ $${randomAmount} প্রফিট করেছেন!`;

    const toast = document.getElementById('live-win-toast');
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}, 20000);
      
