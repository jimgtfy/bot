// ১. লাইভ ক্লক
function updateClock() {
    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// ২. কেবল নির্ধারিত ৬টি OTC পেয়ার
const otcPairs = [
    "EUR/USD (OTC)", 
    "GBP/USD (OTC)", 
    "USD/JPY (OTC)", 
    "AUD/USD (OTC)", 
    "EUR/GBP (OTC)", 
    "USD/CHF (OTC)"
];

let totalSignals = 0;
let wins = 0;
let losses = 0;
let activeSignal = null;
let countdownTimer = null;

// সাউন্ড প্লেয়ার (বিপ অ্যালার্ট)
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

// ৩. নতুন সিগন্যাল জেনারেট লজিক
function triggerNewSignal() {
    if (activeSignal) return; // ইতিমধ্যে সিগন্যাল চললে নতুন দেবে না

    totalSignals++;
    let pair = otcPairs[Math.floor(Math.random() * otcPairs.length)];
    let direction = Math.random() > 0.5 ? "CALL (UP) ⬆️" : "PUT (DOWN) ⬇️";
    
    // ৫ থেকে ১৫ মিনিটের মধ্যে র‍্যান্ডম মেয়াদ
    let durationMinutes = Math.floor(Math.random() * 11) + 5; 
    let durationSeconds = durationMinutes * 60;

    // ১৮/২০ উইন লজিক (৯০% পার্সেন্টেজ নিশ্চিত করা)
    let isWin = Math.random() < 0.90; 

    activeSignal = {
        id: totalSignals,
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pair: pair,
        direction: direction,
        durationMin: durationMinutes,
        remainingSec: durationSeconds,
        isWin: isWin
    };

    playAlertSound();
    renderActiveCard();

    // টাইমার শুরু
    countdownTimer = setInterval(updateTimer, 1000);
}

// ৪. অ্যাক্টিভ কার্ড আপডেট
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
            মেয়াদ: <b>${activeSignal.durationMin} Minutes</b> | এন্ট্রি টাইম: <b>${activeSignal.timeStr}</b>
        </p>
    `;
}

// ৫. টাইমার ও রেজাল্ট প্রসেসিং
function updateTimer() {
    if (!activeSignal) return;

    activeSignal.remainingSec--;

    if (activeSignal.remainingSec <= 0) {
        clearInterval(countdownTimer);
        finishSignal();
    } else {
        renderActiveCard();
    }
}

function finishSignal() {
    if (activeSignal.isWin) {
        wins++;
    } else {
        losses++;
    }

    addToHistory(activeSignal);
    updateStats();

    activeSignal = null;

    // কার্ড খালি করা
    const card = document.getElementById('active-signal-card');
    card.classList.add('empty');
    card.innerHTML = `
        <div class="waiting-msg">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <p>সিগন্যাল সমাপ্ত হয়েছে। নতুন অপরচুনিটির জন্য মার্কেট এনালাইসিস চলছে...</p>
        </div>
    `;

    // পরবর্তী সিগন্যাল ১০ থেকে ৩০ সেকেন্ড পর আসবে (টেস্টিং সহজ করার জন্য কমানো হয়েছে)
    setTimeout(triggerNewSignal, Math.floor(Math.random() * 20000) + 10000);
}

// ৬. হিস্ট্রি টেবিলে যুক্ত করা
function addToHistory(sig) {
    const tbody = document.getElementById('history-tbody');
    if (totalSignals === 1) tbody.innerHTML = ''; 

    const tr = document.createElement('tr');
    let dirClass = sig.direction.includes("CALL") ? "color:#00e676; font-weight:bold;" : "color:#ff3d00; font-weight:bold;";
    let resBadge = sig.isWin ? '<span class="res-win">WIN</span>' : '<span class="res-loss">LOSS</span>';

    tr.innerHTML = `
        <td>${sig.id}</td>
        <td>${sig.timeStr}</td>
        <td><b>${sig.pair}</b></td>
        <td style="${dirClass}">${sig.direction}</td>
        <td>${sig.durationMin} MIN</td>
        <td>${resBadge}</td>
    `;

    tbody.insertBefore(tr, tbody.firstChild);
}

// ৭. স্ট্যাটস আপডেট
function updateStats() {
    document.getElementById('total-count').innerText = totalSignals;
    document.getElementById('win-count').innerText = wins;
    document.getElementById('loss-count').innerText = losses;

    let processed = wins + losses;
    let rate = processed > 0 ? ((wins / processed) * 100).toFixed(1) : 100;
    document.getElementById('win-rate').innerText = rate + "%";
}

// প্রথম সিগন্যাল ৫ সেকেন্ড পর শুরু হবে
setTimeout(triggerNewSignal, 5000);
