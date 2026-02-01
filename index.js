(function() {
    function injectSpiralButton() {
        if (document.getElementById('cyber-trigger-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';

        // ใส่อิโมจิ 🌀 ด้านใน
        btn.innerHTML = `<span class="cyber-spiral">🌀</span>`;

        btn.onclick = function() {
            // โค้ดสำหรับเปิดหน้าต่าง (จะเริ่มเขียนในพาร์ทถัดไป)
            console.log("Spiral System Initiated");
            
            // ตัวอย่างสร้างหน้าต่างเล็กๆ มาแจ้งเตือน
            const notify = document.createElement('div');
            notify.style = "position:fixed; top:15%; left:50%; transform:translateX(-50%); background:black; color:#00ffff; border:1px solid #ff00ff; padding:5px 10px; z-index:1000000; font-size:12px; font-family:monospace;";
            notify.innerText = "> SYSTEM_REBOOTING...";
            document.body.appendChild(notify);
            setTimeout(() => notify.remove(), 1500);
        };

        document.body.appendChild(btn);
    }

    // เช็คทุก 1 วินาที เผื่อหน้าจอมีการรีเฟรช
    setInterval(injectSpiralButton, 1000);
})();
