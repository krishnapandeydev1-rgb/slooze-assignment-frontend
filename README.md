## ⚛️ Running the Frontend (Next.js)

To start the **Next.js frontend app**, follow these steps:

### 1️⃣ Install Dependencies

From the `frontend` directory, run:

```bash
npm install
```

This will install all required packages.

---

### 2️⃣ Configure Backend API URL (if needed)

If your backend API runs on a different port or host, update the API base URL inside:

```
src/constants.ts
```

Example:

```ts
export const API_BASE_URL = "http://localhost:8080";
```

Change this value if your backend port or domain differs.

---

### 3️⃣ Start the Development Server

Run the following command:

```bash
npm run dev
```

Then open your browser and visit:

```
http://localhost:3000
```

---

### ✅ Done!

Your Next.js app should now be running locally and connected to the backend API.
