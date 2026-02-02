import { 
    extension_settings, 
    getContext, 
    saveSettingsDebounced, 
    eventSource, 
    event_types, 
    saveChat,
    substituteParams 
} from '../../../../script.js';

const EXTENSION_NAME = "FrostProtocol";
const DEFAULT_SETTINGS = {
    triggerPos: { top: '20%', left: '10px' },
    windowPos: { top: '10%', left: '5%' },
    isLocked: true, // ล็อคการเคลื่อนย้ายเป็นค่าเริ่มต้น
    activeTab: 'status',
    oocHistory: {}, // เก็บแยกตาม Chat ID
    oocLockedChar: null, // ตัวละครที่ล็อคไว้คุย
    oocColor: '#00d2ff',
    worldStatus: { // ค่าเริ่มต้นของโลก
        location: "Unknown",
        time: "Day",
        weather: "Clear",
        mood: "Neutral"
    }
};

let settings = {};
let currentChatId = null;

// โหลด Settings
function loadSettings() {
    settings = Object.assign({}, DEFAULT_SETTINGS, extension_settings[EXTENSION_NAME]);
}

function saveSettings() {
    extension_settings[EXTENSION_NAME] = settings;
    saveSettingsDebounced();
}

// ==========================================
// PART 1: UI Initialization & Drag System
// ==========================================

function initUI() {
    // 1. สร้าง HTML Structure
    const html = `
    <div id="frost-trigger" title="Open Frost HUD">X</div>

    <div id="frost-container">
        <div class="frost-header" id="frost-drag-handle">
            <div class="frost-title">❄️ FROST PROTOCOL</div>
            <div class="frost-controls">
                <button id="frost-lock-btn" title="Toggle Move Lock"><i class="fa-solid fa-lock"></i></button>
                <button id="frost-close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>

        <div class="frost-tabs">
            <div class="frost-tab-btn active" data-tab="status">🌍 Status</div>
            <div class="frost-tab-btn" data-tab="lore">📖 Lore</div>
            <div class="frost-tab-btn" data-tab="ooc">💬 OOC Chat</div>
            <div class="frost-tab-btn" data-tab="history">📜 History</div>
            <div class="frost-tab-btn" data-tab="help">❓ Help</div>
        </div>

        <div id="frost-content-area" class="frost-content"></div>
    </div>

    <div id="frost-selection-menu">
        <button class="repair-btn" id="act-fix-think"><i class="fa-solid fa-brain"></i> Fix &lt;think&gt;</button>
        <button class="repair-btn" id="act-edit-spec"><i class="fa-solid fa-pen"></i> Edit Text</button>
        <button class="repair-btn" id="act-fix-md"><i class="fa-solid fa-code"></i> Fix UI/Markdown</button>
    </div>

    <div id="frost-modal-overlay" class="frost-modal-overlay">
        <div class="frost-modal-box">
            <h3 style="color:var(--frost-accent)">Edit Segment</h3>
            <textarea id="frost-edit-input" style="width:100%; height:100px; background:#000; color:#fff; margin:10px 0;"></textarea>
            <div style="text-align:right;">
                <button id="frost-save-edit" class="menu_button">Save</button>
                <button id="frost-cancel-edit" class="menu_button_red">Cancel</button>
            </div>
        </div>
    </div>
    `;

    $('body').append(html);

    // 2. Apply Positions
    $('#frost-trigger').css(settings.triggerPos);
    $('#frost-container').css(settings.windowPos);
    updateLockIcon();

    // 3. Event Listeners
    setupEventListeners();
    
    // 4. Render Tab แรก
    renderTab(settings.activeTab);
}

