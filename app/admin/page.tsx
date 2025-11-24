'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui/Button'
import { ServerCard } from '@/components/servers/ServerCard'
import { useToast } from '@/components/ui/Toast'
import { MessageSquare, CheckCircle, Clock, XCircle, Send } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Server {
  id: string
  name: string
  logoUrl: string | null
  description: string | null
  upvotes: number
  tags: string[]
  isFeatured: boolean
  status: string
  owner: {
    username: string
  }
}

interface Ticket {
  id: string
  type: string
  subject: string
  description: string
  status: string
  responses: any[]
  createdAt: string
  user: {
    id: string
    username: string
    email: string
  }
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [servers, setServers] = useState<Server[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'servers' | 'tickets'>('servers')
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responding, setResponding] = useState(false)

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    }
  }

  const fetchServers = async () => {
    try {
      // Fetch all servers including pending ones for admin review
      const response = await fetch('/api/admin/servers?limit=100')
      if (!response.ok) {
        // Fallback to regular API if admin endpoint doesn't exist
        const fallbackResponse = await fetch('/api/servers?limit=100')
        const fallbackData = await fallbackResponse.json()
        setServers(fallbackData.servers)
      } else {
        const data = await response.json()
        setServers(data.servers)
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFeatured = async (serverId: string, featured: boolean) => {
    try {
      const response = await fetch('/api/admin/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, featured }),
      })

      if (response.ok) {
        setServers((prev) =>
          prev.map((s) => (s.id === serverId ? { ...s, isFeatured: featured } : s))
        )
      }
    } catch (error) {
      console.error('Error updating featured status:', error)
    }
  }

  const updateServerStatus = async (serverId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/servers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, status }),
      })

      if (response.ok) {
        setServers((prev) =>
          prev.map((s) => (s.id === serverId ? { ...s, status } : s))
        )
      }
    } catch (error) {
      console.error('Error updating server status:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true)
      const response = await fetch('/api/support/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setTicketsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      checkAdmin()
      fetchServers()
      fetchTickets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router])

  const handleTicketResponse = async (ticketId: string) => {
    if (!responseText.trim()) return

    setResponding(true)
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to respond to ticket')
      }

      showToast('Response sent successfully!', 'success')
      setResponseText('')
      setSelectedTicket(null)
      fetchTickets()
    } catch (error) {
      console.error('Error responding to ticket:', error)
      showToast('Failed to send response', 'error')
    } finally {
      setResponding(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        showToast('Ticket status updated!', 'success')
        fetchTickets()
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      showToast('Failed to update ticket status', 'error')
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-dark-400">You must be signed in to access this page.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-dark-400">You must be an admin to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <Fragment>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('servers')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'servers'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Server Management
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 font-semibold transition-colors relative ${
            activeTab === 'tickets'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Support Tickets
          {tickets && tickets.filter((t) => t.status === 'open').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {tickets.filter((t) => t.status === 'open').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'servers' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Server Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div key={server.id} className="card">
              <ServerCard server={server} />
              <div className="mt-4 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {server.status === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateServerStatus(server.id, 'active')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateServerStatus(server.id, 'suspended')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {server.status === 'active' && (
                    <Button
                      variant={server.isFeatured ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => toggleFeatured(server.id, !server.isFeatured)}
                    >
                      {server.isFeatured ? 'Unfeature' : 'Feature'}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    server.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                    server.status === 'active' ? 'bg-green-900/30 text-green-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {server.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Support Tickets</h2>

          {ticketsLoading ? (
            <div className="text-center py-12">
              <div className="text-dark-400">Loading tickets...</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-400">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(ticket.status)}
                        <span className="font-semibold text-lg">{ticket.subject}</span>
                        <span className="px-2 py-1 bg-dark-700 text-xs rounded">
                          {getTypeLabel(ticket.type)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          ticket.status === 'open' ? 'bg-yellow-900/30 text-yellow-400' :
                          ticket.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400' :
                          ticket.status === 'resolved' ? 'bg-green-900/30 text-green-400' :
                          'bg-dark-700 text-dark-400'
                        }`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300 mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-dark-400 mb-4">
                        <span>From: {ticket.user.username} ({ticket.user.email})</span>
                        <span>•</span>
                        <span>{formatRelativeTime(ticket.createdAt)}</span>
                      </div>

                      {ticket.responses && Array.isArray(ticket.responses) && ticket.responses.length > 0 ? (
                        <div className="mb-4 pt-4 border-t border-dark-700">
                          <h4 className="text-sm font-semibold mb-2">Responses:</h4>
                          <div className="space-y-2">
                            {ticket.responses.map((response: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg ${
                                  response.isAdmin
                                    ? 'bg-primary-900/20 border border-primary-800'
                                    : 'bg-dark-700'
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
                                  {response.createdAt && (
                                    <span className="text-xs text-dark-400">
                                      {formatRelativeTime(response.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-dark-300">{response.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTicket === ticket.id ? (
                        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            className="input w-full min-h-[100px] resize-none mb-2"
                            placeholder="Type your response..."
                            maxLength={2000}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleTicketResponse(ticket.id)}
                              disabled={!responseText.trim() || responding}
                              size="sm"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {responding ? 'Sending...' : 'Send Response'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(null)
                                setResponseText('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => setSelectedTicket(ticket.id)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Respond
                          </Button>
                          {ticket.status === 'open' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                            >
                              Mark In Progress
                            </Button>
                          )}
                          {ticket.status !== 'resolved' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                            >
                              Mark Resolved
                            </Button>
                          )}
                          {ticket.status !== 'closed' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateTicketStatus(ticket.id, 'closed')}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {ToastComponent}
    </div>
    </Fragment>
  )
}

