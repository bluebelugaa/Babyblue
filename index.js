// --- Project X: The Cold Luxury Extension ---
// Part 1: Core System, UI, and Interaction Logic
// ---------------------------------------------

import { extension_settings } from "../../../extensions.js";

// Global Variables
const EXTENSION_NAME = "Black_Blue_X";
const SETTINGS_KEY = "black_blue_x_settings";

// Default Settings
let xSettings = {
    btnPosition: { top: '100px', left: '20px' },
    modalPosition: { top: '50%', left: '50%' },
    currentPage: 0
};

// State Flags
let isBtnMovable = false;
let isWindowMovable = false;
let currentPageIndex = 0;

// Page Definitions
const PAGES = [
    { id: 'lorebook', title: 'Lorebook Analysis' },
    { id: 'context', title: 'Context Inspector' },
    { id: 'chat_ooc', title: 'OOC Chat Room' },
    { id: 'status', title: 'World & Status' },
    { id: 'helper', title: 'User Helper' }
];

// ------------------------------
// 1. Initialization & HTML Generation
// ------------------------------

async function loadSettings() {
    // โหลดตำแหน่งเดิมถ้ามี
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        xSettings = JSON.parse(stored);
    }
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(xSettings));
}

function createInterface() {
    // 1.1 Create Floating Button (X)
    const btn = document.createElement('div');
    btn.id = 'x_floating_btn';
    btn.innerHTML = 'X';
    btn.title = 'Project X System';
    btn.style.top = xSettings.btnPosition.top;
    btn.style.left = xSettings.btnPosition.left;
    document.body.appendChild(btn);

    // 1.2 Create Main Modal
    const modal = document.createElement('div');
    modal.id = 'x_main_modal';
    
    // Header HTML
    const headerHtml = `
        <div class="x-modal-header">
            <div class="x-header-controls">
                <button id="x_btn_move_icon" class="x-icon-btn" title="Unlock Icon Movement">
                    <i class="fa-solid fa-arrows-up-down-left-right"></i> Icon
                </button>
                <button id="x_btn_move_window" class="x-icon-btn" title="Unlock Window Movement">
                    <i class="fa-solid fa-expand"></i> Win
                </button>
            </div>
            <div class="x-close-btn" id="x_close_modal">X</div>
        </div>
    `;

    // Content & Pages HTML
    let pagesHtml = '<div class="x-pages-container">';
    PAGES.forEach((page, index) => {
        pagesHtml += `
            <div id="x_page_${page.id}" class="x-page ${index === 0 ? 'active' : ''}">
                <h3>${page.title}</h3>
                <hr style="border-color: var(--x-border-color); opacity: 0.5;">
                <div class="x-page-content-placeholder">
                    <p style="color: #666; font-style: italic;">System Standby...</p>
                </div>
            </div>
        `;
    });
    pagesHtml += '</div>';

    // Navigation HTML
    const navHtml = `
        <div class="x-page-nav">
            <button class="x-nav-arrow" id="x_prev_page">❮</button>
            <span class="x-page-indicator" id="x_page_title">${PAGES[0].title}</span>
            <button class="x-nav-arrow" id="x_next_page">❯</button>
        </div>
    `;

    modal.innerHTML = headerHtml + pagesHtml + navHtml;
    document.body.appendChild(modal);

    // Bind Events
    bindEvents();
}

// ------------------------------
// 2. Event Listeners & Logic
// ------------------------------

function bindEvents() {
    const btn = document.getElementById('x_floating_btn');
    const modal = document.getElementById('x_main_modal');
    const closeBtn = document.getElementById('x_close_modal');

    // Toggle Modal Open/Close
    btn.addEventListener('click', (e) => {
        // ถ้ากำลังอยู่ในโหมดเคลื่อนย้ายปุ่ม ห้ามเปิดหน้าต่าง
        if (isBtnMovable) return; 

        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        // Safety: ปิดโหมดเคลื่อนย้ายหน้าต่างทันทีที่ปิดหน้าต่าง เพื่อกันลืม
        if (isWindowMovable) toggleWindowMove(false);
    });

    // Toggle Move Logic
    document.getElementById('x_btn_move_icon').addEventListener('click', () => toggleIconMove());
    document.getElementById('x_btn_move_window').addEventListener('click', () => toggleWindowMove());

    // Navigation Logic
    document.getElementById('x_prev_page').addEventListener('click', () => changePage(-1));
    document.getElementById('x_next_page').addEventListener('click', () => changePage(1));

    // Initialize Drag Logic
    initDraggable(btn, 'icon');
    initDraggable(modal, 'window');
}

