// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // veya basitçe res.send("Ana sayfa")
  });

// SOKAK ADI
app.get('/proxy/streets', async (req, res) => {
    try {
        const { text } = req.query;
        const url = `https://www.insert-it.de/BmsAbfallkalenderMannheim/Main/GetStreets?text=${text}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Straßen-Fehler", details: error.message });
    }
});

// BİNA
app.get('/proxy/housenumbers', async (req, res) => {
    try {
        const { streetId } = req.query;
        const url = `https://www.insert-it.de/BmsAbfallkalenderMannheim/Main/GetLocations?streetId=${streetId}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Hausnummer-Fehler", details: error.message });
    }
});

// TAKVİM HTML'İNİ AL (PNG dosyalarını dönüştürmeden, aynen döndür)
app.post('/proxy/post', async (req, res) => {
    try {
        const { bmsLocationId, year } = req.body;
        const targetUrl = `https://www.insert-it.de/BmsAbfallkalenderMannheim/Main/LoadCalenderView`;

        const response = await axios.post(
            targetUrl,
            `bmsLocationId=${bmsLocationId}&year=${year}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        // Gelen HTML aynen dönüyor (PNG → Emoji dönüşümü istemci tarafında)
        res.send(response.data);

    } catch (error) {
        res.status(500).json({ error: "POST Proxy Hatası", details: error.message });
    }
});

// E-POSTA GÖNDER
app.post('/proxy/sendMail', async (req, res) => {
    try {
        const { email, htmlContent } = req.body;

        // nodemailer - kendi gmail bilgilerin
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: '@gmail.com',
                pass: 'bla'
            }
        });

        const mailOptions = {
            from: '"Abfallkalender von MERT :)" <mert.inal@gmail.com>',
            to: email,
            subject: 'Abfallkalender von MERT :)',
            html: htmlContent // istemcide PNG->Emoji'ye dönüştürülmüş HTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Mail gönderildi:', info.messageId);
        res.json({ success: true, message: 'Email başarıyla gönderildi' });
    } catch (err) {
        console.error("Mail gönderme hatası:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => console.log("🚀 Proxy Server Çalışıyor: http://localhost:3000"));
