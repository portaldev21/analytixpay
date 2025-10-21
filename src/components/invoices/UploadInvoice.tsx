"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { uploadInvoice } from "@/actions/invoice.actions"

interface UploadInvoiceProps {
  accountId: string
}

export function UploadInvoice({ accountId }: UploadInvoiceProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setStatus("idle")
      setMessage("")

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("accountId", accountId)

        const result = await uploadInvoice(formData)

        if (result.success) {
          setStatus("success")
          setMessage(
            `Fatura processada com sucesso! ${result.data?.transactionsCount || 0} transações encontradas.`
          )
          router.refresh()
        } else {
          setStatus("error")
          setMessage(result.error || "Erro ao processar fatura")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Erro inesperado ao fazer upload")
      } finally {
        setUploading(false)
      }
    },
    [accountId, router]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploading,
  })

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-all",
          isDragActive && "border-primary bg-primary/5",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="p-12 text-center">
          {uploading ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h3 className="mt-4 font-semibold">Processando fatura...</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Extraindo transações do PDF
              </p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Upload de Fatura</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Arraste um PDF ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 10MB
              </p>
            </>
          )}
        </div>
      </Card>

      {status !== "idle" && (
        <Card
          className={cn(
            "p-4 border-2",
            status === "success" && "bg-green-500/10 border-green-500/30",
            status === "error" && "bg-red-500/10 border-red-500/30"
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
                  status === "error" && "text-red-700 dark:text-red-300"
                )}
              >
                {message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatus("idle")}
            >
              Fechar
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
