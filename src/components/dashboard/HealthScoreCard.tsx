"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getHealthScoreColor,
  getHealthScoreDescription,
  type HealthScore,
} from "@/lib/analytics/health-score";

interface HealthScoreCardProps {
  data: HealthScore;
}

/**
 * Financial health score card component
 */
export function HealthScoreCard({ data }: HealthScoreCardProps) {
  const gradeColor = getHealthScoreColor(data.grade);
  const description = getHealthScoreDescription(data.grade);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score display */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={cn("text-6xl font-bold", gradeColor)}>
              {data.grade}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {description}
            </div>
          </div>

          <div className="flex-1">
            <div className="text-3xl font-bold mb-2">{data.score}/100</div>
            <Progress value={data.score} className="h-3" />
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Score Breakdown</h4>
          {Object.entries(data.factors).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <div className="flex items-center gap-2">
                <Progress value={(value / 25) * 100} className="h-2 w-24" />
                <span className="font-medium w-12 text-right">{value}/25</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recommendations</h4>
            <ul className="space-y-2">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
