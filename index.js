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

// index.js - PART B: Intelligence Modules

// ฟังก์ชันตรวจสอบ Lorebook
function analyzeLore() {
    const context = getContext();
    const lastMessage = context.chat[context.chat.length - 1]?.mes || "";
    const lorebook = context.lorebook;
    
    let report = `<div class="lore-report"><h4>Active Lore Triggers</h4>`;
    let foundAny = false;

    if (lorebook && lorebook.entries) {
        Object.values(lorebook.entries).forEach(entry => {
            const keys = entry.key.split(',').map(k => k.trim());
            const matched = keys.filter(k => lastMessage.toLowerCase().includes(k.toLowerCase()));
            
            if (matched.length > 0) {
                foundAny = true;
                report += `
                <div class="lore-card" style="border-left: 2px solid var(--frost-accent); margin-bottom:10px; padding:5px 10px; background:rgba(0,210,255,0.05);">
                    <b style="color:var(--frost-accent)">📌 ${entry.comment || 'Unnamed Entry'}</b><br>
                    <small>Keywords: <span style="color:#ffeb3b">${matched.join(', ')}</span></small>
                </div>`;
            }
        });
    }

    if (!foundAny) report += `<p>No lore entries triggered in the last message.</p>`;
    report += `</div>`;
    return report;
}

// ระบบตรวจสอบข้อความ (History Inspector)
function renderHistoryInspector() {
    return `
    <div class="history-inspector">
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <input type="number" id="hist-index" placeholder="Message Number" class="text_display" style="flex:1">
            <button id="btn-inspect" class="menu_button">Check</button>
        </div>
        <div id="inspect-result" style="background:#000; padding:10px; border-radius:10px; min-height:100px; font-family:monospace; font-size:0.9em;">
            Enter message ID to view raw content...
        </div>
    </div>
    `;
}

$(document).on('click', '#btn-inspect', function() {
    const idx = $('#hist-index').val();
    const context = getContext();
    if (context.chat[idx]) {
        $('#inspect-result').text(context.chat[idx].mes);
    } else {
        toastr.error("Message ID not found.");
    }
});

// index.js - PART C: OOC Chat Logic

/**
 * ระบบ OOC Chat: แยกข้อความคุยเล่นออกจาก Roleplay หลัก
 * รองรับการเลือกสี, การล็อคตัวละคร และการแยกตาม Route (Chat ID)
 */
function initOOCLogic() {
    // โหลดข้อมูล OOC จากหน่วยความจำ
    const context = getContext();
    const chatId = context.chatId || "default";
    
    if (!settings.oocData) settings.oocData = {};
    if (!settings.oocData[chatId]) settings.oocData[chatId] = [];

    // เรนเดอร์หน้าจอ OOC
    $(document).on('click', '#ooc-send-btn', function() {
        const text = $('#ooc-input-text').val().trim();
        const charName = $('#ooc-char-select').val();
        const charColor = $('#ooc-color-picker').val();

        if (!text) return;

        const newMessage = {
            id: Date.now(),
            sender: charName,
            text: text,
            color: charColor,
            timestamp: new Date().toLocaleTimeString()
        };

        settings.oocData[chatId].push(newMessage);
        saveSettingsDebounced();
        renderOOCMessages();
        $('#ooc-input-text').val('');
        
        // ส่งคำสั่งแบบเงียบๆ ให้ AI (Optional: ถ้าต้องการให้ AI ตอบใน OOC)
        // script.js: sendSystemMessage หรือคำสั่งคล้ายกัน
    });

    // ระบบ Lock ตัวละคร (กันรีหน้าแล้วหาย)
    $(document).on('change', '#ooc-lock-char', function() {
        settings.oocLockedChar = $(this).is(':checked') ? $('#ooc-char-select').val() : null;
        saveSettingsDebounced();
        toastr.success(settings.oocLockedChar ? `Locked to ${settings.oocLockedChar}` : "Character unlocked");
    });
}

