// --- Project X: The Cold Luxury Extension ---
// Part 1.5: UI Update & Positioning
// ---------------------------------------------

import { extension_settings } from "../../../extensions.js";

// Global Variables
const EXTENSION_NAME = "Black_Blue_X";
const SETTINGS_KEY = "black_blue_x_settings";

// --- ปรับค่าเริ่มต้นตรงนี้ ---
let xSettings = {
    // ย้ายไปขวา (right) และขยับลงมาจากบน 150px
    btnPosition: { top: '150px', right: '20px', left: 'auto' }, 
    // หน้าต่างให้เริ่มต่ำลงมาหน่อย (จัดการใน CSS แล้ว แต่เก็บค่าไว้เผื่ออนาคต)
    modalPosition: { top: '55%', left: '50%' },
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
// 1. Initialization
// ------------------------------

async function loadSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        // ผสานค่าที่เก็บไว้ (เผื่ออัปเดตเวอร์ชันแล้ว key ไม่ครบ)
        const parsed = JSON.parse(stored);
        
        // *FIX: ถ้าของเก่าเป็น left แต่เราอยากเปลี่ยนเป็น right ให้ผู้ใช้ใหม่
        // แต่ถ้าผู้ใช้เคยย้ายเองแล้ว ให้เคารพการย้ายของผู้ใช้
        xSettings = { ...xSettings, ...parsed };
    }
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(xSettings));
}

function createInterface() {
    // ลบอันเก่าออกก่อนกันซ้ำ (กรณี reload script)
    $('#x_floating_btn').remove();
    $('#x_main_modal').remove();

    // 1.1 Create Floating Button (X)
    const btn = document.createElement('div');
    btn.id = 'x_floating_btn';
    btn.innerHTML = 'X'; // หรือจะใส่ไอคอน <i class="fa-solid fa-gem"></i> ก็ได้
    btn.title = 'Project X System';
    
    // Apply saved position
    btn.style.top = xSettings.btnPosition.top;
    if (xSettings.btnPosition.left && xSettings.btnPosition.left !== 'auto') {
        btn.style.left = xSettings.btnPosition.left;
        btn.style.right = 'auto';
    } else {
        btn.style.right = xSettings.btnPosition.right || '20px';
        btn.style.left = 'auto';
    }

    document.body.appendChild(btn);

    // 1.2 Create Main Modal
    const modal = document.createElement('div');
    modal.id = 'x_main_modal';
    
    // ใช้ตำแหน่งที่ตั้งไว้ (ถ้ามีการย้าย)
    // หมายเหตุ: CSS กำหนดค่า Default ไว้แล้ว แต่ JS จะ Override ถ้ามีการบันทึก
    
    // Header HTML
    const headerHtml = `
        <div class="x-modal-header">
            <div class="x-header-controls">
                <div id="x_btn_move_icon" class="x-icon-btn" title="Unlock Icon">
                    <i class="fa-solid fa-arrows-up-down-left-right"></i>
                </div>
                <div id="x_btn_move_window" class="x-icon-btn" title="Unlock Window">
                    <i class="fa-solid fa-expand"></i>
                </div>
            </div>
            <div class="x-close-btn" id="x_close_modal"><i class="fa-solid fa-times"></i></div>
        </div>
    `;

    // Content & Pages HTML
    let pagesHtml = '<div class="x-pages-container">';
    PAGES.forEach((page, index) => {
        pagesHtml += `
            <div id="x_page_${page.id}" class="x-page ${index === 0 ? 'active' : ''}">
                <h3>${page.title}</h3>
                <div class="x-page-content-placeholder">
                    <p style="color: var(--x-text-muted); font-size: 0.9em;">
                        Waiting for data stream... <br>
                        <span style="font-size: 0.8em; opacity: 0.5;">[System ID: ${page.id}]</span>
                    </p>
                </div>
            </div>
        `;
    });
    pagesHtml += '</div>';

    // Navigation HTML
    const navHtml = `
        <div class="x-page-nav">
            <button class="x-nav-arrow" id="x_prev_page"><i class="fa-solid fa-chevron-left"></i></button>
            <span class="x-page-indicator" id="x_page_title">${PAGES[0].title}</span>
            <button class="x-nav-arrow" id="x_next_page"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
    `;

    modal.innerHTML = headerHtml + pagesHtml + navHtml;
    document.body.appendChild(modal);

    bindEvents();
}

// ------------------------------
// 2. Event Listeners & Logic
// ------------------------------

function bindEvents() {
    const btn = document.getElementById('x_floating_btn');
    const modal = document.getElementById('x_main_modal');
    const closeBtn = document.getElementById('x_close_modal');

    // Toggle Modal
    btn.addEventListener('click', () => {
        if (isBtnMovable) return; 
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        if (isWindowMovable) toggleWindowMove(false);
    });

    // Move Toggles
    document.getElementById('x_btn_move_icon').addEventListener('click', () => toggleIconMove());
    document.getElementById('x_btn_move_window').addEventListener('click', () => toggleWindowMove());

    // Navigation
    document.getElementById('x_prev_page').addEventListener('click', () => changePage(-1));
    document.getElementById('x_next_page').addEventListener('click', () => changePage(1));

    // Draggable
    initDraggable(btn, 'icon');
    initDraggable(modal, 'window');
}

