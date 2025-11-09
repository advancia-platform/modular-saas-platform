'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState('')
  const [toast, setToast] = useState('')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('Resetting password...')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setToast('✅ Password reset successful! Redirecting to login...')
        setTimeout(() => router.push('/login?reset=success'), 2500)
      } else {
        setToast('❌ ' + (data.error || 'Failed to reset password'))
      }
    } catch (err) {
      setToast('❌ Network error while resetting password')
    }
    setStatus('')
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50'>
      <form onSubmit={handleSubmit} className='bg-white p-6 rounded-md shadow-md w-full max-w-sm'>
        <h2 className='text-2xl font-semibold mb-4 text-center'>Reset Password</h2>
        <input
          type='password'
          placeholder='Enter new password'
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className='border border-gray-300 rounded-md w-full p-2 mb-4'
          required
        />
        <button
          type='submit'
          className='bg-green-600 text-white rounded-md w-full py-2 hover:bg-green-700 disabled:opacity-50'
          disabled={!newPassword || !!status}
        >
          {status || 'Reset Password'}
        </button>
        {toast && <p className='mt-4 text-center text-sm'>{toast}</p>}
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center'>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
