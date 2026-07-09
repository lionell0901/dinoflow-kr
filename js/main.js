/**
 * AI Instructor Portfolio - Main JavaScript
 * Author: Dino
 * Description: Interactive functionality for portfolio website
 */

// JS 로드 표시 — 스크롤 리빌(.fade-in)은 .js가 있을 때만 숨김 시작 (no-JS 폴백)
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
    // --- Mobile Menu Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
            const expanded = navLinks.classList.contains('active');
            hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            hamburger.setAttribute('aria-label', expanded ? '메뉴 닫기' : '메뉴 열기');
        });

        document.querySelectorAll('.nav-links a').forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.setAttribute('aria-label', '메뉴 열기');
            });
        });
    }

    // --- Header Scroll Effect ---
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- Tab Functionality ---
    const tabsContainer = document.querySelector('.tabs');
    if (tabsContainer) {
        const tabBtns = tabsContainer.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabsContainer.addEventListener('click', function (e) {
            const clickedBtn = e.target.closest('.tab-btn');
            if (!clickedBtn) return;

            const tabId = clickedBtn.dataset.tab;

            tabBtns.forEach(function (btn) {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(function (content) {
                content.classList.remove('active');
                content.setAttribute('hidden', '');
            });

            clickedBtn.classList.add('active');
            clickedBtn.setAttribute('aria-selected', 'true');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.removeAttribute('hidden');
                setTimeout(() => targetContent.classList.add('active'), 50);
            }
        });
    }

    // --- Scroll Animations (IntersectionObserver) ---
    const animatedElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(function (el) {
        observer.observe(el);
    });

    // --- Active Nav Link on Scroll ---
    const sections = document.querySelectorAll('section[id]');
    const navLinksArray = document.querySelectorAll('nav .nav-links a[href^="#"]');

    let ticking = false;
    function updateActiveNavLink() {
        let currentSectionId = '';
        const scrollY = window.pageYOffset;

        sections.forEach(function (section) {
            const sectionTop = section.offsetTop - 100;
            if (scrollY >= sectionTop) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinksArray.forEach(function (link) {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
            if (link.getAttribute('href') === '#' + currentSectionId) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(updateActiveNavLink);
            ticking = true;
        }
    });

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Initial animation trigger for Hero section ---
    document.querySelectorAll('#hero .fade-in').forEach(function (el) {
        el.classList.add('is-visible');
    });

    // --- Program Card Modal ---
    const programCards = document.querySelectorAll('.program-card');
    const programModal = document.getElementById('program-modal');
    const modalBodies = document.querySelectorAll('.modal-body');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');

    // Open modal function
    function openProgramModal(programId) {
        if (!programModal) return;

        // Hide all modal bodies first
        modalBodies.forEach(body => body.classList.remove('active'));

        // Show the selected modal body
        const targetBody = document.querySelector(`.modal-body[data-modal="${programId}"]`);
        if (targetBody) {
            targetBody.classList.add('active');
        }

        // Show modal
        programModal.classList.add('active');
        programModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus trap - focus on close button
        if (modalClose) {
            setTimeout(() => modalClose.focus(), 100);
        }
    }

    // Close modal function
    function closeProgramModal() {
        if (!programModal) return;

        programModal.classList.remove('active');
        programModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Return focus to the card that opened the modal
        const activeCard = document.querySelector('.program-card:focus');
        if (activeCard) activeCard.focus();
    }

    // Card click handlers
    if (programCards.length > 0) {
        programCards.forEach(card => {
            // Click handler
            card.addEventListener('click', () => {
                const programId = card.dataset.program;
                openProgramModal(programId);
            });

            // Keyboard handler (Enter/Space)
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const programId = card.dataset.program;
                    openProgramModal(programId);
                }
            });
        });
    }

    // Close modal handlers
    if (modalClose) {
        modalClose.addEventListener('click', closeProgramModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeProgramModal);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && programModal && programModal.classList.contains('active')) {
            closeProgramModal();
        }
    });

    // Close modal when clicking CTA link (scroll to contact)
    document.querySelectorAll('.modal-cta').forEach(cta => {
        cta.addEventListener('click', () => {
            closeProgramModal();
        });
    });

    // --- EmailJS Contact Form ---
    // Initialize EmailJS with your Public Key
    (function () {
        emailjs.init("URK5IT-ga48mugcnf");
        console.log("EmailJS initialized successfully");
    })();

    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log("Form submitted");

            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;

            // Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 전송 중...';

            // Get form data
            const templateParams = {
                from_name: document.getElementById('name').value,
                from_email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                company: document.getElementById('company').value,
                participants: document.getElementById('participants').value,
                schedule: document.getElementById('schedule').value,
                message: document.getElementById('message').value
            };

            console.log("Template params:", templateParams);

            // Send email using EmailJS
            emailjs.send('service_86ytxlb', 'template_10s18ru', templateParams)
                .then(function (response) {
                    console.log('SUCCESS!', response.status, response.text);

                    // Show success message
                    formMessage.style.display = 'block';
                    formMessage.className = 'form-message success';
                    formMessage.innerHTML = '<i class="fa-solid fa-circle-check"></i> 문의가 성공적으로 전송되었습니다! 빠른 시간 내에 답변드리겠습니다.';

                    // Reset form
                    contactForm.reset();

                    // Re-enable button
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;

                    // Scroll to message
                    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    // Hide message after 6 seconds
                    setTimeout(function () {
                        formMessage.style.display = 'none';
                    }, 6000);

                }, function (error) {
                    console.error('EmailJS Error:', error);

                    // Show error message
                    formMessage.style.display = 'block';
                    formMessage.className = 'form-message error';
                    formMessage.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

                    // Re-enable button
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;

                    // Scroll to message
                    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    // Hide message after 8 seconds
                    setTimeout(function () {
                        formMessage.style.display = 'none';
                    }, 8000);
                });
        });
    }
});

