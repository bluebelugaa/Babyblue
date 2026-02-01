
(function() {
    let canMoveTrigger = false;
    let canMoveWindow = false;

    function initSystem() {
        if (document.getElementById('cyber-trigger-btn')) return;

        // 1. สร้างปุ่มสัญลักษณ์
        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';
        btn.innerHTML = `<span class="frost-spiral">🌀</span>`;
        document.body.appendChild(btn);

        // 2. สร้างหน้าต่างหลัก
        const win = document.createElement('div');
        win.id = 'wasteland-window';
        win.innerHTML = `
            <div class="window-header" id="win-header">
                <span class="header-title">Status: Online</span>
                <div class="controls">
                    <button id="lock-trigger" class="btn-ctrl" title="Lock/Unlock Trigger">MOVE T</button>
                    <button id="lock-window" class="btn-ctrl" title="Lock/Unlock Window">MOVE W</button>
                    <button id="close-win" class="btn-ctrl" style="color:#ff5555; border-color:#ff5555;">X</button>
                </div>
            </div>
            <div class="nav-bar">
                <div class="tab-link active" data-tab="lore">LORE</div>
                <div class="tab-link" data-tab="inspect">INSPECT</div>
                <div class="tab-link" data-tab="chat">OOC</div>
                <div class="tab-link" data-tab="world">WORLD</div>
                <div class="tab-link" data-tab="help">HELP</div>
            </div>
            <div id="win-content" style="flex:1; padding:15px; overflow-y:auto;">
                <div id="tab-data">เลือกระบบที่ต้องการใช้งานจากเมนูด้านบน</div>
            </div>
        `;
        document.body.appendChild(win);

        setupEvents();
    }

    function setupEvents() {
        const btn = document.getElementById('cyber-trigger-btn');
        const win = document.getElementById('wasteland-window');
        const lockT = document.getElementById('lock-trigger');
        const lockW = document.getElementById('lock-window');

        // เปิดหน้าต่าง
        btn.addEventListener('click', () => {
            if (canMoveTrigger) return; // ถ้าอยู่ในโหมดเคลื่อนย้าย ห้ามเปิดหน้าต่าง
            win.style.display = 'flex';
        });

        // ปิดหน้าต่าง
        document.getElementById('close-win').onclick = () => {
            win.style.display = 'none';
            // ป้องกันลืมปิดโหมดเคลื่อนย้าย
            canMoveTrigger = false;
            canMoveWindow = false;
            lockT.classList.remove('active');
            lockW.classList.remove('active');
        };

        // ระบบสลับหน้าโหมดเคลื่อนย้าย
        lockT.onclick = () => {
            canMoveTrigger = !canMoveTrigger;
            lockT.classList.toggle('active');
            makeDraggable(btn, canMoveTrigger);
        };

        lockW.onclick = () => {
            canMoveWindow = !canMoveWindow;
            lockW.classList.toggle('active');
            makeDraggable(win, canMoveWindow, document.getElementById('win-header'));
        };
    }

    // ฟังก์ชันช่วยสำหรับการลาก (Native JS สำหรับ Mobile/Desktop)
    function makeDraggable(el, canMove, handle) {
        if (!canMove) {
            el.onmousedown = null;
            return;
        }
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const dragElement = handle || el;

        dragElement.onmousedown = dragMouseDown;
        dragElement.ontouchstart = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            pos3 = e.clientX || e.touches[0].clientX;
            pos4 = e.clientY || e.touches[0].clientY;
            document.onmouseup = closeDragElement;
            document.ontouchend = closeDragElement;
            document.onmousemove = elementDrag;
            document.ontouchmove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            let clientX = e.clientX || (e.touches ? e.touches[0].clientX : pos3);
            let clientY = e.clientY || (e.touches ? e.touches[0].clientY : pos4);
            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
            el.style.transform = handle ? 'none' : 'translateX(-50%)'; // แก้ไข Transform ของปุ่ม
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
        }
    }

    setInterval(initSystem, 1000);
})();
