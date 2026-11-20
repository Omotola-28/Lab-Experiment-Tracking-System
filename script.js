const SUPABASE_URL = "https://lsruyhmdypcxhevcfpve.supabase.co";
const SUPABASE_KEY = "sb_publishable_SB4tKH-8-P5AI7f2SvcbxQ_O6iC9LR3";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// USER REGISTRATION
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const message = document.getElementById("message");

        message.textContent = "Creating account...";

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) {
            message.textContent = error.message;
            return;
        }

        message.textContent = "Registration successful! Check your email to verify your account.";
        registerForm.reset();
    });
}

// USER LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const message = document.getElementById("message");

        message.textContent = "Logging in...";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            message.textContent = error.message;
            return;
        }

        window.location.href = "index.html";
    });
}

// REGISTER A NEW EXPERIMENT
const experimentForm = document.getElementById("experimentForm");

if (experimentForm) {
    experimentForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const message = document.getElementById("experimentMessage");
        message.textContent = "Saving experiment...";

        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError || !sessionData.session) {
            message.textContent = "Please log in first.";
            return;
        }

        const user = sessionData.session.user;

        const experiment = {
            title: document.getElementById("title").value.trim(),
            description: document.getElementById("description").value.trim(),
            researcher_id: user.id,
            start_date: document.getElementById("startDate").value,
            end_date: document.getElementById("endDate").value || null,
            status: document.getElementById("status").value
        };

        const { error } = await supabaseClient
            .from("experiments")
            .insert([experiment]);

        if (error) {
            message.textContent = "Error: " + error.message;
            return;
        }

        message.textContent = "Experiment saved successfully!";
        experimentForm.reset();
    });
}

// OPEN EXPERIMENT REGISTRATION
function addExperiment() {
    window.location.href = "new-experiment.html";
}

// LOAD REAL EXPERIMENTS FROM SUPABASE
async function loadExperiments() {
    const table = document.getElementById("experimentTable");

    if (!table) return;

    table.innerHTML = "<tr><td colspan='4'>Loading experiments...</td></tr>";

    const { data, error } = await supabaseClient
        .from("experiments")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        table.innerHTML = "<tr><td colspan='4'>Could not load experiments.</td></tr>";
        console.error(error.message);
        return;
    }

    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML = "<tr><td colspan='4'>No experiments registered yet.</td></tr>";
        return;
    }

    data.forEach(experiment => {
        const row = document.createElement("tr");

        const title = document.createElement("td");
        title.textContent = experiment.title;

        const researcher = document.createElement("td");
        researcher.textContent = experiment.researcher_id;

        const date = document.createElement("td");
        date.textContent = experiment.start_date || "Not specified";

        const status = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = experiment.status;
        badge.textContent = experiment.status;

        status.appendChild(badge);

        row.append(title, researcher, date, status);
        table.appendChild(row);
    });

    document.getElementById("total").textContent = data.length;
}

// RUN WHEN DASHBOARD OPENS

async function loadExperiments() {
    const table = document.getElementById("experimentTable");
    if (!table) return;

    const { data, error } = await supabaseClient
        .from("experiments")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error.message);
        return;
    }

    const { data: researchers } = await supabaseClient
        .from("researcher_directory")
        .select("id, full_name");

    table.innerHTML = "";

    const names = {};
    (researchers || []).forEach(person => {
        names[person.id] = person.full_name;
    });

    data.forEach(exp => {
        const row = document.createElement("tr");

        const values = [
            exp.title,
            names[exp.researcher_id] || "Researcher",
            exp.start_date || "Not specified"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = exp.status;
        badge.textContent = exp.status;
        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        table.appendChild(row);
    });

    document.getElementById("total").textContent = data.length;
    document.getElementById("ongoingCount").textContent =
        data.filter(e => e.status === "ongoing").length;
    document.getElementById("completedCount").textContent =
        data.filter(e => e.status === "completed").length;
    document.getElementById("pendingCount").textContent =
        data.filter(e => e.status === "pending").length;
}

