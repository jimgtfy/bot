// ==========================================
// QUOTEX QUANT ROOM - 30/31 DAYS MASTER SCHEDULE
// ==========================================
// এখানে প্রতিটি দিনের (১ থেকে ৩১) জন্য ৭-১০টি করে নমুনা সিগন্যাল শিডিউল দেওয়া আছে।
// আপনি চাইলে এখানে আপনার পছন্দমতো সিগন্যাল সংখ্যা ও সময় বাড়িয়ে বা কমিয়ে নিতে পারেন।
// মাস শেষ হলে এটি স্বয়ংক্রিয়ভাবে আবার ১ তারিখ থেকে সাইকেল শুরু করবে।

const masterSignals = {
    1: [
        { time: "00:00", pair: "EUR/USD (OTC)", action: "CALL ⬆️", result: "WIN (M0)" },
        { time: "00:10", pair: "GBP/USD (OTC)", action: "PUT ⬇️", result: "LOSS" },
        { time: "00:20", pair: "USD/JPY (OTC)", action: "CALL ⬆️", result: "WIN (MTG)" }, // 1-Step Martingale Win
        { time: "00:35", pair: "AUD/CAD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" },
        { time: "01:00", pair: "USD/CHF (OTC)", action: "CALL ⬆️", result: "WIN (MTG)" },
        { time: "01:15", pair: "NZD/USD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" },
        { time: "02:00", pair: "EUR/GBP (OTC)", action: "CALL ⬆️", result: "LOSS" },
        { time: "02:30", pair: "AUD/NZD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" }
    ],
    2: [
        { time: "00:05", pair: "GBP/USD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" },
        { time: "00:15", pair: "EUR/USD (OTC)", action: "CALL ⬆️", result: "WIN (MTG)" },
        { time: "00:30", pair: "USD/CHF (OTC)", action: "PUT ⬇️", result: "LOSS" },
        { time: "01:00", pair: "NZD/USD (OTC)", action: "CALL ⬆️", result: "WIN (M0)" },
        { time: "01:20", pair: "USD/JPY (OTC)", action: "PUT ⬇️", result: "WIN (MTG)" },
        { time: "02:10", pair: "AUD/CAD (OTC)", action: "CALL ⬆️", result: "WIN (M0)" },
        { time: "02:45", pair: "EUR/GBP (OTC)", action: "PUT ⬇️", result: "LOSS" }
    ],
    3: [
        { time: "00:00", pair: "USD/JPY (OTC)", action: "CALL ⬆️", result: "WIN (M0)" },
        { time: "00:20", pair: "EUR/USD (OTC)", action: "PUT ⬇️", result: "WIN (MTG)" },
        { time: "00:40", pair: "GBP/USD (OTC)", action: "CALL ⬆️", result: "WIN (M0)" },
        { time: "01:10", pair: "AUD/CAD (OTC)", action: "PUT ⬇️", result: "LOSS" },
        { time: "01:50", pair: "USD/CHF (OTC)", action: "CALL ⬆️", result: "WIN (MTG)" },
        { time: "02:25", pair: "NZD/USD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" }
    ],
    4: [
        { time: "00:10", pair: "AUD/NZD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" },
        { time: "00:30", pair: "EUR/GBP (OTC)", action: "CALL ⬆️", result: "WIN (M0)" },
        { time: "01:00", pair: "USD/JPY (OTC)", action: "PUT ⬇️", result: "WIN (MTG)" },
        { time: "01:30", pair: "GBP/USD (OTC)", action: "CALL ⬆️", result: "LOSS" },
        { time: "02:00", pair: "EUR/USD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" }
    ],
    5: [
        { time: "00:00", pair: "NZD/USD (OTC)", action: "CALL ⬆️", result: "WIN (MTG)" },
        { time: "00:25", pair: "USD/CHF (OTC)", action: "PUT ⬇️", result: "WIN (M0)" },
        { time: "01:00", pair: "AUD/CAD (OTC)", action: "CALL ⬆️", result: "LOSS" },
        { time: "01:40", pair: "EUR/USD (OTC)", action: "PUT ⬇️", result: "WIN (M0)" },
        { time: "02:20", pair: "GBP/USD (OTC)", action: "CALL ⬆️", result: "WIN (MTG)" }
    ],
    // একইভাবে আপনি ৬ থেকে ৩১ দিনের শিডিউল নিচে যোগ করতে পারবেন বা ডেসক্রিপশন অনুযায়ী লজিক রান করতে পারবেন।
};

// বাকी দিনগুলোর (৬ থেকে ৩১) জন্য অটো-ফিল বা ফলব্যাক জেনারেটর (যাতে কোনো দিন মিস না হয়)
function getTodaySignals() {
    const now = new Date();
    let day = now.getDate(); // বর্তমান তারিখ (১ থেকে ৩১)
    
    // যদি নির্দিষ্ট দিনের ডেটা masterSignals-এ না থাকে, তবে দিন ১ এর ডেটা সাইকেল হিসেবে দেখাবে
    let signals = masterSignals[day] || masterSignals[1];
    
    // সময় অনুযায়ী ক্রমানুসারে সাজানো নিশ্চিত করা
    return signals.sort((a, b) => a.time.localeCompare(b.time));
         }
