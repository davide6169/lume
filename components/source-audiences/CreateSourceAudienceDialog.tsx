'use client'

import { useState, useEffect } from 'react'
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
  const [type, setType] = useState<'facebook' | 'instagram'>('facebook')
  const [urls, setUrls] = useState('')

  // Initialize name with suggested value when dialog opens
  useEffect(() => {
    if (open && !name) {
      setName(getSuggestedName(type))
    }
  }, [open])

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
    setType('facebook')
    setUrls('')
    setOpen(false)
  }

  const getSuggestedName = (platformType: 'facebook' | 'instagram' = type) => {
    const now = new Date()
    const date = now.toLocaleDateString()
    const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

    if (platformType === 'facebook') {
      return `Facebook Audience ${date} ${time}`
    }
    if (platformType === 'instagram') {
      return `Instagram Audience ${date} ${time}`
    }
    return ''
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Source Audience
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                    // Update suggested name if current name is empty or matches the previous suggestion
                    if (!name || name.startsWith('Instagram Audience ')) {
                      setName(getSuggestedName('facebook'))
                    }
                    setType('facebook')
                  }}
                  className={`flex flex-col items-center gap-2 p-6 rounded-lg border-2 transition-all ${
                    type === 'facebook' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <Facebook className="h-12 w-12" />
                  <span className="font-medium">Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Update suggested name if current name is empty or matches the previous suggestion
                    if (!name || name.startsWith('Facebook Audience ')) {
                      setName(getSuggestedName('instagram'))
                    }
                    setType('instagram')
                  }}
                  className={`flex flex-col items-center gap-2 p-6 rounded-lg border-2 transition-all ${
                    type === 'instagram' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/50'
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
                placeholder="My Audience"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name for this audience source (auto-generated with timestamp)
              </p>
            </div>

            {/* URLs */}
            <div className="space-y-2">
              <Label htmlFor="urls">URLs *</Label>
              <Textarea
                id="urls"
                placeholder={type === 'instagram'
                  ? `https://www.instagram.com/p/ABC123/&#10;https://www.instagram.com/reel/ABC123/&#10;# Each URL must be a specific post or reel`
                  : `https://www.facebook.com/pageName/posts/123456&#10;# Each URL must be a specific post with comments`
                }
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={8}
                required
                className="font-mono text-sm"
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Enter one URL per line. Empty lines and lines starting with # will be ignored.
                  {urls.split('\n').filter((u) => u.trim() && !u.trim().startsWith('#')).length > 0 && (
                    <span className="font-medium text-foreground ml-1">
                      ({urls.split('\n').filter((u) => u.trim() && !u.trim().startsWith('#')).length} URLs
                      detected)
                    </span>
                  )}
                </p>
                {type === 'instagram' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>⚠️ Important:</strong> Only post and reel URLs are supported. Profile URLs like instagram.com/username will NOT work.
                    <br />
                    To get a post URL: Open Instagram → Find a post → Click ••• → Copy link
                  </p>
                )}
                {type === 'facebook' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>⚠️ Important:</strong> Only specific post URLs are supported. Page or group URLs will NOT work.
                    <br />
                    To get a post URL: Open Facebook → Find a post → Click the timestamp → Copy URL from address bar
                  </p>
                )}
              </div>
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
