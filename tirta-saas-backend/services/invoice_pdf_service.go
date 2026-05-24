package services

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/jung-kurt/gofpdf/v2"
)

func formatInvoiceCurrency(amount float64) string {
	negative := amount < 0
	if negative {
		amount = -amount
	}

	formatted := fmt.Sprintf("Rp %s", formatThousands(amount))
	if negative {
		return "-" + formatted
	}

	return formatted
}

func formatThousands(amount float64) string {
	raw := fmt.Sprintf("%.0f", amount)
	if len(raw) <= 3 {
		return raw
	}

	var parts []string
	for len(raw) > 3 {
		parts = append([]string{raw[len(raw)-3:]}, parts...)
		raw = raw[:len(raw)-3]
	}
	parts = append([]string{raw}, parts...)
	return strings.Join(parts, ".")
}

func formatInvoiceDate(value *time.Time) string {
	if value == nil {
		return "-"
	}

	return value.In(time.FixedZone("WIB", 7*60*60)).Format("02 Jan 2006")
}

func statusLabel(status string) string {
	switch strings.ToLower(status) {
	case "paid":
		return "LUNAS"
	case "partial":
		return "DIBAYAR SEBAGIAN"
	case "overdue":
		return "TERLAMBAT"
	default:
		return "BELUM DIBAYAR"
	}
}

func invoiceLineItems(invoice responses.InvoiceResponse) []responses.InvoiceItem {
	if len(invoice.Items) > 0 {
		return invoice.Items
	}

	items := make([]responses.InvoiceItem, 0, 3)
	if invoice.WaterCharge > 0 {
		items = append(items, responses.InvoiceItem{
			Description: "Biaya pemakaian air",
			Quantity:    invoice.UsageM3,
			UnitPrice:   invoice.PricePerM3,
			Amount:      invoice.WaterCharge,
		})
	}
	if invoice.Abonemen > 0 {
		items = append(items, responses.InvoiceItem{
			Description: "Biaya abonemen",
			Quantity:    1,
			UnitPrice:   invoice.Abonemen,
			Amount:      invoice.Abonemen,
		})
	}
	if invoice.PenaltyAmount > 0 {
		items = append(items, responses.InvoiceItem{
			Description: "Denda keterlambatan",
			Quantity:    float64(invoice.PenaltyDays),
			UnitPrice:   0,
			Amount:      invoice.PenaltyAmount,
		})
	}

	return items
}

