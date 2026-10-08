# Club Activities Management System

A full-stack **Club & Activity Management System** built with **React.js + Pure Native Node.js + MySQL**.

> ⚡ **Pure Native Node.js Architecture**: Zero `express` or `cors` framework dependencies. Powered directly by Node's built-in `http`, `url`, `fs`, and `path` modules for high performance and minimal footprint.

---

## 🌟 Architecture & Features

### 1. Club Management
- 4 Core Clubs: **AI Club**, **IT Club**, **Electronics Club**, and **Auto Club**.
- Each club coordinator is isolated to their own club workspace.

### 2. Member Management & Alumni Approval Workflow
- Two distinct member types:
  - **Student Members**: Auto-approved immediately without requiring admin review.
  - **Alumni Members**: Require Admin review and approval (**PENDING** -> **APPROVED**).
- Recruitment targets in Action Plans track **Alumni Member** additions.

### 3. Monthly Action Plans & Event Scheduling
- Coordinators schedule monthly activity action plans and set Alumni Recruitment targets.
- Free-form text box for **Event Type** (e.g., Workshop, Seminar, Hackathon).
- Action Plan events are **Add-Only** (events can be edited/rescheduled from the dedicated Events page).
- Event status toggle (`Completed` vs `Not Completed`), Event Remarks, and activity report uploads.

### 4. Activity Reports Repository
- Coordinators upload proof/attendance documents directly via pure native multipart handler.
- Direct downloads with proper `Content-Disposition`.

### 5. Multi-Filtered Monitoring Dashboards
- Year-wise ("Whole Year") and Month-wise analytics.
- Real-time KPI summaries dynamically filtering total members, student vs alumni count, and event statistics.

---

## 🚀 Quick Start Guide

### Option 1: Run with Native Node.js (Port 5000)

1. **Start Backend**:
   ```bash
   cd server
   npm install
   npm start
   ```
   *(Initializes database, seeds demo data, and serves API on http://localhost:5000)*

2. **Run Vite Dev Server**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *(Opens Vite dev server on http://localhost:3000)*

---

## 🔑 Default Demo Accounts

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@club.edu` | `Admin@123` | Global Oversight, Approvals & Reports |
| **AI Club Coordinator** | `ai.coord@club.edu` | `Coord@123` | AI Club |
| **IT Club Coordinator** | `it.coord@club.edu` | `Coord@123` | IT Club |
| **Electronics Club Coordinator** | `electronics.coord@club.edu` | `Coord@123` | Electronics Club |
| **Auto Club Coordinator** | `auto.coord@club.edu` | `Coord@123` | Auto Club |
