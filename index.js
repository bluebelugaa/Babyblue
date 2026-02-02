// index.js - PART A: Initialization & UI Core

import { eventSource, event_types, saveSettingsDebounced, getContext, extension_settings } from '../../../../script.js';
// หมายเหตุ: path การ import อาจต้องปรับตามเวอร์ชั่น ST แต่นี่คือมาตรฐาน

const EXTENSION_NAME = "FrostGlass_HUD";
const SETTINGS_KEY = "frost_hud_settings";

// ค่าเริ่มต้น
let defaultSettings = {
    triggerPosition: { top: '20%', left: '10px' },
    windowPosition: { top: '10vh', left: '5vw' },
    isMoveMode: false,
    lastActiveTab: 'status'
};

let settings = defaultSettings; // จะโหลดทับภายหลัง

// HTML Template (โครงสร้างที่จะยัดใส่หน้าจอ)
const hudHTML = `
<div id="frost-hud-trigger" class="sparkling" title="Open HUD">X</div>

<div id="frost-hud-container">
    <div class="frost-header">
        <div class="frost-title">❄️ FROST PROTOCOL</div>
        <div class="frost-controls">
            <button id="frost-btn-move" class="frost-btn-icon" title="Toggle Move Mode (Lock/Unlock)">
                <i class="fa-solid fa-arrows-up-down-left-right"></i>
            </button>
            <button id="frost-btn-close" class="frost-btn-icon frost-btn-close" title="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    </div>

    <div class="frost-content">
        <div class="frost-nav">
            <div class="frost-nav-item active" data-tab="status" title="Status"><i class="fa-solid fa-globe"></i></div>
            <div class="frost-nav-item" data-tab="lore" title="Lorebook"><i class="fa-solid fa-book"></i></div>
            <div class="frost-nav-item" data-tab="history" title="History"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="frost-nav-item" data-tab="ooc" title="OOC Chat"><i class="fa-solid fa-comments"></i></div>
            <div class="frost-nav-item" data-tab="help" title="Help"><i class="fa-solid fa-circle-question"></i></div>
        </div>

        <div id="page-status" class="frost-page active">
            <h3>🌍 World & Character Status</h3>
            <div class="status-grid" id="status-display-area">
                <div class="status-card">Waiting for AI update...</div>
            </div>
        </div>

        <div id="page-lore" class="frost-page">
            <h3>📖 Lorebook Inspector</h3>
            <div id="lore-analysis-content"></div>
        </div>

        <div id="page-history" class="frost-page">
            <h3>📜 Full History Inspector</h3>
            <div style="display:flex; gap:5px; margin-bottom:10px;">
                <input type="number" id="hist-msg-id" placeholder="Msg ID" style="width:60px;">
                <button id="hist-btn-go" class="menu_button">Go</button>
                <button id="hist-btn-close" class="menu_button">Clear</button>
            </div>
            <div id="hist-content-view" style="white-space: pre-wrap; background:#000; padding:10px;"></div>
        </div>

        <div id="page-ooc" class="frost-page">
            <h3>💬 OOC Commentary</h3>
            <div class="ooc-container">
                <div id="ooc-history-box" class="ooc-history"></div>
                <div class="ooc-input-area">
                    <select id="ooc-char-select" style="max-width:80px;">
                        <option value="GM">GM</option>
                        <option value="User">Me</option>
                    </select>
                    <textarea id="ooc-input" rows="1" style="flex:1; resize:none;" placeholder="Comment here..."></textarea>
                    <button id="ooc-send" class="menu_button">Send</button>
                </div>
                <div style="font-size:0.7em; color:#aaa; margin-top:5px;">
                    <label><input type="checkbox" id="ooc-lock-char"> Lock Char</label>
                    <label><input type="color" id="ooc-color-picker" value="#00d2ff"> Color</label>
                </div>
            </div>
        </div>

        <div id="page-help" class="frost-page">
            <h3>❓ Helper</h3>
            <p>Tools for summarization and auto-reply.</p>
            <button id="frost-btn-summary" class="menu_button">Summarize Situation</button>
        </div>
    </div>
</div>
`;

// ฟังก์ชันโหลด
jQuery(async () => {
    // โหลด Settings
    // (ในโค้ดจริงต้องมีการโหลดจาก storage ของ ST หรือ local storage)
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) settings = JSON.parse(stored);

    // Inject HTML
    $('body').append(hudHTML);

    // Bind Events (เรียกฟังก์ชันที่เราจะเขียนใน Part ต่อไป)
    initUIEvents();
    initDraggableSystem();
    initNavigation();
    
    console.log(`${EXTENSION_NAME} Loaded.`);
});

