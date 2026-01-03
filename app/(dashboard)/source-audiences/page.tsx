import { SourceAudienceList } from '@/components/source-audiences/SourceAudienceList'

export default function SourceAudiencesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Source Audiences</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Facebook and Instagram URL sources for lead extraction
        </p>
      </div>

      {/* Source Audiences List */}
      <SourceAudienceList />
    </div>
  )
}
