import { eventSource, event_types } from '../../../../script.js';

// --- SETTINGS & STATE ---
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

let extractedCodesMap = {}; 

jQuery(async () => {
    loadSettings();
    injectUI();
    setupSillyTavernHooks();
    setTimeout(scanAllMessages, 1000);
});

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- UI INJECTION (โครงสร้างเดิมที่คุณเคยส่งให้) ---
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
                    <div class="x-nav-icon ${p.id === state.curPage ? 'active' : ''}" 
                         data-id="${p.id}" title="${p.title}">
                        <i class="fa-solid ${p.icon}"></i>
                    </div>
                `).join('')}
            </div>
            <div class="x-controls-group">
                <div id="btn_mv_orb" class="x-mini-btn ${!state.lockOrb?'active':''}" title="Move Orb"><i class="fa-solid fa-arrows-up-down-left-right"></i></div>
                <div id="btn_mv_win" class="x-mini-btn ${!state.lockWin?'active':''}" title="Move Window"><i class="fa-solid fa-expand"></i></div>
                <div id="btn_close" class="x-close-icon"><i class="fa-solid fa-xmark"></i></div>
            </div>
        </div>
        <div class="x-content-box">
            ${PAGES.map(p => `
                <div id="page_${p.id}" class="x-page ${p.id === state.curPage ? 'active' : ''}">
                    <div class="x-page-header"><i class="fa-solid ${p.icon}"></i> ${p.title}</div>
                    <div id="content_${p.id}">
                        ${p.id === 'lore' ? '<div id="diary_codes_container"></div>' : '<div class="x-empty">Coming Soon...</div>'}
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

    orb.on('click', () => { if (state.lockOrb) modal.fadeToggle(200).css('display', 'flex'); });
    $('#btn_close').on('click', () => { if (state.lockOrb && state.lockWin) modal.fadeOut(200); });

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
    $('#btn_mv_orb').toggleClass('active', !state.lockOrb);
    $('#btn_mv_win').toggleClass('active', !state.lockWin);
}

// --- CORE SYSTEM: DIARY CODE EXTRACTOR ---
function processMessageForCodes(mesElement, messageId) {
    let html = mesElement.html();
    const codeRegex = /&lt;Code(?:[:\s]*([^&>]+))?&gt;([\s\S]*?)&lt;\/Code&gt;/gi;
    
    if (!html.includes('&lt;Code')) return;

    extractedCodesMap[messageId] = [];
    let counter = 1;

    let processedHtml = html.replace(codeRegex, (match, type, content) => {
        const category = type ? type.trim() : `Entry ${counter++}`;
        let rawCode = $('<div>').html(content.replace(/<br\s*\/?>/gi, '\n')).text().trim();
        
        extractedCodesMap[messageId].push({ category, content: rawCode });

        // แสดงผลในแชทเป็นกล่องที่ "หน้าตาเหมือน Extension" (แสดงทับสัญลักษณ์แท็ก)
        return `
            <div class="x-chat-code-block" onclick="window.openDiary()">
                <div class="x-chat-code-tag"><i class="fa-solid fa-star"></i> ${category}</div>
                <div class="x-chat-code-preview">${rawCode.substring(0, 100)}${rawCode.length > 100 ? '...' : ''}</div>
            </div>
        `;
    });

    mesElement.html(processedHtml);
}

function updateDiaryUI() {
    const container = $('#diary_codes_container');
    let html = '';
    
    const allEntries = Object.values(extractedCodesMap).flat();
    if (allEntries.length === 0) {
        container.html('<div class="x-empty">บันทึกในไดอารี่ยังว่างเปล่า...</div>');
        return;
    }

    allEntries.forEach(item => {
        html += `
            <div class="x-diary-item" onclick="window.copyCode(this)" data-code="${encodeURIComponent(item.content)}">
                <div class="x-diary-tag">📂 ${item.category}</div>
                <div class="x-diary-snippet">${$('<div>').text(item.content).html()}</div>
                <div class="x-diary-copy"><i class="fa-solid fa-copy"></i> Click to Copy HTML</div>
            </div>
        `;
    });
    container.html(html);
}

// --- UTILS ---
window.openDiary = () => {
    $('#x_main_modal').fadeIn(200).css('display', 'flex');
    $('.x-nav-icon[data-id="lore"]').click();
};

window.copyCode = (el) => {
    const code = decodeURIComponent($(el).attr('data-code'));
    navigator.clipboard.writeText(code);
    toastr.success('คัดลอกโค้ดแล้ว!');
};

function scanAllMessages() {
    extractedCodesMap = {};
    $('.message').each(function() {
        const mid = $(this).attr('mesid');
        const txt = $(this).find('.mes_text');
        if (txt.length && mid) processMessageForCodes(txt, mid);
    });
    updateDiaryUI();
}

function setupSillyTavernHooks() {
    const handle = (mid) => {
        setTimeout(() => {
            const txt = $(`.message[mesid="${mid}"] .mes_text`);
            if (txt.length) { processMessageForCodes(txt, mid); updateDiaryUI(); }
        }, 300);
    };
    eventSource.on(event_types.MESSAGE_RECEIVED, handle);
    eventSource.on(event_types.MESSAGE_UPDATED, handle);
    eventSource.on(event_types.CHAT_CHANGED, () => { extractedCodesMap = {}; setTimeout(scanAllMessages, 500); });
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
