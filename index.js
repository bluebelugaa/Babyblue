import { eventSource, event_types } from '../../../../script.js';

const STORAGE_KEY = "rabbit_blue_sweet_full";
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

let extractedCodes = []; // ข้อมูลที่สกัดออกมา

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

    $('body').append(`
        <div id="x_floating_btn">
            <video class="x-core-video" autoplay loop muted playsinline>
                <source src="https://files.catbox.moe/89qxpt.mp4" type="video/mp4">
            </video>
        </div>
    `);
    $('#x_floating_btn').css(state.btnPos);

    const html = `
    <div id="x_main_modal">
        <div class="x-header" id="x_drag_zone">
            <div class="x-title">RABBIT BLUE</div>
            <div class="x-nav-container">
                ${PAGES.map(p => `
                    <div class="x-nav-icon ${p.id === state.curPage ? 'active' : ''}" data-id="${p.id}" title="${p.title}">
                        <i class="fa-solid ${p.icon}"></i>
                    </div>
                `).join('')}
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
                    <div id="content_${p.id}">
                        ${p.id === 'lore' ? '<div id="diary_list" class="x-diary-list">ยังไม่มีความทรงจำใหม่...</div>' : '<div style="text-align:center; padding-top:20px; opacity:0.6;">Work in progress...</div>'}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;

    $('body').append(html);
    $('#x_main_modal').css(state.winPos);
    bindEvents();
    updateUIStates();
}

function bindEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    orb.on('click', () => { if(state.lockOrb) modal.fadeToggle(200).css('display', 'flex'); });
    $('#btn_close').on('click', () => { if(state.lockOrb && state.lockWin) modal.fadeOut(200); });

    $('.x-nav-icon').on('click', function() {
        const id = $(this).data('id');
        state.curPage = id;
        $('.x-nav-icon').removeClass('active'); $(this).addClass('active');
        $('.x-page').removeClass('active'); $(`#page_${id}`).addClass('active');
        saveSettings();
    });

    $('#btn_mv_orb').on('click', () => { state.lockOrb = !state.lockOrb; updateUIStates(); saveSettings(); });
    $('#btn_mv_win').on('click', () => { state.lockWin = !state.lockWin; updateUIStates(); saveSettings(); });

    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'win', $('#x_drag_zone')[0]);
}

function updateUIStates() {
    $('#btn_mv_orb').toggleClass('active', !state.lockOrb);
    $('#btn_mv_win').toggleClass('active', !state.lockWin);
    $('#x_floating_btn').toggleClass('x-dragging', !state.lockOrb);
}

// --- CORE SYSTEM: การจัดการโค้ด HTML ---
function processMessage(messageId) {
    const msgElement = $(`.message[mesid="${messageId}"] .mes_text`);
    if (!msgElement.length) return;

    let html = msgElement.html();
    // Regex ตรวจจับ <Code:หมวดหมู่>โค้ด</Code> หรือ <Code>โค้ด</Code>
    const regex = /&lt;Code(?:[:\s]*([^&>]+))?&gt;([\s\S]*?)&lt;\/Code&gt;/gi;
    
    if (html.includes('&lt;Code')) {
        let counter = 1;
        const newHtml = html.replace(regex, (match, category, content) => {
            const catName = category ? category.trim() : `Code ${counter++}`;
            const cleanCode = content.replace(/<br\s*\/?>/gi, '\n').trim();

            // บันทึกลงในรายการสกัด (หลีกเลี่ยงการบันทึกซ้ำ)
            if (!extractedCodes.some(c => c.content === cleanCode)) {
                extractedCodes.push({ category: catName, content: cleanCode });
            }

            // แทนที่ในแชทด้วยปุ่มย่อ
            return `<span class="shortened-code-trigger" onclick="window.openRabbitDiary()"><i class="fa-solid fa-code"></i> [ ${catName} ]</span>`;
        });
        
        msgElement.html(newHtml);
        updateDiaryUI();
    }
}

function updateDiaryUI() {
    const container = $('#diary_list');
    if (extractedCodes.length === 0) return;

    let html = '';
    extractedCodes.forEach((item, index) => {
        html += `
            <div class="x-diary-card" onclick="window.copyRabbitCode('${encodeURIComponent(item.content)}')">
                <div class="x-diary-cat-label">${item.category}</div>
                <div class="x-diary-code-box">${item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <div style="font-size:9px; color:var(--sweet-pink); text-align:right; margin-top:6px; font-weight:bold;">
                    <i class="fa-solid fa-copy"></i> Click to copy HTML
                </div>
            </div>
        `;
    });
    container.html(html);
}

// --- GLOBAL UTILS ---
window.openRabbitDiary = () => {
    $('#x_main_modal').fadeIn(200).css('display', 'flex');
    $('.x-nav-icon[data-id="lore"]').click();
};

window.copyRabbitCode = (encoded) => {
    const code = decodeURIComponent(encoded);
    navigator.clipboard.writeText(code);
    toastr.success('คัดลอก HTML ไปยังคลิปบอร์ดแล้ว!', 'Rabbit Blue');
};

function setupSillyTavernHooks() {
    eventSource.on(event_types.MESSAGE_RECEIVED, processMessage);
    eventSource.on(event_types.MESSAGE_UPDATED, processMessage);
    eventSource.on(event_types.CHAT_CHANGED, () => {
        extractedCodes = [];
        $('#diary_list').html('กำลังสแกนความทรงจำ...');
        setTimeout(() => {
            $('.message').each(function() {
                const mid = $(this).attr('mesid');
                if (mid) processMessage(mid);
            });
        }, 800);
    });
}

function makeDraggable(el, type, handle) {
    const trigger = handle || el;
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const start = (e) => {
        if (type === 'orb' && state.lockOrb) return;
        if (type === 'win' && state.lockWin) return;
        el.classList.add('no-transition');
        const evt = e.type === 'touchstart' ? e.touches[0] : e;
        p3 = evt.clientX; p4 = evt.clientY;
        document.onmouseup = end; document.ontouchend = end;
        document.onmousemove = move; document.ontouchmove = move;
    };
    const move = (e) => {
        const evt = e.type === 'touchmove' ? e.touches[0] : e;
        p1 = p3 - evt.clientX; p2 = p4 - evt.clientY;
        p3 = evt.clientX; p4 = evt.clientY;
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
        el.style.right = 'auto';
    };
    const end = () => {
        el.classList.remove('no-transition');
        document.onmouseup = null; document.ontouchend = null;
        document.onmousemove = null; document.ontouchmove = null;
        if (type === 'orb') state.btnPos = { top: el.style.top, left: el.style.left, right: 'auto' };
        else state.winPos = { top: el.style.top, left: el.style.left };
        saveSettings();
    };
    trigger.onmousedown = start; trigger.ontouchstart = start;
}
