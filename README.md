# Student Record Management System

A college-level full-stack project using **React + Vite** for the frontend, **C++ (Crow)** for the REST API, and **MySQL** for persistence. It also demonstrates DSA concepts: linear search and merge sort.

## Features

- List, search, sort, add, edit, and delete student records
- Department relationships in MySQL
- C++ REST API backed by MySQL Connector/C++
- Linear-search and merge-sort implementations for DSA demonstration
- React responsive dashboard UI

## Project Structure

```text
student-record-management-system/
├── backend/
│   ├── .env.example
│   ├── CMakeLists.txt
│   └── src/main.cpp
├── database/schema.sql
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

## 1. Set up MySQL

Open MySQL Workbench and run `database/schema.sql`. It creates the `student_management` database, `departments` and `students` tables, and sample rows.

## 2. Build and run the C++ API

Requirements: a C++17 compiler, CMake, Crow headers/dependencies, and MySQL Connector/C++ installed and discoverable by CMake.

Copy `backend/.env.example` to `backend/.env` and adjust the local database settings. The current starter reads configuration from environment variables, so export the values in your terminal before launching the API (see the source for the supported variable names).

Example build:

```bash
cd backend
cmake -S . -B build
cmake --build build
./build/student_api
```

If your system installs Crow or MySQL Connector/C++ in a custom location, adjust `CMakeLists.txt` accordingly. Do not commit passwords or real `.env` files.

## 3. Run the React frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. The Vite configuration proxies API requests to the C++ service; keep the API running on the configured port.

## API endpoints

- `GET /api/health` — API/database health
- `GET /api/students` — list students; supports search and sort query parameters
- `POST /api/students` — add a student
- `PUT /api/students/:id` — update a student
- `DELETE /api/students/:id` — delete a student

## Notes

This is a learning project scaffold. Configure and test the C++ dependencies and local MySQL credentials for your machine before presenting or deploying it. The code has not been validated against your local database environment.
