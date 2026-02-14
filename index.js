// --- Sweet Heart HUD: Galaxy Orbit Edition (Full Logic) ---
import { extension_settings } from "../../../extensions.js";

const STORAGE_KEY = "sweet_hud_galaxy_v1";

// กำหนดหน้าและไอคอน (ใช้ FontAwesome ตัวฟรี)
const PAGES = [
    { id: 'lore', title: 'Diary', icon: 'fa-book' },
    { id: 'inspect', title: 'Check', icon: 'fa-magnifying-glass' },
    { id: 'ooc', title: 'Chat', icon: 'fa-comments' },
    { id: 'world', title: 'World', icon: 'fa-globe' },
    { id: 'helper', title: 'Help', icon: 'fa-wand-magic-sparkles' }
];

// ค่าเริ่มต้น
let state = {
    btnPos: { top: '120px', left: 'auto', right: '15px' },
    winPos: { top: '15vh', left: '5vw' },
    curPage: PAGES[0].id,
    lockOrb: true, // true = ล็อค (ขยับไม่ได้)
    lockWin: true
};

// เริ่มทำงานเมื่อ SillyTavern โหลดเสร็จ
jQuery(async () => {
    loadSettings();
    injectUI();
});

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            state = { ...state, ...JSON.parse(saved) };
        } catch (e) {
            console.error("Sweet HUD: Save file corrupted");
        }
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function injectUI() {
    // ล้าง UI เก่าออกก่อน (กันซ้ำ)
    $('#x_floating_btn, #x_main_modal').remove();

    // 1. สร้างลูกแก้ว (Galaxy Orbit Style)
    // โครงสร้างมี Layer พื้นหลัง และ รูปแมงกะพรุนทับ
    $('body').append(`
        <div id="x_floating_btn" title="Open Sweet HUD">
            <div class="x-orb-bg"></div> <img src="https://files.catbox.moe/n3eohs.gif" class="x-core-img" alt="core"> </div>
    `);
    
    // กำหนดตำแหน่งลูกแก้ว
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
                <div id="btn_mv_orb" class="x-mini-btn ${!state.lockOrb?'active':''}" title="Unlock Orb">
                    <i class="fa-solid fa-arrows-up-down-left-right"></i>
                </div>
                <div id="btn_mv_win" class="x-mini-btn ${!state.lockWin?'active':''}" title="Unlock Window">
                    <i class="fa-solid fa-expand"></i>
                </div>
                <div id="btn_close" class="x-close-icon" title="Close"><i class="fa-solid fa-xmark"></i></div>
            </div>
        </div>

        <div class="x-content-box">
            ${PAGES.map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.curPage ? 'active' : ''}">
                    <div class="x-page-header">
                        <i class="fa-solid ${p.icon}"></i> ${p.title}
                    </div>
                    <div id="content_${p.id}">
                        <div style="text-align:center; margin-top:20px; color:#888;">
                            Waiting for sweetness...
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;

    $('body').append(html);
    $('#x_main_modal').css(state.winPos);

    // เริ่มระบบ Event Listener
    bindEvents();
    updateSafety();
}

function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    // คลิกที่ลูกแก้ว เพื่อเปิด/ปิด
    orb.on('click', () => {
        if (!state.lockOrb) return; // ถ้ากำลังย้ายลูกแก้ว ห้ามเปิดหน้าต่าง
        modal.fadeToggle(200).css('display', 'flex');
    });

    // ปุ่มปิด X
    $('#btn_close').on('click', () => {
        // ถ้ามีการปลดล็อคย้ายของอยู่ ห้ามปิด
        if (!state.lockOrb || !state.lockWin) return;
        modal.fadeOut(200);
    });

    // เปลี่ยนหน้าเมื่อกดไอคอน
    $('.x-nav-icon').on('click', function() {
        const id = $(this).data('id');
        state.curPage = id;
        
        // อัปเดต UI
        $('.x-nav-icon').removeClass('active');
        $(this).addClass('active');
        
        $('.x-page').removeClass('active');
        $(`#page_${id}`).addClass('active');
        
        saveSettings();
    });

    // ปุ่มปลดล็อคย้ายลูกแก้ว
    $('#btn_mv_orb').on('click', () => {
        state.lockOrb = !state.lockOrb;
        updateSafety();
        saveSettings();
    });

    // ปุ่มปลดล็อคย้ายหน้าต่าง
    $('#btn_mv_win').on('click', () => {
        state.lockWin = !state.lockWin;
        updateSafety();
        saveSettings();
    });

    // ติดตั้งระบบลากวาง (Drag)
    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'win', $('#x_drag_zone')[0]);
}

// อัปเดตหน้าตาปุ่มตามสถานะล็อค
function updateSafety() {
    const moving = (!state.lockOrb || !state.lockWin);
    
    $('#btn_mv_orb').toggleClass('active', !state.lockOrb);
    $('#btn_mv_win').toggleClass('active', !state.lockWin);
    
    // ใส่เอฟเฟคตอนลาก
    $('#x_floating_btn').toggleClass('x-dragging', !state.lockOrb);
    
    // ปิดการใช้งานปุ่ม X ถ้าย้ายของอยู่
    $('#btn_close').toggleClass('disabled', moving);
    
    // เปลี่ยน Cursor ตรง Header
    $('#x_drag_zone').toggleClass('x-head-drag', !state.lockWin);
}

// ฟังก์ชันลากวาง (รองรับเมาส์และนิ้วสัมผัส)
function makeDraggable(el, type, handle) {
    let p1=0, p2=0, p3=0, p4=0;
    const trigger = handle || el;

    const start = (e) => {
        if (type==='orb' && state.lockOrb) return;
        if (type==='win' && state.lockWin) return;
        
        const evt = e.type === 'touchstart' ? e.touches[0] : e;
        p3 = evt.clientX; p4 = evt.clientY;
        
        document.ontouchend = stop; document.onmouseup = stop;
        document.ontouchmove = move; document.onmousemove = move;
    };

    const move = (e) => {
        const evt = e.type === 'touchmove' ? e.touches[0] : e;
        // ป้องกันจอมือถือเลื่อนตาม
        if(e.cancelable) e.preventDefault();
        
        p1 = p3 - evt.clientX; p2 = p4 - evt.clientY;
        p3 = evt.clientX; p4 = evt.clientY;
        
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
        el.style.right = 'auto';
    };

    const stop = () => {
        document.ontouchend = null; document.onmouseup = null;
        document.ontouchmove = null; document.onmousemove = null;
        
        // บันทึกตำแหน่งล่าสุด
        if (type==='orb') state.btnPos = {top:el.style.top, left:el.style.left, right:'auto'};
        else state.winPos = {top:el.style.top, left:el.style.left};
        saveSettings();
    };

    trigger.onmousedown = start; trigger.ontouchstart = start;
}
