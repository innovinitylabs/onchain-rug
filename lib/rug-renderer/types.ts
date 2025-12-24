/**
 * Types for rug rendering system
 * Supports both client-side (interactive) and server-side (OG) rendering
 */

export type RenderMode = 'interactive' | 'og'

export interface RugRenderParams {
  tokenId: number
  seed: number
  palette: {
    name: string
    colors: string[]
  }
  stripeData: Array<{
    y: number
    h: number
    pc: string
    sc?: string
    wt: string
    wv?: number
  }>
  textRows: string[]
  warpThickness: number
  characterMap: Record<string, string[]>
  // Dynamic traits (disabled in OG mode)
  textureLevel?: number
  dirtLevel?: number
  frameLevel?: string
  renderMode: RenderMode
}

export interface RugRenderResult {
  canvas: any // Canvas instance (browser Canvas or node-canvas)
  width: number
  height: number
}

