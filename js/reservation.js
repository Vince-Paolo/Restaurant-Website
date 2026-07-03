/* =============================================================
   RESERVATION.JS  —  reservation.html
   Connects form to php/reservation.php
   Depends on: main.js (showToast, validateField), auth-gate.js
   ============================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    const resForm   = document.getElementById('reservation-form');
    const dateInput = document.getElementById('res-date');
    const timeInput = document.getElementById('res-time');
    if (!resForm || !dateInput) return;

    // ── Auth gate — runs immediately on page load ────────────
    // If guest, show modal right away so they don't fill the
    // whole form only to be blocked at submit.
    const allowed = await requireAuth('reservation');
    if (!allowed) {
        // Blur/disable the form visually to signal it's locked
        resForm.style.opacity       = '0.4';
        resForm.style.pointerEvents = 'none';
        resForm.setAttribute('aria-disabled', 'true');

        // Show a persistent inline hint below the form
        let hint = document.getElementById('res-auth-hint');
        if (!hint) {
            hint = document.createElement('p');
            hint.id        = 'res-auth-hint';
            hint.innerHTML = `<a href="account-login.html" style="color:var(--ember);font-weight:600">Sign in</a>
                              or <a href="register.html" style="color:var(--ember);font-weight:600">create an account</a>
                              to book a table.`;
            hint.style.cssText = 'text-align:center;margin-top:1rem;font-size:0.9rem;color:var(--warm-mid)';
            resForm.after(hint);
        }
        return; // stop setting up the rest of the form logic
    }

    // ── Minimum date = today ─────────────────────────────────
    const now      = new Date();
    const yyyy     = now.getFullYear();
    const mm       = String(now.getMonth() + 1).padStart(2, '0');
    const dd       = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    dateInput.setAttribute('min', todayStr);

    // ── Restrict time range based on selected date ───────────
    dateInput.addEventListener('change', e => {
        if (e.target.value === todayStr) {
            const hh = String(now.getHours()).padStart(2, '0');
            const mi = String(now.getMinutes()).padStart(2, '0');
            timeInput.setAttribute('min', `${hh}:${mi}`);
        } else {
            timeInput.setAttribute('min', '11:00');
        }
        timeInput.setAttribute('max', '22:00');
    });

    // ── Inline per-field validation on blur ──────────────────
    resForm.querySelectorAll('[required]').forEach(f =>
        f.addEventListener('blur', () => validateField(f))
    );

    // ── Form submission ──────────────────────────────────────
    resForm.addEventListener('submit', async e => {
        e.preventDefault();

        // Double-check auth at submit time (session may have expired)
        const stillAllowed = await requireAuth('reservation');
        if (!stillAllowed) return;

        let valid = true;
        resForm.querySelectorAll('[required]').forEach(f => {
            if (!validateField(f)) valid = false;
        });
        if (!valid) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        const fd = new FormData();
        fd.append('name',     document.getElementById('res-name').value.trim());
        fd.append('email',    document.getElementById('res-email').value.trim());
        fd.append('date',     dateInput.value);
        fd.append('time',     timeInput.value);
        fd.append('guests',   document.getElementById('res-party').value);
        fd.append('requests', document.getElementById('res-requests')?.value.trim() ?? '');

        // Add CSRF token if present
        const csrfEl = resForm.querySelector('input[name="csrf_token"]');
        if (csrfEl) fd.append('csrf_token', csrfEl.value);

        const btn = resForm.querySelector('.btn-submit');
        btn.disabled    = true;
        btn.textContent = 'Submitting…';

        try {
            const res  = await fetch('php/reservation.php', { method: 'POST', body: fd });
            const data = await res.json();

            if (data.success) {
                resForm.style.display = 'none';
                const banner = document.getElementById('res-success');
                if (banner) {
                    banner.textContent = '✓ ' + data.message;
                    banner.classList.add('show');
                }
                showToast('Reservation confirmed! See you soon 🎉', 'success');
            } else {
                showToast(data.message || 'Something went wrong. Please try again.', 'error');
                btn.disabled    = false;
                btn.textContent = 'Confirm Reservation';
            }
        } catch {
            showToast('Network error. Please check your connection.', 'error');
            btn.disabled    = false;
            btn.textContent = 'Confirm Reservation';
        }
    });
});
