// =======================================================================
// SAMVEDAN — CENTRAL MEDIA & SENSOR CONFIGURATION FILE
// =======================================================================
// Use this file to easily set, replace, or update your video file paths.
// You DO NOT need to search or edit index.html or control-room.html!
//
// HOW TO USE:
// 1. To use a different video, simply place your .mp4 in this folder
//    and update the filename below, OR enter an absolute / relative path.
// 2. Save this file and refresh your browser.
// =======================================================================

const SAMVEDAN_CONFIG = {
    // -------------------------------------------------------------------
    // ① AI DEHAZED VIDEO STREAM (Clear / Processed Video)
    // -------------------------------------------------------------------
    dehazedVideo: 'videos/front camers dehaze.mp4',

    // -------------------------------------------------------------------
    // ② RAW HAZED VIDEO STREAM (Unprocessed / Foggy Video)
    // -------------------------------------------------------------------
    hazedVideo: 'videos/front camers haze.mp4',

    // -------------------------------------------------------------------
    // ③ VEHICLE & MINE METADATA
    // -------------------------------------------------------------------
    unitId: 'BEML BH100 #0417',
    leadTruckId: 'LEAD: BEML-0417 // 38.4m',
    pitLocation: 'NMDC BAILADILA // BIOM KIRANDUL DEPOSIT 11',

    // -------------------------------------------------------------------
    // ④ PLAYBACK PREFERENCES
    // -------------------------------------------------------------------
    autoplay: true,
    loop: true,
    muted: true
};

// Expose globally for both views
window.SAMVEDAN_CONFIG = SAMVEDAN_CONFIG;

// =======================================================================
// AUTOMATIC STREAM BINDING ENGINE
// Applies configured video sources to all video elements across both views
// =======================================================================
function getActiveMediaSources() {
    // Prioritize any runtime-uploaded / custom-entered path from session storage
    const customDehazed = localStorage.getItem('samvedan_custom_dehazed');
    const customHazed = localStorage.getItem('samvedan_custom_hazed');

    return {
        dehazed: customDehazed || SAMVEDAN_CONFIG.dehazedVideo,
        hazed: customHazed || SAMVEDAN_CONFIG.hazedVideo,
        isCustom: !!(customDehazed || customHazed)
    };
}

function applySamvedanConfig() {
    const sources = getActiveMediaSources();

    function updateVideo(vid, newSrc) {
        if (!vid || !newSrc) return;
        const currentSrc = vid.currentSrc || vid.getAttribute('src') || '';
        if (!currentSrc.endsWith(encodeURI(newSrc)) && vid.src !== newSrc) {
            vid.src = newSrc;
            const srcTag = vid.querySelector('source');
            if (srcTag) srcTag.src = newSrc;
            vid.load();
            vid.muted = true;
            vid.defaultMuted = true;
            const p = vid.play();
            if (p !== undefined) p.catch(() => {});
        }
    }

    // 1. Dashboard: Front Camera AI Dehazed Stream
    const dashDehazed = document.getElementById('video-front-dehazed');
    if (dashDehazed) updateVideo(dashDehazed, sources.dehazed);

    // 2. Dashboard: Front Camera Raw Hazed Stream
    const dashHazed = document.getElementById('video-front-hazed');
    if (dashHazed) updateVideo(dashHazed, sources.hazed);

    // 3. Dashboard: Front Raw Panel
    const rawPanel = document.getElementById('panel-front-raw');
    if (rawPanel) {
        const rawVid = rawPanel.querySelector('video');
        if (rawVid) updateVideo(rawVid, sources.hazed);
    }

    // 4. Control Room: Live In-Cab Dehazed Monitor
    const crtDehazed = document.getElementById('crt-video-dehazed');
    if (crtDehazed) updateVideo(crtDehazed, sources.dehazed);

    // 5. Control Room: Live In-Cab Hazed Monitor
    const crtHazed = document.getElementById('crt-video-hazed');
    if (crtHazed) updateVideo(crtHazed, sources.hazed);
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySamvedanConfig);
} else {
    applySamvedanConfig();
}

