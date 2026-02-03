// --- Project X: Frost Protocol HUD (Full Logic Core) ---
// Version: 3.0.0 (Luxury Mobile Edition)
// Author: User & Frost_AI

import { extension_settings } from "../../../extensions.js";
// Note: SillyTavern uses jQuery globally.

// =============================================================================
// 1. CONFIGURATION & STATE MANAGEMENT
// =============================================================================

const SYSTEM_ID = "frost_protocol_hud";
const STORAGE_KEY = "frost_hud_v3_data";

// ค่าเริ่มต้น (Default Config)
const DEFAULT_CONFIG = {
    // ตำแหน่งลูกแก้ว (ขวาบน ระยะปลอดภัยสำหรับมือถือ)
    btnPos: { top: '120px', right: '15px', left: 'auto' },
    // ตำแหน่งหน้าต่าง (กลางจอค่อนบน)
    winPos: { top: '15vh', left: '5vw' },
    // หน้าที่เปิดล่าสุด
    lastPageIndex: 0,
    // สถานะล็อค (เริ่มมาต้องล็อคเสมอเพื่อความปลอดภัย)
    isOrbLocked: true, 
    isWinLocked: true,
    // ข้อมูล OOC Chat (จำลอง)
    oocHistory: [] 
};

let currentState = { ...DEFAULT_CONFIG };

// นิยามหน้าต่างระบบทั้ง 5
const PAGES = [
    { id: 'lore', title: 'LOREBOOK TRACER', icon: 'fa-book-dead' },
    { id: 'inspect', title: 'CONTEXT INSPECT', icon: 'fa-search-location' },
    { id: 'ooc', title: 'OOC CHANNEL', icon: 'fa-comments' },
    { id: 'world', title: 'WORLD STATUS', icon: 'fa-globe' },
    { id: 'helper', title: 'AI ASSISTANT', icon: 'fa-hands-helping' }
];

// =============================================================================
// 2. INITIALIZATION (BOOT)
// =============================================================================

jQuery(async () => {
    console.log(`[${SYSTEM_ID}] Booting Frost Protocol...`);
    loadState();
    injectInterface();
    startSystemLoop(); // เริ่มการทำงาน background (เช่น เช็ค Lorebook)
});

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const saved = JSON.parse(raw);
            currentState = { ...DEFAULT_CONFIG, ...saved };
        } catch (e) {
            console.error("Frost Protocol: Save data corrupted, resetting.");
        }
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
}

// =============================================================================
// 3. UI INJECTION (HTML STRUCTURE)
// =============================================================================

