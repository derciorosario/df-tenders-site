let server_url="https://df-tenders-production.up.railway.app" // "https://df-tenders-production.up.railway.app"// //"https://df-tenders.onrender.com"
let user_session
let data
let pending_tenders=[]
let global_pendings=[]
let my_socket=io(server_url)
let l_t

//change page
document.querySelectorAll('._nav-link[link_page]').forEach(e=>{
    e.addEventListener('click',()=>{

        if(e.getAttribute('link_page')=="logout"){
           return
        }

         let last_active=document.querySelector('._nav-link.active').getAttribute('link_page')
         document.querySelectorAll('.main-dashboard > .content').forEach(e=>{ e.style.display="none"})
         document.querySelectorAll('[link_page]').forEach(e=>{ e.classList.remove('active')})
         document.querySelectorAll(`[link_page="${e.getAttribute('link_page')}"]`).forEach(f=>f.classList.add('active')) 
         document.querySelector(`[page="${e.getAttribute('link_page')}"]`).style.display="block"
         if(last_active!=e.getAttribute('link_page')){
             track_action({action:'change_menu_tab',details:{tab_name:e.getAttribute('link_page')}})
             document.querySelectorAll('.container .main-dashboard .content').forEach(e=>e.scrollTop=0)
         } 
         if(e.getAttribute('link_page')=="notifications") see_not()
         if(e.getAttribute('link_page')!="notifications" && last_active=="notifications") remove_new_seen_nots()
    })
})


const all_tender_details = [
  "tender_type",
  "eligibility_criteria",
  "bid_submission_process",
  "award_date",
  "tender_status",
  "budget",
  "tender_deadline",
  "tendering_organization",
  "tender_documents",
  "opening_date",
  "number_of_Lots",
  "opening_time",
  "currency",
  "additional_information",
  "competition_number",
  "estimated_value",
  "modality",
  "publication_date",
  "phone",
  "address",
  "email",
  "province",
  "company_logo_url"
];

function update_all(){

  document.querySelectorAll('.container .main-dashboard .content').forEach(e=>e.scrollTop=0)
  if(data.profile.guest){
     document.querySelector('body > .container').classList.add('guest')
     document.querySelector('.content.tenders .center ._top .options .see').style.display="none"
  }else{
     document.querySelector('body > .container').classList.remove('guest')
     document.querySelector('.content.tenders .center ._top .options .see').style.display="flex"
  }

  if(data.profile.admin){
    document.querySelector('body > .container').classList.add('admin')
    document.querySelector('.content.tenders .center ._top .options .edit-see').style.display="flex"
  }else{
    document.querySelector('body > .container').classList.remove('admin')
    document.querySelector('.content.tenders .center ._top .options .edit-see').style.display="none"
  }

  add_tenders(data.tenders)
  if(!data.profile.guest) add_settings(data.settings)
  if(!data.profile.guest) add_profile()
  add_notifications(data.notifications)
  add_cat(data.settings)
 // tender_cats()
}

function add_profile(){
    document.querySelectorAll('.content > .top .user .username').forEach(e=>{
       e.innerHTML=data.session.name.length <= 25 ? data.session.name : data.session.name.slice(0,25)+"..."
    })
    document.querySelector('.profile .username .res').innerHTML=data.session.name
    document.querySelector('.profile .email .res').innerHTML=data.session.email
    //setttings
    document.querySelector('.content.settings > .center .option.receive_nots > div').classList.remove('loading')
    if(!data.profile.tender_email_nots){
      document.querySelector('.content.settings > .center .option.receive_nots .switch').classList.remove('active')
    }else{
      document.querySelector('.content.settings > .center .option.receive_nots .switch').classList.add('active')
    }
}

