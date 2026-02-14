// --- RABBIT BLUE: Full Edition (Lorebook Connected) ---
const STORAGE_KEY = "rabbit_blue_full_v1";

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

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function injectUI() {
    $('#x_floating_btn, #x_main_modal').remove();

    // สร้างลูกแก้ววีดีโอ
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
                <div class="x-page-header"><i class="fa-solid fa-book"></i> Active Lorebook</div>
                
                <div class="x-diary-controls">
                    <select id="x_diary_book" class="x-compact-select" title="Current Book">
                        <option value="" disabled selected>No Book</option>
                    </select>
                    <select id="x_diary_entry" class="x-compact-select" title="Select Entry">
                        <option value="" disabled selected>Select Entry...</option>
                    </select>
                    <button id="x_diary_add" class="x-add-btn" title="Add New Entry">+</button>
                </div>
                
                <span class="x-label-small">Trigger Keys (คำกระตุ้น - คั่นด้วยจุลภาค)</span>
                <input type="text" id="x_diary_keys" class="x-diary-input" placeholder="e.g. apple, fruit, red">
                
                <span class="x-label-small">Content (รายละเอียด)</span>
                <textarea id="x_diary_content" class="x-diary-input x-diary-textarea" placeholder="Content here..."></textarea>
                
                <button id="x_diary_save" class="x-save-btn">Update Entry</button>
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
    initDiarySystem(); // เริ่มระบบ Lorebook
}

// --- Lorebook Logic ---
function initDiarySystem() {
    const bookSelect = $('#x_diary_book');
    const entrySelect = $('#x_diary_entry');
    const keyInput = $('#x_diary_keys');
    const contentInput = $('#x_diary_content');
    const addBtn = $('#x_diary_add');
    const saveBtn = $('#x_diary_save');

    // โหลดข้อมูลสมุดปัจจุบัน
    const refreshData = () => {
        // เช็คตัวแปร global world_info ของ ST
        if (typeof world_info === 'undefined' || !world_info.entries) {
            bookSelect.html('<option>No Active Book</option>');
            entrySelect.html('<option>No Entries</option>');
            return;
        }

        const bookName = world_info.name || "Untitled Book";
        bookSelect.html(`<option value="current" selected>${bookName}</option>`);

        const currentUid = entrySelect.val();
        entrySelect.empty().append('<option value="" disabled selected>Select Entry...</option>');
        
        Object.entries(world_info.entries).forEach(([uid, entry]) => {
            let label = entry.comment || (entry.key && entry.key.length ? entry.key[0] : `ID: ${uid}`);
            entrySelect.append(`<option value="${uid}">${label}</option>`);
        });

        if (currentUid && world_info.entries[currentUid]) {
            entrySelect.val(currentUid);
        }
    };

    // เลือก Entry
    entrySelect.on('change', function() {
        const uid = $(this).val();
        if (uid && world_info.entries[uid]) {
            const entry = world_info.entries[uid];
            keyInput.val(entry.key ? entry.key.join(', ') : '');
            contentInput.val(entry.content || '');
        }
    });

    // ปุ่ม (+) เพิ่ม
    addBtn.on('click', function() {
        if (typeof world_info === 'undefined') {
            alert("No Lorebook loaded in this chat!"); return;
        }
        const newUid = Date.now().toString();
        world_info.entries[newUid] = {
            key: ["new_key"],
            content: "New Description",
            comment: "New Entry",
            enabled: true
        };
        refreshData();
        entrySelect.val(newUid).trigger('change');
        if (typeof saveWorldInfo === 'function') saveWorldInfo();
    });

    // ปุ่ม Save
    saveBtn.on('click', function() {
        const uid = entrySelect.val();
        if (!uid || !world_info.entries[uid]) return;

        world_info.entries[uid].content = contentInput.val();
        
        const keysStr = keyInput.val();
        const keysArr = keysStr.split(',').map(k => k.trim()).filter(k => k !== "");
        world_info.entries[uid].key = keysArr;
        
        if (keysArr.length > 0) world_info.entries[uid].comment = keysArr[0];

        if (typeof saveWorldInfo === 'function') {
            saveWorldInfo();
            refreshData();
            const oldText = $(this).text();
            $(this).text("Saved!").css('background', '#a2d2ff');
            setTimeout(() => { $(this).text(oldText).css('background', ''); }, 1000);
        }
    });

    refreshData();
    // รีเฟรชเมื่อเปิดหน้า Diary
    $('.x-nav-icon[data-id="lore"]').on('click', refreshData);
}

// --- Core Functions ---
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
