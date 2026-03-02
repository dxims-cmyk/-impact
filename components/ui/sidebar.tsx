'use client'

import { cn } from '@/lib/utils'
import Link, { LinkProps } from 'next/link'
import React, { useState, createContext, useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

interface Links {
  label: string
  href: string
  icon: React.JSX.Element | React.ReactNode
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = (): SidebarContextProps => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}): React.JSX.Element => {
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}): React.JSX.Element => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>): React.JSX.Element => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  )
}

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>): React.JSX.Element => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn(
        'h-screen sticky top-0 py-4 hidden lg:flex lg:flex-col flex-shrink-0 z-20',
        className
      )}
      animate={{
        width: animate ? (open ? '240px' : '68px') : '240px',
        paddingLeft: animate ? (open ? '12px' : '8px') : '12px',
        paddingRight: animate ? (open ? '12px' : '8px') : '12px',
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element => {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div
        className={cn(
          'h-14 px-4 flex flex-row lg:hidden items-center justify-between w-full'
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'fixed h-full w-[280px] inset-y-0 left-0 p-6 z-[100] flex flex-col',
                className
              )}
            >
              <div
                className="absolute right-4 top-4 z-50 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                <X className="w-5 h-5" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[99] lg:hidden"
              onClick={() => setOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export const SidebarLink = ({
  link,
  className,
  active,
  onClick,
  disabled,
  badge,
  ...props
}: {
  link: Links
  className?: string
  active?: boolean
  onClick?: () => void
  disabled?: boolean
  badge?: React.ReactNode
} & Omit<LinkProps, 'href'>): React.JSX.Element => {
  const { open, animate } = useSidebar()

  const content = (
    <>
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{link.icon}</span>
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.15 }}
        className={cn(
          'text-sm whitespace-pre !p-0 !m-0 transition-transform duration-150',
          !disabled && 'group-hover/sidebar:translate-x-1'
        )}
      >
        {link.label}
      </motion.span>
      {badge && open && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-auto"
        >
          {badge}
        </motion.span>
      )}
    </>
  )

  const sharedClasses = cn(
    'flex items-center group/sidebar py-2.5 rounded-xl transition-all duration-200',
    open ? 'justify-start gap-3 px-3' : 'justify-center px-0',
    active
      ? 'bg-impact text-ivory shadow-lg'
      : disabled
        ? 'cursor-not-allowed opacity-50'
        : 'hover:bg-ivory/5',
    className
  )

  if (disabled) {
    return (
      <div className={sharedClasses} title="Upgrade to Pro">
        {content}
      </div>
    )
  }

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={sharedClasses}
      {...props}
    >
      {content}
    </Link>
  )
}
