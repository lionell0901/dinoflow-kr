document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
    var header = document.getElementById('header');
    var menuButton = document.querySelector('.menu-button');
    var navLinks = document.getElementById('primary-navigation');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setMenu(open) {
        if (!menuButton || !navLinks) return;
        menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuButton.querySelector('.sr-only').textContent = open ? '메뉴 닫기' : '메뉴 열기';
        navLinks.classList.toggle('active', open);
        document.body.classList.toggle('menu-open', open);
    }

    if (menuButton && navLinks) {
        menuButton.addEventListener('click', function () {
            setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
        });
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () { setMenu(false); });
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
                setMenu(false);
                menuButton.focus();
            }
        });
        var desktopQuery = window.matchMedia('(min-width: 781px)');
        var closeOnDesktop = function (event) { if (event.matches) setMenu(false); };
        if (typeof desktopQuery.addEventListener === 'function') {
            desktopQuery.addEventListener('change', closeOnDesktop);
        } else if (typeof desktopQuery.addListener === 'function') {
            desktopQuery.addListener(closeOnDesktop);
        }
    }

    function updateHeader() {
        if (header) header.classList.toggle('scrolled', window.scrollY > 12);
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            var targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            var target = document.querySelector(targetId);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });
    });

    var revealItems = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach(function (item) { item.classList.add('is-visible'); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
        revealItems.forEach(function (item) { revealObserver.observe(item); });
    }

    document.querySelectorAll('.program-item').forEach(function (item) {
        item.addEventListener('toggle', function () {
            if (!item.open) return;
            document.querySelectorAll('.program-item[open]').forEach(function (other) {
                if (other !== item) other.open = false;
            });
        });
    });

    setupContactForm();
    loadTrackRecord();
});

function setupContactForm() {
    var form = document.getElementById('contact-form');
    var message = document.getElementById('form-message');
    if (!form || !message) return;

    if (window.emailjs && typeof window.emailjs.init === 'function') {
        window.emailjs.init('URK5IT-ga48mugcnf');
    }

    function showMessage(text, type, includeAlternatives) {
        message.hidden = false;
        message.className = 'form-message ' + type;
        message.replaceChildren(document.createTextNode(text));
        if (includeAlternatives) {
            message.appendChild(document.createTextNode(' '));
            var kakao = document.createElement('a');
            kakao.href = 'https://open.kakao.com/o/suYsYaxf';
            kakao.target = '_blank';
            kakao.rel = 'noopener noreferrer';
            kakao.textContent = '카카오톡 상담';
            message.appendChild(kakao);
            message.appendChild(document.createTextNode(' 또는 '));
            var email = document.createElement('a');
            email.href = 'mailto:godino2895@gmail.com';
            email.textContent = '이메일';
            message.appendChild(email);
            message.appendChild(document.createTextNode('을 이용해주세요.'));
        }
        message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;

        if (!window.emailjs || typeof window.emailjs.send !== 'function') {
            showMessage('문의 전송 서비스를 불러오지 못했습니다.', 'error', true);
            return;
        }

        var submitButton = form.querySelector('.submit-button');
        var originalLabel = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = '전송 중입니다...';
        message.hidden = true;

        var templateParams = {
            from_name: document.getElementById('name').value.trim(),
            from_email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            company: document.getElementById('company').value.trim(),
            participants: document.getElementById('participants').value.trim(),
            schedule: document.getElementById('schedule').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        window.emailjs.send('service_86ytxlb', 'template_10s18ru', templateParams)
            .then(function () {
                form.reset();
                showMessage('문의가 접수되었습니다. 영업일 1일 이내에 회신드리겠습니다.', 'success', false);
            })
            .catch(function () {
                showMessage('문의 전송에 실패했습니다.', 'error', true);
            })
            .finally(function () {
                submitButton.disabled = false;
                submitButton.textContent = originalLabel;
            });
    });
}

function loadTrackRecord() {
    if (!('fetch' in window)) return;
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timeout = window.setTimeout(function () {
        if (controller) controller.abort();
    }, 5000);

    fetch('https://hub.dinoflow.kr/api/summary.json', {
        mode: 'cors',
        signal: controller ? controller.signal : undefined
    })
        .then(function (response) {
            if (!response.ok) throw new Error('summary unavailable');
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.totals) return;
            setStat('sessions', floorPlus(data.totals.sessions, '회'));
            setStat('hours', floorPlus(data.totals.hours, '시간'));
            setStat('students', floorPlus(data.totals.attendees, '명'));
            renderRecentLectures(data.recent);
            var footer = document.getElementById('recent-footer-link');
            if (footer && data.upcoming && Number(data.upcoming.count) > 0) {
                footer.firstChild.textContent = '예정 강의 ' + data.upcoming.count + '건 · 전체 기록 확인 ';
            }
        })
        .catch(function () { /* 검증된 정적 폴백 유지 */ })
        .finally(function () { window.clearTimeout(timeout); });
}

function floorPlus(value, suffix) {
    var number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    return Math.floor(number).toLocaleString('ko-KR') + '+' + suffix;
}

function setStat(key, value) {
    if (!value) return;
    document.querySelectorAll('[data-stat="' + key + '"]').forEach(function (element) {
        element.textContent = value;
    });
}

function renderRecentLectures(recent) {
    var list = document.getElementById('recent-list');
    if (!list || !Array.isArray(recent) || recent.length === 0) return;
    list.replaceChildren();

    recent.slice(0, 3).forEach(function (lecture) {
        var item = document.createElement('li');
        item.className = 'recent-item';
        var link = document.createElement('a');
        link.href = 'https://hub.dinoflow.kr/lectures';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.appendChild(makeSpan('recent-date', formatDate(lecture.date)));
        link.appendChild(makeSpan('recent-client', lecture.client || '기업·기관'));
        link.appendChild(makeSpan('recent-program', lecture.program || lecture.category || 'AI 실무교육'));
        item.appendChild(link);
        list.appendChild(item);
    });
}

function makeSpan(className, text) {
    var span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
}

function formatDate(value) {
    if (typeof value !== 'string' || value.length < 10) return '';
    return value.slice(2, 10).replace(/-/g, '.');
}
