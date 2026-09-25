import { renderLMS } from './lms-ui.js'
import { CourseAPI } from './lms-api.js'
// import './style.css'

const API_URL = 'http://localhost:8080/api/courses'

export function setupLMS(root) {
  const api = new CourseAPI(API_URL)
  renderLMS(root, api)
}
