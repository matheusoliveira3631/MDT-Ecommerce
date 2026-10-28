"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/entrar/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function LoginForm({ voltar }: { voltar?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="voltar" value={voltar ?? ""} />
      <TextField label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      <TextField label="Senha" name="senha" type="password" autoComplete="current-password" required />
      {state.error && (
        <p role="alert" className="m-0 text-sm font-bold text-error">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        Entrar
      </Button>
    </form>
  );
}
