'use client'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('Sending...')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      setStatus(data.message || 'Email sent successfully!')
    } catch (err) {
      setStatus('Error sending reset email.')
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50'>
      <form onSubmit={handleSubmit} className='bg-white p-6 rounded-md shadow-md w-full max-w-sm'>
        <h2 className='text-2xl font-semibold mb-4 text-center'>Forgot Password</h2>
        <input
          type='email'
          placeholder='Enter your email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          className='border border-gray-300 rounded-md w-full p-2 mb-4'
          required
        />
        <button type='submit' className='bg-blue-600 text-white rounded-md w-full py-2 hover:bg-blue-700'>
          Send Reset Link
        </button>
        <p className='text-sm mt-3 text-center text-gray-600'>{status}</p>
      </form>
    </div>
  )
}

