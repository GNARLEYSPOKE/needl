'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton, useUser } from '@clerk/nextjs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  roles?: string[];
}

const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/search', label: 'Search' },
  { href: '/asks', label: 'Asks' },
  { href: '/introductions', label: 'Introductions' },
  { href: '/chapter/asks', label: 'Chapter' },
  { href: '/referrals', label: 'Referrals' },
  {
    href: '/chapter/admin',
    label: 'Ch. Admin',
    roles: ['director', 'co_director', 'network_admin', 'super_admin'],
  },
  { href: '/admin', label: 'Admin', roles: ['network_admin', 'super_admin'] },
];

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = (user?.publicMetadata?.role as string) ?? 'member';
  const visibleLinks = NAV_LINKS.filter((link) => !link.roles || link.roles.includes(userRole));

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="border-border bg-background sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        {/* Logo */}
        <Link href="/dashboard" className="mr-6 text-lg font-semibold tracking-tight">
          Needl
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                pathname.startsWith(link.href)
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* User menu (desktop) */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-sm">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ''} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground max-w-[120px] truncate">{user?.fullName}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href="/profile/edit">
                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <SignOutButton>
                <DropdownMenuItem className="cursor-pointer">Sign out</DropdownMenuItem>
              </SignOutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-md"
              aria-label="Open menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10">
              <nav className="flex flex-col gap-1">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm transition-colors',
                      pathname.startsWith(link.href)
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 border-t pt-4">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ''} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{user?.fullName}</span>
                </div>
                <Link
                  href="/profile/edit"
                  onClick={() => setMobileOpen(false)}
                  className="text-muted-foreground hover:text-foreground block rounded-md px-3 py-2 text-sm"
                >
                  Profile
                </Link>
                <SignOutButton>
                  <button className="text-muted-foreground hover:text-foreground w-full rounded-md px-3 py-2 text-left text-sm">
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
