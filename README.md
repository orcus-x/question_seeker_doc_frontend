
# QuestionSeekerDoc Frontend

**QuestionSeekerDoc Frontend** is a lightweight web application that connects to the **QuestionSeekerDoc** backend API.  
It allows users to upload PDF documents, track processing status, and view extracted questions and answers.  
Built for simplicity, speed, and easy deployment.

---

## Tech Stack
- **Frontend Framework**: React.js (Vite / Create React App)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS (or plain CSS depending on your setup)
- **API Connection**: RESTful API (connects to Phoenix backend)

---

## Installation and Setup

### Prerequisites
- **Node.js** and **npm** installed

(You can download from [Node.js official website](https://nodejs.org/)).

---

### 1. Clone the project

```bash
git clone https://github.com/orcus-x/question_seeker_doc_frontend.git
cd question_seeker_doc_frontend/frontend
```

---

### 2. Install dependencies

```bash
npm install
```
or
```bash
yarn
```
(Choose depending on your package manager.)

---

### 3. Create `.env` file

Inside `frontend/`, create a file called `.env`:

```bash
# API URL pointing to your backend server
VITE_API_URL=http://localhost:4000/api
```

✅ In production, set `VITE_API_URL` to your deployed backend address.

---

### 4. Running the Frontend

### Development Mode

```bash
npm run dev
```
or
```bash
yarn dev
```

Frontend will start at:  
[http://localhost:8080](http://localhost:8080)

---

### Production Build

```bash
npm run build
```
or
```bash
yarn build
```

This will generate static files inside the `dist/` directory ready for deployment.

To preview the production build locally:

```bash
npm run preview
```

---

## Environment Variables Summary

| Variable | Purpose |
|:---------|:--------|
| VITE_API_URL | Base URL for connecting to the backend API |

---

## Basic Frontend Features

- 📄 Upload PDF files to backend
- 🕐 Show document processing status
- 📚 Display extracted questions and answers
- 📦 Fully connected to REST API provided by Phoenix backend
