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

// ตัวแปรเก็บข้อมูลแชทคุยเล่น
let sideChatLogs = JSON.parse(localStorage.getItem('cyber_sidechat_logs') || '{}');
let currentCharacterName = "";

// ฟังก์ชันดึงชื่อรูท (ชื่อตัวละครที่กำลังคุย)
function getChatRoot() {
    const context = Cypress.getContext();
    return context.character_tag || "default_root";
}

// ระบบบันทึกแชทคุยเล่นแบบแยกรูท
function saveSideChat(message, isAI = false) {
    const root = getChatRoot();
    if (!sideChatLogs[root]) sideChatLogs[root] = [];
    
    sideChatLogs[root].push({
        sender: isAI ? "AI-Buddy" : "User",
        text: message,
        timestamp: new Date().toLocaleTimeString()
    });
    
    localStorage.setItem('cyber_sidechat_logs', JSON.stringify(sideChatLogs));
    renderSideChat();
}

// คำสั่งพิเศษส่งให้ AI (Hidden Prompt)
const SIDE_CHAT_PROMPT = `
[System Note: ต่อไปนี้คุณคือ "เพื่อนสนิท" ที่กำลังแอบดูการโรลเพลย์นี้อยู่ 
หน้าที่ของคุณคือชวนผู้ใช้เม้าท์เกี่ยวกับเหตุการณ์ที่เพิ่งเกิดขึ้น 
ห้ามใช้คำพูดเป็นทางการ ห้ามสวมบทตัวละครในโรล 
ให้คุยแบบเพื่อนซี้ที่ขี้นินทาและคอยเชียร์อยู่ข้างๆ แยกขาดจากเนื้อเรื่องหลัก]
`;

async function talkToSideAI(userInput) {
    const context = Cypress.getContext();
    const lastHistory = context.chat.slice(-3); // ดึง 3 ข้อความล่าสุดมาให้ AI เพื่อนวิเคราะห์
    
    // ตรงนี้จะใช้ API ของ SillyTavern ส่ง prompt ลับไปถาม AI
    // โดยที่ไม่ให้ข้อความนี้โผล่ในแชทหลัก
}

