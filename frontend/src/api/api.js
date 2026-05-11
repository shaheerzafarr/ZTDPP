const BASE_URL = 'http://localhost:8000'

export async function verifyImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/verify`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let message = 'Verification failed.'
    try {
      const err = await response.json()
      if (typeof err.detail === 'string') {
        message = err.detail
      } else if (Array.isArray(err.detail)) {
        message = err.detail.map((d) => d.msg).join(', ')
      }
    } catch {
      message = `Server error (${response.status})`
    }
    throw new Error(message)
  }

  return response.json()
}

export async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`)
  if (!response.ok) throw new Error('Backend unreachable')
  return response.json()
}

export async function signImage(file, deviceId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('device_id', deviceId)

  const response = await fetch(`${BASE_URL}/sign`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let message = 'Signing failed.'
    try {
      const err = await response.json()
      message = err.detail || message
    } catch {
      message = `Server error (${response.status})`
    }
    throw new Error(message)
  }

  return response.blob()
}
