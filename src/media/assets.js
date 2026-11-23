// Local media assets: content-addressed files served by the plugin host.
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { mediaError } from './errors.js'

const EXT_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
}
const SAFE_FILE = /^[a-f0-9]{64}\.(png|jpe?g|webp|mp4|webm)$/

export function extForMime(mime, fallback = 'png') {
  const type = String(mime || '').split(';')[0].trim().toLowerCase()
  const found = Object.entries(EXT_MIME).find(([, value]) => value === type)
  return found ? found[0] : fallback
}

export function mimeForFile(file) {
  return EXT_MIME[String(file).split('.').pop()?.toLowerCase()] || 'application/octet-stream'
}

export function sniffImageMime(buffer) {
  if (!buffer || buffer.length < 12) return ''
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return ''
}

export class AssetStore {
  constructor(directory) {
    this.directory = directory
  }

  async init() {
    await mkdir(this.directory, { recursive: true })
  }

  path(file) {
    if (!SAFE_FILE.test(String(file || ''))) throw mediaError('找不到这个媒体文件', 404, 'ASSET_NOT_FOUND')
    return join(this.directory, file)
  }

  async info(file) {
    const info = await stat(this.path(file))
    if (!info.isFile()) throw mediaError('找不到这个媒体文件', 404, 'ASSET_NOT_FOUND')
    return { file, path: this.path(file), bytes: info.size, mime: mimeForFile(file) }
  }

  stream(file, range) {
    return createReadStream(this.path(file), range)
  }

  async putBuffer(buffer, mime, { maxBytes = 25 * 1024 * 1024 } = {}) {
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw mediaError('图像内容为空', 502, 'EMPTY_IMAGE')
    if (buffer.length > maxBytes) throw mediaError('图像超过大小限制', 502, 'IMAGE_TOO_LARGE')
    return this.#write(Readable.from(buffer), mime, { maxBytes })
  }

  async putStream(stream, mime, { maxBytes = 300 * 1024 * 1024, fallbackExt = 'mp4' } = {}) {
    return this.#write(stream, mime, { maxBytes, fallbackExt })
  }

  async #write(stream, mime, { maxBytes, fallbackExt = 'png' }) {
    await this.init()
    const temp = join(this.directory, `.${randomUUID()}.part`)
    const hash = createHash('sha256')
    let bytes = 0
    const meter = new Transform({
      transform(chunk, _encoding, callback) {
        bytes += chunk.length
        if (bytes > maxBytes) {
          callback(mediaError('媒体文件超过大小限制', 502, 'MEDIA_TOO_LARGE'))
          return
        }
        hash.update(chunk)
        callback(null, chunk)
      },
    })
    try {
      await pipeline(stream, meter, createWriteStream(temp, { mode: 0o600 }))
      const file = `${hash.digest('hex')}.${extForMime(mime, fallbackExt)}`
      const target = join(this.directory, file)
      try {
        await rename(temp, target)
      } catch (error) {
        // The same bytes may already exist; keep that copy and drop the temporary one.
        try {
          await stat(target)
          await rm(temp, { force: true })
        } catch {
          throw error
        }
      }
      return { file, mime: mimeForFile(file), bytes }
    } catch (error) {
      await rm(temp, { force: true }).catch(() => {})
      throw error
    }
  }
}
