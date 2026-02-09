// ตัวแปรเก็บสถานะ
let isDraggable = false;
let isLauncherDraggable = false;

function createNexusUI() {
    // 1. สร้างปุ่ม Launcher
    const launcher = document.createElement('div');
    launcher.id = 'nexus-launcher';
    launcher.className = 'nexus-launcher';
    launcher.innerHTML = '🌀';
    document.body.appendChild(launcher);

    // 2. สร้างหน้าต่างหลัก
    const window = document.createElement('div');
    window.id = 'nexus-window';
    window.className = 'nexus-window';
    window.innerHTML = `
        <div class="nexus-header" id="nexus-header">
            <div class="nexus-controls">
                <button id="lock-icon-btn" class="nexus-btn">Move 🌀</button>
                <button id="lock-win-btn" class="nexus-btn">Move Window</button>
                <span id="move-status" class="lock-warning">LOCKED</span>
            </div>
            <div class="nexus-title">NEXUS_SYSTEM</div>
            <div id="nexus-close" class="nexus-btn" style="color: #ff0055; border-color: #ff0055;">X</div>
        </div>
        
        <div class="nexus-body" id="nexus-content">
            <div id="page-lore" class="nexus-page active"><h3>Lorebook Tracker</h3><div class="data-area"></div></div>
            <div id="page-check" class="nexus-page"><h3>Message Inspector</h3><div class="data-area"></div></div>
            <div id="page-chat" class="nexus-page"><h3>AI Companion</h3><div class="data-area"></div></div>
            <div id="page-status" class="nexus-page"><h3>World Status</h3><div class="data-area"></div></div>
            <div id="page-help" class="nexus-page"><h3>System Help</h3><div class="data-area"></div></div>
        </div>

        <div class="nexus-footer">
            <div class="nav-tab active" onclick="switchPage('lore')">📜 Lore</div>
            <div class="nav-tab" onclick="switchPage('check')">🔍 Inspect</div>
            <div class="nav-tab" onclick="switchPage('chat')">💬 Chat</div>
            <div class="nav-tab" onclick="switchPage('status')">🌎 World</div>
            <div class="nav-tab" onclick="switchPage('help')">❓ Help</div>
        </div>
    `;
    document.body.appendChild(window);

    setupEventListeners();
}

// ระบบสลับหน้า
window.switchPage = function(pageId) {
    document.querySelectorAll('.nexus-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    event.currentTarget.classList.add('active');
};

function setupEventListeners() {
    const launcher = document.getElementById('nexus-launcher');
    const win = document.getElementById('nexus-window');
    const closeBtn = document.getElementById('nexus-close');
    const lockIconBtn = document.getElementById('lock-icon-btn');
    const lockWinBtn = document.getElementById('lock-win-btn');

    // เปิดหน้าต่าง
    launcher.addEventListener('click', () => {
        if (!isLauncherDraggable) {
            win.style.display = 'flex';
        }
    });

    // ปิดหน้าต่าง
    closeBtn.addEventListener('click', () => {
        win.style.display = 'none';
        // Reset ระบบเคลื่อนย้ายทันทีเมื่อปิด เพื่อความปลอดภัยตามกฎข้อ 2
        isDraggable = false;
        isLauncherDraggable = false;
        lockIconBtn.classList.remove('active');
        lockWinBtn.classList.remove('active');
        document.getElementById('move-status').innerText = 'LOCKED';
    });

    // ระบบยอมรับการเคลื่อนย้าย (กฎข้อ 1)
    lockIconBtn.addEventListener('click', () => {
        isLauncherDraggable = !isLauncherDraggable;
        lockIconBtn.classList.toggle('active');
        updateStatus();
    });

    lockWinBtn.addEventListener('click', () => {
        isDraggable = !isDraggable;
        lockWinBtn.classList.toggle('active');
        updateStatus();
    });
}

function updateStatus() {
    const status = document.getElementById('move-status');
    if (isDraggable || isLauncherDraggable) {
        status.innerText = 'UNLOCKED';
        status.style.color = '#00ff41';
    } else {
        status.innerText = 'LOCKED';
        status.style.color = '#ff0055';
    }
}

// เริ่มต้นระบบ
jQuery(document).ready(() => {
    createNexusUI();
});
