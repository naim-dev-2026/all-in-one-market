# All in one Marketplace - Full-Stack E-Commerce Engine

A production-ready, full-stack e-commerce marketplace featuring a headless **Django REST Framework (DRF)** backend, a relational **PostgreSQL** database tier, and a responsive, modular **React** frontend view layer. This application is architected to prioritize high-concurrency data integrity, state-less secure authentication, and optimized client-server search pipelines.

## 🚀 Key Architectural & Full-Stack Features

### 1. High-Concurrency Checkout Pipeline (Race Condition Mitigation)
*   **Database Level Locking:** Implemented a pessimistic locking strategy inside the secure checkout API view using Django's atomic transactions (`transaction.atomic()`) and row-locking queries (`select_for_update()`).
*   **Inventory Protection:** When high-volume waves of buyers attempt to purchase identical product lines at the exact same millisecond, PostgreSQL serializes the queue. The first transaction executes safely, while subsequent concurrent requests are immediately rejected by the business logic tier with explicit stock validation errors, preventing over-selling.

### 2. Performance-Optimized Live Autocomplete Search Engine
*   **Frontend Debouncing:** Built an asynchronous typeahead query stream in the React navigation console, wrapped inside a 250ms debouncing layer using hooks. This stops unnecessary network dispatches on every keystroke, protecting the database from traffic flooding.
*   **SQL Memory Selection Optimization:** On the backend Python views, the autocomplete endpoint is optimized using `.values('id', 'title')` lookups. This bypasses loading heavy item descriptions or binary media blobs into server memory, executing lightning-fast, narrow queries across indexed PostgreSQL title rows.

### 3. Role-Based Permissions & Stateless Security Fence
*   **Stateless JWT Authentication:** Configured secure authentication states using `SimpleJWT` Bearer token exchange protocols stored in client-side memory blocks.
*   **Merchant Isolation Guard:** Created custom permission classes on the REST viewsets to prevent unauthorized customer cross-talk or route manipulation. Regular consumers are strictly fenced out, while authorized staff members are granted direct access to auditing live order logs, managing stock status variables, and processing dispatch invoices.

### 4. Modular Frontend Architecture & Fluid UI Grid
*   **Dynamic Data Compiling:** Implemented advanced client-side processing metrics utilizing React `useMemo` hooks to recursively map and transform relational database arrays into complex hierarchical parent-child category trees for the navigation drawer.
*   **Fluid Responsive Layout:** Re-architected standard pixel-constrained wrapper nodes into an edge-to-edge, percentage-based fluid CSS grid system (`auto-fill, minmax(280px, 1fr)`), allowing products cards to populate horizontally across ultra-wide desktop monitors.

---

## 🛠️ Tech Stack & Dependencies

*   **Backend:** Python, Django, Django REST Framework, SimpleJWT (JWT Authentication).
*   **Database:** PostgreSQL (Production) / SQLite (Local prototyping environment).
*   **Frontend:** React, Vite, Axios, React Router DOM.
*   **Design & Styling:** Inline CSS styling sheets, absolute layout nodes, adaptive color matrices.

---

## ⚙️ Local Development Installation Setup (Windows CMD)

### Backend Architecture Configuration
1. Open your Windows Command Prompt and navigate to the backend application subdirectory folder:
   ```cmd
   cd Backend
   ```
2. Create and initialize a clean Python isolation environment:
   ```cmd
   python -m venv .venv
   ```
3. Activate the environment via CMD:
   ```cmd
   .venv\Scripts\activate
   ```
4. Copy the environment variables config template file:
   ```cmd
   copy .env.example .env
   ```
5. Apply migration tracking sheets down into your database tables:
   ```cmd
   python manage.py migrate
   ```
6. Fire up your local prototyping server endpoint link console:
   ```cmd
   python manage.py runserver
   ```

### Frontend Interface Configuration
1. Open a new Command Prompt window and navigate to your separate user view workspace folder:
   ```cmd
   cd Frontend/frontend
   ```
2. Fetch and register your asset node package modules maps:
   ```cmd
   npm install
   ```
3. Kick off your hot-reloading development server engine block:
   ```cmd
   npm run dev
   ```

