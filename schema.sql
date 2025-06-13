-- Create ENUM types for consistent data validation
CREATE TYPE customer_type AS ENUM ('Manufacturer', 'Trader', 'Service', 'Distributor', 'Others');
CREATE TYPE category_type AS ENUM ('PSU', 'Quasi Govt', 'Pvt (Large)', 'Pvt (Med)', 'Pvt (Small)', 'Telecom', 'Railway', 'Defence');
CREATE TYPE status_type AS ENUM ('Proprietorship', 'Partnership', 'Pvt Limited Co', 'Public Limited Co', 'HUF', 'AOP');
CREATE TYPE address_type AS ENUM ('Registered', 'Shipping');

-- SalesPerson table: Stores details of HBL sales representatives
CREATE TABLE "SalesPerson" (
    emp_id VARCHAR(50) PRIMARY KEY,
    sales_name VARCHAR(100) NOT NULL,
    sales_email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer table: Core customer details
CREATE TABLE "Customer" (
    customer_id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    commercial_name VARCHAR(100),
    customer_address TEXT NOT NULL,
    "customerType" customer_type NOT NULL,
    "otherCustomerType" VARCHAR(100),
    "Category" category_type NOT NULL,
    pan VARCHAR(10) NOT NULL UNIQUE,
    gst VARCHAR(15) NOT NULL UNIQUE,
    year_incorporation INTEGER NOT NULL,
    area VARCHAR(255) NOT NULL,
    range VARCHAR(50) NOT NULL,
    "Association_HBL" DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emp_id) REFERENCES "SalesPerson"(emp_id)
);

-- CompanyProfile table: Additional company details
CREATE TABLE "CompanyProfile" (
    company_profile_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    partner_company_name VARCHAR(255) NOT NULL,
    "Status" status_type NOT NULL,
    fy_20_21 DECIMAL(10,2) NOT NULL,
    fy_21_22 DECIMAL(10,2) NOT NULL,
    fy_22_23 DECIMAL(10,2) NOT NULL,
    branches_name VARCHAR(255),
    sister_Company_name VARCHAR(255),
    photo TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id)
);

-- AddressesInfo table: Stores both registered and shipping addresses
CREATE TABLE "AddressesInfo" (
    address_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    address_type address_type NOT NULL,
    business_address TEXT NOT NULL,
    pin VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    mobile VARCHAR(10),
    fax VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id)
);

-- BankDetails table: Customer's bank information
CREATE TABLE "BankDetails" (
    bank_details_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    acc_number VARCHAR(50) NOT NULL,
    acc_type VARCHAR(50) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    ifsc VARCHAR(15) NOT NULL,
    limits VARCHAR(255),
    security_cheque VARCHAR(255) NOT NULL,
    pdc_cheque VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id)
);

-- Supplier table: Stores up to two suppliers per customer
CREATE TABLE "Supplier" (
    supplier_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(10) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    payment_terms VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_supplier UNIQUE (company_name, address),
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id)
);

-- Customer_Supplier table: Links customers to their suppliers
CREATE TABLE "Customer_Supplier" (
    customer_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, supplier_id),
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id),
    FOREIGN KEY (supplier_id) REFERENCES "Supplier"(supplier_id)
);

-- Declaration table: Stores declaration details
CREATE TABLE "Declaration" (
    declaration_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    emp_id VARCHAR(50) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    sign TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id),
    FOREIGN KEY (emp_id) REFERENCES "SalesPerson"(emp_id)
);

-- SalesInfo table: Sales-related details
CREATE TABLE "SalesInfo" (
    sales_info_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    emp_id VARCHAR(50) NOT NULL,
    requesting_branch VARCHAR(255) NOT NULL,
    division VARCHAR(255) NOT NULL,
    credit_limit_req VARCHAR(255) NOT NULL,
    sales_head VARCHAR(255) NOT NULL,
    sales_ho VARCHAR(255) NOT NULL,
    estm VARCHAR(255) NOT NULL,
    "Requests" TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id),
    FOREIGN KEY (emp_id) REFERENCES "SalesPerson"(emp_id)
);

