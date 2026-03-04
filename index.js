import { eventSource, event_types } from '../../../../script.js';

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

let extractedCodesMap = {}; // เก็บโค้ดแยกตาม ID ข้อความ

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
                    <div class="x-nav-icon ${p.id === state.curPage ? 'active' : ''}" 
                         data-id="${p.id}" 
                         title="${p.title}">
                        <i class="fa-solid ${p.icon}"></i>
                    </div>
                `).join('')}
            </div>
            <div class="x-controls-group">
                <div id="btn_mv_orb" class="x-mini-btn ${!state.lockOrb?'active':''}" title="Move Orb">
                    <i class="fa-solid fa-arrows-up-down-left-right"></i>
                </div>
                <div id="btn_mv_win" class="x-mini-btn ${!state.lockWin?'active':''}" title="Move Window">
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
                    <div id="content_${p.id}">
                        ${p.id === 'inspect' ? 'Waiting for sweet memories...' : 'Work in progress...'}
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

function makeDraggable(el, type, handle) {
    const trigger = handle || el;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragStart = (e) => {
        if (type === 'orb' && state.lockOrb) return;
        if (type === 'win' && state.lockWin) return;
        el.classList.add('no-transition'); 
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
        el.classList.remove('no-transition'); 
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

// --- ฟังก์ชันหลักในการแยกโค้ดและแก้ไขข้อความแชท ---
function processMessageForCodes(html, messageId) {
    const codeRegex = /&lt;Code(?:[:\s]*([^&]+))?&gt;([\s\S]*?)&lt;\/Code&gt;/gi;
    extractedCodesMap[messageId] = []; 
    let counter = 1;

    let processedHtml = html.replace(codeRegex, (match, type, content) => {
        const category = type ? type.trim() : `Code ${counter++}`;
        const cleanContent = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        
        extractedCodesMap[messageId].push({
            category: category,
            content: cleanContent
        });

        // คืนค่าปุ่มที่จะโชว์ในช่องแชทแทนโค้ดที่ถูกดึงออกไป
        return `<span class="shortened-code-trigger" onclick="window.openRabbitBlueInspect()"><i class="fa-solid fa-code"></i> [ ${category} ]</span>`;
    });

    updateCodeUI();
    return processedHtml;
}

// --- ฟังก์ชันอัปเดตหน้าจอ Extension (Inspect) ---
function updateCodeUI() {
    const container = $('#content_inspect');
    let allCodes = [];
    Object.values(extractedCodesMap).forEach(arr => allCodes.push(...arr));

    if (allCodes.length === 0) {
        container.html("<div style='text-align:center; color:var(--sweet-text); margin-top:20px;'>ยังไม่พบโค้ดในความทรงจำ...</div>");
        return;
    }

    let html = '';
    const groups = {};
    
    allCodes.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
    });

    for (const cat in groups) {
        html += `<div style="font-weight:bold; color:var(--sweet-pink); margin:10px 0 5px 0; border-bottom: 1px dashed var(--sweet-pink); padding-bottom: 3px;">📂 ${cat}</div>`;
        groups[cat].forEach(item => {
            html += `
                <div class="x-code-item" onclick="window.copyToClipboard(this)" data-content="${encodeURIComponent(item.content)}">
                    <div class="x-code-content">${item.content}</div>
                    <div style="font-size:9px; color:var(--sweet-pink); text-align:right; margin-top:5px; font-weight:bold;">
                        <i class="fa-solid fa-copy"></i> Click to copy
                    </div>
                </div>
            `;
        });
    }
    container.html(html);
}

// --- Global Functions ผูกกับ Window เพื่อให้ HTML เรียกใช้ได้ ---
window.copyToClipboard = (element) => {
    const encodedContent = $(element).attr('data-content');
    const content = decodeURIComponent(encodedContent);
    navigator.clipboard.writeText(content);
    if (typeof toastr !== 'undefined') {
        toastr.success('คัดลอกโค้ดเรียบร้อยแล้ว!', 'Rabbit Blue'); 
    }
};

window.openRabbitBlueInspect = () => {
    const modal = $('#x_main_modal');
    if (modal.css('display') === 'none') {
        modal.css('display', 'flex').hide().fadeIn(200);
    }
    $('.x-nav-icon[data-id="inspect"]').click();
};

// --- เชื่อมต่อกับ Event System ของ SillyTavern ---
function setupSillyTavernHooks() {
    const processSTMessage = (messageId) => {
        const messageElement = $(`.message[mesid="${messageId}"] .mes_text`);
        if (!messageElement.length) return;
        
        let html = messageElement.html();
        if (html.includes('&lt;Code')) {
             const newHtml = processMessageForCodes(html, messageId);
             messageElement.html(newHtml);
        }
    };

    // ดักจับเมื่อรับข้อความ, แก้ไขข้อความ หรือปัดข้อความ (Swipe)
    eventSource.on(event_types.MESSAGE_RECEIVED, processSTMessage);
    eventSource.on(event_types.MESSAGE_UPDATED, processSTMessage);
    eventSource.on(event_types.MESSAGE_SWIPED, processSTMessage);

    // เคลียร์ความจำเมื่อเปลี่ยนแชท และสแกนหน้าจออีกครั้ง
    eventSource.on(event_types.CHAT_CHANGED, () => {
        extractedCodesMap = {}; 
        updateCodeUI();
        
        $('.message').each(function() {
            const mid = $(this).attr('mesid');
            if (mid) processSTMessage(mid);
        });
    });
}
