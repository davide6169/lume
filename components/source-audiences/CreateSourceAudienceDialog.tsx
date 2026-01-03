'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Facebook as FacebookIcon, Instagram as InstagramIcon } from 'lucide-react'
import { Facebook } from '@/components/icons/facebook'
import { Instagram } from '@/components/icons/instagram'

interface CreateSourceAudienceDialogProps {
  onCreate: (data: { name: string; type: 'facebook' | 'instagram'; urls: string[] }) => void
}

export function CreateSourceAudienceDialog({ onCreate }: CreateSourceAudienceDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'facebook' | 'instagram' | null>(null)
  const [urls, setUrls] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !type) {
      return
    }

    // Parse URLs - one per line, ignore empty lines and lines starting with #
    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0 && !url.startsWith('#'))

    if (urlList.length === 0) {
      return
    }

    onCreate({
      name,
      type,
      urls: urlList,
    })

    // Reset form
    setName('')
    setType(null)
    setUrls('')
    setOpen(false)
  }

  const getSuggestedName = () => {
    if (type === 'facebook') {
      return 'Facebook Audience ' + new Date().toLocaleDateString()
    }
    if (type === 'instagram') {
      return 'Instagram Audience ' + new Date().toLocaleDateString()
    }
    return ''
  }

  const selectedTypeStyle = type
    ? 'border-2 border-primary bg-primary/5'
    : 'border-2 border-transparent hover:border-primary/50'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Source Audience
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Source Audience</DialogTitle>
            <DialogDescription>
              Add a Facebook or Instagram audience to extract leads from. URLs will be processed
              to find potential contacts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Platform Type *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setType('facebook')
                    if (!name) setName(getSuggestedName())
                  }}
                  className={`flex flex-col items-center gap-2 p-6 rounded-lg border-2 transition-all ${selectedTypeStyle}`}
                >
                  <Facebook className="h-12 w-12" />
                  <span className="font-medium">Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('instagram')
                    if (!name) setName(getSuggestedName())
                  }}
                  className={`flex flex-col items-center gap-2 p-6 rounded-lg border-2 transition-all ${
                    type === 'instagram' ? 'border-2 border-primary bg-primary/5' : 'border-2 border-transparent hover:border-primary/50'
                  }`}
                >
                  <Instagram className="h-12 w-12" />
                  <span className="font-medium">Instagram</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Audience Name *</Label>
              <Input
                id="name"
                placeholder="My Facebook Audience"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name for this audience source
              </p>
            </div>

            {/* URLs */}
            <div className="space-y-2">
              <Label htmlFor="urls">URLs *</Label>
              <Textarea
                id="urls"
                placeholder={`https://www.facebook.com/group1&#10;https://www.facebook.com/group2&#10;# This is a comment and will be ignored`}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={8}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter one URL per line. Empty lines and lines starting with # will be ignored.
                {urls.split('\n').filter((u) => u.trim() && !u.trim().startsWith('#')).length > 0 && (
                  <span className="font-medium text-foreground ml-1">
                    ({urls.split('\n').filter((u) => u.trim() && !u.trim().startsWith('#')).length} URLs
                    detected)
                  </span>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !type || urls.trim().length === 0}>
              Create Audience
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
