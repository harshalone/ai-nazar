"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type {
  DailyUsagePoint,
  LargePromptProblem,
  ModelUsageStat,
  UsageDimension,
  UsageSummary,
} from "@/lib/store/types";
import { ActivityTabs, type ActivityTab } from "@/components/dashboard/activity-tabs";
import { OverviewContent } from "@/components/dashboard/overview-content";
import { TrendsContent } from "@/components/dashboard/trends-content";
import { ExploreContent } from "@/components/dashboard/explore-content";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ExploreControls, EXPLORE_TOP_N_OPTIONS, type ExploreTopN } from "@/components/dashboard/explore-controls";
import { Button } from "@/components/ui/button";

const OVERVIEW_DEFAULT_DAYS = 14;
const TRENDS_DEFAULT_DAYS = 30;

export function ActivityView({
  summary,
  daily,
  modelUsage,
  problems,
}: {
  summary: UsageSummary;
  daily: DailyUsagePoint[];
  modelUsage: ModelUsageStat[];
  problems: LargePromptProblem[];
}) {
  const [active, setActive] = useState<ActivityTab>("overview");
  const [demoMode, setDemoMode] = useState(false);

  const [overviewDays, setOverviewDays] = useState(OVERVIEW_DEFAULT_DAYS);
  const [trendsDays, setTrendsDays] = useState(TRENDS_DEFAULT_DAYS);

  const [exploreDimension, setExploreDimension] = useState<UsageDimension>("model");
  const [exploreTopN, setExploreTopN] = useState<ExploreTopN>(EXPLORE_TOP_N_OPTIONS[1]);

  const demoToggle = (
    <Button
      variant={demoMode ? "primary" : "secondary"}
      size="md"
      onClick={() => setDemoMode((v) => !v)}
      className="shrink-0"
    >
      <Sparkles className="h-4 w-4" />
      {demoMode ? "Viewing demo data" : "Demo data"}
    </Button>
  );

  const controls =
    active === "overview" ? (
      <>
        <DateRangePicker days={overviewDays} onChange={setOverviewDays} />
        {demoToggle}
      </>
    ) : active === "trends" ? (
      <>
        <DateRangePicker days={trendsDays} onChange={setTrendsDays} />
        {demoToggle}
      </>
    ) : (
      <>
        <ExploreControls
          dimension={exploreDimension}
          onDimensionChange={setExploreDimension}
          topN={exploreTopN}
          onTopNChange={setExploreTopN}
        />
        {demoToggle}
      </>
    );

  return (
    <ActivityTabs
      active={active}
      onActiveChange={setActive}
      controls={controls}
      overview={
        <OverviewContent
          days={overviewDays}
          demoMode={demoMode}
          summary={summary}
          daily={daily}
          modelUsage={modelUsage}
          problems={problems}
        />
      }
      trends={<TrendsContent days={trendsDays} demoMode={demoMode} />}
      explore={<ExploreContent dimension={exploreDimension} topN={exploreTopN} demoMode={demoMode} />}
    />
  );
}