function changePage(direction) {
    document.getElementById(`x_page_${PAGES[currentPageIndex].id}`).classList.remove('active');
    currentPageIndex += direction;
    if (currentPageIndex < 0) currentPageIndex = PAGES.length - 1;
    if (currentPageIndex >= PAGES.length) currentPageIndex = 0;
    document.getElementById(`x_page_${PAGES[currentPageIndex].id}`).classList.add('active');
    document.getElementById('x_page_title').innerText = PAGES[currentPageIndex].title;
}

// ------------------------------
// 3. Movement Logic (Updated)
// ------------------------------

function toggleIconMove() {
    isBtnMovable = !isBtnMovable;
    const btn = document.getElementById('x_floating_btn');
    const iconBtn = document.getElementById('x_btn_move_icon');
    
    if (isBtnMovable) {
        iconBtn.classList.add('active');
        btn.classList.add('x-dragging');
        toastr.info("Icon Unlocked: Drag to move");
    } else {
        iconBtn.classList.remove('active');
        btn.classList.remove('x-dragging');
        
        // Save logic: Check if it's on left or right side of screen to determine anchor
        const rect = btn.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        
        if (rect.left > screenWidth / 2) {
            // Anchor to right
            xSettings.btnPosition = { 
                top: btn.style.top, 
                right: (screenWidth - rect.right) + 'px',
                left: 'auto'
            };
        } else {
            // Anchor to left
            xSettings.btnPosition = { 
                top: btn.style.top, 
                left: rect.left + 'px',
                right: 'auto'
            };
        }
        
        saveSettings();
        toastr.success("Icon Position Saved");
    }
}

function toggleWindowMove(forceState = null) {
    const btnMoveWin = document.getElementById('x_btn_move_window');
    const modal = document.getElementById('x_main_modal');
    isWindowMovable = forceState !== null ? forceState : !isWindowMovable;

    if (isWindowMovable) {
        btnMoveWin.classList.add('active');
        modal.style.borderColor = "var(--x-text-main)";
        modal.style.borderStyle = "dashed";
        toastr.info("Window Unlocked");
    } else {
        btnMoveWin.classList.remove('active');
        modal.style.borderColor = "var(--x-border-glass)";
        modal.style.borderStyle = "solid";
        toastr.success("Window Locked");
    }
}

function initDraggable(elm, type) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const getClientX = (e) => e.touches ? e.touches[0].clientX : e.clientX;
    const getClientY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

    const dragMouseDown = (e) => {
        if (type === 'icon' && !isBtnMovable) return;
        if (type === 'window' && !isWindowMovable) return;
        // e.preventDefault(); // Commented out to allow touch scrolling on content when not dragging
        // Only prevent default if we are actually dragging
        
        pos3 = getClientX(e);
        pos4 = getClientY(e);
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
    };

    const elementDrag = (e) => {
        e.preventDefault(); 
        pos1 = pos3 - getClientX(e);
        pos2 = pos4 - getClientY(e);
        pos3 = getClientX(e);
        pos4 = getClientY(e);

        elm.style.top = (elm.offsetTop - pos2) + "px";
        
        // Logic สำหรับลูกแก้ว (ใช้ right หรือ left)
        if (type === 'icon') {
             // ถ้าลาก ให้ใช้ left เป็นหลักชั่วคราวเพื่อให้ลากลื่น
             elm.style.left = (elm.offsetLeft - pos1) + "px";
             elm.style.right = 'auto'; 
        } else {
             elm.style.left = (elm.offsetLeft - pos1) + "px";
        }

        if (type === 'window') elm.style.transform = "translate(-50%, -50%)"; // Keep centered logic somewhat or reset it
        // *Correction for Window*: Since we use transform translate(-50%, -50%), 
        // dragging directly by top/left can be tricky.
        // For simplicity in this version, we assume user drags top-left corner offset effectively.
        // A robust implementation removes translate during drag.
        if (type === 'window') {
            elm.style.transform = "none"; 
        }
    };

    const closeDragElement = () => {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    };

    // Attach only to header for window (to allow text selection in body)
    if (type === 'window') {
        const header = elm.querySelector('.x-modal-header');
        if (header) {
            header.onmousedown = dragMouseDown;
            header.ontouchstart = dragMouseDown;
        }
    } else {
        elm.onmousedown = dragMouseDown;
        elm.ontouchstart = dragMouseDown;
    }
}

// ------------------------------
// 4. Boot
// ------------------------------

jQuery(async () => {
    await loadSettings();
    createInterface();
    // Re-inject Font Awesome if needed, but SillyTavern usually has it.
});

