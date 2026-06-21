const STREAK_KEY = "safeturn_streak";
const POINTS_KEY = "safeturn_points";
const LAST_REPORT_KEY = "safeturn_last_report_date";

export interface StreakData {
  currentStreak: number;
  totalPoints: number;
  lastReportDate: string | null;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, totalPoints: 0, lastReportDate: null };
  }
  return {
    currentStreak: parseInt(localStorage.getItem(STREAK_KEY) || "0", 10),
    totalPoints: parseInt(localStorage.getItem(POINTS_KEY) || "0", 10),
    lastReportDate: localStorage.getItem(LAST_REPORT_KEY),
  };
}

export function recordReportSubmission(): StreakData {
  const today = getToday();
  const yesterday = getYesterday();
  const lastDate = localStorage.getItem(LAST_REPORT_KEY);
  let streak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
  let points = parseInt(localStorage.getItem(POINTS_KEY) || "0", 10);

  if (lastDate === today) {
    points += 5;
  } else if (lastDate === yesterday) {
    streak += 1;
    points += 10 + streak * 2;
  } else {
    streak = 1;
    points += 10;
  }

  localStorage.setItem(STREAK_KEY, String(streak));
  localStorage.setItem(POINTS_KEY, String(points));
  localStorage.setItem(LAST_REPORT_KEY, today);

  return { currentStreak: streak, totalPoints: points, lastReportDate: today };
}

export function getPointsForStreak(streak: number): number {
  return 10 + streak * 2;
}
