// QuizMoz — NetShop Payment Proxy (Vercel Serverless Function)
// Proxies payment requests to the NetShop API securely

const NETSHOP_API_KEY = process.env.NETSHOP_API_KEY || 'ns_live_sk_jKdNm3gJ_u4Ek8BSLpAT635Lemuy29iFyeFfFqUTrdexWCzzz';
const NETSHOP_WALLET_ID = process.env.NETSHOP_WALLET_ID || process.env.ID_DA_CARTEIRA_NETSHOP || '544812';

export default async function handler(req, res) {
    if (!NETSHOP_API_KEY || !NETSHOP_WALLET_ID) {
        console.error('NetShop credentials are missing in environment variables.');
        return res.status(500).json({ success: false, error: 'Credenciais da NetShop não configuradas no servidor.' });
    }
    // CORS headers for mobile app
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Wallet-ID, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // POST /api/netshop — Create payment charge
        if (req.method === 'POST') {
            const { amount, reference, description, phone, method } = req.body;

            if (!amount || !reference || !phone || !method) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }

            // NetShop expects amount directly in Meticais (MZN)
            const amountInMZN = Math.round(Number(amount));

            // Clean phone number: remove non-digits
            const cleanPhone = phone.replace(/\D/g, '');

            const netshopResponse = await fetch('https://www.netshop.co.mz/api/v1/charges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${NETSHOP_API_KEY}`,
                    'X-Wallet-ID': NETSHOP_WALLET_ID,
                    'Idempotency-Key': `idemp_${reference}`
                },
                body: JSON.stringify({
                    amount: amountInMZN,
                    currency: 'MZN',
                    method: method === 'emola' ? 'emola' : 'mpesa',
                    msisdn: '+258' + cleanPhone,
                    reference: reference,
                    description: description || 'QuizMoz - Compra de Moedas'
                })
            });

            const data = await netshopResponse.json();
            if (!netshopResponse.ok) {
                console.error('NetShop Charge Error:', data);
                let errText = 'Erro ao processar o pagamento com a NetShop.';
                if (data) {
                    errText = data.failed_reason || 
                              data.message || 
                              data.error_message ||
                              (data.error && typeof data.error === 'object' ? data.error.message : data.error) ||
                              (data.provider && data.provider.responseDesc) ||
                              (typeof data === 'object' ? JSON.stringify(data) : String(data));
                }
                return res.status(netshopResponse.status).json({ success: false, error: errText });
            }

            // Return standardized structure for QuizMoz frontend
            return res.status(200).json({
                success: true,
                data: {
                    id: data.id,
                    status: data.status,
                    checkout_url: data.checkout?.hosted_url || data.hosted_url || data.url
                }
            });
        }

        // GET /api/netshop?id=xxx — Check payment status
        if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ success: false, error: 'Missing payment ID' });
            }

            const netshopResponse = await fetch(`https://www.netshop.co.mz/api/v1/charges/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${NETSHOP_API_KEY}`,
                    'X-Wallet-ID': NETSHOP_WALLET_ID
                }
            });

            const data = await netshopResponse.json();
            if (!netshopResponse.ok) {
                console.error('NetShop Query Error:', data);
                let errText = 'Erro ao consultar o estado do pagamento.';
                if (data) {
                    errText = data.failed_reason || 
                              data.message || 
                              data.error_message ||
                              (data.error && typeof data.error === 'object' ? data.error.message : data.error) ||
                              (data.provider && data.provider.responseDesc) ||
                              (typeof data === 'object' ? JSON.stringify(data) : String(data));
                }
                return res.status(netshopResponse.status).json({ success: false, error: errText });
            }

            return res.status(200).json({
                success: true,
                data: {
                    status: data.status // will be "pending", "paid", "failed", etc.
                }
            });
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
