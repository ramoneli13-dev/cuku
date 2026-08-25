import "server-only";

import { z } from "zod";

const receiptAnalysisSchema = z.object({
  isTransferReceipt: z.boolean(),
  status: z.enum(["SUCCESSFUL", "PENDING", "FAILED", "UNKNOWN"]),
  amountCop: z.number().nonnegative().nullable(),
  receiptNumber: z.string().max(120).nullable(),
  destinationHint: z.string().max(160).nullable(),
  dateText: z.string().max(100).nullable(),
  confidence: z.number().min(0).max(1),
  suspiciousSignals: z.array(z.string().max(180)).max(8),
});

export type ReceiptAnalysis = z.infer<typeof receiptAnalysisSchema>;

const receiptJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isTransferReceipt: { type: "boolean" },
    status: {
      type: "string",
      enum: ["SUCCESSFUL", "PENDING", "FAILED", "UNKNOWN"],
    },
    amountCop: { type: ["number", "null"] },
    receiptNumber: { type: ["string", "null"] },
    destinationHint: { type: ["string", "null"] },
    dateText: { type: ["string", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    suspiciousSignals: { type: "array", items: { type: "string" } },
  },
  required: [
    "isTransferReceipt",
    "status",
    "amountCop",
    "receiptNumber",
    "destinationHint",
    "dateText",
    "confidence",
    "suspiciousSignals",
  ],
} as const;

function outputText(payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  if (payload.output_text) return payload.output_text;
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")?.text;
}

export async function analyzeTransferReceipt(input: {
  bytes: Uint8Array;
  mimeType: string;
  expectedAmountCop: number;
  expectedReference: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("El análisis visual todavía no está configurado.");

  const imageUrl = `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-5-mini",
      store: false,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Extrae datos visibles de este posible comprobante de transferencia colombiano.",
                `El pedido espera COP ${input.expectedAmountCop} y referencia ${input.expectedReference}.`,
                "No declares autenticidad: una imagen puede estar editada. Marca señales visuales sospechosas.",
                "SUCCESSFUL solo si el texto visible indica que la transferencia terminó exitosamente.",
              ].join(" "),
            },
            { type: "input_image", image_url: imageUrl, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "transfer_receipt_extraction",
          strict: true,
          schema: receiptJsonSchema,
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`El servicio de visión rechazó el análisis (${response.status}).`);
  }
  const payload = (await response.json()) as Parameters<typeof outputText>[0];
  const text = outputText(payload);
  if (!text) throw new Error("La IA no devolvió un análisis legible.");
  return receiptAnalysisSchema.parse(JSON.parse(text));
}
