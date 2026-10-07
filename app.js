/* ============================================================
 * Pixel Art Maker — draw pixel art on a canvas, save it to a
 * gallery (localStorage), and export it as a PNG image.
 * ============================================================ */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gridSizeEl = document.getElementById("grid-size");
const paletteEl = document.getElementById("palette");
const customColorEl = document.getElementById("custom-color");
const galleryGrid = document.getElementById("gallery-grid");
const galleryEmpty = document.getElementById("gallery-empty");

// ---------- App state ----------
let gridSize = 16;            // cells per row/column
let grid = [];                // 2D array of colors ("" = empty/white)
let currentTool = "brush";
let currentColor = "#000000";
let drawing = false;
let history = [];             // undo stack (snapshots of grid)

// A fun starter palette — click a swatch to select it
const PALETTE = [
  "#000000", "#ffffff", "#ff0000", "#00c853", "#2962ff",
  "#ffea00", "#ff9100", "#ff6b9d", "#9d4edd", "#00bcd4",
  "#795548", "#9e9e9e"
];

/* ---------- Grid helpers ---------- */

// Start a blank grid (or rebuild it after a size change)
function resetGrid() {
  grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  history = [];
}

// Take a snapshot of the grid so we can undo later
function snapshot() {
  history.push(JSON.stringify(grid));
  if (history.length > 50) history.shift(); // cap memory use
}

// Undo the last change
document.getElementById("undo-btn").addEventListener("click", () => {
  if (history.length === 0) return;
  grid = JSON.parse(history.pop());
  drawGrid();
});

/* ---------- Drawing ---------- */

// Paint the whole canvas from the grid array.
// We draw one square per cell, and keep pixels crisp.
function drawGrid() {
  const cell = canvas.width / gridSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
  }
}

// Convert a mouse/touch event into a grid cell {row, col}
function eventToCell(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const cell = canvas.width / gridSize;
  return {
    row: Math.min(Math.floor(y / cell), gridSize - 1),
    col: Math.min(Math.floor(x / cell), gridSize - 1)
  };
}

// Apply the active tool to one cell
function paintCell(row, col) {
  if (currentTool === "brush") {
    grid[row][col] = currentColor;
  } else if (currentTool === "eraser") {
    grid[row][col] = "";
  } else if (currentTool === "fill") {
    floodFill(row, col, grid[row][col], currentColor);
  }
}

// Bucket-fill: classic flood fill using a stack (avoids recursion limits)
function floodFill(startRow, startCol, target, replacement) {
  if (target === replacement) return; // nothing to do
  const stack = [[startRow, startCol]];
  while (stack.length) {
    const [r, c] = stack.pop();
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
    if (grid[r][c] !== target) continue;
    grid[r][c] = replacement;
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
}

// Mouse: snapshot once at the start of a stroke, paint while dragging
canvas.addEventListener("pointerdown", (e) => {
  snapshot();
  drawing = true;
  canvas.setPointerCapture(e.pointerId);
  const { row, col } = eventToCell(e);
  paintCell(row, col);
  drawGrid();
});
canvas.addEventListener("pointermove", (e) => {
  if (!drawing || currentTool === "fill") return;
  const { row, col } = eventToCell(e);
  paintCell(row, col);
  drawGrid();
});
canvas.addEventListener("pointerup", () => (drawing = false));

/* ---------- Toolbar wiring ---------- */

// Grid size: rebuild the grid (warns nothing — old art is replaced)
gridSizeEl.addEventListener("change", () => {
  gridSize = parseInt(gridSizeEl.value, 10);
  resetGrid();
  drawGrid();
});

// Tool buttons: only one tool active at a time
const toolButtons = {
  brush: document.getElementById("tool-brush"),
  eraser: document.getElementById("tool-eraser"),
  fill: document.getElementById("tool-fill")
};
Object.entries(toolButtons).forEach(([tool, btn]) => {
  btn.addEventListener("click", () => {
    currentTool = tool;
    Object.values(toolButtons).forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Clear the whole canvas (with undo snapshot first)
document.getElementById("clear-btn").addEventListener("click", () => {
  snapshot();
  resetGrid();
  drawGrid();
});

// Export the canvas as a PNG download
document.getElementById("export-btn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

/* ---------- Palette ---------- */

// Build a swatch button for each palette color
PALETTE.forEach((color, i) => {
  const swatch = document.createElement("button");
  swatch.className = "swatch" + (i === 0 ? " active" : "");
  swatch.style.background = color;
  swatch.title = color;
  swatch.addEventListener("click", () => {
    currentColor = color;
    document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
    swatch.classList.add("active");
  });
  paletteEl.appendChild(swatch);
});

// Custom color picker selects that color too
customColorEl.addEventListener("input", () => {
  currentColor = customColorEl.value;
  document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
});

/* ---------- Gallery (saved in localStorage) ---------- */

const GALLERY_KEY = "pixel-art-gallery";

function loadGallery() {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
  } catch {
    return [];
  }
}
function persistGallery(items) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
}

// Render saved thumbnails; each can be re-loaded or deleted
function renderGallery() {
  const items = loadGallery();
  galleryGrid.innerHTML = "";
  galleryEmpty.style.display = items.length ? "none" : "block";

  items.forEach((dataUrl, index) => {
    const wrap = document.createElement("div");
    wrap.className = "gallery-item";

    const img = document.createElement("img");
    img.src = dataUrl;
    img.title = "Click to load";
    img.style.cursor = "pointer";
    // Click a thumbnail to paint it back onto the canvas
    img.addEventListener("click", () => {
      const image = new Image();
      image.onload = () => {
        snapshot();
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        // Re-read pixels back into the grid (so brush/fill keep working)
        const cell = canvas.width / gridSize;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const px = Math.floor(r * cell + cell / 2);
            const py = Math.floor(c * cell + cell / 2);
            const i = (py * canvas.width + px) * 4;
            const [red, green, blue] = [data[i], data[i + 1], data[i + 2]];
            grid[r][c] = (red === 255 && green === 255 && blue === 255)
              ? ""
              : "#" + [red, green, blue].map(v => v.toString(16).padStart(2, "0")).join("");
          }
        }
      };
      image.src = dataUrl;
    });

    const del = document.createElement("button");
    del.textContent = "✕";
    del.title = "Delete";
    del.addEventListener("click", () => {
      const updated = loadGallery().filter((_, i) => i !== index);
      persistGallery(updated);
      renderGallery();
    });

    wrap.appendChild(img);
    wrap.appendChild(del);
    galleryGrid.appendChild(wrap);
  });
}

// Save the current canvas as a thumbnail in the gallery
document.getElementById("save-btn").addEventListener("click", () => {
  const items = loadGallery();
  items.unshift(canvas.toDataURL("image/png")); // newest first
  persistGallery(items.slice(0, 24)); // cap at 24 to protect storage
  renderGallery();
});

/* ---------- Boot up ---------- */
resetGrid();
drawGrid();
renderGallery();
