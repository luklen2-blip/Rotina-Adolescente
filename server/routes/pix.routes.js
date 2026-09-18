import { Router } from 'express';

const router = Router();

export function generatePixPayload({ pixKey, name, city, amount, txId = '***' }) {
  const formatField = (id, value) => {
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo = [
    formatField('00', 'br.gov.bcb.pix'),
    formatField('01', pixKey)
  ].join('');

  const additionalDataField = formatField('05', txId);

  let payload = [
    formatField('00', '01'), // Payload Format Indicator
    formatField('26', merchantAccountInfo), // Merchant Account Info
    formatField('52', '0000'), // Merchant Category Code
    formatField('53', '986'), // Currency BRL
    amount ? formatField('54', Number(amount).toFixed(2)) : '', // Transaction Amount
    formatField('58', 'BR'), // Country Code
    formatField('59', (name || 'RITMO APP').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25)),
    formatField('60', (city || 'SAO PAULO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15)),
    formatField('62', additionalDataField),
    '6304' // CRC16 Indicator
  ].join('');

  // Cálculo CRC-16 / CCITT-FALSE
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');

  return payload + crcHex;
}

// POST /api/pix/create - Gera PIX oficial para Plano Familiar de Apoio
router.post('/create', (req, res) => {
  const { planType, amount, donorName } = req.body;

  const validPlans = {
    apoio_mensal: { amount: 14.90, desc: 'Apoio Mensal ao Ritmo' },
    plano_familiar: { amount: 29.90, desc: 'Plano Familiar Anual' },
    doacao_livre: { amount: Number(amount) || 10.00, desc: 'Contribuição Autônoma' }
  };

  const selected = validPlans[planType] || validPlans.plano_familiar;
  const finalAmount = selected.amount;

  const pixKey = process.env.PIX_CHAVE || 'contato@ritmoapp.com.br';
  const merchantName = 'RITMO AUTONOMIA';
  const merchantCity = 'SAO PAULO';
  const txId = `RTM${Date.now().toString(36).toUpperCase().slice(-5)}`;

  const emvPayload = generatePixPayload({
    pixKey,
    name: merchantName,
    city: merchantCity,
    amount: finalAmount,
    txId
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(emvPayload)}`;

  res.json({
    success: true,
    data: {
      plan: selected.desc,
      amount: finalAmount,
      currency: 'BRL',
      txId,
      copiaECola: emvPayload,
      qrCodeUrl,
      notice: 'Aviso Legal: Transação restrita a maiores de 18 anos ou assistidos por responsáveis legais.'
    }
  });
});

export default router;
