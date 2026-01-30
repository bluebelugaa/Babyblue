import { getContext, addChatGameObjectListener } from "../../../extensions.js";
import { 
    updateLorebookInfo, 
    updateCharacterDisplay, 
    initDraggableSystem,
    renderSideChat 
} from "./script.js";

(function() {
    async function initExtension() {
        // โหลด HTML Interface
        const response = await fetch('/extensions/cyber-companion/window.html');
        const html = await response.text();
        $('body').append(html);
        
        // เริ่มต้นระบบเคลื่อนย้ายและ UI
        initDraggableSystem();
        
        // ดักจับเหตุการณ์: ทุกครั้งที่มีการส่ง/รับข้อความ
        addChatGameObjectListener(() => {
            console.log("Cyber-Companion: Synchronizing Data...");
            updateLorebookInfo();
            updateCharacterDisplay();
            renderSideChat(); // อัพเดทแชทเพื่อนเม้าท์
        });

        console.log("Cyber-Companion X: Online");
    }

    $(document).ready(initExtension);
})();

