// Waveform Animation & Speech Synthesis

const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');
let animationId;
let isSpeaking = false;

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Waveform Configuration
const bars = 100;
const barWidth = 2; // Thin lines
const barSpacing = 8; // Spacing between lines

function drawWaveform(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient for lines (Dynamic based on theme)
    const isLight = document.body.classList.contains('light-theme');
    const colorStart = isLight ? 'rgba(123, 44, 191, 0)' : 'rgba(123, 44, 191, 0)';
    const colorMid = isLight ? 'rgba(0, 150, 199, 0.8)' : 'rgba(76, 201, 240, 0.8)'; // Darker blue for light mode

    const gradient = ctx.createLinearGradient(0, canvas.height / 2 - 100, 0, canvas.height / 2 + 100);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(0.5, colorMid);
    gradient.addColorStop(1, colorStart);

    ctx.fillStyle = gradient;

    const centerX = canvas.width / 2;
    const totalWidth = bars * (barWidth + barSpacing);
    const startX = centerX - totalWidth / 2;

    for (let i = 0; i < bars; i++) {
        // Create a wave effect using sine or noise
        // If speaking, amplify the amplitude
        const amplitude = isSpeaking ? 100 : 20;
        const speed = isSpeaking ? 0.01 : 0.002;

        // Calculate height based on sine wave formula with time offset
        const height = Math.abs(Math.sin(time * speed + i * 0.1)) * amplitude + 10;

        const x = startX + i * (barWidth + barSpacing);
        const y = (canvas.height - height) / 2;

        // Draw rounded bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 5);
        ctx.fill();
    }

    animationId = requestAnimationFrame((t) => drawWaveform(t));
}

// Start pure idle animation
requestAnimationFrame((t) => drawWaveform(t));


// Voice Logic
const btn = document.getElementById('getStartedBtn');
const greetingText = "Hello, welcome to Mood Playground! How are you feeling today?";

function speak() {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(greetingText);

        // Try to select a female voice
        // Priority: Indian Female -> Indian -> General Female
        const voices = window.speechSynthesis.getVoices();

        let selectedVoice = voices.find(voice =>
            (voice.lang === 'en-IN' || voice.name.includes('India')) &&
            (voice.name.includes('Female') || voice.name.includes('Google') || voice.name.includes('Heera') || voice.name.includes('Neerja'))
        );

        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang === 'en-IN' || voice.name.includes('India'));
        }

        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Google US English'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // Visualize while speaking
        utterance.onstart = () => {
            isSpeaking = true;
        };

        utterance.onend = () => {
            isSpeaking = false;
        };

        window.speechSynthesis.speak(utterance);
    } else {
        console.log("Speech synthesis not supported.");
    }
}

// Ensure voices are loaded (needed for Chrome sometimes)
window.speechSynthesis.onvoiceschanged = () => {
    // Voices loaded - can trigger a small UI update if needed
};

btn.addEventListener('click', () => {
    speak();
    // Smooth scroll to About section
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
});

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item h3');

faqItems.forEach(item => {
    item.addEventListener('click', () => {
        const parent = item.parentElement;
        const isActive = parent.classList.contains('active');

        // Close all others
        document.querySelectorAll('.faq-item').forEach(faq => {
            faq.classList.remove('active');
        });

        // Toggle current
        if (!isActive) {
            parent.classList.add('active');
        }
    });
});

// Scroll Animations (Intersection Observer)
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // If it's a grid/container, animate children specifically
            if (entry.target.classList.contains('cards-grid') || entry.target.classList.contains('testimonials-grid') || entry.target.classList.contains('about-grid')) {
                const children = entry.target.children;
                Array.from(children).forEach((child, index) => {
                    child.style.animationDelay = `${index * 0.15}s`; /* Stagger delay */
                    child.classList.add('animate-child');
                });
            }

            observer.unobserve(entry.target); // Once visible, stay visible
        }
    });
}, observerOptions);

// Elements to animate
document.querySelectorAll('.card, .testimonial-card, .about-text, .section-title, .form-group, .cards-grid, .testimonials-grid, .about-grid').forEach(el => {
    // If it's a container, don't just fade it in, prepare it for child staggering
    if (el.classList.contains('cards-grid') || el.classList.contains('testimonials-grid') || el.classList.contains('about-grid')) {
        observer.observe(el);
    } else if (!el.parentElement.classList.contains('cards-grid') && !el.parentElement.classList.contains('testimonials-grid')) {
        // Individual items not in a staggered grid
        el.classList.add('fade-in-section');
        observer.observe(el);
    }
});


// Theme Toggle
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;

// Check local storage
if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-theme');
}

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-theme');

    // Save to local storage
    if (body.classList.contains('light-theme')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
});

// Update drawWaveform to be theme-aware
// (We modify the original function or just ensure it reads styles)
// The gradient in the original function is hardcoded. Let's make it smarter.
// Note: We are not replacing the drawWaveform function here, but we can access the ctx in the next frame.

// Hamburger Menu Logic
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav a');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        document.documentElement.classList.toggle('no-scroll'); // Prevent body scroll
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            document.documentElement.classList.remove('no-scroll');
        });
    });
}

// Contact Form Submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalBtnText = submitBtn.innerText;

        // Show loading state
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        const formData = new FormData(contactForm);

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                alert('Thank you! Your message has been sent to 24uca143@anjaconline.org.');
                contactForm.reset();
            } else {
                const data = await response.json();
                if (Object.hasOwn(data, 'errors')) {
                    alert(data["errors"].map(error => error["message"]).join(", "));
                } else {
                    alert('Oops! There was a problem submitting your form. Please try again.');
                }
            }
        } catch (error) {
            alert('Oops! There was a problem submitting your form.');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}
