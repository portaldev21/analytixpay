import Link from "next/link";
import { FileText, Upload, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty state for dashboard when no data exists
 */
export function EmptyDashboard() {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <FileText className="h-24 w-24 mx-auto text-muted-foreground/30" />
        </div>

        <h2 className="text-2xl font-bold mb-3">No transactions yet</h2>

        <p className="text-muted-foreground mb-8">
          Upload your first credit card invoice to start tracking your expenses
          and getting insights about your spending patterns.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/invoices">
              <Upload className="mr-2 h-5 w-5" />
              Upload Invoice
            </Link>
          </Button>

          <Button variant="outline" size="lg" asChild>
            <Link
              href="https://docs.analytixpay.com/getting-started"
              target="_blank"
            >
              Learn How It Works
            </Link>
          </Button>
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg text-left">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Supports PDF invoices from all major Brazilian banks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Automatic transaction extraction and categorization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Track spending across multiple cards and accounts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Share accounts with family members</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