function showComingSoon(event, section) {
    event.preventDefault();
    alert(section + " module is currently under development.");
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    window.location.href = "login.html";
}

if (document.getElementById("experimentTable")) {
    loadExperiments();
}

// EXPERIMENT MANAGEMENT
let allExperiments = [];

async function loadManagementExperiments() {
    const table = document.getElementById("managementTable");
    if (!table) return;

    const { data, error } = await supabaseClient
        .from("experiments")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        table.innerHTML = "<tr><td colspan='5'>Error loading experiments.</td></tr>";
        console.error(error.message);
        return;
    }

    allExperiments = data || [];
    displayManagementExperiments(allExperiments);
}

function displayManagementExperiments(experiments) {
    const table = document.getElementById("managementTable");
    table.innerHTML = "";

    if (experiments.length === 0) {
        table.innerHTML = "<tr><td colspan='5'>No experiments found.</td></tr>";
        return;
    }

    experiments.forEach(exp => {
        const row = document.createElement("tr");

        const title = document.createElement("td");
        title.textContent = exp.title;

        const start = document.createElement("td");
        start.textContent = exp.start_date || "N/A";

        const end = document.createElement("td");
        end.textContent = exp.end_date || "N/A";

        const status = document.createElement("td");
        status.textContent = exp.status;

        const actions = document.createElement("td");

        const viewBtn = document.createElement("button");
        viewBtn.textContent = "View";
        viewBtn.className = "action-btn view-btn";
        viewBtn.onclick = () => viewExperiment(exp.id);

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "action-btn edit-btn";
        editBtn.onclick = () => editExperiment(exp.id);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "action-btn delete-btn";
        deleteBtn.onclick = () => deleteExperiment(exp.id);

        actions.append(viewBtn, editBtn, deleteBtn);
        row.append(title, start, end, status, actions);
        table.appendChild(row);
    });
}

// VIEW EXPERIMENT
function viewExperiment(id) {
    const exp = allExperiments.find(item => item.id === id);
    if (!exp) return;

    alert(
        "EXPERIMENT DETAILS\n\n" +
        "Title: " + exp.title +
        "\nDescription: " + (exp.description || "None") +
        "\nStart Date: " + (exp.start_date || "N/A") +
        "\nEnd Date: " + (exp.end_date || "N/A") +
        "\nStatus: " + exp.status
    );
}

// EDIT EXPERIMENT
async function editExperiment(id) {
    const exp = allExperiments.find(item => item.id === id);
    if (!exp) return;

    const title = prompt("Experiment title:", exp.title);
    if (title === null) return;

    if (!title.trim()) {
        alert("Experiment title cannot be empty.");
        return;
    }

    const description = prompt(
        "Experiment description:",
        exp.description || ""
    );
    if (description === null) return;

    const status = prompt(
        "Enter status: ongoing, pending, completed or cancelled",
        exp.status
    );
    if (status === null) return;

    if (!["ongoing", "pending", "completed", "cancelled"].includes(status)) {
        alert("Invalid status.");
        return;
    }

    const { error } = await supabaseClient
        .from("experiments")
        .update({
            title: title.trim(),
            description: description.trim(),
            status: status
        })
        .eq("id", id);

    if (error) {
        alert("Update failed: " + error.message);
        return;
    }

    alert("Experiment updated successfully!");
    loadManagementExperiments();
}

// DELETE EXPERIMENT
async function deleteExperiment(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this experiment?"
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from("experiments")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete failed: " + error.message);
        return;
    }

    alert("Experiment deleted successfully!");
    loadManagementExperiments();
}

// SEARCH EXPERIMENTS
const searchInput = document.getElementById("searchExperiment");

if (searchInput) {
    searchInput.addEventListener("input", function() {
        const keyword = this.value.toLowerCase();

        const filtered = allExperiments.filter(exp =>
            exp.title.toLowerCase().includes(keyword) ||
            exp.status.toLowerCase().includes(keyword)
        );

        displayManagementExperiments(filtered);
    });
}

