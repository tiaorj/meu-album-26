export function traduzirErroAuth(mensagem: string): string {
  const erro = mensagem.toLowerCase();

  if (erro.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }

  if (erro.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  if (erro.includes("user already registered")) {
    return "Já existe uma conta cadastrada com esse e-mail.";
  }

  if (erro.includes("password should be at least")) {
    return "A senha deve possuir pelo menos 6 caracteres.";
  }

  if (erro.includes("signup is disabled")) {
    return "O cadastro de novos usuários está desativado.";
  }

  if (erro.includes("rate limit")) {
    return "Muitas tentativas foram realizadas. Aguarde um pouco e tente novamente.";
  }

  return `Não foi possível concluir a operação: ${mensagem}`;
}