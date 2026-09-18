import { Router } from 'express';

const router = Router();

const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/9fQEqnA';

// GET /api/checkout - Retorna a URL oficial de pagamento Kiwify
router.get('/', (req, res) => {
  res.json({
    success: true,
    provider: 'Kiwify',
    checkoutUrl: KIWIFY_CHECKOUT_URL,
    product: 'Soundworld-kids / Rotina do Jovem',
    vendor: "Luciano da Silva Sant'Anna",
    price: 19.90,
    currency: 'BRL',
    paymentMethods: ['Cartão de Crédito', 'PIX'],
    message: 'Pagamento 100% seguro processado pela Kiwify.'
  });
});

// GET /api/checkout/redirect - Redirecionamento direto para o checkout
router.get('/redirect', (req, res) => {
  res.redirect(KIWIFY_CHECKOUT_URL);
});

export default router;