// LOAD MANAGEMENT PAGE
if (document.getElementById("managementTable")) {
    loadManagementExperiments();
}


// OBSERVATIONS MODULE

async function loadObservationExperiments() {
    const select = document.getElementById("experimentSelect");
    if (!select) return;

    const { data, error } = await supabaseClient
        .from("experiments")
        .select("id, title")
        .order("created_at", { ascending: false });

    if (error) {
        select.innerHTML = '<option value="">Could not load experiments</option>';
        console.error(error.message);
        return;
    }

    select.innerHTML = '<option value="">Select an experiment</option>';

    data.forEach(exp => {
        const option = document.createElement("option");
        option.value = exp.id;
        option.textContent = exp.title;
        select.appendChild(option);
    });
}

async function saveObservation(event) {
    event.preventDefault();

    const message = document.getElementById("observationMessage");
    message.textContent = "Saving observation...";

    const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

    if (sessionError || !sessionData.session) {
        message.textContent = "Please log in first.";
        return;
    }

    const experimentId =
        document.getElementById("experimentSelect").value;

    const observation =
        document.getElementById("observationText").value.trim();

    const { error } = await supabaseClient
        .from("observations")
        .insert([{
            experiment_id: Number(experimentId),
            recorded_by: sessionData.session.user.id,
            observation: observation
        }]);

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Observation saved successfully!";
    document.getElementById("observationForm").reset();

    loadObservations();
}

async function loadObservations() {
    const table = document.getElementById("observationsTable");
    if (!table) return;

    const { data, error } = await supabaseClient
        .from("observations")
        .select("id, experiment_id, observation, recorded_at")
        .order("recorded_at", { ascending: false });

    if (error) {
        table.innerHTML = "<tr><td colspan='3'>Error loading observations.</td></tr>";
        console.error(error.message);
        return;
    }

    const { data: experiments } = await supabaseClient
        .from("experiments")
        .select("id, title");

    const titles = {};
    (experiments || []).forEach(exp => {
        titles[exp.id] = exp.title;
    });

    table.innerHTML = "";

    if (!data || data.length === 0) {
        table.innerHTML = "<tr><td colspan='3'>No observations recorded yet.</td></tr>";
        return;
    }

    data.forEach(item => {
        const row = document.createElement("tr");

        const experimentCell = document.createElement("td");
        experimentCell.textContent =
            titles[item.experiment_id] || "Unknown experiment";

        const observationCell = document.createElement("td");
        observationCell.textContent = item.observation;

        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(item.recorded_at).toLocaleString();

        row.append(experimentCell, observationCell, dateCell);
        table.appendChild(row);
    });
}

const observationForm = document.getElementById("observationForm");

if (observationForm) {
    observationForm.addEventListener("submit", saveObservation);
    loadObservationExperiments();
    loadObservations();
}

// EQUIPMENT MANAGEMENT MODULE

async function loadEquipment() {
    const table = document.getElementById("equipmentTable");
    if (!table) return;

    table.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

    const { data, error } = await supabaseClient
        .from("equipment")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        table.innerHTML = "<tr><td colspan='4'>Error loading equipment</td></tr>";
        console.error(error.message);
        return;
    }

    table.innerHTML = "";

    if (!data || data.length === 0) {
        table.innerHTML = "<tr><td colspan='4'>No equipment registered yet.</td></tr>";
        return;
    }

    data.forEach(item => {
        const row = document.createElement("tr");

        const name = document.createElement("td");
        name.textContent = item.name;

        const description = document.createElement("td");
        description.textContent = item.description || "N/A";

        const status = document.createElement("td");
        status.textContent = item.availability_status.replace("_", " ");

        const actions = document.createElement("td");

        const updateBtn = document.createElement("button");
        updateBtn.textContent = "Update Status";
        updateBtn.onclick = () => updateEquipmentStatus(item.id, item.availability_status);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteEquipment(item.id);

        actions.append(updateBtn, deleteBtn);
        row.append(name, description, status, actions);
        table.appendChild(row);
    });
}

