(function() {
    function injectWastelandButton() {
        if (document.getElementById('cyber-trigger-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';

        // สร้างสัญลักษณ์วงกลมสไตล์โลกล่มสลาย
        btn.innerHTML = `
            <svg class="wasteland-circle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="#4a4a4a" stroke-width="4" fill="rgba(30,30,30,0.7)" />
                <circle cx="50" cy="50" r="38" stroke="#8e8e8e" stroke-width="1" fill="none" stroke-dasharray="5,3" />
                
                <path d="M35 35 L65 65 M65 35 L35 65" 
                      stroke="#cd7f32" 
                      stroke-width="10" 
                      stroke-linecap="butt" 
                      style="opacity: 0.8;" />
                
                <path d="M50 5 L50 15 M95 50 L85 50 M50 95 L50 85 M5 50 L15 50" 
                      stroke="#4a4a4a" stroke-width="2" />
            </svg>
        `;

        btn.onclick = function() {
            // Placeholder สำหรับเปิดหน้าต่างระบบ
            const msg = document.createElement('div');
            msg.style = "position:fixed; top:20%; left:50%; transform:translateX(-50%); background:#222; color:#cd7f32; padding:10px; border:1px solid #444; z-index:1000000; font-family:monospace;";
            msg.innerText = "WASTELAND_SYSTEM: BOOTING...";
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
        };

        document.body.appendChild(btn);
    }

    setInterval(injectWastelandButton, 1000);
})();

