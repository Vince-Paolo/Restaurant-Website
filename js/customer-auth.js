/* =============================================================
   CUSTOMER-AUTH.JS  —  Shared across all customer-facing pages
   Handles:
   - Nav "Sign In / My Account" state update
   - CSRF token fetching utility
   - Account dropdown toggle
   ============================================================= */

// ---------------------------------------------------------
// Update nav to reflect customer session state
// Called on DOMContentLoaded from main.js via initCustomerNav()
// ---------------------------------------------------------
async function initCustomerNav() {
    const navActions  = document.querySelector('.nav-actions');
    const mobileNav   = document.getElementById('mobile-nav');
    if (!navActions) return;

    try {
        const res  = await fetch('php/customer_auth_check.php');
        const data = await res.json();

        if (data.success) {
            // Logged in — replace Sign In button with account pill
            const firstName = (data.data.name || '').split(' ')[0];

            // Desktop
            const existingBtn = navActions.querySelector('.btn-customer-login');
            if (existingBtn) existingBtn.remove();

            const accountEl = document.createElement('div');
            accountEl.className = 'nav-account-wrap';
            accountEl.innerHTML = `
                <button class="btn-account" id="account-toggle" aria-expanded="false">
                    <span class="account-avatar">${firstName.charAt(0).toUpperCase()}</span>
                    <span class="account-name">${firstName}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
                <div class="account-dropdown" id="account-dropdown">
                    <a href="account.html" class="dropdown-item">My Account</a>
                    <a href="reservation.html" class="dropdown-item">New Reservation</a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item dropdown-signout" id="signout-btn">Sign Out</button>
                </div>`;
            navActions.insertBefore(accountEl, navActions.querySelector('.btn-reserve'));

            // Mobile
            if (mobileNav) {
                const mobileLinks = document.createElement('div');
                mobileLinks.innerHTML = `
                    <a href="account.html"   class="mobile-link">My Account</a>
                    <button class="mobile-link mobile-signout" id="mobile-signout-btn">Sign Out</button>`;
                mobileNav.appendChild(mobileLinks);
            }

            // Dropdown toggle
            const toggle   = document.getElementById('account-toggle');
            const dropdown = document.getElementById('account-dropdown');
            toggle?.addEventListener('click', e => {
                e.stopPropagation();
                const open = dropdown.classList.toggle('open');
                toggle.setAttribute('aria-expanded', open);
            });
            document.addEventListener('click', () => {
                dropdown?.classList.remove('open');
                toggle?.setAttribute('aria-expanded', false);
            });

            // Sign-out handlers
            async function signOut() {
                try {
                    await fetch('php/customer_logout.php');
                } finally {
                    window.location.href = 'index.html';
                }
            }
            document.getElementById('signout-btn')?.addEventListener('click', signOut);
            document.getElementById('mobile-signout-btn')?.addEventListener('click', signOut);

        } else {
            // Not logged in — add Sign In button
            if (!navActions.querySelector('.btn-customer-login')) {
                const loginBtn = document.createElement('a');
                loginBtn.href      = 'account-login.html';
                loginBtn.className = 'btn-customer-login';
                loginBtn.textContent = 'Sign In';
                navActions.insertBefore(loginBtn, navActions.querySelector('.btn-reserve'));
            }
        }
    } catch {
        // Network error: silently skip — page still works as guest
    }
}

// ---------------------------------------------------------
// Fetch a one-time CSRF token for a given form context
// Usage: const token = await getCsrfToken('register');
// ---------------------------------------------------------
async function getCsrfToken(context) {
    try {
        // Handle subdirectory pages (admin/) with relative path
        const base = window.location.pathname.includes('/admin/') ? '../' : '';
        const res  = await fetch(`${base}php/csrf_token.php?context=${encodeURIComponent(context)}`);
        const data = await res.json();
        return data.success ? data.data.token : null;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------
// Inject CSRF token into a hidden input inside a form
// Usage: await injectCsrf(document.getElementById('my-form'), 'register');
// ---------------------------------------------------------
async function injectCsrf(formEl, context) {
    if (!formEl) return;
    const token = await getCsrfToken(context);
    if (!token) return;
    let hidden = formEl.querySelector('input[name="csrf_token"]');
    if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'csrf_token';
        formEl.appendChild(hidden);
    }
    hidden.value = token;
}

// Auto-run nav update when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomerNav);
} else {
    initCustomerNav();
}
