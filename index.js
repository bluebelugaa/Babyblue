(function () {
    const EXTENSION_NAME = "CyberCore Nexus";
    let isLauncherLocked = true; 
    let isWindowLocked = true;   

    function init() {
        if (document.getElementById('nexus-root')) return;

        const root = document.createElement('div');
        root.id = 'nexus-root';
        document.body.appendChild(root);

        // Launcher
        const launcher = document.createElement('div');
        launcher.id = 'nexus-launcher';
        launcher.className = 'nexus-launcher';
        launcher.innerHTML = '🌀';
        root.appendChild(launcher);

        // Window
        const win = document.createElement('div');
        win.id = 'nexus-window';
        win.className = 'nexus-window';
        win.innerHTML = `
            <div class="nexus-header" id="nexus-header-drag">
                <div style="display:flex; gap:5px;">
                    <button id="btn-unlock-launcher" class="nexus-btn">Move 🌀</button>
                    <button id="btn-unlock-window" class="nexus-btn">Move Win</button>
                </div>
                <button id="btn-close-nexus" class="nexus-btn danger">CLOSE X</button>
            </div>

            <div class="nexus-body">
                <div id="page-lore" class="nexus-page active">
                    <h3>📜 Lorebook Monitor</h3>
                    <p>System Ready...</p>
                </div>
                <div id="page-check" class="nexus-page">
                    <h3>🔍 Inspector</h3>
                    <p>No selection.</p>
                </div>
                <div id="page-chat" class="nexus-page">
                    <h3>💬 Chat</h3>
                    <div style="height:100px; border:1px solid #003300; color:#55aa55; padding:5px;">Simulation Log...</div>
                </div>
                <div id="page-status" class="nexus-page">
                    <h3>🌎 Status</h3>
                    <p>Location: Unknown</p>
                </div>
                <div id="page-help" class="nexus-page">
                    <h3>❓ Help</h3>
                    <p>Tap buttons above to unlock movement.</p>
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

        setupEvents(launcher, win);
    }

    window.nexusSwitchPage = function(pageName, tabElement) {
        document.querySelectorAll('.nexus-page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`page-${pageName}`).classList.add('active');
        tabElement.classList.add('active');
    };

    function setupEvents(launcher, win) {
        const btnMoveLauncher = document.getElementById('btn-unlock-launcher');
        const btnMoveWin = document.getElementById('btn-unlock-window');
        const btnClose = document.getElementById('btn-close-nexus');
        
        let isDragging = false;

        // กดที่ลูกแก้ว
        launcher.addEventListener('click', () => {
            if (!isDragging && isLauncherLocked) {
                // เอฟเฟกต์กด
                launcher.classList.add('hover-active');
                setTimeout(() => launcher.classList.remove('hover-active'), 200);
                
                win.style.display = 'flex';
            }
        });

        btnClose.addEventListener('click', () => {
            win.style.display = 'none';
            isLauncherLocked = true;
            isWindowLocked = true;
            btnMoveLauncher.classList.remove('active');
            btnMoveWin.classList.remove('active');
        });

        btnMoveLauncher.addEventListener('click', () => {
            isLauncherLocked = !isLauncherLocked;
            btnMoveLauncher.classList.toggle('active', !isLauncherLocked);
            launcher.style.cursor = isLauncherLocked ? 'pointer' : 'move';
        });

        btnMoveWin.addEventListener('click', () => {
            isWindowLocked = !isWindowLocked;
            btnMoveWin.classList.toggle('active', !isWindowLocked);
        });

        makeDraggable(launcher, () => !isLauncherLocked, (d) => isDragging = d);
        makeDraggable(win, () => !isWindowLocked, null, document.getElementById('nexus-header-drag'));
    }

    function makeDraggable(element, checkUnlock, callback, handle = element) {
        let pos1=0, pos2=0, pos3=0, pos4=0;
        
        handle.onmousedown = dragStart;
        handle.ontouchstart = dragStart;

        function dragStart(e) {
            if (!checkUnlock()) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            pos3 = clientX; pos4 = clientY;
            document.onmouseup = closeDrag; document.ontouchend = closeDrag;
            document.onmousemove = dragging; document.ontouchmove = dragging;
            if(callback) callback(true);
        }

        function dragging(e) {
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            pos1 = pos3 - clientX; pos2 = pos4 - clientY;
            pos3 = clientX; pos4 = clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.transform = "none";
        }

        function closeDrag() {
            document.onmouseup = null; document.onmousemove = null;
            document.ontouchend = null; document.ontouchmove = null;
            if(callback) setTimeout(() => callback(false), 100);
        }
    }

    setTimeout(init, 2000);
})();
