"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  )
}

export default Page

function Lobby() {
  const { username } = useUsername()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [mounted, setMounted] = useState(false)
  const wasDestroyed = searchParams.get("destroyed") === "true"
  const error = searchParams.get("error")

  // Prevent hydration mismatch for random username
  useEffect(() => {
    setMounted(true)
  }, [])

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post()
      if (res.status === 200 && res.data) {
        router.push(`/room/${res.data.roomId}`)
      }
    },
  })

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-black selection:bg-green-500/30">
      
      
<div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] opacity-50" />
      
      {/* 2. GLOW EFFECT */}
      <div className="absolute z-0 bg-green-500/25 w-96 h-96 blur-[128px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-4">
          <div className="inline-block border border-green-500/30 bg-green-500/10 px-3 py-1 rounded-full backdrop-blur-md">
            <span className="text-xs font-mono text-green-400 tracking-wider">
              ● ENCRYPTED CONNECTION
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
            Ghost<span className="text-green-500">Chat</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-[300px] mx-auto leading-relaxed">
            Create a temporary, secure room. 
            <br />
            Data self-destructs when the timer hits zero.
          </p>
        </div>

        {/* ERROR ALERTS */}
        {wasDestroyed && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-red-950/40 border border-red-900/50 p-4 rounded-lg text-center backdrop-blur-sm">
            <p className="text-red-400 text-sm font-bold font-mono">🚫 SESSION TERMINATED</p>
            <p className="text-zinc-500 text-xs mt-1">
              Room history has been permanently wiped from the database.
            </p>
          </div>
        )}
        
        {error === "room-full" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-amber-950/40 border border-amber-900/50 p-4 rounded-lg text-center backdrop-blur-sm">
           <p className="text-amber-500 text-sm font-bold font-mono">⚠️ ACCESS DENIED</p>
           <p className="text-zinc-500 text-xs mt-1">
             That room is currently at maximum capacity (2/2).
           </p>
         </div>
        )}

        {/* CARD */}
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                Your Alias
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-black/50 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-300 font-mono shadow-inner">
                  {mounted ? username : <span className="animate-pulse">Initializing ID...</span>}
                </div>
              </div>
            </div>

            <button
              onClick={() => createRoom()}
              disabled={isPending || !mounted}
              className="group relative w-full overflow-hidden rounded-lg bg-white p-3.5 text-sm font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <span className="relative flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <span className="animate-spin">◌</span> ESTABLISHING LINK...
                  </>
                ) : (
                  <>
                    CREATE SECURE ROOM <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </span>
            </button>
            
            <p className="text-center text-[10px] text-zinc-600">
              By creating a room, you agree to the <span className="underline decoration-zinc-700 cursor-pointer hover:text-zinc-400">Privacy Protocol</span>.
              <br/>
              (Spoiler: We don't save anything.)
            </p>

          </div>
        </div>
      </div>
    </main>
  )
}