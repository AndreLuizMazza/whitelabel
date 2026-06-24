const PLACEHOLDER_RE = /\{\{([A-Z0-9_]+)\}\}/g

export function sanitizeLegalValue(value, maxLen = 240) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

export function interpolate(template, context = {}) {
  if (!template) return ''
  return String(template).replace(PLACEHOLDER_RE, (_, key) => {
    const v = context[key]
    return v == null ? '' : String(v)
  })
}

export function interpolateSection(section, context) {
  if (!section) return section
  if (typeof section === 'string') return interpolate(section, context)

  const next = { ...section }
  if (next.title) next.title = interpolate(next.title, context)
  if (next.text) next.text = interpolate(next.text, context)
  if (Array.isArray(next.paragraphs)) {
    next.paragraphs = next.paragraphs.map((p) => interpolate(p, context))
  }
  if (Array.isArray(next.items)) {
    next.items = next.items.map((item) => {
      if (typeof item === 'string') return interpolate(item, context)
      return {
        ...item,
        label: item.label ? interpolate(item.label, context) : undefined,
        text: item.text ? interpolate(item.text, context) : undefined,
      }
    })
  }
  if (Array.isArray(next.headers)) {
    next.headers = next.headers.map((h) => interpolate(h, context))
  }
  if (Array.isArray(next.rows)) {
    next.rows = next.rows.map((row) =>
      row.map((cell) => interpolate(cell, context))
    )
  }
  if (Array.isArray(next.lines)) {
    next.lines = next.lines.map((line) => interpolate(line, context))
  }
  return next
}
