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
        <div className="mr-8 flex items-center">
          <Link href="/overview" className="flex items-center gap-2 mr-8">
            <FilmIcon className="h-6 w-6 text-white" />
            <span className="text-lg font-semibold text-white">MediaVault</span>
          </Link>
          
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/overview"
              className={`text-lg font-bold transition-colors ${
                pathname === '/overview' 
                  ? 'text-white' 
                  : 'text-foreground/60 hover:text-white'
              }`}
            >
              {t('navigation.overview')}
            </Link>
            <Link
              href="/profile"
              className={`text-lg font-bold transition-colors ${
                pathname === '/profile' 
                  ? 'text-white' 
                  : 'text-foreground/60 hover:text-white'
              }`}
            >
              {t('navigation.profile')}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-lg font-bold transition-colors ${
                  pathname === '/admin' 
                    ? 'text-white' 
                    : 'text-foreground/60 hover:text-white'
                }`}
              >
                {t('navigation.admin')}
              </Link>
            )}
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