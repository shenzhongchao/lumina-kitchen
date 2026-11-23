// Demo provenance is inherited by branches and recipes, never accepted from UI updates.
export function assertGenerationAllowed(board) {
  if (board?.demo || process.env.LUMINA_OFFLINE === '1') {
    throw Object.assign(new Error('入门练习与离线验收不调用模型。请新建自己的实验后再使用生成。'), { status: 403, code: 'GENERATION_DISABLED' })
  }
}
