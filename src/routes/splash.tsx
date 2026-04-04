import { Hono } from 'hono'
import { raw } from 'hono/html'
import type { Bindings, Member } from '../types'
import { getActiveMembers } from '../data'
import { CANADA_VIEWBOX, CANADA_OUTLINE_PATH, CANADA_REGION_PATHS, projectToSvg } from '../lib/canada-map'

const PANEL_NAMES = ['Splash', 'Map', 'Members', 'Ring + Stats', 'Join']

function SplashContent({ active }: { active: Member[] }) {
  return (
    <div class="splash-inner">
      <header>
        <h1 class="poster-text hero-top">
          <span class="stretch-wide">WEBRING</span>
          <span class="stretch-wide">FOR</span>
        </h1>
      </header>

      <div class="splash-map-wrap">
        <svg
          class="splash-map"
          viewBox={CANADA_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`Map of Canada showing ${active.filter(m => m.lat != null).length} member locations`}
        >
          <path d={CANADA_OUTLINE_PATH} class="splash-outline" />
          {active.map((m) => {
            if (m.lat == null || m.lng == null) return null
            const { x, y } = projectToSvg(m.lat, m.lng)
            return (
              <circle cx={x} cy={y} r="8" class="splash-dot">
                <title>{m.name}{m.city ? ` — ${m.city}` : ''}</title>
              </circle>
            )
          })}
        </svg>
      </div>

      <footer>
        <div class="hero-bottom">
          <div class="hero-bottom-inner">
            <h2 class="poster-text hero-bottom-text">
              {raw('<span class="flag-red">CA</span><span class="flag-white-outline">NA</span><span class="flag-red">DA</span>')}
            </h2>
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Flag_of_Canada_%28Pantone%29.svg" alt="Flag of Canada" class="canada-flag" />
          </div>
        </div>
      </footer>
    </div>
  )
}

function generateArcPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  // Arc curvature proportional to distance
  const sweep = dist * 0.3
  const mx = (x1 + x2) / 2 - (dy / dist) * sweep
  const my = (y1 + y2) / 2 + (dx / dist) * sweep
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`
}

function MapContent({ active }: { active: Member[] }) {
  const membersWithCoords = active.filter(m => m.lat != null && m.lng != null)
  const dots = membersWithCoords.map(m => ({
    ...m,
    ...projectToSvg(m.lat!, m.lng!),
  }))

  // Generate arcs between consecutive members (the ring path)
  const arcs: string[] = []
  for (let i = 0; i < dots.length; i++) {
    const a = dots[i]
    const b = dots[(i + 1) % dots.length]
    arcs.push(generateArcPath(a.x, a.y, b.x, b.y))
  }

  return (
    <div class="map-inner">
      <h2 class="map-title">Our Network</h2>
      <svg
        class="map-svg"
        viewBox={CANADA_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Interactive map of Canada showing ${dots.length} member locations connected by arcs`}
      >
        {/* Province outlines */}
        {CANADA_REGION_PATHS.map((region) => (
          <path d={region.d} class="map-region" data-region={region.postal}>
            <title>{region.name}</title>
          </path>
        ))}

        {/* Country outline */}
        <path d={CANADA_OUTLINE_PATH} class="map-outline" />

        {/* Connection arcs */}
        {arcs.map((d, i) => (
          <path d={d} class="map-arc" style={`animation-delay: ${i * 0.3}s`} />
        ))}

        {/* Member dots */}
        {dots.map((m, i) => (
          <g class="map-member" style={`animation-delay: ${i * 0.15}s`}>
            <circle cx={m.x} cy={m.y} r="12" class="map-dot-pulse" />
            <circle cx={m.x} cy={m.y} r="7" class="map-dot" data-slug={m.slug} />
            <text x={m.x} y={m.y - 18} class="map-label">{m.name}</text>
          </g>
        ))}
      </svg>
      <p class="map-subtitle">{dots.length} builders across Canada</p>
    </div>
  )
}

