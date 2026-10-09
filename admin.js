const cfg=window.PH_SUPABASE_CONFIG;
const setupNotice=document.querySelector("#setupNotice"),loginPanel=document.querySelector("#loginPanel"),managerPanel=document.querySelector("#managerPanel"),loginFeedback=document.querySelector("#loginFeedback"),formFeedback=document.querySelector("#formFeedback");
let db=null,products=[];
const money=value=>Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function message(el,text,isError=false){el.textContent=text;el.classList.toggle("error",isError)}
function slugify(value){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}

if(!cfg?.url||!cfg?.publishableKey||!window.supabase?.createClient){
 setupNotice.hidden=false;
 setupNotice.innerHTML="<strong>Falta conectar o banco de dados.</strong><br>Siga o arquivo <code>ADMIN-INSTRUCOES.md</code>: crie o projeto, execute o SQL e preencha <code>supabase-config.js</code> com a Project URL e a publishable key. Não coloque uma secret key no site.";
 loginPanel.hidden=true;
}else{
 db=window.supabase.createClient(cfg.url,cfg.publishableKey);
 document.querySelector("#loginForm").addEventListener("submit",signIn);
 document.querySelector("#signOut").addEventListener("click",()=>db.auth.signOut());
 document.querySelector("#productForm").addEventListener("submit",saveProduct);
 document.querySelector("#clearForm").addEventListener("click",clearForm);
 document.querySelector("#productList").addEventListener("click",handleListAction);
 db.auth.onAuthStateChange((_event,session)=>{if(session?.user)verifyAdmin(session.user);else showLogin()});
 db.auth.getSession().then(({data})=>data.session?.user?verifyAdmin(data.session.user):showLogin());
}

async function signIn(event){
 event.preventDefault();message(loginFeedback,"Entrando...");
 const form=new FormData(event.currentTarget);
 const {error}=await db.auth.signInWithPassword({email:form.get("email"),password:form.get("password")});
 if(error)message(loginFeedback,error.message,true);
}
async function verifyAdmin(user){
 const {data,error}=await db.from("ph_admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(error||!data){showLogin();message(loginFeedback,"Esta conta ainda não tem permissão de administrador. Confira o passo de autorização no guia.",true);await db.auth.signOut();return}
 loginPanel.hidden=true;managerPanel.hidden=false;setupNotice.hidden=true;await loadProducts();
}
function showLogin(){loginPanel.hidden=false;managerPanel.hidden=true}
async function loadProducts(){
 const {data,error}=await db.from("ph_products").select("id,name,category,price,old_price,image_urls,sizes,active,sort_order").order("sort_order").order("name");
 if(error){message(formFeedback,"Não consegui carregar os produtos: "+error.message,true);return}
 products=data||[];renderList();
}
function renderList(){
 document.querySelector("#productTotal").textContent=`${products.length} ${products.length===1?"produto":"produtos"}`;
 const list=document.querySelector("#productList");
 if(!products.length){list.innerHTML='<p class="empty-list">Nenhum produto no banco ainda. Execute o SQL de configuração para cadastrar os itens iniciais.</p>';return}
 list.innerHTML=products.map(p=>`<article class="admin-product-row"><div><h4>${escapeHTML(p.name)}${p.active?"":" · oculto"}</h4><p>${escapeHTML(({camisetas:"Camiseta",conjuntos:"Conjunto",calcoes:"Calção"})[p.category]||p.category)} · ${p.image_urls?.length||0} foto(s)</p></div><div class="admin-row-actions"><strong>${money(p.price)}</strong><button type="button" data-edit="${escapeHTML(p.id)}">Editar</button><button type="button" data-delete="${escapeHTML(p.id)}">Excluir</button></div></article>`).join("");
}
function handleListAction(event){
 const edit=event.target.closest("[data-edit]");
 if(edit){const p=products.find(item=>item.id===edit.dataset.edit);if(p)fillForm(p);return}
 const remove=event.target.closest("[data-delete]");
 if(remove)deleteProduct(remove.dataset.delete);
}
function fillForm(p){
 const f=document.querySelector("#productForm");f.elements.id.value=p.id;f.elements.name.value=p.name;f.elements.category.value=p.category;f.elements.price.value=p.price;f.elements.oldPrice.value=p.old_price??"";f.elements.sizes.value=p.sizes||"";f.elements.imageUrls.value=(p.image_urls||[]).join("\n");f.elements.active.checked=p.active;f.elements.photos.value="";document.querySelector("#formHeading").textContent="Editar produto";f.scrollIntoView({behavior:"smooth",block:"start"});
}
function clearForm(){const f=document.querySelector("#productForm");f.reset();f.elements.id.value="";f.elements.active.checked=true;document.querySelector("#formHeading").textContent="Adicionar produto";message(formFeedback,"")}
async function uploadPhotos(files){
 const urls=[];
 for(const file of files){
  if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Envie imagens JPG, PNG ou WEBP.");
  if(file.size>6*1024*1024)throw new Error("Cada imagem deve ter no máximo 6 MB.");
  const path=`${crypto.randomUUID()}-${slugify(file.name)||"foto"}.${file.name.split(".").pop().toLowerCase()}`;
  const {error}=await db.storage.from("product-images").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
  if(error)throw error;
  urls.push(db.storage.from("product-images").getPublicUrl(path).data.publicUrl);
 }
 return urls;
}
async function saveProduct(event){
 event.preventDefault();message(formFeedback,"Salvando...");
 const f=event.currentTarget,fd=new FormData(f),id=String(fd.get("id")||"");
 try{
  const entered=String(fd.get("imageUrls")||"").split(/[\n,]+/).map(v=>v.trim()).filter(Boolean);
  const uploaded=await uploadPhotos(Array.from(f.elements.photos.files||[]));
  const previous=products.find(p=>p.id===id);
  const productId=id||`${slugify(fd.get("name"))||"produto"}-${Date.now().toString(36)}`;
  const payload={id:productId,name:String(fd.get("name")).trim(),category:fd.get("category"),price:Number(fd.get("price")),old_price:fd.get("oldPrice")?Number(fd.get("oldPrice")):null,image_urls:[...new Set([...entered,...uploaded])],sizes:String(fd.get("sizes")||"Consulte tamanhos").trim(),active:f.elements.active.checked,sort_order:previous?.sort_order??products.length+1};
  if(!payload.image_urls.length)throw new Error("Adicione ao menos uma foto ou um endereço de imagem.");
  const {error}=await db.from("ph_products").upsert(payload,{onConflict:"id"});
  if(error)throw error;
  clearForm();message(formFeedback,"Produto salvo. O catálogo público já pode carregar a atualização.");await loadProducts();
 }catch(error){message(formFeedback,error.message||"Não consegui salvar o produto.",true)}
}
async function deleteProduct(id){
 const p=products.find(item=>item.id===id);if(!p||!confirm(`Excluir “${p.name}” do catálogo?`))return;
 const {error}=await db.from("ph_products").delete().eq("id",id);
 if(error){message(formFeedback,"Não consegui excluir: "+error.message,true);return}
 message(formFeedback,"Produto excluído.");await loadProducts();
}
