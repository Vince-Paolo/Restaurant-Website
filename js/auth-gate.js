/* =============================================================
   AUTH-GATE.JS  —  Reusable sign-in/register prompt modal
   Shows whenever a guest tries to: order food, book a table,
   or send a contact message.

   Usage (called from menu.js / reservation.js / contact.js):
     const allowed = await requireAuth('order');
     if (!allowed) return;   // user dismissed — bail out

   The modal injects itself once into the DOM on first call.
   ============================================================= */

(function () {

    /* ----------------------------------------------------------
       1. Session cache — one fetch per page load
    ---------------------------------------------------------- */
    let _authStatus = null;   // null = not checked yet, true/false = result

    async function isLoggedIn() {
        if (_authStatus !== null) return _authStatus;
        try {
            const res  = await fetch('php/customer_auth_check.php');
            const data = await res.json();
            _authStatus = !!data.success;
        } catch {
            _authStatus = false;
        }
        return _authStatus;
    }

    // Call after successful login/register so next action skips the modal
    window._refreshAuthCache = () => { _authStatus = null; };

    /* ----------------------------------------------------------
       2. Modal HTML & CSS — injected once
    ---------------------------------------------------------- */
    const MODAL_ID = 'auth-gate-modal';

    const CONTEXT_COPY = {
        order:       { verb: 'place an order',       icon: '🍽️' },
        reservation: { verb: 'book a table',          icon: '📅' },
        contact:     { verb: 'send us a message',     icon: '✉️'  },
    };

    function ensureModal() {
        if (document.getElementById(MODAL_ID)) return;

        // --- Styles ---
        const style = document.createElement('style');
        style.textContent = `
            #auth-gate-modal {
                position: fixed; inset: 0; z-index: 9000;
                display: flex; align-items: center; justify-content: center;
                padding: 1rem;
                background: rgba(26,20,16,0.55);
                backdrop-filter: blur(4px);
                opacity: 0; pointer-events: none;
                transition: opacity 0.25s ease;
            }
            #auth-gate-modal.open {
                opacity: 1; pointer-events: all;
            }
            #auth-gate-box {
                background: var(--card-bg);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-hover);
                padding: 2.5rem 2rem 2rem;
                width: 100%; max-width: 400px;
                text-align: center;
                transform: translateY(18px) scale(0.97);
                transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
            }
            #auth-gate-modal.open #auth-gate-box {
                transform: translateY(0) scale(1);
            }
            #auth-gate-icon {
                font-size: 2.4rem;
                margin-bottom: 0.75rem;
                display: block;
            }
            #auth-gate-title {
                font-family: var(--font-display);
                font-size: 1.6rem;
                color: var(--ink);
                margin-bottom: 0.4rem;
            }
            #auth-gate-subtitle {
                font-size: 0.9rem;
                color: var(--warm-mid);
                line-height: 1.55;
                margin-bottom: 1.75rem;
            }
            .auth-gate-btns {
                display: flex;
                flex-direction: column;
                gap: 0.65rem;
            }
            .auth-gate-btn-primary {
                display: block;
                padding: 0.8rem 1rem;
                background: var(--ember);
                color: #fff;
                border-radius: var(--radius-sm);
                font-size: 0.95rem;
                font-weight: 600;
                text-decoration: none;
                transition: opacity 0.2s;
                border: none; cursor: pointer; font-family: var(--font-body);
                width: 100%;
            }
            .auth-gate-btn-primary:hover { opacity: 0.88; }
            .auth-gate-btn-secondary {
                display: block;
                padding: 0.8rem 1rem;
                background: none;
                border: 1.5px solid var(--border);
                color: var(--ink);
                border-radius: var(--radius-sm);
                font-size: 0.95rem;
                font-weight: 500;
                text-decoration: none;
                transition: background 0.2s, border-color 0.2s;
                cursor: pointer; font-family: var(--font-body);
                width: 100%;
            }
            .auth-gate-btn-secondary:hover {
                background: var(--border);
            }
            .auth-gate-divider {
                position: relative;
                text-align: center;
                font-size: 0.78rem;
                color: var(--warm-mid);
                margin: 0.25rem 0;
            }
            .auth-gate-dismiss {
                margin-top: 1.25rem;
                font-size: 0.8rem;
                color: var(--warm-mid);
                background: none;
                border: none;
                cursor: pointer;
                font-family: var(--font-body);
                text-decoration: underline;
                text-underline-offset: 3px;
            }
            .auth-gate-dismiss:hover { color: var(--ink); }
        `;
        document.head.appendChild(style);

        // --- Markup ---
        const overlay = document.createElement('div');
        overlay.id = MODAL_ID;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'auth-gate-title');
        overlay.innerHTML = `
            <div id="auth-gate-box">
                <span id="auth-gate-icon">🔒</span>
                <h2 id="auth-gate-title">Sign in required</h2>
                <p id="auth-gate-subtitle">
                    You need an account to <span id="auth-gate-action">continue</span>.<br>
                    It only takes a moment to create one.
                </p>
                <div class="auth-gate-btns">
                    <a href="account-login.html" class="auth-gate-btn-primary" id="auth-gate-login">
                        Sign In
                    </a>
                    <span class="auth-gate-divider">or</span>
                    <a href="register.html" class="auth-gate-btn-secondary" id="auth-gate-register">
                        Create a Free Account
                    </a>
                </div>
                <button class="auth-gate-dismiss" id="auth-gate-dismiss">
                    Maybe later
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close on overlay backdrop click
        overlay.addEventListener('click', e => {
            if (e.target === overlay) _resolveGate(false);
        });
        // Close on Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) _resolveGate(false);
        });
        // Dismiss button
        document.getElementById('auth-gate-dismiss')
            .addEventListener('click', () => _resolveGate(false));
    }

    /* ----------------------------------------------------------
       3. Promise-based gate — resolves true (allowed) or false
    ---------------------------------------------------------- */
    let _currentResolve = null;

    function _resolveGate(allowed) {
        const overlay = document.getElementById(MODAL_ID);
        overlay?.classList.remove('open');
        document.body.style.overflow = '';
        if (_currentResolve) {
            _currentResolve(allowed);
            _currentResolve = null;
        }
    }

    function _showGate(context) {
        ensureModal();
        const ctx = CONTEXT_COPY[context] || CONTEXT_COPY.order;

        document.getElementById('auth-gate-icon').textContent   = ctx.icon;
        document.getElementById('auth-gate-action').textContent = ctx.verb;

        // Store redirect intent so login page can come back here
        const returnUrl = window.location.pathname.split('/').pop() || 'index.html';
        const loginHref = `account-login.html?return=${encodeURIComponent(returnUrl)}`;
        const regHref   = `register.html?return=${encodeURIComponent(returnUrl)}`;
        document.getElementById('auth-gate-login').href    = loginHref;
        document.getElementById('auth-gate-register').href = regHref;

        document.getElementById(MODAL_ID).classList.add('open');
        document.body.style.overflow = 'hidden';

        // Focus the primary button for keyboard users
        setTimeout(() => document.getElementById('auth-gate-login')?.focus(), 50);

        return new Promise(resolve => { _currentResolve = resolve; });
    }

    /* ----------------------------------------------------------
       4. Public API
       const allowed = await requireAuth('order');
    ---------------------------------------------------------- */
    window.requireAuth = async function (context = 'order') {
        const loggedIn = await isLoggedIn();
        if (loggedIn) return true;
        return _showGate(context);
    };

})();
