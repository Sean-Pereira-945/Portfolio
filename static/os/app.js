const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// App layout: inside the 3D phone (?app) or when opened directly on a phone-sized screen.
const inPhoneModel = new URLSearchParams(window.location.search).has('app');
const phoneViewport = window.matchMedia('(max-width: 640px)');
const root = document.documentElement;
root.classList.toggle('in-phone', inPhoneModel);
const applyAppMode = () => root.classList.toggle('app-mode', inPhoneModel || phoneViewport.matches);
applyAppMode();

const windowShell = document.querySelector('.window');
const windowInner = document.querySelector('.window-inner');
const panelGroup = document.querySelector('.panel-group');
const panels = document.querySelectorAll('[data-panel]');
const sectionButtons = document.querySelectorAll('.hero-action[data-go-tab]');
const desktopIcon = document.querySelector('.desktop-icon');
const maximizeButton = document.querySelector('[data-window="maximize"]');

const showWindow = () => {
    if (!windowShell) return;
    windowShell.classList.remove('window--hidden');
    windowShell.removeAttribute('aria-hidden');
};

const hideWindow = () => {
    if (!windowShell) return;
    windowShell.classList.add('window--hidden');
    windowShell.setAttribute('aria-hidden', 'true');
    if (desktopIcon) desktopIcon.focus();
};

const toggleMaximize = () => {
    if (!windowShell || !maximizeButton) return;
    const maximized = windowShell.classList.toggle('window--maximized');
    maximizeButton.setAttribute('aria-pressed', maximized ? 'true' : 'false');
    maximizeButton.setAttribute(
        'aria-label',
        maximized ? 'Restore window' : 'Maximize window'
    );
};

const activatePanel = (name, { focus = true } = {}) => {
    if (!name) return;
    let targetPanel = null;

    panels.forEach((panel) => {
        const isActive = panel.dataset.panel === name;
        panel.classList.toggle('active', isActive);
        if (isActive) targetPanel = panel;
    });

    sectionButtons.forEach((button) => {
        if (button.dataset.goTab === name) {
            button.setAttribute('aria-current', 'true');
        } else {
            button.removeAttribute('aria-current');
        }
    });

    if (panelGroup) panelGroup.scrollTop = 0;

    // On narrow screens the whole window scrolls, so bring the panel into view.
    if (panelGroup && windowInner && windowInner.scrollHeight > windowInner.clientHeight) {
        panelGroup.scrollIntoView({
            behavior: reducedMotion.matches ? 'auto' : 'smooth',
            block: 'start',
        });
    }

    if (focus && targetPanel) targetPanel.focus({ preventScroll: true });
};

document.querySelectorAll('[data-go-tab]').forEach((button) => {
    button.addEventListener('click', () => {
        const opening = windowShell && windowShell.classList.contains('window--hidden');
        showWindow();
        // Opening from the desktop icon keeps focus on the section nav instead of the panel.
        activatePanel(button.dataset.goTab, { focus: !opening });
        if (opening && sectionButtons[0]) sectionButtons[0].focus();
    });
});

document.querySelectorAll('[data-window]').forEach((button) => {
    button.addEventListener('click', () => {
        const action = button.dataset.window;
        if (action === 'maximize') {
            toggleMaximize();
        } else {
            hideWindow();
        }
    });
});

document.querySelectorAll('[data-resume]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
        const url = trigger.getAttribute('data-resume');
        if (url) {
            window.open(url, '_blank');
        }
    });
});

// ---- Phone app layout ----
// Each bottom tab shows one or more of the existing panels, stacked.
const APP_TABS = {
    home: ['about'],
    work: ['experience', 'education'],
    projects: ['projects'],
    skills: ['skills', 'achievements'],
    contact: ['contact'],
};
const appTabs = document.querySelectorAll('[data-app-tab]');

const activateAppTab = (name) => {
    const shown = APP_TABS[name];
    if (!shown) return;
    panels.forEach((panel) => {
        panel.classList.toggle('active', shown.includes(panel.dataset.panel));
    });
    appTabs.forEach((tab) => {
        if (tab.dataset.appTab === name) {
            tab.setAttribute('aria-current', 'true');
        } else {
            tab.removeAttribute('aria-current');
        }
    });
    if (panelGroup) panelGroup.scrollTop = 0;
};

appTabs.forEach((tab) => {
    tab.addEventListener('click', () => activateAppTab(tab.dataset.appTab));
});

const syncLayout = () => {
    applyAppMode();
    if (root.classList.contains('app-mode')) {
        showWindow();
        const current = document.querySelector('[data-app-tab][aria-current="true"]');
        activateAppTab(current ? current.dataset.appTab : 'home');
    } else {
        const current = document.querySelector('.hero-action[aria-current="true"]');
        activatePanel(current ? current.dataset.goTab : 'about', { focus: false });
    }
};
phoneViewport.addEventListener('change', syncLayout);
syncLayout();

// Status bar clock (only visible inside the 3D phone)
const clockNode = document.querySelector('[data-clock]');
const updateClock = () => {
    if (!clockNode) return;
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockNode.textContent = `${hours}:${minutes}`;
};
if (inPhoneModel) {
    updateClock();
    setInterval(updateClock, 15 * 1000);
}

// When SeanOS runs inside the 3D monitor, relay key presses to the parent scene
// so it can play keyboard sounds and leave the monitor on Escape.
if (window.parent !== window) {
    ['keydown', 'keyup'].forEach((type) => {
        document.addEventListener(type, (event) => {
            window.parent.postMessage({ type, key: event.key }, '*');
        });
    });
}
