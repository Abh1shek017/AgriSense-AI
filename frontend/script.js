/**
 * script.js — Frontend logic for the AgriSense AI Dashboard
 *
 * Handles:
 *   - Reading sensor input values
 *   - POSTing data to the Flask backend (/api/recommend)
 *   - Rendering crop recommendation cards
 *   - Drawing a Chart.js bar chart for confidence scores
 *   - Showing warnings and toast notifications for errors
 */

// ══════════════════════════════════════════════════════════════════════════════
// Configuration
// ══════════════════════════════════════════════════════════════════════════════

const API_URL = "http://localhost:5000/api/recommend";

// Crop → icon mapping for visual variety in the cards
const CROP_ICONS = {
    Rice:       "fa-bowl-rice",
    Wheat:      "fa-wheat-awn",
    Maize:      "fa-wheat-awn",
    Jute:       "fa-leaf",
    Cotton:     "fa-cloud",
    Coconut:    "fa-tree",
    Coffee:     "fa-mug-hot",
    Sugarcane:  "fa-candy-cane",
    Tea:        "fa-mug-saucer",
    Banana:     "fa-apple-whole",
    Mango:      "fa-lemon",
    Grapes:     "fa-wine-glass",
    Apple:      "fa-apple-whole",
    Orange:     "fa-lemon",
    Papaya:     "fa-apple-whole",
    Lentil:     "fa-seedling",
    Chickpea:   "fa-seedling",
    Muskmelon:  "fa-lemon",
    Watermelon: "fa-lemon",
    Potato:     "fa-carrot",
    Tomato:     "fa-pepper-hot",
    Soybean:    "fa-seedling",
};

// Reference to the Chart.js instance (so we can destroy it before re-creating)
let confidenceChart = null;


// ══════════════════════════════════════════════════════════════════════════════
// Main Function: Get Recommendation
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Reads input values, calls the backend API, and renders the results.
 * Triggered by the "Get Recommendation" button.
 */
