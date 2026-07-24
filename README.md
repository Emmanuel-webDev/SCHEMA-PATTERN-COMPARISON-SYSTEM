# SPCS — Schema Pattern Comparison System

> **🎓 A Final Year Project**, submitted in partial fulfilment of the requirements for the award of a Bachelor's degree in Computer Science.

An AI-powered web application that analyses a user's project description in plain English and recommends the optimal database schema design — relational, document-based, or a hybrid polyglot architecture — complete with schema structure, design patterns, risk assessment, and an implementation roadmap.

---

## Project Information

| | |
|---|---|
| **Project Title** | Schema Design Patterns: Relational vs Document-Based Approaches |
| **Project Type** | Final Year Project (B.Sc. Computer Science) |
| **System Name** | Schema Pattern Comparison System (SPCS) |
| **Methodology** | Object-Oriented Analysis and Design Methodology (OOADM) |
| **AI Engine** | Google Gemini (2.5 Flash) |
| **Status** | Functional Prototype |

This repository contains the working software implementation of the seminar/thesis research on comparative schema design patterns. The accompanying written project (Chapters 1–5) provides the full literature review, system analysis, and methodology that this software implements.

---

## About This Project

Modern software development requires choosing between relational and document-based database paradigms, yet developers frequently lack a structured, evidence-based framework for making this decision — leading to inefficient queries, poor scalability, or unnecessary schema migrations.

**SPCS solves this** by letting a user describe their project in natural language. An AI model (Gemini) analyses the description against seven measurable dimensions — data structure, relationship complexity, consistency requirements, scalability needs, governance obligations, and schema evolution expectations — and returns:

- ✅ A paradigm recommendation (Relational / Document / Polyglot)
- ✅ A confidence score and plain-language justification
- ✅ A generated schema structure (SQL tables or JSON documents)
- ✅ Specific schema design patterns to apply
- ✅ Risk, governance, and future-readiness assessments
- ✅ A real-world comparison (e.g. "similar to Netflix's architecture")
- ✅ A phased implementation roadmap

---

## Features

-  **Natural language input** — no forms, no quizzes. Just describe your project.
-  **AI-powered analysis** — Gemini 1.5 Flash evaluates requirements and generates a structured recommendation.
-  **7-dimension scoring engine** — Structured Data, Semi-Structured Data, Consistency, Scalability, Governance, Relationship Complexity, and Evolution Requirement.
-  **Schema pattern recommendations** — drawn from a research-backed catalogue (Attribute Pattern, Bucket Pattern, Audit Log Pattern, Star Schema, and more).
-  **Auto-generated schema code** — real SQL `CREATE TABLE` statements or annotated JSON document structures.
-  **Real-world architecture comparisons** — see how companies like Amazon, Netflix, Uber, and Airbnb solve similar problems.
-  **Risk, governance & future-readiness assessment** — practical, decision-support output, not just theory.
-  **Implementation roadmap** — a 3-phase plan to actually build the recommended schema.
-  **Developer-focused UI** — built for clarity during technical demonstrations and project defence.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express (local proxy) / Vercel Serverless Functions (production) |
| AI Engine | Google Gemini API (`gemini-2.5-flash`) |
| Hosting | Vercel |
| Methodology | OOADM, UML (Use Case, Activity, Sequence, DFD diagrams) |

---

---

## Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher
- A free [Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/spcs-app.git
cd spcs-app

# 2. Install frontend dependencies
npm install

# 3. Install backend proxy dependencies
npm install express cors node-fetch@2
```

### Running locally

You need **two terminals** running simultaneously:

```bash
# Terminal 1 — start the local proxy server
node proxy.cjs
```

```bash
# Terminal 2 — start the React frontend
npm run dev
```

Then open **http://localhost:5173** in your browser, paste in your Gemini API key, and describe a project to test the system.

---

## Deployment

This project is deployed on **Vercel**, using:
- The React frontend, built via Vite
- A serverless function (`api/gemini.js`) that replaces the local proxy in production

---

## Validation

The system's recommendation logic was validated against five real-world scenarios during development:

| Scenario | Expected Recommendation |
|---|---|
| Banking System | Relational |
| Hospital Management System | Relational |
| Social Media Platform | Document |
| IoT Monitoring Platform | Document |
| Large E-commerce Platform | Polyglot |

Full validation methodology and results are documented in the project report.

---

## Academic Basis

This software is grounded in a systematic literature review of **33 peer-reviewed works published between 2018 and 2026**, covering relational database theory, document-oriented data modelling, the CAP theorem, ACID/BASE consistency models, and schema design pattern catalogues. The complete literature review, system analysis, and research methodology are documented in the accompanying written project report (Chapters 1–5).

---

## Disclaimer

This software was developed as an **academic final year project** for the purpose of demonstrating applied research in database schema design. It is a functional prototype intended for educational and demonstrative purposes and has not been hardened for production use in commercial systems.

---

## Author

**CHINONSO ONUORAH**
B.Sc. Computer Science — Final Year Project
CHUKWEMEKA ODUMEGWU OJUKWU UNIVERSITY
2026

Supervised by: **DR. CHIAGOZIE ANTHONY**

---
