require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3000;

console.log('DB_USER:', process.env.DB_USER ? 'Set' : 'Not set');
console.log('DB_HOST:', process.env.DB_HOST ? 'Set' : 'Not set');
console.log('DB_NAME:', process.env.DB_NAME ? 'Set' : 'Not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Set' : 'Not set');
console.log('DB_PORT:', process.env.DB_PORT ? 'Set' : 'Not set');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hbl_customer',
  password: String(process.env.DB_PASSWORD),
  port: parseInt(process.env.DB_PORT) || 5432
});

pool.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connected to PostgreSQL database');
});

app.post('/submit-form', async (req, res) => {
  console.log('Received form data:', JSON.stringify(req.body, null, 2));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      sales_name, emp_id, sales_email,
      customer_name, company_name, commercial_name, customer_address, customerType, otherCustomerType,
      Category, pan, gst, year_incorporation, area, range, Association_HBL,
      partner_company_name, Status, fy_20_21, fy_21_22, fy_22_23, branches_name, sister_Company_name, photo,
      address1, address2, differentShipping,
      bank_name, acc_number, acc_type, branch_name, ifsc, limits, security_cheque, pdc_cheque,
      supplier1_name, supplier1_address, supplier1_phone, supplier1_contact, supplier1_payment,
      supplier2_name, supplier2_address, supplier2_phone, supplier2_contact, supplier2_payment,
      designation, date, sign,
      requesting_branch, sales_head, sales_ho, estm, division, credit_limit_req, Requests,
      code_number, existing_code, credit_limit_radio, credit_limit_amount, Cummulative,
      credit_limit, account_request, account_request_name, account_authorized, account_authorized_name,
      account_checked, account_checked_name, credit_approved
    } = req.body;

    if (!emp_id || !customer_name || !company_name || !pan || !gst || !supplier1_name || !supplier2_name) {
      throw new Error('Missing required fields');
    }
    if (photo && Buffer.from(photo, 'base64').length > 2 * 1024 * 1024) {
      throw new Error('Photo size exceeds 2MB');
    }
    if (supplier1_name === supplier2_name) {
      throw new Error('Supplier names must be distinct');
    }
    if (!photo) throw new Error('Photo is required');
    if (!sign) throw new Error('Sign is required');

    const yearInc = parseInt(year_incorporation, 10);
    const fy20_21 = parseFloat(fy_20_21);
    const fy21_22 = parseFloat(fy_21_22);
    const fy22_23 = parseFloat(fy_22_23);
    const creditLimitAmount = credit_limit_radio === 'yes' ? parseFloat(credit_limit_amount) : null;
    const cummulativeCreditLimit = credit_limit_radio === 'yes' ? parseFloat(Cummulative) : null;
    const approvedCreditLimit = parseFloat(credit_limit);

    if (isNaN(yearInc)) throw new Error('Invalid year_incorporation');
    if (isNaN(fy20_21) || isNaN(fy21_22) || isNaN(fy22_23)) throw new Error('Invalid fiscal year turnover');
    if (credit_limit_radio === 'yes' && (isNaN(creditLimitAmount) || isNaN(cummulativeCreditLimit))) {
      throw new Error('Invalid credit limit amounts');
    }
    if (isNaN(approvedCreditLimit)) throw new Error('Invalid approved credit limit');

    await client.query(
      'INSERT INTO "SalesPerson" (emp_id, sales_name, sales_email) VALUES ($1, $2, $3) ON CONFLICT (emp_id) DO NOTHING',
      [emp_id, sales_name, sales_email]
    );

    const customerResult = await client.query(
      'INSERT INTO "Customer" (emp_id, customer_name, company_name, commercial_name, customer_address, "customerType", "otherCustomerType", "Category", pan, gst, year_incorporation, area, range, "Association_HBL") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING customer_id',
      [emp_id, customer_name, company_name, commercial_name || null, customer_address, customerType, otherCustomerType || null, Category, pan, gst, yearInc, area, range, Association_HBL]
    );
    const customer_id = customerResult.rows[0].customer_id;

    await client.query(
      'INSERT INTO "CompanyProfile" (customer_id, partner_company_name, "Status", fy_20_21, fy_21_22, fy_22_23, branches_name, sister_Company_name, photo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [customer_id, partner_company_name, Status, fy20_21, fy21_22, fy22_23, branches_name || null, sister_Company_name || null, photo]
    );

    await client.query(
      'INSERT INTO "AddressesInfo" (customer_id, address_type, business_address, pin, city, state, country, contact_person, phone, email, designation, mobile, fax) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
      [customer_id, 'Registered', address1.business_address1, address1.pin1, address1.city1, address1.state1, address1.country1, address1.contact1, address1.phone1, address1.email_id1, address1.designation1, address1.mobile1 || null, address1.fax1 || null]
    );

    if (!differentShipping) {
      await client.query(
        'INSERT INTO "AddressesInfo" (customer_id, address_type, business_address, pin, city, state, country, contact_person, phone, email, designation, mobile, fax) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [customer_id, 'Shipping', address2.business_address2, address2.pin2, address2.city2, address2.state2, address2.country2, address2.contact2, address2.phone2, address2.email_id2, address2.designation2, address2.mobile2 || null, address2.fax2 || null]
      );
    }

    await client.query(
      'INSERT INTO "BankDetails" (customer_id, bank_name, acc_number, acc_type, branch_name, ifsc, limits, security_cheque, pdc_cheque) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [customer_id, bank_name, acc_number, acc_type, branch_name, ifsc, limits || null, security_cheque, pdc_cheque]
    );

    const supplier1Result = await client.query(
      'INSERT INTO "Supplier" (customer_id, company_name, address, phone, contact_person, payment_terms) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ON CONSTRAINT unique_supplier DO UPDATE SET company_name = EXCLUDED.company_name RETURNING supplier_id',
      [customer_id, supplier1_name, supplier1_address, supplier1_phone, supplier1_contact, supplier1_payment || null]
    );
    const supplier1_id = supplier1Result.rows[0].supplier_id;

    const supplier2Result = await client.query(
      'INSERT INTO "Supplier" (customer_id, company_name, address, phone, contact_person, payment_terms) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ON CONSTRAINT unique_supplier DO UPDATE SET company_name = EXCLUDED.company_name RETURNING supplier_id',
      [customer_id, supplier2_name, supplier2_address, supplier2_phone, supplier2_contact, supplier2_payment || null]
    );
    const supplier2_id = supplier2Result.rows[0].supplier_id;

    await client.query(
      'INSERT INTO "Customer_Supplier" (customer_id, supplier_id) VALUES ($1, $2)',
      [customer_id, supplier1_id]
    );
    await client.query(
      'INSERT INTO "Customer_Supplier" (customer_id, supplier_id) VALUES ($1, $2)',
      [customer_id, supplier2_id]
    );

    await client.query(
      'INSERT INTO "Declaration" (customer_id, emp_id, designation, date, sign) VALUES ($1, $2, $3, $4, $5)',
      [customer_id, emp_id, designation, date, sign]
    );

    await client.query(
      'INSERT INTO "SalesInfo" (customer_id, emp_id, requesting_branch, division, credit_limit_req, sales_head, sales_ho, estm, Requests) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [customer_id, emp_id, requesting_branch, division, credit_limit_req, sales_head, sales_ho, estm, Requests || null]
    );

    await client.query(
      'INSERT INTO "AccountsInfo" (customer_id, emp_id, code_number, existing_code, credit_limit_amount, "Cummulative", account_request, account_request_name, account_authorized, account_authorized_name, account_checked, account_checked_name, credit_approved, credit_limit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
      [customer_id, emp_id, code_number, existing_code || null, creditLimitAmount, cummulativeCreditLimit, account_request, account_request_name, account_authorized, account_authorized_name, account_checked, account_checked_name, credit_approved, approvedCreditLimit]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (err) {
    console.error('Query error:', err.stack);
    await client.query('ROLLBACK');
    res.status(400).json({ error: 'Failed to submit form: ' + err.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});