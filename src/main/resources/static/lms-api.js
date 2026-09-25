export class CourseAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async request(path, options = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })

    if (!res.ok) {
      let message = `HTTP ${res.status}`
      try {
        const body = await res.json()
        message = body.message || body.error || message
      } catch {
        // no JSON body
      }
      throw new Error(message)
    }

    if (res.status === 204) return null
    return res.json()
  }

  list() {
    return this.request('')
  }

  create(course) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(course),
    })
  }

  update(id, fields) {
    return this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    })
  }

  remove(id) {
    return this.request(`/${id}`, {
      method: 'DELETE',
    })
  }
}
