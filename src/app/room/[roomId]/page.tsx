"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { useRealtime } from "@/lib/realtime-client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

const Page = () => {
  const params = useParams()
  const roomId = params.roomId as string
  const router = useRouter()
  const { username } = useUsername()
  
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null) // Ref for auto-scroll

  const [copyStatus, setCopyStatus] = useState("COPY ID")
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // 1. DATA FETCHING
  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } })
      return res.data
    },
  })

  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  // 2. TIMER LOGIC
  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return

    if (timeRemaining === 0) {
      router.push("/?destroyed=true")
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, router])

  // 3. MESSAGES QUERY
  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } })
      return res.data
    },
  })

  // 4. SEND MUTATION
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post({ sender: username, text }, { query: { roomId } })
      setInput("")
    },
    onSuccess: () => {
      
    }
  })

  // 5. REALTIME SYNC
  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") refetch()
      if (event === "chat.destroy") router.push("/?destroyed=true")
    },
  })

  // 6. DESTROY MUTATION
  const { mutate: destroyRoom, isPending: isDestroying } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } })
    },
  })

  // 7. AUTO SCROLL (Simple implementation)
  useEffect(() => {
    if (messages?.messages) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])


  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopyStatus("COPIED!")
    setTimeout(() => setCopyStatus("COPY ID"), 2000)
  }

  return (
    <main className="relative flex flex-col h-screen max-h-screen overflow-hidden bg-black selection:bg-green-500/30 font-sans">
      
      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* HEADER */}
      <header className="z-20 border-b border-zinc-800/60 p-4 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">SECURE LINE</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
              <span className="font-bold text-zinc-200 text-sm font-mono truncate max-w-[100px] sm:max-w-xs">
                {roomId}
              </span>
              <button
                onClick={copyLink}
                className="text-[10px] bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-white transition-all ml-2"
              >
                {copyStatus}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">AUTO-WIPE</span>
            <span
              className={`text-lg font-mono font-bold leading-none ${
                timeRemaining !== null && timeRemaining < 60 ? "text-red-500 animate-pulse" : "text-zinc-300"
              }`}
            >
              {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
            </span>
          </div>

          <button
            onClick={() => destroyRoom()}
            disabled={isDestroying}
            className="group relative overflow-hidden rounded bg-red-950/30 border border-red-900/50 px-4 py-2 hover:bg-red-900/50 transition-all"
          >
             <span className="relative z-10 flex items-center gap-2 text-xs font-bold text-red-500 group-hover:text-red-400">
               {isDestroying ? "WIPING..." : "NUKE"}
               <span className="text-[10px] hidden sm:inline">DATA</span>
             </span>
          </button>
        </div>
      </header>

      {/* MESSAGES AREA */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        
        {/* WELCOME MESSAGE */}
        <div className="flex justify-center py-8">
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 max-w-sm text-center">
             <p className="text-zinc-500 text-xs font-mono mb-2">● SYSTEM NOTIFICATION</p>
             <p className="text-zinc-400 text-sm">
               This room is encrypted end-to-end. Messages self-destruct when the timer hits zero.
             </p>
           </div>
        </div>

        {/* EMPTY STATE */}
        {messages?.messages.length === 0 && (
          <div className="flex items-center justify-center h-40 opacity-50">
            <p className="text-zinc-600 text-sm font-mono animate-pulse">
              Waiting for encrypted signal...
            </p>
          </div>
        )}

        {/* CHAT BUBBLES */}
        {messages?.messages.map((msg) => {
           const isMe = msg.sender === username;
           return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] group relative`}>
                
                {/* METADATA */}
                <div className={`flex items-baseline gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <span className={`text-[10px] font-mono font-bold ${isMe ? "text-green-500" : "text-blue-500"}`}>
                    {isMe ? "YOU" : msg.sender.slice(0, 12)}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono">
                    {format(msg.timestamp, "HH:mm")}
                  </span>
                </div>

                {/* BUBBLE */}
                <div 
                  className={`
                    relative px-4 py-3 text-sm leading-relaxed shadow-lg
                    ${isMe 
                      ? "bg-green-950/20 border border-green-500/20 text-green-100 rounded-2xl rounded-tr-none" 
                      : "bg-zinc-900/80 border border-zinc-700/50 text-zinc-100 rounded-2xl rounded-tl-none"
                    }
                  `}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
           )
        })}
        {/* Invisible element to auto-scroll to */}
        <div ref={scrollRef} /> 
      </div>

      {/* INPUT AREA */}
      <div className="z-20 p-4 bg-black/80 backdrop-blur-xl border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-green-500/5 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-mono text-xs animate-pulse">
              {">"}
            </span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input })
                }
              }}
              placeholder="Type encrypted message..."
              onChange={(e) => setInput(e.target.value)}
              className="relative w-full bg-black border border-zinc-800 group-focus-within:border-green-500/30 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3.5 pl-8 pr-4 text-sm rounded-lg font-mono shadow-inner"
            />
          </div>

          <button
            onClick={() => {
              sendMessage({ text: input })
              inputRef.current?.focus()
            }}
            disabled={!input.trim() || isPending}
            className="bg-zinc-100 hover:bg-white text-black px-6 rounded-lg text-xs font-bold tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  )
}

export default Page