// Setup globale per ambiente di test
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockLocalStorage = new LocalStorageMock();

if (typeof global.window === 'undefined') {
  (global as any).window = global;
}

if (!(global.window as any).location) {
  (global.window as any).location = { href: 'http://localhost:3000', origin: 'http://localhost:3000' };
}
(global as any).location = (global.window as any).location;

if (typeof (global.window as any).addEventListener === 'undefined') {
  (global.window as any).addEventListener = () => {};
  (global.window as any).removeEventListener = () => {};
}

(global as any).localStorage = mockLocalStorage;
(global.window as any).localStorage = mockLocalStorage;

if (typeof global.navigator === 'undefined') {
  (global as any).navigator = {
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36',
    language: 'it-IT',
  };
}

// Mock Canvas 2D per il test di rendering texture geopolitica in Node
if (typeof global.document === 'undefined') {
  const mockContext2D = {
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    strokeText: () => {},
    arc: () => {},
    save: () => {},
    restore: () => {},
    setLineDash: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    drawImage: () => {},
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    shadowColor: '',
    shadowBlur: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
  };

  const mockElement = {
    appendChild: () => {},
    removeChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    style: {},
  };

  (global as any).document = {
    head: mockElement,
    body: mockElement,
    documentElement: mockElement,
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          ...mockElement,
          width: 2048,
          height: 1024,
          getContext: () => mockContext2D,
        };
      }
      return { ...mockElement };
    },
    getElementsByTagName: (tag: string) => [mockElement],
    querySelector: () => mockElement,
    querySelectorAll: () => [mockElement],
    getElementById: () => mockElement,
    createTextNode: (text: string) => ({ textContent: text }),
  };
}