async function saveEquipment(event) {
    event.preventDefault();

    const message = document.getElementById("equipmentMessage");
    message.textContent = "Saving equipment...";

    const name = document.getElementById("equipmentName").value.trim();
    const description = document.getElementById("equipmentDescription").value.trim();
    const status = document.getElementById("equipmentStatus").value;

    const { error } = await supabaseClient
        .from("equipment")
        .insert([{
            name: name,
            description: description,
            availability_status: status
        }]);

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Equipment added successfully!";
    document.getElementById("equipmentForm").reset();

    loadEquipment();
}

async function updateEquipmentStatus(id, currentStatus) {
    const statuses = ["available", "in_use", "maintenance"];

    const nextStatus = prompt(
        "Enter new status:\navailable\nin_use\nmaintenance",
        currentStatus
    );

    if (!nextStatus) return;

    if (!statuses.includes(nextStatus.trim().toLowerCase())) {
        alert("Invalid status. Use available, in_use or maintenance.");
        return;
    }

    const { error } = await supabaseClient
        .from("equipment")
        .update({ availability_status: nextStatus.trim().toLowerCase() })
        .eq("id", id);

    if (error) {
        alert("Error: " + error.message);
        return;
    }

    loadEquipment();
}

async function deleteEquipment(id) {
    if (!confirm("Are you sure you want to delete this equipment?")) return;

    const { error } = await supabaseClient
        .from("equipment")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error: " + error.message);
        return;
    }

    alert("Equipment deleted successfully.");
    loadEquipment();
}

const equipmentForm = document.getElementById("equipmentForm");

if (equipmentForm) {
    equipmentForm.addEventListener("submit", saveEquipment);
    loadEquipment();
}



// MATERIALS MANAGEMENT MODULE

async function loadMaterials() {
    const table = document.getElementById("materialsTable");
    if (!table) return;

    table.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

    const { data, error } = await supabaseClient
        .from("materials")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        table.innerHTML = "<tr><td colspan='4'>Error loading materials</td></tr>";
        console.error(error.message);
        return;
    }

    table.innerHTML = "";

    if (!data || data.length === 0) {
        table.innerHTML = "<tr><td colspan='4'>No materials registered yet.</td></tr>";
        return;
    }

    data.forEach(item => {
        const row = document.createElement("tr");

        const name = document.createElement("td");
        name.textContent = item.name;

        const quantity = document.createElement("td");
        quantity.textContent = item.quantity;

        const unit = document.createElement("td");
        unit.textContent = item.unit || "N/A";

        const actions = document.createElement("td");

        const updateBtn = document.createElement("button");
        updateBtn.textContent = "Update Quantity";
        updateBtn.onclick = () => updateMaterialQuantity(item.id, item.quantity);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteMaterial(item.id);

        actions.append(updateBtn, deleteBtn);
        row.append(name, quantity, unit, actions);
        table.appendChild(row);
    });
}

async function saveMaterial(event) {
    event.preventDefault();

    const message = document.getElementById("materialMessage");
    message.textContent = "Saving material...";

    const name = document.getElementById("materialName").value.trim();
    const quantity = Number(document.getElementById("materialQuantity").value);
    const unit = document.getElementById("materialUnit").value.trim();

    const { error } = await supabaseClient
        .from("materials")
        .insert([{
            name: name,
            quantity: quantity,
            unit: unit
        }]);

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Material added successfully!";
    document.getElementById("materialForm").reset();

    loadMaterials();
}

