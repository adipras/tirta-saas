-- tirta_saas.audit_logs definition

CREATE TABLE `audit_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `old_values` longtext COLLATE utf8mb4_unicode_ci,
  `new_values` longtext COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_code` bigint DEFAULT NULL,
  `duration` bigint DEFAULT NULL,
  `success` tinyint(1) DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `metadata` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_tenant_id` (`tenant_id`),
  KEY `idx_audit_logs_user_id` (`user_id`),
  KEY `idx_audit_logs_customer_id` (`customer_id`),
  KEY `idx_audit_logs_action` (`action`),
  KEY `idx_audit_logs_resource` (`resource`),
  KEY `idx_audit_logs_resource_id` (`resource_id`),
  KEY `idx_audit_logs_level` (`level`),
  KEY `idx_audit_logs_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.bank_accounts definition

CREATE TABLE `bank_accounts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_branch` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `swift_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_bank_accounts_deleted_at` (`deleted_at`),
  KEY `idx_tenant_bank_account` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.customers definition

CREATE TABLE `customers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` longtext COLLATE utf8mb4_unicode_ci,
  `address` longtext COLLATE utf8mb4_unicode_ci,
  `phone` longtext COLLATE utf8mb4_unicode_ci,
  `subscription_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_area_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reading_route_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customers_deleted_at` (`deleted_at`),
  KEY `idx_customers_email` (`email`),
  KEY `idx_customers_tenant_id` (`tenant_id`),
  KEY `idx_customers_service_area_id` (`service_area_id`),
  KEY `idx_customers_reading_route_id` (`reading_route_id`),
  KEY `idx_customers_tenant_email` (`tenant_id`,`email`),
  KEY `idx_customers_tenant_active` (`tenant_id`,`is_active`),
  KEY `idx_customers_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.invoice_generation_histories definition

CREATE TABLE `invoice_generation_histories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `generated_for` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `generated_at` datetime(3) NOT NULL,
  `success_count` bigint DEFAULT '0',
  `skipped_count` bigint DEFAULT '0',
  `failed_count` bigint DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `execution_time_ms` bigint DEFAULT '0',
  `trigger_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `triggered_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_generation_histories_deleted_at` (`deleted_at`),
  KEY `idx_invoice_generation_histories_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.invoices definition