// ... (จบ Part 2: รอต่อ Part 3) ...

// --- [PART 3 START] UI & Draggable Logic ---

/**
 * เริ่มต้น Event Listeners สำหรับปุ่มต่างๆ
 */
function initUIEvents() {
    // 1. ปุ่มเปิดหน้าต่าง (The 'X' Trigger)
    $('#frost-hud-trigger').on('click', function() {
        // ถ้าอยู่ในโหมด Move ห้ามกดเปิดหน้าต่าง (กันลั่นตอนกำลังลาก)
        if (settings.isMoveMode) return;
        
        $(this).fadeOut(200); // ซ่อนปุ่ม X
        $('#frost-hud-container').fadeIn(300).css('display', 'flex'); // โชว์หน้าต่างหลัก
    });

    // 2. ปุ่มปิดหน้าต่าง (Close Button)
    $('#frost-btn-close').on('click', function() {
        $('#frost-hud-container').fadeOut(200);
        $('#frost-hud-trigger').fadeIn(300);
        
        // Safety: ถ้าปิดหน้าต่าง ให้ปิดโหมดเคลื่อนย้ายด้วยเสมอ (กันลืม)
        if (settings.isMoveMode) {
            toggleMoveMode(false);
        }
    });

    // 3. ปุ่มเปิด/ปิด โหมดเคลื่อนย้าย (Move Mode Toggle)
    $('#frost-btn-move').on('click', function() {
        // สลับสถานะ true/false
        toggleMoveMode(!settings.isMoveMode);
    });

    // 4. ระบบเปลี่ยนหน้า (Navigation Tabs)
    $('.frost-nav-item').on('click', function() {
        const targetId = $(this).data('tab');
        
        // UI Feedback
        $('.frost-nav-item').removeClass('active');
        $(this).addClass('active');
        
        // Switch Content
        $('.frost-page').hide().removeClass('active'); // ซ่อนทุกหน้า
        $(`#page-${targetId}`).show().addClass('active'); // โชว์หน้าเป้าหมาย
        
        // Save state
        settings.lastActiveTab = targetId;
        saveSettings();
    });
}

/**
 * ฟังก์ชันจัดการโหมดเคลื่อนย้าย (Safety Lock)
 * @param {boolean} active - สถานะที่ต้องการ (true = ขยับได้)
 */
function toggleMoveMode(active) {
    settings.isMoveMode = active;
    const btn = $('#frost-btn-move');
    const trigger = $('#frost-hud-trigger');
    const container = $('#frost-hud-container');

    if (active) {
        // เปิดโหมด: เปลี่ยนสีปุ่มให้รู้ว่า Active
        btn.addClass('active').css('background', 'var(--frost-accent)');
        
        // เพิ่ม Visual Cue ให้รู้ว่าจับลากได้
        trigger.css('border', '2px dashed #ffeb3b').css('cursor', 'move');
        container.css('border', '2px dashed #ffeb3b');
        
        toastr.info("Move Mode: UNLOCKED. Drag items now.");
    } else {
        // ปิดโหมด: คืนค่าเดิม
        btn.removeClass('active').css('background', '');
        
        trigger.css('border', '').css('cursor', 'pointer');
        container.css('border', '');
        
        toastr.success("Move Mode: LOCKED.");
    }
}

/**
 * ระบบ Draggable รองรับทั้ง Mobile (Touch) และ PC (Mouse)
 */
function initDraggableSystem() {
    // 1. ทำให้ปุ่ม X (Trigger) ลากได้
    makeDraggable(document.getElementById('frost-hud-trigger'), 'triggerPosition');

    // 2. ทำให้หน้าต่างหลัก (Container) ลากได้ (จับที่หัว Header)
    // หมายเหตุ: ส่งตัว Container ไป แต่ตัว Handle คือ Header
    const container = document.getElementById('frost-hud-container');
    const header = container.querySelector('.frost-header');
    makeDraggable(container, 'windowPosition', header);

    // โหลดตำแหน่งล่าสุดที่บันทึกไว้
    applySavedPositions();
}

