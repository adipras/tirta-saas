package services

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestResolveWaterUsageMeterStart_InvalidMonthFormat(t *testing.T) {
	cases := []string{"2026-13", "2026", "january", "", "26-01", "2026/01"}

	for _, month := range cases {
		t.Run(month, func(t *testing.T) {
			// nil DB is intentional — the function should return early on format error
			// before touching the DB at all.
			_, _, err := ResolveWaterUsageMeterStart(nil, uuid.Nil, month)
			if err == nil {
				t.Fatalf("expected error for invalid month %q, got nil", month)
			}
			if !strings.Contains(err.Error(), "format bulan tidak valid") {
				t.Fatalf("expected error message about invalid format, got: %v", err)
			}
		})
	}
}

func TestMeterStartSourceDescription(t *testing.T) {
	cases := []struct {
		source    string
		prevMonth string
		want      string
	}{
		{MeterStartSourcePreviousReading, "2026-01", "Dari bacaan bulan lalu (2026-01)"},
		{MeterStartSourceInitialReading, "", "Dari angka awal meter"},
		{MeterStartSourceDefault, "", "Default: 0.00"},
		{"unknown_source", "", "Default: 0.00"},
	}

	for _, tc := range cases {
		t.Run(tc.source, func(t *testing.T) {
			got := MeterStartSourceDescription(tc.source, tc.prevMonth)
			if got != tc.want {
				t.Fatalf("MeterStartSourceDescription(%q, %q) = %q, want %q",
					tc.source, tc.prevMonth, got, tc.want)
			}
		})
	}
}