const floatContainer=document.querySelectorAll('.float')
function handleDocumentClick(event) {
    var target = event.target;
    floatContainer.forEach(e=>{
        if (target !== e && !e.contains(target)) { 
           if(e.classList.contains('show')) {
             e.classList.remove('show')
           }
        }
    })
  }
  function support(){
      setTimeout(()=>document.querySelector('.pop-ups .tech-info').classList.add('show'),100)
  }

  function Clipboard(text){
    let clipboard=document.querySelector('#copy-to-clipboard')
    clipboard.value=text
    clipboard.select()
    document.execCommand('copy')
  }
  
  function copyTechInfo(text){
    Clipboard(text)
    setTimeout(()=>document.querySelector('.pop-ups .tech-info').classList.remove('show'),100)
  }

  function handle_popup(action,name){
     if(name=="profile"){
           if(action=="open"){
                setTimeout(()=>document.querySelector('.pop-ups .profile').classList.add('show'),100)
                if(!document.querySelector('.pop-ups .profile').classList.contains('loading')){
                    document.querySelectorAll('.pop-ups .profile ._option').forEach(e=>e.classList.remove('edit'))
                    document.querySelectorAll('.pop-ups .profile input').forEach(e=>e.value="")
                }
           }
     }

     document.querySelectorAll('.pop-ups .c .msg').forEach(e=>e.classList.remove('show'))
  }

  let msg_timeout
  async function handle_profile(action){
       clearTimeout(msg_timeout)
       msg_timeout=setTimeout(()=>document.querySelector('.pop-ups .profile .msg').classList.remove('show'),3000)
       if(action=="password"){
         let last_password=document.querySelector('.pop-ups .profile input.last-pw').value 
         let new_password=document.querySelector('.pop-ups .profile input.new-pw').value
         if(!c_text(new_password) || !c_text(last_password)){
             document.querySelector('.pop-ups .profile .msg').innerHTML="Preencha todos campos de senha!"
             document.querySelector('.pop-ups .profile .msg').classList.add('show')
             return
         }
         if(c_text(new_password).length < 8){
          document.querySelector('.pop-ups .profile .msg').innerHTML="Senha deve ter pelo menos 8 carateres!"
          document.querySelector('.pop-ups .profile .msg').classList.add('show')
          return
         }
         if(new_password == last_password){
            document.querySelector('.pop-ups .profile .msg').innerHTML="As senhas devem ser diferentes!"
            document.querySelector('.pop-ups .profile .msg').classList.add('show')
            return
         }

         document.querySelector('.pop-ups .profile').classList.add('loading')

         try {
          const response = await fetch(server_url+"/change_password", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({new_password, last_password,session:data.session.session,code:data.session.code}),
          });

          clearTimeout(msg_timeout)
          msg_timeout=setTimeout(()=>document.querySelector('.pop-ups .profile .msg').classList.remove('show'),5000)
          document.querySelector('.pop-ups .profile').classList.remove('loading')
      
          if (response.ok) {
            const result = await response.json();
            if(result.code==0){
              localStorage.setItem('user_session',JSON.stringify(result.data.session))
              document.querySelector('.pop-ups .profile input.last-pw').value=""
              document.querySelector('.pop-ups .profile input.new-pw').value=""
              setTimeout(()=>alert('Senha alterada!'),100)
            }else if(result.code==1){
              document.querySelector('.pop-ups .profile .msg').innerHTML="Senha incorrecta!"
              document.querySelector('.pop-ups .profile .msg').classList.add('show')
            }else{
              document.querySelector('.pop-ups .profile .msg').innerHTML="Erro, tente novamente!"
              document.querySelector('.pop-ups .profile .msg').classList.add('show')
            }
          } else {
            document.querySelector('.pop-ups .profile .msg').innerHTML="Erro, tente novamente!"
            document.querySelector('.pop-ups .profile .msg').classList.add('show')
            throw new Error('Failed to fetch data');
          }
        } catch (error) {
          document.querySelector('.pop-ups .profile .msg').innerHTML="Erro, tente novamente!"
          document.querySelector('.pop-ups .profile .msg').classList.add('show')
          console.error(error);
        }


       }

       if(action=="username"){
          let username=document.querySelector('.pop-ups .profile input.name').value 
          if(!c_text(username)){
            document.querySelector('.pop-ups .profile .msg').innerHTML="Insira o nome!"
            document.querySelector('.pop-ups .profile .msg').classList.add('show')
            return
          }
          if(username==document.querySelector('.pop-ups .profile .username .res').innerHTML){
            document.querySelector('.pop-ups .profile .msg').innerHTML="Insira um nome diferente!"
            document.querySelector('.pop-ups .profile .msg').classList.add('show')
            return
          }

          document.querySelector('.pop-ups .profile').classList.add('loading')

          try {
              const response = await fetch(server_url+"/change_username", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({name:username,session:data.session.session,code:data.session.code}),
              });
  
              clearTimeout(msg_timeout)
              msg_timeout=setTimeout(()=>document.querySelector('.pop-ups .profile .msg').classList.remove('show'),5000)
              document.querySelector('.pop-ups .profile').classList.remove('loading')
            
              if (response.ok) {
                  const result = await response.json();
                  if(result.code==0){
                    localStorage.setItem('user_session',JSON.stringify(result.data.session))
                    data.session=result.data.session
                    document.querySelector('.pop-ups .profile input.name').value=""
                    add_profile()
                    setTimeout(()=> alert('Nome alterado!'),100)
                  }else{
                    document.querySelector('.pop-ups .profile .msg').innerHTML="Erro, tente novamente!"
                    document.querySelector('.pop-ups .profile .msg').classList.add('show')
                  }
                } else {
                  document.querySelector('.pop-ups .profile .msg').innerHTML="Erro, tente novamente!"
                  document.querySelector('.pop-ups .profile .msg').classList.add('show')
                  throw new Error('Failed to fetch data');
                }
              } catch (error) {
                clearTimeout(msg_timeout)
                msg_timeout=setTimeout(()=>document.querySelector('.pop-ups .profile .msg').classList.remove('show'),5000)
                document.querySelector('.pop-ups .profile .msg').innerHTML="Erro, tente novamente!"
                document.querySelector('.pop-ups .profile .msg').classList.add('show')
                console.error(error);
              }

       }
       
      
  }
  
  document.addEventListener("click", handleDocumentClick);


  function logout(first_log){
      document.querySelector('.splash').style.display="none"
      clear_log_data()
      localStorage.removeItem('user_session')
      if(!first_log){
        document.querySelector('.__log').className="__log login"
        document.querySelector('.__log').style.display="block"
      }
      
  }


 async function change_profile(profile,action){
           track_action({action:'change_profile'})
          try {
          const response = await fetch(server_url+"/change_profile", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({session:data.session.session,profile}),
          });
      
        if (response.ok) {
              //const result = await response.json();
              data.profile.tender_email_nots=profile.tender_email_nots
              if(action=='email_not'){
                  document.querySelector('.content.settings > .center .option.receive_nots > div').classList.remove('loading')
                  if(profile.tender_email_nots){
                    document.querySelector('.content.settings > .center .option.receive_nots .switch').classList.add('active')
                  }else{
                    document.querySelector('.content.settings > .center .option.receive_nots .switch').classList.remove('active')
                  }
              }

              if(action=="user_cats"){
                  data.profile.categories=profile.categories
                  document.querySelector('.settings .custom-container._cat').classList.remove('loading')
                  search_tenders(document.querySelector('.content.tenders .search-container input').value)
              }

          } else {
            throw new Error('Failed to fetch data');
          }
        } catch (error) {
          console.error(error);
        }
  }


  let settings={
       email_not:async function(){
        if(document.querySelector('.container.guest')) {
          alert('Faça o registro para receber notificações por email')
          return
        }
        document.querySelector('.main-dashboard > .content.settings .option div').classList.add('loading')
        let profile=JSON.parse(JSON.stringify(data.profile))
        profile.tender_email_nots=!profile.tender_email_nots
        change_profile(profile,'email_not')
       },
       cats:function() {
            let profile=JSON.parse(JSON.stringify(data.profile))
            profile.categories=[]
            document.querySelectorAll('.content.settings .custom-container .cats span input').forEach(c=>{
               if(c.checked){
                  if(c.getAttribute('_id'))  profile.categories.push(data.settings.tender_categories.filter(_c=>_c.id==c.getAttribute('_id'))[0])
               }
            })
            document.querySelector('.settings .custom-container._cat').classList.add('loading')
            change_profile(profile,'user_cats')
       } 
  }

  function init_settings(){
     if(window.innerWidth < 700){
         document.querySelector('.content.tenders .search-container input').placeholder="Pesquisar"
     }
  }

  init_settings()
  function show_tender_preview(id){
    track_action({action:'open_tender',details:{tender_id:id}})
    document.querySelector('.pop-ups .tender_preview').classList.add('loading')
    let item=data.tenders.filter(t=>t.id==id)[0]
    c=document.querySelector('.pop-ups .tender_preview .preview')
    c.removeChild(document.querySelector('.pop-ups .tender_preview .preview iframe'))
    let iframe=document.createElement('iframe')
    iframe.width="100%"
    iframe.height="100%"
    iframe.src=`https://drive.google.com/file/d/${item.download_file}/preview`
    c.appendChild(iframe)
    iframe.onload=()=>{
      document.querySelector('.pop-ups .tender_preview').classList.remove('loading')
    }
    document.querySelector('.pop-ups .tender_preview .tender-title label').innerHTML=item.title.slice(0,120) + `${item.title.length > 120 ? '...' :''}`
    document.querySelector('.pop-ups .tender_preview .o.d').setAttribute('onclick',`download_file('${item.id}')`)
    setTimeout(()=>document.querySelector('.pop-ups .tender_preview').classList.add('show'),100)
  }


  function show_tender_details(id){
      let item=data.tenders.filter(t=>t.id==id)[0]
      document.querySelector('.pop-ups .tender').setAttribute('_id',id)
      if(data.profile.active_tender_not) document.querySelector('.pop-ups .tender .o.n').classList[data.profile.active_tender_not.includes(id) ? 'add' :'remove']('active')  
      if(data.profile.saved_tender) document.querySelector('.pop-ups .tender .o.s').classList[data.profile.saved_tender.includes(id) ? 'add' :'remove']('active')  
      document.querySelector('.pop-ups .tender .o.n').setAttribute('onclick',`handle_tender('active_tender_not','${id}')`)
      document.querySelector('.pop-ups .tender .o.s').setAttribute('onclick',`handle_tender('saved_tender','${id}')`)
      document.querySelector('.pop-ups .tender .o.d').setAttribute('onclick',`download_file('${item.id}')`)
      document.querySelector('.pop-ups .tender .o.n').classList[pending_tenders.some(t=>t.action=="active_tender_not" && t.id==id) ? 'add' :'remove']('loading') 
      document.querySelector('.pop-ups .tender .o.s').classList[pending_tenders.some(t=>t.action=="saved_tender" && t.id==id) ? 'add' :'remove']('loading') 

      item.cat=JSON.parse(JSON.stringify(item.category.name))

      if(data.profile.admin){
        document.querySelector('.pop-ups .tender .quick-preview').classList.remove('show_preview')
        c=document.querySelector('.pop-ups .tender .quick-preview')
        c.removeChild(document.querySelector('.pop-ups .tender .quick-preview iframe'))
        let iframe=document.createElement('iframe')
        iframe.width="100%"
        iframe.height="100%"
        iframe.src=`https://drive.google.com/file/d/${item.download_file}/preview`
        c.appendChild(iframe)
      }

      let details=`<div class="_option"><label class="res title" ${data.profile.admin ? 'contenteditable="true"' : ''}>${item.title}</label></div>`
      let details_order=[
        {name:'Categoria',key:'cat'},
        {name:'Prazo do concurso',key:'tender_deadline'},
        {name:'Organização licitante',key:'tendering_organization'},
        {name:'Data de abertura',key:'opening_date'},
        {name:'Situação do concurso',key:'tender_status'},
        {name:'Processo de envio de propostas',key:'bid_submission_process'},
        {name:'Documentos',key:'tender_documents'},
        {name:'Endereço',key:'address'},
        {name:'Telefone',key:'phone'},
        {name:'Budget',key:'budget'},
        {name:'Email',key:'email'},
        {name:'Província',key:'province'},
        {name:'Logo',key:'company_logo_url'}
      ]

      let select_cat="<option>Select</option>"
      if(data.profile.admin){
           data.settings.tender_categories.forEach(c=>{
                 select_cat+=`<option value="${c.id}">${c.name}</option>`
           })
           select_cat=`<select class="select_tender_cat" onchange="edit_tender_cat(this.value)" style="width:200px">${select_cat}</select>`
      }

      details_order.forEach(d=>{
          if(item[d.key] || data.profile.admin) {
             details+=`<div class="_option"><label class="text">${d.name}</label><label class="res"  ${d.key=="cat" ? `cat_id="${item.category.id}"` :''}  _key="${d.key}" ${data.profile.admin ? 'contenteditable="true"' : ''}>${item[d.key]}</label> ${data.profile.admin && d.key=="cat" ? select_cat :''}</div>`
          }
      })

      document.querySelector('.pop-ups .tender .details').innerHTML=details
      document.querySelector('.pop-ups .tender').classList[data.profile.admin ? 'add' :'remove']('edit')  
      if(pending_tenders.some(t=>t.action=="edit" && t.id==item.id)) {
          document.querySelector('.pop-ups .tender').classList.add('loading')
      }else{
          document.querySelector('.pop-ups .tender').classList.remove('loading')
      }
      document.querySelector('.pop-ups .tender').setAttribute('tender_status',item.status)
      setTimeout(()=>document.querySelector('.pop-ups .tender').classList.add('show'),100)
  }


  function edit_tender_cat(cat_id){
      document.querySelector('.pop-ups .tender [_key="cat"]').innerHTML=data.settings.tender_categories.filter(c=>c.id==cat_id)[0].name
      document.querySelector('.pop-ups .tender [_key="cat"]').setAttribute('cat_id',cat_id)
  }

  function change_options(){
     let _cat=document.querySelector('.content.tenders ._top .options .cat select').value
     track_action({action:'change_options',details:{cat:_cat}})
     document.querySelector('.main-dashboard .content .pagination .__content ._navigate input').value=1
     search_tenders(document.querySelector('.content.tenders .search-container input').value)

  }
 

 async  function edit_tender(action){
     let id=document.querySelector('.pop-ups .tender').getAttribute('_id')
     document.querySelector('.pop-ups .tender').classList.add('loading')
     pending_tenders.push({action:'edit',id})
     let title=document.querySelector('.pop-ups .tender .details .title').innerHTML.replace('&nbsp;',' ')
     let tender={id,title}

     document.querySelectorAll('.pop-ups .tender [_key]').forEach(d=>{
           tender[d.getAttribute('_key')]=d.innerHTML.includes('undefined') ? "" : d.innerHTML.replace('&nbsp;',' ')
     })

     let cat_id=document.querySelector('.pop-ups .tender [_key="cat"]').getAttribute('cat_id')
     if(data.settings.tender_categories.some(_c=>_c.id==cat_id)){
           tender.category={id:cat_id,name:data.settings.tender_categories.filter(_c=>_c.id==cat_id)[0].name}
     }else{
           tender.category={id:"",name:""}
     } 


     try {
      const response = await fetch(server_url+"/edit_tender", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({code:data.session.code,session:data.session.session,tender,action})
      });

      pending_tenders=pending_tenders.filter(t=>t.id!=id && t.action!="edit")
      document.querySelectorAll(`.pop-ups .tender[_id="${id}"]`).forEach(e=>e.classList.remove('loading')) 

      if (response.ok) {
            const result = await response.json();
            console.log(result)
            if(result.code==0){
               let _i=data.tenders.findIndex(t=>t.id==id)
               data.tenders[_i]=result.tender
               document.querySelector('.pop-ups .tender').setAttribute('tender_status',result.tender.status)
               search_tenders(document.querySelector('.content.tenders .search-container input').value)
            }else{
               alert('Error while updating tender ID: '+id)
            }
        } else {
          throw new Error('Failed to fetch data');
        }

      } catch (error) {
        alert('Fatal error while updating tender ID: '+id)
        pending_tenders=pending_tenders.filter(t=>t.id!=id && t.action!="edit")
        document.querySelectorAll(`.pop-ups .tender[_id="${id}"]`).forEach(e=>e.classList.remove('loading')) 
        console.error(error);
    }
  }

  function organaize_tenders(new_data,from,show_label){
    let c=document.querySelector('.main-dashboard .content.tenders ._center .items')

   // document.querySelector('.pagination[_from="tenders"]').classList[new_data.length ? 'remove' :'add']('hide')

    if(show_label){
      c.innerHTML+=`<div class="from_section"><span>${from}</span></div>`
    }


  

    let items=new_data
    for (let i = 0; i < items.length; i++) {
        let item=items[i]
      
        let expired_date=false
        let valid_date =true
        if(item.tender_deadline){
            try{
               let dates=item.tender_deadline.split('-')
               let tender_date=`${dates[2]}-${dates[1]}-${dates[0]}`
               expired_date=new Date(data.settings.time.date).getTime() > new Date(tender_date).getTime()
            }catch(e){
               valid_date=false
            }
        }

        let details=""
        let details_order=[
          {name:'Prazo do concurso',key:'tender_deadline'},
          //{name:'Situação do concurso',key:'tender_status'},
          
        ]

        if(!item.company_logo_url){
           details_order.push({name:'Organização',key:'tendering_organization'}) 
        }

        details_order.push({name:'Província',key:'province'})

        let count_details=0
        details_order.forEach(d=>{
            if((count_details <= 4 && item[d.key])) {
               count_details+=1
               details+=`<span _c="${d.key}"><label class="text">${d.name}</label><label class="res">${item[d.key].length > 70 ? item[d.key].slice(0,70)+'...' : item[d.key]}</label></span>`
            }
        })
        let count_found_details=0

        Object.keys(item).forEach(d=>{
           if(all_tender_details.includes(d) && item[d]){
             count_found_details++
           }
        })

        let n_active=''
        if(data.profile.active_tender_not){if(data.profile.active_tender_not.includes(item.id)){n_active="active"}}

        let s_active=''
        if(data.profile.saved_tender){if(data.profile.saved_tender.includes(item.id)){s_active="active"}}
        
        c.innerHTML+=`
        <div class="box __tender" _id="${item.id}" ${expired_date ? 'expired_date' :''}>
        <div class="bg" onclick="show_tender_preview('${item.id}')"></div>
        <div class="top-options">
              <span class="category">${item.category.name}</span>
              <div class="right">
                    <div class="o d" onclick="download_file('${item.id}')">
                         <svg xmlns="http://www.w3.org/2000/svg" height="21" viewBox="0 -960 960 960" width="24" style="fill:rgba(0, 0, 0, .7)"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>
                    </div>
                    <div class="o n ${n_active} ${pending_tenders.some(t=>t.action=="active_tender_not" && t.id==item.id) ? 'loading' :''}" onclick="handle_tender('active_tender_not','${item.id}')">
                         <svg class="filled" xmlns="http://www.w3.org/2000/svg"  style="fill:rgba(0, 0, 0, .7)" viewBox="0 -960 960 960" width="21"><path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160ZM480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80Z"/></svg>
                         <svg class="not-filled" xmlns="http://www.w3.org/2000/svg"  style="fill:rgba(0, 0, 0, .7)" viewBox="0 -960 960 960" width="21"><path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z"/></svg>
                    </div>
                    <div class="o s ${s_active} ${pending_tenders.some(t=>t.action=="saved_tender" && t.id==item.id) ? 'loading' :''}" onclick="handle_tender('saved_tender','${item.id}')">
                         <svg  class="filled" xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960" width="21"  style="fill:rgba(0, 0, 0, .7)"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Z"/></svg>
                         <svg  class="not-filled"  xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="21"  style="fill:rgba(0, 0, 0, .7)"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>
                   </div>
           </div>
        </div> 
        
        <div class="details">
             ${details}
             ${item.company_logo_url ? `<div class="cp_logo"><div class="logo"><img style="display:none" onload="this.style.display='block'" src="https://drive.google.com/uc?export=view&id=${item.company_logo_url}"></div><span>${item.tendering_organization}</span></div>` :''}
        </div>

        ${/*count_found_details  > 2 ||*/ data.profile.admin ? `<div class="show-more" onclick="show_tender_details('${item.id}')">
             <span class="btn-show-more">
               <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" style="fill:var(--main-color)"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>
             </span>
        </div>`:''}
        <div class="empty-div"></div>
        <div class="btn-open" onclick="show_tender_preview('${item.id}')">
              <button>Abrir</button>
        </div>
        <div class="title-c">
            <span class="title">${item.title}</span>
        </div>
   </div>
        `
    }
  }


  function set_pagination_limits(dataLength,pagContainer){
    let res=true
    let show_items=10 //parseInt(pagContainer.querySelector('select').value)
    let pages=Math.ceil(dataLength/show_items) ? Math.ceil(dataLength/show_items) : 1
    pagContainer.querySelector('.input_c .value').innerHTML=pages
    let input_e=pagContainer.querySelector('input')
    if(input_e.value > pages) {
      input_e.value=pages
    }
    if(input_e.value == 0) {
      input_e.value=1
    }
  
    //input_e.setAttribute('last',input_e.value)
    input_e.style.width=`${pages.length*20}px`
    pagContainer.querySelector('.previous').setAttribute('_show',`${input_e.value==1 || pages==1 ? false : true}`)
    pagContainer.querySelector('.next').setAttribute('_show',`${input_e.value==pages || pages==1 ? false : true}`)
    input_e.setAttribute('page',input_e.value)
    return {min:Math.abs(show_items - (show_items*input_e.value)),max:show_items * input_e.value - 1,res}
  }
  
  function pagigation_go_to(to,pagContainer){
      track_action({action:'change_tender_page'})
      input_e=pagContainer.querySelector('input')
      if(to=="previous"){
         input_e.value=parseInt(input_e.value) - 1
      }else{
         input_e.value=parseInt(input_e.value) + 1
      }
      input_e.onkeyup()
  }

  function clear_results(){
    let page=document.querySelector('._nav-link.active').getAttribute('link_page')
    document.querySelector(`.content.${page} .search-container input`).value=''
    if(page == "tenders"){
        document.querySelector('.content.tenders ._top .options .cat select').value="all" 
        search_tenders('')
    }
  }

  function tender_cats(){
      let best_accounts=[]
      data.settings.tender_categories.forEach(c=>{
           best_accounts.push({...c,total:data.tenders.filter(t=>t.category.id.toString()==c.id.toString()).length})
      })

     
      best_accounts=best_accounts.sort((a, b) => b.total - a.total)
      let c=document.querySelector('.main-dashboard .content.tenders ._center .tender_cats')
      c.innerHTML=""

      best_accounts.filter((_c,i)=>i<=3).forEach(_c=>{
          c.innerHTML+=`<span>${_c.name} <label>(${_c.total})</label></span>`
      })
  }


  function add_tenders(new_data){
      new_data=JSON.parse(JSON.stringify(new_data)).reverse()
      let c=document.querySelector('.main-dashboard .content.tenders ._center .items')
      c.innerHTML=""
      let results_c=document.querySelector('.main-dashboard .content.tenders ._center .table_empty_msg')
      let _cat=document.querySelector('.content.tenders ._top .options .cat select').value

      let cat=!_cat || _cat=="all" ? "" : ` em `+ `<label class="cat">${data.settings.tender_categories.filter(_c=>_c.id==_cat)[0].name}</label>`

     if(document.querySelector('.content.tenders .search-container input').value.replace(/\s+/g, ' ').trim()){
         if(new_data.length){
             results_c.innerHTML=`<span class="msg"><label class="count">${new_data.length}</label> resultado${new_data.length >= 2 ? 's':''}${cat}!</span>  <span class="clean" onclick="clear_results()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" width="20"><path d="m249 849-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"></path></svg></span>` 
         }else{
             results_c.innerHTML=`<span class="msg">Nenhum resultado${cat}!</span> <span class="clean" onclick="clear_results()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" width="20"><path d="m249 849-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"></path></svg></span>`  
         }
      }else{
          if(_cat && _cat!="all"){
             results_c.innerHTML=`<span class="msg">${data.settings.tender_categories.filter(_c=>_c.id==_cat)[0].name}</span> <span class="clean" onclick="clear_results()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" width="20"><path d="m249 849-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"></path></svg></span>` 
          }else{
             results_c.innerHTML=``
          }
      }

      const {min,max,res}=set_pagination_limits(new_data.length,document.querySelector('.pagination[_from="tenders"]'))
      if(!res){ return}
      new_data=new_data.filter((_,i)=>i>=min && i<=max)

       let recommended=[]
       if(data.profile.categories) recommended=new_data.filter(t=>data.profile.categories.some(_c=>_c.id==t.category.id))
       let other_tenders=[]
       if(data.profile.categories) other_tenders=new_data.filter(t=>!data.profile.categories.some(_c=>_c.id==t.category.id))
     
       organaize_tenders(recommended,'Recomendados',recommended.length && other_tenders.length ? true : false)
       organaize_tenders(other_tenders,'Outros',recommended.length && other_tenders.length ? true : false)

       if(!data.profile.categories)  organaize_tenders(new_data,'',false)
       
  }



  function mark_liked_cat(element){
      const select_all=document.querySelector('.content.settings .custom-container .cats .c input#settings-cat-all')
    
      if(select_all.checked && element){
        let count_checked=0
    
        document.querySelectorAll('.content.settings .custom-container .cats .c input').forEach(e=>{
          if(e.checked) count_checked++
        })
    
        if(count_checked==0){
          select_all.checked=false
        }
      }
      document.querySelectorAll('.content.settings .custom-container .cats .c input').forEach(e=>{
        if(!element) e.checked=select_all.checked
      })

    
  }
 


  function add_settings(new_data){
    let c=document.querySelector('.main-dashboard .content.settings .custom-container .cats .c')
    c.innerHTML=`<span><input onclick="mark_liked_cat()" type="checkbox" id="settings-cat-all"><label for="settings-cat-all">Todos</label></span>`

     let tender_categories=new_data.tender_categories

     let all_checked=true

     for (let i = 0; i < tender_categories.length; i++) {
         const item = tender_categories[i];
         let checked=''
         if(data.profile.categories) {
            if(data.profile.categories.some(c=>c.id==item.id)) {
                checked='checked'
            }else{
                all_checked=false
            }
         }
         c.innerHTML+=`<span><input _id="${item.id}" ${checked} onclick="mark_liked_cat(this)" type="checkbox" id="settings-cat-${i}"><label for="settings-cat-${i}">${item.name}</label></span>`
     }

     if(all_checked && data.profile.categories) document.querySelector('.content.settings .custom-container .cats span input#settings-cat-all').checked=true
 }

 function add_cat(new_data){
  let available_cats=[] 
  if(data.profile.admin){
    data.tenders.forEach(t=>{if(t.category.name){available_cats.push(t.category.id.toString())}})
  }else{
    data.tenders.forEach(t=>{if(t.status=="approved"){available_cats.push(t.category.id.toString())}})
  }
  
  let c=document.querySelector('.main-dashboard .content.tenders ._top .options .cat select')
  c.innerHTML=`
      <option disabled selected value="">Categorias</option>
      <option value="all">Todos</option>
  `
   let tender_categories=new_data.tender_categories
   for (let i = 0; i < tender_categories.length; i++) {
       const item = tender_categories[i];
       if(available_cats.includes(item.id.toString()))  c.innerHTML+=` <option value="${item.id}">${item.name} (${available_cats.filter(_id=>_id==item.id.toString()).length})</option>`
      
   }
}


