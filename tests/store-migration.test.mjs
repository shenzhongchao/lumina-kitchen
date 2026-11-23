import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KitchenStore } from '../src/store.js'
import { isCurrentPlan, legacyPlanKey } from '../src/lab-input.js'

test('v1 boards.json is imported once without deleting the old file', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-migrate-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const oldBoard = {
    id: 'board_old', title: '旧实验', idea: '雨夜站台，一个人等车',
    constraints: { platform: 'douyin', duration: 15, aspect: '9:16', pacing: 3, mood: '' },
    ingredients: [{ slug: '1-3-negative-space', weight: 2 }],
    targets: { model: 'veo' },
    lab: {
      comparison: {
        id: 'plan_old', inputKey: legacyPlanKey({
          idea: '雨夜站台，一个人等车',
          constraints: { platform: 'douyin', duration: 15, aspect: '9:16', pacing: 3, mood: '' },
          ingredients: [{ slug: '1-3-negative-space', weight: 2 }],
        }), selectedId: 'A', mediaStatus: 'not_generated',
        variants: [{ id: 'A', title: 'A', imagePrompt: 'image', videoPrompt: 'video' }],
      },
    },
  }
  await writeFile(join(root, 'boards.json'), JSON.stringify({ version: 1, activeId: 'board_old', boards: [oldBoard] }))

  const first = await new KitchenStore(root).read()
  assert.equal(first.version, 2)
  assert.equal(first.boards.length, 1)
  assert.equal(first.boards[0].id, 'board_old')
  assert.equal(first.boards[0].revision, 0)
  assert.deepEqual(first.boards[0].retained, {})
  assert.deepEqual(first.boards[0].shot, {})
  assert.equal(isCurrentPlan(first.boards[0].lab.comparison, first.boards[0]), true)
  assert.equal((await stat(join(root, 'workspace-v2.json'))).isFile(), true)

  const second = await new KitchenStore(root).read()
  assert.equal(second.boards.length, 1)
  assert.deepEqual(JSON.parse(await readFile(join(root, 'boards.json'), 'utf8')).boards.length, 1)
})

test('legacy plans stop matching after a new retained or shot edit', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-migrate-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const board = {
    idea: '雨夜站台', constraints: { duration: 15, aspect: '9:16', platform: 'douyin', pacing: 3, mood: '' },
    ingredients: [{ slug: '1-3-negative-space', weight: 2 }], retained: {}, shot: {},
    lab: { comparison: { id: 'p', inputKey: legacyPlanKey({
      idea: '雨夜站台', constraints: { duration: 15, aspect: '9:16', platform: 'douyin', pacing: 3, mood: '' },
      ingredients: [{ slug: '1-3-negative-space', weight: 2 }],
    }) } },
  }
  assert.equal(isCurrentPlan(board.lab.comparison, board), true)
  board.shot = { motion: '跟拍' }
  assert.equal(isCurrentPlan(board.lab.comparison, board), false)
})
