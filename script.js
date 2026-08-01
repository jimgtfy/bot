// ১. ঘড়ি আপডেট ফাংশন
function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// ২. ডাটা সেটআপ (৫০টি অটো সিগন্যাল জেনারেটর)
const assets = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)", "EUR/GBP (OTC)", "BTC/USD"];
const directions = ["CALL (UP) ⬆️", "PUT (DOWN) ⬇️"];

let signals = [];
let wins = 0;
let losses = 0;

function generateDailySignals() {
    const now = new Date();
    // আজকের সকাল ৯:০০ টা থেকে শুরু
    let startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

    for (let i = 1; i <= 50; i++) {
        // প্রতি সিগন্যালে ১০ মিনিট করে সময় বাড়বে
        let signalTime = new Date(startTime.getTime() + i * 10 * 60000);
        
        let asset = assets[Math.floor(Math.random() * assets.length)];
        let direction = directions[Math.floor(Math.random() * directions.length)];
        
        // রেজাল্ট সিমুলেশন: ৮০% সম্ভাবনা উইন হওয়ার
        let isWin = Math.random() < 0.8;
        let result = isWin ? "WIN" : "LOSS";

        signals.push({
            id: i,
            timeObj: signalTime,
            timeStr: signalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            asset: asset,
            direction: direction,
            timeframe: "1 MIN",
            result: result
        });
    }
}

// ৩. টেবিলে সিগন্যাল রেন্ডার ও রেজাল্ট প্রসেসিং
function renderTable() {
    const tbody = document.getElementById('signal-table-body');
    tbody.innerHTML = '';
    const now = new Date();

    wins = 0;
    losses = 0;

    signals.forEach(sig => {
        const tr = document.createElement('tr');
        
        let statusHTML = '';
        
        // সিগন্যালের সময় পার হয়ে গেছে কিনা যাচাই
        if (now >= sig.timeObj) {
            if (sig.result === "WIN") {
                wins++;
                statusHTML = `<span class="res-win"><i class="fa-solid fa-check"></i> WIN</span>`;
            } else {
                losses++;
                statusHTML = `<span class="res-loss"><i class="fa-solid fa-xmark"></i> LOSS</span>`;
            }
        } else {
            statusHTML = `<span class="res-pending"><i class="fa-solid fa-hourglass-half"></i> UPCOMING</span>`;
        }

        let dirClass = sig.direction.includes("CALL") ? "call" : "put";

        tr.innerHTML = `
            <td>${sig.id}</td>
            <td><strong>${sig.timeStr}</strong></td>
            <td>${sig.asset}</td>
            <td class="${dirClass}">${sig.direction}</td>
            <td>${sig.timeframe}</td>
            <td>${statusHTML}</td>
        `;

        tbody.appendChild(tr);
    });

    // সামারি আপডেট
    document.getElementById('win-count').innerText = wins;
    document.getElementById('loss-count').innerText = losses;
    
    let processed = wins + losses;
    let rate = processed > 0 ? ((wins / processed) * 100).toFixed(1) : 0;
    document.getElementById('win-rate').innerText = rate + "%";
}

// ৪. ইনিশিয়ালাইজেশন
generateDailySignals();
renderTable();

// প্রতি ৩০ সেকেন্ড পরপর ওয়েবসাইট অটো আপডেট হবে (লাইভ সিগন্যাল রেজাল্টের জন্য)
setInterval(renderTable, 30000);