function add_last_seen_not(){
  let last_seen=data.notifications.findIndex(n=>n.id==data.profile.last_seen_not)
  let new_nots=last_seen == -1 || !data.notifications ? 0 : last_seen

  const not_container=document.querySelector('.content.notifications .center ._center .items');
  let msg_div=document.createElement('div')
  msg_div.className="not_seen"
  document.querySelectorAll(`.container [link_page="notifications"] .count`).forEach(e=>e.innerHTML=new_nots)
  let new_nots_ids=last_seen == -1 ? [] : data.notifications.map((n,i)=>i < last_seen ? n.id : '').filter(n=>n)

  if(new_nots){
     document.querySelectorAll(`.container [link_page="notifications"]`).forEach(e=>e.classList.add('new_not'))
     msg_div.innerHTML=`<span>Notificações novas (${new_nots})</span>`
     new_nots_ids.forEach(n_id=>document.querySelector(`.content.notifications .center ._center .items [_id="${n_id}"]`).classList.add('not_seen_item')) 
     not_container.insertBefore(msg_div, not_container.firstChild);
  }else{
     document.querySelectorAll(`.container [link_page="notifications"]`).forEach(e=>e.classList.remove('new_not'))
  }
}
function remove_new_seen_nots(){
  const not_container=document.querySelector('.content.notifications .center ._center .items');
  if(document.querySelector('.content.notifications .items .not_seen')) not_container.removeChild(document.querySelector('.content.notifications .items .not_seen'))
  document.querySelectorAll(`.content.notifications .center ._center .items .item`).forEach(e=>e.classList.remove('not_seen_item'))
}

