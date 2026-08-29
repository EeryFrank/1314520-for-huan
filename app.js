// SPDX-FileCopyrightText: 2026 QiZhang
// SPDX-License-Identifier: GPL-3.0-only

const TWO_PI = Math.PI * 2;
const MESSAGE = "1314520";

const quadratic = (x0, y0, x1, y1, x2, y2) => (progress) => {
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * x0 + 2 * inverse * progress * x1 + progress * progress * x2,
    y: inverse * inverse * y0 + 2 * inverse * progress * y1 + progress * progress * y2,
  };
};

const ellipseArc = (centerX, centerY, radiusX, radiusY, startAngle, endAngle) => (progress) => {
  const angle = startAngle + (endAngle - startAngle) * progress;
  return {
    x: centerX + radiusX * Math.cos(angle),
    y: centerY + radiusY * Math.sin(angle),
  };
};

const digitCurves = {
  1: [
    quadratic(0.3, 0.24, 0.44, 0.12, 0.56, 0.07),
    quadratic(0.56, 0.07, 0.545, 0.5, 0.53, 0.93),
    quadratic(0.3, 0.93, 0.54, 0.955, 0.78, 0.93),
  ],
  3: [
    ellipseArc(0.5, 0.27, 0.3, 0.23, -2.6, Math.PI / 2),
    ellipseArc(0.5, 0.73, 0.31, 0.24, -Math.PI / 2, 2.79),
  ],
  4: [
    quadratic(0.6, 0.07, 0.42, 0.34, 0.16, 0.66),
    quadratic(0.16, 0.66, 0.5, 0.685, 0.84, 0.66),
    quadratic(0.6, 0.07, 0.615, 0.5, 0.63, 0.94),
  ],
  5: [
    quadratic(0.74, 0.08, 0.52, 0.055, 0.33, 0.08),
    quadratic(0.33, 0.08, 0.3, 0.26, 0.3, 0.44),
    ellipseArc(0.475, 0.665, 0.31, 0.275, -2.17, 2.4),
  ],
  2: [
    ellipseArc(0.49, 0.27, 0.3, 0.215, -2.65, 0.62),
    quadratic(0.72, 0.4, 0.55, 0.66, 0.24, 0.92),
    quadratic(0.24, 0.92, 0.52, 0.945, 0.8, 0.92),
  ],
  0: [ellipseArc(0.5, 0.5, 0.3, 0.44, -Math.PI / 2, (3 * Math.PI) / 2)],
};

const heartCurve = (scale = 1) => (progress) => {
  const angle = progress * TWO_PI;
  const sine = Math.sin(angle);
  return {
    x: (16 * sine * sine * sine * scale) / 17,
    y:
      (-(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) *
        scale) /
      17,
  };
};

function sampleCurve(curve, sampleCount = 260) {
  const points = [];
  for (let index = 0; index <= sampleCount; index += 1) {
    points.push(curve(index / sampleCount));
  }

  const cumulative = [0];
  for (let index = 1; index <= sampleCount; index += 1) {
    const deltaX = points[index].x - points[index - 1].x;
    const deltaY = points[index].y - points[index - 1].y;
    cumulative.push(cumulative[index - 1] + Math.hypot(deltaX, deltaY));
  }

  return { points, cumulative, length: cumulative[sampleCount] || 1 };
}

function pointAtDistance(curve, progress) {
  const target = Math.min(Math.max(progress, 0), 1) * curve.length;
  let low = 0;
  let high = curve.cumulative.length - 1;

  while (low < high) {
    const middle = (low + high) >> 1;
    if (curve.cumulative[middle] < target) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  const current = Math.max(1, low);
  const segmentLength = curve.cumulative[current] - curve.cumulative[current - 1] || 1;
  const segmentProgress = (target - curve.cumulative[current - 1]) / segmentLength;
  const start = curve.points[current - 1];
  const end = curve.points[current];

  return {
    point: {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress,
    },
    tangentX: (end.x - start.x) / segmentLength,
    tangentY: (end.y - start.y) / segmentLength,
  };
}

function smoothStep(value) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 1831565813) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const centeredNoise = (random) => random() + random() + random() - 1.5;

