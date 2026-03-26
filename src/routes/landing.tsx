import { Hono } from 'hono'
import { raw } from 'hono/html'
import type { Bindings } from '../types'
import { getRingOrder, getActiveMembers } from '../data'
import Layout from '../templates/Layout'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  c.header('Cache-Control', 'public, max-age=300')
  const [order, active] = await Promise.all([
    getRingOrder(c.env.WEBRING),
    getActiveMembers(c.env.WEBRING),
  ])

  const activeSlugs = new Set(active.map((m) => m.slug))
  const ring = order.filter((s) => activeSlugs.has(s))
  const first = ring[0]
  const last = ring[ring.length - 1]

  return c.html(
    <Layout fullHeight>
      {raw(`<style>
        .landing { display: flex; flex: 1; min-height: 0; }
        .landing-left {
          flex: 0 0 42%;
          padding: 2.5rem 2.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e0ddd8;
        }
        .landing-headline {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 0.6rem;
        }
        .landing-tagline {
          font-size: 0.9rem;
          color: #888;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .ring-widget {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #999;
          padding: 0.7rem 0;
          margin-bottom: 1.75rem;
          border-bottom: 1px solid #e0ddd8;
        }
        .ring-widget a { color: #c22; text-decoration: none; }
        .ring-widget a:hover { opacity: 0.7; }
        .ring-dot { color: #ddd; }
        .members-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #aaa;
          margin-bottom: 0.6rem;
        }
        .member-list { list-style: none; padding-left: 0; }
        .member-list li {
          padding: 0.55rem 0;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .member-list li:first-child { border-top: 1px solid #eee; }
        .member-list-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1a1a1a;
          text-decoration: none;
        }
        .member-list-name:hover { color: #c22; }
        .member-list-meta {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          color: #aaa;
        }
        .join-block {
          margin-top: 1.5rem;
          padding: 1rem 1.1rem;
          background: #f3f1ed;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .join-block-text { font-size: 0.82rem; color: #666; }
        .join-block-text strong { color: #1a1a1a; font-weight: 600; }
        .join-block-link {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #c22;
          text-decoration: none;
          font-weight: 700;
        }
        .join-block-link:hover { opacity: 0.7; }
        .landing-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1.25rem 1.5rem;
          gap: 1rem;
        }
        .landing-right-placeholder {
          flex: 1;
          background: #f0eee9;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #bbb;
        }
        @media (prefers-color-scheme: dark) {
          .landing-left { border-right-color: #2a2927; }
          .landing-tagline { color: #777; }
          .ring-widget { border-bottom-color: #2a2927; color: #555; }
          .ring-widget a { color: #f55; }
          .ring-dot { color: #333; }
          .members-label { color: #555; }
          .member-list li { border-bottom-color: #2a2927; }
          .member-list li:first-child { border-top-color: #2a2927; }
          .member-list-name { color: #e0ddd8; }
          .member-list-name:hover { color: #f55; }
          .member-list-meta { color: #555; }
          .join-block { background: #1a1918; }
          .join-block-text { color: #888; }
          .join-block-text strong { color: #e0ddd8; }
          .join-block-link { color: #f55; }
          .landing-right-placeholder { background: #1a1918; color: #444; }
        }
        @media (max-width: 767px) {
          .landing { flex-direction: column; }
          .landing-left {
            flex: none;
            border-right: none;
            border-bottom: 1px solid #e0ddd8;
            padding: 1.5rem;
          }
          .landing-right { padding: 1rem; }
        }
      </style>`)}
      <div class="landing">
        <div class="landing-left">
          <h1 class="landing-headline">Canadian builders,<br />linked together</h1>
          <p class="landing-tagline">A webring for developers, designers, and founders sharing their work on the open web.</p>

          <div class="ring-widget">
            {last ? <a href={`/prev/${last}`}>← prev</a> : <span>← prev</span>}
            <span class="ring-dot">·</span>
            <span>ring navigation</span>
            <span class="ring-dot">·</span>
            {first ? <a href={`/next/${first}`}>next →</a> : <span>next →</span>}
          </div>

          <div class="members-label">Members</div>
          {active.length === 0 ? (
            <p>No members yet.</p>
          ) : (
            <ul class="member-list">
              {active.map((m) => (
                <li>
                  <a href={m.url} target="_blank" rel="noopener" class="member-list-name">{m.name}</a>
                  <span class="member-list-meta">{m.city ?? ''}{m.city ? ' · ' : ''}{m.type}</span>
                </li>
              ))}
            </ul>
          )}

          <div class="join-block">
            <div class="join-block-text">
              <strong>{active.length} member{active.length !== 1 ? 's' : ''}</strong> across Canada
            </div>
            <a href="/join" class="join-block-link">Join the ring →</a>
          </div>
        </div>

        <div class="landing-right">
          <div class="landing-right-placeholder">Flag + Map (next task)</div>
        </div>
      </div>
    </Layout>
  )
})

export default app