function see_not(){
  let last_not=!data.notifications.length ? "" : data.notifications[0].id
  data.profile.last_seen_not=last_not
  my_socket.emit('last_seen_not',{data:{profile:data.profile},session:data.session})
  add_last_seen_not('seeing_not')
}


function canTrack(){
  if(!window.location.href.includes('/?test') && !localStorage.getItem('test_app') && !window.location.href.includes('127.0.0.1') && !window.location.href.includes('site')){
    return true
  }else{
    return false
  }
}


//usage track
if(canTrack()){
    my_socket.emit('log_usage')  
}else{
    console.log('test log')
}



function countLogs(){
         if(l_t){
           return l_t
         }

        l_t=JSON.parse(localStorage.getItem('l_t'))
        if(l_t){
          l_t.times+=1
          localStorage.setItem('l_t',JSON.stringify(l_t))
          return l_t
        }else{
          l_t={id:Math.random(),times:1}
          localStorage.setItem('l_t',JSON.stringify(l_t))
          return l_t
        }
}


function track_action(data){
  if(canTrack()){
      my_socket.emit('log_actions',data)  
  }else{
      console.log('test action')
  }
}

function navigate_to_page(event){

  if(!event){
    search_tenders(document.querySelector('.content.tenders .search-container input').value)
    return
  }


  let to=document.querySelector('.main-dashboard .content .pagination .__content ._navigate input').value
   if(event.key=="Enter"){

    if(parseInt(to).toString() == "NaN" || parseInt(to) < 0){
      to=1
      document.querySelector('.main-dashboard .content .pagination .__content ._navigate input').value=to
    }

    document.querySelector('.main-dashboard .content .pagination .__content ._navigate input').value=parseInt(to)

    search_tenders(document.querySelector('.content.tenders .search-container input').value)
    
  }
}

