// Safe FullStory event wrapper — fires if FS is loaded, silently skips if not
function fsEvent(name, props) {
    if (window.FS) {
        FS.event(name, props);
    }
}

// --------------------------------------------------
// Accordion toggle + event
// --------------------------------------------------
document.querySelectorAll('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.accordion-item');
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.accordion-item').forEach(i => {
            i.classList.remove('open');
            i.setAttribute('data-state', 'collapsed');
        });

        if (!isOpen) {
            item.classList.add('open');
            item.setAttribute('data-state', 'expanded');
            const questionText = btn.textContent.replace(/[+×]/g, '').trim();
            fsEvent('Accordion Opened', { question: questionText });
        }
    });
});

// --------------------------------------------------
// Header CTA (Sign Up on homepage, Back to Home on signup page)
// --------------------------------------------------
const ctaHeader = document.querySelector('.cta-header');
if (ctaHeader) {
    ctaHeader.addEventListener('click', () => {
        fsEvent('CTA Clicked', {
            cta_text: ctaHeader.textContent.trim(),
            location: 'header'
        });
    });
}

// --------------------------------------------------
// Hero "Get Started" button
// --------------------------------------------------
const heroCta = document.querySelector('.hero .cta-primary');
if (heroCta) {
    heroCta.addEventListener('click', () => {
        fsEvent('CTA Clicked', {
            cta_text: heroCta.textContent.trim(),
            location: 'hero'
        });
    });
}

// --------------------------------------------------
// Contact form submission
// --------------------------------------------------
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        fsEvent('Form Submitted', { form_name: 'contact' });
    });
}

// --------------------------------------------------
// Sign up form submission
// --------------------------------------------------
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', e => {
        e.preventDefault();
        fsEvent('Form Submitted', { form_name: 'signup' });
    });
}

// --------------------------------------------------
// Neon pink lightning electrification on logo hover
// --------------------------------------------------
(function () {
    const logo = document.querySelector('[data-id="logo"]');
    if (!logo) return;

    let canvas, ctx, animFrame, isHovering = false;
    const NUM_BOLTS = 7;
    const SPREAD = 130;

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

    // Midpoint displacement — builds an array of [x,y] points
    function buildBolt(x1, y1, x2, y2, disp, pts) {
        pts = pts || [[x1, y1]];
        if (disp < 2) { pts.push([x2, y2]); return pts; }
        const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
        const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp;
        buildBolt(x1, y1, mx, my, disp / 2, pts);
        buildBolt(mx, my, x2, y2, disp / 2, pts);
        return pts;
    }

    function tracePath(pts) {
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }

    function drawBolt(sx, sy, ex, ey, alpha) {
        const disp = Math.hypot(ex - sx, ey - sy) * 0.55;
        const pts  = buildBolt(sx, sy, ex, ey, disp);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Layer 1 — wide outer corona
        ctx.globalAlpha  = alpha * 0.25;
        ctx.strokeStyle  = '#FF10F0';
        ctx.lineWidth    = 10;
        ctx.shadowColor  = '#FF10F0';
        ctx.shadowBlur   = 40;
        ctx.beginPath(); tracePath(pts); ctx.stroke();

        // Layer 2 — mid glow
        ctx.globalAlpha  = alpha * 0.55;
        ctx.lineWidth    = 3.5;
        ctx.shadowBlur   = 18;
        ctx.beginPath(); tracePath(pts); ctx.stroke();

        // Layer 3 — bright core
        ctx.globalAlpha  = alpha;
        ctx.strokeStyle  = '#ffaaff';
        ctx.lineWidth    = 1.2;
        ctx.shadowColor  = '#FF10F0';
        ctx.shadowBlur   = 6;
        ctx.beginPath(); tracePath(pts); ctx.stroke();

        ctx.restore();
    }

    function logoRect() {
        const r = logo.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
    }

    function edgePoint(r) {
        const side = Math.floor(Math.random() * 4);
        const rx = (Math.random() - 0.5) * r.w;
        const ry = (Math.random() - 0.5) * r.h;
        return [
            [r.cx + rx,           r.cy - r.h / 2],
            [r.cx + rx,           r.cy + r.h / 2],
            [r.cx - r.w / 2,      r.cy + ry     ],
            [r.cx + r.w / 2,      r.cy + ry     ],
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

        const r = logoRect();
        for (let i = 0; i < NUM_BOLTS; i++) {
            if (Math.random() < 0.72) {
                const [sx, sy] = edgePoint(r);
                const [ex, ey] = endPoint(r);
                drawBolt(sx, sy, ex, ey, 0.45 + Math.random() * 0.55);
            }
        }

        animFrame = requestAnimationFrame(animate);
    }

    logo.addEventListener('mouseenter', () => {
        isHovering = true;
        createCanvas();
        animate();
        fsEvent('Logo Lightning Triggered', { element: 'logo', page: document.title });
    });

    logo.addEventListener('mouseleave', () => {
        isHovering = false;
        cancelAnimationFrame(animFrame);
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setTimeout(removeCanvas, 60);
    });
}());
