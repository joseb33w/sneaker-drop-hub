import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://xhhmxabftbyxrirvvihn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_NZHoIxqqpSvVBP8MrLHCYA_gmg1AbN-'
const RELEASES_TABLE = 'uNMexs7BYTXQ2_sneaker_drop_hub_releases'
const FAVORITES_TABLE = 'uNMexs7BYTXQ2_sneaker_drop_hub_favorites'
const APP_USERS_TABLE = 'uNMexs7BYTXQ2_sneaker_drop_hub_app_users'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const fallbackReleases = [
  {
    id: 'fallback-1',
    name: 'Nike Air Max Dn8 Photon Dust',
    brand: 'Nike',
    price: 190,
    release_date: '2026-03-24T10:00:00Z',
    image_url: 'https://picsum.photos/seed/nike-dn8/800/600'
  },
  {
    id: 'fallback-2',
    name: 'Adidas Samba OG Night Indigo',
    brand: 'Adidas',
    price: 110,
    release_date: '2026-03-27T10:00:00Z',
    image_url: 'https://picsum.photos/seed/adidas-samba/800/600'
  },
  {
    id: 'fallback-3',
    name: 'New Balance 9060 Sea Salt',
    brand: 'New Balance',
    price: 150,
    release_date: '2026-03-31T10:00:00Z',
    image_url: 'https://picsum.photos/seed/nb-9060/800/600'
  },
  {
    id: 'fallback-4',
    name: 'Nike Dunk Low Redwood',
    brand: 'Nike',
    price: 125,
    release_date: '2026-04-05T10:00:00Z',
    image_url: 'https://picsum.photos/seed/nike-dunk/800/600'
  },
  {
    id: 'fallback-5',
    name: 'Adidas Campus 00s Shadow Green',
    brand: 'Adidas',
    price: 100,
    release_date: '2026-04-10T10:00:00Z',
    image_url: 'https://picsum.photos/seed/adidas-campus/800/600'
  },
  {
    id: 'fallback-6',
    name: 'New Balance 1906R Silver Metallic',
    brand: 'New Balance',
    price: 165,
    release_date: '2026-04-17T10:00:00Z',
    image_url: 'https://picsum.photos/seed/nb-1906r/800/600'
  }
]

const state = {
  releases: [],
  favorites: new Set(),
  query: '',
  tab: 'all',
  loading: true,
  error: '',
  user: null,
  now: Date.now(),
  authBusy: false,
  authChecked: false
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
      const name = String(item.name || '').toLowerCase()
      const brand = String(item.brand || '').toLowerCase()
      const matchesSearch = !q || name.includes(q) || brand.includes(q)
      const matchesTab = state.tab === 'all' || state.favorites.has(item.id)
      return matchesSearch && matchesTab
    })
    .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
}

function sessionMarkup() {
  if (!state.user) return ''

  const email = escapeHtml(state.user.email || 'Signed in')
  const busyLabel = state.authBusy ? 'Signing out...' : 'Log out'

  return `
    <div class="session-actions">
      <div class="badge">${email}</div>
      <button id="logoutBtn" class="ghost-btn logout-btn" type="button" ${state.authBusy ? 'disabled' : ''}>${busyLabel}</button>
    </div>
  `
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
              and save favorites.
            </p>
            <div class="badge-row">
              <div class="badge">${total} upcoming releases</div>
              <div class="badge">${favoriteCount} favorites</div>
              <div class="badge">Live from Supabase</div>
            </div>
          </div>
          ${sessionMarkup()}
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

    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await logout()
      })
    }
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
  state.loading = true
  state.error = ''
  render()

  try {
    const { data, error } = await supabase
      .from(RELEASES_TABLE)
      .select('*')
      .order('release_date', { ascending: true })

    if (error) throw error

    state.releases = Array.isArray(data) && data.length ? data : fallbackReleases
  } catch (error) {
    state.error = error && error.message ? error.message : 'Unable to load releases.'
    state.releases = fallbackReleases
  } finally {
    state.loading = false
    render()
  }
}

async function toggleFavorite(releaseId) {
  try {
    if (!state.user) {
      window.location.href = './auth.html'
      return
    }

    const isActive = state.favorites.has(releaseId)

    if (isActive) {
      const { error } = await supabase
        .from(FAVORITES_TABLE)
        .delete()
        .eq('release_id', releaseId)

      if (error) throw error
      state.favorites.delete(releaseId)
    } else {
      const { error } = await supabase
        .from(FAVORITES_TABLE)
        .insert({ release_id: releaseId })

      if (error) throw error
      state.favorites.add(releaseId)
    }

    render()
  } catch (error) {
    console.error('Favorite toggle error:', error && error.message ? error.message : error)
  }
}

async function logout() {
  if (state.authBusy) return

  state.authBusy = true
  render()

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    state.user = null
    state.favorites = new Set()
    if (state.tab === 'favorites') {
      state.tab = 'all'
    }
  } catch (error) {
    console.error('Logout error:', error && error.message ? error.message : error)
  } finally {
    state.authBusy = false
    render()
  }
}

async function syncAuth() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      const message = error && error.message ? error.message : ''
      if (!message.toLowerCase().includes('auth session missing')) {
        console.error('Auth lookup error:', message || error)
      }
      state.user = null
    } else {
      state.user = data?.user || null
      if (state.user) {
        await ensureAppUser(state.user)
      }
    }
  } catch (error) {
    console.error('Auth sync error:', error && error.message ? error.message : error)
    state.user = null
  } finally {
    state.authChecked = true
    await loadFavorites()
    render()
  }
}

function startClock() {
  setInterval(() => {
    state.now = Date.now()
    render()
  }, 60000)
}

async function init() {
  try {
    render()
    await syncAuth()
    await loadReleases()
    startClock()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      state.user = session?.user || null
      if (state.user) {
        await ensureAppUser(state.user)
      }
      await loadFavorites()
      if (!state.user && state.tab === 'favorites') {
        state.tab = 'all'
      }
      render()
    })
  } catch (error) {
    console.error('Init error:', error && error.message ? error.message : error)
    state.error = 'App failed to initialize.'
    state.loading = false
    render()
  }
}

init()
