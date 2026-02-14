// --- Imports: ดึงระบบของ SillyTavern เข้ามาใช้งาน (สำคัญมาก!) ---
import {
    eventSource,
    event_types,
    saveSettingsDebounced,
    chat_metadata,
    settings as st_settings,
} from "../../../script.js";

import {
    world_info,        // ข้อมูลสมุดที่โหลดอยู่ปัจจุบัน
    saveWorldInfo,     // ฟังก์ชันบันทึกสมุด
    loadWorldInfo,     // ฟังก์ชันโหลดสมุด
} from "../../world-info.js";

// --- RABBIT BLUE HUD ---
const STORAGE_KEY = "rabbit_blue_lore_v1";

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

// เริ่มทำงานเมื่อ SillyTavern พร้อม
$(document).ready(() => {
    // โหลดการตั้งค่า
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };

    // สร้าง UI
    injectUI();
});

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function injectUI() {
    $('#x_floating_btn, #x_main_modal').remove();

    // 1. สร้างลูกแก้ว (วีดีโอ)
    $('body').append(`
        <div id="x_floating_btn">
            <video class="x-core-video" autoplay loop muted playsinline>
                <source src="https://files.catbox.moe/89qxpt.mp4" type="video/mp4">
            </video>
        </div>
    `);
    $('#x_floating_btn').css(state.btnPos);

    // 2. หน้าต่างหลัก
    const html = `
    <div id="x_main_modal">
        <div class="x-header" id="x_drag_zone">
            <div class="x-title">RABBIT BLUE</div>
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
            <div id="page_lore" class="x-page ${state.curPage === 'lore' ? 'active' : ''}">
                <div class="x-page-header">
                    <i class="fa-solid fa-book"></i> Diary (Lorebook)
                    <span id="x_book_name" style="float:right; font-size:10px; opacity:0.7;">No Book</span>
                </div>
                
                <div class="x-diary-container">
                    <div class="x-entry-bar">
                        <select id="x_diary_entry" class="x-entry-select" title="Select Topic">
                            <option value="" disabled selected>Loading...</option>
                        </select>
                        <button id="x_diary_add" class="x-add-btn" title="Add New Topic">+</button>
                    </div>

                    <div>
                        <span class="x-label">Trigger Keywords (คำจาก Lorebook)</span>
                        <input type="text" id="x_diary_keys" class="x-keys-input" placeholder="No triggers set...">
                    </div>

                    <textarea id="x_diary_content" class="x-content-area" placeholder="Select a topic to view details..."></textarea>
                    
                    <button id="x_diary_save" class="x-save-btn">Update Lorebook</button>
                </div>
            </div>

            ${PAGES.filter(p => p.id !== 'lore').map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.curPage ? 'active' : ''}">
                    <div class="x-page-header"><i class="fa-solid ${p.icon}"></i> ${p.title}</div>
                    <div id="content_${p.id}">Feature coming soon...</div>
                </div>
            `).join('')}
        </div>
    </div>`;

    $('body').append(html);
    $('#x_main_modal').css(state.winPos);

    bindEvents();
    updateSafety();
    
    // เริ่มระบบ Diary
    initDiarySystem();
}

// --- ระบบเชื่อมต่อ Lorebook (Core Logic) ---
function initDiarySystem() {
    const entrySelect = $('#x_diary_entry');
    const keyInput = $('#x_diary_keys');
    const contentInput = $('#x_diary_content');
    const addBtn = $('#x_diary_add');
    const saveBtn = $('#x_diary_save');
    const bookLabel = $('#x_book_name');

    // ฟังก์ชันโหลดข้อมูล (ดึงจาก world_info ตัวจริง)
    const refreshData = () => {
        // ตรวจสอบว่า world_info ถูกโหลดมาหรือยัง
        if (typeof world_info === 'undefined' || !world_info || !world_info.entries) {
            entrySelect.html('<option>No Active Lorebook</option>');
            bookLabel.text("No Connection");
            contentInput.val("ไม่พบ Lorebook ในแชทนี้\nกรุณาเลือก Lorebook ในเมนูขวาของ SillyTavern ก่อนครับ");
            return;
        }

        // โชว์ชื่อสมุด
        bookLabel.text(world_info.name || "Untitled Book");

        // จำค่าที่เลือกอยู่
        const currentUid = entrySelect.val();
        
        // ล้างและเติมข้อมูลใหม่
        entrySelect.empty().append('<option value="" disabled selected>Select Topic...</option>');
        
        const entries = Object.entries(world_info.entries);
        if (entries.length === 0) {
            entrySelect.append('<option disabled>Empty Book</option>');
        } else {
            entries.forEach(([uid, entry]) => {
                // ชื่อหัวข้อ: ใช้ comment (ชื่อที่ตั้งไว้) หรือ key ตัวแรก
                let label = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `ID: ${uid}`);
                entrySelect.append(`<option value="${uid}">${label}</option>`);
            });
        }

        // คืนค่าที่เลือกไว้ถ้ายังมีอยู่
        if (currentUid && world_info.entries[currentUid]) {
            entrySelect.val(currentUid);
        }
    };

    // เมื่อเลือกหัวข้อ -> ดึงข้อมูลจริงมาโชว์
    entrySelect.on('change', function() {
        const uid = $(this).val();
        if (uid && world_info.entries[uid]) {
            const entry = world_info.entries[uid];
            
            // 1. ดึง Trigger Keys ของจริงมาโชว์
            const keys = entry.key || [];
            keyInput.val(keys.join(', ')); // แปลง array เป็นข้อความ "a, b, c"
            
            // 2. ดึงเนื้อหาจริง
            contentInput.val(entry.content || '');
        }
    });

    // ปุ่ม (+) เพิ่มหัวข้อใหม่
    addBtn.on('click', function() {
        if (typeof world_info === 'undefined') return;

        const newUid = Date.now().toString();
        // สร้าง Entry เปล่าๆ ลงใน Lorebook จริง
        world_info.entries[newUid] = {
            key: ["new_topic"],
            content: "รายละเอียด...",
            comment: "New Topic",
            enabled: true,
            selective: true // เปิดใช้งาน Selective ตามมาตรฐาน
        };
        
        refreshData();
        entrySelect.val(newUid).trigger('change'); // เลือกตัวใหม่ทันที
        
        // บันทึกไฟล์ทันที
        saveWorldInfo();
    });

    // ปุ่ม Update (บันทึกกลับลง Lorebook)
    saveBtn.on('click', function() {
        const uid = entrySelect.val();
        if (!uid || !world_info.entries[uid]) return;

        // 1. อัปเดตเนื้อหา
        world_info.entries[uid].content = contentInput.val();

        // 2. อัปเดต Trigger Keys
        const keysStr = keyInput.val();
        // แปลงข้อความกลับเป็น Array ["a", "b", "c"]
        const keysArr = keysStr.split(',').map(k => k.trim()).filter(k => k !== "");
        world_info.entries[uid].key = keysArr;
        
        // อัปเดตชื่อใน Dropdown ด้วย (ใช้คีย์แรกเป็นชื่อ)
        if (keysArr.length > 0) world_info.entries[uid].comment = keysArr[0];

        // 3. สั่ง SillyTavern บันทึกไฟล์จริงๆ
        saveWorldInfo();
        
        // รีเฟรช UI และแจ้งเตือน
        refreshData();
        const btn = $(this);
        const oldText = btn.text();
        btn.text("Saved!").css('background', '#a2d2ff');
        setTimeout(() => { btn.text(oldText).css('background', ''); }, 1000);
    });

    // เรียกทำงานทันที และทุกครั้งที่เปลี่ยนแชท
    refreshData();
    
    // ฟัง event เมื่อแชทเปลี่ยน (เพื่อให้รีโหลดสมุดใหม่)
    if (eventSource) {
        eventSource.on(event_types.CHAT_CHANGED, refreshData);
        eventSource.on(event_types.LOREBOOK_SELECTED, refreshData); // ถ้ามีการเลือกสมุดใหม่
    }
    
    $('.x-nav-icon[data-id="lore"]').on('click', refreshData);
}

// ... (ฟังก์ชัน bindEvents, updateSafety, makeDraggable เหมือนเดิม ใช้ของรอบที่แล้วได้เลยครับ) ...
function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');
    orb.on('click', () => { if (!state.lockOrb) return; modal.fadeToggle(200).css('display', 'flex'); });
    $('#btn_close').on('click', () => { if (!state.lockOrb || !state.lockWin) return; modal.fadeOut(200); });
    $('.x-nav-icon').on('click', function() {
        const id = $(this).data('id'); state.curPage = id;
        $('.x-nav-icon').removeClass('active'); $(this).addClass('active');
        $('.x-page').removeClass('active'); $(`#page_${id}`).addClass('active');
        saveSettings();
    });
    $('#btn_mv_orb').on('click', () => { state.lockOrb = !state.lockOrb; updateSafety(); saveSettings(); });
    $('#btn_mv_win').on('click', () => { state.lockWin = !state.lockWin; updateSafety(); saveSettings(); });
    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'win', $('#x_drag_zone')[0]);
}

