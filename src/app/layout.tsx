// src/app/layout.tsx
'use client';

import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import Link from 'next/link';
import { ModeToggle } from '@/components/ui/modeToggle';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center justify-between w-full">
      <NavigationMenu>
        <NavigationMenuList>
          {isAuthenticated && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/users">Dipendenti</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/logs">LOG</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <ModeToggle></ModeToggle>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {mounted && (
        <>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="ml-auto"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              asChild
              className="ml-auto"
            >
              <Link href="/auth/login">Login</Link>
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Timbrature</title>
          <meta name="description" content="Gestione utenti e log timbrature" />
        </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <div style={{ marginBottom: '20px' }}></div>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <NavBar />
                {children}
              </div>
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