/**
 * ฟังก์ชัน Core Draggable
 * @param {HTMLElement} element - ตัวที่จะให้ขยับ
 * @param {string} settingKey - ชื่อ key ใน settings สำหรับบันทึกค่า
 * @param {HTMLElement} handle - (Optional) ตัวจับสำหรับลาก ถ้าไม่มีจะจับที่ element
 */
function makeDraggable(element, settingKey, handle = null) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragHandler = handle || element;

    // Mouse Events
    dragHandler.onmousedown = dragMouseDown;
    // Touch Events (Mobile)
    dragHandler.ontouchstart = dragMouseDown;

    function dragMouseDown(e) {
        // [Safety 1] ต้องเปิดโหมด Move เท่านั้นถึงจะลากได้
        if (!settings.isMoveMode) return;

        e = e || window.event;
        // กัน Event ซ้อนทับ (เช่นกดปุ่มปิดบน Header)
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return; 

        e.preventDefault();
        
        // ตรวจสอบว่าเป็น Touch หรือ Mouse
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        pos3 = clientX;
        pos4 = clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        // คำนวณระยะที่ขยับ
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        // ตั้งค่าตำแหน่งใหม่ (Top/Left)
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // หยุดลาก
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;

        // บันทึกตำแหน่งลง Settings
        settings[settingKey] = {
            top: element.style.top,
            left: element.style.left
        };
        saveSettings();
    }
}

/**
 * บันทึกการตั้งค่าลง LocalStorage
 */
function saveSettings() {
    localStorage.setItem('frost_hud_settings', JSON.stringify(settings));
}

/**
 * โหลดตำแหน่งตอนเปิดเว็บ
 */
function applySavedPositions() {
    if (settings.triggerPosition) {
        $('#frost-hud-trigger').css({
            top: settings.triggerPosition.top,
            left: settings.triggerPosition.left
        });
    }
    if (settings.windowPosition) {
        $('#frost-hud-container').css({
            top: settings.windowPosition.top,
            left: settings.windowPosition.left
        });
    }
    // คืนค่าแท็บล่าสุด
    if (settings.lastActiveTab) {
        $(`.frost-nav-item[data-tab="${settings.lastActiveTab}"]`).click();
    }
}
// --- [PART 3 END] ---

// --- [PART 4 & 5 START] AI Logic, Lorebook & OOC System ---

// ตัวแปรสำหรับเก็บข้อมูล OOC แยกตามรูท (Character)
let oocData = {
    messages: [], // {char: '', text: '', color: '', route: ''}
    lockedChar: 'GM'
};

/**
 * ฟังก์ชันดักจับข้อความ (Hook) เมื่อ AI ส่งคำตอบกลับมา
 */
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (messageId) => {
    const context = getContext();
    const lastMsg = context.chat[messageId];
    
    if (lastMsg.mes) {
        // 1. วิเคราะห์ Lorebook ที่ถูก Trigger
        analyzeLorebookUsage(lastMsg.mes);
        
        // 2. ดึงข้อมูล Status (ถ้ามี Hidden Tag)
        parseStatusFromMessage(lastMsg.mes);
        
        // 3. อัปเดตแชท OOC (ถ้าเป็นข้อความที่ต้องการดึงมาเม้าท์)
        updateOOCFromRoleplay(lastMsg.mes, lastMsg.name);
    }
});

/**
 * 📖 1. Lorebook Inspector Logic
 */
function analyzeLorebookUsage(text) {
    const context = getContext();
    const activeLore = context.lorebook?.entries || [];
    let foundEntries = [];

    activeLore.forEach(entry => {
        // เช็ค Key ที่ใช้ Trigger
        const keys = entry.key.split(',').map(k => k.trim());
        const triggeredKeys = keys.filter(k => text.toLowerCase().includes(k.toLowerCase()));

        if (triggeredKeys.length > 0) {
            foundEntries.push({
                name: entry.comment || "Untitled",
                keys: triggeredKeys,
                content: entry.content.substring(0, 50) + "..."
            });
        }
    });

    // แสดงผลในหน้าจอ Lore
    const container = $('#lore-analysis-content');
    container.empty();
    
    if (foundEntries.length === 0) {
        container.html("<p>No Lorebook triggered in last message.</p>");
    } else {
        foundEntries.forEach(item => {
            container.append(`
                <div class="lore-entry">
                    <strong>📌 ${item.name}</strong><br>
                    Triggered by: <span class="lore-keyword">${item.keys.join(', ')}</span>
                </div>
            `);
        });
    }
}

