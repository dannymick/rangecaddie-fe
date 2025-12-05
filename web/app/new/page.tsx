"use client";

import { useRouter } from "next/navigation";
import { FlowModal } from "@/components/new/flow";

export default function NewSessionPage() {
  const router = useRouter();
  return (
    <div className="min-h-dvh">
      <FlowModal onClose={() => router.back()} />
    </div>
  );
}
