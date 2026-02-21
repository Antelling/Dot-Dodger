export interface ToastMessage {
  id: number;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: number;
  duration: number;
}

export class ToastManager {
  private toasts: ToastMessage[] = [];
  private allMessages: ToastMessage[] = [];
  private container: HTMLElement;
  private errorOverlay: HTMLElement | null = null;
  private nextId: number = 0;
  private readonly maxToasts: number = 5;
  private readonly defaultDuration: number = 3000;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
      pointer-events: none;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(this.container);
  }

  show(text: string, type: ToastMessage['type'] = 'info', duration?: number): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      text,
      type,
      createdAt: Date.now(),
      duration: duration ?? this.defaultDuration
    };

    this.toasts.push(toast);
    this.allMessages.push(toast);

    if (this.allMessages.length > 100) {
      this.allMessages = this.allMessages.slice(-50);
    }

    if (this.toasts.length > this.maxToasts) {
      const removed = this.toasts.shift();
      if (removed) {
        this.removeToastElement(removed.id);
      }
    }

    this.renderToast(toast);
    this.scheduleRemoval(toast);
  }

  private renderToast(toast: ToastMessage): void {
    const element = document.createElement('div');
    element.id = `toast-${toast.id}`;
    
    const colors = this.getColorsForType(toast.type);
    
    element.style.cssText = `
      background: ${colors.background};
      color: ${colors.text};
      padding: 10px 16px;
      border-radius: 4px;
      font-size: 14px;
      max-width: 280px;
      word-wrap: break-word;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border-left: 3px solid ${colors.border};
    `;
    element.textContent = toast.text;

    this.container.appendChild(element);

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
    });
  }

  private getColorsForType(type: ToastMessage['type']): { background: string; text: string; border: string } {
    switch (type) {
      case 'success':
        return {
          background: 'rgba(0, 100, 0, 0.9)',
          text: '#90EE90',
          border: '#00FF00'
        };
      case 'warning':
        return {
          background: 'rgba(100, 80, 0, 0.9)',
          text: '#FFE4B5',
          border: '#FFD700'
        };
      case 'error':
        return {
          background: 'rgba(100, 0, 0, 0.9)',
          text: '#FFB6C1',
          border: '#FF4444'
        };
      case 'info':
      default:
        return {
          background: 'rgba(30, 30, 30, 0.9)',
          text: '#E0E0E0',
          border: '#888888'
        };
    }
  }

  private scheduleRemoval(toast: ToastMessage): void {
    setTimeout(() => {
      this.removeToast(toast.id);
    }, toast.duration);
  }

  private removeToast(id: number): void {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      this.toasts.splice(index, 1);
      this.removeToastElement(id);
    }
  }

  private removeToastElement(id: number): void {
    const element = document.getElementById(`toast-${id}`);
    if (element) {
      element.style.opacity = '0';
      element.style.transform = 'translateX(20px)';
      setTimeout(() => {
        element.remove();
      }, 300);
    }
  }

  clear(): void {
    this.toasts.forEach(toast => {
      this.removeToastElement(toast.id);
    });
    this.toasts = [];
    this.allMessages = [];
  }

  getRecentMessages(count: number = 5): ToastMessage[] {
    return this.toasts.slice(-count);
  }

  getAllMessages(): ToastMessage[] {
    return this.allMessages;
  }

  setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      const stack = event.error?.stack ?? 'No stack trace available';
      this.showFatalError('Runtime Error', event.message, stack, event.filename, event.lineno, event.colno);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? (error.stack ?? 'No stack trace available') : 'No stack trace available';
      this.showFatalError('Unhandled Promise Rejection', message, stack);
    });
  }

  private showFatalError(title: string, message: string, stack: string, filename?: string, lineno?: number, colno?: number): void {
    if (this.errorOverlay) return;

    this.errorOverlay = document.createElement('div');
    this.errorOverlay.id = 'fatal-error-overlay';
    this.errorOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 40px;
      box-sizing: border-box;
      font-family: 'Courier New', monospace;
      overflow-y: auto;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      max-width: 900px;
      width: 100%;
      background: #1a1a1a;
      border: 2px solid #ff4444;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 0 30px rgba(255, 68, 68, 0.3);
    `;

    const header = document.createElement('h1');
    header.textContent = '⚠️ ' + title;
    header.style.cssText = `
      color: #ff4444;
      margin: 0 0 20px 0;
      font-size: 24px;
      font-family: Arial, sans-serif;
    `;

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      color: #ffffff;
      font-size: 16px;
      margin-bottom: 10px;
      padding: 10px;
      background: rgba(255, 68, 68, 0.1);
      border-radius: 4px;
      font-family: Arial, sans-serif;
    `;

    content.appendChild(header);
    content.appendChild(messageDiv);

    if (filename) {
      const locationDiv = document.createElement('div');
      locationDiv.textContent = `Location: ${filename}:${lineno ?? '?'}:${colno ?? '?'}`;
      locationDiv.style.cssText = `
        color: #aaaaaa;
        font-size: 12px;
        margin-bottom: 20px;
        font-family: Arial, sans-serif;
      `;
      content.appendChild(locationDiv);
    }

    const stackHeader = document.createElement('div');
    stackHeader.textContent = 'Stack Trace:';
    stackHeader.style.cssText = `
      color: #ff8844;
      font-size: 14px;
      margin: 20px 0 10px 0;
      font-weight: bold;
      font-family: Arial, sans-serif;
    `;
    content.appendChild(stackHeader);

    const stackTrace = document.createElement('pre');
    stackTrace.textContent = stack;
    stackTrace.style.cssText = `
      color: #cccccc;
      font-size: 12px;
      line-height: 1.5;
      background: #0a0a0a;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #333;
      margin: 0;
    `;
    content.appendChild(stackTrace);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 20px;
    `;

    const reloadButton = document.createElement('button');
    reloadButton.textContent = '🔄 Reload Game';
    reloadButton.style.cssText = `
      padding: 12px 24px;
      font-size: 14px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: Arial, sans-serif;
      font-weight: bold;
    `;
    reloadButton.onmouseover = () => reloadButton.style.background = '#ff6666';
    reloadButton.onmouseout = () => reloadButton.style.background = '#ff4444';
    reloadButton.onclick = () => window.location.reload();

    const copyButton = document.createElement('button');
    copyButton.textContent = '📋 Copy Error';
    copyButton.style.cssText = `
      padding: 12px 24px;
      font-size: 14px;
      background: #444444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: Arial, sans-serif;
      font-weight: bold;
    `;
    copyButton.onmouseover = () => copyButton.style.background = '#555555';
    copyButton.onmouseout = () => copyButton.style.background = '#444444';
    copyButton.onclick = () => {
      const fullError = `${title}\n${message}\n${filename ? `Location: ${filename}:${lineno}:${colno}\n` : ''}\nStack Trace:\n${stack}`;
      navigator.clipboard.writeText(fullError).then(() => {
        copyButton.textContent = '✅ Copied!';
        setTimeout(() => copyButton.textContent = '📋 Copy Error', 2000);
      });
    };

    buttonContainer.appendChild(reloadButton);
    buttonContainer.appendChild(copyButton);
    content.appendChild(buttonContainer);

    this.errorOverlay.appendChild(content);
    document.body.appendChild(this.errorOverlay);

    console.error(`[FATAL ERROR] ${title}:`, message, '\nStack:', stack);
  }
}

export const toastManager = new ToastManager();
