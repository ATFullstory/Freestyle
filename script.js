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
