
// index.js - Consolidated Version

const extensionName = "NeonCyberpunkSystem";
const extensionPath = `scripts/extensions/third-party/${extensionName}`;

// Global State
let isDraggableWindow = false;
let isDraggableTrigger = false;
let oocCharacters = ["GM", "System"]; 
let currentRoute = "default";

jQuery(async () => {
    // 1. Log เพื่อเช็คว่าไฟล์โหลดขึ้นมาจริงไหม (ดูใน F12 Console)
    console.log(">>> Neon Cyberpunk System: Loading...");

    // 2. ฟังก์ชันสร้าง UI
    const buildUI = () => {
        // เช็คก่อนว่ามีปุ่มอยู่แล้วไหม ป้องกันการสร้างซ้ำ
        if ($('#cyber-trigger-btn').length > 0) return;

        const uiHTML = `
        <div id="cyber-trigger-btn" title="Open System">X</div>

        <div id="cyber-main-window" style="display:none;">
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
                    <div id="ooc-history" class="ooc-history" style="height: 200px; overflow-y:auto; border:1px solid #333; margin-bottom:10px;"></div>
                    <div class="ooc-input-area" style="display:flex; gap:5px;">
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
                        <div class="status-box"><h4>LOCATION</h4><div id="status-location">Scanning...</div></div>
                        <div class="status-box"><h4>TIME/ENV</h4><div id="status-env">Scanning...</div></div>
                        <div class="status-box"><h4>CHAR_STATUS</h4><div id="status-char">Scanning...</div></div>
                        <div class="status-box"><h4>INVENTORY</h4><div id="status-inv">Scanning...</div></div>
                    </div>
                </div>

                <div id="page-help" class="cyber-page">
                    <h3>> AI_ASSIST</h3>
                    <textarea id="helper-prompt" style="width:100%; height:80px; background:black; color:white;" placeholder="Request summary or action..."></textarea>
                    <button id="helper-run" class="cyber-btn-icon" style="width:100%; margin-top:10px;">EXECUTE_QUERY</button>
                    <div id="helper-output" style="margin-top:10px; border-top:1px solid var(--cp-pink); padding-top:10px;"></div>
                </div>
            </div>
        </div>`;
        
        $('body').append(uiHTML);
        console.log(">>> Neon Cyberpunk System: UI Appended!");
        
        loadSettings();
        renderOOCSelect();
    };

    // รอเล็กน้อยเพื่อให้ ST โหลดเสร็จก่อนค่อยสร้าง UI
    setTimeout(buildUI, 2000);

    // ================= EVENTS & LOGIC ================= //

    // 1. Open/Close
    $(document).on('click', '#cyber-trigger-btn', function() {
        $('#cyber-main-window').fadeIn(200).css('display', 'flex');
        isDraggableWindow = false;
        $('#btn-move-window').removeClass('active');
    });

    $(document).on('click', '#btn-close-window', function() {
        $('#cyber-main-window').fadeOut(200);
        isDraggableWindow = false;
        isDraggableTrigger = false;
        $('#btn-move-window').removeClass('active');
        $('#btn-move-trigger').removeClass('active');
        try { $('#cyber-main-window').draggable('destroy'); } catch(e){} 
        try { $('#cyber-trigger-btn').draggable('destroy'); } catch(e){}
    });

    // 2. Tabs
    $(document).on('click', '.cyber-nav-tab', function() {
        $('.cyber-nav-tab').removeClass('active');
        $(this).addClass('active');
        const targetId = $(this).data('target');
        $('.cyber-page').removeClass('active');
        $('#' + targetId).addClass('active');
    });

    // 3. Dragging Logic
    $(document).on('click', '#btn-move-window', function() {
        isDraggableWindow = !isDraggableWindow;
        $(this).toggleClass('active');
        if (isDraggableWindow) {
            $('#cyber-main-window').draggable({ containment: "window" });
        } else {
            try { $('#cyber-main-window').draggable('destroy'); } catch(e){}
        }
    });

    $(document).on('click', '#btn-move-trigger', function() {
        isDraggableTrigger = !isDraggableTrigger;
        $(this).toggleClass('active');
        if (isDraggableTrigger) {
            $('#cyber-trigger-btn').draggable({ containment: "window" });
        } else {
            try { $('#cyber-trigger-btn').draggable('destroy'); } catch(e){}
        }
    });

    // 4. OOC Logic
    $(document).on('click', '#ooc-send', function() {
        const text = $('#ooc-input').val();
        const charName = $('#ooc-char-select').val() || "User";
        const color = $('#ooc-color-picker').val();
        if (!text) return;

        const html = `<div class="ooc-bubble" style="border-left: 3px solid ${color}; background:rgba(255,255,255,0.1); padding:5px; margin-bottom:5px;">
            <strong style="color:${color}">${charName}:</strong> ${text}
        </div>`;
        $('#ooc-history').append(html);
        $('#ooc-input').val('');
        document.getElementById('ooc-history').scrollTop = 99999;
    });

    $(document).on('click', '#ooc-add-char', function() {
        const name = prompt("Enter Character Name:");
        if (name) {
            oocCharacters.push(name);
            renderOOCSelect();
            saveSettings();
        }
    });

    // 5. Inspector Logic
    $(document).on('click', '#inspector-go', function() {
        // ใช้ SillyTavern.getContext() เพื่อดึงแชทปัจจุบัน
        const context = SillyTavern.getContext();
        const index = parseInt($('#inspector-index').val());
        
        if (!context || !context.chat || isNaN(index) || index < 0 || index >= context.chat.length) {
            $('#inspector-display').html('<span style="color:red">Error: Invalid Index or No Chat Loaded</span>');
            return;
        }

        const msg = context.chat[index];
        $('#inspector-display').html(`
            <strong>Name:</strong> ${msg.name} <br>
            <hr>
            ${msg.mes}
        `);
    });

    $(document).on('click', '#inspector-clear', function() {
        $('#inspector-display').html('');
    });

}); // End jQuery Ready

// ================= FUNCTIONS ================= //

function renderOOCSelect() {
    let opts = '<option value="User">User</option>';
    oocCharacters.forEach(c => {
        opts += `<option value="${c}">${c}</option>`;
    });
    $('#ooc-char-select').html(opts);
}

function saveSettings() {
    localStorage.setItem('CyberExtensionSettings', JSON.stringify({ oocCharacters }));
}

function loadSettings() {
    const data = localStorage.getItem('CyberExtensionSettings');
    if (data) {
        const parsed = JSON.parse(data);
        if(parsed.oocCharacters) oocCharacters = parsed.oocCharacters;
    }
}
