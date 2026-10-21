# MediCare Web — AI-Assisted Hospital Appointment System

A responsive hospital appointment website with a liquid-glass visual theme, sample doctor profiles, browser-local demo booking/cancellation, and a Gemini-powered Ask AI assistant. Doctor profiles and time slots are demonstration data, not real hospital availability.

## Project structure

- `index.html`, `style.css`, `script.js` — frontend
- `backend/index.js` — Express API and Gemini chat endpoint
- `backend/package.json` / `backend/package-lock.json` — backend dependencies
- `.gitignore` — excludes secrets and local dependencies

## Run locally

1. Install Node.js 18 or later.
2. In Terminal, open the `backend` folder and run `npm install`.
3. Create `backend/.env` (this file must never be uploaded to GitHub) with:

   ```env
   GEMINI_API_KEY=put_your_private_key_here
   GEMINI_MODEL=gemma-4-31b-it
   ```

4. Start the API from `backend` with `npm start`. The health endpoint is `http://localhost:3000/health`.
5. Open `index.html` in a browser for the frontend. Local chat requests use `http://localhost:3000`.

## Deploy

### Backend on Render

- Create a Web Service from this repository.
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables in Render settings: `GEMINI_API_KEY` and `GEMINI_MODEL` (`gemma-4-31b-it`). Never place API keys in frontend files or GitHub.

### Frontend on GitHub Pages

Enable GitHub Pages for the repository's `main` branch and `/ (root)`. Once the Render service is live, edit `script.js` and replace `https://REPLACE-WITH-RENDER-URL.onrender.com` in `API_BASE_URL` with the actual Render service URL. Commit the change and test the deployed chatbot.

## Safety and limitations

- The AI assistant does not diagnose or prescribe and must not invent appointment availability, fees, phone numbers, or working hours.
- Booking records are stored in the current browser using local storage; they are not saved to a hospital database and are not shared across devices.
- Do not enter real patient information into this educational prototype.
- For emergencies, contact local emergency services.
