// --- RABBIT BLUE: Diary Lorebook System ---
const STORAGE_KEY = "rabbit_blue_diary_v1";

const PAGES = [
    { id: 'lore', title: 'Diary', icon: 'fa-book' }, // หน้านี้คือ Lorebook Editor
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

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function injectUI() {
    $('#x_floating_btn, #x_main_modal').remove();

    // 1. ลูกแก้ว (วีดีโอ)
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
                <div class="x-page-header"><i class="fa-solid fa-book"></i> Lorebook Editor</div>
                
                <div class="x-lore-controls">
                    <select id="x_lore_book" class="x-sweet-input">
                        <option value="" disabled selected>Select Book...</option>
                    </select>
                    <select id="x_lore_entry" class="x-sweet-input">
                        <option value="" disabled selected>Select Entry...</option>
                    </select>
                </div>
                
                <textarea id="x_lore_content" class="x-sweet-input x-lore-text" placeholder="Select a book and entry to edit..."></textarea>
                <button id="x_lore_save" class="x-sweet-btn-full">Update Entry</button>
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
    
    // เริ่มทำงานระบบ Lorebook
    initLoreSystem();
}

// --- ฟังก์ชันจัดการ Lorebook ---
function initLoreSystem() {
    const bookSelect = $('#x_lore_book');
    const entrySelect = $('#x_lore_entry');
    const contentArea = $('#x_lore_content');
    const saveBtn = $('#x_lore_save');

    // 1. ดึงรายชื่อสมุด Lorebook ทั้งหมด (จากตัวแปร global ของ ST)
    const refreshBooks = () => {
        bookSelect.empty().append('<option value="" disabled selected>Select Book...</option>');
        // ตรวจสอบว่า SillyTavern โหลดรายการสมุดมาหรือยัง (ตัวแปร world_names)
        if (typeof world_names !== 'undefined' && Array.isArray(world_names)) {
            world_names.forEach(name => {
                bookSelect.append(`<option value="${name}">${name}</option>`);
            });
        } else {
            bookSelect.append('<option disabled>No Lorebooks Found</option>');
        }
    };

    // 2. เมื่อเลือกสมุด -> ดึงรายการ Entry
    bookSelect.on('change', async function() {
        const selectedBook = $(this).val();
        if (!selectedBook) return;

        // โหลดข้อมูล Lorebook นั้นๆ (ใช้ฟังก์ชันของ ST ถ้ามี หรือจำลองการโหลด)
        // หมายเหตุ: ใน ST ปกติ world_info คือตัวที่โหลดอยู่ปัจจุบัน
        // หากต้องการแก้เล่มอื่นที่ไม่ใช่เล่มปัจจุบัน อาจต้องสั่ง loadWorldInfo
        
        // เพื่อความปลอดภัย: เราจะเช็คว่าเล่มที่เลือก คือเล่มที่โหลดอยู่ไหม
        // ถ้าไม่ใช่ เราอาจต้องแจ้งเตือน หรือสั่งโหลด (การสั่งโหลดอาจเปลี่ยน Lorebook ของแชทปัจจุบัน)
        // ในที่นี้สมมติว่า user อยากแก้เล่มปัจจุบัน หรือโหลดเล่มใหม่มาแก้
        
        if (typeof loadWorldInfo === 'function') {
             await loadWorldInfo(selectedBook); // สั่ง ST โหลด Lorebook นี้
        }

        entrySelect.empty().append('<option value="" disabled selected>Select Entry...</option>');
        
        // ดึงรายการ Entries จาก world_info (ตัวแปร global ที่เก็บข้อมูลสมุดปัจจุบัน)
        if (typeof world_info !== 'undefined' && world_info.entries) {
            // เรียงตามลำดับ หรือตามชื่อก็ได้
            const entries = Object.entries(world_info.entries);
            entries.forEach(([uid, entry]) => {
                // แสดงชื่อ (comment) หรือ key หลัก ถ้าไม่มีชื่อ
                const label = entry.comment || entry.key.join(', ') || `Entry ${uid}`;
                entrySelect.append(`<option value="${uid}">${label}</option>`);
            });
        }
    });

    // 3. เมื่อเลือก Entry -> แสดงข้อความ
    entrySelect.on('change', function() {
        const uid = $(this).val();
        if (uid && typeof world_info !== 'undefined' && world_info.entries[uid]) {
            contentArea.val(world_info.entries[uid].content);
        }
    });

    // 4. บันทึกข้อมูล
    saveBtn.on('click', function() {
        const uid = entrySelect.val();
        const newContent = contentArea.val();
        
        if (uid && typeof world_info !== 'undefined' && world_info.entries[uid]) {
            // อัปเดตข้อมูลในหน่วยความจำ
            world_info.entries[uid].content = newContent;
            
            // สั่งบันทึกไฟล์ (เรียกฟังก์ชันของ ST)
            if (typeof saveWorldInfo === 'function') {
                saveWorldInfo();
                
                // เอฟเฟคปุ่มกระพริบนิดนึงบอกว่าเซฟแล้ว
                const originalText = $(this).text();
                $(this).text('Saved!').css('background', '#a2d2ff');
                setTimeout(() => {
                    $(this).text(originalText).css('background', '');
                }, 1000);
            } else {
                alert("Cannot save: saveWorldInfo function missing.");
            }
        } else {
            alert("Please select an entry first.");
        }
    });

    // เรียกครั้งแรกเผื่อมีสมุดโหลดอยู่แล้ว
    refreshBooks();
    
    // ถ้ามีการคลิกเข้าหน้า Diary ให้รีเฟรชรายการเผื่อมีการสร้างใหม่ข้างนอก
    $('.x-nav-icon[data-id="lore"]').on('click', refreshBooks);
}

// ... (Functions: bindEvents, updateSafety, makeDraggable คงเดิม) ...

function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');
    orb.on('click', () => { if (!state.lockOrb) return; modal.fadeToggle(200).css('display', 'flex'); });
    $('#btn_close').on('click', () => { if (!state.lockOrb || !state.lockWin) return; modal.fadeOut(200); });
    $('.x-nav-icon').on('click', function() {
        const id = $(this).data('id');
        state.curPage = id;
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