func GenerateInvoicePDF(invoice responses.InvoiceResponse, tenantName string, tenantSettings models.TenantSettings) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	companyName := strings.TrimSpace(tenantSettings.CompanyName)
	if companyName == "" {
		companyName = tenantName
	}
	if strings.TrimSpace(companyName) == "" {
		companyName = "Tirta SaaS"
	}

	pdf.SetFont("Arial", "B", 18)
	pdf.CellFormat(120, 10, "INVOICE TAGIHAN AIR", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(55, 10, statusLabel(invoice.PaymentStatus), "", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(0, 8, companyName, "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	if address := strings.TrimSpace(tenantSettings.Address); address != "" {
		pdf.MultiCell(0, 5, address, "", "L", false)
	}
	if phone := strings.TrimSpace(tenantSettings.Phone); phone != "" {
		pdf.CellFormat(0, 5, "Telp: "+phone, "", 1, "L", false, 0, "")
	}
	if email := strings.TrimSpace(tenantSettings.Email); email != "" {
		pdf.CellFormat(0, 5, "Email: "+email, "", 1, "L", false, 0, "")
	}

	pdf.Ln(4)
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(95, 7, "Detail Tagihan", "1", 0, "L", false, 0, "")
	pdf.CellFormat(80, 7, "Pelanggan", "1", 1, "L", false, 0, "")

	pdf.SetFont("Arial", "", 10)
	leftRows := [][2]string{
		{"Nomor Invoice", invoice.InvoiceNumber},
		{"Periode", invoice.UsageMonth},
		{"Tanggal Terbit", invoice.CreatedAt.Format("02 Jan 2006")},
		{"Jatuh Tempo", formatInvoiceDate(invoice.DueDate)},
	}
	rightRows := [][2]string{
		{"Nama", invoice.CustomerName},
		{"No. Meter", invoice.MeterNumber},
	}
	if invoice.Customer != nil {
		rightRows = append(rightRows,
			[2]string{"Alamat", invoice.Customer.Address},
			[2]string{"Email", invoice.Customer.Email},
		)
	}

	maxRows := len(leftRows)
	if len(rightRows) > maxRows {
		maxRows = len(rightRows)
	}
	for i := 0; i < maxRows; i++ {
		leftText := ""
		rightText := ""
		if i < len(leftRows) {
			leftText = fmt.Sprintf("%s: %s", leftRows[i][0], leftRows[i][1])
		}
		if i < len(rightRows) {
			rightText = fmt.Sprintf("%s: %s", rightRows[i][0], rightRows[i][1])
		}
		pdf.CellFormat(95, 7, leftText, "1", 0, "L", false, 0, "")
		pdf.CellFormat(80, 7, rightText, "1", 1, "L", false, 0, "")
	}

	pdf.Ln(5)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(85, 8, "Uraian", "1", 0, "L", false, 0, "")
	pdf.CellFormat(25, 8, "Qty", "1", 0, "C", false, 0, "")
	pdf.CellFormat(30, 8, "Harga", "1", 0, "R", false, 0, "")
	pdf.CellFormat(35, 8, "Jumlah", "1", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "", 10)
	for _, item := range invoiceLineItems(invoice) {
		qtyText := "-"
		if item.Quantity > 0 {
			qtyText = fmt.Sprintf("%.0f", item.Quantity)
			if item.Quantity != float64(int64(item.Quantity)) {
				qtyText = fmt.Sprintf("%.2f", item.Quantity)
			}
		}
		unitPriceText := "-"
		if item.UnitPrice > 0 {
			unitPriceText = formatInvoiceCurrency(item.UnitPrice)
		}

		pdf.CellFormat(85, 8, item.Description, "1", 0, "L", false, 0, "")
		pdf.CellFormat(25, 8, qtyText, "1", 0, "C", false, 0, "")
		pdf.CellFormat(30, 8, unitPriceText, "1", 0, "R", false, 0, "")
		pdf.CellFormat(35, 8, formatInvoiceCurrency(item.Amount), "1", 1, "R", false, 0, "")
	}

	pdf.Ln(4)
	pdf.SetFont("Arial", "", 10)
	summaryRows := [][2]string{
		{"Subtotal", formatInvoiceCurrency(invoice.SubTotal)},
		{"Denda", formatInvoiceCurrency(invoice.PenaltyAmount)},
		{"Total Tagihan", formatInvoiceCurrency(invoice.TotalAmount)},
		{"Total Dibayar", formatInvoiceCurrency(invoice.TotalPaid)},
		{"Sisa Tagihan", formatInvoiceCurrency(invoice.RemainingAmount)},
	}
	for _, row := range summaryRows {
		pdf.CellFormat(120, 7, "", "", 0, "L", false, 0, "")
		pdf.CellFormat(30, 7, row[0], "1", 0, "L", false, 0, "")
		pdf.CellFormat(25, 7, row[1], "1", 1, "R", false, 0, "")
	}

	if strings.TrimSpace(invoice.Notes) != "" {
		pdf.Ln(5)
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(0, 6, "Catatan", "", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 10)
		pdf.MultiCell(0, 5, invoice.Notes, "1", "L", false)
	}

	if footer := strings.TrimSpace(tenantSettings.InvoiceFooterText); footer != "" {
		pdf.Ln(5)
		pdf.SetFont("Arial", "I", 9)
		pdf.MultiCell(0, 5, footer, "", "C", false)
	}

	var out bytes.Buffer
	if err := pdf.Output(&out); err != nil {
		return nil, err
	}

	return out.Bytes(), nil
}