function renderOOCMessages() {
    const context = getContext();
    const chatId = context.chatId || "default";
    const container = $('#ooc-history-display');
    if (!container.length) return;

    container.empty();
    const messages = settings.oocData[chatId] || [];

    messages.forEach(msg => {
        const isUser = msg.sender === "User" || msg.sender === "Me";
        container.append(`
            <div class="ooc-bubble ${isUser ? 'user-side' : 'ai-side'}" style="border-left: 3px solid ${msg.color}">
                <div class="ooc-meta" style="color:${msg.color}">
                    <span class="ooc-name">${msg.sender}</span>
                    <span class="ooc-time">${msg.time || msg.timestamp}</span>
                </div>
                <div class="ooc-text">${msg.text}</div>
            </div>
        `);
    });
    container.scrollTop(container[0].scrollHeight);
}

// อัปเดตรายชื่อตัวละครใน OOC Select เมื่อมีการเปลี่ยน Chat
eventSource.on(event_types.CHAT_CHANGED, () => {
    const context = getContext();
    const select = $('#ooc-char-select');
    if (!select.length) return;

    select.empty().append('<option value="User">Me (User)</option>');
    context.characters.forEach(c => {
        select.append(`<option value="${c.name}">${c.name}</option>`);
    });

    if (settings.oocLockedChar) {
        select.val(settings.oocLockedChar);
    }
    renderOOCMessages();
});
// index.js - PART D: World & Character Perception

/**
 * ดึงข้อมูล Status จากข้อความล่าสุดของ AI
 * ค้นหา Pattern: [STATUS] { "weather": "...", "mood": "..." } [/STATUS]
 */
function parseWorldStatus(messageText) {
    const statusRegex = /\[STATUS\]\s*([\s\S]*?)\s*\[\/STATUS\]/i;
    const match = messageText.match(statusRegex);

    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            updateStatusUI(data);
            return messageText.replace(statusRegex, ''); // ลบ Tag ออกไม่ให้รกแชทหลัก
        } catch (e) {
            console.error("FROST HUD: Status JSON Parsing failed", e);
        }
    }
    return messageText;
}

function updateStatusUI(data) {
    // บันทึกสถานที่และเวลา
    if (data.location) {
        if (!settings.locationHistory) settings.locationHistory = [];
        const entry = {
            name: data.location,
            desc: data.location_desc || "No description",
            time: data.world_time || new Date().toLocaleString(),
            connection: data.connection || "Unknown"
        };
        // ป้องกันการบันทึกซ้ำถ้าอยู่ที่เดิม
        if (settings.locationHistory[settings.locationHistory.length-1]?.name !== entry.name) {
            settings.locationHistory.push(entry);
        }
    }

    // อัปเดต UI หน้า Status
    const html = `
        <div class="status-section">
            <h4 class="sparkle-text">🌦️ Environment</h4>
            <div class="status-grid">
                <div class="item"><span>Time:</span> ${data.world_time || '--:--'}</div>
                <div class="item"><span>Weather:</span> ${data.weather || 'Unknown'}</div>
                <div class="item"><span>Temp:</span> ${data.temp || '??'}°C</div>
                <div class="item"><span>Season:</span> ${data.season || 'N/A'}</div>
            </div>
        </div>
        <div class="status-section">
            <h4 class="sparkle-text">👤 Character: ${data.char_name || 'Active'}</h4>
            <div class="status-grid">
                <div class="item"><span>Mood:</span> ${data.mood || 'Neutral'}</div>
                <div class="item"><span>Health:</span> ${data.health || 'Healthy'}</div>
                <div class="item"><span>Clothing:</span> ${data.outfit || 'Standard'}</div>
            </div>
        </div>
        <div class="status-section">
            <h4 class="sparkle-text">🎒 Inventory</h4>
            <div class="inventory-list">${data.items ? data.items.join(', ') : 'None'}</div>
        </div>
    `;
    $('#status-content-area').html(html);
    saveSettingsDebounced();
}

