import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { prisma } from '../server';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { cacheService } from './cache.service';
import { analyticsService } from './analytics.service';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeAIInsights?: boolean;
  includeBenchmarks?: boolean;
  includeCharts?: boolean;
  template?: 'standard' | 'professional' | 'executive';
  branding?: {
    companyName?: string;
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export interface ExportData {
  calculation: any;
  results: any;
  aiInsights?: any[];
  benchmarks?: any;
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    version: string;
  };
}

class ExportService {
  private readonly CACHE_TTL = 3600; // 1 hour
  
  constructor() {
    logger.info('Export service initialized');
  }

  /**
   * Export calculation as PDF
   */
  async exportToPDF(calculationId: string, userId: string, options: ExportOptions): Promise<Buffer> {
    try {
      const exportData = await this.getExportData(calculationId, userId, options);
      const cacheKey = `export:pdf:${calculationId}:${this.hashOptions(options)}`;

      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached && Buffer.isBuffer(cached)) {
        return cached;
      }

      const pdfBuffer = await this.generatePDF(exportData, options);
      
      // Cache the result
      await cacheService.set(cacheKey, pdfBuffer, { ttl: this.CACHE_TTL, namespace: 'export' });
      
      // Track export activity
      await analyticsService.trackUserActivity(userId, 'export', {
        format: 'pdf',
        calculationId,
        includeAI: options.includeAIInsights,
        template: options.template
      });

      return pdfBuffer;

    } catch (error) {
      logger.error('PDF export failed:', error);
      throw new AppError('Failed to export PDF', 'EXPORT_ERROR', 500);
    }
  }

  /**
   * Export calculation as Excel
   */
  async exportToExcel(calculationId: string, userId: string, options: ExportOptions): Promise<Buffer> {
    try {
      const exportData = await this.getExportData(calculationId, userId, options);
      const cacheKey = `export:excel:${calculationId}:${this.hashOptions(options)}`;

      // Check cache first  
      const cached = await cacheService.get(cacheKey);
      if (cached && Buffer.isBuffer(cached)) {
        return cached;
      }

      const excelBuffer = await this.generateExcel(exportData, options);
      
      // Cache the result
      await cacheService.set(cacheKey, excelBuffer, { ttl: this.CACHE_TTL, namespace: 'export' });
      
      // Track export activity
      await analyticsService.trackUserActivity(userId, 'export', {
        format: 'excel',
        calculationId,
        includeAI: options.includeAIInsights,
        includeCharts: options.includeCharts
      });

      return excelBuffer;

    } catch (error) {
      logger.error('Excel export failed:', error);
      throw new AppError('Failed to export Excel', 'EXPORT_ERROR', 500);
    }
  }

  /**
   * Export calculation as CSV
   */
  async exportToCSV(calculationId: string, userId: string, options: ExportOptions): Promise<string> {
    try {
      const exportData = await this.getExportData(calculationId, userId, options);
      const csvData = await this.generateCSV(exportData, options);
      
      // Track export activity
      await analyticsService.trackUserActivity(userId, 'export', {
        format: 'csv',
        calculationId,
        includeAI: options.includeAIInsights
      });

      return csvData;

    } catch (error) {
      logger.error('CSV export failed:', error);
      throw new AppError('Failed to export CSV', 'EXPORT_ERROR', 500);
    }
  }

  /**
   * Export calculation as JSON
   */
  async exportToJSON(calculationId: string, userId: string, options: ExportOptions): Promise<object> {
    try {
      const exportData = await this.getExportData(calculationId, userId, options);
      
      // Track export activity
      await analyticsService.trackUserActivity(userId, 'export', {
        format: 'json',
        calculationId,
        includeAI: options.includeAIInsights
      });

      return exportData;

    } catch (error) {
      logger.error('JSON export failed:', error);
      throw new AppError('Failed to export JSON', 'EXPORT_ERROR', 500);
    }
  }

  /**
   * Batch export multiple calculations
   */
  async batchExport(
    calculationIds: string[],
    userId: string,
    format: 'pdf' | 'excel' | 'zip',
    options: ExportOptions
  ): Promise<Buffer> {
    try {
      const exports: Buffer[] = [];
      
      for (const calculationId of calculationIds) {
        let buffer: Buffer;
        
        if (format === 'pdf') {
          buffer = await this.exportToPDF(calculationId, userId, options);
        } else if (format === 'excel') {
          buffer = await this.exportToExcel(calculationId, userId, options);
        } else {
          throw new AppError('Unsupported batch export format', 'INVALID_FORMAT', 400);
        }
        
        exports.push(buffer);
      }

      // If multiple files, create ZIP archive
      if (exports.length > 1) {
        const zipBuffer = await this.createZipArchive(exports, calculationIds, format);
        
        // Track batch export
        await analyticsService.trackUserActivity(userId, 'batch_export', {
          format,
          count: calculationIds.length,
          calculationIds: calculationIds.slice(0, 10) // Limit logged IDs
        });
        
        return zipBuffer;
      }
      
      return exports[0];

    } catch (error) {
      logger.error('Batch export failed:', error);
      throw new AppError('Failed to perform batch export', 'BATCH_EXPORT_ERROR', 500);
    }
  }

  /**
   * Get comprehensive export data
   */
  private async getExportData(calculationId: string, userId: string, options: ExportOptions): Promise<ExportData> {
    const calculation = await prisma.calculation.findUnique({
      where: { id: calculationId },
      include: {
        user: { select: { name: true, email: true, company: true } },
        team: { select: { name: true } }
      }
    });

    if (!calculation) {
      throw new AppError('Calculation not found', 'NOT_FOUND', 404);
    }

    // Check access permissions
    if (calculation.userId !== userId) {
      const hasTeamAccess = calculation.teamId && await prisma.teamMember.findFirst({
        where: { teamId: calculation.teamId, userId }
      });
      
      if (!hasTeamAccess) {
        throw new AppError('Access denied', 'ACCESS_DENIED', 403);
      }
    }

    const exportData: ExportData = {
      calculation,
      results: calculation.results,
      metadata: {
        exportedAt: new Date(),
        exportedBy: userId,
        version: '2.0'
      }
    };

    // Include AI insights if requested and available
    if (options.includeAIInsights) {
      const aiInsights = await prisma.aiInsight.findMany({
        where: { calculationId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      exportData.aiInsights = aiInsights.map(insight => ({
        type: insight.insightType,
        confidence: insight.confidence,
        response: JSON.parse(insight.response),
        createdAt: insight.createdAt
      }));
    }

    // Include industry benchmarks if requested
    if (options.includeBenchmarks) {
      // This would typically fetch from a benchmarks service
      exportData.benchmarks = await this.getBenchmarksForIndustry(
        calculation.inputs?.industry || 'B2B SaaS'
      );
    }

    return exportData;
  }

  /**
   * Generate PDF document
   */
  private async generatePDF(data: ExportData, options: ExportOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50,
          info: {
            Title: `${data.calculation.name} - Pricing Analysis`,
            Author: 'SaaS Pricing Calculator',
            Subject: 'Pricing Analysis Report',
            Creator: 'SaaS Pricing Calculator Premium'
          }
        });
        
        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Apply template styling
        this.applyPDFStyling(doc, options);

        // Header
        this.addPDFHeader(doc, data, options);

        // Executive Summary
        this.addPDFExecutiveSummary(doc, data);

        // Calculation Details
        this.addPDFCalculationDetails(doc, data);

        // AI Insights Section
        if (options.includeAIInsights && data.aiInsights?.length) {
          doc.addPage();
          this.addPDFAIInsights(doc, data.aiInsights);
        }

        // Benchmarks Section
        if (options.includeBenchmarks && data.benchmarks) {
          doc.addPage();
          this.addPDFBenchmarks(doc, data.benchmarks);
        }

        // Footer
        this.addPDFFooter(doc, data);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel workbook
   */
  private async generateExcel(data: ExportData, options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'SaaS Pricing Calculator';
    workbook.lastModifiedBy = 'SaaS Pricing Calculator';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    this.createExcelSummarySheet(summarySheet, data, options);

    // Inputs Sheet
    const inputsSheet = workbook.addWorksheet('Inputs');
    this.createExcelInputsSheet(inputsSheet, data);

    // Results Sheet
    const resultsSheet = workbook.addWorksheet('Results');
    this.createExcelResultsSheet(resultsSheet, data);

    // AI Insights Sheet
    if (options.includeAIInsights && data.aiInsights?.length) {
      const aiSheet = workbook.addWorksheet('AI Insights');
      this.createExcelAIInsightsSheet(aiSheet, data.aiInsights);
    }

    // Benchmarks Sheet
    if (options.includeBenchmarks && data.benchmarks) {
      const benchmarksSheet = workbook.addWorksheet('Benchmarks');
      this.createExcelBenchmarksSheet(benchmarksSheet, data.benchmarks);
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Generate CSV data
   */
  private async generateCSV(data: ExportData, options: ExportOptions): Promise<string> {
    const lines: string[] = [];
    
    // Header
    lines.push(`"SaaS Pricing Analysis - ${data.calculation.name}"`);
    lines.push(`"Generated: ${data.metadata.exportedAt.toISOString()}"`);
    lines.push('');

    // Inputs
    lines.push('"INPUTS"');
    lines.push('"Metric","Value"');
    
    for (const [key, value] of Object.entries(data.calculation.inputs)) {
      lines.push(`"${this.formatFieldName(key)}","${value}"`);
    }
    
    lines.push('');

    // Results
    lines.push('"RESULTS"');
    lines.push('"Metric","Value"');
    
    for (const [key, value] of Object.entries(data.results)) {
      lines.push(`"${this.formatFieldName(key)}","${value}"`);
    }

    // AI Insights
    if (options.includeAIInsights && data.aiInsights?.length) {
      lines.push('');
      lines.push('"AI INSIGHTS"');
      lines.push('"Type","Title","Confidence","Description"');
      
      for (const insight of data.aiInsights) {
        const response = insight.response;
        lines.push(`"${insight.type}","${response.title || ''}","${insight.confidence}","${response.description || ''}"`);
      }
    }

    return lines.join('\n');
  }

  // PDF Helper Methods
  private applyPDFStyling(doc: PDFDocument, options: ExportOptions): void {
    const colors = options.branding?.colors || {
      primary: '#2563eb',
      secondary: '#64748b'
    };

    // Set default colors
    doc.fillColor(colors.primary);
  }

  private addPDFHeader(doc: PDFDocument, data: ExportData, options: ExportOptions): void {
    // Company branding
    if (options.branding?.companyName) {
      doc.fontSize(12)
         .fillColor('#64748b')
         .text(options.branding.companyName, 50, 50);
    }

    // Title
    doc.fontSize(24)
       .fillColor('#1e293b')
       .text('SaaS Pricing Analysis', 50, 100);

    doc.fontSize(18)
       .text(data.calculation.name, 50, 130);

    // Date
    doc.fontSize(10)
       .fillColor('#64748b')
       .text(`Generated: ${data.metadata.exportedAt.toLocaleDateString()}`, 50, 160);

    doc.y = 200; // Set position for next content
  }

  private addPDFExecutiveSummary(doc: PDFDocument, data: ExportData): void {
    doc.fontSize(16)
       .fillColor('#1e293b')
       .text('Executive Summary', 50, doc.y + 20);

    const results = data.results;
    const summary = [
      `Monthly Recurring Revenue: $${this.formatNumber(results.monthlyRecurringRevenue)}`,
      `Annual Recurring Revenue: $${this.formatNumber(results.annualRecurringRevenue)}`,
      `Customer Lifetime Value: $${this.formatNumber(results.customerLifetimeValue)}`,
      `Payback Period: ${results.paybackPeriod} months`,
      `Growth Rate: ${results.monthlyGrowthRate}%`
    ];

    doc.fontSize(12)
       .fillColor('#374151');

    summary.forEach((line, index) => {
      doc.text(line, 70, doc.y + 15 + (index * 15));
    });

    doc.y += summary.length * 15 + 30;
  }

  private addPDFCalculationDetails(doc: PDFDocument, data: ExportData): void {
    doc.fontSize(16)
       .fillColor('#1e293b')
       .text('Calculation Details', 50, doc.y + 20);

    // Inputs
    doc.fontSize(14)
       .text('Inputs', 50, doc.y + 30);

    const inputs = data.calculation.inputs;
    let yPos = doc.y + 15;

    for (const [key, value] of Object.entries(inputs)) {
      doc.fontSize(11)
         .fillColor('#374151')
         .text(`${this.formatFieldName(key)}: ${this.formatValue(value)}`, 70, yPos);
      yPos += 15;
    }

    doc.y = yPos + 20;

    // Results
    doc.fontSize(14)
       .fillColor('#1e293b')
       .text('Results', 50, doc.y);

    yPos = doc.y + 15;

    for (const [key, value] of Object.entries(data.results)) {
      doc.fontSize(11)
         .fillColor('#374151')
         .text(`${this.formatFieldName(key)}: ${this.formatValue(value)}`, 70, yPos);
      yPos += 15;
    }

    doc.y = yPos + 20;
  }

  private addPDFAIInsights(doc: PDFDocument, insights: any[]): void {
    doc.fontSize(16)
       .fillColor('#1e293b')
       .text('AI-Powered Insights', 50, 100);

    let yPos = 140;

    insights.forEach((insight, index) => {
      if (yPos > 700) { // New page if needed
        doc.addPage();
        yPos = 50;
      }

      const response = insight.response;
      
      doc.fontSize(14)
         .fillColor('#2563eb')
         .text(`${index + 1}. ${response.title || insight.type}`, 50, yPos);

      yPos += 20;

      doc.fontSize(11)
         .fillColor('#374151')
         .text(response.description || '', 70, yPos, { width: 450 });

      yPos += doc.heightOfString(response.description || '', { width: 450 }) + 10;

      // Confidence score
      doc.fontSize(10)
         .fillColor('#64748b')
         .text(`Confidence: ${Math.round(insight.confidence * 100)}%`, 70, yPos);

      yPos += 30;
    });
  }

  private addPDFBenchmarks(doc: PDFDocument, benchmarks: any): void {
    doc.fontSize(16)
       .fillColor('#1e293b')
       .text('Industry Benchmarks', 50, 100);

    let yPos = 140;

    for (const [metric, value] of Object.entries(benchmarks)) {
      doc.fontSize(11)
         .fillColor('#374151')
         .text(`${this.formatFieldName(metric)}: ${this.formatValue(value)}`, 70, yPos);
      yPos += 15;
    }
  }

  private addPDFFooter(doc: PDFDocument, data: ExportData): void {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text('Generated by SaaS Pricing Calculator Premium', 50, 750)
         .text(`Page ${i + 1} of ${pages.count}`, 450, 750)
         .text(`Export ID: ${data.metadata.version}`, 50, 765);
    }
  }

  // Excel Helper Methods
  private createExcelSummarySheet(sheet: ExcelJS.Worksheet, data: ExportData, options: ExportOptions): void {
    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };

    // Add summary data
    const summaryData = [
      { metric: 'Calculation Name', value: data.calculation.name },
      { metric: 'Generated', value: data.metadata.exportedAt.toLocaleString() },
      { metric: 'Monthly Recurring Revenue', value: this.formatNumber(data.results.monthlyRecurringRevenue) },
      { metric: 'Annual Recurring Revenue', value: this.formatNumber(data.results.annualRecurringRevenue) },
      { metric: 'Customer Lifetime Value', value: this.formatNumber(data.results.customerLifetimeValue) },
      { metric: 'Payback Period (months)', value: data.results.paybackPeriod }
    ];

    summaryData.forEach(item => {
      sheet.addRow(item);
    });

    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = Math.max(column.width || 0, 15);
    });
  }

  private createExcelInputsSheet(sheet: ExcelJS.Worksheet, data: ExportData): void {
    sheet.columns = [
      { header: 'Input', key: 'input', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true };

    // Add input data
    for (const [key, value] of Object.entries(data.calculation.inputs)) {
      sheet.addRow({
        input: this.formatFieldName(key),
        value: this.formatValue(value)
      });
    }
  }

  private createExcelResultsSheet(sheet: ExcelJS.Worksheet, data: ExportData): void {
    sheet.columns = [
      { header: 'Result', key: 'result', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true };

    // Add results data
    for (const [key, value] of Object.entries(data.results)) {
      sheet.addRow({
        result: this.formatFieldName(key),
        value: this.formatValue(value)
      });
    }
  }

  private createExcelAIInsightsSheet(sheet: ExcelJS.Worksheet, insights: any[]): void {
    sheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Confidence', key: 'confidence', width: 12 },
      { header: 'Created', key: 'created', width: 20 }
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true };

    // Add insights data
    insights.forEach(insight => {
      const response = insight.response;
      sheet.addRow({
        type: insight.type,
        title: response.title || '',
        description: response.description || '',
        confidence: `${Math.round(insight.confidence * 100)}%`,
        created: insight.createdAt
      });
    });
  }

  private createExcelBenchmarksSheet(sheet: ExcelJS.Worksheet, benchmarks: any): void {
    sheet.columns = [
      { header: 'Benchmark', key: 'benchmark', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true };

    // Add benchmarks data
    for (const [key, value] of Object.entries(benchmarks)) {
      sheet.addRow({
        benchmark: this.formatFieldName(key),
        value: this.formatValue(value)
      });
    }
  }

  // Utility Methods
  private async getBenchmarksForIndustry(industry: string): Promise<any> {
    // This would typically fetch from a benchmarks service
    const mockBenchmarks = {
      'B2B SaaS': {
        averageChurn: '5-7%',
        medianCAC: '$500',
        averageContractLength: '12 months',
        expansionRate: '115%'
      },
      'E-commerce': {
        averageChurn: '12-15%',
        medianCAC: '$75',
        averageContractLength: '3 months',
        expansionRate: '105%'
      }
    };

    return mockBenchmarks[industry as keyof typeof mockBenchmarks] || mockBenchmarks['B2B SaaS'];
  }

  private formatFieldName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value > 1000) {
        return this.formatNumber(value);
      }
      return value.toString();
    }
    return String(value);
  }

  private formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  private hashOptions(options: ExportOptions): string {
    return Buffer.from(JSON.stringify(options)).toString('base64');
  }

  private async createZipArchive(files: Buffer[], names: string[], format: string): Promise<Buffer> {
    // This would use a ZIP library like jszip
    // For now, return the first file as a placeholder
    return files[0];
  }
}

export const exportService = new ExportService();