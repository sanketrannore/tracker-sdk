export type CruxErrorType = 'custom' | 'autocapture' | 'general';

export class CruxSDKError extends Error {
  public type: CruxErrorType;
  public details?: any;

  constructor(message: string, type: CruxErrorType = 'general', details?: any) {
    super(message);
    this.name = 'CruxSDKError';
    this.type = type;
    this.details = details;
    
    // Only available in Node.js environments
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, CruxSDKError);
    }
  }
} 