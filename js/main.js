document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
    var header = document.getElementById('header');
    var menuButton = document.querySelector('.menu-button');
    var navLinks = document.getElementById('primary-navigation');
    var mainContent = document.getElementById('main-content');
    var footer = document.querySelector('.site-footer');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setMenu(open) {
        if (!menuButton || !navLinks) return;
        menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuButton.querySelector('.sr-only').textContent = open ? '메뉴 닫기' : '메뉴 열기';
        navLinks.classList.toggle('active', open);
        document.body.classList.toggle('menu-open', open);
        if (mainContent) mainContent.toggleAttribute('inert', open);
        if (footer) footer.toggleAttribute('inert', open);
        if (open) {
            window.setTimeout(function () {
                var firstLink = navLinks.querySelector('a');
                if (firstLink) firstLink.focus();
            }, 0);
        }
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

    var submitButton = form.querySelector('.submit-button');
    var originalLabel = submitButton ? submitButton.textContent : '문의 내용 보내기';
    var collectionConsent = document.getElementById('privacy-consent');
    var overseasConsent = document.getElementById('overseas-consent');
    var inFlight = false;
    var emailClientReady = false;
    var publicKey = 'URK5IT-ga48mugcnf';

    if (window.emailjs && typeof window.emailjs.init === 'function') {
        try {
            window.emailjs.init({
                publicKey: publicKey,
                blockHeadless: true,
                limitRate: { id: 'dinoflow-contact', throttle: 10000 }
            });
            emailClientReady = true;
        } catch (error) {
            emailClientReady = false;
        }
    }
    if (overseasConsent) overseasConsent.required = emailClientReady;

    function showMessage(text, type, includeAlternatives, emailHref) {
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
            email.href = emailHref || 'mailto:godino2895@gmail.com';
            email.textContent = '이메일로 보내기';
            message.appendChild(email);
            message.appendChild(document.createTextNode('를 이용해주세요.'));
        }
        message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function getValue(id) {
        var field = document.getElementById(id);
        return field ? field.value.trim() : '';
    }

    function createInquiryId() {
        var today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        var random = '';
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            var bytes = new Uint8Array(4);
            window.crypto.getRandomValues(bytes);
            random = Array.from(bytes, function (value) {
                return value.toString(16).padStart(2, '0');
            }).join('').toUpperCase();
        } else {
            random = Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0');
        }
        return 'DF-' + today + '-' + random;
    }

    function buildFallbackEmailHref(inquiryId) {
        var lines = [
            '접수번호: ' + inquiryId,
            '',
            '자동 문의 전송에 실패해 이메일로 문의드립니다.',
            '문의 내용을 아래에 입력해주세요.'
        ];
        return 'mailto:godino2895@gmail.com?subject=' +
            encodeURIComponent('[기업 교육 문의] ' + inquiryId) +
            '&body=' + encodeURIComponent(lines.join('\n'));
    }

    ['name', 'company', 'email', 'message'].forEach(function (id) {
        var field = document.getElementById(id);
        if (!field) return;
        field.addEventListener('input', function () { field.setCustomValidity(''); });
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (inFlight) return;
        if (!form.reportValidity()) return;

        var invalidField = null;
        ['name', 'company', 'email', 'message'].some(function (id) {
            var field = document.getElementById(id);
            if (!field || field.value.trim()) return false;
            field.setCustomValidity('공백을 제외한 내용을 입력해주세요.');
            invalidField = field;
            return true;
        });
        if (invalidField) {
            invalidField.reportValidity();
            return;
        }

        var honeypot = document.getElementById('contact-website');
        if (honeypot && honeypot.value) {
            showMessage('자동 입력이 감지되어 전송하지 않았습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.', 'error', false);
            return;
        }

        var inquiryId = createInquiryId();
        var emailHref = buildFallbackEmailHref(inquiryId);
        if (!emailClientReady || !window.emailjs || typeof window.emailjs.send !== 'function') {
            showMessage('자동 문의 전송 서비스를 불러오지 못했습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref);
            return;
        }

        inFlight = true;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '전송 중입니다...';
        }
        form.setAttribute('aria-busy', 'true');
        message.hidden = true;

        var submittedAt = new Date().toISOString();
        var templateParams = {
            from_name: getValue('name'),
            from_email: getValue('email'),
            phone: getValue('phone') || '미입력',
            company: getValue('company'),
            participants: getValue('participants') || '미정',
            schedule: getValue('schedule') || '미정',
            message: '[접수번호 ' + inquiryId + ']\n' + getValue('message'),
            inquiry_id: inquiryId,
            consent_at: submittedAt,
            collection_consent: collectionConsent && collectionConsent.checked ? '동의' : '미동의',
            collection_consent_at: submittedAt,
            overseas_transfer_consent: overseasConsent && overseasConsent.checked ? '동의' : '미동의',
            overseas_transfer_consent_at: submittedAt,
            policy_version: '2026-07-12',
            source_url: window.location.origin + window.location.pathname
        };

        var slowNoticeId = window.setTimeout(function () {
            showMessage('전송 확인이 지연되고 있습니다. 중복 접수를 피하기 위해 잠시만 기다려주세요.', 'notice', false);
        }, 15000);
        var sendRequest = Promise.resolve().then(function () {
            return window.emailjs.send('service_88wyxr7', 'template_10s18ru', templateParams);
        });

        sendRequest
            .then(function () {
                form.reset();
                showMessage('문의가 접수되었습니다. 접수번호 ' + inquiryId + ' · 영업일 1일 이내에 회신드리겠습니다.', 'success', false);
            })
            .catch(function (error) {
                if (error && Number(error.status) === 412) {
                    showMessage('문의 전송 서비스 연결이 만료되었습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref);
                    return;
                }
                if (error && Number(error.status) === 429) {
                    showMessage('요청이 잠시 많아 자동 접수하지 못했습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref);
                    return;
                }
                showMessage('문의 전송에 실패했습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref);
            })
            .finally(function () {
                window.clearTimeout(slowNoticeId);
                form.removeAttribute('aria-busy');
                inFlight = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalLabel;
                }
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
