"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { useUserAccount } from "@/hooks/useAuth";
import { ClubSelector } from "@/components/profile/club-selector";

export function ProfileTab() {
  const { data } = useUserAccount();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your account and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{data?.email ?? "—"}</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">My bag</p>
          <ClubSelector />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button size="sm" variant="secondary" onClick={() => logout()}>
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}
