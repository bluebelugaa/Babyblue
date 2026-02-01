
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