async function updateMaterialQuantity(id, currentQuantity) {
    const newQuantity = prompt(
        "Enter the new quantity:",
        currentQuantity
    );

    if (newQuantity === null) return;

    if (newQuantity.trim() === "" || !Number.isFinite(Number(newQuantity)) || Number(newQuantity) < 0) {
        alert("Enter a valid quantity of zero or more.");
        return;
    }

    const { error } = await supabaseClient
        .from("materials")
        .update({ quantity: Number(newQuantity) })
        .eq("id", id);

    if (error) {
        alert("Error: " + error.message);
        return;
    }

    loadMaterials();
}

async function deleteMaterial(id) {
    if (!confirm("Are you sure you want to delete this material?")) return;

    const { error } = await supabaseClient
        .from("materials")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Error: " + error.message);
        return;
    }

    alert("Material deleted successfully.");
    loadMaterials();
}

const materialForm = document.getElementById("materialForm");

if (materialForm) {
    materialForm.addEventListener("submit", saveMaterial);
    loadMaterials();
}



// REPORTS MODULE

let reportExperiments = [];

async function loadReports() {
    const table = document.getElementById("reportTable");
    const summary = document.getElementById("reportSummary");

    if (!table || !summary) return;

    summary.textContent = "Loading report...";
    table.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

    const { data, error } = await supabaseClient
        .from("experiments")
        .select("title, start_date, end_date, status")
        .order("created_at", { ascending: false });

    if (error) {
        summary.textContent = "Error loading report: " + error.message;
        return;
    }

    reportExperiments = data || [];

    const total = reportExperiments.length;
    const ongoing = reportExperiments.filter(e => e.status === "ongoing").length;
    const completed = reportExperiments.filter(e => e.status === "completed").length;
    const pending = reportExperiments.filter(e => e.status === "pending").length;
    const cancelled = reportExperiments.filter(e => e.status === "cancelled").length;

    summary.innerHTML = `
        <p><strong>Total Experiments:</strong> ${total}</p>
        <p><strong>Ongoing:</strong> ${ongoing}</p>
        <p><strong>Completed:</strong> ${completed}</p>
        <p><strong>Pending:</strong> ${pending}</p>
        <p><strong>Cancelled:</strong> ${cancelled}</p>
    `;

    table.innerHTML = "";

    if (total === 0) {
        table.innerHTML = "<tr><td colspan='4'>No experiment records found.</td></tr>";
        return;
    }

    reportExperiments.forEach(exp => {
        const row = document.createElement("tr");

        [exp.title, exp.start_date || "N/A",
         exp.end_date || "N/A", exp.status].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        table.appendChild(row);
    });
}

function downloadExperimentReport() {
    if (!reportExperiments.length) {
        alert("There are no experiment records to download.");
        return;
    }

    const headers = ["Experiment", "Start Date", "End Date", "Status"];

    const rows = reportExperiments.map(exp => [
        exp.title, exp.start_date || "", exp.end_date || "", exp.status
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"'
        ).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "LabTrack_Experiment_Report.csv";
    link.click();

    URL.revokeObjectURL(url);
}

if (document.getElementById("reportTable")) {
    loadReports();
}


// LABTRACK ROLE MANAGEMENT

let currentUserRole = null;

async function checkUserRole() {
    const { data: sessionData } =
        await supabaseClient.auth.getSession();

    if (!sessionData.session) {
        window.location.href = "login.html";
        return;
    }

    const user = sessionData.session.user;

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        alert("Unable to retrieve your user profile.");
        return;
    }

    currentUserRole = profile.role;

    const roleDisplay = document.getElementById("userRole");
    if (roleDisplay) {
        roleDisplay.textContent =
            profile.full_name + " (" + currentUserRole + ")";
    }

    // Restrict pages based on their data-roles attribute
    const allowedRoles = document.body.dataset.roles;

    if (allowedRoles) {
        const permitted = allowedRoles.split(",");

        if (!permitted.includes(currentUserRole)) {
            document.body.innerHTML = `
                <div style="padding:40px;text-align:center">
                    <h2>Access Denied</h2>
                    <p>You do not have permission to access this page.</p>
                    <a href="index.html">Return to Dashboard</a>
                </div>
            `;
        }
    }
}