class NightSkyAnimation {
  constructor(canvas) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is unavailable");
    }

    this.canvas = canvas;
    this.context = context;
    this.width = 0;
    this.height = 0;
    this.pixelRatio = 1;
    this.startedAt = performance.now();
    this.animationFrame = 0;
    this.stars = [];
    this.sparks = [];
    this.hearts = [];
    this.nextAutomaticHeart = 6;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.strokes = [...MESSAGE].map((digit) => (digitCurves[digit] ?? []).map((curve) => sampleCurve(curve)));
    this.heartPath = Array.from({ length: 72 }, (_, index) => heartCurve()(index / 71));

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);

    window.addEventListener("resize", this.resize);
    window.addEventListener("pointerdown", this.handlePointerDown);
    this.resize();
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  resize() {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.seedStars();
    this.seedSparks();
    if (this.reducedMotion) {
      this.draw(8.2);
    }
  }

  seedStars() {
    const random = seededRandom(20260819);
    const count = Math.round((this.width * this.height) / 9000);
    this.stars = [];

    for (let index = 0; index < count; index += 1) {
      const x = random();
      let y;
      if (index % 2 === 0) {
        y = random();
      } else {
        y = 0.16 + 0.42 * x + centeredNoise(random) * 0.11;
        if (y < 0 || y > 1) {
          y = random();
        }
      }

      this.stars.push({
        x: x * this.width,
        y: y * this.height,
        radius: 0.4 + random() * 1.3,
        speed: 0.4 + random() * 1.6,
        phase: random() * TWO_PI,
        warm: random() < 0.22,
      });
    }
  }

  seedSparks() {
    const random = seededRandom(1314520);
    this.sparks = [];
    for (let digitIndex = 0; digitIndex < MESSAGE.length; digitIndex += 1) {
      const strokeCount = this.strokes[digitIndex].length;
      for (let index = 0; index < 2; index += 1) {
        this.sparks.push({
          digitIndex,
          strokeIndex: Math.floor(random() * strokeCount),
          speed: 0.09 + random() * 0.07,
          offset: random(),
        });
      }
    }
  }

  handlePointerDown(event) {
    this.burst(event.clientX, event.clientY);
  }

  burst(x, y) {
    const now = this.elapsedSeconds();
    for (let index = 0; index < 3; index += 1) {
      this.hearts.push({
        born: now + index * 0.09,
        x: x + (Math.random() - 0.5) * 26,
        y: y + (Math.random() - 0.5) * 14,
        size: 9 + Math.random() * 8,
        life: 2.4 + Math.random() * 0.9,
        hue: Math.random() < 0.5 ? 0 : 1,
        drift: (Math.random() - 0.5) * 30,
      });
    }
  }

  elapsedSeconds() {
    return (performance.now() - this.startedAt) / 1000;
  }

  loop() {
    const elapsed = this.reducedMotion ? 8.2 : this.elapsedSeconds();
    this.draw(elapsed);
    if (!this.reducedMotion) {
      this.animationFrame = requestAnimationFrame(this.loop);
    }
  }

  draw(elapsed) {
    const context = this.context;
    context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

    const background = context.createLinearGradient(0, 0, 0, this.height);
    background.addColorStop(0, "#05040d");
    background.addColorStop(0.55, "#0b0920");
    background.addColorStop(1, "#140a22");
    context.fillStyle = background;
    context.fillRect(0, 0, this.width, this.height);

    const outerRadius = Math.max(this.width, this.height) * 0.55;
    const glow = context.createRadialGradient(
      this.width / 2,
      this.height * 0.4,
      0,
      this.width / 2,
      this.height * 0.4,
      outerRadius,
    );
    glow.addColorStop(0, "rgba(88, 60, 160, 0.10)");
    glow.addColorStop(1, "rgba(88, 60, 160, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, this.width, this.height);

    this.drawStars(elapsed);
    const pulseProgress = (elapsed % 1.6) / 1.6;
    const pulse =
      1 +
      0.45 *
        (Math.exp(-(((pulseProgress - 0.1) / 0.05) ** 2)) +
          0.55 * Math.exp(-(((pulseProgress - 0.32) / 0.07) ** 2)));
    this.drawMessage(elapsed, pulse);
    this.drawHearts(elapsed);

    const vignette = context.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.45,
      this.width / 2,
      this.height / 2,
      outerRadius,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(2,1,8,0.55)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, this.width, this.height);
  }

  drawStars(elapsed) {
    const context = this.context;
    context.save();
    context.globalCompositeOperation = "lighter";
    for (const star of this.stars) {
      const brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(elapsed * star.speed + star.phase)) ** 2;
      context.globalAlpha = brightness * 0.85;
      context.fillStyle = star.warm ? "#ffd9a8" : "#cdd8ff";
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, TWO_PI);
      context.fill();
    }
    context.restore();
  }

  drawMessage(elapsed, pulse) {
    const context = this.context;
    const digitGap = 0.34;
    const totalUnits = MESSAGE.length + (MESSAGE.length - 1) * digitGap;
    const size = Math.min((this.width * 0.86) / totalUnits, this.height * 0.3);
    const left = (this.width - totalUnits * size) / 2;
    const top = this.height * 0.4 - 0.5 * size + Math.sin(elapsed * 0.45) * 3;
    const gradient = context.createLinearGradient(left, 0, left + totalUnits * size, 0);
    gradient.addColorStop(0, "#ff5e8a");
    gradient.addColorStop(0.45, "#ff8e7a");
    gradient.addColorStop(0.75, "#ffb46b");
    gradient.addColorStop(1, "#ffd98a");

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(255, 110, 130, 0.55)";
    context.shadowBlur = 10 * pulse;

    const echoCount = 4;
    for (let digitIndex = 0; digitIndex < MESSAGE.length; digitIndex += 1) {
      const reveal = smoothStep((elapsed - (0.6 + digitIndex * 0.55)) / 1.9);
      if (reveal <= 0) {
        continue;
      }

      const digitLeft = left + digitIndex * (1 + digitGap) * size;
      const strokes = this.strokes[digitIndex];
      for (let strokeIndex = 0; strokeIndex < strokes.length; strokeIndex += 1) {
        const stroke = strokes[strokeIndex];
        const visiblePoints = Math.max(2, Math.floor(reveal * (stroke.points.length - 1)));

        for (let echoIndex = 0; echoIndex <= echoCount; echoIndex += 1) {
          const mainStroke = echoIndex === 0;
          const displacement = mainStroke ? 0 : (0.014 + 0.008 * echoIndex) * size;
          const frequency = 1.2 + echoIndex * 0.9;
          const direction = (0.9 + echoIndex * 0.55) * (echoIndex % 2 ? 1 : -1);
          const phase = echoIndex * 1.7 + strokeIndex * 0.9;
          context.beginPath();

          for (let pointIndex = 0; pointIndex <= visiblePoints; pointIndex += 1) {
            const progress = pointIndex / (stroke.points.length - 1);
            const { point, tangentX, tangentY } = pointAtDistance(stroke, progress);
            let x = digitLeft + point.x * size;
            let y = top + point.y * size;

            if (!mainStroke) {
              const envelope = Math.sin(Math.PI * progress);
              const wave = displacement * Math.sin(TWO_PI * frequency * progress + phase + direction * elapsed) * envelope;
              x += -tangentY * wave;
              y += tangentX * wave;
            }

            if (pointIndex === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }

          context.strokeStyle = gradient;
          context.globalAlpha = (mainStroke ? 0.92 : 0.34 - echoIndex * 0.05) * Math.min(1, reveal * 3);
          context.lineWidth = (mainStroke ? 2.1 : 0.9) * (size / 110 + 0.55) * (mainStroke ? pulse : 1);
          context.stroke();
        }

        if (reveal < 1) {
          const { point } = pointAtDistance(stroke, reveal);
          context.globalAlpha = 0.9;
          context.fillStyle = "#fff2e0";
          context.beginPath();
          context.arc(digitLeft + point.x * size, top + point.y * size, 2.6 * pulse, 0, TWO_PI);
          context.fill();
        }
      }
    }

    for (const spark of this.sparks) {
      if (smoothStep((elapsed - (0.6 + spark.digitIndex * 0.55)) / 1.9) < 1) {
        continue;
      }

      const stroke = this.strokes[spark.digitIndex][spark.strokeIndex % this.strokes[spark.digitIndex].length];
      const digitLeft = left + spark.digitIndex * (1 + digitGap) * size;
      const sparkProgress = (elapsed * spark.speed + spark.offset) % 1;

      for (let trailIndex = 0; trailIndex < 7; trailIndex += 1) {
        const trailProgress = sparkProgress - trailIndex * 0.012;
        if (trailProgress < 0) {
          continue;
        }

        const { point } = pointAtDistance(stroke, trailProgress);
        context.globalAlpha = (1 - trailIndex / 7) * 0.8;
        context.fillStyle = trailIndex === 0 ? "#fff6e8" : "#ffc06a";
        context.beginPath();
        context.arc(
          digitLeft + point.x * size,
          top + point.y * size,
          2.2 - trailIndex * 0.26,
          0,
          TWO_PI,
        );
        context.fill();
      }
    }

    context.restore();
  }

  drawHearts(elapsed) {
    if (elapsed > this.nextAutomaticHeart) {
      this.nextAutomaticHeart = elapsed + 7 + Math.random() * 4;
      this.burst(this.width * (0.3 + Math.random() * 0.4), this.height * 0.78);
    }

    const context = this.context;
    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    this.hearts = this.hearts.filter((heart) => elapsed - heart.born < heart.life);

    for (const heart of this.hearts) {
      const age = elapsed - heart.born;
      if (age < 0) {
        continue;
      }

      const progress = age / heart.life;
      const alpha = (1 - progress) ** 1.4 * 0.9;
      const size = heart.size * (0.6 + 0.4 * smoothStep(age / 0.4));
      const x = heart.x + heart.drift * progress + Math.sin(age * 2.2) * 6;
      const y = heart.y - age * 34;
      const pulse = 1 + 0.18 * Math.exp(-((((age % 1.1) / 1.1 - 0.12) / 0.06) ** 2));

      context.beginPath();
      for (let index = 0; index < this.heartPath.length; index += 1) {
        const point = this.heartPath[index];
        const pointX = x + point.x * size * pulse;
        const pointY = y + point.y * size * pulse;
        if (index === 0) {
          context.moveTo(pointX, pointY);
        } else {
          context.lineTo(pointX, pointY);
        }
      }
      context.closePath();
      context.strokeStyle = heart.hue === 0 ? "#ff6f97" : "#ffc06a";
      context.shadowColor = heart.hue === 0 ? "rgba(255,90,130,0.7)" : "rgba(255,190,100,0.7)";
      context.shadowBlur = 8;
      context.globalAlpha = alpha;
      context.lineWidth = 1.6;
      context.stroke();
      context.globalAlpha = alpha * 0.12;
      context.fillStyle = context.strokeStyle;
      context.fill();
    }

    context.restore();
  }
}

const canvas = document.querySelector(".sky-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("The sky canvas is missing");
}

new NightSkyAnimation(canvas);
