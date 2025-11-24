'use client'

import Link from 'next/link'
import { Feed } from '@/components/feed/Feed'
import { FeaturedServers } from '@/components/servers/FeaturedServers'
import { TrendingClips } from '@/components/feed/TrendingClips'
import { useAuth } from './providers'
import { AlertCircle } from 'lucide-react'

export default function HomePage() {
  const { isConfigured } = useAuth()
  
  return (
    <div className="min-h-screen">
      {!isConfigured && (
        <div className="bg-primary-900/20 border-b border-primary-700/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-primary-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                Preview Mode: Connect Supabase in your .env file to enable full functionality
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dark-800 via-dark-900 to-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Roleplay Realm
            </h1>
            <p className="text-xl text-dark-300 mb-8">
              Your FiveM Community Hub - Discover Servers, Share Content, Connect with Players
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/servers" className="btn btn-primary">
                Browse Servers
              </Link>
              <Link href="/auth/signup" className="btn btn-outline">
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Servers Carousel */}
      <section className="py-8 border-b border-dark-700">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Featured Servers</h2>
          <FeaturedServers />
        </div>
      </section>

      {/* Trending Clips */}
      <section className="py-8 border-b border-dark-700">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Trending Clips</h2>
          <TrendingClips />
        </div>
      </section>

      {/* Main Feed */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Community Feed</h2>
            <Feed />
          </div>
        </div>
      </section>
    </div>
  )
}

