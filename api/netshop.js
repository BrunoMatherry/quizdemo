// QuizMoz — Unified Hybrid Payment Proxy (Vercel Serverless Function)
// Proxies payment requests to DebitoPay (for direct M-Pesa/e-Mola STK push and Hosted Checkouts) securely.
// Maintains backward compatibility with NetShop and ZumboPay transactions.

const DEBITOPAY_API_KEY = process.env.DEBITOPAY_API_KEY || Buffer.from('c2tfbGl2ZV9YSGVmMFpwSWt1UlJnUURRUEZ4RkpWRHd3dU0yVHNRSQ==', 'base64').toString('utf8');
const DEBITOPAY_WALLET_CODE = process.env.DEBITOPAY_WALLET_CODE || '23077';
const DEBITOPAY_BASE_URL = 'https://gyqoaningqhurhvdugne.supabase.co/functions/v1';

// Legacy keys for backward compatibility
const NETSHOP_API_KEY = process.env.NETSHOP_API_KEY || 'ns_live_sk_jKdNm3gJ_u4Ek8BSLpAT635Lemuy29iFyeFfFqUTrdexWCzzz';
const NETSHOP_WALLET_ID = process.env.NETSHOP_WALLET_ID || process.env.ID_DA_CARTEIRA_NETSHOP || '554299';
export default async function handler(req, res) {
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

            if (!amount || !reference || !method) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }

            const paymentMethod = method.toLowerCase();
            const amountInMZN = Math.round(Number(amount));

            // 1. e-Mola Link Fallback (DebitoPay static payment links mapped by price)
            if (paymentMethod === 'emola_link') {
                console.log(`Routing to DebitoPay static link for amount: ${amountInMZN} MT`);
                
                let checkoutUrl = 'https://debitopay.com/l/quizmoz-rvge'; // Default (50 MT)
                
                if (amountInMZN === 10) {
                    checkoutUrl = 'https://debitopay.com/l/quizmoz-moedas-r6nw';
                } else if (amountInMZN === 15) {
                    checkoutUrl = 'https://debitopay.com/l/quizmoz-moedas-y9y9';
                } else if (amountInMZN === 30) {
                    checkoutUrl = 'https://debitopay.com/l/quizmozmoedas-hms5';
                } else if (amountInMZN === 50) {
                    checkoutUrl = 'https://debitopay.com/l/quizmoz-rvge';
                } else if (amountInMZN === 120) {
                    checkoutUrl = 'https://debitopay.com/l/quizmoz-moedas-3jul';
                } else if (amountInMZN === 150) {
                    checkoutUrl = 'https://debitopay.com/l/quizmoz-premium-op29';
                }
                
                return res.status(200).json({
                    success: true,
                    data: {
                        id: 'debitopay_link',
                        status: 'pending',
                        checkout_url: checkoutUrl
                    }
                });
            } 
            
            // 2. Direct Mobile Money Charge (M-Pesa or e-Mola STK push)
            else {
                if (!phone) {
                    return res.status(400).json({ success: false, error: 'Número de telefone obrigatório.' });
                }

                const cleanPhone = phone.replace(/\D/g, '');
                // Format phone as +258XXXXXXXXX
                const formattedPhone = cleanPhone.startsWith('258') ? '+' + cleanPhone : '+258' + cleanPhone;

                console.log(`Processing direct DebitoPay charge for method: ${paymentMethod}, phone: ${formattedPhone}`);

                const dbResponse = await fetch(`${DEBITOPAY_BASE_URL}/payment-orchestrator`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DEBITOPAY_API_KEY}`
                    },
                    body: JSON.stringify({
                        action: 'process',
                        payment_method: paymentMethod === 'emola' ? 'emola' : 'mpesa',
                        wallet_code: DEBITOPAY_WALLET_CODE,
                        amount: amountInMZN,
                        currency: 'MZN',
                        phone: formattedPhone,
                        reference: reference,
                        description: description || 'QuizMoz - Compra de Moedas'
                    })
                });

                const data = await dbResponse.json();
                if (!dbResponse.ok) {
                    console.error('DebitoPay Direct Charge Error:', data);
                    return res.status(dbResponse.status).json({ success: false, error: data.error || 'Erro ao criar cobrança direta.' });
                }

                return res.status(200).json({
                    success: true,
                    data: {
                        id: data.payment_id,
                        status: data.status === 'success' ? 'paid' : 'pending',
                        checkout_url: data.checkout_url || null
                    }
                });
            }
        }

        // GET /api/netshop?id=xxx — Check payment status
        if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ success: false, error: 'Missing payment ID' });
            }

            console.log('Querying status for ID:', id);

            // 1. DebitoPay (Standard UUID formats)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(id)) {
                console.log('UUID detected, routing to DebitoPay check-status...');
                const dbResponse = await fetch(`${DEBITOPAY_BASE_URL}/payment-orchestrator`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DEBITOPAY_API_KEY}`
                    },
                    body: JSON.stringify({
                        action: 'check-status',
                        payment_id: id
                    })
                });

                if (!dbResponse.ok) {
                    const errData = await dbResponse.json().catch(() => ({}));
                    console.error('DebitoPay status query error:', errData);
                    return res.status(dbResponse.status).json({ success: false, error: errData.error || 'Erro ao consultar o estado do pagamento na DebitoPay.' });
                }

                const data = await dbResponse.json();
                const status = data.payment?.status;
                let finalStatus = 'pending';

                if (['success', 'paid', 'completed'].includes((status || '').toLowerCase())) {
                    finalStatus = 'paid';
                } else if (['failed', 'cancelled', 'expired'].includes((status || '').toLowerCase())) {
                    finalStatus = 'failed';
                }

                console.log('DebitoPay Status Determined:', finalStatus);
                return res.status(200).json({
                    success: true,
                    data: {
                        status: finalStatus
                    }
                });
            }

            // 2. DebitoPay Static Link Handler
            if (id === 'debitopay_link') {
                return res.status(200).json({
                    success: true,
                    data: {
                        status: 'pending'
                    }
                });
            }

            // 3. Legacy NetShop (Numeric or other formats)
            console.log('Routing to legacy NetShop API...');
            if (!NETSHOP_API_KEY || !NETSHOP_WALLET_ID) {
                return res.status(500).json({ success: false, error: 'NetShop credentials missing.' });
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
                let errText = 'Erro ao consultar o estado do pagamento na NetShop.';
                if (data) {
                    errText = data.failed_reason || 
                              data.message || 
                              data.error_message ||
                              (data.error && typeof data.error === 'object' ? data.error.message : data.error) ||
                              (typeof data === 'object' ? JSON.stringify(data) : String(data));
                }
                return res.status(netshopResponse.status).json({ success: false, error: errText });
            }

            return res.status(200).json({
                success: true,
                data: {
                    status: data.status // "pending", "paid", "failed", etc.
                }
            });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Payment API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno no proxy: ' + error.message
        });
    }
}
