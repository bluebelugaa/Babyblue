(function() {
    let tLocked = true; // เริ่มต้นที่ล็อคไว้เสมอ
    let wLocked = true;

    function createPremiumUI() {
        if (document.getElementById('cyber-trigger-btn')) return;

        // สร้างปุ่ม (Trigger)
        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';
        btn.innerHTML = `<span class="frost-spiral">🌀</span>`;
        document.body.appendChild(btn);

        // สร้างหน้าต่าง (Main Window)
        const win = document.createElement('div');
        win.id = 'wasteland-window';
        win.innerHTML = `
            <div class="win-header" id="win-drag-handle">
                <span class="win-title">Wasteland_Core_OS</span>
                <div style="display:flex; gap:10px;">
                    <div id="btn-t-lock" class="mini-tag">T_LOCK</div>
                    <div id="btn-w-lock" class="mini-tag">W_LOCK</div>
                    <div id="btn-close" class="mini-tag" style="color:#ff6b6b;">[X]</div>
                </div>
            </div>
            
            <div id="content-container" style="flex:1; overflow-y:auto; padding:20px;">
                <div id="page-lore">ระบบกำลังเตรียมการ...</div>
            </div>

            <div class="footer-nav">
                <div class="nav-btn active" onclick="navTo('lore')">LORE</div>
                <div class="nav-btn" onclick="navTo('inspect')">INSPECT</div>
                <div class="nav-btn" onclick="navTo('ooc')">OOC</div>
                <div class="nav-btn" onclick="navTo('world')">WORLD</div>
            </div>
        `;
        document.body.appendChild(win);

        // ใส่สไตล์เสริม
        const s = document.createElement('style');
        s.innerHTML = `
            .mini-tag { font-size: 9px; border: 1px solid #444; padding: 2px 6px; cursor: pointer; color: #888; border-radius: 3px; }
            .mini-tag.unlocked { color: var(--ice-blue); border-color: var(--ice-blue); box-shadow: 0 0 5px var(--ice-blue); }
            .footer-nav { display: flex; height: 60px; background: #111; border-top: 1px solid #222; }
            .nav-btn { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; cursor: pointer; color: #555; transition: 0.3s; }
            .nav-btn.active { color: var(--ice-blue); background: rgba(176,234,255,0.05); }
        `;
        document.head.appendChild(s);

        initEvents();
    }

    function initEvents() {
        const btn = document.getElementById('cyber-trigger-btn');
        const win = document.getElementById('wasteland-window');
        const lockT = document.getElementById('btn-t-lock');
        const lockW = document.getElementById('btn-w-lock');

        // เปิดหน้าต่าง
        btn.onclick = () => {
            if (!tLocked) return; // ถ้าไม่ได้ล็อคปุ่มไว้ (กำลังเลื่อน) ห้ามเปิด
            win.style.display = 'flex';
        };

        // ปิดหน้าต่าง + รีเซ็ตโหมดการเลื่อนทันที (กันลืมปิดแล้วใช้งานไม่ได้)
        document.getElementById('btn-close').onclick = () => {
            win.style.display = 'none';
            tLocked = true; wLocked = true;
            lockT.classList.remove('unlocked');
            lockW.classList.remove('unlocked');
            stopDrag(btn);
            stopDrag(win);
        };

        // ตั้งค่าการเลื่อนปุ่ม X
        lockT.onclick = () => {
            tLocked = !tLocked;
            lockT.classList.toggle('unlocked');
            lockT.innerText = tLocked ? "T_LOCKED" : "T_FREE";
            if (!tLocked) startDrag(btn); else stopDrag(btn);
        };

        // ตั้งค่าการเลื่อนหน้าต่าง
        lockW.onclick = () => {
            wLocked = !wLocked;
            lockW.classList.toggle('unlocked');
            lockW.innerText = wLocked ? "W_LOCKED" : "W_FREE";
            if (!wLocked) startDrag(win, document.getElementById('win-drag-handle')); else stopDrag(win);
        };
    }

    function startDrag(el, handle) {
        const target = handle || el;
        target.ontouchmove = (e) => {
            e.preventDefault();
            let t = e.touches[0];
            el.style.left = t.clientX + 'px';
            el.style.top = t.clientY + 'px';
            el.style.transform = handle ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)';
        };
    }

    function stopDrag(el) {
        el.ontouchmove = null;
    }

    setInterval(createPremiumUI, 1000);
})();
