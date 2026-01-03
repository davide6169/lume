import { FilterManager } from '@/components/filters/FilterManager'

export default function FiltersPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Filters</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage filters to refine your contacts before export
        </p>
      </div>

      {/* Filters */}
      <FilterManager />
    </div>
  )
}
