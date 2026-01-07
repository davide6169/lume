'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ConfigurationRequiredAlertProps {
  type?: 'auth' | 'general'
}

export function ConfigurationRequiredAlert({ type = 'auth' }: ConfigurationRequiredAlertProps) {
  const getTitle = () => {
    return type === 'auth'
      ? 'Authentication Not Configured'
      : 'System Not Configured'
  }

  const getMessage = () => {
    return type === 'auth'
      ? 'The authentication system is not yet configured. Please contact your system administrator to complete the setup.'
      : 'The system is not yet configured. Please contact your system administrator to complete the setup.'
  }

  const getDetails = () => {
    return type === 'auth'
      ? [
          'Database connection (Supabase) must be configured',
          'Environment variables need to be set up in Vercel',
          'Please contact your administrator before attempting to sign in',
        ]
      : [
          'Required environment variables are not configured',
          'Please contact your system administrator',
        ]
  }

  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/50">
      <AlertCircle className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 dark:text-orange-100 text-lg font-semibold">
        {getTitle()}
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm mt-3">
        <p className="mb-3 font-medium">{getMessage()}</p>
        <div className="space-y-1">
          <p className="font-semibold text-xs uppercase tracking-wide text-orange-900 dark:text-orange-100">
            Required Actions:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
            {getDetails().map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-md border border-orange-200 dark:border-orange-800">
          <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
            📧 Administrators: Configure environment variables in Vercel Dashboard → Settings → Environment Variables
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
