// Shared media errors keep HTTP status, provider code and uncertainty explicit.
export function mediaError(message, status = 502, code = 'MEDIA_ERROR', extra = {}) {
  return Object.assign(new Error(message), { status, code, ...extra })
}

export function isAbort(error) {
  return error?.name === 'AbortError' || error?.code === 'ABORT_ERR'
}
