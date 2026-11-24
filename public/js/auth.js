/* =========================================
   INICIO DE SESIÓN, REGISTRO Y RECUPERACIÓN
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-toggle-password]").forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.togglePassword);
            if (!input) return;
            const visible = input.type === "password";
            input.type = visible ? "text" : "password";
            button.innerHTML = visible
                ? '<i class="bi bi-eye-slash"></i>'
                : '<i class="bi bi-eye"></i>';
            button.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
        });
    });

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const recoverForm = document.getElementById("recoverForm");

    const run=(form,fn)=>form?.addEventListener('submit',async event=>{event.preventDefault();const b=form.querySelector('button[type=submit]');if(b)b.disabled=true;try{await fn();}catch(e){alert(e.message);}finally{if(b)b.disabled=false;}});
    const val=id=>document.getElementById(id).value;
    run(loginForm,async()=>{await AtlanticCity.api('/auth/login','POST',{correo:val('loginEmail'),password:val('loginPassword')});location.href='dashboard.html';});
    run(registerForm,async()=>{await AtlanticCity.api('/auth/registro','POST',{...AtlanticCity.split(val('registerName')),correo:val('registerEmail'),telefono:val('registerPhone'),password:val('registerPassword')});location.href='dashboard.html';});
    run(recoverForm,async()=>alert('Recuperación de contraseña pendiente. No se envían correos en esta demostración.'));
});
