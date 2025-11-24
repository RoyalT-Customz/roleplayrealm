'use client'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          <h1 className="text-3xl font-bold mb-4">Check your email</h1>
          <p className="text-dark-300 mb-6">
            We&apos;ve sent you a verification link. Please check your email and click the link to verify your account.
          </p>
          <p className="text-sm text-dark-400">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
        </div>
      </div>
    </div>
  )
}

