// Atualize os caminhos das fotos, nomes e tamanhos ao receber o catálogo.
// Configure o WhatsApp como DDI + DDD + número, somente números (ex.: 5546999999999).
const WHATSAPP_NUMBER = "554691014924";
let products = [
  {id:"conjunto-esportivo",name:"Calção esportivo",category:"calcoes",price:129.90,images:["public/products/conjunto-esportivo.jpg"],sizes:"Tamanhos a confirmar"},
  {id:"camiseta-estampada",name:"Camiseta estampada",category:"camisetas",price:99.90,images:["public/products/camiseta-estampada.jpg"],sizes:"Tamanhos a confirmar"},
  {id:"camiseta-nike",name:"Camiseta Nike",category:"camisetas",price:99.90,images:["public/products/nike-01.jpg"],sizes:"Tamanhos a confirmar"},
  {id:"conjunto-nike",name:"Conjunto Nike",category:"conjuntos",price:149.90,images:["public/products/nike-02.jpg"],sizes:"Tamanhos a confirmar"},
  {id:"conjunto-jordan-branco",name:"Conjunto Jordan branco",category:"conjuntos",price:200,oldPrice:230,images:["public/products/jordan-branco-01.jpg","public/products/jordan-branco-02.jpg"],sizes:"Tamanhos a confirmar"},
  {id:"conjunto-jordan-preto",name:"Conjunto Jordan preto",category:"conjuntos",price:200,oldPrice:240,images:["public/products/jordan-preto-01.jpg","public/products/jordan-preto-02.jpg"],sizes:"Tamanhos a confirmar"}
];
const currency = value => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
let cart = JSON.parse(localStorage.getItem("phcompany-cart") || "{}");
const grid=document.querySelector("#productGrid"),count=document.querySelector("#cartCount"),drawerCount=document.querySelector("#drawerCount"),cartItems=document.querySelector("#cartItems"),empty=document.querySelector("#emptyCart"),bottom=document.querySelector("#cartBottom"),total=document.querySelector("#cartTotal"),toast=document.querySelector("#toast");
function renderProducts(filter="all"){
 const shown=products.filter(p=>filter==="all"||p.category===filter);document.querySelector("#visibleCount").textContent=String(shown.length).padStart(2,"0");
 const allCount=document.querySelector("#allCount");if(allCount)allCount.textContent=String(products.length).padStart(2,"0");
 if(!shown.length){grid.innerHTML='<p class="catalog-empty">Nenhum produto nesta categoria por enquanto.</p>';return}
 grid.innerHTML=shown.map((p,i)=>`<article class="product-card"><div class="product-image"><img src="${p.images[0]}" alt="${p.name}" loading="lazy" data-product-image="${p.id}" data-image-index="0">${p.oldPrice?'<span class="badge">OFERTA</span>':''}${p.images.length>1?`<button class="gallery-arrow previous" data-gallery="${p.id}" data-direction="-1" aria-label="Foto anterior">‹</button><button class="gallery-arrow next" data-gallery="${p.id}" data-direction="1" aria-label="Próxima foto">›</button><div class="gallery-dots">${p.images.map((_,n)=>`<button class="gallery-dot ${n===0?'active':''}" data-dot="${p.id}" data-index="${n}" aria-label="Ver foto ${n+1}"></button>`).join('')}</div>`:''}<span class="image-index">PHC / ${String(products.indexOf(p)+1).padStart(2,"0")}</span></div><div class="product-details"><div><h3 class="product-title">${p.name}</h3><span class="product-category">${p.category==="camisetas"?"Camiseta":p.category==="calcoes"?"Calção":"Conjunto"}</span></div><div class="price">${p.oldPrice?`<span class="old-price">${currency(p.oldPrice)}</span>`:""}${currency(p.price)}</div></div><div class="product-actions"><span class="sizes">${p.sizes}</span><button class="add-button" data-add="${p.id}">Adicionar <span>＋</span></button></div></article>`).join("");
 grid.querySelectorAll("[data-gallery]").forEach(button=>button.addEventListener("click",()=>setProductImage(button.dataset.gallery,Number(button.dataset.direction),true)));
 grid.querySelectorAll("[data-dot]").forEach(button=>button.addEventListener("click",()=>setProductImage(button.dataset.dot,Number(button.dataset.index),false)));
 grid.querySelectorAll("[data-add]").forEach(button=>button.addEventListener("click",()=>{const id=button.dataset.add;cart[id]=(cart[id]||0)+1;saveCart();showToast("Adicionado à sacola");}));
}
function setProductImage(id,value,relative){const p=products.find(item=>item.id===id);const img=grid.querySelector(`[data-product-image="${id}"]`);if(!img)return;let index=Number(img.dataset.imageIndex);index=relative?(index+value+p.images.length)%p.images.length:value;img.dataset.imageIndex=index;img.src=p.images[index];grid.querySelectorAll(`[data-dot="${id}"]`).forEach(dot=>dot.classList.toggle("active",Number(dot.dataset.index)===index))}
function saveCart(){localStorage.setItem("phcompany-cart",JSON.stringify(cart));renderCart()}
function renderCart(){const entries=products.filter(p=>cart[p.id]>0);const qty=entries.reduce((n,p)=>n+cart[p.id],0);count.textContent=qty;drawerCount.textContent=`(${qty})`;empty.classList.toggle("show",!entries.length);bottom.classList.toggle("hide",!entries.length);cartItems.innerHTML=entries.map(p=>`<div class="cart-row"><img class="cart-thumb" src="${p.images[0]}" alt=""><div><h3 class="cart-row-title">${p.name}</h3><div class="cart-row-price">${currency(p.price)} cada</div><div class="qty-control"><button aria-label="Diminuir ${p.name}" data-qty="${p.id}" data-step="-1">−</button><span>${cart[p.id]}</span><button aria-label="Aumentar ${p.name}" data-qty="${p.id}" data-step="1">+</button></div><button class="remove-item" data-remove="${p.id}">Remover</button></div><span class="row-total">${currency(p.price*cart[p.id])}</span></div>`).join("");total.textContent=currency(entries.reduce((n,p)=>n+p.price*cart[p.id],0));cartItems.querySelectorAll("[data-qty]").forEach(b=>b.onclick=()=>{const id=b.dataset.qty;cart[id]+=Number(b.dataset.step);if(cart[id]<=0)delete cart[id];saveCart()});cartItems.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{delete cart[b.dataset.remove];saveCart()})}
function openCart(){document.querySelector("#cartDrawer").classList.add("open");document.querySelector("#cartDrawer").setAttribute("aria-hidden","false");document.querySelector("#overlay").classList.add("open");document.body.classList.add("locked")}
function closeCart(){document.querySelector("#cartDrawer").classList.remove("open");document.querySelector("#cartDrawer").setAttribute("aria-hidden","true");document.querySelector("#overlay").classList.remove("open");document.body.classList.remove("locked")}
function showToast(message){toast.textContent=message;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)}
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelector(".filter.active").classList.remove("active");b.classList.add("active");renderProducts(b.dataset.filter)}));
document.querySelector("#openCart").onclick=openCart;document.querySelector("#closeCart").onclick=closeCart;document.querySelector("#overlay").onclick=closeCart;document.querySelector("#continueShopping").onclick=()=>{closeCart();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"})};document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCart()});
document.querySelector("#menuToggle").onclick=()=>document.querySelector(".nav").classList.toggle("open");document.querySelectorAll(".nav a").forEach(a=>a.onclick=()=>document.querySelector(".nav").classList.remove("open"));
document.querySelector("#checkout").onclick=()=>{if(!WHATSAPP_NUMBER){showToast("WhatsApp da loja ainda precisa ser configurado.");return}const lines=products.filter(p=>cart[p.id]>0).map(p=>`• ${p.name} — ${cart[p.id]} x ${currency(p.price)} = ${currency(p.price*cart[p.id])}`);const sum=products.reduce((n,p)=>n+(cart[p.id]||0)*p.price,0);const message=`Olá! Quero fazer este pedido na PH Company:\n\n${lines.join("\n")}\n\nTotal: ${currency(sum)}\n\nGostaria de confirmar tamanhos, disponibilidade e entrega.`;window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer")};
renderProducts();renderCart();
async function loadCatalogProducts(){
 const cfg=window.PH_SUPABASE_CONFIG;
 if(!cfg?.url||!cfg?.publishableKey||!window.supabase?.createClient)return;
 try{
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
  const {data,error}=await client.from("ph_products").select("id,name,category,price,old_price,image_urls,sizes,active").eq("active",true).order("sort_order");
  if(error)throw error;
  products=(data||[]).map(p=>({id:p.id,name:p.name,category:p.category,price:Number(p.price),oldPrice:p.old_price==null?null:Number(p.old_price),images:p.image_urls?.length?p.image_urls:["public/ph-company-logo-round.png"],sizes:p.sizes||"Consulte tamanhos"}));renderProducts(document.querySelector(".filter.active")?.dataset.filter||"all");renderCart()
 }catch(error){console.warn("Não foi possível carregar o catálogo online; exibindo os produtos locais.",error)}
}
loadCatalogProducts();
