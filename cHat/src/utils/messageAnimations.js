/**
 * Message Animations Handler
 * Optimized for mobile performance
 */

/**
 * Check if a message should trigger a special animation
 * @param {string} message - The message text to check
 * @returns {object|null} - Animation config or null if no animation is triggered
 */
export const checkMessageAnimation = (message) => {
    if (!message) return null;

    const lowerMsg = message.toLowerCase();

    // Crackers animation for congrats-related messages
    if (
        lowerMsg.includes('congrats') ||
        lowerMsg.includes('congratulations') ||
        lowerMsg.includes('celebrate') ||
        lowerMsg.includes('cheers')
    ) {
        return {
            type: 'crackers',
            duration: 1500,
            particleCount: 25,
            colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24']
        };
    }

    // Snow animation for winter-related messages
    if (
        lowerMsg.includes('snow') ||
        lowerMsg.includes('winter') ||
        lowerMsg.includes('christmas')
    ) {
        return {
            type: 'snow',
            duration: 2000,
            particleCount: 20,
            colors: ['#ffffff', '#e0e7ff']
        };
    }

    // Hearts animation for love/like messages
    if (
        lowerMsg.includes('love') ||
        lowerMsg.includes('heart')
    ) {
        return {
            type: 'hearts',
            duration: 1500,
            particleCount: 15,
            colors: ['#ff6b6b', '#ff8c9e']
        };
    }

    // Stars animation for achievement messages
    if (
        lowerMsg.includes('star') ||
        lowerMsg.includes('amazing') ||
        lowerMsg.includes('awesome')
    ) {
        return {
            type: 'stars',
            duration: 1800,
            particleCount: 20,
            colors: ['#f9ca24', '#f0932b']
        };
    }

    return null;
};

/**
 * Trigger animation with optimized rendering
 * @param {object} config - Animation configuration
 */
export const triggerAnimation = (config) => {
    if (!config || !config.type) return;

    // Use requestAnimationFrame to schedule animation
    const container = document.body;
    const particles = [];
    let frameId = null;

    for (let i = 0; i < config.particleCount; i++) {
        const particle = createParticle(config);
        container.appendChild(particle);
        particles.push(particle);
    }

    // Animate all particles together
    const startTime = performance.now();
    const animateFrame = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (config.duration || 1500), 1);

        particles.forEach((particle, index) => {
            updateParticle(particle, progress, config, index);
        });

        if (progress < 1) {
            frameId = requestAnimationFrame(animateFrame);
        } else {
            // Cleanup
            particles.forEach(p => p.remove());
            if (frameId) cancelAnimationFrame(frameId);
        }
    };

    frameId = requestAnimationFrame(animateFrame);
};

/**
 * Create a single particle element (optimized)
 * @param {object} config - Animation configuration
 * @returns {HTMLElement}
 */
function createParticle(config) {
    const particle = document.createElement('div');
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];

    particle.style.cssText = `
        position: fixed;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
        left: ${Math.random() * window.innerWidth}px;
        top: ${window.innerHeight}px;
        z-index: 9999;
        font-size: ${config.type === 'crackers' ? '20px' : config.type === 'snow' ? '18px' : '16px'};
    `;

    if (config.type === 'crackers') {
        particle.innerHTML = '🎉';
    } else if (config.type === 'snow') {
        particle.innerHTML = '❄️';
        particle.style.opacity = '0.7';
    } else if (config.type === 'hearts') {
        particle.innerHTML = '❤️';
    } else if (config.type === 'stars') {
        particle.innerHTML = '⭐';
    }

    return particle;
}

/**
 * Update particle position with optimized transform
 * @param {HTMLElement} particle - The particle element
 * @param {number} progress - Animation progress (0-1)
 * @param {object} config - Animation configuration
 * @param {number} index - Particle index
 */
function updateParticle(particle, progress, config, index) {
    const startX = parseFloat(particle.style.left);
    const endX = startX + (Math.random() - 0.5) * 300;
    const endY = -Math.random() * 350 - 50;
    const easeProgress = easeOutQuad(progress);

    const x = startX + (endX - startX) * easeProgress;
    const y = endY * easeProgress;
    const opacity = Math.max(0, 1 - progress * 1.5);

    let rotation = progress * 360 * (Math.random() > 0.5 ? 1 : -1);
    
    if (config.type === 'snow') {
        const wave = Math.sin(progress * Math.PI * 3) * 30;
        particle.style.transform = `translateY(${y}px) translateX(${wave}px) rotate(${rotation}deg)`;
    } else {
        particle.style.transform = `translateY(${y}px) translateX(${(endX - startX) * easeProgress}px) rotate(${rotation}deg)`;
    }
    
    particle.style.opacity = opacity.toString();
}

/**
 * Easing function for smooth animation
 */
function easeOutQuad(t) {
    return t * (2 - t);
}
