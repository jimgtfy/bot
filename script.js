// ১. আপনার স্ক্রিনশট থেকে নেয়া সঠিক Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjauNF6LfqnevzzgaxoI2LCM1H2Fk-rg",
  authDomain: "signal-bot-2.firebaseapp.com",
  projectId: "signal-bot-2",
  storageBucket: "signal-bot-2.firebasestorage.app",
  messagingSenderId: "742892417714",
  appId: "1:742892417714:web:aa8894ab18ad32672477ab",
  measurementId: "G-ZDBN6LN935"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ২. লাইভ ক্লক ও অ্যাক্টিভ ইউজার কাউন্টার
function updateClock() {
    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

setInterval(() => {
    let count = Math.floor(Math.random() * (1650 - 1350 + 1)) + 1350;
    document.getElementById('online-users').innerText = count.toLocaleString();
}, 5000);

// ৩. নির্ধারিত ৬টি OTC পেয়ার
const otcPairs = [
    "EUR/USD (OTC)", 
    "GBP/USD (OTC)", 
    "USD/JPY (OTC)", 
    "AUD/USD (OTC)", 
    "EUR/GBP (OTC)", 
    "USD/CHF (OTC)"
];

let activeSignal = null;
let countdownInterval = null;

// ৪. সাউন্ড নোটিফিকেশন (Beep Sound)
function playAlertSound() {
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch(e){}
}

// ৫. Firebase থেকে রিয়েল-টাইম সিগন্যাল লিসেনিং
db.collection("active_signal").doc("current").onSnapshot((doc) => {
    if (doc.exists) {
        let data = doc.data();
        let now = Math.floor(Date.now() / 1000);
        let remaining = data.expireAt - now;

        if (remaining > 0) {
            if (!activeSignal || activeSignal.expireAt !== data.expireAt) {
                playAlertSound();
            }
            activeSignal = { ...data, remainingSec: remaining };
            startCountdown();
        } else {
            activeSignal = null;
            clearInterval(countdownInterval);
            renderWaitingCard();
        }
    } else {
        renderWaitingCard();
    }
});

function startCountdown() {
    clearInterval(countdownInterval);
    renderActiveCard();
    
    countdownInterval = setInterval(() => {
        if (!activeSignal) return;
        activeSignal.remainingSec--;

        if (activeSignal.remainingSec <= 0) {
            clearInterval(countdownInterval);
            activeSignal = null;
            renderWaitingCard();
        } else {
            renderActiveCard();
        }
    }, 1000);
}

function renderActiveCard() {
    const card = document.getElementById('active-signal-card');
    card.classList.remove('empty');

    let dirClass = activeSignal.direction.includes("CALL") ? "call" : "put";
    let min = Math.floor(activeSignal.remainingSec / 60);
    let sec = activeSignal.remainingSec % 60;
    let timeFormatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    card.innerHTML = `
        <div class="signal-details">
            <div class="pair-title">${activeSignal.pair}</div>
            <div class="dir-badge ${dirClass}">${activeSignal.direction}</div>
            <div class="timer-box"><i class="fa-solid fa-stopwatch"></i> ${timeFormatted}</div>
        </div>
        <p style="margin-top:15px; color:#787b86; font-size:13px;">
            মেয়াদ: <b>${activeSignal.durationMin} Minutes</b> | AI Confidence: <b style="color:#00e676;">${activeSignal.confidence}%</b>
        </p>
    `;
}

function renderWaitingCard() {
    const card = document.getElementById('active-signal-card');
    card.classList.add('empty');
    card.innerHTML = `
        <div class="waiting-msg">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <p>লাইভ মার্কেট স্ক্যান হচ্ছে... গ্লোবাল সিগন্যাল জেনারেট হওয়া মাত্রই আপডেট হবে।</p>
        </div>
    `;
}

// ৬. অটোমেটিক সিগন্যাল জেনারেটর (Database Sync Engine)
setInterval(() => {
    db.collection("active_signal").doc("current").get().then((doc) => {
        let now = Math.floor(Date.now() / 1000);
        if (!doc.exists || (doc.data().expireAt < now - 15)) {
            generateAndSaveSignal();
        }
    });
}, 8000);

function generateAndSaveSignal() {
    let pair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
    let direction = Math.random() > 0.5 ? "CALL (UP) ⬆️" : "PUT (DOWN) ⬇️";
    let durationMinutes = Math.floor(Math.random() * 11) + 5; // ৫ থেকে ১৫ মিনিট
    let now = Math.floor(Date.now() / 1000);
    let expireAt = now + (durationMinutes * 60);
    let isWin = Math.random() < 0.90; // ৯০% একিউরেসি

    let newSignal = {
        pair: pair,
        direction: direction,
        durationMin: durationMinutes,
        expireAt: expireAt,
        confidence: (Math.random() * (98.8 - 92.5) + 92.5).toFixed(1),
        isWin: isWin,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("active_signal").doc("current").set(newSignal);
    db.collection("signal_history").add(newSignal);
}

// ৭. হিস্ট্রি টেবিল ও স্ট্যাটস ফিল্টারিং
function loadHistory() {
    const tbody = document.getElementById('history-tbody');

    db.collection("signal_history").orderBy("timestamp", "desc").limit(30).onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        let total = 0, wins = 0, losses = 0;

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#787b86;">কোনো রেকর্ড পাওয়া যায়নি।</td></tr>';
            return;
        }

        let i = snapshot.docs.length;
        snapshot.forEach((doc) => {
            let data = doc.data();
            total++;
            if (data.isWin) wins++; else losses++;

            let dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
            let timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let dateStr = dateObj.toLocaleDateString();

            let tr = document.createElement('tr');
            let dirStyle = data.direction.includes("CALL") ? "color:#00e676; font-weight:bold;" : "color:#ff3d00; font-weight:bold;";
            let resBadge = data.isWin ? '<span class="res-win">WIN</span>' : '<span class="res-loss">LOSS</span>';

            tr.innerHTML = `
                <td>${i--}</td>
                <td>${dateStr} ${timeStr}</td>
                <td><b>${data.pair}</b></td>
                <td style="${dirStyle}">${data.direction}</td>
                <td>${data.durationMin} MIN</td>
                <td>${resBadge}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('total-count').innerText = total;
        document.getElementById('win-count').innerText = wins;
        document.getElementById('loss-count').innerText = losses;
        let rate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
        document.getElementById('win-rate').innerText = rate + "%";
    });
}

loadHistory();

// ৮. সাইকোলজিক্যাল উইন নোটিফিকেশন টোস্ট
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
    }, 4500);
}, 22000);
        
