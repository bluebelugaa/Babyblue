// ==================================================================================
// PART 1: VISUAL CORE & STYLES (LUXURY FROST EDITION)
// Theme: Black-Void, Faint-Ice-Blue, Sparkling, Cold, Minimalist
// ==================================================================================

(function() {
    // ป้องกันการรันซ้ำ
    if (document.getElementById('frozen-void-style')) return;

    const cssContent = `
    :root {
        /* Color Palette: Cold Luxury */
        --void-base: #050505;
        --void-deep: #000000;
        --ice-faint: rgba(180, 230, 255, 0.15); /* ฟ้าจางมาก ดูแพง */
        --ice-glow: rgba(137, 212, 255, 0.6);   /* แสงฟ้าเย็น */
        --ice-solid: #89d4ff;
        --silver-text: #c0c0c0;
        --alert-crimson: rgba(255, 107, 107, 0.8);
        --glass-surface: rgba(10, 10, 15, 0.85);
        --frost-border: 1px solid rgba(137, 212, 255, 0.15);
    }

    /* -----------------------------------------------------------
       1. THE TRIGGER ORB (ปุ่มเปิด X วิบวับ)
       ----------------------------------------------------------- */
    #void-trigger-btn {
        position: fixed;
        top: 10%; left: 50%;
        width: 50px; height: 50px;
        background: radial-gradient(circle at 30% 30%, #1a1a1a, #000);
        border: 1px solid rgba(137, 212, 255, 0.3);
        border-radius: 50%;
        display: flex; justify-content: center; align-items: center;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 0 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(137,212,255,0.05);
        transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        backdrop-filter: blur(5px);
        transform: translate(-50%, -50%);
        overflow: visible; /* ให้แสงพุ่งออกมาได้ */
    }

    #void-trigger-btn:hover {
        border-color: var(--ice-solid);
        box-shadow: 0 0 25px var(--ice-faint);
        transform: translate(-50%, -50%) scale(1.05);
    }

    /* สัญลักษณ์ X ตรงกลาง */
    .void-symbol {
        font-family: 'Cinzel', serif; /* ถ้าไม่มีจะ Fallback */
        font-size: 18px;
        color: var(--ice-solid);
        text-shadow: 0 0 8px var(--ice-glow);
        opacity: 0.8;
        pointer-events: none;
    }

    /* เอฟเฟกต์วิบวับ (Sparkles) */
    .sparkle {
        position: absolute;
        width: 2px; height: 2px;
        background: white;
        border-radius: 50%;
        pointer-events: none;
        opacity: 0;
        box-shadow: 0 0 4px var(--ice-solid);
    }

    @keyframes sparkle-anim {
        0% { transform: scale(0) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: scale(1.5) rotate(180deg); opacity: 0; top: -20px; } /* ลอยขึ้นแล้วหายไป */
    }

    /* -----------------------------------------------------------
       2. MAIN PANEL (หน้าต่างระบบ)
       ----------------------------------------------------------- */
    #void-panel {
        position: fixed;
        top: 50%; left: 50%;
        width: 800px; height: 600px; /* ขนาดตั้งต้น */
        max-width: 95vw; max-height: 90vh;
        background: var(--glass-surface);
        backdrop-filter: blur(12px) saturate(120%);
        border: var(--frost-border);
        border-radius: 4px; /* มุมเหลี่ยมเล็กน้อยให้ดู Tech */
        display: none; /* ซ่อนก่อน */
        flex-direction: column;
        z-index: 100000;
        box-shadow: 0 30px 80px rgba(0,0,0,0.95);
        color: var(--silver-text);
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        transition: opacity 0.3s ease;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.95);
    }

    #void-panel.active {
        display: flex;
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    /* Header Bar */
    .void-header {
        height: 40px;
        background: rgba(0,0,0,0.4);
        border-bottom: var(--frost-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 15px;
        user-select: none;
    }

    .void-title {
        font-size: 11px;
        letter-spacing: 2px;
        color: #555;
        text-transform: uppercase;
    }

    .void-controls {
        display: flex;
        gap: 10px;
    }

    /* Control Buttons (Move T, Move W, Close) */
    .ctrl-btn {
        font-size: 10px;
        background: transparent;
        border: 1px solid #333;
        color: #666;
        padding: 2px 8px;
        cursor: pointer;
        border-radius: 2px;
        transition: all 0.2s;
        text-transform: uppercase;
    }
    
    .ctrl-btn:hover { border-color: #555; color: #888; }
    
    /* สถานะ Active ของปุ่มย้าย */
    .ctrl-btn.toggle-on {
        border-color: var(--ice-solid);
        color: var(--ice-solid);
        box-shadow: 0 0 8px rgba(137, 212, 255, 0.2);
        background: rgba(137, 212, 255, 0.05);
    }

    .ctrl-close:hover {
        border-color: var(--alert-crimson);
        color: var(--alert-crimson);
        box-shadow: 0 0 8px rgba(255, 107, 107, 0.2);
    }

    /* -----------------------------------------------------------
       3. NAVIGATION & CONTENT
       ----------------------------------------------------------- */
    .void-nav {
        display: flex;
        background: rgba(0,0,0,0.2);
        border-bottom: var(--frost-border);
        padding: 10px 15px 0 15px;
        gap: 2px;
    }

    .nav-tab {
        padding: 8px 16px;
        font-size: 12px;
        cursor: pointer;
        color: #666;
        border: 1px solid transparent;
        border-bottom: none;
        background: transparent;
        transition: all 0.3s;
        position: relative;
    }

    .nav-tab:hover { color: #aaa; }

    .nav-tab.active {
        color: var(--ice-solid);
        background: rgba(137, 212, 255, 0.03);
        border-color: rgba(137, 212, 255, 0.1);
        border-top: 1px solid var(--ice-solid); /* เส้นบนเรืองแสง */
    }

    .void-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        position: relative;
    }

    /* Custom Scrollbar */
    .void-body::-webkit-scrollbar { width: 6px; }
    .void-body::-webkit-scrollbar-track { background: #000; }
    .void-body::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
    .void-body::-webkit-scrollbar-thumb:hover { background: #444; }

    /* -----------------------------------------------------------
       4. SPECIFIC SYSTEMS UI
       ----------------------------------------------------------- */
    
    /* Bookmarks / Pagination */
    .page-controls {
        display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #333; padding-bottom: 10px;
    }
    .page-btn { cursor: pointer; color: #444; font-size: 18px; }
    .page-btn:hover { color: var(--ice-solid); }

    /* Message Inspector */
    .inspector-box {
        background: #080808; border: 1px solid #222; padding: 10px; margin-top: 10px; font-family: 'Consolas', monospace; font-size: 12px; color: #888;
    }
    .inspector-input {
        background: transparent; border: 1px solid #333; color: var(--ice-solid); padding: 5px; width: 60px; text-align: center;
    }

    /* OOC Chat Styles */
    .ooc-container { display: flex; flex-direction: column; height: 100%; }
    .ooc-log { flex: 1; overflow-y: auto; margin-bottom: 10px; padding-right: 5px; border: 1px solid #111; background: rgba(0,0,0,0.3); padding: 10px; }
    .ooc-message { margin-bottom: 8px; font-size: 13px; line-height: 1.4; padding: 5px 8px; border-radius: 4px; position: relative; }
    .ooc-message.user { border-left: 2px solid var(--ice-solid); background: rgba(137, 212, 255, 0.05); }
    .ooc-message.ai { border-left: 2px solid #ff6b6b; background: rgba(255, 107, 107, 0.05); }
    .ooc-controls { display: flex; gap: 5px; }
    .ooc-input { flex: 1; background: #0a0a0a; border: 1px solid #333; color: #ddd; padding: 8px; }

    /* World State Cards */
    .state-card {
        background: linear-gradient(135deg, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%);
        border: 1px solid #222;
        padding: 15px; margin-bottom: 10px;
        position: relative; overflow: hidden;
    }
    .state-card::before {
        content: ''; position: absolute; top:0; left:0; width: 2px; height: 100%; background: var(--ice-solid); opacity: 0.5;
    }
    .state-label { font-size: 9px; color: #555; text-transform: uppercase; margin-bottom: 4px; }
    .state-value { font-size: 14px; color: #ccc; }
    .trigger-highlight { color: var(--ice-solid); font-weight: bold; }

    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'frozen-void-style';
    styleEl.innerHTML = cssContent;
    document.head.appendChild(styleEl);

    console.log(">> Frozen Void UI: CSS Loaded.");
})();
// ==================================================================================
// PART 2: CORE LOGIC CLASS
// Logic: Dragging, Tab Switching, Initialization
// ==================================================================================

class VoidSystem {
    constructor() {
        this.canMoveTrigger = false;
        this.canMoveWindow = false;
        this.isOpen = false;
        this.activeTab = 'lore'; // default tab
        
        // สร้าง HTML Elements
        this.buildInterface();
        this.startSparkleEffect();
    }

    buildInterface() {
        // 1. สร้างปุ่ม Trigger
        this.triggerBtn = document.createElement('div');
        this.triggerBtn.id = 'void-trigger-btn';
        this.triggerBtn.innerHTML = '<span class="void-symbol">✕</span>';
        document.body.appendChild(this.triggerBtn);

        // 2. สร้างหน้าต่าง Panel
        this.panel = document.createElement('div');
        this.panel.id = 'void-panel';
        this.panel.innerHTML = `
            <div class="void-header" id="void-header-drag">
                <span class="void-title">VOID_OS // SYSTEM_V.9</span>
                <div class="void-controls">
                    <button id="btn-move-t" class="ctrl-btn">MOVE_T [ ]</button>
                    <button id="btn-move-w" class="ctrl-btn">MOVE_W [ ]</button>
                    <button id="btn-close" class="ctrl-btn ctrl-close">✕</button>
                </div>
            </div>

            <div class="void-nav">
                <div class="nav-tab active" data-target="lore">LORE_SCAN</div>
                <div class="nav-tab" data-target="inspect">INSPECTOR</div>
                <div class="nav-tab" data-target="chat">OOC_LINK</div>
                <div class="nav-tab" data-target="world">WORLD_STATE</div>
                <div class="nav-tab" data-target="help">ASSIST</div>
            </div>

            <div class="void-body" id="void-content">
                </div>
        `;
        document.body.appendChild(this.panel);

        // Binding Events
        this.bindEvents();
    }

    bindEvents() {
        // เปิดหน้าต่าง
        this.triggerBtn.onclick = () => {
            if (!this.canMoveTrigger) { // ถ้าไม่ได้อยู่ในโหมดเลื่อน ให้เปิดหน้าต่าง
                this.isOpen = true;
                this.panel.classList.add('active');
                this.renderTab(this.activeTab); // โหลดเนื้อหาแท็บปัจจุบัน
            }
        };

        // ปุ่มปิดหน้าต่าง
        const closeBtn = this.panel.querySelector('#btn-close');
        closeBtn.onclick = () => this.closePanel();

        // ปุ่ม Toggle Move Trigger
        const moveTBtn = this.panel.querySelector('#btn-move-t');
        moveTBtn.onclick = () => {
            this.canMoveTrigger = !this.canMoveTrigger;
            this.toggleState(moveTBtn, this.canMoveTrigger);
            this.updateDragState(this.triggerBtn, this.canMoveTrigger);
        };

        // ปุ่ม Toggle Move Window
        const moveWBtn = this.panel.querySelector('#btn-move-w');
        moveWBtn.onclick = () => {
            this.canMoveWindow = !this.canMoveWindow;
            this.toggleState(moveWBtn, this.canMoveWindow);
            this.updateDragState(this.panel, this.canMoveWindow, document.getElementById('void-header-drag'));
        };

        // Tab Switching
        const tabs = this.panel.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeTab = tab.dataset.target;
                this.renderTab(this.activeTab);
            };
        });
    }

    closePanel() {
        this.isOpen = false;
        this.panel.classList.remove('active');
        
        // **กฏข้อ 2: ลืมปิดโหมดเลื่อน ต้องรีเซ็ตให้**
        this.canMoveTrigger = false;
        this.canMoveWindow = false;
        
        // รีเซ็ต UI ปุ่ม
        const tBtn = document.getElementById('btn-move-t');
        const wBtn = document.getElementById('btn-move-w');
        this.toggleState(tBtn, false);
        this.toggleState(wBtn, false);
        
        // ยกเลิก Event Drag
        this.updateDragState(this.triggerBtn, false);
        this.updateDragState(this.panel, false);
    }

    toggleState(btn, isActive) {
        if (isActive) {
            btn.classList.add('toggle-on');
            btn.innerHTML = btn.innerHTML.replace('[ ]', '[x]');
        } else {
            btn.classList.remove('toggle-on');
            btn.innerHTML = btn.innerHTML.replace('[x]', '[ ]');
        }
    }

    // ระบบลาก (Drag System)
    updateDragState(element, canMove, handle = null) {
        const target = handle || element;
        
        if (!canMove) {
            target.onmousedown = null;
            document.onmouseup = null;
            document.onmousemove = null;
            target.style.cursor = 'default';
            return;
        }

        target.style.cursor = 'move';
        
        target.onmousedown = (e) => {
            if (!canMove) return;
            e.preventDefault();
            
            // คำนวณ offset
            let shiftX = e.clientX - element.getBoundingClientRect().left;
            let shiftY = e.clientY - element.getBoundingClientRect().top;
            
            // ย้าย element ไปที่ body เพื่อไม่ให้ติด parent (กรณีจำเป็น) แต่ที่นี่เป็น fixed อยู่แล้ว
            
            const moveAt = (pageX, pageY) => {
                // ถ้าเป็น Trigger ให้ Center, ถ้าเป็น Window ให้ตามมุมซ้ายบน
                if(element.id === 'void-trigger-btn') {
                     element.style.left = pageX + 'px';
                     element.style.top = pageY + 'px';
                } else {
                     // สำหรับ Window เราต้องคำนวณ transform translate ให้ถูก
                     // เพื่อความง่าย ลบ transform ออกแล้วใช้ left/top ตรงๆ ตอนลาก
                     element.style.transform = 'none'; 
                     element.style.left = (pageX - shiftX) + 'px';
                     element.style.top = (pageY - shiftY) + 'px';
                }
            }

            const onMouseMove = (event) => {
                moveAt(event.pageX, event.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            document.onmouseup = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.onmouseup = null;
            };
        };
    }

    // เอฟเฟกต์วิบวับ (Sparkles)
    startSparkleEffect() {
        setInterval(() => {
            const sparkle = document.createElement('div');
            sparkle.classList.add('sparkle');
            
            // สุ่มตำแหน่งรอบๆ ปุ่ม
            const angle = Math.random() * Math.PI * 2;
            const radius = 25; // รัศมีปุ่ม
            const x = Math.cos(angle) * radius; 
            const y = Math.sin(angle) * radius;

            sparkle.style.left = (25 + x) + 'px'; 
            sparkle.style.top = (25 + y) + 'px';
            
            // สุ่มเวลา
            sparkle.style.animation = `sparkle-anim ${0.5 + Math.random()}s ease-out forwards`;
            
            this.triggerBtn.appendChild(sparkle);

            // ลบเมื่อเสร็จ
            setTimeout(() => sparkle.remove(), 1500);
        }, 300); // สร้างทุก 0.3 วินาที
    }

    // Placeholder สำหรับ renderTab (จะถูก Override ใน Part 3)
    renderTab(tabName) {
        const content = document.getElementById('void-content');
        content.innerHTML = `<div style="padding:20px; text-align:center;">LOADING MODULE: ${tabName.toUpperCase()}...</div>`;
    }
}
// ==================================================================================
// PART 3: ADVANCED SYSTEMS IMPLEMENTATION
// Logic: Lorebook Scanning, Message Inspect, OOC Chat, World State Extraction
// ==================================================================================

// เพิ่มฟังก์ชันให้ VoidSystem
VoidSystem.prototype.renderTab = function(tabName) {
    const content = document.getElementById('void-content');
    content.innerHTML = ''; // Clear old content

    switch(tabName) {
        case 'lore': this.buildLorebookTab(content); break;
        case 'inspect': this.buildInspectorTab(content); break;
        case 'chat': this.buildOOCTab(content); break;
        case 'world': this.buildWorldTab(content); break;
        case 'help': this.buildHelpTab(content); break;
    }
};

// --------------------------------------------------------
// SYSTEM 1: LOREBOOK SCANNER
// --------------------------------------------------------
VoidSystem.prototype.buildLorebookTab = function(container) {
    const html = `
        <div class="page-controls">
            <span>ACTIVE TRIGGERS</span>
            <span class="page-btn">↻</span>
        </div>
        <div id="lore-list"></div>
    `;
    container.innerHTML = html;
    
    // จำลองการดึงข้อมูล Lorebook (ใน SillyTavern จริงต้องดึงจาก context.world_info)
    // ตรงนี้ผมจะเขียน Logic สแกนข้อความล่าสุด
    const lastMsg = this.getLastMessageText();
    const list = container.querySelector('#lore-list');

    // Mock Data สำหรับตัวอย่าง (เพราะผมเข้าถึง World Info ของคุณไม่ได้โดยตรง)
    const mockLore = [
        { keys: ['ดาบ', 'sword', 'weapon'], entry: 'Magic Sword: ดาบเวทมนตร์โบราณ' },
        { keys: ['ป่า', 'forest'], entry: 'Dark Forest: ป่าต้องห้ามทิศเหนือ' },
        { keys: ['เมือง', 'city'], entry: 'Capital: เมืองหลวงแห่งแสง' }
    ];

    let found = false;
    mockLore.forEach(item => {
        // ตรวจสอบว่า keyword ไหนถูกทริกเกอร์
        const triggeredKey = item.keys.find(k => lastMsg.toLowerCase().includes(k));
        
        if (triggeredKey) {
            found = true;
            const card = document.createElement('div');
            card.className = 'state-card';
            card.innerHTML = `
                <div class="state-label">TRIGGERED BY: <span class="trigger-highlight">"${triggeredKey}"</span></div>
                <div class="state-value">${item.entry}</div>
            `;
            list.appendChild(card);
        }
    });

    if (!found) list.innerHTML = '<div style="opacity:0.5; text-align:center;">NO LOREBOOK TRIGGERED IN LAST MESSAGE</div>';
};

// --------------------------------------------------------
// SYSTEM 2: MESSAGE INSPECTOR (ตรวจสอบย้อนหลัง)
// --------------------------------------------------------
VoidSystem.prototype.buildInspectorTab = function(container) {
    container.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:15px;">
            <span>VIEW MSG #</span>
            <input type="number" id="inspect-idx" class="inspector-input" value="0">
            <button id="btn-inspect" class="ctrl-btn">FETCH</button>
        </div>
        <div id="inspect-display" style="display:none;">
            <div style="display:flex; justify-content:flex-end;"><span id="close-inspect" style="cursor:pointer; color:red;">[CLOSE VIEW]</span></div>
            <div id="inspect-content" class="inspector-box"></div>
        </div>
    `;

    const btn = container.querySelector('#btn-inspect');
    const display = container.querySelector('#inspect-display');
    const content = container.querySelector('#inspect-content');
    const close = container.querySelector('#close-inspect');

    btn.onclick = () => {
        // ใน ST ปกติจะใช้ chat variable
        // นี่คือการจำลองการดึงข้อความย้อนหลัง
        const idx = parseInt(container.querySelector('#inspect-idx').value);
        // สมมติ: ดึงจาก DOM จริงๆ ถ้าเป็น Extension
        const allMsgs = document.querySelectorAll('.mes_text');
        
        if (allMsgs && allMsgs.length > 0) {
            // คำนวณ Index ย้อนกลับ (0 = ล่าสุด)
            const target = allMsgs[allMsgs.length - 1 - idx];
            if (target) {
                display.style.display = 'block';
                content.innerText = target.innerText;
            } else {
                alert('Message index out of range');
            }
        } else {
            content.innerText = "No messages found in DOM.";
            display.style.display = 'block';
        }
    };

    close.onclick = () => {
        display.style.display = 'none';
        content.innerText = '';
    };
};

// --------------------------------------------------------
// SYSTEM 3: OOC CHAT (คุยเล่นแยกเนื้อเรื่อง)
// --------------------------------------------------------
VoidSystem.prototype.buildOOCTab = function(container) {
    // โหลดประวัติจาก LocalStorage
    const history = JSON.parse(localStorage.getItem('void_ooc_history') || '[]');
    
    container.innerHTML = `
        <div class="ooc-container">
            <div style="margin-bottom:5px;">
                <select id="ooc-char-select" style="background:#000; color:#fff; border:1px solid #333;">
                    <option value="GM">Game Master</option>
                    <option value="Friend">Friend Mode</option>
                </select>
                <input type="color" id="ooc-color" value="#89d4ff" style="width:30px; height:20px; border:none;">
                <span style="font-size:10px; color:#666;">(LOCKED)</span>
            </div>
            <div id="ooc-log" class="ooc-log"></div>
            <div class="ooc-controls">
                <input type="text" id="ooc-input" class="ooc-input" placeholder="OOC Message...">
                <button id="ooc-send" class="ctrl-btn">SEND</button>
            </div>
        </div>
    `;

    const log = container.querySelector('#ooc-log');
    const input = container.querySelector('#ooc-input');
    const send = container.querySelector('#ooc-send');

    // Render History
    const renderLog = () => {
        log.innerHTML = history.map(h => 
            `<div class="ooc-message ${h.role}" style="border-left-color:${h.color}">
                <strong>${h.name}:</strong> ${h.msg}
             </div>`
        ).join('');
        log.scrollTop = log.scrollHeight;
    };
    renderLog();

    // Logic ส่งข้อความ
    send.onclick = () => {
        const msg = input.value;
        if(!msg) return;

        // User part
        const userEntry = { role: 'user', name: 'User', msg: msg, color: document.getElementById('ooc-color').value };
        history.push(userEntry);
        renderLog();
        input.value = '';

        // AI Reply Simulation (ต้อง Hook API จริงเพื่อส่งไปหา AI)
        // ตรงนี้ผมทำ Fake Reply ให้เห็นภาพว่าระบบทำงาน
        setTimeout(() => {
            const aiEntry = { 
                role: 'ai', 
                name: document.getElementById('ooc-char-select').value, 
                msg: `(OOC System Reply): รับทราบครับ "${msg}" - ระบบกำลังบันทึก (นี่คือ Mockup response)`,
                color: '#ff6b6b'
            };
            history.push(aiEntry);
            localStorage.setItem('void_ooc_history', JSON.stringify(history));
            renderLog();
        }, 1000);
    };
};

// --------------------------------------------------------
// SYSTEM 4: WORLD STATE & CHARACTER STATUS
// --------------------------------------------------------
VoidSystem.prototype.buildWorldTab = function(container) {
    const lastMsg = this.getLastMessageText();
    
    // Logic: วิเคราะห์ข้อความเพื่อหา Context
    // ในการใช้งานจริง อาจจะต้องส่ง prompt ไปถาม AI ว่า "สรุปสถานะจากข้อความนี้"
    // แต่ใน Extension นี้ เราจะใช้ Keyword matching พื้นฐาน
    
    const worldData = {
        location: this.extractInfo(lastMsg, ['ที่', 'location', 'สถานที่'], 'Unknown Area'),
        time: this.extractInfo(lastMsg, ['เวลา', 'time', 'ยาม'], 'Unspecified Time'),
        weather: this.extractInfo(lastMsg, ['อากาศ', 'ฝน', 'แดด', 'หนาว', 'ร้อน'], 'Normal'),
        mood: this.extractInfo(lastMsg, ['รู้สึก', 'mood', 'อารมณ์'], 'Neutral')
    };

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <div class="state-card">
                <div class="state-label">CURRENT LOCATION</div>
                <div class="state-value">${worldData.location}</div>
            </div>
            <div class="state-card">
                <div class="state-label">TIME / ERA</div>
                <div class="state-value">${worldData.time}</div>
            </div>
            <div class="state-card">
                <div class="state-label">WEATHER / ATMOSPHERE</div>
                <div class="state-value">${worldData.weather}</div>
            </div>
            <div class="state-card">
                <div class="state-label">EMOTIONAL RESONANCE</div>
                <div class="state-value">${worldData.mood}</div>
            </div>
        </div>
        
        <div class="state-card" style="margin-top:10px;">
            <div class="state-label">CHARACTER STATUS (SCAN)</div>
            <div class="state-value" id="char-status-display">
                <ul>
                    <li>Status: <span style="color:#89d4ff">Active</span></li>
                    <li>Items: ตรวจสอบจาก Inventory...</li>
                    <li>Clothing: รอการระบุ...</li>
                </ul>
            </div>
        </div>
        <button class="ctrl-btn" style="width:100%; margin-top:5px;">FORCE UPDATE STATE</button>
    `;
};

// Helper: ดึงข้อความล่าสุด
VoidSystem.prototype.getLastMessageText = function() {
    // พยายามดึงจาก DOM ของ SillyTavern
    const msgs = document.querySelectorAll('.mes_text');
    if (msgs.length > 0) return msgs[msgs.length - 1].innerText;
    return "No message context found.";
};

// Helper: สกัดข้อมูลแบบง่าย (Mock AI extraction)
VoidSystem.prototype.extractInfo = function(text, keywords, defaultVal) {
    // ค้นหาประโยคที่มี keyword
    const sentences = text.split('.');
    for (let s of sentences) {
        for (let k of keywords) {
            if (s.includes(k)) return s.trim().substring(0, 50) + '...';
        }
    }
    return defaultVal;
};

// --------------------------------------------------------
// SYSTEM 5: HELP
// --------------------------------------------------------
VoidSystem.prototype.buildHelpTab = function(container) {
    container.innerHTML = `
        <h3>SYSTEM COMMANDS</h3>
        <ul style="line-height:1.8; color:#999;">
            <li><strong>Move T:</strong> อนุญาตให้ย้ายปุ่ม Trigger (X)</li>
            <li><strong>Move W:</strong> อนุญาตให้ย้ายหน้าต่าง</li>
            <li><strong>Lorebook:</strong> แสดงข้อมูลที่เกี่ยวข้องกับข้อความล่าสุด</li>
            <li><strong>Inspector:</strong> ดูข้อความย้อนหลังโดยไม่ต้องเลื่อนจอ</li>
            <li><strong>OOC:</strong> คุยเล่นแยกกับ AI (ไม่กระทบเนื้อเรื่องหลัก)</li>
        </ul>
        <div class="state-card" style="margin-top:20px; border-color: var(--ice-solid);">
            <div class="state-label">AI ASSISTANCE</div>
            <div style="padding:10px; text-align:center; cursor:pointer;" onclick="alert('Sending Summary Request to AI...')">
                [ CLICK TO SUMMARIZE CURRENT SITUATION ]
            </div>
        </div>
    `;
};

// ==================================================================================
// INITIALIZATION
// ==================================================================================
// เริ่มระบบทันที
const myVoidSystem = new VoidSystem();

})();
