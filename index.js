// --- Project X: Frost Protocol (Luxury Edition) ---
// Author: User & AI Assistant
// Version: 2.0 (Mobile Optimized)

import { extension_settings } from "../../../extensions.js";
// หมายเหตุ: SillyTavern extensions ทำงานใน global scope ของ jQuery เป็นหลัก

// --- Configuration & State ---
const SYSTEM_ID = "frost_protocol_hud";
const STORAGE_KEY = "frost_protocol_v2_data";

// Default Configuration (Mobile Optimized)
const DEFAULT_CONFIG = {
    // ตำแหน่งลูกแก้ว (ขวาบน แต่ต่ำลงมาหน่อยให้กดยง่าย)
    btnPos: { top: '120px', right: '10px', left: 'auto' },
    // ตำแหน่งหน้าต่าง (กลางๆ แต่ค่อนบน)
    winPos: { top: '15vh', left: '5vw' },
    lastPageIndex: 0,
    isMenuLocked: true, // เริ่มต้นล็อคไว้เสมอ
    isBtnLocked: true
};

let currentState = { ...DEFAULT_CONFIG };

// Pages Definition
const PAGES = [
    { id: 'lore', title: 'LOREBOOK TRACER', icon: 'fa-book-skull' },
    { id: 'inspect', title: 'CONTEXT INSPECT', icon: 'fa-glasses' },
    { id: 'ooc', title: 'OOC CHANNEL', icon: 'fa-comments' },
    { id: 'world', title: 'WORLD STATUS', icon: 'fa-globe-americas' },
    { id: 'helper', title: 'AI ASSISTANT', icon: 'fa-robot' }
];

// -----------------------------------
// 1. Initialization & Life Cycle
// -----------------------------------

jQuery(async () => {
    console.log(`${SYSTEM_ID} : Initializing Frost Protocol...`);
    loadState();
    injectInterface();
    // รอ Event Bus ของ SillyTavern (ถ้ามี) หรือ Hook เข้าไประบบ
    // eventSource.on(event_types.MESSAGE_RECEIVED, handleNewMessage); 
});

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const saved = JSON.parse(raw);
            currentState = { ...DEFAULT_CONFIG, ...saved };
        } catch (e) {
            console.error("Frost Protocol: State corrupted, resetting.");
        }
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
}

// -----------------------------------
// 2. UI Construction (HTML Injection)
// -----------------------------------

function injectInterface() {
    // ล้างของเก่าทิ้ง (Re-inject safe)
    $('#x_floating_btn').remove();
    $('#x_main_modal').remove();

    // 2.1 The Orb
    const btn = $(`<div id="x_floating_btn" title="Open Frost HUD">X</div>`);
    
    // Apply Position
    btn.css({
        top: currentState.btnPos.top,
        left: currentState.btnPos.left,
        right: currentState.btnPos.right
    });
    
    $('body').append(btn);

    // 2.2 The Main Window
    const modalHtml = `
    <div id="x_main_modal">
        <div class="x-header" id="x_header_drag_area">
            <div class="x-title-glitch">FROST PROTOCOL</div>
            <div class="x-controls">
                <div id="x_toggle_orb_move" class="x-btn-icon" title="Unlock Orb Movement">
                    <i class="fa-solid fa-arrows-alt"></i>
                </div>
                <div id="x_toggle_win_move" class="x-btn-icon" title="Unlock Window Movement">
                    <i class="fa-solid fa-expand-arrows-alt"></i>
                </div>
                <div id="x_close_modal" class="x-close"><i class="fa-solid fa-times"></i></div>
            </div>
        </div>

        <div class="x-content-wrapper" id="x_content_area">
            ${PAGES.map((p, idx) => `
                <div id="x_page_${p.id}" class="x-page ${idx === 0 ? 'active' : ''}">
                    <h3><i class="fa-solid ${p.icon}"></i> ${p.title}</h3>
                    <div class="x-data-block">
                        Status: <span style="color:var(--frost-accent-primary)">ONLINE</span><br>
                        <small>Waiting for synchronization...</small>
                    </div>
                    <div id="x_content_${p.id}"></div>
                </div>
            `).join('')}
        </div>

        <div class="x-nav-bar">
            <button class="x-nav-btn" id="x_prev_page"><i class="fa-solid fa-chevron-left"></i></button>
            <div class="x-nav-indicator">
                <span id="x_page_label" class="x-nav-title">${PAGES[0].title}</span>
                <div class="x-nav-dots">
                    ${PAGES.map((_, idx) => `<div class="x-dot ${idx===0?'active':''}" id="x_dot_${idx}"></div>`).join('')}
                </div>
            </div>
            <button class="x-nav-btn" id="x_next_page"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
    </div>
    `;

    $('body').append(modalHtml);
    
    // Apply Window Position
    const modal = $('#x_main_modal');
    modal.css({
        top: currentState.winPos.top,
        left: currentState.winPos.left
    });

    bindInteractions();
    renderPage(currentState.lastPageIndex);
}

