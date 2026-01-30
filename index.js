import { extension_settings, getContext, addChatGameObjectListener } from "../../../extensions.js";
import { updateLorebookInfo, updateCharacterDisplay } from "./script.js";

(function() {
    async function initExtension() {
        // 1. โหลดโครงสร้างหน้าต่าง
        const response = await fetch('/extensions/cyber-companion/window.html');
        const html = await response.text();
        $('body').append(html);
        
        // 2. ตั้งค่าเริ่มต้นให้ UI
        console.log("Cyber-Companion: System Initialized");

        // 3. สำคัญ: ดักจับเหตุการณ์เมื่อมีการรับ/ส่งข้อความ (Event Listener)
        // เพื่อให้ Lorebook และ Status อัปเดตอัตโนมัติ
        addChatGameObjectListener(() => {
            updateLorebookInfo(); // ตรวจสอบ Lorebook ทันทีที่แชทขยับ
            updateCharacterDisplay(); // อัปเดตสถานะตัวละคร
        });
    }

    $(document).ready(initExtension);
})();

// script.js (ส่วนขยายข้อ 2)
function createNumpad() {
    const container = document.getElementById('numpad-container');
    // สร้างปุ่ม 0-9 และปุ่มล้างตัวเลข
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'num-btn';
        btn.innerText = i;
        btn.onclick = () => {
            const input = document.getElementById('inspect-number-input');
            input.value += i;
            inspectMessage(input.value);
        };
        container.appendChild(btn);
    }
    // เพิ่มปุ่มล้าง (C) และปุ่มปิด (X)
    const clearBtn = document.createElement('button');
    clearBtn.className = 'num-btn clear';
    clearBtn.innerText = 'C';
    clearBtn.onclick = () => { document.getElementById('inspect-number-input').value = ''; };
    container.appendChild(clearBtn);
}

function inspectMessage(index) {
    const context = getContext();
    const msg = context.chat[index];
    const display = document.getElementById('inspect-display');
    const screen = document.getElementById('inspect-screen-wrapper');

    if (msg) {
        screen.style.display = 'block'; // เปิดหน้าต่างแสดงข้อความ
        display.innerHTML = `
            <div class="msg-header">MESSAGE #${index} - SENT BY: ${msg.name}</div>
            <div class="msg-content">${msg.mes}</div>
            <button class="close-inspect" onclick="this.parentElement.parentElement.style.display='none'">[ CLOSE X ]</button>
        `;
    }
}