// Hook เข้ากับกระบวนการรับข้อความ
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (messageId) => {
    const context = getContext();
    const message = context.chat[messageId];
    if (message && !message.is_user) {
        parseWorldStatus(message.mes);
        analyzeLore(); // ตรวจสอบ Lorebook ทันทีที่มีข้อความใหม่
    }
});
// index.js - PART E: Helper & UI Polish

function initHelperSystem() {
    // ปุ่มสรุปสถานการณ์
    $(document).on('click', '#frost-summary-btn', function() {
        toastr.info("FROST HUD: Requesting Summary...");
        const summaryCommand = "/ooc [SYSTEM: Summarize current situation, location, and key events briefly]";
        $('#send_textarea').val(summaryCommand);
        $('#send_but').click();
    });

    // ปุ่มให้ AI ช่วยโรลแทน (Auto-RP)
    $(document).on('click', '#frost-autorp-btn', function() {
        const autoCommand = "/ooc [SYSTEM: Based on my character status, write a short response for me]";
        $('#send_textarea').val(autoCommand);
        $('#send_but').click();
    });
}

/**
 * ระบบนำทางแบบปัด (Book Layout)
 */
function renderTab(tabName) {
    const view = $('#frost-view-content');
    view.fadeOut(200, function() {
        let content = "";
        switch(tabName) {
            case 'status': content = `<div id="status-content-area">Loading status...</div>`; break;
            case 'lore': content = analyzeLore(); break;
            case 'history': content = renderHistoryInspector(); break;
            case 'ooc': content = `
                <div class="ooc-wrapper">
                    <div id="ooc-history-display" class="ooc-display"></div>
                    <div class="ooc-input-zone">
                        <div class="ooc-tools">
                            <select id="ooc-char-select"></select>
                            <input type="color" id="ooc-color-picker" value="#00d2ff">
                            <label><input type="checkbox" id="ooc-lock-char"> Lock</label>
                        </div>
                        <textarea id="ooc-input-text" placeholder="Type OOC message..."></textarea>
                        <button id="ooc-send-btn" class="menu_button">SEND</button>
                    </div>
                </div>`; break;
            case 'help': content = `
                <div class="help-menu">
                    <button id="frost-summary-btn" class="menu_button">📝 Summarize Story</button>
                    <button id="frost-autorp-btn" class="menu_button">🤖 Auto-Reply Assist</button>
                    <hr>
                    <p style="font-size:0.8em; opacity:0.7;">FROST PROTOCOL v1.0 - Use [STATUS] tags in System Prompt for auto-updates.</p>
                </div>`; break;
        }
        view.html(content).fadeIn(200);
        if (tabName === 'ooc') renderOOCMessages();
    });
}

// index.js - PART F: System Instruction Injection

const STATUS_PROMPT = `
[SYSTEM COMMAND: FROST_PROTOCOL_ACTIVE]
1. ALWAYS end your response with a hidden JSON block inside [STATUS]...[/STATUS] tags.
   Structure: {"world_time": "...", "weather": "...", "location": "...", "health": "...", "mood": "...", "items": ["..."]}
2. IF using Chain of Thought, ALWAYS wrap your thought process in <think>...</think> tags.
3. Keep the "think" section separate from the spoken response.
`;

/**
 * Hook เข้ากับระบบสร้าง Prompt ของ SillyTavern
 * จะทำงานก่อนส่งข้อความไปหา AI
 */
eventSource.on(event_types.EXTENSION_PROMPT_ROLES, (data) => {
    // ตรวจสอบว่ามี System Prompt เดิมไหม ถ้ามีให้ต่อท้าย
    if (data.system_prompt) {
        data.system_prompt += "\n" + STATUS_PROMPT;
    } else {
        // กรณีไม่มี (เช่นโมเดลบางตัว) ให้ยัดใส่ต้นบทสนทนา
        data.system_prompt = STATUS_PROMPT;
    }
    console.log("❄️ Frost Protocol: Instructions Injected.");
});

