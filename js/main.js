document.documentElement.classList.add('js');

function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function focusWithoutScrolling(element) {
    if (!element || typeof element.focus !== 'function') return;
    try {
        element.focus({ preventScroll: true });
    } catch (error) {
        element.focus();
    }
}

function focusAnchorTarget(target) {
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    focusWithoutScrolling(target);
}

document.addEventListener('DOMContentLoaded', function () {
    var header = document.getElementById('header');
    var menuButton = document.querySelector('.menu-button');
    var navLinks = document.getElementById('primary-navigation');
    var mainContent = document.getElementById('main-content');
    var footer = document.querySelector('.site-footer');
    var reduceMotion = prefersReducedMotion();

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
                if (menuButton.getAttribute('aria-expanded') !== 'true') return;
                var firstLink = navLinks.querySelector('a');
                if (firstLink) firstLink.focus();
            }, reduceMotion ? 0 : 240);
        }
    }

    if (menuButton && navLinks) {
        menuButton.addEventListener('click', function () {
            setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
        });
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                var wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
                setMenu(false);
                if (wasOpen && link.getAttribute('href').charAt(0) !== '#') {
                    focusWithoutScrolling(menuButton);
                }
            });
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
        link.addEventListener('click', function () {
            var targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;
            var target = document.getElementById(targetId.slice(1));
            if (!target) return;
            if (menuButton && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
            window.setTimeout(function () { focusAnchorTarget(target); }, 0);
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
    var inFlight = false;
    var emailClientReady = false;
    var emailClientFailed = false;
    var emailClientWaiters = [];
    var emailScript = document.getElementById('emailjs-sdk');
    var publicKey = 'URK5IT-ga48mugcnf';
    var hubReferenceNote = document.getElementById('hub-reference-note');

    applyHubInquiryPrefill(form, hubReferenceNote);

    function settleEmailClientWaiters(ready) {
        var waiters = emailClientWaiters.slice();
        emailClientWaiters.length = 0;
        waiters.forEach(function (resolve) { resolve(ready); });
    }

    function initializeEmailClient() {
        if (emailClientReady) return true;
        if (!window.emailjs || typeof window.emailjs.init !== 'function') return false;
        try {
            window.emailjs.init({
                publicKey: publicKey,
                blockHeadless: true,
                limitRate: { id: 'dinoflow-contact', throttle: 10000 }
            });
            emailClientReady = true;
            settleEmailClientWaiters(true);
            return true;
        } catch (error) {
            emailClientFailed = true;
            emailClientReady = false;
            settleEmailClientWaiters(false);
            return false;
        }
    }

    function waitForEmailClient(timeoutMs) {
        if (initializeEmailClient()) return Promise.resolve(true);
        if (emailClientFailed) return Promise.resolve(false);
        return new Promise(function (resolve) {
            var settled = false;
            var timeoutId = window.setTimeout(function () {
                if (settled) return;
                settled = true;
                resolve(false);
            }, timeoutMs);
            emailClientWaiters.push(function (ready) {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeoutId);
                resolve(ready);
            });
        });
    }

    if (emailScript) {
        emailScript.addEventListener('load', function () {
            if (initializeEmailClient()) return;
            emailClientFailed = true;
            settleEmailClientWaiters(false);
        });
        emailScript.addEventListener('error', function () {
            emailClientFailed = true;
            settleEmailClientWaiters(false);
        });
    }
    initializeEmailClient();

    function showMessage(text, type, includeAlternatives, emailHref, moveFocus) {
        message.hidden = false;
        message.className = 'form-message ' + type;
        message.textContent = text;
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
        if (!moveFocus) return;
        window.setTimeout(function () {
            focusWithoutScrolling(message);
            message.scrollIntoView({
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                block: 'nearest'
            });
        }, 80);
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
            showMessage('자동 입력이 감지되어 전송하지 않았습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.', 'error', false, null, true);
            return;
        }

        var inquiryId = createInquiryId();
        var emailHref = buildFallbackEmailHref(inquiryId);

        inFlight = true;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '전송 준비 중입니다...';
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
            overseas_transfer_consent: '방침 고지 (별도 동의 불요)',
            overseas_transfer_consent_at: submittedAt,
            policy_version: '2026-07-15',
            source_url: window.location.origin + window.location.pathname
        };

        var slowNoticeId = 0;
        var sendRequest = waitForEmailClient(6000).then(function (ready) {
            if (!ready || !window.emailjs || typeof window.emailjs.send !== 'function') {
                var unavailableError = new Error('Email client unavailable');
                unavailableError.code = 'EMAIL_CLIENT_UNAVAILABLE';
                throw unavailableError;
            }
            if (submitButton) submitButton.textContent = '전송 중입니다...';
            slowNoticeId = window.setTimeout(function () {
                showMessage('전송 확인이 지연되고 있습니다. 중복 접수를 피하기 위해 잠시만 기다려주세요.', 'notice', false, null, false);
            }, 15000);
            return window.emailjs.send('service_88wyxr7', 'template_10s18ru', templateParams);
        });

        function finishSubmission() {
            window.clearTimeout(slowNoticeId);
            form.removeAttribute('aria-busy');
            inFlight = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalLabel;
            }
        }

        sendRequest
            .then(function () {
                form.reset();
                if (hubReferenceNote) {
                    hubReferenceNote.textContent = '';
                    hubReferenceNote.hidden = true;
                }
                showMessage('문의가 접수되었습니다. 접수번호 ' + inquiryId + ' · 영업일 1일 이내에 회신드리겠습니다.', 'success', false, null, true);
            })
            .catch(function (error) {
                if (error && error.code === 'EMAIL_CLIENT_UNAVAILABLE') {
                    showMessage('자동 문의 전송 서비스를 불러오지 못했습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref, true);
                    return;
                }
                if (error && Number(error.status) === 412) {
                    showMessage('문의 전송 서비스 연결이 만료되었습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref, true);
                    return;
                }
                if (error && Number(error.status) === 429) {
                    showMessage('요청이 잠시 많아 자동 접수하지 못했습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref, true);
                    return;
                }
                showMessage('문의 전송에 실패했습니다. 입력 내용은 유지했습니다.', 'error', true, emailHref, true);
            })
            .then(finishSubmission, finishSubmission);
    });

    if (submitButton) submitButton.type = 'submit';
    form.classList.add('is-ready');
}

