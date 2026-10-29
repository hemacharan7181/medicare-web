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
3. Copy `backend/.env.example` to `backend/.env`, then add your Gemini API key (this file must never be uploaded to GitHub):

   ```env
   GEMINI_API_KEY=put_your_private_key_here
   # Optional: use a Gemini model enabled for your key.
   # GEMINI_MODEL=gemini-3.8-flash
   ```

4. Start the API from `backend` with `npm start`. The health endpoint is `http://localhost:3000/health`.
5. Open `index.html` in a browser for the frontend. Local chat requests use `http://localhost:3000`.

## Deploy

### Backend on Render

- Create a Web Service from this repository.
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Add `GEMINI_API_KEY` in Render's Environment settings. `GEMINI_MODEL` is optional; set it only if you need a specific Gemini model enabled for your key. Never place API keys in frontend files or GitHub.

### Frontend on GitHub Pages

Enable GitHub Pages for the repository's `main` branch and `/ (root)`. Once the Render service is live, edit `script.js` and replace `https://REPLACE-WITH-RENDER-URL.onrender.com` in `API_BASE_URL` with the actual Render service URL. Commit the change and test the deployed chatbot.

## Safety and limitations

- The AI assistant does not diagnose or prescribe and must not invent appointment availability, fees, phone numbers, or working hours.
- Booking records are stored in the current browser using local storage; they are not saved to a hospital database and are not shared across devices.
- Do not enter real patient information into this educational prototype.
- For emergencies, contact local emergency services.
