"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadInvoice } from "@/actions/invoice.actions";

interface UploadInvoiceProps {
  accountId: string;
}

export function UploadInvoice({ accountId }: UploadInvoiceProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "error" | "need_date"
  >("idle");
  const [message, setMessage] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (manualDate?: string) => {
    if (!selectedFile) return;

    setUploading(true);
    setStatus("idle");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("accountId", accountId);

      // Só envia billingDate se foi informado manualmente
      if (manualDate) {
        formData.append("billingDate", manualDate);
      }

      const result = await uploadInvoice(formData);

      if (result.success) {
        setStatus("success");
        setMessage(
          `Fatura processada com sucesso! ${result.data?.transactionsCount || 0} transações encontradas.`,
        );
        setSelectedFile(null);
        setBillingDate("");
        router.refresh();
      } else if (result.error?.startsWith("DATA_VENCIMENTO_NAO_ENCONTRADA:")) {
        // Parser não conseguiu detectar a data - pedir para o usuário
        setStatus("need_date");
        setMessage(result.error.split(":")[1]);
      } else {
        setStatus("error");
        setMessage(result.error || "Erro ao processar fatura");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Erro inesperado ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRetryWithDate = () => {
    if (billingDate) {
      handleUpload(billingDate);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setStatus("idle");
      setMessage("");
      setBillingDate("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      {/* Step 1: Select file */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-[var(--radius-lg)] cursor-pointer transition-all",
          "bg-[var(--color-card-dark-2)] border-[var(--glass-border)]",
          isDragActive &&
            "border-[var(--color-primary-start)] bg-[var(--color-primary-start)]/10",
          uploading && "opacity-50 cursor-not-allowed",
          selectedFile &&
            "border-[var(--color-primary-start)]/50 bg-[var(--color-primary-start)]/5",
        )}
      >
        <input {...getInputProps()} />
        <div className="p-8 text-center">
          {uploading ? (
            <>
              <div className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-start)]/20 to-[var(--color-primary-end)]/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-start)]" />
              </div>
              <h3 className="mt-4 font-semibold text-[var(--color-text-primary)]">
                Processando fatura...
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">
                Extraindo transações do PDF com IA
              </p>
            </>
          ) : selectedFile ? (
            <>
              <div className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-start)]/20 to-[var(--color-primary-end)]/20 flex items-center justify-center">
                <FileText className="h-8 w-8 text-[var(--color-primary-start)]" />
              </div>
              <h3 className="mt-4 font-semibold text-[var(--color-text-primary)]">
                {selectedFile.name}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">
                Clique para trocar o arquivo
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto size-16 rounded-2xl bg-[var(--color-card-dark-3)] flex items-center justify-center">
                <Upload className="h-8 w-8 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="mt-4 font-semibold text-[var(--color-text-primary)]">
                Upload de Fatura
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">
                Arraste um PDF ou clique para selecionar
              </p>
              <p className="text-xs text-[var(--color-text-muted)]/60 mt-1">
                Máximo 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Step 2: Process button (no date required initially) */}
      {selectedFile && status !== "need_date" && status !== "success" && (
        <Button
          onClick={() => handleUpload()}
          disabled={uploading}
          className="w-full"
          size="xl"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Processar Fatura
            </>
          )}
        </Button>
      )}

      {/* Step 3: Ask for date if not detected */}
      {status === "need_date" && (
        <CardGlass
          variant="dark-2"
          size="md"
          className="border-[var(--color-purple-light)]/30"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-[var(--color-purple-light)]/10">
                <AlertCircle className="h-5 w-5 text-[var(--color-purple-light)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Data de vencimento não detectada
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Não foi possível extrair a data de vencimento do PDF
                  automaticamente. Por favor, informe abaixo:
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Vencimento
              </Label>
              <Input
                id="billingDate"
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="w-full"
                disabled={uploading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRetryWithDate}
                disabled={!billingDate || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("idle");
                  setSelectedFile(null);
                  setBillingDate("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </CardGlass>
      )}

      {/* Success message */}
      {status === "success" && (
        <CardGlass
          variant="dark-2"
          size="md"
          className="border-[var(--color-positive)]/30"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-[var(--color-positive)]/10">
              <CheckCircle className="h-5 w-5 text-[var(--color-positive)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-positive)]">
                {message}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
              Fechar
            </Button>
          </div>
        </CardGlass>
      )}

      {/* Error message */}
      {status === "error" && (
        <CardGlass
          variant="dark-2"
          size="md"
          className="border-[var(--color-negative)]/30"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-[var(--color-negative)]/10">
              <XCircle className="h-5 w-5 text-[var(--color-negative)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-negative)]">
                {message}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
              Fechar
            </Button>
          </div>
        </CardGlass>
      )}
    </div>
  );
}