// Run role checking on application pages
if (!["login.html", "register.html"].includes(
    window.location.pathname.split("/").pop()
)) {
    checkUserRole();
}


// ===================================
// ADMIN USER MANAGEMENT
// ===================================

let registeredUsers = [];

async function loadUsers() {
    const table = document.getElementById("usersTable");
    if (!table) return;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, email, role")
        .order("created_at", { ascending: false });

    if (error) {
        table.innerHTML =
            "<tr><td colspan='4'>Error loading users: " +
            error.message + "</td></tr>";
        return;
    }

    registeredUsers = data || [];
    displayUsers(registeredUsers);
}

function displayUsers(users) {
    const table = document.getElementById("usersTable");
    if (!table) return;

    table.innerHTML = "";

    if (!users.length) {
        table.innerHTML =
            "<tr><td colspan='4'>No users found.</td></tr>";
        return;
    }

    users.forEach(user => {
        const row = document.createElement("tr");

        const name = document.createElement("td");
        name.textContent = user.full_name || "Unnamed";

        const email = document.createElement("td");
        email.textContent = user.email || "N/A";

        const roleCell = document.createElement("td");
        const roleSelect = document.createElement("select");

        ["admin", "researcher", "laboratory_personnel", "supervisor"]
            .forEach(role => {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role.replace("_", " ");
                if (role === user.role) option.selected = true;
                roleSelect.appendChild(option);
            });

        roleCell.appendChild(roleSelect);

        const actionCell = document.createElement("td");
        const saveButton = document.createElement("button");
        saveButton.textContent = "Save Role";

        saveButton.onclick = async () => {
            if (!confirm("Change this user's role?")) return;

            const { error } = await supabaseClient
                .from("profiles")
                .update({ role: roleSelect.value })
                .eq("id", user.id);

            const message = document.getElementById("usersMessage");

            if (error) {
                message.textContent = "Error: " + error.message;
                return;
            }

            message.textContent = "User role updated successfully.";
            loadUsers();
        };

        actionCell.appendChild(saveButton);
        row.append(name, email, roleCell, actionCell);
        table.appendChild(row);
    });
}

const userSearch = document.getElementById("userSearch");

if (userSearch) {
    userSearch.addEventListener("input", () => {
        const term = userSearch.value.toLowerCase();

        displayUsers(registeredUsers.filter(user =>
            (user.full_name || "").toLowerCase().includes(term) ||
            (user.email || "").toLowerCase().includes(term)
        ));
    });
}

if (document.getElementById("usersTable")) {
    loadUsers();
}


// ===================================
// EXPERIMENT ACTIVITY HISTORY
// ===================================

async function loadActivityExperiments() {
    const select = document.getElementById("activityExperiment");
    if (!select) return;

    const { data, error } = await supabaseClient
        .from("experiments")
        .select("id, title")
        .order("created_at", { ascending: false });

    if (error) {
        select.innerHTML = "<option value=''>Unable to load experiments</option>";
        return;
    }

    select.innerHTML = "<option value=''>Select an experiment</option>";

    (data || []).forEach(exp => {
        const option = document.createElement("option");
        option.value = exp.id;
        option.textContent = exp.title;
        select.appendChild(option);
    });
}

async function saveActivity(event) {
    event.preventDefault();

    const message = document.getElementById("activityMessage");
    message.textContent = "Saving update...";

    const { data: sessionData } =
        await supabaseClient.auth.getSession();

    if (!sessionData.session) {
        message.textContent = "Please log in again.";
        return;
    }

    const experimentId =
        document.getElementById("activityExperiment").value;

    const details =
        document.getElementById("activityDetails").value.trim();

    const { error } = await supabaseClient
        .from("experiment_updates")
        .insert([{
            experiment_id: Number(experimentId),
            updated_by: sessionData.session.user.id,
            update_details: details
        }]);

    if (error) {
        message.textContent = "Error: " + error.message;
        return;
    }

    message.textContent = "Activity recorded successfully!";
    document.getElementById("activityForm").reset();
    loadActivityHistory();
}

