'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = `${pathname}${searchParams ? `?${searchParams}` : ''}`
    // Здесь вы можете добавить любую дополнительную логику при изменении маршрута
  }, [pathname, searchParams])

  return null
}
