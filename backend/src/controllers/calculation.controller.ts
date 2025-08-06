import { Request, Response, NextFunction } from 'express';
import { CalculationService } from '../services/calculation.service';
import { PDFService } from '../services/pdf.service';
import { calculationCreateSchema, calculationInputSchema, exportSchema } from '../utils/validators';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const calculationService = new CalculationService();
const pdfService = new PDFService();

export class CalculationController {
  async getCalculations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const teamId = req.query.teamId as string | undefined;
      
      const calculations = await calculationService.getCalculations(userId, teamId);
      
      res.json({
        success: true,
        data: calculations,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validatedData = calculationCreateSchema.parse(req.body);
      
      const result = await calculationService.calculate(
        userId,
        validatedData.inputs,
        validatedData.name
      );
      
      res.status(201).json({
        success: true,
        message: 'Calculation created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const calculation = await calculationService.getCalculation(id, userId);
      
      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { inputs, name } = req.body;
      
      const validatedInputs = calculationInputSchema.parse(inputs);
      
      const updated = await calculationService.updateCalculation(
        id,
        userId,
        validatedInputs,
        name
      );
      
      res.json({
        success: true,
        message: 'Calculation updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      await calculationService.deleteCalculation(id, userId);
      
      res.json({
        success: true,
        message: 'Calculation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async shareCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const shareData = await calculationService.shareCalculation(id, userId);
      
      res.json({
        success: true,
        message: 'Calculation shared successfully',
        data: shareData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSharedCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const { shareToken } = req.params;
      
      const calculation = await calculationService.getSharedCalculation(shareToken);
      
      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      next(error);
    }
  }

  async duplicateCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name } = req.body;
      
      // Get original calculation
      const original = await calculationService.getCalculation(id, userId);
      
      // Create duplicate with new name
      const duplicate = await calculationService.calculate(
        userId,
        original.inputs,
        name || `${original.name} (Copy)`
      );
      
      res.status(201).json({
        success: true,
        message: 'Calculation duplicated successfully',
        data: duplicate,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCalculationVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const versions = await calculationService.getCalculationVersions(id, userId);
      
      res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCalculation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const validatedData = exportSchema.parse(req.body);
      
      const calculation = await calculationService.getCalculation(id, userId);
      
      let exportData: Buffer;
      let contentType: string;
      let filename: string;
      
      switch (validatedData.format) {
        case 'pdf':
          exportData = await pdfService.generateCalculationPDF(calculation);
          contentType = 'application/pdf';
          filename = `calculation-${id}.pdf`;
          break;
          
        case 'csv':
          exportData = Buffer.from(pdfService.generateCSV(calculation));
          contentType = 'text/csv';
          filename = `calculation-${id}.csv`;
          break;
          
        case 'json':
          exportData = Buffer.from(JSON.stringify(calculation, null, 2));
          contentType = 'application/json';
          filename = `calculation-${id}.json`;
          break;
          
        default:
          throw new AppError('Unsupported export format', 400);
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
      
      logger.info(`Calculation ${id} exported as ${validatedData.format} by user ${userId}`);
    } catch (error) {
      next(error);
    }
  }
}

export const calculationController = new CalculationController();