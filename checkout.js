// checkout.js — 3-step purchase flow SPA

// --------------------------------------------------
// Lightning bolt drawing utilities
// (Purple neon, consistent with logo effect on index)
// --------------------------------------------------
function buildBolt(x1, y1, x2, y2, disp, pts) {
    pts = pts || [[x1, y1]];
    if (disp < 2) { pts.push([x2, y2]); return pts; }
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp;
    buildBolt(x1, y1, mx, my, disp / 2, pts);
    buildBolt(mx, my, x2, y2, disp / 2, pts);
    return pts;
}

function tracePath(ctx, pts) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}

function renderBolt(ctx, sx, sy, ex, ey, alpha) {
    const disp = Math.hypot(ex - sx, ey - sy) * 0.55;
    const pts  = buildBolt(sx, sy, ex, ey, disp);

    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    ctx.globalAlpha = alpha * 0.25;
    ctx.strokeStyle = '#BF00FF';
    ctx.lineWidth   = 10;
    ctx.shadowColor = '#BF00FF';
    ctx.shadowBlur  = 40;
    ctx.beginPath(); tracePath(ctx, pts); ctx.stroke();

    ctx.globalAlpha = alpha * 0.55;
    ctx.lineWidth   = 3.5;
    ctx.shadowBlur  = 18;
    ctx.beginPath(); tracePath(ctx, pts); ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#df80ff';
    ctx.lineWidth   = 1.2;
    ctx.shadowColor = '#BF00FF';
    ctx.shadowBlur  = 6;
    ctx.beginPath(); tracePath(ctx, pts); ctx.stroke();

    ctx.restore();
}

// --------------------------------------------------
// Step management
// --------------------------------------------------
let currentStep = 1;

function goToStep(n) {
    const from = document.getElementById('step-' + currentStep);
    const to   = document.getElementById('step-' + n);
    if (!from || !to) return;

    from.classList.remove('active');
    from.setAttribute('data-state', 'inactive');
    to.classList.add('active');
    to.setAttribute('data-state', 'active');

    document.querySelectorAll('.progress-step').forEach((el, i) => {
        const state = i + 1 === n ? 'active' : (i + 1 < n ? 'completed' : 'pending');
        el.classList.toggle('active',    i + 1 === n);
        el.classList.toggle('completed', i + 1 < n);
        el.setAttribute('data-state', state);
    });

    document.querySelectorAll('.progress-connector').forEach((el, i) => {
        el.classList.toggle('filled', i + 1 < n);
    });

    fsEvent('Checkout Step Viewed', { step: n, step_name: stepName(n) });
    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stepName(n) {
    return ['Personal Details', 'Product Selection', 'Payment'][n - 1] || '';
}

// --------------------------------------------------
// Step 1 — Personal details
// --------------------------------------------------
const detailsNext = document.getElementById('details-next');

function validateStep1() {
    const firstName = (document.getElementById('first-name')     || {}).value || '';
    const lastName  = (document.getElementById('last-name')      || {}).value || '';
    const email     = (document.getElementById('checkout-email') || {}).value || '';
    const phone     = (document.getElementById('phone')          || {}).value || '';
    const emailOk   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (detailsNext) {
        const isValid = !!(firstName.trim() && lastName.trim() && emailOk && phone.trim());
        detailsNext.disabled = !isValid;
        detailsNext.setAttribute('data-state', isValid ? 'enabled' : 'disabled');
    }
}

['first-name', 'last-name', 'checkout-email', 'phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', validateStep1);
});

if (detailsNext) {
    detailsNext.addEventListener('click', () => {
        fsEvent('Checkout Step Completed', { step: 1, step_name: 'Personal Details' });
        goToStep(2);
    });
}

// --------------------------------------------------
// Step 2 — Product selection
// --------------------------------------------------
const selectedCards  = new Set();
const productsNext   = document.getElementById('products-next');
const selectedSummary = document.getElementById('selected-summary');

function updateProductSummary() {
    if (selectedCards.size === 0) {
        if (selectedSummary) selectedSummary.textContent = 'No plan selected yet';
        if (productsNext) {
            productsNext.disabled = true;
            productsNext.setAttribute('data-state', 'disabled');
        }
        return;
    }
    const total = [...selectedCards].reduce((sum, c) => sum + parseInt(c.dataset.price), 0);
    const names = [...selectedCards].map(c => c.dataset.product).join(', ');
    if (selectedSummary) {
        selectedSummary.innerHTML = 'Selected: <strong>' + names + '</strong> — <strong>$' + total + '/mo</strong>';
    }
    if (productsNext) {
        productsNext.disabled = false;
        productsNext.setAttribute('data-state', 'enabled');
    }
}

