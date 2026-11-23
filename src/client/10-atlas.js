// Shared media URL helper. The earlier atlas/tray components were replaced by
// the current workbench; only this helper is still used by the client.
function mediaUrl(rel) {
  if (!rel) return ''
  return `${BASE}/media/${rel.split('/').map(encodeURIComponent).join('/')}`
}