// ------------------------------
// 3. Page Navigation System
// ------------------------------

function changePage(direction) {
    // Hide current
    document.getElementById(`x_page_${PAGES[currentPageIndex].id}`).classList.remove('active');
    
    // Update Index
    currentPageIndex += direction;
    
    // Loop logic (วนกลับถ้าสุด)
    if (currentPageIndex < 0) currentPageIndex = PAGES.length - 1;
    if (currentPageIndex >= PAGES.length) currentPageIndex = 0;

    // Show new
    document.getElementById(`x_page_${PAGES[currentPageIndex].id}`).classList.add('active');
    
    // Update Title
    document.getElementById('x_page_title').innerText = PAGES[currentPageIndex].title;
}

// ------------------------------
// 4. Movement System (Mobile Optimized)
// ------------------------------

function toggleIconMove() {
    const btnMoveIcon = document.getElementById('x_btn_move_icon');
    isBtnMovable = !isBtnMovable;
    
    if (isBtnMovable) {
        btnMoveIcon.classList.add('active');
        document.getElementById('x_floating_btn').classList.add('x-dragging');
        toastr.info("Icon Movement: UNLOCKED");
    } else {
        btnMoveIcon.classList.remove('active');
        document.getElementById('x_floating_btn').classList.remove('x-dragging');
        // Save Position
        const btn = document.getElementById('x_floating_btn');
        xSettings.btnPosition = { top: btn.style.top, left: btn.style.left };
        saveSettings();
        toastr.success("Icon Position Saved");
    }
}

function toggleWindowMove(forceState = null) {
    const btnMoveWin = document.getElementById('x_btn_move_window');
    const modal = document.getElementById('x_main_modal');
    
    // ถ้า forceState ถูกส่งมา ให้ใช้ค่านั้นเลย (ใช้สำหรับ Safety auto-close)
    isWindowMovable = forceState !== null ? forceState : !isWindowMovable;

    if (isWindowMovable) {
        btnMoveWin.classList.add('active');
        modal.style.border = "2px dashed var(--x-theme-pale-blue)";
        toastr.info("Window Movement: UNLOCKED");
    } else {
        btnMoveWin.classList.remove('active');
        modal.style.border = "1px solid var(--x-theme-pale-blue)";
        // Note: Window position saving is complex due to transforms, simpler to rely on current session
        toastr.success("Window Locked");
    }
}

/**
 * ฟังก์ชันทำให้ Element ลากได้ รองรับทั้ง Mouse และ Touch
 * @param {HTMLElement} elm Element ที่จะให้ลาก
 * @param {string} type 'icon' หรือ 'window' เพื่อเช็ค Permission
 */
function initDraggable(elm, type) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Helper for Touch/Mouse coordinates
    const getClientX = (e) => e.touches ? e.touches[0].clientX : e.clientX;
    const getClientY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

    const dragMouseDown = (e) => {
        // เช็คเงื่อนไข: ต้องเปิดโหมดให้ย้ายได้เท่านั้น
        if (type === 'icon' && !isBtnMovable) return;
        if (type === 'window' && !isWindowMovable) return;

        e.preventDefault();
        // Get initial cursor position
        pos3 = getClientX(e);
        pos4 = getClientY(e);
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        // Mobile Events
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
    };

    const elementDrag = (e) => {
        e.preventDefault();
        // Calculate new cursor position
        pos1 = pos3 - getClientX(e);
        pos2 = pos4 - getClientY(e);
        pos3 = getClientX(e);
        pos4 = getClientY(e);

        // Set element's new position
        elm.style.top = (elm.offsetTop - pos2) + "px";
        elm.style.left = (elm.offsetLeft - pos1) + "px";
        
        // ถ้าเป็น Window ต้องเคลียร์ Transform เพื่อไม่ให้ตำแหน่งเพี้ยน
        if (type === 'window') {
            elm.style.transform = "none"; 
        }
    };

    const closeDragElement = () => {
        // Stop moving
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    };

    // Attach Start Event
    elm.onmousedown = dragMouseDown;
    elm.ontouchstart = dragMouseDown;
}


// ------------------------------
// 5. Loading Logic
// ------------------------------

jQuery(async () => {
    await loadSettings();
    createInterface();
    console.log(`${EXTENSION_NAME} Loaded.`);
});

