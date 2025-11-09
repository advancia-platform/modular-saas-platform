// RPA Module - KYC / Identity Verification
// Auto-verify new users' identity documents using OCR and external APIs

import prisma from "../prismaClient";
import { rpaConfig } from "./config";
import fs from "fs/promises";
import path from "path";

interface KYCResult {
  verified: boolean;
  confidence: number;
  extractedData: {
    fullName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    documentType?: string;
    expiryDate?: string;
    nationality?: string;
  };
  errors: string[];
  warnings: string[];
}

export class KYCVerifier {
  /**
   * Perform OCR on identity document
   */
  async performOCR(documentPath: string): Promise<any> {
    try {
      // In production, this would use Tesseract OCR or cloud OCR service
      console.log(`🔍 Performing OCR on document: ${documentPath}`);
      
      // Simulated OCR result
      const ocrResult = {
        text: "PASSPORT\nJOHN DOE\nDate of Birth: 01/01/1990\nPassport No: AB1234567\nExpiry: 01/01/2030",
        confidence: 0.95,
      };
      
      return ocrResult;
    } catch (error) {
      console.error("OCR error:", error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Parse OCR text and extract document information
   */
  parseDocumentData(ocrText: string, documentType: string): KYCResult["extractedData"] {
    const extracted: KYCResult["extractedData"] = {};

    try {
      // Simple regex-based extraction (in production, use more sophisticated NLP)
      const nameMatch = ocrText.match(/([A-Z]{2,}\s[A-Z]{2,})/);
      if (nameMatch) {
        extracted.fullName = nameMatch[1];
      }

      const dobMatch = ocrText.match(/Date of Birth:?\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (dobMatch) {
        extracted.dateOfBirth = dobMatch[1];
      }

      if (documentType === "passport") {
        const passportMatch = ocrText.match(/Passport No:?\s*([A-Z0-9]+)/i);
        if (passportMatch) {
          extracted.documentNumber = passportMatch[1];
        }
      } else if (documentType === "drivers_license") {
        const licenseMatch = ocrText.match(/License No:?\s*([A-Z0-9]+)/i);
        if (licenseMatch) {
          extracted.documentNumber = licenseMatch[1];
        }
      }

      const expiryMatch = ocrText.match(/Expiry:?\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (expiryMatch) {
        extracted.expiryDate = expiryMatch[1];
      }

      extracted.documentType = documentType;
    } catch (error) {
      console.error("Error parsing document data:", error);
    }

    return extracted;
  }

  /**
   * Verify document with external API
   */
  async verifyWithExternalAPI(extractedData: KYCResult["extractedData"]): Promise<{ valid: boolean; confidence: number }> {
    try {
      if (!rpaConfig.kyc.verificationApi) {
        console.warn("⚠️  No external verification API configured, skipping...");
        return { valid: true, confidence: 0.7 };
      }

      // In production, call external API (e.g., Onfido, Jumio, Trulioo)
      console.log(`🌐 Verifying with external API...`);

      // Simulated API response
      const apiResponse = {
        valid: true,
        confidence: 0.92,
        checks: {
          documentValid: true,
          faceMatch: true,
          liveness: true,
          addressCheck: false,
        },
      };

      return {
        valid: apiResponse.valid,
        confidence: apiResponse.confidence,
      };
    } catch (error) {
      console.error("External API verification error:", error);
      return { valid: false, confidence: 0 };
    }
  }

  /**
   * Verify a user's identity document
   */
  async verifyDocument(userId: string, documentPath: string, documentType: string): Promise<KYCResult> {
    const result: KYCResult = {
      verified: false,
      confidence: 0,
      extractedData: {},
      errors: [],
      warnings: [],
    };

    try {
      console.log(`📄 Verifying ${documentType} for user ${userId}...`);

      // Step 1: Check if file exists
      try {
        await fs.access(documentPath);
      } catch {
        result.errors.push("Document file not found");
        return result;
      }

      // Step 2: Perform OCR
      const ocrResult = await this.performOCR(documentPath);
      
      if (ocrResult.confidence < 0.7) {
        result.warnings.push("Low OCR confidence - document may be unclear");
      }

      // Step 3: Extract document data
      result.extractedData = this.parseDocumentData(ocrResult.text, documentType);

      // Step 4: Validate extracted data
      if (!result.extractedData.fullName) {
        result.errors.push("Could not extract full name");
      }
      if (!result.extractedData.dateOfBirth) {
        result.errors.push("Could not extract date of birth");
      }
      if (!result.extractedData.documentNumber) {
        result.errors.push("Could not extract document number");
      }

      // Step 5: Check document expiry
      if (result.extractedData.expiryDate) {
        const expiryDate = new Date(result.extractedData.expiryDate);
        if (expiryDate < new Date()) {
          result.errors.push("Document has expired");
        }
      }

      // Step 6: Verify with external API
      const apiVerification = await this.verifyWithExternalAPI(result.extractedData);
      
      result.confidence = (ocrResult.confidence + apiVerification.confidence) / 2;

      // Step 7: Auto-approve if confidence is high enough
      if (result.confidence >= rpaConfig.kyc.autoApproveThreshold && result.errors.length === 0) {
        result.verified = true;
        
        // Update user record
        await prisma.user.update({
          where: { id: userId },
          data: {
            // In production, add kycStatus field to User model
            updatedAt: new Date(),
          },
        });

        // Log KYC approval
        await prisma.auditLog.create({
          data: {
            userId,
            action: "KYC_APPROVED",
            resourceType: "User",
            resourceId: userId,
            metadata: JSON.stringify({
              documentType,
              confidence: result.confidence,
              autoApproved: true,
              extractedData: result.extractedData,
            }),
            ipAddress: "SYSTEM-RPA",
            userAgent: "RPA-KYCVerifier",
            timestamp: new Date(),
          },
        });

        console.log(`✅ KYC approved for user ${userId} (confidence: ${result.confidence.toFixed(2)})`);
      } else {
        result.verified = false;
        result.warnings.push("Manual review required");

        // Log for manual review
        await prisma.auditLog.create({
          data: {
            userId,
            action: "KYC_PENDING_REVIEW",
            resourceType: "User",
            resourceId: userId,
            metadata: JSON.stringify({
              documentType,
              confidence: result.confidence,
              errors: result.errors,
              warnings: result.warnings,
            }),
            ipAddress: "SYSTEM-RPA",
            userAgent: "RPA-KYCVerifier",
            timestamp: new Date(),
          },
        });

        console.log(`⚠️  KYC requires manual review for user ${userId} (confidence: ${result.confidence.toFixed(2)})`);
      }
    } catch (error) {
      result.errors.push(`Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      console.error("❌ KYC verification error:", error);
    }

    return result;
  }

  /**
   * Batch process pending KYC verifications
   */
  async batchProcessKYC(): Promise<void> {
    try {
      console.log("📦 Starting batch KYC processing...");

      // In production, fetch users with pending KYC from database
      // For now, this is a placeholder
      console.log("✅ Batch KYC processing complete");
    } catch (error) {
      console.error("❌ Batch KYC processing error:", error);
    }
  }
}

export default new KYCVerifier();
