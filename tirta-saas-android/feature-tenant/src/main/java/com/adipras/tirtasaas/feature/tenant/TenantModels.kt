package com.adipras.tirtasaas.feature.tenant

import com.adipras.tirtasaas.core.network.ApiResponse
import com.adipras.tirtasaas.core.network.PagedApiResponse
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TenantDto(
    val id: String,
    val name: String,
    @SerialName("village_code") val villageCode: String = "",
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    @SerialName("admin_name") val adminName: String = "",
    @SerialName("admin_email") val adminEmail: String = "",
    @SerialName("admin_phone") val adminPhone: String = "",
    val status: String = "",
    @SerialName("subscription_plan") val subscriptionPlan: String = "",
    @SerialName("subscription_status") val subscriptionStatus: String = "",
    @SerialName("subscription_ends_at") val subscriptionEndsAt: String? = null,
    @SerialName("trial_ends_at") val trialEndsAt: String? = null,
    @SerialName("total_users") val totalUsers: Int = 0,
    @SerialName("total_customers") val totalCustomers: Int = 0,
    @SerialName("storage_used_gb") val storageUsedGb: Double = 0.0,
    val notes: String = "",
    @SerialName("registered_at") val registeredAt: String = "",
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
)

typealias TenantListResponse = PagedApiResponse<List<TenantDto>>
typealias TenantDetailResponse = ApiResponse<TenantDto>

@Serializable
data class UpdateTenantRequest(
    val name: String,
    val email: String,
    val phone: String,
    val address: String,
    val notes: String = "",
)

@Serializable
data class RejectTenantRequest(
    val reason: String,
)

@Serializable
data class TenantPrinterPreferenceDto(
    @SerialName("default_printer_name") val defaultPrinterName: String? = null,
    @SerialName("paper_width_mm") val paperWidthMm: Int? = null,
)

@Serializable
data class TenantSettingsDto(
    @SerialName("tenant_id") val tenantId: String,

    // Business Information
    @SerialName("company_name") val companyName: String? = null,
    @SerialName("address") val address: String? = null,
    @SerialName("phone") val phone: String? = null,
    @SerialName("email") val email: String? = null,
    @SerialName("website") val website: String? = null,

    // Branding
    @SerialName("logo_url") val logoUrl: String? = null,
    @SerialName("primary_color") val primaryColor: String? = null,
    @SerialName("secondary_color") val secondaryColor: String? = null,

    // Invoice
    @SerialName("invoice_generation_day") val invoiceGenerationDay: Int = 5,
    @SerialName("invoice_due_day") val invoiceDueDay: Int = 25,
    @SerialName("invoice_prefix") val invoicePrefix: String? = null,
    @SerialName("invoice_number_format") val invoiceNumberFormat: String? = null,
    @SerialName("invoice_due_days") val invoiceDueDays: Int = 20,
    @SerialName("invoice_footer_text") val invoiceFooterText: String? = null,

    // Payment
    @SerialName("late_penalty_percent") val latePenaltyPercent: Double = 0.0,
    @SerialName("late_penalty_max_cap") val latePenaltyMaxCap: Double? = null,
    @SerialName("grace_period_days") val gracePeriodDays: Int = 0,
    @SerialName("minimum_bill_amount") val minimumBillAmount: Double = 0.0,
    @SerialName("payment_methods") val paymentMethods: List<String> = emptyList(),

    // Bank
    @SerialName("bank_name") val bankName: String? = null,
    @SerialName("bank_account_name") val bankAccountName: String? = null,
    @SerialName("bank_account_no") val bankAccountNo: String? = null,

    // Operational
    @SerialName("operating_hours") val operatingHours: String? = null,
    @SerialName("service_area") val serviceArea: String? = null,
    @SerialName("timezone") val timezone: String? = null,
    @SerialName("language") val language: String? = null,
    @SerialName("currency") val currency: String? = null,

    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,

    // Flexible/custom settings (may contain mobile preferences)
    @SerialName("custom_settings") val customSettings: String? = null,
)

@Serializable
data class TenantSettingsUpdateRequest(
    @SerialName("company_name") val companyName: String? = null,
    @SerialName("address") val address: String? = null,
    @SerialName("phone") val phone: String? = null,
    @SerialName("email") val email: String? = null,
    @SerialName("website") val website: String? = null,
    @SerialName("timezone") val timezone: String? = null,
)