function setupEventListeners() {
    // เปิด/ปิด หน้าต่าง
    $('#frost-trigger').on('click', function() {
        if (!settings.isLocked) return; // ถ้าปลดล็อคอยู่ (กำลังจะย้าย) ห้ามกดเปิด
        $(this).fadeOut(200);
        $('#frost-container').fadeIn(300).css('display', 'flex');
    });

    $('#frost-close-btn').on('click', function() {
        $('#frost-container').fadeOut(200);
        $('#frost-trigger').fadeIn(300);
        // Safety: ปิดแล้วล็อคทันที ป้องกันลืมล็อคแล้วหาปุ่มไม่เจอ
        settings.isLocked = true;
        updateLockIcon();
        saveSettings();
    });

    // ระบบ Lock/Unlock
    $('#frost-lock-btn').on('click', function() {
        settings.isLocked = !settings.isLocked;
        updateLockIcon();
        saveSettings();
    });

    // เปลี่ยน Tab
    $('.frost-tab-btn').on('click', function() {
        $('.frost-tab-btn').removeClass('active');
        $(this).addClass('active');
        const tab = $(this).data('tab');
        settings.activeTab = tab;
        renderTab(tab);
        saveSettings();
    });

    // ติดตั้งระบบลาก (Mobile & Desktop)
    makeDraggable(document.getElementById('frost-trigger'), 'triggerPos');
    makeDraggable(document.getElementById('frost-container'), 'windowPos', document.getElementById('frost-drag-handle'));
}

function updateLockIcon() {
    const icon = settings.isLocked ? 'fa-lock' : 'fa-lock-open';
    const color = settings.isLocked ? 'var(--frost-accent)' : '#ff4444';
    $('#frost-lock-btn i').attr('class', `fa-solid ${icon}`);
    $('#frost-lock-btn').css('color', color);
    
    if (!settings.isLocked) {
        toastr.info("Movement Unlocked: Drag elements now.");
    }
}

// ฟังก์ชันลากที่รองรับ Mobile (Touch)
function makeDraggable(element, settingKey, handle = null) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragHandler = handle || element;

    dragHandler.onmousedown = dragMouseDown;
    dragHandler.ontouchstart = dragMouseDown;

    function dragMouseDown(e) {
        if (settings.isLocked) return; // ถ้าล็อคอยู่ห้ามลาก

        e = e || window.event;
        // e.preventDefault(); // อย่าใส่ตรงนี้ ถ้าใส่จะกดปุ่มไม่ได้
        
        // แยกเคส Mouse/Touch
        if (e.type === 'touchstart') {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
        } else {
            pos3 = e.clientX;
            pos4 = e.clientY;
        }

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        // ป้องกันการเลื่อนหน้าจอเฉพาะตอนลาก
        if(e.type === 'touchmove') { 
             // e.preventDefault(); // (Optional) อาจทำให้ Scroll ติดขัด ลองเอาออกถ้ามีปัญหา
        }

        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        // คำนวณตำแหน่งใหม่
        let newTop = (element.offsetTop - pos2);
        let newLeft = (element.offsetLeft - pos1);

        // Safety: ขอบเขตหน้าจอ
        const maxW = window.innerWidth - element.offsetWidth;
        const maxH = window.innerHeight - element.offsetHeight;
        
        if (newTop < 0) newTop = 0;
        if (newLeft < 0) newLeft = 0;
        if (newTop > maxH) newTop = maxH;
        if (newLeft > maxW) newLeft = maxW;

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;

        // บันทึกตำแหน่ง
        settings[settingKey] = { top: element.style.top, left: element.style.left };
        saveSettings();
    }
}

// ==========================================
// PART 2: Core Features (Render Tabs)
// ==========================================

function renderTab(tabName) {
    const content = $('#frost-content-area');
    content.empty();

    switch(tabName) {
        case 'status':
            renderStatusTab(content);
            break;
        case 'lore':
            renderLoreTab(content);
            break;
        case 'ooc':
            renderOOCTab(content);
            break;
        case 'history':
            renderHistoryTab(content);
            break;
        case 'help':
            renderHelpTab(content);
            break;
    }
}

