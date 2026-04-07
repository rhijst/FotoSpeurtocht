const API_URL = "http://localhost:3002";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWQ0ZjAxYTE1MGQ0MzcwYWYzYzAxZTkiLCJyb2xlIjoicGFydGljaXBhbnQiLCJpYXQiOjE3NzU1NjI4OTUsImV4cCI6MTc3NTU2NjQ5NX0.qpPfwSz8QMKlKM3qc-uPlwRoNt3H8OXJ3p8Tm6UXWZE";
const form = document.getElementById("targetForm");
const list = document.getElementById("targetList");

// Load targets
async function loadTargets() {
  const res = await fetch(`${API_URL}/targets`);
  const data = await res.json();

  list.innerHTML = "";

  data.forEach(target => {
    const li = document.createElement("li");

    li.innerHTML = `
    <strong>${target.title}</strong><br/>
    ${target.description || ""}
    <br/>
    <img src="${target.imageUrl}" width="100"/>
    <br/>
    <button onclick="deleteTarget('${target.id}')">Delete</button>
  `;

    list.appendChild(li);
  });
}

// Create target
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("locationName", document.getElementById("locationName").value);
  formData.append("lat", document.getElementById("lat").value);
  formData.append("lng", document.getElementById("lng").value);
  formData.append("radius", document.getElementById("radius").value);
  formData.append("deadline", document.getElementById("deadline").value);
  formData.append("image", document.getElementById("image").files[0]);

  await fetch(`${API_URL}/targets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`
    },
    body: formData
  });

  loadTargets();
});

// Delete target
async function deleteTarget(id) {
  await fetch(`${API_URL}/targets/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });

  loadTargets();
}

loadTargets();