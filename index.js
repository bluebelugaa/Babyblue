
// --- Sweet Heart HUD (Full Logic) ---
const STORAGE_KEY = "sweet_hud_settings";
const PAGES = [
    { id: 'lore', title: 'Diary Content' },
    { id: 'inspect', title: 'Inspect' },
    { id: 'ooc', title: 'Sweet Chat' },
    { id: 'world', title: 'World View' },
    { id: 'helper', title: 'Help' }
];

let state = {
    btnPos: { top: '150px', left: 'auto', right: '15px' },
    winPos: { top: '15vh', left: '5vw' },
    lastPage: 0,
    isOrbUnlocked: false,
    isWinUnlocked: false
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

    // ลูกแก้วทรงหวาน
    const orb = $(`<div id="x_floating_btn"><div class="x-core-gem"></div></div>`);
    orb.css(state.btnPos);
    $('body').append(orb);

    // หน้าต่างโปร่งแสง
    const modalHtml = `
    <div id="x_main_modal">
        <div class="x-header" id="x_drag_handle">
            <div class="x-title">SWEET HUD</div>
            <div class="x-controls">
                <div id="x_sw_orb" class="x-switch-btn ${state.isOrbUnlocked?'active':''}">
                    <div class="x-led"></div> Move Core
                </div>
                <div id="x_sw_win" class="x-switch-btn ${state.isWinUnlocked?'active':''}">
                    <div class="x-led"></div> Move Win
                </div>
                <div id="x_close" class="x-close-btn"><i class="fa-solid fa-circle-xmark"></i></div>
            </div>
        </div>
        <div style="flex:1; overflow:hidden; position:relative;">
            ${PAGES.map((p, i) => `
                <div id="page_${p.id}" class="x-page ${state.lastPage===i?'active':''}">
                    <div style="color:var(--sweet-pink); font-weight:bold; font-size:11px; margin-bottom:10px;">• ${p.title}</div>
                    <div id="content_${p.id}" style="font-size:13px; line-height:1.5;">Waiting for sweetness...</div>
                </div>
            `).join('')}
        </div>
        <div class="x-nav-bar">
            <button class="x-nav-btn" id="x_prev"><i class="fa-solid fa-angle-left"></i></button>
            <div class="x-page-title" id="x_cur_title">${PAGES[state.lastPage].title}</div>
            <button class="x-nav-btn" id="x_next"><i class="fa-solid fa-angle-right"></i></button>
        </div>
    </div>`;
    
    $('body').append(modalHtml);
    $('#x_main_modal').css(state.winPos);

    setupEvents();
    updateSafetyUI();
}

function setupEvents() {
    const orb = $('#x_floating_btn');
    const modal = $('#x_main_modal');

    orb.on('click', () => {
        if (state.isOrbUnlocked) return;
        modal.fadeToggle(250).css('display', 'flex');
    });

    $('#x_close').on('click', () => {
        if (state.isOrbUnlocked || state.isWinUnlocked) return;
        modal.fadeOut(250);
    });

    $('#x_sw_orb').on('click', () => {
        state.isOrbUnlocked = !state.isOrbUnlocked;
        updateSafetyUI();
        saveSettings();
    });

    $('#x_sw_win').on('click', () => {
        state.isWinUnlocked = !state.isWinUnlocked;
        updateSafetyUI();
        saveSettings();
    });

    $('#x_prev').on('click', () => movePage(-1));
    $('#x_next').on('click', () => movePage(1));

    makeDraggable(orb[0], 'orb');
    makeDraggable(modal[0], 'win', $('#x_drag_handle')[0]);
}

function movePage(dir) {
    state.lastPage = (state.lastPage + dir + PAGES.length) % PAGES.length;
    $('.x-page').removeClass('active');
    $(`#page_${PAGES[state.lastPage].id}`).addClass('active');
    $('#x_cur_title').text(PAGES[state.lastPage].title);
    saveSettings();
}

function updateSafetyUI() {
    const isLocked = state.isOrbUnlocked || state.isWinUnlocked;
    $('#x_sw_orb').toggleClass('active', state.isOrbUnlocked);
    $('#x_sw_win').toggleClass('active', state.isWinUnlocked);
    $('#x_close').toggleClass('disabled', isLocked);
    
    if(isLocked) {
        $('#x_drag_handle').css('background', 'rgba(255,183,197,0.1)');
    } else {
        $('#x_drag_handle').css('background', '');
    }
}

function makeDraggable(el, type, handle) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const trigger = handle || el;

    const start = (e) => {
        if (type === 'orb' && !state.isOrbUnlocked) return;
        if (type === 'win' && !state.isWinUnlocked) return;
        
        const event = e.type === 'touchstart' ? e.touches[0] : e;
        p3 = event.clientX; p4 = event.clientY;
        document.onmousemove = move; document.ontouchmove = move;
        document.onmouseup = stop; document.ontouchend = stop;
    };

    const move = (e) => {
        const event = e.type === 'touchmove' ? e.touches[0] : e;
        if (e.cancelable) e.preventDefault();
        p1 = p3 - event.clientX; p2 = p4 - event.clientY;
        p3 = event.clientX; p4 = event.clientY;
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
        el.style.right = 'auto';
    };

    const stop = () => {
        document.onmousemove = null; document.ontouchmove = null;
        if (type === 'orb') state.btnPos = { top: el.style.top, left: el.style.left, right: 'auto' };
        else state.winPos = { top: el.style.top, left: el.style.left };
        saveSettings();
    };

    trigger.onmousedown = start;
    trigger.ontouchstart = start;
}
