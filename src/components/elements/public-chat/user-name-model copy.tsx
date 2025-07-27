"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export default function UsernameModal({
  open,
  inputValue,
  isPending,
  isUsernameValid,
  onInputChange,
  onSubmit,
}: {
  open: boolean
  inputValue: string
  isPending: boolean
  isUsernameValid: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-purple-200 mx-4">
        <DialogHeader className="text-center">
          <div className="text-3xl sm:text-4xl mb-2">🎭</div>
          <DialogTitle className="text-xl sm:text-2xl text-purple-600 font-bold">Join the Fun Zone!</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-gray-600">
            Pick a cool username and let's get this party started! 🎉
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {inputValue && !isUsernameValid && (
            <div className="bg-gradient-to-r from-red-400 to-pink-400 text-white text-center px-4 py-2 rounded-2xl text-sm font-medium animate-pulse">
              Oops! That name's taken! Try another one! 🔄
            </div>
          )}
          <Label htmlFor="username" className="text-sm text-purple-600 font-semibold">
            Your Fun Username ✨
          </Label>
          <Input
            id="username"
            placeholder="e.g. CoolCat123, FunnyBunny, etc."
            className="bg-white/80 border-2 border-purple-200 rounded-2xl focus:border-purple-400 text-center font-medium text-sm sm:text-base"
            value={inputValue}
            onChange={onInputChange}
            minLength={3}
            maxLength={15}
          />
        </div>
        <Button
          disabled={isPending || inputValue.trim() === "" || !isUsernameValid}
          onClick={onSubmit}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl py-3 font-bold text-base sm:text-lg shadow-lg transform active:scale-95 transition-all duration-200"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating magic...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Let's Go! <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}