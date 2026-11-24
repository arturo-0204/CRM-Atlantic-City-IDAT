/* =========================================
   FUNCIONES COMPARTIDAS Y DATOS DE PRUEBA
   ========================================= */

const AtlanticCity = {
    storage: {
        users: "ac_users",
        currentUser: "ac_current_user",
        history: "ac_history",
        tickets: "ac_tickets"
    },

    cache: {},
    get(key, fallback = []) { return this.cache[key] ?? fallback; },
    save() { throw new Error("Operación pendiente de migración a SQL"); },
    current() { return this.get(this.storage.currentUser, null); },
    async api(path, method="GET", body) {
        const r=await fetch('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'}, ...(body===undefined?{}:{body:JSON.stringify(body)})});
        const data=await r.json(); if(!r.ok) throw new Error(data.mensaje||'Error de consulta'); return data;
    },
    split(name) { const parts=name.trim().split(/\s+/); return {nombres:parts.shift()||'',apellidos:parts.join(' ')||'Demo'}; },
    async load() { this.cache=await this.api('/crm'); },
    async logout() { await this.api('/auth/logout','POST'); },
    notify(message) {
        const toast = document.getElementById("toastMessage");

        if (!toast) {
            alert(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        window.setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    },

    initials(name = "AC") {
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join("");
    }
};

