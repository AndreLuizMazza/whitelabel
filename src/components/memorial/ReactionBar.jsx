import { Flower2, Flame, Heart } from 'lucide-react'

export default function ReactionBar({ reactions = {}, onReact }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="btn-primary inline-flex items-center gap-2 px-3 py-2 rounded-full"
              onClick={() => onReact('flores')}>
        <Flower2 className="h-4 w-4" />
        Flores <span className="opacity-80">({reactions.flores || 0})</span>
      </button>

      <button className="btn-primary inline-flex items-center gap-2 px-3 py-2 rounded-full"
              onClick={() => onReact('vela')}>
        <Flame className="h-4 w-4" />
        Vela <span className="opacity-80">({reactions.vela || 0})</span>
      </button>

      <button className="btn-primary inline-flex items-center gap-2 px-3 py-2 rounded-full"
              onClick={() => onReact('coracao')}>
        <Heart className="h-4 w-4" />
        Coração <span className="opacity-80">({reactions.coracao || 0})</span>
      </button>
    </div>
  )
}
