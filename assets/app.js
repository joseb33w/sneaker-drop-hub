import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://xhhmxabftbyxrirvvihn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_NZHoIxqqpSvVBP8MrLHCYA_gmg1AbN-'
const RELEASES_TABLE = 'uNMexs7BYTXQ2_sneaker-drop-hub_releases'
const FAVORITES_TABLE = 'uNMexs7BYTXQ2_sneaker-drop-hub_favorites'
const APP_USERS_TABLE = 'uNMexs7BYTXQ2_sneaker-drop-hub_app_users'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const state = {
  releases: [],
  favorites: new Set(),
  query: '',
  tab: 'all',
  loading: true,
  error: '',
  user: null,
  now: Date.now()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function formatDate(value) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function countdownText(value) {
  const diff = new Date(value).getTime() - state.now
  if (Number.isNaN(diff)) return 'Date unavailable'
  if (diff <= 0) return 'Released'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

function filteredReleases() {
  const q = state.query.trim().toLowerCase()
  return state.releases
    .filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q)
      const matchesTab = state.tab === 'all' || state.favorites.has(item.id)
      return matchesSearch && matchesTab
    })
    .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
}

function render() {
  const app = document.getElementById('app')
  const releases = filteredReleases()
  const total = state.releases.length
  const favoriteCount = state.favorites.size

  app.innerHTML = `
    <main class="app-shell">
      <section class="hero">
        <div class="hero-top">
          <div>
            <p class="eyebrow">Sneaker release tracker</p>
            <h1>Never miss the next drop.</h1>
            <p class="hero-copy">
              Browse upcoming sneaker releases, track countdowns in real time, search by brand or model,
              and save favorites. This repo now uses stable asset filenames so preview and GitHub hosting
              will not break from missing hashed bundles.
            </p>
            <div class="badge-row">
              <div class="badge">${total} upcoming releases</div>
              <div class="badge">${favoriteCount} favorites</div>
              <div class="badge">Live from Supabase</div>
            </div>
          </div>
        </div>

        <div class="controls">
          <label class="search-wrap" aria-label="Search sneakers">
            <span class="search-icon">Search</span>
            <input id="searchInput" class="search-input" type="text" placeholder="Search by sneaker or brand" value="${escapeHtml(state.query)}" />
          </label>

          <div class="tab-group" role="tablist" aria-label="Release tabs">
            <button class="tab-btn ${state.tab === 'all' ? 'active' : ''}" data-tab="all">All Releases</button>
            <button class="tab-btn ${state.tab === 'favorites' ? 'active' : ''}" data-tab="favorites">Favorites (${favoriteCount})</button>
          </div>

          <button class="sort-chip" type="button">Sorted by soonest drop</button>
        </div>
      </section>

      ${state.error ? `<section class="status error"><strong>Could not load live data.</strong><div class="footer-note">${escapeHtml(state.error)}</div></section>` : ''}
      ${state.loading ? `<section class="status">Loading releases...</section>` : ''}

      <section class="section-head">
        <div>
          <p class="eyebrow">Upcoming releases</p>
          <h2>${state.tab === 'favorites' ? 'Your saved favorites' : 'All upcoming drops'}</h2>
        </div>
        <div class="muted">${releases.length} item${releases.length === 1 ? '' : 's'} shown</div>
      </section>

      ${!state.loading && releases.length === 0 ? `
        <section class="empty">
          <h3>${state.tab === 'favorites' ? 'No favorites yet' : 'No releases found'}</h3>
          <p class="footer-note">Try switching to All Releases, clearing the search, or tapping the heart button on a sneaker card.</p>
        </section>
      ` : ''}

      <section class="grid">
        ${releases.map((item) => `
          <article class="card">
            <div class="card-media">
              <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" />
            </div>
            <div class="card-body">
              <div class="brand-row">
                <div class="brand-pill">${escapeHtml(item.brand)}</div>
                <button class="heart-btn ${state.favorites.has(item.id) ? 'active' : ''}" data-favorite-id="${item.id}" aria-label="Toggle favorite">
                  ${state.favorites.has(item.id) ? 'Loved' : 'Save'}
                </button>
              </div>
              <h3>${escapeHtml(item.name)}</h3>
              <p class="muted">Release countdown and pricing for the next confirmed launch.</p>
              <div class="meta-list">
                <div class="meta-item">
                  <span>Price</span>
                  <strong>${formatPrice(item.price)}</strong>
                </div>
                <div class="meta-item">
                  <span>Drop time</span>
                  <strong>${formatDate(item.release_date)}</strong>
                </div>
              </div>
              <div class="countdown">
                <div class="countdown-label">Countdown</div>
                <div class="countdown-value">${countdownText(item.release_date)}</div>
              </div>
            </div>
          </article>
        `).join('')}
      </section>

      <p class="footer-note">The old broken repo page was caused by a missing hashed JavaScript asset. This version removes that failure point.</p>
    </main>
  `

  bindEvents()
}

