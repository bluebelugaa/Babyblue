// --- Import ระบบของ SillyTavern (Path สำหรับโฟลเดอร์ third-party) ---
import {
    eventSource,
    event_types,
    saveSettingsDebounced,
    chat_metadata,
} from "../../../../script.js";

import {
    world_info,        // ตัวแปร Lorebook ปัจจุบัน
    saveWorldInfo,     // ฟังก์ชันบันทึก
    loadWorldInfo,     // ฟังก์ชันโหลด
} from "../../../world-info.js";

// --- RABBIT BLUE HUD: Diary Connected ---
const STORAGE_KEY = "rabbit_blue_lore_v4";

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

// ใช้ jQuery รอให้หน้าเว็บโหลดเสร็จ
jQuery(async () => {
    // รอให้ระบบ Lorebook โหลดตัวแปร world_info เสร็จก่อน
    let attempts = 0;
    while (typeof world_info === 'undefined' && attempts < 20) {
        await new Promise(r => setTimeout(r, 500));
        attempts++;
    }
    
    loadSettings();
    injectUI();
});

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function injectUI() {
    $('#x_floating_btn, #x_main_modal').remove();

    // ลูกแก้ววีดีโอ
    $('body').append(`
        <div id="x_floating_btn">
            <video class="x-core-video" autoplay loop muted playsinline>
                <source src="https://files.catbox.moe/89qxpt.mp4" type="video/mp4">
            </video>
        </div>
    `);
    $('#x_floating_btn').css(state.btnPos);

    // หน้าต่างหลัก
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
                    <i class="fa-solid fa-book"></i> Diary
                    <span id="x_book_name" style="float:right; font-size:10px; opacity:0.7;">Checking...</span>
                </div>
                
                <div class="x-diary-container">
                    <div class="x-entry-bar">
                        <select id="x_diary_entry" class="x-entry-select" title="Select Topic">
                            <option value="" disabled selected>Loading Entries...</option>
                        </select>
                        <button id="x_diary_add" class="x-add-btn" title="Add New Entry">+</button>
                    </div>

                    <div>
                        <span class="x-label">Trigger Keywords (คำกระตุ้นจากสมุด)</span>
                        <input type="text" id="x_diary_keys" class="x-keys-input" placeholder="e.g. apple, fruit">
                    </div>

                    <textarea id="x_diary_content" class="x-content-area" placeholder="Select an entry to edit..."></textarea>
                    
                    <button id="x_diary_save" class="x-save-btn">Update Lorebook</button>
                </div>
            </div>

            ${PAGES.filter(p => p.id !== 'lore').map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.curPage ? 'active' : ''}">
                    <div class="x-page-header"><i class="fa-solid ${p.icon}"></i> ${p.title}</div>
                    <div id="content_${p.id}">Waiting for feature...</div>
                </div>
            `).join('')}
        </div>
    </div>`;

    $('body').append(html);
    $('#x_main_modal').css(state.winPos);

    bindEvents();
    updateSafety();
    
    // เริ่มทำงานระบบ Diary
    initDiarySystem();
}

