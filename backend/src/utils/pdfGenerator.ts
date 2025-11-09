import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  billingName: string;
  billingEmail: string;
  billingAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
}

export class PDFGenerator {
  private doc: PDFKit.PDFDocument;

  constructor() {
    this.doc = new PDFDocument({ margin: 50 });
  }

  async generateInvoice(data: InvoiceData, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure invoices directory exists
        const invoicesDir = path.dirname(outputPath);
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        // Header
        this.addHeader();
        
        // Invoice details
        this.addInvoiceDetails(data);
        
        // Billing information
        this.addBillingInfo(data);
        
        // Line items table
        this.addItemsTable(data.items);
        
        // Totals
        this.addTotals(data);
        
        // Notes
        if (data.notes) {
          this.addNotes(data.notes);
        }
        
        // Footer
        this.addFooter();

        this.doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader() {
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ADVANCIA PAY LEDGER', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .text('Self-Hosted Financial Platform', 50, 75)
      .text('contact@advancia.com', 50, 90)
      .moveDown();
  }

  private addInvoiceDetails(data: InvoiceData) {
    const topY = 50;
    
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, topY, { align: 'right' })
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice #: ${data.invoiceNumber}`, 400, topY + 25, { align: 'right' })
      .text(`Issue Date: ${this.formatDate(data.issueDate)}`, 400, topY + 40, { align: 'right' })
      .text(`Due Date: ${this.formatDate(data.dueDate)}`, 400, topY + 55, { align: 'right' })
      .moveDown(2);
  }

  private addBillingInfo(data: InvoiceData) {
    const startY = 150;
    
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BILL TO:', 50, startY)
      .fontSize(10)
      .font('Helvetica')
      .text(data.billingName, 50, startY + 20)
      .text(data.billingEmail, 50, startY + 35);
    
    if (data.billingAddress) {
      this.doc.text(data.billingAddress, 50, startY + 50, { width: 250 });
    }
    
    this.doc.moveDown(3);
  }

  private addItemsTable(items: InvoiceData['items']) {
    const tableTop = 260;
    const tableLeft = 50;
    
    // Table headers
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', tableLeft, tableTop)
      .text('Qty', tableLeft + 300, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', tableLeft + 360, tableTop, { width: 80, align: 'right' })
      .text('Amount', tableLeft + 450, tableTop, { width: 80, align: 'right' });

    // Line under headers
    this.doc
      .moveTo(tableLeft, tableTop + 15)
      .lineTo(540, tableTop + 15)
      .stroke();

    // Table rows
    let currentY = tableTop + 25;
    this.doc.font('Helvetica');

    items.forEach((item) => {
      this.doc
        .text(item.description, tableLeft, currentY, { width: 290 })
        .text(item.quantity.toString(), tableLeft + 300, currentY, { width: 50, align: 'right' })
        .text(`$${item.unitPrice.toFixed(2)}`, tableLeft + 360, currentY, { width: 80, align: 'right' })
        .text(`$${item.amount.toFixed(2)}`, tableLeft + 450, currentY, { width: 80, align: 'right' });
      
      currentY += 25;
    });

    // Line after items
    this.doc
      .moveTo(tableLeft, currentY + 5)
      .lineTo(540, currentY + 5)
      .stroke();
  }

  private addTotals(data: InvoiceData) {
    const totalsX = 380;
    let currentY = 450;

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', totalsX, currentY)
      .text(`$${data.subtotal.toFixed(2)}`, totalsX + 100, currentY, { align: 'right' });

    if (data.tax && data.tax > 0) {
      currentY += 20;
      this.doc
        .text('Tax:', totalsX, currentY)
        .text(`$${data.tax.toFixed(2)}`, totalsX + 100, currentY, { align: 'right' });
    }

    currentY += 25;
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TOTAL:', totalsX, currentY)
      .text(`$${data.total.toFixed(2)}`, totalsX + 100, currentY, { align: 'right' });
  }

  private addNotes(notes: string) {
    this.doc
      .moveDown(3)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Notes:', 50)
      .font('Helvetica')
      .text(notes, 50, undefined, { width: 500 });
  }

  private addFooter() {
    const bottomY = 720;
    
    this.doc
      .fontSize(8)
      .font('Helvetica')
      .text('Thank you for your business!', 50, bottomY, { align: 'center' })
      .text('For questions, contact: support@advancia.com', 50, bottomY + 15, { align: 'center' });
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
}

export default PDFGenerator;
