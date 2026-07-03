/* =============================================================
   MENU.JS  —  menu.html
   Loads items from php/menu.php, then applies filter/modal/fav
   Depends on: main.js (showToast), auth-gate.js (requireAuth)
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    // Image fallbacks per category
    const FALLBACKS = {
        pizza:   'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=75&auto=format',
        pasta:   'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=75&auto=format',
        steak:   'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&q=75&auto=format',
        dessert: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=75&auto=format',
        drinks:  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=75&auto=format',
        default: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75&auto=format',
    };

    // ── Load menu from backend ──────────────────────────────
    async function loadMenu() {
        grid.innerHTML = '<p style="text-align:center;color:var(--warm-mid);padding:3rem">Loading menu…</p>';

        try {
            const res  = await fetch('php/menu.php');
            const data = await res.json();

            if (!data.success || !data.data.length) {
                grid.innerHTML = '<p style="text-align:center;color:var(--warm-mid);padding:3rem">No menu items found.</p>';
                return;
            }

            grid.innerHTML = '';
            data.data.forEach(item => grid.appendChild(buildCard(item)));

            initFilter();
            initFavourites();
            updateFilterButtons([...new Set(data.data.map(i => i.category))]);

        } catch {
            grid.innerHTML = '<p style="text-align:center;color:var(--ember);padding:3rem">Could not load menu. Please refresh the page.</p>';
        }
    }

    // ── Build a single menu card DOM element ────────────────
    function buildCard(item) {
        const cat      = (item.category || 'default').toLowerCase();
        const imgSrc   = item.image_url || FALLBACKS[cat] || FALLBACKS.default;
        const modalImg = imgSrc.replace('w=400', 'w=600').replace('q=75', 'q=80');
        const price    = parseFloat(item.price).toFixed(2);

        const card = document.createElement('div');
        card.className        = 'menu-card';
        card.dataset.category = cat;
        card.setAttribute('role', 'listitem');

        card.innerHTML = `
            <div class="menu-card-img">
                <img src="${escHtml(imgSrc)}" alt="${escHtml(item.name)}" loading="lazy"
                     onerror="this.src='${FALLBACKS[cat] || FALLBACKS.default}'">
                <button class="fav-btn" aria-label="Add to favourites">♥</button>
            </div>
            <div class="menu-card-body">
                <h3>${escHtml(item.name)}</h3>
                <p>${escHtml(item.description || '')}</p>
                <span class="price">$${price}</span>
            </div>
            <div class="menu-card-actions">
                <button class="btn-order"
                        data-name="${escHtml(item.name)}"
                        data-desc="${escHtml(item.description || '')}"
                        data-price="$${price}"
                        data-img="${escHtml(modalImg)}">See Details</button>
            </div>
        `;

        // "See Details" — always allowed (just viewing)
        card.querySelector('.btn-order').addEventListener('click', function () {
            openModal(this.dataset.name, this.dataset.desc, this.dataset.price, this.dataset.img);
        });

        return card;
    }

    // ── Category filter — animate cards out then in ─────────
    function initFilter() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                const grid   = document.getElementById('menu-grid');

                document.querySelectorAll('.menu-card').forEach((card, i) => {
                    const show = filter === 'all' || card.dataset.category === filter;
                    if (show) {
                        card.classList.remove('hidden');
                        // Stagger re-entrance
                        card.style.transitionDelay = (i * 40) + 'ms';
                        requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
                    } else {
                        card.style.transitionDelay = '0ms';
                        card.style.opacity  = '0';
                        card.style.transform = 'translateY(8px) scale(0.97)';
                        // Use hidden after transition
                        const done = () => {
                            if (card.style.opacity === '0') card.classList.add('hidden');
                            card.removeEventListener('transitionend', done);
                        };
                        card.addEventListener('transitionend', done);
                    }
                });
            });
        });
    }

    function updateFilterButtons(categories) {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
            const f = btn.dataset.filter;
            if (f === 'all') return;
            btn.style.display = categories.includes(f) ? '' : 'none';
        });
    }

    // ── Favourites — heartbeat pop on activate ─────────────
    function initFavourites() {
        document.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const wasActive = btn.classList.contains('active');
                btn.classList.toggle('active');
                if (!wasActive) {
                    // Trigger heartbeat by re-adding the class
                    btn.classList.remove('active');
                    void btn.offsetWidth; // force reflow
                    btn.classList.add('active');
                }
                showToast(
                    !wasActive ? 'Added to favourites ♥' : 'Removed from favourites',
                    !wasActive ? 'success' : 'error'
                );
            });
        });
    }

    // ── Modal ───────────────────────────────────────────────
    const modal      = document.getElementById('food-modal');
    const modalClose = document.getElementById('modal-close');

    function closeModal() {
        modal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    window.openModal = function (title, desc, price, img) {
        document.getElementById('modal-img').src                = img;
        document.getElementById('modal-img').alt                = title;
        document.getElementById('modal-title-text').textContent = title;
        document.getElementById('modal-desc').textContent       = desc;
        document.getElementById('modal-price').textContent      = price;

        // ── AUTH GATE on "Add to Order" ──────────────────────
        document.getElementById('modal-order-btn').onclick = async () => {
            const allowed = await requireAuth('order');
            if (!allowed) return;          // user dismissed — stay on modal
            closeModal();
            showToast(`${title} added to your order!`, 'success');
        };

        modal?.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    modalClose?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // ── Utility ─────────────────────────────────────────────
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Boot ────────────────────────────────────────────────
    loadMenu();
});
