// index.js - PART A: UI Control & Draggable System

import { 
    extension_settings, 
    saveSettingsDebounced, 
    getContext, 
    eventSource, 
    event_types 
} from '../../../../script.js';

const MODULE_NAME = "FrostGlass_HUD";
const DEFAULT_SETTINGS = {
    posTrigger: { top: '20%', left: '10px' },
    posWindow: { top: '5vh', left: '4vw' },
    isLocked: true, // ล็อคการเคลื่อนย้ายไว้เป็นค่าเริ่มต้น
    currentTab: 'status',
    oocMessages: [],
    oocLockedChar: null,
    oocColors: {}
};

let settings = {};

// ฟังก์ชันสร้าง UI
async function createHUD() {
    const html = `
    <div id="frost-hud-trigger" class="sparkling">X</div>
    <div id="frost-hud-container">
        <div class="frost-header">
            <span style="letter-spacing: 2px; font-weight: bold; text-shadow: 0 0 8px var(--frost-accent);">FROST PROTOCOL</span>
            <div class="frost-controls">
                <button id="frost-lock-toggle" title="Unlock Movement" class="menu_button"><i class="fa-solid fa-lock"></i></button>
                <button id="frost-close" class="menu_button"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        
        <div class="frost-nav-book">
            <div class="nav-tab active" data-tab="status">🌍 Status</div>
            <div class="nav-tab" data-tab="lore">📖 Lore</div>
            <div class="nav-tab" data-tab="history">📜 History</div>
            <div class="nav-tab" data-tab="ooc">💬 OOC</div>
            <div class="nav-tab" data-tab="help">❓ Help</div>
        </div>

        <div class="frost-main-content">
            <div id="frost-view-content" style="padding:15px; height: 100%; overflow-y: auto;"></div>
        </div>
    </div>
    `;
    
    $('body').append(html);
    setupEventListeners();
    applyPositions();
}

function setupEventListeners() {
    // เปิด/ปิดหน้าต่าง
    $('#frost-hud-trigger').on('click', function() {
        if (!settings.isLocked) return; // ถ้ากำลังลากอยู่ ห้ามเปิด
        $('#frost-hud-container').fadeIn(400).css('display', 'flex');
        $(this).fadeOut(200);
    });

    $('#frost-close').on('click', function() {
        $('#frost-hud-container').fadeOut(200);
        $('#frost-hud-trigger').fadeIn(400);
        // Safety: ปิดหน้าต่างแล้วต้องล็อคตำแหน่งเสมอ
        settings.isLocked = true;
        updateLockUI();
    });

    // ระบบ Lock/Unlock การเคลื่อนย้าย
    $('#frost-lock-toggle').on('click', function() {
        settings.isLocked = !settings.isLocked;
        updateLockUI();
        saveSettingsDebounced();
    });

    // ระบบเปลี่ยน Tab
    $('.nav-tab').on('click', function() {
        const tab = $(this).data('tab');
        $('.nav-tab').removeClass('active');
        $(this).addClass('active');
        renderTab(tab);
    });
}

function updateLockUI() {
    const icon = settings.isLocked ? 'fa-lock' : 'fa-lock-open';
    $('#frost-lock-toggle i').attr('class', `fa-solid ${icon}`);
    if (!settings.isLocked) {
        toastr.info("Movement Unlocked: Drag X or Header to move.");
        $('#frost-hud-trigger, .frost-header').css('cursor', 'move');
    } else {
        $('#frost-hud-trigger, .frost-header').css('cursor', 'pointer');
    }
}

// ระบบลากที่รองรับมือถือ (Touch Events)
function makeDraggable(el, settingKey) {
    let startX, startY, initialX, initialY;

    el.addEventListener('touchstart', dragStart, {passive: false});
    
    function dragStart(e) {
        if (settings.isLocked) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialX = el.offsetLeft;
        initialY = el.offsetTop;
        
        document.addEventListener('touchmove', dragMove, {passive: false});
        document.addEventListener('touchend', dragEnd);
    }

    function dragMove(e) {
        e.preventDefault();
        let dx = e.touches[0].clientX - startX;
        let dy = e.touches[0].clientY - startY;
        el.style.left = (initialX + dx) + 'px';
        el.style.top = (initialY + dy) + 'px';
    }

    function dragEnd() {
        document.removeEventListener('touchmove', dragMove);
        settings[settingKey] = { top: el.style.top, left: el.style.left };
        saveSettingsDebounced();
    }
}
