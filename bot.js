const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

// নিচের লাইনে আপনার ফায়ারবেসের রিয়েলটাইম ডাটাবেজের লিংকটি বসিয়ে দিন
initializeApp({
  databaseURL: "https://signal-bot-2-default-rtdb.firebaseio.com/"
});

const db = getDatabase();
const pairs = ["EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/CAD (OTC)", "USD/CHF (OTC)", "NZD/USD (OTC)"];
const CYCLE_TIME = 300; // ৫ মিনিট

function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

async function generateAndSaveSignal() {
    let now = Date.now();
    let currentSec = Math.floor(now / 1000);
    let cycleId = Math.floor(currentSec / CYCLE_TIME);

    let rndPair = seededRandom(cycleId * 10);
    let rndAct = seededRandom(cycleId * 20);
    let rndRes = seededRandom(cycleId * 30);

    let targetPair = pairs[Math.floor(rndPair * pairs.length)];
    let targetAction = rndAct > 0.45 ? "CALL ⬆️" : "PUT ⬇️";
    let isWin = rndRes > 0.12;
    let resultStr = isWin ? "WIN (M0)" : "LOSS";

    const signalData = {
        cycleId: cycleId,
        pair: targetPair,
        action: targetAction,
        startTime: cycleId * CYCLE_TIME,
        endTime: (cycleId + 1) * CYCLE_TIME,
        status: "active"
    };

    await db.ref("current_signal").set(signalData);
    await db.ref("history/" + cycleId).set({
        time: new Date(cycleId * CYCLE_TIME * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pair: targetPair,
        action: targetAction,
        result: resultStr
    });

    console.log(`Signal Generated: ${targetPair} - ${targetAction}`);
    process.exit(0);
}

generateAndSaveSignal();
