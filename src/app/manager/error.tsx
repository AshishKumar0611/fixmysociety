"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SegmentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-6 max-w-lg p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-error-soft text-error">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h1 className="text-lg font-semibold">This page could not be loaded</h1>
      <p className="mt-1 text-sm text-muted">
        Something went wrong on our side. Your data is safe. Please try again.
      </p>
      <Button className="mt-5" onClick={reset}>
        <RefreshCw aria-hidden />
        Try again
      </Button>
    </Card>
  );
}
