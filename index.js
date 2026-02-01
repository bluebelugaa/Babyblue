(function() {
    let moveT = false, moveW = false;
    let dropletInterval; // สำหรับเก็บ interval ของหยดน้ำ

    function buildSystem() {
        if (document.getElementById('cyber-trigger-btn')) return;

        // 1. สร้างปุ่มกลม (The Droplet Orb)
        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';
        document.body.appendChild(btn);

        // เริ่มสร้างหยดน้ำทุก 0.5-1.5 วินาที
        dropletInterval = setInterval(() => {
            const drop = document.createElement('div');
            drop.classList.add('water-drop');
            // สุ่มตำแหน่ง X
            drop.style.left = (Math.random() * 80 + 10) + '%'; 
            // สุ่ม delay เพื่อให้ดูเป็นธรรมชาติ
            drop.style.animationDelay = (Math.random() * 0.5) + 's';
            btn.appendChild(drop);

            // ลบหยดน้ำเมื่อ Animation จบ
            drop.addEventListener('animationend', () => {
                drop.remove();
            });
        }, 800); // ทุก 0.8 วินาที

        // 2. สร้างหน้าต่าง Panel
        const panel = document.createElement('div');
        panel.id = 'wasteland-panel';
        panel.innerHTML = `
            <div id="panel-header" style="padding:15px; background:#111; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(137,212,255,0.1);">
                <span style="font-size:10px; color:#555; letter-spacing:2px;">WASTELAND_UI_v2.1</span>
                <div style="display:flex; gap:8px;">
                    <div id="m-t-btn" class="ctrl-tag">MOVE_T</div>
                    <div id="m-w-btn" class="ctrl-tag">MOVE_W</div>
                    <div id="close-p" class="ctrl-tag" style="color:#ff6b6b;">[X]</div>
                </div>
            </div>
            <div class="nav-container">
                <div class="nav-tab active" onclick="loadTab('lore')">LOREBOOK</div>
                <div class="nav-tab" onclick="loadTab('inspect')">INSPECTOR</div>
                <div class="nav-tab" onclick="loadTab('chat')">OOC_CHAT</div>
                <div class="nav-tab" onclick="loadTab('world')">WORLD_STATE</div>
                <div class="nav-tab" onclick="loadTab('help')">ASSIST</div>
            </div>
            <div id="panel-body" style="flex:1; padding:20px; overflow-y:auto; color:#999; font-size:13px;">
                <p>ระบบพร้อมใช้งาน. โปรดเลือกฟังก์ชันจากเมนูด้านบน.</p>
                </div>
        `;
        document.body.appendChild(panel);

        const s = document.createElement('style');
        s.innerHTML = `
            .ctrl-tag { font-size: 8px; border: 1px solid #333; padding: 2px 6px; cursor: pointer; border-radius: 2px; }
            .ctrl-tag.on { border-color: var(--soft-ice-blue); color: var(--soft-ice-blue); }
            .nav-container::-webkit-scrollbar { display: none; }
        `;
        document.head.appendChild(s);

        attachEvents();
    }

    function attachEvents() {
        const btn = document.getElementById('cyber-trigger-btn');
        const panel = document.getElementById('wasteland-panel');
        const mt = document.getElementById('m-t-btn');
        const mw = document.getElementById('m-w-btn');

        btn.onclick = () => { if (!moveT) panel.style.display = 'flex'; };

        document.getElementById('close-p').onclick = () => {
            panel.style.display = 'none';
            moveT = false; moveW = false;
            mt.classList.remove('on'); mw.classList.remove('on');
            toggleDrag(btn, false);
            toggleDrag(panel, false);
        };

        mt.onclick = () => {
            moveT = !moveT;
            mt.classList.toggle('on');
            toggleDrag(btn, moveT);
        };

        mw.onclick = () => {
            moveW = !moveW;
            mw.classList.toggle('on');
            toggleDrag(panel, moveW, document.getElementById('panel-header'));
        };
    }

    function toggleDrag(el, enable, handle) {
        const target = handle || el;
        if (!enable) { target.ontouchmove = null; return; }
        target.ontouchmove = (e) => {
            e.preventDefault();
            let touch = e.touches[0];
            el.style.left = touch.clientX + 'px';
            el.style.top = touch.clientY + 'px';
            el.style.transform = 'translate(-50%, -50%)';
        };
    }
    
    // Global function for tab switching (จะใช้ในส่วนถัดไป)
    window.loadTab = function(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.nav-tab[onclick="loadTab('${tabName}')"]`).classList.add('active');
        
        const panelBody = document.getElementById('panel-body');
        panelBody.innerHTML = `<p>Loading ${tabName.toUpperCase()} data...</p>`;
        
        // Placeholder สำหรับเนื้อหาจริงของแต่ละ Tab
        switch(tabName) {
            case 'lore': panelBody.innerHTML = '<h3>> LOREBOOK_SCANNER</h3><p>ระบบตรวจสอบ Lorebook ยังไม่ได้ติดตั้ง.</p>'; break;
            case 'inspect': panelBody.innerHTML = '<h3>> MESSAGE_INSPECTOR</h3><p>ระบบตรวจสอบข้อความยังไม่ได้ติดตั้ง.</p>'; break;
            case 'chat': panelBody.innerHTML = '<h3>> OOC_CHANNEL</h3><p>ระบบ OOC Chat ยังไม่ได้ติดตั้ง.</p>'; break;
            case 'world': panelBody.innerHTML = '<h3>> WORLD_STATE</h3><p>ระบบสถานะโลกยังไม่ได้ติดตั้ง.</p>'; break;
            case 'help': panelBody.innerHTML = '<h3>> AI_ASSIST</h3><p>ระบบช่วยเหลือ AI ยังไม่ได้ติดตั้ง.</p>'; break;
        }
    };

    setInterval(buildSystem, 1000); // เช็คและสร้างปุ่ม/หน้าต่างทุกวินาที
})();
