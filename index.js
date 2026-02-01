(function() {
    let isTMove = false;
    let isWMove = false;

    function buildWastelandUI() {
        if (document.getElementById('cyber-trigger-btn')) return;

        // สร้างปุ่ม Trigger
        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';
        btn.innerHTML = `<span class="frost-spiral">🌀</span>`;
        document.body.appendChild(btn);

        // สร้างหน้าต่างหลัก
        const win = document.createElement('div');
        win.id = 'wasteland-window';
        win.innerHTML = `
            <div class="close-corner" id="win-x">CLOSE [X]</div>
            
            <div style="padding: 15px; border-bottom: 1px solid #333; display: flex; gap: 10px; align-items: center;">
                <span style="color:var(--ice-glow); font-size: 12px;">SYSTEM_OVERRIDE //</span>
                <button id="set-t" class="scrap-btn">LOCK T</button>
                <button id="set-w" class="scrap-btn">LOCK W</button>
            </div>

            <div id="page-container" style="flex: 1; overflow-y: auto; padding: 20px; position: relative;">
                <div id="content-area">ยินดีต้อนรับสู่ระบบประมวลผลซากปรักหักพัง...</div>
            </div>

            <div style="display: flex; background: #0a0a0a; border-top: 1px solid #333;">
                <div class="nav-item" onclick="changePage('lore')">LORE</div>
                <div class="nav-item" onclick="changePage('inspect')">INSPECT</div>
                <div class="nav-item" onclick="changePage('ooc')">OOC</div>
                <div class="nav-item" onclick="changePage('world')">WORLD</div>
            </div>
        `;
        document.body.appendChild(win);

        // CSS เพิ่มเติมสำหรับปุ่มในหน้าต่าง
        const style = document.createElement('style');
        style.innerHTML = `
            .scrap-btn { background: none; border: 1px solid #444; color: #666; font-size: 10px; padding: 2px 5px; cursor: pointer; }
            .scrap-btn.active { border-color: var(--ice-glow); color: var(--ice-glow); box-shadow: 0 0 5px var(--ice-glow); }
            .nav-item { flex: 1; text-align: center; padding: 15px 5px; font-size: 11px; cursor: pointer; border-right: 1px solid #222; }
            .nav-item:hover { color: var(--ice-glow); background: rgba(255,255,255,0.02); }
        `;
        document.head.appendChild(style);

        attachLogic();
    }

    function attachLogic() {
        const btn = document.getElementById('cyber-trigger-btn');
        const win = document.getElementById('wasteland-window');
        const setT = document.getElementById('set-t');
        const setW = document.getElementById('set-w');

        // คลิกปุ่มเปิด
        btn.onclick = () => {
            if (isTMove) return; // ถ้ากำลังลาก ห้ามเปิด
            win.style.display = 'flex';
        };

        // ปุ่ม X ปิดหน้าต่าง (จะ Reset สถานะทั้งหมดป้องกันค้าง)
        document.getElementById('win-x').onclick = () => {
            win.style.display = 'none';
            isTMove = false; isWMove = false;
            setT.classList.remove('active');
            setW.classList.remove('active');
            setT.innerText = "LOCK T";
            setW.innerText = "LOCK W";
            // ยกเลิกการลาก
            stopDragging(btn);
            stopDragging(win);
        };

        // ระบบปลดล็อคการเคลื่อนย้าย
        setT.onclick = () => {
            isTMove = !isTMove;
            setT.classList.toggle('active');
            setT.innerText = isTMove ? "UNLOCK T" : "LOCK T";
            if(isTMove) startDragging(btn); else stopDragging(btn);
        };

        setW.onclick = () => {
            isWMove = !isWMove;
            setW.classList.toggle('active');
            setW.innerText = isWMove ? "UNLOCK W" : "LOCK W";
            if(isWMove) startDragging(win); else stopDragging(win);
        };
    }

    // --- ระบบ Drag แบบกันหลุด (Mobile Friendly) ---
    function startDragging(el) {
        let x = 0, y = 0;
        el.ontouchmove = (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            el.style.left = touch.clientX + 'px';
            el.style.top = touch.clientY + 'px';
            el.style.transform = 'translate(-50%, -50%)';
        };
    }

    function stopDragging(el) {
        el.ontouchmove = null;
    }

    setInterval(buildWastelandUI, 1000);
})();