my_socket.on('update_user_nots',()=>{
  async  function get_user_nots(){
        try {
          const response = await fetch(server_url+"/get_notifications", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({session:data.session.session,code:data.session.code}),
        });

        if (response.ok) {
              const result = await response.json();

              if(result.code==0){
                data.notifications=result.data.notifications
                search_notifications(document.querySelector('.content.notifications .search-container input').value)
                if(document.querySelector('._nav-link.active').getAttribute('link_page')=="notifications"){
                   document.querySelectorAll(`.container [link_page="notifications"]`).forEach(e=>e.classList.remove('new_not'))
                }
              }
              
          } else {
            throw new Error('Failed to fetch data');
          }
        } catch (error) {
            setTimeout(()=>get_user_nots(),4000)
            console.error(error);
        }
    }

   if(data && localStorage.getItem('user_session'))  get_user_nots()
})


 function add_notifications(new_data){

  let c=document.querySelector('.container .main-dashboard .content.notifications > .center ._center .items')

  c.innerHTML=``
 
  if(data.profile.guest){
    c.innerHTML=`<span class="table_empty_msg">Faça o registro para receber notificações e recomendações.</span>`
    return
  }
  if(!new_data.length && data.notifications.length){
    c.innerHTML=`<span class="table_empty_msg">Nunhum resultado!</span>`
  }

  if(!new_data.length && !data.notifications.length){
    c.innerHTML=`<span class="table_empty_msg">Nenhuma notificação ainda! </br> Selecione suas preferências de categorias em <label class="me">Configurações</label> para receber notificações e recomendações.</span>` 
  }

 

 


   for (let i = 0; i < new_data.length; i++) {
       const item = new_data[i];

       if(item.type=="new_recommended_tender"){
            c.innerHTML+=`
            <div class="item" _id="${item.id}" onclick="show_tender_preview('${item.tender.id}')">
              <div class="__top">
                  <span class="date"><label>${item.date.date}</label>&nbsp; ${item.date.hour}</span>
                  <span class="cat-c"><label class="cat">Concurso </label><label class="type">${item.tender.category.name ? '-':''} ${item.tender.category.name}</label></span>
              </div>
              <div class="text">
                    <p>${item.tender.title}</p> 
              </div>
              <div class="options">
                    <span class="btn-see">Ver</span>
              </div>
            </div>
        `
       }

       let cats=[]
       data.tenders.filter(t=>item.details.tenders_ids.includes(t.id)).forEach(t=>{
         if(!cats.includes(t.category.name))  cats.push(t.category.name)
       })

       
       if(item.type=="new_today_tenders"){
        c.innerHTML+=`
          <div class="item" _id="${item.id}" type="${item.type}">
            <div class="__top">
                <span class="date"><label>${item.date.date}</label>&nbsp; ${item.date.hour}</span>
            </div>
            <div class="text">
                  <p><label class="tender-count">${item.details.tenders_ids.length}</label> <label class="message-text">novos concursos foram adicionados para:</label> <label class="cat-list">${cats.join(', ')}</label></p> 
            </div>
          </div>
        `
      }
     

   }

   add_last_seen_not()
 }


 async function handle_tender(action,id){
    if(action=="active_tender_not"){
      track_action({action:'notify_tender',details:{tender_id:id}})
      document.querySelectorAll(`.__tender[_id="${id}"] .o.n`).forEach(e=>e.classList.add('loading')) 
        pending_tenders.push({action,id})
        try {
          const response = await fetch(server_url+"/handle_tender", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({code:data.session.code,session:data.session.session,action,id})
          });

          pending_tenders=pending_tenders.filter(t=>t.id!=id)
          document.querySelectorAll(`.__tender[_id="${id}"] .o.n`).forEach(e=>e.classList.remove('loading')) 

          if (response.ok) {
                const result = await response.json();
               data.profile=result.data.profile
               document.querySelectorAll(`.__tender[_id="${id}"] .o.n`).forEach(e=>e.classList.toggle('active')) 
            } else {
              throw new Error('Failed to fetch data');
            }
          } catch (error) {
            pending_tenders=pending_tenders.filter(t=>t.id!=id)
            document.querySelectorAll(`.__tender[_id="${id}"] .o.n`).forEach(e=>e.classList.remove('loading')) 
            console.error(error);
        }
    }else if(action=="saved_tender"){
      track_action({action:'save_tender',details:{tender_id:id}})
      document.querySelectorAll(`.__tender[_id="${id}"] .o.s`).forEach(e=>e.classList.add('loading')) 
      pending_tenders.push({action,id})
      try {
        const response = await fetch(server_url+"/handle_tender", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({code:data.session.code,session:data.session.session,action,id})
        });

        pending_tenders=pending_tenders.filter(t=>t.id!=id)
        document.querySelectorAll(`.__tender[_id="${id}"] .o.s`).forEach(e=>e.classList.remove('loading')) 

        if (response.ok) { 
              const result = await response.json();
              data.profile=result.data.profile
              document.querySelectorAll(`.__tender[_id="${id}"] .o.s`).forEach(e=>e.classList.toggle('active')) 
          } else {
            throw new Error('Failed to fetch data');
          }
        } catch (error) {
          pending_tenders=pending_tenders.filter(t=>t.id!=id)
          document.querySelectorAll(`.__tender[_id="${id}"] .o.s`).forEach(e=>e.classList.remove('loading')) 
          console.error(error);
      }
    }

 }



 function get_app_data(){

     let fetch_apis=[
        {
          url:'https://derflash-production.up.railway.app/tenders/'+session.code,
          add_f:add_tenders
        },
        {
          url:'https://derflash-production.up.railway.app/settings/api'+session.code,
          add_f:add_settings
        }
    ]

    for (let i = 0; i < fetch_apis.length; i++) {
    
      async function call_api(i){
        await fetch(fetch_apis[i].url).then(j=>j.json()).then(res=>{
            fetch_apis[i].add_f(res) 
            if(typeof Object !="object"){
                res.forEach(t=>{
                  console.log(t.title)
                })
            }
            console.log(res)
        }).catch(e=>{
            //setTimeout(()=>call_api(i),3000)
        })
    }
    call_api(i)
  }
 }



  function download_file(id){
    track_action({action:'download_tender',details:{tender_id:id}})
    item=data.tenders.filter(t=>t.id==id)[0]
    window.location.href=`https://drive.google.com/uc?id=${item.download_file}&export=download`
    return
    let url='https://df-tenders-production.up.railway.app'+'/download/'+item.download_file
    let title=item.title
    document.querySelectorAll(`.__tender[_id="${id}"]  .o.d`).forEach(e=>e.classList.add('loading'))
    fetch(url)
    .then(response => response.blob())
    .then(blob => {
      var a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      let ext=url.split('.')[url.split('.').length - 1]
      a.download = `(Concurso) ${title.replace(/\s/g, '-')}.${ext}`;
      document.body.appendChild(a);
      a.style.display = 'none';
      a.click();
      document.body.removeChild(a);
      document.querySelectorAll(`.__tender[_id="${id}"]  .o.d`).forEach(e=>e.classList.remove('loading'))

    })
    .catch(error => {
      console.error('Error downloading the file: ', error);
      document.querySelectorAll(`.__tender[_id="${id}"]  .o.d`).forEach(e=>e.classList.remove('loading'))
    });
  }


 /*async function api_get_tenders(){
 let response= await fetch('https://derflash-production.up.railway.app/tenders/api')
 if(response.ok){
     response.json().then(res=>{
        add_tenders(res)
        console.log(res)
     })
 }else{
    setTimeout(()=>api_get_tenders(),1000)
 }
}
api_get_tenders()
*/


