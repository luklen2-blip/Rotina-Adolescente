import { Router } from 'express';

const router = Router();

const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/8hGuEYs';

// GET /api/checkout - Retorna a URL oficial de pagamento Kiwify
router.get('/', (req, res) => {
  res.json({
    success: true,
    provider: 'Kiwify',
    checkoutUrl: KIWIFY_CHECKOUT_URL,
    product: 'Ritmo Autonomia — Acesso Vitalício',
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

// POST /api/checkout/validate-code - Validação de chaves de ativação
router.post('/validate-code', (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Código não fornecido.' });
  }

  const cleanCode = code.trim().toUpperCase();

  // Códigos para ativação do teste de 1 hora exclusivo de Luciano
  const codes1h = ['TESTE1H', 'LUCIANO1H', '1HORA', 'TESTE60', 'TESTE-1H', '1H'];
  if (codes1h.includes(cleanCode)) {
    return res.json({
      success: true,
      message: 'Modo de Teste Exclusivo (1 hora) ativado para Luciano!',
      tier: 'trial_1h',
      durationMinutes: 60
    });
  }

  const validMasterKeys = ['RITMO2026', 'MIGUEL1990', 'AUTONOMIA', 'VIP2026', 'LUCIANO', 'ADM2026'];
  const isValid = validMasterKeys.includes(cleanCode) || cleanCode.startsWith('RTM-') || cleanCode.startsWith('KIW-');



  if (isValid) {
    return res.json({
      success: true,
      message: 'Chave de acesso válida! Acesso vitalício desbloqueado.',
      tier: 'lifetime'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Chave de acesso não encontrada ou inválida.'
  });
});

export default router;

