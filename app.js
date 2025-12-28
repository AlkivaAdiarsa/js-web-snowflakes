(function() {
  const canvas = document.getElementById("snowflake");
  if (!canvas) return;

  // === Controls from HTML attributes ===
  const intensity = parseInt(canvas.dataset.intensity) || 150;
  const maxSize = parseInt(canvas.dataset.maxSize) || 12;
  const darkOnly = canvas.dataset.darkOnly === "true";
  const blockClass = canvas.dataset.blockClass || "snowflake-block";
  const completeClass = canvas.dataset.completeClass || "snowflake-complete-block";

  // === Dark mode guard (Bootstrap optional) ===
  const themeAttr = document.documentElement.getAttribute("data-bs-theme");
  if (darkOnly && themeAttr && themeAttr !== "dark") return;

  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = document.body.scrollHeight; // full page height
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // === Cache element rects ===
  let snowTargets = [];
  function cacheRects() {
    snowTargets = [];
    document.querySelectorAll(`.${blockClass}, .${completeClass}`).forEach(el => {
      const rect = el.getBoundingClientRect();
      const absTop = rect.top + window.scrollY;
      const absLeft = rect.left + window.scrollX;
      snowTargets.push({
        rect: {
          top: absTop,
          left: absLeft,
          right: absLeft + rect.width,
          bottom: absTop + rect.height,
          width: rect.width
        },
        isComplete: el.classList.contains(completeClass)
      });
    });
  }
  cacheRects();
  window.addEventListener("scroll", cacheRects);
  window.addEventListener("resize", cacheRects);

  // === Fractal Snowflake Generator ===
  function generateSnowflake(size) {
    const offCanvas = document.createElement("canvas");
    offCanvas.width = size * 2;
    offCanvas.height = size * 2;
    const offCtx = offCanvas.getContext("2d");
    offCtx.translate(size, size);
    offCtx.strokeStyle = "white";
    offCtx.lineWidth = 1;

    function drawArm(length) {
      offCtx.beginPath();
      offCtx.moveTo(0, 0);
      offCtx.lineTo(length, 0);
      offCtx.stroke();

      for (let j = length / 4; j < length; j += length / 4) {
        const branchLen = length / 4;
        const angle = (Math.random() * 0.5 + 0.25);
        // left branch
        offCtx.save();
        offCtx.translate(j, 0);
        offCtx.rotate(-angle);
        offCtx.beginPath();
        offCtx.moveTo(0, 0);
        offCtx.lineTo(branchLen, 0);
        offCtx.stroke();
        offCtx.restore();
        // right branch
        offCtx.save();
        offCtx.translate(j, 0);
        offCtx.rotate(angle);
        offCtx.beginPath();
        offCtx.moveTo(0, 0);
        offCtx.lineTo(branchLen, 0);
        offCtx.stroke();
        offCtx.restore();
      }
    }

    for (let i = 0; i < 6; i++) {
      drawArm(size);
      offCtx.rotate(Math.PI / 3);
    }
    return offCanvas;
  }

  // === Snowflake Class ===
  class Snowflake {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * -canvas.height;
      this.size = Math.random() * maxSize + 6;
      this.speedY = Math.random() * 1.5 + 0.5;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random() * 0.5 + 0.5;
      this.rotation = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.01;
      this.depth = Math.random();
      this.sprite = generateSnowflake(this.size);
    }
    update() {
      this.x = Math.max(this.size, Math.min(this.x + this.speedX, canvas.width - this.size));
      this.y += this.speedY * (0.5 + this.depth);
      this.rotation += this.spin;

      snowTargets.forEach(target => {
        const r = target.rect;
        if (this.x > r.left && this.x < r.right && this.y > r.top && this.y < r.bottom) {
          const chance = target.isComplete ? 1 : 0.01;
          if (Math.random() < chance) {
            this.layDown(r);
            this.reset(); // respawn immediately so snowfall continues
          }
        }
      });

      if (this.y > canvas.height) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity * (0.5 + this.depth);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      const scale = 0.5 + this.depth;
      ctx.scale(scale, scale);
      ctx.drawImage(this.sprite, -this.size, -this.size);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    layDown(rect) {
      const line = document.createElement("div");
      line.className = "snow-line";
      let offsetX = this.x - rect.left;
      offsetX = Math.max(0, Math.min(offsetX, rect.width - this.size * 2));
      line.style.position = "absolute";
      line.style.background = "white";
      line.style.height = "2px";
      line.style.width = this.size * 2 + "px";
      line.style.left = rect.left + offsetX + "px";
      line.style.top = rect.top - 4 + "px";
      line.style.opacity = 1;
      line.style.transition = "opacity 5s linear";

      document.body.appendChild(line);

      setTimeout(() => {
        line.style.opacity = 0;
        setTimeout(() => line.remove(), 5000);
      }, 5000);
    }
  }

  // === Snow System ===
  const flakes = Array.from({ length: intensity }, () => new Snowflake());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flakes.forEach(flake => {
      flake.update();
      flake.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();