function change_signup_log(){
    localStorage.removeItem('signup_email')
    document.querySelector('.__log').className='__log signin'
}
function change_recovery_log(){
  localStorage.removeItem('recover_email')
  document.querySelector('.__log').className='__log forgot-password'
}

async function signup(){
  clearTimeout(msg_timeout)
  msg_timeout=setTimeout(()=>document.querySelector('.__log .signin .msg').innerHTML="",3000)
  let name=document.querySelector('.__log .signin .name').value
  let email=document.querySelector('.__log .signin .email').value
  let password=document.querySelector('.__log .signin .password').value

  if(!c_text(name) || !c_text(email) || !c_text(password)){
    document.querySelector('.__log .signin .msg').innerHTML="Preencha todos campos!"
    return
  }else if(c_text(password).length < 8){
    document.querySelector('.__log .signin .msg').innerHTML="Senha deve ter pelo menos 8 carateres!"
    return
  }else if(!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(c_text(email))){
    document.querySelector('.__log .signin .msg').innerHTML="Email invalido!"
    return
  }else{
    document.querySelector('.__log .signin .msg').innerHTML=""
  }

  document.querySelector('.__log').classList.add('loading');
 
  try {
    const data = { name, email, password};
    localStorage.setItem('signup_email',email)
    const response = await fetch(server_url+"/new_user", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    clearTimeout(msg_timeout)
    msg_timeout=setTimeout(()=>document.querySelector('.__log .signin .msg').innerHTML="",5000)
    document.querySelector('.__log').classList.remove('loading');

    if (response.ok) {
      const result = await response.json();
      if(result.code==0){
          document.querySelector('.__log .confirm-email ._email').innerHTML=email
          document.querySelector('.__log').className="__log confirm-email"
      }else if(result.code==1){
        document.querySelector('.__log .signin .msg').innerHTML="Email já foi registrado!"
      }
    } else {
      document.querySelector('.__log .signin .msg').innerHTML="Erro, tente novamente!"
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    document.querySelector('.__log .signin .msg').innerHTML="Erro, tente novamente!"
    console.error(error);
  }


}


async function confirm_email(){
  clearTimeout(msg_timeout)
  msg_timeout=setTimeout(()=>document.querySelector('.__log .confirm-email .msg').innerHTML="",3000)
  let code=document.querySelector('.__log .confirm-email .code').value
  let email=document.querySelector('.__log .signin .email').value

  if(!c_text(code)){
    document.querySelector('.__log .confirm-email .msg').innerHTML="Insira o código!"
    return
  }else{
    document.querySelector('.__log .confirm-email .msg').innerHTML=""
  }
  document.querySelector('.__log').classList.add('loading');

  localStorage.removeItem('signup_email')

  try {
    const response = await fetch(server_url+"/confirm_email", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({code, email}),
    });
    clearTimeout(msg_timeout)
    msg_timeout=setTimeout(()=>document.querySelector('.__log .confirm-email .msg').innerHTML="",5000)
    

    if (response.ok) {
      const result = await response.json();
      if(result.code==0){
        localStorage.setItem('user_session',JSON.stringify(result.data.session))
        data=result.data
        update_all()
        document.querySelector('.__log').style.display="none"
        document.querySelector('._nav-link[link_page="tenders"]').click()
      }else if(result.code==1){
        document.querySelector('.__log .confirm-email .msg').innerHTML="Código invalido!"
      }else if(result.code==2){
        document.querySelector('.__log .confirm-email .msg').innerHTML="Código já foi usado!"
      }
      document.querySelector('.__log').classList.remove('loading')
    } else {
      document.querySelector('.__log').classList.remove('loading')
      document.querySelector('.__log .confirm-email .msg').innerHTML="Erro, tente novamente!"
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    document.querySelector('.__log').classList.remove('loading')
    document.querySelector('.__log .confirm-email .msg').innerHTML="Erro, tente novamente!"
    console.error(error);
  }
}





async function confirm_forgot_password(){
  clearTimeout(msg_timeout)
  msg_timeout=setTimeout(()=>document.querySelector('.__log .confirm-forgot-password .msg').innerHTML="",3000)
  let code=document.querySelector('.__log .confirm-forgot-password .code').value

  if(!c_text(code)){
    document.querySelector('.__log .confirm-forgot-password .msg').innerHTML="Insira o código!"
    return
  }else{
    document.querySelector('.__log .confirm-forgot-password .msg').innerHTML=""
  }
  document.querySelector('.__log').classList.add('loading');
  
  let email=document.querySelector('.__log .forgot-password .email').value
  localStorage.setItem('recover_email',email)
  try {
    const response = await fetch(server_url+"/confirm_forgot_password", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({code,email}),
    });
    clearTimeout(msg_timeout)
    msg_timeout=setTimeout(()=>document.querySelector('.__log .confirm-forgot-password .msg').innerHTML="",5000)
    document.querySelector('.__log').classList.remove('loading')

    if (response.ok) {
      const result = await response.json();
      if(result.code==0){
        document.querySelector('.__log .confirm-forgot-password ._email').innerHTML=email
        document.querySelector('.__log').className="__log new-password"
        document.querySelector('.__log .new-password').setAttribute('new_code',result.new_code)
      }else if(result.code==1){
        document.querySelector('.__log .confirm-forgot-password .msg').innerHTML="Código invalido!"
      }else if(result.code==2){
        document.querySelector('.__log .confirm-forgot-password .msg').innerHTML="Código usado!"
      }
    } else {
      document.querySelector('.__log .confirm-forgot-password .msg').innerHTML="Erro, tente novamente!"
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    document.querySelector('.__log .confirm-forgot-password .msg').innerHTML="Erro, tente novamente!"
    console.error(error);
  }


}


async function recovery_password(){
  clearTimeout(msg_timeout)
  msg_timeout=setTimeout(()=>document.querySelector('.__log .forgot-password .msg').innerHTML="",3000)
  let email=document.querySelector('.__log .forgot-password .email').value

  if(!c_text(email)){
    document.querySelector('.__log .forgot-password .msg').innerHTML="Insira o email!"
    return
  }else if(!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(c_text(email))){
    document.querySelector('.__log .forgot-password .msg').innerHTML="Email invalido!"
    return
  }else{
    document.querySelector('.__log .forgot-password .msg').innerHTML=""
  }
  document.querySelector('.__log').classList.add('loading');

  localStorage.removeItem('recover_email')

  try {
    const response = await fetch(server_url+"/recovery_password", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email}),
    });
    clearTimeout(msg_timeout)
    msg_timeout=setTimeout(()=>document.querySelector('.__log .forgot-password .msg').innerHTML="",5000)
    document.querySelector('.__log').classList.remove('loading')

    if (response.ok) {
      const result = await response.json();
      if(result.code==0){
        document.querySelector('.__log .confirm-forgot-password ._email').innerHTML=email
        document.querySelector('.__log').className="__log confirm-forgot-password"
      }else if(result.code==1){
        document.querySelector('.__log .forgot-password .msg').innerHTML="Email não registrado!"
      }
    } else {
      document.querySelector('.__log .login .msg').innerHTML="Erro, tente novamente!"
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    document.querySelector('.__log .login .msg').innerHTML="Erro, tente novamente!"
    console.error(error);
  }

}


