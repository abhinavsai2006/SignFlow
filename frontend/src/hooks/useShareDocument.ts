import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

export interface SignatureField {
  _id: string;
  type: 'Signature' | 'Initials' | 'Date' | 'Text' | 'Checkbox';
  recipientEmail: string;
  signerName?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  page: number;
  status: 'Pending' | 'Signed';
  value?: string;
  ipAddress?: string;
  userAgent?: string;
  certificateId?: string;
  auditId?: string;
  browser?: string;
  device?: string;
  operatingSystem?: string;
  location?: string;
  documentHash?: string;
  tamperStatus?: string;
  updatedAt?: string;
  documentId?: string;
  signatureScale?: number;
  metadataScale?: string;
  fontSize?: number;
  showDate?: boolean;
  showTime?: boolean;
  hideSha256?: boolean;
  hideCertId?: boolean;
  hideReason?: boolean;
}

export interface DocumentData {
  _id: string;
  filename: string;
  originalPath: string;
  status: string;
  createdAt: string;
  sha256Checksum?: string;
  signatureFields: SignatureField[];
  recipients?: any[];
  auditLogs?: any[];
}

export function useShareDocument(id: string | undefined) {
  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');

  const loadDocumentMetadata = useCallback(async (pw = '') => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const url = `${BASE_URL}/api/docs/${id}/public${pw ? '?password=' + encodeURIComponent(pw) : ''}`;
      const { data } = await axios.get(url);
      setDocData(data);
      setFields(data.signatureFields || []);
      setRecipients(data.recipients || []);
      setAuditLogs(data.auditLogs || []);
      setIsPasswordRequired(false);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setIsPasswordRequired(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load shared document.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocumentMetadata();
  }, [loadDocumentMetadata]);

  return {
    docData,
    fields,
    setFields,
    recipients,
    auditLogs,
    isLoading,
    error,
    isPasswordRequired,
    password,
    setPassword,
    loadDocumentMetadata
  };
}
