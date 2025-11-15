import { Button } from '@/components/ui/button';
import { User, LogOut, Menu, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';

import onyxLogo from '@/assets/onyx-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  user?: { email?: string } | null;
  onSignOut?: () => void;
}

interface PuterUser {
  username?: string;
  email?: string;
  uuid?: string;
}

const Header = ({ onMenuClick, showMenuButton = false, user, onSignOut }: HeaderProps) => {
  const [puterUser, setPuterUser] = useState<PuterUser | null>(null);

  useEffect(() => {
    const checkPuterAuth = async () => {
      try {
        // @ts-ignore - Puter is loaded via script tag
        const puter = (window as any)?.puter;
        if (puter?.auth?.isSignedIn && await puter.auth.isSignedIn()) {
          const userInfo = await puter.auth.getUser();
          setPuterUser({
            username: userInfo.username,
            email: userInfo.email,
            uuid: userInfo.uuid,
          });
        }
      } catch (error) {
        console.error('Error checking Puter auth:', error);
      }
    };

    checkPuterAuth();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 animate-fade-in">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden mr-2 transition-all duration-200 hover:scale-110"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 group cursor-pointer">
            <img src={onyxLogo} alt="OnyxGPT logo" className="h-8 w-8 rounded-md shadow-sm" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-300% transition-all duration-300 group-hover:scale-105">
              OnyxGPT
            </h1>
          </div>
          <span className="hidden sm:inline text-xs text-muted-foreground ml-2 animate-fade-in">
            500+ AI Models
          </span>
        </div>

        {user || puterUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 transition-all duration-200 hover:scale-105">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{puterUser?.username || user?.email || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 animate-scale-in">
              {puterUser ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Puter Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {puterUser.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    {puterUser.email || 'No email'}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="flex-col items-start">
                    <div className="flex items-center w-full">
                      <Coins className="mr-2 h-4 w-4 text-yellow-500" />
                      <span className="font-medium">Free Credits</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      $0.50 (~50M tokens) for 1-2 days continuous use
                    </p>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  {user?.email || 'User'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Guest Mode</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
