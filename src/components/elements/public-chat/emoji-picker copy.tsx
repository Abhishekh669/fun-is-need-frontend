"use client"

export default function EmojiPicker({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) {
  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥", "👏", "💯"]

  return (
    <div className="grid grid-cols-5 gap-2 p-3 bg-white rounded-lg shadow-lg border">
      {commonEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className="text-lg sm:text-xl hover:bg-gray-100 active:bg-gray-200 p-2 rounded-lg transition-colors active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