function applyHubInquiryPrefill(form, referenceNote) {
    var handoff = getHubInquiryParams();
    if (!handoff || handoff.redirected) return false;
    var params = handoff.params;
    if (params.get('from') !== 'hub') return false;

    var topic = cleanHubReference(params.get('topic'), 120);
    var audience = cleanHubReference(params.get('audience'), 60);
    var category = cleanHubReference(params.get('category'), 30);
    var allowedCategories = [
        'AI리터러시',
        'AI비서',
        '바이브코딩',
        '직무특화',
        '리더십',
        '기타'
    ];
    if (allowedCategories.indexOf(category) === -1) category = '';

    var messageField = form.querySelector('#message');
    if (referenceNote) referenceNote.hidden = true;

    try {
        window.history.replaceState(window.history.state, '', window.location.pathname + '#contact');
    } catch (error) {
        /* 주소 정리가 불가능한 환경에서도 입력 내용은 유지한다. */
    }

    if (!topic && !audience && !category) return false;
    if (!messageField || messageField.value.trim()) return false;

    var lines = ['[Hub에서 참고한 교육]'];
    if (topic) lines.push('교육 내용: ' + topic);
    if (audience) lines.push('교육 대상: ' + audience);
    if (category) {
        lines.push('교육 분야: ' + (category === 'AI리터러시' ? 'AI 리터러시' : category));
    }
    lines.push('', '우리 조직에서 원하는 내용:', '');
    messageField.value = lines.join('\n');
    messageField.setCustomValidity('');

    if (referenceNote) {
        referenceNote.textContent = 'Hub에서 선택한 교육을 불러왔습니다. 원하는 일정과 조건을 덧붙여주세요.';
        referenceNote.hidden = false;
    }

    return true;
}

