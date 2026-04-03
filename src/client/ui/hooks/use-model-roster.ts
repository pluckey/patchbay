"use client"

import { useState, useEffect } from "react"
import type { ModelRosterEntry } from "@/kernel/entities"
import { useAdapters } from "@/client/ui/app/adapters-context"

export function useModelRoster() {
  const { modelRoster } = useAdapters()
  const [roster, setRoster] = useState<ModelRosterEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    modelRoster.getRoster().then((entries) => {
      if (!cancelled) {
        setRoster(entries)
        setIsLoading(false)
      }
    }).catch((e) => {
      console.error("Failed to load model roster:", e)
      if (!cancelled) setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [modelRoster])

  return { roster, isLoading }
}