function bindEvents() {
  try {
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        state.query = event.target.value
        render()
      })
    }

    document.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        state.tab = button.getAttribute('data-tab')
        render()
      })
    })

    document.querySelectorAll('[data-favorite-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-favorite-id')
        await toggleFavorite(id)
      })
    })
  } catch (error) {
    console.error('Bind error:', error && error.message ? error.message : error)
  }
}

async function ensureAppUser(user) {
  try {
    if (!user) return
    const { data, error } = await supabase
      .from(APP_USERS_TABLE)
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (error) throw error

    if (!data || data.length === 0) {
      const { error: insertError } = await supabase.from(APP_USERS_TABLE).insert({
        email: user.email
      })
      if (insertError) throw insertError
    }
  } catch (error) {
    console.error('App user sync error:', error && error.message ? error.message : error)
  }
}

async function loadFavorites() {
  try {
    if (!state.user) {
      state.favorites = new Set()
      return
    }
    const { data, error } = await supabase
      .from(FAVORITES_TABLE)
      .select('release_id')
      .order('created_at', { ascending: false })

    if (error) throw error
    state.favorites = new Set((data || []).map((item) => item.release_id))
  } catch (error) {
    console.error('Favorites load error:', error && error.message ? error.message : error)
    state.favorites = new Set()
  }
}

async function loadReleases() {
  try {
    state.loading = true
    state.error = ''
    render()

    const { data, error } = await supabase
      .from(RELEASES_TABLE)
      .select('*')
      .order('release_date', { ascending: true })

    if (error) throw error
    state.releases = data || []
  } catch (error) {
    console.error('Release load error:', error && error.message ? error.message : error)
    state.error = error && error.message ? error.message : 'Unable to load releases from Supabase.'
    state.releases = []
  } finally {
    state.loading = false
    render()
  }
}

async function toggleFavorite(releaseId) {
  try {
    if (!state.user) {
      state.error = 'Sign in is required to save favorites. Releases are still visible without signing in.'
      render()
      return
    }

    if (state.favorites.has(releaseId)) {
      const { error } = await supabase
        .from(FAVORITES_TABLE)
        .delete()
        .eq('release_id', releaseId)
      if (error) throw error
      state.favorites.delete(releaseId)
    } else {
      const { error } = await supabase.from(FAVORITES_TABLE).insert({
        release_id: releaseId
      })
      if (error) throw error
      state.favorites.add(releaseId)
    }
    state.error = ''
    render()
  } catch (error) {
    console.error('Favorite toggle error:', error && error.message ? error.message : error)
    state.error = error && error.message ? error.message : 'Could not update favorites.'
    render()
  }
}

async function init() {
  try {
    const { data } = await supabase.auth.getUser()
    state.user = data && data.user ? data.user : null
    if (state.user) {
      await ensureAppUser(state.user)
    }
    await loadFavorites()
    await loadReleases()

    supabase.auth.onAuthStateChange(async function (_event, session) {
      try {
        state.user = session && session.user ? session.user : null
        if (state.user) {
          await ensureAppUser(state.user)
        }
        await loadFavorites()
        render()
      } catch (error) {
        console.error('Auth state error:', error && error.message ? error.message : error)
      }
    })

    setInterval(function () {
      state.now = Date.now()
      render()
    }, 60000)
  } catch (error) {
    console.error('Init error:', error && error.message ? error.message : error)
    state.loading = false
    state.error = error && error.message ? error.message : 'App initialization failed.'
    render()
  }
}

render()
init()
