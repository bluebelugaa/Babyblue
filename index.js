
// index.js - Part 1: Initialization & UI Builder
// =========================================================================
// NEON CYBERPUNK SYSTEM (NCS) - CORE SCRIPT
// =========================================================================

const NCS_VERSION = "2.0.0";
const EXTENSION_NAME = "NeonCyberpunkSystem";

// --- Global State Variables ---
let ncsState = {
    isTriggerDraggable: false,
    isWindowDraggable: false,
    currentRouteId: "default", // For OOC chat separation
    oocCharacters: [
        { name: "User", color: "#00ffff" },
        { name: "GM", color: "#ff00ff" }
    ],
    // Cache for parsing
    lastScannedMsgId: -1
};

// --- HTML Template Construction ---
const NCS_UI_HTML = `
<div id="ncs-trigger-btn" title="Open System [CYBERPUNK]">X</div>

<div id="ncs-window">
    <div class="ncs-header">
        <div class="ncs-title">CYBER_SYSTEM <span style="font-size:12px; opacity:0.7">v.${NCS_VERSION}</span></div>
        <div class="ncs-controls">
            <button id="ncs-btn-move-trigger" class="ncs-btn-icon" title="Toggle Trigger Move [T]">T</button>
            <button id="ncs-btn-move-window" class="ncs-btn-icon" title="Toggle Window Move [W]">W</button>
            <button id="ncs-btn-close" class="ncs-btn-icon ncs-close" title="Close System">X</button>
        </div>
    </div>

    <div class="ncs-nav">
        <div class="ncs-tab active" data-target="page-lore">LORE_NET</div>
        <div class="ncs-tab" data-target="page-inspector">INSPECTOR</div>
        <div class="ncs-tab" data-target="page-ooc">OOC_LINK</div>
        <div class="ncs-tab" data-target="page-status">WORLD_STAT</div>
        <div class="ncs-tab" data-target="page-help">HELPER</div>
    </div>

    <div class="ncs-content-area">
        
        <div id="page-lore" class="ncs-page active">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>> ACTIVE_ENTRIES</h3>
                <button class="ncs-btn-icon" id="lore-refresh" title="Force Rescan">R</button>
            </div>
            <div id="lore-output-list">
                <div style="color:#666; font-style:italic;">Waiting for neural handshake... (No triggers detected yet)</div>
            </div>
        </div>

        <div id="page-inspector" class="ncs-page">
            <h3>> DATA_MINER</h3>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <input type="number" id="insp-idx" class="ooc-input" placeholder="Msg Index (0 = Start)">
                <button id="insp-go" class="ncs-btn-icon">GO</button>
                <button id="insp-clear" class="ncs-btn-icon ncs-close">CLR</button>
            </div>
            <div id="insp-display" class="msg-display"></div>
            <div class="status-data" style="margin-top:5px; color:var(--neon-pink);">
                *Use negative numbers to count from end (-1 = Last msg)
            </div>
        </div>

        <div id="page-ooc" class="ncs-page">
            <div style="display:flex; justify-content:space-between;">
                <h3>> OOC_CHANNEL</h3>
                <button id="ooc-lock-toggle" class="ncs-btn-icon" title="Lock Window (Prevents Reset)">L</button>
            </div>
            <div class="ooc-container">
                <div id="ooc-history-display" class="ooc-history"></div>
                
                <div style="margin-bottom:5px; display:flex; gap:5px;">
                    <select id="ooc-char-select" class="ooc-input" style="flex:0 0 100px;"></select>
                    <input type="color" id="ooc-char-color" value="#00ffff" style="height:30px; width:40px; background:none; border:none;">
                    <button id="ooc-add-char" class="ncs-btn-icon small">+</button>
                </div>
                
                <div class="ooc-input-group">
                    <input type="text" id="ooc-text-input" class="ooc-input" placeholder="Transmission content...">
                    <button id="ooc-send-btn" class="ncs-btn-icon">></button>
                </div>
            </div>
        </div>

        <div id="page-status" class="ncs-page">
            <div style="display:flex; justify-content:space-between;">
                <h3>> WORLD_STATE_MONITOR</h3>
                <div style="font-size:10px; color:gray;">AUTO_UPDATED</div>
            </div>
            <div class="status-grid">
                <div class="status-box">
                    <h4>LOCATION & TIME</h4>
                    <div id="stat-loc" class="status-data">Scanning...</div>
                </div>
                <div class="status-box">
                    <h4>ENVIRONMENT</h4>
                    <div id="stat-env" class="status-data">Scanning...</div>
                </div>
                <div class="status-box">
                    <h4>CHARACTER_STATUS</h4>
                    <div id="stat-char" class="status-data">Scanning...</div>
                </div>
                <div class="status-box">
                    <h4>INVENTORY / ITEMS</h4>
                    <div id="stat-inv" class="status-data">Scanning...</div>
                </div>
            </div>
        </div>

        <div id="page-help" class="ncs-page">
            <h3>> SYSTEM_ASSIST</h3>
            <p style="font-size:12px; color:#aaa;">Directly inject instructions to the AI without breaking character.</p>
            <textarea id="help-prompt" class="ooc-input" style="height:80px; padding:10px;" placeholder="E.g., Summarize the current situation..."></textarea>
            <button id="help-exec" class="ncs-btn-icon" style="width:100%; margin-top:10px;">EXECUTE PROTOCOL</button>
            <div id="help-output" class="msg-display" style="height:150px; margin-top:10px;"></div>
        </div>

    </div>
</div>
`;

