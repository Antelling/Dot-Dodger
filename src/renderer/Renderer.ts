interface CircleBatch {
  x: number;
  y: number;
  radius: number;
}

interface CircleOutlineBatch {
  x: number;
  y: number;
  radius: number;
  lineWidth: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  private circleBatches: Map<string, CircleBatch[]> = new Map();
  private outlineBatches: Map<string, CircleOutlineBatch[]> = new Map();

  private static readonly TWO_PI = Math.PI * 2;
  private static readonly SCALE = 1.3;

  constructor(canvasId: string = 'game') {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Set canvas backing store to physical pixel size for crisp rendering
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    
    // Keep CSS size at logical pixels
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  getBounds(): { width: number; height: number } {
    return { width: this.width / Renderer.SCALE, height: this.height / Renderer.SCALE };
  }

  clear(color: string = '#000000'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.scale(this.dpr * Renderer.SCALE, this.dpr * Renderer.SCALE);
  }

  endFrame(): void {
    this.ctx.restore();
  }

  // Queue a circle - renders when flushBatches() is called
  drawCircle(x: number, y: number, radius: number, color: string): void {
    let batch = this.circleBatches.get(color);
    if (!batch) {
      batch = [];
      this.circleBatches.set(color, batch);
    }
    batch.push({ x, y, radius });
  }

  drawCircleOutline(x: number, y: number, radius: number, color: string, lineWidth: number = 2): void {
    let batch = this.outlineBatches.get(color);
    if (!batch) {
      batch = [];
      this.outlineBatches.set(color, batch);
    }
    batch.push({ x, y, radius, lineWidth });
  }

  // Must be called once per frame after all entities rendered
  flushBatches(): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = '';
    this.circleBatches.forEach((batch, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < batch.length; i++) {
        const c = batch[i];
        ctx.moveTo(c.x + c.radius, c.y);
        ctx.arc(c.x, c.y, c.radius, 0, Renderer.TWO_PI);
      }
      ctx.fill();
    });
    this.circleBatches.clear();
    
    ctx.strokeStyle = '';
    this.outlineBatches.forEach((batch, color) => {
      const byWidth = new Map<number, CircleOutlineBatch[]>();
      for (let i = 0; i < batch.length; i++) {
        const o = batch[i];
        let group = byWidth.get(o.lineWidth);
        if (!group) {
          group = [];
          byWidth.set(o.lineWidth, group);
        }
        group.push(o);
      }
      
      byWidth.forEach((group, lineWidth) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let i = 0; i < group.length; i++) {
          const o = group[i];
          ctx.moveTo(o.x + o.radius, o.y);
          ctx.arc(o.x, o.y, o.radius, 0, Renderer.TWO_PI);
        }
        ctx.stroke();
      });
    });
    this.outlineBatches.clear();
  }

  drawCircleImmediate(x: number, y: number, radius: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Renderer.TWO_PI);
    this.ctx.fill();
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number = 2): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.stroke();
  }

  drawArrow(x: number, y: number, angle: number, length: number, color: string = '#00CC00'): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const endX = x + cos * length;
    const endY = y + sin * length;
    
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    const headLength = 8;
    const headAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - headAngle),
      endY - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + headAngle),
      endY - headLength * Math.sin(angle + headAngle)
    );
    ctx.stroke();
  }

  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawText(text: string, x: number, y: number, color: string = '#FFFFFF', fontSize: number = 16): void {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }

  drawTextLeft(text: string, x: number, y: number, color: string = '#FFFFFF', fontSize: number = 16): void {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
  }

  drawPolygon(points: { x: number; y: number }[], color: string): void {
    if (points.length < 3) return;
    
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
