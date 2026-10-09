export type AuditDiffStatus = 'added' | 'removed' | 'changed' | 'unchanged'
export type AuditDiffValueType = 'primitive' | 'object' | 'array' | 'null'

export type AuditDiffNode = {
  key: string
  label: string
  path: string
  status: AuditDiffStatus
  valueType: AuditDiffValueType
  before?: unknown
  after?: unknown
  children: AuditDiffNode[]
}

type AuditFieldChange = {
  before?: unknown
  after?: unknown
}

export type AuditChangedFieldSummary = {
  key: string
  label: string
  title: string
}

const ARRAY_KEY_FIELDS = ['id', 'key', 'productId', 'lineId', 'userId'] as const

export function buildAuditValueDiff(
  before: unknown,
  after: unknown,
  label = 'value',
  path = label,
): AuditDiffNode {
  if (before === undefined && after !== undefined) {
    return buildAddedNode(after, label, path)
  }

  if (before !== undefined && after === undefined) {
    return buildRemovedNode(before, label, path)
  }

  const valueType = resolveValueType(after ?? before)
  if (isSameValue(before, after)) {
    return {
      key: path,
      label,
      path,
      status: 'unchanged',
      valueType,
      before,
      after,
      children: [],
    }
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort()
    const children = keys
      .map((key) => buildAuditValueDiff(before[key], after[key], key, joinPath(path, key)))
      .filter(hasAuditDiffChanges)

    return {
      key: path,
      label,
      path,
      status: resolveBranchStatus(children),
      valueType: 'object',
      before,
      after,
      children,
    }
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const children = buildArrayChildren(before, after, path).filter(hasAuditDiffChanges)

    return {
      key: path,
      label,
      path,
      status: resolveBranchStatus(children),
      valueType: 'array',
      before,
      after,
      children,
    }
  }

  return {
    key: path,
    label,
    path,
    status: 'changed',
    valueType,
    before,
    after,
    children: [],
  }
}

export function hasAuditDiffChanges(node: AuditDiffNode): boolean {
  return node.status !== 'unchanged' || node.children.some(hasAuditDiffChanges)
}

export function formatAuditValue(value: unknown): string {
  if (value === undefined) {
    return 'Not set'
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value || 'Empty string'
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value, null, 2)
}

export function flattenAuditDiffPaths(diff: Record<string, AuditFieldChange>): string[] {
  const paths = Object.entries(diff).flatMap(([field, change]) =>
    flattenChangedValuePaths(change.before, change.after, field),
  )

  return Array.from(new Set(paths))
}

export function summarizeAuditDiffFields(
  diff: Record<string, AuditFieldChange>,
): AuditChangedFieldSummary[] {
  return Object.entries(diff).flatMap(([field, change]) => {
    const paths = flattenChangedValuePaths(change.before, change.after, field)
    const uniquePaths = Array.from(new Set(paths))
    const isArrayChange =
      Array.isArray(change.before) ||
      Array.isArray(change.after) ||
      uniquePaths.some((path) => path.startsWith(`${field}[`))

    if (!isArrayChange) {
      return uniquePaths.map((path) => ({
        key: path,
        label: path,
        title: path,
      }))
    }

    const count = Math.max(uniquePaths.length, 1)
    return [
      {
        key: field,
        label: `${field} (${count} ${count === 1 ? 'change' : 'changes'})`,
        title: uniquePaths.join('\n'),
      },
    ]
  })
}

function buildArrayChildren(before: unknown[], after: unknown[], path: string): AuditDiffNode[] {
  if (canUseKeyedArrayDiff(before, after) && !hasCommonArrayKeyReorder(before, after)) {
    return buildKeyedArrayChildren(before, after, path)
  }

  if (before.every(isPrimitiveLike) && after.every(isPrimitiveLike)) {
    return buildPrimitiveArrayChildren(before, after, path)
  }

  const length = Math.max(before.length, after.length)
  return Array.from({ length }, (_, index) =>
    buildAuditValueDiff(
      before[index],
      after[index],
      formatArrayItemLabel(after[index] ?? before[index], index),
      `${path}[${index}]`,
    ),
  )
}

