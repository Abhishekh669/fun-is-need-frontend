"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { signInWithGoogle } from "@/lib/actions/auth/sign-in";
import { FcGoogle } from "react-icons/fc";


const heroImages = ["/image1.webp", "/image2.webp"];

export default function LoginPage() {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md sm:max-w-lg">
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden backdrop-blur-sm bg-white/90">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 sm:p-8">
              <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white/30 shadow-lg">
                  <AvatarImage src="/logo.png" alt="App Logo" />
                  <AvatarFallback className="bg-white text-blue-600 font-bold text-3xl">💬</AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1 sm:space-y-2">
                  <CardTitle className="text-3xl sm:text-4xl font-bold text-white">
                    Welcome Back
                  </CardTitle>
                  <p className="text-blue-100 text-base sm:text-lg">
                    Sign in to continue your conversations
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-10 space-y-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">Ready to get started?</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Sign in with your Google account to access all features
                </p>
              </div>

             <Button
            className="w-full cursor-pointer"
            variant="outline"
            onClick={signInWithGoogle}
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>

              <div className="text-center space-y-3">
                <p className="text-xs sm:text-sm text-gray-500">
                  By signing in, you agree to our{" "}
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 underline">
                    Privacy Policy
                  </a>
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  New to our platform?{" "}
                  <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                    Learn more about our features
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="w-full lg:w-1/2 relative min-h-[300px] sm:min-h-[400px] lg:min-h-screen">
        {/* Background carousel image */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((src, idx) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === activeImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={src}
                  alt={`Background ${idx + 1}`}
                  fill
                  sizes="100vw"
                  priority={idx === 0}
                  className="object-cover object-center"
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
              </div>
            </div>
          ))}
        </div>

        {/* Overlay Text */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12 text-white z-10">
          <div className="max-w-xl space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Connect & Collaborate
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mt-2 sm:mt-4 leading-relaxed">
                Join thousands of teams using our platform for seamless communication and productivity.
              </p>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6 pt-2 sm:pt-4">
              <div className="flex -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
                ].map((src, i) => (
                  <Avatar key={i} className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white">
                    <AvatarImage src={src} />
                    <AvatarFallback>U{i + 1}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-sm font-semibold">
                  +5k
                </div>
              </div>
              <div className="text-sm sm:text-base text-blue-100">
                <p className="font-semibold">Trusted by 5,000+ users</p>
                <p className="text-xs sm:text-sm opacity-90">Join our growing community</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
