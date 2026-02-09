(function() {
    let isLauncherMoveable = false;
    let isWindowMoveable = false;

    // ฟังก์ชันสร้าง UI
    function initNexus() {
        console.log("Nexus System: Initializing...");

        // ตรวจสอบว่ามีอยู่หรือยัง
        if (document.getElementById('nexus-launcher')) return;

        // สร้าง Launcher 🌀
        const launcher = document.createElement('div');
        launcher.id = 'nexus-launcher';
        launcher.className = 'nexus-launcher';
        launcher.innerHTML = '🌀';
        document.body.appendChild(launcher);

        // สร้าง Window
        const win = document.createElement('div');
        win.id = 'nexus-window';
        win.className = 'nexus-window';
        win.innerHTML = `
            <div class="nexus-header" id="nexus-drag-zone">
                <div style="display:flex; gap:5px;">
                    <button id="btn-move-launcher" class="nexus-btn">Move 🌀</button>
                    <button id="btn-move-win" class="nexus-btn">Move Window</button>
                </div>
                <div id="nexus-close" class="nexus-btn" style="color:#ff0055; border-color:#ff0055;">CLOSE X</div>
            </div>
            <div class="nexus-body">
                <div id="nexus-pages">
                    <div id="p-lore" class="page-content"><h2>Lorebook Monitoring</h2><p>ระบบตรวจสอบ Lorebook พร้อมใช้งาน...</p></div>
                </div>
            </div>
            <div class="nexus-footer">
                <div class="nav-tab active">📜 Lore</div>
                <div class="nav-tab">🔍 Check</div>
                <div class="nav-tab">💬 Chat</div>
                <div class="nav-tab">🌎 Status</div>
                <div class="nav-tab">❓ Help</div>
            </div>
        `;
        document.body.appendChild(win);

        setupLogic();
    }

    function setupLogic() {
        const launcher = document.getElementById('nexus-launcher');
        const win = document.getElementById('nexus-window');
        const closeBtn = document.getElementById('nexus-close');
        const moveLauncherBtn = document.getElementById('btn-move-launcher');
        const moveWinBtn = document.getElementById('btn-move-win');

        // คลิกเพื่อเปิดหน้าต่าง
        launcher.addEventListener('click', () => {
            if (!isLauncherMoveable) {
                win.style.display = 'flex';
            }
        });

        // ปิดหน้าต่าง
        closeBtn.addEventListener('click', () => {
            win.style.display = 'none';
            // ปิดโหมดเคลื่อนย้ายทันทีเพื่อความปลอดภัย (กฎข้อ 2)
            isLauncherMoveable = false;
            isWindowMoveable = false;
            moveLauncherBtn.classList.remove('active');
            moveWinBtn.classList.remove('active');
        });

        // เปิด/ปิดโหมดเคลื่อนย้าย
        moveLauncherBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isLauncherMoveable = !isLauncherMoveable;
            moveLauncherBtn.classList.toggle('active');
        });

        moveWinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isWindowMoveable = !isWindowMoveable;
            moveWinBtn.classList.toggle('active');
        });

        // ระบบลากวาง (Touch Support สำหรับมือถือ)
        makeDraggable(launcher, () => isLauncherMoveable);
        makeDraggable(win, () => isWindowMoveable);
    }

    function makeDraggable(el, checkFunction) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        el.ontouchstart = dragMouseDown;
        el.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (!checkFunction()) return;
            e = e || window.event;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            pos3 = clientX;
            pos4 = clientY;
            document.onmouseup = closeDragElement;
            document.ontouchend = closeDragElement;
            document.onmousemove = elementDrag;
            document.ontouchmove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
            el.style.transform = "none"; // ยกเลิกการจัดการกลางจอเมื่อเริ่มลาก
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
        }
    }

    // รันทันทีและลองรันซ้ำเมื่อหน้าจอโหลดเสร็จ
    initNexus();
    setTimeout(initNexus, 2000); 
})();

