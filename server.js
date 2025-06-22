const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: true }));
app.use(express.static('public')); // Place your HTML in /public

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID; // Your Discord server ID

app.get('/login', (req, res) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    scope: "identify"
  });
  const oauth = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).then(r => r.json());
  const user = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${oauth.access_token}` },
  }).then(r => r.json());
  req.session.user = user;
  res.redirect("/"); // Redirect to your main page
});

app.get('/api/roles', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  const userId = req.session.user.id;
  const member = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
    headers: { Authorization: `Bot ${BOT_TOKEN}` }
  }).then(r => r.json());
  res.json({ roles: member.roles || [] });
});

app.listen(3000, () => console.log("http://localhost:3000"));
