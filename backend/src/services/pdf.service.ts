import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';

export class PDFService {
  async generateCalculationPDF(calculation: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('SaaS Pricing Calculator Report', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        
        doc.moveDown(2);

        // Calculation Name
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text(calculation.name);
        
        doc.moveDown();

        // Input Parameters
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Input Parameters');
        
        doc.fontSize(12)
           .font('Helvetica');
        
        const inputs = calculation.inputs;
        doc.text(`Current Price: $${inputs.currentPrice}`);
        doc.text(`Number of Customers: ${inputs.customers}`);
        doc.text(`Monthly Churn Rate: ${inputs.churnRate}%`);
        
        if (inputs.competitorPrice) {
          doc.text(`Competitor Price: $${inputs.competitorPrice}`);
        }
        if (inputs.cac) {
          doc.text(`Customer Acquisition Cost: $${inputs.cac}`);
        }
        
        doc.moveDown();

        // Pricing Tiers
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Recommended Pricing Tiers');
        
        doc.fontSize(12)
           .font('Helvetica');
        
        const results = calculation.results;
        if (results.tiers) {
          results.tiers.forEach((tier: any) => {
            doc.moveDown();
            doc.font('Helvetica-Bold')
               .text(`${tier.name}: $${tier.price}/month`);
            doc.font('Helvetica')
               .text(`Target: ${tier.targetCustomers}`);
            doc.text(`Projected Revenue: $${tier.projectedRevenue}`);
            doc.text(`Confidence: ${tier.confidence}%`);
            
            if (tier.features && tier.features.length > 0) {
              doc.text('Features:');
              tier.features.forEach((feature: string) => {
                doc.text(`  • ${feature}`);
              });
            }
          });
        }
        
        doc.moveDown();

        // Metrics
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Key Metrics');
        
        doc.fontSize(12)
           .font('Helvetica');
        
        if (results.metrics) {
          doc.text(`Monthly Recurring Revenue (MRR): $${results.metrics.mrr}`);
          doc.text(`Annual Recurring Revenue (ARR): $${results.metrics.arr}`);
          doc.text(`Customer Lifetime Value (LTV): $${results.metrics.ltv}`);
          doc.text(`Customer Acquisition Cost (CAC): $${results.metrics.cac}`);
          doc.text(`LTV:CAC Ratio: ${results.metrics.ltvcac}`);
          doc.text(`Payback Period: ${results.metrics.paybackPeriod} months`);
        }
        
        doc.moveDown();

        // Insights
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Insights & Recommendations');
        
        doc.fontSize(12)
           .font('Helvetica');
        
        if (results.insights) {
          doc.text(`Price Position: ${results.insights.pricePosition}`);
          doc.text(`Optimization Potential: ${results.insights.optimizationPotential}%`);
          doc.text(`Risk Level: ${results.insights.riskLevel}`);
          
          if (results.insights.recommendations && results.insights.recommendations.length > 0) {
            doc.moveDown();
            doc.text('Recommendations:');
            results.insights.recommendations.forEach((rec: string) => {
              doc.text(`  • ${rec}`);
            });
          }
        }
        
        doc.moveDown();

        // Revenue Projections
        if (results.projectedRevenue) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text('Revenue Projections');
          
          doc.fontSize(12)
             .font('Helvetica');
          
          doc.text(`Monthly Revenue: $${results.projectedRevenue.monthly}`);
          doc.text(`Annual Revenue: $${results.projectedRevenue.annual}`);
          doc.text(`Growth Rate: ${results.projectedRevenue.growth}%`);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text('© 2025 SaaS Pricing Calculator - predictionnexus.com', { align: 'center' });

        doc.end();
      } catch (error) {
        logger.error('PDF generation error:', error);
        reject(error);
      }
    });
  }

  generateCSV(calculation: any): string {
    const lines: string[] = [];
    
    // Headers
    lines.push('Calculation Report');
    lines.push(`Name,${calculation.name}`);
    lines.push(`Date,${new Date().toLocaleDateString()}`);
    lines.push('');
    
    // Input Parameters
    lines.push('Input Parameters');
    const inputs = calculation.inputs;
    lines.push(`Current Price,$${inputs.currentPrice}`);
    lines.push(`Customers,${inputs.customers}`);
    lines.push(`Churn Rate,${inputs.churnRate}%`);
    
    if (inputs.competitorPrice) {
      lines.push(`Competitor Price,$${inputs.competitorPrice}`);
    }
    if (inputs.cac) {
      lines.push(`CAC,$${inputs.cac}`);
    }
    
    lines.push('');
    
    // Pricing Tiers
    lines.push('Pricing Tiers');
    lines.push('Tier,Price,Target,Revenue,Confidence');
    
    if (calculation.results.tiers) {
      calculation.results.tiers.forEach((tier: any) => {
        lines.push(`${tier.name},$${tier.price},${tier.targetCustomers},$${tier.projectedRevenue},${tier.confidence}%`);
      });
    }
    
    lines.push('');
    
    // Metrics
    lines.push('Key Metrics');
    const metrics = calculation.results.metrics;
    if (metrics) {
      lines.push(`MRR,$${metrics.mrr}`);
      lines.push(`ARR,$${metrics.arr}`);
      lines.push(`LTV,$${metrics.ltv}`);
      lines.push(`CAC,$${metrics.cac}`);
      lines.push(`LTV:CAC,${metrics.ltvcac}`);
      lines.push(`Payback Period,${metrics.paybackPeriod} months`);
    }
    
    return lines.join('\n');
  }
}