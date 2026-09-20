// ========================================================
// SAMVEDAN Advanced Simulation Engine
// Unified Controller for In-Cab HUD & Fleet Command Center
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Real-Time System Clock ──
    const timeDisplays = document.querySelectorAll('#current-time');
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timeDisplays.forEach(el => {
            el.textContent = timeStr;
        });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ── Global Video Autoplay & Playback Engine ──
    function playAllVideos() {
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(v => {
            v.muted = true;
            v.defaultMuted = true;
            v.setAttribute('muted', '');
            v.setAttribute('playsinline', '');
            const p = v.play();
            if (p !== undefined) {
                p.catch(() => {
                    // Browser waiting for user gesture
                });
            }
        });
    }
    // Attempt playback immediately
    playAllVideos();

    // Guarantee playback on any user click or keypress
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evtType => {
        document.addEventListener(
            evtType,
            () => {
                playAllVideos();
            },
            { once: true }
        );
    });

    // ========================================================
    // 2. DASHBOARD VIEW TELEMETRY & CONTROLS (index.html)
    // ========================================================
    if (document.querySelector('.dashboard-view')) {
        // Elements
        const v2vCount = document.getElementById('v2v-count');
        const visReading = document.getElementById('vis-reading');
        const tempReading = document.getElementById('temp-reading');
        const humReading = document.getElementById('hum-reading');
        const speedVal = document.getElementById('speed-val');
        const speedoNumber = document.getElementById('speedo-number');
        const speedoArc = document.getElementById('speedo-active-arc');
        const speedDir = document.getElementById('speed-dir');
        const frontPanel = document.getElementById('panel-front-ai');
        const dehazeBtn = document.getElementById('dehaze-toggle-btn');
        const dehazeText = document.getElementById('dehaze-state-text');
        const devTrigger = document.getElementById('dev-trigger');
        const alertOverlay = document.getElementById('alert-overlay');

        // Lightbox Elements
        const lightbox = document.getElementById('cam-lightbox');
        const lbTitle = document.getElementById('lb-camera-title');
        const lbMount = document.getElementById('lb-feed-mount');
        const lbCloseBtn = document.getElementById('lb-close-button');
        const lbDehazeBtn = document.getElementById('lb-dehaze-btn');
        const lbDehazeText = document.getElementById('lb-dehaze-text');
        const lbVisText = document.getElementById('lb-vis-text');

        // Speedometer Geometry Constants (270° sweep, r=30 circle in Card 2)
        const SPEEDO_MAX = 60;
        const SPEEDO_ARC_LEN = 141.4;
        const SPEEDO_CIRC = 188.5;

        function updateSpeedometer(speed) {
            const clamped = Math.min(Math.max(speed, 0), SPEEDO_MAX);
            if (speedoNumber) speedoNumber.textContent = clamped.toFixed(1);
            if (speedVal) speedVal.textContent = clamped.toFixed(1);

            if (speedoArc) {
                const filled = (clamped / SPEEDO_MAX) * SPEEDO_ARC_LEN;
                const remaining = SPEEDO_CIRC - filled;
                speedoArc.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${remaining.toFixed(1)}`);
            }
        }
        updateSpeedometer(12.5);

        // Dehaze State
        let dehazeEnabled = true; // Default ON (crystal clear AI dehazed)

        function setDehaze(state) {
            dehazeEnabled = state;
            if (frontPanel) {
                if (dehazeEnabled) {
                    frontPanel.classList.remove('dehaze-inactive');
                    frontPanel.classList.add('dehaze-active');
                } else {
                    frontPanel.classList.remove('dehaze-active');
                    frontPanel.classList.add('dehaze-inactive');
                }
            }

            const dehazedVid = document.getElementById('video-front-dehazed');
            const hazedVid = document.getElementById('video-front-hazed');
            if (dehazedVid && hazedVid) {
                if (dehazeEnabled) {
                    dehazedVid.style.opacity = '1';
                    hazedVid.style.opacity = '0';
                    dehazedVid.play().catch(() => {});
                } else {
                    dehazedVid.style.opacity = '0';
                    hazedVid.style.opacity = '1';
                    hazedVid.play().catch(() => {});
                }
            }

            if (dehazeBtn) {
                dehazeBtn.classList.toggle('is-off', !dehazeEnabled);
            }
            if (dehazeText) {
                dehazeText.textContent = dehazeEnabled ? 'ON' : 'OFF';
            }

            // Sync lightbox if open
            if (lbDehazeBtn && lbDehazeText) {
                lbDehazeBtn.classList.toggle('is-off', !dehazeEnabled);
                lbDehazeText.textContent = dehazeEnabled ? 'ON' : 'OFF';
                const lbFeedContainer = lbMount.querySelector('.feed-container');
                if (lbFeedContainer) {
                    if (dehazeEnabled) {
                        lbFeedContainer.classList.remove('dehaze-inactive');
                        lbFeedContainer.classList.add('dehaze-active');
                    } else {
                        lbFeedContainer.classList.remove('dehaze-active');
                        lbFeedContainer.classList.add('dehaze-inactive');
                    }
                    const lbDehazedVid = lbFeedContainer.querySelector('.video-dehazed');
                    const lbHazedVid = lbFeedContainer.querySelector('.video-hazed');
                    if (lbDehazedVid && lbHazedVid) {
                        lbDehazedVid.style.opacity = dehazeEnabled ? '1' : '0';
                        lbHazedVid.style.opacity = dehazeEnabled ? '0' : '1';
                        if (dehazeEnabled) lbDehazedVid.play().catch(() => {});
                        else lbHazedVid.play().catch(() => {});
                    }
                }
            }
        }

        if (dehazeBtn) {
            dehazeBtn.addEventListener('click', e => {
                e.stopPropagation(); // prevent panel click
                setDehaze(!dehazeEnabled);
            });
        }

        if (lbDehazeBtn) {
            lbDehazeBtn.addEventListener('click', e => {
                e.stopPropagation();
                setDehaze(!dehazeEnabled);
            });
        }

        // Initialize Dehaze State
        setDehaze(true);

        // Telemetry Randomizer Loop (every 2.5s)
        function simulateDashboard() {
            // Speed (11.0 to 14.8 km/h)
            if (speedVal && (!alertOverlay || !alertOverlay.classList.contains('active'))) {
                const current = parseFloat(speedVal.textContent) || 12.5;
                const delta = Math.random() * 1.2 - 0.6;
                let next = current + delta;
                if (next < 10.5) next = 10.5;
                if (next > 15.5) next = 15.5;
                updateSpeedometer(next);
            }

            // Visibility (65m to 85m)
            if (visReading && Math.random() > 0.4) {
                const curVis = parseInt(visReading.textContent, 10) || 75;
                const delta = Math.floor(Math.random() * 7) - 3;
                let nextVis = curVis + delta;
                if (nextVis < 55) nextVis = 55;
                if (nextVis > 90) nextVis = 90;
                visReading.textContent = nextVis;
                if (lbVisText) lbVisText.textContent = nextVis + 'm';
            }

            // Temperature & Humidity
            if (tempReading && Math.random() > 0.6) {
                tempReading.textContent = (2.8 + Math.random() * 0.9).toFixed(1);
            }
            if (humReading && Math.random() > 0.6) {
                humReading.textContent = Math.floor(90 + Math.random() * 5);
            }

            // Nearby Trucks (2 to 4)
            if (v2vCount && Math.random() > 0.8) {
                const count = Math.floor(Math.random() * 3) + 2;
                v2vCount.textContent = count.toString().padStart(2, '0');
            }

            // Heading drift
            if (speedDir && Math.random() > 0.7) {
                const dirs = ['HEADING: N (004°)', 'HEADING: N (002°)', 'HEADING: NE (006°)', 'HEADING: N (359°)'];
                speedDir.textContent = dirs[Math.floor(Math.random() * dirs.length)];
            }
        }
        setInterval(simulateDashboard, 2200);

        // ── Critical Emergency Alert Simulation ──
        if (devTrigger && alertOverlay) {
            function triggerEmergencyAlert() {
                alertOverlay.classList.add('active');
                if (frontPanel) {
                    frontPanel.style.borderColor = 'var(--accent-red)';
                    frontPanel.style.boxShadow = '0 0 40px var(--accent-red)';
                }
                updateSpeedometer(0.0);

                setTimeout(() => {
                    alertOverlay.classList.remove('active');
                    if (frontPanel) {
                        frontPanel.style.borderColor = '';
                        frontPanel.style.boxShadow = '';
                    }
                    updateSpeedometer(12.5);
                }, 3800);
            }

            devTrigger.addEventListener('click', triggerEmergencyAlert);
            document.addEventListener('keydown', e => {
                if (e.key === 'a' || e.key === 'A') {
                    if (document.activeElement.tagName !== 'INPUT') triggerEmergencyAlert();
                }
            });
        }

        // ========================================================
        // 3. FULLSCREEN CAMERA LIGHTBOX / INSPECTOR
        // ========================================================
        function openCameraLightbox(panel) {
            const camTitle = panel.getAttribute('data-cam') || 'CAMERA FEED';
            lbTitle.textContent = camTitle;

            // Clear previous mount
            lbMount.innerHTML = '';

            // Clone the feed container or SVG
            const feedContainer = panel.querySelector('.feed-container') || panel.querySelector('.speedo-svg-wrap');
            if (feedContainer) {
                const clone = feedContainer.cloneNode(true);
                clone.style.width = '100%';
                clone.style.height = '100%';
                clone.style.position = 'relative';

                // Play all cloned video elements
                clone.querySelectorAll('video').forEach(vid => {
                    vid.muted = true;
                    vid.play().catch(() => {});
                });

                // If it's the front AI feed, preserve current dehaze state
                if (panel.id === 'panel-front-ai') {
                    if (dehazeEnabled) {
                        clone.classList.remove('dehaze-inactive');
                        clone.classList.add('dehaze-active');
                    } else {
                        clone.classList.remove('dehaze-active');
                        clone.classList.add('dehaze-inactive');
                    }
                    const lbDehazedVid = clone.querySelector('.video-dehazed');
                    const lbHazedVid = clone.querySelector('.video-hazed');
                    if (lbDehazedVid && lbHazedVid) {
                        lbDehazedVid.style.opacity = dehazeEnabled ? '1' : '0';
                        lbHazedVid.style.opacity = dehazeEnabled ? '0' : '1';
                    }
                    if (lbDehazeBtn) lbDehazeBtn.style.display = 'flex';
                } else {
                    if (lbDehazeBtn) lbDehazeBtn.style.display = 'none';
                }

                lbMount.appendChild(clone);
            }

            if (lbVisText && visReading) {
                lbVisText.textContent = visReading.textContent + 'm';
            }

            lightbox.classList.add('is-open');
        }

        function closeCameraLightbox() {
            lightbox.classList.remove('is-open');
            lbMount.innerHTML = '';
        }

        // Attach click to all .cam-panel elements
        document.querySelectorAll('.cam-panel').forEach(panel => {
            panel.addEventListener('click', e => {
                // Don't trigger if clicked on the Dehaze toggle button
                if (e.target.closest('#dehaze-toggle-btn')) return;
                openCameraLightbox(panel);
            });
        });

        // Close handlers
        if (lbCloseBtn) lbCloseBtn.addEventListener('click', closeCameraLightbox);
        if (lightbox) {
            lightbox.addEventListener('click', e => {
                if (e.target === lightbox) closeCameraLightbox();
            });
        }
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeCameraLightbox();
        });
    }

    // ========================================================
    // 4. CONTROL ROOM SIMULATION & TERMINAL LOGS (control-room.html)
    // ========================================================
    if (document.querySelector('.control-room-view')) {
        const alertsFeed = document.getElementById('alerts-feed-content');

        const liveEvents = [
            { msg: '[CRIT] T-017: OBSTACLE_LOCKED // RAMP-01 BENCH 4 // BRAKES ENGAGED', type: 'critical' },
            { msg: '[WARN] T-023: VISIBILITY_DROP_55M // DEHAZE_AI_BOOSTED', type: 'caution' },
            { msg: '[INFO] T-011: APPROACHING_CRUSHER_A // DISCHARGE_CLEAR', type: 'normal' },
            { msg: '[INFO] T-004: RETURNING_TO_SHOVEL_01 // EMPTY_HAUL', type: 'normal' },
            { msg: '[INFO] T-009: OVERBURDEN_DELIVERY_CONFIRMED // TIER_3', type: 'normal' },
            { msg: '[SYS] DISPATCH: HIGHWALL_RADAR_SCAN_COMPLETE // NO_MOVEMENT', type: 'normal' },
            { msg: '[WARN] SECTOR_ALPHA: VALLEY_TEMPERATURE_INVERSION // FOG_EXPANDING', type: 'caution' }
        ];

        function simulateControlRoomEvents() {
            if (!alertsFeed) return;
            if (Math.random() > 0.5) {
                const evt = liveEvents[Math.floor(Math.random() * liveEvents.length)];
                const item = document.createElement('div');
                item.className = `alert-item ${evt.type === 'normal' ? '' : evt.type}`;

                const timeEl = document.createElement('div');
                timeEl.className = 'alert-time';
                const now = new Date();
                timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });

                const textEl = document.createElement('div');
                textEl.textContent = evt.msg;

                item.appendChild(timeEl);
                item.appendChild(textEl);
                alertsFeed.prepend(item);

                // Keep terminal to last 7 logs
                if (alertsFeed.children.length > 7) {
                    alertsFeed.removeChild(alertsFeed.lastChild);
                }
            }
        }
        setInterval(simulateControlRoomEvents, 3200);

        // Control Room In-Cab Video Dehaze Toggle
        const crtDehazeBtn = document.getElementById('crt-video-toggle-btn');
        const crtDehazeState = document.getElementById('crt-dehaze-state');
        const crtVidDehazed = document.getElementById('crt-video-dehazed');
        const crtVidHazed = document.getElementById('crt-video-hazed');
        let crtDehazeOn = true;

        if (crtDehazeBtn && crtDehazeState && crtVidDehazed && crtVidHazed) {
            crtDehazeBtn.addEventListener('click', () => {
                crtDehazeOn = !crtDehazeOn;
                crtDehazeState.textContent = crtDehazeOn ? 'ON' : 'OFF';
                crtVidDehazed.style.opacity = crtDehazeOn ? '1' : '0';
                crtVidHazed.style.opacity = crtDehazeOn ? '0' : '1';
                crtVidDehazed.muted = true;
                crtVidHazed.muted = true;
                if (crtDehazeOn) crtVidDehazed.play().catch(() => {});
                else crtVidHazed.play().catch(() => {});
            });
        }
    }
});
