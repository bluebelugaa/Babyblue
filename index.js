// --- Project X: Wasteland Protocol ---
// Theme: Post-Apocalyptic / Industrial / Grey Scale
// Version: 4.0 (Secure Lock Edition)

import { extension_settings } from "../../../extensions.js";

const SYSTEM_ID = "frost_wasteland_hud";
const STORAGE_KEY = "frost_wasteland_data";

// --- Configuration ---
const PAGES = [
    { id: 'lore', title: 'ARCHIVE_01', icon: 'fa-book' },
    { id: 'inspect', title: 'SCAN_LOG', icon: 'fa-microchip' },
    { id: 'ooc', title: 'RADIO_CH', icon: 'fa-broadcast-tower' },
    { id: 'world', title: 'ENV_STATUS', icon: 'fa-globe-asia' },
    { id: 'helper', title: 'AI_LINK', icon: 'fa-terminal' }
];

const DEFAULT_CONFIG = {
    // ตำแหน่งเริ่มต้น (ขวาบน)
    btnPos: { top: '120px', left: 'auto', right: '10px' },
    winPos: { top: '15vh', left: '5vw' },
    lastPageIndex: 0,
    isOrbUnlocked: false,
    isWinUnlocked: false
};

let currentState = { ...DEFAULT_CONFIG };

// --- Init ---
jQuery(async () => {
    loadState();
    injectInterface();
});

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try { currentState = { ...DEFAULT_CONFIG, ...JSON.parse(raw) }; } 
        catch (e) { console.error("Data corrupted. Resetting protocol."); }
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
}