/**
 * 🌍 2. Status Parser (ดึงข้อมูลสถานะตัวละครและโลก)
 * เทคนิค: เราจะขอให้ AI ส่ง [STATUS]...[/STATUS] มาแบบซ่อน
 */
function parseStatusFromMessage(text) {
    // ใช้ Regex ค้นหา Tag พิเศษที่เราแอบสั่งไว้ใน System Prompt
    const statusRegex = /\[STATUS\]([\s\S]*?)\[\/STATUS\]/g;
    const match = statusRegex.exec(text);

    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            renderStatus(data);
            // หลังจาก Parse เสร็จ ลบ Tag ออกจากแชทหลัก (Optional)
        } catch (e) {
            console.error("Status Parsing Error", e);
        }
    }
}

function renderStatus(data) {
    const area = $('#status-display-area');
    area.empty();
    
    // วนลูปข้อมูลที่ AI ส่งมา (เช่น วันที่, อากาศ, สถานะตัวละคร)
    for (const [key, value] of Object.entries(data)) {
        area.append(`
            <div class="status-card">
                <div class="status-label">${key.toUpperCase()}</div>
                <div class="status-value">${value}</div>
            </div>
        `);
    }
}

/**
 * 💬 3. OOC Chat System (ระบบเม้าท์มอย)
 */
function initOOCSystem() {
    // ปุ่มส่งแชท OOC
    $('#ooc-send').on('click', () => {
        const charName = $('#ooc-char-select').val();
        const text = $('#ooc-input').val();
        const color = $('#ooc-color-picker').val();
        
        if (!text) return;

        addOOCMessage(charName, text, color, true);
        $('#ooc-input').val('');
    });

    // โหลดรายชื่อตัวละครในแชทปัจจุบันใส่ Select
    eventSource.on(event_types.CHAT_CHANGED, () => {
        const context = getContext();
        const select = $('#ooc-char-select');
        select.empty().append('<option value="User">Me</option><option value="GM">GM</option>');
        
        context.characters.forEach(c => {
            select.append(`<option value="${c.name}">${c.name}</option>`);
        });
    });
}

function addOOCMessage(char, text, color, isUser = false) {
    const box = $('#ooc-history-box');
    const msgHtml = `
        <div class="ooc-msg ${isUser ? 'user' : 'ai'}" style="border-left: 4px solid ${color}">
            <strong style="color:${color}">${char}:</strong> ${text}
        </div>
    `;
    box.append(msgHtml);
    box.scrollTop(box[0].scrollHeight);
}

/**
 * 📜 4. History Viewer (ย้อนดูข้อความเก่า)
 */
$('#hist-btn-go').on('click', () => {
    const id = parseInt($('#hist-msg-id').val());
    const context = getContext();
    const view = $('#hist-content-view');

    if (context.chat[id]) {
        const msg = context.chat[id];
        view.html(`<strong>[${msg.name}]:</strong><br>${msg.mes}`);
    } else {
        view.text("Message ID not found.");
    }
});

$('#hist-btn-close').on('click', () => $('#hist-content-view').empty());

/**
 * 🆘 5. Helper Module (สรุปสถานการณ์)
 */
$('#frost-btn-summary').on('click', async () => {
    toastr.info("Requesting summary...");
    const context = getContext();
    
    // ส่งคำสั่งพิเศษไปหา AI (ไม่เก็บเข้าประวัติแชทหลัก)
    const summaryPrompt = "Summarize the current situation and items briefly for OOC review.";
    // หมายเหตุ: การเรียก API โดยตรงของ ST ต้องผ่านตัวแปร internal ของเขา
    // ในที่นี้เราจะใช้เทคนิคส่ง Slash Command
    $('#send_textarea').val('/ooc Please summarize the situation').submit();
});

// --- การแอบยัด Prompt ให้ AI ส่ง Status กลับมา ---
// เราจะใช้ Event 'extension_prompt_roles' เพื่อแทรกคำสั่งลับ
eventSource.on(event_types.EXTENSION_PROMPT_ROLES, (promptObj) => {
    const statusInstruction = `
[SYSTEM NOTE: In every response, you MUST append a JSON block inside [STATUS]...[/STATUS] tags at the end of your message. 
Include: date, time, weather, location, character_status (health, mood, clothing), and items. 
This block will be hidden from the user but read by the system.]`;
    
    promptObj.system_prompt += statusInstruction;
});

// เรียกใช้ฟังก์ชันเริ่มต้น
initOOCSystem();

