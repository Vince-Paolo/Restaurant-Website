/* =============================================================
   CONTACT.JS  —  contact.html
   Form validation & submission
   Depends on: main.js (showToast, validateField), auth-gate.js
   ============================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    // ── Auth gate on submit only (contact form is viewable) ──
    // Inline validation works for guests; gate fires at submit.

    // ── Inline validation on blur ────────────────────────────
    contactForm.querySelectorAll('[required]').forEach(f =>
        f.addEventListener('blur', () => validateField(f))
    );

    // ── Form submission ──────────────────────────────────────
    contactForm.addEventListener('submit', async e => {
        e.preventDefault();

        // Validate fields first so guest sees errors, then gate
        let valid = true;
        contactForm.querySelectorAll('[required]').forEach(f => {
            if (!validateField(f)) valid = false;
        });
        if (!valid) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        // Auth gate — fires after validation so errors show first
        const allowed = await requireAuth('contact');
        if (!allowed) return;

        contactForm.reset();
        showToast("Message sent! We'll get back to you shortly.", 'success');
    });

});
