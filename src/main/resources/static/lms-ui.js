const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed']

const STATUS_COLORS = {
  'Not Started': '#6b7280',
  'In Progress': '#F59E0B',
  'Completed': '#22c55e',
}

let allCourses = []

export function renderLMS(root, api) {
  const state = {
    courses: [],
    loading: false,
    error: null,
    success: null,
    editingId: null,
    submitting: false,
    form: { name: '', description: '', target_date: '', status: 'Not Started' },
    formErrors: {},
  }

  root.innerHTML = buildShell()
  bindEvents(root, state, api)

  loadCourses(root, state, api)
}

/* ---------- HTML templates ---------- */

function buildShell() {
  return `
    <div class="lms">
      <header class="lms-header">
        <div class="lms-header-inner">
          <h1 class="lms-title">CodeCraftHub<span class="lms-title-accent">: Your Learning Management Platform</span></h1>
          <p class="lms-subtitle">Plan, track, and complete your learning journey</p>
        </div>
      </header>

      <main class="lms-main">
        <section class="lms-card">
          <h2 class="section-heading">Add New Course</h2>
          <form id="courseForm" class="course-form" novalidate>
            <div class="form-row">
              <label class="form-field">
                <span class="form-label">Course Name</span>
                <input type="text" name="name" placeholder="e.g. Introduction to Python" autocomplete="off" />
                <span class="form-error" data-error="name"></span>
              </label>
              <label class="form-field form-field-date">
                <span class="form-label">Target Date</span>
                <input type="date" name="target_date" />
                <span class="form-error" data-error="target_date"></span>
              </label>
            </div>
            <label class="form-field">
              <span class="form-label">Description</span>
              <textarea name="description" rows="3" placeholder="Brief description of what you'll learn"></textarea>
              <span class="form-error" data-error="description"></span>
            </label>
            <label class="form-field form-field-status">
              <span class="form-label">Status</span>
              <select name="status">
                ${STATUS_OPTIONS.map((s) => `<option value="${s}">${s}</option>`).join('')}
              </select>
              <span class="form-error" data-error="status"></span>
            </label>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="submitBtn">
                <span class="btn-text">Add Course</span>
                <span class="spinner spinner-sm" hidden></span>
              </button>
              <button type="button" class="btn btn-ghost" id="cancelEditBtn" hidden>Cancel</button>
            </div>
          </form>
        </section>

        <section class="lms-card">
          <div class="section-heading-row">
            <h2 class="section-heading">Your Courses</h2>
            <span class="course-count" id="courseCount"></span>
          </div>
          <div id="messageArea"></div>
          <div id="coursesContainer" class="courses-container"></div>
        </section>
      </main>
    </div>
  `
}

/* ---------- Event binding ---------- */

function bindEvents(root, state, api) {
  const form = root.querySelector('#courseForm')
  const cancelBtn = root.querySelector('#cancelEditBtn')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = readForm(root)
    const errors = validateForm(data)
    showFormErrors(root, errors)
    if (Object.keys(errors).length > 0) return

    state.submitting = true
    setSubmitting(root, true)

    try {
      if (state.editingId) {
        const updated = await api.update(state.editingId, data)
        flash(root, 'Course updated successfully.', 'success')
        if (updated) {
          const idx = state.courses.findIndex((c) => c.id === state.editingId)
          if (idx !== -1) state.courses[idx] = { ...state.courses[idx], ...updated }
        }
        exitEditMode(root, state)
      } else {
        const created = await api.create(data)
        flash(root, 'Course added successfully.', 'success')
        if (created) state.courses.push(created)
      }
      resetForm(root)
      renderCourses(root, state)
    } catch (err) {
      flash(root, `Failed to save course: ${err.message}`, 'error')
    } finally {
      state.submitting = false
      setSubmitting(root, false)
    }
  })

  cancelBtn.addEventListener('click', () => {
    exitEditMode(root, state)
    resetForm(root)
  })

  // Live-clear error on input
  form.addEventListener('input', (e) => {
    const field = e.target.name
    if (!field) return
    const errEl = root.querySelector(`[data-error="${field}"]`)
    if (errEl) errEl.textContent = ''
  })
}

/* ---------- Data fetching ---------- */

async function loadCourses(root, state, api) {
  state.loading = true
  renderCourses(root, state)

  try {
    state.courses = await api.list()
    state.error = null
  } catch (err) {
    state.error = err.message
    flash(root, `Failed to load courses: ${err.message}`, 'error')
  } finally {
    state.loading = false
    renderCourses(root, state)
  }
}

/* ---------- Rendering ---------- */

