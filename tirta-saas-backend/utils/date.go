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

func DueDateFromUsageMonth(usageMonth string, graceDays int) (time.Time, error) {
	t, err := time.Parse("2006-01", usageMonth)
	if err != nil {
		return time.Now(), err
	}
	// Ambil akhir bulan
	firstNextMonth := t.AddDate(0, 1, 0)
	endOfMonth := firstNextMonth.AddDate(0, 0, -1)
	return endOfMonth.AddDate(0, 0, graceDays), nil
}
