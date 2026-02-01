
// index.js - Part 1: Structure & Setup

const extensionName = "NeonCyberpunkSystem";
const extensionPath = `scripts/extensions/third-party/${extensionName}`;

// Global State
let isDraggableWindow = false;
let isDraggableTrigger = false;
let oocCharacters = []; // { name: "GM", color: "#ff00ff" }
let currentRoute = "default";

jQuery(async () => {
    // รอให้หน้าเว็บโหลดเสร็จ
    const buildUI = () => {
        const uiHTML = `
        <div id="cyber-trigger-btn" title="Open System">X</div>

        <div id="cyber-main-window">
            <div class="cyber-header">
                <div style="font-weight:bold; color:var(--cp-blue)">SYSTEM_V.1.0</div>
                <div class="cyber-controls">
                    <button id="btn-move-trigger" class="cyber-btn-icon" title="Allow Move Trigger">T</button>
                    <button id="btn-move-window" class="cyber-btn-icon" title="Allow Move Window">W</button>
                    <button id="btn-close-window" class="cyber-btn-icon cyber-btn-close" title="Close">X</button>
                </div>
            </div>

            <div class="cyber-nav-container">
                <div class="cyber-nav-tab active" data-target="page-lore">Lorebook</div>
                <div class="cyber-nav-tab" data-target="page-inspector">Inspect</div>
                <div class="cyber-nav-tab" data-target="page-ooc">OOC Chat</div>
                <div class="cyber-nav-tab" data-target="page-status">Status</div>
                <div class="cyber-nav-tab" data-target="page-help">Helper</div>
            </div>

            <div class="cyber-content">
                
                <div id="page-lore" class="cyber-page active">
                    <h3>> LORE_SCANNER</h3>
                    <div id="lore-content-list">Waiting for interaction...</div>
                </div>

                <div id="page-inspector" class="cyber-page">
                    <h3>> MSG_INSPECTOR</h3>
                    <div>
                        <input type="number" id="inspector-index" class="msg-inspector-input" placeholder="#">
                        <button class="cyber-btn-icon" id="inspector-go">GO</button>
                        <button class="cyber-btn-icon cyber-btn-close" id="inspector-clear">CLR</button>
                    </div>
                    <div id="inspector-display" class="msg-display-area"></div>
                </div>

                <div id="page-ooc" class="cyber-page">
                    <h3>> OOC_CHANNEL</h3>
                    <div id="ooc-history" class="ooc-history"></div>
                    <div class="ooc-input-area">
                        <select id="ooc-char-select" class="ooc-char-select"></select>
                        <input type="color" id="ooc-color-picker" value="#00ffff" style="width:30px; border:none;">
                        <input type="text" id="ooc-input" style="flex:1; background:black; color:white; border:1px solid var(--cp-blue);" placeholder="Commentary...">
                        <button id="ooc-send" class="cyber-btn-icon">></button>
                        <button id="ooc-add-char" class="cyber-btn-icon" title="Add/Save Character">+</button>
                    </div>
                </div>

                <div id="page-status" class="cyber-page">
                    <h3>> WORLD_STATE</h3>
                    <div class="status-grid">
                        <div class="status-box">
                            <h4>LOCATION</h4>
                            <div id="status-location">Scanning...</div>
                        </div>
                        <div class="status-box">
                            <h4>TIME/ENV</h4>
                            <div id="status-env">Scanning...</div>
                        </div>
                        <div class="status-box">
                            <h4>CHAR_STATUS</h4>
                            <div id="status-char">Scanning...</div>
                        </div>
                        <div class="status-box">
                            <h4>INVENTORY</h4>
                            <div id="status-inv">Scanning...</div>
                        </div>
                    </div>
                </div>

                <div id="page-help" class="cyber-page">
                    <h3>> AI_ASSIST</h3>
                    <textarea id="helper-prompt" style="width:100%; height:100px; background:black; color:white;" placeholder="Request summary or action..."></textarea>
                    <button id="helper-run" class="cyber-btn-icon" style="width:100%; margin-top:10px;">EXECUTE_QUERY</button>
                    <div id="helper-output" style="margin-top:10px; border-top:1px solid var(--cp-pink); padding-top:10px;"></div>
                </div>

            </div>
        </div>
        `;
        
        $('body').append(uiHTML);
        
        // Load settings if any
        loadSettings();
    };

    // Delay init to ensure ST core is ready
    setTimeout(buildUI, 2000);
});

// index.js - Part 2: Interaction Logic

jQuery(document).on('click', '#cyber-trigger-btn', function() {
    $('#cyber-main-window').fadeIn(200).css('display', 'flex');
    // Safety: Ensure draggable is OFF when opening newly
    isDraggableWindow = false;
    $('#btn-move-window').removeClass('active');
});

jQuery(document).on('click', '#btn-close-window', function() {
    $('#cyber-main-window').fadeOut(200);
    
    // Rule 2 & 3: Reset dragging states on close to prevent locking
    isDraggableWindow = false;
    isDraggableTrigger = false;
    $('#btn-move-window').removeClass('active');
    $('#btn-move-trigger').removeClass('active');
    
    // Remove draggable functionality temporarily
    $('#cyber-main-window').draggable('destroy'); 
    $('#cyber-trigger-btn').draggable('destroy');
});

