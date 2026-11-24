/* =========================================================
   ATLANTIC CITY - PANEL CRM
   Código organizado por secciones y con permisos por rol.
   Maqueta académica: persistencia mediante API y SQL Server.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    try { await AtlanticCity.load(); } catch(e) { alert(e.message); location.href="index.html"; return; }
    async function change(path,method,body) { try { await AtlanticCity.api(path,method,body); await AtlanticCity.load(); renderAll(); AtlanticCity.notify("Operación guardada en SQL Server."); return true; } catch(e) { AtlanticCity.notify(e.message); return false; } }
    let currentUser = AtlanticCity.current();

    // Mostrar u ocultar contraseñas en cualquier formulario del sistema.
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

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    /* -----------------------------------------------------
       1. DATOS INICIALES
       ----------------------------------------------------- */

    const DEFAULT_PLANS = [
        {
            name: "Clásica",
            price: 49,
            description: "Una opción para comenzar a disfrutar de beneficios.",
            benefits: [
                "Acceso a beneficios seleccionados",
                "Información de promociones",
                "Gestión de cuenta en línea",
                "Atención al cliente"
            ]
        },
        {
            name: "Premium",
            price: 99,
            description: "Más beneficios y una experiencia preferencial.",
            benefits: [
                "Todos los beneficios de Clásica",
                "Promociones especiales seleccionadas",
                "Atención preferencial",
                "Beneficios adicionales según condiciones"
            ]
        },
        {
            name: "VIP",
            price: 169,
            description: "Una categoría superior con beneficios exclusivos.",
            benefits: [
                "Todos los beneficios de Premium",
                "Atención prioritaria",
                "Beneficios exclusivos seleccionados",
                "Experiencias especiales según condiciones"
            ]
        }
    ];

    const DEFAULT_PROMOTIONS = [
        {
            id: 1,
            title: "Experiencias especiales",
            description: "Accede a beneficios y actividades según las condiciones de tu membresía.",
            tag: "BENEFICIO"
        },
        {
            id: 2,
            title: "Atención preferencial",
            description: "Consulta con nuestro equipo las ventajas disponibles para cada categoría.",
            tag: "EXCLUSIVO"
        }
    ];

    const STORAGE = {
        plans: "ac_plans",
        promotions: "ac_promotions"
    };

    let plans = AtlanticCity.get(STORAGE.plans, []);
    let promotions = AtlanticCity.get(STORAGE.promotions, []);

    /* -----------------------------------------------------
       2. ELEMENTOS GENERALES Y MODAL
       ----------------------------------------------------- */

    const modalElement = document.getElementById("actionModal");
    const actionModal = new bootstrap.Modal(modalElement);

    let modalAction = null;

    function refreshUser() {
        currentUser = AtlanticCity.current();
    }

    function isAdmin() {
        return currentUser && currentUser.role === "admin";
    }

    function requireClientAction() {
        if (isAdmin()) {
            AtlanticCity.notify(
                "Los administradores no pueden comprar, cambiar ni cancelar membresías."
            );
            return false;
        }

        return true;
    }

    function requireAdminAction() {
        if (!isAdmin()) {
            AtlanticCity.notify("No tienes permisos para realizar esta acción.");
            return false;
        }

        return true;
    }

    function escapeHTML(value = "") {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function openConfirm(title, message, callback) {
        document.getElementById("modalTitle").textContent = title;
        document.getElementById("modalBody").textContent = message;

        modalAction = callback;
        actionModal.show();
    }

    document.getElementById("modalConfirm").addEventListener("click", () => {
        if (typeof modalAction === "function") {
            modalAction();
        }

        modalAction = null;
        actionModal.hide();
    });

    /* -----------------------------------------------------
       3. NAVEGACIÓN Y CONTROL DE ACCESO VISUAL
       ----------------------------------------------------- */

    function showSection(sectionName) {
        const adminSections = [
            "clientes",
            "solicitudes",
            "reportes",
            "configuracion",
            "auditoria", "segmentos", "avisos"
        ];

        if (adminSections.includes(sectionName) && !isAdmin()) {
            AtlanticCity.notify("Esta sección es exclusiva para administradores.");
            return;
        }

        document.querySelectorAll(".content-section").forEach(section => {
            section.classList.remove("active");
        });

        document.querySelectorAll(".side-nav .nav-link").forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.section === sectionName
            );
        });

        const target = document.getElementById(`section-${sectionName}`);

        if (target) {
            target.classList.add("active");
        }

        const activeLink = document.querySelector(
            `[data-section="${sectionName}"] span`
        );

        document.getElementById("pageTitle").textContent = activeLink
            ? activeLink.textContent
            : sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

        document.getElementById("sidebar").classList.remove("open");

        renderAll();
    }

    document.querySelectorAll("[data-section]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.go);
        });
    });

    document.getElementById("menuToggle").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("open");
    });

    document.getElementById("logoutButton").addEventListener("click", async () => {
        try { await AtlanticCity.logout(); window.location.href = "index.html"; } catch(e) { AtlanticCity.notify(e.message); }
    });

    function renderHeader() {
        document.getElementById("sidebarName").textContent = currentUser.name;
        document.getElementById("topbarName").textContent = currentUser.name;

        document.getElementById("sidebarRole").textContent = isAdmin()
            ? "Administrador"
            : "Cliente";

        document.getElementById("sidebarAvatar").textContent =
            AtlanticCity.initials(currentUser.name);

        document.getElementById("welcomeName").textContent =
            currentUser.name.split(" ")[0];

        document.querySelectorAll(".admin-only").forEach(element => {
            element.style.display = isAdmin() ? "" : "none";
        });

        document.querySelectorAll(".client-only").forEach(element => {
            element.style.display = isAdmin() ? "none" : "";
        });

        document.getElementById("membershipNavLabel").textContent = isAdmin() ? "Membresías" : "Mis membresías";

        document.getElementById("adminMembershipNotice").style.display =
            isAdmin() ? "" : "none";

        document.getElementById("clientMembershipActions").style.display =
            isAdmin() ? "none" : "";
    }

    /* -----------------------------------------------------
       4. MEMBRESÍAS
       Solo el cliente puede comprar, cambiar o cancelar.
       ----------------------------------------------------- */

    function renderMemberships() {
        plans = AtlanticCity.get(STORAGE.plans, []);

        const container = document.getElementById("membershipCards");

        container.innerHTML = plans.map((plan, index) => {
            const isCurrent = currentUser.membership === plan.name;

            return `
                <div class="col-lg-4 col-md-6">
                    <article class="membership-card ${index === 1 ? "featured" : ""}">
                        <span class="eyebrow">ATLANTIC CITY</span>

                        <h3>${escapeHTML(plan.name)}</h3>

                        <p class="muted">
                            ${escapeHTML(plan.description)}
                        </p>

                        <div class="membership-price">
                            S/ ${Number(plan.price).toFixed(2)}
                            <small>/ mes (referencial)</small>
                        </div>

                        <ul>
                            ${plan.benefits.map(benefit => `
                                <li>${escapeHTML(benefit)}</li>
                            `).join("")}
                        </ul>

                        ${isAdmin()
                            ? `<button type="button" class="btn btn-outline-gold" data-admin-edit-plan="${escapeHTML(plan.name)}">Editar membresía</button>`
                            : `
                                <button
                                    class="btn ${isCurrent ? "btn-outline-gold" : "btn-gold"}"
                                    data-plan="${escapeHTML(plan.name)}"
                                    ${isCurrent ? "disabled" : ""}
                                >
                                    ${isCurrent
                                        ? "Tu plan actual"
                                        : currentUser.membership
                                            ? "Cambiar a este plan"
                                            : "Comprar membresía"}
                                </button>
                            `
                        }
                    </article>
                </div>
            `;
        }).join("");

        if (isAdmin()) {
            container.querySelectorAll("[data-admin-edit-plan]").forEach(button => {
                button.addEventListener("click", () => {
                    if (!requireAdminAction()) return;
                    showSection("configuracion");
                    const edit = Array.from(document.querySelectorAll("[data-edit-plan]")).find(el => el.dataset.editPlan === button.dataset.adminEditPlan);
                    if (edit) edit.click();
                });
            });
        }
        if (!isAdmin()) {
            container.querySelectorAll("[data-plan]").forEach(button => {
                button.addEventListener("click", () => {
                    buyOrChangeMembership(button.dataset.plan);
                });
            });
        }

        const currentPlan = plans.find(plan => {
            return plan.name === currentUser.membership;
        });

        document.getElementById("currentPlanName").textContent =
            currentPlan
                ? currentPlan.name
                : "Todavía no tienes una membresía";

        document.getElementById("currentPlanInfo").textContent =
            currentPlan
                ? `${currentPlan.description} Precio referencial: S/ ${Number(currentPlan.price).toFixed(2)} al mes.`
                : "Selecciona uno de nuestros planes para comenzar.";

        document.getElementById("currentPlanStatus").textContent =
            currentPlan ? "Activa" : "Sin plan";

        document.getElementById("homeMembership").textContent =
            currentPlan ? currentPlan.name : "Sin membresía";

        document.getElementById("homeMembershipStatus").textContent =
            currentPlan
                ? "Estado: activa"
                : "Explora nuestros planes";
    }

    function buyOrChangeMembership(planName) {
        if (!requireClientAction()) {
            return;
        }

        const selectedPlan = plans.find(plan => plan.name === planName);

        if (!selectedPlan) {
            AtlanticCity.notify("El plan seleccionado ya no está disponible.");
            return;
        }

        if (currentUser.membership === selectedPlan.name) {
            AtlanticCity.notify("Ya tienes esta membresía activa.");
            return;
        }

        const isChanging = Boolean(currentUser.membership);

        const title = isChanging
            ? "Confirmar cambio de membresía"
            : "Confirmar compra de membresía";

        const message = isChanging
            ? `¿Deseas cambiar tu membresía ${currentUser.membership} por ${selectedPlan.name}? El cambio se registrará en esta maqueta.`
            : `¿Deseas adquirir la membresía ${selectedPlan.name} por S/ ${Number(selectedPlan.price).toFixed(2)} al mes? No se realizará un cobro real.`;

        openConfirm(title, message, () => change("/crm/membresia","POST",{id:selectedPlan.id}));
    }

    document.getElementById("changePlanButton").addEventListener("click", () => {
        if (!requireClientAction()) {
            return;
        }

        if (!currentUser.membership) {
            AtlanticCity.notify("Primero debes adquirir una membresía.");
            return;
        }

        const availablePlans = plans.filter(plan => {
            return plan.name !== currentUser.membership;
        });

        if (availablePlans.length === 0) {
            AtlanticCity.notify("No hay otros planes disponibles.");
            return;
        }

        const selectedPlanName = prompt(
            `Tu plan actual es ${currentUser.membership}.\n\nElige uno de estos planes:\n${availablePlans.map(plan => `${plan.name} - S/ ${plan.price}`).join("\n")}\n\nEscribe el nombre del nuevo plan:`
        );

        if (!selectedPlanName) {
            return;
        }

        const selectedPlan = availablePlans.find(plan => {
            return plan.name.toLowerCase() === selectedPlanName.trim().toLowerCase();
        });

        if (!selectedPlan) {
            AtlanticCity.notify("El plan indicado no es válido.");
            return;
        }

        buyOrChangeMembership(selectedPlan.name);
    });

    document.getElementById("cancelPlanButton").addEventListener("click", () => {
        if (!requireClientAction()) {
            return;
        }

        if (!currentUser.membership) {
            AtlanticCity.notify("No tienes una membresía activa para cancelar.");
            return;
        }

        openConfirm(
            "Cancelar membresía",
            `¿Confirmas la cancelación de tu membresía ${currentUser.membership}? Esta acción se registrará en la maqueta.`,
            () => change("/crm/membresia","DELETE")
        );
    });

    /* -----------------------------------------------------
       5. PROMOCIONES
       Los administradores pueden crear y editar promociones.
       ----------------------------------------------------- */

    function renderPromotions() {
        promotions = AtlanticCity.get(STORAGE.promotions, []);
        const container = document.getElementById("promotionsDisplay");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        container.innerHTML = promotions.length
            ? promotions.map((promotion, index) => {
                const expired = promotion.until && new Date(`${promotion.until}T00:00:00`) < today;
                return `
                    <div class="col-md-6 col-xl-4">
                        <article class="promo-card promo-interactive ${index % 2 ? "promo-card-alt" : ""} ${expired ? "promo-expired" : ""}">
                            <div class="d-flex justify-content-between align-items-start gap-2">
                                <span class="promo-tag">${escapeHTML(promotion.tag || "PROMOCIÓN")}</span>
                                ${expired ? '<span class="badge text-bg-secondary">Finalizada</span>' : '<span class="promo-live"><i class="bi bi-stars"></i> Disponible</span>'}
                            </div>
                            <h3>${escapeHTML(promotion.title)}</h3>
                            <p>${escapeHTML(promotion.description)}</p>
                            ${promotion.code ? `<div class="promo-code"><small>CÓDIGO</small><strong>${escapeHTML(promotion.code)}</strong></div>` : ""}
                            ${promotion.until ? `<p class="promo-meta"><i class="bi bi-calendar-event"></i> Válido hasta: ${escapeHTML(promotion.until)}</p>` : ""}
                            ${promotion.conditions ? `<details class="promo-details"><summary>Ver condiciones y detalles</summary><p>${escapeHTML(promotion.conditions)}</p></details>` : ""}
                            ${!isAdmin() ? `<button class="btn btn-gold btn-sm mt-3" data-request-promotion="${promotion.id}" ${expired ? "disabled" : ""}><i class="bi bi-send me-1"></i> Me interesa</button>` : '<small class="text-secondary d-block mt-3">Vista de administración</small>'}
                        </article>
                    </div>
                `;
            }).join("")
            : '<div class="col-12"><p class="empty-state">No hay promociones publicadas.</p></div>';

        container.querySelectorAll("[data-request-promotion]").forEach(button => {
            button.addEventListener("click", () => {
                const selected = promotions.find(item => item.id === Number(button.dataset.requestPromotion));
                if (!selected || isAdmin()) return;
                change("/crm/solicitudes","POST",{promocion:selected.id});
            });
        });
    }

    function resetPromotionForm() {
        document.getElementById("promotionForm").reset();
        document.getElementById("promotionId").value = "";
        document.getElementById("promotionUntil").value = "";
        document.getElementById("promotionConditions").value = "";
        document.getElementById("promotionCode").value = "";
    }

    function renderAdminPromotions() {
        const table = document.getElementById("adminPromotionsTable");

        table.innerHTML = promotions.length
            ? promotions.map(promotion => `
                <tr>
                    <td>${escapeHTML(promotion.title)}</td>
                    <td>${escapeHTML(promotion.description)}</td>
                    <td>${escapeHTML(promotion.tag || "—")}</td>
                    <td>
                        <button
                            class="btn btn-sm btn-outline-gold"
                            disabled data-edit-promotion="${promotion.id}"
                        >
                            Editar
                        </button>
                        <button
                            class="btn btn-sm btn-outline-danger"
                            disabled data-delete-promotion="${promotion.id}"
                        >
                            Eliminar
                        </button>
                    </td>
                </tr>
            `).join("")
            : '<tr><td colspan="4" class="empty-state">No hay promociones registradas.</td></tr>';

        table.querySelectorAll("[data-edit-promotion]").forEach(button => {
            button.addEventListener("click", () => {
                if (!requireAdminAction()) return;

                const promotion = promotions.find(item => {
                    return item.id === Number(button.dataset.editPromotion);
                });

                if (!promotion) return;

                document.getElementById("promotionId").value = promotion.id;
                document.getElementById("promotionTitle").value = promotion.title;
                document.getElementById("promotionDescription").value = promotion.description;
                document.getElementById("promotionTag").value = promotion.tag || "";
                document.getElementById("promotionCode").value = promotion.code || "";
                document.getElementById("promotionUntil").value = promotion.until || "";
                document.getElementById("promotionConditions").value = promotion.conditions || "";

                document.getElementById("promotionTitle").focus();
            });
        });

    }

    document.getElementById("promotionForm").addEventListener("submit", event => { event.preventDefault(); AtlanticCity.notify("Edición de avisos pendiente de migración."); });

    document.getElementById("resetPromotionForm").addEventListener("click", () => {
        resetPromotionForm();
    });

    /* -----------------------------------------------------
       6. ADMINISTRACIÓN DE PLANES
       El administrador solo modifica la definición del plan.
       No administra membresías individuales de clientes.
       ----------------------------------------------------- */

    function resetPlanForm() {
        document.getElementById("planForm").reset();
        document.getElementById("planOriginalName").value = "";
    }

    function renderAdminPlans() {
        const table = document.getElementById("adminPlansTable");

        table.innerHTML = plans.map(plan => `
            <tr>
                <td>${escapeHTML(plan.name)}</td>
                <td>S/ ${Number(plan.price).toFixed(2)}</td>
                <td>${escapeHTML(plan.description)}</td>
                <td>
                    <button
                        class="btn btn-sm btn-outline-gold"
                        data-edit-plan="${escapeHTML(plan.name)}"
                    >
                        Editar
                    </button>
                </td>
            </tr>
        `).join("");

        table.querySelectorAll("[data-edit-plan]").forEach(button => {
            button.addEventListener("click", () => {
                if (!requireAdminAction()) return;

                const plan = plans.find(item => {
                    return item.name === button.dataset.editPlan;
                });

                if (!plan) return;

                document.getElementById("planOriginalName").value = plan.name;
                document.getElementById("planName").value = plan.name;
                document.getElementById("planPrice").value = plan.price;
                document.getElementById("planDescription").value = plan.description;
                document.getElementById("planBenefits").value = plan.benefits.join("\n");

                document.getElementById("planName").focus();
            });
        });
    }

    document.getElementById("planForm").addEventListener("submit", event => {
        event.preventDefault();

        if (!requireAdminAction()) return;

        const originalName = document.getElementById("planOriginalName").value;
        const newName = document.getElementById("planName").value.trim();
        const price = Number(document.getElementById("planPrice").value);
        const description = document.getElementById("planDescription").value.trim();
        const benefits = document.getElementById("planBenefits").value
            .split("\n")
            .map(item => item.trim())
            .filter(Boolean);

        if (!newName || !description || !Number.isFinite(price) || price < 0 || benefits.length === 0) {
            AtlanticCity.notify("Revisa los datos del plan antes de guardarlo.");
            return;
        }

        const duplicate = plans.some(plan => {
            return plan.name.toLowerCase() === newName.toLowerCase()
                && plan.name !== originalName;
        });

        if (duplicate) {
            AtlanticCity.notify("Ya existe un plan con ese nombre.");
            return;
        }

        change("/crm/planes","POST",{id:plans.find(p=>p.name===originalName)?.id||null,name:newName,price,description,benefits}).then(ok=>{if(ok)resetPlanForm();});
    });

    document.getElementById("resetPlanForm").addEventListener("click", () => {
        resetPlanForm();
    });

    /* -----------------------------------------------------
       7. ATENCIÓN AL CLIENTE Y SEGUIMIENTO
       ----------------------------------------------------- */

    document.getElementById("supportForm").addEventListener("submit", event => {
        event.preventDefault();

        const subject = document.getElementById("supportSubject").value;
        const message = document.getElementById("supportMessage").value.trim();

        if (!subject || !message) {
            AtlanticCity.notify("Completa todos los campos.");
            return;
        }

        change("/crm/solicitudes","POST",{subject,message}).then(ok=>{if(ok)event.target.reset();});
    });

    function renderMyTickets() {
        const tickets = AtlanticCity.get(
            AtlanticCity.storage.tickets,
            []
        ).filter(ticket => ticket.userId === currentUser.id);

        const container = document.getElementById("myTickets");

        if (tickets.length === 0) {
            container.innerHTML = `
                <p class="empty-state">
                    Todavía no tienes solicitudes registradas.
                </p>
            `;
            return;
        }

        container.innerHTML = tickets.map(ticket => `
            <div class="ticket-item border-bottom py-3"
                 style="border-color: var(--border) !important;">

                <div class="d-flex justify-content-between flex-wrap gap-2">
                    <strong>${escapeHTML(ticket.subject)}</strong>
                    <span class="status-pill">${escapeHTML(ticket.status)}</span>
                </div>

                <p class="muted my-2">${escapeHTML(ticket.message)}</p>

                ${ticket.response ? `
                    <div class="support-response mt-2">
                        <strong>Respuesta de atención al cliente:</strong>
                        <p class="mb-1">${escapeHTML(ticket.response)}</p>
                    </div>
                ` : ""}

                <small class="muted">${escapeHTML(ticket.date)}</small>
            </div>
        `).join("");
    }

    function renderAllTickets() {
        const tickets = AtlanticCity.get(
            AtlanticCity.storage.tickets,
            []
        );

        const table = document.getElementById("allTickets");
        document.getElementById("pendingTicketsCount").textContent = tickets.filter(ticket => ticket.status === "Pendiente").length;
        document.getElementById("reviewTicketsCount").textContent = tickets.filter(ticket => ticket.status === "En revisión").length;
        document.getElementById("doneTicketsCount").textContent = tickets.filter(ticket => ticket.status === "Atendida").length;
        document.getElementById("totalTicketsCount").textContent = `${tickets.length} solicitudes`;

        table.innerHTML = tickets.length
            ? tickets.map(ticket => `
                <tr>
                    <td>${escapeHTML(ticket.userName)}</td>
                    <td>${escapeHTML(ticket.subject)}</td>
                    <td>${escapeHTML(ticket.message)}</td>
                    <td>${escapeHTML(ticket.date)}</td>
                    <td>
                        <select class="form-select ticket-status"
                                data-ticket="${ticket.id}">
                            <option ${ticket.status === "Pendiente" ? "selected" : ""}>Pendiente</option>
                            <option ${ticket.status === "En revisión" ? "selected" : ""}>En revisión</option>
                            <option ${ticket.status === "Atendida" ? "selected" : ""}>Atendida</option>
                        </select>
                    </td>
                    <td>
                        <textarea
                            class="form-control ticket-response"
                            data-response="${ticket.id}"
                            rows="2"
                            placeholder="Escribir respuesta..."
                        >${escapeHTML(ticket.response || "")}</textarea>
                    </td>
                    <td>
                        <button
                            class="btn btn-sm btn-outline-gold"
                            data-save-ticket="${ticket.id}"
                        >
                            Guardar
                        </button>
                    </td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="7" class="empty-state">
                        No hay solicitudes recibidas.
                    </td>
                </tr>
            `;

        table.querySelectorAll("[data-save-ticket]").forEach(button => {
            button.addEventListener("click", () => {
                if (!requireAdminAction()) return;

                const id = Number(button.dataset.saveTicket);
                const statusInput = table.querySelector(`[data-ticket="${id}"]`);
                const responseInput = table.querySelector(`[data-response="${id}"]`);

                if(statusInput && responseInput) change("/crm/solicitudes/"+id,"PATCH",{status:statusInput.value,response:responseInput.value.trim()});
            });
        });
    }

    /* -----------------------------------------------------
       8. HISTORIAL, CLIENTES Y REPORTES
       ----------------------------------------------------- */

    function renderHistory() {
        const rows = AtlanticCity.get(
            AtlanticCity.storage.history,
            []
        ).filter(item => item.userId === currentUser.id);

        const table = document.getElementById("historyTable");

        table.innerHTML = rows.length
            ? rows.map(item => `
                <tr>
                    <td>${escapeHTML(item.date)}</td>
                    <td>${escapeHTML(item.type)}</td>
                    <td>${escapeHTML(item.detail)}</td>
                    <td><span class="status-pill">${escapeHTML(item.status)}</span></td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="4" class="empty-state">
                        No hay movimientos registrados.
                    </td>
                </tr>
            `;

        document.getElementById("homeMovements").textContent = rows.length;
    }

    function renderClients() {
        const searchText = (document.getElementById("clientSearch").value || "").trim().toLowerCase();
        const users = AtlanticCity.get(AtlanticCity.storage.users, []).filter(user => {
            const searchable = [user.displayId, user.name, user.email, user.phone, user.membership, user.role].join(" ").toLowerCase();
            return searchable.includes(searchText);
        });

        const table = document.getElementById("clientsTable");
        table.innerHTML = users.length
            ? users.map(user => {
                const isSelf = user.id === currentUser.id;
                const isUserAdmin = user.role === "admin";
                return `
                    <tr>
                        <td><small>#${escapeHTML(user.displayId)}</small> ${escapeHTML(user.name)}</td>
                        <td>${escapeHTML(user.email)}</td>
                        <td>${escapeHTML(user.phone || "No registrado")}</td>
                        <td>${escapeHTML(user.membership || "Sin membresía")}</td>
                        <td><span class="role-pill ${isUserAdmin ? "role-admin" : "role-client"}">${isUserAdmin ? "Administrador" : "Cliente"}</span></td>
                        <td>
                            ${isSelf
                                ? '<span class="text-secondary small">Tu cuenta</span>'
                                : `<button class="btn btn-sm ${isUserAdmin ? "btn-outline-light" : "btn-outline-gold"}" data-change-role="${user.id}" data-next-role="${isUserAdmin ? "cliente" : "admin"}">${isUserAdmin ? "Hacer cliente" : "Hacer administrador"}</button>`}
                        </td>
                    </tr>
                `;
            }).join("")
            : '<tr><td colspan="6" class="empty-state">No hay usuarios que coincidan con la búsqueda.</td></tr>';

        table.querySelectorAll("[data-change-role]").forEach(button => {
            button.addEventListener("click", () => {
                if (!requireAdminAction()) return;
                const id = Number(button.dataset.changeRole);
                const nextRole = button.dataset.nextRole;
                const usersList = AtlanticCity.get(AtlanticCity.storage.users, []);
                const target = usersList.find(user => user.id === id);
                if (!target || target.id === currentUser.id) return;

                const actionLabel = nextRole === "admin" ? "convertir en administrador" : "cambiar a cliente";
                openConfirm("Cambiar permisos", `¿Deseas ${actionLabel} a ${target.name}?`, () => {
                    change("/crm/usuarios/"+id,"PATCH",{role:nextRole});
                });
            });
        });
    }

    function renderAudit() {
        const users = AtlanticCity.get(
            AtlanticCity.storage.users,
            []
        );

        const userNames = new Map(
            users.map(user => [user.id, user.name])
        );

        const history = AtlanticCity.get(
            AtlanticCity.storage.history,
            []
        );

        const table = document.getElementById("auditTable");

        table.innerHTML = history.length
            ? history.map(item => `
                <tr>
                    <td>${escapeHTML(item.date)}</td>
                    <td>${escapeHTML(userNames.get(item.userId) || "Usuario no disponible")}</td>
                    <td>${escapeHTML(item.type)}</td>
                    <td>${escapeHTML(item.detail)}</td>
                    <td><span class="status-pill">${escapeHTML(item.status)}</span></td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="5" class="empty-state">
                        Todavía no hay actividades registradas.
                    </td>
                </tr>
            `;
    }

    function renderReports() {
        const users = AtlanticCity.get(
            AtlanticCity.storage.users,
            []
        );

        const tickets = AtlanticCity.get(
            AtlanticCity.storage.tickets,
            []
        );

        const activeMemberships = users.filter(user => {
            return user.role === "cliente" && Boolean(user.membership);
        }).length;

        document.getElementById("reportClients").textContent =
            users.filter(user => user.role === "cliente").length;

        document.getElementById("reportMemberships").textContent =
            activeMemberships;

        document.getElementById("reportTickets").textContent =
            tickets.length;

        document.getElementById("homeTickets").textContent =
            tickets.filter(ticket => ticket.userId === currentUser.id).length;
    }

    document.getElementById("clientSearch").addEventListener("input", () => {
        if (isAdmin()) {
            renderClients();
        }
    });

    /* -----------------------------------------------------
       9. PERFIL DEL USUARIO
       ----------------------------------------------------- */

    document.getElementById("profileForm").addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById("profileName").value.trim();
        const email = document.getElementById("profileEmail").value.trim().toLowerCase();
        const phone = document.getElementById("profilePhone").value.trim();
        const currentPassword = document.getElementById("profilePasswordCurrent").value;
        const newPassword = document.getElementById("profilePasswordNew").value;
        const confirmPassword = document.getElementById("profilePasswordConfirm").value;
        if(newPassword!==confirmPassword) { AtlanticCity.notify("La confirmación no coincide."); return; }
        change("/auth/perfil","PATCH",{...AtlanticCity.split(name),correo:email,telefono:phone,actual:currentPassword,nueva:newPassword}).then(ok=>{if(ok)["profilePasswordCurrent","profilePasswordNew","profilePasswordConfirm"].forEach(id=>document.getElementById(id).value="");});
    });

    function renderProfile() {
        document.getElementById("profileName").value = currentUser.name || "";
        document.getElementById("profileEmail").value = currentUser.email || "";
        document.getElementById("profilePhone").value = currentUser.phone || "";
    }

    /* -----------------------------------------------------
       10. ACTUALIZACIÓN GENERAL
       ----------------------------------------------------- */

    function renderAll() {
        refreshUser();
        renderHeader();
        renderMemberships();
        renderPromotions();
        renderHistory();
        renderMyTickets();
        renderClients();
        renderAllTickets();
        renderReports();
        renderAdminPlans();
        renderAdminPromotions();
        renderAudit();
        renderProfile();
        renderDemoExtras();
    }

    // Módulos adaptados del prototipo anterior al almacenamiento del compañero.
    const visitKey = "ac_demo_cultural_visits", noticeKey = "ac_demo_service_notices";
    const getVisits = () => AtlanticCity.get(visitKey, []);
    const getNotices = () => AtlanticCity.get(noticeKey, []);
    const clients = () => AtlanticCity.get(AtlanticCity.storage.users, []).filter(u => u.role === "cliente");
    const byId = id => document.getElementById(id);
    const rowEmpty = n => `<tr><td colspan="${n}">Sin registros</td></tr>`;
    function segment(u, visits) {
        const own = visits.filter(v => v.userId === u.id), counts = {};
        own.forEach(v => counts[v.kind] = (counts[v.kind] || 0) + 1);
        return {n:own.length, kind:Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0] || "Sin datos", label:own.length >= 3 ? "Frecuente" : own.length ? "Ocasional" : "Sin visitas"};
    }
    function renderDemoExtras() {
        const all = getVisits(), users = clients(), notices = getNotices();
        byId("visitRows").innerHTML = all.filter(v=>isAdmin() || v.userId===currentUser.id).slice().reverse().map(v=>`<tr><td>${escapeHTML(v.day)}</td><td>${escapeHTML(users.find(u=>u.id===v.userId)?.name || "Usuario")}</td><td>${escapeHTML(v.kind)}</td></tr>`).join("") || rowEmpty(3);
        byId("noticeRows").innerHTML = notices.filter(n=>isAdmin() || n.userId===currentUser.id).slice().reverse().map(n=>`<div class="border-bottom py-3"><strong>${escapeHTML(n.message)}</strong><p class="small mb-1">${escapeHTML(n.date)}</p>${isAdmin()?`<small>${escapeHTML(users.find(u=>u.id===n.userId)?.name || "Usuario")}</small>`:""}</div>`).join("") || "No hay notificaciones.";
        if (!isAdmin()) return;
        ["visitUser","noticeUser"].forEach(id=>{const el=byId(id), old=el.value; el.innerHTML=users.map(u=>`<option value="${u.id}">${escapeHTML(u.name)}</option>`).join(""); if(users.some(u=>String(u.id)===old)) el.value=old;});
        byId("segRows").innerHTML = users.map(u=>({u,s:segment(u,all)})).filter(x=>!byId("segFilter").value || x.s.label===byId("segFilter").value).map(({u,s})=>`<tr><td>${escapeHTML(u.name)}</td><td>${s.n}</td><td>${escapeHTML(s.kind)}</td><td>${s.label}</td></tr>`).join("") || rowEmpty(4);
        byId("demoMetrics").innerHTML = [["Visitas registradas",all.length],["Asistentes frecuentes",users.filter(u=>segment(u,all).label==="Frecuente").length],["Avisos de servicio",notices.length]].map(([k,v])=>`<div class="col-md-4"><div class="stat-card"><p>${k}</p><h3>${v}</h3></div></div>`).join("");
        byId("activityMetrics").innerHTML = ["Exposición cultural","Concierto","Taller artístico"].map(k=>{const n=all.filter(v=>v.kind===k).length;return `<p>${k}: ${n}</p><progress class="w-100" max="${Math.max(1,all.length)}" value="${n}"></progress>`;}).join("");
    }
    byId("visitDay").value = new Date().toISOString().slice(0,10);
    byId("segFilter").addEventListener("change",renderDemoExtras);
    byId("visitDemo").addEventListener("submit",e=>{e.preventDefault();if(!requireAdminAction())return;openConfirm("Registrar visita","¿Confirmar el registro de la visita?",()=>change('/crm/visitas','POST',{uid:Number(byId('visitUser').value),day:byId('visitDay').value,kind:byId('visitKind').value}));});
    byId("noticeForm").addEventListener("submit",e=>{e.preventDefault();if(!requireAdminAction())return;openConfirm("Enviar aviso","¿Confirmar el envío del aviso?",()=>change('/crm/avisos','POST',{uid:Number(byId('noticeUser').value),message:byId('noticeKind').value}));});
    byId("autoNotice").addEventListener("click",()=>change('/crm/automatizar','POST',{}));

    renderAll();
});
