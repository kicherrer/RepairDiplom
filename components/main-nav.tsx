"use client"

import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { Layout, User, Settings } from 'lucide-react'

export function MainNav() {
  const { t } = useTranslation('common')
  const pathname = usePathname()

  const items = [
    {
      title: t('nav.overview'),
      href: '/overview',
      icon: Layout
    },
    {
      title: t('nav.profile'),
      href: '/profile',
      icon: User
    },
    {
      title: t('nav.admin'),
      href: '/admin',
      icon: Settings,
      admin: true
    }
  ]

  return (
    <nav>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href} className={pathname === item.href ? 'active' : ''}>
              <item.icon className="icon" />
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}