// Tab Navigation
jQuery(document).on('click', '.cyber-nav-tab', function() {
    $('.cyber-nav-tab').removeClass('active');
    $(this).addClass('active');
    
    const targetId = $(this).data('target');
    $('.cyber-page').removeClass('active');
    $('#' + targetId).addClass('active');
});

// Drag Logic - Window
jQuery(document).on('click', '#btn-move-window', function() {
    isDraggableWindow = !isDraggableWindow;
    $(this).toggleClass('active');
    
    if (isDraggableWindow) {
        $('#cyber-main-window').draggable({
            containment: "window",
            stop: function() { /* Optional: Save position */ }
        });
    } else {
        try { $('#cyber-main-window').draggable('destroy'); } catch(e){}
    }
});

// Drag Logic - Trigger Button
jQuery(document).on('click', '#btn-move-trigger', function() {
    isDraggableTrigger = !isDraggableTrigger;
    $(this).toggleClass('active');
    
    if (isDraggableTrigger) {
        $('#cyber-trigger-btn').draggable({
            containment: "window"
        });
    } else {
        try { $('#cyber-trigger-btn').draggable('destroy'); } catch(e){}
    }
});

// index.js - Part 3: Lore & Inspector

// --- Lorebook Scanner ---
// เรียกฟังก์ชันนี้ทุกครั้งที่มีข้อความใหม่เข้ามา
function updateLoreDisplay() {
    const context = SillyTavern.getContext(); // Get current chat context
    const lastMes = context.chat[context.chat.length - 1];
    if (!lastMes) return;

    let detectedLore = [];
    const lorebook = SillyTavern.game_objects.lorebook; // Access ST Lorebook

    if (lorebook && lorebook.entries) {
        // ตรวจสอบอย่างง่าย: ดูว่า key ของ lore โผล่ในข้อความล่าสุดไหม
        for (let key in lorebook.entries) {
            let entry = lorebook.entries[key];
            if (!entry.enabled) continue;

            let keywords = entry.key.split(',').map(s => s.trim());
            let triggeredKeywords = [];
            
            keywords.forEach(kw => {
                if (lastMes.mes.toLowerCase().includes(kw.toLowerCase())) {
                    triggeredKeywords.push(kw);
                }
            });

            if (triggeredKeywords.length > 0) {
                detectedLore.push({
                    name: entry.comment || entry.uid, // Name of entry
                    triggers: triggeredKeywords
                });
            }
        }
    }

    // Render Logic
    let html = '';
    if (detectedLore.length === 0) {
        html = '<div class="lb-entry">No active Lorebook triggers in last message.</div>';
    } else {
        detectedLore.forEach(item => {
            html += `
            <div class="lb-entry">
                <strong>[ENTRY]:</strong> ${item.name}<br>
                <strong>[TRIGGER]:</strong> <span class="lb-trigger">${item.triggers.join(', ')}</span>
            </div>`;
        });
    }
    $('#lore-content-list').html(html);
}

// --- Message Inspector ---
jQuery(document).on('click', '#inspector-go', function() {
    const index = parseInt($('#inspector-index').val());
    const context = SillyTavern.getContext();
    
    if (isNaN(index) || index < 0 || index >= context.chat.length) {
        $('#inspector-display').html('<span style="color:red">ERROR: Invalid Index</span>');
        return;
    }

    const msg = context.chat[index];
    const displayHtml = `
        <strong>ID:</strong> ${index} <br>
        <strong>Sender:</strong> ${msg.name} <br>
        <hr style="border-color:var(--cp-pink)">
        ${msg.mes}
        <button class="cyber-btn-icon cyber-btn-close" style="float:right; margin-top:10px;" onclick="$(this).parent().html('')">X</button>
    `;
    $('#inspector-display').html(displayHtml);
});

jQuery(document).on('click', '#inspector-clear', function() {
    $('#inspector-index').val('');
    $('#inspector-display').html('');
});

// index.js - Part 4: Deep Integration Logic

// 1. Inject Instructions into the Prompt
// Hook into SillyTavern's prompt generation
const SYSTEM_INJECTION = `
\n\n[SYSTEM INSTRUCTION: HIDDEN STATE UPDATE]
At the VERY END of your response, strictly purely output a JSON block wrapped in triple backticks like this:
\`\`\`json
{
  "world_update": {
    "location": "Current location name and short description",
    "time_weather": "Time, Season, Weather, Temperature",
    "char_status": "Name, Health, Outfit, Action, Mood",
    "inventory": "Key items currently held or gained"
  },
  "ooc_commentary": {
    "speaker": "AI_Role",
    "message": "Short casual comment about the situation as a roleplay partner."
  }
}
\`\`\`
Ensure valid JSON. Do not write anything after this block.
`;

