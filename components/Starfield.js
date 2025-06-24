import { useRef, useEffect } from 'react';

const STAR_COUNT = 200;

function randomStar(canvas) {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width,
    o: 0.2 + Math.random() * 0.8,
    r: 0.5 + Math.random() * 1.5,
  };
}

export default function Starfield() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let stars = Array.from({ length: STAR_COUNT }, () => randomStar(canvas));

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (let star of stars) {
        ctx.globalAlpha = star.o;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    }

    function update() {
      for (let star of stars) {
        star.x += 0.05 * (star.x - width / 2) / star.z;
        star.y += 0.05 * (star.y - height / 2) / star.z;
        star.z -= 0.2;
        if (
          star.x < 0 ||
          star.x > width ||
          star.y < 0 ||
          star.y > height ||
          star.z < 1
        ) {
          Object.assign(star, randomStar(canvas));
        }
      }
    }

    function animate() {
      update();
      draw();
      requestAnimationFrame(animate);
    }

    animate();

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stars = Array.from({ length: STAR_COUNT }, () => randomStar(canvas));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
      }}
    />
  );
}