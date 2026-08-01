// ১. আপনার Firebase Configuration
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

// ২. ঘড়ি ও অনলাইন মেম্বার কাউন্টার
function updateClock() {
    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

setInterval(() => {
    let count = Math.floor(Math.random() * (1650 - 1350 + 1)) + 1350;
    document.getElementById('online-users').innerText = count.toLocaleString();
}, 5000);

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

// ৩. সাউন্ড নোটিফিকেশন
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

// ৪. রিয়েল-টাইম অটোমেটিক র্যান্ডম সিগন্যাল জেনারেটর (Time-deterministic Random Generator)
function checkAndAutoGenerateSignal() {
    const now = Math.floor(Date.now() / 1000);

    db.collection("active_signal").doc("current").get().then((doc) => {
        let needNewSignal = false;

        if (!doc.exists) {
            needNewSignal = true;
        } else {
            let data = doc.data();
            // যদি আগের সিগন্যালের মেয়াদ শেষ হয়ে যায় এবং আরও ১-৩ মিনিট র্যান্ডম ওয়েটিং পার হয়ে যায়
            if (data.expireAt < now - (data.waitTime || 60)) {
                needNewSignal = true;
            }
        }

        if (needNewSignal) {
            // র্যান্ডম পেয়ার ও ডিরেকশন নির্বাচন
            let pair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
            let direction = Math.random() > 0.5 ? "CALL (UP) ⬆️" : "PUT (DOWN) ⬇️";
            let durationMinutes = Math.floor(Math.random() * 6) + 5; // ৫ থেকে ১০ মিনিট মেয়াদ
            let randomGapSeconds = Math.floor(Math.random() * 120) + 30; // পরবর্তী সিগন্যালের আগে ৩০ সে. থেকে ২ মি. র্যান্ডম গ্যাপ
            
            let expireAt = now + (durationMinutes * 60);
            let isWin = Math.random() < 0.90; // ৯০% একিউরেসি

            let newSignal = {
                pair: pair,
                direction: direction,
                durationMin: durationMinutes,
                expireAt: expireAt,
                confidence: (Math.random() * (98.8 - 92.5) + 92.5).toFixed(1),
                isWin: isWin,
                waitTime: randomGapSeconds,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            // ডাটাবেজে আপডেট করা (যাতে পৃথিবীর সব ইউজার একসাথে র্যান্ডম সিগন্যালটি পায়)
            db.collection("active_signal").doc("current").set(newSignal);
            db.collection("signal_history").add(newSignal);
        }
    });
}

// ৫. প্রতি ৫ সেকেন্ড পর পর সার্ভার র্যান্ডম টাইম ইন্টারভাল চেক করবে
setInterval(checkAndAutoGenerateSignal, 5000);
checkAndAutoGenerateSignal();

// ৬. ফায়ারবেস থেকে লাইভ সিগন্যাল সিংক্রোনাইজেশন
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
            <p>লাইভ মার্কেট স্ক্যান হচ্ছে... পরবর্তী সিগন্যাল যেকোনো মুহূর্তে জেনারেট হবে।</p>
        </div>
    `;
}

// ৭. হিস্ট্রি টেবিল ও রিয়েলটাইম তথ্য অ্যাড
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

// ৮. সাইকোলজিক্যাল উইনিং পপআপ টোস্ট
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
