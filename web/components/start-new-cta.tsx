"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StartNewCTA() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start new range session</CardTitle>
      </CardHeader>
      <CardContent>
        <Link href="/new" scroll={false} prefetch className="block">
          <Button className="w-full">Start</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
