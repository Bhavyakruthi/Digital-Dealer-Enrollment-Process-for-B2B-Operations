# Digital Dealer Enrollment Process for B2B Operations

This project is a web application to manage customer onboarding. It includes:

- A **frontend** (HTML, CSS, JavaScript) for form submission
- A **backend** (Node.js/Express) for handling data
- A **PostgreSQL** database to store customer, sales, and accounts information

---

## 📁 Project Structure

| File/Folder      | Description                                 |
|------------------|---------------------------------------------|
| `index.html`     | Frontend form for submitting customer data  |
| `style.css`      | Styles for the frontend                     |
| `test.js`        | Handles client-side form logic              |
| `server.js`      | Express backend server                      |
| `schema.sql`     | PostgreSQL schema for database structure    |
| `.env.example`   | Template for environment variables          |

---

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

---

## Setup Instructions

### 1. Clone the Repository
Clone the project from GitHub:

```bash
git clone https://github.com/your-username/hbl-customer-form.git
cd hbl-customer-form 
```
### 2. Install Node.js Dependencies
Install the required Node.js packages:

```bash
npm install
```

### 3. Set Up the PostgreSQL Database

- Install PostgreSQL if not already installed. Ensure the psql command is available.

- Create a database named hbl_customer:

```bash
psql -U postgres
CREATE DATABASE hbl_customer;
\c hbl_customer
```

- Run the schema.sql file to create the necessary tables and triggers:

```bash
psql -U postgres -d hbl_customer -f schema.sql
```

### 4. Configure Environment Variables
- Copy the .env.example file to .env:

```bash
cp .env.example .env
```

- Edit the .env file with your PostgreSQL credentials:

```bash
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=hbl_customer
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```
### 5. Run the Backend Server
- Start the Node.js server:

```bash
node server.js
```
- The server will run at: [http://localhost:3000]

### 6. Access the Frontend

- Open `index.html` in a web browser to access the form. 
**Alternatively**, if the frontend is served by the backend, navigate to [http://localhost:3000](ensure your server.js is configured to serve static files if needed).

### 7. Test the Application

- Fill out the form in the browser and submit it.
- The form data will be sent to the /submit-form endpoint and stored in the PostgreSQL database.
- Check the server console for logs (e.g., "Form submitted successfully" or error messages).

## Database Schema

The database consists of the following tables:

| Table              |                      Description                                            |
|--------------------|-----------------------------------------------------------------------------|
| `SalesPerson`      | HBL sales reps (emp_id, sales_name, sales_email)                            |
| `Customer`         | Core customer details (name, company, PAN, GST, etc.)                       |
| `CompanyProfile`   | Extra company info (partner names, turnovers, photo)                        |
| `AddressesInfo`    | Registered and optional shipping addresses                                  |
| `BankDetails`      | Customer’s bank information                                                 |
| `Supplier`         | Two reference suppliers per customer                                        |
| `Customer_Supplier`| Mapping between customers and their suppliers                               |
| `Declaration`      | Declaration details (designation, date, sign)                               |
| `SalesInfo`        | Sales team details (requesting branch, credit limit requested, etc.)        |
| `AccountsInfo`     | Accounts team details (code number, credit limit approved, etc.)            |

> Run `schema.sql` to create these tables with appropriate ENUMs, constraints, triggers, and indexes.

---

## 🔐 Notes

- `.env` is **not included** in version control. Use `.env.example` as a template.
- Image fields like `photo` and `sign` expect base64 strings (max 2MB).
- Form submissions are sent to: `http://localhost:3000/submit-form`
- Ensure PostgreSQL is running before starting the backend.
- A trigger enforces a **maximum of two suppliers per customer**.

---

## Troubleshooting

| Issue                        | Solution                                                                 |
|-----------------------------|--------------------------------------------------------------------------|
| Database connection failed  | Verify PostgreSQL is running and `.env` has correct credentials          |
| Form not submitting         | Check server logs for error messages                                     |
| Tables missing              | Ensure `schema.sql` was successfully executed                            |
| Node.js errors              | Run `npm install` to install dependencies                                |

---

## 📩 Contact

For any queries, contact:
**Bhavya Kruthi**  
📧 bhavyakruthivemula@gmail.com

---
