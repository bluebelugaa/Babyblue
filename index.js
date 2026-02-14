// --- Imports: ใช้ Path ตามโครงสร้าง third-party/RabbitBlue ---
import {
    eventSource,
    event_types,
    saveSettingsDebounced,
    chat_metadata,
} from "../../../../script.js";

import {
    world_info,        
    saveWorldInfo,     
    loadWorldInfo,
} from "../../../world-info.js";

const STORAGE_KEY = "rabbit_blue_final_fix";

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

// --- Initialization: รอ APP_READY เหมือนไฟล์ตัวอย่าง ---
const init = async () => {
    console.log("RABBIT BLUE: Initializing...");
    loadSettings();
    injectUI();
    
    // ตั้งค่า Event Listeners สำหรับการเปลี่ยนแชท
    if (eventSource) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            console.log("RABBIT BLUE: Chat changed, refreshing data...");
            setTimeout(refreshLoreData, 500);
        });
    }
};

// รอให้ jQuery และระบบพร้อม
$(document).ready(() => {
    // ถ้า Event Source พร้อมแล้ว ให้เริ่มเลย
    if (eventSource && event_types.APP_READY) {
        eventSource.on(event_types.APP_READY, init);
    } else {
        // Fallback ถ้า Event ยังไม่มา
        setTimeout(init, 2000);
    }
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

    // 1. สร้างลูกแก้ว (วีดีโอ)
    // ใช้ playsinline และ muted เพื่อให้เล่นอัตโนมัติได้
    $('body').append(`
        <div id="x_floating_btn">
            <video class="x-core-video" autoplay loop muted playsinline>
                <source src="https://files.catbox.moe/89qxpt.mp4" type="video/mp4">
            </video>
        </div>
    `);
    
    // ตั้งค่าตำแหน่ง
    if (state.btnPos) {
        $('#x_floating_btn').css(state.btnPos);
    }

    // 2. สร้างหน้าต่างหลัก
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
                    <span id="x_book_name" style="float:right; font-size:10px; opacity:0.7;">Loading...</span>
                </div>
                
                <div class="x-diary-container">
                    <div class="x-entry-bar">
                        <select id="x_diary_entry" class="x-entry-select" title="Select Entry">
                            <option value="" disabled selected>Waiting for Lorebook...</option>
                        </select>
                        <button id="x_diary_add" class="x-add-btn" title="Add Entry">+</button>
                    </div>

                    <div>
                        <span class="x-label">Trigger Keywords</span>
                        <input type="text" id="x_diary_keys" class="x-keys-input" placeholder="Keywords...">
                    </div>

                    <textarea id="x_diary_content" class="x-content-area" placeholder="Content..."></textarea>
                    
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
    if (state.winPos) {
        $('#x_main_modal').css(state.winPos);
    }

    bindEvents();
    updateSafety();
    
    // โหลดข้อมูลครั้งแรก
    setTimeout(refreshLoreData, 1000);
}

// --- ฟังก์ชันดึงข้อมูล Lorebook (แยกออกมาเพื่อให้เรียกใช้ซ้ำได้) ---
function refreshLoreData() {
    const entrySelect = $('#x_diary_entry');
    const bookLabel = $('#x_book_name');
    const contentInput = $('#x_diary_content');

    // เช็ค world_info ที่ Import มา
    if (!world_info || !world_info.entries) {
        bookLabel.text("No Active Book");
        entrySelect.html('<option>No Active Lorebook</option>');
        contentInput.val("กรุณาเลือก Lorebook ในเมนูขวาของ SillyTavern ก่อนครับ");
        return;
    }

    bookLabel.text(world_info.name || "Untitled");
    
    // จำค่าเดิม
    const currentUid = entrySelect.val();
    
    entrySelect.empty().append('<option value="" disabled selected>Select Topic...</option>');
    
    // เรียงลำดับและใส่ข้อมูล
    const entries = Object.entries(world_info.entries);
    entries.sort((a, b) => (a[1].order || 100) - (b[1].order || 100));
    
    entries.forEach(([uid, entry]) => {
        let label = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `ID: ${uid}`);
        entrySelect.append(`<option value="${uid}">${label}</option>`);
    });

    if (currentUid && world_info.entries[currentUid]) {
        entrySelect.val(currentUid);
    }
}

function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');
    
    // Orb Click
    orb.on('click', () => { 
        if (!state.lockOrb) return; 
        modal.fadeToggle(200).css('display', 'flex'); 
        if (state.curPage === 'lore') refreshLoreData(); // รีเฟรชเมื่อเปิด
    });
    
    $('#btn_close').on('click', () => { if (!state.lockOrb || !state.lockWin) return; modal.fadeOut(200); });

    // Nav Click
    $('.x-nav-icon').on('click', function() {
        const id = $(this).data('id');
        state.curPage = id;
        $('.x-nav-icon').removeClass('active'); $(this).addClass('active');
        $('.x-page').removeClass('active'); $(`#page_${id}`).addClass('active');
        
        if (id === 'lore') refreshLoreData();
        saveSettings();
    });

    // Toggle Locks
    $('#btn_mv_orb').on('click', () => { state.lockOrb = !state.lockOrb; updateSafety(); saveSettings(); });
    $('#btn_mv_win').on('click', () => { state.lockWin = !state.lockWin; updateSafety(); saveSettings(); });

    // Lorebook Events
    $('#x_diary_entry').on('change', function() {
        const uid = $(this).val();
        if (uid && world_info.entries[uid]) {
            const entry = world_info.entries[uid];
            $('#x_diary_keys').val(entry.key ? entry.key.join(', ') : '');
            $('#x_diary_content').val(entry.content || '');
        }
    });

    $('#x_diary_add').on('click', () => {
        if (!world_info) return;
        const newUid = Date.now().toString();
        world_info.entries[newUid] = {
            key: ["new_topic"], content: "Content...", comment: "New Entry",
            enabled: true, selective: true
        };
        refreshLoreData();
        $('#x_diary_entry').val(newUid).trigger('change');
        saveWorldInfo();
    });

    $('#x_diary_save').on('click', function() {
        const uid = $('#x_diary_entry').val();
        if (!uid || !world_info.entries[uid]) return;

        world_info.entries[uid].content = $('#x_diary_content').val();
        const keysArr = $('#x_diary_keys').val().split(',').map(k => k.trim()).filter(Boolean);
        world_info.entries[uid].key = keysArr;
        if (keysArr.length > 0) world_info.entries[uid].comment = keysArr[0];

        saveWorldInfo();
        refreshLoreData();
        
        const btn = $(this);
        const oldText = btn.text();
        btn.text("Saved!").css('background', '#a2d2ff');
        setTimeout(() => btn.text(oldText).css('background', ''), 1000);
    });

    // Draggable
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

// Classic Drag (Stable)
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
