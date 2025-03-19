"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSwitch } from "@/components/theme-switch";

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Inventory System</h1>
          </div>
          <ThemeSwitch />
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This is a placeholder for the inventory system that will be implemented soon.
            </p>
            <div className="border border-dashed border-border rounded-md p-8 flex flex-col items-center justify-center">
              <div className="text-4xl mb-4">🚧</div>
              <h2 className="text-xl font-medium mb-2">Under Construction</h2>
              <p className="text-sm text-muted-foreground text-center">
                The inventory system is currently being developed. Check back soon!
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/admin/dashboard">
            <Button>Go to Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 