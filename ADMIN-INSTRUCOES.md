# Configurar o painel de administração da PH Company

O painel fica em `admin.html`. Ele não aparece no menu da loja e exige autenticação. O catálogo público lê os produtos ativos do Supabase; alterações feitas no painel passam a valer para todos os visitantes.

## 1. Criar e preparar o banco

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**, cole o conteúdo de `supabase-setup.sql` e execute.
3. Em **Authentication → Users**, crie o usuário administrador com o e-mail que será usado para entrar no painel.
4. Copie o **User UID** desse usuário.
5. No SQL Editor, autorize esse usuário como administrador, substituindo pelo UID copiado:

```sql
insert into public.ph_admins (user_id)
values ('COLE-O-USER-UID-AQUI');
```

O painel não oferece cadastro público. O acesso às alterações é validado no banco por políticas RLS; não dependa apenas do endereço menos conhecido da página.

## 2. Conectar o site

No painel do Supabase, copie a **Project URL** e a **publishable key** do projeto. Preencha esses dois valores em `supabase-config.js`:

```js
window.PH_SUPABASE_CONFIG = {
  url: "SUA_PROJECT_URL",
  publishableKey: "SUA_PUBLISHABLE_KEY"
};
```

Essa chave publicável pode estar no código do navegador quando as políticas RLS estão ativas e corretas. **Nunca** coloque a `secret key` ou `service_role key` em arquivos do site.

## 3. Publicar e usar

1. Envie todos os arquivos do projeto para o repositório conectado ao Vercel, incluindo `admin.html`, `admin.js`, `admin.css`, `supabase-config.js`, `supabase-setup.sql` e a pasta `public`.
2. Abra `https://SEU-DOMINIO/admin.html` e entre com o e-mail e a senha criados no Supabase.
3. Adicione, edite, oculte ou exclua produtos. Você pode informar URLs de imagens ou enviar arquivos JPG, PNG e WEBP de até 6 MB.

Após configurar o banco, o catálogo será carregado do Supabase. Se a conexão ainda não estiver configurada, a loja continua exibindo os produtos locais de demonstração.
