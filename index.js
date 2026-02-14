// --- Sweet Heart HUD: Harmony Edition (Full Logic) ---
const STORAGE_KEY = "sweet_hud_harmony_settings";
// กำหนดหน้าและไอคอน (ใช้ Font Awesome ที่มีใน SillyTavern)
const PAGES = [
    { id: 'lore', title: 'Diary', icon: 'fa-book-open' },
    { id: 'inspect', title: 'Inspect', icon: 'fa-magnifying-glass' },
    { id: 'ooc', title: 'Chat', icon: 'fa-comments' },
    { id: 'world', title: 'World', icon: 'fa-globe' },
    { id: 'helper', title: 'Help', icon: 'fa-wand-magic-sparkles' }
];

let state = {
    btnPos: { top: '120px', left: 'auto', right: '20px' },
    winPos: { top: '15vh', left: '5vw' },
    currentPageId: PAGES[0].id, // ใช้ ID แทน Index เพื่อความแม่นยำ
    isOrbUnlocked: false,
    isWinUnlocked: false
};

jQuery(async () => {
    loadSettings();
    injectUI();
});

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
    // ตรวจสอบว่าหน้าที่บันทึกไว้ยังมีอยู่จริงไหม
    if (!PAGES.find(p => p.id === state.currentPageId)) {
        state.currentPageId = PAGES[0].id;
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function injectUI() {
    $('#x_floating_btn, #x_main_modal').remove();

    // 1. ลูกแก้ว (Sugar Core)
    const orb = $(`<div id="x_floating_btn"><div class="x-core-gem"></div></div>`);
    orb.css(state.btnPos);
    $('body').append(orb);

    // 2. หน้าต่างหลัก (Main Window)
    const modalHtml = `
    <div id="x_main_modal">
        <div class="x-header-top" id="x_drag_handle">
            <div class="x-title">❤ SWEET HUD</div>
            <div class="x-controls">
                <div id="x_sw_orb" class="x-switch-btn" title="Move Floating Button">
                    <div class="x-led"></div> Move Orb
                </div>
                <div id="x_sw_win" class="x-switch-btn" title="Move Window">
                    <div class="x-led"></div> Move Win
                </div>
                <div id="x_close" class="x-close-btn" title="Close"><i class="fa-solid fa-xmark"></i></div>
            </div>
        </div>

        <div class="x-tab-bar">
            ${PAGES.map(p => `
                <div class="x-tab-btn ${p.id === state.currentPageId ? 'active' : ''}" data-page-id="${p.id}">
                    <i class="fa-solid ${p.icon}" style="margin-right:4px; opacity:0.7;"></i> ${p.title}
                </div>
            `).join('')}
        </div>

        <div class="x-content-container">
            ${PAGES.map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.currentPageId ? 'active' : ''}">
                    <div class="x-content-placeholder">
                        <i class="fa-solid ${p.icon}"></i>
                        <div style="font-weight:500; color:var(--sweet-pink-dark); margin-bottom:5px;">${p.title} Content</div>
                        <div>Waiting for sweet data...</div>
                    </div>
                </div>
            `).join('')}
        </div>
        </div>`;
    
    $('body').append(modalHtml);
    $('#x_main_modal').css(state.winPos);

    setupEvents();
    updateSafetyUI();
}

function setupEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    // เปิด/ปิด หน้าต่าง
    orb.on('click', () => {
        if (state.isOrbUnlocked) return;
        modal.fadeToggle(250).css('display', 'flex');
    });

    $('#x_close').on('click', () => {
        if (state.isOrbUnlocked || state.isWinUnlocked) return;
        modal.fadeOut(250);
    });

    // สวิตช์ปลดล็อค
    $('#x_sw_orb').on('click', () => {
        state.isOrbUnlocked = !state.isOrbUnlocked;
        updateSafetyUI();
        saveSettings();
    });

    $('#x_sw_win').on('click', () => {
        state.isWinUnlocked = !state.isWinUnlocked;
        updateSafetyUI();
        saveSettings();
    });

    // **Logic การเปลี่ยนหน้าแบบใหม่ (ใช้ Tab)**
    $('.x-tab-btn').on('click', function() {
        const pageId = $(this).data('page-id');
        switchToPage(pageId);
    });

    // ระบบลากย้าย
    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'win', $('#x_drag_handle')[0]);
}

// ฟังก์ชันเปลี่ยนหน้า
function switchToPage(pageId) {
    state.currentPageId = pageId;
    
    // อัปเดต Tab
    $('.x-tab-btn').removeClass('active');
    $(`.x-tab-btn[data-page-id="${pageId}"]`).addClass('active');
    
    // อัปเดตเนื้อหา
    $('.x-page').removeClass('active');
    $(`#page_${pageId}`).addClass('active');
    
    saveSettings();
}

function updateSafetyUI() {
    const isLocked = state.isOrbUnlocked || state.isWinUnlocked;
    
    $('#x_sw_orb').toggleClass('active', state.isOrbUnlocked);
    $('#x_sw_win').toggleClass('active', state.isWinUnlocked);
    
    $('#x_floating_btn').toggleClass('x-dragging', state.isOrbUnlocked);
    $('#x_drag_handle').toggleClass('x-dragging-win', state.isWinUnlocked);

    // ปิดปุ่ม X เมื่ออยู่ในโหมดย้าย
    $('#x_close').toggleClass('disabled', isLocked);
}

function makeDraggable(el, type, handle) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const trigger = handle || el;

    const start = (e) => {
        if (type === 'orb' && !state.isOrbUnlocked) return;
        if (type === 'win' && !state.isWinUnlocked) return;
        
        const event = e.type === 'touchstart' ? e.touches[0] : e;
        p3 = event.clientX; p4 = event.clientY;
        document.onmousemove = move; document.ontouchmove = move;
        document.onmouseup = stop; document.ontouchend = stop;
    };

    const move = (e) => {
        const event = e.type === 'touchmove' ? e.touches[0] : e;
        if (e.cancelable) e.preventDefault();
        p1 = p3 - event.clientX; p2 = p4 - event.clientY;
        p3 = event.clientX; p4 = event.clientY;
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
        el.style.right = 'auto';
    };

    const stop = () => {
        document.onmousemove = null; document.ontouchmove = null;
        if (type === 'orb') state.btnPos = { top: el.style.top, left: el.style.left, right: 'auto' };
        else state.winPos = { top: el.style.top, left: el.style.left };
        saveSettings();
    };

    trigger.onmousedown = start;
    trigger.ontouchstart = start;
}
