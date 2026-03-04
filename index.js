import { eventSource, event_types } from '../../../../script.js';

// --- CONFIG & STATE ---
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

let extractedCodesMap = {}; // เก็บโค้ดแยกตาม Message ID

jQuery(async () => {
    loadSettings();
    injectUI();
    setupSillyTavernHooks();
    setTimeout(scanAllMessages, 1000); // สแกนทันทีเมื่อเข้าห้องแชท
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
                ${PAGES.map(p => `<div class="x-nav-icon ${p.id === state.curPage ? 'active' : ''}" data-id="${p.id}" title="${p.title}"><i class="fa-solid ${p.icon}"></i></div>`).join('')}
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
                        ${p.id === 'lore' ? '<div id="diary_codes_container"></div>' : '<div style="opacity:0.5; padding:20px; text-align:center;">กำลังพัฒนาหน้าส่วนนี้...</div>'}
                    </div>
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
    orb.on('click', () => { if (state.lockOrb) modal.fadeToggle(200).css('display', 'flex'); });
    $('#btn_close').on('click', () => { if (state.lockOrb && state.lockWin) modal.fadeOut(200); });
    $('.x-nav-icon').on('click', function() {
        state.curPage = $(this).data('id');
        $('.x-nav-icon').removeClass('active'); $(this).addClass('active');
        $('.x-page').removeClass('active'); $(`#page_${state.curPage}`).addClass('active');
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

// --- CORE LOGIC: การตรวจจับและดึงโค้ด HTML ---
function processMessageForCodes(mesElement, messageId) {
    let html = mesElement.html();
    
    // Regex สำหรับจับ <Code:หมวดหมู่>โค้ดข้างใน</Code> (รองรับทั้งที่มีและไม่มีหมวดหมู่)
    const codeRegex = /&lt;Code(?:[:\s]*([^&>]+))?&gt;([\s\S]*?)&lt;\/Code&gt;/gi;
    
    if (!html.includes('&lt;Code')) return;

    extractedCodesMap[messageId] = [];
    let counter = 1;

    let processedHtml = html.replace(codeRegex, (match, categoryRaw, content) => {
        const category = categoryRaw ? categoryRaw.trim() : `Code ${counter++}`;
        
        // คลีนเนื้อหาโค้ด HTML ให้พร้อมสำหรับนำไปแสดงผล (ถอด <br> ออกเพื่อให้โค้ดไม่เพี้ยน)
        let cleanHtmlCode = content.replace(/<br\s*\/?>/gi, '\n');
        
        // บันทึกลงหน่วยความจำของ Extension
        extractedCodesMap[messageId].push({ category, content: cleanHtmlCode });

        // สร้างรูปลักษณ์ของโค้ดที่จะแสดงในหน้าจอแชท (ย่อหน้าตาให้เหมือน Extension)
        return `
            <div class="x-code-item-chat" 
                 onclick="window.inspectSpecificMessage('${messageId}')"
                 style="border: 1px solid var(--sweet-pink); border-radius: 12px; padding: 12px; background: rgba(255,255,255,0.4); margin: 10px 0; cursor: pointer;">
                <div style="font-size: 11px; font-weight: bold; color: var(--sweet-pink); margin-bottom: 5px;">
                    <i class="fa-solid fa-code"></i> ${category}
                </div>
                <div style="font-family: monospace; font-size: 12px; white-space: pre-wrap; color: var(--sweet-text); opacity: 0.8; max-height: 80px; overflow: hidden; position: relative;">
                    ${cleanHtmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 20px; background: linear-gradient(transparent, rgba(255,255,255,0.5));"></div>
                </div>
                <div style="font-size: 9px; text-align: right; margin-top: 5px; color: var(--sweet-pink);">
                    Click to view in Diary
                </div>
            </div>
        `;
    });

    mesElement.html(processedHtml);
}

// --- การแสดงผลในหน้าไดอารี่ (Diary Display) ---
function updateDiaryUI() {
    const container = $('#diary_codes_container');
    let html = '';
    
    // เรียงตามหมวดหมู่
    const grouped = {};
    Object.values(extractedCodesMap).flat().forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    if (Object.keys(grouped).length === 0) {
        container.html('<div style="text-align:center; padding:20px; opacity:0.5;">ไม่มีข้อมูลในไดอารี่ 🐰</div>');
        return;
    }

    for (const cat in grouped) {
        html += `<div style="font-weight:bold; color:var(--sweet-pink); margin: 15px 0 8px 0; border-bottom: 2px solid var(--sweet-peach);">📂 ${cat}</div>`;
        grouped[cat].forEach(item => {
            const displaySafe = $('<div>').text(item.content).html();
            html += `
                <div class="x-code-item" onclick="window.copyToClipboard(this)" data-content="${encodeURIComponent(item.content)}">
                    <div class="x-code-content" style="max-height: 200px; font-size: 11px;">${displaySafe}</div>
                    <div style="text-align:right; margin-top:5px; font-size:10px; color:var(--sweet-pink); font-weight:bold;">
                        <i class="fa-solid fa-copy"></i> Copy Raw HTML
                    </div>
                </div>
            `;
        });
    }
    container.html(html);
}

// --- GLOBAL FUNCTIONS ---
window.copyToClipboard = (element) => {
    const content = decodeURIComponent($(element).attr('data-content'));
    navigator.clipboard.writeText(content);
    toastr.success('คัดลอก HTML สำเร็จ!');
};

window.inspectSpecificMessage = (mid) => {
    $('#x_main_modal').fadeIn(200).css('display', 'flex');
    $('.x-nav-icon[data-id="lore"]').click();
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
            if (txt.length) {
                processMessageForCodes(txt, mid);
                updateDiaryUI();
            }
        }, 300);
    };

    eventSource.on(event_types.MESSAGE_RECEIVED, handle);
    eventSource.on(event_types.MESSAGE_UPDATED, handle);
    eventSource.on(event_types.MESSAGE_SWIPED, handle);
    eventSource.on(event_types.CHAT_CHANGED, () => {
        extractedCodesMap = {};
        setTimeout(scanAllMessages, 500);
    });
}

// --- Drag Logic ---
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
 
