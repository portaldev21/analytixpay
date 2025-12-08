"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!selectedFile || !billingDate) return;

    setUploading(true);
    setStatus("idle");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("accountId", accountId);
      formData.append("billingDate", billingDate);

      const result = await uploadInvoice(formData);

      if (result.success) {
        setStatus("success");
        setMessage(
          `Fatura processada com sucesso! ${result.data?.transactionsCount || 0} transações encontradas.`,
        );
        setSelectedFile(null);
        setBillingDate("");
        router.refresh();
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setStatus("idle");
      setMessage("");
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
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-all",
          isDragActive && "border-primary bg-primary/5",
          uploading && "opacity-50 cursor-not-allowed",
          selectedFile && "border-primary/50 bg-primary/5",
        )}
      >
        <input {...getInputProps()} />
        <div className="p-8 text-center">
          {uploading ? (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <h3 className="mt-4 font-semibold">Processando fatura...</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Extraindo transações do PDF
              </p>
            </>
          ) : selectedFile ? (
            <>
              <FileText className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 font-semibold">{selectedFile.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Clique para trocar o arquivo
              </p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Upload de Fatura</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Arraste um PDF ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">Máximo 10MB</p>
            </>
          )}
        </div>
      </Card>

      {/* Step 2: Select billing date and upload */}
      {selectedFile && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billingDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Vencimento da Fatura
              </Label>
              <Input
                id="billingDate"
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="w-full"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Informe a data de vencimento desta fatura para organizar seus gastos corretamente
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!billingDate || uploading}
              className="w-full"
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
          </div>
        </Card>
      )}

      {/* Status message */}
      {status !== "idle" && (
        <Card
          className={cn(
            "p-4 border-2",
            status === "success" && "bg-green-500/10 border-green-500/30",
            status === "error" && "bg-red-500/10 border-red-500/30",
          )}
        >
          <div className="flex items-start gap-3">
            {status === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  status === "success" && "text-green-700 dark:text-green-300",
                  status === "error" && "text-red-700 dark:text-red-300",
                )}
              >
                {message}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
              Fechar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
