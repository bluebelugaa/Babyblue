(function() {
    const NCS_HTML = `
    <div id="ncs-trigger-btn">X</div>
    <div id="ncs-window">
        <div class="ncs-header">
            <span style="letter-spacing:2px; color:#00e5ff;">CYBER_SYSTEM_v2.0</span>
            <div style="display:flex; gap:10px;">
                <button id="ncs-drag-t" class="ncs-btn-icon">T</button>
                <button id="ncs-drag-w" class="ncs-btn-icon">W</button>
                <button id="ncs-close" class="ncs-btn-icon" style="color:#ff0055;">X</button>
            </div>
        </div>
        <div class="ncs-nav">
            <div class="ncs-tab active" data-id="page-lore">LORE</div>
            <div class="ncs-tab" data-id="page-inspect">INSPECT</div>
            <div class="ncs-tab" data-id="page-ooc">OOC</div>
            <div class="ncs-tab" data-id="page-stat">STATUS</div>
            <div class="ncs-tab" data-id="page-help">HELP</div>
        </div>
        <div class="ncs-content">
            <div id="page-lore" class="ncs-page active"><h3>> LOREBOOK_SCANNER</h3><div id="lore-list">Scanning...</div></div>
            <div id="page-inspect" class="ncs-page">
                <h3>> MESSAGE_INSPECTOR</h3>
                <input type="number" id="insp-input" class="ooc-input" placeholder="Index (e.g. -1)">
                <button id="insp-btn" class="ncs-btn-icon">SCAN</button>
                <div id="insp-result" style="margin-top:10px; white-space:pre-wrap; font-size:12px; border-top:1px solid #333;"></div>
            </div>
            <div id="page-ooc" class="ncs-page">
                <h3>> OOC_CHANNEL</h3>
                <div id="ooc-chat" class="ooc-history"></div>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="ooc-in" class="ooc-input" style="flex:1;" placeholder="Type OOC message...">
                    <button id="ooc-send" class="ncs-btn-icon">SEND</button>
                </div>
            </div>
            <div id="page-stat" class="ncs-page">
                <div class="status-grid">
                    <div class="status-box"><h4>LOCATION</h4><div id="st-loc">-</div></div>
                    <div class="status-box"><h4>ENV/TIME</h4><div id="st-env">-</div></div>
                    <div class="status-box"><h4>CHARACTER</h4><div id="st-char">-</div></div>
                    <div class="status-box"><h4>INVENTORY</h4><div id="st-inv">-</div></div>
                </div>
            </div>
            <div id="page-help" class="ncs-page">
                <h3>> SYSTEM_HELPER</h3>
                <textarea id="help-in" class="ooc-input" style="width:100%; height:100px;"></textarea>
                <button id="help-go" class="ncs-btn-icon" style="width:100%; margin-top:10px;">EXECUTE_QUERY</button>
            </div>
        </div>
    </div>`;

    let isInit = false;

    // ฟังก์ชันยัด HTML เข้าหน้าเว็บ
    function inject() {
        if (document.getElementById('ncs-trigger-btn')) return;
        console.log("NCS: Injecting UI...");
        const container = document.createElement('div');
        container.innerHTML = NCS_HTML;
        document.body.appendChild(container);
        setupEvents();
    }

    function setupEvents() {
        const $ = window.jQuery;
        
        // เปิด/ปิด
        $('#ncs-trigger-btn').on('click', () => $('#ncs-window').fadeToggle(200).css('display', 'flex'));
        $('#ncs-close').on('click', () => {
            $('#ncs-window').fadeOut(200);
            // ปิดโหมดลากทันทีตามกฎข้อ 2
            try { $('#ncs-trigger-btn').draggable('destroy'); } catch(e){}
            try { $('#ncs-window').draggable('destroy'); } catch(e){}
            $('.ncs-btn-icon').removeClass('active');
        });

        // สลับหน้า Tabs
        $('.ncs-tab').on('click', function() {
            $('.ncs-tab').removeClass('active');
            $(this).addClass('active');
            $('.ncs-page').removeClass('active');
            $('#' + $(this).data('id')).addClass('active');
        });

        // ระบบลาก (Draggable)
        $('#ncs-drag-t').on('click', function() {
            $(this).toggleClass('active');
            if($(this).hasClass('active')) $('#ncs-trigger-btn').draggable();
            else try { $('#ncs-trigger-btn').draggable('destroy'); } catch(e){}
        });

        $('#ncs-drag-w').on('click', function() {
            $(this).toggleClass('active');
            if($(this).hasClass('active')) $('#ncs-window').draggable({handle: ".ncs-header"});
            else try { $('#ncs-window').draggable('destroy'); } catch(e){}
        });

        // OOC Send
        $('#ooc-send').on('click', () => {
            const val = $('#ooc-in').val();
            if(!val) return;
            $('#ooc-chat').append(`<div style="color:#00e5ff; margin-bottom:5px;">> ${val}</div>`);
            $('#ooc-in').val('');
            $('#ooc-chat').scrollTop($('#ooc-chat')[0].scrollHeight);
        });

        // Inspector
        $('#insp-btn').on('click', () => {
            const idx = parseInt($('#insp-input').val());
            const chat = window.SillyTavern?.getContext()?.chat;
            if(!chat) return;
            const target = idx < 0 ? chat[chat.length + idx] : chat[idx];
            $('#insp-result').text(target ? target.mes : "Not Found");
        });
    }

    // วนลูปเช็คจนกว่าจะฉีดโค้ดได้ (แก้ปัญหาปุ่มไม่ขึ้น)
    const interval = setInterval(() => {
        if (document.body) {
            inject();
            if (document.getElementById('ncs-trigger-btn')) clearInterval(interval);
        }
    }, 1000);

})();
