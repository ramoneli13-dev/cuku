import { NextResponse } from "next/server";
import { DomainError } from "@/lib/domain/errors";
import { ZodError } from "zod";

export function apiError(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: error.issues[0]?.message ?? "Datos inválidos.",
        code: "VALIDATION_ERROR",
        issues: error.issues,
      },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "Ocurrió un error inesperado.", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