function injectInterface() {
    // 3.1 Cleanup Old Elements (เพื่อความชัวร์เวลา Reload)
    $('#x_floating_btn').remove();
    $('#x_main_modal').remove();

    // 3.2 Create The Frost Core Orb (ลูกแก้วดีไซน์ใหม่)
    const btn = $(`
        <div id="x_floating_btn" title="Frost Protocol">
            <div class="x-core"></div>
        </div>
    `);
    
    // Set Saved Position
    btn.css({
        top: currentState.btnPos.top,
        left: currentState.btnPos.left,
        right: currentState.btnPos.right
    });
    
    $('body').append(btn);

    // 3.3 Create Main Window (ดีไซน์ใหม่)
    const modalHtml = `
    <div id="x_main_modal">
        <div class="x-header" id="x_header_drag_area">
            <div class="x-title-glitch">FROST // HUD</div>
            <div class="x-controls">
                
                <div id="x_toggle_orb_move" class="x-switch-btn ${!currentState.isOrbLocked ? 'active' : ''}" title="Unlock Orb Position">
                    <div class="x-led"></div> ORB
                </div>

                <div id="x_toggle_win_move" class="x-switch-btn ${!currentState.isWinLocked ? 'active' : ''}" title="Unlock Window Position">
                    <div class="x-led"></div> WIN
                </div>

                <div id="x_close_modal" class="x-close-btn">
                    <i class="fa-solid fa-times"></i>
                </div>
            </div>
        </div>

        <div class="x-content-wrapper" id="x_content_area">
            ${PAGES.map((p, idx) => `
                <div id="x_page_${p.id}" class="x-page ${idx === 0 ? 'active' : ''}">
                    <div class="x-page-header">
                        <i class="fa-solid ${p.icon}"></i> SYSTEM :: ${p.title}
                    </div>
                    <div id="x_content_inner_${p.id}" class="x-scroll-area">
                        <div class="x-loading">Initializing Module...</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="x-nav-bar">
            <button class="x-nav-btn" id="x_prev_page"><i class="fa-solid fa-chevron-left"></i></button>
            <div class="x-nav-info">
                <span id="x_page_label">${PAGES[0].title}</span>
            </div>
            <button class="x-nav-btn" id="x_next_page"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
    </div>
    `;

    $('body').append(modalHtml);
    
    // Set Saved Window Position
    const modal = $('#x_main_modal');
    modal.css({
        top: currentState.winPos.top,
        left: currentState.winPos.left
    });

    // เริ่มระบบควบคุม (Events)
    bindInteractions();
    
    // โหลดหน้าล่าสุดที่เปิดค้างไว้
    renderPage(currentState.lastPageIndex);
}

// =============================================================================
// 4. INTERACTION & LOGIC (ควบคุมการทำงาน)
// =============================================================================

function bindInteractions() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    // 4.1 Orb Click (Open/Close)
    orb.on('click', (e) => {
        // ถ้ากำลังลาก (Drag) ห้ามเปิดหน้าต่าง
        if (orb.hasClass('is-dragging-flag')) return; 

        if (modal.is(':visible')) {
            modal.fadeOut(150);
        } else {
            modal.css('display', 'flex').hide().fadeIn(150);
            refreshCurrentPageData(); // อัพเดตข้อมูลทันทีที่เปิด
        }
    });

    // 4.2 Close Button
    $('#x_close_modal').on('click', () => {
        modal.fadeOut(150);
        // Auto-lock window when closed (Safety)
        if(!currentState.isWinLocked) toggleWindowLock(true);
    });

    // 4.3 Navigation Buttons
    $('#x_prev_page').on('click', () => changePage(-1));
    $('#x_next_page').on('click', () => changePage(1));

    // 4.4 Toggle Switches (Cyber Switches)
    $('#x_toggle_orb_move').on('click', () => toggleOrbLock());
    $('#x_toggle_win_move').on('click', () => toggleWindowLock());

    // 4.5 Initialize Draggable Systems
    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'window', $('#x_header_drag_area')[0]);
}

// เปลี่ยนหน้า Tab
function changePage(dir) {
    const total = PAGES.length;
    let newIndex = currentState.lastPageIndex + dir;
    
    if (newIndex < 0) newIndex = total - 1;
    if (newIndex >= total) newIndex = 0;

    currentState.lastPageIndex = newIndex;
    renderPage(newIndex);
    saveState();
}

// แสดงผลหน้า
function renderPage(index) {
    $('.x-page').removeClass('active');
    
    const pageConfig = PAGES[index];
    $(`#x_page_${pageConfig.id}`).addClass('active');
    
    $('#x_page_label').text(pageConfig.title);
    
    // เรียกฟังก์ชันอัพเดตข้อมูลเฉพาะหน้านั้นๆ
    refreshCurrentPageData();
}

// =============================================================================
// 5. DRAG & DROP SYSTEM (Mobile Optimized)
// =============================================================================