// -----------------------------------
// 3. Logic & Interaction
// -----------------------------------

function bindInteractions() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');
    const header = $('#x_header_drag_area');

    // Toggle Open/Close
    orb.on('click', (e) => {
        // ถ้ากำลังขยับลูกแก้ว ห้ามเปิดหน้าต่าง
        if (!currentState.isBtnLocked) return;
        
        if (modal.is(':visible')) {
            modal.fadeOut(200);
        } else {
            modal.css('display', 'flex').hide().fadeIn(200);
        }
    });

    $('#x_close_modal').on('click', () => {
        modal.fadeOut(200);
        // Safety: Auto-lock window movement when closed
        if(!currentState.isMenuLocked) toggleWindowMove(true); 
    });

    // Navigation
    $('#x_prev_page').on('click', () => changePage(-1));
    $('#x_next_page').on('click', () => changePage(1));

    // Unlock Toggles
    $('#x_toggle_orb_move').on('click', () => toggleOrbMove());
    $('#x_toggle_win_move').on('click', () => toggleWindowMove());

    // Initialize Drag Logic
    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'window', header[0]);
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
    // Hide all
    $('.x-page').removeClass('active');
    $('.x-dot').removeClass('active');
    
    // Show target
    const targetId = PAGES[index].id;
    $(`#x_page_${targetId}`).addClass('active');
    $(`#x_dot_${index}`).addClass('active');
    
    // Update Label
    $('#x_page_label').text(PAGES[index].title);
    
    // Trigger specific logic for that page (To be implemented in Part 2)
    // if (targetId === 'lore') updateLoreView();
}

// -----------------------------------
// 4. Movement System (Robust)
// -----------------------------------

function toggleOrbMove() {
    currentState.isBtnLocked = !currentState.isBtnLocked;
    const btn = $('#x_toggle_orb_move');
    const orb = $('#x_floating_btn');

    if (!currentState.isBtnLocked) {
        // Unlock State
        btn.addClass('active');
        orb.addClass('x-dragging');
        orb.css('cursor', 'move');
        toastr.info("Orb Unlocked: Drag to move");
    } else {
        // Lock State
        btn.removeClass('active');
        orb.removeClass('x-dragging');
        orb.css('cursor', 'pointer');
        
        // Save Position
        const rect = orb[0].getBoundingClientRect();
        // คำนวณ Relative เพื่อรองรับการหมุนจอ
        currentState.btnPos = {
            top: rect.top + 'px',
            left: rect.left + 'px',
            right: 'auto'
        };
        saveState();
        toastr.success("Orb Position Saved");
    }
}

function toggleWindowMove(forceLock = false) {
    const btn = $('#x_toggle_win_move');
    const header = $('#x_header_drag_area');
    const modal = $('#x_main_modal');

    if (forceLock) currentState.isMenuLocked = false; // logic inversion preparation
    
    currentState.isMenuLocked = !currentState.isMenuLocked; // Toggle

    if (!currentState.isMenuLocked) {
        // Unlock
        btn.addClass('active');
        header.addClass('x-movable-active');
        modal.css('border-style', 'dashed');
        toastr.info("Window Unlocked: Drag via Header");
    } else {
        // Lock
        btn.removeClass('active');
        header.removeClass('x-movable-active');
        modal.css('border-style', 'solid');
        
        // Save Position
        const rect = modal[0].getBoundingClientRect();
        currentState.winPos = {
            top: rect.top + 'px',
            left: rect.left + 'px'
        };
        saveState();
        toastr.success("Window Position Locked");
    }
}

// Universal Drag Handler (Mouse & Touch)
function makeDraggable(element, type, handle = null) {
    const target = handle || element;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragStart = (e) => {
        // Check locks
        if (type === 'orb' && currentState.isBtnLocked) return;
        if (type === 'window' && currentState.isMenuLocked) return;

        e = e.type === 'touchstart' ? e.touches[0] : e;
        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = dragEnd;
        document.onmousemove = dragAction;
        document.ontouchend = dragEnd;
        document.ontouchmove = dragAction;
    };

    const dragAction = (e) => {
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        e.preventDefault(); // Prevent scrolling while dragging

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        element.style.right = 'auto'; // Clear right to avoid conflict
    };

    const dragEnd = () => {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    };

    target.onmousedown = dragStart;
    target.ontouchstart = dragStart;
}

