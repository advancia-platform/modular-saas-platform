import { Request, Response, Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import PDFGenerator from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Generate invoice number (format: INV-YYYY-MM-XXXXX)
function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `INV-${year}-${month}-${random}`;
}

// POST /api/invoices - Create new invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      amount,
      currency = 'USD',
      type = 'transaction',
      items,
      billingName,
      billingEmail,
      billingAddress,
      dueDate,
      transactionId,
      notes
    } = req.body;

    // Validation
    if (!userId || !amount || !items || !billingName || !billingEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Calculate due date (default: 30 days from now)
    const dueDateObj = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        amount: new Prisma.Decimal(amount),
        currency,
        status: 'pending',
        type,
        billingName,
        billingEmail,
        billingAddress,
        dueDate: dueDateObj,
        transactionId,
        notes,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            amount: new Prisma.Decimal(item.amount || item.quantity * item.unitPrice)
          }))
        }
      },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// GET /api/invoices/:userId - Get user invoices
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.invoice.count({ where });

    res.json({
      invoices,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/invoice/:invoiceId - Get specific invoice
router.get('/invoice/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        transaction: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /api/invoices/:invoiceId/generate-pdf - Generate PDF
router.post('/:invoiceId/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Prepare PDF data
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      billingName: invoice.billingName || 'N/A',
      billingEmail: invoice.billingEmail || 'N/A',
      billingAddress: invoice.billingAddress || undefined,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount)
      })),
      subtotal: Number(invoice.amount),
      total: Number(invoice.amount),
      notes: invoice.notes || undefined
    };

    // Generate PDF
    const invoicesDir = path.join(process.cwd(), 'invoices');
    const filename = `${invoice.invoiceNumber}.pdf`;
    const outputPath = path.join(invoicesDir, filename);

    const pdfGenerator = new PDFGenerator();
    await pdfGenerator.generateInvoice(pdfData, outputPath);

    // Update invoice with PDF URL
    const pdfUrl = `/invoices/${filename}`;
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdfUrl,
        pdfGenerated: true
      }
    });

    res.json({
      success: true,
      pdfUrl,
      message: 'PDF generated successfully'
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// GET /api/invoices/:invoiceId/download - Download PDF
router.get('/:invoiceId/download', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!invoice.pdfGenerated || !invoice.pdfUrl) {
      return res.status(400).json({ error: 'PDF not generated yet. Please generate it first.' });
    }

    const invoicesDir = path.join(process.cwd(), 'invoices');
    const filename = path.basename(invoice.pdfUrl);
    const filePath = path.join(invoicesDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// PUT /api/invoices/:invoiceId/status - Update invoice status
router.put('/:invoiceId/status', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = { status };
    if (status === 'paid') {
      updateData.paidDate = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        items: true
      }
    });

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// GET /api/invoices/stats/summary - Get invoice statistics (admin)
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const totalInvoices = await prisma.invoice.count();
    const paidInvoices = await prisma.invoice.count({ where: { status: 'paid' } });
    const pendingInvoices = await prisma.invoice.count({ where: { status: 'pending' } });
    
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true }
    });

    const pendingRevenue = await prisma.invoice.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true }
    });

    res.json({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingRevenue: pendingRevenue._sum.amount || 0
    });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
