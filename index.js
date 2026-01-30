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