async function new_password(){
  clearTimeout(msg_timeout)
  msg_timeout=setTimeout(()=>document.querySelector('.__log .new-password .msg').innerHTML="",3000)
  let email=document.querySelector('.__log .forgot-password .email').value
  let code=document.querySelector('.__log .new-password').getAttribute('new_code')
  let password=document.querySelector('.__log .new-password .password').value

  if(!c_text(password)){
    document.querySelector('.__log .new-password .msg').innerHTML="Insira a senha!"
    return
  }else if(c_text(password).length < 8){
    document.querySelector('.__log .new-password .msg').innerHTML="Senha deve ter pelo menos 8 carateres!"
    return
  }else{
    document.querySelector('.__log .new-password .msg').innerHTML=""
  }

  document.querySelector('.__log').classList.add('loading');


  try {
    const response = await fetch(server_url+"/new_password", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email,code,password}),
    });
    clearTimeout(msg_timeout)
    msg_timeout=setTimeout(()=>document.querySelector('.__log .new-password .msg').innerHTML="",5000)

   if (response.ok) {
      const result = await response.json();
      if(result.code==0){
        localStorage.setItem('user_session',JSON.stringify(result.data.session))
        data=result.data
        update_all()
        document.querySelector('.__log').style.display="none"
      }else{
        document.querySelector('.__log .new-password .msg').innerHTML="Erro, tente novamente!"
      }
      document.querySelector('.__log').classList.remove('loading')
    } else {
      document.querySelector('.__log').classList.remove('loading')
      document.querySelector('.__log .new-password .msg').innerHTML="Erro, tente novamente!"
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    document.querySelector('.__log').classList.remove('loading')
    document.querySelector('.__log .new-password .msg').innerHTML="Erro, tente novamente!"
    console.error(error);
  }

}


async function login(){
  clearTimeout(msg_timeout)
  msg_timeout=setTimeout(()=>document.querySelector('.__log .login .msg').innerHTML="",3000)
  let email=document.querySelector('.__log .login .email').value
  let password=document.querySelector('.__log .login .password').value
  if(!c_text(email) || !c_text(password)){
    document.querySelector('.__log .login .msg').innerHTML="Preencha todos campos!"
    return
  }else if(!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(c_text(email))){
    document.querySelector('.__log .login .msg').innerHTML="Email invalido!"
    return
  }else{
    document.querySelector('.__log .login .msg').innerHTML=""
  }
  document.querySelector('.__log').classList.add('loading');


  try {
    const response = await fetch(server_url+"/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({password, email}),
    });
    clearTimeout(msg_timeout)
    msg_timeout=setTimeout(()=>document.querySelector('.__log .login .msg').innerHTML="",5000)
   

    if (response.ok) {
      const result = await response.json();
      if(result.code==0){
        localStorage.setItem('user_session',JSON.stringify(result.data.session))
        document.querySelector('.splash').style.display="flex"
        data=result.data
        update_all()
        document.querySelector('.__log').style.display="none"
        document.querySelector('.splash').style.display="none"
        document.querySelector('._nav-link[link_page="tenders"]').click()
      }else if(result.code==1){
        document.querySelector('.__log .login .msg').innerHTML="Email ou senha invalidos!"
      }
      document.querySelector('.__log').classList.remove('loading')
    } else {
      document.querySelector('.__log').classList.remove('loading')
      document.querySelector('.__log .login .msg').innerHTML="Erro, tente novamente!"
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    document.querySelector('.__log').classList.remove('loading')
    document.querySelector('.__log .login .msg').innerHTML="Erro, tente novamente!"
    console.error(error);
  }

}



function clear_log_data(){
    document.querySelectorAll('.__log input').forEach(e=>e.value="")
}


function c_text(text){
   return text.replace(/\s+/g, ' ').trim()
}


function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}








function search_from_object(object,text){
  let add=false
  Object.keys(object).forEach(k=>{
    if(typeof object[k]=="string"){
       if(object[k].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))){
         add=true
      }
    }
  })

  return add
 
}


