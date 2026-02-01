// index.js
console.log("!!! NEON SYSTEM: STARTING LOAD !!!"); // เช็คว่าไฟล์โหลดไหม

(function() {
    function injectButton() {
        // 1. เช็คว่ามีปุ่มหรือยัง ถ้ามีแล้วให้หยุด
        if (document.getElementById('cyber-trigger-btn')) return;

        console.log("!!! NEON SYSTEM: Injecting Button !!!");

        // 2. สร้างปุ่ม
        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';
        btn.innerHTML = 'X';
        
        // 3. ใส่ Event คลิก (ทดสอบ)
        btn.addEventListener('click', () => {
            alert("Cyberpunk System: Active!");
        });

        // 4. ยัดใส่หน้าเว็บ
        document.body.appendChild(btn);
    }

    // สั่งให้เช็คทุกๆ 1 วินาที (เผื่อ ST โหลดช้า)
    setInterval(injectButton, 1000);
    
    // ลองยัดทันทีด้วย
    setTimeout(injectButton, 500);
})();
