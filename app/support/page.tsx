'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { MessageSquare, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Ticket {
  id: string
  type: string
  subject: string
  description: string
  status: string
  responses: any[]
  createdAt: string
  updatedAt: string
}

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: 'feature_request',
    subject: '',
    description: '',
  })

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/support/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      fetchTickets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || 'Failed to create ticket'
        throw new Error(errorMessage)
      }

      showToast('Ticket submitted successfully!', 'success')
      setFormData({ type: 'feature_request', subject: '', description: '' })
      setShowCreateForm(false)
      fetchTickets()
    } catch (error: any) {
      console.error('Error creating ticket:', error)
      showToast(error.message || 'Failed to create ticket', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <MessageSquare className="w-4 h-4 text-primary-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature_request':
        return 'Feature Request'
      case 'marketplace_access':
        return 'Marketplace Access'
      default:
        return 'Other'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Support</h1>
            <p className="text-dark-400">
              Submit a ticket for feature requests or marketplace access
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {showCreateForm && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Create Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">
                  Ticket Type <span className="text-red-400">*</span>
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="feature_request">Feature Request (Home Page)</option>
                  <option value="marketplace_access">Marketplace Access</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input w-full"
                  required
                  placeholder="Brief description of your request"
                  maxLength={200}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full min-h-[150px] resize-none"
                  required
                  placeholder="Provide details about your request..."
                  maxLength={2000}
                />
                <p className="text-xs text-dark-400 mt-1">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ type: 'feature_request', subject: '', description: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Your Tickets</h2>

          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-400">No tickets yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(ticket.status)}
                        <span className="font-semibold">{ticket.subject}</span>
                        <span className="px-2 py-1 bg-dark-600 text-xs rounded">
                          {getTypeLabel(ticket.type)}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300 mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-dark-400">
                        <span>Status: {getStatusLabel(ticket.status)}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {ticket.responses && Array.isArray(ticket.responses) && ticket.responses.length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-dark-600">
                      <h4 className="text-sm font-semibold mb-2">Responses:</h4>
                      <div className="space-y-2">
                        {ticket.responses.map((response: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${
                              response.isAdmin
                                ? 'bg-primary-900/20 border border-primary-800'
                                : 'bg-dark-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">
                                {response.username || 'User'}
                              </span>
                              {response.isAdmin && (
                                <span className="px-2 py-0.5 bg-primary-900/30 text-primary-400 text-xs rounded">
                                  Admin
                                </span>
                              )}
                              <span className="text-xs text-dark-400">
                                {formatRelativeTime(response.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-dark-300">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {ToastComponent}
    </div>
  )
}

