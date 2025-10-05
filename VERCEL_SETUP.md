Configuração Vercel - Proxy para API da NASA

O projeto inclui uma rota serverless para Vercel que evita expor sua chave da NASA no bundle do cliente.

Arquivo criado:
- `api/nasa/meteors.js` — função serverless que recebe `start_date` e `end_date` como query params e faz proxy para `https://api.nasa.gov/neo/rest/v1/feed` usando a variável de ambiente `NASA_API_KEY`.

Passos para configurar no Vercel:
1. No painel do Vercel, abra o seu projeto.
2. Vá em Settings -> Environment Variables.
3. Adicione uma variável chamada `NASA_API_KEY` com a sua chave da NASA (ou deixe `DEMO_KEY` se quiser usar a chave pública limitada).
   - Scope: selecione `Production` (ou também `Preview` se desejar testar em preview deployments).
4. Re-deploy o projeto.

Uso no cliente:
- O client faz requisições a `/api/nasa/meteors?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`.
- A função serverless chama a NASA com a chave do servidor e devolve o JSON.

Notas:
- Evita expor a chave no bundle do navegador.
- Há um cache simples: `s-maxage=60` no response para reduzir chamadas à NASA.
- Se preferir, mantenha também o fallback cliente que chama a NASA diretamente (se o servidor retornar 404) — isso já está implementado no cliente.

Problemas comuns:
- Se você ainda receber 404, garanta que o diretório `api/` foi incluído no deploy e que o projeto não foi publicado como um site puramente estático sem funções.
- Para logs, verifique a seção Serverless Functions -> Logs no painel do Vercel.