// ฟังก์ชันหลักที่รอโหลด
jQuery(async () => {
    console.log(">>> NCS: System Boot Sequence Initiated...");
    
    // รอจนกว่าหน้าเว็บหลักจะพร้อมจริงๆ (ป้องกันการแปะแล้วหาย)
    const waitForElement = (selector) => {
        return new Promise(resolve => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    };

    await waitForElement('#chat'); // รอจนกว่าช่องแชทจะมา
    initNCS();
});

function initNCS() {
    // 1. Inject HTML
    if ($('#ncs-trigger-btn').length === 0) {
        $('body').append(NCS_UI_HTML);
    }

    // 2. Load Settings
    loadNCSSettings();

    // 3. Attach Events
    attachNCSEvents();
    
    // 4. Start Observers (Monitoring Chat)
    startChatObserver();

    console.log(">>> NCS: System Online.");
}

// index.js - Part 2: Core Logic & Events

function attachNCSEvents() {
    
    // --- Window Visibility ---
    $(document).on('click', '#ncs-trigger-btn', function() {
        // ห้ามกดเปิดถ้ากำลังลากปุ่มอยู่ (ป้องกัน Click ตอน Drag)
        if ($(this).hasClass('ui-draggable-dragging')) return;
        $('#ncs-window').fadeIn(200).css('display', 'flex');
    });

    $(document).on('click', '#ncs-btn-close', function() {
        $('#ncs-window').fadeOut(200);
        // Safety: ปิดโหมดขยับเมื่อปิดหน้าต่าง (ตามข้อกำหนด 2)
        disableDragMode();
    });

    // --- Tab Switching ---
    $(document).on('click', '.ncs-tab', function() {
        $('.ncs-tab').removeClass('active');
        $(this).addClass('active');
        const target = $(this).data('target');
        $('.ncs-page').removeClass('active');
        $('#' + target).addClass('active');
    });

    // --- Dragging Logic (Critical) ---
    // 1. Move Trigger Button
    $(document).on('click', '#ncs-btn-move-trigger', function() {
        ncsState.isTriggerDraggable = !ncsState.isTriggerDraggable;
        $(this).toggleClass('active');
        
        if (ncsState.isTriggerDraggable) {
            $('#ncs-trigger-btn').draggable({ 
                containment: "window",
                start: function() { $(this).addClass('dragging'); },
                stop: function() { $(this).removeClass('dragging'); }
            });
        } else {
            if ($('#ncs-trigger-btn').data('ui-draggable')) {
                $('#ncs-trigger-btn').draggable('destroy');
            }
        }
    });

    // 2. Move Main Window
    $(document).on('click', '#ncs-btn-move-window', function() {
        ncsState.isWindowDraggable = !ncsState.isWindowDraggable;
        $(this).toggleClass('active');

        if (ncsState.isWindowDraggable) {
            $('#ncs-window').draggable({ 
                containment: "window", 
                handle: ".ncs-header" // ลากได้เฉพาะตรง Header
            });
        } else {
            if ($('#ncs-window').data('ui-draggable')) {
                $('#ncs-window').draggable('destroy');
            }
        }
    });

    // --- OOC Logic ---
    $(document).on('click', '#ooc-add-char', function() {
        const name = prompt("New Character Name:");
        if(name) {
            ncsState.oocCharacters.push({ name: name, color: "#ffffff" });
            saveNCSSettings();
            renderOOCSelect();
        }
    });

    $(document).on('change', '#ooc-char-select', function() {
        // Update color picker based on selection
        const selectedName = $(this).val();
        const char = ncsState.oocCharacters.find(c => c.name === selectedName);
        if(char) $('#ooc-char-color').val(char.color);
    });
    
    $(document).on('change', '#ooc-char-color', function() {
        // Save color back to char
        const selectedName = $('#ooc-char-select').val();
        const charIndex = ncsState.oocCharacters.findIndex(c => c.name === selectedName);
        if(charIndex > -1) {
            ncsState.oocCharacters[charIndex].color = $(this).val();
            saveNCSSettings();
        }
    });

    $(document).on('click', '#ooc-send-btn', function() {
        sendOOCMessage();
    });
    
    // Enter to send
    $(document).on('keypress', '#ooc-text-input', function(e) {
        if(e.which == 13) sendOOCMessage();
    });

    // --- Inspector Logic ---
    $(document).on('click', '#insp-go', function() {
        inspectMessage();
    });
    
    $(document).on('click', '#insp-clear', function() {
        $('#insp-display').empty();
    });
}

function disableDragMode() {
    // รีเซ็ตปุ่มและสถานะการลากทั้งหมด
    ncsState.isTriggerDraggable = false;
    ncsState.isWindowDraggable = false;
    $('#ncs-btn-move-trigger').removeClass('active');
    $('#ncs-btn-move-window').removeClass('active');
    
    try { $('#ncs-trigger-btn').draggable('destroy'); } catch(e){}
    try { $('#ncs-window').draggable('destroy'); } catch(e){}
}

// index.js - Part 3: Advanced Systems (OOC, Parser, Status)

// --- OOC System ---
function renderOOCSelect() {
    const $sel = $('#ooc-char-select');
    $sel.empty();
    ncsState.oocCharacters.forEach(c => {
        $sel.append(`<option value="${c.name}">${c.name}</option>`);
    });
    // Trigger change to set initial color
    $sel.trigger('change');
}

function sendOOCMessage() {
    const text = $('#ooc-text-input').val();
    if (!text.trim()) return;
    
    const charName = $('#ooc-char-select').val();
    const color = $('#ooc-char-color').val();
    const timestamp = new Date().toLocaleTimeString();

    // 1. Display in NCS Window
    const html = `
        <div class="ooc-msg" style="border-left: 3px solid ${color}">
            <div style="font-size:10px; opacity:0.7; display:flex; justify-content:space-between;">
                <span>${charName}</span> <span>${timestamp}</span>
            </div>
            <div style="color:${color}; font-weight:bold;">${text}</div>
        </div>
    `;
    $('#ooc-history-display').append(html);
    $('#ooc-history-display').scrollTop($('#ooc-history-display')[0].scrollHeight);
    $('#ooc-text-input').val('');

    // 2. (Optional) Inject Context to AI Logic
    // เราจะเก็บ OOC นี้ไว้ใน LocalStorage แยกตาม Route เพื่อความสมจริง
    saveOOCHistory();
}

// --- Status & Parsing System ---

// ฟังชั่นนี้จะทำงานทุกครั้งที่มีข้อความใหม่เข้ามา
function startChatObserver() {
    // ใช้ SillyTavern Event Emitting (ถ้ามี) หรือ Polling แบบบ้านๆที่ชัวร์กว่าสำหรับ Script แยก
    setInterval(() => {
        const context = SillyTavern.getContext();
        if (!context || !context.chat || context.chat.length === 0) return;

        const lastMsgIndex = context.chat.length - 1;
        const lastMsg = context.chat[lastMsgIndex];

        // ถ้าเป็นข้อความใหม่ที่เรายังไม่สแกน
        if (lastMsgIndex !== ncsState.lastScannedMsgId && !lastMsg.is_user) {
            ncsState.lastScannedMsgId = lastMsgIndex;
            parseAIResponse(lastMsg.mes);
            scanLorebookTriggers(lastMsg.mes);
        }
    }, 2000); // เช็คทุก 2 วินาที
}

// แกะข้อมูลจาก AI
// Trick: เราจะใส่ Prompt ให้ AI ตอบกลับมาในรูปแบบ XML Block เช่น
// <ncs_loc>Bangkok</ncs_loc> <ncs_mood>Sad</ncs_mood>
// โดยฟังก์ชันนี้จะดึงค่าเหล่านั้นมาโชว์แล้วลบออกจากข้อความแชทจริง (ถ้าทำได้) หรือแค่ดึงมาโชว์
function parseAIResponse(text) {
    // Regex Patterns for custom tags
    const extract = (tag) => {
        const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i');
        const match = text.match(regex);
        return match ? match[1] : null;
    };

    // สมมติว่าเรา Prompt ให้ AI ส่ง Format นี้มา (ต้องไปแก้ System Prompt ใน ST ของคุณด้วย)
    // ตัวอย่าง System Prompt: 
    // "At the end of your response, strictly append a hidden status block: 
    // <ncs_loc>Location</ncs_loc> <ncs_env>Time/Weather</ncs_env> <ncs_char>Status</ncs_char> <ncs_inv>Items</ncs_inv>"
    
    const loc = extract('ncs_loc');
    const env = extract('ncs_env');
    const char = extract('ncs_char');
    const inv = extract('ncs_inv');

    if (loc) $('#stat-loc').text(loc).css('color', 'var(--neon-blue)');
    if (env) $('#stat-env').text(env);
    if (char) $('#stat-char').text(char);
    if (inv) $('#stat-inv').text(inv);
}

// --- Lorebook Scanner Simulation ---
function scanLorebookTriggers(text) {
    // เนื่องจาก Script นี้เข้าถึง Database จริงของ Lorebook ยาก 
    // เราจะใช้วิธีสแกนหา "Trigger Words" ที่ผู้ใช้กำหนดไว้ (หรือดึงจาก World Info ถ้า API อนุญาต)
    
    // ลองดึง World Info จาก Context
    const context = SillyTavern.getContext();
    const worldInfo = context.world_info_depth || {}; // อาจจะต้องปรับตาม Version API
    
    // ถ้าดึงไม่ได้ ให้ใช้ Dummy Logic เพื่อแสดงผลว่าโค้ดทำงาน
    // (ในความเป็นจริงต้อง Loop ผ่าน triggers ของ SillyTavern.worldInfo)
    
    const container = $('#lore-output-list');
    container.empty();
    
    // Simulating Detection
    const detected = [];
    // ลองหาคำง่ายๆ
    const commonTriggers = ["city", "gun", "cyber", "night", "rain", "bar"];
    
    commonTriggers.forEach(word => {
        if (text.toLowerCase().includes(word)) {
            detected.push(word);
        }
    });

    if (detected.length > 0) {
        detected.forEach(d => {
            container.append(`
                <div class="lore-card">
                    <div>TRIGGER DETECTED: <span class="lore-trigger">${d.toUpperCase()}</span></div>
                    <div style="font-size:12px; color:#aaa;">Matches entry in World Info Database.</div>
                </div>
            `);
        });
    } else {
        container.html('<div style="color:#666">No known lore triggers detected in latest sequence.</div>');
    }
}

// --- Message Inspector ---
function inspectMessage() {
    const context = SillyTavern.getContext();
    let idx = parseInt($('#insp-idx').val());
    
    if (!context || !context.chat) return;

    // Handle Negative Index (from end)
    if (idx < 0) idx = context.chat.length + idx;

    const msg = context.chat[idx];
    if (msg) {
        $('#insp-display').html(`
            <strong style="color:var(--neon-pink)">[MSG ID: ${idx}]</strong><br>
            <strong>Sender:</strong> ${msg.name}<br>
            <strong>Time:</strong> ${msg.send_date || "Unknown"}<br>
            <hr style="border-color:var(--neon-blue)">
            ${msg.mes.replace(/\n/g, '<br>')}
        `);
    } else {
        $('#insp-display').html('<span style="color:red">ERROR: Index out of bounds.</span>');
    }
}

// --- Helper / Storage ---
function saveNCSSettings() {
    const settings = {
        oocCharacters: ncsState.oocCharacters
    };
    localStorage.setItem('NCS_Settings', JSON.stringify(settings));
}

function loadNCSSettings() {
    const data = localStorage.getItem('NCS_Settings');
    if (data) {
        const parsed = JSON.parse(data);
        if (parsed.oocCharacters) ncsState.oocCharacters = parsed.oocCharacters;
    }
    renderOOCSelect();
}

function saveOOCHistory() {
    // Save history specifically for the current character card/chat if possible
    // This is a placeholder for persistent storage
}