function RingStatsContent({ active }: { active: Member[] }) {
  const uniqueCities = new Set(active.map(m => m.city).filter(Boolean)).size
  const uniqueTypes = new Set(active.map(m => m.type)).size
  // Position members around a circle
  const ringRadius = 140
  const cx = 200
  const cy = 200

  return (
    <div class="ringstats-inner">
      <div class="ringstats-layout">
        {/* Ring visualization */}
        <div class="ringstats-ring-wrap">
          <svg class="ringstats-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={ringRadius} class="ringstats-circle" />
            <circle cx={cx} cy={cy} r={ringRadius - 2} class="ringstats-circle-glow" />

            {/* Connection lines + member nodes */}
            {active.map((m, i) => {
              const angle = (i / active.length) * Math.PI * 2 - Math.PI / 2
              const x = cx + Math.cos(angle) * ringRadius
              const y = cy + Math.sin(angle) * ringRadius
              const nextAngle = ((i + 1) / active.length) * Math.PI * 2 - Math.PI / 2
              const nx = cx + Math.cos(nextAngle) * ringRadius
              const ny = cy + Math.sin(nextAngle) * ringRadius
              const color = TYPE_COLORS[m.type] ?? TYPE_COLORS.other

              return (
                <g style={`animation-delay: ${i * 0.15}s`} class="ringstats-node">
                  {/* Arc segment between nodes */}
                  <path
                    d={`M${x},${y} A${ringRadius},${ringRadius} 0 0,1 ${nx},${ny}`}
                    class="ringstats-arc-segment"
                    style={`stroke: ${color}; animation-delay: ${i * 0.2}s`}
                  />
                  {/* Node */}
                  <circle cx={x} cy={y} r="18" class="ringstats-node-bg" style={`fill: ${color}`} />
                  <text x={x} y={y + 1} class="ringstats-node-initial">{m.name.charAt(0)}</text>
                  {/* Label */}
                  <text x={x} y={y + (y > cy ? 32 : -24)} class="ringstats-node-name">{m.name.split(' ')[0]}</text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Stats */}
        <div class="ringstats-stats">
          <div class="ringstats-stat">
            <span class="ringstats-stat-number" data-count={active.length}>{active.length}</span>
            <span class="ringstats-stat-label">Members</span>
          </div>
          <div class="ringstats-stat">
            <span class="ringstats-stat-number" data-count={uniqueCities}>{uniqueCities}</span>
            <span class="ringstats-stat-label">Cities</span>
          </div>
          <div class="ringstats-stat">
            <span class="ringstats-stat-number" data-count={uniqueTypes}>{uniqueTypes}</span>
            <span class="ringstats-stat-label">Disciplines</span>
          </div>
          <div class="ringstats-stat">
            <span class="ringstats-stat-number">∞</span>
            <span class="ringstats-stat-label">The Ring</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function JoinContent({ memberCount }: { memberCount: number }) {
  return (
    <div class="join-inner">
      <div class="join-content">
        <span class="join-eyebrow">Join the ring</span>
        <h2 class="join-headline">Want in?</h2>
        <p class="join-body">
          {memberCount} Canadian builders and counting.
          Add your site to the ring and be part of a community
          sharing their work on the open web.
        </p>
        <a href="/join" class="join-button">
          Learn how to join {raw('&rarr;')}
        </a>
      </div>
    </div>
  )
}

// Assign a unique accent color per member type
const TYPE_COLORS: Record<string, string> = {
  developer: '#2563EB',
  designer: '#9333EA',
  founder: '#059669',
  other: '#D97706',
}

function MembersContent({ active }: { active: Member[] }) {
  return (
    <div class="members-inner">
      <h2 class="members-title">The Ring</h2>
      <div class="members-grid">
        {active.map((m, i) => {
          const color = TYPE_COLORS[m.type] ?? TYPE_COLORS.other
          return (
            <a href={m.url} target="_blank" rel="noopener noreferrer" class="member-card" style={`--card-accent: ${color}; animation-delay: ${i * 0.1}s`}>
              <div class="member-card-color" style={`background: ${color}`}></div>
              <div class="member-card-body">
                <span class="member-card-name">{m.name}</span>
                <span class="member-card-meta">
                  {m.city && <span>{m.city}</span>}
                  <span class="member-card-badge" style={`color: ${color}`}>{m.type}</span>
                </span>
              </div>
              <span class="member-card-arrow">{raw('&rarr;')}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  c.header('Cache-Control', 'public, max-age=300')
  const active = await getActiveMembers(c.env.WEBRING)

  const dots = PANEL_NAMES.map((name, i) =>
    `<button class="ring-dot${i === 0 ? ' is-active' : ''}" data-dot="${i}" aria-label="Go to ${name}"></button>`
  ).join('')

  return c.html(
    <>
      {raw('<!DOCTYPE html>')}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>webring.ca</title>
          <meta name="description" content="A webring for Canadian builders — developers, designers, and founders." />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&amp;family=Space+Mono:wght@400;700&amp;display=swap" rel="stylesheet" />
          {raw(`<script>(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);window.__toggleTheme=function(){var d=document.documentElement,c=d.getAttribute('data-theme'),isDark=c?c==='dark':matchMedia('(prefers-color-scheme:dark)').matches,n=isDark?'light':'dark';d.setAttribute('data-theme',n);localStorage.setItem('theme',n)}})()</script>`)}
          <style>{raw(`
            :root {
              color-scheme: light;
              --bg: #fff;
              --fg: #1a1a1a;
              --fg-muted: #888;
              --fg-faint: #bbb;
              --border: #e0ddd8;
              --border-strong: #1a1a1a;
              --accent: #AF272F;
              --accent-light: #c22;
              --panel-alt: #f5f3f0;
            }
            @media (prefers-color-scheme: dark) {
              :root:not([data-theme="light"]) {
                color-scheme: dark;
                --bg: #111110;
                --fg: #e0ddd8;
                --fg-muted: #666;
                --fg-faint: #444;
                --border: #2a2927;
                --border-strong: #e0ddd8;
                --accent: #AF272F;
                --accent-light: #f55;
                --panel-alt: #1a1918;
              }
            }
            [data-theme="dark"] {
              color-scheme: dark;
              --bg: #111110;
              --fg: #e0ddd8;
              --fg-muted: #666;
              --fg-faint: #444;
              --border: #2a2927;
              --border-strong: #e0ddd8;
              --accent: #AF272F;
              --accent-light: #f55;
              --panel-alt: #1a1918;
            }

            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

            body {
              font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
              -webkit-font-smoothing: antialiased;
              color: var(--fg);
              background: var(--bg);
              overflow: hidden;
              height: 100vh;
              width: 100vw;
              margin: 0;
            }

            /* ── Ring container ── */
            .ring {
              position: fixed;
              inset: 0;
              overflow: hidden;
              width: 100vw;
              height: 100vh;
            }

            .ring-track {
              display: flex;
              flex-direction: row;
              flex-wrap: nowrap;
              height: 100%;
            }

            /* ── Panels ── */
            .panel {
              flex: 0 0 100vw;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--bg);
            }

            .panel--alt { background: var(--panel-alt); }

            /* ── Panel 1: Splash ── */
            .splash-inner {
              width: calc(100% - 5rem);
              height: calc(100% - 5rem);
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              user-select: none;
            }

            .poster-text {
              line-height: 0.72;
              letter-spacing: -0.05em;
              text-transform: uppercase;
              font-weight: 900;
            }

            .stretch-wide { display: block; }

            .hero-top {
              font-size: 11vw;
              color: var(--fg);
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }

            .hero-bottom { width: 100%; container-type: inline-size; }

            .hero-bottom-inner {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 2cqw;
            }

            .hero-bottom-text {
              font-size: 14cqw;
              line-height: 0.75;
              white-space: nowrap;
            }

            .canada-flag {
              height: 10cqw;
              width: auto;
              flex-shrink: 0;
            }

            .flag-red { color: var(--accent); }

            .flag-white-outline {
              color: transparent;
              -webkit-text-stroke: 4px var(--accent);
            }

            .splash-map-wrap {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }

            .splash-map {
              width: 80vw;
              max-width: 1100px;
              height: auto;
            }

            .splash-outline {
              fill: none;
              stroke: var(--border);
              stroke-width: 1.5;
              stroke-linejoin: round;
            }

            .splash-dot {
              fill: var(--accent);
              opacity: 0.7;
            }

            /* ── Panel 2: Animated Map ── */
            .map-inner {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 3rem;
              gap: 1.5rem;
            }

            .map-title {
              font-size: 1rem;
              font-family: 'Space Mono', monospace;
              font-weight: 400;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              color: var(--fg-muted);
            }

            .map-subtitle {
              font-family: 'Space Mono', monospace;
              font-size: 0.8rem;
              color: var(--fg-muted);
              letter-spacing: 0.05em;
            }

            .map-svg {
              width: 90%;
              max-width: 900px;
              height: auto;
              flex-shrink: 0;
            }

            .map-region {
              fill: none;
              stroke: var(--border);
              stroke-width: 0.5;
              stroke-linejoin: round;
              transition: fill 0.3s;
            }

            .map-region:hover {
              fill: var(--border);
              opacity: 0.3;
            }

            .map-outline {
              fill: none;
              stroke: var(--fg-muted);
              stroke-width: 1;
              stroke-linejoin: round;
            }

            .map-arc {
              fill: none;
              stroke: var(--accent);
              stroke-width: 1.5;
              stroke-dasharray: 6 4;
              opacity: 0;
              animation: arc-draw 0.8s ease-out forwards;
            }

            @keyframes arc-draw {
              from { opacity: 0; stroke-dashoffset: 200; }
              to { opacity: 0.4; stroke-dashoffset: 0; }
            }

            .map-member {
              opacity: 0;
              animation: dot-appear 0.5s ease-out forwards;
            }

            @keyframes dot-appear {
              from { opacity: 0; transform: scale(0); }
              to { opacity: 1; transform: scale(1); }
            }

            .map-dot {
              fill: var(--accent);
              cursor: pointer;
              transition: transform 0.2s ease;
              transform-origin: center;
              transform-box: fill-box;
            }

            .map-dot:hover { transform: scale(1.4); }

            .map-dot-pulse {
              fill: var(--accent);
              opacity: 0;
              animation: pulse 2.5s ease-out infinite;
            }

            @keyframes pulse {
              0% { opacity: 0.4; r: 7; }
              100% { opacity: 0; r: 22; }
            }

            .map-label {
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              fill: var(--fg);
              text-anchor: middle;
              pointer-events: none;
              opacity: 0.8;
            }

            /* ── Panel 3: Member Showcase ── */
            .members-inner {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 3rem;
              gap: 2rem;
            }

            .members-title {
              font-size: 1rem;
              font-family: 'Space Mono', monospace;
              font-weight: 400;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              color: var(--fg-muted);
            }

            .members-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 1.25rem;
              max-width: 800px;
              width: 100%;
            }

            .member-card {
              display: flex;
              flex-direction: column;
              border: 1px solid var(--border);
              border-radius: 8px;
              overflow: hidden;
              text-decoration: none;
              color: var(--fg);
              transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
              opacity: 0;
              animation: card-in 0.4s ease-out forwards;
            }

            @keyframes card-in {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }

            .member-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 8px 24px rgba(0,0,0,0.08);
              border-color: var(--card-accent);
            }

            .member-card-color {
              height: 6px;
              width: 100%;
            }

            .member-card-body {
              padding: 1.25rem 1rem 1rem;
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              flex: 1;
            }

            .member-card-name {
              font-size: 1.1rem;
              font-weight: 700;
              letter-spacing: -0.02em;
            }

            .member-card-meta {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.8rem;
              color: var(--fg-muted);
            }

            .member-card-badge {
              font-family: 'Space Mono', monospace;
              font-size: 0.7rem;
              font-weight: 700;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }

            .member-card-arrow {
              padding: 0.75rem 1rem;
              text-align: right;
              font-size: 1.2rem;
              color: var(--fg-faint);
              transition: color 0.2s;
            }

            .member-card:hover .member-card-arrow {
              color: var(--card-accent);
            }

            @media (max-width: 767px) {
              .members-grid {
                grid-template-columns: 1fr;
                max-width: 400px;
              }
            }

            /* ── Panel 4: Ring + Stats ── */
            .ringstats-inner {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 3rem;
            }

            .ringstats-layout {
              display: flex;
              align-items: center;
              gap: 5rem;
              max-width: 900px;
            }

            .ringstats-ring-wrap {
              flex-shrink: 0;
            }

            .ringstats-svg {
              width: 360px;
              height: 360px;
            }

            .ringstats-circle {
              fill: none;
              stroke: var(--border);
              stroke-width: 1;
            }

            .ringstats-circle-glow {
              fill: none;
              stroke: var(--accent);
              stroke-width: 0.5;
              opacity: 0.2;
            }

            .ringstats-arc-segment {
              fill: none;
              stroke-width: 3;
              opacity: 0;
              animation: arc-segment-in 0.6s ease-out forwards;
            }

            @keyframes arc-segment-in {
              from { opacity: 0; }
              to { opacity: 0.6; }
            }

            .ringstats-node {
              opacity: 0;
              animation: dot-appear 0.5s ease-out forwards;
            }

            .ringstats-node-bg {
              opacity: 0.9;
              transition: transform 0.2s;
              transform-origin: center;
              transform-box: fill-box;
              cursor: pointer;
            }

            .ringstats-node-bg:hover { transform: scale(1.15); }

            .ringstats-node-initial {
              fill: #fff;
              font-family: 'Space Grotesk', sans-serif;
              font-size: 14px;
              font-weight: 700;
              text-anchor: middle;
              dominant-baseline: central;
              pointer-events: none;
            }

            .ringstats-node-name {
              fill: var(--fg);
              font-family: 'Space Mono', monospace;
              font-size: 9px;
              text-anchor: middle;
              pointer-events: none;
              opacity: 0.7;
            }

            .ringstats-stats {
              display: flex;
              flex-direction: column;
              gap: 2.5rem;
            }

            .ringstats-stat {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
            }

            .ringstats-stat-number {
              font-size: 4rem;
              font-weight: 800;
              letter-spacing: -0.04em;
              line-height: 1;
              color: var(--fg);
            }

            .ringstats-stat-label {
              font-family: 'Space Mono', monospace;
              font-size: 0.75rem;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--fg-muted);
            }

            @media (max-width: 767px) {
              .ringstats-layout {
                flex-direction: column;
                gap: 2rem;
              }
              .ringstats-svg { width: 280px; height: 280px; }
              .ringstats-stats {
                flex-direction: row;
                flex-wrap: wrap;
                gap: 1.5rem;
                justify-content: center;
              }
              .ringstats-stat { align-items: center; }
              .ringstats-stat-number { font-size: 2.5rem; }
            }

            /* ── Panel 5: Join CTA ── */
            .join-inner {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 3rem;
            }

            .join-content {
              max-width: 480px;
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              text-align: center;
              align-items: center;
            }

            .join-eyebrow {
              font-family: 'Space Mono', monospace;
              font-size: 0.75rem;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              color: var(--fg-muted);
            }

            .join-headline {
              font-size: 5rem;
              font-weight: 800;
              letter-spacing: -0.04em;
              line-height: 1;
              color: var(--fg);
            }

            .join-body {
              font-size: 1.15rem;
              line-height: 1.6;
              color: var(--fg-muted);
              max-width: 36ch;
            }

            .join-button {
              display: inline-block;
              padding: 0.85rem 2rem;
              font-family: 'Space Grotesk', sans-serif;
              font-size: 1rem;
              font-weight: 600;
              color: #fff;
              background: var(--accent);
              border: none;
              border-radius: 6px;
              text-decoration: none;
              transition: opacity 0.2s, transform 0.2s;
            }

            .join-button:hover {
              opacity: 0.85;
              transform: translateY(-2px);
            }

            .join-button:visited { color: #fff; }

            /* ── Dot indicators ── */
            .ring-dots {
              position: fixed;
              bottom: 2rem;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 0.75rem;
              z-index: 100;
            }

            .ring-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
              border: 1.5px solid var(--fg-muted);
              background: transparent;
              cursor: pointer;
              padding: 0;
              transition: background 0.2s, border-color 0.2s, transform 0.2s;
            }

            .ring-dot:hover {
              border-color: var(--fg);
              transform: scale(1.3);
            }

            .ring-dot.is-active {
              background: var(--fg);
              border-color: var(--fg);
            }

            /* ── Theme toggle ── */
            .theme-toggle {
              position: fixed;
              top: 1.5rem;
              right: 1.5rem;
              z-index: 100;
              background: none;
              border: 1.5px solid var(--border-strong);
              border-radius: 50%;
              width: 36px;
              height: 36px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--fg);
              transition: opacity 0.2s;
            }
            .theme-toggle:hover { opacity: 0.6; }

            .theme-icon-sun, .theme-icon-moon { width: 16px; height: 16px; }
            .theme-icon-sun { display: none; }
            @media (prefers-color-scheme: dark) {
              :root:not([data-theme="light"]) .theme-icon-sun { display: block; }
              :root:not([data-theme="light"]) .theme-icon-moon { display: none; }
            }
            [data-theme="dark"] .theme-icon-sun { display: block !important; }
            [data-theme="dark"] .theme-icon-moon { display: none !important; }
            [data-theme="light"] .theme-icon-sun { display: none !important; }
            [data-theme="light"] .theme-icon-moon { display: block !important; }

            /* ── Scroll hint ── */
            .scroll-hint {
              position: fixed;
              bottom: 4.5rem;
              left: 50%;
              transform: translateX(-50%);
              font-family: 'Space Mono', monospace;
              font-size: 0.7rem;
              color: var(--fg-faint);
              letter-spacing: 0.08em;
              text-transform: uppercase;
              z-index: 100;
              opacity: 1;
              transition: opacity 0.6s;
            }
            .scroll-hint.is-hidden { opacity: 0; pointer-events: none; }

            /* ── Mobile: vertical stack ── */
            @media (max-width: 767px) {
              body { overflow: auto; height: auto; }

              .ring {
                position: static;
                overflow: visible;
                width: 100%;
                height: auto;
              }

              .ring-track { flex-direction: column; }

              .panel {
                flex: 0 0 auto;
                width: 100%;
                height: auto;
                min-height: 100vh;
              }

              .panel--clone { display: none; }
              .ring-dots { display: none; }
              .scroll-hint { display: none; }

              .splash-inner {
                width: calc(100% - 2.5rem);
                height: calc(100% - 2.5rem);
                min-height: calc(100vh - 2.5rem);
              }

              .hero-top { font-size: 16vw; }
              .flag-white-outline { -webkit-text-stroke: 2px var(--accent); }
            }
          `)}</style>
        </head>
        <body>
          <div id="ring" class="ring">
            <div class="ring-track">
              {/* Clone of last panel (Join) for backward cycling */}
              <section class="panel panel--clone" aria-hidden="true">
                <JoinContent memberCount={active.length} />
              </section>

              {/* Panel 1: Splash */}
              <section class="panel" data-index="0" aria-label="Splash section">
                <SplashContent active={active} />
              </section>

              {/* Panel 2: Animated Map */}
              <section class="panel panel--alt" data-index="1" aria-label="Map section">
                <MapContent active={active} />
              </section>

              {/* Panel 3: Member Showcase */}
              <section class="panel" data-index="2" aria-label="Members section">
                <MembersContent active={active} />
              </section>

              {/* Panel 4: Ring + Stats */}
              <section class="panel panel--alt" data-index="3" aria-label="Ring + Stats section">
                <RingStatsContent active={active} />
              </section>

              {/* Panel 5: Join CTA */}
              <section class="panel" data-index="4" aria-label="Join section">
                <JoinContent memberCount={active.length} />
              </section>

              {/* Clone of first panel (Splash) for forward cycling */}
              <section class="panel panel--clone" aria-hidden="true">
                <SplashContent active={active} />
              </section>
            </div>
            <nav class="ring-dots" aria-label="Panel navigation">
              {raw(dots)}
            </nav>
          </div>

          <div class="scroll-hint" id="scroll-hint">Scroll to explore</div>

          {raw(`<button class="theme-toggle" onclick="__toggleTheme()" aria-label="Toggle theme"><svg class="theme-icon-moon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><svg class="theme-icon-sun" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></button>`)}

          {raw(`<script>
(function() {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (isMobile) return;

  const ring = document.getElementById('ring');
  const dots = document.querySelectorAll('.ring-dot');
  const hint = document.getElementById('scroll-hint');
  const PANEL_COUNT = ${PANEL_NAMES.length};
  const CLONE_BEFORE = 1;
  let panelW = window.innerWidth;

  // Scroll state — target-based smooth scrolling
  let targetPos = CLONE_BEFORE * panelW;
  let currentPos = targetPos;
  let hasScrolled = false;

  // Tuning
  const SCROLL_EASE = 0.12;

  ring.scrollLeft = currentPos;

  // ── Wheel handler ──
  ring.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetPos += e.deltaY;

    if (!hasScrolled) {
      hasScrolled = true;
      hint.classList.add('is-hidden');
    }
  }, { passive: false });

  // ── Dot click handler ──
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-dot'), 10);
      targetPos = (CLONE_BEFORE + idx) * panelW;
    });
  });

  // ── Keyboard navigation ──
  document.addEventListener('keydown', (e) => {
    let currentIdx, nextIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      currentIdx = Math.round((currentPos - CLONE_BEFORE * panelW) / panelW);
      nextIdx = (currentIdx + 1) % PANEL_COUNT;
      targetPos = (CLONE_BEFORE + nextIdx) * panelW;
      if (!hasScrolled) { hasScrolled = true; hint.classList.add('is-hidden'); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      currentIdx = Math.round((currentPos - CLONE_BEFORE * panelW) / panelW);
      nextIdx = (currentIdx - 1 + PANEL_COUNT) % PANEL_COUNT;
      targetPos = (CLONE_BEFORE + nextIdx) * panelW;
      if (!hasScrolled) { hasScrolled = true; hint.classList.add('is-hidden'); }
    }
  });

  // ── Animation loop ──
  let running = true;

  function tick() {
    if (!running) { requestAnimationFrame(tick); return; }

    // Cycle: wrap target and current together
    const realStart = CLONE_BEFORE * panelW;
    const realEnd = realStart + PANEL_COUNT * panelW;

    if (targetPos >= realEnd) {
      const shift = PANEL_COUNT * panelW;
      targetPos -= shift;
      currentPos -= shift;
    } else if (targetPos < realStart) {
      const shift = PANEL_COUNT * panelW;
      targetPos += shift;
      currentPos += shift;
    }

    // Smooth interpolation — currentPos eases toward targetPos
    const diff = targetPos - currentPos;
    if (Math.abs(diff) > 0.5) {
      currentPos += diff * SCROLL_EASE;
    } else {
      currentPos = targetPos;
    }

    ring.scrollLeft = currentPos;

    // Update dots
    const rawIdx = Math.round((currentPos - realStart) / panelW);
    const activeIdx = ((rawIdx % PANEL_COUNT) + PANEL_COUNT) % PANEL_COUNT;
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === activeIdx);
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // ── Pause when tab hidden ──
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
  });

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    if (window.matchMedia('(max-width: 767px)').matches) return;

    const idx = Math.round((currentPos - CLONE_BEFORE * panelW) / panelW);
    panelW = window.innerWidth;
    currentPos = (CLONE_BEFORE + idx) * panelW;
    targetPos = currentPos;
    ring.scrollLeft = currentPos;
  });
})();
</script>`)}
        </body>
      </html>
    </>
  )
})

export default app
