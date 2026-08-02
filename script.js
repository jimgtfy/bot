/* ==========================================================================
   SMART DYNAMIC ACTIVE USERS & NAVIGATION LOGIC
   ========================================================================== */

let soundEnabled = true;

// Tab Switcher Logic
function switchTab(tabName, element) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`section-${tabName}`).classList.add('active');
    element.classList.add('active');
}

function switchTabDirect(tabName) {
    const navBtn = document.getElementById(`btn-nav-${tabName}`);
    if (navBtn) switchTab(tabName, navBtn);
}

// Sound Toggle
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-toggle');
    const icon = document.getElementById('sound-icon');
    
    if (soundEnabled) {
        btn.classList.add('active');
        icon.className = 'fa-solid fa-volume-high';
    } else {
        btn.classList.remove('active');
        icon.className = 'fa-solid fa-volume-xmark';
    }
}

// Live Clock Updater
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true });
    const clockElem = document.getElementById('live-clock');
    if (clockElem) clockElem.innerText = timeStr;
}
setInterval(updateClock, 1000);

/* --- DYNAMIC ACTIVE USERS ALGORITHM --- */
let baseActiveUsers = 24; // Initial start (between 20 to 30)

function calculateDynamicUsers() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 1. Calculate Evening Spike Logic (Peak Time: 6:00 PM - 10:00 PM / 18:00 - 22:00)
    let timeMultiplier = 1.0;
    if (currentHour >= 18 && currentHour <= 22) {
        timeMultiplier = 1.8 + (Math.sin(currentHour) * 0.2); // Up to 80% spike in the evening
    } else if (currentHour >= 1 && currentHour <= 6) {
        timeMultiplier = 0.7; // Late night drop
    } else {
        timeMultiplier = 1.2; // Daytime normal flow
    }

    // 2. Daily Organic Growth Factor (Increases slightly as time goes)
    const startEpoch = new Date('2026-01-01').getTime();
    const daysPassed = Math.floor((now.getTime() - startEpoch) / (1000 * 60 * 60 * 24));
    const growthFactor = daysPassed * 0.5; // Subtle daily growth

    // Calculate Target Base
    let calculatedTarget = Math.floor((baseActiveUsers + growthFactor) * timeMultiplier);

    // 3. Micro Fluctuation (Simulate real traders joining/leaving)
    const microChange = Math.floor(Math.random() * 5) - 2; // -2 to +2 variation
    let finalUserCount = calculatedTarget + microChange;

    // Boundary Protection (Ensure minimum 20)
    if (finalUserCount < 20) finalUserCount = 20;

    // Update UI
    const userCountElem = document.getElementById('active-users-count');
    if (userCountElem) {
        userCountElem.innerText = finalUserCount;
    }
}

// Update Active Users every 4 seconds
setInterval(calculateDynamicUsers, 4000);
calculateDynamicUsers(); // Initial Call
           