document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
        card.classList.toggle('selected');
        if (card.classList.contains('selected')) {
            selectedCards.add(card);
            card.setAttribute('data-state', 'selected');
            fsEvent('Product Selected', {
                product: card.dataset.product,
                price:   parseInt(card.dataset.price)
            });
        } else {
            selectedCards.delete(card);
            card.setAttribute('data-state', 'unselected');
            fsEvent('Product Deselected', { product: card.dataset.product });
        }
        updateProductSummary();
    });
});

if (productsNext) {
    productsNext.addEventListener('click', () => {
        const total    = [...selectedCards].reduce((sum, c) => sum + parseInt(c.dataset.price), 0);
        const products = [...selectedCards].map(c => c.dataset.product);
        fsEvent('Checkout Step Completed', { step: 2, step_name: 'Product Selection', total, products });
        populateOrderSummary([...selectedCards], total);
        goToStep(3);
    });
}

function populateOrderSummary(cards, total) {
    const container = document.getElementById('order-summary');
    if (!container) return;
    const rows = cards.map(c =>
        '<div class="order-row" data-id="order-row-' + c.dataset.product.toLowerCase().replace(/\s+/g, '-') + '">' +
            '<span>' + c.dataset.product + '</span>' +
            '<span>$' + c.dataset.price + '/mo</span>' +
        '</div>'
    ).join('');
    container.innerHTML =
        '<div class="order-items" data-id="order-items">' + rows + '</div>' +
        '<div class="order-total" data-id="order-total">' +
            '<span>Total</span>' +
            '<span data-id="order-total-amount">$' + total + '/mo</span>' +
        '</div>';
}

// --------------------------------------------------
// Step 3 — Payment validation
// --------------------------------------------------
const purchaseBtn = document.getElementById('purchase-btn');

function validatePayment() {
    const name    = (document.getElementById('cardholder-name') || {}).value || '';
    const cardRaw = (document.getElementById('card-number')     || {}).value || '';
    const expiry  = (document.getElementById('expiry')          || {}).value || '';
    const cvv     = (document.getElementById('cvv')             || {}).value || '';
    const cardOk   = /^\d{16}$/.test(cardRaw.replace(/\s/g, ''));
    const expiryOk = /^\d{2}\s*\/\s*\d{2}$/.test(expiry.trim());
    const cvvOk    = /^\d{3,4}$/.test(cvv.trim());
    if (purchaseBtn) {
        const isValid = !!(name.trim() && cardOk && expiryOk && cvvOk);
        purchaseBtn.disabled = !isValid;
        purchaseBtn.setAttribute('data-state', isValid ? 'enabled' : 'disabled');
    }
}

// Auto-format card number: groups of 4
const cardNumInput = document.getElementById('card-number');
if (cardNumInput) {
    cardNumInput.addEventListener('input', e => {
        const digits = e.target.value.replace(/\D/g, '').substring(0, 16);
        e.target.value = digits.match(/.{1,4}/g)?.join(' ') || digits;
        validatePayment();
    });
}

// Auto-format expiry: MM / YY
const expiryInput = document.getElementById('expiry');
if (expiryInput) {
    expiryInput.addEventListener('input', e => {
        const digits = e.target.value.replace(/\D/g, '').substring(0, 4);
        e.target.value = digits.length >= 3
            ? digits.substring(0, 2) + ' / ' + digits.substring(2)
            : digits;
        validatePayment();
    });
}

['cardholder-name', 'cvv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', validatePayment);
});

// --------------------------------------------------
// Lightning effect on purchase button (hover)
// --------------------------------------------------
(function () {
    const btn = document.getElementById('purchase-btn');
    if (!btn) return;

    let canvas, ctx, animFrame, isHovering = false;
    const NUM_BOLTS = 9;
    const SPREAD    = 170;

    function createCanvas() {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999;';
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
    }

    function removeCanvas() {
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = ctx = null;
    }

    function btnRect() {
        const r = btn.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
    }

    function edgePoint(r) {
        const side = Math.floor(Math.random() * 4);
        const rx = (Math.random() - 0.5) * r.w;
        const ry = (Math.random() - 0.5) * r.h;
        return [
            [r.cx + rx,      r.cy - r.h / 2],
            [r.cx + rx,      r.cy + r.h / 2],
            [r.cx - r.w / 2, r.cy + ry     ],
            [r.cx + r.w / 2, r.cy + ry     ],
        ][side];
    }

    function endPoint(r) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = SPREAD * (0.5 + Math.random() * 0.5);
        return [r.cx + Math.cos(angle) * dist, r.cy + Math.sin(angle) * dist];
    }

    function animate() {
        if (!isHovering || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const r = btnRect();
        for (let i = 0; i < NUM_BOLTS; i++) {
            if (Math.random() < 0.72) {
                const [sx, sy] = edgePoint(r);
                const [ex, ey] = endPoint(r);
                renderBolt(ctx, sx, sy, ex, ey, 0.45 + Math.random() * 0.55);
            }
        }
        animFrame = requestAnimationFrame(animate);
    }

    btn.addEventListener('mouseenter', () => {
        if (btn.disabled) return;
        isHovering = true;
        createCanvas();
        animate();
        fsEvent('Purchase Button Hovered', { page: document.title });
    });

    btn.addEventListener('mouseleave', () => {
        isHovering = false;
        cancelAnimationFrame(animFrame);
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setTimeout(removeCanvas, 60);
    });

    // Stop lightning if button becomes disabled mid-hover
    new MutationObserver(() => {
        if (btn.disabled && isHovering) {
            isHovering = false;
            cancelAnimationFrame(animFrame);
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            setTimeout(removeCanvas, 60);
        }
    }).observe(btn, { attributes: true, attributeFilter: ['disabled'] });
}());