function buildKeyedArrayChildren(
  before: unknown[],
  after: unknown[],
  path: string,
): AuditDiffNode[] {
  const beforeByKey = new Map(
    before.map((item, index) => [readArrayItemKey(item), { item, index }] as const),
  )
  const afterByKey = new Map(
    after.map((item, index) => [readArrayItemKey(item), { item, index }] as const),
  )
  const keys = Array.from(new Set([...beforeByKey.keys(), ...afterByKey.keys()])).sort(
    (left, right) => {
      const leftIndex = beforeByKey.get(left)?.index ?? afterByKey.get(left)?.index ?? 0
      const rightIndex = beforeByKey.get(right)?.index ?? afterByKey.get(right)?.index ?? 0
      return leftIndex - rightIndex
    },
  )

  return keys.map((key) => {
    const beforeEntry = beforeByKey.get(key)
    const afterEntry = afterByKey.get(key)
    const item = afterEntry?.item ?? beforeEntry?.item
    const index = afterEntry?.index ?? beforeEntry?.index ?? 0
    const label = formatArrayItemLabel(item, index)

    return buildAuditValueDiff(beforeEntry?.item, afterEntry?.item, label, `${path}[${key}]`)
  })
}

function buildPrimitiveArrayChildren(
  before: unknown[],
  after: unknown[],
  path: string,
): AuditDiffNode[] {
  const beforeEntries = countValues(before)
  const afterEntries = countValues(after)
  const keys = Array.from(new Set([...beforeEntries.keys(), ...afterEntries.keys()])).sort()
  let itemNumber = 0

  return keys.flatMap((key) => {
    const beforeEntry = beforeEntries.get(key)
    const afterEntry = afterEntries.get(key)
    const beforeCount = beforeEntry?.count ?? 0
    const afterCount = afterEntry?.count ?? 0
    const count = Math.max(beforeCount, afterCount)

    return Array.from({ length: count }, (_, index) => {
      itemNumber += 1
      return buildAuditValueDiff(
        index < beforeCount ? beforeEntry?.value : undefined,
        index < afterCount ? afterEntry?.value : undefined,
        `Item #${itemNumber}`,
        `${path}[${key}:${index}]`,
      )
    })
  })
}

function buildAddedNode(value: unknown, label: string, path: string): AuditDiffNode {
  if (isPlainObject(value)) {
    const children = Object.keys(value)
      .sort()
      .map((key) => buildAddedNode(value[key], key, joinPath(path, key)))
    return { key: path, label, path, status: 'added', valueType: 'object', after: value, children }
  }

  if (Array.isArray(value)) {
    const children = value.map((item, index) =>
      buildAddedNode(item, formatArrayItemLabel(item, index), `${path}[${index}]`),
    )
    return { key: path, label, path, status: 'added', valueType: 'array', after: value, children }
  }

  return {
    key: path,
    label,
    path,
    status: 'added',
    valueType: resolveValueType(value),
    after: value,
    children: [],
  }
}

function buildRemovedNode(value: unknown, label: string, path: string): AuditDiffNode {
  if (isPlainObject(value)) {
    const children = Object.keys(value)
      .sort()
      .map((key) => buildRemovedNode(value[key], key, joinPath(path, key)))
    return {
      key: path,
      label,
      path,
      status: 'removed',
      valueType: 'object',
      before: value,
      children,
    }
  }

  if (Array.isArray(value)) {
    const children = value.map((item, index) =>
      buildRemovedNode(item, formatArrayItemLabel(item, index), `${path}[${index}]`),
    )
    return {
      key: path,
      label,
      path,
      status: 'removed',
      valueType: 'array',
      before: value,
      children,
    }
  }

  return {
    key: path,
    label,
    path,
    status: 'removed',
    valueType: resolveValueType(value),
    before: value,
    children: [],
  }
}

function canUseKeyedArrayDiff(before: unknown[], after: unknown[]): boolean {
  const items = [...before, ...after]
  if (items.length === 0 || !items.every(isPlainObject)) {
    return false
  }

  const keys = items.map(readArrayItemKey)
  return (
    keys.every(Boolean) &&
    new Set(before.map(readArrayItemKey)).size === before.length &&
    new Set(after.map(readArrayItemKey)).size === after.length
  )
}

