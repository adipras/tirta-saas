package services

import (
	"testing"
)

func TestValidateInvoiceNumber_AcceptsValidFormat(t *testing.T) {
	cases := []struct {
		input    string
		expected bool
	}{
		{"INV-202601-0001", true},
		{"INV-202612-9999", true},
		{"INV-202601-0100", true},
	}

	for _, tc := range cases {
		t.Run(tc.input, func(t *testing.T) {
			if got := ValidateInvoiceNumber(tc.input); got != tc.expected {
				t.Fatalf("ValidateInvoiceNumber(%q) = %v, want %v", tc.input, got, tc.expected)
			}
		})
	}
}

func TestValidateInvoiceNumber_RejectsInvalidFormat(t *testing.T) {
	cases := []struct {
		input  string
		reason string
	}{
		{"", "empty string"},
		{"INV-20260100-0001", "month and year merged without separator"},
		{"INV-202600-0001", "month 00 is invalid"},
		{"INV-202613-0001", "month 13 is invalid"},
		{"INV-202301-0001", "year before 2024"},
		{"inv-202601-0001", "lowercase prefix"},
		{"INV-202601-0000", "sequence 0 is invalid"},
		{"INV/202601/0001", "wrong separator"},
	}

	for _, tc := range cases {
		t.Run(tc.reason, func(t *testing.T) {
			if ValidateInvoiceNumber(tc.input) {
				t.Fatalf("ValidateInvoiceNumber(%q) should be invalid (%s)", tc.input, tc.reason)
			}
		})
	}
}