function updateSafety() {
    const moving = (!state.lockOrb || !state.lockWin);
    $('#btn_mv_orb').toggleClass('active', !state.lockOrb);
    $('#btn_mv_win').toggleClass('active', !state.lockWin);
    $('#x_floating_btn').toggleClass('x-dragging', !state.lockOrb);
    $('#btn_close').toggleClass('disabled', moving);
    $('#x_drag_zone').css('cursor', !state.lockWin ? 'move' : 'default');
}

function makeDraggable(el, type, handle) {
    const trigger = handle || el;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragStart = (e) => {
        if (type === 'orb' && state.lockOrb) return;
        if (type === 'win' && state.lockWin) return;
        el.classList.add('no-transition');
        const evt = e.type === 'touchstart' ? e.touches[0] : e;
        pos3 = evt.clientX; pos4 = evt.clientY;
        document.ontouchend = dragEnd; document.onmouseup = dragEnd;
        document.ontouchmove = dragMove; document.onmousemove = dragMove;
    };
    const dragMove = (e) => {
        const evt = e.type === 'touchmove' ? e.touches[0] : e;
        if(e.cancelable && type === 'orb') e.preventDefault();
        pos1 = pos3 - evt.clientX; pos2 = pos4 - evt.clientY;
        pos3 = evt.clientX; pos4 = evt.clientY;
        el.style.top = (el.offsetTop - pos2) + "px"; el.style.left = (el.offsetLeft - pos1) + "px"; el.style.right = 'auto';
    };
    const dragEnd = () => {
        el.classList.remove('no-transition');
        document.ontouchend = null; document.onmouseup = null;
        document.ontouchmove = null; document.onmousemove = null;
        if (type === 'orb') state.btnPos = { top: el.style.top, left: el.style.left, right: 'auto' };
        else state.winPos = { top: el.style.top, left: el.style.left };
        saveSettings();
    };
    trigger.onmousedown = dragStart; trigger.ontouchstart = dragStart;
}
