"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AboutCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to RangeCaddie</CardTitle>
        <CardDescription>
          Track sessions, view stats, improve faster
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Log your range work in seconds, keep trends at your fingertips, and make
        every bucket count. Create your first session to get started.
      </CardContent>
    </Card>
  );
}
