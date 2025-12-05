"use client";

import { useRouter } from "next/navigation";
import { FlowModal } from "@/components/new/flow";

export default function NewSessionModalRoute() {
  const router = useRouter();
  return <FlowModal onClose={() => router.back()} />;
}