// --- ฟังก์ชันหลักของระบบ Diary (เชื่อมต่อ Lorebook) ---
function initDiarySystem() {
    const entrySelect = $('#x_diary_entry');
    const keyInput = $('#x_diary_keys');
    const contentInput = $('#x_diary_content');
    const addBtn = $('#x_diary_add');
    const saveBtn = $('#x_diary_save');
    const bookLabel = $('#x_book_name');

    // ฟังก์ชันโหลดข้อมูล
    const refreshData = () => {
        // เช็คว่า world_info มีข้อมูลหรือไม่ (ตัวแปรนี้มาจาก import world-info.js)
        if (!world_info || !world_info.entries) {
            entrySelect.html('<option>No Active Lorebook</option>');
            bookLabel.text("No Lorebook Loaded");
            contentInput.val("กรุณาเลือก Lorebook ในเมนูขวาของ SillyTavern ก่อนใช้งานครับ");
            return;
        }

        // แสดงชื่อสมุด
        bookLabel.text(world_info.name || "Untitled Book");

        // เก็บค่าที่เลือกอยู่
        const currentUid = entrySelect.val();
        
        // ล้างและเติมรายการใหม่
        entrySelect.empty().append('<option value="" disabled selected>Select Topic...</option>');
        
        const entries = Object.entries(world_info.entries);
        if (entries.length === 0) {
            entrySelect.append('<option disabled>Empty Book</option>');
        } else {
            // เรียงลำดับตาม Order (ถ้ามี) หรือตามชื่อ
            entries.sort((a, b) => (a[1].order || 100) - (b[1].order || 100));
            
            entries.forEach(([uid, entry]) => {
                // ชื่อแสดงผล: ใช้ comment (ชื่อ Entry) หรือ key ตัวแรก
                let label = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `ID: ${uid}`);
                entrySelect.append(`<option value="${uid}">${label}</option>`);
            });
        }

        // คืนค่าที่เลือก
        if (currentUid && world_info.entries[currentUid]) {
            entrySelect.val(currentUid);
        }
    };

    // เมื่อเลือกหัวข้อ -> ดึงข้อมูลจริงมาใส่ช่อง
    entrySelect.on('change', function() {
        const uid = $(this).val();
        if (uid && world_info.entries[uid]) {
            const entry = world_info.entries[uid];
            
            // 1. ดึง Trigger Keys
            const keys = entry.key || [];
            keyInput.val(keys.join(', ')); // แปลง Array เป็นข้อความ "a, b, c"
            
            // 2. ดึงเนื้อหา
            contentInput.val(entry.content || '');
        }
    });

    // ปุ่ม (+) เพิ่มหัวข้อใหม่
    addBtn.on('click', function() {
        if (!world_info || !world_info.entries) return;

        const newUid = Date.now().toString(); // สร้าง ID ใหม่
        // สร้าง Entry ลงในตัวแปรระบบ
        world_info.entries[newUid] = {
            key: ["new_key"],
            content: "รายละเอียด...",
            comment: "New Entry",
            enabled: true,
            selective: true,
            order: 100
        };
        
        refreshData();
        entrySelect.val(newUid).trigger('change'); // เลือกตัวใหม่ทันที
        
        // บันทึกลงไฟล์
        saveWorldInfo(); 
    });

    // ปุ่ม Save (บันทึกการแก้ไข)
    saveBtn.on('click', function() {
        const uid = entrySelect.val();
        if (!uid || !world_info.entries[uid]) return;

        // 1. อัปเดตเนื้อหาในตัวแปรระบบ
        world_info.entries[uid].content = contentInput.val();

        // 2. อัปเดต Trigger Keys
        const keysStr = keyInput.val();
        const keysArr = keysStr.split(',').map(k => k.trim()).filter(k => k !== "");
        world_info.entries[uid].key = keysArr;
        
        // อัปเดตชื่อใน List ด้วย (ใช้คีย์แรกเป็นชื่อ)
        if (keysArr.length > 0) world_info.entries[uid].comment = keysArr[0];

        // 3. สั่งบันทึกไฟล์จริง
        saveWorldInfo();
        
        // รีเฟรชและแจ้งเตือน
        refreshData();
        const btn = $(this);
        const oldText = btn.text();
        btn.text("Saved!").css('background', '#a2d2ff');
        setTimeout(() => { btn.text(oldText).css('background', ''); }, 1000);
    });

    // ฟัง Event เมื่อมีการเปลี่ยนแชท หรือเลือกสมุดใหม่
    if (eventSource) {
        eventSource.on(event_types.CHAT_CHANGED, () => setTimeout(refreshData, 500));
        eventSource.on(event_types.LOREBOOK_SELECTED, refreshData);
    }
    
    // เรียกทำงานครั้งแรก
    refreshData();
    $('.x-nav-icon[data-id="lore"]').on('click', refreshData);
}

// ... Core Functions (ใช้ของเดิมได้เลย) ...
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

// ระบบลาก Classic (Stable)
function makeDraggable(el, type, handle) {
    const trigger = handle || el;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragStart = (e) => {
        if (type === 'orb' && state.lockOrb) return;
        if (type === 'win' && state.lockWin) return;
        el.classList.add('no-transition'); // ปิดอนิเมชั่นชั่วคราว
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
        el.classList.remove('no-transition'); // เปิดอนิเมชั่นคืน
        document.ontouchend = null; document.onmouseup = null;
        document.ontouchmove = null; document.onmousemove = null;
        if (type === 'orb') state.btnPos = { top: el.style.top, left: el.style.left, right: 'auto' };
        else state.winPos = { top: el.style.top, left: el.style.left };
        saveSettings();
    };
    trigger.onmousedown = dragStart; trigger.ontouchstart = dragStart;
}
