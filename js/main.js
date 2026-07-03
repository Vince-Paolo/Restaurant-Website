/* =============================================================
   MAIN.JS  —  Shared across all pages
   Scroll progress · Back-to-top · Dark mode · Hamburger nav
   Active nav link · Fade-in on scroll · Toast utility
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------
    // Scroll progress bar + nav compact on scroll
    // ---------------------------------------------------------
    const progressBar = document.getElementById('scroll-progress');
    const siteHeader  = document.getElementById('site-header');
    if (progressBar || siteHeader) {
        window.addEventListener('scroll', () => {
            const s = document.documentElement;
            if (progressBar) {
                const pct = (s.scrollTop / (s.scrollHeight - s.clientHeight)) * 100;
                progressBar.style.width = pct + '%';
            }
            if (siteHeader) {
                const scrolled = window.scrollY > 60;
                siteHeader.classList.toggle('scrolled', scrolled);
            }
        }, { passive: true });
    }

    // ---------------------------------------------------------
    // Back to top
    // ---------------------------------------------------------
    const btt = document.getElementById('back-to-top');
    if (btt) {
        window.addEventListener('scroll', () => {
            btt.classList.toggle('show', window.scrollY > 400);
        }, { passive: true });
        btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // ---------------------------------------------------------
    // Dark mode toggle (persisted via localStorage)
    // ---------------------------------------------------------
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        if (localStorage.getItem('es-theme') === 'dark') {
            document.body.classList.add('dark');
            themeBtn.textContent = '☀️';
        }
        themeBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            themeBtn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('es-theme', isDark ? 'dark' : 'light');
        });
    }

    // ---------------------------------------------------------
    // Hamburger / mobile nav
    // ---------------------------------------------------------
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (hamburger && mobileNav) {
        let navOpen = false;
        hamburger.addEventListener('click', () => {
            navOpen = !navOpen;
            mobileNav.classList.toggle('open', navOpen);
            hamburger.classList.toggle('open', navOpen);
            hamburger.setAttribute('aria-expanded', navOpen);
        });
        document.querySelectorAll('.mobile-link').forEach(l =>
            l.addEventListener('click', () => {
                navOpen = false;
                mobileNav.classList.remove('open');
                hamburger.setAttribute('aria-expanded', false);
            })
        );
    }

    // ---------------------------------------------------------
    // Active nav link: highlight by current page filename
    // ---------------------------------------------------------
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a, .mobile-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href === currentPage) link.classList.add('active');
    });

    // On index.html, also highlight nav links by scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');
    if (sections.length && navLinks.length) {
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    const active = document.querySelector(`nav a[href="#${e.target.id}"]`);
                    if (active) active.classList.add('active');
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(s => sectionObserver.observe(s));
    }

    // ---------------------------------------------------------
    // Fade-in on scroll — stagger siblings by DOM index
    // ---------------------------------------------------------
    const fadeEls = document.querySelectorAll('.fade-in');
    if (fadeEls.length) {
        const fadeObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    // Stagger cards within the same parent grid
                    const siblings = e.target.parentElement
                        ? [...e.target.parentElement.querySelectorAll(':scope > .fade-in')]
                        : [];
                    const idx = siblings.indexOf(e.target);
                    const stagger = idx >= 0 ? idx * 80 : 0;
                    setTimeout(() => {
                        e.target.classList.add('visible');
                    }, stagger);
                    fadeObs.unobserve(e.target);
                }
            });
        }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });
        fadeEls.forEach(el => fadeObs.observe(el));
    }

});

// ---------------------------------------------------------
// Toast notification — callable from any page script
// ---------------------------------------------------------
function showToast(msg, type = 'success') {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    // Icon prefix via aria-hidden span
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    icon.style.cssText = 'font-weight:700;margin-right:0.4rem;opacity:0.9';
    t.prepend(icon);
    // Message
    const txt = document.createElement('span');
    txt.textContent = msg;
    t.appendChild(txt);
    stack.appendChild(t);
    // Dismiss after 3.2s using .hide class for exit animation
    const dismiss = () => {
        t.classList.add('hide');
        setTimeout(() => t.remove(), 300);
    };
    const timer = setTimeout(dismiss, 3200);
    // Click to dismiss early
    t.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}

// ---------------------------------------------------------
// Form field validation — reused on reservation.js & contact.js
// ---------------------------------------------------------
function validateField(input) {
    const empty = !input.value.trim();
    const emailFail = input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    const invalid = empty || emailFail;
    input.classList.toggle('error', invalid);
    return !invalid;
}

// ---------------------------------------------------------
// Hero typing effect — cycles through taglines
// ---------------------------------------------------------
(function initTyping() {
    const el = document.getElementById('hero-type');
    if (!el) return;

    // Reserve height so the hero never reflows between lines
    el.style.minHeight = '1.8em';
    el.style.display   = 'block';

    const lines = [
        'Wood-fired cuisine, aged to perfection.',
        'Every plate tells a story.',
        'Where every detail is deliberate.',
        'Craft and warmth, since 2009.',
    ];

    const TYPE_SPEED        = 58;   // ms per character typed
    const DEL_SPEED         = 30;   // ms per character deleted
    const PAUSE_AFTER_TYPE  = 1800; // ms to hold a completed line
    const PAUSE_BEFORE_TYPE = 400;  // ms of blank gap before next line starts

    let lineIdx = 0;
    let charIdx = 0;
    let timer   = null;

    // Single schedule helper — always clears before setting
    function schedule(fn, delay) {
        clearTimeout(timer);
        timer = setTimeout(fn, delay);
    }

    function typeChar() {
        const line = lines[lineIdx];
        charIdx++;
        el.textContent = line.slice(0, charIdx);

        if (charIdx >= line.length) {
            // Line complete — hold, then start deleting
            schedule(deleteChar, PAUSE_AFTER_TYPE);
        } else {
            // Jitter: only ADD time (never subtract) so we never go too fast
            const jitter = Math.random() * 25;
            schedule(typeChar, TYPE_SPEED + jitter);
        }
    }

    function deleteChar() {
        const line = lines[lineIdx];
        charIdx--;
        el.textContent = line.slice(0, charIdx);

        if (charIdx <= 0) {
            // Fully deleted — clear element explicitly, advance line index,
            // then wait before starting to type the next line
            charIdx = 0;
            el.textContent = '';
            lineIdx = (lineIdx + 1) % lines.length;
            schedule(typeChar, PAUSE_BEFORE_TYPE);
        } else {
            schedule(deleteChar, DEL_SPEED);
        }
    }

    // Start after hero entrance animation settles
    schedule(typeChar, 1000);

    // Pause when tab is hidden; resume cleanly
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearTimeout(timer);
        } else {
            // Resume: if mid-type continue typing, if mid-delete continue deleting
            const resumeFn = charIdx < lines[lineIdx].length ? typeChar : deleteChar;
            schedule(resumeFn, TYPE_SPEED);
        }
    });
})();

// ---------------------------------------------------------
// Divider draw-in — triggered by fade-in observer
// ---------------------------------------------------------
document.querySelectorAll('.section-header').forEach(header => {
    const divider = header.querySelector('.divider');
    if (!divider) return;
    divider.style.width = '0';
    divider.style.transition = 'width 0.9s cubic-bezier(0.16,1,0.3,1)';
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                setTimeout(() => { divider.style.width = '48px'; }, 200);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.5 });
    obs.observe(header);
});


// ---------------------------------------------------------
// Page transition — fade out on navigation
// ---------------------------------------------------------
(function initPageTransitions() {
    // Only intercept internal same-origin links
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        // Skip anchors, external links, new-tab links, JS links
        if (!href || href.startsWith('#') || href.startsWith('http') ||
            href.startsWith('mailto') || link.target === '_blank') return;

        e.preventDefault();
        document.body.style.transition = 'opacity 0.22s ease';
        document.body.style.opacity    = '0';
        setTimeout(() => { window.location.href = href; }, 230);
    });
})();