// 1. Lorebook System
function renderLoreTab(container) {
    const context = getContext();
    const lastMes = context.chat.length > 0 ? context.chat[context.chat.length - 1].mes : "";
    
    let html = `<h3 class="frost-title">Active Lore Triggers</h3>`;
    let found = false;

    if (context.lorebook && context.lorebook.entries) {
        for (const uid in context.lorebook.entries) {
            const entry = context.lorebook.entries[uid];
            // ตรวจสอบ Keywords (Basic check)
            const keywords = entry.key.split(',').map(k => k.trim().toLowerCase()).filter(k=>k);
            const triggeredWords = keywords.filter(k => lastMes.toLowerCase().includes(k));

            if (triggeredWords.length > 0) {
                found = true;
                html += `
                <div class="lore-card">
                    <div style="font-weight:bold; color:var(--frost-accent);">${entry.comment || 'Untitled Entry'}</div>
                    <div style="font-size:0.8em; margin-top:5px;">
                        <span style="opacity:0.7">Triggered by:</span> 
                        <span style="color:#ffeb3b">${triggeredWords.join(', ')}</span>
                    </div>
                </div>`;
            }
        }
    }

    if (!found) html += `<div style="opacity:0.6; text-align:center; margin-top:20px;">No lore triggered in the last message.</div>`;
    container.html(html);
}

// 2. Status System (World & Char)
function renderStatusTab(container) {
    const s = settings.worldStatus;
    const html = `
    <div style="margin-bottom:15px;">
        <h3 class="frost-title">🌍 World State</h3>
        <div class="status-grid">
            <div class="status-item"><span class="status-label">Location</span><span class="status-value">${s.location}</span></div>
            <div class="status-item"><span class="status-label">Time</span><span class="status-value">${s.time}</span></div>
            <div class="status-item"><span class="status-label">Weather</span><span class="status-value">${s.weather}</span></div>
            <div class="status-item"><span class="status-label">Season</span><span class="status-value">${s.season || 'N/A'}</span></div>
        </div>
    </div>
    
    <div>
        <h3 class="frost-title">👤 Character Condition</h3>
        <div class="status-grid">
            <div class="status-item"><span class="status-label">Mood</span><span class="status-value">${s.mood}</span></div>
            <div class="status-item"><span class="status-label">Health</span><span class="status-value">${s.health || 'Fine'}</span></div>
            <div class="status-item" style="grid-column: span 2;"><span class="status-label">Outfit</span><span class="status-value">${s.outfit || 'Default'}</span></div>
        </div>
    </div>
    <div style="margin-top:20px; font-size:0.7em; opacity:0.5; text-align:center;">
        Updated automatically via [STATUS] tags in AI response.
    </div>
    `;
    container.html(html);
}

// 3. OOC Chat System
function renderOOCTab(container) {
    const chatId = getContext().chatId || 'default';
    if (!settings.oocHistory[chatId]) settings.oocHistory[chatId] = [];
    
    const html = `
    <div class="ooc-area">
        <div id="ooc-messages-box" class="ooc-messages"></div>
        <div class="ooc-input-group">
            <select id="ooc-char-select" class="text_display" style="max-width:100px;"></select>
            <input type="color" id="ooc-color-input" value="${settings.oocColor}" style="height:35px; width:35px; padding:0; border:none;">
            <button id="ooc-lock-char" class="menu_button" style="padding:0 10px;" title="Lock Character"><i class="fa-solid fa-lock${settings.oocLockedChar ? '' : '-open'}"></i></button>
        </div>
        <div class="ooc-input-group" style="margin-top:5px;">
            <input type="text" id="ooc-text-input" class="text_display" placeholder="Chat with GM/Friend...">
            <button id="ooc-send-btn" class="menu_button">Send</button>
        </div>
    </div>
    `;
    container.html(html);

    // Populate Char Select
    const select = $('#ooc-char-select');
    select.append('<option value="User">Me (User)</option>');
    getContext().characters.forEach(c => {
        select.append(`<option value="${c.name}">${c.name}</option>`);
    });

    if (settings.oocLockedChar) select.val(settings.oocLockedChar);

    updateOOCDisplay(chatId);

    // OOC Events
    $('#ooc-send-btn').click(() => sendOOC(chatId));
    $('#ooc-text-input').keypress(e => { if(e.which == 13) sendOOC(chatId); });
    
    $('#ooc-color-input').change(function() { settings.oocColor = $(this).val(); saveSettings(); });
    
    $('#ooc-lock-char').click(function() {
        if (settings.oocLockedChar) {
            settings.oocLockedChar = null; // Unlock
            toastr.info("Character Unlocked");
        } else {
            settings.oocLockedChar = $('#ooc-char-select').val();
            toastr.success(`Locked to ${settings.oocLockedChar}`);
        }
        renderOOCTab(container); // Refresh icon
        saveSettings();
    });
}

