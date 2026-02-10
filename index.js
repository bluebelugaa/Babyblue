// =================================================================
// CHRONOS NEXUS - HYBRID LOGIC
// Compatible with: Style V80
// Features: Code Stripper, Lorebook Monitor, Draggable UI
// =================================================================

(function () {
    const EXTENSION_NAME = "Chronos_Hybrid_V80";

    // --- 1. CONFIGURATION ---
    let config = {
        stripCode: true,      // เปิดใช้งาน Code Stripper อัตโนมัติ
        orbLocked: true,      // ล็อคตำแหน่งลูกแก้ว
        panelLocked: true     // ล็อคตำแหน่งหน้าต่าง
    };

    let state = {
        loreCount: 0,
        savedTokens: 0
    };

    // --- 2. UI GENERATION (สร้าง HTML) ---
    function createUI() {
        if (document.getElementById('chronos-orb')) return;

        // สร้างลูกแก้ว
        const orb = document.createElement('div');
        orb.id = 'chronos-orb';
        orb.innerHTML = '🌀'; 
        orb.title = "Open Chronos";
        document.body.appendChild(orb);

        // สร้างหน้าต่างควบคุม (Structure ตาม Style V80)
        const panel = document.createElement('div');
        panel.id = 'chronos-panel';
        panel.innerHTML = `
            <div class="c-header" id="c-drag-area">
                <span>🚀 CHRONOS V80</span>
                <span id="c-close" style="cursor:pointer; color:#ff4081; font-size:14px;">✖</span>
            </div>
            
            <div class="c-controls">
                <div class="switch-wrapper">
                    <label class="neon-switch">
                        <input type="checkbox" id="chk-unlock-orb">
                        <span class="slider"></span>
                    </label>
                    <span class="switch-label">Orb</span>
                </div>
                <div class="switch-wrapper">
                    <label class="neon-switch">
                        <input type="checkbox" id="chk-unlock-panel">
                        <span class="slider"></span>
                    </label>
                    <span class="switch-label">Win</span>
                </div>
            </div>

            <div class="c-body">
                
                <div class="dash-row">
                    <div style="display:flex; flex-direction:column;">
                        <span style="color:#fff; font-weight:bold;">🛡️ PROMPT GUARD</span>
                        <span style="font-size:9px; color:#aaa;">Auto-strip HTML/Code</span>
                    </div>
                    <label class="neon-switch">
                        <input type="checkbox" id="chk-stripper" checked>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="dash-row">
                    <span style="color:#ccc;">🔋 Tokens Saved</span>
                    <span class="dash-val" id="disp-saved">0</span>
                </div>

                <div class="dash-row">
                    <span style="color:#ccc;">📘 Active Lorebook</span>
                    <span class="dash-val green" id="disp-lore">0</span>
                </div>

                <button class="c-btn" id="btn-scan">Manual Scan Lorebook</button>

                <div class="c-logs" id="c-logs">
                    <div class="log-item"><span>[SYS]</span> System Initialized...</div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        setupEvents(orb, panel);
    }

    // --- 3. LOGIC & EVENTS ---
    function setupEvents(orb, panel) {
        let isDragging = false;

        // 1. เปิด/ปิด หน้าต่าง
        orb.addEventListener('click', () => {
            if (!isDragging && config.orbLocked) {
                // เอฟเฟกต์ Toggle
                if (panel.style.display === 'flex') {
                    panel.style.display = 'none';
                } else {
                    panel.style.display = 'flex';
                    scanLorebook(); // สแกนทันทีที่เปิด
                }
            }
        });

        document.getElementById('c-close').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        // 2. สวิตช์ปลดล็อค: ORB
        document.getElementById('chk-unlock-orb').addEventListener('change', (e) => {
            config.orbLocked = !e.target.checked; // checked = unlocked
            if (!config.orbLocked) {
                orb.classList.add('unlocked');
            } else {
                orb.classList.remove('unlocked');
            }
        });

        // 3. สวิตช์ปลดล็อค: WINDOW
        document.getElementById('chk-unlock-panel').addEventListener('change', (e) => {
            config.panelLocked = !e.target.checked;
            const header = document.getElementById('c-drag-area');
            header.style.cursor = config.panelLocked ? 'default' : 'move';
        });

        // 4. สวิตช์: Prompt Guard (Stripper)
        document.getElementById('chk-stripper').addEventListener('change', (e) => {
            config.stripCode = e.target.checked;
            log(`Prompt Guard: ${config.stripCode ? 'ON' : 'OFF'}`);
        });

        // 5. ปุ่ม Manual Scan
        document.getElementById('btn-scan').addEventListener('click', () => {
            log("Scanning Lorebook...");
            scanLorebook();
        });

        // 6. ระบบลากวาง (Draggable)
        makeDraggable(orb, () => !config.orbLocked, (s) => isDragging = s);
        makeDraggable(panel, () => !config.panelLocked, null, document.getElementById('c-drag-area'));
    }

    // --- 4. CORE FUNCTIONS (Code Stripper) ---
    function sanitizePayload(data) {
        if (!config.stripCode) return data;

        const stripText = (text) => {
            if (!text) return "";
            return text.replace(/<[^>]+>/g, '') // ลบ HTML Tags
                       .replace(/&lt;/g, '<').replace(/&gt;/g, '>') // แปลงตัวอักษรพิเศษกลับ
                       .trim();
        };

        const originalLen = JSON.stringify(data).length;

        // ตรวจสอบโครงสร้างข้อมูล SillyTavern
        if (data.body) {
            // กรณี Prompt เดี่ยว
            if (data.body.prompt && typeof data.body.prompt === 'string') {
                data.body.prompt = stripText(data.body.prompt);
            }
            // กรณี Messages List (Chat Completion)
            if (data.body.messages && Array.isArray(data.body.messages)) {
                data.body.messages.forEach(msg => {
                    if (msg.content) msg.content = stripText(msg.content);
                });
            }
        }

        const newLen = JSON.stringify(data).length;
        const saved = originalLen - newLen;
        
        if (saved > 0) {
            state.savedTokens += saved;
            updateUIStats();
            log(`✂️ Stripped ${saved} chars`);
        }

        return data;
    }

    // --- 5. CORE FUNCTIONS (Lorebook) ---
    function scanLorebook() {
        let count = 0;
        
        // ตรวจสอบว่า API ของ SillyTavern พร้อมใช้งานหรือไม่
        if (typeof SillyTavern !== 'undefined' && SillyTavern.world_info) {
            // นับเฉพาะ Lorebook ที่ไม่ถูกปิด (disable: false)
            count = Object.values(SillyTavern.world_info).filter(e => !e.disable).length;
        } else if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
            // Fallback: ลองดึงจาก Context
            const ctx = SillyTavern.getContext();
            if (ctx && ctx.world_info) {
                count = ctx.world_info.length;
            }
        }

        state.loreCount = count;
        updateUIStats();
        log(`Lorebook Status: ${count} Active`);
    }

    function updateUIStats() {
        const elSaved = document.getElementById('disp-saved');
        const elLore = document.getElementById('disp-lore');
        if (elSaved) elSaved.innerText = state.savedTokens.toLocaleString();
        if (elLore) elLore.innerText = state.loreCount;
    }

    function log(msg) {
        const box = document.getElementById('c-logs');
        if (box) {
            const time = new Date().toLocaleTimeString().split(' ')[0];
            box.innerHTML += `<div class="log-item"><span>[${time}]</span> ${msg}</div>`;
            box.scrollTop = box.scrollHeight;
        }
    }

    // --- 6. DRAGGABLE SYSTEM (Touch Supported) ---
    function makeDraggable(el, checkUnlock, callback, handle = el) {
        let pos1=0, pos2=0, pos3=0, pos4=0;
        
        handle.onmousedown = dragStart;
        handle.ontouchstart = dragStart;

        function dragStart(e) {
            if (!checkUnlock()) return;
            e.preventDefault(); // ป้องกันการเลื่อนหน้าจอ
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

    // --- 7. INITIALIZATION ---
    function init() {
        console.log(`[${EXTENSION_NAME}] Initializing...`);
        createUI();

        // เชื่อมต่อกับระบบ SillyTavern Extension API
        if (typeof SillyTavern !== 'undefined' && SillyTavern.extension_manager) {
            SillyTavern.extension_manager.register_hook('chat_completion_request', sanitizePayload);
            SillyTavern.extension_manager.register_hook('text_completion_request', sanitizePayload);
            log("System: Connected to ST Core");
        } else {
            log("System: Standalone Mode (UI Only)");
        }
        
        setTimeout(scanLorebook, 1000); // สแกนครั้งแรกหลังโหลด
    }

    // รอให้หน้าเว็บโหลดเสร็จ
    setTimeout(init, 2000);

})();
