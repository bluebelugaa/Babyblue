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
