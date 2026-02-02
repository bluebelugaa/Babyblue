/**
 * VOID_OS INDEX.JS
 * Optimized for Mobile & SillyTavern Extension System
 */

(function() {
    // ป้องกันการรันซ้ำในกรณีที่มีการรีโหลด Extension
    if (window.voidApp) return;

    class VoidSystem {
        constructor() {
            this.canMoveTrigger = false;
            this.canMoveWindow = false;
            this.isDragging = false;
            this.activeTab = 'lore';
            this.oocHistory = JSON.parse(localStorage.getItem('void_ooc_data') || '[]');
            
            this.init();
        }

        async init() {
            console.log(">> VoidSystem: Initializing...");
            this.buildInterface();
            this.startSparkleEffect();
            this.autoUpdateState();
            console.log(">> VoidSystem: Ready.");
        }

        buildInterface() {
            // 1. สร้างปุ่มสัญลักษณ์ X (Trigger)
            this.triggerBtn = document.createElement('div');
            this.triggerBtn.id = 'void-trigger-btn';
            this.triggerBtn.innerHTML = '<span class="void-symbol">✕</span>';
            document.body.appendChild(this.triggerBtn);

            // 2. สร้างหน้าต่าง Panel หลัก
            this.panel = document.createElement('div');
            this.panel.id = 'void-panel';
            this.panel.innerHTML = `
                <div class="void-header" id="void-header-drag">
                    <span class="void-title-text">VOID_SYSTEM_V1</span>
                    <div class="void-controls">
                        <button id="btn-move-t" class="ctrl-btn">MOVE_X [ ]</button>
                        <button id="btn-move-w" class="ctrl-btn">MOVE_WIN [ ]</button>
                        <button id="btn-close" class="ctrl-btn ctrl-close">✕</button>
                    </div>
                </div>
                <div class="void-nav-container">
                    <div class="nav-tab active" data-tab="lore">LORE</div>
                    <div class="nav-tab" data-tab="inspect">INSPECT</div>
                    <div class="nav-tab" data-tab="chat">OOC</div>
                    <div class="nav-tab" data-tab="world">WORLD</div>
                    <div class="nav-tab" data-tab="help">HELP</div>
                </div>
                <div class="void-body" id="void-content-area">
                    </div>
            `;
            document.body.appendChild(this.panel);

            this.bindEvents();
        }

        bindEvents() {
            // คลิกที่ปุ่ม X เพื่อเปิดหน้าต่าง
            this.triggerBtn.addEventListener('click', () => {
                if (this.isDragging) return;
                if (!this.canMoveTrigger) {
                    this.panel.classList.add('active');
                    this.renderTab(this.activeTab);
                }
            });

            // ปุ่มปิดหน้าต่าง
            this.panel.querySelector('#btn-close').addEventListener('click', () => {
                this.closeAndReset();
            });

            // ปุ่มควบคุมการเคลื่อนย้าย
            this.panel.querySelector('#btn-move-t').addEventListener('click', (e) => {
                this.canMoveTrigger = !this.canMoveTrigger;
                this.updateToggleUI(e.target, this.canMoveTrigger);
            });

            this.panel.querySelector('#btn-move-w').addEventListener('click', (e) => {
                this.canMoveWindow = !this.canMoveWindow;
                this.updateToggleUI(e.target, this.canMoveWindow);
            });

            // การสลับแท็บ
            const tabs = this.panel.querySelectorAll('.nav-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.activeTab = tab.dataset.tab;
                    this.renderTab(this.activeTab);
                });
            });

            // เปิดใช้งานระบบลาก (Universal Touch/Mouse)
            this.setupDragging(this.triggerBtn, () => this.canMoveTrigger);
            this.setupDragging(this.panel, () => this.canMoveWindow, document.getElementById('void-header-drag'));
        }

        closeAndReset() {
            this.panel.classList.remove('active');
            this.canMoveTrigger = false;
            this.canMoveWindow = false;
            this.updateToggleUI(document.getElementById('btn-move-t'), false);
            this.updateToggleUI(document.getElementById('btn-move-w'), false);
        }

        updateToggleUI(btn, isActive) {
            if (isActive) {
                btn.classList.add('toggle-on');
                btn.innerText = btn.innerText.replace('[ ]', '[x]');
            } else {
                btn.classList.remove('toggle-on');
                btn.innerText = btn.innerText.replace('[x]', '[ ]');
            }
        }

        setupDragging(element, checkPermission, handle = null) {
            const target = handle || element;
            let active = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

            const dragStart = (e) => {
                if (!checkPermission()) return;
                const touch = e.type === "touchstart" ? e.touches[0] : e;
                initialX = touch.clientX - xOffset;
                initialY = touch.clientY - yOffset;
                if (e.target === target || target.contains(e.target)) {
                    active = true;
                    this.isDragging = true;
                }
            };

            const dragEnd = () => {
                initialX = currentX;
                initialY = currentY;
                active = false;
                setTimeout(() => { this.isDragging = false; }, 50);
            };

            const drag = (e) => {
                if (!active) return;
                e.preventDefault();
                const touch = e.type === "touchmove" ? e.touches[0] : e;
                currentX = touch.clientX - initialX;
                currentY = touch.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;

                // ใช้ Translate3d เพื่อความลื่นไหลบนมือถือ
                element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
                // ถ้าเป็นหน้าต่างและเราปิด/เปิดใหม่ transform ต้องไม่หาย (หรือจะใช้ left/top ก็ได้)
                if (element === this.panel) element.style.margin = "0"; 
            };

            target.addEventListener("touchstart", dragStart, { passive: false });
            target.addEventListener("touchend", dragEnd, { passive: false });
            target.addEventListener("touchmove", drag, { passive: false });
            target.addEventListener("mousedown", dragStart);
            document.addEventListener("mouseup", dragEnd);
            document.addEventListener("mousemove", drag);
        }

        // --- ระบบ Render เนื้อหาแต่ละแท็บ ---
        renderTab(tab) {
            const container = document.getElementById('void-content-area');
            container.innerHTML = '';

            switch(tab) {
                case 'lore': this.viewLore(container); break;
                case 'inspect': this.viewInspect(container); break;
                case 'chat': this.viewChat(container); break;
                case 'world': this.viewWorld(container); break;
                case 'help': this.viewHelp(container); break;
            }
        }

        viewLore(c) {
            const lastMsg = this.getLastMsg();
            c.innerHTML = `
                <div class="module-header">LORE_SCANNER v1.0</div>
                <div class="state-card">
                    <div class="state-label">LAST CONTEXT SCAN:</div>
                    <div class="state-value" style="font-size:11px;">"${lastMsg.substring(0,60)}..."</div>
                </div>
                <div id="lore-results" style="margin-top:10px;">
                    <div style="text-align:center; opacity:0.4;">[ SCANNING FOR KEYWORDS... ]</div>
                </div>
            `;
        }

        viewInspect(c) {
            c.innerHTML = `
                <div class="module-header">MESSAGE_INSPECTOR</div>
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input type="number" id="inspect-num" class="void-input" value="0" style="width:60px;">
                    <button id="do-inspect" class="ctrl-btn">FETCH_MSG</button>
                </div>
                <div id="inspect-res" class="void-box" style="display:none; max-height:200px; overflow-y:auto; font-family:monospace; font-size:11px;"></div>
            `;
            c.querySelector('#do-inspect').onclick = () => {
                const idx = document.getElementById('inspect-num').value;
                const msgs = document.querySelectorAll('.mes_text');
                const res = document.getElementById('inspect-res');
                if (msgs[msgs.length - 1 - idx]) {
                    res.innerText = msgs[msgs.length - 1 - idx].innerText;
                    res.style.display = 'block';
                }
            };
        }

        viewChat(c) {
            c.innerHTML = `
                <div class="module-header">OOC_STATION</div>
                <div id="ooc-box" class="void-box" style="height:250px; overflow-y:auto; margin-bottom:10px;"></div>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="ooc-in" class="void-input" style="flex:1;" placeholder="Talk to Friend...">
                    <button id="ooc-send" class="ctrl-btn">SEND</button>
                </div>
            `;
            const box = c.querySelector('#ooc-box');
            const input = c.querySelector('#ooc-in');
            
            const renderMessages = () => {
                box.innerHTML = this.oocHistory.map(m => `
                    <div style="margin-bottom:8px; border-left:2px solid ${m.role === 'ai' ? '#f55':'#89d4ff'}; padding-left:5px;">
                        <small style="color:#555;">${m.name}</small><br>${m.text}
                    </div>
                `).join('');
                box.scrollTop = box.scrollHeight;
            };

            renderMessages();

            c.querySelector('#ooc-send').onclick = () => {
                if (!input.value) return;
                this.oocHistory.push({ role: 'user', name: 'YOU', text: input.value });
                const userVal = input.value;
                input.value = '';
                renderMessages();
                
                // Mock AI Reply
                setTimeout(() => {
                    this.oocHistory.push({ role: 'ai', name: 'VOID_ASSIST', text: `Receiving: "${userVal}". I'm watching the roleplay.` });
                    localStorage.setItem('void_ooc_data', JSON.stringify(this.oocHistory));
                    renderMessages();
                }, 800);
            };
        }

        viewWorld(c) {
            c.innerHTML = `
                <div class="module-header">WORLD_STATUS_EXTRACTOR</div>
                <div class="state-card"><div class="state-label">LOCATION</div><div class="state-value">Scanning DOM...</div></div>
                <div class="state-card"><div class="state-label">TIME/WEATHER</div><div class="state-value">Cold / Midnight</div></div>
                <div class="state-card"><div class="state-label">CHARACTER</div><div class="state-value">Status: Healthy</div></div>
            `;
        }

        viewHelp(c) {
            c.innerHTML = `<div class="module-header">SYSTEM_HELP</div>
                <p style="font-size:12px; color:#777;">- MOVE_X: เลื่อนปุ่ม X<br>- MOVE_WIN: เลื่อนหน้าต่าง<br>- ทุกระบบจะอัปเดตเมื่อ AI ตอบกลับ</p>
                <button class="ctrl-btn" style="width:100%;">REQUEST AI SUMMARY</button>`;
        }

        // --- Helpers ---
        getLastMsg() {
            const msgs = document.querySelectorAll('.mes_text');
            return msgs.length > 0 ? msgs[msgs.length-1].innerText : "No data.";
        }

        startSparkleEffect() {
            setInterval(() => {
                if (!this.triggerBtn) return;
                const s = document.createElement('div');
                s.className = 'sparkle';
                const size = Math.random() * 4 + 2;
                s.style.width = size + 'px';
                s.style.height = size + 'px';
                s.style.left = Math.random() * 100 + '%';
                s.style.top = Math.random() * 100 + '%';
                s.style.animation = `sparkle-anim ${Math.random() * 1 + 0.5}s linear forwards`;
                this.triggerBtn.appendChild(s);
                setTimeout(() => s.remove(), 1500);
            }, 400);
        }

        autoUpdateState() {
            // ระบบตรวจสอบการส่งข้อความของ SillyTavern เพื่ออัปเดตข้อมูลอัตโนมัติ
            const observer = new MutationObserver(() => {
                if (this.panel.classList.contains('active')) {
                    this.renderTab(this.activeTab);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // เริ่มการทำงาน
    window.voidApp = new VoidSystem();
})();
        