function makeDraggable(element, type, handle = null) {
    const target = handle || element;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;

    const dragStart = (e) => {
        // เช็ค Lock State
        if (type === 'orb' && currentState.isOrbLocked) return;
        if (type === 'window' && currentState.isWinLocked) return;

        isDragging = true;
        if(type === 'orb') $(element).addClass('is-dragging-flag x-dragging');

        e = e.type === 'touchstart' ? e.touches[0] : e;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Bind events to document
        document.onmouseup = dragEnd;
        document.onmousemove = dragAction;
        document.ontouchend = dragEnd;
        document.ontouchmove = dragAction;
    };

    const dragAction = (e) => {
        if (!isDragging) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        e.preventDefault(); // กันจอเลื่อนตามนิ้ว

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        // Apply new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        
        // Clear conflicting styles
        element.style.right = 'auto'; 
        element.style.bottom = 'auto';
    };

    const dragEnd = () => {
        isDragging = false;
        if(type === 'orb') {
            setTimeout(() => $(element).removeClass('is-dragging-flag x-dragging'), 100);
        }

        // Unbind events
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;

        // Auto Save Position
        const rect = element.getBoundingClientRect();
        if (type === 'orb') {
            currentState.btnPos = { top: rect.top + 'px', left: rect.left + 'px', right: 'auto' };
        } else {
            currentState.winPos = { top: rect.top + 'px', left: rect.left + 'px' };
        }
        saveState();
    };

    target.onmousedown = dragStart;
    target.ontouchstart = dragStart;
}

// Logic สำหรับปุ่มสวิตช์
function toggleOrbLock() {
    currentState.isOrbLocked = !currentState.isOrbLocked;
    const btn = $('#x_toggle_orb_move');
    
    if (!currentState.isOrbLocked) {
        btn.addClass('active'); // ไฟติด
    } else {
        btn.removeClass('active'); // ไฟดับ
    }
    saveState();
}

function toggleWindowLock(forceLock = false) {
    if (forceLock) currentState.isWinLocked = false;
    currentState.isWinLocked = !currentState.isWinLocked;
    
    const btn = $('#x_toggle_win_move');
    const header = $('#x_header_drag_area');
    
    if (!currentState.isWinLocked) {
        btn.addClass('active');
        header.css('cursor', 'move');
        header.css('background', 'rgba(0, 242, 255, 0.1)'); // Visual Feedback
    } else {
        btn.removeClass('active');
        header.css('cursor', 'default');
        header.css('background', '');
    }
    saveState();
}

// =============================================================================
// 6. MODULES LOGIC (ระบบย่อยทั้ง 5)
// =============================================================================

function refreshCurrentPageData() {
    const currentId = PAGES[currentState.lastPageIndex].id;
    const container = $(`#x_content_inner_${currentId}`);
    
    // เลือกฟังก์ชันตามหน้า
    switch (currentId) {
        case 'lore': updateLoreModule(container); break;
        case 'inspect': updateInspectModule(container); break;
        case 'ooc': updateOOCModule(container); break;
        case 'world': updateWorldModule(container); break;
        case 'helper': updateHelperModule(container); break;
    }
}

// --- Module 1: Lorebook Tracer ---
function updateLoreModule(container) {
    // จำลองการดึงข้อมูล Lorebook (ต้องเชื่อมกับ ST API จริงๆ ตรงนี้)
    // สมมติว่าดึงมาจาก SillyTavern.getContext().lorebook_triggers
    
    const mockLore = [
        { name: 'Ancient Ruins', keys: ['ruins', 'old temple'], triggered: true },
        { name: 'Frost Magic', keys: ['ice', 'cold', 'freeze'], triggered: false },
        { name: 'Dragon', keys: ['fire', 'scale'], triggered: true }
    ];

    let html = `<div class="x-data-list">`;
    mockLore.forEach(item => {
        const statusClass = item.triggered ? 'active' : 'inactive';
        const icon = item.triggered ? 'fa-check-circle' : 'fa-circle';
        html += `
            <div class="x-data-item ${statusClass}">
                <div class="x-row-flex">
                    <i class="fa-solid ${icon}"></i>
                    <span class="x-label">${item.name}</span>
                </div>
                <div class="x-detail">Keys: [${item.keys.join(', ')}]</div>
            </div>
        `;
    });
    html += `</div>`;
    container.html(html);
}