function flattenChangedValuePaths(before: unknown, after: unknown, path: string): string[] {
  if (isSameValue(before, after)) {
    return []
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort()
    const paths = keys.flatMap((key) =>
      flattenChangedValuePaths(before[key], after[key], joinPath(path, key)),
    )

    return paths.length > 0 ? paths : [path]
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    if (!canUseKeyedArrayDiff(before, after) || hasCommonArrayKeyReorder(before, after)) {
      return [path]
    }

    const beforeByKey = new Map(before.map((item) => [readArrayItemKey(item), item] as const))
    const afterByKey = new Map(after.map((item) => [readArrayItemKey(item), item] as const))
    const keys = Array.from(new Set([...beforeByKey.keys(), ...afterByKey.keys()])).sort()
    const paths = keys.flatMap((key) =>
      flattenChangedArrayItemPaths(beforeByKey.get(key), afterByKey.get(key), `${path}[${key}]`),
    )

    return paths.length > 0 ? paths : [path]
  }

  return [path]
}

function flattenChangedArrayItemPaths(before: unknown, after: unknown, path: string): string[] {
  if (!isPlainObject(before) || !isPlainObject(after)) {
    return flattenChangedValuePaths(before, after, path)
  }

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort()
  const paths = keys
    .filter((key) => !isUnchangedArrayKeyField(key, before, after))
    .flatMap((key) => flattenChangedValuePaths(before[key], after[key], joinPath(path, key)))

  return paths.length > 0 ? paths : [path]
}

function hasCommonArrayKeyReorder(before: unknown[], after: unknown[]): boolean {
  const afterKeys = new Set(after.map(readArrayItemKey))
  const beforeCommonKeys = before.map(readArrayItemKey).filter((key) => afterKeys.has(key))
  const beforeKeys = new Set(beforeCommonKeys)
  const afterCommonKeys = after.map(readArrayItemKey).filter((key) => beforeKeys.has(key))

  return !isSameValue(beforeCommonKeys, afterCommonKeys)
}

function isUnchangedArrayKeyField(
  key: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): boolean {
  return (
    ARRAY_KEY_FIELDS.includes(key as (typeof ARRAY_KEY_FIELDS)[number]) &&
    before[key] !== undefined &&
    isSameValue(before[key], after[key])
  )
}

function readArrayItemKey(item: unknown): string {
  if (!isPlainObject(item)) {
    return ''
  }

  for (const key of ARRAY_KEY_FIELDS) {
    const value = item[key]
    if (typeof value === 'string' || typeof value === 'number') {
      return `${key}:${value}`
    }
  }

  return ''
}

function countValues(values: unknown[]): Map<string, { value: unknown; count: number }> {
  const entries = new Map<string, { value: unknown; count: number }>()
  for (const value of values) {
    const key = stableStringify(value)
    const entry = entries.get(key)
    if (entry) {
      entry.count += 1
    } else {
      entries.set(key, { value, count: 1 })
    }
  }
  return entries
}

function formatArrayItemLabel(item: unknown, index: number): string {
  if (Array.isArray(item)) {
    return `Nested array #${index + 1}`
  }

  if (isPlainObject(item)) {
    return `Nested object #${index + 1}`
  }

  return `Item #${index + 1}`
}

function resolveBranchStatus(children: AuditDiffNode[]): AuditDiffStatus {
  return children.some((child) => child.status !== 'unchanged') ? 'changed' : 'unchanged'
}

function joinPath(path: string, key: string): string {
  return path ? `${path}.${key}` : key
}

function resolveValueType(value: unknown): AuditDiffValueType {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  if (isPlainObject(value)) {
    return 'object'
  }
  return 'primitive'
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPrimitiveLike(value: unknown): boolean {
  return value === null || typeof value !== 'object'
}

function isSameValue(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => JSON.parse(stableStringify(item))))
  }

  if (!isPlainObject(value)) {
    return JSON.stringify(value)
  }

  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const child = value[key]
        result[key] =
          isPlainObject(child) || Array.isArray(child) ? JSON.parse(stableStringify(child)) : child
        return result
      }, {}),
  )
}
