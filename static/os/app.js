const clockNode = document.querySelector('[data-clock]');

const updateClock = () => {
    if (!clockNode) return;
    const now = new Date();
    clockNode.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

updateClock();
setInterval(updateClock, 60 * 1000);

const tabButtons = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('[data-panel]');

tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const target = button.dataset.tab;
        tabButtons.forEach((btn) => {
            const isActive = btn === button;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        panels.forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.panel === target);
        });
    });
});

const scrollPanelGroupIntoView = () => {
    const panelGroup = document.querySelector('.panel-group');
    if (panelGroup) {
        panelGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

const activateTab = (tabName) => {
    if (!tabName) return;
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetButton && typeof targetButton.click === 'function') {
        targetButton.click();
        scrollPanelGroupIntoView();
    }
};

const quickNavButtons = document.querySelectorAll('[data-go-tab]');
quickNavButtons.forEach((button) => {
    button.addEventListener('click', () => {
        activateTab(button.getAttribute('data-go-tab'));
    });
});

const resumeTrigger = document.querySelector('[data-resume]');
if (resumeTrigger) {
    resumeTrigger.addEventListener('click', () => {
        const url = resumeTrigger.getAttribute('data-resume');
        if (url) {
            window.open(url, '_blank');
        }
    });
}
