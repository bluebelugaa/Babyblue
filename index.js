(function() {
    function injectCyberButton() {
        if (document.getElementById('cyber-trigger-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'cyber-trigger-btn';

        // สร้างสัญลักษณ์ X แบบกราฟิก SVG
        btn.innerHTML = `
            <svg class="cyber-cross" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <line x1="20" y1="20" x2="80" y2="80" stroke="#ff00ff" stroke-width="8" stroke-linecap="square" />
                <line x1="80" y1="20" x2="20" y2="80" stroke="#00ffff" stroke-width="8" stroke-linecap="square" />
                
                <circle cx="20" cy="20" r="3" fill="#00ffff" />
                <circle cx="80" cy="80" r="3" fill="#ff00ff" />
                <circle cx="80" cy="20" r="3" fill="#00ffff" />
                <circle cx="20" cy="80" r="3" fill="#ff00ff" />
            </svg>
        `;

        btn.addEventListener('click', () => {
            console.log("Cyber System Opening...");
            // เดี๋ยวจะเขียนโค้ดเปิดหน้าต่างที่มีปุ่ม Settings และเมนูหน้าถัดไปในพาร์ทหน้าครับ
        });

        document.body.appendChild(btn);
    }

    setInterval(injectCyberButton, 1000);
})();
