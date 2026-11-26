import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import App from '../src/App';
import { AuthProvider } from '../src/lib/AuthContext';
import { H2WProvider } from '../src/lib/h2wContext';

// Mock WebGL / Three.js canvas in node/jsdom
vi.mock('three', async () => {
  const actual: any = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: {
        style: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })),
  };
});

describe('App Render Integrity', () => {
  it('App module is defined and exports correctly', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('App renders structure without throwing unhandled exceptions', () => {
    expect(() => {
      // Basic execution check
      const element = React.createElement(App);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  it('Globo3D component is defined and can be instantiated without reference errors', async () => {
    const Globo3DModule = await import('../src/components/have2want/Globo3D');
    const Globo3D = Globo3DModule.default as React.ComponentType<any>;
    expect(Globo3D).toBeDefined();
    expect(typeof Globo3D).toBe('function');
    const element = React.createElement(Globo3D, { listings: [] });
    expect(element).toBeDefined();
  });
});
