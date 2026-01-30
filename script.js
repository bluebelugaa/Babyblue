// script.js (Part of Extension)
(function() {
    let isLauncherDraggable = false;
    let isWindowDraggable = false;
    
    const launcher = document.getElementById('cyber-extension-launcher');
    const windowEl = document.getElementById('cyber-main-window');
    
    // ฟังก์ชันทำให้ Element ลากได้
    function makeDraggable(el, handle, conditionGetter) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (!conditionGetter()) return; // ถ้าไม่ติ๊กยอมรับ ห้ามลาก
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // ป้องกันการลากออกนอกขอบจอจนหาไม่เจอ
            let newTop = el.offsetTop - pos2;
            let newLeft = el.offsetLeft - pos1;
            
            if (newTop > 0 && newTop < window.innerHeight - 50) el.style.top = newTop + "px";
            if (newLeft > 0 && newLeft < window.innerWidth - 50) el.style.left = newLeft + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // ระบบป้องกันการลืมปิดตัวเลือกเคลื่อนย้าย
    function safeToggleWindow() {
        if (windowEl.style.display === "none") {
            windowEl.style.display = "flex";
        } else {
            // ก่อนปิดหน้าต่าง ให้ปิดโหมดการเคลื่อนย้ายอัตโนมัติเพื่อความปลอดภัย
            isLauncherDraggable = false;
            isWindowDraggable = false;
            updateLockVisuals();
            windowEl.style.display = "none";
        }
    }

    // สั่งรันระบบ
    makeDraggable(launcher, launcher, () => isLauncherDraggable);
    makeDraggable(windowEl, document.querySelector('.cyber-header'), () => isWindowDraggable);
})();

