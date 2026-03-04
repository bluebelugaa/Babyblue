// --- RABBIT BLUE: Original Sweet Logic ---
const STORAGE_KEY = "rabbit_blue_sweet_v1";

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

    // หน้าต่าง RABBIT BLUE (Sweet Theme)
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
            ${PAGES.map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.curPage ? 'active' : ''}">
                    <div class="x-page-header">
                        <i class="fa-solid ${p.icon}"></i> ${p.title}
                    </div>
                    <div id="content_${p.id}">Waiting for sweet memories...</div>
                </div>
            `).join('')}
        </div>
    </div>`;

    $('body').append(html);
    $('#x_main_modal').css(state.winPos);

    bindEvents();
    updateSafety();
}

function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    orb.on('click', () => {
        if (!state.lockOrb) return;
        modal.fadeToggle(200).css('display', 'flex');
    });

    $('#btn_close').on('click', () => {
        if (!state.lockOrb || !state.lockWin) return;
        modal.fadeOut(200);
    });

    $('.x-nav-icon').on('click', function() {
        const id = $(this).data('id');
        state.curPage = id;
        $('.x-nav-icon').removeClass('active');
        $(this).addClass('active');
        $('.x-page').removeClass('active');
        $(`#page_${id}`).addClass('active');
        saveSettings();
    });

    $('#btn_mv_orb').on('click', () => {
        state.lockOrb = !state.lockOrb;
        updateSafety();
        saveSettings();
    });

    $('#btn_mv_win').on('click', () => {
        state.lockWin = !state.lockWin;
        updateSafety();
        saveSettings();
    });

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

// ใช้ระบบลากแบบ Classic เพื่อความเสถียร ไม่กระตุก
function makeDraggable(el, type, handle) {
    const trigger = handle || el;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragStart = (e) => {
        if (type === 'orb' && state.lockOrb) return;
        if (type === 'win' && state.lockWin) return;

        el.classList.add('no-transition'); // ปิดอนิเมชั่นชั่วคราวเพื่อให้ลากลื่น

        const evt = e.type === 'touchstart' ? e.touches[0] : e;
        pos3 = evt.clientX;
        pos4 = evt.clientY;

        document.ontouchend = dragEnd;
        document.onmouseup = dragEnd;
        document.ontouchmove = dragMove;
        document.onmousemove = dragMove;
    };

    const dragMove = (e) => {
        const evt = e.type === 'touchmove' ? e.touches[0] : e;
        if(e.cancelable && type === 'orb') e.preventDefault();

        pos1 = pos3 - evt.clientX;
        pos2 = pos4 - evt.clientY;
        pos3 = evt.clientX;
        pos4 = evt.clientY;

        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
        el.style.right = 'auto';
    };

    const dragEnd = () => {
        el.classList.remove('no-transition'); // เปิดอนิเมชั่นกลับ
        
        document.ontouchend = null;
        document.onmouseup = null;
        document.ontouchmove = null;
        document.onmousemove = null;

        if (type === 'orb') {
            state.btnPos = { top: el.style.top, left: el.style.left, right: 'auto' };
        } else {
            state.winPos = { top: el.style.top, left: el.style.left };
        }
        saveSettings();
    };

    trigger.onmousedown = dragStart;
    trigger.ontouchstart = dragStart;
}

// --- เพิ่มในส่วน State ---
let extractedCodes = []; 

// --- Function สำหรับจัดการข้อความ (Core Logic) ---
function processMessageForCodes(text) {
    // Regex สำหรับตรวจจับ <Code:Type>Content</Code> หรือ <Code>Content</Code>
    const codeRegex = /<Code(?::(\w+))?>([\s\S]*?)<\/Code>/g;
    let match;
    
    // ล้างข้อมูลเก่าหรืออัปเดต (ขึ้นอยู่กับว่าอยากให้เก็บรวมหรือแยก)
    // extractedCodes = []; 

    let processedText = text.replace(codeRegex, (match, type, content) => {
        const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const category = type || "General";
        
        // เก็บข้อมูลลงใน Array
        extractedCodes.push({
            id: codeId,
            category: category,
            content: content.trim()
        });

        // ส่งคืนข้อความที่จะแสดงในหน้าแชทแทนที่โค้ดเดิม
        return `<span class="shortened-code-trigger" data-code-id="${codeId}">[ <Code:${category}> ]</span>`;
    });

    updateCodeUI(); // สั่งให้หน้าต่าง Extension อัปเดตรายการ
    return processedText;
}

// --- Function อัปเดตรายการในหน้าต่าง Inspect ---
function updateCodeUI() {
    const container = $('#content_inspect');
    if (extractedCodes.length === 0) {
        container.html("No codes detected yet...");
        return;
    }

    let html = '';
    // แบ่งหมวดหมู่ (Group by category)
    const groups = {};
    extractedCodes.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
    });

    for (const cat in groups) {
        html += `<div style="font-weight:bold; color:var(--sweet-pink); margin:10px 0 5px 0;">📂 ${cat}</div>`;
        groups[cat].forEach(item => {
            html += `
                <div class="x-code-item" onclick="copyToClipboard('${encodeURIComponent(item.content)}')">
                    <div class="x-code-content">${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}</div>
                    <div style="font-size:8px; opacity:0.6; text-align:right;">Click to copy content</div>
                </div>
            `;
        });
    }
    container.html(html);
}

// ฟังก์ชันเสริมสำหรับ Copy โค้ด
window.copyToClipboard = (encodedContent) => {
    const content = decodeURIComponent(encodedContent);
    navigator.clipboard.writeText(content);
    toastr.success('Code copied to clipboard!'); // ใช้ Toast ของ SillyTavern
};

// --- การเชื่อมต่อกับ SillyTavern ---
// ใช้ Hook 'message_updated' หรือ 'character_message_rendered'
jQuery(async () => {
    // ... logic เดิม ...

    // ดักจับเหตุการณ์เมื่อมีการแสดงข้อความใหม่
    $(document).on('character_message_rendered', (event, messageId) => {
        const messageElement = $(`.message[message_id="${messageId}"] .mes_text`);
        const originalHtml = messageElement.html();
        
        // นำข้อความมา Process
        const newHtml = processMessageForCodes(originalHtml);
        messageElement.html(newHtml);
    });
});
