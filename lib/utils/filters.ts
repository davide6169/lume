import type { FilterRule, Contact } from '@/types'

export function applyFilterRules(contacts: Contact[], rules: FilterRule[]): Contact[] {
  if (!rules || rules.length === 0) {
    return contacts
  }

  return contacts.filter((contact) => {
    return evaluateRules(contact, rules)
  })
}

function evaluateRules(contact: Contact, rules: FilterRule[]): boolean {
  if (rules.length === 0) return true

  let result = true
  let currentLogicalOp: 'AND' | 'OR' = 'AND'

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const ruleResult = evaluateRule(contact, rule)

    if (i === 0) {
      result = ruleResult
    } else {
      if (currentLogicalOp === 'AND') {
        result = result && ruleResult
      } else {
        result = result || ruleResult
      }
    }

    // Set logical operator for next iteration
    currentLogicalOp = rule.logicalOperator || 'AND'
  }

  return result
}

function evaluateRule(contact: Contact, rule: FilterRule): boolean {
  const fieldValue = getFieldValue(contact, rule.field)
  const ruleValue = rule.value

  switch (rule.operator) {
    case 'CONTAINS':
      return String(fieldValue || '').toLowerCase().includes(String(ruleValue || '').toLowerCase())

    case 'EQUALS':
      return String(fieldValue || '').toLowerCase() === String(ruleValue || '').toLowerCase()

    case 'NOT':
      return String(fieldValue || '').toLowerCase() !== String(ruleValue || '').toLowerCase()

    case 'STARTS_WITH':
      return String(fieldValue || '').toLowerCase().startsWith(String(ruleValue || '').toLowerCase())

    case 'ENDS_WITH':
      return String(fieldValue || '').toLowerCase().endsWith(String(ruleValue || '').toLowerCase())

    case 'NOT_STARTS_WITH':
      return !String(fieldValue || '').toLowerCase().startsWith(String(ruleValue || '').toLowerCase())

    case 'NOT_ENDS_WITH':
      return !String(fieldValue || '').toLowerCase().endsWith(String(ruleValue || '').toLowerCase())

    case 'GT':
      const numFieldValue = Number(fieldValue || 0)
      const numRuleValue = Number(ruleValue || 0)
      return !isNaN(numFieldValue) && !isNaN(numRuleValue) && numFieldValue > numRuleValue

    case 'LT':
      const numFieldValue2 = Number(fieldValue || 0)
      const numRuleValue2 = Number(ruleValue || 0)
      return !isNaN(numFieldValue2) && !isNaN(numRuleValue2) && numFieldValue2 < numRuleValue2

    default:
      return true
  }
}

function getFieldValue(contact: Contact, field: string): any {
  const keys = field.split('.')
  let value: any = contact

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return ''
    }
  }

  // Handle array fields like interests
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return value || ''
}
