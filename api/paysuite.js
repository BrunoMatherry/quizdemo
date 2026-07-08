// QuizMoz — PaySuite Payment Proxy (Vercel Serverless Function)
// Proxies payment requests to the PlayBLM backend API
// which handles the PaySuite integration securely

const BACKEND_API = 'https://www.playblm.com/api';

export default async function handler(req, res) {
    // CORS headers for mobile app
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // POST /api/paysuite — Create payment
        if (req.method === 'POST') {
            const { amount, reference, description } = req.body;

            if (!amount || !reference) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }

            const payResponse = await fetch(`${BACKEND_API}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    amount,
                    reference,
                    description: description || 'QuizMoz - Compra de Moedas',
                    return_url: 'https://paysuite.tech/success',
                    callback_url: 'https://paysuite.tech/callback'
                })
            });

            const data = await payResponse.json();
            return res.status(payResponse.ok ? 200 : 400).json(data);
        }

        // GET /api/paysuite?id=xxx — Check payment status
        if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ success: false, error: 'Missing payment ID' });
            }

            const statusResponse = await fetch(`${BACKEND_API}/payment-status?id=${id}`, {
                headers: { 'Accept': 'application/json' }
            });

            const data = await statusResponse.json();
            return res.status(statusResponse.ok ? 200 : 400).json(data);
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Payment API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor. Tente novamente.'
        });
    }
}
