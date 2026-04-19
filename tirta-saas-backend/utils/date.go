package utils

import "time"

func PreviousMonth(current string) (string, error) {
	t, err := time.Parse("2006-01", current)
	if err != nil {
		return "", err
	}
	prev := t.AddDate(0, -1, 0)
	return prev.Format("2006-01"), nil
}

func ResolveLocation(name string) *time.Location {
	if name == "" {
		return time.Local
	}

	location, err := time.LoadLocation(name)
	if err != nil {
		return time.Local
	}

	return location
}

func clampDay(year int, month time.Month, day int) int {
	if day < 1 {
		return 1
	}

	lastDay := time.Date(year, month+1, 0, 0, 0, 0, 0, time.Local).Day()
	if day > lastDay {
		return lastDay
	}

	return day
}

func DueDateFromUsageMonth(usageMonth string, dueDay int, location *time.Location) (time.Time, error) {
	if location == nil {
		location = time.Local
	}

	t, err := time.ParseInLocation("2006-01", usageMonth, location)
	if err != nil {
		return time.Now(), err
	}

	dueMonth := t.AddDate(0, 1, 0)
	day := clampDay(dueMonth.Year(), dueMonth.Month(), dueDay)

	return time.Date(dueMonth.Year(), dueMonth.Month(), day, 23, 59, 59, 0, location), nil
}

func PenaltyDaysSinceDueDate(dueDate, now time.Time, location *time.Location) int {
	if location == nil {
		location = time.Local
	}

	dueDate = dueDate.In(location)
	now = now.In(location)

	penaltyStart := time.Date(dueDate.Year(), dueDate.Month(), dueDate.Day()+1, 0, 0, 0, 0, location)
	currentDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, location)
	if currentDay.Before(penaltyStart) {
		return 0
	}

	return int(currentDay.Sub(penaltyStart).Hours()/24) + 1
}
