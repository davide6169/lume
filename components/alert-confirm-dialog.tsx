import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AlertConfirmDialogOptions {
  title: string
  description: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function AlertConfirmDialog(options: AlertConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const Dialog = () => {
      const [open, setOpen] = useState(true)

      const handleConfirm = () => {
        setOpen(false)
        resolve(true)
      }

      const handleCancel = () => {
        setOpen(false)
        resolve(false)
      }

      return (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                {options.cancelText || 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className={options.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              >
                {options.confirmText || 'Continue'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    // Create a temporary container and render the dialog
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Use ReactDOM to render the dialog
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(container)
      root.render(<Dialog />)

      // Cleanup after dialog closes
      setTimeout(() => {
        root.unmount()
        document.body.removeChild(container)
      }, 100)
    })
  })
}