CREATE TABLE `invoices` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usage_month` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usage_m3` double DEFAULT NULL,
  `price_per_m3` double DEFAULT NULL,
  `abonemen` double DEFAULT NULL,
  `water_charge` double DEFAULT NULL,
  `penalty_amount` double DEFAULT '0',
  `sub_total` double DEFAULT NULL,
  `total_amount` double DEFAULT NULL,
  `total_paid` double DEFAULT '0',
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'UNPAID',
  `is_paid` tinyint(1) DEFAULT '0',
  `due_date` datetime(3) DEFAULT NULL,
  `paid_date` datetime(3) DEFAULT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `manual_items` json DEFAULT NULL,
  `meter_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_invoices_invoice_number` (`invoice_number`),
  KEY `idx_invoices_deleted_at` (`deleted_at`),
  KEY `idx_invoices_invoice_number` (`invoice_number`),
  KEY `idx_invoices_tenant_id` (`tenant_id`),
  KEY `idx_invoices_usage_month` (`usage_month`),
  KEY `idx_invoices_payment_status` (`payment_status`),
  KEY `idx_invoices_type` (`type`),
  KEY `idx_invoices_customer_id` (`customer_id`),
  KEY `idx_invoices_tenant_customer` (`tenant_id`,`customer_id`),
  KEY `idx_invoices_tenant_paid` (`tenant_id`,`is_paid`),
  KEY `idx_invoices_tenant_type` (`tenant_id`,`type`),
  KEY `idx_invoices_tenant_month` (`tenant_id`,`usage_month`),
  KEY `idx_invoices_created_at` (`created_at`),
  KEY `idx_invoices_meter_id` (`meter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.meter_histories definition

CREATE TABLE `meter_histories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text COLLATE utf8mb4_unicode_ci,
  `new_value` text COLLATE utf8mb4_unicode_ci,
  `performed_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_meter_histories_deleted_at` (`deleted_at`),
  KEY `idx_tenant_meter_history` (`tenant_id`),
  KEY `idx_meter_history` (`meter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.meter_issues definition

CREATE TABLE `meter_issues` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `resolved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolution` text COLLATE utf8mb4_unicode_ci,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_meter_issues_deleted_at` (`deleted_at`),
  KEY `idx_tenant_meter_issue` (`tenant_id`),
  KEY `idx_meter_issue` (`meter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.meters definition

CREATE TABLE `meters` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `install_date` date NOT NULL,
  `last_calib_date` date DEFAULT NULL,
  `next_calib_date` date DEFAULT NULL,
  `initial_reading` decimal(10,2) DEFAULT '0.00',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `subscription_type_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_tenant_meter_number` (`tenant_id`,`meter_number`),
  KEY `idx_meters_deleted_at` (`deleted_at`),
  KEY `idx_tenant_meter` (`tenant_id`),
  KEY `idx_customer_meter` (`customer_id`),
  KEY `idx_meters_subscription_type_id` (`subscription_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.notification_logs definition

CREATE TABLE `notification_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `sent_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `failed_at` datetime(3) DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `retry_count` bigint DEFAULT '0',
  `next_retry_at` datetime(3) DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_msg_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notification_logs_deleted_at` (`deleted_at`),
  KEY `idx_notification_logs_tenant_id` (`tenant_id`),
  KEY `idx_notification_logs_template_id` (`template_id`),
  KEY `idx_notification_logs_recipient_id` (`recipient_id`),
  KEY `idx_notification_logs_channel` (`channel`),
  KEY `idx_notification_logs_status` (`status`),
  KEY `idx_notification_logs_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.notification_templates definition

CREATE TABLE `notification_templates` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `html_body` longtext COLLATE utf8mb4_unicode_ci,
  `variables` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'id',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_code` (`code`),
  KEY `idx_notification_templates_deleted_at` (`deleted_at`),
  KEY `idx_notification_templates_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.payment_methods definition

CREATE TABLE `payment_methods` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `configuration` json DEFAULT NULL,
  `display_order` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_payment_methods_deleted_at` (`deleted_at`),
  KEY `idx_tenant_payment_method` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.payment_proofs definition

CREATE TABLE `payment_proofs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `payment_date` datetime(3) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `snapshot_sub_total` double DEFAULT '0',
  `snapshot_penalty_amount` double DEFAULT '0',
  `snapshot_total_amount` double DEFAULT '0',
  `snapshot_remaining_amount` double DEFAULT '0',
  `snapshot_captured_at` datetime(3) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `submitted_at` datetime(3) DEFAULT NULL,
  `verified_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime(3) DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_payment_proofs_deleted_at` (`deleted_at`),
  KEY `idx_payment_proofs_tenant_id` (`tenant_id`),
  KEY `idx_payment_proofs_invoice_id` (`invoice_id`),
  KEY `idx_payment_proofs_customer_id` (`customer_id`),
  KEY `idx_payment_proofs_payment_date` (`payment_date`),
  KEY `idx_payment_proofs_snapshot_captured_at` (`snapshot_captured_at`),
  KEY `idx_payment_proofs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.payments definition

CREATE TABLE `payments` (
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `penalty` double DEFAULT '0',
  `paid_at` datetime(3) NOT NULL,
  `payment_method_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `verified_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payments_tenant_id` (`tenant_id`),
  KEY `idx_payments_invoice_id` (`invoice_id`),
  KEY `idx_payments_payment_method_id` (`payment_method_id`),
  KEY `idx_payments_deleted_at` (`deleted_at`),
  KEY `idx_payments_tenant_created` (`tenant_id`,`created_at`),
  KEY `idx_payments_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.permissions definition

CREATE TABLE `permissions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_permissions_name` (`name`),
  KEY `idx_permissions_deleted_at` (`deleted_at`),
  KEY `idx_permissions_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.platform_bank_accounts definition

CREATE TABLE `platform_bank_accounts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_branch` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `swift_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_platform_bank_accounts_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.platform_qr_codes definition

CREATE TABLE `platform_qr_codes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_platform_qr_codes_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.progressive_rates definition

CREATE TABLE `progressive_rates` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_volume` decimal(10,2) NOT NULL,
  `max_volume` decimal(10,2) DEFAULT NULL,
  `price_per_unit` decimal(15,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_progressive_rates_deleted_at` (`deleted_at`),
  KEY `idx_tenant_progressive_rate` (`tenant_id`),
  KEY `idx_category_progressive_rate` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.qr_codes definition

CREATE TABLE `qr_codes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_qr_codes_deleted_at` (`deleted_at`),
  KEY `idx_tenant_qrcode` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.reading_anomalies definition

CREATE TABLE `reading_anomalies` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `water_usage_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anomaly_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expected_value` decimal(10,2) DEFAULT NULL,
  `actual_value` decimal(10,2) DEFAULT NULL,
  `deviation` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `resolved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolution` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_reading_anomalies_deleted_at` (`deleted_at`),
  KEY `idx_tenant_anomaly` (`tenant_id`),
  KEY `idx_usage_anomaly` (`water_usage_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.reading_routes definition

CREATE TABLE `reading_routes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule_day` bigint DEFAULT NULL COMMENT '''Day of month (1-31)''',
  `est_duration` bigint DEFAULT NULL COMMENT '''Estimated duration in minutes''',
  `customer_count` bigint DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_reading_routes_deleted_at` (`deleted_at`),
  KEY `idx_tenant_route` (`tenant_id`),
  KEY `idx_reading_routes_assigned_to` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.reading_sessions definition

CREATE TABLE `reading_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `route_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reader_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_date` date NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `total_customers` bigint DEFAULT '0',
  `completed_count` bigint DEFAULT '0',
  `anomaly_count` bigint DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_reading_sessions_deleted_at` (`deleted_at`),
  KEY `idx_tenant_reading_session` (`tenant_id`),
  KEY `idx_route_session` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.role_permissions definition

CREATE TABLE `role_permissions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_role_permissions_deleted_at` (`deleted_at`),
  KEY `idx_role_permission` (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.roles definition

CREATE TABLE `roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_roles_deleted_at` (`deleted_at`),
  KEY `idx_tenant_role` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.service_areas definition

CREATE TABLE `service_areas` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `population` bigint DEFAULT '0',
  `customer_count` bigint DEFAULT '0',
  `coverage_area` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_service_areas_deleted_at` (`deleted_at`),
  KEY `idx_tenant_service_area` (`tenant_id`),
  KEY `idx_service_areas_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.subscription_invoices definition

CREATE TABLE `subscription_invoices` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registration',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `subscription_plan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_period` bigint NOT NULL DEFAULT '1',
  `amount` decimal(15,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `issued_at` datetime(3) NOT NULL,
  `due_date` datetime(3) DEFAULT NULL,
  `payment_submitted_at` datetime(3) DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `payment_submission_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_subscription_invoices_invoice_number` (`invoice_number`),
  KEY `idx_subscription_invoices_deleted_at` (`deleted_at`),
  KEY `idx_subscription_invoices_tenant_id` (`tenant_id`),
  KEY `idx_subscription_invoices_status` (`status`),
  KEY `idx_subscription_invoices_payment_submission_id` (`payment_submission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.subscription_payments definition

CREATE TABLE `subscription_payments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscription_plan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_period` bigint NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` datetime(3) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `verified_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime(3) DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_subscription_payments_deleted_at` (`deleted_at`),
  KEY `idx_subscription_payments_tenant_id` (`tenant_id`),
  KEY `idx_subscription_payments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.subscription_plan_details definition

CREATE TABLE `subscription_plan_details` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `plan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `monthly_price` decimal(15,2) NOT NULL,
  `yearly_price` decimal(15,2) NOT NULL,
  `max_users` bigint DEFAULT NULL,
  `max_customers` bigint DEFAULT NULL,
  `max_storage_gb` bigint DEFAULT NULL,
  `max_api_calls_per_day` bigint DEFAULT NULL,
  `features` json DEFAULT NULL,
  `display_order` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `trial_days` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_subscription_plan_details_plan` (`plan`),
  KEY `idx_subscription_plan_details_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.subscription_types definition

CREATE TABLE `subscription_types` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `registration_fee` double DEFAULT NULL,
  `monthly_fee` double DEFAULT NULL,
  `maintenance_fee` double DEFAULT NULL,
  `late_fee_per_day` double DEFAULT NULL,
  `max_late_fee` double DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_subscription_types_deleted_at` (`deleted_at`),
  KEY `idx_subscription_types_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.tariff_categories definition

CREATE TABLE `tariff_categories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_tariff_categories_deleted_at` (`deleted_at`),
  KEY `idx_tenant_tariff_category` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.tenant_settings definition

CREATE TABLE `tenant_settings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secondary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_generation_day` bigint DEFAULT '5',
  `invoice_due_day` bigint DEFAULT '25',
  `invoice_prefix` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number_format` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'INV-{YEAR}{MONTH}-{NUMBER}',
  `invoice_due_days` bigint DEFAULT '20',
  `invoice_footer_text` text COLLATE utf8mb4_unicode_ci,
  `late_penalty_percent` decimal(5,2) DEFAULT '2.00',
  `late_penalty_max_cap` decimal(15,2) DEFAULT NULL,
  `grace_period_days` bigint DEFAULT '0',
  `minimum_bill_amount` decimal(15,2) DEFAULT '0.00',
  `payment_methods` json DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_hours` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_area` text COLLATE utf8mb4_unicode_ci,
  `time_zone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Asia/Jakarta',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'id',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'IDR',
  `custom_settings` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_settings_tenant_id` (`tenant_id`),
  KEY `idx_tenant_settings_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.tenant_subscriptions definition

CREATE TABLE `tenant_subscriptions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_cycle` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monthly_price` decimal(15,2) NOT NULL,
  `yearly_price` decimal(15,2) DEFAULT NULL,
  `max_users` bigint DEFAULT '5',
  `max_customers` bigint DEFAULT '1000',
  `max_storage_gb` bigint DEFAULT '10',
  `max_api_calls_per_day` bigint DEFAULT '10000',
  `enabled_features` json DEFAULT NULL,
  `start_date` datetime(3) DEFAULT NULL,
  `end_date` datetime(3) DEFAULT NULL,
  `next_billing_at` datetime(3) DEFAULT NULL,
  `last_billed_at` datetime(3) DEFAULT NULL,
  `trial_ends_at` datetime(3) DEFAULT NULL,
  `last_payment_amount` decimal(15,2) DEFAULT NULL,
  `last_payment_date` datetime(3) DEFAULT NULL,
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `cancelled_at` datetime(3) DEFAULT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_subscriptions_deleted_at` (`deleted_at`),
  KEY `idx_tenant_subscriptions_tenant_id` (`tenant_id`),
  KEY `idx_tenant_subscriptions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.tenants definition

CREATE TABLE `tenants` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `village_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'TRIAL',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `admin_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registered_at` datetime(3) DEFAULT NULL,
  `trial_ends_at` datetime(3) DEFAULT NULL,
  `subscription_plan` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscription_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscription_starts_at` datetime(3) DEFAULT NULL,
  `subscription_ends_at` datetime(3) DEFAULT NULL,
  `payment_proof_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_verified_at` datetime(3) DEFAULT NULL,
  `payment_verified_by` longtext COLLATE utf8mb4_unicode_ci,
  `total_users` bigint DEFAULT '0',
  `total_customers` bigint DEFAULT '0',
  `storage_used_gb` decimal(10,2) DEFAULT '0.00',
  `approved_at` datetime(3) DEFAULT NULL,
  `approved_by` longtext COLLATE utf8mb4_unicode_ci,
  `rejected_at` datetime(3) DEFAULT NULL,
  `rejected_by` longtext COLLATE utf8mb4_unicode_ci,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `suspended_at` datetime(3) DEFAULT NULL,
  `suspension_reason` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_tenants_village_code` (`village_code`),
  KEY `idx_tenants_deleted_at` (`deleted_at`),
  KEY `idx_tenants_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.user_activities definition

CREATE TABLE `user_activities` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_activities_deleted_at` (`deleted_at`),
  KEY `idx_user_activity` (`user_id`),
  KEY `idx_user_activities_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.user_profiles definition

CREATE TABLE `user_profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_profiles_user_id` (`user_id`),
  KEY `idx_user_profiles_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.user_roles definition

CREATE TABLE `user_roles` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.user_sessions definition

CREATE TABLE `user_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime(3) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_used` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_sessions_token` (`token`),
  KEY `idx_user_sessions_deleted_at` (`deleted_at`),
  KEY `idx_user_session` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.users definition

CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name` longtext COLLATE utf8mb4_unicode_ci,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` longtext COLLATE utf8mb4_unicode_ci,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  KEY `idx_users_deleted_at` (`deleted_at`),
  KEY `idx_users_tenant_id` (`tenant_id`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_created_at` (`created_at`),
  KEY `idx_users_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.water_rates definition

CREATE TABLE `water_rates` (
  `amount` double NOT NULL,
  `effective_date` datetime(3) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `subscription_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_water_rates_tenant_id` (`tenant_id`),
  KEY `idx_water_rates_category_id` (`category_id`),
  KEY `idx_water_rates_deleted_at` (`deleted_at`),
  KEY `idx_water_rates_subscription_id` (`subscription_id`),
  KEY `idx_water_rates_tenant_active` (`tenant_id`,`active`),
  KEY `idx_water_rates_tenant_date` (`tenant_id`,`effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- tirta_saas.water_usages definition

CREATE TABLE `water_usages` (
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usage_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_start` double DEFAULT NULL,
  `meter_start_source` enum('previous_reading','initial_reading','default') NOT NULL DEFAULT 'default',
  `meter_end` double DEFAULT NULL,
  `usage_m3` double DEFAULT NULL,
  `amount_calculated` double DEFAULT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_draft` tinyint(1) DEFAULT '0',
  `meter_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reading_session_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recorded_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reading_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'manual',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_anomaly` tinyint(1) DEFAULT '0',
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_water_usages_customer_id` (`customer_id`),
  KEY `idx_water_usages_usage_month` (`usage_month`),
  KEY `idx_water_usages_tenant_id` (`tenant_id`),
  KEY `idx_water_usages_meter_id` (`meter_id`),
  KEY `idx_water_usages_reading_session_id` (`reading_session_id`),
  KEY `idx_water_usages_deleted_at` (`deleted_at`),
  KEY `idx_water_usages_tenant_customer` (`tenant_id`,`customer_id`),
  KEY `idx_water_usages_tenant_month` (`tenant_id`,`usage_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;