function getHubInquiryParams() {
    var legacyPrefix = '#contact?';
    if (window.location.hash.indexOf(legacyPrefix) === 0) {
        try {
            var legacyParams = new URLSearchParams(window.location.hash.slice(legacyPrefix.length));
            if (legacyParams.get('from') !== 'hub') return null;
            var safeParams = new URLSearchParams({ from: 'hub' });
            ['topic', 'audience', 'category'].forEach(function (key) {
                var value = legacyParams.get(key);
                if (value) safeParams.set(key, value);
            });
            window.location.replace(window.location.pathname + '?' + safeParams.toString() + '#contact');
            return { redirected: true };
        } catch (error) {
            return null;
        }
    }

    if (window.location.hash !== '#contact' || !window.location.search) return null;
    try {
        return { params: new URLSearchParams(window.location.search) };
    } catch (error) {
        return null;
    }
}

function cleanHubReference(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value
        .replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function loadTrackRecord() {
    setTrackRecordState('loading');
    if (!('fetch' in window)) {
        setTrackRecordState('fallback');
        return Promise.resolve(false);
    }
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timeout = window.setTimeout(function () {
        if (controller) controller.abort();
    }, 5000);

    return fetch('https://hub.dinoflow.kr/api/summary.json', {
        mode: 'cors',
        signal: controller ? controller.signal : undefined
    })
        .then(function (response) {
            if (!response.ok) throw new Error('summary unavailable');
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.totals) throw new Error('invalid summary');
            setStat('sessions', floorPlus(data.totals.sessions, '회'));
            setStat('hours', floorPlus(data.totals.hours, '시간'));
            setStat('students', floorPlus(data.totals.attendees, '명'));
            setStat('partners', floorPlus(data.totals.partner_organizations_min, '개'));
            var partnerMetric = data.totals.partner_organizations;
            var partnerScope = document.getElementById('partner-scope');
            if (partnerScope && partnerMetric && partnerMetric.as_of && partnerMetric.note) {
                partnerScope.textContent = (partnerMetric.source || 'DinoFlow 운영 기록') + ', ' +
                    partnerMetric.as_of + ' 기준. ' + partnerMetric.note;
            }
            var hasRecentLectures = renderRecentLectures(data.recent);
            setTrackRecordState(hasRecentLectures ? 'connected' : 'fallback');
            var footer = document.getElementById('recent-footer-link');
            if (footer && data.upcoming && Number(data.upcoming.count) > 0) {
                footer.firstChild.textContent = '예정 강의 ' + data.upcoming.count + '건 · 전체 기록 확인 ';
            }
            return hasRecentLectures;
        })
        .catch(function () {
            setTrackRecordState('fallback');
            return false;
        })
        .finally(function () { window.clearTimeout(timeout); });
}

function setTrackRecordState(state) {
    var status = document.getElementById('recent-status');
    if (!status) return;
    var labels = {
        loading: '확인 중',
        connected: 'Hub 연동',
        fallback: '비실시간'
    };
    status.dataset.state = labels[state] ? state : 'fallback';
    status.textContent = labels[state] || labels.fallback;
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
    if (!list || !Array.isArray(recent) || recent.length === 0) return false;
    var validLectures = recent.filter(function (lecture) {
        return lecture && typeof lecture === 'object' &&
            typeof lecture.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lecture.date);
    }).slice(0, 3);
    if (validLectures.length === 0) return false;

    var items = validLectures.map(function (lecture) {
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
        return item;
    });
    list.replaceChildren.apply(list, items);
    return true;
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