function sendOOC(chatId) {
    const text = $('#ooc-text-input').val().trim();
    if (!text) return;
    
    const sender = $('#ooc-char-select').val();
    const color = $('#ooc-color-input').val();
    
    const msg = { sender, text, color, time: new Date().toLocaleTimeString() };
    settings.oocHistory[chatId].push(msg);
    saveSettings();
    
    updateOOCDisplay(chatId);
    $('#ooc-text-input').val('');
}

function updateOOCDisplay(chatId) {
    const box = $('#ooc-messages-box');
    box.empty();
    const history = settings.oocHistory[chatId] || [];
    
    history.forEach(msg => {
        const type = (msg.sender === 'User' || msg.sender === 'Me') ? 'user' : 'char';
        box.append(`
            <div class="ooc-bubble ${type}" style="border-color:${msg.color}">
                <span class="ooc-sender-name" style="color:${msg.color}">${msg.sender}</span>
                ${msg.text}
            </div>
        `);
    });
    box.scrollTop(box[0].scrollHeight);
}

// 4. History Inspector
function renderHistoryTab(container) {
    const html = `
    <div style="display:flex; gap:10px; margin-bottom:10px;">
        <input type="number" id="hist-idx" class="text_display" placeholder="Message #" style="flex:1">
        <button id="hist-go" class="menu_button">Check</button>
    </div>
    <div id="hist-result" style="background:#000; padding:10px; border-radius:5px; font-family:monospace; white-space:pre-wrap; min-height:100px;"></div>
    `;
    container.html(html);

    $('#hist-go').click(() => {
        const idx = parseInt($('#hist-idx').val());
        const context = getContext();
        if (context.chat[idx]) {
            $('#hist-result').text(context.chat[idx].mes);
        } else {
            toastr.error("Message index not found");
        }
    });
}

// 5. Help System
function renderHelpTab(container) {
    const html = `
    <h3 class="frost-title">System Helper</h3>
    <button id="help-summ" class="menu_button" style="width:100%; margin-bottom:10px;">📝 Summarize Situation</button>
    <button id="help-auto" class="menu_button" style="width:100%; margin-bottom:10px;">🤖 Auto-RP Response</button>
    `;
    container.html(html);

    $('#help-summ').click(() => {
        $('#send_textarea').val("/sys [Summarize the current situation, location, and important events concisely.]");
        $('#send_but').click();
    });

    $('#help-auto').click(() => {
         $('#send_textarea').val("/sys [Based on the character's status and personality, write the next roleplay response.]");
         $('#send_but').click();
    });
}

// ==========================================
// PART 3: Intelligent Parsing (Logic)
// ==========================================

// Parse [STATUS] JSON from AI messages
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (id) => {
    const context = getContext();
    const msg = context.chat[id];
    if (!msg || msg.is_user) return;

    // Regex หา [STATUS]{...}[/STATUS]
    const regex = /\[STATUS\]\s*(\{.*?\})\s*\[\/STATUS\]/s;
    const match = msg.mes.match(regex);

    if (match && match[1]) {
        try {
            const parsed = JSON.parse(match[1]);
            // Merge with existing stats
            settings.worldStatus = { ...settings.worldStatus, ...parsed };
            saveSettings();
            
            // ถ้าเปิด Tab Status อยู่ ให้รีเฟรช
            if (settings.activeTab === 'status') renderTab('status');

            // (Optional) ลบ Tag ออกจากข้อความเพื่อความสวยงาม
            // แต่ต้องระวังเรื่องการแก้ข้อความใน ST อาจจะยุ่งยากใน Ext
        } catch (e) {
            console.warn("Frost Protocol: Failed to parse Status JSON", e);
        }
    }
});

