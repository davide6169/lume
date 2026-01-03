'use client'

import { useState } from 'react'
import { SharedAudience } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Users, CheckCircle, RotateCw, FileSpreadsheet } from 'lucide-react'

interface SharedAudienceCardProps {
  audience: SharedAudience
  selected: boolean
  onToggleSelect: () => void
  onDelete: () => void
}

export function SharedAudienceCard({
  audience,
  selected,
  onToggleSelect,
  onDelete,
}: SharedAudienceCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const getFullCsv = () => {
    const headers = 'Email,FirstName,LastName,Phone,City,Country,Interests'
    const rows = audience.contacts.map((contact) =>
      [
        contact.email,
        contact.firstName,
        contact.lastName,
        contact.phone || '',
        contact.city || '',
        contact.country || '',
        contact.interests ? `"${contact.interests.join(', ')}"` : '',
      ].join(',')
    )

    return [headers, ...rows].join('\n')
  }

  // Colore base in base al tipo della Source Audience
  const getCardColor = () => {
    if (audience.sourceAudienceType === 'facebook') {
      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    }
    return 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800'
  }

  const handleClick = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="group" style={{ perspective: '1000px' }}>
      <div
        className="relative"
        style={{
          width: '100%',
          height: '240px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Side */}
        <Card
          className={`${getCardColor()} ${selected ? 'ring-2 ring-purple-500' : ''} ${audience.uploadedToMeta ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            top: 0,
            left: 0,
          }}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => {
                    onToggleSelect()
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{audience.name}</h3>
                    {audience.uploadedToMeta && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="font-medium text-foreground">{audience.contacts.length}</span> {audience.contacts.length === 1 ? 'contact' : 'contacts'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-lg"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>

            {/* Flip indicator */}
            <button
              onClick={handleClick}
              className="mt-auto pt-4 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span>View CSV</span>
            </button>
          </div>
        </Card>

        {/* Back Side - Full CSV */}
        <Card
          className={`${getCardColor()}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            top: 0,
            left: 0,
          }}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {getFullCsv()}
              </pre>
            </div>

            {/* Flip back button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsFlipped(false)
              }}
              className="pt-4 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              <span>Flip Back</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
