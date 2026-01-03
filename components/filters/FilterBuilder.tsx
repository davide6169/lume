'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, X } from 'lucide-react'
import type { FilterRule } from '@/types'

interface FilterRuleRowProps {
  rule: FilterRule
  index: number
  onUpdate: (index: number, rule: FilterRule) => void
  onRemove: (index: number) => void
  showRemove: boolean
}

const AVAILABLE_FIELDS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
  { value: 'interests', label: 'Interests' },
]

const OPERATORS = [
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT', label: 'Does Not Equal' },
  { value: 'GT', label: 'Greater Than' },
  { value: 'LT', label: 'Less Than' },
]

function FilterRuleRow({ rule, index, onUpdate, onRemove, showRemove }: FilterRuleRowProps) {
  return (
    <div className="flex items-center gap-2 p-4 border rounded-lg bg-card">
      {index > 0 && (
        <span className="text-sm text-muted-foreground px-2">
          {rule.operator === 'NOT' ? 'AND NOT' : 'AND'}
        </span>
      )}

      <Select
        value={rule.field}
        onValueChange={(value) => onUpdate(index, { ...rule, field: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_FIELDS.map((field) => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={rule.operator}
        onValueChange={(value) => onUpdate(index, { ...rule, operator: value as FilterRule['operator'] })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={rule.value}
        onChange={(e) => onUpdate(index, { ...rule, value: e.target.value })}
        placeholder="Value"
        className="flex-1"
      />

      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  )
}

interface FilterBuilderProps {
  rules: FilterRule[]
  onChange: (rules: FilterRule[]) => void
}

export function FilterBuilder({ rules, onChange }: FilterBuilderProps) {
  const handleAddRule = () => {
    const newRule: FilterRule = {
      id: crypto.randomUUID(),
      field: 'firstName',
      operator: 'CONTAINS',
      value: '',
    }
    onChange([...rules, newRule])
  }

  const handleUpdateRule = (index: number, updatedRule: FilterRule) => {
    const newRules = [...rules]
    newRules[index] = updatedRule
    onChange(newRules)
  }

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index)
    onChange(newRules)
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Filter Rules</h3>
          <p className="text-sm text-muted-foreground">
            {rules.length === 0
              ? 'Add rules to filter your contacts'
              : `${rules.length} rule${rules.length === 1 ? '' : 's'} defined`}
          </p>
        </div>
        {rules.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {rules.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No filter rules defined yet</p>
          <Button onClick={handleAddRule}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Rule
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <FilterRuleRow
              key={rule.id}
              rule={rule}
              index={index}
              onUpdate={handleUpdateRule}
              onRemove={handleRemoveRule}
              showRemove={rules.length > 1}
            />
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddRule}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Rule
          </Button>
        </div>
      )}

      {/* Preview */}
      {rules.length > 0 && (
        <Card className="p-4 bg-muted/50">
          <h4 className="text-sm font-medium mb-2">Filter Preview:</h4>
          <div className="text-sm font-mono space-y-1">
            {rules.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-2">
                {index > 0 && <span className="text-muted-foreground">{rule.operator === 'NOT' ? 'AND NOT' : 'AND'}</span>}
                <span>{rule.field}</span>
                <span className="text-muted-foreground">{rule.operator}</span>
                <span className="font-medium">"{rule.value || '<empty>'}"</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
