(function () {
    // --- Configuration & State ---
    const EXTENSION_NAME = "CyberCore Nexus";
    let isLauncherLocked = true; // true = ห้ามขยับ
    let isWindowLocked = true;   // true = ห้ามขยับ

    // --- Initialization ---
    function init() {
        console.log(`[${EXTENSION_NAME}] Initializing...`);
        
        // ป้องกันการสร้างซ้ำ
        if (document.getElementById('nexus-root')) return;

        // สร้าง Container หลัก
        const root = document.createElement('div');
        root.id = 'nexus-root';
        document.body.appendChild(root);

        // 1. สร้างปุ่ม Launcher 🌀
        const launcher = document.createElement('div');
        launcher.id = 'nexus-launcher';
        launcher.className = 'nexus-launcher';
        launcher.innerHTML = '🌀';
        launcher.title = "Click to Open Nexus";
        root.appendChild(launcher);

        // 2. สร้างหน้าต่าง Main Window
        const win = document.createElement('div');
        win.id = 'nexus-window';
        win.className = 'nexus-window';
        win.innerHTML = `
            <div class="nexus-header" id="nexus-header-drag">
                <div class="nexus-ctrl-group">
                    <button id="btn-unlock-launcher" class="nexus-btn">Move 🌀</button>
                    <button id="btn-unlock-window" class="nexus-btn">Move Win</button>
                </div>
                <div style="flex:1; text-align:center; font-weight:bold; letter-spacing:2px;">NEXUS</div>
                <button id="btn-close-nexus" class="nexus-btn danger">CLOSE [X]</button>
            </div>

            <div class="nexus-body">
                
                <div id="page-lore" class="nexus-page active">
                    <h3>📜 Lorebook Monitor</h3>
                    <div class="content-box">
                        <p>Waiting for trigger data...</p>
                        <ul id="lore-log" style="list-style: none; padding: 0; font-size: 0.9em;">
                            <li>[System] Ready to capture.</li>
                        </ul>
                    </div>
                </div>

                <div id="page-check" class="nexus-page">
                    <h3>🔍 Message Inspector</h3>
                    <div class="input-group" style="margin-bottom:10px;">
                        <input type="number" placeholder="Msg ID" style="background:black; border:1px solid #00ff41; color:#00ff41; width:60px;">
                        <button class="nexus-btn">Check</button>
                    </div>
                    <div id="inspector-display">No message selected.</div>
                </div>

                <div id="page-chat" class="nexus-page">
                    <h3>💬 AI Companion</h3>
                    <div style="height: 150px; border: 1px solid #004411; margin-bottom: 5px; overflow-y:scroll;">
                        </div>
                    <input type="text" placeholder="Whisper to AI..." style="width:100%; background:black; border:1px solid #00ff41; color:white;">
                </div>

                <div id="page-status" class="nexus-page">
                    <h3>🌎 World & Status</h3>
                    <p><strong>Location:</strong> <span id="st-loc">Unknown</span></p>
                    <p><strong>Time:</strong> <span id="st-time">--:--</span></p>
                    <p><strong>Temperature:</strong> <span id="st-temp">--°C</span></p>
                    <hr style="border-color:#004411">
                    <p><strong>Condition:</strong> Normal</p>
                </div>

                <div id="page-help" class="nexus-page">
                    <h3>❓ System Help</h3>
                    <p>1. Use 'Move 🌀' to reposition the launcher.</p>
                    <p>2. Use 'Move Win' to reposition this window.</p>
                    <p>3. Locking prevents accidental touches.</p>
                </div>
            </div>

            <div class="nexus-footer">
                <div class="nav-tab active" onclick="nexusSwitchPage('lore', this)">📜 Lore</div>
                <div class="nav-tab" onclick="nexusSwitchPage('check', this)">🔍 Check</div>
                <div class="nav-tab" onclick="nexusSwitchPage('chat', this)">💬 Chat</div>
                <div class="nav-tab" onclick="nexusSwitchPage('status', this)">🌎 Status</div>
                <div class="nav-tab" onclick="nexusSwitchPage('help', this)">❓ Help</div>
            </div>
        `;
        root.appendChild(win);

        // --- Event Listeners ---
        setupEvents(launcher, win);
    }

    // --- Logic Functions ---

    // ฟังก์ชันเปลี่ยนหน้า Tab
    window.nexusSwitchPage = function(pageName, tabElement) {
        // ซ่อนทุกหน้า
        document.querySelectorAll('.nexus-page').forEach(p => p.classList.remove('active'));
        // เอา highlight ออกจากทุก tab
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

        // แสดงหน้าที่เลือก
        document.getElementById(`page-${pageName}`).classList.add('active');
        // highlight tab ที่กด
        tabElement.classList.add('active');
    };

    function setupEvents(launcher, win) {
        const btnMoveLauncher = document.getElementById('btn-unlock-launcher');
        const btnMoveWin = document.getElementById('btn-unlock-window');
        const btnClose = document.getElementById('btn-close-nexus');
        const header = document.getElementById('nexus-header-drag');

        // 1. เปิดหน้าต่าง
        // เราใช้ตัวแปรเพื่อเช็คว่าเป็นการ "Click" หรือ "Drag"
        let isDraggingLauncher = false;

        launcher.addEventListener('click', () => {
            if (!isDraggingLauncher && isLauncherLocked) {
                win.style.display = 'flex';
            }
        });

        // 2. ปิดหน้าต่าง & Reset การล็อค (กฎข้อ 2: เผลอปิดแล้วต้องกลับมาสถานะปลอดภัย)
        btnClose.addEventListener('click', () => {
            win.style.display = 'none';
            
            // Re-lock everything
            isLauncherLocked = true;
            isWindowLocked = true;
            btnMoveLauncher.classList.remove('active');
            btnMoveWin.classList.remove('active');
            
            // Reset cursor styles
            launcher.style.cursor = 'pointer';
            header.style.cursor = 'default';
        });

        // 3. ปุ่ม Toggle Lock/Unlock Launcher
        btnMoveLauncher.addEventListener('click', () => {
            isLauncherLocked = !isLauncherLocked;
            if (!isLauncherLocked) {
                btnMoveLauncher.classList.add('active'); // สีเขียว
                launcher.style.cursor = 'move';
                launcher.style.animationPlayState = 'paused'; // หยุดหมุนตอนจะย้าย
            } else {
                btnMoveLauncher.classList.remove('active');
                launcher.style.cursor = 'pointer';
                launcher.style.animationPlayState = 'running';
            }
        });

        // 4. ปุ่ม Toggle Lock/Unlock Window
        btnMoveWin.addEventListener('click', () => {
            isWindowLocked = !isWindowLocked;
            if (!isWindowLocked) {
                btnMoveWin.classList.add('active');
                header.style.cursor = 'move';
            } else {
                btnMoveWin.classList.remove('active');
                header.style.cursor = 'default';
            }
        });

        // --- Dragging System (รองรับ Mobile Touch) ---
        makeDraggable(launcher, () => !isLauncherLocked, (dragging) => {
            isDraggingLauncher = dragging;
        });
        
        makeDraggable(win, () => !isWindowLocked, null, document.getElementById('nexus-header-drag'));
    }

    // ฟังก์ชันลากวางครอบจักรวาล (Mouse + Touch)
    function makeDraggable(element, checkUnlockFunc, dragStatusCallback, handle = element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragStart;
        handle.ontouchstart = dragStart;

        function dragStart(e) {
            if (!checkUnlockFunc()) return; // ถ้าล็อคอยู่ ห้ามขยับ

            // ถ้าเป็น Touch ให้ใช้ touches[0]
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            pos3 = clientX;
            pos4 = clientY;

            document.onmouseup = closeDragElement;
            document.ontouchend = closeDragElement;
            document.onmousemove = elementDrag;
            document.ontouchmove = elementDrag;

            if (dragStatusCallback) dragStatusCallback(true);
        }

        function elementDrag(e) {
            e.preventDefault(); // ป้องกัน Scroll หน้าจอตอนลาก
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;

            // คำนวณตำแหน่งใหม่
            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;

            // set style
            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
            
            // ลบ transform เพื่อไม่ให้ตีกับตำแหน่ง top/left (สำคัญสำหรับ window ที่มี translate(-50%, -50%))
            element.style.transform = "none"; 
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;

            if (dragStatusCallback) {
                setTimeout(() => dragStatusCallback(false), 100); // delay นิดนึงกัน click ลั่น
            }
        }
    }

    // Start System
    // ใช้ setTimeout เพื่อรอให้ SillyTavern โหลดเสร็จก่อน
    setTimeout(init, 2000);

})();
