"use client";

import { LogOut, Settings, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/hooks/use-app-data";
import type { Schemas } from "@/lib/api/client";
import { initials, senderName } from "@/lib/format";

export function UserMenu({ me }: { me: Schemas["MeResponse"] }) {
  const signOut = useSignOut();
  const name = senderName(me.name, me.email);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-2" aria-label="Account menu">
        <Avatar className="size-8 ring-2 ring-transparent transition-shadow hover:ring-primary/30">
          {me.picture_url && <AvatarImage src={me.picture_url} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{me.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/preferences">
            <SlidersHorizontal /> Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut.mutate()} disabled={signOut.isPending}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