// --------------------------------------------------
// Fireworks on purchase click
// --------------------------------------------------
const FIREWORK_COLORS = ['#FF10F0', '#39FF14', '#BF00FF', '#ffffff', '#FF80FF', '#80FFFF', '#FFD700'];

function FireworkParticle(x, y) {
    this.x     = x + (Math.random() - 0.5) * 28;
    this.y     = y + (Math.random() - 0.5) * 16;
    this.color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 7.5;
    this.vx    = Math.cos(angle) * speed;
    this.vy    = Math.sin(angle) * speed - 1.5;
    this.alpha = 1;
    this.decay = 0.009 + Math.random() * 0.015;
    this.size  = 2.5 + Math.random() * 4;
    this.gravity = 0.09;
    this.trail   = [];
}

FireworkParticle.prototype.update = function () {
    this.trail.push([this.x, this.y]);
    if (this.trail.length > 6) this.trail.shift();
    this.x  += this.vx;
    this.y  += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.alpha -= this.decay;
};

FireworkParticle.prototype.draw = function (ctx) {
    for (let i = 0; i < this.trail.length; i++) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha) * (i / this.trail.length) * 0.35;
        ctx.fillStyle   = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.arc(this.trail[i][0], this.trail[i][1], this.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 18;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

FireworkParticle.prototype.isDead = function () { return this.alpha <= 0; };

function launchFireworks() {
    const btn = document.getElementById('purchase-btn');
    if (!btn) return;

    const fwCanvas = document.createElement('canvas');
    fwCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:10000;';
    fwCanvas.width  = window.innerWidth;
    fwCanvas.height = window.innerHeight;
    document.body.appendChild(fwCanvas);
    const fwCtx = fwCanvas.getContext('2d');

    const r  = btn.getBoundingClientRect();
    const ox = r.left + r.width  / 2;
    const oy = r.top  + r.height / 2;

    let particles  = [];
    let burstsDone = 0;

    const burstSchedule = [
        [ox,        oy,        32, 0  ],
        [ox - 90,   oy - 50,   26, 160],
        [ox + 90,   oy - 50,   26, 160],
        [ox,        oy - 100,  30, 300],
        [ox - 160,  oy + 10,   22, 420],
        [ox + 160,  oy + 10,   22, 420],
        [ox - 60,   oy - 160,  24, 560],
        [ox + 60,   oy - 160,  24, 560],
        [ox,        oy - 220,  28, 720],
    ];

    burstSchedule.forEach(([bx, by, count, delay]) => {
        setTimeout(() => {
            for (let i = 0; i < count; i++) {
                particles.push(new FireworkParticle(bx, by));
            }
            burstsDone++;
        }, delay);
    });

    function drawLoop() {
        fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
        particles = particles.filter(p => !p.isDead());
        particles.forEach(p => { p.update(); p.draw(fwCtx); });
        if (particles.length > 0 || burstsDone < burstSchedule.length) {
            requestAnimationFrame(drawLoop);
        } else {
            fwCanvas.parentNode && fwCanvas.parentNode.removeChild(fwCanvas);
            showSuccess();
        }
    }
    requestAnimationFrame(drawLoop);
}

function showSuccess() {
    const overlay = document.getElementById('success-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.setAttribute('data-state', 'visible');
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
}

// --------------------------------------------------
// Payment form submit
// --------------------------------------------------
const paymentForm = document.getElementById('payment-form');
if (paymentForm) {
    paymentForm.addEventListener('submit', e => {
        e.preventDefault();
        const total    = [...selectedCards].reduce((sum, c) => sum + parseInt(c.dataset.price), 0);
        const products = [...selectedCards].map(c => c.dataset.product);
        fsEvent('Purchase Completed', { total, products });
        if (purchaseBtn) purchaseBtn.disabled = true;
        launchFireworks();
    });
}

// --------------------------------------------------
// Initialise
// --------------------------------------------------
fsEvent('Checkout Step Viewed', { step: 1, step_name: 'Personal Details' });
