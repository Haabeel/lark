# LARK: AI-Powered Collaboration Platform for GitHub Projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<!-- Add other relevant badges if you have them, e.g., build status, code coverage -->

**LARK (Collaboration Platform with AI Insights for GitHub Projects)** is a modern, full-stack web application designed to streamline software development workflows by integrating project management, real-time communication, and cutting-edge AI-driven code insights for teams using GitHub.

**Live Demo:** [https://lark-pi.vercel.app/](https://lark-pi.vercel.app/)

**Full Academic Report:** *Coming soon*

## Table of Contents

-   [Overview](#overview)
-   [Key Features](#key-features)
-   [Technology Stack](#technology-stack)
-   [System Architecture Highlights](#system-architecture-highlights)
-   [Prerequisites](#prerequisites)
-   [Getting Started](#getting-started)
    -   [1. Clone the Repository](#1-clone-the-repository)
    -   [2. Install Dependencies](#2-install-dependencies)
    -   [3. Set Up Environment Variables](#3-set-up-environment-variables)
    -   [4. Set Up Supabase Database & Extensions](#4-set-up-supabase-database--extensions)
    -   [5. Run Database Migrations](#5-run-database-migrations)
-   [Running the Application](#running-the-application)
    -   [Development Mode](#development-mode)
    -   [Production Build](#production-build)
-   [Key AI Integrations](#key-ai-integrations)
-   [Security Considerations](#security-considerations)
-   [Known Limitations](#known-limitations)
-   [Future Work](#future-work)
-   [Contributing](#contributing)
-   [License](#license)
-   [Acknowledgements](#acknowledgements)

## Overview

Software development teams often juggle multiple tools for version control (GitHub), task management (Jira, Trello), communication (Slack, Teams), and increasingly, separate AI coding assistants. This tool fragmentation leads to context switching, information silos, and reduced efficiency.

LARK aims to solve these problems by providing a unified platform where developers can:
*   Manage their GitHub projects with integrated task boards (Kanban, Table, Calendar views).
*   Communicate in real-time through project-specific and direct message channels.
*   Gain deeper understanding of their codebase through AI-generated commit summaries and a contextual Code Q&A system.

This project was developed as a Final Year Project, demonstrating the feasibility and potential benefits of such an integrated, AI-augmented system.

## Key Features

*   **User Authentication & Management:**
    *   Secure sign-up and login with email/password.
    *   OAuth 2.0 integration with GitHub, Google and Microsoft.
    *   Email verification and password reset functionality.
    *   User profile management.
*   **Project Management:**
    *   Link and manage GitHub repositories (public and private via PAT).
    *   **Kanban Boards:** Visual task tracking with customizable columns and drag-and-drop.
    *   **Table View:** List-based task overview with sorting and filtering.
    *   **Calendar View:** Visualize tasks based on due dates.
    *   Task creation, assignment, status updates, priority setting.
    *   Project member invitation and role management (Maintainer, Contributor).
*   **AI-Powered Code Insights:**
    *   **Automated Commit Summarization:** AI-generated natural language summaries for GitHub commit diffs using Google Gemini models.
    *   **Contextual Code Q&A:** Ask natural language questions about your linked codebase and receive AI-generated answers using a Retrieval Augmented Generation (RAG) pipeline with Google Gemini and LangChain.
*   **Real-Time Communication:**
    *   Project-specific chat channels.
    *   Direct Messaging (DMs) between users.
    *   Text messaging and file attachment support.
    *   Real-time message updates powered by Supabase Realtime.
*   **Analytics & Overview:**
    *   Project dashboard displaying key metrics: commit activity, task distribution (by status, priority), contributor insights.
*   **GitHub Integration:**
    *   Fetches repository metadata, commit history, diffs, and file contents.
*   **Security:**
    *   Role-Based Access Control (RBAC).
    *   API rate limiting (Upstash Redis).
    *   Secure handling of credentials and API keys via environment variables.
    *   Input validation using Zod.

## Technology Stack

*   **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS, TanStack Query (React Query)
*   **Backend API:** Next.js (API Routes), tRPC, TypeScript
*   **Database:** Supabase PostgreSQL (with PGVector extension for AI embeddings)
*   **Real-time Services:** Supabase Realtime (WebSockets)
*   **File Storage:** Supabase Storage
*   **ORM:** Prisma
*   **Authentication:** BetterAuth (custom integration)
*   **AI Models:** Google Gemini (`gemini-2.0-flash-lite`, `gemini-1.5-flash`, `text-embedding-004`)
*   **AI Orchestration (RAG):** LangChain
*   **GitHub API Client:** Octokit.js
*   **Email Sending:** Nodemailer, React Email
*   **Rate Limiting:** Upstash Redis
*   **Deployment:** Vercel (including Cron Jobs)

## System Architecture Highlights

*   **Full-Stack Next.js:** Monorepo structure with frontend and backend co-located.
*   **End-to-End Type Safety:** TypeScript, tRPC, Prisma, Zod.
*   **Serverless Backend:** API routes deployed as serverless functions on Vercel.
*   **Backend-as-a-Service (BaaS):** Supabase for database, real-time, and storage.
*   **Modular Design:** tRPC routers organized by feature domain.

*(For a detailed architecture diagram and discussion, please refer to the full project report, Chapters 3 & 4.)*

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)
*   A [Supabase](https://supabase.com/) account and project setup.
*   A [Google Cloud Platform](https://cloud.google.com/) project with the Generative Language API (Gemini) enabled and an API Key.
*   (Optional but recommended for full functionality) An email account (e.g., Gmail) for Nodemailer to send emails via SMTP, and its App Password if using Gmail.
*   (Optional) An [Upstash](https://upstash.com/) Redis database for rate limiting.

## Getting Started

### 1. Clone the Repository
Open your terminal or command prompt and run the following command to clone the LARK repository to your local machine:
```
git clone https://github.com/Haabeel/lark.git
```
After the command completes, navigate into the cloned directory:
```
cd lark
```
### 2. Install Dependencies
Install the project dependencies using bun, npm or yarn:
```
bun install
#  or
npm install
#  or
yarn install
```
### 3. Set Up Environment Variables
Create a `.env` file in the root of your project by copying the `.env.example` file:
```
cp .env.example .env 
```
### 4. Set Up Supabase Database & Extensions
1. Ensure you have a Supabase project created at [supabase.com](https://supabase.com/).
2. In your Supabase project dashboard, navigate to **Database** (or SQL Editor).
3. Go to **Extensions** (usually under the "Database" section in the sidebar).
4. Make sure the `uuid-ossp` extension is enabled. Search for it and click "Enable extension" if it's not.
5. Search for the `vector` extension (for PGVector) and click "Enable extension".
### 5. Run Database Migrations
Apply the Prisma schema (defined in `prisma/schema.prisma`) to your Supabase database. This will create all the necessary tables and relations.
From the root of your project directory, run:
```
npx prisma migrate dev --name init # For the very first migration
```
If you are setting up an existing project with migrations already present, or for subsequent deployments:
```
npx prisma migrate deploy
```
And generate the Prisma client:
```
npx prisma generate
```
## Running the Application
### Development Mode
To run the LARK application locally in development mode with hot-reloading:
```
bun run dev
#  or
npm run dev
#  or
yarn dev
```
The application will typically be available at [http://localhost:3000](http://localhost:3000).
### Production Build
To create an optimised production build:
```
bun run build
#  or
npm run build
#  or
yarn build
```
To run the production build locally (after building):
```
bun run start
#  or
npm run start
#  or
yarn start
```
## Contributing
This project was developed as a Final Year Project by Haabeel ([@Haabeel](https://github.com/Haabeel)). While active development for new features may be limited post-submission, contributions in the form of bug reports, suggestions, or pull requests for improvements are welcome. Please feel free to open an issue or fork the repository.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