// Hook เพื่อยัด prompt ก่อนส่งหา AI
// หมายเหตุ: การ Hook ใน ST อาจต้องใช้ extension API เฉพาะ
// ในที่นี้เราจะจำลองด้วยการใช้ event 'generation_started' (Concept)
// วิธีที่ง่ายกว่าสำหรับ User คือใส่ Prompt นี้ลงใน "Author's Note" หรือ "Main Prompt" ถาวร
// แต่ถ้าทำผ่านโค้ด:
/* SillyTavern.extension_prompt_types.push((prompt) => {
        return prompt + SYSTEM_INJECTION;
    });
*/

// 2. Parse the Response (ดักจับ JSON และซ่อนมัน)
// เราต้องฟัง Event เมื่อข้อความเข้ามา
async function onMessageReceived(data) {
    if (!data || !data.mes) return;

    let content = data.mes;
    const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
    const match = content.match(jsonRegex);

    if (match) {
        try {
            const rawJson = match[1];
            const parsed = JSON.parse(rawJson);
            
            // Update UI
            updateWorldStatus(parsed.world_update);
            updateOOCChat(parsed.ooc_commentary);

            // Remove JSON from visible chat (Clean up the UI)
            // หมายเหตุ: การแก้ข้อความใน ST ต้องเรียก API แก้ไขข้อความ
            // แต่เพื่อความปลอดภัย เราอาจแค่ซ่อนใน UI ของ Extension เรา
            // หรือถ้าจะลบจาก Chat Log จริงๆ:
            const cleanContent = content.replace(match[0], '').trim();
            // Call ST API to update the message content (Advanced)
            // SillyTavern.updateMessage(data.index, cleanContent); 
            
            console.log("CyberSystem: State Updated Successfully");

        } catch (e) {
            console.error("CyberSystem: JSON Parse Error", e);
        }
    }
    
    // Trigger Lorebook update as well
    updateLoreDisplay();
}

// Hook into ST Event Source
if (typeof eventSource !== 'undefined') {
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.CHAT_CHANGED, () => {
        // Reset or Reload data for new chat
        $('#ooc-history').html(''); 
        updateLoreDisplay();
    });
}

// UI Updaters
function updateWorldStatus(data) {
    if (!data) return;
    $('#status-location').text(data.location || "Unknown");
    $('#status-env').text(data.time_weather || "Unknown");
    $('#status-char').text(data.char_status || "Unknown");
    $('#status-inv').text(data.inventory || "None");
}

function updateOOCChat(data) {
    if (!data) return;
    const color = "#00ffff"; // Default AI color
    const html = `
        <div class="ooc-bubble" style="border-left: 3px solid ${color}; background:rgba(0,255,255,0.1);">
            <strong style="color:${color}">${data.speaker}:</strong> ${data.message}
        </div>
    `;
    $('#ooc-history').append(html);
    // Auto scroll down
    const historyDiv = document.getElementById('ooc-history');
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

                        
// index.js - Part 5: OOC User Input & Helper

// --- OOC User Input ---
jQuery(document).on('click', '#ooc-send', function() {
    const text = $('#ooc-input').val();
    const charName = $('#ooc-char-select').val() || "User";
    const color = $('#ooc-color-picker').val();

    if (!text) return;

    const html = `
        <div class="ooc-bubble" style="border-left: 3px solid ${color}; background:rgba(255,255,255,0.1);">
            <strong style="color:${color}">${charName}:</strong> ${text}
        </div>
    `;
    $('#ooc-history').append(html);
    $('#ooc-input').val('');
    
    // Auto scroll
    const historyDiv = document.getElementById('ooc-history');
    historyDiv.scrollTop = historyDiv.scrollHeight;

    // TODO: Ideally save this history to localStorage linked to the chat ID
});

// Add Character to OOC
jQuery(document).on('click', '#ooc-add-char', function() {
    const name = prompt("Enter Character Name for OOC:");
    if (name) {
        oocCharacters.push(name);
        renderOOCSelect();
        saveSettings();
    }
});

function renderOOCSelect() {
    let opts = '<option value="User">User</option>';
    oocCharacters.forEach(c => {
        opts += `<option value="${c}">${c}</option>`;
    });
    $('#ooc-char-select').html(opts);
}

// --- Helper Module ---
jQuery(document).on('click', '#helper-run', async function() {
    const promptText = $('#helper-prompt').val();
    if (!promptText) return;

    $('#helper-output').text("Processing... (Waiting for AI)");

    // Use SillyTavern's generation API (Quiet generation)
    // generateQuiet(prompt, callback, ...)
    try {
        const result = await SillyTavern.generateQuiet(promptText);
        $('#helper-output').text(result);
    } catch (e) {
        $('#helper-output').text("Error executing helper: " + e);
    }
});

// --- Settings Persistence ---
function saveSettings() {
    const settings = {
        oocCharacters: oocCharacters
    };
    localStorage.setItem('CyberExtensionSettings', JSON.stringify(settings));
}

function loadSettings() {
    const data = localStorage.getItem('CyberExtensionSettings');
    if (data) {
        const parsed = JSON.parse(data);
        oocCharacters = parsed.oocCharacters || [];
        renderOOCSelect();
    }
}
