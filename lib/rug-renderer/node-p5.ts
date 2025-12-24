/**
 * Node.js-compatible p5.js implementation for server-side rendering
 * 
 * This provides the same API as the browser p5.js implementation
 * but uses node-canvas instead of browser Canvas API
 */

import { createCanvas, CanvasRenderingContext2D } from 'canvas'

export interface NodeP5Context {
  ctx: CanvasRenderingContext2D | null
  canvas: any | null
  width: number
  height: number
  fillStyle: string | null
  strokeStyle: string
  doFill: boolean
  doStroke: boolean
  blend: string
  stack: Array<{
    fillStyle: string | null
    strokeStyle: string
    doFill: boolean
    doStroke: boolean
    blend: string
    lineWidth: number
  }>
  pixelDensity: number
}

export function createNodeP5Context(): NodeP5Context {
  return {
    ctx: null,
    canvas: null,
    width: 0,
    height: 0,
    fillStyle: null,
    strokeStyle: '#000',
    doFill: true,
    doStroke: true,
    blend: 'source-over',
    stack: [],
    pixelDensity: 1
  }
}

export function createNodeCanvas(width: number, height: number, pixelDensity: number = 1): any {
  const canvas = createCanvas(Math.floor(width * pixelDensity), Math.floor(height * pixelDensity))
  return canvas
}

export function setupNodeP5API(p5: NodeP5Context, canvas: any, pixelDensity: number = 1): void {
  p5.canvas = canvas
  p5.width = canvas.width / pixelDensity
  p5.height = canvas.height / pixelDensity
  p5.ctx = canvas.getContext('2d')
  p5.pixelDensity = pixelDensity
  
  if (p5.ctx) {
    p5.ctx.setTransform(1, 0, 0, 1, 0, 0)
    p5.ctx.scale(pixelDensity, pixelDensity)
  }
}

// Helper functions for color conversion
function _hexToLevels(hex: string): [number, number, number, number] | null {
  let cleanHex = String(hex).replace('#', '').trim()
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('')
  }
  if (cleanHex.length !== 6) return null
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  return [r, g, b, 255]
}

export function color(r: any, g?: number, b?: number, a?: number): any {
  if (typeof r === 'object' && r !== null && 'levels' in r) {
    return r
  }
  if (typeof r === 'string') {
    const levels = _hexToLevels(r)
    if (levels) {
      const [nr, ng, nb, na] = levels
      return {
        levels: [nr, ng, nb, na],
        toString: () => na < 255 ? `rgba(${nr},${ng},${nb},${na / 255})` : `rgb(${nr},${ng},${nb})`
      }
    }
    const rgbaMatch = r.match(/rgba?\(([^)]+)\)/)
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(',').map(s => Number(s.trim()))
      const fr = parts[0] || 0
      const fg = parts[1] || 0
      const fb = parts[2] || 0
      const fa = parts[3] ? Math.round(255 * parts[3]) : 255
      return {
        levels: [fr, fg, fb, fa],
        toString: () => fa < 255 ? `rgba(${fr},${fg},${fb},${fa / 255})` : `rgb(${fr},${fg},${fb})`
      }
    }
    return { levels: [0, 0, 0, 255], toString: () => r }
  }
  if (g === undefined) g = r
  if (b === undefined) b = r
  if (a === undefined) a = 255
  return {
    levels: [r, g, b, a],
    toString: () => a < 255 ? `rgba(${r},${g},${b},${a / 255})` : `rgb(${r},${g},${b})`
  }
}

export function red(c: any): number {
  return c && c.levels ? c.levels[0] : 0
}

export function green(c: any): number {
  return c && c.levels ? c.levels[1] : 0
}

export function blue(c: any): number {
  return c && c.levels ? c.levels[2] : 0
}

export function lerp(start: number, stop: number, amt: number): number {
  return start + (stop - start) * amt
}

export function lerpColor(c1: any, c2: any, amt: number): any {
  const l1 = c1 && c1.levels ? c1.levels : [0, 0, 0, 255]
  const l2 = c2 && c2.levels ? c2.levels : [0, 0, 0, 255]
  return color(
    lerp(l1[0], l2[0], amt),
    lerp(l1[1], l2[1], amt),
    lerp(l1[2], l2[2], amt),
    Math.round(lerp(l1[3], l2[3], amt))
  )
}

export function map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
  return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2
}

export function constrain(n: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, n))
}

export const PI = Math.PI
export const HALF_PI = Math.PI / 2

export function sin(angle: number): number {
  return Math.sin(angle)
}

export function cos(angle: number): number {
  return Math.cos(angle)
}

export function max(...args: number[]): number {
  return Math.max(...args)
}

export function floor(n: number): number {
  return Math.floor(n)
}

