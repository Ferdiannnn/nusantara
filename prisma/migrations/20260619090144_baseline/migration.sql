-- CreateTable
CREATE TABLE "accurate" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "client_id" VARCHAR(50) NOT NULL,
    "client_secret" VARCHAR(50) NOT NULL,
    "url_oauth_callback" VARCHAR(255) NOT NULL,
    "authorization_code" VARCHAR(50) NOT NULL,
    "database_id" INTEGER NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "session" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "accurate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accurate_log" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "payload" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "accurate_log_status_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "accurate_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accurate_token" (
    "id" BIGSERIAL NOT NULL,
    "accurate_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "access_token" VARCHAR(50) NOT NULL,
    "refresh_token" VARCHAR(50) NOT NULL,
    "scope" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "accurate_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attendance_status_id" SMALLINT NOT NULL DEFAULT 1,
    "attendance_time" TIMESTAMP(0) NOT NULL,
    "photo" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "number" VARCHAR(30) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bca_notification" (
    "id" BIGSERIAL NOT NULL,
    "company_code" VARCHAR(10) NOT NULL,
    "customer_number" VARCHAR(30) NOT NULL,
    "request_id" VARCHAR(50) NOT NULL,
    "channel_type" VARCHAR(10) NOT NULL,
    "customer_name" VARCHAR(50) NOT NULL,
    "currency_code" VARCHAR(10) NOT NULL,
    "paid_amount" VARCHAR(30) NOT NULL,
    "total_amount" VARCHAR(30) NOT NULL,
    "sub_company" VARCHAR(10),
    "transaction_date" VARCHAR(30) NOT NULL,
    "reference" VARCHAR(30),
    "detail_bills" TEXT,
    "flag_advice" VARCHAR(10) NOT NULL,
    "additional_data" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "bca_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_message" (
    "id" BIGSERIAL NOT NULL,
    "broadcast_message_type_id" SMALLINT NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "payload" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "content" TEXT,
    "photo" VARCHAR(255),

    CONSTRAINT "broadcast_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "price" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "sales_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "photo" VARCHAR(255),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" BIGSERIAL NOT NULL,
    "province_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "config_type_id" INTEGER NOT NULL DEFAULT 0,
    "store_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_order" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "delivery_order_number" VARCHAR(10) NOT NULL,
    "reference" VARCHAR(50),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "reference_id" INTEGER NOT NULL DEFAULT 0,
    "reference_date" DATE,
    "reference_shipment" VARCHAR(50),

    CONSTRAINT "delivery_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_order_detail" (
    "id" BIGSERIAL NOT NULL,
    "delivery_order_id" INTEGER NOT NULL,
    "order_detail_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "product_batch_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "batch_number" VARCHAR(50),
    "warehouse_name" VARCHAR(50),
    "reference_price" INTEGER NOT NULL DEFAULT 0,
    "reference_discount" DECIMAL(8,5) NOT NULL DEFAULT 0,

    CONSTRAINT "delivery_order_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "district" (
    "id" BIGSERIAL NOT NULL,
    "city_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "district_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "district_anteraja" (
    "id" BIGSERIAL NOT NULL,
    "district_id" INTEGER NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "district_anteraja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_visit" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "employee_visit_type_id" SMALLINT NOT NULL DEFAULT 1,
    "employee_visit_status_id" SMALLINT NOT NULL DEFAULT 1,
    "customer_id" INTEGER NOT NULL DEFAULT 0,
    "attendance_time" TIMESTAMP(0) NOT NULL,
    "photo" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "employee_visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failed_jobs" (
    "id" BIGSERIAL NOT NULL,
    "uuid" VARCHAR(255) NOT NULL,
    "connection" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "exception" TEXT NOT NULL,
    "failed_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failed_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fcm_token" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "fcm_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "invoice_number" VARCHAR(10) NOT NULL,
    "total" INTEGER NOT NULL,
    "due_date" DATE,
    "invoice_status_id" SMALLINT NOT NULL,
    "reference" VARCHAR(255),
    "note" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "reference_date" DATE,
    "reference_total" DECIMAL(18,6),
    "reference_owing" DECIMAL(18,6),
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "is_purchase_order_exists" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_detail" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "order_detail_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "reference" VARCHAR(50),

    CONSTRAINT "invoice_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_transfer" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "item_transfer_status_id" SMALLINT NOT NULL DEFAULT 1,
    "product_batch_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "item_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" BIGSERIAL NOT NULL,
    "queue" VARCHAR(255) NOT NULL,
    "payload" TEXT NOT NULL,
    "attempts" SMALLINT NOT NULL,
    "reserved_at" INTEGER,
    "available_at" INTEGER NOT NULL,
    "created_at" INTEGER NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limit" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "limit" BIGINT NOT NULL,
    "period" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "log_status_id" SMALLINT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255) NOT NULL DEFAULT '',
    "payload" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_product" (
    "id" BIGSERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "product_type_id" SMALLINT NOT NULL DEFAULT 1,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "tags" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "principal_id" INTEGER NOT NULL DEFAULT 0,
    "sku" VARCHAR(50) NOT NULL DEFAULT '',
    "nie" VARCHAR(50) NOT NULL DEFAULT '',
    "nie_date" DATE,
    "initial_price" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "master_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "membership_status_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "nama_relasi" VARCHAR(50) NOT NULL,
    "alamat_relasi" TEXT NOT NULL,
    "nomor_ijin_apotek" VARCHAR(250) NOT NULL,
    "masa_berlaku_ijin" DATE,
    "nomor_sertifikat_cdob" VARCHAR(250) NOT NULL,
    "masa_berlaku_sertifikat" DATE,
    "nomor_nib" VARCHAR(50) NOT NULL,
    "kode_sipnap" VARCHAR(50) NOT NULL,
    "nama_apoteker_pj" VARCHAR(100) NOT NULL,
    "alamat_tinggal_apj" TEXT NOT NULL,
    "nomor_sika" VARCHAR(250) NOT NULL,
    "masa_berlaku_sika" DATE,
    "nama_ttk_1" VARCHAR(50) NOT NULL,
    "nomor_sittk_1" VARCHAR(50) NOT NULL,
    "nama_ttk_2" VARCHAR(50) NOT NULL,
    "nomor_sittk_2" VARCHAR(50) NOT NULL,
    "specimen" VARCHAR(255) NOT NULL,
    "document" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "membership_type_id" SMALLINT NOT NULL DEFAULT 1,
    "file_siup" VARCHAR(255),
    "file_nib" VARCHAR(255),
    "file_ijin" VARCHAR(255),
    "file_sipa" VARCHAR(255),
    "file_cdob" VARCHAR(255),
    "file_npwp" VARCHAR(255),
    "file_ktp_apj" VARCHAR(255),
    "file_ktp_pj" VARCHAR(255),
    "file_sipttk" VARCHAR(255),
    "npwp" VARCHAR(50) NOT NULL DEFAULT '',

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_type" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "membership_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "key" VARCHAR(255) NOT NULL DEFAULT '',
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "midtrans_notification" (
    "id" BIGSERIAL NOT NULL,
    "va_number" VARCHAR(50),
    "transaction_type" VARCHAR(50),
    "transaction_time" TIMESTAMP(0) NOT NULL,
    "transaction_status" VARCHAR(50) NOT NULL,
    "transaction_id" VARCHAR(50) NOT NULL,
    "store" VARCHAR(50),
    "status_message" VARCHAR(50) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "signature_key" VARCHAR(255) NOT NULL,
    "settlement_time" TIMESTAMP(0),
    "payment_type" VARCHAR(50) NOT NULL,
    "payment_code" VARCHAR(50),
    "order_id" VARCHAR(50) NOT NULL,
    "merchant_id" VARCHAR(50) NOT NULL,
    "masked_card" VARCHAR(50),
    "issuer" VARCHAR(50),
    "gross_amount" VARCHAR(50) NOT NULL,
    "fraud_status" VARCHAR(50) NOT NULL,
    "currency" VARCHAR(50) NOT NULL,
    "card_type" VARCHAR(50),
    "bank" VARCHAR(50),
    "approval_code" VARCHAR(50),
    "acquirer" VARCHAR(50),
    "biller_code" VARCHAR(50),
    "bill_key" VARCHAR(50),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "url" VARCHAR(255),
    "deeplink" VARCHAR(255),

    CONSTRAINT "midtrans_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "migration" VARCHAR(255) NOT NULL,
    "batch" INTEGER NOT NULL,

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnail" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "payload" TEXT,
    "is_read" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odoo" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "url_oauth" VARCHAR(255) NOT NULL,
    "db" VARCHAR(50) NOT NULL,
    "login" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "url_web" VARCHAR(255) NOT NULL,
    "session" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "company_id" INTEGER NOT NULL DEFAULT 0,
    "database_id" INTEGER NOT NULL DEFAULT 0,
    "access_token" VARCHAR(255) NOT NULL DEFAULT '',

    CONSTRAINT "odoo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odoo_log" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "odoo_log_status_id" SMALLINT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "payload" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "response" TEXT,

    CONSTRAINT "odoo_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "order_status_id" INTEGER NOT NULL,
    "order_number" VARCHAR(10) NOT NULL,
    "total" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "message" TEXT NOT NULL DEFAULT '',
    "sales_id" INTEGER NOT NULL DEFAULT 0,
    "payment_type_id" INTEGER NOT NULL DEFAULT 0,
    "is_pending" BOOLEAN NOT NULL DEFAULT false,
    "reference" VARCHAR(255),
    "purchase_order_file" VARCHAR(255),
    "created_by" INTEGER NOT NULL DEFAULT 0,
    "updated_by" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_detail" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "initial_price" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "is_bonus" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_finish" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "photo" VARCHAR(100),
    "driver_response_status" INTEGER,
    "customer_response_status" INTEGER,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "order_finish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_invoice" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "service_detail_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "order_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_pending" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_detail_id" INTEGER NOT NULL,
    "pending_type_id" SMALLINT NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "order_pending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "order_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_unread_message" (
    "order_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "order_unread_message_pkey" PRIMARY KEY ("order_id","user_id")
);

-- CreateTable
CREATE TABLE "otp" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "otp" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0)
);

-- CreateTable
CREATE TABLE "payment" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "point" INTEGER NOT NULL,
    "payment_status_id" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "payment_type_id" SMALLINT NOT NULL DEFAULT 1,
    "due_date" DATE,
    "charge" INTEGER NOT NULL DEFAULT 0,
    "invoice_id" INTEGER NOT NULL DEFAULT 0,
    "reference_number" VARCHAR(50),
    "reference_date" DATE,
    "payment_number" VARCHAR(10) NOT NULL DEFAULT '',
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_invoice" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "payment_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_access_tokens" (
    "id" BIGSERIAL NOT NULL,
    "tokenable_type" VARCHAR(255) NOT NULL,
    "tokenable_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "abilities" TEXT,
    "last_used_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "personal_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "product_price_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "min_qty" INTEGER NOT NULL,
    "old_price" INTEGER NOT NULL,
    "new_price" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricelist" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "reference" VARCHAR(255),
    "include_all_product" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pricelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricelist_detail" (
    "id" BIGSERIAL NOT NULL,
    "pricelist_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "min_qty" INTEGER NOT NULL DEFAULT 1,
    "price_type" SMALLINT NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "pricelist_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principal" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "is_global_price" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "principal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "product_type_id" SMALLINT NOT NULL DEFAULT 1,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "sku" VARCHAR(50),
    "weight" INTEGER NOT NULL,
    "point" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL,
    "updated_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "master_product_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_batch" (
    "id" BIGSERIAL NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "qty" INTEGER NOT NULL,
    "expired_date" DATE NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "warehouse_id" INTEGER NOT NULL DEFAULT 0,
    "reference" VARCHAR(50),

    CONSTRAINT "product_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_detail" (
    "id" BIGSERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sku" VARCHAR(50),
    "stock" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "initial_price" INTEGER NOT NULL DEFAULT 0,
    "cost_price" DECIMAL(15,6) NOT NULL DEFAULT 0,

    CONSTRAINT "product_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_dimension" (
    "id" BIGSERIAL NOT NULL,
    "master_product_id" INTEGER NOT NULL,
    "length" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "width" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "height" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "product_dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image" (
    "id" BIGSERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "photo" VARCHAR(255) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "master_product_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image_request" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "status_id" SMALLINT NOT NULL,
    "master_product_id" INTEGER NOT NULL,
    "photo" VARCHAR(255) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "product_image_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price" (
    "id" BIGSERIAL NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "min_qty" INTEGER NOT NULL,
    "max_qty" INTEGER,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "product_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_property" (
    "id" BIGSERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "master_product_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_type" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "product_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_type_rule" (
    "id" BIGSERIAL NOT NULL,
    "product_type_id" INTEGER NOT NULL,
    "membership_type_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "product_type_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "news_id" INTEGER NOT NULL DEFAULT 0,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" VARCHAR(255) NOT NULL DEFAULT '',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_condition" (
    "id" BIGSERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "program_condition_type" VARCHAR(50) NOT NULL,
    "master_product_id" INTEGER,
    "min_qty" INTEGER,
    "min_amount" DECIMAL(12,2),
    "max_discount_percentage" DECIMAL(5,2),
    "role_id" INTEGER,
    "calculation_type" VARCHAR(50) NOT NULL DEFAULT 'NONE',
    "accumulation_type" VARCHAR(50) NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "order_channel" VARCHAR(50) NOT NULL DEFAULT 'ALL',
    "max_qty" INTEGER,
    "max_amount" DECIMAL(12,2),

    CONSTRAINT "program_condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_product" (
    "id" BIGSERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "master_product_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "program_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_reward" (
    "id" BIGSERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "program_reward_type" VARCHAR(50) NOT NULL,
    "value" DECIMAL(12,2),
    "max_value" DECIMAL(12,2),
    "point" INTEGER,
    "free_product_id" INTEGER,
    "free_product_qty" INTEGER,
    "calculation_type" VARCHAR(50) NOT NULL DEFAULT 'NONE',
    "is_repeatable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "min_qty" INTEGER,
    "min_amount" DECIMAL(12,2),
    "point_type_id" INTEGER DEFAULT 0,

    CONSTRAINT "program_reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "province" (
    "id" BIGSERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "role_type_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" BIGSERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_territory" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "minimum_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sales_territory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_territory_member" (
    "id" BIGSERIAL NOT NULL,
    "sales_territory_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "sales_territory_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_territory_supervisor" (
    "id" BIGSERIAL NOT NULL,
    "sales_territory_id" INTEGER NOT NULL,
    "supervisor_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "sales_territory_supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_detail" (
    "id" BIGSERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "service_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "ship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship_detail" (
    "id" BIGSERIAL NOT NULL,
    "ship_id" INTEGER NOT NULL,
    "ship_service_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "code" VARCHAR(50) NOT NULL DEFAULT '',

    CONSTRAINT "ship_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship_service" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "ship_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "shipping_status_id" INTEGER NOT NULL,
    "address_id" INTEGER NOT NULL,
    "charge" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "ship_detail_id" INTEGER NOT NULL DEFAULT 1,
    "shipping_type_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "shipping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slider" (
    "id" BIGSERIAL NOT NULL,
    "slider_location_id" SMALLINT NOT NULL,
    "photo" VARCHAR(255) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "store_id" INTEGER NOT NULL DEFAULT 0,
    "news_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "slider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slider_location" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "slider_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stock_opname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname_detail" (
    "id" BIGSERIAL NOT NULL,
    "stock_opname_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "product_batch_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "batch_number" VARCHAR(50),
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "stock_opname_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" VARCHAR(5) NOT NULL,
    "geocoding_address" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "photo" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "city_id" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "company_id" INTEGER NOT NULL DEFAULT 0,
    "attendance_radius" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_address" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "urban_id" INTEGER NOT NULL,
    "postcode" VARCHAR(5) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "is_primary" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "store_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_balance" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "reference_id" INTEGER,
    "balance_type_id" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_status_id" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "store_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_hour" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "day_of_week_id" SMALLINT NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "store_hour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "summary_product_best_seller" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "master_product_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_detail_id" INTEGER NOT NULL,
    "period_type_id" SMALLINT NOT NULL,
    "total_sold" BIGINT NOT NULL,
    "last_sold_at" DATE NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "sold_frequency" INTEGER NOT NULL DEFAULT 0,
    "total_customer" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "summary_product_best_seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_invoice_serial_number" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "start_number" VARCHAR(255) NOT NULL,
    "end_number" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "tax_invoice_serial_number_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_invoice_serial_number_detail" (
    "id" BIGSERIAL NOT NULL,
    "tax_invoice_serial_number_id" INTEGER NOT NULL,
    "reference_number" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "serial_number" VARCHAR(255) NOT NULL DEFAULT '',

    CONSTRAINT "tax_invoice_serial_number_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telescope_entries" (
    "sequence" BIGSERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "family_hash" VARCHAR(255),
    "should_display_on_index" BOOLEAN NOT NULL DEFAULT true,
    "type" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),

    CONSTRAINT "telescope_entries_pkey" PRIMARY KEY ("sequence")
);

-- CreateTable
CREATE TABLE "telescope_entries_tags" (
    "entry_uuid" UUID NOT NULL,
    "tag" VARCHAR(255) NOT NULL,

    CONSTRAINT "telescope_entries_tags_pkey" PRIMARY KEY ("entry_uuid","tag")
);

-- CreateTable
CREATE TABLE "telescope_monitoring" (
    "tag" VARCHAR(255) NOT NULL,

    CONSTRAINT "telescope_monitoring_pkey" PRIMARY KEY ("tag")
);

-- CreateTable
CREATE TABLE "tracking" (
    "id" BIGSERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "ship_detail_id" INTEGER NOT NULL,
    "airway_bill_number" VARCHAR(50) NOT NULL,
    "history" TEXT,
    "delivery" TEXT,
    "payload" TEXT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_conversion" (
    "id" BIGSERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "master_product_id" INTEGER NOT NULL DEFAULT 0,
    "factor" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "unit_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urban" (
    "id" BIGSERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "province_id" INTEGER NOT NULL,
    "city_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "postcode" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "urban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_address" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "urban_id" INTEGER NOT NULL,
    "postcode" VARCHAR(5) NOT NULL,
    "geocoding_address" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "is_primary" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "user_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_address_location_request" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "user_address_id" INTEGER NOT NULL,
    "location_request_status_id" SMALLINT NOT NULL DEFAULT 1,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_address_location_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_balance" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reference_id" INTEGER,
    "balance_type_id" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_status_id" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "user_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_click_product" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "master_product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_click_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_device_info" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "brand" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "os" VARCHAR(255) NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "is_physical_device" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_device_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_limit" (
    "user_id" INTEGER NOT NULL,
    "limit_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_limit_pkey" PRIMARY KEY ("user_id","limit_id")
);

-- CreateTable
CREATE TABLE "user_limit_temporary" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "limit" BIGINT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_limit_temporary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_point" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "point_type_id" INTEGER NOT NULL,
    "reference_id" INTEGER,
    "key" VARCHAR(50) NOT NULL,
    "amount" INTEGER NOT NULL,
    "point_status_id" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "program_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_point_type" (
    "id" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_point_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pricelist" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "pricelist_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_pricelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_search" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "keyword" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_store" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_store_status_id" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "role_id" INTEGER NOT NULL DEFAULT 3,
    "code" VARCHAR(50) NOT NULL DEFAULT '',
    "reference_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMP(0),
    "password" VARCHAR(255) NOT NULL,
    "remember_token" VARCHAR(100),
    "role_id" INTEGER NOT NULL,
    "photo" VARCHAR(255),
    "phone" VARCHAR(30),
    "phone_verified_at" TIMESTAMP(0),
    "date_of_birth" DATE,
    "store_id" BIGINT,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),
    "code" VARCHAR(50) NOT NULL DEFAULT '',
    "created_by" INTEGER NOT NULL DEFAULT 0,
    "updated_by" INTEGER NOT NULL DEFAULT 0,
    "national_id" VARCHAR(20) NOT NULL DEFAULT '',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse" (
    "id" BIGSERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "reference" VARCHAR(50),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),
    "user_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" ON "failed_jobs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "fcm_token_token_unique" ON "fcm_token"("token");

-- CreateIndex
CREATE INDEX "jobs_queue_index" ON "jobs"("queue");

-- CreateIndex
CREATE UNIQUE INDEX "menu_name_unique" ON "menu"("name");

-- CreateIndex
CREATE INDEX "password_resets_email_index" ON "password_resets"("email");

-- CreateIndex
CREATE UNIQUE INDEX "permission_name_unique" ON "permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "personal_access_tokens_token_unique" ON "personal_access_tokens"("token");

-- CreateIndex
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" ON "personal_access_tokens"("tokenable_type", "tokenable_id");

-- CreateIndex
CREATE UNIQUE INDEX "telescope_entries_uuid_unique" ON "telescope_entries"("uuid");

-- CreateIndex
CREATE INDEX "telescope_entries_batch_id_index" ON "telescope_entries"("batch_id");

-- CreateIndex
CREATE INDEX "telescope_entries_created_at_index" ON "telescope_entries"("created_at");

-- CreateIndex
CREATE INDEX "telescope_entries_family_hash_index" ON "telescope_entries"("family_hash");

-- CreateIndex
CREATE INDEX "telescope_entries_type_should_display_on_index_index" ON "telescope_entries"("type", "should_display_on_index");

-- CreateIndex
CREATE INDEX "telescope_entries_tags_tag_index" ON "telescope_entries_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");

-- AddForeignKey
ALTER TABLE "telescope_entries_tags" ADD CONSTRAINT "telescope_entries_tags_entry_uuid_foreign" FOREIGN KEY ("entry_uuid") REFERENCES "telescope_entries"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
