// =================================================================
// CHRONOS NEXUS - Ultimate Extension
// Version: 2.1 (Separated Logic)
// =================================================================

(function () {
    // --- 1. CONFIGURATION & STATE ---
    const EXTENSION_NAME = "Chronos_Nexus_V2";
    
    let config = {
        stripCode: true,      // เปิดระบบตัดโค้ดเริ่มต้น
        orbLocked: true,      // ล็อคลูกแก้ว
        panelLocked: true     // ล็อคหน้าต่าง
    };

    // --- 2. UI GENERATION (สร้างลูกแก้ว & หน้าต่าง) ---
    function createUI() {
        // ป้องกันการสร้างซ้ำ
        if (document.getElementById('chronos-orb')) return;

        // 1. สร้างลูกแก้ว
        const orb = document.createElement('div');
        orb.id = 'chronos-orb';
        orb.innerHTML = '🌀'; 
        orb.title = "Open Chronos Nexus";
        document.body.appendChild(orb);

        // 2. สร้างหน้าต่าง Panel
        const panel = document.createElement('div');
        panel.id = 'chronos-panel';
        panel.innerHTML = `
            <div class="c-header" id="c-drag-header">
                <span>CHRONOS SYSTEM</span>
                <span id="c-close-btn" style="cursor:pointer; color:#ff3366;">[X]</span>
            </div>
            <div class="c-body">
                <div class="c-row">
                    <div style="font-weight:bold; color:#fff;">🛡️ PROMPT GUARD</div>
                    <label class="c-toggle" style="margin-top:5px;">
                        <input type="checkbox" class="c-checkbox" id="chk-strip" ${config.stripCode ? 'checked' : ''}>
                        <span>Auto-Strip HTML/Code</span>
                    </label>
                    <div style="font-size:9px; color:#888; margin-top:2px;">
                        Prevent sending raw HTML tags to AI.
                    </div>
                </div>

                <div class="c-row">
                    <div style="font-weight:bold; color:#fff;">📘 LOREBOOK MONITOR</div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                        <span>Active Entries:</span>
                        <span id="c-lore-count" style="color:#fff; font-weight:bold;">0</span>
                    </div>
                    <button class="c-btn" id="btn-scan" style="width:100%; margin-top:5px;">Manual Scan</button>
                </div>

                <div class="c-row">
                    <div style="font-weight:bold; color:#fff;">⚙️ INTERFACE</div>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <button class="c-btn" id="btn-unlock-orb">Move Orb</button>
                        <button class="c-btn" id="btn-unlock-panel">Move Panel</button>
                    </div>
                </div>

                <div style="font-weight:bold; color:#fff; font-size:10px;">SYSTEM LOGS:</div>
                <div class="c-log-box" id="c-logs">
                    <div class="log-entry">System Initialized...</div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // --- Event Listeners ---
        setupEvents(orb, panel);
    }

    // --- 3. LOGIC & EVENTS ---
    function setupEvents(orb, panel) {
        // เปิด/ปิด หน้าต่าง
        let isDraggingOrb = false;
        orb.addEventListener('click', () => {
            if (!isDraggingOrb && config.orbLocked) {
                panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
            }
        });

        document.getElementById('c-close-btn').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        // Toggle Strip Code
        document.getElementById('chk-strip').addEventListener('change', (e) => {
            config.stripCode = e.target.checked;
            logSystem(`Prompt Guard: ${config.stripCode ? 'ON' : 'OFF'}`);
        });

        // Manual Scan Button
        document.getElementById('btn-scan').addEventListener('click', () => {
            logSystem("Scanning Lorebook...");
            scanLorebook();
        });

        // Lock/Unlock Buttons
        const btnOrb = document.getElementById('btn-unlock-orb');
        const btnPanel = document.getElementById('btn-unlock-panel');

        btnOrb.addEventListener('click', () => {
            config.orbLocked = !config.orbLocked;
            btnOrb.classList.toggle('active');
            btnOrb.innerText = config.orbLocked ? "Unlock Orb" : "Lock Orb";
            orb.style.cursor = config.orbLocked ? 'pointer' : 'move';
            orb.style.animationPlayState = config.orbLocked ? 'running' : 'paused'; 
        });

        btnPanel.addEventListener('click', () => {
            config.panelLocked = !config.panelLocked;
            btnPanel.classList.toggle('active');
            btnPanel.innerText = config.panelLocked ? "Unlock Win" : "Lock Win";
        });

        // Draggable Logic
        makeDraggable(orb, () => !config.orbLocked, (s) => isDraggingOrb = s);
        makeDraggable(panel, () => !config.panelLocked, null, document.getElementById('c-drag-header'));
    }

    // --- 4. CORE FUNCTIONS (Stripper & Lorebook) ---

    function sanitizePayload(data) {
        if (!config.stripCode) return data;

        const startLength = JSON.stringify(data).length;
        
        // Helper ในการลบ HTML tags
        const stripText = (text) => {
            if (!text) return "";
            let clean = text.replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<\/p>/gi, '\n')
                            .replace(/<\/div>/gi, '\n')
                            .replace(/<[^>]+>/g, ''); // ลบ tag ที่เหลือ
            clean = clean.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            return clean.trim();
        };

        if (data.body) {
            if (data.body.prompt && typeof data.body.prompt === 'string') {
                data.body.prompt = stripText(data.body.prompt);
            }
            if (data.body.messages && Array.isArray(data.body.messages)) {
                data.body.messages.forEach(msg => {
                    if (msg.content) {
                        msg.content = stripText(msg.content);
                    }
                });
            }
        }

        const endLength = JSON.stringify(data).length;
        if (startLength - endLength > 0) {
            logSystem(`✂️ Stripped ${startLength - endLength} chars.`);
        }
        return data;
    }

    function scanLorebook() {
        let count = 0;
        if (typeof SillyTavern !== 'undefined' && SillyTavern.world_info) {
            const entries = Object.values(SillyTavern.world_info);
            count = entries.length; 
        }
        document.getElementById('c-lore-count').innerText = count;
        if (count > 0) logSystem(`Found ${count} WI entries.`);
        else logSystem("No WI found/API unavailable.");
    }

    function logSystem(msg) {
        const box = document.getElementById('c-logs');
        if (box) {
            const time = new Date().toLocaleTimeString().split(' ')[0];
            box.innerHTML += `<div class="log-entry"><span>[${time}]</span> ${msg}</div>`;
            box.scrollTop = box.scrollHeight;
        }
    }

    function makeDraggable(el, checkUnlock, callback, handle = el) {
        let pos1=0, pos2=0, pos3=0, pos4=0;
        handle.onmousedown = dragStart;
        handle.ontouchstart = dragStart;

        function dragStart(e) {
            if (!checkUnlock()) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            pos3 = clientX; pos4 = clientY;
            document.onmouseup = closeDrag; document.ontouchend = closeDrag;
            document.onmousemove = elementDrag; document.ontouchmove = elementDrag;
            if(callback) callback(true);
        }

        function elementDrag(e) {
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            pos1 = pos3 - clientX; pos2 = pos4 - clientY;
            pos3 = clientX; pos4 = clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
            el.style.transform = "none";
        }

        function closeDrag() {
            document.onmouseup = null; document.onmousemove = null;
            document.ontouchend = null; document.ontouchmove = null;
            if(callback) setTimeout(() => callback(false), 100);
        }
    }

    // --- 5. STARTUP ---
    function init() {
        console.log(`[${EXTENSION_NAME}] Initializing...`);
        createUI();

        if (typeof SillyTavern !== 'undefined' && SillyTavern.extension_manager) {
            SillyTavern.extension_manager.register_hook('chat_completion_request', sanitizePayload);
            SillyTavern.extension_manager.register_hook('text_completion_request', sanitizePayload);
            logSystem("Stripper Hook Registered.");
        } else {
            logSystem("⚠️ UI Only Mode");
        }
    }

    setTimeout(init, 2000);

})();
