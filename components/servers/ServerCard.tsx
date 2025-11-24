import Link from 'next/link'
import Image from 'next/image'
import { ArrowUp, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface ServerCardProps {
  server: {
    id: string
    name: string
    logoUrl: string | null
    description: string | null
    upvotes: number
    tags: string[]
    owner: {
      username: string
    }
  }
}

export function ServerCard({ server }: ServerCardProps) {
  return (
    <Link href={`/servers/${server.id}`}>
      <div className="card hover:border-primary-600 transition-colors cursor-pointer">
        <div className="flex items-start gap-4 mb-4">
          {server.logoUrl ? (
            <Image
              src={server.logoUrl}
              alt={server.name}
              width={64}
              height={64}
              className="rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-dark-700 rounded-lg flex items-center justify-center">
              <Users className="w-8 h-8 text-dark-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 truncate">{server.name}</h3>
            <p className="text-sm text-dark-400">by {server.owner.username}</p>
          </div>
        </div>

        {server.description && (
          <p className="text-sm text-dark-300 mb-4 line-clamp-2">
            {server.description}
          </p>
        )}

        {server.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {server.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-dark-700 text-xs rounded text-dark-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-dark-700">
          <div className="flex items-center gap-1 text-primary-400">
            <ArrowUp className="w-4 h-4" />
            <span className="text-sm font-medium">{server.upvotes}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