async function getRecommendation() {
    const btn = document.getElementById("btn-recommend");

    // ── Collect input values ─────────────────────────────────────────────
    const payload = {
        N:           parseFloat(document.getElementById("input-n").value),
        P:           parseFloat(document.getElementById("input-p").value),
        K:           parseFloat(document.getElementById("input-k").value),
        ph:          parseFloat(document.getElementById("input-ph").value),
        temperature: parseFloat(document.getElementById("input-temp").value),
        humidity:    parseFloat(document.getElementById("input-humidity").value),
        moisture:    parseFloat(document.getElementById("input-moisture").value),
    };

    // Rainfall is optional — only include it if the field has a value
    const rainfallInput = document.getElementById("input-rainfall").value;
    if (rainfallInput !== "" && rainfallInput !== null) {
        payload.rainfall = parseFloat(rainfallInput);
    }

    // ── Basic client-side validation ─────────────────────────────────────
    const requiredFields = ["N", "P", "K", "ph", "temperature", "humidity", "moisture"];
    for (const field of requiredFields) {
        if (isNaN(payload[field])) {
            showToast(`Please enter a valid number for ${field}.`);
            return;
        }
    }

    // ── Show loading state ───────────────────────────────────────────────
    setLoading(btn, true);
    hideResults();

    // ── Call the API ─────────────────────────────────────────────────────
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            // Backend returned an error (400, 503, etc.)
            const errMsg = data.message || "Unknown error from server.";
            const details = data.errors ? `\n${data.errors.join(", ")}` : "";
            showToast(`${errMsg}${details}`);
            return;
        }

        // ── Render results ───────────────────────────────────────────────
        renderWarnings(data.warnings);
        renderCropCards(data.recommendations);
        renderChart(data.recommendations);
        renderMetadata(data.metadata);

    } catch (err) {
        // Network error — backend is likely offline
        console.error("API Error:", err);
        showToast("Connection Error — Backend server is offline or unreachable.");
    } finally {
        setLoading(btn, false);
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// Rendering Functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Render crop recommendation cards in the results section.
 * @param {Array} recommendations - e.g. [{crop: "Rice", confidence: "95%"}]
 */
function renderCropCards(recommendations) {
    const container = document.getElementById("crop-cards");
    container.innerHTML = "";

    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="grid-column: 1/-1; text-align:center; padding:40px;">
                <i class="fa-solid fa-circle-question" style="font-size:2rem; color:var(--text-muted); margin-bottom:12px;"></i>
                <p style="color:var(--text-secondary);">No recommendations available for the given data.</p>
            </div>`;
        showSection("results-section");
        return;
    }

    recommendations.forEach((rec, idx) => {
        const rank = idx + 1;
        const iconClass = CROP_ICONS[rec.crop] || "fa-seedling";

        const card = document.createElement("div");
        card.className = `crop-card ${rank === 1 ? "rank-1" : ""}`;
        card.innerHTML = `
            <span class="rank-badge">#${rank} Pick</span>
            <div class="crop-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="crop-name">${escapeHtml(rec.crop)}</div>
            <div class="crop-confidence">${escapeHtml(rec.confidence)}</div>
            <div class="crop-confidence-label">Confidence</div>
        `;
        container.appendChild(card);
    });

    showSection("results-section");
}


/**
 * Render a horizontal bar chart showing confidence scores using Chart.js.
 * @param {Array} recommendations - e.g. [{crop: "Rice", confidence: "95%"}]
 */
function renderChart(recommendations) {
    if (!recommendations || recommendations.length === 0) return;

    // Destroy old chart instance if it exists
    if (confidenceChart) {
        confidenceChart.destroy();
        confidenceChart = null;
    }

    const labels = recommendations.map(r => r.crop);
    const values = recommendations.map(r => parseFloat(r.confidence));

    // Color gradient from bright green (rank 1) to muted green (rank 3)
    const barColors = [
        "rgba(46, 204, 113, 0.9)",
        "rgba(46, 204, 113, 0.6)",
        "rgba(46, 204, 113, 0.35)",
    ];

    const borderColors = [
        "rgba(46, 204, 113, 1)",
        "rgba(46, 204, 113, 0.8)",
        "rgba(46, 204, 113, 0.5)",
    ];

    const ctx = document.getElementById("confidence-chart").getContext("2d");

    confidenceChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Confidence (%)",
                data: values,
                backgroundColor: barColors.slice(0, values.length),
                borderColor: borderColors.slice(0, values.length),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 40,
            }],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(15, 37, 23, 0.95)",
                    titleColor: "#a8f0c6",
                    bodyColor: "#f0f7f2",
                    padding: 12,
                    borderColor: "rgba(46, 204, 113, 0.3)",
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` Confidence: ${ctx.parsed.x}%`,
                    },
                },
            },
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: "rgba(255, 255, 255, 0.05)",
                    },
                    ticks: {
                        color: "#5d8a6d",
                        font: { family: "Inter", size: 11 },
                        callback: (val) => val + "%",
                    },
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: "#9abfa6",
                        font: { family: "Inter", size: 13, weight: "600" },
                    },
                },
            },
        },
    });
}


/**
 * Display warnings from the API response, or hide the section if none.
 * @param {Array|null} warnings - list of warning strings or null
 */
function renderWarnings(warnings) {
    const section = document.getElementById("warnings-section");
    const list = document.getElementById("warnings-list");

    if (!warnings || warnings.length === 0) {
        section.classList.add("hidden");
        return;
    }

    list.innerHTML = "";
    warnings.forEach((msg) => {
        const li = document.createElement("li");
        li.textContent = msg;
        list.appendChild(li);
    });

    section.classList.remove("hidden");
}


/**
 * Show metadata about the prediction (e.g., rainfall source).
 * @param {Object} metadata - e.g. { rainfall_source: "estimated", rainfall_value_used: 120 }
 */
function renderMetadata(metadata) {
    const bar = document.getElementById("metadata-bar");
    if (!metadata) {
        bar.innerHTML = "";
        return;
    }

    bar.innerHTML = `
        <div class="meta-item">
            <i class="fa-solid fa-cloud-showers-heavy"></i>
            Rainfall: <strong>${metadata.rainfall_value_used} mm</strong>
            (${escapeHtml(metadata.rainfall_source)})
        </div>
        <div class="meta-item">
            <i class="fa-solid fa-robot"></i>
            Model: RandomForest (scikit-learn)
        </div>
        <div class="meta-item">
            <i class="fa-solid fa-clock"></i>
            ${new Date().toLocaleTimeString()}
        </div>
    `;
}


// ══════════════════════════════════════════════════════════════════════════════
// UI Helper Functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Toggle the loading spinner state on the submit button.
 */
function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.classList.add("loading");
        btn.innerHTML = `
            <i class="fa-solid fa-spinner"></i>
            <span>Analyzing...</span>`;
    } else {
        btn.classList.remove("loading");
        btn.innerHTML = `
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>Get Recommendation</span>`;
    }
}

/**
 * Hide results and warnings sections (e.g., before a new request).
 */
function hideResults() {
    document.getElementById("results-section").classList.add("hidden");
    document.getElementById("warnings-section").classList.add("hidden");
}

/**
 * Show a section by removing the .hidden class.
 */
function showSection(sectionId) {
    document.getElementById(sectionId).classList.remove("hidden");
}

/**
 * Show a toast notification (auto-hides after 5 seconds).
 * Used for connection errors or validation issues.
 * @param {string} message
 */
function showToast(message) {
    const toast = document.getElementById("toast");
    const msgEl = document.getElementById("toast-msg");

    msgEl.textContent = message;
    toast.classList.add("visible");

    // Auto-hide after 5 seconds
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 5000);
}

/**
 * Escape HTML entities to prevent XSS when injecting dynamic content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
