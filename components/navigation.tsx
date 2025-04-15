'use client';

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { FilmIcon, HomeIcon, TrendingUpIcon, UserIcon, Settings, Award, Plus } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { LanguageToggle } from "./language-toggle"
import { AuthButton } from "./auth/auth-button"
import { useTranslation } from 'react-i18next'
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, i18n } = useTranslation('common')
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.is_admin || false)
      }
    }
    checkAdminStatus()
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: t('navigation.home'), icon: HomeIcon },
    { href: "/discover", label: t('navigation.discover'), icon: TrendingUpIcon },
    { href: "/profile", label: t('navigation.profile'), icon: UserIcon },
    { href: "/achievements", label: t('navigation.achievements'), icon: Award },
  ]

  if (isAdmin) {
    navItems.push({ href: "/admin", label: t('navigation.admin'), icon: Settings })
  }

  if (!mounted) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              <FilmIcon className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="font-bold">{t('navigation.home')}</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/overview"
              className={pathname === '/overview' ? 'text-foreground' : 'text-foreground/60'}
            >
              {t('navigation.overview')}
            </Link>
            <Link
              href="/admin"
              className={pathname === '/admin' ? 'text-foreground' : 'text-foreground/60'}
            >
              {t('navigation.admin')}
            </Link>
            <Link
              href="/profile"  // этот путь правильный, так как Next.js разрешает его в /(main)/profile
              className={pathname === '/profile' ? 'text-foreground' : 'text-foreground/60'}
            >
              {t('navigation.profile')}
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <LanguageToggle />
          <AuthButton />
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}