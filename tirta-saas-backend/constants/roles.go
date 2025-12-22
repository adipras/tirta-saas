package constants

type UserRole string

const (
	// Platform-level roles
	RolePlatformOwner UserRole = "platform_owner"
	
	// Tenant-level roles
	RoleTenantAdmin   UserRole = "tenant_admin"
	RoleMeterReader   UserRole = "meter_reader"
	RoleFinance       UserRole = "finance"
	RoleService       UserRole = "service"
	
	// Customer role (existing)
	RoleCustomer      UserRole = "customer"
)

// Permission sets for each role
type Permission string

const (
	// Platform permissions
	PermManageTenants        Permission = "manage_tenants"
	PermViewAllTenants       Permission = "view_all_tenants"
	PermSystemConfiguration  Permission = "system_configuration"
	
	// Tenant management permissions
	PermManageTenantUsers    Permission = "manage_tenant_users"
	PermManageSubscriptions  Permission = "manage_subscriptions"
	PermManageWaterRates     Permission = "manage_water_rates"
	
	// Customer management permissions
	PermManageCustomers      Permission = "manage_customers"
	PermViewCustomers        Permission = "view_customers"
	
	// Water usage permissions
	PermRecordWaterUsage     Permission = "record_water_usage"
	PermViewWaterUsage       Permission = "view_water_usage"
	PermEditWaterUsage       Permission = "edit_water_usage"
	
	// Invoice permissions
	PermGenerateInvoices     Permission = "generate_invoices"
	PermViewInvoices         Permission = "view_invoices"
	PermEditInvoices         Permission = "edit_invoices"
	
	// Payment permissions
	PermRecordPayments       Permission = "record_payments"
	PermViewPayments         Permission = "view_payments"
	PermManagePayments       Permission = "manage_payments"
	
	// Service permissions
	PermManageInventory      Permission = "manage_inventory"
	PermManageInstallations  Permission = "manage_installations"
	PermManageRepairs        Permission = "manage_repairs"
	
	// Customer self-service permissions
	PermViewOwnProfile       Permission = "view_own_profile"
	PermViewOwnInvoices      Permission = "view_own_invoices"
	PermViewOwnUsage         Permission = "view_own_usage"
	PermMakePayments         Permission = "make_payments"
)

// RolePermissions maps each role to its allowed permissions
var RolePermissions = map[UserRole][]Permission{
	RolePlatformOwner: {
		// Platform owner has all permissions
		PermManageTenants,
		PermViewAllTenants,
		PermSystemConfiguration,
		PermManageTenantUsers,
		PermManageSubscriptions,
		PermManageWaterRates,
		PermManageCustomers,
		PermViewCustomers,
		PermRecordWaterUsage,
		PermViewWaterUsage,
		PermEditWaterUsage,
		PermGenerateInvoices,
		PermViewInvoices,
		PermEditInvoices,
		PermRecordPayments,
		PermViewPayments,
		PermManagePayments,
		PermManageInventory,
		PermManageInstallations,
		PermManageRepairs,
	},
	RoleTenantAdmin: {
		// Tenant admin can manage everything within their tenant
		PermManageTenantUsers,
		PermManageSubscriptions,
		PermManageWaterRates,
		PermManageCustomers,
		PermViewCustomers,
		PermRecordWaterUsage,
		PermViewWaterUsage,
		PermEditWaterUsage,
		PermGenerateInvoices,
		PermViewInvoices,
		PermEditInvoices,
		PermRecordPayments,
		PermViewPayments,
		PermManagePayments,
		PermManageInventory,
		PermManageInstallations,
		PermManageRepairs,
	},
	RoleMeterReader: {
		// Meter reader can only record and view water usage
		PermViewCustomers,
		PermRecordWaterUsage,
		PermViewWaterUsage,
		PermEditWaterUsage,
		PermViewInvoices,
	},
	RoleFinance: {
		// Finance can manage invoices and payments
		PermViewCustomers,
		PermViewWaterUsage,
		PermGenerateInvoices,
		PermViewInvoices,
		PermEditInvoices,
		PermRecordPayments,
		PermViewPayments,
		PermManagePayments,
	},
	RoleService: {
		// Service can manage installations and repairs
		PermManageCustomers,
		PermViewCustomers,
		PermManageInventory,
		PermManageInstallations,
		PermManageRepairs,
		PermViewInvoices,
	},
	RoleCustomer: {
		// Customer can only view their own data
		PermViewOwnProfile,
		PermViewOwnInvoices,
		PermViewOwnUsage,
		PermMakePayments,
	},
}

// HasPermission checks if a role has a specific permission
func HasPermission(role UserRole, permission Permission) bool {
	permissions, exists := RolePermissions[role]
	if !exists {
		return false
	}
	
	for _, p := range permissions {
		if p == permission {
			return true
		}
	}
	return false
}

// IsValidRole checks if a role string is valid
func IsValidRole(role string) bool {
	switch UserRole(role) {
	case RolePlatformOwner, RoleTenantAdmin, RoleMeterReader, RoleFinance, RoleService, RoleCustomer:
		return true
	default:
		return false
	}
}

// GetTenantRoles returns all roles that can be assigned by tenant admins
func GetTenantRoles() []UserRole {
	return []UserRole{
		RoleMeterReader,
		RoleFinance,
		RoleService,
	}
}