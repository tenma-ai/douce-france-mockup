// Mobile Slide-out Nav Panel
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileNavPanel = document.getElementById('mobileNavPanel');
const mobileNavClose = document.getElementById('mobileNavClose');
const hamburgerOverlay = document.getElementById('hamburgerOverlay');

function openMobileNav() {
    mobileNavPanel && mobileNavPanel.classList.add('active');
    hamburgerOverlay && hamburgerOverlay.classList.add('active');
    hamburgerBtn && hamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
    mobileNavPanel && mobileNavPanel.classList.remove('active');
    hamburgerOverlay && hamburgerOverlay.classList.remove('active');
    hamburgerBtn && hamburgerBtn.classList.remove('active');
    document.body.style.overflow = '';
}

if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileNav);
if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
if (hamburgerOverlay) hamburgerOverlay.addEventListener('click', closeMobileNav);

// Close nav when clicking anchor links in the mobile panel
if (mobileNavPanel) {
    mobileNavPanel.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });
}

// Keyboard trap escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
});

// Header scroll effect
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Skip empty anchors or just "#"
        if (!href || href === '#') return;

        e.preventDefault();

        const target = document.querySelector(href);
        if (target) {
            const headerHeight = header.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for animation
const animateElements = document.querySelectorAll('.lesson-card, .testimonial-card, .feature-item');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// Add visible class styles dynamically
const style = document.createElement('style');
style.textContent = `
    .visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    .menu-open {
        overflow: hidden;
    }

    .mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translateY(8px);
    }

    .mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }

    .mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translateY(-8px);
    }

    @media (max-width: 768px) {
        .header-nav.active {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 84px;
            left: 0;
            right: 0;
            background-color: var(--color-white);
            padding: 2rem;
            gap: 1.5rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    }
`;
document.head.appendChild(style);

// Lazy loading for images
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Add stagger animation to feature items
const featureItems = document.querySelectorAll('.feature-item');
featureItems.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`;
});

// Add stagger animation to lesson cards
const lessonCards = document.querySelectorAll('.lesson-card');
lessonCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

// Simple parallax effect for hero image
const heroImage = document.querySelector('.hero-image img');
if (heroImage) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero');

        if (heroSection && scrolled < heroSection.offsetHeight) {
            heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
}

// FAQ Accordion
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Open clicked item if it was closed
        if (!isActive) {
            faqItem.classList.add('active');
            question.setAttribute('aria-expanded', 'true');
        }
    });
});

// Enhanced Scroll Reveal
const revealElements = document.querySelectorAll('.section-title, .welcome-body, .teacher-body, .info-item');
revealElements.forEach(el => {
    el.classList.add('reveal');
});

const scrollReveal = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => scrollReveal.observe(el));

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        // Disable submit button
        const submitButton = contactForm.querySelector('.submit-button');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>送信中...</span>';

        try {
            // Simulate form submission (replace with actual API endpoint)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Log form data (in production, send to server)
            console.log('Form submitted:', data);

            // Hide form and show success message
            contactForm.style.display = 'none';
            formSuccess.style.display = 'block';

            // Scroll to success message
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Reset form after a delay
            setTimeout(() => {
                contactForm.reset();
                contactForm.style.display = 'block';
                formSuccess.style.display = 'none';
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }, 5000);

        } catch (error) {
            console.error('Form submission error:', error);
            alert('送信中にエラーが発生しました。お手数ですが、お電話にてお問い合わせください。');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
}

console.log('Douce France - Website loaded successfully');

// カレンダーセル全体をクリッカブルに
document.querySelectorAll('.calendar-day.has-event').forEach(cell => {
    const link = cell.querySelector('.cal-event-link');
    if (!link) return;
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        window.location.href = link.href;
    });
});

// ===== 予約モーダル =====
const lessonSchedules = {
    eiga: {
        name: '映画クラス',
        dates: ['5/24（日）13:00 初中級 体験', '5/24（日）15:00 中級 体験', '6/21（日）13:00 初中級 体験', '6/21（日）15:00 中級 体験']
    },
    decouverte: {
        name: 'フランス文化クラス',
        dates: ['5/16（土）13:00 初中級・対面', '5/16（土）15:00 中級・対面', '6/6（土）13:00 初中級・オンライン', '6/6（土）15:00 中級・対面', '6/20（土）13:00 初中級・対面']
    },
    'kaiwa-kiso': {
        name: '優しい会話トレーニング',
        dates: ['5/17（日）13:00〜14:30', '5/23（土）13:00〜14:30', '5/31（日）13:00〜14:30', '6/7（日）13:00〜14:30', '6/14（日）13:00〜14:30', '6/27（土）13:00〜14:30']
    },
    talk: {
        name: '会話サロン',
        dates: ['5/12（火）昼 13:00 対面', '5/20（水）夜 19:00 オンライン', '5/26（火）昼 13:00 対面', '6/9（火）昼 13:00 対面', '6/20（土）夜 19:00 オンライン', '6/23（火）昼 13:00 対面']
    },
    classe: {
        name: 'レギュラークラス',
        dates: ['無料レベル確認（15分）後にご案内']
    },
    stepup: {
        name: 'ステップアップ会話',
        dates: ['6/13（土）13:00〜14:30 対面', '6/28（日）13:00〜14:30 対面']
    },
    online: {
        name: 'オンライン講座',
        dates: ['文化クラス 5/16（土）13:00', '文化クラス 6/6（土）13:00', '会話サロン夜 5/20（水）19:00', '会話サロン夜 6/4（水）19:00']
    }
};

function openBookingModal(lessonType, lessonName) {
    const overlay = document.getElementById('bookingOverlay');
    if (!overlay) return;
    const lesson = lessonSchedules[lessonType] || { name: lessonName || 'レッスン', dates: ['日程はお問い合わせください'] };
    document.getElementById('bookingModalTitle').textContent = lesson.name + ' 体験申し込み';
    document.getElementById('bookingLessonType').value = lessonType;
    document.getElementById('bookingLessonName').value = lesson.name;
    const dateSelect = document.getElementById('bookingDateSelect');
    dateSelect.innerHTML = '';
    lesson.dates.forEach(date => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'booking-date-btn';
        btn.textContent = date;
        btn.addEventListener('click', () => {
            dateSelect.querySelectorAll('.booking-date-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('bookingSelectedDate').value = date;
        });
        dateSelect.appendChild(btn);
    });
    document.getElementById('bookingSelectedDate').value = '';
    const form = document.getElementById('bookingForm');
    if (form) { form.style.display = ''; form.reset(); }
    const successMsg = document.getElementById('bookingSuccessMsg');
    if (successMsg) successMsg.classList.remove('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    const overlay = document.getElementById('bookingOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.querySelectorAll('[data-booking-lesson]').forEach(btn => {
    btn.addEventListener('click', () => {
        openBookingModal(btn.dataset.bookingLesson, btn.dataset.bookingName || '');
    });
});

const bookingOverlayEl = document.getElementById('bookingOverlay');
if (bookingOverlayEl) {
    bookingOverlayEl.addEventListener('click', e => {
        if (e.target === bookingOverlayEl) closeBookingModal();
    });
}
const bookingCloseBtn = document.getElementById('bookingClose');
if (bookingCloseBtn) bookingCloseBtn.addEventListener('click', closeBookingModal);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeBookingModal();
});

const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = bookingForm.querySelector('.booking-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
        try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            bookingForm.style.display = 'none';
            document.getElementById('bookingSuccessMsg').classList.add('active');
            setTimeout(() => {
                closeBookingModal();
                bookingForm.style.display = '';
                bookingForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }, 4000);
        } catch {
            alert('送信エラーが発生しました。お手数ですがメールにてご連絡ください。');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}