// Inject System Prompt
eventSource.on(event_types.EXTENSION_PROMPT_ROLES, (data) => {
    const INSTRUCTION = `
    \n[SYSTEM: FROST PROTOCOL ACTIVE]
    1. At the END of your response, you MUST include a hidden status block in this format:
    [STATUS]
    {
      "location": "Current Location",
      "time": "Time of day",
      "weather": "Current weather",
      "mood": "Character's current mood",
      "outfit": "Character's clothing"
    }
    [/STATUS]
    2. Keep internal thoughts inside <think> tags.
    `;
    
    if (data.system_prompt) {
        data.system_prompt += INSTRUCTION;
    } else {
        data.system_prompt = INSTRUCTION;
    }
});

// ==========================================
// PART 4: Repair & Selection System
// ==========================================

let selectedRange = null;
let targetMesId = null;

// ตรวจจับการเลือกข้อความ
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    const menu = $('#frost-selection-menu');

    if (!selection || selection.toString().trim().length === 0) {
        // Delay hide
        setTimeout(() => { 
            if (window.getSelection().toString().length === 0) menu.fadeOut(200); 
        }, 500);
        return;
    }

    // หาตำแหน่ง Message ID
    const anchor = $(selection.anchorNode);
    const msgBlock = anchor.closest('.mes');
    
    if (msgBlock.length) {
        targetMesId = msgBlock.attr('mesid');
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        
        // คำนวณตำแหน่งให้เมนูปรากฏเหนือข้อความ (Mobile Friendly)
        let top = rect.top + window.scrollY - 120; // สูงขึ้นมาหน่อยจะได้ไม่บังนิ้ว
        let left = rect.left + (rect.width/2) - 75; // กึ่งกลาง

        if (top < 10) top = rect.bottom + 20; // ถ้าชิดขอบบนเกินไป ให้เด้งลงล่าง
        
        menu.css({ top: top + 'px', left: left + 'px', display: 'block' });
    }
});

// Repair: Fix Think
$('#act-fix-think').click(async () => {
    if (!targetMesId) return;
    const context = getContext();
    let txt = context.chat[targetMesId].mes;
    const sel = window.getSelection().toString();

    if (sel.length > 0) {
        // Wrap selection
        txt = txt.replace(sel, `<think>${sel}</think>`);
    } else {
        // Auto fix closing
        if (txt.includes('<think>') && !txt.includes('</think>')) {
            txt += "</think>";
        }
    }
    await updateChat(targetMesId, txt);
    $('#frost-selection-menu').fadeOut();
});

// Repair: Edit Specific
$('#act-edit-spec').click(() => {
    const sel = window.getSelection().toString();
    if (!sel) return;
    $('#frost-edit-input').val(sel);
    $('#frost-modal-overlay').css('display', 'flex'); // Show modal
    selectedRange = sel; // จำข้อความเดิมไว้ replace
});

$('#frost-save-edit').click(async () => {
    const context = getContext();
    let txt = context.chat[targetMesId].mes;
    const newVal = $('#frost-edit-input').val();
    
    txt = txt.replace(selectedRange, newVal);
    await updateChat(targetMesId, txt);
       $('#frost-modal-overlay').hide();
});

$('#frost-cancel-edit').click(() => $('#frost-modal-overlay').hide());

// Helper Update Chat
async function updateChat(id, content) {
    const context = getContext();
    context.chat[id].mes = content;
    await eventSource.emit(event_types.MESSAGE_UPDATED, id);
    saveChat();
    toastr.success("Frost Protocol: Message updated.");
}

// Initial Run
$(document).ready(() => {
    loadSettings();
    initUI();
});
    