// --- UI Injection ---
function injectInterface() {
    $('#x_floating_btn').remove();
    $('#x_main_modal').remove();

    // 1. The Artifact (Orb)
    const btn = $(`
        <div id="x_floating_btn" title="Access Terminal">
            <div class="x-core"></div>
        </div>
    `);
    
    btn.css({
        top: currentState.btnPos.top,
        left: currentState.btnPos.left,
        right: currentState.btnPos.right
    });
    $('body').append(btn);

    // 2. Main Terminal
    const modalHtml = `
    <div id="x_main_modal">
        <div class="x-header" id="x_header_drag_area">
            <div class="x-title-block">
                <div class="x-status-light online"></div>
                <span class="x-title-text">SYS_V.4.0</span>
            </div>
            
            <div class="x-controls">
                <div id="x_toggle_orb_move" class="x-btn-tactical ${currentState.isOrbUnlocked ? 'active' : ''}">
                    <i class="fa-solid fa-arrows-alt"></i> ORB
                </div>

                <div id="x_toggle_win_move" class="x-btn-tactical ${currentState.isWinUnlocked ? 'active' : ''}">
                    <i class="fa-solid fa-expand-arrows-alt"></i> WIN
                </div>

                <div id="x_close_modal" class="x-btn-tactical x-close-tactical" title="Terminate Session">
                    <i class="fa-solid fa-times"></i>
                </div>
            </div>
        </div>

        <div class="x-content-wrapper">
            ${PAGES.map((p, idx) => `
                <div id="x_page_${p.id}" class="x-page ${idx === 0 ? 'active' : ''}">
                    <div class="x-section-header">
                        // ${p.title}
                    </div>
                    <div id="x_content_inner_${p.id}" style="font-size:12px; color:#888;">
                        Connecting to database... <br>
                        Subject: [UNKNOWN]
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="x-nav-bar">
            <button class="x-nav-btn" id="x_prev_page"><i class="fa-solid fa-chevron-left"></i></button>
            <div class="x-nav-info">
                <span id="x_page_label">${PAGES[currentState.lastPageIndex].title}</span>
            </div>
            <button class="x-nav-btn" id="x_next_page"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
    </div>
    `;

    $('body').append(modalHtml);
    
    const modal = $('#x_main_modal');
    modal.css({ top: currentState.winPos.top, left: currentState.winPos.left });

    bindInteractions();
    renderPage(currentState.lastPageIndex);
    updateSafetyLockVisuals(); // เช็คสถานะปุ่มปิดตั้งแต่เริ่ม
}

// --- Interactions ---
function bindInteractions() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    // Orb Click
    orb.on('click', () => {
        if (currentState.isOrbUnlocked) return; // ห้ามเปิดถ้ากำลังย้าย
        if (modal.is(':visible')) {
            // เช็คความปลอดภัยก่อนปิด
            if (!canCloseWindow()) return;
            modal.fadeOut(100);
        } else {
            modal.css('display', 'flex').hide().fadeIn(100);
        }
    });

    // Close Button Click (Safety Check)
    $('#x_close_modal').on('click', () => {
        if (!canCloseWindow()) {
            // แจ้งเตือน (ใช้ Toastr ถ้ามี หรือ Alert ง่ายๆ)
            if (typeof toastr !== 'undefined') {
                toastr.error("Protocol Warning: Lock movement before terminating.");
            } else {
                alert("ENGAGE LOCKS FIRST");
            }
            return;
        }
        modal.fadeOut(100);
    });

    // Toggles
    $('#x_toggle_orb_move').on('click', () => {
        currentState.isOrbUnlocked = !currentState.isOrbUnlocked;
        saveState();
        updateSafetyLockVisuals();
    });

    $('#x_toggle_win_move').on('click', () => {
        currentState.isWinUnlocked = !currentState.isWinUnlocked;
        saveState();
        updateSafetyLockVisuals();
    });

    // Nav
    $('#x_prev_page').on('click', () => changePage(-1));
    $('#x_next_page').on('click', () => changePage(1));

    // Draggable
    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'window', $('#x_header_drag_area')[0]);
}

// --- Safety & Visual Logic ---

// ฟังก์ชันเช็คว่าอนุญาตให้ปิดหน้าต่างไหม
function canCloseWindow() {
    // ถ้าอันใดอันหนึ่ง Unlocked อยู่ (Move Mode) = ห้ามปิด
    if (currentState.isOrbUnlocked || currentState.isWinUnlocked) {
        return false;
    }
    return true;
}

// อัปเดตสีปุ่มตามสถานะ
function updateSafetyLockVisuals() {
    const orbBtn = $('#x_toggle_orb_move');
    const winBtn = $('#x_toggle_win_move');
    const closeBtn = $('#x_close_modal');
    const orb = $('#x_floating_btn');
    const header = $('#x_header_drag_area');

    // 1. Orb State
    if (currentState.isOrbUnlocked) {
        orbBtn.addClass('active');
        orb.addClass('x-dragging');
        orb.css('cursor', 'move');
    } else {
        orbBtn.removeClass('active');
        orb.removeClass('x-dragging');
        orb.css('cursor', 'pointer');
    }

    // 2. Window State
    if (currentState.isWinUnlocked) {
        winBtn.addClass('active');
        header.css('cursor', 'move');
        header.css('border-bottom', '1px dashed var(--waste-cyan)');
    } else {
        winBtn.removeClass('active');
        header.css('cursor', 'default');
        header.css('border-bottom', '1px solid var(--waste-gray-mid)');
    }

    // 3. Close Button State (Disable if Unlocked)
    if (!canCloseWindow()) {
        closeBtn.addClass('disabled'); // เปลี่ยนสีให้รู้ว่ากดไม่ได้
    } else {
        closeBtn.removeClass('disabled');
    }
}

function changePage(dir) {
    const total = PAGES.length;
    let newIndex = currentState.lastPageIndex + dir;
    if (newIndex < 0) newIndex = total - 1;
    if (newIndex >= total) newIndex = 0;
    currentState.lastPageIndex = newIndex;
    renderPage(newIndex);
    saveState();
}

function renderPage(index) {
    $('.x-page').removeClass('active');
    $(`#x_page_${PAGES[index].id}`).addClass('active');
    $('#x_page_label').text(PAGES[index].title);
}

// --- Drag Logic ---
function makeDraggable(element, type, handle = null) {
    const target = handle || element;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragStart = (e) => {
        if (type === 'orb' && !currentState.isOrbUnlocked) return;
        if (type === 'window' && !currentState.isWinUnlocked) return;

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        pos3 = clientX; pos4 = clientY;

        document.onmouseup = dragEnd; document.onmousemove = dragAction;
        document.ontouchend = dragEnd; document.ontouchmove = dragAction;
    };

    const dragAction = (e) => {
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        if (e.cancelable) e.preventDefault();

        pos1 = pos3 - clientX; pos2 = pos4 - clientY;
        pos3 = clientX; pos4 = clientY;

        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        element.style.right = 'auto';
    };

    const dragEnd = () => {
        document.onmouseup = null; document.onmousemove = null;
        document.ontouchend = null; document.ontouchmove = null;
        
        if (type === 'orb') {
            currentState.btnPos = { top: element.style.top, left: element.style.left, right: 'auto' };
        } else {
            currentState.winPos = { top: element.style.top, left: element.style.left };
        }
        saveState();
    };

    target.onmousedown = dragStart; target.ontouchstart = dragStart;
}
