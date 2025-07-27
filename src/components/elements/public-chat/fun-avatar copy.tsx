"use client"
export default function FunAvatar({ name, isCurrentUser }: { name: string; isCurrentUser: boolean }) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase()

  const avatarColors = [
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-yellow-400 to-yellow-600",
    "bg-gradient-to-br from-red-400 to-red-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
  ]

  const colorIndex = name.charCodeAt(0) % avatarColors.length
  const avatarColor = isCurrentUser ? "bg-gradient-to-br from-orange-400 to-pink-500" : avatarColors[colorIndex]

  return (
    <div
      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg transform active:scale-110 transition-all duration-200 ring-2 ring-white cursor-pointer`}
    >
      {getInitials(name)}
    </div>
  )
}
