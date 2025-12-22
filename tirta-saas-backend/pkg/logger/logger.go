package logger

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

func (l LogLevel) String() string {
	switch l {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	case FATAL:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

type Logger struct {
	level  LogLevel
	output *log.Logger
}

type LogEntry struct {
	Timestamp   time.Time              `json:"timestamp"`
	Level       string                 `json:"level"`
	Message     string                 `json:"message"`
	Service     string                 `json:"service"`
	Version     string                 `json:"version"`
	TraceID     string                 `json:"trace_id,omitempty"`
	UserID      string                 `json:"user_id,omitempty"`
	CustomerID  string                 `json:"customer_id,omitempty"`
	TenantID    string                 `json:"tenant_id,omitempty"`
	Method      string                 `json:"method,omitempty"`
	Path        string                 `json:"path,omitempty"`
	StatusCode  int                    `json:"status_code,omitempty"`
	Duration    string                 `json:"duration,omitempty"`
	Error       string                 `json:"error,omitempty"`
	StackTrace  string                 `json:"stack_trace,omitempty"`
	File        string                 `json:"file,omitempty"`
	Line        int                    `json:"line,omitempty"`
	Fields      map[string]interface{} `json:"fields,omitempty"`
}

var defaultLogger *Logger

func init() {
	defaultLogger = New()
}

// Init initializes the logger with a specific level (optional - for explicit initialization)
func Init(level string) {
	if level != "" {
		os.Setenv("LOG_LEVEL", level)
	}
	defaultLogger = New()
}

func New() *Logger {
	level := getLogLevelFromEnv()
	
	return &Logger{
		level:  level,
		output: log.New(os.Stdout, "", 0),
	}
}

func getLogLevelFromEnv() LogLevel {
	levelStr := strings.ToUpper(os.Getenv("LOG_LEVEL"))
	switch levelStr {
	case "DEBUG":
		return DEBUG
	case "INFO":
		return INFO
	case "WARN":
		return WARN
	case "ERROR":
		return ERROR
	case "FATAL":
		return FATAL
	default:
		return INFO
	}
}

func (l *Logger) log(level LogLevel, message string, fields map[string]interface{}) {
	if level < l.level {
		return
	}

	entry := LogEntry{
		Timestamp: time.Now().UTC(),
		Level:     level.String(),
		Message:   message,
		Service:   "tirta-saas-backend",
		Version:   getVersion(),
		Fields:    fields,
	}

	// Add file and line information for ERROR and above
	if level >= ERROR {
		_, file, line, ok := runtime.Caller(3)
		if ok {
			entry.File = file
			entry.Line = line
		}
	}

	jsonData, err := json.Marshal(entry)
	if err != nil {
		l.output.Printf("Failed to marshal log entry: %v", err)
		return
	}

	l.output.Println(string(jsonData))
}

func getVersion() string {
	version := os.Getenv("APP_VERSION")
	if version == "" {
		return "development"
	}
	return version
}

// Global logging functions
func Debug(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	defaultLogger.log(DEBUG, message, f)
}

func Info(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	defaultLogger.log(INFO, message, f)
}

func Warn(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	defaultLogger.log(WARN, message, f)
}

func Error(message string, err error, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	} else {
		f = make(map[string]interface{})
	}
	
	if err != nil {
		f["error"] = err.Error()
	}
	
	defaultLogger.log(ERROR, message, f)
}

func Fatal(message string, err error, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	} else {
		f = make(map[string]interface{})
	}
	
	if err != nil {
		f["error"] = err.Error()
	}
	
	defaultLogger.log(FATAL, message, f)
	os.Exit(1)
}

// Database operation logging
func LogDBOperation(operation, table string, duration time.Duration, err error, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	} else {
		f = make(map[string]interface{})
	}
	
	f["operation"] = operation
	f["table"] = table
	f["duration"] = duration.String()
	
	if err != nil {
		f["error"] = err.Error()
		Error(fmt.Sprintf("Database operation failed: %s on %s", operation, table), err, f)
	} else {
		Debug(fmt.Sprintf("Database operation successful: %s on %s", operation, table), f)
	}
}

// Authentication logging
func LogAuth(event, userType, identifier string, success bool, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	} else {
		f = make(map[string]interface{})
	}
	
	f["event"] = event
	f["user_type"] = userType
	f["identifier"] = identifier
	f["success"] = success
	
	level := INFO
	message := fmt.Sprintf("Authentication event: %s for %s %s", event, userType, identifier)
	
	if !success {
		level = WARN
		message = fmt.Sprintf("Authentication failed: %s for %s %s", event, userType, identifier)
	}
	
	defaultLogger.log(level, message, f)
}

// Business operation logging
func LogBusinessOperation(operation string, tenantID, userID uuid.UUID, success bool, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	} else {
		f = make(map[string]interface{})
	}
	
	f["operation"] = operation
	f["tenant_id"] = tenantID.String()
	f["user_id"] = userID.String()
	f["success"] = success
	
	level := INFO
	message := fmt.Sprintf("Business operation: %s", operation)
	
	if !success {
		level = WARN
		message = fmt.Sprintf("Business operation failed: %s", operation)
	}
	
	defaultLogger.log(level, message, f)
}

// HTTP request logging middleware
func HTTPLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// Generate trace ID for request tracking
		traceID := uuid.New().String()
		c.Set("trace_id", traceID)
		
		// Process request
		c.Next()
		
		// Calculate duration
		duration := time.Since(start)
		
		// Extract context information
		var userID, customerID, tenantID string
		if uid, exists := c.Get("user_id"); exists {
			if u, ok := uid.(uuid.UUID); ok {
				userID = u.String()
			}
		}
		if cid, exists := c.Get("customer_id"); exists {
			if cu, ok := cid.(uuid.UUID); ok {
				customerID = cu.String()
			}
		}
		if tid, exists := c.Get("tenant_id"); exists {
			if t, ok := tid.(uuid.UUID); ok {
				tenantID = t.String()
			}
		}
		
		// Create log entry
		entry := LogEntry{
			Timestamp:  time.Now().UTC(),
			Level:      INFO.String(),
			Message:    "HTTP Request",
			Service:    "tirta-saas-backend",
			Version:    getVersion(),
			TraceID:    traceID,
			UserID:     userID,
			CustomerID: customerID,
			TenantID:   tenantID,
			Method:     c.Request.Method,
			Path:       c.Request.URL.Path,
			StatusCode: c.Writer.Status(),
			Duration:   duration.String(),
		}
		
		// Add error information if status code indicates error
		if c.Writer.Status() >= 400 {
			entry.Level = ERROR.String()
			if len(c.Errors) > 0 {
				entry.Error = c.Errors.String()
			}
		}
		
		// Log the entry
		jsonData, err := json.Marshal(entry)
		if err != nil {
			defaultLogger.output.Printf("Failed to marshal HTTP log entry: %v", err)
			return
		}
		
		defaultLogger.output.Println(string(jsonData))
	}
}

// Security event logging
func LogSecurityEvent(event, description string, severity string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	} else {
		f = make(map[string]interface{})
	}
	
	f["event"] = event
	f["severity"] = severity
	f["description"] = description
	
	level := WARN
	if severity == "high" || severity == "critical" {
		level = ERROR
	}
	
	defaultLogger.log(level, fmt.Sprintf("Security event: %s", event), f)
}