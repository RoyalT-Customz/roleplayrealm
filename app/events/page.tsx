'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus, Calendar, MapPin, Users } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { formatDate } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description: string | null
  startAt: string
  endAt: string
  location: string | null
  capacity: number | null
  host: {
    username: string
  }
  _count: {
    attendees: number
  }
}

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [upcoming, setUpcoming] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [upcoming])

  const fetchEvents = async () => {
    try {
      const url = upcoming
        ? '/api/events?upcoming=true'
        : '/api/events'
      const response = await fetch(url)
      const data = await response.json()
      setEvents(data.events)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Events</h1>
        {user && (
          <Link href="/events/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setUpcoming(true)}
          className={`px-4 py-2 rounded-lg ${
            upcoming
              ? 'bg-primary-600 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setUpcoming(false)}
          className={`px-4 py-2 rounded-lg ${
            !upcoming
              ? 'bg-primary-600 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          All Events
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-dark-400">Loading events...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="card hover:border-primary-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-dark-300 mb-4">{event.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-dark-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.startAt)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {event._count.attendees}
                        {event.capacity && ` / ${event.capacity}`} attendees
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <p className="text-sm text-dark-400 mb-2">Hosted by</p>
                  <p className="font-medium">{event.host.username}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-dark-400">No events found</p>
        </div>
      )}
    </div>
  )
}