function renderCourses(root, state) {
  const container = root.querySelector('#coursesContainer')
  const countEl = root.querySelector('#courseCount')

  if (state.loading) {
    container.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <p>Loading courses…</p>
      </div>`
    countEl.textContent = ''
    return
  }

  if (state.error && state.courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state-title">Could not load courses</p>
        <p class="empty-state-desc">Make sure the API server is running at the configured URL.</p>
      </div>`
    countEl.textContent = ''
    return
  }

  if (state.courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state-title">No courses yet</p>
        <p class="empty-state-desc">Add your first course using the form above.</p>
      </div>`
    countEl.textContent = ''
    return
  }

  countEl.textContent = `${state.courses.length} course${state.courses.length !== 1 ? 's' : ''}`

  container.innerHTML = state.courses.map((c) => courseCard(c)).join('')

  // Bind per-card buttons
  container.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action')
      const id = btn.getAttribute('data-id')
      if (action === 'edit') handleEdit(root, state, id)
      if (action === 'delete') handleDelete(root, state, api, id)
    })
  })
}

function courseCard(c) {
  const date = c.target_date || '—'
  const created = c.created_at ? formatDate(c.created_at) : '—'
  const status = c.status || 'Not Started'
  const statusColor = STATUS_COLORS[status] || '#6b7280'
  const safeName = esc(c.name || '')
  const safeDesc = esc(c.description || '')

  return `
    <article class="course-card" data-course-id="${esc(c.id)}">
      <div class="course-card-top">
        <h3 class="course-name">${safeName}</h3>
        <span class="course-status" style="background:${statusColor}1a;color:${statusColor};border-color:${statusColor}40">
          ${esc(status)}
        </span>
      </div>
      <p class="course-desc">${safeDesc}</p>
      <div class="course-meta">
        <div class="meta-item">
          <span class="meta-label">Target Date</span>
          <span class="meta-value">${esc(date)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Created</span>
          <span class="meta-value">${esc(created)}</span>
        </div>
      </div>
      <div class="course-actions">
        <button class="btn btn-edit" data-action="edit" data-id="${esc(c.id)}">Edit</button>
        <button class="btn btn-delete" data-action="delete" data-id="${esc(c.id)}">Remove</button>
      </div>
    </article>
  `
}

/* ---------- Actions ---------- */

function handleEdit(root, state, id) {
  const course = state.courses.find((c) => String(c.id) === String(id))
  if (!course) return

  state.editingId = course.id
  state.form = {
    name: course.name || '',
    description: course.description || '',
    target_date: course.target_date || '',
    status: course.status || 'Not Started',
  }

  fillForm(root, state.form)
  root.querySelector('#submitBtn .btn-text').textContent = 'Update Course'
  root.querySelector('#cancelEditBtn').hidden = false
  root.querySelector('.course-form').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function handleDelete(root, state, api, id) {
  const course = state.courses.find((c) => String(c.id) === String(id))
  if (!course) return

  if (!confirm(`Delete "${course.name}"? This cannot be undone.`)) return

  const card = root.querySelector(`[data-course-id="${CSS.escape(String(id))}"]`)
  if (card) card.classList.add('course-card--removing')

  try {
    await api.remove(id)
    state.courses = state.courses.filter((c) => String(c.id) !== String(id))
    if (state.editingId && String(state.editingId) === String(id)) {
      exitEditMode(root, state)
      resetForm(root)
    }
    flash(root, 'Course deleted.', 'success')
    renderCourses(root, state)
  } catch (err) {
    if (card) card.classList.remove('course-card--removing')
    flash(root, `Failed to delete course: ${err.message}`, 'error')
  }
}

/* ---------- Form helpers ---------- */

function readForm(root) {
  const form = root.querySelector('#courseForm')
  return {
    name: form.name.value.trim(),
    description: form.description.value.trim(),
    target_date: form.target_date.value,
    status: form.status.value,
  }
}

function fillForm(root, data) {
  const form = root.querySelector('#courseForm')
  form.name.value = data.name
  form.description.value = data.description
  form.target_date.value = data.target_date
  form.status.value = data.status
}

function resetForm(root) {
  const form = root.querySelector('#courseForm')
  form.reset()
  form.status.value = 'Not Started'
  showFormErrors(root, {})
}

function validateForm(data) {
  const errors = {}
  if (!data.name) errors.name = 'Course name is required.'
  if (!data.description) errors.description = 'Description is required.'
  if (!data.target_date) errors.target_date = 'Target date is required.'
  if (!STATUS_OPTIONS.includes(data.status)) errors.status = 'Select a valid status.'
  return errors
}

function showFormErrors(root, errors) {
  root.querySelectorAll('[data-error]').forEach((el) => {
    el.textContent = ''
  })
  for (const [field, msg] of Object.entries(errors)) {
    const el = root.querySelector(`[data-error="${field}"]`)
    if (el) el.textContent = msg
  }
}

function setSubmitting(root, on) {
  const btn = root.querySelector('#submitBtn')
  const spinner = btn.querySelector('.spinner')
  btn.disabled = on
  spinner.hidden = !on
}

function exitEditMode(root, state) {
  state.editingId = null
  root.querySelector('#submitBtn .btn-text').textContent = 'Add Course'
  root.querySelector('#cancelEditBtn').hidden = true
}

/* ---------- Flash messages ---------- */

function flash(root, message, type) {
  const area = root.querySelector('#messageArea')
  area.innerHTML = `<div class="flash flash-${type}">${esc(message)}</div>`
  const el = area.querySelector('.flash')
  setTimeout(() => {
    if (el) el.classList.add('flash--hide')
  }, 3500)
  setTimeout(() => {
    if (el && el.parentNode) el.remove()
  }, 4200)
}

/* ---------- Utilities ---------- */

function formatDate(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
