package utils

import (
	"regexp"
	"strings"
)

var invalidUsernameChars = regexp.MustCompile(`[^a-z0-9._-]+`)

func StringPointerOrNil(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func StringValue(value *string) string {
	if value == nil {
		return ""
	}

	return *value
}

func NormalizeUsername(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = invalidUsernameChars.ReplaceAllString(normalized, "-")
	normalized = strings.Trim(normalized, "._-")

	for strings.Contains(normalized, "--") {
		normalized = strings.ReplaceAll(normalized, "--", "-")
	}

	return normalized
}
