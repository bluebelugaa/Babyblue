import { eventSource, event_types } from '../../../../script.js';

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
    curPage: 'lore',
    lockOrb: true, 
    lockWin: true
};

let extractedCodes = []; // เก็บข้อมูลโค้ดทั้งหมดที่สกัดได้

jQuery(async () => {
    loadSettings();
    injectUI();
    setupSillyTavernHooks();
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
    $('body').append(`<div id="x_floating_btn"><video class="x-core-video" autoplay loop muted playsinline><source src="https://files.catbox.moe/89qxpt.mp4" type="video/mp4"></video></div>`);
    $('#x_floating_btn').css(state.btnPos);

    const html = `
    <div id="x_main_modal">
        <div class="x-header" id="x_drag_zone">
            <div class="x-title">RABBIT BLUE</div>
            <div class="x-nav-container">
                ${PAGES.map(p => `<div class="x-nav-icon ${p.id === state.curPage ? 'active' : ''}" data-id="${p.id}"><i class="fa-solid ${p.icon}"></i></div>`).join('')}
            </div>
            <div class="x-controls-group">
                <div id="btn_mv_orb" class="x-mini-btn ${!state.lockOrb?'active':''}"><i class="fa-solid fa-arrows-left-right"></i></div>
                <div id="btn_mv_win" class="x-mini-btn ${!state.lockWin?'active':''}"><i class="fa-solid fa-expand"></i></div>
                <div id="btn_close" class="x-close-icon"><i class="fa-solid fa-xmark"></i></div>
            </div>
        </div>
        <div class="x-content-box">
            ${PAGES.map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.curPage ? 'active' : ''}">
                    <div class="x-page-header">${p.title}</div>
                    <div id="content_${p.id}">
                        ${p.id === 'lore' ? '<div class="x-diary-container">ยังไม่มีบันทึก...</div>' : 'กำลังพัฒนา...'}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;

    $('body').append(html);
    $('#x_main_modal').css(state.winPos);
    bindEvents();
}

function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');
    
    orb.on('click', () => { if(state.lockOrb) modal.fadeToggle(200).css('display', 'flex'); });
    $('#btn_close').on('click', () => { if(state.lockOrb && state.lockWin) modal.fadeOut(200); });
    
    $('.x-nav-icon').on('click', function() {
        state.curPage = $(this).data('id');
        $('.x-nav-icon').removeClass('active'); $(this).addClass('active');
        $('.x-page').removeClass('active'); $(`#page_${state.curPage}`).addClass('active');
        saveSettings();
    });

    $('#btn_mv_orb').on('click', () => { state.lockOrb = !state.lockOrb; updateUIState(); saveSettings(); });
    $('#btn_mv_win').on('click', () => { state.lockWin = !state.lockWin; updateUIState(); saveSettings(); });

    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'win', $('#x_drag_zone')[0]);
}

function updateUIState() {
    $('#btn_mv_orb').toggleClass('active', !state.lockOrb);
    $('#btn_mv_win').toggleClass('active', !state.lockWin);
    $('#x_floating_btn').toggleClass('x-dragging', !state.lockOrb);
}

// --- CORE LOGIC: การตรวจจับโค้ด HTML ในแชท ---
function processMessage(messageId) {
    const msg = $(`.message[mesid="${messageId}"] .mes_text`);
    if (!msg.length) return;

    let html = msg.html();
    // ค้นหา <Code:Category> เนื้อหา </Code> หรือ <Code> เนื้อหา </Code>
    const regex = /&lt;Code(?:[:\s]*([^&>]+))?&gt;([\s\S]*?)&lt;\/Code&gt;/gi;
    
    if (html.includes('&lt;Code')) {
        let counter = 1;
        const newHtml = html.replace(regex, (match, category, content) => {
            const catName = category ? category.trim() : `Code ${counter++}`;
            const cleanContent = content.replace(/<br\s*\/?>/gi, '\n').trim();

            // เก็บเข้าความจำ
            extractedCodes.push({ id: messageId, category: catName, content: cleanContent });
            
            // คืนค่าแท็กย่อแสดงผลในแชท
            return `<span class="shortened-code-trigger" onclick="window.openDiary()"><i class="fa-solid fa-star"></i> [ ${catName} ]</span>`;
        });
        
        msg.html(newHtml);
        refreshDiaryUI();
    }
}

function refreshDiaryUI() {
    const container = $('#content_lore');
    if (extractedCodes.length === 0) return;

    let html = '<div class="x-diary-container">';
    extractedCodes.forEach((item, index) => {
        html += `
            <div class="x-diary-item" onclick="window.copyToClipboard('${encodeURIComponent(item.content)}')">
                <div class="x-diary-category">${item.category}</div>
                <div class="x-diary-code-preview">${item.content.substring(0, 150)}${item.content.length > 150 ? '...' : ''}</div>
                <div style="font-size:9px; color:var(--sweet-pink); text-align:right; margin-top:5px;">คลิกเพื่อคัดลอก HTML เต็ม</div>
            </div>
        `;
    });
    html += '</div>';
    container.html(html);
}

window.openDiary = () => {
    $('#x_main_modal').fadeIn(200).css('display', 'flex');
    $('.x-nav-icon[data-id="lore"]').click();
};

window.copyToClipboard = (encodedContent) => {
    const content = decodeURIComponent(encodedContent);
    navigator.clipboard.writeText(content);
    toastr.success('คัดลอกโค้ดเต็มแล้ว!', 'Rabbit Blue');
};

function setupSillyTavernHooks() {
    eventSource.on(event_types.MESSAGE_RECEIVED, processMessage);
    eventSource.on(event_types.MESSAGE_UPDATED, processMessage);
    eventSource.on(event_types.CHAT_CHANGED, () => {
        extractedCodes = [];
        $('#content_lore').html('ยังไม่มีบันทึก...');
        setTimeout(() => {
            $('.message').each(function() {
                const mid = $(this).attr('mesid');
                if (mid) processMessage(mid);
            });
        }, 500);
    });
}

// --- Drag Logic ---
function makeDraggable(el, type, handle) {
    const trigger = handle || el;
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const dragStart = (e) => {
        if (type === 'orb' && state.lockOrb) return;
        if (type === 'win' && state.lockWin) return;
        el.classList.add('no-transition');
        const evt = e.type === 'touchstart' ? e.touches[0] : e;
        p3 = evt.clientX; p4 = evt.clientY;
        document.onmouseup = dragEnd; document.ontouchend = dragEnd;
        document.onmousemove = dragMove; document.ontouchmove = dragMove;
    };
    const dragMove = (e) => {
        const evt = e.type === 'touchmove' ? e.touches[0] : e;
        p1 = p3 - evt.clientX; p2 = p4 - evt.clientY;
        p3 = evt.clientX; p4 = evt.clientY;
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
        el.style.right = 'auto';
    };
    const dragEnd = () => {
        el.classList.remove('no-transition');
        document.onmouseup = null; document.ontouchend = null;
        document.onmousemove = null; document.ontouchmove = null;
        if (type === 'orb') state.btnPos = { top: el.style.top, left: el.style.left, right: 'auto' };
        else state.winPos = { top: el.style.top, left: el.style.left };
        saveSettings();
    };
    trigger.onmousedown = dragStart; trigger.ontouchstart = dragStart;
}