async function loadActivityHistory() {
    const table = document.getElementById("activityTable");
    if (!table) return;

    table.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

    const { data, error } = await supabaseClient
        .from("experiment_updates")
        .select("id, experiment_id, update_details, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        table.innerHTML =
            "<tr><td colspan='3'>Error: " + error.message + "</td></tr>";
        return;
    }

    const { data: experiments } = await supabaseClient
        .from("experiments")
        .select("id, title");

    const titles = {};
    (experiments || []).forEach(exp => {
        titles[exp.id] = exp.title;
    });

    table.innerHTML = "";

    if (!data || data.length === 0) {
        table.innerHTML =
            "<tr><td colspan='3'>No activities recorded yet.</td></tr>";
        return;
    }

    data.forEach(item => {
        const row = document.createElement("tr");

        const experiment = document.createElement("td");
        experiment.textContent =
            titles[item.experiment_id] || "Unknown experiment";

        const details = document.createElement("td");
        details.textContent = item.update_details;

        const date = document.createElement("td");
        date.textContent = new Date(item.created_at).toLocaleString();

        row.append(experiment, details, date);
        table.appendChild(row);
    });
}

const activityForm = document.getElementById("activityForm");

if (activityForm) {
    activityForm.addEventListener("submit", saveActivity);
    loadActivityExperiments();
    loadActivityHistory();
}


// LABTRACK DASHBOARD ANALYTICS

let statusChartInstance = null;
let resourceChartInstance = null;

async function loadDashboardCharts() {

    if (!document.getElementById("statusChart")) return;

    const [experimentResult, equipmentResult, materialResult] =
        await Promise.all([
            supabaseClient.from("experiments").select("status"),
            supabaseClient.from("equipment").select("id"),
            supabaseClient.from("materials").select("id")
        ]);

    if (experimentResult.error ||
        equipmentResult.error ||
        materialResult.error) {
        console.error("Dashboard analytics could not load.");
        return;
    }

    const experiments = experimentResult.data || [];
    const equipment = equipmentResult.data || [];
    const materials = materialResult.data || [];

    const counts = {
        ongoing: experiments.filter(e => e.status === "ongoing").length,
        completed: experiments.filter(e => e.status === "completed").length,
        pending: experiments.filter(e => e.status === "pending").length,
        cancelled: experiments.filter(e => e.status === "cancelled").length
    };

    const statusCanvas = document.getElementById("statusChart");

    if (statusChartInstance) statusChartInstance.destroy();

    statusChartInstance = new Chart(statusCanvas, {
        type: "doughnut",
        data: {
            labels: ["Ongoing", "Completed", "Pending", "Cancelled"],
            datasets: [{
                data: [
                    counts.ongoing,
                    counts.completed,
                    counts.pending,
                    counts.cancelled
                ],
                backgroundColor: [
                    "#2563eb",
                    "#16a34a",
                    "#f59e0b",
                    "#ef4444"
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });

    const resourceCanvas = document.getElementById("resourceChart");

    if (resourceChartInstance) resourceChartInstance.destroy();

    resourceChartInstance = new Chart(resourceCanvas, {
        type: "bar",
        data: {
            labels: ["Experiments", "Equipment", "Materials"],
            datasets: [{
                label: "Total Records",
                data: [
                    experiments.length,
                    equipment.length,
                    materials.length
                ],
                backgroundColor: [
                    "#2563eb",
                    "#16a34a",
                    "#f59e0b"
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

if (document.getElementById("statusChart")) {
    loadDashboardCharts();
}



async function logout() {
    const confirmed = confirm("Are you sure you want to log out?");

    if (!confirmed) return;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout failed: " + error.message);
        return;
    }

    window.location.href = "login.html";
}
