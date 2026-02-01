// index.js - Force Load Version

console.log(">>> Neon Cyberpunk: Script Loaded");

(function() {
    // ฟังก์ชันสร้างปุ่ม
    function createTriggerButton() {
        // ถ้ามีปุ่มอยู่แล้ว ไม่ต้องทำอะไร
        if (document.getElementById('cyber-trigger-btn')) return;

        console.log(">>> Neon Cyberpunk: Creating Button...");

        // สร้าง Element ปุ่ม
        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';
        btn.innerHTML = 'X';
        btn.title = 'Open Cyberpunk System';

        // Event คลิก (ใส่ไว้เทสว่ากดติดไหม)
        btn.onclick = function() {
            alert('SYSTEM ONLINE: ยินดีต้อนรับสู่ Cyberpunk Interface');
            // เดี๋ยวเราค่อยใส่โค้ดเปิดหน้าต่างตรงนี้
        };

        // ยัดใส่ Body โดยตรง
        document.body.appendChild(btn);
    }

    // เทคนิค: ST เป็น Single Page App บางทีโหลดเสร็จแล้ว Elements เปลี่ยน
    // เราจะเช็คทุกๆ 1 วินาที ว่าปุ่มยังอยู่ไหม (ถ้าไม่อยู่ก็สร้างใหม่)
    setInterval(createTriggerButton, 1000);

    // รันครั้งแรกทันที
    setTimeout(createTriggerButton, 500);
})();
