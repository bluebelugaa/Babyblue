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

// เพิ่มเข้าไปในไฟล์ script.js ต่อจาก Part 1

async function updateLorebookInfo() {
    const context = Cypress.getContext(); // ดึง context จาก SillyTavern
    const lastMessage = context.chat[context.chat.length - 1]?.mes || "";
    const lorebookEntries = context.lorebook?.entries || {};
    
    let activeEntries = [];

    // ตรวจสอบว่าคำไหนใน Lorebook ทริกเกอร์บ้าง
    for (let key in lorebookEntries) {
        const entry = lorebookEntries[key];
        const keywords = entry.keywords || [];
        
        keywords.forEach(kw => {
            if (lastMessage.toLowerCase().includes(kw.toLowerCase())) {
                activeEntries.push({
                    name: entry.name || key,
                    triggeredBy: kw
                });
            }
        });
    }

    const loreListContainer = document.getElementById('lore-list');
    loreListContainer.innerHTML = activeEntries.map(e => `
        <div class="lore-item">
            <span class="lore-name">${e.name}</span>
            <span class="lore-tag">Triggered: "${e.triggeredBy}"</span>
        </div>
    `).join('') || "ไม่มี Lorebook ทริกเกอร์ในข้อความล่าสุด";
}

// ระบบตรวจสอบข้อความเก่าด้วยตัวเลข
function inspectMessageByIndex() {
    const inputNum = document.getElementById('inspect-number-input').value;
    const context = Cypress.getContext();
    const msg = context.chat[inputNum];

    const displayArea = document.getElementById('inspect-display');
    if (msg) {
        displayArea.innerText = `[Message #${inputNum} - ${msg.name}]: \n${msg.mes}`;
        displayArea.style.display = 'block';
    } else {
        displayArea.innerText = "ไม่พบข้อความที่ระบุ";
    }
}
