// --- Sweet Heart HUD: GIF & Background Edition ---
// Version: 3.5.0
// Description: Full logic for floating orb with background image and jellyfish GIF

const STORAGE_KEY = "sweet_hud_final_v1";

// รายชื่อหน้าและไอคอน (ใช้ FontAwesome พื้นฐานเพื่อให้แสดงผลได้ชัวร์)
const PAGES = [
    { id: 'lore', title: 'Diary', icon: 'fa-book' },
    { id: 'inspect', title: 'Check', icon: 'fa-magnifying-glass' },
    { id: 'ooc', title: 'Chat', icon: 'fa-comments' },
    { id: 'world', title: 'World', icon: 'fa-globe' },
    { id: 'helper', title: 'Help', icon: 'fa-wand-magic-sparkles' }
];

let state = {
    btnPos: { top: '120px', left: 'auto', right: '15px' },
    winPos: { top: '15vh', left: '5vw' },
    curPage: PAGES[0].id,
    lockOrb: true, 
    lockWin: true
};

jQuery(async () => {
    loadSettings();
    injectUI();
});

// โหลดการตั้งค่าจาก LocalStorage
function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
}

// บันทึกการตั้งค่าตำแหน่งและหน้าที่เปิดค้างไว้
function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// สร้างและฉีด UI เข้าไปในหน้าเว็บ
function injectUI() {
    // ล้าง UI เดิมออกก่อนเพื่อป้องกันการซ้ำซ้อน
    $('#x_floating_btn, #x_main_modal').remove();

    // 1. สร้างลูกแก้ว (Orb) 
    // หมายเหตุ: ภาพพื้นหลังจะถูกควบคุมผ่าน CSS (.x-orb-bg หรือ background-image ของ #x_floating_btn)
    $('body').append(`
        <div id="x_floating_btn">
            <img src="https://files.catbox.moe/n3eohs.gif" class="x-core-img" alt="core">
        </div>
    `);
    $('#x_floating_btn').css(state.btnPos);

    // 2. สร้างหน้าต่างหลัก (Main Window)
    const html = `
    <div id="x_main_modal">
        <div class="x-header" id="x_drag_zone">
            <div class="x-title">SWEET HUD</div>
            
            <div class="x-nav-container">
                ${PAGES.map(p => `
                    <div class="x-nav-icon ${p.id === state.curPage ? 'active' : ''}" 
                         data-id="${p.id}" 
                         title="${p.title}">
                        <i class="fa-solid ${p.icon}"></i>
                    </div>
                `).join('')}
            </div>

            <div class="x-controls-group">
                <div id="btn_mv_orb" class="x-mini-btn ${!state.lockOrb?'active':''}">
                    <i class="fa-solid fa-arrows-up-down-left-right"></i>
                </div>
                <div id="btn_mv_win" class="x-mini-btn ${!state.lockWin?'active':''}">
                    <i class="fa-solid fa-expand"></i>
                </div>
                <div id="btn_close" class="x-close-icon"><i class="fa-solid fa-xmark"></i></div>
            </div>
        </div>

        <div class="x-content-box">
            ${PAGES.map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.curPage ? 'active' : ''}">
                    <div class="x-page-header">
                        <i class="fa-solid ${p.icon}"></i> ${p.title}
                    </div>
                    <div id="content_${p.id}">Waiting for sweetness...</div>
                </div>
            `).join('')}
        </div>
    </div>`;

    $('body').append(html);
    $('#x_main_modal').css(state.winPos);

    bindEvents();
    updateSafety();
}

// ผูกเหตุการณ์การทำงานต่างๆ
function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    // คลิกที่ลูกแก้วเพื่อเปิด/ปิดหน้าต่าง
    orb.on('click', () => {
        if (!state.lockOrb) return; // ห้ามเปิดถ้าอยู่ในโหมดย้ายลูกแก้ว
        modal.fadeToggle(200).css('display', 'flex');
    });

    // คลิกปุ่ม X เพื่อปิด
    $('#btn_close').on('click', () => {
        if (!state.lockOrb || !state.lockWin) return; // ห้ามปิดถ้ายังปลดล็อคการย้ายค้างไว้
        modal.fadeOut(200);
    });

    // คลิกที่ไอคอนเพื่อเปลี่ยนหน้า
    $('.x-nav-icon').on('click', function() {
        const id = $(this).data('id');
        state.curPage = id;
        
        $('.x-nav-icon').removeClass('active');
        $(this).addClass('active');
        
        $('.x-page').removeClass('active');
        $(`#page_${id}`).addClass('active');
        
        saveSettings();
    });

    // ปุ่มปลดล็อคการย้ายลูกแก้ว
    $('#btn_mv_orb').on('click', () => {
        state.lockOrb = !state.lockOrb;
        updateSafety();
        saveSettings();
    });

    // ปุ่มปลดล็อคการย้ายหน้าต่าง
    $('#btn_mv_win').on('click', () => {
        state.lockWin = !state.lockWin;
        updateSafety();
        saveSettings();
    });

    // ตั้งค่าระบบลากวาง
    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'win', $('#x_drag_zone')[0]);
}

// อัปเดตสถานะความปลอดภัยและการแสดงผลของปุ่มล็อค
function updateSafety() {
    const moving = (!state.lockOrb || !state.lockWin);
    
    $('#btn_mv_orb').toggleClass('active', !state.lockOrb);
    $('#btn_mv_win').toggleClass('active', !state.lockWin);
    
    $('#x_floating_btn').toggleClass('x-dragging', !state.lockOrb);
    
    // ปิดการทำงานปุ่ม Close ถ้ามีการปลดล็อคการย้ายอยู่
    $('#btn_close').toggleClass('disabled', moving);
    
    // เปลี่ยน Cursor ของแถบ Header
    $('#x_drag_zone').toggleClass('x-head-drag', !state.lockWin);
}

// ระบบลากวาง (รองรับทั้งเมาส์และนิ้วสัมผัส)
function makeDraggable(el, type, handle) {
    let p1=0, p2=0, p3=0, p4=0;
    const trigger = handle || el;

    const start = (e) => {
        if (type==='orb' && state.lockOrb) return;
        if (type==='win' && state.lockWin) return;
        
        const evt = e.type === 'touchstart' ? e.touches[0] : e;
        p3 = evt.clientX; p4 = evt.clientY;
        
        document.ontouchend = stop; 
        document.onmouseup = stop;
        document.ontouchmove = move; 
        document.onmousemove = move;
    };

    const move = (e) => {
        const evt = e.type === 'touchmove' ? e.touches[0] : e;
        if(e.cancelable) e.preventDefault(); // ป้องกันหน้าเว็บเลื่อนตามขณะลาก
        
        p1 = p3 - evt.clientX; 
        p2 = p4 - evt.clientY;
        p3 = evt.clientX; 
        p4 = evt.clientY;
        
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
        el.style.right = 'auto';
    };

    const stop = () => {
        document.ontouchend = null; 
        document.onmouseup = null;
        document.ontouchmove = null; 
        document.onmousemove = null;
        
        // บันทึกตำแหน่งใหม่
        if (type==='orb') {
            state.btnPos = {top:el.style.top, left:el.style.left, right:'auto'};
        } else {
            state.winPos = {top:el.style.top, left:el.style.left};
        }
        saveSettings();
    };

    trigger.onmousedown = start; 
    trigger.ontouchstart = start;
}
