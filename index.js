import { extension_settings, getContext } from "../../../extensions.js";

// ลงทะเบียนปุ่มและหน้าต่างเข้าสู่หน้าจอ SillyTavern
(function() {
    async function initExtension() {
        const html = await fetch('/extensions/cyber-companion/window.html'); // โหลดโครงสร้าง HTML
        const content = await html.text();
        $('body').append(content);
        
        console.log("Cyberpunk Companion Extension Loaded!");
    }

    $(document).ready(initExtension);
})();


