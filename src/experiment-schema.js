// Runtime validation for tool arguments.
export function validate(schema, value, path = '参数') {
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path} 不在允许范围内`)
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} 须为对象`)
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key} 缺失`)
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(schema.properties, key)) throw new Error(`${path}.${key} 不支持`)
      validate(schema.properties[key], value[key], `${path}.${key}`)
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length < schema.minItems || value.length > schema.maxItems) throw new Error(`${path} 数量不合法`)
    value.forEach((v, i) => validate(schema.items, v, `${path}[${i}]`))
  } else if (schema.type === 'string') {
    if (typeof value !== 'string' || !value.trim() || value.length > (schema.maxLength || Infinity)) throw new Error(`${path} 文本不合法`)
  } else if (schema.type === 'integer') {
    if (!Number.isInteger(value) || value < schema.minimum || value > (schema.maximum || Infinity)) throw new Error(`${path} 须为范围内整数`)
  }
}
