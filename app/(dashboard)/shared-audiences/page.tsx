import { SharedAudienceList } from '@/components/shared-audiences/SharedAudienceList'

export default function SharedAudiencesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shared Audiences</h1>
        <p className="text-muted-foreground mt-2">
          View and manage extracted contacts, export to CSV, or upload to Meta Ads
        </p>
      </div>

      {/* Shared Audiences List */}
      <SharedAudienceList />
    </div>
  )
}
