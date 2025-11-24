'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus, Download, ExternalLink, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useToast } from '@/components/ui/Toast'
import { EditMarketplaceModal } from '@/components/marketplace/EditMarketplaceModal'

interface Listing {
  id: string
  title: string
  description: string | null
  category: string
  price: number | null
  tebexLink: string | null
  media: any
  tags: string[]
  downloads: number
  owner: {
    id: string
    username: string
  }
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Fetch current user's database ID and admin status
  useEffect(() => {
    if (user) {
      fetch('/api/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setCurrentUserId(data.id)
          }
          if (data.isAdmin) {
            setIsAdmin(data.isAdmin)
          }
        })
        .catch(() => {
          // Ignore errors
        })
    }
  }, [user])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showMenu && !target.closest('.marketplace-menu-container')) {
        setShowMenu(null)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  useEffect(() => {
    fetchListings()
  }, [category])

  const fetchListings = async () => {
    try {
      const url = category
        ? `/api/marketplace?category=${category}`
        : '/api/marketplace'
      const response = await fetch(url)
      const data = await response.json()
      setListings(data.listings)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (listingId: string) => {
    const listing = listings.find((l) => l.id === listingId)
    const isOwner = currentUserId && listing && listing.owner.id === currentUserId
    const confirmMessage = isAdmin && !isOwner
      ? `Are you sure you want to delete this listing as an admin? This action cannot be undone.`
      : 'Are you sure you want to delete this listing? This action cannot be undone.'
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(listingId)
    try {
      const response = await fetch(`/api/marketplace/${listingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete listing')
      }

      showToast('Listing deleted successfully', 'success')
      setListings((prev) => prev.filter((l) => l.id !== listingId))
    } catch (error: any) {
      console.error('Error deleting listing:', error)
      showToast(error.message || 'Failed to delete listing', 'error')
    } finally {
      setIsDeleting(null)
      setShowMenu(null)
    }
  }

  const handleEdit = (listingId: string) => {
    setShowEditModal(listingId)
    setShowMenu(null)
  }

  const categories = ['script', 'asset', 'vehicle', 'map', 'other']

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Marketplace</h1>
        {user && (
          <Link href="/marketplace/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              List Item
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-lg ${
            category === ''
              ? 'bg-primary-600 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg capitalize ${
              category === cat
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-dark-400">Loading listings...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const isOwner = currentUserId && listing.owner.id === currentUserId
            const canDelete = isOwner || isAdmin
            const canEdit = isOwner

            return (
              <div
                key={listing.id}
                className={`card transition-colors relative ${
                  listing.tebexLink
                    ? 'hover:border-primary-600 hover:shadow-lg'
                    : 'opacity-75'
                }`}
              >
                {canDelete && (
                  <div
                    className="absolute top-4 right-4 z-10 marketplace-menu-container"
                    ref={(el) => {
                      menuRefs.current[listing.id] = el
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(showMenu === listing.id ? null : listing.id)
                      }}
                      className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                      disabled={isDeleting === listing.id}
                    >
                      <MoreVertical className="w-5 h-5 text-dark-400" />
                    </button>
                    {showMenu === listing.id && (
                      <div className="absolute right-0 top-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(listing.id)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-dark-700 transition-colors text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(listing.id)
                          }}
                          disabled={isDeleting === listing.id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-dark-700 transition-colors text-sm text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting === listing.id
                            ? 'Deleting...'
                            : isAdmin && !isOwner
                            ? 'Delete (Admin)'
                            : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={listing.tebexLink ? 'cursor-pointer' : ''}
                  onClick={() => {
                    if (listing.tebexLink) {
                      window.open(listing.tebexLink, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{listing.title}</h3>
                      <p className="text-sm text-dark-400">by {listing.owner.username}</p>
                    </div>
                    <span className="px-2 py-1 bg-dark-700 text-xs rounded capitalize">
                      {listing.category}
                    </span>
                  </div>

              {listing.description && (
                <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                  {listing.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                <div className="text-lg font-bold">
                  {listing.price === null ? (
                    <span className="text-primary-400">Free</span>
                  ) : (
                    <span>${listing.price.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-dark-400 text-sm">
                  <Download className="w-4 h-4" />
                  <span>{listing.downloads}</span>
                </div>
              </div>
                  {listing.tebexLink ? (
                    <div className="mt-3 flex items-center gap-2 text-primary-400 text-sm">
                      <ExternalLink className="w-4 h-4" />
                      <span>Click to view on Tebex</span>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-yellow-400">
                      No store link available
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {listings.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-dark-400">No listings found</p>
        </div>
      )}

      {showEditModal && (() => {
        const listingToEdit = listings.find((l) => l.id === showEditModal)
        if (!listingToEdit) {
          return null
        }
        return (
          <EditMarketplaceModal
            isOpen={!!showEditModal}
            onClose={() => setShowEditModal(null)}
            onSuccess={() => {
              setShowEditModal(null)
              fetchListings()
            }}
            listing={listingToEdit}
          />
        )
      })()}

      {ToastComponent}
    </div>
  )
}

