import { useEffect, useRef } from "react";

export default function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseColor: string;
    }> = [];

    const colors = [
      "rgba(14, 165, 233, 0.25)", // Sky Blue
      "rgba(139, 92, 246, 0.25)", // Violet
      "rgba(16, 185, 129, 0.25)", // Emerald
      "rgba(245, 158, 11, 0.25)"  // Amber
    ];

    // Initialize clean floating node points
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 4 + 2,
        baseColor: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Capture cursor coordinates
    const pointer = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const handleMouseLeave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.width = canvasRef.current.offsetWidth || window.innerWidth;
      height = canvasRef.current.height = canvasRef.current.offsetHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background ambient color spots
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 10,
        width / 2, height / 2, Math.max(width, height)
      );
      gradient.addColorStop(0, "#f8fafc");
      gradient.addColorStop(0.5, "#ffffff");
      gradient.addColorStop(1, "#f1f5f9");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render connected lines
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Interaction with cursor
        const dxCursor = pointer.x - p1.x;
        const dyCursor = pointer.y - p1.y;
        const distCursor = Math.hypot(dxCursor, dyCursor);
        if (distCursor < 140) {
          p1.vx += (dxCursor / distCursor) * 0.05;
          p1.vy += (dyCursor / distCursor) * 0.05;
        }

        // Apply friction
        p1.vx *= 0.98;
        p1.vy *= 0.98;

        // Move items
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce screen coordinates
        if (p1.x < 0 || p1.x > width) {
          p1.vx *= -1;
          p1.x = p1.x < 0 ? 0 : width;
        }
        if (p1.y < 0 || p1.y > height) {
          p1.vy *= -1;
          p1.y = p1.y < 0 ? 0 : height;
        }

        // Connected lines loop
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.08 * (1 - dist / 120)})`;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw node sphere capsule
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.baseColor;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" id="three_wave_canvas" />;
}