// ============================================
// Hub Live Track Record
// hub.dinoflow.kr/api/summary.json 을 읽어
// 실적 카운터·최근 강의·예정 뱃지를 갱신한다.
// fetch 실패 시 HTML에 하드코딩된 값이 그대로 남는다 (graceful fallback).
// ============================================
(function () {
    if (!('fetch' in window)) return;

    var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    var SUMMARY_URL = isLocal ? './summary.json' : 'https://hub.dinoflow.kr/api/summary.json';
    var HUB_LECTURES_URL = 'https://hub.dinoflow.kr/lectures';
    var RECENT_DISPLAY_LIMIT = 3;

    fetch(SUMMARY_URL, { mode: 'cors' })
        .then(function (res) {
            if (!res.ok) throw new Error('summary fetch failed: ' + res.status);
            return res.json();
        })
        .then(applySummary)
        .catch(function () { /* 정적 폴백 유지 */ });

    function applySummary(data) {
        if (!data || !data.totals) return;
        var totals = data.totals;

        // 1) 실적 카운터 (내림 처리로 "이상(+)" 의미 유지)
        if (isPositive(totals.hours)) {
            setStat('hours', Math.floor(totals.hours).toLocaleString('ko-KR') + '+');
        }
        if (isPositive(totals.attendees)) {
            setStat('students', totals.attendees.toLocaleString('ko-KR') + '+');
        }

        // 2) 최근 진행 강의 스트립
        renderRecent(data.recent);

        // 3) 스트립 푸터 링크: 예정 강의 수 + 전체 기록 수
        var footerLink = document.getElementById('recent-footer-link');
        if (footerLink) {
            var parts = [];
            if (data.upcoming && isPositive(data.upcoming.count)) {
                parts.push('다가오는 강의 ' + data.upcoming.count + '건 예정');
            }
            if (isPositive(totals.sessions)) {
                parts.push('전체 ' + totals.sessions.toLocaleString('ko-KR') + '회 기록 보기 ↗');
            }
            if (parts.length) {
                footerLink.textContent = parts.join(' · ');
            }
        }
    }

    function isPositive(n) {
        return typeof n === 'number' && n > 0;
    }

    function setStat(key, text) {
        document.querySelectorAll('[data-stat="' + key + '"]').forEach(function (el) {
            el.textContent = text;
        });
    }

    function renderRecent(recent) {
        if (!Array.isArray(recent) || recent.length === 0) return;
        var wrap = document.getElementById('recent-lectures');
        var list = document.getElementById('recent-list');
        if (!wrap || !list) return;

        recent.slice(0, RECENT_DISPLAY_LIMIT).forEach(function (lec) {
            var li = document.createElement('li');
            li.className = 'recent-item';

            var a = document.createElement('a');
            a.href = HUB_LECTURES_URL;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.appendChild(span('recent-date', formatDate(lec.date)));
            a.appendChild(span('recent-client', lec.client || ''));
            a.appendChild(span('recent-program', lec.program || ''));
            a.appendChild(span('recent-meta', metaText(lec)));

            li.appendChild(a);
            list.appendChild(li);
        });

        wrap.hidden = false;
    }

    function span(cls, text) {
        var el = document.createElement('span');
        el.className = cls;
        el.textContent = text;
        return el;
    }

    function metaText(lec) {
        var parts = [];
        if (lec.industry) parts.push(lec.industry);
        if (isPositive(lec.hours)) parts.push(lec.hours + '시간');
        return parts.join(' · ');
    }

    function formatDate(iso) {
        if (!iso || iso.length < 10) return iso || '';
        return iso.slice(2, 10).replace(/-/g, '.');
    }
})();