// =======================================================================
// ⑤ INTERACTIVE IN-BROWSER MEDIA MANAGER MODAL
// Allows uploading/replacing video files directly from the UI in 1 click!
// =======================================================================
function initMediaConfigModal() {
    const modal = document.getElementById('media-config-modal');
    const openBtn = document.getElementById('btn-media-settings');
    const closeBtn = document.getElementById('btn-close-media-modal');
    const applyBtn = document.getElementById('btn-apply-media');
    const resetBtn = document.getElementById('btn-reset-media');
    const inputDehazed = document.getElementById('cfg-dehazed-input');
    const inputHazed = document.getElementById('cfg-hazed-input');
    const fileDehazed = document.getElementById('cfg-dehazed-file');
    const fileHazed = document.getElementById('cfg-hazed-file');
    const statusMsg = document.getElementById('media-status-msg');

    if (!modal) return;

    function syncInputs() {
        const sources = getActiveMediaSources();
        if (inputDehazed) inputDehazed.value = sources.dehazed;
        if (inputHazed) inputHazed.value = sources.hazed;
        if (statusMsg) {
            if (sources.isCustom) {
                statusMsg.style.display = 'block';
                statusMsg.textContent = '● Custom media sources currently active in this session.';
            } else {
                statusMsg.style.display = 'none';
            }
        }
    }

    if (openBtn) {
        openBtn.addEventListener('click', e => {
            e.preventDefault();
            syncInputs();
            modal.classList.add('is-open');
        });
    }

    function closeModal() {
        modal.classList.remove('is-open');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    // File input changes (direct local file uploads via browser blob URLs)
    if (fileDehazed) {
        fileDehazed.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                const blobUrl = URL.createObjectURL(file);
                localStorage.setItem('samvedan_custom_dehazed', blobUrl);
                if (inputDehazed) inputDehazed.value = file.name + ' [Uploaded File]';
                applySamvedanConfig();
                if (statusMsg) {
                    statusMsg.style.display = 'block';
                    statusMsg.textContent = `✔ Dehazed stream updated with local file: "${file.name}"`;
                }
            }
        });
    }

    if (fileHazed) {
        fileHazed.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                const blobUrl = URL.createObjectURL(file);
                localStorage.setItem('samvedan_custom_hazed', blobUrl);
                if (inputHazed) inputHazed.value = file.name + ' [Uploaded File]';
                applySamvedanConfig();
                if (statusMsg) {
                    statusMsg.style.display = 'block';
                    statusMsg.textContent = `✔ Hazed stream updated with local file: "${file.name}"`;
                }
            }
        });
    }

    // Apply button (for manual path strings)
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const newDehazed = inputDehazed ? inputDehazed.value.trim() : '';
            const newHazed = inputHazed ? inputHazed.value.trim() : '';

            if (newDehazed && !newDehazed.includes('[Uploaded File]')) {
                localStorage.setItem('samvedan_custom_dehazed', newDehazed);
            }
            if (newHazed && !newHazed.includes('[Uploaded File]')) {
                localStorage.setItem('samvedan_custom_hazed', newHazed);
            }

            applySamvedanConfig();
            if (statusMsg) {
                statusMsg.style.display = 'block';
                statusMsg.textContent = '✔ Video paths applied & streams loaded!';
            }
            setTimeout(closeModal, 800);
        });
    }

    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem('samvedan_custom_dehazed');
            localStorage.removeItem('samvedan_custom_hazed');
            syncInputs();
            applySamvedanConfig();
            if (statusMsg) {
                statusMsg.style.display = 'block';
                statusMsg.textContent = '↺ Reset to config.js defaults.';
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMediaConfigModal);
} else {
    initMediaConfigModal();
}
