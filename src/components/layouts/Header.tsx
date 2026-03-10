import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import type { UserRole } from '@/types';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  const getInitials = (name?: string | null) => {
    if (!name) {
      const roleChar = profile?.role ? String(profile.role).charAt(0).toUpperCase() : 'U';
      return roleChar;
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleDisplay = (role?: UserRole | null) => {
    if (!role) return 'User';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getNavLinks = () => {
    if (!profile) return [];

    const commonLinks = [
      { href: '/education', label: 'Education' },
    ];

    switch (profile.role) {
      case 'mother':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/health-checkin', label: 'Health Check-in' },
          ...commonLinks,
        ];
      case 'family_member':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/emergency', label: 'Emergency' },
          ...commonLinks,
        ];
      case 'healthcare_provider':
        return [
          { href: '/provider-dashboard', label: 'Dashboard' },
          { href: '/patients', label: 'Patients' },
          { href: '/alerts', label: 'Alerts' },
          ...commonLinks,
        ];
      case 'admin':
        return [
          { href: '/provider-dashboard', label: 'Dashboard' },
          { href: '/patients', label: 'Patients' },
          { href: '/alerts', label: 'Alerts' },
          { href: '/admin', label: 'Admin' },
          ...commonLinks,
        ];
      default:
        return commonLinks;
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-a1icbsdgcg00/conv-a2blkp7a43cw/20260310/file-a66t82v582kg.jpg"
              alt="NgaoMaternal Care"
              className="h-9 w-9 object-cover rounded-lg"
            />
            <span className="text-lg font-semibold hidden sm:inline-block">NgaoMaternal Care</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant={location.pathname === link.href ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Theme toggle */}
              <ThemeToggle />

              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="flex flex-col gap-2 mt-8">
                    {navLinks.map((link) => (
                      <Link key={link.href} to={link.href}>
                        <Button
                          variant={location.pathname === link.href ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                        >
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || profile?.username || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getRoleDisplay(profile?.role)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