// --- Module 2: Context Inspector ---
function updateInspectModule(container) {
    // ส่วนนี้ไว้อ่านข้อความย้อนหลัง
    const html = `
        <div class="x-control-panel">
            <input type="number" id="x_inspect_idx" placeholder="Chat ID" class="x-input-num">
            <button class="x-btn-action" id="x_btn_inspect">SCAN</button>
        </div>
        <div id="x_inspect_result" class="x-console-log">
            > Ready to inspect context stream...
        </div>
    `;
    container.html(html);

    // Event ภายใน Module
    $('#x_btn_inspect').off().on('click', () => {
        const idx = $('#x_inspect_idx').val();
        $('#x_inspect_result').html(`> Fetching Chat ID: ${idx}...<br><span style="color:var(--frost-cyan)">[DATA FOUND]</span>: "Example text retrieved from history..."`);
    });
}

// --- Module 3: OOC Chat (คุยเล่น) ---
function updateOOCModule(container) {
    // ต้องมีระบบเลือกสี + ล็อค
    const html = `
        <div class="x-ooc-wrapper">
            <div class="x-ooc-messages" id="x_ooc_log">
                <div class="x-msg system">System: OOC Channel Open.</div>
            </div>
            <div class="x-ooc-controls">
                <select id="x_ooc_char" class="x-select">
                    <option value="user">User</option>
                    <option value="char">Character</option>
                </select>
                <input type="text" id="x_ooc_input" class="x-input-text" placeholder="Type OOC message...">
                <button id="x_ooc_send" class="x-btn-send"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    container.html(html);
    
    // โหลดประวัติเก่า
    currentState.oocHistory.forEach(msg => {
        $('#x_ooc_log').append(`<div class="x-msg ${msg.role}">${msg.text}</div>`);
    });

    // Send Logic
    $('#x_ooc_send').off().on('click', () => {
        const text = $('#x_ooc_input').val();
        if(!text) return;
        const role = $('#x_ooc_char').val();
        
        const msgObj = { role, text, time: new Date() };
        currentState.oocHistory.push(msgObj);
        saveState(); // บันทึก OOC
        
        $('#x_ooc_log').append(`<div class="x-msg ${role}">${text}</div>`);
        $('#x_ooc_input').val('');
        
        // Scroll to bottom
        const log = document.getElementById('x_ooc_log');
        log.scrollTop = log.scrollHeight;
    });
}

// --- Module 4: World Status ---
function updateWorldModule(container) {
    // แสดงวันที่ เวลา และตัวแปรโลก
    const html = `
        <div class="x-world-grid">
            <div class="x-card">
                <div class="x-card-title">TIME / DATE</div>
                <div class="x-card-val">Year 2045, Winter</div>
            </div>
            <div class="x-card">
                <div class="x-card-title">WEATHER</div>
                <div class="x-card-val">Heavy Snow (-5°C)</div>
            </div>
            <div class="x-card full">
                <div class="x-card-title">LOCATION</div>
                <div class="x-card-val">Sector 7: Frost Outpost</div>
            </div>
            <div class="x-card full">
                <div class="x-card-title">ACTIVE CHARACTERS</div>
                <div class="x-tags">
                    <span class="x-tag">Commander</span>
                    <span class="x-tag">Medic</span>
                </div>
            </div>
        </div>
        <div style="margin-top:10px; font-size:10px; color:#556;">
            *Data syncs with latest AI response triggers.
        </div>
    `;
    container.html(html);
}

// --- Module 5: Helper ---
function updateHelperModule(container) {
    const html = `
        <div class="x-helper-menu">
            <button class="x-menu-btn">📝 Summarize Events</button>
            <button class="x-menu-btn">🎭 Suggest Roleplay Action</button>
            <button class="x-menu-btn">⚔️ Check Combat Stats</button>
        </div>
        <div class="x-console-log" style="height:150px; margin-top:10px;">
            > Waiting for command...
        </div>
    `;
    container.html(html);
}

function startSystemLoop() {
    // Loop สำหรับเช็คค่าพื้นหลัง (ถ้าจำเป็น)
    setInterval(() => {
        // เช่น เช็คว่ามีการตอบกลับใหม่หรือไม่
    }, 2000);
}

            
