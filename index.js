import { 
    extension_settings, 
    getContext, 
    saveSettingsDebounced, 
    eventSource, 
    event_types, 
    saveChat 
} from '../../../../script.js';

// ตั้งชื่อ Extension
const EXT_NAME = "FrostHUD";
const DEF_SETTINGS = {
    locked: true,
    pos_trigger: { top: '100px', left: '20px' },
    pos_window: { top: '50px', left: '50px' }
};

let settings = {};

// ฟังก์ชันโหลด Settings
function loadMySettings() {
    settings = Object.assign({}, DEF_SETTINGS, extension_settings[EXT_NAME]);
}

// ฟังก์ชันหลักเริ่มทำงาน
function initFrostProtocol() {
    console.log("❄️ FROST HUD: Starting..."); // เช็คใน Console (F12) ได้ถ้ามีคอม

    // ลบอันเก่าออกก่อนกันซ้ำ
    $('#frost-trigger').remove();
    $('#frost-container').remove();

    // สร้าง HTML
    const html = `
    <div id="frost-trigger">X</div>
    
    <div id="frost-container">
        <div class="frost-header" id="frost-header-drag">
            <span style="font-weight:bold; letter-spacing:1px;">❄️ FROST SYSTEM</span>
            <div>
                <button id="frost-lock" style="background:none; border:none; color:#00d2ff; font-size:1.2em;">🔒</button>
                <button id="frost-close" style="background:none; border:none; color:red; font-size:1.2em; margin-left:10px;">✖</button>
            </div>
        </div>
        
        <div class="frost-tabs">
            <div class="frost-tab-btn active" onclick="alert('Working!')">Test Tab</div>
            <div class="frost-tab-btn">Status</div>
            <div class="frost-tab-btn">Lore</div>
        </div>

        <div class="frost-content">
            <p>System Online.</p>
            <p>ถ้าเห็นหน้านี้แสดงว่าติดตั้งสำเร็จ!</p>
        </div>
    </div>
    `;

    $('body').append(html);

    // Apply Settings Position
    if(settings.pos_trigger) {
        $('#frost-trigger').css({ top: settings.pos_trigger.top, left: settings.pos_trigger.left });
    }

    // Events
    $('#frost-trigger').on('click', function() {
        if (!settings.locked) return; // ถ้าปลดล็อคอยู่ (กำลังลาก) ไม่ให้กดเปิด
        $(this).hide();
        $('#frost-container').fadeIn(200).css('display', 'flex');
    });

    $('#frost-close').on('click', function() {
        $('#frost-container').hide();
        $('#frost-trigger').fadeIn(200);
    });

    $('#frost-lock').on('click', function() {
        settings.locked = !settings.locked;
        $(this).text(settings.locked ? '🔒' : '🔓');
        
        // แจ้งเตือน
        if(typeof toastr !== 'undefined') {
            toastr.info(settings.locked ? "Movement Locked" : "Movement UNLOCKED - Drag X or Window now");
        }
        
        // เปลี่ยน Cursor
        $('#frost-trigger, #frost-header-drag').css('cursor', settings.locked ? 'pointer' : 'move');
    });

    // เริ่มระบบลาก
    setupDraggable();
    
    // แจ้งเตือนว่าโหลดเสร็จ
    if(typeof toastr !== 'undefined') toastr.success("❄️ Frost HUD Loaded!");
}

// ระบบลาก (Drag)
function setupDraggable() {
    makeDraggable(document.getElementById("frost-trigger"), "pos_trigger");
    makeDraggable(document.getElementById("frost-container"), "pos_window", document.getElementById("frost-header-drag"));
}

function makeDraggable(elmnt, settingKey, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragItem = handle || elmnt;

    dragItem.onmousedown = dragMouseDown;
    dragItem.ontouchstart = dragMouseDown; // Support Mobile

    function dragMouseDown(e) {
        if (settings.locked) return; // ถ้าล็อคอยู่ ห้ามลาก

        e = e || window.event;
        // e.preventDefault(); 
        
        if (e.type === 'touchstart') {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
        } else {
            pos3 = e.clientX;
            pos4 = e.clientY;
        }
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        let clientX, clientY;

        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;

        // Save Position
        settings[settingKey] = { top: elmnt.style.top, left: elmnt.style.left };
        extension_settings[EXT_NAME] = settings;
        saveSettingsDebounced();
    }
}

// เริ่มทำงานเมื่อเอกสารพร้อม
$(document).ready(function() {
    loadMySettings();
    // รอ 1 วินาทีเพื่อให้แน่ใจว่าหน้าจอโหลดครบแล้วค่อยสร้างปุ่ม
    setTimeout(initFrostProtocol, 1000);
});