-- AccountsInfo table: Accounts department details
CREATE TABLE "AccountsInfo" (
    accounts_info_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    emp_id VARCHAR(50) NOT NULL,
    code_number VARCHAR(255) NOT NULL,
    existing_code VARCHAR(255),
    credit_limit_amount DECIMAL(10,2),
    "Cummulative" VARCHAR(255),
    account_request VARCHAR(255) NOT NULL,
    account_request_name VARCHAR(255) NOT NULL,
    account_authorized VARCHAR(255) NOT NULL,
    account_authorized_name VARCHAR(255) NOT NULL,
    account_checked VARCHAR(255) NOT NULL,
    account_checked_name VARCHAR(255) NOT NULL,
    credit_approved VARCHAR(255) NOT NULL,
    credit_limit DECIMAL(20,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(customer_id),
    FOREIGN KEY (emp_id) REFERENCES "SalesPerson"(emp_id)
);

-- Function to check emp_id consistency
CREATE OR REPLACE FUNCTION check_emp_id_consistency()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "Customer"
        WHERE customer_id = NEW.customer_id AND emp_id = NEW.emp_id
    ) THEN
        RAISE EXCEPTION 'emp_id in % must match Customer.emp_id for customer_id %', TG_TABLE_NAME, NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for emp_id consistency
CREATE TRIGGER emp_id_declaration_trigger
BEFORE INSERT OR UPDATE ON "Declaration"
FOR EACH ROW EXECUTE FUNCTION check_emp_id_consistency();

CREATE TRIGGER emp_id_salesinfo_trigger
BEFORE INSERT OR UPDATE ON "SalesInfo"
FOR EACH ROW EXECUTE FUNCTION check_emp_id_consistency();

CREATE TRIGGER emp_id_accountsinfo_trigger
BEFORE INSERT OR UPDATE ON "AccountsInfo"
FOR EACH ROW EXECUTE FUNCTION check_emp_id_consistency();

-- Function to check supplier count
CREATE OR REPLACE FUNCTION check_supplier_count()
RETURNS TRIGGER AS $$
DECLARE
    supplier_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO supplier_count
    FROM "Customer_Supplier"
    WHERE customer_id = NEW.customer_id;

    IF supplier_count >= 2 THEN
        RAISE EXCEPTION 'Customer % cannot have more than two suppliers', NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for supplier count
CREATE TRIGGER supplier_count_trigger
BEFORE INSERT ON "Customer_Supplier"
FOR EACH ROW EXECUTE FUNCTION check_supplier_count();

-- Indexes for performance
CREATE INDEX idx_customer_emp_id ON "Customer"(emp_id);
CREATE INDEX idx_address_customer_id ON "AddressesInfo"(customer_id);
CREATE INDEX idx_companyprofile_customer_id ON "CompanyProfile"(customer_id);
CREATE INDEX idx_bankdetails_customer_id ON "BankDetails"(customer_id);
CREATE INDEX idx_declaration_customer_id ON "Declaration"(customer_id);
CREATE INDEX idx_declaration_emp_id ON "Declaration"(emp_id);
CREATE INDEX idx_salesinfo_customer_id ON "SalesInfo"(customer_id);
CREATE INDEX idx_salesinfo_emp_id ON "SalesInfo"(emp_id);
CREATE INDEX idx_accountsinfo_customer_id ON "AccountsInfo"(customer_id);
CREATE INDEX idx_accountsinfo_emp_id ON "AccountsInfo"(emp_id);
CREATE INDEX idx_customer_supplier_customer_id ON "Customer_Supplier"(customer_id);
CREATE INDEX idx_customer_supplier_supplier_id ON "Customer_Supplier"(supplier_id);