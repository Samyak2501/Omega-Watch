/* ============================================
   OMEGA — Smooth Interpolated Video Scrubbing
   Lenis + GSAP ScrollTrigger + rAF lerp
   
   No autoplay. No loop. No canvas. No frames.
   Video is scroll-controlled with smooth interpolation.
   Triggering fresh GitHub Actions deployment
   ============================================ */

(function () {
    'use strict';

    // Force scroll to top on page reload/refresh
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    window.addEventListener('beforeunload', () => {
        window.scrollTo(0, 0);
    });

    window.addEventListener('load', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
            if (typeof lenis !== 'undefined' && lenis) {
                lenis.scrollTo(0, { immediate: true });
            }
            ScrollTrigger.refresh();
        }, 10);
    });

    // ─── DOM ──────────────────────────────────
    const canvas = document.getElementById('heroCanvas');
    const ctx    = canvas.getContext('2d');
    const hero   = document.getElementById('hero');
    const navbar = document.getElementById('navbar');
    const panels = [
        document.getElementById('panel0'),
        document.getElementById('panel1'),
        document.getElementById('panel2'),
        document.getElementById('panel3'),
    ];

    // ─── STATE ────────────────────────────────
    let activePanel  = -1;
    let panelTl      = null;

    const totalFrames = 556; // WatchAni has exactly 556 frames
    const images      = [];
    let loadedCount   = 0;
    let canvasReady   = false;
    let lastDrawnIndex = -1;

    // Smooth motion interpolation state
    let targetProgress = 0;
    let smoothProgress = 0;
    let LERP           = 0.12; // Easing factor for buttery smooth glide

    // Section 2 Background State
    const sec2Canvas = document.getElementById('sec2Canvas');
    const sec2Ctx    = sec2Canvas.getContext('2d');
    const sec2TotalFrames = 225;
    const sec2Images      = [];
    let sec2CanvasReady   = false;
    let sec2LastDrawnIndex = -1;
    let targetSec2Progress = 0;
    let smoothSec2Progress = 0;

    // Pad index to 4 digits: e.g. 1 -> "0001" for Section 2
    function getSec2FramePath(idx) {
        return `frames_sec2/frame_${String(idx).padStart(4, '0')}.jpg`;
    }

    // Pad index to 4 digits: e.g. 1 -> "0001"
    function getFramePath(idx) {
        return `frames/frame_${String(idx).padStart(4, '0')}.jpg`;
    }

    // ─── LENIS SMOOTH SCROLL ──────────────────
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    });

    // ─── GSAP SETUP ───────────────────────────
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.clearScrollMemory();

    // Single rAF loop: Lenis → GSAP ticker
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // ─── CANVAS DRAWING & RESIZING ────────────
    function drawFrame(index) {
        if (!canvasReady) return;
        const img = images[index];
        if (!img) return;

        // Cover-style resize and crop
        const imgW = img.width || 1920;
        const imgH = img.height || 1080;
        const imgRatio = imgW / imgH;
        const canvasRatio = canvas.width / canvas.height;

        let drawW, drawH, drawX, drawY;

        if (canvasRatio > imgRatio) {
            // Desktop: Cover vertically, center horizontally
            drawW = canvas.width;
            drawH = canvas.width / imgRatio;
            drawX = 0;
            drawY = (canvas.height - drawH) / 2;
        } else {
            // Tablet/Mobile: Cover horizontally, shift watch to right (crops left)
            drawH = canvas.height;
            drawW = canvas.height * imgRatio;
            drawY = 0;
            // The watch center is located at ~87% of the original video width.
            // Position the watch at 78% of the canvas width, clamped to prevent gaps.
            drawX = Math.max(canvas.width - drawW, canvas.width * 0.78 - drawW * 0.87);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        lastDrawnIndex = index;
    }

    // ─── SMOOTH MOTION INTERPOLATION LOOP ──────
    gsap.ticker.add(() => {
        if (!canvasReady) return;

        // Easing smoothProgress toward targetProgress
        smoothProgress += (targetProgress - smoothProgress) * LERP;

        // Map smooth progress to integer frame index (0 to totalFrames - 1)
        const frameIndex = Math.round(smoothProgress * (totalFrames - 1));

        // Draw only when the calculated frame index changes
        if (frameIndex !== lastDrawnIndex) {
            drawFrame(frameIndex);
        }
    });

    // ─── SECTION 2 SMOOTH MOTION LOOP ──────────
    gsap.ticker.add(() => {
        if (!sec2CanvasReady) return;

        // Easing smoothSec2Progress toward targetSec2Progress
        smoothSec2Progress += (targetSec2Progress - smoothSec2Progress) * LERP;

        // Map smooth progress to integer frame index (0 to sec2TotalFrames - 1)
        const frameIndex = Math.round(smoothSec2Progress * (sec2TotalFrames - 1));

        // Draw only when the calculated frame index changes
        if (frameIndex !== sec2LastDrawnIndex) {
            drawSec2Frame(frameIndex);
        }
    });

    // ─── SECTION 2 CANVAS DRAWING & RESIZING ─────
    function drawSec2Frame(index) {
        if (!sec2CanvasReady) return;
        const img = sec2Images[index];
        if (!img) return;

        const imgW = img.width || 1920;
        const imgH = img.height || 1080;
        const imgRatio = imgW / imgH;
        const canvasRatio = sec2Canvas.width / sec2Canvas.height;

        let drawW, drawH, drawX, drawY;

        if (canvasRatio > imgRatio) {
            // Desktop: Cover vertically, center horizontally
            drawW = sec2Canvas.width;
            drawH = sec2Canvas.width / imgRatio;
            drawX = 0;
            drawY = (sec2Canvas.height - drawH) / 2;
        } else {
            // Tablet/Mobile: Cover horizontally, center horizontally (crops left and right equally)
            drawH = sec2Canvas.height;
            drawW = sec2Canvas.height * imgRatio;
            drawY = 0;
            drawX = (sec2Canvas.width - drawW) / 2;
        }

        sec2Ctx.clearRect(0, 0, sec2Canvas.width, sec2Canvas.height);
        sec2Ctx.drawImage(img, drawX, drawY, drawW, drawH);
        sec2LastDrawnIndex = index;
    }

    function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        if (canvasReady && lastDrawnIndex !== -1) {
            drawFrame(lastDrawnIndex);
        }
    }

    function resizeSec2Canvas() {
        if (!sec2Canvas) return;
        const rect = sec2Canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        sec2Canvas.width = rect.width * dpr;
        sec2Canvas.height = rect.height * dpr;

        if (sec2CanvasReady && sec2LastDrawnIndex !== -1) {
            drawSec2Frame(sec2LastDrawnIndex);
        }
    }

    window.addEventListener('resize', () => {
        requestAnimationFrame(() => {
            resizeCanvas();
            resizeSec2Canvas();
        });
    });

    // ─── PRELOAD IMAGE SEQUENCE ───────────────
    async function preloadImages() {
        const loaderPct = document.getElementById('loaderPct');
        const loaderOverlay = document.getElementById('loaderOverlay');

        const concurrencyLimit = 30; // Max 30 simultaneous open files
        
        // Build combined queue for Section 1 and Section 2 preloading
        const queue = [];
        for (let i = 1; i <= totalFrames; i++) {
            queue.push({ type: 1, index: i, path: getFramePath(i) });
        }
        for (let i = 1; i <= sec2TotalFrames; i++) {
            queue.push({ type: 2, index: i, path: getSec2FramePath(i) });
        }

        const totalToLoad = queue.length;
        let currentQueueIndex = 0;

        async function worker() {
            while (true) {
                const taskIndex = currentQueueIndex++;
                if (taskIndex >= totalToLoad) break;

                const task = queue[taskIndex];
                const img = new Image();
                img.src = task.path;
                try {
                    // Pre-decode on helper threads to avoid main-thread freeze
                    await img.decode();
                } catch (e) {
                    console.warn(`Task ${taskIndex} decode failed:`, e);
                }

                if (task.type === 1) {
                    images[task.index - 1] = img;
                } else {
                    sec2Images[task.index - 1] = img;
                }

                loadedCount++;
                if (loaderPct) {
                    loaderPct.textContent = `${Math.round((loadedCount / totalToLoad) * 100)}%`;
                }
            }
        }

        // Spawn workers
        const workers = [];
        for (let w = 0; w < concurrencyLimit; w++) {
            workers.push(worker());
        }
        await Promise.all(workers);

        canvasReady = true;
        sec2CanvasReady = true;

        // Hide loader
        if (loaderOverlay) {
            loaderOverlay.classList.add('fade-out');
        }

        // Initialize canvas sizing and draw first frames
        resizeCanvas();
        drawFrame(0);

        resizeSec2Canvas();
        drawSec2Frame(0);
    }

    // Start preloading immediately
    preloadImages();

    // ─── PANEL MANAGEMENT ─────────────────────
    function showPanel(idx) {
        panels.forEach((p, i) => p.classList.toggle('active', i === idx));
    }

    function animatePanel0() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo('#panel0 .label',
            { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7 }, 0);
        gsap.utils.toArray('#panel0 .heading-word').forEach((el, i) => {
            tl.fromTo(el, { y: '110%' }, { y: '0%', duration: 0.9, ease: 'power4.out' }, 0.15 + i * 0.1);
        });
        tl.fromTo('#panel0 .subheading',
            { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 0.5);
        tl.fromTo('#panel0 .cta-row',
            { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7 }, 0.7);
        return tl;
    }

    function animatePanel1() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo('#panel1 .label',
            { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, 0);
        gsap.utils.toArray('#panel1 .identity-row').forEach((el, i) => {
            tl.fromTo(el,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.7,
                  onComplete: () => el.classList.add('revealed') },
                0.15 + i * 0.12);
        });
        return tl;
    }

    function animatePanel2() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo('#panel2 .label',
            { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, 0);
        gsap.utils.toArray('#panel2 .feature-card').forEach((el, i) => {
            tl.fromTo(el,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.7 },
                0.1 + i * 0.15);
        });
        return tl;
    }

    function animatePanel3() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        gsap.utils.toArray('#panel3 .heading-word').forEach((el, i) => {
            tl.fromTo(el, { y: '110%' }, { y: '0%', duration: 1, ease: 'power4.out' }, i * 0.1);
        });
        tl.fromTo('#panel3 .cta-row',
            { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 0.4);
        return tl;
    }

    const panelAnimators = [animatePanel0, animatePanel1, animatePanel2, animatePanel3];

    function transitionTo(idx) {
        if (idx === activePanel) return;

        const oldPanel = activePanel !== -1 ? panels[activePanel] : null;
        const newPanel = panels[idx];

        if (panelTl) panelTl.kill();

        // 1. Outgoing panel transition (slide up and fade out)
        if (oldPanel) {
            gsap.to(oldPanel, {
                opacity: 0,
                y: -12,
                duration: 0.45,
                ease: 'power2.inOut',
                onComplete: () => {
                    oldPanel.classList.remove('active');
                    gsap.set(oldPanel, { y: 0 }); // reset layout position
                }
            });
        }

        // 2. Incoming panel transition (slide up from below and fade in)
        newPanel.classList.add('active');
        gsap.fromTo(newPanel,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }
        );

        // 3. Play detailed inner animations
        document.querySelectorAll('.identity-row')
                .forEach(el => el.classList.remove('revealed'));
        panelTl = panelAnimators[idx]();

        activePanel = idx;
    }

    function panelFromProgress(p) {
        if (p < 0.22) return 0;
        if (p < 0.50) return 1;
        if (p < 0.78) return 2;
        return 3;
    }

    // ─── SCROLLTRIGGER — PIN + PROGRESS ───────
    ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: '+=150%',
        pin: true,
        onUpdate: (self) => {
            const p = self.progress;

            // Set target progress — the lerp loop handles the rest
            targetProgress = p;

            // Panel switching
            transitionTo(panelFromProgress(p));

            // Navbar
            navbar.classList.toggle('scrolled', p > 0.01);
        },
    });

    // ─── SECTION 2 SCROLLTRIGGER — PIN & CROSSFADE ──
    const sec2Tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#sec2',
            start: 'top top',
            end: '+=150%',
            pin: true,
            scrub: 0.5,
            onUpdate: (self) => {
                targetSec2Progress = self.progress;
            }
        }
    });

    // Initial states set via GSAP autoAlpha
    gsap.set(['#sec2Panel2', '#sec2Panel3'], { autoAlpha: 0, y: 20 });
    gsap.set('#sec2Panel1', { autoAlpha: 1, y: 0 });

    // Panel crossfades matching scroll progress
    sec2Tl.to('#sec2Panel1', { autoAlpha: 0, y: -20, duration: 0.8, ease: 'power2.inOut' }, 0.5)
          .to('#sec2Panel2', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.inOut' }, 0.8)
          .to('#sec2Panel2', { autoAlpha: 0, y: -20, duration: 0.8, ease: 'power2.inOut' }, 1.8)
          .to('#sec2Panel3', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.inOut' }, 2.1);

    // Expose for testing/diagnostics
    window.watchScrub = {
        get LERP() { return LERP; },
        set LERP(val) { LERP = val; },
        get targetProgress() { return targetProgress; },
        get smoothProgress() { return smoothProgress; },
        get totalFrames() { return totalFrames; }
    };

    // ─── INITIAL STATE ────────────────────────
    transitionTo(0);

})();
