const starsContainer = document.getElementById('stars');

for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    const size = Math.random() * 2.5 + 1;
    star.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        --dur: ${Math.random() * 4 + 2}s;
        --delay: ${Math.random() * 5}s;
        --bright: ${Math.random() * 0.5 + 0.2};
    `;
    starsContainer.appendChild(star);
}

const glow = document.createElement('div');
glow.classList.add('cursor-glow');
document.body.appendChild(glow);

document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
});
const tabs    = document.querySelectorAll('.tab-btn');
const panels  = document.querySelectorAll('.tab-content');
const navArrow = document.querySelector('.nav-arrow');

tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        navArrow.style.opacity = '0';
        setTimeout(() => {
            btn.parentNode.insertBefore(navArrow, btn);
            navArrow.style.opacity = '1';
        }, 150);

        panels.forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });

        const panel = document.getElementById('tab-' + target);
        panel.style.display = 'block';
        requestAnimationFrame(() => panel.classList.add('active'));
    });
});

panels.forEach(p => {
    if (!p.classList.contains('active')) p.style.display = 'none';
});

const dropMap = {
    music: { section: 'drop-music', body: 'body-music' },
    web:   { section: 'drop-web',   body: 'body-web'   },
    prog:  { section: 'drop-prog',  body: 'body-prog'  },
};

let openDrop = null;

let currentAudio = null;

function playTrack(id) {

    const audio = document.getElementById(id);

    if (!audio) return;

    if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    if (audio.paused) {
        audio.play();
        currentAudio = audio;
    } else {
        audio.pause();
    }
}

function playTrack(id, button) {

    const audio = document.getElementById(id);

    if (!audio) return;

    if (audio.paused) {
        audio.play();
        button.textContent = "⏸";
    } else {
        audio.pause();
        button.textContent = "▶";
    }
}

function toggleDropdown(key) {
    const { section, body } = dropMap[key];
    const sec  = document.getElementById(section);
    const bod  = document.getElementById(body);
    const isOpen = sec.classList.contains('open');

    if (openDrop && openDrop !== key) {
        const prev = dropMap[openDrop];
        document.getElementById(prev.section).classList.remove('open');
        document.getElementById(prev.body).classList.remove('open');
    }

    if (isOpen) {
        sec.classList.remove('open');
        bod.classList.remove('open');
        openDrop = null;
    } else {
        sec.classList.add('open');
        bod.classList.add('open');
        openDrop = key;
    }
}