function smart_search(searchTerm,items,keys,rate=5){
   searchTerm=searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

        return items.map((item)=>{
             if(!keys){
               keys=Object.keys(item)
             }
             let count_Similarity=0
             let match=false
             Object.keys(item).forEach(k=>{
                 if(item[k] && keys.includes(k) && typeof item[k]=="string"){
                    let totalSimilarity=levenshteinDistance(searchTerm,item[k].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
                    console.log(totalSimilarity)
                    if(totalSimilarity <= rate){
                         match=true
                         count_Similarity+=totalSimilarity
                    }
                 }
             })

             return { item, count_Similarity, match};

         }).filter(result => result.match == true)
         .sort((a, b) => b.count_Similarity - a.count_Similarity)
         .map(result => result.item)
  
}

function on_search_tenders(input){
  if(input) track_action({action:'search_tenders',details:{input}})
  search_tenders(input)
}

function search_tenders(input){
     let _s=document.querySelector('.content.tenders ._top .options .see select').value
     let _cat=document.querySelector('.content.tenders ._top .options .cat select').value
     let _edit=document.querySelector('.content.tenders ._top .options .edit-see select').value
     data.tenders.forEach((t,_i)=>{
        data.tenders[_i].cat=t.category.name 
     })
     let tenders=[]
     if(!input){
      tenders=data.tenders
     }else{

      data.tenders.forEach((t,_i)=>{
          t.cat=t.category.name 
          if(search_from_object(t,input)) {
              tenders.push(t)
          }
      })

      //tenders=smart_search(input,data.tenders,['tendering_organization','title','cat','tender_deadline'],3)
     }
     

     


     if(_s=="saved"){
       tenders=data.profile.saved_tender ? tenders.filter(t=>data.profile.saved_tender.includes(t.id)) : [] 
     }

     if(_s=="notify"){
        tenders=data.profile.active_tender_not ? tenders.filter(t=>data.profile.active_tender_not.includes(t.id)) : [] 
     }

     if(_cat!="all" && _cat){
        tenders=tenders.filter(t=>t.category.id.toString()==_cat.toString()) 
     }

     if(_edit!="all" && _edit && data.profile.admin){
       if(_edit=="pending"){
         tenders=tenders.filter(t=>t.status==_edit || !t.status) 
       }else{
         tenders=tenders.filter(t=>t.status==_edit) 
       }  
     }

     
  
     add_tenders(tenders)
}

function search_notifications(input){
  if(input){
    let notifications=[]
    data.notifications.forEach(n=>{
      if(n.type=="new_recommended_tender"){
        n.details.tender.cat=n.details.tender.category.name
        if(search_from_object(n.details.tender,input)) notifications.push(n)
      }else if(n.type=="new_today_tenders"){
           let tenders=data.tenders.filter(t=>n.details.tenders_ids.includes(t.id))
           let can_show=false
           tenders.forEach(t=>{
               t.cat=t.category.name
               if(search_from_object(t,input))  can_show=true
           })

           if(can_show) notifications.push(n)
      }
    })
  
    add_notifications(notifications)
  }else{
    add_notifications(data.notifications)
  }
  
  
}


function log_guest(action){
  if(action=="guest"){
      if(document.querySelector('body > .container.guest')){
        document.querySelector('.__log').style.display='none'
      }else{
        document.querySelector('.splash').style.display="flex"
        window.location.href="/"
      }
  }else if(action=="login"){
    document.querySelector('.__log').className='__log login'
    document.querySelector('.__log').style.display="flex"
  }else{
    document.querySelector('.__log').style.display="flex"
    document.querySelector('.__log').className='__log signin'
  }

  track_action({action:'log_guest',details:{log:action}})
 
}


async function get_user_data(){

  if(localStorage.getItem('recover_email')){
     document.querySelector('.__log .confirm-forgot-password ._email').innerHTML=localStorage.getItem('recover_email')
     document.querySelector('.__log').className="__log confirm-forgot-password"
     document.querySelector('.splash').style.display="none"
     return
  }

  if(localStorage.getItem('signup_email')){
    document.querySelector('.__log .confirm-email ._email').innerHTML=localStorage.getItem('signup_email')
    document.querySelector('.__log').className="__log confirm-email"
    document.querySelector('.splash').style.display="none"
    return
 }


  let user_session=localStorage.getItem('user_session')
  if(user_session){
    user_session=JSON.parse(user_session)
      try {
      console.log('hi') 
      const response = await fetch(server_url+"/get_user_data", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...user_session,canTrack:canTrack(),l_t:countLogs(),details:{device:navigator.userAgent}}),
      });

  
      if (response.ok) {
        const result = await response.json();
        if(result.code==0){
          data=result.data
          update_all()
          document.querySelector('.__log').style.display="none"
          document.querySelector('._nav-link[link_page="tenders"]').click()
          document.querySelector('.splash').style.display="none"
          my_socket.emit('join',data.session)
        }else{
          logout()
        }
        
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {

      setTimeout(()=> get_user_data(),4000)
      console.error(error);
    }
   
  }else{

    if(countLogs().times>=2 && canTrack()){
      document.querySelector('.__log').style.display="block"
      document.querySelector('.__log .as-guest').style.display="none"
      document.querySelector('.splash').style.display="none"
      track_action({action:'forced_to_login',details:{device:navigator.userAgent}})
      return
    }
    
     //setTimeout(()=>logout('first_log'),1500) 
     user_session=JSON.parse(user_session)

      try {
      const response = await fetch(server_url+"/get_user_guest_data", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({canTrack:canTrack(),l_t:countLogs(),details:{device:navigator.userAgent}}),
      });

  
      if (response.ok) {
        const result = await response.json();
        if(result.code==0){
          data=result.data
          update_all()
          document.querySelector('.__log').style.display="none"
          document.querySelector('._nav-link[link_page="tenders"]').click()
          document.querySelector('.splash').style.display="none"
        }
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      setTimeout(()=> get_user_data(),4000)
      console.error(error);
    }
   

  }
}


companies=[
{
  id:Math.random(),
  name:'Fundo de Energia (FUNAE)',
  about:'O Fundo de Desenvolvimento da Economia Azul, FP - ProAzul, é um mecanismo financeiro do Governo que trabalha em parceria com os diferentes sectores do Estado, sector privado e a sociedade civil para que recursos estratégicos e financeiros sejam alinhados com iniciativas efectivas de exploração sustentável das águas interiores, mar e linha costeira criado pelo decreto 91/2019 de 27 de Novembro.',
  logo_src:'',
  services:[
    {id:Math.random(),name:'Conexão entre fontes de recursos e organizações do sector'},
    {id:Math.random(),name:'Desenho de mecanismos financeiros'},
    {id:Math.random(),name:'Estudo de novas fontes de recursos para a conservação'},
    {id:Math.random(),name:'Seleção e gestão de projectos'},
    {id:Math.random(),name:'Gestão financeira'},
    {id:Math.random(),name:'Compras e contratações'}
  ],
  contact:{email:'info@proazul.gov.mz',webpage:'https://www.proazul.gov.mz',address:'Avenida Emília Daússe, N.º 591, R/C',number:'+258 21 300571'}
},
{
  id:Math.random(),
  name:'Fundo de Energia (FUNAE)',
  about:'O Fundo de Desenvolvimento da Economia Azul, FP - ProAzul, é um mecanismo financeiro do Governo que trabalha em parceria com os diferentes sectores do Estado, sector privado e a sociedade civil para que recursos estratégicos e financeiros sejam alinhados com iniciativas efectivas de exploração sustentável das águas interiores, mar e linha costeira criado pelo decreto 91/2019 de 27 de Novembro.',
  logo_src:'',
  services:[
    {id:Math.random(),name:'Conexão entre fontes de recursos e organizações do sector'},
    {id:Math.random(),name:'Desenho de mecanismos financeiros'},
    {id:Math.random(),name:'Estudo de novas fontes de recursos para a conservação'},
    {id:Math.random(),name:'Seleção e gestão de projectos'},
    {id:Math.random(),name:'Gestão financeira'},
    {id:Math.random(),name:'Compras e contratações'}
  ],
  contact:{email:'info@proazul.gov.mz',webpage:'https://www.proazul.gov.mz',address:'Avenida Emília Daússe, N.º 591, R/C',number:'+258 21 300571'}
}
]

get_user_data()












