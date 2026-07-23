# Certificado intermediário do STF

## O problema

As páginas do STF (`portal.stf.jus.br`, `www.stf.jus.br`) servem HTTPS com um
certificado legítimo da GlobalSign, mas **entregam a cadeia incompleta**: em vez de
enviar o certificado intermediário, o servidor repete o próprio certificado-folha.

Sem o intermediário, um cliente novo não consegue ligar a folha até a raiz confiável e
recusa a conexão. É por isso que o monitoramento agendado falhava em quatro fontes
(`sumulas_stf`, `sumulas_vinculantes`, `temas_rg_stf`, `informativo_stf`) com
`curl (60): SSL certificate problem` — enquanto o mesmo endereço abre normalmente num
navegador, que busca o intermediário sozinho (via AIA) ou já o tem em cache.

Diagnóstico reproduzível:

```bash
echo | openssl s_client -connect portal.stf.jus.br:443 -servername portal.stf.jus.br 2>/dev/null \
  | grep "Verify return code"
# Verify return code: 21 (unable to verify the first certificate)
```

## A correção

`stf-globalsign-alphassl-r6-2025.crt` é o intermediário que falta —
`GlobalSign GCC R6 AlphaSSL CA 2025`, assinado pela raiz `GlobalSign Root CA - R6`,
que já está nos bundles de CA padrão.

Ele é **certificado público de autoridade certificadora**, não é segredo e não é
credencial. Fornecê-lo apenas **completa uma cadeia legítima que o servidor entrega
quebrada** — não desativa nem enfraquece a verificação. Nada aqui usa `--insecure`.

Origem oficial (declarada no próprio certificado do STF, extensão *Authority
Information Access*):

```
http://secure.globalsign.com/cacert/gsgccr6alphasslca2025.crt
```

Prova de que resolve:

```bash
# sem o intermediário: falha
openssl verify -CAfile /etc/ssl/cert.pem folha-do-stf.pem
#   error 20 ... unable to get local issuer certificate

# com o intermediário: OK
openssl verify -CAfile /etc/ssl/cert.pem \
  -untrusted ferramentas/manutencao/certs/stf-globalsign-alphassl-r6-2025.crt \
  folha-do-stf.pem
#   OK
```

## Como é usado

O workflow `monitorar-base.yml` instala este arquivo no armazém de CAs do runner
antes de rodar o monitor:

```bash
sudo cp ferramentas/manutencao/certs/stf-globalsign-alphassl-r6-2025.crt \
  /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

Depois disso o `curl` fecha a cadeia sozinho e nenhuma mudança de código é necessária.
Em macOS o problema não aparece (o sistema já resolve o intermediário). Ao rodar o
monitor em Linux fora do CI, repita os dois comandos acima.

## Manutenção

- **Validade:** este intermediário expira em **21/05/2027**. Antes disso, rebaixe a
  versão nova pela URL de AIA acima e substitua o arquivo.
- Se algum dia o STF passar a enviar a cadeia completa, manter este arquivo continua
  inofensivo (o certificado segue válido e apenas redundante).
- Confira qual intermediário o site pede antes de trocar:

```bash
echo | openssl s_client -connect portal.stf.jus.br:443 -servername portal.stf.jus.br 2>/dev/null \
  | openssl x509 -noout -ext authorityInfoAccess
```
